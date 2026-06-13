<script lang="ts">
  import { onDestroy, createEventDispatcher } from 'svelte';
  import { isTyping } from '../lib/store';
  import { settings } from '../lib/store';
  import { playSFX, playTypingSound, playBGM } from '../lib/audio';
  import type { DialogueLine, AudioTrigger, MoodType } from '../types/game';
  import { getEffectiveDialogue } from '../lib/engine';
  import { signalCorruption, glitchSubtitleText, getChannelLevel } from '../lib/signalCorruption';
  import { get } from 'svelte/store';
  import { currentPlaythrough } from '../lib/memory';
  import { podcastSettings } from '../lib/podcastStore';

  export let dialogue: DialogueLine | null;
  export let onComplete: () => void;

  const dispatch = createEventDispatcher<{
    charTyped: { index: number; char: string };
    lineStart: { text: string };
    lineComplete: { text: string };
  }>();

  let displayedText = '';
  let isComplete = false;
  let typingTimeouts: number[] = [];
  let sfxTimeouts: number[] = [];
  let autoAdvanceTimeout: number | null = null;
  let firedSfx = new Set<number>();
  let isMemoryVariant = false;
  let displayedChars: string[] = [];
  let isBackendOnly = false;

  $: textSpeed = $settings.textSpeed;
  $: corruptionLevel = $signalCorruption.level;
  $: channelLevel = getChannelLevel();
  $: pSettings = $podcastSettings;
  $: subtitleSizeClass = $podcastSettings.subtitleSize;

  function getCharDelay(mood?: MoodType, baseSpeed?: number): number {
    const base = baseSpeed !== undefined
      ? Math.max(15, 100 - baseSpeed)
      : Math.max(15, 100 - textSpeed);
    const moodMultipliers: Record<MoodType, number> = {
      normal: 1.0, tense: 0.7, scared: 1.4, calm: 1.3, whisper: 1.6, urgent: 0.5,
      mystery: 1.2, terrified: 1.8
    };
    return (base * moodMultipliers[mood || 'normal']) / pSettings.narrationSpeed;
  }

  function getTypingSoundInterval(mood?: MoodType): number {
    const intervals: Record<MoodType, number> = {
      normal: 3, tense: 2, scared: 5, calm: 4, whisper: 8, urgent: 1, mystery: 6, terrified: 7
    };
    return intervals[mood || 'normal'];
  }

  function clearAllTimeouts(): void {
    typingTimeouts.forEach(t => clearTimeout(t));
    typingTimeouts = [];
    sfxTimeouts.forEach(t => clearTimeout(t));
    sfxTimeouts = [];
    if (autoAdvanceTimeout !== null) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    firedSfx.clear();
  }

  function startTyping() {
    clearAllTimeouts();
    if (!dialogue) return;

    const effective = getEffectiveDialogue(dialogue);
    isMemoryVariant = effective.isMemoryVariant;
    isBackendOnly = dialogue.isBackendOnly || false;

    displayedText = '';
    displayedChars = [];
    isComplete = false;
    isTyping.set(true);

    const fullText = effective.text;
    const mood = dialogue.mood;
    const charDelay = getCharDelay(mood, dialogue.baseTypingSpeed);
    const soundInterval = getTypingSoundInterval(mood);
    const sfxTriggers = dialogue.sfx || [];
    const punctuationPause = charDelay * 2.5;

    if (dialogue.bgm) {
      playBGM(dialogue.bgm);
    }

    dispatch('lineStart', { text: fullText });

    sfxTriggers.forEach((trigger: AudioTrigger, triggerIdx: number) => {
      const sfxDelay = trigger.delay !== undefined
        ? trigger.delay
        : 0;
      const timeout = window.setTimeout(() => {
        playSFX(trigger.sfx, trigger.volume);
        firedSfx.add(triggerIdx);
      }, Math.max(0, sfxDelay));
      sfxTimeouts.push(timeout);
    });

    let cumulativeDelay = 0;
    for (let i = 0; i < fullText.length; i++) {
      const char = fullText[i];
      const timeout = window.setTimeout(() => {
        displayedChars.push(char);
        const corruption = get(signalCorruption).level;
        displayedText = corruption > 25
          ? glitchSubtitleText(displayedChars.join(''), corruption)
          : displayedChars.join('');

        if ((i + 1) % soundInterval === 0) {
          playTypingSound(mood);
        }

        dispatch('charTyped', { index: i, char });
      }, cumulativeDelay);
      typingTimeouts.push(timeout);

      cumulativeDelay += charDelay;

      if (char === '。' || char === '！' || char === '？' || char === '…' || char === '—') {
        cumulativeDelay += punctuationPause;
      } else if (char === '，' || char === '、' || char === '；' || char === '：') {
        cumulativeDelay += charDelay * 1.2;
      }
    }

    const completeTimeout = window.setTimeout(() => {
      completeTyping();
    }, cumulativeDelay + 50);
    typingTimeouts.push(completeTimeout);
  }

  function completeTyping() {
    clearAllTimeouts();
    if (dialogue) {
      const effective = getEffectiveDialogue(dialogue);
      displayedChars = effective.text.split('');
      const corruption = get(signalCorruption).level;
      displayedText = corruption > 25
        ? glitchSubtitleText(effective.text, corruption)
        : effective.text;
    }
    isComplete = true;
    isTyping.set(false);
    dispatch('lineComplete', { text: dialogue?.text || '' });

    if (dialogue?.autoAdvance) {
      const effective = getEffectiveDialogue(dialogue);
      const delay = dialogue.autoAdvanceDelay || Math.max(1500, effective.text.length * 60);
      autoAdvanceTimeout = window.setTimeout(() => {
        onComplete();
      }, delay / pSettings.narrationSpeed);
    }
  }

  function handleClick() {
    if (autoAdvanceTimeout !== null) {
      clearTimeout(autoAdvanceTimeout);
      autoAdvanceTimeout = null;
    }
    if (!isComplete) {
      completeTyping();
    } else {
      onComplete();
    }
  }

  $: if (dialogue) {
    startTyping();
  }

  onDestroy(() => {
    clearAllTimeouts();
    isTyping.set(false);
  });
</script>

{#if pSettings.showSubtitles}
  <div
    class="subtitle-container"
    on:click={handleClick}
    role="button"
    tabindex="0"
    on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    class:size-small={subtitleSizeClass === 'small'}
    class:size-large={subtitleSizeClass === 'large'}
    class:immersive={pSettings.immersiveMode}
  >
    {#if dialogue}
      {#if dialogue.speaker}
        <div
          class="speaker-badge"
          class:tense={dialogue.mood === 'tense' || dialogue.mood === 'urgent'}
          class:scared={dialogue.mood === 'scared'}
          class:whisper={dialogue.mood === 'whisper'}
          class:memory={isMemoryVariant}
          class:backend={isBackendOnly}
        >
          {dialogue.speaker}
          {#if isMemoryVariant}
            <span class="variant-tag memory-tag">回忆</span>
          {/if}
          {#if isBackendOnly}
            <span class="variant-tag backend-tag">后台</span>
          {/if}
        </div>
      {/if}
      <div
        class="subtitle-text"
        class:tense-text={dialogue.mood === 'tense'}
        class:scared-text={dialogue.mood === 'scared'}
        class:whisper-text={dialogue.mood === 'whisper'}
        class:urgent-text={dialogue.mood === 'urgent'}
        class:memory-text={isMemoryVariant}
        class:glitch-text={corruptionLevel >= 40}
      >
        {displayedText}
        {#if !isComplete}
          <span class="cursor">|</span>
        {/if}
      </div>
      {#if isComplete && !dialogue.autoAdvance}
        <div class="advance-hint">
          <span class="hint-icon">▾</span>
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .subtitle-container {
    width: 100%;
    max-width: 520px;
    margin: 0 auto;
    padding: 20px 24px;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  .subtitle-container.immersive {
    padding: 16px 20px;
  }

  .speaker-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 14px;
    background: linear-gradient(135deg, rgba(50, 100, 180, 0.7), rgba(30, 70, 140, 0.7));
    color: #d0e8ff;
    font-size: 0.85rem;
    font-weight: 600;
    border-radius: 6px 6px 0 0;
    letter-spacing: 0.06em;
    border: 1px solid rgba(100, 180, 255, 0.35);
    border-bottom: none;
    margin-bottom: 0;
  }

  .speaker-badge.tense {
    background: linear-gradient(135deg, rgba(160, 50, 50, 0.7), rgba(120, 30, 30, 0.7));
    border-color: rgba(255, 100, 100, 0.45);
    color: #ffd0d0;
  }

  .speaker-badge.scared {
    background: linear-gradient(135deg, rgba(90, 50, 130, 0.7), rgba(60, 30, 100, 0.7));
    border-color: rgba(180, 120, 255, 0.4);
    color: #d8c0ff;
  }

  .speaker-badge.whisper {
    background: linear-gradient(135deg, rgba(70, 70, 70, 0.7), rgba(40, 40, 40, 0.7));
    border-color: rgba(150, 150, 150, 0.3);
    color: #b0b0b0;
  }

  .speaker-badge.memory {
    background: linear-gradient(135deg, rgba(180, 130, 60, 0.7), rgba(130, 90, 30, 0.7));
    border-color: rgba(255, 200, 100, 0.5);
    color: #ffe8c0;
  }

  .speaker-badge.backend {
    background: linear-gradient(135deg, rgba(0, 160, 130, 0.7), rgba(0, 110, 90, 0.7));
    border-color: rgba(0, 255, 200, 0.5);
    color: #c0fff0;
    font-family: 'Courier New', monospace;
  }

  .variant-tag {
    padding: 1px 7px;
    border-radius: 8px;
    font-size: 0.65rem;
    font-weight: 500;
  }

  .memory-tag {
    background: rgba(255, 200, 100, 0.2);
    border: 1px solid rgba(255, 200, 100, 0.4);
    color: #ffd890;
  }

  .backend-tag {
    background: rgba(0, 255, 200, 0.15);
    border: 1px solid rgba(0, 255, 200, 0.4);
    color: #00ffcc;
    font-family: 'Courier New', monospace;
  }

  .subtitle-text {
    background: rgba(8, 18, 35, 0.92);
    border: 1px solid rgba(100, 180, 255, 0.25);
    border-radius: 0 10px 10px 10px;
    padding: 18px 22px;
    color: #d0e4f8;
    font-size: 1.05rem;
    line-height: 1.9;
    min-height: 72px;
    white-space: pre-wrap;
    word-break: break-word;
    backdrop-filter: blur(12px);
    transition: color 0.3s;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .subtitle-container.size-small .subtitle-text {
    font-size: 0.9rem;
    line-height: 1.7;
    padding: 14px 18px;
  }

  .subtitle-container.size-large .subtitle-text {
    font-size: 1.2rem;
    line-height: 2;
    padding: 20px 24px;
  }

  .tense-text { color: #ffc0c0; }
  .scared-text { color: #c8b0e8; font-style: italic; }
  .whisper-text { color: #a0a0a0; font-size: 0.92em; }
  .urgent-text { color: #ffe0a0; font-weight: 500; }

  .memory-text {
    background: rgba(35, 25, 12, 0.92);
    border-color: rgba(255, 200, 100, 0.4);
    color: #ffe8c0;
    box-shadow: 0 0 18px rgba(255, 180, 80, 0.12);
  }

  .glitch-text {
    animation: textGlitch 0.4s infinite;
    text-shadow: 1px 0 rgba(255, 0, 100, 0.4), -1px 0 rgba(0, 255, 255, 0.4);
  }

  .cursor {
    color: #64b4ff;
    animation: pulse 0.8s infinite;
    margin-left: 2px;
  }

  .advance-hint {
    text-align: center;
    margin-top: 10px;
    color: rgba(100, 180, 255, 0.5);
    animation: pulse 1.2s infinite;
  }

  .hint-icon {
    font-size: 0.7rem;
    letter-spacing: 4px;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes textGlitch {
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-1px, 1px); }
    40% { transform: translate(1px, -1px); }
    60% { transform: translate(-1px, -1px); }
    80% { transform: translate(1px, 1px); }
  }

  @media (max-width: 480px) {
    .subtitle-container {
      padding: 16px 16px;
    }

    .subtitle-text {
      padding: 14px 16px;
      font-size: 0.95rem;
      line-height: 1.8;
    }

    .speaker-badge {
      font-size: 0.8rem;
      padding: 4px 10px;
    }
  }
</style>

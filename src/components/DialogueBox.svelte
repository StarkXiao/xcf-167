<script lang="ts">
  import { onDestroy, createEventDispatcher } from 'svelte';
  import { isTyping } from '../lib/store';
  import { settings } from '../lib/store';
  import { playSFX, playTypingSound, playBGM } from '../lib/audio';
  import type { DialogueLine, AudioTrigger, MoodType } from '../types/game';
  import { getEffectiveDialogue } from '../lib/engine';

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

  $: textSpeed = $settings.textSpeed;

  function getCharDelay(mood?: MoodType, baseSpeed?: number): number {
    const base = baseSpeed !== undefined
      ? Math.max(15, 100 - baseSpeed)
      : Math.max(15, 100 - textSpeed);
    
    const moodMultipliers: Record<MoodType, number> = {
      normal: 1.0,
      tense: 0.7,
      scared: 1.4,
      calm: 1.3,
      whisper: 1.6,
      urgent: 0.5
    };
    
    return base * (moodMultipliers[mood || 'normal']);
  }

  function getTypingSoundInterval(mood?: MoodType): number {
    const intervals: Record<MoodType, number> = {
      normal: 3,
      tense: 2,
      scared: 5,
      calm: 4,
      whisper: 8,
      urgent: 1
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
    
    displayedText = '';
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
        : (trigger.atCharIndex !== undefined
          ? calculateCharTime(fullText, trigger.atCharIndex, charDelay, punctuationPause)
          : 0);
      
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
        displayedText += char;
        
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
  
  function calculateCharTime(text: string, targetIndex: number, charDelay: number, punctuationPause: number): number {
    let time = 0;
    for (let i = 0; i < Math.min(targetIndex, text.length); i++) {
      const char = text[i];
      time += charDelay;
      if (char === '。' || char === '！' || char === '？' || char === '…' || char === '—') {
        time += punctuationPause;
      } else if (char === '，' || char === '、' || char === '；' || char === '：') {
        time += charDelay * 1.2;
      }
    }
    return time;
  }

  function completeTyping() {
    clearAllTimeouts();
    if (dialogue) {
      const effective = getEffectiveDialogue(dialogue);
      displayedText = effective.text;
    }
    isComplete = true;
    isTyping.set(false);
    
    dispatch('lineComplete', { text: dialogue?.text || '' });
    
    if (dialogue?.autoAdvance) {
      const effective = getEffectiveDialogue(dialogue);
      const delay = dialogue.autoAdvanceDelay || Math.max(1500, effective.text.length * 60);
      autoAdvanceTimeout = window.setTimeout(() => {
        onComplete();
      }, delay);
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

<div class="dialogue-box" on:click={handleClick} role="button" tabindex="0" on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}>
  {#if dialogue}
    {#if dialogue.speaker}
      <div class="speaker-name" class:tense={dialogue.mood === 'tense' || dialogue.mood === 'urgent'} class:scared={dialogue.mood === 'scared'} class:whisper={dialogue.mood === 'whisper'} class:memory={isMemoryVariant}>
        {dialogue.speaker}
        {#if isMemoryVariant}
          <span class="memory-tag">回忆</span>
        {/if}
      </div>
    {/if}
    <div 
      class="dialogue-text"
      class:tense-text={dialogue.mood === 'tense'}
      class:scared-text={dialogue.mood === 'scared'}
      class:whisper-text={dialogue.mood === 'whisper'}
      class:urgent-text={dialogue.mood === 'urgent'}
      class:memory-text={isMemoryVariant}
    >
      {displayedText}
      {#if !isComplete}
        <span class="cursor">|</span>
      {/if}
    </div>
    {#if isComplete && !dialogue.autoAdvance}
      <div class="advance-hint">
        <span class="hint-arrow">▼</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .dialogue-box {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 20px calc(30px + env(safe-area-inset-bottom));
    background: linear-gradient(transparent, rgba(0, 10, 25, 0.95) 30%);
    min-height: 35%;
    z-index: 30;
    cursor: pointer;
    outline: none;
  }

  .speaker-name {
    display: inline-block;
    padding: 4px 12px;
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.8), rgba(40, 80, 160, 0.8));
    color: #e0f0ff;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 4px 4px 0 0;
    margin-bottom: 0;
    letter-spacing: 0.05em;
    border: 1px solid rgba(100, 180, 255, 0.4);
    border-bottom: none;
    transition: all 0.3s;
  }

  .speaker-name.tense {
    background: linear-gradient(135deg, rgba(180, 60, 60, 0.8), rgba(140, 40, 40, 0.8));
    border-color: rgba(255, 100, 100, 0.5);
    color: #ffd0d0;
  }

  .speaker-name.scared {
    background: linear-gradient(135deg, rgba(100, 60, 140, 0.7), rgba(70, 40, 110, 0.7));
    border-color: rgba(180, 120, 255, 0.4);
    color: #d8c0ff;
  }

  .speaker-name.whisper {
    background: linear-gradient(135deg, rgba(80, 80, 80, 0.7), rgba(50, 50, 50, 0.7));
    border-color: rgba(150, 150, 150, 0.3);
    color: #c0c0c0;
  }

  .speaker-name.memory {
    background: linear-gradient(135deg, rgba(200, 150, 80, 0.7), rgba(150, 100, 40, 0.7));
    border-color: rgba(255, 200, 100, 0.5);
    color: #ffe8c0;
  }

  .memory-tag {
    margin-left: 8px;
    padding: 1px 8px;
    background: rgba(255, 200, 100, 0.2);
    border: 1px solid rgba(255, 200, 100, 0.4);
    border-radius: 10px;
    font-size: 0.7rem;
    color: #ffd890;
  }

  .dialogue-text {
    background: rgba(10, 25, 45, 0.9);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 0 8px 8px 8px;
    padding: 16px 20px;
    color: #d0e4f8;
    font-size: 1rem;
    line-height: 1.8;
    min-height: 80px;
    white-space: pre-wrap;
    word-break: break-word;
    backdrop-filter: blur(10px);
    transition: color 0.3s;
  }

  .tense-text {
    color: #ffc0c0;
  }

  .scared-text {
    color: #c8b0e8;
    font-style: italic;
  }

  .whisper-text {
    color: #a0a0a0;
    font-size: 0.9rem;
  }

  .urgent-text {
    color: #ffe0a0;
    font-weight: 500;
  }

  .memory-text {
    background: rgba(40, 30, 15, 0.9);
    border: 1px solid rgba(255, 200, 100, 0.4);
    color: #ffe8c0;
    box-shadow: 0 0 20px rgba(255, 180, 80, 0.15);
  }

  .cursor {
    color: #64b4ff;
    animation: pulse 0.8s infinite;
    margin-left: 2px;
  }

  .advance-hint {
    position: absolute;
    right: 30px;
    bottom: calc(20px + env(safe-area-inset-bottom));
    color: #64b4ff;
    animation: pulse 1.2s infinite;
  }

  .hint-arrow {
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    .dialogue-box {
      padding: 16px 12px calc(24px + env(safe-area-inset-bottom));
      min-height: 40%;
    }

    .speaker-name {
      font-size: 0.8rem;
      padding: 3px 10px;
    }

    .dialogue-text {
      padding: 12px 14px;
      font-size: 0.9rem;
      line-height: 1.7;
    }
  }
</style>

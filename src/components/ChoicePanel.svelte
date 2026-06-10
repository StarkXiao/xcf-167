<script lang="ts">
  import { playSFX } from '../lib/audio';
  import type { Choice, CrewMemberId } from '../types/game';
  import { getChoiceDisplayText } from '../lib/engine';
  import { checkMemoryCondition } from '../lib/memory';
  import { signalCorruption, shouldHideChoice, glitchChoiceText, shouldScrambleChoices, getCurrentCorruption, getChannelLevel } from '../lib/signalCorruption';
  import { getCrewMember } from '../lib/trust';
  import { get } from 'svelte/store';

  export let choices: Choice[];
  export let onSelect: (choiceId: string) => void;

  $: corruptionLevel = $signalCorruption.level;
  $: channelLevel = getChannelLevel();
  $: controlDegradation = channelLevel.control;
  $: processedChoices = processChoices(choices);

  function processChoices(inputChoices: Choice[]): { choice: Choice; displayText: string; visible: boolean; isMemory: boolean; glitchSeed: number; trustPreview?: { positive: number; negative: number; hint?: string } }[] {
    let result = inputChoices.map((choice, index) => {
      let trustPreview: { positive: number; negative: number; hint?: string } | undefined;
      if (choice.trustEffect?.changes?.length) {
        let positive = 0;
        let negative = 0;
        choice.trustEffect.changes.forEach(c => {
          if (c.value > 0) positive += c.value;
          else negative += Math.abs(c.value);
        });
        trustPreview = {
          positive,
          negative,
          hint: choice.trustEffect.hintText
        };
      }
      return {
        choice,
        displayText: getChoiceDisplayText(choice),
        visible: !shouldHideChoice(getCurrentCorruption(), index),
        isMemory: !!(choice.memoryText && checkMemoryCondition(choice.memoryCondition)),
        glitchSeed: Math.floor(Math.random() * 100000),
        trustPreview
      };
    });
    
    if (shouldScrambleChoices(getCurrentCorruption())) {
      result = [...result].sort(() => Math.random() - 0.5);
    }
    
    return result;
  }

  function handleSelect(item: { choice: Choice; visible: boolean }) {
    if (!item.visible) {
      playSFX('warning');
      return;
    }
    playSFX('select');
    onSelect(item.choice.id);
  }
</script>

<div 
  class="choices-container" 
  style="animation: fadeInUp 0.4s ease-out;"
  class:corrupted={controlDegradation >= 30}
  class:heavily-corrupted={controlDegradation >= 60}
  class:control-offline={controlDegradation >= 85}
>
  {#if controlDegradation >= 25}
    <div class="choices-noise"></div>
  {/if}
  <div class="choices-title" class:title-glitch={corruptionLevel >= 45}>
    {corruptionLevel >= 55 ? glitchChoiceText('— 做出选择 —', corruptionLevel) : '— 做出选择 —'}
  </div>
  <div class="choices-list">
    {#each processedChoices as item, i}
      {#if item.visible}
        <button 
          class="choice-btn"
          class:memory-choice={item.isMemory}
          class:btn-glitched={controlDegradation >= 40 && Math.random() < (controlDegradation - 35) / 100}
          on:click={() => handleSelect(item)}
          style="animation-delay: {i * 0.1}s"
        >
          <span class="choice-index" class:memory-index={item.isMemory}>{i + 1}</span>
          <span class="choice-text">
            {controlDegradation >= 30 ? glitchChoiceText(item.displayText, controlDegradation * 0.8) : item.displayText}
            {#if item.isMemory}
              <span class="memory-choice-tag">
                {corruptionLevel >= 50 ? glitchChoiceText('新选项', corruptionLevel * 0.5) : '新选项'}
              </span>
            {/if}
            {#if item.trustPreview && controlDegradation < 40}
              <span class="trust-preview">
                {#if item.trustPreview.positive > 0}
                  <span class="trust-preview-positive">+{item.trustPreview.positive} 信任</span>
                {/if}
                {#if item.trustPreview.negative > 0}
                  <span class="trust-preview-negative">-{item.trustPreview.negative} 信任</span>
                {/if}
              </span>
            {/if}
          </span>
        </button>
      {:else}
        <button 
          class="choice-btn choice-hidden"
          disabled
          style="animation-delay: {i * 0.1}s"
        >
          <span class="choice-index">?</span>
          <span class="choice-text">
            {controlDegradation >= 60 ? glitchChoiceText('████████████████████', controlDegradation) : '— 信号丢失 —'}
          </span>
        </button>
      {/if}
    {/each}
  </div>
  {#if controlDegradation >= 50}
    <div class="choice-warning">
      ⚠ 操控系统受损：部分选项可能无法正常操作
    </div>
  {/if}
  {#if controlDegradation >= 85}
    <div class="choice-offline-warning">
      ✕ 操控面板严重故障 — 系统尝试降级运行
    </div>
  {/if}
</div>

<style>
  .choices-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 16px calc(30px + env(safe-area-inset-bottom));
    background: linear-gradient(transparent, rgba(0, 10, 25, 0.98) 40%);
    z-index: 35;
  }

  .choices-title {
    text-align: center;
    color: #64b4ff;
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    margin-bottom: 16px;
    text-shadow: 0 0 10px rgba(100, 180, 255, 0.5);
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 600px;
    margin: 0 auto;
  }

  .choice-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: rgba(20, 45, 80, 0.85);
    border: 1px solid rgba(100, 180, 255, 0.35);
    border-radius: 8px;
    color: #d0e4f8;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    backdrop-filter: blur(10px);
    animation: fadeInUp 0.4s ease-out both;
  }

  .choice-btn:hover, .choice-btn:active {
    background: rgba(40, 90, 160, 0.9);
    border-color: rgba(100, 180, 255, 0.7);
    transform: translateX(4px);
    box-shadow: 0 0 20px rgba(100, 180, 255, 0.2);
  }

  .choice-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #3c78c8, #2850a0);
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
    color: #fff;
    flex-shrink: 0;
  }

  .choice-text {
    flex: 1;
    line-height: 1.5;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  .choice-btn.memory-choice {
    background: rgba(60, 45, 20, 0.9);
    border-color: rgba(255, 200, 100, 0.5);
    color: #ffe8c0;
  }

  .choice-btn.memory-choice:hover,
  .choice-btn.memory-choice:active {
    background: rgba(100, 75, 30, 0.95);
    border-color: rgba(255, 200, 100, 0.8);
    box-shadow: 0 0 20px rgba(255, 180, 80, 0.25);
  }

  .choice-index.memory-index {
    background: linear-gradient(135deg, #c89650, #966428);
  }

  .memory-choice-tag {
    display: inline-block;
    padding: 2px 8px;
    background: rgba(255, 200, 100, 0.2);
    border: 1px solid rgba(255, 200, 100, 0.4);
    border-radius: 10px;
    font-size: 0.7rem;
    color: #ffd890;
    flex-shrink: 0;
  }

  .trust-preview {
    display: inline-flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .trust-preview-positive,
  .trust-preview-negative {
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-family: 'Courier New', monospace;
    font-weight: 600;
  }

  .trust-preview-positive {
    background: rgba(100, 255, 150, 0.15);
    border: 1px solid rgba(100, 255, 150, 0.35);
    color: #60d090;
  }

  .trust-preview-negative {
    background: rgba(255, 100, 100, 0.15);
    border: 1px solid rgba(255, 100, 100, 0.35);
    color: #ff8080;
  }

  .choices-container.corrupted {
    filter: contrast(1.08) saturate(0.85);
  }

  .choices-container.heavily-corrupted {
    filter: contrast(1.2) saturate(0.6) hue-rotate(-8deg);
    animation: choicesShake 0.4s infinite;
  }

  .choices-container.control-offline {
    filter: contrast(1.35) saturate(0.4) brightness(0.7) hue-rotate(-15deg);
    animation: choicesShake 0.15s infinite;
  }

  .choices-noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
    animation: noisePulse 0.3s infinite;
  }

  .choices-title.title-glitch {
    animation: titleGlitch 0.5s infinite;
    text-shadow: 
      2px 0 rgba(255, 0, 80, 0.6),
      -2px 0 rgba(0, 255, 200, 0.6);
  }

  .choice-btn.btn-glitched {
    animation: btnGlitch 0.2s infinite;
    text-shadow: 
      1px 0 rgba(255, 0, 100, 0.5),
      -1px 0 rgba(0, 255, 255, 0.5);
  }

  .choice-btn.choice-hidden {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(30, 30, 40, 0.85);
    border-color: rgba(100, 100, 100, 0.3);
    color: rgba(150, 150, 150, 0.7);
  }

  .choice-btn.choice-hidden:hover,
  .choice-btn.choice-hidden:active {
    transform: none;
    background: rgba(30, 30, 40, 0.85);
    border-color: rgba(100, 100, 100, 0.3);
    box-shadow: none;
  }

  .choice-warning {
    text-align: center;
    margin-top: 12px;
    font-size: 0.75rem;
    color: rgba(255, 150, 100, 0.9);
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
    animation: warningBlink 1.2s infinite;
  }

  @keyframes choicesShake {
    0%, 100% { transform: translate(0, 0); }
    25% { transform: translate(-1px, 0.5px); }
    50% { transform: translate(1px, -0.5px); }
    75% { transform: translate(-0.5px, -1px); }
  }

  @keyframes noisePulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }

  @keyframes titleGlitch {
    0%, 100% { transform: translate(0); }
    20% { transform: translate(-2px, 1px); }
    40% { transform: translate(2px, -1px); }
    60% { transform: translate(-1px, -1px); }
    80% { transform: translate(1px, 1px); }
  }

  @keyframes btnGlitch {
    0%, 100% { transform: translate(0); filter: hue-rotate(0deg); }
    33% { transform: translate(-1px, 1px); filter: hue-rotate(10deg); }
    66% { transform: translate(1px, -1px); filter: hue-rotate(-10deg); }
  }

  @keyframes warningBlink {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 0.5; }
  }

  .choice-offline-warning {
    text-align: center;
    margin-top: 8px;
    font-size: 0.7rem;
    color: rgba(255, 80, 80, 0.95);
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
    animation: warningBlink 0.5s infinite;
  }

  @media (max-width: 480px) {
    .choices-container {
      padding: 16px 12px calc(24px + env(safe-area-inset-bottom));
    }

    .choice-btn {
      padding: 12px 14px;
      font-size: 0.85rem;
    }

    .choice-index {
      width: 22px;
      height: 22px;
      font-size: 0.7rem;
    }
  }
</style>

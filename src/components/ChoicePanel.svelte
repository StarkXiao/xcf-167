<script lang="ts">
  import { playSFX } from '../lib/audio';
  import type { Choice } from '../types/game';
  import { getChoiceDisplayText } from '../lib/engine';
  import { checkMemoryCondition } from '../lib/memory';

  export let choices: Choice[];
  export let onSelect: (choiceId: string) => void;

  function handleSelect(choice: Choice) {
    playSFX('select');
    onSelect(choice.id);
  }

  function isMemoryChoice(choice: Choice): boolean {
    return !!(choice.memoryText && checkMemoryCondition(choice.memoryCondition));
  }
</script>

<div class="choices-container" style="animation: fadeInUp 0.4s ease-out;">
  <div class="choices-title">— 做出选择 —</div>
  <div class="choices-list">
    {#each choices as choice, i}
      <button 
        class="choice-btn"
        class:memory-choice={isMemoryChoice(choice)}
        on:click={() => handleSelect(choice)}
        style="animation-delay: {i * 0.1}s"
      >
        <span class="choice-index" class:memory-index={isMemoryChoice(choice)}>{i + 1}</span>
        <span class="choice-text">
          {getChoiceDisplayText(choice)}
          {#if isMemoryChoice(choice)}
            <span class="memory-choice-tag">新选项</span>
          {/if}
        </span>
      </button>
    {/each}
  </div>
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

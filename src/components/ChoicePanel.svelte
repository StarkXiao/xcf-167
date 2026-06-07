<script lang="ts">
  import { playSFX } from '../lib/audio';
  import type { Choice } from '../types/game';

  export let choices: Choice[];
  export let onSelect: (choiceId: string) => void;

  function handleSelect(choice: Choice) {
    playSFX('select');
    onSelect(choice.id);
  }
</script>

<div class="choices-container" style="animation: fadeInUp 0.4s ease-out;">
  <div class="choices-title">— 做出选择 —</div>
  <div class="choices-list">
    {#each choices as choice, i}
      <button 
        class="choice-btn"
        on:click={() => handleSelect(choice)}
        style="animation-delay: {i * 0.1}s"
      >
        <span class="choice-index">{i + 1}</span>
        <span class="choice-text">{choice.text}</span>
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

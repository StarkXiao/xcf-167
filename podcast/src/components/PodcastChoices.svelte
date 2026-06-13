<script lang="ts">
  import { playSFX } from '../lib/audio';
  import type { Choice } from '../types/game';
  import { triggerHaptic } from '../lib/podcastStore';

  export let choices: Choice[];
  export let onSelect: (choiceId: string) => void;
</script>

<div class="choices-overlay" style="animation: fadeInUp 0.5s ease-out;">
  <div class="choices-inner">
    <div class="choices-header">
      <div class="choices-header-line"></div>
      <span class="choices-title">— 做出选择 —</span>
      <div class="choices-header-line"></div>
    </div>
    <div class="choices-list">
      {#each choices as choice, i}
        <button
          class="choice-card"
          style="animation-delay: {i * 0.08}s"
          on:click={() => {
            playSFX('select');
            triggerHaptic('medium');
            onSelect(choice.id);
          }}
        >
          <div class="choice-index">{i + 1}</div>
          <div class="choice-body">
            <span class="choice-text">{choice.text}</span>
            {#if choice.trustEffect?.hintText}
              <span class="choice-hint">{choice.trustEffect.hintText}</span>
            {/if}
          </div>
          <div class="choice-arrow">›</div>
        </button>
      {/each}
    </div>
    <p class="choices-tip">🎧 你的选择将影响后续剧情走向</p>
  </div>
</div>

<style>
  .choices-overlay {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(2, 5, 12, 0.85);
    backdrop-filter: blur(12px);
  }

  .choices-inner {
    width: 100%;
    max-width: 480px;
    animation: fadeInUp 0.4s ease-out;
  }

  .choices-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .choices-header-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(100, 180, 255, 0.3), transparent);
  }

  .choices-title {
    color: #64b4ff;
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    font-family: 'Courier New', monospace;
    text-shadow: 0 0 8px rgba(100, 180, 255, 0.4);
    white-space: nowrap;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .choice-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    background: rgba(15, 35, 65, 0.85);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 12px;
    color: #d0e4f8;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.25s ease;
    text-align: left;
    backdrop-filter: blur(8px);
    animation: fadeInUp 0.4s ease-out both;
    -webkit-tap-highlight-color: transparent;
  }

  .choice-card:active {
    background: rgba(40, 80, 140, 0.9);
    border-color: rgba(100, 180, 255, 0.7);
    transform: scale(0.98);
    box-shadow: 0 0 20px rgba(77, 166, 255, 0.25);
  }

  .choice-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, #3c78c8, #2850a0);
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }

  .choice-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .choice-text {
    line-height: 1.5;
  }

  .choice-hint {
    font-size: 0.72rem;
    color: rgba(160, 200, 255, 0.6);
    font-style: italic;
  }

  .choice-arrow {
    font-size: 1.3rem;
    color: rgba(100, 180, 255, 0.4);
    flex-shrink: 0;
    transition: transform 0.2s;
  }

  .choice-card:active .choice-arrow {
    transform: translateX(3px);
    color: rgba(100, 180, 255, 0.8);
  }

  .choices-tip {
    text-align: center;
    margin-top: 20px;
    font-size: 0.75rem;
    color: rgba(100, 160, 220, 0.5);
    letter-spacing: 0.1em;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .choice-card {
      padding: 14px 14px;
      font-size: 0.88rem;
    }

    .choice-index {
      width: 24px;
      height: 24px;
      font-size: 0.75rem;
    }
  }
</style>

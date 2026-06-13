<script lang="ts">
  import type { Ending } from '../types/game';
  import { playSFX } from '../lib/audio';
  import { triggerHaptic } from '../lib/podcastStore';
  import { onMount } from 'svelte';

  export let ending: Ending;
  export let onRestart: () => void;
  export let onBackToMenu: () => void;

  let visible = false;

  onMount(() => {
    setTimeout(() => { visible = true; }, 300);
    triggerHaptic('heavy');
  });
</script>

<div class="ending-overlay" class:visible={visible}>
  <div class="ending-content">
    <div class="ending-badge">
      {#if ending.isGood}
        <span class="ending-type good">✦ 完结</span>
      {:else}
        <span class="ending-type bad">✦ 终焉</span>
      {/if}
    </div>

    <h1 class="ending-title" class:good-ending={ending.isGood}>
      {ending.title}
    </h1>

    <div class="ending-divider">
      <span class="divider-dot" style="background: {ending.isGood ? '#40e0c0' : '#ff5070'};"></span>
      <span class="divider-line"></span>
      <span class="divider-dot" style="background: {ending.isGood ? '#40e0c0' : '#ff5070'};"></span>
    </div>

    <p class="ending-description">{ending.description}</p>

    <div class="ending-actions">
      <button class="ending-btn primary" on:click={onRestart}>
        <span class="btn-icon">↺</span>
        重新收听
      </button>
      <button class="ending-btn" on:click={onBackToMenu}>
        <span class="btn-icon">◀</span>
        返回主页
      </button>
    </div>
  </div>
</div>

<style>
  .ending-overlay {
    position: absolute;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(2, 4, 10, 0.95);
    backdrop-filter: blur(16px);
    opacity: 0;
    transition: opacity 1s ease;
  }

  .ending-overlay.visible {
    opacity: 1;
  }

  .ending-content {
    text-align: center;
    padding: 40px 28px;
    max-width: 420px;
    width: 100%;
  }

  .ending-badge {
    margin-bottom: 20px;
  }

  .ending-type {
    display: inline-block;
    padding: 4px 16px;
    border-radius: 12px;
    font-size: 0.8rem;
    letter-spacing: 0.15em;
    font-family: 'Courier New', monospace;
  }

  .ending-type.good {
    background: rgba(64, 224, 192, 0.12);
    border: 1px solid rgba(64, 224, 192, 0.35);
    color: #40e0c0;
  }

  .ending-type.bad {
    background: rgba(255, 80, 112, 0.12);
    border: 1px solid rgba(255, 80, 112, 0.35);
    color: #ff5070;
  }

  .ending-title {
    font-size: 2.2rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    margin: 0 0 16px 0;
    font-family: 'Georgia', serif;
    animation: fadeIn 1.5s ease-out;
  }

  .ending-title.good-ending {
    background: linear-gradient(135deg, #64b4ff 0%, #40e0c0 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .ending-title:not(.good-ending) {
    background: linear-gradient(135deg, #ff5070 0%, #ff8040 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .ending-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 20px 0 24px;
  }

  .divider-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
  }

  .divider-line {
    width: 40px;
    height: 1px;
    background: rgba(255, 255, 255, 0.15);
  }

  .ending-description {
    font-size: 0.92rem;
    line-height: 1.9;
    color: #b0c0d4;
    margin: 0 0 36px;
    animation: fadeIn 2s ease-out;
  }

  .ending-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ending-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 28px;
    border: 1px solid rgba(100, 180, 255, 0.25);
    background: rgba(15, 30, 55, 0.6);
    color: #a0d0f0;
    font-size: 0.9rem;
    border-radius: 12px;
    backdrop-filter: blur(8px);
    transition: all 0.25s;
    letter-spacing: 0.05em;
  }

  .ending-btn:active {
    background: rgba(40, 70, 120, 0.8);
    border-color: rgba(100, 180, 255, 0.5);
    transform: scale(0.97);
  }

  .ending-btn.primary {
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.25), rgba(64, 204, 170, 0.15));
    border-color: rgba(77, 166, 255, 0.4);
    color: #e0f0ff;
    font-weight: 600;
  }

  .ending-btn.primary:active {
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.45), rgba(64, 204, 170, 0.35));
  }

  .btn-icon {
    font-size: 1rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (max-width: 480px) {
    .ending-title {
      font-size: 1.8rem;
    }

    .ending-description {
      font-size: 0.85rem;
    }

    .ending-btn {
      padding: 12px 22px;
      font-size: 0.85rem;
    }
  }
</style>

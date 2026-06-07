<script lang="ts">
  import { playSFX, initAudio, resumeAudio } from '../lib/audio';
  import type { Ending } from '../types/game';

  export let ending: Ending;
  export let onRestart: () => void;
  export let onBackToMenu: () => void;
  export let onShowEndings: () => void;

  function handleRestart() {
    playSFX('select');
    onRestart();
  }

  function handleMenu() {
    playSFX('click');
    onBackToMenu();
  }

  function handleGallery() {
    playSFX('click');
    onShowEndings();
  }
</script>

<div class="ending-screen" style="animation: fadeIn 1.5s ease-out;">
  <div class="ending-content">
    {#if ending.isGood}
      <div class="ending-type good">— GOOD ENDING —</div>
    {:else}
      <div class="ending-type bad">— BAD ENDING —</div>
    {/if}

    <h1 class="ending-title">{ending.title}</h1>

    <div class="divider"></div>

    <p class="ending-description">{ending.description}</p>

    <div class="ending-actions">
      <button class="action-btn primary" on:click={handleRestart}>
        <span>重新开始</span>
      </button>
      <button class="action-btn" on:click={handleGallery}>
        <span>结局收集</span>
      </button>
      <button class="action-btn" on:click={handleMenu}>
        <span>返回标题</span>
      </button>
    </div>
  </div>

  <div class="scanlines"></div>
</div>

<style>
  .ending-screen {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at center, #0a1525 0%, #000810 100%);
    z-index: 50;
    padding: 24px;
  }

  .ending-content {
    text-align: center;
    max-width: 480px;
    width: 100%;
  }

  .ending-type {
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    margin-bottom: 20px;
  }

  .ending-type.good {
    color: #64d4a0;
    text-shadow: 0 0 20px rgba(100, 212, 160, 0.5);
  }

  .ending-type.bad {
    color: #d46464;
    text-shadow: 0 0 20px rgba(212, 100, 100, 0.5);
  }

  .ending-title {
    font-size: clamp(1.8rem, 6vw, 2.5rem);
    color: #e0f0ff;
    margin-bottom: 24px;
    text-shadow: 0 0 30px rgba(100, 180, 255, 0.4);
    letter-spacing: 0.1em;
  }

  .divider {
    width: 60px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(100, 180, 255, 0.5), transparent);
    margin: 0 auto 28px;
  }

  .ending-description {
    color: #a0b8d0;
    font-size: 0.95rem;
    line-height: 1.9;
    margin-bottom: 40px;
    text-align: center;
  }

  .ending-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 280px;
    margin: 0 auto;
  }

  .action-btn {
    padding: 14px 24px;
    background: rgba(30, 55, 95, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(10px);
  }

  .action-btn:hover, .action-btn:active {
    background: rgba(50, 90, 150, 0.8);
    border-color: rgba(100, 180, 255, 0.6);
    transform: translateY(-1px);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.8), rgba(40, 80, 160, 0.8));
    border-color: #64b4ff;
  }

  .scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 0, 0, 0.1) 2px,
      rgba(0, 0, 0, 0.1) 4px
    );
    pointer-events: none;
    opacity: 0.6;
  }
</style>

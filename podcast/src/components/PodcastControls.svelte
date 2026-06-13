<script lang="ts">
  import { playSFX, toggleMute, isMuted } from '../lib/audio';
  import { triggerHaptic } from '../lib/podcastStore';

  export let isPlaying: boolean;
  export let isPaused: boolean;
  export let progress: number;
  export let moodColor: string;
  export let dialogueIndex: number;
  export let totalDialogues: number;
  export let onTogglePlay: () => void;
  export let onBack: () => void;
  export let onMenu: () => void;

  let muted = false;

  function handleToggleMute() {
    muted = toggleMute();
    triggerHaptic('light');
  }
</script>

<div class="controls-bar">
  <div class="progress-track" style="--mood-color: {moodColor};">
    <div class="progress-fill" style="width: {progress}%;"></div>
    <div class="progress-glow" style="left: {progress}%; background: {moodColor};"></div>
  </div>

  <div class="controls-inner">
    <button class="ctrl-btn" on:click={onMenu} title="菜单">
      ☰
    </button>

    <button class="ctrl-btn skip-btn" on:click={onBack} title="跳过">
      ⏭
    </button>

    <button class="play-btn" on:click={onTogglePlay} style="--mood-color: {moodColor};">
      {#if isPlaying && !isPaused}
        <span class="play-icon">⏸</span>
      {:else}
        <span class="play-icon">▶</span>
      {/if}
    </button>

    <button class="ctrl-btn" on:click={handleToggleMute} title="静音">
      {#if muted}
        🔇
      {:else}
        🔊
      {/if}
    </button>

    <div class="dialogue-counter">
      <span class="counter-current" style="color: {moodColor};">{dialogueIndex}</span>
      <span class="counter-sep">/</span>
      <span class="counter-total">{totalDialogues}</span>
    </div>
  </div>
</div>

<style>
  .controls-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 40;
    background: linear-gradient(transparent, rgba(3, 6, 14, 0.95) 25%);
    padding: 30px 16px calc(20px + env(safe-area-inset-bottom));
  }

  .progress-track {
    position: relative;
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
    margin-bottom: 16px;
    overflow: visible;
  }

  .progress-fill {
    height: 100%;
    background: var(--mood-color, #64b4ff);
    border-radius: 2px;
    transition: width 0.4s ease;
    box-shadow: 0 0 8px var(--mood-color, rgba(100, 180, 255, 0.4));
  }

  .progress-glow {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    box-shadow: 0 0 10px var(--mood-color, rgba(100, 180, 255, 0.6));
    transition: left 0.4s ease;
  }

  .controls-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
  }

  .ctrl-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(20, 35, 60, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.2);
    color: #a0c8f0;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    transition: all 0.2s;
  }

  .ctrl-btn:active {
    background: rgba(40, 70, 120, 0.8);
    border-color: rgba(100, 180, 255, 0.5);
    transform: scale(0.95);
  }

  .skip-btn {
    font-size: 0.9rem;
  }

  .play-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.25), rgba(64, 204, 170, 0.15));
    border: 2px solid rgba(77, 166, 255, 0.45);
    color: #e0f0ff;
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    transition: all 0.25s;
    box-shadow: 0 0 20px rgba(77, 166, 255, 0.15);
  }

  .play-btn:active {
    transform: scale(0.92);
    box-shadow: 0 0 30px rgba(77, 166, 255, 0.35);
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.4), rgba(64, 204, 170, 0.3));
  }

  .play-icon {
    line-height: 1;
  }

  .dialogue-counter {
    position: absolute;
    right: 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: rgba(160, 200, 240, 0.6);
    display: flex;
    align-items: baseline;
    gap: 2px;
  }

  .counter-current {
    font-weight: 600;
    font-size: 0.85rem;
  }

  .counter-sep {
    opacity: 0.4;
  }

  .counter-total {
    opacity: 0.5;
  }

  @media (max-width: 480px) {
    .controls-inner {
      gap: 16px;
    }

    .ctrl-btn {
      width: 36px;
      height: 36px;
      font-size: 0.9rem;
    }

    .play-btn {
      width: 50px;
      height: 50px;
      font-size: 1.1rem;
    }

    .dialogue-counter {
      right: 16px;
      font-size: 0.7rem;
    }
  }
</style>

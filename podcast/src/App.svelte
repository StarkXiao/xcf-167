<script lang="ts">
import { onMount } from 'svelte';
import PodcastPlayer from './components/PodcastPlayer.svelte';
import PodcastMenu from './components/PodcastMenu.svelte';
import { podcastState } from './lib/podcastStore';
import { initAudio } from './lib/audio';
import { get } from 'svelte/store';
import type { SaveSlot } from './types/game';
import { goToNode, triggerDanmakusForDialogue } from './lib/engine';
import { resetGameState, loadState, gameState } from './lib/store';
import { resetAnonymousSenderState, restoreAnonymousSenderState } from './lib/anonymousSender';

let showMenu = false;
let isStarted = false;

function handleNewGame() {
  resetGameState();
  resetAnonymousSenderState();
  goToNode('start');
  showMenu = false;
  isStarted = true;
  setTimeout(() => {
    triggerDanmakusForDialogue(0);
  }, 200);
}

function handleContinue(slot: SaveSlot) {
  loadState(slot.state);
  restoreAnonymousSenderState(slot.state.anonymousSenderState);
  showMenu = false;
  isStarted = true;
  setTimeout(() => {
    const state = get(gameState);
    triggerDanmakusForDialogue(state.dialogueIndex);
  }, 100);
}

function handleBackToMenu() {
  showMenu = true;
}

function handleCloseMenu() {
  showMenu = false;
}

onMount(() => {
  initAudio();
  podcastState.subscribe(state => {
    if (state.showMenu) {
      showMenu = true;
    }
  });
});
</script>

<div id="podcast-container">
  {#if !isStarted}
    <div class="podcast-intro">
      <div class="intro-bg"></div>
      <div class="intro-content">
        <div class="intro-visualizer">
          {#each Array.from({ length: 24 }) as _, i}
            <div 
              class="viz-bar" 
              style="animation-delay: {i * 0.08}s; height: {20 + (i % 5) * 15}%;"
            ></div>
          {/each}
        </div>
        <h1 class="intro-title">深渊回响</h1>
        <p class="intro-subtitle">沉浸播客版 · 深海直播事故</p>
        <p class="intro-hint">🎧 请戴上耳机，调大音量</p>
        <div class="intro-actions">
          <button class="intro-btn primary" on:click={handleNewGame}>
            <span class="btn-icon">▶</span>
            开始收听
          </button>
          <button class="intro-btn" on:click={() => { showMenu = true; isStarted = false; }}>
            <span class="btn-icon">📂</span>
            继续收听
          </button>
        </div>
        <p class="intro-footer">一段来自深海的最后广播</p>
      </div>
    </div>
  {:else}
    <PodcastPlayer onBackToMenu={handleBackToMenu} />
  {/if}

  <PodcastMenu 
    isOpen={showMenu} 
    onClose={handleCloseMenu}
    onNewGame={handleNewGame}
    onContinue={handleContinue}
  />
</div>

<style>
  #podcast-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background: #050810;
  }

  .podcast-intro {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }

  .intro-bg {
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse at 50% 30%, rgba(40, 80, 140, 0.15), transparent 60%),
      radial-gradient(ellipse at 20% 80%, rgba(0, 100, 120, 0.1), transparent 50%),
      radial-gradient(ellipse at 80% 70%, rgba(60, 20, 80, 0.12), transparent 50%),
      linear-gradient(180deg, #050810 0%, #0a1525 50%, #050810 100%);
  }

  .intro-content {
    position: relative;
    text-align: center;
    padding: 40px 24px;
    max-width: 420px;
    width: 100%;
  }

  .intro-visualizer {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    height: 80px;
    margin-bottom: 40px;
  }

  .viz-bar {
    width: 4px;
    min-height: 8px;
    background: linear-gradient(180deg, #4da6ff, #00ccaa);
    border-radius: 2px;
    animation: vizPulse 2s ease-in-out infinite;
    box-shadow: 0 0 8px rgba(77, 166, 255, 0.5);
  }

  @keyframes vizPulse {
    0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
    50% { transform: scaleY(1); opacity: 1; }
  }

  .intro-title {
    font-size: 2.8rem;
    font-weight: 700;
    letter-spacing: 0.3em;
    background: linear-gradient(135deg, #64b4ff 0%, #40e0c0 50%, #8080ff 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 12px 0;
    text-shadow: 0 0 60px rgba(77, 166, 255, 0.3);
    font-family: 'Georgia', serif;
  }

  .intro-subtitle {
    font-size: 0.9rem;
    color: #6080a0;
    letter-spacing: 0.2em;
    margin: 0 0 32px 0;
    font-family: 'Courier New', monospace;
  }

  .intro-hint {
    font-size: 0.85rem;
    color: #40ccaa;
    margin: 0 0 40px 0;
    letter-spacing: 0.1em;
    animation: hintGlow 2s ease-in-out infinite;
  }

  @keyframes hintGlow {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  .intro-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 48px;
  }

  .intro-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 32px;
    border: 1px solid rgba(100, 180, 255, 0.3);
    background: rgba(20, 40, 70, 0.5);
    color: #a0d0f0;
    font-size: 1rem;
    border-radius: 12px;
    cursor: pointer;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    letter-spacing: 0.08em;
    font-family: inherit;
  }

  .intro-btn:hover, .intro-btn:active {
    background: rgba(40, 80, 140, 0.7);
    border-color: rgba(100, 180, 255, 0.6);
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(77, 166, 255, 0.2);
  }

  .intro-btn.primary {
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.3), rgba(64, 204, 170, 0.2));
    border-color: rgba(77, 166, 255, 0.5);
    color: #e0f0ff;
    font-weight: 600;
  }

  .intro-btn.primary:hover, .intro-btn.primary:active {
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.5), rgba(64, 204, 170, 0.4));
    box-shadow: 0 4px 30px rgba(77, 166, 255, 0.4);
  }

  .btn-icon {
    font-size: 1.1rem;
  }

  .intro-footer {
    font-size: 0.75rem;
    color: #405060;
    letter-spacing: 0.15em;
    margin: 0;
    font-family: 'Courier New', monospace;
  }
</style>

<script lang="ts">
  import { playSFX, initAudio, resumeAudio } from '../lib/audio';
  import { loadSaveSlots, hasAnySave, type GameSettings } from '../lib/storage';
  import type { SaveSlot } from '../types/game';
  import { getMemorySummaryForMenu, hasAnyMemory, currentPlaythrough } from '../lib/memory';
  import { getAllEndings } from '../lib/engine';

  export let onNewGame: () => void;
  export let onContinue: (slot: SaveSlot) => void;
  export let onShowEndings: () => void;
  export let onShowSettings: () => void;

  let saveSlots: SaveSlot[] = [];
  let showLoadMenu = false;
  let memorySummary = getMemorySummaryForMenu();
  let allEndings = getAllEndings();

  function refreshMemorySummary() {
    memorySummary = getMemorySummaryForMenu();
  }

  function loadSlots() {
    saveSlots = loadSaveSlots();
  }

  function handleNewGame() {
    initAudio();
    resumeAudio();
    playSFX('select');
    onNewGame();
  }

  function handleContinue() {
    resumeAudio();
    playSFX('click');
    loadSlots();
    showLoadMenu = true;
  }

  function handleLoadSlot(slot: SaveSlot) {
    playSFX('select');
    showLoadMenu = false;
    onContinue(slot);
  }

  function handleEndings() {
    playSFX('click');
    onShowEndings();
  }

  function handleSettings() {
    playSFX('click');
    onShowSettings();
  }

  function backToMenu() {
    playSFX('click');
    showLoadMenu = false;
  }

  function getLatestEndingTitle(): string | null {
    if (!memorySummary.latestEnding) return null;
    const ending = allEndings.find(e => e.id === memorySummary.latestEnding?.id);
    return ending?.title || null;
  }
</script>

<div class="menu-container">
  <div class="bubble-bg">
    {#each Array.from({ length: 15 }) as _, i}
      <div class="bubble" style="left: {Math.random() * 100}%; animation-delay: {Math.random() * 8}s; animation-duration: {8 + Math.random() * 6}s;"></div>
    {/each}
  </div>

  {#if !showLoadMenu}
    <div class="menu-content" style="animation: fadeInUp 1s ease-out;">
      <div class="title-section">
        <h1 class="game-title">深海直播事故</h1>
        <p class="subtitle">DEEP SEA LIVE INCIDENT</p>
        <div class="timestamp">2047.06.12 · 03:17:42</div>

        {#if $hasAnyMemory}
          <div class="memory-summary" style="animation: fadeIn 1s ease-out 0.5s both;">
            <div class="memory-row">
              <span class="memory-label">第 {$currentPlaythrough} 周目</span>
              <span class="memory-divider">·</span>
              <span class="memory-label">已解锁 {memorySummary.endingsCount}/{allEndings.length} 结局</span>
              {#if memorySummary.cluesCount > 0}
                <span class="memory-divider">·</span>
                <span class="memory-label clue-label">🔍 线索 × {memorySummary.cluesCount}</span>
              {/if}
            </div>
            {#if getLatestEndingTitle()}
              <div class="last-ending">
                <span class="last-ending-label">上次结局:</span>
                <span class="last-ending-title">{getLatestEndingTitle()}</span>
              </div>
            {/if}
            {#if memorySummary.playthrough > 1}
              <div class="memory-hint">
                <span class="hint-icon">✦</span>
                <span>你已发现一些隐藏线索，新周目中可能出现不同的对话和选项...</span>
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="menu-buttons">
        <button class="menu-btn primary" on:click={handleNewGame}>
          <span class="btn-icon">▶</span>
          <span class="btn-text">
            {$hasAnyMemory ? `开始第 ${$currentPlaythrough} 周目` : '开始新游戏'}
          </span>
        </button>

        {#if hasAnySave()}
          <button class="menu-btn" on:click={handleContinue}>
            <span class="btn-icon">📼</span>
            <span class="btn-text">继续游戏</span>
          </button>
        {/if}

        <button class="menu-btn" on:click={handleEndings}>
          <span class="btn-icon">📖</span>
          <span class="btn-text">
            结局收集
            {#if memorySummary.endingsCount > 0}
              <span class="menu-badge">{memorySummary.endingsCount}/{allEndings.length}</span>
            {/if}
          </span>
        </button>

        <button class="menu-btn" on:click={handleSettings}>
          <span class="btn-icon">⚙</span>
          <span class="btn-text">设置</span>
        </button>
      </div>

      <div class="footer-tip">
        <p>戴上耳机 · 全屏体验 · 独自观看</p>
      </div>
    </div>
  {:else}
    <div class="load-menu" style="animation: fadeIn 0.3s ease-out;">
      <h2 class="load-title">选择存档</h2>
      <div class="slot-list">
        {#if saveSlots.length === 0}
          <p class="no-save">没有可用的存档</p>
        {:else}
          {#each saveSlots as slot}
            <button class="slot-item" on:click={() => handleLoadSlot(slot)}>
              <div class="slot-info">
                <span class="slot-id">存档 {slot.id}</span>
                <span class="slot-time">{new Date(slot.savedAt).toLocaleString('zh-CN')}</span>
              </div>
              <p class="slot-preview">{slot.preview}</p>
            </button>
          {/each}
        {/if}
      </div>
      <button class="back-btn" on:click={backToMenu}>← 返回</button>
    </div>
  {/if}
</div>

<style>
  .menu-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: linear-gradient(180deg, #0a0f1a 0%, #001830 50%, #000a14 100%);
    overflow: hidden;
  }

  .bubble-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .bubble {
    position: absolute;
    bottom: -50px;
    width: 8px;
    height: 8px;
    background: radial-gradient(circle at 30% 30%, rgba(100, 180, 255, 0.4), rgba(50, 100, 200, 0.1));
    border-radius: 50%;
    animation: bubble 10s infinite ease-in;
  }

  .menu-content {
    position: relative;
    z-index: 10;
    text-align: center;
    padding: 20px;
    width: 100%;
    max-width: 480px;
  }

  .title-section {
    margin-bottom: 50px;
  }

  .game-title {
    font-size: clamp(2rem, 8vw, 3rem);
    font-weight: 700;
    color: #64b4ff;
    text-shadow: 0 0 30px rgba(100, 180, 255, 0.5), 0 0 60px rgba(100, 180, 255, 0.3);
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: clamp(0.7rem, 2.5vw, 0.9rem);
    color: #4a7a9a;
    letter-spacing: 0.3em;
    margin-bottom: 16px;
  }

  .timestamp {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: #ff6b6b;
    opacity: 0.8;
    animation: pulse 2s infinite;
  }

  .memory-summary {
    margin-top: 20px;
    padding: 14px 18px;
    background: rgba(30, 50, 80, 0.4);
    border: 1px solid rgba(255, 200, 100, 0.25);
    border-radius: 8px;
    backdrop-filter: blur(8px);
  }

  .memory-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 8px;
  }

  .memory-label {
    font-size: 0.85rem;
    color: #a0c0e0;
  }

  .memory-label.clue-label {
    color: #ffd890;
  }

  .memory-divider {
    color: rgba(255, 200, 100, 0.4);
    font-size: 0.7rem;
  }

  .last-ending {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .last-ending-label {
    font-size: 0.75rem;
    color: #6a8aaa;
  }

  .last-ending-title {
    font-size: 0.8rem;
    color: #ffd890;
    font-weight: 500;
  }

  .memory-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 200, 100, 0.15);
  }

  .hint-icon {
    color: #ffd890;
    font-size: 0.9rem;
  }

  .memory-hint span:last-child {
    font-size: 0.75rem;
    color: #c0a070;
    font-style: italic;
  }

  .menu-badge {
    margin-left: 8px;
    padding: 2px 8px;
    background: rgba(100, 180, 255, 0.2);
    border-radius: 10px;
    font-size: 0.75rem;
    color: #8ab0d0;
  }

  .menu-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 40px;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 24px;
    background: rgba(20, 40, 70, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .menu-btn:hover, .menu-btn:active {
    background: rgba(40, 80, 140, 0.8);
    border-color: rgba(100, 180, 255, 0.6);
    transform: translateY(-1px);
  }

  .menu-btn.primary {
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.8), rgba(40, 80, 160, 0.8));
    border-color: #64b4ff;
  }

  .btn-icon {
    font-size: 1.1rem;
  }

  .btn-text {
    font-weight: 500;
  }

  .footer-tip {
    color: #3a5a7a;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
  }

  .load-menu {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 480px;
    padding: 20px;
  }

  .load-title {
    color: #64b4ff;
    text-align: center;
    margin-bottom: 24px;
    font-size: 1.4rem;
  }

  .slot-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .slot-item {
    text-align: left;
    padding: 16px;
    background: rgba(20, 40, 70, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .slot-item:hover, .slot-item:active {
    background: rgba(40, 80, 140, 0.8);
    border-color: rgba(100, 180, 255, 0.5);
  }

  .slot-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .slot-id {
    color: #64b4ff;
    font-weight: 600;
  }

  .slot-time {
    color: #6a8aaa;
    font-size: 0.8rem;
  }

  .slot-preview {
    color: #a0b8d0;
    font-size: 0.85rem;
  }

  .no-save {
    text-align: center;
    color: #5a7a9a;
    padding: 40px;
  }

  .back-btn {
    display: block;
    margin: 0 auto;
    padding: 12px 24px;
    background: transparent;
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 8px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.9rem;
  }

  .back-btn:hover {
    background: rgba(100, 180, 255, 0.1);
  }
</style>

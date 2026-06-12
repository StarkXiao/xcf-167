<script lang="ts">
  import { playSFX, initAudio, resumeAudio } from '../lib/audio';
  import { loadSaveSlots, hasAnySave, type GameSettings } from '../lib/storage';
  import type { SaveSlot } from '../types/game';
  import { getMemorySummaryForMenu, hasAnyMemory, currentPlaythrough } from '../lib/memory';
  import { getAllEndings } from '../lib/engine';
  import { buildAnonymousSummary } from '../lib/anonymousSender';
  import { currentSkin, achievementProgress } from '../lib/achievements';

  export let onNewGame: () => void;
  export let onContinue: (slot: SaveSlot) => void;
  export let onShowEndings: () => void;
  export let onShowSettings: () => void;
  export let onShowAchievements: () => void;
  export let onShowChapterReview: () => void;
  export let onShowArchive: () => void;
  export let onShowWorldview: () => void;
  export let onOpenEditor: () => void;
  export let onShowCaseLinkage: () => void;

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

  function getSlotLatestMessage(slot: SaveSlot): string {
    return buildAnonymousSummary(slot.state.anonymousSenderState).latestPreview;
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

  function handleAchievements() {
    playSFX('click');
    onShowAchievements();
  }

  function handleChapterReview() {
    playSFX('click');
    onShowChapterReview();
  }

  function handleArchive() {
    playSFX('click');
    onShowArchive();
  }

  function handleWorldview() {
    playSFX('click');
    onShowWorldview();
  }

  function handleEditor() {
    playSFX('select');
    onOpenEditor();
  }

  function handleCaseLinkage() {
    playSFX('select');
    onShowCaseLinkage();
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

<div class="menu-container" 
     style="background: {$currentSkin.gradient}; --accent-color: {$currentSkin.accentColor}; --title-color: {$currentSkin.titleColor}; --subtitle-color: {$currentSkin.subtitleColor}; --btn-bg: {$currentSkin.buttonBg}; --btn-border: {$currentSkin.buttonBorder}; --particle-color: {$currentSkin.particleColor}; --decoration: {$currentSkin.bgDecoration};">
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

        <button class="menu-btn" on:click={handleAchievements}>
          <span class="btn-icon">🏆</span>
          <span class="btn-text">
            成就与档案
            {#if $achievementProgress.unlocked > 0}
              <span class="menu-badge">{$achievementProgress.unlocked}/{$achievementProgress.total}</span>
            {/if}
          </span>
        </button>

        <button class="menu-btn" on:click={handleChapterReview}>
          <span class="btn-icon">📋</span>
          <span class="btn-text">章节复盘</span>
        </button>

        <button class="menu-btn" on:click={handleArchive}>
          <span class="btn-icon">🗄</span>
          <span class="btn-text">事故档案库</span>
        </button>

        <button class="menu-btn" on:click={handleWorldview}>
          <span class="btn-icon">📚</span>
          <span class="btn-text">世界观百科</span>
        </button>

        <button class="menu-btn case-linkage-btn" on:click={handleCaseLinkage}>
          <span class="btn-icon">🔗</span>
          <span class="btn-text">
            多案件联动篇
            <span class="menu-badge new">NEW</span>
          </span>
        </button>

        <button class="menu-btn" on:click={handleSettings}>
          <span class="btn-icon">⚙</span>
          <span class="btn-text">设置</span>
        </button>

        <button class="menu-btn editor-btn" on:click={handleEditor}>
          <span class="btn-icon">🔬</span>
          <span class="btn-text">深海研究所后台</span>
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
              {#if getSlotLatestMessage(slot)}
                <div class="slot-latest-message">
                  <span class="latest-icon">{getSlotLatestMessage(slot).startsWith('📧') ? '📧' : '💻'}</span>
                  <span class="latest-text">{getSlotLatestMessage(slot).slice(2).trim()}</span>
                </div>
              {/if}
              {#if slot.state.anonymousSenderState && (slot.state.anonymousSenderState.unreadEmailCount + slot.state.anonymousSenderState.unreadTerminalCount) > 0}
                <div class="slot-anon-hint">
                  <span class="anon-hint-dot"></span>
                  <span>有 {slot.state.anonymousSenderState.unreadEmailCount + slot.state.anonymousSenderState.unreadTerminalCount} 条匿名消息待查看</span>
                </div>
              {/if}
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
    overflow: hidden;
    transition: background 0.5s ease;
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
    background: var(--particle-color);
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
    color: var(--title-color);
    text-shadow: 0 0 30px color-mix(in srgb, var(--title-color) 50%, transparent), 0 0 60px color-mix(in srgb, var(--title-color) 30%, transparent);
    letter-spacing: 0.1em;
    margin-bottom: 8px;
    transition: color 0.5s ease, text-shadow 0.5s ease;
  }

  .subtitle {
    font-size: clamp(0.7rem, 2.5vw, 0.9rem);
    color: var(--subtitle-color);
    letter-spacing: 0.3em;
    margin-bottom: 16px;
    transition: color 0.5s ease;
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
    background: color-mix(in srgb, var(--accent-color) 15%, transparent);
    border: 1px solid color-mix(in srgb, #ffd890 25%, transparent);
    border-radius: 8px;
    backdrop-filter: blur(8px);
    transition: all 0.5s ease;
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
    background: color-mix(in srgb, var(--accent-color) 20%, transparent);
    border-radius: 10px;
    font-size: 0.75rem;
    color: #8ab0d0;
    transition: all 0.5s ease;
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
    background: var(--btn-bg);
    border: 1px solid var(--btn-border);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .menu-btn:hover, .menu-btn:active {
    background: color-mix(in srgb, var(--accent-color) 35%, transparent);
    border-color: color-mix(in srgb, var(--accent-color) 60%, transparent);
    transform: translateY(-1px);
  }

  .menu-btn.primary {
    background: linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 50%, transparent), color-mix(in srgb, var(--accent-color) 35%, transparent));
    border-color: var(--accent-color);
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
    color: var(--accent-color);
    text-align: center;
    margin-bottom: 24px;
    font-size: 1.4rem;
    transition: color 0.5s ease;
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
    background: var(--btn-bg);
    border: 1px solid var(--btn-border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .slot-item:hover, .slot-item:active {
    background: color-mix(in srgb, var(--accent-color) 35%, transparent);
    border-color: color-mix(in srgb, var(--accent-color) 50%, transparent);
  }

  .slot-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .slot-id {
    color: var(--accent-color);
    font-weight: 600;
    transition: color 0.5s ease;
  }

  .slot-time {
    color: #6a8aaa;
    font-size: 0.8rem;
  }

  .slot-preview {
    color: #a0b8d0;
    font-size: 0.85rem;
  }

  .slot-latest-message {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    padding: 6px 10px;
    background: color-mix(in srgb, var(--accent-color) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--accent-color) 20%, transparent);
    border-radius: 6px;
    transition: all 0.5s ease;
  }

  .slot-latest-message .latest-icon {
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .slot-latest-message .latest-text {
    color: #a0c8e8;
    font-size: 0.78rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .slot-anon-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 6px 10px;
    background: rgba(60, 35, 15, 0.4);
    border: 1px solid rgba(255, 180, 100, 0.25);
    border-radius: 6px;
  }

  .anon-hint-dot {
    width: 8px;
    height: 8px;
    background: linear-gradient(135deg, #ffa040, #ff7020);
    border-radius: 50%;
    box-shadow: 0 0 6px rgba(255, 150, 80, 0.6);
    animation: pulse 1.5s infinite;
  }

  .slot-anon-hint span:last-child {
    color: #ffc080;
    font-size: 0.75rem;
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
    border: 1px solid color-mix(in srgb, var(--accent-color) 30%, transparent);
    border-radius: 8px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: color-mix(in srgb, var(--accent-color) 10%, transparent);
  }

  .menu-btn.editor-btn {
    background: linear-gradient(135deg, rgba(0, 180, 150, 0.15), rgba(0, 120, 100, 0.1));
    border-color: rgba(0, 200, 160, 0.3);
  }

  .menu-btn.editor-btn:hover, .menu-btn.editor-btn:active {
    background: linear-gradient(135deg, rgba(0, 200, 160, 0.3), rgba(0, 150, 120, 0.2));
    border-color: rgba(0, 255, 200, 0.6);
  }

  .menu-btn.case-linkage-btn {
    background: linear-gradient(135deg, rgba(179, 102, 255, 0.15), rgba(77, 166, 255, 0.1));
    border-color: rgba(179, 102, 255, 0.3);
  }

  .menu-btn.case-linkage-btn:hover, .menu-btn.case-linkage-btn:active {
    background: linear-gradient(135deg, rgba(179, 102, 255, 0.3), rgba(77, 166, 255, 0.2));
    border-color: rgba(179, 102, 255, 0.6);
  }

  .menu-badge.new {
    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 2px 6px;
    animation: pulse 2s infinite;
  }
</style>

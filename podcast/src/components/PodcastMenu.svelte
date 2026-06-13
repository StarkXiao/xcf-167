<script lang="ts">
  import { onMount } from 'svelte';
  import { playSFX } from '../lib/audio';
  import { loadSaveSlots, deleteSlot, loadFromSlot } from '../lib/storage';
  import { podcastSettings, updatePodcastSetting, closeMenu } from '../lib/podcastStore';
  import type { SaveSlot } from '../types/game';
  import { triggerHaptic } from '../lib/podcastStore';

  export let isOpen: boolean;
  export let onClose: () => void;
  export let onNewGame: () => void;
  export let onContinue: (slot: SaveSlot) => void;

  let saveSlots: SaveSlot[] = [];
  let activeTab: 'saves' | 'settings' = 'saves';
  const SUBTITLE_SIZES: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

  function handleSubtitleSize(size: 'small' | 'medium' | 'large') {
    updatePodcastSetting('subtitleSize', size);
    triggerHaptic('light');
  }

  function handleBackdropKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  }

  function handleSaveItemKeydown(e: KeyboardEvent, slot: SaveSlot) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleLoadSlot(slot);
    }
  }

  $: autoPlay = $podcastSettings.autoPlay;
  $: showSubtitles = $podcastSettings.showSubtitles;
  $: subtitleSize = $podcastSettings.subtitleSize;
  $: narrationSpeed = $podcastSettings.narrationSpeed;
  $: immersiveMode = $podcastSettings.immersiveMode;

  function refreshSlots() {
    saveSlots = loadSaveSlots();
  }

  onMount(() => {
    refreshSlots();
  });

  $: if (isOpen) {
    refreshSlots();
  }

  function handleClose() {
    closeMenu();
    onClose();
  }

  function handleNewGame() {
    playSFX('select');
    triggerHaptic('light');
    onNewGame();
    handleClose();
  }

  function handleLoadSlot(slot: SaveSlot) {
    playSFX('select');
    triggerHaptic('medium');
    onContinue(slot);
    handleClose();
  }

  function handleDeleteSlot(slotId: number) {
    deleteSlot(slotId);
    refreshSlots();
    playSFX('click');
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

{#if isOpen}
  <div
    class="menu-backdrop"
    role="button"
    aria-label="关闭菜单"
    tabindex="0"
    on:click={handleClose}
    on:keydown={handleBackdropKeydown}
  >
    <div class="menu-panel" role="dialog" aria-modal="true" aria-label="播客菜单">
      <div class="menu-header">
        <h2 class="menu-title">深渊回响</h2>
        <button class="menu-close" on:click={handleClose}>✕</button>
      </div>

      <div class="menu-tabs">
        <button
          class="tab-btn"
          class:active={activeTab === 'saves'}
          on:click={() => { activeTab = 'saves'; }}
        >
          📂 存档
        </button>
        <button
          class="tab-btn"
          class:active={activeTab === 'settings'}
          on:click={() => { activeTab = 'settings'; }}
        >
          ⚙ 设置
        </button>
      </div>

      <div class="menu-body">
        {#if activeTab === 'saves'}
          <div class="saves-section">
            <button class="new-game-btn" on:click={handleNewGame}>
              <span class="btn-icon">▶</span>
              开始新收听
            </button>

            {#if saveSlots.length > 0}
              <div class="saves-list">
                {#each saveSlots as slot (slot.id)}
                  <div class="save-item">
                    <div
                      class="save-info"
                      role="button"
                      tabindex="0"
                      aria-label={`读取存档：${slot.preview || '无预览'}`}
                      on:click={() => handleLoadSlot(slot)}
                      on:keydown={(e) => handleSaveItemKeydown(e, slot)}
                    >
                      <div class="save-preview">{slot.preview || '无预览'}</div>
                      <div class="save-meta">
                        <span class="save-time">{formatTime(slot.savedAt)}</span>
                      </div>
                    </div>
                    <button class="save-delete" on:click|stopPropagation={() => handleDeleteSlot(slot.id)}>
                      ✕
                    </button>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="no-saves">
                <p>暂无存档</p>
                <p class="no-saves-hint">播放中点击 💾 可保存进度</p>
              </div>
            {/if}
          </div>
        {:else}
          <div class="settings-section">
            <div class="setting-item">
              <span class="setting-label">自动播放</span>
              <button
                class="toggle-btn"
                class:on={autoPlay}
                on:click={() => updatePodcastSetting('autoPlay', !autoPlay)}
              >
                {autoPlay ? '开' : '关'}
              </button>
            </div>

            <div class="setting-item">
              <span class="setting-label">显示字幕</span>
              <button
                class="toggle-btn"
                class:on={showSubtitles}
                on:click={() => updatePodcastSetting('showSubtitles', !showSubtitles)}
              >
                {showSubtitles ? '开' : '关'}
              </button>
            </div>

            <div class="setting-item">
              <span class="setting-label">字幕大小</span>
              <div class="size-selector" role="group" aria-label="字幕大小选择">
                {#each SUBTITLE_SIZES as size}
                  <button
                    class="size-btn"
                    class:active={subtitleSize === size}
                    aria-pressed={subtitleSize === size}
                    on:click={() => handleSubtitleSize(size)}
                  >
                    {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                  </button>
                {/each}
              </div>
            </div>

            <div class="setting-item">
              <span class="setting-label">朗读速度</span>
              <div class="speed-control">
                <button
                  class="speed-btn"
                  on:click={() => updatePodcastSetting('narrationSpeed', Math.max(0.5, narrationSpeed - 0.25))}
                >−</button>
                <span class="speed-value">{narrationSpeed.toFixed(2)}x</span>
                <button
                  class="speed-btn"
                  on:click={() => updatePodcastSetting('narrationSpeed', Math.min(2, narrationSpeed + 0.25))}
                >+</button>
              </div>
            </div>

            <div class="setting-item">
              <span class="setting-label">沉浸模式</span>
              <button
                class="toggle-btn"
                class:on={immersiveMode}
                on:click={() => updatePodcastSetting('immersiveMode', !immersiveMode)}
              >
                {immersiveMode ? '开' : '关'}
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .menu-backdrop {
    position: absolute;
    inset: 0;
    z-index: 100;
    background: rgba(0, 2, 8, 0.8);
    backdrop-filter: blur(12px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.25s ease-out;
  }

  .menu-panel {
    width: 100%;
    max-width: 400px;
    max-height: 85vh;
    background: linear-gradient(180deg, rgba(10, 20, 40, 0.97), rgba(5, 12, 28, 0.99));
    border: 1px solid rgba(100, 180, 255, 0.25);
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 40px rgba(40, 80, 160, 0.15);
    animation: fadeInUp 0.3s ease-out;
  }

  .menu-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.12);
  }

  .menu-title {
    margin: 0;
    font-size: 1.1rem;
    color: #80c0ff;
    letter-spacing: 0.15em;
    font-family: 'Georgia', serif;
  }

  .menu-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 80, 80, 0.1);
    color: #ff8080;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .menu-close:active {
    background: rgba(255, 80, 80, 0.25);
  }

  .menu-tabs {
    display: flex;
    border-bottom: 1px solid rgba(100, 180, 255, 0.1);
  }

  .tab-btn {
    flex: 1;
    padding: 12px;
    font-size: 0.85rem;
    color: #6080a0;
    letter-spacing: 0.08em;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab-btn.active {
    color: #80c0ff;
    border-bottom-color: #4da6ff;
  }

  .menu-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .new-game-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.2), rgba(64, 204, 170, 0.12));
    border: 1px solid rgba(77, 166, 255, 0.35);
    border-radius: 10px;
    color: #d0e8ff;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 16px;
    transition: all 0.2s;
  }

  .new-game-btn:active {
    background: linear-gradient(135deg, rgba(77, 166, 255, 0.35), rgba(64, 204, 170, 0.25));
    transform: scale(0.98);
  }

  .btn-icon {
    font-size: 0.9rem;
  }

  .saves-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .save-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background: rgba(15, 30, 55, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.15);
    border-radius: 8px;
  }

  .save-info {
    flex: 1;
    cursor: pointer;
    min-width: 0;
  }

  .save-preview {
    font-size: 0.82rem;
    color: #c0d4e8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .save-meta {
    margin-top: 4px;
    font-size: 0.7rem;
    color: #506878;
  }

  .save-delete {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: rgba(255, 60, 60, 0.1);
    color: #ff7070;
    font-size: 0.7rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .save-delete:active {
    background: rgba(255, 60, 60, 0.25);
  }

  .no-saves {
    text-align: center;
    padding: 30px 0;
    color: #405060;
    font-size: 0.85rem;
  }

  .no-saves-hint {
    font-size: 0.72rem;
    margin-top: 6px;
    color: #304050;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .setting-label {
    font-size: 0.85rem;
    color: #a0b8d0;
  }

  .toggle-btn {
    padding: 6px 16px;
    border-radius: 8px;
    font-size: 0.78rem;
    letter-spacing: 0.08em;
    background: rgba(30, 45, 70, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.2);
    color: #6080a0;
    transition: all 0.2s;
  }

  .toggle-btn.on {
    background: rgba(77, 166, 255, 0.2);
    border-color: rgba(77, 166, 255, 0.5);
    color: #a0d0ff;
  }

  .size-selector {
    display: flex;
    gap: 4px;
  }

  .size-btn {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    background: rgba(30, 45, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.15);
    color: #6080a0;
    transition: all 0.2s;
  }

  .size-btn.active {
    background: rgba(77, 166, 255, 0.2);
    border-color: rgba(77, 166, 255, 0.45);
    color: #a0d0ff;
  }

  .speed-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .speed-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(30, 45, 70, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.2);
    color: #a0c8f0;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .speed-btn:active {
    background: rgba(50, 80, 130, 0.8);
  }

  .speed-value {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: #80c0ff;
    min-width: 45px;
    text-align: center;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .menu-panel {
      max-height: 90vh;
    }

    .menu-body {
      padding: 14px 16px;
    }
  }
</style>

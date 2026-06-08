<script lang="ts">
  import { playSFX, initAudio, resumeAudio } from '../lib/audio';
  import type { SaveSlot, GameState } from '../types/game';
  import { saveToSlot, deleteSlot, loadSaveSlots } from '../lib/storage';
  import { gameState } from '../lib/store';
  import { buildAnonymousSummary } from '../lib/anonymousSender';
  import { get } from 'svelte/store';

  export let isOpen: boolean;
  export let onClose: () => void;
  export let onLoadSlot: (slot: SaveSlot) => void;
  export let onBackToMenu: () => void;

  let slots: SaveSlot[] = [];
  let mode: 'menu' | 'save' | 'load' = 'menu';

  function refreshSlots() {
    slots = loadSaveSlots();
  }

  function openSave() {
    playSFX('click');
    refreshSlots();
    mode = 'save';
  }

  function openLoad() {
    playSFX('click');
    refreshSlots();
    mode = 'load';
  }

  function buildPreview(state: GameState): string {
    const parts: string[] = [`节点: ${state.currentNodeId}`];
    const anon = buildAnonymousSummary(state.anonymousSenderState);
    if (anon.emailCount > 0 || anon.terminalCount > 0) {
      const counter = `📧${anon.emailCount} 💻${anon.terminalCount}${anon.unreadCount > 0 ? ` ⚠${anon.unreadCount}` : ''}`;
      parts.push(counter);
      if (anon.latestPreview) {
        parts.push(anon.latestPreview);
      }
    }
    return parts.join(' · ');
  }

  function handleSave(slotId: number) {
    playSFX('select');
    const state = get(gameState);
    const preview = buildPreview(state);
    saveToSlot(slotId, state, preview);
    refreshSlots();
  }

  function handleLoad(slot: SaveSlot) {
    playSFX('select');
    onLoadSlot(slot);
    onClose();
  }

  function handleDelete(slotId: number) {
    playSFX('click');
    deleteSlot(slotId);
    refreshSlots();
  }

  function handleBack() {
    playSFX('click');
    if (mode === 'menu') {
      onClose();
    } else {
      mode = 'menu';
    }
  }

  function handleBackToMenu() {
    playSFX('click');
    onClose();
    onBackToMenu();
  }

  $: if (isOpen) {
    refreshSlots();
    mode = 'menu';
  }
</script>

{#if isOpen}
  <div class="overlay" on:click={onClose}>
    <div class="panel" on:click|stopPropagation style="animation: fadeInUp 0.3s ease-out;">
      <button class="close-btn" on:click={onClose}>×</button>
      
      {#if mode === 'menu'}
        <h2 class="panel-title">菜单</h2>
        <div class="menu-options">
          <button class="option-btn" on:click={openSave}>
            <span class="option-icon">💾</span>
            <span>保存进度</span>
          </button>
          <button class="option-btn" on:click={openLoad}>
            <span class="option-icon">📂</span>
            <span>读取进度</span>
          </button>
          <button class="option-btn" on:click={handleBackToMenu}>
            <span class="option-icon">🏠</span>
            <span>返回标题</span>
          </button>
          <button class="option-btn" on:click={handleBack}>
            <span class="option-icon">▶</span>
            <span>继续游戏</span>
          </button>
        </div>
      {:else if mode === 'save'}
        <h2 class="panel-title">保存到存档位</h2>
        <div class="slot-grid">
          {#each [1, 2, 3, 4, 5] as id}
            {@const slot = slots.find(s => s.id === id)}
            <div class="slot-card">
              <div class="slot-header">
                <span class="slot-label">存档 {id}</span>
                {#if slot}
                  <span class="slot-date">{new Date(slot.savedAt).toLocaleDateString('zh-CN')}</span>
                {/if}
              </div>
              <div class="slot-body">
                {#if slot}
                  <p class="slot-preview">{slot.preview}</p>
                {:else}
                  <p class="slot-empty">空存档位</p>
                {/if}
              </div>
              <div class="slot-actions">
                <button class="action-btn save" on:click={() => handleSave(id)}>
                  {slot ? '覆盖' : '保存'}
                </button>
                {#if slot}
                  <button class="action-btn delete" on:click={() => handleDelete(id)}>删除</button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <button class="back-btn" on:click={handleBack}>← 返回</button>
      {:else if mode === 'load'}
        <h2 class="panel-title">选择要读取的存档</h2>
        <div class="slot-grid">
          {#each [1, 2, 3, 4, 5] as id}
            {@const slot = slots.find(s => s.id === id)}
            <div class="slot-card" class:disabled={!slot}>
              <div class="slot-header">
                <span class="slot-label">存档 {id}</span>
                {#if slot}
                  <span class="slot-date">{new Date(slot.savedAt).toLocaleDateString('zh-CN')}</span>
                {/if}
              </div>
              <div class="slot-body">
                {#if slot}
                  <p class="slot-preview">{slot.preview}</p>
                {:else}
                  <p class="slot-empty">空存档位</p>
                {/if}
              </div>
              <div class="slot-actions">
                <button class="action-btn load" disabled={!slot} on:click={() => slot && handleLoad(slot)}>
                  读取
                </button>
              </div>
            </div>
          {/each}
        </div>
        <button class="back-btn" on:click={handleBack}>← 返回</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(8px);
    padding: 20px;
  }

  .panel {
    position: relative;
    background: linear-gradient(180deg, rgba(15, 30, 55, 0.95), rgba(8, 18, 35, 0.98));
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 500px;
    max-height: 85vh;
    overflow-y: auto;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 16px;
    background: transparent;
    border: none;
    color: #6a8aaa;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }

  .close-btn:hover {
    color: #fff;
  }

  .panel-title {
    color: #64b4ff;
    text-align: center;
    margin-bottom: 20px;
    font-size: 1.2rem;
  }

  .menu-options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .option-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: rgba(30, 55, 95, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .option-btn:hover, .option-btn:active {
    background: rgba(50, 90, 150, 0.7);
    border-color: rgba(100, 180, 255, 0.5);
  }

  .option-icon {
    font-size: 1.1rem;
  }

  .slot-grid {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .slot-card {
    background: rgba(20, 40, 70, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    padding: 12px;
  }

  .slot-card.disabled {
    opacity: 0.5;
  }

  .slot-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .slot-label {
    color: #64b4ff;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .slot-date {
    color: #6a8aaa;
    font-size: 0.8rem;
  }

  .slot-body {
    min-height: 24px;
    margin-bottom: 10px;
  }

  .slot-preview {
    color: #a0b8d0;
    font-size: 0.85rem;
  }

  .slot-empty {
    color: #4a6a8a;
    font-size: 0.85rem;
    font-style: italic;
  }

  .slot-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    background: rgba(40, 70, 120, 0.5);
    color: #c0d8f0;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .action-btn:hover:not(:disabled) {
    background: rgba(60, 100, 170, 0.7);
  }

  .action-btn.save {
    border-color: rgba(100, 200, 150, 0.4);
  }

  .action-btn.load {
    border-color: rgba(100, 180, 255, 0.4);
  }

  .action-btn.delete {
    border-color: rgba(200, 100, 100, 0.4);
    flex: 0 0 auto;
    padding: 8px 14px;
  }

  .back-btn {
    display: block;
    margin: 0 auto;
    padding: 10px 20px;
    background: transparent;
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.85rem;
  }

  .back-btn:hover {
    background: rgba(100, 180, 255, 0.1);
  }

  @media (max-width: 480px) {
    .panel {
      padding: 18px 14px;
    }

    .option-btn {
      padding: 12px 14px;
      font-size: 0.85rem;
    }
  }
</style>

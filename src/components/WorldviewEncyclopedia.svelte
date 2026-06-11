<script lang="ts">
  import { onMount } from 'svelte';
  import type { WorldviewCategory, WorldviewNode, CreatureProfile, EquipmentLog, MailCorrespondence, ChronologyEvent } from '../types/game';
  import {
    allWorldviewNodes,
    getNodesByCategory,
    categoryLabels,
    categoryIcons,
    chronologyEvents,
  } from '../data/worldview';
  import {
    worldviewState,
    toggleCategory,
    selectNode,
    selectTab,
    getUnlockedNodeIds,
    updateWorldviewUnlocks,
  } from '../lib/worldview';
  import { playSFX } from '../lib/audio';
  import ListView from './worldview/ListView.svelte';
  import CreatureDetail from './worldview/CreatureDetail.svelte';
  import EquipmentDetail from './worldview/EquipmentDetail.svelte';
  import MailDetail from './worldview/MailDetail.svelte';
  import ChronologyDetail from './worldview/ChronologyDetail.svelte';
  import ChronologyView from './worldview/ChronologyView.svelte';
  import KnowledgeTreeSidebar from './worldview/KnowledgeTreeSidebar.svelte';

  export let isOpen = false;
  export let onClose: () => void = () => {};

  type TabType = 'tree' | 'creature' | 'equipment' | 'mail' | 'chronology';
  const tabs: TabType[] = ['tree', 'creature', 'equipment', 'mail', 'chronology'];

  function handleTabClick(tab: TabType) {
    playSFX('click');
    selectTab(tab as WorldviewCategory);
  }

  function handleSelectNode(node: WorldviewNode) {
    playSFX('switch');
    selectNode(node.id);
    if (node.category === 'chronology' && $worldviewState.activeTab !== 'chronology') {
      selectTab(node.category);
    }
  }

  function handleBackToList() {
    playSFX('click');
    selectNode(null);
  }

  function handleToggleCategory(cat: WorldviewCategory) {
    toggleCategory(cat);
  }

  $: activeTab = $worldviewState.activeTab as TabType;
  $: selectedNodeId = $worldviewState.selectedNodeId;
  $: expandedCategories = $worldviewState.expandedCategories;
  $: unlockedIds = getUnlockedNodeIds();
  $: selectedNode = selectedNodeId ? allWorldviewNodes.find(n => n.id === selectedNodeId) : null;

  onMount(() => {
    updateWorldviewUnlocks();
  });

  function getStats() {
    const total = allWorldviewNodes.length;
    const unlocked = unlockedIds.length;
    return { total, unlocked, pct: total > 0 ? Math.round((unlocked / total) * 100) : 0 };
  }

  function getTabIcon(tab: string): string {
    return tab === 'tree' ? '🌳' : categoryIcons[tab];
  }

  function getTabLabel(tab: string): string {
    return tab === 'tree' ? '知识树' : categoryLabels[tab];
  }

  function getTabCategory(tab: string): WorldviewCategory {
    return tab as WorldviewCategory;
  }

  function getChronologyNodes(): ChronologyEvent[] {
    return chronologyEvents;
  }
</script>

{#if isOpen}
<div class="encyclopedia-overlay" on:click={(e) => e.stopPropagation()}>
  <div class="encyclopedia-modal">
    <div class="encyclopedia-header">
      <div class="header-left">
        <div class="header-icon">📚</div>
        <div class="header-titles">
          <h1 class="header-title">世界观百科</h1>
          <span class="header-subtitle">WORLDVIEW ARCHIVE</span>
        </div>
      </div>
      <div class="header-center">
        {#each tabs as tab}
          <button
            class="tab-btn"
            class:active={activeTab === tab}
            on:click={() => handleTabClick(tab)}
          >
            <span class="tab-icon">{getTabIcon(tab)}</span>
            <span class="tab-label">{getTabLabel(tab)}</span>
          </button>
        {/each}
      </div>
      <div class="header-right">
        <div class="stats">
          <span class="stats-num">{getStats().unlocked}/{getStats().total}</span>
          <div class="stats-bar">
            <div class="stats-fill" style="width: {getStats().pct}%"></div>
          </div>
          <span class="stats-pct">{getStats().pct}%</span>
        </div>
        <button class="close-btn" on:click={() => { playSFX('click'); onClose(); }}>✕</button>
      </div>
    </div>

    <div class="encyclopedia-body">
      {#if activeTab === 'tree'}
        <div class="knowledge-tree-layout">
          <div class="tree-panel">
            <KnowledgeTreeSidebar
              {selectedNodeId}
              {expandedCategories}
              {unlockedIds}
              onSelect={handleSelectNode}
              onToggle={handleToggleCategory}
            />
          </div>
          <div class="detail-panel">
            {#if selectedNode}
              {#if selectedNode.category === 'creature'}
                <CreatureDetail node={selectedNode} onBack={handleBackToList} />
              {:else if selectedNode.category === 'equipment'}
                <EquipmentDetail node={selectedNode} onBack={handleBackToList} />
              {:else if selectedNode.category === 'mail'}
                <MailDetail node={selectedNode} onBack={handleBackToList} />
              {:else if selectedNode.category === 'chronology'}
                <ChronologyDetail node={selectedNode} onBack={handleBackToList} />
              {/if}
            {:else}
              <div class="empty-state">
                <div class="empty-icon">🌲</div>
                <p class="empty-title">选择一个条目进行查看</p>
                <p class="empty-desc">从左侧知识树中选择已解锁的条目，或通过探索游戏世界来解锁更多内容。</p>
              </div>
            {/if}
          </div>
        </div>
      {:else if activeTab === 'chronology' && !selectedNodeId}
        <ChronologyView
          nodes={getChronologyNodes()}
          {unlockedIds}
          onSelect={handleSelectNode}
        />
      {:else if selectedNode}
        {#if selectedNode.category === 'creature'}
          <CreatureDetail node={selectedNode} onBack={handleBackToList} />
        {:else if selectedNode.category === 'equipment'}
          <EquipmentDetail node={selectedNode} onBack={handleBackToList} />
        {:else if selectedNode.category === 'mail'}
          <MailDetail node={selectedNode} onBack={handleBackToList} />
        {:else if selectedNode.category === 'chronology'}
          <ChronologyDetail node={selectedNode} onBack={handleBackToList} />
        {/if}
      {:else}
        <ListView
          nodes={getNodesByCategory(getTabCategory(activeTab))}
          category={getTabCategory(activeTab)}
          {unlockedIds}
          onSelect={handleSelectNode}
        />
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  .encyclopedia-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .encyclopedia-modal {
    width: 100%;
    max-width: 1280px;
    height: calc(100vh - 40px);
    background: linear-gradient(180deg, #0a1428, #060d1c);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 16px;
    box-shadow: 0 0 60px rgba(60, 130, 200, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .encyclopedia-header {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 20px;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.2);
    background: linear-gradient(180deg, rgba(15, 30, 60, 0.95), rgba(10, 20, 40, 0.98));
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .header-icon {
    font-size: 2rem;
    filter: drop-shadow(0 0 10px rgba(100, 170, 255, 0.4));
  }

  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .header-title {
    font-size: 1.3rem;
    color: #c0d8f0;
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .header-subtitle {
    font-size: 0.7rem;
    color: #5a8aaa;
    letter-spacing: 0.25em;
    font-family: 'Courier New', monospace;
  }

  .header-center {
    display: flex;
    justify-content: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(15, 25, 50, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 8px;
    color: #7090b0;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background: rgba(30, 50, 80, 0.6);
    color: #a0c0e0;
    border-color: rgba(100, 170, 255, 0.35);
  }

  .tab-btn.active {
    background: linear-gradient(135deg, rgba(60, 130, 200, 0.25), rgba(80, 160, 240, 0.15));
    color: #b0d8ff;
    border-color: rgba(100, 170, 255, 0.4);
    box-shadow: 0 0 15px rgba(100, 170, 255, 0.15);
  }

  .tab-icon { font-size: 0.9rem; }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
  }

  .stats-num {
    font-size: 0.8rem;
    color: #66aaff;
    font-family: 'Courier New', monospace;
  }

  .stats-bar {
    width: 120px;
    height: 4px;
    background: rgba(60, 80, 100, 0.3);
    border-radius: 2px;
    overflow: hidden;
  }

  .stats-fill {
    height: 100%;
    background: linear-gradient(90deg, #66aaff, #66ddaa);
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .stats-pct {
    font-size: 0.65rem;
    color: #88aacc;
    font-family: 'Courier New', monospace;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(255, 100, 100, 0.4);
    background: rgba(255, 80, 80, 0.1);
    color: #ff9090;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 80, 80, 0.25);
    transform: scale(1.1);
  }

  .encyclopedia-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .knowledge-tree-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    height: 100%;
  }

  .tree-panel {
    border-right: 1px solid rgba(60, 130, 200, 0.15);
    background: rgba(8, 16, 32, 0.6);
    overflow: hidden;
  }

  .detail-panel {
    overflow: hidden;
  }

  .empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    text-align: center;
  }

  .empty-icon {
    font-size: 4rem;
    opacity: 0.3;
    margin-bottom: 20px;
  }

  .empty-title {
    font-size: 1.3rem;
    color: #6a8aaa;
    margin: 0 0 10px 0;
  }

  .empty-desc {
    font-size: 0.85rem;
    color: #4a6a8a;
    line-height: 1.8;
    max-width: 400px;
    margin: 0;
  }

  @media (max-width: 900px) {
    .encyclopedia-overlay {
      padding: 0;
    }
    .encyclopedia-modal {
      height: 100vh;
      max-width: 100%;
      border-radius: 0;
    }
    .encyclopedia-header {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 12px 16px;
    }
    .header-center {
      order: 3;
    }
    .header-right {
      justify-content: space-between;
    }
    .knowledge-tree-layout {
      grid-template-columns: 1fr;
    }
    .tree-panel {
      max-height: 40vh;
      border-right: none;
      border-bottom: 1px solid rgba(60, 130, 200, 0.15);
    }
  }

  @media (max-width: 600px) {
    .tab-label { display: none; }
    .tab-btn { padding: 8px 10px; }
    .stats-bar { width: 80px; }
  }
</style>

<script lang="ts">
  import type { WorldviewNode, WorldviewCategory } from '../../types/game';
  import {
    getNodesByCategory,
    categoryLabels,
    categoryIcons,
    worldviewKnowledgeTree
  } from '../../data/worldview';
  import { getNodeUnlockHints } from '../../lib/worldview';
  import { playSFX } from '../../lib/audio';

  export let selectedNodeId: string | null;
  export let expandedCategories: Record<WorldviewCategory, boolean>;
  export let unlockedIds: string[];
  export let onSelect: (node: WorldviewNode) => void;
  export let onToggle: (cat: WorldviewCategory) => void;

  function getCategoryColor(cat: WorldviewCategory): string {
    switch (cat) {
      case 'creature': return '#66ddaa';
      case 'equipment': return '#66aaff';
      case 'mail': return '#ddaa66';
      case 'chronology': return '#aa88ff';
      default: return '#88aacc';
    }
  }

  function handleNodeClick(node: WorldviewNode) {
    if (!unlockedIds.includes(node.id)) {
      playSFX('warning');
      return;
    }
    playSFX('click');
    onSelect(node);
  }

  function handleToggle(cat: WorldviewCategory) {
    playSFX('click');
    onToggle(cat);
  }
</script>

<div class="tree-sidebar">
  {#each worldviewKnowledgeTree as branch}
    {@const cat = branch.category}
    {@const catNodes = getNodesByCategory(cat)}
    {@const unlockedCount = catNodes.filter(n => unlockedIds.includes(n.id)).length}
    <div class="tree-branch">
      <div class="branch-header" on:click={() => handleToggle(cat)}>
        <span class="branch-icon">{categoryIcons[cat]}</span>
        <span class="branch-title" style="color: {getCategoryColor(cat)}">
          {categoryLabels[cat]}
        </span>
        <span class="branch-count">{unlockedCount} / {catNodes.length}</span>
        <span class="branch-toggle">{expandedCategories[cat] ? '▼' : '▶'}</span>
      </div>
      {#if expandedCategories[cat]}
        <div class="branch-nodes">
          {#each catNodes as node}
            {@const unlocked = unlockedIds.includes(node.id)}
            <div 
              class="tree-node"
              class:unlocked={unlocked}
              class:selected={selectedNodeId === node.id}
              on:click={() => handleNodeClick(node)}
            >
              <span class="node-icon">{unlocked ? node.icon : '🔒'}</span>
              <div class="node-info">
                <span class="node-title">{unlocked ? node.title : '??? 未解锁'}</span>
                {#if unlocked}
                  <span class="node-summary">{node.summary.slice(0, 25)}...</span>
                {:else}
                  <span class="node-locked-hint">
                    {#each getNodeUnlockHints(node).slice(0, 1) as hint}
                      {hint}
                    {/each}
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .tree-sidebar {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tree-branch {
    margin-bottom: 4px;
  }

  .branch-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(15, 25, 50, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .branch-header:hover {
    background: rgba(25, 45, 75, 0.6);
    border-color: rgba(60, 130, 200, 0.3);
  }

  .branch-icon {
    font-size: 1rem;
    flex-shrink: 0;
  }

  .branch-title {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .branch-count {
    font-size: 0.72rem;
    color: #5a7a9a;
    font-family: 'Courier New', monospace;
    flex-shrink: 0;
  }

  .branch-toggle {
    font-size: 0.65rem;
    color: #5a7a9a;
    flex-shrink: 0;
  }

  .branch-nodes {
    padding: 8px 0 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(10, 20, 40, 0.4);
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0.5;
  }

  .tree-node.unlocked {
    opacity: 1;
  }

  .tree-node.unlocked:hover {
    background: rgba(30, 50, 85, 0.6);
    border-color: rgba(60, 130, 200, 0.25);
  }

  .tree-node.selected {
    background: rgba(60, 130, 200, 0.15);
    border-color: rgba(60, 130, 200, 0.4);
  }

  .node-icon {
    font-size: 1rem;
    flex-shrink: 0;
    width: 28px;
    text-align: center;
  }

  .node-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .node-title {
    font-size: 0.82rem;
    color: #b0c8e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .tree-node:not(.unlocked) .node-title {
    color: #5a7a9a;
  }

  .node-summary {
    font-size: 0.7rem;
    color: #6a8aaa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-locked-hint {
    font-size: 0.68rem;
    color: #a08060;
    font-family: 'Courier New', monospace;
  }
</style>

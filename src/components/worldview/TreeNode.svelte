<script lang="ts">
  import type { WorldviewNode, WorldviewCategory } from '../../types/game';
  import { categoryLabels, categoryIcons } from '../../data/worldview';
  import { getNodeUnlockHints } from '../../lib/worldview';

  export let node: WorldviewNode;
  export let level: number;
  export let isExpanded: (id: string) => boolean;
  export let unlockedIds: string[];
  export let selectedNodeId: string | null;
  export let onNodeClick: (node: WorldviewNode) => void;
  export let onNodeToggle: (e: Event, id: string) => void;
  export let getChildNodes: (id: string) => WorldviewNode[];
  export let getNodeColor: (node: WorldviewNode) => string;

  $: unlocked = unlockedIds.includes(node.id);
  $: selected = selectedNodeId === node.id;
  $: expanded = isExpanded(node.id);
  $: children = getChildNodes(node.id);
  $: hasKids = children.length > 0;
  $: nodeColor = getNodeColor(node);
  $: hints = getNodeUnlockHints(node).slice(0, 1);
  $: categoryIcon = getCategoryIcon(node.category);
  $: categoryLabel = getCategoryLabel(node.category);

  function getCategoryIcon(cat: string): string {
    return categoryIcons[cat as keyof typeof categoryIcons] || '📄';
  }

  function getCategoryLabel(cat: string): string {
    return categoryLabels[cat as keyof typeof categoryLabels] || '未分类';
  }

  function handleClick() {
    onNodeClick(node);
  }

  function handleToggle(e: Event) {
    e.stopPropagation();
    onNodeToggle(e, node.id);
  }
</script>

<div class="tree-node-wrapper">
  <div
    class="tree-node"
    class:unlocked={unlocked}
    class:selected={selected}
    style="padding-left: {12 + level * 18}px; border-left-color: {nodeColor};"
    on:click={handleClick}
  >
    {#if hasKids}
      <button class="expand-btn" on:click|stopPropagation={handleToggle}>
        {expanded ? '▼' : '▶'}
      </button>
    {:else}
      <span class="expand-placeholder"></span>
    {/if}

    <span class="node-icon">{unlocked ? node.icon : '🔒'}</span>

    <div class="node-info">
      <span class="node-title">{unlocked ? node.title : '??? 未解锁'}</span>
      {#if unlocked}
        <span class="node-category">
          {categoryIcon} {categoryLabel}
        </span>
      {:else}
        <span class="node-locked-hint">
          {#each hints as hint}
            {hint}
          {/each}
        </span>
      {/if}
    </div>
  </div>

  {#if expanded && hasKids}
    <div class="tree-children">
      {#each children as child}
        <svelte:self
          node={child}
          level={level + 1}
          {isExpanded}
          {unlockedIds}
          {selectedNodeId}
          {onNodeClick}
          {onNodeToggle}
          {getChildNodes}
          {getNodeColor}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .tree-node-wrapper {
    width: 100%;
  }

  .tree-node {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(10, 20, 40, 0.4);
    border: 1px solid transparent;
    border-left: 3px solid;
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
    border-right: 1px solid rgba(60, 130, 200, 0.2);
    border-top: 1px solid rgba(60, 130, 200, 0.2);
    border-bottom: 1px solid rgba(60, 130, 200, 0.2);
  }

  .tree-node.selected {
    background: rgba(60, 130, 200, 0.15);
    border-right: 1px solid rgba(60, 130, 200, 0.3);
    border-top: 1px solid rgba(60, 130, 200, 0.3);
    border-bottom: 1px solid rgba(60, 130, 200, 0.3);
  }

  .expand-btn {
    width: 18px;
    height: 18px;
    border: none;
    background: rgba(60, 130, 200, 0.15);
    color: #88aadd;
    border-radius: 3px;
    font-size: 0.55rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .expand-btn:hover {
    background: rgba(60, 130, 200, 0.3);
    color: #a0c0ff;
  }

  .expand-placeholder {
    width: 18px;
    flex-shrink: 0;
  }

  .node-icon {
    font-size: 0.95rem;
    flex-shrink: 0;
    width: 24px;
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
    font-size: 0.8rem;
    color: #b0c8e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .tree-node:not(.unlocked) .node-title {
    color: #5a7a9a;
  }

  .node-category {
    font-size: 0.65rem;
    color: #5a7a9a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .node-locked-hint {
    font-size: 0.65rem;
    color: #a08060;
    font-family: 'Courier New', monospace;
  }

  .tree-children {
    padding-left: 0;
  }
</style>

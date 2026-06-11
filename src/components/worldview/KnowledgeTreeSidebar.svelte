<script lang="ts">
  import type { WorldviewNode, WorldviewCategory } from '../../types/game';
  import {
    allWorldviewNodes,
    getNodeById,
    categoryLabels,
    categoryIcons,
    categoryColors,
    worldviewRootNodeIds,
  } from '../../data/worldview';
  import { playSFX } from '../../lib/audio';
  import TreeNode from './TreeNode.svelte';

  export let selectedNodeId: string | null;
  export let expandedNodeIds: string[];
  export let unlockedIds: string[];
  export let onSelect: (node: WorldviewNode) => void;
  export let onToggleExpand: (nodeId: string) => void;

  function getChildNodes(parentId: string): WorldviewNode[] {
    return allWorldviewNodes.filter(n => n.parentNodeId === parentId).sort((a, b) => a.order - b.order);
  }

  function isExpanded(nodeId: string): boolean {
    return expandedNodeIds.includes(nodeId);
  }

  function handleNodeClick(node: WorldviewNode) {
    if (!unlockedIds.includes(node.id)) {
      playSFX('warning');
      return;
    }
    playSFX('click');
    onSelect(node);
  }

  function handleNodeToggle(_e: Event, nodeId: string) {
    playSFX('click');
    onToggleExpand(nodeId);
  }

  function getNodeColor(node: WorldviewNode): string {
    const unlocked = unlockedIds.includes(node.id);
    if (!unlocked) return '#444';
    return categoryColors[node.category];
  }

  $: rootNodes = worldviewRootNodeIds.map(id => getNodeById(id)).filter(Boolean) as WorldviewNode[];
</script>

<div class="tree-sidebar">
  <div class="tree-title">
    <span class="tree-icon">🌳</span>
    <span>知识树</span>
  </div>

  <div class="tree-container">
    {#each rootNodes as rootNode}
      <div class="tree-level">
        <TreeNode
          node={rootNode}
          level={0}
          {isExpanded}
          {unlockedIds}
          {selectedNodeId}
          onNodeClick={handleNodeClick}
          onNodeToggle={handleNodeToggle}
          {getChildNodes}
          {getNodeColor}
        />
      </div>
    {/each}
  </div>

  <div class="tree-legend">
    <div class="legend-title">分类图例</div>
    <div class="legend-items">
      <div class="legend-item">
        <span class="legend-dot" style="background: {categoryColors.chronology}"></span>
        <span class="legend-label">{categoryIcons.chronology} 事件年表</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: {categoryColors.creature}"></span>
        <span class="legend-label">{categoryIcons.creature} 生物档案</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: {categoryColors.equipment}"></span>
        <span class="legend-label">{categoryIcons.equipment} 装备日志</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: {categoryColors.mail}"></span>
        <span class="legend-label">{categoryIcons.mail} 邮件往来</span>
      </div>
    </div>
  </div>
</div>

<style>
  .tree-sidebar {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    padding: 12px;
    gap: 12px;
  }

  .tree-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #c0d8f0;
    padding: 8px 12px;
    background: rgba(15, 30, 60, 0.5);
    border-radius: 6px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.2);
  }

  .tree-icon {
    font-size: 1.1rem;
  }

  .tree-container {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;
  }

  .tree-level {
    margin-bottom: 4px;
  }

  .tree-legend {
    padding: 10px 12px;
    background: rgba(8, 16, 32, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.1);
    border-radius: 6px;
  }

  .legend-title {
    font-size: 0.7rem;
    color: #5a7a9a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 8px;
  }

  .legend-items {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-label {
    font-size: 0.7rem;
    color: #7a9aba;
  }
</style>

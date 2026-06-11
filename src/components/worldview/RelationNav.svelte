<script lang="ts">
  import type { WorldviewNode } from '../../types/game';
  import {
    allWorldviewNodes,
    getNodeById,
    categoryLabels,
    categoryIcons,
    categoryColors,
  } from '../../data/worldview';
  import { playSFX } from '../../lib/audio';

  export let currentNode: WorldviewNode;
  export let unlockedIds: string[];
  export let onNavigate: (node: WorldviewNode) => void;

  function getParentNode(): WorldviewNode | undefined {
    if (!currentNode.parentNodeId) return undefined;
    return getNodeById(currentNode.parentNodeId);
  }

  function getChildNodes(): WorldviewNode[] {
    return allWorldviewNodes.filter(n => n.parentNodeId === currentNode.id)
      .sort((a, b) => a.order - b.order);
  }

  function getRelatedNodes(): WorldviewNode[] {
    if (!currentNode.relatedNodeIds || currentNode.relatedNodeIds.length === 0) return [];
    return currentNode.relatedNodeIds
      .map(id => getNodeById(id))
      .filter(Boolean) as WorldviewNode[];
  }

  function handleClick(node: WorldviewNode) {
    if (!unlockedIds.includes(node.id)) {
      playSFX('warning');
      return;
    }
    playSFX('switch');
    onNavigate(node);
  }

  function isUnlocked(node: WorldviewNode): boolean {
    return unlockedIds.includes(node.id);
  }

  $: parentNode = getParentNode();
  $: childNodes = getChildNodes();
  $: relatedNodes = getRelatedNodes();
  $: hasRelations = parentNode || childNodes.length > 0 || relatedNodes.length > 0;
</script>

{#if hasRelations}
  <div class="relations-panel">
    <div class="relations-title">
      <span class="title-icon">🔗</span>
      <span>关联导航</span>
    </div>

    {#if parentNode}
      <div class="relation-group">
        <div class="group-label">
          <span class="label-dot" style="background: {categoryColors[parentNode.category]}"></span>
          <span>上游 · 前因</span>
        </div>
        <div class="relation-item"
          class:unlocked={isUnlocked(parentNode)}
          on:click={() => handleClick(parentNode)}
        >
          <span class="item-icon">{isUnlocked(parentNode) ? parentNode.icon : '🔒'}</span>
          <div class="item-info">
            <span class="item-title">{isUnlocked(parentNode) ? parentNode.title : '??? 未解锁'}</span>
            <span class="item-cat">
              {categoryIcons[parentNode.category]} {categoryLabels[parentNode.category]}
            </span>
          </div>
          <span class="item-arrow">↑</span>
        </div>
      </div>
    {/if}

    {#if childNodes.length > 0}
      <div class="relation-group">
        <div class="group-label">
          <span class="label-dot" style="background: #66aaff"></span>
          <span>下游 · 分支</span>
          <span class="group-count">{childNodes.filter(n => isUnlocked(n)).length}/{childNodes.length}</span>
        </div>
        <div class="relation-list">
          {#each childNodes as child}
            <div class="relation-item"
              class:unlocked={isUnlocked(child)}
              on:click={() => handleClick(child)}
            >
              <span class="item-icon">{isUnlocked(child) ? child.icon : '🔒'}</span>
              <div class="item-info">
                <span class="item-title">{isUnlocked(child) ? child.title : '??? 未解锁'}</span>
                <span class="item-cat">
                  {categoryIcons[child.category]} {categoryLabels[child.category]}
                </span>
              </div>
              <span class="item-arrow">→</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    {#if relatedNodes.length > 0}
      <div class="relation-group">
        <div class="group-label">
          <span class="label-dot" style="background: #ddaa66"></span>
          <span>横向 · 关联</span>
          <span class="group-count">{relatedNodes.filter(n => isUnlocked(n)).length}/{relatedNodes.length}</span>
        </div>
        <div class="relation-list">
          {#each relatedNodes as rel}
            <div class="relation-item"
              class:unlocked={isUnlocked(rel)}
              on:click={() => handleClick(rel)}
            >
              <span class="item-icon">{isUnlocked(rel) ? rel.icon : '🔒'}</span>
              <div class="item-info">
                <span class="item-title">{isUnlocked(rel) ? rel.title : '??? 未解锁'}</span>
                <span class="item-cat">
                  {categoryIcons[rel.category]} {categoryLabels[rel.category]}
                </span>
              </div>
              <span class="item-arrow">↔</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .relations-panel {
    margin-top: 24px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(15, 30, 60, 0.7), rgba(10, 20, 45, 0.8));
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 10px;
  }

  .relations-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    color: #66aaff;
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(100, 170, 255, 0.15);
  }

  .title-icon {
    font-size: 1rem;
  }

  .relation-group {
    margin-bottom: 14px;
  }

  .relation-group:last-child {
    margin-bottom: 0;
  }

  .group-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: #7a9aba;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .label-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .group-count {
    margin-left: auto;
    font-size: 0.7rem;
    color: #5a7a9a;
    font-family: 'Courier New', monospace;
    text-transform: none;
    letter-spacing: 0;
  }

  .relation-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .relation-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(10, 20, 40, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0.5;
  }

  .relation-item.unlocked {
    opacity: 1;
  }

  .relation-item.unlocked:hover {
    background: rgba(30, 50, 85, 0.6);
    border-color: rgba(100, 170, 255, 0.3);
    transform: translateX(4px);
  }

  .item-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    width: 28px;
    text-align: center;
  }

  .item-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-title {
    font-size: 0.82rem;
    color: #b0c8e0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .relation-item:not(.unlocked) .item-title {
    color: #5a7a9a;
  }

  .item-cat {
    font-size: 0.68rem;
    color: #5a7a9a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-arrow {
    font-size: 0.75rem;
    color: #5a7a9a;
    flex-shrink: 0;
  }

  .relation-item.unlocked:hover .item-arrow {
    color: #88aadd;
  }
</style>

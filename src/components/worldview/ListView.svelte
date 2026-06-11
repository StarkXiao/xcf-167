<script lang="ts">
  import type { WorldviewNode, WorldviewCategory } from '../../types/game';
  import { getNodeUnlockHints } from '../../lib/worldview';
  import { categoryLabels, categoryIcons } from '../../data/worldview';
  import { playSFX } from '../../lib/audio';

  export let category: WorldviewCategory;
  export let nodes: WorldviewNode[];
  export let unlockedIds: string[];
  export let onSelect: (node: WorldviewNode) => void;
  export let getColor: (cat: WorldviewCategory) => string;

  function handleClick(node: WorldviewNode) {
    if (!unlockedIds.includes(node.id)) {
      playSFX('warning');
      return;
    }
    onSelect(node);
  }
</script>

<div class="list-view">
  <div class="list-header">
    <h3 class="category-title" style="color: {getColor(category)}">
      {categoryIcons[category]} {categoryLabels[category]}
    </h3>
    <span class="list-count">{nodes.filter(n => unlockedIds.includes(n.id)).length} / {nodes.length} 已解锁</span>
  </div>

  <div class="nodes-grid">
    {#each nodes as node}
      {@const unlocked = unlockedIds.includes(node.id)}
      <div 
        class="node-card"
        class:unlocked={unlocked}
        style="border-left-color: {unlocked ? getColor(node.category) : '#333'};"
        on:click={() => handleClick(node)}
      >
        <div class="card-icon">{unlocked ? node.icon : '🔒'}</div>
        <div class="card-content">
          <h4 class="card-title">
            {#if unlocked}
              {node.title}
              {#if node.subtitle}
                <span class="card-subtitle"> · {node.subtitle}</span>
              {/if}
            {:else}
              ??? 未解锁
            {/if}
          </h4>
          {#if unlocked}
            <p class="card-summary">{node.summary}</p>
            {#if node.tags && node.tags.length > 0}
              <div class="card-tags">
                {#each node.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          {:else}
            <div class="card-lock-hint">
              {#each getNodeUnlockHints(node) as hint}
                <span class="lock-hint">{hint}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/each}
    {#if nodes.length === 0}
      <div class="empty-state">
        <p>暂无匹配的条目</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .list-view {
    padding: 24px 28px;
    height: 100%;
    overflow-y: auto;
  }

  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .category-title {
    font-size: 1.2rem;
    margin: 0;
    font-weight: 600;
  }

  .list-count {
    font-size: 0.8rem;
    color: #6a8aaa;
    font-family: 'Courier New', monospace;
  }

  .nodes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 14px;
  }

  .node-card {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(15, 25, 50, 0.9), rgba(10, 18, 38, 0.95));
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-left: 4px solid #333;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.25s;
    opacity: 0.6;
  }

  .node-card.unlocked {
    opacity: 1;
  }

  .node-card.unlocked:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(60, 130, 200, 0.1);
    border-color: rgba(60, 130, 200, 0.4);
  }

  .card-icon {
    font-size: 1.8rem;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(40, 70, 120, 0.3);
    border-radius: 8px;
  }

  .card-content {
    flex: 1;
    min-width: 0;
  }

  .card-title {
    font-size: 1rem;
    color: #c0d8f0;
    margin: 0 0 6px 0;
    font-weight: 600;
  }

  .card-subtitle {
    font-size: 0.75rem;
    color: #6a8aaa;
    font-weight: 400;
    font-family: 'Courier New', monospace;
  }

  .node-card:not(.unlocked) .card-title {
    color: #5a7a9a;
  }

  .card-summary {
    font-size: 0.8rem;
    color: #8098b0;
    line-height: 1.5;
    margin: 0 0 8px 0;
  }

  .card-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 0.68rem;
    padding: 2px 8px;
    background: rgba(60, 130, 200, 0.15);
    color: #7090b0;
    border-radius: 4px;
  }

  .card-lock-hint {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .lock-hint {
    font-size: 0.7rem;
    padding: 3px 8px;
    background: rgba(255, 150, 80, 0.1);
    color: #c0a070;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: #506880;
  }

  @media (max-width: 700px) {
    .list-view { padding: 16px; }
    .nodes-grid { grid-template-columns: 1fr; }
  }
</style>

<script lang="ts">
  import type { ChronologyEvent } from '../../types/game';
  import { getNodeUnlockHints } from '../../lib/worldview';
  import { playSFX } from '../../lib/audio';

  export let nodes: ChronologyEvent[];
  export let unlockedIds: string[];
  export let onSelect: (node: ChronologyEvent) => void;

  function handleClick(node: ChronologyEvent) {
    if (!unlockedIds.includes(node.id)) {
      playSFX('warning');
      return;
    }
    onSelect(node);
  }

  function getEventTypeLabel(type: string): string {
    switch (type) {
      case 'incident': return '事故';
      case 'research': return '研究';
      case 'operation': return '行动';
      case 'discovery': return '发现';
      case 'classified': return '机密';
      default: return '未知';
    }
  }

  function getEventTypeColor(type: string): string {
    switch (type) {
      case 'incident': return '#dd4444';
      case 'research': return '#66aaff';
      case 'operation': return '#66ddaa';
      case 'discovery': return '#ddaa66';
      case 'classified': return '#aa44aa';
      default: return '#888';
    }
  }
</script>

<div class="chronology-view">
  <div class="view-header">
    <h3 class="category-title">📅 事件年表</h3>
    <span class="list-count">{nodes.filter(n => unlockedIds.includes(n.id)).length} / {nodes.length} 已解锁</span>
  </div>

  <div class="timeline">
    {#each nodes as node}
      {@const unlocked = unlockedIds.includes(node.id)}
      {@const color = getEventTypeColor(node.eventType)}
      <div 
        class="timeline-item"
        class:unlocked={unlocked}
        on:click={() => handleClick(node)}
      >
        <div class="timeline-marker">
          <div class="marker-dot" style="background: {unlocked ? color : '#333'}; border-color: {unlocked ? color + '80' : '#444'};">
            {#if unlocked}
              {node.icon}
            {:else}
              🔒
            {/if}
          </div>
        </div>
        <div class="timeline-line" style="background: {unlocked ? color + '40' : '#222'};"></div>
        <div class="timeline-content" style="border-left-color: {unlocked ? color : '#333'};">
          <div class="timeline-head">
            <span class="event-type" style="background: {color}20; color: {color}; border-color: {color}60;">
              {getEventTypeLabel(node.eventType)}
            </span>
            <span class="event-date">{node.eventDate}</span>
          </div>
          <h4 class="event-title">
            {#if unlocked}
              {node.title}
            {:else}
              ??? 未解锁
            {/if}
          </h4>
          {#if unlocked}
            <p class="event-summary">{node.summary}</p>
            {#if node.location || node.depth}
              <div class="event-meta">
                {#if node.location}
                  <span class="meta-tag">📍 {node.location}</span>
                {/if}
                {#if node.depth}
                  <span class="meta-tag">⬇️ {node.depth}</span>
                {/if}
              </div>
            {/if}
            {#if node.tags && node.tags.length > 0}
              <div class="event-tags">
                {#each node.tags.slice(0, 3) as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          {:else}
            <div class="lock-hints">
              {#each getNodeUnlockHints(node) as hint}
                <span class="lock-hint">{hint}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .chronology-view {
    padding: 24px 28px;
    height: 100%;
    overflow-y: auto;
  }

  .view-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .category-title {
    font-size: 1.2rem;
    color: #aa88ff;
    margin: 0;
    font-weight: 600;
  }

  .list-count {
    font-size: 0.8rem;
    color: #6a8aaa;
    font-family: 'Courier New', monospace;
  }

  .timeline {
    position: relative;
    padding-left: 60px;
  }

  .timeline-item {
    position: relative;
    padding-bottom: 24px;
    cursor: pointer;
    transition: all 0.25s;
  }

  .timeline-item:not(.unlocked) {
    opacity: 0.5;
  }

  .timeline-item.unlocked:hover .timeline-content {
    transform: translateX(6px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  .timeline-marker {
    position: absolute;
    left: -60px;
    top: 4px;
    z-index: 2;
  }

  .marker-dot {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    border: 2px solid;
    background: #0a1428;
    transition: all 0.25s;
  }

  .timeline-item.unlocked:hover .marker-dot {
    transform: scale(1.1);
    box-shadow: 0 0 15px currentColor;
  }

  .timeline-line {
    position: absolute;
    left: -41px;
    top: 44px;
    bottom: 0;
    width: 2px;
  }

  .timeline-item:last-child .timeline-line {
    display: none;
  }

  .timeline-content {
    padding: 14px 18px;
    background: linear-gradient(135deg, rgba(15, 25, 50, 0.9), rgba(10, 18, 38, 0.95));
    border: 1px solid rgba(170, 136, 255, 0.2);
    border-left: 4px solid;
    border-radius: 8px;
    transition: all 0.25s;
  }

  .timeline-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 10px;
    flex-wrap: wrap;
  }

  .event-type {
    font-size: 0.7rem;
    padding: 3px 10px;
    border-radius: 4px;
    font-weight: 600;
    border: 1px solid;
    letter-spacing: 0.05em;
  }

  .event-date {
    font-size: 0.8rem;
    color: #aa88ff;
    font-family: 'Courier New', monospace;
  }

  .event-title {
    font-size: 1.05rem;
    color: #c0d8f0;
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  .timeline-item:not(.unlocked) .event-title {
    color: #5a7a9a;
  }

  .event-summary {
    font-size: 0.82rem;
    color: #8098b0;
    line-height: 1.6;
    margin: 0 0 10px 0;
  }

  .event-meta {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .meta-tag {
    font-size: 0.72rem;
    padding: 3px 8px;
    background: rgba(60, 130, 200, 0.1);
    color: #7090b0;
    border-radius: 4px;
  }

  .event-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tag {
    font-size: 0.68rem;
    padding: 2px 8px;
    background: rgba(170, 136, 255, 0.1);
    color: #8a7aaa;
    border-radius: 4px;
  }

  .lock-hints {
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

  @media (max-width: 700px) {
    .chronology-view { padding: 16px; }
    .timeline { padding-left: 48px; }
    .timeline-marker { left: -48px; }
    .marker-dot { width: 32px; height: 32px; font-size: 0.9rem; }
    .timeline-line { left: -33px; }
  }
</style>

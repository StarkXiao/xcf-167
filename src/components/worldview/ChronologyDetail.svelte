<script lang="ts">
  import type { ChronologyEvent } from '../../types/game';
  import { playSFX } from '../../lib/audio';
  import RelationNav from './RelationNav.svelte';

  export let node: ChronologyEvent;
  export let onBack: () => void;
  export let unlockedIds: string[] = [];
  export let onNavigate: (node: any) => void = () => {};

  function handleBack() {
    playSFX('click');
    onBack();
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

  $: contentLines = node.content.split('\n').map(line => line.trim()).filter(Boolean);
</script>

<div class="detail-view">
  <button class="back-btn" on:click={handleBack}>← 返回时间轴</button>

  <div class="detail-header">
    <div class="detail-icon">{node.icon}</div>
    <div class="detail-title-wrap">
      <h2 class="detail-title">{node.title}</h2>
      <span class="detail-date">
        {node.eventDate}
        {#if node.eventTime}
          {' '}· {node.eventTime}
        {/if}
      </span>
    </div>
    <span class="type-badge" style="background: {getEventTypeColor(node.eventType)}20; color: {getEventTypeColor(node.eventType)}; border-color: {getEventTypeColor(node.eventType)}60;">
      {getEventTypeLabel(node.eventType)}
    </span>
  </div>

  <div class="detail-meta">
    {#if node.location}
      <div class="meta-item">
        <span class="meta-label">📍 地点</span>
        <span class="meta-value">{node.location}</span>
      </div>
    {/if}
    {#if node.depth}
      <div class="meta-item">
        <span class="meta-label">⬇️ 深度</span>
        <span class="meta-value">{node.depth}</span>
      </div>
    {/if}
  </div>

  {#if node.involvedParties && node.involvedParties.length > 0}
    <div class="detail-section">
      <h3 class="section-title">👥 涉及方</h3>
      <div class="parties-row">
        {#each node.involvedParties as party}
          <span class="party-tag">{party}</span>
        {/each}
      </div>
    </div>
  {/if}

  <div class="detail-section">
    <h3 class="section-title">📝 事件摘要</h3>
    <p class="section-text">{node.summary}</p>
  </div>

  <div class="detail-section">
    <h3 class="section-title">📖 详细经过</h3>
    <div class="section-content">
      {#each contentLines as line}
        <p class="content-paragraph">{line}</p>
      {/each}
    </div>
  </div>

  {#if node.consequence}
    <div class="detail-section consequence">
      <h3 class="section-title">⚠️ 后续影响</h3>
      <p class="section-text consequence-text">{node.consequence}</p>
    </div>
  {/if}

  {#if node.tags && node.tags.length > 0}
    <div class="detail-section">
      <h3 class="section-title">🏷️ 标签</h3>
      <div class="tags-row">
        {#each node.tags as tag}
          <span class="event-tag">{tag}</span>
        {/each}
      </div>
    </div>
  {/if}

  <RelationNav currentNode={node} {unlockedIds} onNavigate={onNavigate} />
</div>

<style>
  .detail-view {
    padding: 24px 28px;
    height: 100%;
    overflow-y: auto;
    animation: fadeIn 0.3s ease-out;
  }

  .back-btn {
    padding: 8px 16px;
    background: rgba(30, 50, 80, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #90c0e0;
    font-size: 0.85rem;
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.2s;
  }

  .back-btn:hover { background: rgba(40, 70, 110, 0.8); }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .detail-icon {
    font-size: 3rem;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(170, 136, 255, 0.15), rgba(140, 100, 220, 0.08));
    border: 1px solid rgba(170, 136, 255, 0.25);
    border-radius: 12px;
    flex-shrink: 0;
  }

  .detail-title-wrap {
    flex: 1;
    min-width: 200px;
  }

  .detail-title {
    font-size: 1.6rem;
    color: #c0d8f0;
    margin: 0 0 4px 0;
    font-weight: 700;
  }

  .detail-date {
    font-size: 0.85rem;
    color: #aa88ff;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
  }

  .type-badge {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }

  .detail-meta {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    padding: 16px;
    background: rgba(15, 30, 55, 0.6);
    border: 1px solid rgba(170, 136, 255, 0.2);
    border-radius: 10px;
    margin-bottom: 24px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .meta-label {
    font-size: 0.82rem;
    color: #7a8aaa;
  }

  .meta-value {
    font-size: 0.9rem;
    color: #c0d8f0;
    font-family: 'Courier New', monospace;
  }

  .detail-section {
    margin-bottom: 24px;
  }

  .detail-section.consequence {
    padding: 16px;
    background: rgba(80, 20, 20, 0.2);
    border: 1px solid rgba(255, 100, 100, 0.2);
    border-radius: 8px;
  }

  .section-title {
    font-size: 0.95rem;
    color: #aa88ff;
    margin: 0 0 10px 0;
    font-weight: 600;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(170, 136, 255, 0.2);
  }

  .consequence .section-title {
    color: #ff8888;
    border-bottom-color: rgba(255, 100, 100, 0.2);
  }

  .section-text {
    font-size: 0.88rem;
    color: #a0b8d0;
    line-height: 1.8;
  }

  .consequence-text {
    color: #ffa0a0;
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .content-paragraph {
    font-size: 0.88rem;
    color: #a0b8d0;
    line-height: 1.8;
    margin: 0;
    padding: 10px 14px;
    background: rgba(10, 20, 40, 0.5);
    border-left: 3px solid rgba(170, 136, 255, 0.3);
    border-radius: 4px;
  }

  .parties-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .party-tag {
    font-size: 0.8rem;
    padding: 5px 12px;
    background: rgba(170, 136, 255, 0.1);
    color: #c0aaff;
    border: 1px solid rgba(170, 136, 255, 0.2);
    border-radius: 6px;
  }

  .tags-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .event-tag {
    font-size: 0.75rem;
    padding: 4px 12px;
    background: rgba(170, 136, 255, 0.1);
    color: #aa99cc;
    border: 1px solid rgba(170, 136, 255, 0.2);
    border-radius: 4px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 700px) {
    .detail-view { padding: 16px; }
    .detail-icon { width: 60px; height: 60px; font-size: 2rem; }
    .detail-title { font-size: 1.25rem; }
  }
</style>

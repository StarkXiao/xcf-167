<script lang="ts">
  import type { EquipmentLog } from '../../types/game';
  import { playSFX } from '../../lib/audio';
  import RelationNav from './RelationNav.svelte';

  export let node: EquipmentLog;
  export let onBack: () => void;
  export let unlockedIds: string[] = [];
  export let onNavigate: (node: any) => void = () => {};

  function handleBack() {
    playSFX('click');
    onBack();
  }

  function getStatusLabel(status?: string): string {
    switch (status) {
      case 'active': return '运行中';
      case 'destroyed': return '已损毁';
      case 'retired': return '已退役';
      case 'classified': return '机密';
      default: return '未知';
    }
  }

  function getStatusColor(status?: string): string {
    switch (status) {
      case 'active': return '#66dd88';
      case 'destroyed': return '#dd4444';
      case 'retired': return '#888';
      case 'classified': return '#dd7744';
      default: return '#888';
    }
  }

  $: contentLines = node.content.split('\n').map(line => line.trim()).filter(Boolean);
</script>

<div class="detail-view">
  <button class="back-btn" on:click={handleBack}>← 返回列表</button>

  <div class="detail-header">
    <div class="detail-icon">{node.icon}</div>
    <div class="detail-title-wrap">
      <h2 class="detail-title">{node.title}</h2>
      {#if node.subtitle}
        <span class="detail-subtitle">{node.subtitle}</span>
      {/if}
    </div>
    <div class="detail-badges">
      {#if node.status}
        <span class="badge" style="background: {getStatusColor(node.status)}20; color: {getStatusColor(node.status)}; border-color: {getStatusColor(node.status)}60;">
          {getStatusLabel(node.status)}
        </span>
      {/if}
    </div>
  </div>

  <div class="detail-meta">
    {#if node.model}
      <div class="meta-item">
        <span class="meta-label">型号</span>
        <span class="meta-value">{node.model}</span>
      </div>
    {/if}
    {#if node.manufacturer}
      <div class="meta-item">
        <span class="meta-label">制造商</span>
        <span class="meta-value">{node.manufacturer}</span>
      </div>
    {/if}
    {#if node.deployDate}
      <div class="meta-item">
        <span class="meta-label">部署日期</span>
        <span class="meta-value">{node.deployDate}</span>
      </div>
    {/if}
  </div>

  <div class="detail-section">
    <h3 class="section-title">📝 摘要</h3>
    <p class="section-text">{node.summary}</p>
  </div>

  <div class="detail-section">
    <h3 class="section-title">📖 详细说明</h3>
    <div class="section-content">
      {#each contentLines as line}
        <p class="content-paragraph">{line}</p>
      {/each}
    </div>
  </div>

  {#if node.specs && Object.keys(node.specs).length > 0}
    <div class="detail-section">
      <h3 class="section-title">📊 技术参数</h3>
      <div class="specs-grid">
        {#each Object.entries(node.specs) as [key, value]}
          <div class="spec-item">
            <span class="spec-key">{key}</span>
            <span class="spec-value">{value}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if node.maintenanceLogs && node.maintenanceLogs.length > 0}
    <div class="detail-section">
      <h3 class="section-title">🔧 维护记录</h3>
      <div class="logs-list">
        {#each node.maintenanceLogs as log}
          <div class="log-item">
            <span class="log-date">{log.date}</span>
            <span class="log-entry">{log.entry}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if node.tags && node.tags.length > 0}
    <div class="detail-section">
      <h3 class="section-title">🏷️ 标签</h3>
      <div class="tags-row">
        {#each node.tags as tag}
          <span class="detail-tag">{tag}</span>
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
    background: linear-gradient(135deg, rgba(100, 170, 255, 0.15), rgba(60, 130, 220, 0.08));
    border: 1px solid rgba(100, 170, 255, 0.25);
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

  .detail-subtitle {
    font-size: 0.85rem;
    color: #66aaff;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
  }

  .detail-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .badge {
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
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 10px;
    margin-bottom: 24px;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .meta-label {
    font-size: 0.7rem;
    color: #5a8aaa;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .meta-value {
    font-size: 0.95rem;
    color: #c0d8f0;
    font-family: 'Courier New', monospace;
  }

  .detail-section {
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 0.95rem;
    color: #66aaff;
    margin: 0 0 10px 0;
    font-weight: 600;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(100, 170, 255, 0.2);
  }

  .section-text {
    font-size: 0.88rem;
    color: #a0b8d0;
    line-height: 1.8;
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
    border-left: 3px solid rgba(100, 170, 255, 0.3);
    border-radius: 4px;
  }

  .specs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
  }

  .spec-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(15, 30, 55, 0.5);
    border: 1px solid rgba(100, 170, 255, 0.15);
    border-radius: 6px;
    gap: 12px;
  }

  .spec-key {
    font-size: 0.78rem;
    color: #6a8aaa;
  }

  .spec-value {
    font-size: 0.82rem;
    color: #c0d8f0;
    font-family: 'Courier New', monospace;
    text-align: right;
  }

  .logs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .log-item {
    display: flex;
    gap: 14px;
    padding: 10px 14px;
    background: rgba(15, 30, 55, 0.5);
    border-left: 3px solid rgba(100, 170, 255, 0.3);
    border-radius: 4px;
  }

  .log-date {
    font-size: 0.75rem;
    color: #66aaff;
    font-family: 'Courier New', monospace;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .log-entry {
    font-size: 0.82rem;
    color: #a0b8d0;
    line-height: 1.6;
  }

  .tags-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .detail-tag {
    font-size: 0.75rem;
    padding: 4px 12px;
    background: rgba(100, 170, 255, 0.1);
    color: #88aadd;
    border: 1px solid rgba(100, 170, 255, 0.2);
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
    .specs-grid { grid-template-columns: 1fr; }
  }
</style>

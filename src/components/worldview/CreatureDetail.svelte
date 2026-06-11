<script lang="ts">
  import type { CreatureProfile } from '../../types/game';
  import { playSFX } from '../../lib/audio';
  import RelationNav from './RelationNav.svelte';

  export let node: CreatureProfile;
  export let onBack: () => void;
  export let unlockedIds: string[] = [];
  export let onNavigate: (node: any) => void = () => {};

  function handleBack() {
    playSFX('click');
    onBack();
  }

  function getThreatColor(level: number): string {
    if (level <= 1) return '#66dd88';
    if (level <= 2) return '#ccdd66';
    if (level <= 3) return '#ddaa44';
    if (level <= 4) return '#dd7744';
    return '#dd4444';
  }

  function getClassificationLabel(cls?: string): string {
    switch (cls) {
      case 'biological': return '生物';
      case 'artificial': return '人造';
      case 'hybrid': return '混合';
      case 'unknown': return '未知';
      default: return '未分类';
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
      {#if node.classification}
        <span class="badge badge-class">{getClassificationLabel(node.classification)}</span>
      {/if}
      {#if node.threatLevel}
        <span class="badge badge-threat" style="background: {getThreatColor(node.threatLevel)}30; color: {getThreatColor(node.threatLevel)}; border-color: {getThreatColor(node.threatLevel)}60;">
          威胁等级 {'●'.repeat(node.threatLevel)}
        </span>
      {/if}
    </div>
  </div>

  <div class="detail-meta">
    {#if node.scientificName}
      <div class="meta-item">
        <span class="meta-label">学名</span>
        <span class="meta-value">{node.scientificName}</span>
      </div>
    {/if}
    {#if node.depthRange}
      <div class="meta-item">
        <span class="meta-label">活动深度</span>
        <span class="meta-value">{node.depthRange}</span>
      </div>
    {/if}
    {#if node.firstSighted}
      <div class="meta-item">
        <span class="meta-label">首次观测</span>
        <span class="meta-value">{node.firstSighted}</span>
      </div>
    {/if}
  </div>

  <div class="detail-section">
    <h3 class="section-title">📝 摘要</h3>
    <p class="section-text">{node.summary}</p>
  </div>

  <div class="detail-section">
    <h3 class="section-title">📖 详细档案</h3>
    <div class="section-content">
      {#each contentLines as line}
        <p class="content-paragraph">{line}</p>
      {/each}
    </div>
  </div>

  {#if node.physicalDescription}
    <div class="detail-section">
      <h3 class="section-title">🔬 形态描述</h3>
      <p class="section-text">{node.physicalDescription}</p>
    </div>
  {/if}

  {#if node.behavioralNotes}
    <div class="detail-section">
      <h3 class="section-title">🧠 行为记录</h3>
      <p class="section-text">{node.behavioralNotes}</p>
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
    background: linear-gradient(135deg, rgba(100, 220, 170, 0.15), rgba(60, 180, 140, 0.08));
    border: 1px solid rgba(100, 220, 170, 0.25);
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
    color: #66ddaa;
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

  .badge-class {
    background: rgba(100, 220, 170, 0.15);
    color: #66ddaa;
    border-color: rgba(100, 220, 170, 0.3);
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
    color: #66ddaa;
    margin: 0 0 10px 0;
    font-weight: 600;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(100, 220, 170, 0.2);
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
    border-left: 3px solid rgba(100, 220, 170, 0.3);
    border-radius: 4px;
  }

  .tags-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .detail-tag {
    font-size: 0.75rem;
    padding: 4px 12px;
    background: rgba(100, 220, 170, 0.1);
    color: #88ccaa;
    border: 1px solid rgba(100, 220, 170, 0.2);
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
    .detail-meta { gap: 16px; }
  }
</style>

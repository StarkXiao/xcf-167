<script lang="ts">
  import { evidenceCards } from '../data/evidence';
  import { caseFiles, getCaseById } from '../data/archive';
  import { playSFX } from '../lib/audio';
  import type { EvidenceCard, EvidenceType } from '../types/game';

  let filterType: EvidenceType | 'all' = 'all';
  let filterTag: string | null = null;
  let searchQuery = '';
  let filterCaseId = '';
  let selectedEvidence: EvidenceCard | null = null;
  let sortBy: 'importance' | 'type' | 'collected' = 'importance';

  const allTags = [...new Set(evidenceCards.flatMap(e => e.tags))].sort();

  $: filtered = evidenceCards.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (filterTag && !e.tags.includes(filterTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.title.toLowerCase().includes(q) && !e.content.toLowerCase().includes(q) && !(e.username || '').toLowerCase().includes(q) && !(e.speaker || '').toLowerCase().includes(q)) return false;
    }
    if (filterCaseId) {
      const c = getCaseById(filterCaseId);
      if (c && !c.evidenceIds.includes(e.id)) return false;
    }
    return true;
  });

  $: sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'importance') return b.importance - a.importance;
    if (sortBy === 'type') return a.type.localeCompare(b.type);
    return b.collectedAt - a.collectedAt;
  });

  function getTypeLabel(t: EvidenceType): string {
    switch (t) {
      case 'danmaku': return '弹幕';
      case 'dialogue': return '台词';
      case 'sfx': return '声效';
      default: return t;
    }
  }

  function getTypeIcon(t: EvidenceType): string {
    switch (t) {
      case 'danmaku': return '💬';
      case 'dialogue': return '🗣';
      case 'sfx': return '🔊';
      default: return '📄';
    }
  }

  function handleEvidenceClick(e: EvidenceCard) {
    playSFX('click');
    selectedEvidence = selectedEvidence?.id === e.id ? null : e;
  }

  function getImportanceStars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }
</script>

<div class="evidence-view">
  <div class="ev-sidebar">
    <div class="ev-filter-section">
      <h4 class="ev-filter-label">证据类型</h4>
      <div class="ev-type-btns">
        <button class="type-btn" class:active={filterType === 'all'} on:click={() => { playSFX('click'); filterType = 'all'; }}>全部</button>
        <button class="type-btn" class:active={filterType === 'danmaku'} on:click={() => { playSFX('click'); filterType = 'danmaku'; }}>💬 弹幕</button>
        <button class="type-btn" class:active={filterType === 'dialogue'} on:click={() => { playSFX('click'); filterType = 'dialogue'; }}>🗣 台词</button>
        <button class="type-btn" class:active={filterType === 'sfx'} on:click={() => { playSFX('click'); filterType = 'sfx'; }}>🔊 声效</button>
      </div>
    </div>
    <div class="ev-filter-section">
      <h4 class="ev-filter-label">关联案件</h4>
      <select class="ev-select" bind:value={filterCaseId}>
        <option value="">全部案件</option>
        {#each caseFiles as c (c.id)}
          <option value={c.id}>{c.designation}</option>
        {/each}
      </select>
    </div>
    <div class="ev-filter-section">
      <h4 class="ev-filter-label">标签筛选</h4>
      <div class="ev-tag-cloud">
        <button class="ev-tag-btn" class:active={filterTag === null} on:click={() => { playSFX('click'); filterTag = null; }}>全部</button>
        {#each allTags as tag}
          <button class="ev-tag-btn" class:active={filterTag === tag} on:click={() => { playSFX('click'); filterTag = filterTag === tag ? null : tag; }}>{tag}</button>
        {/each}
      </div>
    </div>
    <div class="ev-filter-section">
      <h4 class="ev-filter-label">排序</h4>
      <div class="ev-sort-btns">
        <button class="sort-btn" class:active={sortBy === 'importance'} on:click={() => { sortBy = 'importance'; }}>重要性</button>
        <button class="sort-btn" class:active={sortBy === 'type'} on:click={() => { sortBy = 'type'; }}>类型</button>
        <button class="sort-btn" class:active={sortBy === 'collected'} on:click={() => { sortBy = 'collected'; }}>时间</button>
      </div>
    </div>
    <div class="ev-stats">
      <span class="ev-stat">共 {evidenceCards.length} 条证据</span>
      <span class="ev-stat">筛选 {sorted.length} 条</span>
    </div>
  </div>

  <div class="ev-main">
    <div class="ev-search-bar">
      <input
        type="text"
        class="ev-search"
        placeholder="搜索证据标题、内容、发送者..."
        bind:value={searchQuery}
      />
    </div>

    <div class="ev-grid">
      {#each sorted as ev (ev.id)}
        <div
          class="ev-card"
          class:selected={selectedEvidence?.id === ev.id}
          on:click={() => handleEvidenceClick(ev)}
          style="border-left: 4px solid {ev.color || '#64b5f6'};"
        >
          <div class="ev-card-top">
            <span class="ev-type-badge">{getTypeIcon(ev.type)} {getTypeLabel(ev.type)}</span>
            <span class="ev-importance">{getImportanceStars(ev.importance)}</span>
          </div>
          <h5 class="ev-card-title">{ev.title}</h5>
          <p class="ev-card-content">{ev.content.length > 60 ? ev.content.slice(0, 60) + '...' : ev.content}</p>
          <div class="ev-card-meta">
            {#if ev.username}
              <span class="ev-who">👤 {ev.username}</span>
            {/if}
            {#if ev.speaker}
              <span class="ev-who">🗣 {ev.speaker}</span>
            {/if}
          </div>
          <div class="ev-card-tags">
            {#each ev.tags.slice(0, 4) as t}
              <span class="ev-mini-tag" class:hl={filterTag === t}>{t}</span>
            {/each}
          </div>
        </div>
      {/each}
      {#if sorted.length === 0}
        <div class="ev-empty">
          <p>无匹配的证据记录</p>
        </div>
      {/if}
    </div>

    {#if selectedEvidence}
      <div class="ev-detail-panel">
        <div class="ev-detail-header">
          <div class="ev-detail-type" style="border-left: 4px solid {selectedEvidence.color || '#64b5f6'};">
            {getTypeIcon(selectedEvidence.type)} {getTypeLabel(selectedEvidence.type)}
          </div>
          <button class="ev-detail-close" on:click={() => { selectedEvidence = null; playSFX('click'); }}>✕</button>
        </div>
        <h4 class="ev-detail-title">{selectedEvidence.title}</h4>
        <p class="ev-detail-content">{selectedEvidence.content}</p>
        <div class="ev-detail-meta">
          {#if selectedEvidence.username}
            <div class="meta-row"><span class="meta-label">发送者</span><span class="meta-value">{selectedEvidence.username}</span></div>
          {/if}
          {#if selectedEvidence.speaker}
            <div class="meta-row"><span class="meta-label">说话人</span><span class="meta-value">{selectedEvidence.speaker}</span></div>
          {/if}
          {#if selectedEvidence.sfxType}
            <div class="meta-row"><span class="meta-label">声效类型</span><span class="meta-value">{selectedEvidence.sfxType}</span></div>
          {/if}
          {#if selectedEvidence.sourceNodeId}
            <div class="meta-row"><span class="meta-label">来源节点</span><span class="meta-value">{selectedEvidence.sourceNodeId}</span></div>
          {/if}
          <div class="meta-row"><span class="meta-label">重要性</span><span class="meta-value importance">{getImportanceStars(selectedEvidence.importance)}</span></div>
        </div>
        <div class="ev-detail-tags">
          <span class="meta-label">标签</span>
          <div class="detail-tag-list">
            {#each selectedEvidence.tags as t}
              <span class="detail-tag" class:hl={filterTag === t} on:click={() => { filterTag = t; playSFX('click'); }}>{t}</span>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .evidence-view {
    display: flex;
    height: 100%;
    overflow: hidden;
  }

  .ev-sidebar {
    width: 220px;
    border-right: 1px solid rgba(60, 130, 200, 0.2);
    padding: 16px;
    overflow-y: auto;
    background: rgba(8, 16, 30, 0.5);
    flex-shrink: 0;
  }

  .ev-filter-section { margin-bottom: 18px; }

  .ev-filter-label {
    font-size: 0.78rem;
    color: #6ab0e8;
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  .ev-type-btns {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .type-btn {
    padding: 5px 10px;
    background: rgba(20, 35, 60, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 5px;
    color: #7090b0;
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .type-btn:hover { border-color: rgba(60, 130, 200, 0.4); color: #a0c8f0; }
  .type-btn.active { background: rgba(50, 90, 150, 0.4); border-color: rgba(60, 130, 200, 0.5); color: #c0e0ff; }

  .ev-select {
    width: 100%;
    padding: 7px 10px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    font-size: 0.78rem;
    outline: none;
  }

  .ev-select option { background: #0a1428; }

  .ev-tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
  }

  .ev-tag-btn {
    padding: 3px 8px;
    background: rgba(20, 35, 60, 0.4);
    border: 1px solid rgba(60, 130, 200, 0.12);
    border-radius: 3px;
    color: #506880;
    font-size: 0.66rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .ev-tag-btn:hover { color: #80a0c0; }
  .ev-tag-btn.active { background: rgba(60, 130, 200, 0.25); border-color: rgba(60, 130, 200, 0.4); color: #c0e0ff; }

  .ev-sort-btns {
    display: flex;
    gap: 4px;
  }

  .sort-btn {
    flex: 1;
    padding: 5px 6px;
    background: rgba(20, 35, 60, 0.4);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 4px;
    color: #6080a0;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .sort-btn.active { background: rgba(50, 90, 150, 0.35); border-color: rgba(60, 130, 200, 0.4); color: #c0e0ff; }

  .ev-stats {
    display: flex;
    gap: 12px;
    font-size: 0.7rem;
    color: #405878;
    padding-top: 10px;
    border-top: 1px solid rgba(60, 130, 200, 0.1);
  }

  .ev-main {
    flex: 1;
    overflow-y: auto;
    padding: 18px 22px;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .ev-search-bar { margin-bottom: 16px; }

  .ev-search {
    width: 100%;
    padding: 9px 14px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 0.82rem;
    outline: none;
  }

  .ev-search:focus { border-color: rgba(60, 130, 200, 0.6); }
  .ev-search::placeholder { color: #405878; }

  .ev-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
    flex: 1;
  }

  .ev-card {
    background: rgba(15, 25, 45, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 8px;
    padding: 12px 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ev-card:hover {
    border-color: rgba(60, 130, 200, 0.35);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }

  .ev-card.selected {
    border-color: rgba(60, 130, 200, 0.6);
    background: rgba(20, 40, 70, 0.6);
  }

  .ev-card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .ev-type-badge {
    font-size: 0.68rem;
    color: #7090b0;
    padding: 2px 8px;
    background: rgba(60, 130, 200, 0.08);
    border-radius: 3px;
  }

  .ev-importance { font-size: 0.6rem; color: #c8a84e; letter-spacing: 1px; }

  .ev-card-title {
    font-size: 0.85rem;
    color: #c0d8f0;
    margin: 0 0 4px 0;
    font-weight: 600;
  }

  .ev-card-content {
    font-size: 0.76rem;
    color: #7090b0;
    line-height: 1.4;
    margin: 0 0 6px 0;
  }

  .ev-card-meta { margin-bottom: 4px; }

  .ev-who { font-size: 0.7rem; color: #5090c0; margin-right: 10px; }

  .ev-card-tags {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }

  .ev-mini-tag {
    font-size: 0.6rem;
    padding: 1px 6px;
    background: rgba(60, 130, 200, 0.08);
    border-radius: 3px;
    color: #406078;
  }

  .ev-mini-tag.hl { background: rgba(60, 130, 200, 0.2); color: #90c0e0; }

  .ev-empty {
    grid-column: 1 / -1;
    text-align: center;
    padding: 50px;
    color: #506880;
    font-size: 0.85rem;
  }

  .ev-detail-panel {
    margin-top: 16px;
    padding: 16px 18px;
    background: rgba(10, 18, 35, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 10px;
  }

  .ev-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .ev-detail-type {
    font-size: 0.78rem;
    color: #90b8d0;
    padding-left: 10px;
  }

  .ev-detail-close {
    width: 26px;
    height: 26px;
    background: rgba(80, 40, 40, 0.5);
    border: 1px solid rgba(255, 100, 100, 0.2);
    border-radius: 5px;
    color: #ff8080;
    font-size: 0.85rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ev-detail-title {
    font-size: 1.05rem;
    color: #c0d8f0;
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  .ev-detail-content {
    font-size: 0.85rem;
    color: #a0b8d0;
    line-height: 1.7;
    margin: 0 0 12px 0;
  }

  .ev-detail-meta { margin-bottom: 12px; }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px 0;
    font-size: 0.78rem;
  }

  .meta-label { color: #5090b0; min-width: 70px; }

  .meta-value { color: #c0d8f0; }
  .meta-value.importance { color: #c8a84e; letter-spacing: 1px; font-size: 0.7rem; }

  .ev-detail-tags { }

  .detail-tag-list {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 6px;
  }

  .detail-tag {
    padding: 3px 10px;
    background: rgba(60, 130, 200, 0.12);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 4px;
    font-size: 0.72rem;
    color: #7090b0;
    cursor: pointer;
    transition: all 0.15s;
  }

  .detail-tag:hover { background: rgba(60, 130, 200, 0.25); color: #a0c8f0; }
  .detail-tag.hl { background: rgba(60, 130, 200, 0.35); border-color: rgba(60, 130, 200, 0.5); color: #c0e0ff; }

  @media (max-width: 900px) {
    .evidence-view { flex-direction: column; }
    .ev-sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(60, 130, 200, 0.2);
      max-height: 160px;
    }
    .ev-grid { grid-template-columns: 1fr; }
  }
</style>

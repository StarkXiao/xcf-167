<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { caseFiles, getCaseById } from '../data/archive';
  import { evidenceCards } from '../data/evidence';
  import { playSFX } from '../lib/audio';
  import type { CaseFile, ArchiveTab, CaseSeverity, CaseStatus } from '../types/game';

  import TimelineComparison from './TimelineComparison.svelte';
  import EvidenceFilter from './EvidenceFilter.svelte';
  import AudioPlayback from './AudioPlayback.svelte';
  import SyncPanel from './SyncPanel.svelte';

  export let isOpen = false;
  export let onClose: () => void;

  let activeTab: ArchiveTab = 'cases';
  let selectedCase: CaseFile | null = null;
  let searchQuery = '';
  let filterSeverity: CaseSeverity | 'all' = 'all';
  let filterStatus: CaseStatus | 'all' = 'all';
  let showClassified = false;

  $: filteredCases = caseFiles.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.designation.toLowerCase().includes(q) && !c.summary.toLowerCase().includes(q)) return false;
    }
    if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  function getSeverityColor(s: CaseSeverity): string {
    switch (s) {
      case 'critical': return '#ff4444';
      case 'major': return '#ff9944';
      case 'minor': return '#ffcc44';
      case 'unclassified': return '#888';
      default: return '#888';
    }
  }

  function getStatusLabel(s: CaseStatus): string {
    switch (s) {
      case 'open': return '调查中';
      case 'closed': return '已结案';
      case 'classified': return '机密';
      case 'expunged': return '已抹除';
      default: return s;
    }
  }

  function getStatusColor(s: CaseStatus): string {
    switch (s) {
      case 'open': return '#44aaff';
      case 'closed': return '#66bb66';
      case 'classified': return '#ff6666';
      case 'expunged': return '#888';
      default: return '#888';
    }
  }

  function handleCaseClick(c: CaseFile) {
    playSFX('click');
    selectedCase = c;
  }

  function handleBackToList() {
    playSFX('click');
    selectedCase = null;
  }

  function handleTabSwitch(tab: ArchiveTab) {
    playSFX('select');
    activeTab = tab;
    selectedCase = null;
  }

  function handleClose() {
    playSFX('click');
    onClose();
  }
</script>

{#if isOpen}
<div class="archive-overlay" on:click|stopPropagation>
  <div class="archive-container">
    <div class="archive-header">
      <div class="header-left">
        <h2 class="archive-title">深海事故档案库</h2>
        <span class="archive-subtitle">DEEP SEA INCIDENT ARCHIVE — CLASSIFIED</span>
      </div>
      <div class="header-right">
        <button class="close-btn" on:click={handleClose}>✕</button>
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn" class:active={activeTab === 'cases'} on:click={() => handleTabSwitch('cases')}>
        <span class="tab-icon">📁</span> 案件列表
      </button>
      <button class="tab-btn" class:active={activeTab === 'timeline'} on:click={() => handleTabSwitch('timeline')}>
        <span class="tab-icon">⏱</span> 时间轴比对
      </button>
      <button class="tab-btn" class:active={activeTab === 'evidence'} on:click={() => handleTabSwitch('evidence')}>
        <span class="tab-icon">🔍</span> 证据筛选
      </button>
      <button class="tab-btn" class:active={activeTab === 'audio'} on:click={() => handleTabSwitch('audio')}>
        <span class="tab-icon">🔊</span> 音频回放
      </button>
      <button class="tab-btn" class:active={activeTab === 'sync'} on:click={() => handleTabSwitch('sync')}>
        <span class="tab-icon">☁️</span> 存档同步
      </button>
    </div>

    <div class="archive-body">
      {#if activeTab === 'cases'}
        {#if selectedCase}
          <div class="case-detail">
            <button class="back-btn" on:click={handleBackToList}>← 返回案件列表</button>
            <div class="case-detail-header">
              <div class="case-designation">{selectedCase.designation}</div>
              <h3 class="case-detail-title">{selectedCase.title}</h3>
              <div class="case-meta-row">
                <span class="case-badge" style="background: {getStatusColor(selectedCase.status)}20; color: {getStatusColor(selectedCase.status)}; border: 1px solid {getStatusColor(selectedCase.status)}60;">
                  {getStatusLabel(selectedCase.status)}
                </span>
                <span class="case-badge" style="background: {getSeverityColor(selectedCase.severity)}20; color: {getSeverityColor(selectedCase.severity)}; border: 1px solid {getSeverityColor(selectedCase.severity)}60;">
                  {selectedCase.severity.toUpperCase()}
                </span>
                <span class="meta-item">📅 {selectedCase.date}</span>
                <span class="meta-item">📍 {selectedCase.location}</span>
                <span class="meta-item">⬇ {selectedCase.depth}</span>
              </div>
            </div>
            <div class="case-section">
              <h4>事故摘要</h4>
              <p class="case-summary-text">{selectedCase.summary}</p>
            </div>
            <div class="case-section">
              <h4>涉事人员</h4>
              <div class="personnel-list">
                {#each selectedCase.personnelInvolved as p}
                  <span class="personnel-tag">{p}</span>
                {/each}
              </div>
            </div>
            <div class="case-section">
              <h4>关联证据 ({selectedCase.evidenceIds.length})</h4>
              <div class="evidence-refs">
                {#each selectedCase.evidenceIds as eid}
                  {@const ev = evidenceCards.find(e => e.id === eid)}
                  {#if ev}
                    <div class="ev-ref" style="border-left: 3px solid {ev.color || '#64b5f6'};">
                      <span class="ev-ref-type">{ev.type === 'danmaku' ? '弹幕' : ev.type === 'dialogue' ? '台词' : '声效'}</span>
                      <span class="ev-ref-title">{ev.title}</span>
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
            <div class="case-section">
              <h4>时间轴 ({selectedCase.timeline.length} 条记录)</h4>
              <div class="mini-timeline">
                {#each selectedCase.timeline as evt}
                  <div class="mini-tl-item" class:critical={evt.importance >= 5}>
                    <div class="mini-tl-time">{evt.timestamp}</div>
                    <div class="mini-tl-dot"></div>
                    <div class="mini-tl-content">
                      <div class="mini-tl-label">{evt.label}</div>
                      <div class="mini-tl-desc">{evt.description}</div>
                      {#if evt.depth}
                        <span class="mini-tl-depth">深度 {evt.depth}</span>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            {#if selectedCase.relatedCaseIds.length > 0}
              <div class="case-section">
                <h4>关联案件</h4>
                <div class="related-cases">
                  {#each selectedCase.relatedCaseIds as rcid}
                    {@const rc = getCaseById(rcid)}
                    {#if rc}
                      <button class="related-case-btn" on:click={() => handleCaseClick(rc)}>
                        <span class="rc-designation">{rc.designation}</span>
                        <span class="rc-title">{rc.title}</span>
                      </button>
                    {/if}
                  {/each}
                </div>
              </div>
            {/if}
            {#if selectedCase.classifiedInfo && showClassified}
              <div class="case-section classified-section">
                <h4 class="classified-header">🔒 机密附件</h4>
                <p class="classified-text">{selectedCase.classifiedInfo}</p>
              </div>
            {:else if selectedCase.classifiedInfo}
              <div class="case-section">
                <button class="classified-toggle" on:click={() => { playSFX('warning'); showClassified = true; }}>
                  🔒 显示机密附件
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <div class="cases-list-view">
            <div class="cases-toolbar">
              <input
                type="text"
                class="search-input"
                placeholder="搜索案件编号、标题..."
                bind:value={searchQuery}
              />
              <select class="filter-select" bind:value={filterSeverity}>
                <option value="all">全部等级</option>
                <option value="critical">CRITICAL</option>
                <option value="major">MAJOR</option>
                <option value="minor">MINOR</option>
                <option value="unclassified">未分类</option>
              </select>
              <select class="filter-select" bind:value={filterStatus}>
                <option value="all">全部状态</option>
                <option value="open">调查中</option>
                <option value="closed">已结案</option>
                <option value="classified">机密</option>
                <option value="expunged">已抹除</option>
              </select>
            </div>
            <div class="cases-grid">
              {#each filteredCases as c (c.id)}
                <div class="case-card" on:click={() => handleCaseClick(c)}>
                  <div class="card-top">
                    <span class="card-designation">{c.designation}</span>
                    <span class="card-status" style="color: {getStatusColor(c.status)}">{getStatusLabel(c.status)}</span>
                  </div>
                  <h4 class="card-title">{c.title}</h4>
                  <p class="card-summary">{c.summary.slice(0, 100)}...</p>
                  <div class="card-footer">
                    <span class="card-severity" style="color: {getSeverityColor(c.severity)}">● {c.severity.toUpperCase()}</span>
                    <span class="card-date">{c.date}</span>
                    <span class="card-depth">⬇ {c.depth}</span>
                  </div>
                  <div class="card-indicators">
                    <span class="indicator">📋 {c.timeline.length}</span>
                    <span class="indicator">🔍 {c.evidenceIds.length}</span>
                    {#if c.audioLogIds.length > 0}
                      <span class="indicator">🔊 {c.audioLogIds.length}</span>
                    {/if}
                  </div>
                </div>
              {/each}
              {#if filteredCases.length === 0}
                <div class="empty-state">
                  <p>未找到匹配的案件记录</p>
                  <p class="sub">调整筛选条件后重试</p>
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {:else if activeTab === 'timeline'}
        <TimelineComparison />
      {:else if activeTab === 'evidence'}
        <EvidenceFilter />
      {:else if activeTab === 'audio'}
        <AudioPlayback />
      {:else if activeTab === 'sync'}
        <SyncPanel />
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  .archive-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.92);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }

  .archive-container {
    width: 100%;
    max-width: 1400px;
    height: 92vh;
    max-height: 960px;
    background: linear-gradient(180deg, rgba(8, 16, 30, 0.99), rgba(4, 10, 22, 0.99));
    border: 1px solid rgba(60, 130, 200, 0.35);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(60, 130, 200, 0.08);
  }

  .archive-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 28px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.25);
    background: linear-gradient(180deg, rgba(15, 30, 60, 0.6), transparent);
  }

  .archive-title {
    font-size: 1.5rem;
    color: #6ab0e8;
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-shadow: 0 0 20px rgba(60, 130, 200, 0.3);
  }

  .archive-subtitle {
    font-size: 0.7rem;
    color: rgba(100, 160, 220, 0.5);
    letter-spacing: 0.15em;
    font-family: 'Courier New', monospace;
  }

  .close-btn {
    width: 34px;
    height: 34px;
    background: rgba(80, 40, 40, 0.6);
    border: 1px solid rgba(255, 100, 100, 0.3);
    border-radius: 6px;
    color: #ff8080;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .close-btn:hover { background: rgba(160, 50, 50, 0.8); }

  .tab-bar {
    display: flex;
    gap: 0;
    padding: 0 28px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.2);
    background: rgba(10, 20, 40, 0.4);
  }

  .tab-btn {
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6090b0;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .tab-btn:hover { color: #90c0e0; }

  .tab-btn.active {
    color: #6ab0e8;
    border-bottom-color: #6ab0e8;
    background: rgba(60, 130, 200, 0.08);
  }

  .tab-icon { margin-right: 6px; }

  .archive-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .cases-list-view { padding: 24px 28px; }

  .cases-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .search-input {
    flex: 1;
    min-width: 200px;
    padding: 10px 16px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 0.85rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus { border-color: rgba(60, 130, 200, 0.6); }
  .search-input::placeholder { color: #405878; }

  .filter-select {
    padding: 10px 14px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
  }

  .filter-select option { background: #0a1428; }

  .cases-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .case-card {
    background: linear-gradient(135deg, rgba(15, 25, 50, 0.9), rgba(10, 18, 38, 0.95));
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 10px;
    padding: 18px;
    cursor: pointer;
    transition: all 0.25s;
  }

  .case-card:hover {
    border-color: rgba(60, 130, 200, 0.5);
    transform: translateY(-3px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(60, 130, 200, 0.1);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .card-designation {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #5090c0;
    letter-spacing: 0.05em;
  }

  .card-status { font-size: 0.75rem; font-weight: 600; }

  .card-title {
    font-size: 1.05rem;
    color: #c0d8f0;
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  .card-summary {
    font-size: 0.8rem;
    color: #7090b0;
    line-height: 1.5;
    margin: 0 0 14px 0;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
    font-size: 0.75rem;
  }

  .card-severity { font-weight: 700; }
  .card-date { color: #7090b0; }
  .card-depth { color: #5090c0; }

  .card-indicators {
    display: flex;
    gap: 14px;
    font-size: 0.72rem;
    color: #506880;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 60px 20px;
    color: #506880;
  }

  .empty-state .sub { font-size: 0.8rem; color: #3d5470; margin-top: 6px; }

  .case-detail { padding: 24px 28px; }

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

  .case-detail-header { margin-bottom: 24px; }

  .case-designation {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #5090c0;
    letter-spacing: 0.08em;
    margin-bottom: 6px;
  }

  .case-detail-title {
    font-size: 1.4rem;
    color: #c0d8f0;
    margin: 0 0 12px 0;
    font-weight: 700;
  }

  .case-meta-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }

  .case-badge {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .meta-item {
    font-size: 0.78rem;
    color: #7090b0;
  }

  .case-section {
    margin-bottom: 22px;
  }

  .case-section h4 {
    font-size: 0.9rem;
    color: #6ab0e8;
    margin: 0 0 10px 0;
    font-weight: 600;
  }

  .case-summary-text {
    font-size: 0.85rem;
    color: #a0b8d0;
    line-height: 1.7;
  }

  .personnel-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .personnel-tag {
    padding: 4px 12px;
    background: rgba(40, 70, 120, 0.4);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 6px;
    font-size: 0.8rem;
    color: #90c0e0;
  }

  .evidence-refs {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ev-ref {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 14px;
    background: rgba(15, 25, 45, 0.6);
    border-radius: 6px;
  }

  .ev-ref-type {
    font-size: 0.7rem;
    padding: 2px 8px;
    background: rgba(60, 130, 200, 0.15);
    border-radius: 3px;
    color: #7090b0;
  }

  .ev-ref-title {
    font-size: 0.82rem;
    color: #c0d8f0;
  }

  .mini-timeline {
    position: relative;
    padding-left: 24px;
  }

  .mini-timeline::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: rgba(60, 130, 200, 0.2);
  }

  .mini-tl-item {
    position: relative;
    padding: 8px 0 8px 20px;
  }

  .mini-tl-item.critical .mini-tl-dot { background: #ff6464; box-shadow: 0 0 8px rgba(255, 100, 100, 0.4); }

  .mini-tl-time {
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    color: #5090c0;
    margin-bottom: 2px;
  }

  .mini-tl-dot {
    position: absolute;
    left: -22px;
    top: 12px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #4090c0;
    border: 2px solid rgba(60, 130, 200, 0.4);
  }

  .mini-tl-content {
    min-width: 0;
  }

  .mini-tl-label {
    font-size: 0.85rem;
    color: #c0d8f0;
    font-weight: 600;
    margin-bottom: 2px;
  }

  .mini-tl-desc {
    font-size: 0.78rem;
    color: #8098b0;
    line-height: 1.5;
  }

  .mini-tl-depth {
    font-size: 0.7rem;
    color: #5090c0;
    font-family: 'Courier New', monospace;
  }

  .related-cases {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .related-case-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 10px 16px;
    background: rgba(30, 50, 80, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .related-case-btn:hover { border-color: rgba(60, 130, 200, 0.5); }

  .rc-designation {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: #5090c0;
  }

  .rc-title {
    font-size: 0.82rem;
    color: #c0d8f0;
  }

  .classified-toggle {
    padding: 10px 20px;
    background: rgba(100, 30, 30, 0.4);
    border: 1px solid rgba(255, 80, 80, 0.3);
    border-radius: 8px;
    color: #ff9090;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .classified-toggle:hover { background: rgba(140, 40, 40, 0.6); }

  .classified-section {
    background: rgba(80, 20, 20, 0.15);
    border: 1px solid rgba(255, 80, 80, 0.2);
    border-radius: 8px;
    padding: 16px;
  }

  .classified-header { color: #ff8080 !important; }

  .classified-text {
    font-size: 0.85rem;
    color: #ffb0b0;
    line-height: 1.7;
  }

  @media (max-width: 900px) {
    .archive-overlay { padding: 10px; }
    .archive-container { height: 96vh; }
    .tab-bar { overflow-x: auto; padding: 0 16px; }
    .tab-btn { padding: 10px 14px; font-size: 0.8rem; }
    .cases-grid { grid-template-columns: 1fr; }
    .archive-body { padding: 0; }
    .cases-list-view { padding: 16px; }
    .case-detail { padding: 16px; }
  }

  @media (max-width: 600px) {
    .archive-header { padding: 12px 16px; }
    .archive-title { font-size: 1.1rem; }
    .tab-icon { display: none; }
    .cases-toolbar { flex-direction: column; }
    .search-input { min-width: auto; }
    .case-meta-row { flex-direction: column; align-items: flex-start; gap: 6px; }
  }
</style>

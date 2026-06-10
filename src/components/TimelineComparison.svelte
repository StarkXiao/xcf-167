<script lang="ts">
  import { caseFiles, allTimelineEvents } from '../data/archive';
  import { playSFX } from '../lib/audio';
  import type { CaseFile, TimelineEvent } from '../types/game';

  let selectedCaseIds: string[] = [];
  let highlightTag: string | null = null;
  let showAllCases = true;

  const allTags = [...new Set(allTimelineEvents.flatMap(e => e.tags))].sort();

  $: activeCases = showAllCases ? caseFiles : caseFiles.filter(c => selectedCaseIds.includes(c.id));

  $: mergedEvents = activeCases
    .flatMap(c => c.timeline.map(e => ({ ...e, caseId: c.id, caseTitle: c.title })))
    .sort((a, b) => {
      const ta = a.timestamp.replace(/[^\d:]/g, '');
      const tb = b.timestamp.replace(/[^\d:]/g, '');
      return ta.localeCompare(tb);
    });

  $: filteredEvents = highlightTag
    ? mergedEvents.filter(e => e.tags.includes(highlightTag as string))
    : mergedEvents;

  function toggleCase(caseId: string) {
    playSFX('click');
    if (selectedCaseIds.includes(caseId)) {
      selectedCaseIds = selectedCaseIds.filter(id => id !== caseId);
    } else {
      selectedCaseIds = [...selectedCaseIds, caseId];
    }
    if (selectedCaseIds.length > 0) showAllCases = false;
    else showAllCases = true;
  }

  function toggleAllCases() {
    playSFX('click');
    showAllCases = true;
    selectedCaseIds = [];
  }

  function setTagFilter(tag: string | null) {
    playSFX('click');
    highlightTag = highlightTag === tag ? null : tag;
  }

  function getCaseColor(caseId: string): string {
    const colors: Record<string, string> = {
      'case_abyss_2047': '#4488ff',
      'case_pioneer_2044': '#ff8844',
      'case_signal_07': '#aa66ff',
      'case_danmaku_anomaly': '#44ccaa'
    };
    return colors[caseId] || '#888';
  }

  function getImportanceLabel(i: number): string {
    if (i >= 5) return '⚠ 关键';
    if (i >= 4) return '● 重要';
    return '○ 一般';
  }
</script>

<div class="timeline-view">
  <div class="timeline-controls">
    <div class="control-section">
      <h4 class="control-label">案件筛选</h4>
      <div class="case-toggles">
        <button class="toggle-btn" class:active={showAllCases} on:click={toggleAllCases}>
          全部案件
        </button>
        {#each caseFiles as c (c.id)}
          <button
            class="toggle-btn"
            class:active={selectedCaseIds.includes(c.id) || showAllCases}
            style="--case-color: {getCaseColor(c.id)}"
            on:click={() => toggleCase(c.id)}
          >
            <span class="case-dot" style="background: {getCaseColor(c.id)}"></span>
            {c.designation}
          </button>
        {/each}
      </div>
    </div>
    <div class="control-section">
      <h4 class="control-label">标签高亮</h4>
      <div class="tag-cloud">
        <button class="tag-btn" class:active={highlightTag === null} on:click={() => setTagFilter(null)}>
          全部
        </button>
        {#each allTags as tag}
          <button class="tag-btn" class:active={highlightTag === tag} on:click={() => setTagFilter(tag)}>
            {tag}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="comparison-area">
    {#if activeCases.length < 2}
      <div class="compare-hint">
        <p>💡 选择两个或以上案件以启用横向比对视图</p>
        <p class="sub">当前显示：{showAllCases ? '全部案件' : activeCases.map(c => c.designation).join(' + ')}</p>
      </div>
    {:else}
      <div class="compare-header">
        <h4>横向比对：{activeCases.map(c => c.designation).join(' ⇔ ')}</h4>
      </div>
      <div class="compare-grid" style="grid-template-columns: repeat({activeCases.length}, 1fr);">
        {#each activeCases as c (c.id)}
          <div class="compare-column" style="border-top: 3px solid {getCaseColor(c.id)};">
            <div class="compare-col-header" style="color: {getCaseColor(c.id)}">
              {c.designation}
            </div>
            <div class="compare-col-subtitle">{c.title}</div>
            <div class="compare-events">
              {#each c.timeline.filter(e => !highlightTag || e.tags.includes(highlightTag)) as evt}
                <div class="compare-evt" class:critical={evt.importance >= 5}>
                  <div class="compare-evt-time">{evt.timestamp}</div>
                  <div class="compare-evt-label">{evt.label}</div>
                  <div class="compare-evt-desc">{evt.description.slice(0, 80)}{evt.description.length > 80 ? '...' : ''}</div>
                  <div class="compare-evt-tags">
                    {#each evt.tags.slice(0, 3) as t}
                      <span class="mini-tag" class:hl={highlightTag === t}>{t}</span>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="merged-timeline">
      <h4 class="tl-section-title">合并时间轴 ({filteredEvents.length} 条{highlightTag ? ` · ${highlightTag}` : ''})</h4>
      <div class="merged-events">
        {#each filteredEvents as evt (evt.id + evt.caseId)}
          <div class="merged-evt" class:critical={evt.importance >= 5}>
            <div class="merged-evt-left">
              <span class="evt-case-dot" style="background: {getCaseColor(evt.caseId)}" title={evt.caseTitle}></span>
              <span class="evt-time">{evt.timestamp}</span>
            </div>
            <div class="merged-evt-body">
              <div class="merged-evt-header">
                <span class="evt-case-label" style="color: {getCaseColor(evt.caseId)}">{evt.caseTitle}</span>
                <span class="evt-importance">{getImportanceLabel(evt.importance)}</span>
              </div>
              <div class="evt-label">{evt.label}</div>
              <div class="evt-desc">{evt.description}</div>
              {#if evt.depth}
                <span class="evt-depth">深度 {evt.depth}</span>
              {/if}
              <div class="evt-tags">
                {#each evt.tags as t}
                  <span class="evt-tag" class:hl={highlightTag === t} on:click={() => setTagFilter(t)}>{t}</span>
                {/each}
              </div>
            </div>
          </div>
        {/each}
        {#if filteredEvents.length === 0}
          <div class="empty-tl">
            <p>当前筛选条件下无时间轴事件</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .timeline-view {
    display: flex;
    height: 100%;
    overflow: hidden;
  }

  .timeline-controls {
    width: 240px;
    border-right: 1px solid rgba(60, 130, 200, 0.2);
    padding: 18px;
    overflow-y: auto;
    background: rgba(8, 16, 30, 0.5);
    flex-shrink: 0;
  }

  .control-section { margin-bottom: 20px; }

  .control-label {
    font-size: 0.8rem;
    color: #6ab0e8;
    margin: 0 0 10px 0;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .case-toggles {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    background: rgba(20, 35, 60, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 6px;
    color: #8098b0;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn:hover { border-color: rgba(60, 130, 200, 0.4); color: #b0d0f0; }

  .toggle-btn.active {
    background: rgba(40, 70, 120, 0.5);
    border-color: rgba(60, 130, 200, 0.5);
    color: #c0e0ff;
  }

  .case-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag-btn {
    padding: 4px 10px;
    background: rgba(20, 35, 60, 0.4);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 4px;
    color: #6080a0;
    font-size: 0.7rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tag-btn:hover { border-color: rgba(60, 130, 200, 0.3); color: #90b0d0; }

  .tag-btn.active {
    background: rgba(60, 130, 200, 0.3);
    border-color: rgba(60, 130, 200, 0.5);
    color: #c0e0ff;
  }

  .comparison-area {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
    min-width: 0;
  }

  .compare-hint {
    text-align: center;
    padding: 30px;
    color: #6080a0;
    font-size: 0.85rem;
    margin-bottom: 20px;
    background: rgba(15, 25, 45, 0.5);
    border-radius: 8px;
    border: 1px dashed rgba(60, 130, 200, 0.2);
  }

  .compare-hint .sub { font-size: 0.75rem; color: #405878; margin-top: 6px; }

  .compare-header {
    margin-bottom: 16px;
  }

  .compare-header h4 {
    font-size: 0.9rem;
    color: #90c0e0;
    margin: 0;
    font-weight: 600;
  }

  .compare-grid {
    display: grid;
    gap: 16px;
    margin-bottom: 30px;
  }

  .compare-column {
    background: rgba(10, 18, 35, 0.6);
    border-radius: 8px;
    padding: 14px;
    max-height: 400px;
    overflow-y: auto;
  }

  .compare-col-header {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }

  .compare-col-subtitle {
    font-size: 0.78rem;
    color: #8098b0;
    margin-bottom: 12px;
  }

  .compare-events {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .compare-evt {
    padding: 8px 10px;
    background: rgba(20, 35, 60, 0.4);
    border-radius: 6px;
    border-left: 3px solid rgba(60, 130, 200, 0.3);
  }

  .compare-evt.critical { border-left-color: #ff6464; }

  .compare-evt-time {
    font-family: 'Courier New', monospace;
    font-size: 0.68rem;
    color: #5090c0;
  }

  .compare-evt-label {
    font-size: 0.8rem;
    color: #c0d8f0;
    font-weight: 600;
    margin: 2px 0;
  }

  .compare-evt-desc {
    font-size: 0.72rem;
    color: #7090b0;
    line-height: 1.4;
  }

  .compare-evt-tags {
    display: flex;
    gap: 4px;
    margin-top: 4px;
    flex-wrap: wrap;
  }

  .mini-tag {
    font-size: 0.62rem;
    padding: 1px 6px;
    background: rgba(60, 130, 200, 0.1);
    border-radius: 3px;
    color: #507898;
  }

  .mini-tag.hl { background: rgba(60, 130, 200, 0.3); color: #c0e0ff; }

  .tl-section-title {
    font-size: 0.9rem;
    color: #6ab0e8;
    margin: 0 0 14px 0;
    font-weight: 600;
  }

  .merged-events {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .merged-evt {
    display: flex;
    gap: 14px;
    padding: 12px 14px;
    background: rgba(15, 25, 45, 0.5);
    border-radius: 8px;
    border-left: 3px solid rgba(60, 130, 200, 0.25);
    transition: all 0.2s;
  }

  .merged-evt:hover { background: rgba(20, 35, 60, 0.7); }
  .merged-evt.critical { border-left-color: #ff6464; }

  .merged-evt-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 80px;
  }

  .evt-case-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .evt-time {
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    color: #5090c0;
    text-align: center;
  }

  .merged-evt-body { flex: 1; min-width: 0; }

  .merged-evt-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  .evt-case-label {
    font-size: 0.72rem;
    font-weight: 600;
  }

  .evt-importance { font-size: 0.7rem; color: #7090b0; }

  .evt-label {
    font-size: 0.88rem;
    color: #c0d8f0;
    font-weight: 600;
    margin-bottom: 3px;
  }

  .evt-desc {
    font-size: 0.78rem;
    color: #8098b0;
    line-height: 1.5;
  }

  .evt-depth {
    font-size: 0.68rem;
    color: #5090c0;
    font-family: 'Courier New', monospace;
  }

  .evt-tags {
    display: flex;
    gap: 4px;
    margin-top: 5px;
    flex-wrap: wrap;
  }

  .evt-tag {
    font-size: 0.66rem;
    padding: 2px 8px;
    background: rgba(60, 130, 200, 0.1);
    border-radius: 3px;
    color: #507898;
    cursor: pointer;
    transition: all 0.15s;
  }

  .evt-tag:hover { background: rgba(60, 130, 200, 0.2); color: #90c0e0; }
  .evt-tag.hl { background: rgba(60, 130, 200, 0.35); color: #c0e0ff; }

  .empty-tl {
    text-align: center;
    padding: 40px;
    color: #506880;
    font-size: 0.85rem;
  }

  @media (max-width: 900px) {
    .timeline-view { flex-direction: column; }
    .timeline-controls {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid rgba(60, 130, 200, 0.2);
      max-height: 180px;
    }
    .case-toggles { flex-direction: row; flex-wrap: wrap; }
    .compare-grid { grid-template-columns: 1fr !important; }
    .comparison-area { padding: 16px; }
  }
</style>

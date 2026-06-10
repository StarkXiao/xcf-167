<script lang="ts">
  import { playSFX } from '../lib/audio';
  import {
    chapters,
    chaptersWithStatus,
    getChapterRecords,
    getVariableDiff,
    clearChapterRecords
  } from '../lib/chapterReview';
  import { globalMemory, unlockedClueList } from '../lib/memory';
  import { getAllEndings } from '../lib/engine';
  import type { ChapterDefinition, ChapterPlayRecord } from '../types/game';

  export let isOpen: boolean;
  export let onClose: () => void;
  export let onReplayChapter: (chapter: ChapterDefinition) => void;

  const allEndings = getAllEndings();

  type ViewState = 'chapters' | 'review' | 'comparison';
  let viewState: ViewState = 'chapters';
  let selectedChapterId: string | null = null;
  let selectedRecord: ChapterPlayRecord | null = null;

  function getChapterDef(id: string): ChapterDefinition | undefined {
    return chapters.find(c => c.id === id);
  }

  function selectChapter(chapterId: string) {
    playSFX('click');
    selectedChapterId = chapterId;
    viewState = 'review';
  }

  function selectRecord(record: ChapterPlayRecord) {
    playSFX('click');
    selectedRecord = record;
  }

  function backToChapters() {
    playSFX('click');
    viewState = 'chapters';
    selectedChapterId = null;
    selectedRecord = null;
  }

  function backToReviewList() {
    playSFX('click');
    selectedRecord = null;
  }

  function showComparison() {
    playSFX('click');
    viewState = 'comparison';
    selectedRecord = null;
  }

  function handleClose() {
    playSFX('click');
    viewState = 'chapters';
    selectedChapterId = null;
    selectedRecord = null;
    onClose();
  }

  function handleReplay(chapter: ChapterDefinition) {
    playSFX('select');
    onReplayChapter(chapter);
    handleClose();
  }

  function handleClearRecords(chapterId: string) {
    playSFX('click');
    clearChapterRecords(chapterId);
  }

  $: currentChapter = selectedChapterId ? getChapterDef(selectedChapterId) : null;
  $: currentRecords = selectedChapterId ? getChapterRecords(selectedChapterId) : [];
  $: variableDiff = selectedRecord
    ? getVariableDiff(selectedRecord.variablesBefore, selectedRecord.variablesAfter)
    : [];

  function formatVarValue(val: string | number | boolean | undefined): string {
    if (val === undefined || val === '(无)') return '—';
    if (typeof val === 'boolean') return val ? '✓' : '✗';
    return String(val);
  }

  function getClueDisplayName(clueId: string): string {
    const map: Record<string, string> = {
      clue_early: '首次异常信号',
      clue_danmaku: '弹幕知情人',
      clue_danmaku_deep: '弹幕深层线索',
      clue_crew: '船员异常反应',
      clue_creature: '生物非天然证据',
      clue_previous_incident: '先驱者号事故',
      clue_creature_artificial: '人造观测体',
      clue_protocol07: '协议07真相',
      clue_acceptance_mechanism: '验收机制',
      clue_loop_awareness: '循环觉醒',
      clue_engineer_secret: '工程师后手',
      full_truth: '全部真相'
    };
    return map[clueId] || clueId;
  }

  $: playthroughHistory = $globalMemory.playthroughHistory;
  $: endingGroups = (() => {
    const groups: Record<string, typeof playthroughHistory> = {};
    for (const p of playthroughHistory) {
      if (!p.endingId) continue;
      if (!groups[p.endingId]) groups[p.endingId] = [];
      groups[p.endingId].push(p);
    }
    return groups;
  })();
</script>

{#if isOpen}
  <div class="overlay" on:click={handleClose}>
    <div class="panel" on:click|stopPropagation style="animation: fadeInUp 0.3s ease-out;">
      <button class="close-btn" on:click={handleClose}>×</button>

      {#if viewState === 'chapters'}
        <h2 class="panel-title">章节选择 · 案情复盘</h2>
        <p class="panel-subtitle">通关后可按节点重播片段，查看变量变化和线索命中</p>

        <div class="tab-bar">
          <button class="tab active" disabled>章节复盘</button>
          <button class="tab" on:click={showComparison}>结局对照</button>
        </div>

        <div class="chapter-list">
          {#each $chaptersWithStatus as { chapter, hasRecord, recordCount, hasVisited } (chapter.id)}
            <button
              class="chapter-card"
              class:visited={hasVisited}
              class:has-record={hasRecord}
              on:click={() => selectChapter(chapter.id)}
            >
              <div class="chapter-header">
                <span class="chapter-depth">{chapter.depth || ''}</span>
                <h3 class="chapter-title">{chapter.title}</h3>
                {#if hasRecord}
                  <span class="record-badge">{recordCount}条记录</span>
                {/if}
              </div>
              <p class="chapter-desc">{chapter.description}</p>
              <div class="chapter-footer">
                <span class="chapter-path">起始: {chapter.startNodeId}</span>
                {#if hasVisited}
                  <span class="visited-tag">已通关</span>
                {:else}
                  <span class="unvisited-tag">未探索</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>

      {:else if viewState === 'review' && currentChapter}
        <div class="review-header">
          <button class="back-btn" on:click={backToChapters}>← 返回章节</button>
          <h2 class="review-title">{currentChapter.title}</h2>
          <button class="replay-btn" on:click={() => handleReplay(currentChapter)}>
            ▶ 重播此章
          </button>
        </div>
        <p class="chapter-desc review-desc">{currentChapter.description}</p>

        {#if !selectedRecord}
          <div class="records-section">
            <div class="section-header">
              <h3 class="section-title">复盘记录</h3>
              {#if currentRecords.length > 0}
                <button class="clear-btn" on:click={() => handleClearRecords(currentChapter!.id)}>清空记录</button>
              {/if}
            </div>

            {#if currentRecords.length === 0}
              <div class="empty-state">
                <p>暂无复盘记录</p>
                <p class="empty-hint">完成该章节后，复盘记录将自动保存</p>
              </div>
            {:else}
              <div class="record-list">
                {#each currentRecords as record, i (i)}
                  <button class="record-item" on:click={() => selectRecord(record)}>
                    <div class="record-header">
                      <span class="record-index">#{i + 1}</span>
                      <span class="record-time">{new Date(record.timestamp).toLocaleString('zh-CN')}</span>
                      <span class="record-playthrough">第{record.playthroughNumber}周目</span>
                    </div>
                    <div class="record-summary">
                      <span class="summary-item">变量变化: {getVariableDiff(record.variablesBefore, record.variablesAfter).length}项</span>
                      <span class="summary-item">线索命中: {record.cluesHit.length}条</span>
                      <span class="summary-item">选择: {record.choicesMade.length}次</span>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}
          </div>

        {:else}
          <div class="detail-section">
            <button class="back-btn" on:click={backToReviewList}>← 返回记录列表</button>

            {#if selectedRecord.choicesMade.length > 0}
              <div class="detail-block">
                <h4 class="detail-title">选择记录</h4>
                <div class="choice-list">
                  {#each selectedRecord.choicesMade as choice}
                    <div class="choice-item">
                      <span class="choice-node">节点: {choice.nodeId}</span>
                      <span class="choice-arrow">→</span>
                      <span class="choice-text">{choice.choiceText}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if variableDiff.length > 0}
              <div class="detail-block">
                <h4 class="detail-title">变量变化</h4>
                <div class="var-table">
                  <div class="var-header">
                    <span class="var-col">变量</span>
                    <span class="var-col">变化前</span>
                    <span class="var-col">变化后</span>
                  </div>
                  {#each variableDiff as diff}
                    <div class="var-row">
                      <span class="var-key">{diff.key}</span>
                      <span class="var-val before">{formatVarValue(diff.before)}</span>
                      <span class="var-val after">{formatVarValue(diff.after)}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if selectedRecord.cluesHit.length > 0}
              <div class="detail-block">
                <h4 class="detail-title">线索命中</h4>
                <div class="clue-list">
                  {#each selectedRecord.cluesHit as clueId}
                    <div class="clue-hit-item">
                      <span class="clue-icon">✦</span>
                      <span class="clue-name">{getClueDisplayName(clueId)}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if selectedRecord.trustChanges.length > 0}
              <div class="detail-block">
                <h4 class="detail-title">信任变化</h4>
                <div class="trust-list">
                  {#each selectedRecord.trustChanges as tc}
                    <div class="trust-item">
                      <span class="trust-target">{tc.target}</span>
                      <span class="trust-value" class:positive={tc.value > 0} class:negative={tc.value < 0}>
                        {tc.value > 0 ? '+' : ''}{tc.value}
                      </span>
                      {#if tc.reason}
                        <span class="trust-reason">{tc.reason}</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            {#if selectedRecord.danmakuHighlights.length > 0}
              <div class="detail-block">
                <h4 class="detail-title">关键弹幕</h4>
                <div class="danmaku-highlight-list">
                  {#each selectedRecord.danmakuHighlights as dId}
                    <div class="danmaku-highlight-item">
                      <span class="dm-icon">💬</span>
                      <span class="dm-id">{dId}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/if}

      {:else if viewState === 'comparison'}
        <div class="review-header">
          <button class="back-btn" on:click={backToChapters}>← 返回章节</button>
          <h2 class="review-title">结局对照</h2>
        </div>

        {#if Object.keys(endingGroups).length === 0}
          <div class="empty-state">
            <p>尚未通关任何结局</p>
            <p class="empty-hint">完成游戏后，不同周目的结局将在此对照展示</p>
          </div>
        {:else}
          <div class="comparison-list">
            {#each Object.entries(endingGroups) as [endingId, records]}
              {@const ending = allEndings.find(e => e.id === endingId)}
              {@const isGood = ending?.isGood ?? false}
              <div class="comparison-card" class:good={isGood} class:bad={!isGood}>
                <div class="comp-header">
                  <span class="comp-type">{isGood ? 'GOOD END' : 'BAD END'}</span>
                  <h3 class="comp-title">{ending?.title || endingId}</h3>
                  <span class="comp-count">{records.length}次达成</span>
                </div>
                <p class="comp-desc">{ending?.description || ''}</p>
                <div class="comp-records">
                  {#each records as rec}
                    <div class="comp-record">
                      <span class="comp-playthrough">第{rec.playthrough}周目</span>
                      <span class="comp-clues">线索: {rec.cluesUnlocked.length}</span>
                      <span class="comp-choices">选择: {rec.choicesMade.length}</span>
                      {#if rec.mistakeCount > 0}
                        <span class="comp-mistakes">误判: {rec.mistakeCount}</span>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      {/if}

      <button class="close-action" on:click={handleClose}>返回</button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(8px);
    padding: 16px;
  }

  .panel {
    position: relative;
    background: linear-gradient(180deg, rgba(15, 30, 55, 0.98), rgba(8, 18, 35, 1));
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 12px;
    padding: 24px 20px;
    width: 100%;
    max-width: 560px;
    max-height: 85vh;
    overflow-y: auto;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 16px;
    background: transparent;
    border: none;
    color: #6a8aaa;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
    z-index: 2;
  }

  .panel-title {
    color: #64b4ff;
    text-align: center;
    margin-bottom: 4px;
    font-size: 1.3rem;
  }

  .panel-subtitle {
    color: #5a7a9a;
    font-size: 0.78rem;
    text-align: center;
    margin-bottom: 16px;
  }

  .tab-bar {
    display: flex;
    gap: 0;
    margin-bottom: 16px;
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 6px;
    overflow: hidden;
  }

  .tab {
    flex: 1;
    padding: 10px;
    background: rgba(30, 55, 90, 0.4);
    border: none;
    color: #6a8aaa;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab.active {
    background: rgba(60, 120, 200, 0.4);
    color: #c0d8f0;
  }

  .tab:not(.active):hover {
    background: rgba(40, 70, 110, 0.5);
  }

  .chapter-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .chapter-card {
    text-align: left;
    padding: 14px 16px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.15);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .chapter-card:hover {
    background: rgba(30, 55, 90, 0.6);
    border-color: rgba(100, 180, 255, 0.35);
    transform: translateY(-1px);
  }

  .chapter-card.has-record {
    border-left: 3px solid #ffd890;
  }

  .chapter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .chapter-depth {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: #5a9aba;
    background: rgba(40, 80, 130, 0.4);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .chapter-title {
    flex: 1;
    color: #d0e4f8;
    font-size: 0.95rem;
    margin: 0;
  }

  .record-badge {
    font-size: 0.7rem;
    color: #ffd890;
    background: rgba(200, 150, 80, 0.2);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .chapter-desc {
    color: #7a9ab8;
    font-size: 0.78rem;
    line-height: 1.5;
    margin: 0 0 8px 0;
  }

  .review-desc {
    margin-bottom: 16px;
  }

  .chapter-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .chapter-path {
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: #4a6a8a;
  }

  .visited-tag {
    font-size: 0.7rem;
    color: #64d4a0;
    background: rgba(100, 212, 160, 0.15);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .unvisited-tag {
    font-size: 0.7rem;
    color: #5a7a9a;
    background: rgba(90, 122, 154, 0.15);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .review-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .review-title {
    flex: 1;
    color: #64b4ff;
    font-size: 1.1rem;
    margin: 0;
  }

  .back-btn {
    background: transparent;
    border: 1px solid rgba(100, 180, 255, 0.25);
    color: #8ab0d0;
    padding: 6px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: rgba(100, 180, 255, 0.1);
  }

  .replay-btn {
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.6), rgba(40, 80, 160, 0.6));
    border: 1px solid rgba(100, 180, 255, 0.5);
    color: #e0f0ff;
    padding: 6px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .replay-btn:hover {
    background: linear-gradient(135deg, rgba(70, 140, 220, 0.7), rgba(50, 100, 180, 0.7));
  }

  .records-section,
  .detail-section {
    margin-bottom: 20px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .section-title {
    color: #ffd890;
    font-size: 0.9rem;
    margin: 0;
  }

  .clear-btn {
    background: transparent;
    border: 1px solid rgba(200, 100, 100, 0.3);
    color: #c08a8a;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.72rem;
  }

  .clear-btn:hover {
    background: rgba(200, 100, 100, 0.15);
  }

  .empty-state {
    text-align: center;
    padding: 30px 20px;
    color: #5a7a9a;
  }

  .empty-hint {
    font-size: 0.78rem;
    color: #4a6a8a;
    margin-top: 8px;
  }

  .record-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .record-item {
    text-align: left;
    padding: 12px 14px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.12);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    width: 100%;
  }

  .record-item:hover {
    background: rgba(30, 55, 90, 0.5);
    border-color: rgba(100, 180, 255, 0.3);
  }

  .record-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .record-index {
    color: #64b4ff;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .record-time {
    font-size: 0.72rem;
    color: #5a7a9a;
    flex: 1;
  }

  .record-playthrough {
    font-size: 0.7rem;
    color: #ffd890;
    background: rgba(200, 150, 80, 0.15);
    padding: 2px 8px;
    border-radius: 10px;
  }

  .record-summary {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .summary-item {
    font-size: 0.72rem;
    color: #6a8aaa;
  }

  .detail-block {
    margin-bottom: 16px;
    padding: 14px;
    background: rgba(20, 40, 70, 0.4);
    border: 1px solid rgba(100, 180, 255, 0.1);
    border-radius: 8px;
  }

  .detail-title {
    color: #a0c8e8;
    font-size: 0.85rem;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.1);
  }

  .choice-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .choice-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(40, 70, 120, 0.3);
    border-radius: 4px;
  }

  .choice-node {
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    color: #5a9aba;
  }

  .choice-arrow {
    color: #4a6a8a;
  }

  .choice-text {
    color: #d0e4f8;
    font-size: 0.8rem;
  }

  .var-table {
    width: 100%;
  }

  .var-header {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(40, 70, 120, 0.3);
    border-radius: 4px 4px 0 0;
  }

  .var-col {
    font-size: 0.72rem;
    color: #5a9aba;
    font-weight: 600;
  }

  .var-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
    padding: 6px 10px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.05);
  }

  .var-key {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #a0c8e8;
  }

  .var-val {
    font-size: 0.75rem;
  }

  .var-val.before {
    color: #6a8aaa;
  }

  .var-val.after {
    color: #ffd890;
    font-weight: 500;
  }

  .clue-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .clue-hit-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(200, 150, 80, 0.08);
    border-left: 2px solid #ffd890;
    border-radius: 0 4px 4px 0;
  }

  .clue-icon {
    color: #ffd890;
    font-size: 0.8rem;
  }

  .clue-name {
    color: #ffe8c0;
    font-size: 0.8rem;
  }

  .trust-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 10px;
    background: rgba(40, 70, 120, 0.2);
    border-radius: 4px;
  }

  .trust-target {
    font-size: 0.78rem;
    color: #a0c8e8;
    min-width: 60px;
  }

  .trust-value {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .trust-value.positive {
    color: #64d4a0;
  }

  .trust-value.negative {
    color: #d46464;
  }

  .trust-reason {
    font-size: 0.72rem;
    color: #6a8aaa;
  }

  .danmaku-highlight-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .danmaku-highlight-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(40, 70, 120, 0.2);
    border-radius: 4px;
  }

  .dm-icon {
    font-size: 0.75rem;
  }

  .dm-id {
    font-family: 'Courier New', monospace;
    font-size: 0.72rem;
    color: #8ab0d0;
  }

  .comparison-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
  }

  .comparison-card {
    padding: 14px 16px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.15);
    border-radius: 8px;
  }

  .comparison-card.good {
    border-left: 3px solid #64d4a0;
  }

  .comparison-card.bad {
    border-left: 3px solid #d46464;
  }

  .comp-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .comp-type {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .comparison-card.good .comp-type {
    color: #64d4a0;
    background: rgba(100, 212, 160, 0.15);
  }

  .comparison-card.bad .comp-type {
    color: #d46464;
    background: rgba(212, 100, 100, 0.15);
  }

  .comp-title {
    flex: 1;
    color: #d0e4f8;
    font-size: 1rem;
    margin: 0;
  }

  .comp-count {
    font-size: 0.72rem;
    color: #6a8aaa;
  }

  .comp-desc {
    color: #7a9ab8;
    font-size: 0.78rem;
    line-height: 1.5;
    margin: 0 0 10px 0;
  }

  .comp-records {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .comp-record {
    display: flex;
    gap: 10px;
    padding: 6px 10px;
    background: rgba(30, 55, 90, 0.4);
    border-radius: 4px;
    font-size: 0.72rem;
    color: #8ab0d0;
  }

  .comp-playthrough {
    color: #ffd890;
  }

  .comp-mistakes {
    color: #d46464;
  }

  .close-action {
    display: block;
    margin: 0 auto;
    padding: 10px 32px;
    background: rgba(40, 70, 120, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .close-action:hover {
    background: rgba(60, 100, 170, 0.7);
  }

  @media (max-width: 480px) {
    .panel {
      padding: 18px 14px;
    }

    .chapter-card {
      padding: 12px;
    }

    .var-row,
    .var-header {
      gap: 4px;
    }

    .comp-record {
      flex-wrap: wrap;
      gap: 6px;
    }
  }
</style>

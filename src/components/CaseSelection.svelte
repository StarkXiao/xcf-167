<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { caseLinkageState, availableCases, closeCaseSelection, getCaseProgress, getOverallProgress, unlockedMainStoryBeats, openClueBoard, openMainStoryReveal, closeMainStoryReveal } from '../lib/caseLinkage';
  import { caseDefinitions, crossCaseClues } from '../data/caseLinkage';
  import { CROSS_CASE_CATEGORY_LABELS, CASE_THEMES } from '../types/caseLinkage';
  import type { CaseId, CaseState, MainStoryBeat } from '../types/caseLinkage';
  import { get } from 'svelte/store';

  const dispatch = createEventDispatcher();
  export let onStartCase: (caseId: CaseId) => void = () => {};
  export let onOpenClueBoard: () => void = () => {};

  let selectedCaseId: CaseId | null = null;
  let showCaseDetail = false;
  let selectedBeat: MainStoryBeat | null = null;

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      locked: '🔒 未解锁',
      available: '✨ 可进入',
      in_progress: '📖 进行中',
      completed: '✅ 已完成',
      hidden: '❓ 未知'
    };
    return labels[status] || status;
  };

  const getSeverityLabel = (severity: string): string => {
    const labels: Record<string, string> = {
      critical: '🔴 极危',
      major: '🟠 重大',
      minor: '🟡 一般'
    };
    return labels[severity] || severity;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      locked: 'text-gray-500',
      available: 'text-green-400',
      in_progress: 'text-yellow-400',
      completed: 'text-blue-400',
      hidden: 'text-gray-600'
    };
    return colors[status] || 'text-gray-400';
  };

  const handleCaseClick = (caseId: CaseId, caseState: CaseState) => {
    if (caseState.status === 'locked' || caseState.status === 'hidden') return;
    selectedCaseId = caseId;
    showCaseDetail = true;
  };

  const handleStartCase = () => {
    if (selectedCaseId) {
      onStartCase(selectedCaseId);
      showCaseDetail = false;
      selectedCaseId = null;
    }
  };

  const handleClose = () => {
    closeCaseSelection();
    showCaseDetail = false;
    selectedCaseId = null;
  };

  const getSelectedCaseDef = () => selectedCaseId ? caseDefinitions[selectedCaseId] : null;
  const getSelectedCaseState = () => selectedCaseId ? get(caseLinkageState).cases[selectedCaseId] : null;

  const getRelatedCluesCount = (caseId: CaseId): number => {
    return crossCaseClues.filter(c => c.relatedCaseIds.includes(caseId)).length;
  };

  const formatDate = (dateStr: string): string => {
    return dateStr;
  };

  const getCaseDef = (caseId: CaseId) => caseDefinitions[caseId];
  const getCaseTheme = (caseId: CaseId) => CASE_THEMES[caseId as keyof typeof CASE_THEMES] || CASE_THEMES.case_abyss;
  const getClueById = (clueId: string) => crossCaseClues.find(c => c.id === clueId);
  const isEndingUnlocked = (caseState: CaseState | null, endingId: string) => caseState ? caseState.unlockedEndings.includes(endingId) : false;
  const isSelectedEndingUnlocked = (endingId: string) => isEndingUnlocked(getSelectedCaseState(), endingId);

  const handleTimelineBeatClick = (beat: MainStoryBeat) => {
    if (beat.isUnlocked) {
      selectedBeat = beat;
      openMainStoryReveal();
    }
  };

  const handleCloseMainStoryReveal = () => {
    closeMainStoryReveal();
    selectedBeat = null;
  };

  const handleOpenMainStoryButton = () => {
    const unlocked = $unlockedMainStoryBeats;
    if (unlocked.length > 0) {
      selectedBeat = unlocked[unlocked.length - 1];
      openMainStoryReveal();
    }
  };
</script>

{#if $caseLinkageState.isCaseSelectionOpen}
  <div class="case-selection-overlay" on:click|self={handleClose}>
    <div class="case-selection-container">
      <div class="case-selection-header">
        <div class="header-left">
          <h2 class="title">📁 深海事故档案</h2>
          <p class="subtitle">多案件联动篇 · PROJECT-07</p>
        </div>
        <div class="header-right">
          <div class="progress-overview">
            <span class="progress-label">总体进度</span>
            <div class="progress-bar-container">
              <div class="progress-bar" style="width: {getOverallProgress()}%"></div>
            </div>
            <span class="progress-value">{getOverallProgress()}%</span>
          </div>
          <button class="icon-btn" on:click={onOpenClueBoard} title="跨案线索板">
            🔗 线索
          </button>
          <button class="icon-btn" on:click={handleOpenMainStoryButton} title="主线剧情">
            📜 主线
          </button>
          <button class="close-btn" on:click={handleClose}>✕</button>
        </div>
      </div>

      <div class="main-story-timeline">
        <h3 class="section-title">📖 主线进展 <span class="section-hint">（点击查看详情）</span></h3>
        <div class="timeline-container">
          {#each $unlockedMainStoryBeats as beat}
            <div class="timeline-item unlocked" on:click={() => handleTimelineBeatClick(beat)}>
              <div class="timeline-dot">✓</div>
              <div class="timeline-content">
                <div class="timeline-title">{beat.title}</div>
                <div class="timeline-desc">{beat.description}</div>
              </div>
            </div>
          {/each}
          {#each $caseLinkageState.mainStoryBeats.filter(b => !b.isUnlocked) as beat}
            <div class="timeline-item locked">
              <div class="timeline-dot">🔒</div>
              <div class="timeline-content">
                <div class="timeline-title">???</div>
                <div class="timeline-desc">收集更多线索以解锁</div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="cases-grid-section">
        <h3 class="section-title">📂 案件列表</h3>
        <div class="cases-grid">
          {#each $availableCases as caseState}
            <div
              class="case-card {caseState.status}"
              style="--primary: {getCaseTheme(caseState.caseId).primary}; --secondary: {getCaseTheme(caseState.caseId).secondary}; --accent: {getCaseTheme(caseState.caseId).accent};"
              on:click={() => handleCaseClick(caseState.caseId, caseState)}
            >
              <div class="case-card-header">
                <span class="case-icon">{getCaseDef(caseState.caseId).icon}</span>
                <span class="case-designation">{getCaseDef(caseState.caseId).designation}</span>
                <span class="case-status {getStatusColor(caseState.status)}">
                  {getStatusLabel(caseState.status)}
                </span>
              </div>
              
              <div class="case-card-body">
                <h4 class="case-title">{getCaseDef(caseState.caseId).title}</h4>
                <p class="case-subtitle">{getCaseDef(caseState.caseId).subtitle}</p>
                <p class="case-summary">{getCaseDef(caseState.caseId).summary}</p>
                
                <div class="case-meta">
                  <div class="meta-item">
                    <span class="meta-label">日期</span>
                    <span class="meta-value">{formatDate(getCaseDef(caseState.caseId).date)}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">深度</span>
                    <span class="meta-value">{getCaseDef(caseState.caseId).depth}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-label">等级</span>
                    <span class="meta-value">{getSeverityLabel(getCaseDef(caseState.caseId).severity)}</span>
                  </div>
                </div>

                <div class="case-progress">
                  <div class="progress-label-row">
                    <span>案件进度</span>
                    <span>{getCaseProgress(caseState.caseId)}%</span>
                  </div>
                  <div class="progress-bar-container small">
                    <div class="progress-bar" style="width: {getCaseProgress(caseState.caseId)}%"></div>
                  </div>
                </div>

                <div class="case-stats">
                  <div class="stat-item">
                    <span class="stat-icon">👥</span>
                    <span class="stat-value">{getCaseDef(caseState.caseId).crewNames.length}</span>
                    <span class="stat-label">船员</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">💀</span>
                    <span class="stat-value">{getCaseDef(caseState.caseId).victimCount}</span>
                    <span class="stat-label">遇难</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">🔗</span>
                    <span class="stat-value">{getRelatedCluesCount(caseState.caseId)}</span>
                    <span class="stat-label">关联线索</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">🎭</span>
                    <span class="stat-value">{getCaseDef(caseState.caseId).endings.length}</span>
                    <span class="stat-label">结局</span>
                  </div>
                </div>
              </div>

              <div class="case-card-footer">
                {#if caseState.status === 'completed'}
                  <span class="footer-text">已解锁 {caseState.unlockedEndings.length}/{getCaseDef(caseState.caseId).endings.length} 个结局</span>
                {:else if caseState.status === 'in_progress'}
                  <span class="footer-text">继续上次的调查...</span>
                {:else if caseState.status === 'available'}
                  <span class="footer-text">点击进入调查</span>
                {/if}
              </div>
            </div>
          {/each}

          {#each Object.values($caseLinkageState.cases).filter(c => c.status === 'locked' || c.status === 'hidden') as caseState}
            <div class="case-card locked">
              <div class="case-card-header">
                <span class="case-icon">❓</span>
                <span class="case-designation">???</span>
                <span class="case-status text-gray-500">{getStatusLabel(caseState.status)}</span>
              </div>
              <div class="case-card-body">
                <h4 class="case-title">???</h4>
                <p class="case-subtitle">完成前置案件以解锁</p>
                <p class="case-summary">收集更多线索，揭开隐藏的真相...</p>
                
                <div class="locked-hint">
                  <span class="hint-icon">🔒</span>
                  <span class="hint-text">需要完成 {getCaseDef(caseState.caseId).unlockCondition.requiredCaseCompletion?.length || 0} 个前置案件</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>

      {#if showCaseDetail && selectedCaseId && getSelectedCaseDef() && getSelectedCaseState()}
          <div class="case-detail-overlay" on:click|self={() => { showCaseDetail = false; selectedCaseId = null; }}>
            <div class="case-detail-modal" style="--primary: {getCaseTheme(selectedCaseId).primary}; --secondary: {getCaseTheme(selectedCaseId).secondary}; --accent: {getCaseTheme(selectedCaseId).accent};">
              <div class="detail-header">
                <div class="detail-title-section">
                  <span class="detail-icon">{getSelectedCaseDef()?.icon}</span>
                  <div>
                    <h2>{getSelectedCaseDef()?.title}</h2>
                    <p class="detail-subtitle">{getSelectedCaseDef()?.subtitle}</p>
                  </div>
                </div>
                <button class="close-btn" on:click={() => { showCaseDetail = false; selectedCaseId = null; }}>✕</button>
              </div>

              <div class="detail-content">
                <div class="detail-section">
                  <h4>📋 案件概述</h4>
                  <p class="detail-text">{getSelectedCaseDef()?.fullDescription}</p>
                </div>

                <div class="detail-grid">
                  <div class="detail-box">
                    <h5>📅 基本信息</h5>
                    <div class="info-row"><span>日期：</span><span>{getSelectedCaseDef()?.date}</span></div>
                    <div class="info-row"><span>地点：</span><span>{getSelectedCaseDef()?.location}</span></div>
                    <div class="info-row"><span>深度：</span><span>{getSelectedCaseDef()?.depth}</span></div>
                    <div class="info-row"><span>等级：</span><span>{getSeverityLabel(getSelectedCaseDef()?.severity || '')}</span></div>
                  </div>

                  <div class="detail-box">
                    <h5>👥 涉及人员</h5>
                    <div class="crew-list">
                      {#each getSelectedCaseDef()?.crewNames || [] as name}
                        <span class="crew-tag">{name}</span>
                      {/each}
                    </div>
                    <div class="casualty-info">
                      <div>遇难：{getSelectedCaseDef()?.victimCount} 人</div>
                      <div>幸存：{getSelectedCaseDef()?.survivorCount} 人</div>
                    </div>
                  </div>
                </div>

                <div class="detail-section">
                  <h4>📰 官方说法</h4>
                  <p class="detail-text cover-story">{getSelectedCaseDef()?.coverStory}</p>
                </div>

                {#if getSelectedCaseState()?.status === 'completed'}
                  <div class="detail-section classified">
                    <h4>🔴 机密信息（已解锁）</h4>
                    <p class="detail-text classified-text">{getSelectedCaseDef()?.classifiedInfo}</p>
                  </div>
                {/if}

                <div class="detail-section">
                  <h4>🔗 关联线索</h4>
                  <div class="related-clues">
                    {#each getSelectedCaseDef()?.crossCaseClueIds || [] as clueId}
                      {#if getClueById(clueId)}
                        <div class="clue-tag">
                          <span class="clue-category">[{CROSS_CASE_CATEGORY_LABELS[getClueById(clueId)?.category || 'protocol']}]</span>
                          <span class="clue-title">{getClueById(clueId)?.title}</span>
                        </div>
                      {/if}
                    {/each}
                  </div>
                </div>

                {#if getSelectedCaseState()?.status === 'completed'}
                  <div class="detail-section">
                    <h4>🏆 已解锁结局</h4>
                    <div class="endings-list">
                      {#each getSelectedCaseDef()?.endings || [] as ending}
                        <div class="ending-item {isSelectedEndingUnlocked(ending.id) ? 'unlocked' : 'locked'}">
                          <span class="ending-icon">{isSelectedEndingUnlocked(ending.id) ? (ending.isGood ? '🌟' : '💀') : '🔒'}</span>
                          <div class="ending-info">
                            <div class="ending-title">{isSelectedEndingUnlocked(ending.id) ? ending.title : '???'}</div>
                            <div class="ending-desc">{isSelectedEndingUnlocked(ending.id) ? ending.description : '尚未解锁'}</div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>

              <div class="detail-footer">
                <button class="secondary-btn" on:click={() => { showCaseDetail = false; selectedCaseId = null; }}>
                  返回
                </button>
                <button class="primary-btn" on:click={handleStartCase}>
                  {getSelectedCaseState()?.status === 'in_progress' ? '继续调查' : '开始调查'}
                </button>
              </div>
            </div>
          </div>
      {/if}

      {#if $caseLinkageState.isMainStoryRevealOpen && selectedBeat}
          <div class="main-story-overlay" on:click|self={handleCloseMainStoryReveal}>
            <div class="main-story-modal">
              <div class="main-story-header">
                <div class="main-story-title-section">
                  <span class="main-story-icon">📜</span>
                  <div>
                    <h2>{selectedBeat.title}</h2>
                    <p class="main-story-subtitle">主线章节 · 第 {selectedBeat.order + 1} 章</p>
                  </div>
                </div>
                <button class="close-btn" on:click={handleCloseMainStoryReveal}>✕</button>
              </div>

              <div class="main-story-content">
                <div class="reveal-text">
                  {selectedBeat.revealContent}
                </div>

                <div class="main-story-meta">
                  {#if selectedBeat.requiredClues.length > 0}
                    <div class="meta-section">
                      <h5>🔍 关键线索</h5>
                      <div class="meta-items">
                        {#each selectedBeat.requiredClues as clueId}
                          {#if getClueById(clueId)}
                            <span class="meta-tag unlocked">
                              ✓ {getClueById(clueId)?.title}
                            </span>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/if}

                  {#if selectedBeat.requiredCases.length > 0}
                    <div class="meta-section">
                      <h5>📂 前置案件</h5>
                      <div class="meta-items">
                        {#each selectedBeat.requiredCases as caseId}
                          {#if getCaseDef(caseId)}
                            <span class="meta-tag unlocked">
                              ✓ {getCaseDef(caseId)?.title}
                            </span>
                          {/if}
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                {#if $caseLinkageState.mainStoryCompleted}
                  <div class="final-revelation">
                    <h4>🎉 全部主线章节已解锁！</h4>
                    <p>你已揭开深海之下的全部真相。但这真的是结束吗？</p>
                  </div>
                {/if}
              </div>

              <div class="main-story-footer">
                <button class="primary-btn" on:click={handleCloseMainStoryReveal}>
                  继续调查
                </button>
              </div>
            </div>
          </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="css">
.case-selection-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.case-selection-container {
  width: 90%;
  max-width: 1400px;
  max-height: 90vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 100%);
  border: 1px solid rgba(100, 100, 200, 0.3);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 60px rgba(100, 100, 255, 0.2);
}

.case-selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  border-bottom: 1px solid rgba(100, 100, 200, 0.2);
  background: linear-gradient(90deg, rgba(30, 30, 60, 0.8) 0%, rgba(20, 20, 40, 0.8) 100%);
}

.header-left .title {
  margin: 0;
  font-size: 28px;
  color: #fff;
  font-weight: 700;
  letter-spacing: 2px;
}

.header-left .subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-overview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 16px;
  border-radius: 8px;
}

.progress-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.progress-bar-container {
  width: 120px;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-container.small {
  width: 100%;
  height: 6px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4da6ff, #b366ff);
  transition: width 0.5s ease;
}

.progress-value {
  font-size: 12px;
  color: #4da6ff;
  font-weight: 600;
  min-width: 36px;
}

.icon-btn {
  background: rgba(100, 100, 200, 0.2);
  border: 1px solid rgba(100, 100, 200, 0.4);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.icon-btn:hover {
  background: rgba(100, 100, 200, 0.4);
  transform: translateY(-2px);
}

.close-btn {
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.4);
  color: #ff9999;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.4);
  transform: rotate(90deg);
}

.main-story-timeline {
  padding: 20px 32px;
  border-bottom: 1px solid rgba(100, 100, 200, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1px;
}

.timeline-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 200px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border-left: 3px solid rgba(100, 100, 200, 0.3);
}

.timeline-item.unlocked {
  border-left-color: #4da6ff;
  background: rgba(77, 166, 255, 0.1);
}

.timeline-item.locked {
  opacity: 0.5;
}

.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.timeline-item.unlocked .timeline-dot {
  background: #4da6ff;
  color: #fff;
}

.timeline-item.locked .timeline-dot {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.timeline-content {
  flex: 1;
}

.timeline-title {
  font-size: 14px;
  color: #fff;
  font-weight: 600;
  margin-bottom: 4px;
}

.timeline-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

.cases-grid-section {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.case-card {
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.case-card:hover:not(.locked) {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  border-color: var(--accent);
}

.case-card.locked {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(135deg, #2a2a3a 0%, #1a1a2a 100%);
}

.case-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.case-icon {
  font-size: 24px;
}

.case-designation {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1px;
}

.case-status {
  font-size: 11px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  font-weight: 600;
}

.case-card-body {
  padding: 20px;
}

.case-title {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #fff;
  font-weight: 700;
}

.case-subtitle {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: var(--accent);
  letter-spacing: 2px;
}

.case-summary {
  margin: 0 0 16px 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  min-height: 60px;
}

.case-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.meta-item {
  text-align: center;
}

.meta-label {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2px;
}

.meta-value {
  display: block;
  font-size: 12px;
  color: #fff;
  font-weight: 600;
}

.case-progress {
  margin-bottom: 16px;
}

.progress-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
}

.case-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stat-item {
  text-align: center;
  padding: 8px 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.stat-icon {
  display: block;
  font-size: 16px;
  margin-bottom: 2px;
}

.stat-value {
  display: block;
  font-size: 14px;
  color: #fff;
  font-weight: 700;
}

.stat-label {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.case-card-footer {
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.4);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.footer-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.locked-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-top: 16px;
}

.hint-icon {
  font-size: 20px;
}

.hint-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.case-detail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.case-detail-modal {
  width: 90%;
  max-width: 800px;
  max-height: 85vh;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 80px rgba(0, 0, 0, 0.8);
  border: 2px solid var(--accent);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-title-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-icon {
  font-size: 40px;
}

.detail-title-section h2 {
  margin: 0;
  font-size: 28px;
  color: #fff;
}

.detail-subtitle {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--accent);
  letter-spacing: 2px;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #fff;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.detail-section.classified h4 {
  color: #ff6666;
}

.detail-text {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
}

.detail-text.cover-story {
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
}

.detail-text.classified-text {
  color: #ff9999;
  background: rgba(255, 0, 0, 0.1);
  padding: 16px;
  border-radius: 8px;
  border-left: 3px solid #ff6666;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-box {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
}

.detail-box h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #fff;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row span:first-child {
  color: rgba(255, 255, 255, 0.6);
}

.info-row span:last-child {
  color: #fff;
  font-weight: 500;
}

.crew-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.crew-tag {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
}

.casualty-info {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.related-clues {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.clue-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  font-size: 12px;
}

.clue-category {
  color: var(--accent);
  font-weight: 600;
}

.clue-title {
  color: #fff;
}

.endings-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ending-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.ending-item.locked {
  opacity: 0.5;
}

.ending-icon {
  font-size: 24px;
}

.ending-info {
  flex: 1;
}

.ending-title {
  font-size: 14px;
  color: #fff;
  font-weight: 600;
  margin-bottom: 2px;
}

.ending-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 32px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.secondary-btn {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.secondary-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.primary-btn {
  padding: 12px 32px;
  background: linear-gradient(135deg, var(--accent), #ff66b3);
  border: none;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(255, 102, 179, 0.4);
}

.section-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: normal;
  margin-left: 8px;
}

.timeline-item.unlocked {
  cursor: pointer;
  transition: all 0.3s;
}

.timeline-item.unlocked:hover {
  transform: translateX(4px);
  background: rgba(77, 166, 255, 0.2);
  border-left-color: #80bfff;
}

.main-story-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  backdrop-filter: blur(12px);
}

.main-story-modal {
  width: 85%;
  max-width: 700px;
  max-height: 85vh;
  background: linear-gradient(135deg, #0f0f2e 0%, #1a1a4a 50%, #2a1a4a 100%);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 100px rgba(100, 100, 255, 0.3), inset 0 0 60px rgba(100, 100, 255, 0.05);
  border: 2px solid rgba(150, 100, 255, 0.4);
}

.main-story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 36px;
  background: linear-gradient(90deg, rgba(60, 40, 120, 0.6) 0%, rgba(80, 40, 140, 0.6) 100%);
  border-bottom: 1px solid rgba(150, 100, 255, 0.3);
}

.main-story-title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.main-story-icon {
  font-size: 48px;
  filter: drop-shadow(0 0 20px rgba(150, 100, 255, 0.6));
}

.main-story-title-section h2 {
  margin: 0;
  font-size: 28px;
  color: #fff;
  letter-spacing: 2px;
  text-shadow: 0 0 20px rgba(150, 100, 255, 0.5);
}

.main-story-subtitle {
  margin: 6px 0 0 0;
  font-size: 14px;
  color: #b388ff;
  letter-spacing: 3px;
}

.main-story-content {
  flex: 1;
  overflow-y: auto;
  padding: 36px;
}

.reveal-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.92);
  line-height: 2;
  white-space: pre-wrap;
  padding: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border-left: 4px solid #b388ff;
  margin-bottom: 28px;
  letter-spacing: 0.5px;
}

.main-story-meta {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.meta-section h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #b388ff;
  letter-spacing: 1px;
}

.meta-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-tag {
  padding: 8px 16px;
  background: rgba(100, 200, 100, 0.15);
  border: 1px solid rgba(100, 200, 100, 0.4);
  border-radius: 20px;
  font-size: 13px;
  color: #90ee90;
}

.final-revelation {
  margin-top: 32px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 200, 100, 0.1) 0%, rgba(255, 150, 50, 0.15) 100%);
  border-radius: 12px;
  border: 1px solid rgba(255, 200, 100, 0.4);
  text-align: center;
}

.final-revelation h4 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #ffcc66;
  text-shadow: 0 0 20px rgba(255, 200, 100, 0.4);
}

.final-revelation p {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.main-story-footer {
  display: flex;
  justify-content: center;
  padding: 24px 36px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(150, 100, 255, 0.2);
}

.main-story-footer .primary-btn {
  background: linear-gradient(135deg, #8844ff, #b366ff);
  padding: 14px 48px;
  font-size: 15px;
  letter-spacing: 2px;
}

.main-story-footer .primary-btn:hover {
  box-shadow: 0 4px 30px rgba(150, 100, 255, 0.5);
}
</style>

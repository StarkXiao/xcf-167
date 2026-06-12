<script lang="ts">
  import { caseLinkageState, unlockedCrossCaseClues, closeClueBoard, getCluesByCategory } from '../lib/caseLinkage';
  import { crossCaseClues, caseDefinitions, mainStoryBeats } from '../data/caseLinkage';
  import { CROSS_CASE_CATEGORY_LABELS, CASE_THEMES } from '../types/caseLinkage';
  import type { CrossCaseClue } from '../types/caseLinkage';

  let selectedCategory: CrossCaseClue['category'] | 'all' = 'all';
  let selectedClue: CrossCaseClue | null = null;
  let showClueDetail = false;

  const categories: Array<{ id: CrossCaseClue['category'] | 'all'; label: string; icon: string }> = [
    { id: 'all', label: '全部', icon: '📋' },
    { id: 'protocol', label: '协议关联', icon: '📜' },
    { id: 'personnel', label: '人员关联', icon: '👥' },
    { id: 'technology', label: '技术关联', icon: '⚙️' },
    { id: 'creature', label: '生物关联', icon: '🐙' },
    { id: 'organization', label: '组织关联', icon: '🏢' },
    { id: 'location', label: '地点关联', icon: '📍' }
  ];

  const getFilteredClues = (): CrossCaseClue[] => {
    if (selectedCategory === 'all') {
      return $unlockedCrossCaseClues;
    }
    return getCluesByCategory(selectedCategory as CrossCaseClue['category']);
  };

  const getCategoryCount = (catId: CrossCaseClue['category'] | 'all'): number => {
    if (catId === 'all') {
      return $unlockedCrossCaseClues.length;
    }
    return getCluesByCategory(catId).length;
  };

  const getSourceCaseLabel = (caseId: string): string => {
    return caseDefinitions[caseId]?.title || caseId;
  };

  const getSourceCaseTheme = (caseId: string) => {
    return CASE_THEMES[caseId as keyof typeof CASE_THEMES] || CASE_THEMES.case_abyss;
  };

  const handleClueClick = (clue: CrossCaseClue) => {
    selectedClue = clue;
    showClueDetail = true;
  };

  const handleClose = () => {
    closeClueBoard();
    showClueDetail = false;
    selectedClue = null;
  };

  const getImportanceStars = (importance: number): string => {
    return '⭐'.repeat(Math.min(importance, 5));
  };

  const isClueUnlocked = (clueId: string): boolean => {
    return $unlockedCrossCaseClues.some(c => c.id === clueId);
  };

  const getMainStoryProgress = (): number => {
    const unlocked = $caseLinkageState.mainStoryBeats.filter(b => b.isUnlocked).length;
    const total = $caseLinkageState.mainStoryBeats.length;
    return Math.round((unlocked / total) * 100);
  };

  const getSelectedClueTheme = () => {
    if (!selectedClue) return CASE_THEMES.case_abyss;
    return getSourceCaseTheme(selectedClue.sourceCaseId);
  };

  const getUnlockedMainStoryBeat = (beatId: string) => {
    return mainStoryBeats.find(b => b.id === beatId);
  };
</script>

{#if $caseLinkageState.isClueBoardOpen}
  <div class="clue-board-overlay" on:click|self={handleClose}>
    <div class="clue-board-container">
      <div class="clue-board-header">
        <div class="header-left">
          <h2 class="title">🔗 跨案线索汇总板</h2>
          <p class="subtitle">连接三起深海事故的真相脉络</p>
        </div>
        <div class="header-right">
          <div class="progress-info">
            <span class="progress-label">线索收集</span>
            <span class="progress-count">{$unlockedCrossCaseClues.length}/{crossCaseClues.length}</span>
          </div>
          <div class="progress-info">
            <span class="progress-label">主线进度</span>
            <span class="progress-count">{getMainStoryProgress()}%</span>
          </div>
          <button class="close-btn" on:click={handleClose}>✕</button>
        </div>
      </div>

      <div class="clue-board-body">
        <div class="sidebar">
          <div class="stats-panel">
            <h3 class="panel-title">📊 统计信息</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">{$caseLinkageState.totalCluesCollected}</div>
                <div class="stat-label">总线索数</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{$caseLinkageState.totalEvidenceCollected}</div>
                <div class="stat-label">证据数量</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">{Object.values($caseLinkageState.cases).filter(c => c.status === 'completed').length}</div>
                <div class="stat-label">已完成案件</div>
              </div>
              <div class="stat-card key">
                <div class="stat-value">{crossCaseClues.filter(c => c.isKeyEvidence && isClueUnlocked(c.id)).length}</div>
                <div class="stat-label">关键证据</div>
              </div>
            </div>
          </div>

          <div class="category-panel">
            <h3 class="panel-title">📁 分类筛选</h3>
            <div class="category-list">
              {#each categories as cat}
                <button
                  class="category-btn {selectedCategory === cat.id ? 'active' : ''}"
                  on:click={() => selectedCategory = cat.id}
                >
                  <span class="cat-icon">{cat.icon}</span>
                  <span class="cat-label">{cat.label}</span>
                  <span class="cat-count">
                    {getCategoryCount(cat.id)}
                  </span>
                </button>
              {/each}
            </div>
          </div>

          <div class="timeline-panel">
            <h3 class="panel-title">📅 时间线</h3>
            <div class="timeline-list">
              {#each crossCaseClues.filter(c => isClueUnlocked(c.id)).sort((a, b) => a.timelinePosition.localeCompare(b.timelinePosition)) as clue}
                <div class="timeline-item">
                  <div class="timeline-dot" style="background: {getSourceCaseTheme(clue.sourceCaseId).accent};"></div>
                  <div class="timeline-content">
                    <div class="timeline-time">{clue.timelinePosition}</div>
                    <div class="timeline-title">{clue.title}</div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="main-content">
          <div class="clues-header">
            <h3 class="section-title">
              {categories.find(c => c.id === selectedCategory)?.icon}
              {categories.find(c => c.id === selectedCategory)?.label}
            </h3>
            <div class="clue-count-badge">
              共 {getFilteredClues().length} 条线索
            </div>
          </div>

          <div class="clues-grid">
            {#each getFilteredClues() as clue}
              <div
                class="clue-card {clue.isKeyEvidence ? 'key' : ''}"
                style="--accent: {getSourceCaseTheme(clue.sourceCaseId).accent}; --primary: {getSourceCaseTheme(clue.sourceCaseId).primary};"
                on:click={() => handleClueClick(clue)}
              >
                <div class="clue-card-header">
                  <div class="clue-source" style="background: {getSourceCaseTheme(clue.sourceCaseId).primary};">
                    <span class="source-case">{getSourceCaseLabel(clue.sourceCaseId)}</span>
                    {#if clue.isKeyEvidence}
                      <span class="key-badge">🔑 关键</span>
                    {/if}
                  </div>
                  <div class="clue-importance">
                    {getImportanceStars(clue.importance)}
                  </div>
                </div>
                
                <div class="clue-card-body">
                  <h4 class="clue-title">{clue.title}</h4>
                  <p class="clue-description">{clue.description}</p>
                  
                  <div class="clue-category-tag">
                    [{CROSS_CASE_CATEGORY_LABELS[clue.category]}]
                  </div>
                </div>

                <div class="clue-card-footer">
                  <div class="related-cases">
                    <span class="related-label">关联案件：</span>
                    {#each clue.relatedCaseIds as caseId, i}
                      <span class="related-case" style="color: {getSourceCaseTheme(caseId).accent};">
                        {caseDefinitions[caseId]?.icon} {caseDefinitions[caseId]?.title}
                        {#if i < clue.relatedCaseIds.length - 1}、{/if}
                      </span>
                    {/each}
                  </div>
                </div>
              </div>
            {/each}

            {#if getFilteredClues().length === 0}
              <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <div class="empty-text">暂无该分类的线索</div>
                <div class="empty-hint">继续调查以解锁更多线索</div>
              </div>
            {/if}
          </div>

          <div class="locked-clues-section">
            <h3 class="section-title">🔒 待解锁线索</h3>
            <div class="locked-clues-grid">
              {#each crossCaseClues.filter(c => !isClueUnlocked(c.id)) as clue}
                <div class="locked-clue-card">
                  <div class="locked-icon">❓</div>
                  <div class="locked-info">
                    <div class="locked-title">???</div>
                    <div class="locked-hint">
                      来源：{getSourceCaseLabel(clue.sourceCaseId)}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>

      {#if showClueDetail && selectedClue}
        <div class="clue-detail-overlay" on:click|self={() => { showClueDetail = false; selectedClue = null; }}>
          <div class="clue-detail-modal" style="--accent: {getSelectedClueTheme().accent}; --primary: {getSelectedClueTheme().primary};">
            <div class="detail-header">
              <div class="detail-title-section">
                <span class="detail-category">[{CROSS_CASE_CATEGORY_LABELS[selectedClue.category]}]</span>
                <h2>{selectedClue.title}</h2>
              </div>
              <button class="close-btn" on:click={() => { showClueDetail = false; selectedClue = null; }}>✕</button>
            </div>

            <div class="detail-content">
              <div class="detail-meta">
                <div class="meta-badge" style="background: {getSelectedClueTheme().primary};">
                  📂 {getSourceCaseLabel(selectedClue.sourceCaseId)}
                </div>
                {#if selectedClue.isKeyEvidence}
                  <div class="meta-badge key">🔑 关键证据</div>
                {/if}
                <div class="meta-badge">
                  ⭐ 重要度：{selectedClue.importance}/10
                </div>
                <div class="meta-badge">
                  📅 {selectedClue.timelinePosition}
                </div>
              </div>

              <div class="detail-section">
                <h4>📝 线索描述</h4>
                <p class="detail-text">{selectedClue.description}</p>
              </div>

              <div class="detail-section">
                <h4>🔗 关联案件</h4>
                <div class="related-cases-detail">
                  {#each selectedClue.relatedCaseIds as caseId}
                    <div class="related-case-card" style="--accent: {getSourceCaseTheme(caseId).accent};">
                      <span class="case-icon">{caseDefinitions[caseId]?.icon}</span>
                      <span class="case-name">{caseDefinitions[caseId]?.title}</span>
                    </div>
                  {/each}
                </div>
              </div>

              {#if selectedClue.unlocksMainStoryBeat && getUnlockedMainStoryBeat(selectedClue.unlocksMainStoryBeat)}
                <div class="detail-section story-beat">
                  <h4>🎭 解锁主线剧情</h4>
                  <div class="beat-card">
                    <div class="beat-title">{getUnlockedMainStoryBeat(selectedClue.unlocksMainStoryBeat)?.title}</div>
                    <div class="beat-desc">{getUnlockedMainStoryBeat(selectedClue.unlocksMainStoryBeat)?.description}</div>
                  </div>
                </div>
              {/if}

              <div class="detail-section">
                <h4>💡 推理提示</h4>
                <div class="deduction-hint">
                  {#if selectedClue.importance >= 8}
                    <p>这条线索非常重要！它可能揭示了事件的核心真相。尝试将它与其他高重要度的线索联系起来。</p>
                  {:else if selectedClue.importance >= 5}
                    <p>这条线索值得关注。它可能是连接多个案件的关键节点。</p>
                  {:else}
                    <p>这条线索提供了一些背景信息。虽然不是核心证据，但可能在某个时刻派上用场。</p>
                  {/if}
                </div>
              </div>
            </div>

            <div class="detail-footer">
              <button class="secondary-btn" on:click={() => { showClueDetail = false; selectedClue = null; }}>
                关闭
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="css">
.clue-board-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
}

.clue-board-container {
  width: 95%;
  max-width: 1600px;
  max-height: 92vh;
  background: linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 100%);
  border: 1px solid rgba(100, 100, 200, 0.3);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 80px rgba(100, 100, 255, 0.15);
}

.clue-board-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid rgba(100, 100, 200, 0.2);
  background: linear-gradient(90deg, rgba(20, 20, 50, 0.8) 0%, rgba(10, 10, 30, 0.8) 100%);
}

.header-left .title {
  margin: 0;
  font-size: 26px;
  color: #fff;
  font-weight: 700;
  letter-spacing: 2px;
}

.header-left .subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 3px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.progress-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.progress-count {
  font-size: 16px;
  color: #4da6ff;
  font-weight: 700;
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
}

.clue-board-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  border-right: 1px solid rgba(100, 100, 200, 0.15);
  padding: 20px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.2);
}

.stats-panel, .category-panel, .timeline-panel {
  margin-bottom: 24px;
}

.panel-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 1px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(100, 100, 200, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-card {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  border: 1px solid rgba(100, 100, 200, 0.1);
}

.stat-card.key {
  border-color: rgba(255, 200, 100, 0.3);
  background: rgba(255, 200, 100, 0.1);
}

.stat-value {
  font-size: 24px;
  color: #4da6ff;
  font-weight: 700;
  margin-bottom: 2px;
}

.stat-card.key .stat-value {
  color: #ffc864;
}

.stat-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  transition: all 0.2s;
}

.category-btn:hover {
  background: rgba(100, 100, 200, 0.1);
  color: #fff;
}

.category-btn.active {
  background: rgba(77, 166, 255, 0.2);
  border-color: rgba(77, 166, 255, 0.4);
  color: #4da6ff;
}

.cat-icon {
  font-size: 16px;
}

.cat-label {
  flex: 1;
  text-align: left;
}

.cat-count {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 10px;
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 8px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  position: relative;
  padding-left: 4px;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 20px;
  width: 2px;
  height: calc(100% + 12px);
  background: rgba(100, 100, 200, 0.2);
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 3px;
  box-shadow: 0 0 8px currentColor;
}

.timeline-time {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2px;
}

.timeline-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.3;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.clues-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  color: #fff;
  letter-spacing: 1px;
}

.clue-count-badge {
  padding: 6px 14px;
  background: rgba(77, 166, 255, 0.2);
  border-radius: 20px;
  font-size: 12px;
  color: #4da6ff;
}

.clues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.clue-card {
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.8) 0%, rgba(20, 20, 40, 0.8) 100%);
  border: 1px solid rgba(100, 100, 200, 0.2);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.clue-card:hover {
  transform: translateY(-3px);
  border-color: var(--accent);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
}

.clue-card.key {
  border-color: rgba(255, 200, 100, 0.4);
}

.clue-card.key:hover {
  box-shadow: 0 6px 24px rgba(255, 200, 100, 0.2);
}

.clue-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.clue-source {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 12px;
}

.source-case {
  font-size: 11px;
  color: #fff;
  font-weight: 600;
}

.key-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: rgba(255, 200, 100, 0.3);
  border-radius: 8px;
  color: #ffc864;
}

.clue-importance {
  font-size: 10px;
  letter-spacing: -1px;
}

.clue-card-body {
  padding: 16px;
}

.clue-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #fff;
  font-weight: 600;
}

.clue-description {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  min-height: 40px;
}

.clue-category-tag {
  font-size: 11px;
  color: var(--accent);
  font-weight: 600;
}

.clue-card-footer {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.related-cases {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.related-label {
  color: rgba(255, 255, 255, 0.4);
}

.related-case {
  font-weight: 500;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.locked-clues-section {
  margin-top: 32px;
}

.locked-clues-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.locked-clue-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  opacity: 0.5;
}

.locked-icon {
  font-size: 24px;
}

.locked-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 2px;
}

.locked-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.clue-detail-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.clue-detail-modal {
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  background: linear-gradient(135deg, rgba(30, 30, 60, 0.95) 0%, rgba(20, 20, 40, 0.95) 100%);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 2px solid var(--accent);
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.8);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.detail-category {
  font-size: 12px;
  color: var(--accent);
  letter-spacing: 2px;
  display: block;
  margin-bottom: 4px;
}

.detail-title-section h2 {
  margin: 0;
  font-size: 24px;
  color: #fff;
}

.detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.meta-badge {
  padding: 6px 14px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  font-size: 12px;
  color: #fff;
}

.meta-badge.key {
  background: rgba(255, 200, 100, 0.2);
  color: #ffc864;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(100, 100, 200, 0.2);
}

.detail-text {
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.8;
}

.related-cases-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.related-case-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 13px;
  color: #fff;
}

.related-case-card .case-icon {
  font-size: 18px;
}

.beat-card {
  padding: 16px;
  background: linear-gradient(135deg, rgba(77, 166, 255, 0.1) 0%, rgba(179, 102, 255, 0.1) 100%);
  border-radius: 8px;
  border: 1px solid rgba(77, 166, 255, 0.3);
}

.beat-title {
  font-size: 16px;
  color: #4da6ff;
  font-weight: 600;
  margin-bottom: 6px;
}

.beat-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
}

.deduction-hint {
  padding: 16px;
  background: rgba(255, 200, 100, 0.1);
  border-radius: 8px;
  border-left: 3px solid #ffc864;
}

.deduction-hint p {
  margin: 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 28px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.secondary-btn {
  padding: 10px 24px;
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
</style>

<script lang="ts">
  import type { NoiseChallenge, NoiseSegment } from '../types/game';
  import {
    signalAnalysis,
    toggleNoiseSegment,
    submitNoiseChallenge,
    resetSelections,
    backToHubView
  } from '../lib/signalAnalysis';
  import { playSFX } from '../lib/audio';

  export let challenge: NoiseChallenge;

  let feedbackMessage: { text: string; type: 'success' | 'error' | 'info' } | null = null;
  let feedbackTimeout: number | null = null;
  let selectedSegmentDetail: NoiseSegment | null = null;
  let lastResult: { success: boolean; score: number; isPerfect: boolean } | null = null;
  let playingSegmentId: string | null = null;
  let audioTimeouts: number[] = [];
  let currentHintIndex = 0;

  $: selectedCount = $signalAnalysis.selectedSegmentIds.length;
  $: requiredCount = challenge.targetSegmentIds.length;
  $: alreadyCompleted = $signalAnalysis.noiseProgress.find(p => p.challengeId === challenge.id)?.status === 'completed';
  $: totalDuration = challenge.segments.length > 0
    ? Math.max(...challenge.segments.map(s => s.endTime))
    : 0;

  function getDifficultyColor(diff: string): string {
    switch (diff) {
      case 'easy': return '#66ff99';
      case 'medium': return '#ffcc66';
      case 'hard': return '#ff6666';
      default: return '#cccccc';
    }
  }

  function getDifficultyLabel(diff: string): string {
    switch (diff) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return diff;
    }
  }

  function getCategoryColor(category?: string): string {
    switch (category) {
      case 'human': return '#88ccff';
      case 'machine': return '#cccc66';
      case 'creature': return '#66ddaa';
      case 'interference': return '#888888';
      case 'encrypted': return '#ff88cc';
      default: return '#aaaaaa';
    }
  }

  function getCategoryLabel(category?: string): string {
    switch (category) {
      case 'human': return '人声';
      case 'machine': return '机械';
      case 'creature': return '生物';
      case 'interference': return '干扰';
      case 'encrypted': return '加密';
      default: return '未知';
    }
  }

  function isSelected(segmentId: string): boolean {
    return $signalAnalysis.selectedSegmentIds.includes(segmentId);
  }

  function handleSegmentClick(segment: NoiseSegment) {
    if (alreadyCompleted) return;
    selectedSegmentDetail = segment;
  }

  function handleSegmentSelect(segment: NoiseSegment, e: Event) {
    e.stopPropagation();
    if (alreadyCompleted) return;
    toggleNoiseSegment(segment.id);
  }

  function handlePlaySegment(segment: NoiseSegment, e: Event) {
    e.stopPropagation();
    if (playingSegmentId) return;

    playingSegmentId = segment.id;
    audioTimeouts.forEach(t => clearTimeout(t));
    audioTimeouts = [];

    playSFX('sonar', 0.2);

    const duration = (segment.endTime - segment.startTime) * 300;
    const interval = Math.max(60, duration / segment.waveform.length);

    segment.waveform.forEach((_, i) => {
      const t = window.setTimeout(() => {
        const v = Math.abs(segment.waveform[i]);
        if (v > 0.6) {
          playSFX(i % 3 === 0 ? 'static' : 'bubbles', v * 0.15);
        }
      }, i * interval);
      audioTimeouts.push(t);
    });

    const endT = window.setTimeout(() => {
      playingSegmentId = null;
    }, duration + 200);
    audioTimeouts.push(endT);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  }

  function showFeedback(text: string, type: 'success' | 'error' | 'info') {
    feedbackMessage = { text, type };
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => {
      feedbackMessage = null;
    }, 5000);
  }

  function handleSubmit() {
    if (alreadyCompleted) return;
    if (selectedCount === 0) {
      playSFX('warning');
      showFeedback('请至少选择一个音频片段', 'error');
      return;
    }
    const result = submitNoiseChallenge();
    lastResult = { success: result.success, score: result.score, isPerfect: result.isPerfect };
    showFeedback(result.feedback, result.success ? 'success' : 'error');
  }

  function handleReset() {
    resetSelections();
    showFeedback('已清除所有选择', 'info');
  }

  function showNextHint() {
    if (!challenge.hints || challenge.hints.length === 0) return;
    const hint = challenge.hints[currentHintIndex % challenge.hints.length];
    showFeedback(`💡 提示：${hint}`, 'info');
    currentHintIndex++;
  }

  function renderWaveform(segment: NoiseSegment): string {
    const width = 100;
    const height = 30;
    const barCount = segment.waveform.length;
    const barWidth = width / barCount;
    let bars = '';
    const center = height / 2;

    segment.waveform.forEach((v, i) => {
      const x = i * barWidth;
      const amp = Math.abs(v) * (height / 2) * 0.9;
      const isPlaying = playingSegmentId === segment.id;
      const progress = isPlaying ? i / barCount : 1;
      const alpha = isPlaying ? (i / barCount < progress ? 0.9 : 0.3) : 0.75;
      const catColor = getCategoryColor(segment.category);

      bars += `<rect x="${x.toFixed(2)}%" y="${(center - amp).toFixed(2)}" width="${Math.max(0.5, barWidth - 0.3).toFixed(2)}%" height="${(amp * 2).toFixed(2)}" rx="1" fill="${catColor}" opacity="${alpha}"/>`;
    });

    return `
      <svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" width="100%" height="${height}">
        <line x1="0" y1="${center}" x2="100" y2="${center}" stroke="#2a3a4a" stroke-width="0.4" stroke-dasharray="2,2"/>
        ${bars}
      </svg>
    `;
  }

  function getSegmentLeft(segment: NoiseSegment): string {
    if (totalDuration === 0) return '0%';
    return `${(segment.startTime / totalDuration) * 100}%`;
  }

  function getSegmentWidth(segment: NoiseSegment): string {
    if (totalDuration === 0) return '10%';
    return `${Math.max(8, ((segment.endTime - segment.startTime) / totalDuration) * 100)}%`;
  }
</script>

<div class="noise-challenge">
  <div class="challenge-header">
    <button class="back-btn" on:click={backToHubView}>← 返回</button>
    <div class="title-area">
      <h2>{challenge.title}</h2>
      <span class="difficulty-badge" style="color: {getDifficultyColor(challenge.difficulty)}">
        ● {getDifficultyLabel(challenge.difficulty)}
      </span>
      {#if alreadyCompleted}
        <span class="completed-badge">✓ 已完成</span>
      {/if}
    </div>
    {#if challenge.hints && challenge.hints.length > 0 && !alreadyCompleted}
      <button class="hint-btn" on:click={showNextHint}>💡 提示</button>
    {/if}
  </div>

  <div class="challenge-desc">
    <p>{challenge.description}</p>
    <p class="selection-hint">
      目标类别：<strong style="color: {getCategoryColor(challenge.targetCategory)}">[{getCategoryLabel(challenge.targetCategory)}]</strong>
      ，需选择 <strong>{requiredCount}</strong> 个片段，已选择 <strong>{selectedCount}</strong> 个
    </p>
  </div>

  {#if lastResult}
    <div class="last-result" class:success={lastResult.success}>
      {#if lastResult.success}
        <span class="result-icon">✓</span>
        <span>分析成功！得分：<strong>{lastResult.score}</strong> {lastResult.isPerfect ? '(完美！)' : ''}</span>
      {:else}
        <span class="result-icon">✗</span>
        <span>本次得分：<strong>{lastResult.score}</strong>，可以再次尝试</span>
      {/if}
    </div>
  {/if}

  <div class="timeline-container">
    <div class="timeline-ruler">
      {#each Array.from({ length: 11 }) as _, i}
        <div class="ruler-mark" style="left: {i * 10}%">
          <span>{formatTime((totalDuration / 10) * i)}</span>
        </div>
      {/each}
    </div>

    <div class="segments-track">
      {#each challenge.segments as segment}
        <div
          class="segment-bar"
          class:selected={isSelected(segment.id)}
          class:playing={playingSegmentId === segment.id}
          class:completed={alreadyCompleted && challenge.targetSegmentIds.includes(segment.id)}
          style="left: {getSegmentLeft(segment)}; width: {getSegmentWidth(segment)}; border-color: {getCategoryColor(segment.category)}"
          on:click={() => handleSegmentClick(segment)}
        >
          <div class="segment-color-indicator" style="background: {getCategoryColor(segment.category)}"></div>
          <div class="segment-waveform">
            {@html renderWaveform(segment)}
          </div>
          <div class="segment-checkbox" on:click={(e) => handleSegmentSelect(segment, e)}>
            {#if isSelected(segment.id)}
              <span>✓</span>
            {/if}
          </div>
          <button
            class="play-btn"
            on:click={(e) => handlePlaySegment(segment, e)}
            disabled={playingSegmentId !== null}
          >
            {#if playingSegmentId === segment.id}
              ♪
            {:else}
              ▶
            {/if}
          </button>
        </div>
      {/each}
    </div>

    <div class="category-legend">
      {#each ['human', 'machine', 'creature', 'interference', 'encrypted'] as cat}
        <div class="legend-item">
          <span class="legend-color" style="background: {getCategoryColor(cat)}"></span>
          <span>{getCategoryLabel(cat)}</span>
        </div>
      {/each}
    </div>
  </div>

  {#if selectedSegmentDetail}
    <div class="segment-detail-panel">
      <div class="detail-header">
        <h3>{selectedSegmentDetail.label}</h3>
        <span class="time-range">
          {formatTime(selectedSegmentDetail.startTime)} - {formatTime(selectedSegmentDetail.endTime)}
        </span>
      </div>
      <div class="detail-tags">
        <span class="category-tag" style="background: {getCategoryColor(selectedSegmentDetail.category)}20; color: {getCategoryColor(selectedSegmentDetail.category)}">
          {getCategoryLabel(selectedSegmentDetail.category)}
        </span>
        {#if selectedSegmentDetail.isTarget}
          <span class="target-tag" class:visible={alreadyCompleted}>★ 目标片段</span>
        {/if}
      </div>
      <div class="detail-waveform-large">
        {@html renderWaveform(selectedSegmentDetail)}
      </div>
    </div>
  {/if}

  <div class="action-bar">
    <button class="reset-btn" on:click={handleReset} disabled={alreadyCompleted}>
      清除选择
    </button>
    <button
      class="submit-btn"
      on:click={handleSubmit}
      disabled={alreadyCompleted || selectedCount === 0}
    >
      {alreadyCompleted ? '已完成分析' : '提交分析结果'}
    </button>
  </div>

  {#if feedbackMessage}
    <div class="feedback-toast" class:success={feedbackMessage.type === 'success'} class:error={feedbackMessage.type === 'error'}>
      {feedbackMessage.text}
    </div>
  {/if}
</div>

<style>
  .noise-challenge {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 20px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .challenge-header {
    display: flex;
    align-items: center;
    gap: 16px;
    border-bottom: 1px solid #2a3a4a;
    padding-bottom: 16px;
  }

  .back-btn, .hint-btn {
    background: transparent;
    border: 1px solid #3a4a5a;
    color: #88aacc;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }

  .back-btn:hover, .hint-btn:hover {
    background: rgba(80, 120, 160, 0.15);
    color: #aaccee;
  }

  .hint-btn {
    margin-left: auto;
  }

  .title-area {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
  }

  .title-area h2 {
    margin: 0;
    font-size: 19px;
    color: #e0e8f0;
  }

  .difficulty-badge {
    font-size: 12px;
    font-weight: 600;
  }

  .completed-badge {
    background: rgba(102, 255, 153, 0.15);
    color: #66ff99;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
  }

  .challenge-desc p {
    margin: 0 0 6px 0;
    color: #a0b0c0;
    line-height: 1.7;
    font-size: 14px;
  }

  .selection-hint {
    font-size: 13px !important;
    color: #6688aa !important;
  }

  .selection-hint strong {
    color: #88ccff;
  }

  .last-result {
    background: rgba(255, 102, 102, 0.1);
    border: 1px solid rgba(255, 102, 102, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #ffaa99;
  }

  .last-result.success {
    background: rgba(102, 255, 153, 0.1);
    border-color: rgba(102, 255, 153, 0.3);
    color: #88ffbb;
  }

  .result-icon {
    font-size: 18px;
    font-weight: bold;
  }

  .timeline-container {
    background: rgba(10, 20, 30, 0.6);
    border: 1px solid #2a3a4a;
    border-radius: 12px;
    padding: 16px;
  }

  .timeline-ruler {
    position: relative;
    height: 20px;
    margin-bottom: 10px;
  }

  .ruler-mark {
    position: absolute;
    transform: translateX(-50%);
    font-size: 10px;
    color: #556677;
    font-family: monospace;
  }

  .segments-track {
    position: relative;
    height: 260px;
    background: linear-gradient(180deg, #0a1420 0%, #050a10 100%);
    border-radius: 8px;
    border: 1px solid #1a2a3a;
  }

  .segment-bar {
    position: absolute;
    height: 48px;
    border: 2px solid;
    border-radius: 6px;
    background: rgba(15, 30, 45, 0.7);
    transition: all 0.2s ease;
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
  }

  .segment-bar:nth-child(1) { top: 8px; }
  .segment-bar:nth-child(2) { top: 64px; }
  .segment-bar:nth-child(3) { top: 120px; }
  .segment-bar:nth-child(4) { top: 176px; }
  .segment-bar:nth-child(n+5) { top: calc(176px + ((var(--n) - 4) * 56px)); }

  .segment-bar:hover {
    transform: scaleY(1.05);
    z-index: 5;
  }

  .segment-bar.selected {
    box-shadow: 0 0 0 2px rgba(102, 170, 238, 0.5), 0 0 20px rgba(102, 170, 238, 0.2);
    z-index: 6;
  }

  .segment-bar.playing {
    animation: pulse-glow 0.6s ease-in-out infinite alternate;
  }

  @keyframes pulse-glow {
    from { box-shadow: 0 0 8px rgba(102, 204, 255, 0.4); }
    to { box-shadow: 0 0 24px rgba(102, 204, 255, 0.7); }
  }

  .segment-bar.completed {
    border-color: rgba(102, 255, 153, 0.5) !important;
    background: rgba(102, 255, 153, 0.06);
  }

  .segment-color-indicator {
    width: 4px;
    height: 100%;
    flex-shrink: 0;
  }

  .segment-waveform {
    flex: 1;
    padding: 0 6px;
  }

  .segment-checkbox {
    width: 22px;
    height: 22px;
    margin: 0 6px;
    border: 1px solid #4a6a8a;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(10, 20, 30, 0.8);
    flex-shrink: 0;
    font-size: 12px;
    color: #88eeaa;
    font-weight: bold;
  }

  .play-btn {
    width: 26px;
    height: 26px;
    margin: 0 6px 0 0;
    border: 1px solid #4a6a8a;
    border-radius: 50%;
    background: rgba(30, 50, 70, 0.8);
    color: #88ccff;
    cursor: pointer;
    flex-shrink: 0;
    font-size: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .play-btn:hover:not(:disabled) {
    background: rgba(60, 100, 140, 0.8);
  }

  .play-btn:disabled {
    opacity: 0.4;
    cursor: wait;
  }

  .category-legend {
    display: flex;
    justify-content: center;
    gap: 18px;
    margin-top: 14px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: #778899;
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }

  .segment-detail-panel {
    background: rgba(15, 25, 40, 0.8);
    border: 1px solid #3a4a5a;
    border-radius: 10px;
    padding: 16px;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .detail-header h3 {
    margin: 0;
    font-size: 15px;
    color: #d0e0f0;
  }

  .time-range {
    font-size: 12px;
    color: #6688aa;
    font-family: monospace;
  }

  .detail-tags {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .category-tag {
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 11px;
  }

  .target-tag {
    background: rgba(255, 204, 102, 0.15);
    color: #ffcc66;
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 11px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .target-tag.visible {
    opacity: 1;
  }

  .detail-waveform-large {
    background: #050a10;
    border-radius: 6px;
    border: 1px solid #1a2a3a;
    padding: 12px;
    height: 60px;
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid #2a3a4a;
    gap: 12px;
  }

  .reset-btn {
    background: transparent;
    border: 1px solid #3a4a5a;
    color: #88aacc;
    padding: 10px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
  }

  .reset-btn:hover:not(:disabled) {
    background: rgba(120, 80, 80, 0.15);
    border-color: #664a4a;
    color: #ddaaaa;
  }

  .reset-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .submit-btn {
    background: linear-gradient(135deg, #3366aa, #4488cc);
    color: #fff;
    border: none;
    padding: 10px 28px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
  }

  .submit-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4477bb, #5599dd);
  }

  .submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .feedback-toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(40, 60, 90, 0.95);
    border: 1px solid #4a6a8a;
    padding: 14px 24px;
    border-radius: 10px;
    color: #a0c0e0;
    max-width: 500px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 1000;
    font-size: 14px;
    line-height: 1.6;
  }

  .feedback-toast.success {
    background: rgba(40, 80, 60, 0.95);
    border-color: #4a8a6a;
    color: #99eebb;
  }

  .feedback-toast.error {
    background: rgba(80, 40, 50, 0.95);
    border-color: #8a4a5a;
    color: #eeaaaa;
  }
</style>

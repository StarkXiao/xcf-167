<script lang="ts">
  import { onMount } from 'svelte';
  import type { SonarChallenge, SonarPattern } from '../types/game';
  import {
    signalAnalysis,
    toggleSonarPattern,
    submitSonarChallenge,
    resetSelections,
    backToHubView
  } from '../lib/signalAnalysis';
  import { getSonarChallenge } from '../data/signalAnalysis';
  import { playSFX } from '../lib/audio';

  export let challenge: SonarChallenge;

  let feedbackMessage: { text: string; type: 'success' | 'error' | 'info' } | null = null;
  let feedbackTimeout: number | null = null;
  let selectedPatternDetail: SonarPattern | null = null;
  let lastResult: { success: boolean; score: number; isPerfect: boolean } | null = null;

  $: selectedCount = $signalAnalysis.selectedPatternIds.length;
  $: requiredCount = challenge.targetPatternIds.length;
  $: alreadyCompleted = $signalAnalysis.sonarProgress.find(p => p.challengeId === challenge.id)?.status === 'completed';

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

  function getAnomalyColor(pattern: SonarPattern): string {
    if (selectedPatternDetail?.id !== pattern.id) return '#334455';
    return pattern.isAnomaly ? '#ff8866' : '#66aaff';
  }

  function isSelected(patternId: string): boolean {
    return $signalAnalysis.selectedPatternIds.includes(patternId);
  }

  function handlePatternClick(pattern: SonarPattern) {
    if (alreadyCompleted) return;
    selectedPatternDetail = pattern;
    toggleSonarPattern(pattern.id);
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
      showFeedback('请至少选择一个信号模式', 'error');
      return;
    }
    const result = submitSonarChallenge();
    lastResult = { success: result.success, score: result.score, isPerfect: result.isPerfect };
    showFeedback(result.feedback, result.success ? 'success' : 'error');
  }

  function handleReset() {
    resetSelections();
    showFeedback('已清除所有选择', 'info');
  }

  function getIntensityColor(intensity: number): string {
    const r = Math.round(50 + intensity * 205);
    const g = Math.round(50 + intensity * 150);
    const b = Math.round(255 - intensity * 200);
    return `rgb(${r},${g},${b})`;
  }

  function renderSpectrum(pattern: SonarPattern): string {
    const width = 100;
    const height = 50;
    let rects = '';
    const barWidth = width / pattern.dataPoints.length;
    pattern.dataPoints.forEach((point, i) => {
      const x = i * barWidth;
      const barHeight = (point.intensity * height);
      const y = height - barHeight;
      const color = getIntensityColor(point.intensity);
      rects += `<rect x="${x.toFixed(2)}%" y="${y}" width="${barWidth.toFixed(2)}%" height="${barHeight}" fill="${color}" opacity="0.85"/>`;
    });
    return `
      <svg viewBox="0 0 100 ${height}" preserveAspectRatio="none" width="100%" height="${height}">
        <defs>
          <linearGradient id="bg-${pattern.id}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#0a1a2a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#051018;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg-${pattern.id})"/>
        <line x1="0" y1="${height * 0.25}" x2="100" y2="${height * 0.25}" stroke="#223344" stroke-width="0.3"/>
        <line x1="0" y1="${height * 0.5}" x2="100" y2="${height * 0.5}" stroke="#223344" stroke-width="0.3"/>
        <line x1="0" y1="${height * 0.75}" x2="100" y2="${height * 0.75}" stroke="#223344" stroke-width="0.3"/>
        ${rects}
      </svg>
    `;
  }
</script>

<div class="sonar-challenge">
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
  </div>

  <div class="challenge-desc">
    <p>{challenge.description}</p>
    <p class="selection-hint">
      需要选择 <strong>{requiredCount}</strong> 个异常信号模式，已选择 <strong>{selectedCount}</strong> 个
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

  <div class="pattern-list">
    {#each challenge.patterns as pattern}
      <div
        class="pattern-card"
        class:selected={isSelected(pattern.id)}
        class:completed={alreadyCompleted && challenge.targetPatternIds.includes(pattern.id)}
        on:click={() => handlePatternClick(pattern)}
      >
        <div class="pattern-header">
          <span class="pattern-name">{pattern.name}</span>
          {#if isSelected(pattern.id)}
            <span class="select-check">✓</span>
          {/if}
        </div>
        <div class="spectrum-container">
          {@html renderSpectrum(pattern)}
        </div>
        <div class="pattern-meta">
          <span class="freq-label">
            频率范围：{Math.min(...pattern.dataPoints.map(p => p.frequency)).toFixed(0)} - {Math.max(...pattern.dataPoints.map(p => p.frequency)).toFixed(0)} Hz
          </span>
        </div>
        {#if selectedPatternDetail?.id === pattern.id}
          <div class="pattern-detail">
            <p>{pattern.description}</p>
            {#if pattern.matchKeywords && pattern.matchKeywords.length > 0}
              <div class="keywords">
                {#each pattern.matchKeywords as kw}
                  <span class="keyword-tag">#{kw}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

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
      <pre>{feedbackMessage.text}</pre>
    </div>
  {/if}
</div>

<style>
  .sonar-challenge {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .challenge-header {
    display: flex;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid #2a3a4a;
    padding-bottom: 16px;
  }

  .back-btn {
    background: transparent;
    border: 1px solid #3a4a5a;
    color: #88aacc;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }

  .back-btn:hover {
    background: rgba(80, 120, 160, 0.15);
    color: #aaccee;
  }

  .title-area {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
  }

  .title-area h2 {
    margin: 0;
    font-size: 20px;
    color: #e0e8f0;
  }

  .difficulty-badge {
    font-size: 13px;
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
    margin: 0 0 8px 0;
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

  .pattern-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  .pattern-card {
    background: rgba(15, 30, 45, 0.8);
    border: 1px solid #2a3a4a;
    border-radius: 10px;
    padding: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .pattern-card:hover {
    border-color: #4a6a8a;
    transform: translateY(-2px);
  }

  .pattern-card.selected {
    border-color: #66aaee;
    box-shadow: 0 0 0 2px rgba(102, 170, 238, 0.25), 0 4px 16px rgba(102, 170, 238, 0.15);
  }

  .pattern-card.completed {
    border-color: rgba(102, 255, 153, 0.4);
    background: rgba(102, 255, 153, 0.05);
  }

  .pattern-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .pattern-name {
    font-weight: 600;
    color: #c0d0e0;
    font-size: 14px;
  }

  .select-check {
    background: #66aaee;
    color: #fff;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }

  .spectrum-container {
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #1a2a3a;
    background: #051018;
  }

  .pattern-meta {
    margin-top: 8px;
  }

  .freq-label {
    font-size: 11px;
    color: #6688aa;
    font-family: monospace;
  }

  .pattern-detail {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed #2a3a4a;
  }

  .pattern-detail p {
    margin: 0 0 8px 0;
    font-size: 12px;
    color: #8899aa;
    line-height: 1.6;
  }

  .keywords {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .keyword-tag {
    font-size: 11px;
    background: rgba(102, 170, 238, 0.15);
    color: #88bbee;
    padding: 2px 8px;
    border-radius: 10px;
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

  .feedback-toast pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: inherit;
    line-height: 1.6;
    font-size: 13px;
  }
</style>

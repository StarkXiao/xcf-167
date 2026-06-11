<script lang="ts">
  import type { SubtitleChallenge, SubtitleError } from '../types/game';
  import {
    signalAnalysis,
    setCorrectionInput,
    submitSubtitleChallenge,
    resetSelections,
    backToHubView
  } from '../lib/signalAnalysis';
  import { playSFX } from '../lib/audio';

  export let challenge: SubtitleChallenge;

  let feedbackMessage: { text: string; type: 'success' | 'error' | 'info' } | null = null;
  let feedbackTimeout: number | null = null;
  let selectedErrorDetail: SubtitleError | null = null;
  let lastResult: { success: boolean; score: number; isPerfect: boolean } | null = null;
  let showRevealAnswers = false;

  $: inputs = $signalAnalysis.currentCorrectionInput;
  $: filledCount = challenge.errors.filter(e => (inputs[e.id] || '').trim().length > 0).length;
  $: totalErrors = challenge.errors.length;
  $: alreadyCompleted = $signalAnalysis.subtitleProgress.find(p => p.challengeId === challenge.id)?.status === 'completed';

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

  function getErrorTypeLabel(type: string): string {
    switch (type) {
      case 'character_swap': return '字符错位';
      case 'missing_char': return '字符缺失';
      case 'extra_char': return '多余字符';
      case 'homophone': return '同音混淆';
      case 'contextual': return '语境错误';
      default: return type;
    }
  }

  function getErrorTypeColor(type: string): string {
    switch (type) {
      case 'character_swap': return '#ffaa66';
      case 'missing_char': return '#ff88aa';
      case 'extra_char': return '#cc88ff';
      case 'homophone': return '#66ddcc';
      case 'contextual': return '#ffcc66';
      default: return '#aaaaaa';
    }
  }

  function showFeedback(text: string, type: 'success' | 'error' | 'info') {
    feedbackMessage = { text, type };
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => {
      feedbackMessage = null;
    }, 6000);
  }

  function handleInput(errorId: string, e: Event) {
    if (alreadyCompleted) return;
    const target = e.target as HTMLInputElement;
    setCorrectionInput(errorId, target.value);
  }

  function handleSubmit() {
    if (alreadyCompleted) return;
    if (filledCount === 0) {
      playSFX('warning');
      showFeedback('请至少填写一处修正', 'error');
      return;
    }
    const result = submitSubtitleChallenge();
    lastResult = { success: result.success, score: result.score, isPerfect: result.isPerfect };
    showFeedback(result.feedback, result.success ? 'success' : 'error');
  }

  function handleReset() {
    resetSelections();
    showFeedback('已清除所有输入', 'info');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  function renderCorruptedText(error: SubtitleError): string {
    const text = error.corruptedText;
    const answer = alreadyCompleted || showRevealAnswers ? error.correction : null;

    return text
      .replace(/\*\*([^*]+)\*\*/g, (match, content) => {
        if (answer) {
          return `<span class="error-slot corrected" title="应为：${answer}">
            <span class="wrong-text">${content}</span>
            <span class="arrow">→</span>
            <span class="correct-text">${answer}</span>
          </span>`;
        }
        return `<span class="error-slot">${content}</span>`;
      });
  }
</script>

<div class="subtitle-challenge" on:keydown={handleKeydown}>
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
    {#if alreadyCompleted && challenge.hiddenMessage}
      <button class="reveal-btn" on:click={() => showRevealAnswers = !showRevealAnswers}>
        {showRevealAnswers ? '隐藏' : '显示'}答案
      </button>
    {/if}
  </div>

  <div class="challenge-desc">
    <p>{challenge.description}</p>
    <div class="meta-line">
      <span class="speaker">📢 {challenge.speaker}</span>
      <span class="timestamp">⏱ {challenge.timestamp}</span>
    </div>
    <p class="progress-hint">
      共 <strong>{totalErrors}</strong> 处错误，已填写 <strong>{filledCount}</strong> 处
    </p>
  </div>

  {#if lastResult}
    <div class="last-result" class:success={lastResult.success}>
      {#if lastResult.success}
        <span class="result-icon">✓</span>
        <span>修复完成！得分：<strong>{lastResult.score}</strong> {lastResult.isPerfect ? '(完美！)' : ''}</span>
      {:else}
        <span class="result-icon">✗</span>
        <span>本次得分：<strong>{lastResult.score}</strong>，可以再次尝试</span>
      {/if}
    </div>
  {/if}

  <div class="errors-container">
    {#each challenge.errors as error, index}
      <div
        class="error-card"
        class:completed={alreadyCompleted}
        on:click={() => selectedErrorDetail = error}
      >
        <div class="error-header">
          <div class="error-number">错误 #{index + 1}</div>
          <span class="error-type-tag" style="background: {getErrorTypeColor(error.errorType)}22; color: {getErrorTypeColor(error.errorType)}">
            {getErrorTypeLabel(error.errorType)}
          </span>
        </div>

        <div class="subtitle-display">
          <div class="subtitle-label">原始字幕（包含错误）：</div>
          <div class="subtitle-text corrupted">
            {@html renderCorruptedText(error)}
          </div>
        </div>

        <div class="subtitle-display">
          <div class="subtitle-label">参考原文：</div>
          <div class="subtitle-text original">
            {error.originalText}
          </div>
        </div>

        <div class="input-section">
          <label for="input-{error.id}">
            填入正确文字 <span class="hint">(高亮 <span class="hl-marker">** **</span> 中的错误部分)</span>
          </label>
          <div class="input-row">
            <input
              id="input-{error.id}"
              type="text"
              placeholder="请输入正确的文字..."
              value={inputs[error.id] || ''}
              on:input={(e) => handleInput(error.id, e)}
              disabled={alreadyCompleted}
              class:filled={(inputs[error.id] || '').trim().length > 0}
              class:correct={alreadyCompleted && (inputs[error.id] || '').trim() === error.correction}
              class:wrong={alreadyCompleted && (inputs[error.id] || '').trim() !== error.correction}
            />
            {#if alreadyCompleted}
              <span class="result-indicator">
                {(inputs[error.id] || '').trim() === error.correction ? '✓' : '✗'}
              </span>
            {/if}
          </div>
        </div>

        {#if error.context}
          <div class="context-hint">
            💡 {error.context}
          </div>
        {/if}

        {#if selectedErrorDetail?.id === error.id && error.errorType}
          <div class="error-detail-panel">
            <strong>错误类型说明：</strong>
            {#if error.errorType === 'character_swap'}
              <p>字符位置错位或被替换成了字形相近的其他字。仔细对比上下文找出差异。</p>
            {:else if error.errorType === 'missing_char'}
              <p>句子中缺少了某些字符，可能是信号丢失导致的。根据语义补全缺失部分。</p>
            {:else if error.errorType === 'extra_char'}
              <p>句子中多了不该有的字符，通常是信号干扰产生的噪声。删除多余部分。</p>
            {:else if error.errorType === 'homophone'}
              <p>使用了读音相同但意义不同的字。结合上下文判断正确的词语。</p>
            {:else if error.errorType === 'contextual'}
              <p>语法上没有错误，但结合语境就不对了。想想说话人真正想表达的是什么。</p>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {#if challenge.hiddenMessage}
    <div class="hidden-message-section" class:visible={alreadyCompleted}>
      <div class="hm-header">🔒 隐藏信息</div>
      <div class="hm-content">
        {#if alreadyCompleted}
          <pre>{challenge.hiddenMessage}</pre>
        {:else}
          <p class="hm-locked">完成所有修复后解锁...</p>
        {/if}
      </div>
    </div>
  {/if}

  <div class="action-bar">
    <button class="reset-btn" on:click={handleReset} disabled={alreadyCompleted}>
      清除输入
    </button>
    <button
      class="submit-btn"
      on:click={handleSubmit}
      disabled={alreadyCompleted || filledCount === 0}
    >
      {alreadyCompleted ? '已完成修复' : '提交修复结果'}
    </button>
  </div>

  {#if feedbackMessage}
    <div class="feedback-toast" class:success={feedbackMessage.type === 'success'} class:error={feedbackMessage.type === 'error'}>
      <pre>{feedbackMessage.text}</pre>
    </div>
  {/if}
</div>

<style>
  .subtitle-challenge {
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

  .back-btn, .reveal-btn {
    background: transparent;
    border: 1px solid #3a4a5a;
    color: #88aacc;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }

  .back-btn:hover, .reveal-btn:hover {
    background: rgba(80, 120, 160, 0.15);
    color: #aaccee;
  }

  .reveal-btn {
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
    margin: 0 0 8px 0;
    color: #a0b0c0;
    line-height: 1.7;
    font-size: 14px;
  }

  .meta-line {
    display: flex;
    gap: 20px;
    margin: 10px 0;
  }

  .speaker, .timestamp {
    font-size: 13px;
    color: #88a0b8;
    background: rgba(60, 90, 120, 0.15);
    padding: 4px 12px;
    border-radius: 10px;
  }

  .progress-hint {
    font-size: 13px !important;
    color: #6688aa !important;
  }

  .progress-hint strong {
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

  .errors-container {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .error-card {
    background: rgba(15, 30, 45, 0.75);
    border: 1px solid #2a3a4a;
    border-radius: 10px;
    padding: 16px;
    transition: all 0.2s ease;
  }

  .error-card:hover {
    border-color: #4a6a8a;
  }

  .error-card.completed {
    border-color: rgba(102, 200, 255, 0.3);
    background: rgba(102, 200, 255, 0.03);
  }

  .error-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .error-number {
    font-weight: 600;
    color: #88bbee;
    font-size: 14px;
  }

  .error-type-tag {
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 11px;
  }

  .subtitle-display {
    margin-bottom: 10px;
  }

  .subtitle-label {
    font-size: 11px;
    color: #667788;
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .subtitle-text {
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 15px;
    line-height: 1.7;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  .subtitle-text.corrupted {
    background: rgba(80, 40, 50, 0.35);
    border: 1px solid rgba(255, 100, 120, 0.25);
    color: #e0c8cc;
  }

  .subtitle-text.original {
    background: rgba(40, 60, 80, 0.3);
    border: 1px solid rgba(100, 150, 200, 0.2);
    color: #a0b8d0;
  }

  .error-slot {
    background: rgba(255, 88, 88, 0.35);
    color: #ff9999;
    padding: 1px 6px;
    border-radius: 3px;
    border-bottom: 2px dashed #ff6666;
    font-weight: 500;
  }

  .error-slot.corrected {
    background: rgba(255, 88, 88, 0.15);
  }

  .error-slot .wrong-text {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .error-slot .arrow {
    color: #66aaff;
    margin: 0 3px;
  }

  .error-slot .correct-text {
    color: #66ff99;
    background: rgba(102, 255, 153, 0.2);
    padding: 1px 5px;
    border-radius: 3px;
  }

  .input-section {
    margin-top: 12px;
  }

  .input-section label {
    display: block;
    font-size: 12px;
    color: #8899aa;
    margin-bottom: 6px;
  }

  .hl-marker {
    color: #ff8866;
    font-family: monospace;
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  input[type="text"] {
    flex: 1;
    background: rgba(10, 20, 35, 0.8);
    border: 1px solid #3a4a5a;
    color: #e0e8f0;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 15px;
    font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
    outline: none;
    transition: all 0.2s;
  }

  input[type="text"]:focus {
    border-color: #66aaff;
    box-shadow: 0 0 0 3px rgba(102, 170, 255, 0.15);
  }

  input[type="text"].filled {
    border-color: rgba(102, 200, 255, 0.5);
    background: rgba(102, 170, 238, 0.05);
  }

  input[type="text"].correct {
    border-color: rgba(102, 255, 153, 0.6) !important;
    background: rgba(102, 255, 153, 0.08) !important;
  }

  input[type="text"].wrong {
    border-color: rgba(255, 102, 102, 0.6) !important;
    background: rgba(255, 102, 102, 0.08) !important;
  }

  input[type="text"]:disabled {
    opacity: 0.7;
  }

  .result-indicator {
    font-size: 20px;
    font-weight: bold;
    min-width: 24px;
    text-align: center;
  }

  .result-indicator:has(+ .correct),
  .result-indicator:nth-child(2 of :where(.correct + *)) {
    color: #66ff99;
  }

  .context-hint {
    margin-top: 10px;
    padding: 8px 12px;
    background: rgba(102, 170, 238, 0.08);
    border-left: 3px solid #66aaff;
    border-radius: 4px;
    font-size: 12px;
    color: #88bbee;
    line-height: 1.6;
  }

  .error-detail-panel {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed #2a3a4a;
  }

  .error-detail-panel strong {
    display: block;
    font-size: 12px;
    color: #88aacc;
    margin-bottom: 6px;
  }

  .error-detail-panel p {
    margin: 0;
    font-size: 12px;
    color: #778899;
    line-height: 1.7;
  }

  .hidden-message-section {
    background: rgba(80, 40, 80, 0.2);
    border: 1px dashed rgba(200, 120, 200, 0.3);
    border-radius: 10px;
    overflow: hidden;
    opacity: 0.5;
    transition: all 0.3s ease;
  }

  .hidden-message-section.visible {
    opacity: 1;
    border-style: solid;
    border-color: rgba(200, 120, 200, 0.5);
    background: rgba(80, 40, 80, 0.35);
  }

  .hm-header {
    padding: 10px 16px;
    background: rgba(150, 80, 150, 0.2);
    color: #ddaadd;
    font-weight: 600;
    font-size: 13px;
  }

  .hm-content {
    padding: 14px 16px;
  }

  .hm-content pre {
    margin: 0;
    white-space: pre-wrap;
    font-family: 'PingFang SC', 'Microsoft YaHei', monospace;
    font-size: 13px;
    line-height: 1.8;
    color: #eeccff;
  }

  .hm-locked {
    margin: 0;
    color: #887788;
    font-style: italic;
    font-size: 13px;
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
    max-width: 560px;
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
    line-height: 1.7;
    font-size: 13px;
  }
</style>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import EvidenceCard from './EvidenceCard.svelte';
  import {
    evidenceBoard,
    dragState,
    availableEvidence,
    placedEvidenceCards,
    availableRules,
    predictedEnding,
    placeEvidence,
    removeEvidenceFromSlot,
    clearAllSlots,
    checkTagsMatch,
    attemptDeduction,
    rollbackLastDeduction,
    closeEvidenceBoard,
    getAllRules,
    getRuleById
  } from '../lib/evidence';
  import { playSFX } from '../lib/audio';
  import { getAllEndings, getEndingById } from '../lib/engine';
  import type { EvidenceSlot, EvidenceCard as EvidenceCardType, DeductionRule } from '../types/game';

  export let onClose: () => void;

  let boardElement: HTMLElement;
  let feedbackMessage: { text: string; type: 'success' | 'error' | 'info' } | null = null;
  let feedbackTimeout: number | null = null;
  let selectedFilter: 'all' | 'danmaku' | 'dialogue' | 'sfx' = 'all';
  let selectedRule: DeductionRule | null = null;
  let showHistory = false;
  let showPrediction = false;

  $: filteredEvidence = $availableEvidence.filter(e => {
    if (selectedFilter === 'all') return true;
    return e.type === selectedFilter;
  });

  $: canAttemptDeduction = $availableRules.length > 0;

  $: allRules = getAllRules();

  $: endings = getAllEndings();

  $: draggingEvidence = $dragState.isDragging && $dragState.evidenceId
    ? $evidenceBoard.collectedEvidence.find(e => e.id === $dragState.evidenceId)
    : null;

  $: mistakeProgress = ($evidenceBoard.mistakeCount / $evidenceBoard.maxMistakes) * 100;

  function showFeedback(text: string, type: 'success' | 'error' | 'info') {
    feedbackMessage = { text, type };
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => {
      feedbackMessage = null;
    }, 4000);
  }

  function handleSlotDrop(slot: EvidenceSlot) {
    const drag = get(dragState);
    if (!drag.isDragging || !drag.evidenceId) return;

    const evidence = $evidenceBoard.collectedEvidence.find(e => e.id === drag.evidenceId);
    if (!evidence) return;

    if (!checkTagsMatch(evidence, slot)) {
      playSFX('warning');
      showFeedback(`这张证据卡似乎不适合这个位置...标签需要匹配：${slot.requiredTags?.join(', ')}`, 'error');
      return;
    }

    const success = placeEvidence(slot.id, evidence.id);
    if (success) {
      playSFX('click');
      showFeedback(`证据已归档至「${slot.label}」`, 'success');
    }
  }

  function handleSlotClick(slot: EvidenceSlot) {
    if ($evidenceBoard.placedEvidence.has(slot.id)) {
      removeEvidenceFromSlot(slot.id);
      playSFX('click');
      showFeedback(`已从「${slot.label}」移除证据`, 'info');
    }
  }

  function handleAttemptDeduction(ruleId: string) {
    const rule = getRuleById(ruleId);
    if (!rule) return;

    const result = attemptDeduction(ruleId);
    if (result.success) {
      playSFX('notify');
      showFeedback(result.feedback, 'success');
    } else {
      playSFX('warning');
      const state = get(evidenceBoard);
      const remainingMistakes = state.maxMistakes - state.mistakeCount;
      showFeedback(`${result.feedback}（剩余错误机会：${remainingMistakes}）`, 'error');
    }
  }

  function handleRollback() {
    const success = rollbackLastDeduction();
    if (success) {
      playSFX('click');
      showFeedback('已回退上一次推理，证据状态已恢复', 'info');
    } else {
      showFeedback('没有可回退的推理记录', 'error');
    }
  }

  function handleClearSlots() {
    clearAllSlots();
    playSFX('click');
    showFeedback('已清空所有证据槽位', 'info');
  }

  function handleClose() {
    playSFX('click');
    closeEvidenceBoard();
    onClose();
  }

  function getSlotHighlight(slot: EvidenceSlot): 'normal' | 'match' | 'nomatch' | 'filled' {
    const drag = get(dragState);
    if (!drag.isDragging || !drag.evidenceId) {
      return $evidenceBoard.placedEvidence.has(slot.id) ? 'filled' : 'normal';
    }
    const evidence = $evidenceBoard.collectedEvidence.find(e => e.id === drag.evidenceId);
    if (!evidence) return 'normal';
    if (checkTagsMatch(evidence, slot)) return 'match';
    return 'nomatch';
  }

  function formatProbability(p: number): string {
    return Math.round(p * 100) + '%';
  }

  function getEndingColor(endingId: string): string {
    const ending = getEndingById(endingId);
    if (!ending) return '#888';
    return ending.isGood ? '#64ff96' : '#ff6464';
  }

  onDestroy(() => {
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
  });
</script>

<div class="evidence-board-overlay" on:click|stopPropagation>
  <div class="evidence-board" bind:this={boardElement}>
    <div class="board-header">
      <div class="header-left">
        <h2 class="board-title">
          <span class="title-icon">🔍</span>
          证据板 · 推理分析
        </h2>
        <div class="stats-row">
          <span class="stat">
            <span class="stat-label">已收集</span>
            <span class="stat-value">{$evidenceBoard.collectedEvidence.length}</span>
          </span>
          <span class="stat">
            <span class="stat-label">已归档</span>
            <span class="stat-value">{$evidenceBoard.placedEvidence.size}/{$evidenceBoard.slots.length}</span>
          </span>
          <span class="stat">
            <span class="stat-label">推理完成</span>
            <span class="stat-value">{$evidenceBoard.completedRules.length}/{allRules.length}</span>
          </span>
          <span class="stat mistake-stat">
            <span class="stat-label">错误</span>
            <span class="stat-value">{$evidenceBoard.mistakeCount}/{$evidenceBoard.maxMistakes}</span>
            <div class="mistake-bar">
              <div class="mistake-bar-fill" style="width: {mistakeProgress}%"></div>
            </div>
          </span>
        </div>
      </div>
      <div class="header-right">
        <button class="header-btn" on:click={() => { showHistory = !showHistory; playSFX('click'); }}>
          📋 历史
        </button>
        <button class="header-btn" on:click={() => { showPrediction = !showPrediction; playSFX('click'); }}>
          🎯 预测
        </button>
        <button class="header-btn danger" on:click={handleClearSlots}>
          🗑️ 清空
        </button>
        <button class="header-btn rollback" on:click={handleRollback}>
          ↩️ 回退
        </button>
        <button class="close-btn" on:click={handleClose}>✕</button>
      </div>
    </div>

    {#if feedbackMessage}
      <div class="feedback-banner" class:success={feedbackMessage.type === 'success'} class:error={feedbackMessage.type === 'error'} class:info={feedbackMessage.type === 'info'}>
        {feedbackMessage.text}
      </div>
    {/if}

    <div class="board-body">
      <div class="evidence-sidebar">
        <div class="sidebar-header">
          <h3>证据归档</h3>
          <div class="filter-tabs">
            <button class:active={selectedFilter === 'all'} on:click={() => selectedFilter = 'all'}>全部</button>
            <button class:active={selectedFilter === 'danmaku'} on:click={() => selectedFilter = 'danmaku'}>弹幕</button>
            <button class:active={selectedFilter === 'dialogue'} on:click={() => selectedFilter = 'dialogue'}>台词</button>
            <button class:active={selectedFilter === 'sfx'} on:click={() => selectedFilter = 'sfx'}>声效</button>
          </div>
        </div>
        <div class="evidence-list">
          {#if filteredEvidence.length === 0}
            <div class="empty-hint">
              <p>暂无可拖拽的证据</p>
              <p class="sub-hint">推进剧情收集更多线索吧</p>
            </div>
          {:else}
            {#each filteredEvidence as ev (ev.id)}
              <EvidenceCard evidence={ev} compact={false} draggable={ev.status === 'collected'} />
            {/each}
          {/if}
        </div>
      </div>

      <div class="board-main-area">
        <div class="board-canvas">
          <div class="board-grid-bg"></div>
          {#each $placedEvidenceCards as { slot, evidence }}
            <div
              class="evidence-slot"
              class:filled={getSlotHighlight(slot) === 'filled'}
              class:match={getSlotHighlight(slot) === 'match'}
              class:nomatch={getSlotHighlight(slot) === 'nomatch'}
              style="left: {slot.x}%; top: {slot.y}%;"
              on:click={() => handleSlotClick(slot)}
              on:dragover|preventDefault
              on:drop={() => handleSlotDrop(slot)}
            >
              <div class="slot-label">{slot.label}</div>
              <div class="slot-order">{slot.order}</div>
              {#if evidence}
                <div class="slot-evidence">
                  <EvidenceCard evidence={evidence} compact={true} draggable={false} />
                </div>
              {:else}
                <div class="slot-placeholder">
                  <span class="placeholder-icon">+</span>
                  <span class="placeholder-tags">{slot.requiredTags?.slice(0, 2).join(' · ')}</span>
                </div>
              {/if}
            </div>
          {/each}

          {#if $dragState.isDragging && draggingEvidence}
            <div
              class="drag-ghost"
              style="left: {$dragState.currentX}px; top: {$dragState.currentY}px;"
            >
              <EvidenceCard evidence={draggingEvidence} compact={true} draggable={false} />
            </div>
          {/if}
        </div>

        <div class="deduction-panel">
          <h3 class="panel-title">🧩 推理组合</h3>
          <div class="rules-list">
            {#each allRules as rule}
              <div
                class="rule-card"
                class:completed={$evidenceBoard.completedRules.includes(rule.id)}
                class:available={$availableRules.some(r => r.id === rule.id) && !$evidenceBoard.completedRules.includes(rule.id)}
                on:click={() => { selectedRule = rule; playSFX('click'); }}
              >
                <div class="rule-header">
                  <span class="rule-status">
                    {#if $evidenceBoard.completedRules.includes(rule.id)}✅{:else if $availableRules.some(r => r.id === rule.id)}🔓{:else}🔒{/if}
                  </span>
                  <span class="rule-name">{rule.name}</span>
                </div>
                <p class="rule-desc">{rule.description}</p>
                <div class="rule-slots">
                  需要：{rule.requiredSlots.length} 个槽位
                </div>
                {#if $availableRules.some(r => r.id === rule.id) && !$evidenceBoard.completedRules.includes(rule.id)}
                  <button
                    class="deduce-btn"
                    on:click|stopPropagation={() => handleAttemptDeduction(rule.id)}
                  >
                    验证推理
                  </button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>

    {#if selectedRule}
      <div class="rule-modal" on:click={() => selectedRule = null}>
        <div class="rule-modal-content" on:click|stopPropagation>
          <div class="modal-header">
            <h3>{selectedRule.name}</h3>
            <button class="close-btn" on:click={() => selectedRule = null}>✕</button>
          </div>
          <p class="modal-desc">{selectedRule.description}</p>
          <div class="modal-section">
            <h4>所需证据槽位：</h4>
            <div class="modal-slots">
              {#each selectedRule.requiredSlots as slotId}
                <div class="modal-slot" class:filled={!!$evidenceBoard.collectedEvidence.find(e => e.id === $evidenceBoard.placedEvidence.get(slotId))}>
                  <div class="modal-slot-label">{$evidenceBoard.slots.find(s => s.id === slotId)?.label || slotId}</div>
                  {#if $evidenceBoard.collectedEvidence.find(e => e.id === $evidenceBoard.placedEvidence.get(slotId))}
                    <div class="modal-slot-evidence">{$evidenceBoard.collectedEvidence.find(e => e.id === $evidenceBoard.placedEvidence.get(slotId))?.title}</div>
                  {:else}
                    <div class="modal-slot-empty">未放置</div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
          <div class="modal-section">
            <h4>提示：</h4>
            <p class="modal-hint">将正确的证据放入对应的槽位后，点击「验证推理」来确认你的分析。</p>
          </div>
        </div>
      </div>
    {/if}

    {#if showHistory}
      <div class="history-panel">
        <div class="panel-header">
          <h3>📜 推理历史</h3>
          <button class="close-btn" on:click={() => showHistory = false}>✕</button>
        </div>
        {#if $evidenceBoard.history.length === 0}
          <div class="empty-hint">
            <p>暂无推理记录</p>
          </div>
        {:else}
          <div class="history-list">
            {#each [...$evidenceBoard.history].reverse() as entry}
              <div class="history-item" class:correct={entry.isCorrect} class:wrong={!entry.isCorrect}>
                <div class="history-header">
                  <span class="history-status">{entry.isCorrect ? '✅ 正确' : '❌ 错误'}</span>
                  <span class="history-rule">{getRuleById(entry.ruleId)?.name || entry.ruleId}</span>
                  <span class="history-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <p class="history-feedback">{entry.feedback}</p>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    {#if showPrediction && $predictedEnding}
      <div class="prediction-panel">
        <div class="panel-header">
          <h3>🎯 结局预测</h3>
          <button class="close-btn" on:click={() => showPrediction = false}>✕</button>
        </div>
        <div class="prediction-top">
          <div class="top-ending-label">当前最可能结局</div>
          <div class="top-ending-name" style="color: {getEndingColor($predictedEnding.topEnding.endingId)}">
            {getEndingById($predictedEnding.topEnding.endingId)?.title || $predictedEnding.topEnding.endingId}
          </div>
          <div class="top-ending-prob">{formatProbability($predictedEnding.allWeights[0].probability)}</div>
        </div>
        <div class="prediction-list">
          {#each $predictedEnding.allWeights as pw}
            <div class="prediction-item">
              <div class="prediction-label">
                <span style="color: {getEndingColor(pw.endingId)}">●</span>
                {getEndingById(pw.endingId)?.title || pw.endingId}
                {#if getEndingById(pw.endingId)?.isGood} <span class="good-tag">Good</span>{/if}
              </div>
              <div class="prediction-bar">
                <div
                  class="prediction-bar-fill"
                  style="width: {formatProbability(pw.probability)}; background: {getEndingColor(pw.endingId)};"
                ></div>
              </div>
              <div class="prediction-value">{formatProbability(pw.probability)}</div>
            </div>
          {/each}
        </div>
        <div class="weight-modifiers">
          <h4>权重修正记录：</h4>
          {#each $predictedEnding.topEnding.modifiers as mod}
            <div class="modifier-row">
              <span class="modifier-source">{mod.source}</span>
              <span class="modifier-value" class:positive={mod.value > 0} class:negative={mod.value < 0}>
                {mod.value > 0 ? '+' : ''}{mod.value}
              </span>
            </div>
          {/each}
          {#if $predictedEnding.topEnding.modifiers.length === 0}
            <p class="empty-hint small">暂无修正因子</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .evidence-board-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.9);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }

  .evidence-board {
    width: 100%;
    max-width: 1400px;
    height: 90vh;
    max-height: 900px;
    background: linear-gradient(180deg, rgba(8, 18, 35, 0.98), rgba(5, 12, 25, 0.99));
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(100, 180, 255, 0.1);
  }

  .board-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px 24px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.2);
    background: linear-gradient(180deg, rgba(20, 40, 80, 0.5), transparent);
  }

  .board-title {
    font-size: 1.4rem;
    color: #80c8ff;
    margin: 0 0 10px 0;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-shadow: 0 0 15px rgba(100, 180, 255, 0.3);
  }

  .title-icon {
    margin-right: 8px;
  }

  .stats-row {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .stat-label {
    font-size: 0.75rem;
    color: #7090b0;
  }

  .stat-value {
    font-size: 0.95rem;
    font-weight: 600;
    color: #a0d0ff;
    font-family: 'Courier New', monospace;
  }

  .mistake-stat {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .mistake-stat .stat-value {
    color: #ff8080;
  }

  .mistake-bar {
    width: 80px;
    height: 4px;
    background: rgba(255, 100, 100, 0.2);
    border-radius: 2px;
    overflow: hidden;
  }

  .mistake-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff6464, #ff3232);
    transition: width 0.3s;
  }

  .header-right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .header-btn {
    padding: 6px 12px;
    background: rgba(40, 70, 120, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    color: #a0c8f0;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .header-btn:hover {
    background: rgba(60, 100, 160, 0.8);
    border-color: rgba(100, 180, 255, 0.5);
  }

  .header-btn.danger {
    background: rgba(120, 40, 40, 0.6);
    border-color: rgba(255, 100, 100, 0.3);
    color: #ffb0b0;
  }

  .header-btn.danger:hover {
    background: rgba(160, 50, 50, 0.8);
  }

  .header-btn.rollback {
    background: rgba(80, 60, 120, 0.6);
    border-color: rgba(180, 140, 255, 0.3);
    color: #d0b8ff;
  }

  .close-btn {
    width: 32px;
    height: 32px;
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

  .close-btn:hover {
    background: rgba(160, 50, 50, 0.8);
  }

  .feedback-banner {
    margin: 0 24px;
    padding: 10px 16px;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    animation: fadeInUp 0.3s ease-out;
  }

  .feedback-banner.success {
    background: rgba(100, 200, 100, 0.15);
    border: 1px solid rgba(100, 255, 150, 0.4);
    color: #a0ffb0;
  }

  .feedback-banner.error {
    background: rgba(200, 80, 80, 0.15);
    border: 1px solid rgba(255, 100, 100, 0.4);
    color: #ffb0b0;
  }

  .feedback-banner.info {
    background: rgba(100, 150, 200, 0.15);
    border: 1px solid rgba(100, 180, 255, 0.4);
    color: #a0c8ff;
  }

  .board-body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .evidence-sidebar {
    width: 260px;
    border-right: 1px solid rgba(100, 180, 255, 0.2);
    display: flex;
    flex-direction: column;
    background: rgba(10, 20, 40, 0.5);
  }

  .sidebar-header {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.15);
  }

  .sidebar-header h3 {
    font-size: 0.9rem;
    color: #80b8e0;
    margin: 0 0 10px 0;
  }

  .filter-tabs {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .filter-tabs button {
    padding: 4px 10px;
    background: rgba(40, 60, 100, 0.4);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 4px;
    color: #80a0c0;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-tabs button.active {
    background: rgba(80, 130, 200, 0.6);
    border-color: rgba(100, 180, 255, 0.5);
    color: #c0e0ff;
  }

  .evidence-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .empty-hint {
    text-align: center;
    padding: 30px 16px;
    color: #6080a0;
  }

  .empty-hint p {
    margin: 4px 0;
  }

  .empty-hint.small {
    padding: 10px;
    font-size: 0.8rem;
  }

  .sub-hint {
    font-size: 0.75rem;
    color: #506880;
  }

  .board-main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .board-canvas {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .board-grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(100, 180, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(100, 180, 255, 0.04) 1px, transparent 1px);
    background-size: 30px 30px;
  }

  .evidence-slot {
    position: absolute;
    width: 18%;
    min-width: 160px;
    transform: translate(-50%, -50%);
    background: rgba(20, 35, 60, 0.6);
    border: 2px dashed rgba(100, 180, 255, 0.3);
    border-radius: 10px;
    padding: 10px;
    transition: all 0.25s;
    cursor: pointer;
  }

  .evidence-slot.filled {
    border-style: solid;
    border-color: rgba(100, 255, 150, 0.5);
    background: rgba(20, 50, 40, 0.6);
  }

  .evidence-slot.match {
    border-color: rgba(100, 255, 150, 0.8);
    box-shadow: 0 0 20px rgba(100, 255, 150, 0.3);
    transform: translate(-50%, -50%) scale(1.05);
  }

  .evidence-slot.nomatch {
    border-color: rgba(255, 100, 100, 0.6);
    opacity: 0.5;
  }

  .slot-label {
    position: absolute;
    top: -10px;
    left: 10px;
    background: rgba(20, 40, 80, 0.95);
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    color: #80c0ff;
    border: 1px solid rgba(100, 180, 255, 0.3);
    white-space: nowrap;
  }

  .slot-order {
    position: absolute;
    top: -10px;
    right: 10px;
    width: 22px;
    height: 22px;
    background: rgba(100, 180, 255, 0.2);
    border: 1px solid rgba(100, 180, 255, 0.4);
    border-radius: 50%;
    font-size: 0.7rem;
    color: #a0d0ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .slot-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80px;
    gap: 4px;
  }

  .placeholder-icon {
    font-size: 1.8rem;
    color: rgba(100, 180, 255, 0.3);
  }

  .placeholder-tags {
    font-size: 0.65rem;
    color: rgba(100, 180, 255, 0.4);
  }

  .slot-evidence {
    display: flex;
    justify-content: center;
  }

  .drag-ghost {
    position: fixed;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 9999;
    opacity: 0.85;
  }

  .deduction-panel {
    border-top: 1px solid rgba(100, 180, 255, 0.2);
    padding: 12px 20px;
    background: rgba(10, 20, 40, 0.5);
    max-height: 220px;
    overflow-y: auto;
  }

  .panel-title {
    font-size: 0.9rem;
    color: #80b8e0;
    margin: 0 0 10px 0;
  }

  .rules-list {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .rule-card {
    flex: 1;
    min-width: 200px;
    max-width: 280px;
    background: rgba(20, 35, 60, 0.7);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .rule-card:hover {
    border-color: rgba(100, 180, 255, 0.5);
    transform: translateY(-2px);
  }

  .rule-card.completed {
    border-color: rgba(100, 255, 150, 0.4);
    background: rgba(20, 50, 40, 0.6);
  }

  .rule-card.available {
    border-color: rgba(255, 200, 100, 0.5);
    box-shadow: 0 0 12px rgba(255, 200, 100, 0.2);
    animation: pulse 2s infinite;
  }

  .rule-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .rule-status {
    font-size: 0.9rem;
  }

  .rule-name {
    font-size: 0.85rem;
    font-weight: 600;
    color: #c0d8f0;
  }

  .rule-desc {
    font-size: 0.75rem;
    color: #80a0c0;
    line-height: 1.5;
    margin: 4px 0;
  }

  .rule-slots {
    font-size: 0.7rem;
    color: #6080a0;
    margin-bottom: 8px;
  }

  .deduce-btn {
    width: 100%;
    padding: 6px;
    background: linear-gradient(135deg, rgba(200, 150, 50, 0.8), rgba(180, 120, 30, 0.8));
    border: 1px solid rgba(255, 200, 100, 0.5);
    border-radius: 5px;
    color: #fff8e0;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .deduce-btn:hover {
    background: linear-gradient(135deg, rgba(220, 170, 70, 1), rgba(200, 140, 50, 1));
    box-shadow: 0 0 15px rgba(255, 200, 100, 0.4);
  }

  .rule-modal {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
  }

  .rule-modal-content {
    width: 90%;
    max-width: 500px;
    background: rgba(10, 20, 40, 0.98);
    border: 1px solid rgba(100, 180, 255, 0.4);
    border-radius: 12px;
    padding: 20px 24px;
    max-height: 80%;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .modal-header h3 {
    margin: 0;
    color: #80c8ff;
  }

  .modal-desc {
    color: #a0b8d0;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .modal-section {
    margin-bottom: 16px;
  }

  .modal-section h4 {
    font-size: 0.85rem;
    color: #70a0d0;
    margin: 0 0 8px 0;
  }

  .modal-slots {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .modal-slot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(30, 50, 80, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 6px;
  }

  .modal-slot.filled {
    border-color: rgba(100, 255, 150, 0.4);
    background: rgba(30, 70, 50, 0.5);
  }

  .modal-slot-label {
    font-size: 0.8rem;
    color: #7090b0;
  }

  .modal-slot-evidence {
    font-size: 0.8rem;
    color: #a0ffb0;
    font-weight: 500;
  }

  .modal-slot-empty {
    font-size: 0.75rem;
    color: #6080a0;
    font-style: italic;
  }

  .modal-hint {
    font-size: 0.8rem;
    color: #80a0c0;
    line-height: 1.6;
    margin: 0;
  }

  .history-panel,
  .prediction-panel {
    position: absolute;
    top: 70px;
    right: 24px;
    width: 360px;
    max-height: calc(100% - 100px);
    background: rgba(8, 16, 32, 0.98);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 10px;
    overflow: hidden;
    z-index: 150;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.2);
    background: rgba(20, 40, 80, 0.4);
  }

  .panel-header h3 {
    margin: 0;
    font-size: 0.95rem;
    color: #80c8ff;
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .history-item {
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid;
  }

  .history-item.correct {
    background: rgba(30, 70, 50, 0.5);
    border-color: rgba(100, 255, 150, 0.3);
  }

  .history-item.wrong {
    background: rgba(70, 30, 30, 0.5);
    border-color: rgba(255, 100, 100, 0.3);
  }

  .history-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .history-status {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .history-rule {
    font-size: 0.8rem;
    color: #a0c0e0;
    font-weight: 500;
  }

  .history-time {
    font-size: 0.7rem;
    color: #6080a0;
    margin-left: auto;
  }

  .history-feedback {
    font-size: 0.75rem;
    color: #90b0d0;
    margin: 0;
    line-height: 1.5;
  }

  .prediction-top {
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid rgba(100, 180, 255, 0.2);
  }

  .top-ending-label {
    font-size: 0.75rem;
    color: #7090b0;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .top-ending-name {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 6px 0;
  }

  .top-ending-prob {
    font-size: 2rem;
    font-weight: 800;
    font-family: 'Courier New', monospace;
    color: #80c8ff;
    text-shadow: 0 0 15px rgba(100, 180, 255, 0.4);
  }

  .prediction-list {
    padding: 12px 16px;
    max-height: 200px;
    overflow-y: auto;
  }

  .prediction-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .prediction-label {
    flex: 1;
    font-size: 0.75rem;
    color: #a0b8d0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .good-tag {
    display: inline-block;
    padding: 1px 5px;
    background: rgba(100, 255, 150, 0.2);
    border-radius: 3px;
    font-size: 0.6rem;
    color: #64ff96;
    margin-left: 4px;
  }

  .prediction-bar {
    width: 80px;
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  .prediction-bar-fill {
    height: 100%;
    transition: width 0.5s;
  }

  .prediction-value {
    width: 40px;
    text-align: right;
    font-size: 0.75rem;
    color: #80a0c0;
    font-family: 'Courier New', monospace;
  }

  .weight-modifiers {
    padding: 12px 16px;
    border-top: 1px solid rgba(100, 180, 255, 0.2);
    max-height: 150px;
    overflow-y: auto;
  }

  .weight-modifiers h4 {
    font-size: 0.8rem;
    color: #7090b0;
    margin: 0 0 8px 0;
  }

  .modifier-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 0.75rem;
  }

  .modifier-source {
    color: #80a0c0;
  }

  .modifier-value {
    font-family: 'Courier New', monospace;
    font-weight: 600;
  }

  .modifier-value.positive {
    color: #64ff96;
  }

  .modifier-value.negative {
    color: #ff6464;
  }

  @media (max-width: 900px) {
    .evidence-board-overlay {
      padding: 10px;
    }

    .evidence-board {
      height: 95vh;
    }

    .board-header {
      padding: 12px 16px;
      flex-direction: column;
      gap: 10px;
    }

    .header-right {
      width: 100%;
      justify-content: flex-end;
    }

    .board-body {
      flex-direction: column;
    }

    .evidence-sidebar {
      width: 100%;
      height: 160px;
      border-right: none;
      border-bottom: 1px solid rgba(100, 180, 255, 0.2);
    }

    .evidence-list {
      flex-direction: row;
      overflow-x: auto;
      overflow-y: hidden;
    }

    .board-canvas {
      min-height: 350px;
    }

    .evidence-slot {
      width: 28%;
      min-width: 120px;
    }

    .history-panel,
    .prediction-panel {
      width: calc(100% - 48px);
      right: 24px;
      left: 24px;
    }
  }

  @media (max-width: 600px) {
    .stats-row {
      gap: 12px;
    }

    .evidence-slot {
      width: 40%;
    }

    .rules-list {
      flex-direction: column;
    }

    .rule-card {
      max-width: none;
    }
  }
</style>

<script lang="ts">
  import { playSFX } from '../lib/audio';
  import {
    anonymousSenderState,
    closeTerminalLog,
    viewTerminalRecord,
    markTerminalRead
  } from '../lib/anonymousSender';
  import type { TerminalRecord } from '../types/game';

  let isOpen = false;
  let selectedRecord: TerminalRecord | null = null;

  $: {
    isOpen = $anonymousSenderState.isTerminalOpen;
    if ($anonymousSenderState.viewingTerminalId) {
      selectedRecord = $anonymousSenderState.terminalRecords.find(t => t.id === $anonymousSenderState.viewingTerminalId) || null;
    } else {
      selectedRecord = null;
    }
  }

  function handleClose() {
    playSFX('click');
    closeTerminalLog();
  }

  function handleSelectRecord(record: TerminalRecord) {
    playSFX('keyboard');
    viewTerminalRecord(record.id);
  }

  function handleBack() {
    playSFX('click');
    $anonymousSenderState.viewingTerminalId = null;
  }

  function formatTime(timestamp: number): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  function getSecurityLabel(level?: string): { label: string; class: string } {
    switch (level) {
      case 'classified':
        return { label: '绝密', class: 'sec-classified' };
      case 'restricted':
        return { label: '受限', class: 'sec-restricted' };
      default:
        return { label: '公开', class: 'sec-public' };
    }
  }
</script>

{#if isOpen}
  <div class="overlay" on:click={handleClose}>
    <div class="terminal-panel" on:click|stopPropagation style="animation: fadeInUp 0.3s ease-out;">
      <button class="close-btn" on:click={handleClose}>✕</button>

      <div class="terminal-header-bar">
        <div class="terminal-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <span class="terminal-title-bar">root@abyss-server:~# — 终端记录</span>
      </div>

      {#if !selectedRecord}
        <div class="panel-header">
          <h2 class="panel-title">💻 终端日志档案</h2>
          <p class="panel-subtitle">非法获取的系统文件与命令输出</p>
        </div>

        <div class="record-list">
          {#if $anonymousSenderState.terminalRecords.length === 0}
            <div class="empty-state">
              <div class="empty-icon">📟</div>
              <p class="empty-text">暂无终端记录</p>
              <p class="empty-hint">深入挖掘剧情以解锁机密文件...</p>
            </div>
          {:else}
            {#each $anonymousSenderState.terminalRecords as record (record.id)}
              <button
                class="record-item"
                class:unread={!record.isRead}
                on:click={() => handleSelectRecord(record)}
              >
                <div class="record-header">
                  {#if !record.isRead}
                    <span class="unread-dot"></span>
                  {/if}
                  <span class="record-title">{record.title}</span>
                  {#if record.securityLevel}
                    <span class={`sec-badge ${getSecurityLabel(record.securityLevel).class}`}>
                      {getSecurityLabel(record.securityLevel).label}
                    </span>
                  {/if}
                </div>
                <div class="record-meta">
                  <span class="record-time">{formatTime(record.timestamp)}</span>
                </div>
                {#if record.command}
                  <div class="record-command">
                    <span class="cmd-prompt">$</span>
                    <span class="cmd-text">{record.command}</span>
                  </div>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      {:else}
        <div class="record-view">
          <button class="back-btn" on:click={handleBack}>← 返回档案列表</button>
          <div class="record-detail-header">
            <div class="record-detail-title-row">
              <h3 class="record-detail-title">{selectedRecord.title}</h3>
              {#if selectedRecord.securityLevel}
                <span class={`sec-badge ${getSecurityLabel(selectedRecord.securityLevel).class}`}>
                  {getSecurityLabel(selectedRecord.securityLevel).label}
                </span>
              {/if}
            </div>
            <div class="record-detail-meta">
              <span class="record-detail-time">{formatTime(selectedRecord.timestamp)}</span>
            </div>
          </div>
          {#if selectedRecord.command}
            <div class="command-block">
              <span class="cmd-prompt-large">root@abyss:~#</span>
              <span class="cmd-text-large">{selectedRecord.command}</span>
            </div>
          {/if}
          <div class="terminal-output">
            <pre class="output-text">{selectedRecord.content}</pre>
          </div>
          {#if selectedRecord.attachedClue}
            <div class="record-clue">
              <span class="clue-icon">🔓</span>
              <span class="clue-text">档案已解密，线索已归档</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(10px);
    padding: 20px;
  }

  .terminal-panel {
    position: relative;
    background: linear-gradient(180deg, rgba(5, 15, 10, 0.98), rgba(0, 10, 6, 0.98));
    border: 1px solid rgba(100, 255, 150, 0.25);
    border-radius: 10px;
    width: 100%;
    max-width: 620px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 50px rgba(80, 255, 150, 0.1), inset 0 1px 0 rgba(150, 255, 180, 0.06);
    font-family: 'Courier New', 'Menlo', monospace;
  }

  .terminal-header-bar {
    background: rgba(20, 30, 25, 0.8);
    padding: 10px 16px;
    border-bottom: 1px solid rgba(100, 255, 150, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .terminal-dots {
    display: flex;
    gap: 6px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .dot-red { background: #ff5f57; }
  .dot-yellow { background: #febc2e; }
  .dot-green { background: #28c840; }

  .terminal-title-bar {
    color: #60a070;
    font-size: 0.78rem;
    letter-spacing: 0.05em;
  }

  .close-btn {
    position: absolute;
    top: 8px;
    right: 12px;
    background: transparent;
    border: none;
    color: #508060;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 2px 6px;
    line-height: 1;
    z-index: 10;
    transition: all 0.2s;
  }

  .close-btn:hover {
    color: #80ff90;
  }

  .panel-header {
    text-align: center;
    padding: 16px 24px 14px;
    border-bottom: 1px solid rgba(100, 255, 150, 0.1);
  }

  .panel-title {
    color: #80e8a0;
    margin: 0 0 4px;
    font-size: 1.15rem;
    letter-spacing: 0.05em;
    text-shadow: 0 0 12px rgba(100, 255, 150, 0.35);
  }

  .panel-subtitle {
    color: #508060;
    margin: 0;
    font-size: 0.75rem;
    font-style: italic;
  }

  .record-list {
    flex: 1;
    overflow-y: auto;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .empty-state {
    text-align: center;
    padding: 50px 20px;
    color: #406050;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 1.05rem;
    margin: 0 0 6px;
    color: #60a070;
  }

  .empty-hint {
    font-size: 0.78rem;
    margin: 0;
    font-style: italic;
  }

  .record-item {
    text-align: left;
    padding: 12px 14px;
    background: rgba(15, 30, 20, 0.6);
    border: 1px solid rgba(100, 255, 150, 0.12);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .record-item:hover {
    background: rgba(25, 50, 35, 0.7);
    border-color: rgba(100, 255, 150, 0.3);
    transform: translateX(2px);
  }

  .record-item.unread {
    background: rgba(20, 50, 30, 0.6);
    border-color: rgba(100, 255, 150, 0.25);
  }

  .record-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #40ff80;
    box-shadow: 0 0 8px rgba(80, 255, 130, 0.6);
    flex-shrink: 0;
  }

  .record-title {
    color: #a0e8b0;
    font-size: 0.92rem;
    font-weight: 500;
    flex: 1;
  }

  .record-item.unread .record-title {
    color: #c0ffd0;
    font-weight: 600;
  }

  .sec-badge {
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  .sec-public {
    background: rgba(100, 200, 255, 0.1);
    color: #60c0ff;
    border: 1px solid rgba(100, 200, 255, 0.3);
  }

  .sec-restricted {
    background: rgba(255, 200, 80, 0.1);
    color: #ffc040;
    border: 1px solid rgba(255, 200, 80, 0.3);
  }

  .sec-classified {
    background: rgba(255, 80, 80, 0.1);
    color: #ff6060;
    border: 1px solid rgba(255, 80, 80, 0.3);
    animation: classifiedPulse 1.5s infinite;
  }

  @keyframes classifiedPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .record-meta {
    margin-bottom: 8px;
  }

  .record-time {
    color: #508060;
    font-size: 0.72rem;
  }

  .record-command {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
  }

  .cmd-prompt {
    color: #40ff80;
    font-size: 0.78rem;
  }

  .cmd-text {
    color: #80c0a0;
    font-size: 0.78rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .record-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 16px;
  }

  .back-btn {
    align-self: flex-start;
    background: none;
    border: none;
    color: #60a070;
    font-size: 0.82rem;
    cursor: pointer;
    padding: 4px 8px;
    margin-bottom: 12px;
    transition: all 0.2s;
    font-family: inherit;
  }

  .back-btn:hover {
    color: #80ff90;
  }

  .record-detail-header {
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(100, 255, 150, 0.1);
    margin-bottom: 14px;
  }

  .record-detail-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .record-detail-title {
    color: #b0ffc0;
    margin: 0;
    font-size: 1.05rem;
    text-shadow: 0 0 8px rgba(100, 255, 150, 0.3);
  }

  .record-detail-meta {
    margin-bottom: 4px;
  }

  .record-detail-time {
    color: #60a070;
    font-size: 0.75rem;
  }

  .command-block {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    margin-bottom: 10px;
    border: 1px solid rgba(100, 255, 150, 0.1);
  }

  .cmd-prompt-large {
    color: #40ff80;
    font-size: 0.85rem;
    font-weight: 700;
  }

  .cmd-text-large {
    color: #a0e0b8;
    font-size: 0.85rem;
  }

  .terminal-output {
    flex: 1;
    overflow-y: auto;
    background: rgba(0, 5, 2, 0.7);
    border: 1px solid rgba(100, 255, 150, 0.1);
    border-radius: 4px;
    padding: 14px;
  }

  .output-text {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: #90d8a8;
    font-size: 0.85rem;
    line-height: 1.7;
    font-family: inherit;
    text-shadow: 0 0 2px rgba(100, 255, 150, 0.2);
  }

  .record-clue {
    margin-top: 12px;
    padding: 10px 14px;
    background: rgba(100, 200, 255, 0.08);
    border: 1px solid rgba(100, 200, 255, 0.25);
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .clue-icon {
    font-size: 0.95rem;
  }

  .clue-text {
    color: #80c8ff;
    font-size: 0.82rem;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .terminal-panel {
      max-height: 90vh;
    }

    .terminal-title-bar {
      font-size: 0.65rem;
    }

    .panel-title {
      font-size: 1rem;
    }

    .output-text {
      font-size: 0.78rem;
      line-height: 1.65;
    }
  }
</style>

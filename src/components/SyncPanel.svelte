<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    loadSyncRecords,
    registerCurrentDevice,
    exportToFile,
    importFromFile,
    generateShareCode,
    importFromShareCode,
    initSyncChannel,
    closeSyncChannel,
    broadcastSync
  } from '../lib/archiveSync';
  import { playSFX } from '../lib/audio';
  import type { SyncRecord } from '../types/game';

  let devices: SyncRecord[] = [];
  let feedbackMessage: { text: string; type: 'success' | 'error' | 'info' } | null = null;
  let feedbackTimeout: number | null = null;
  let shareCode = '';
  let showShareCode = false;
  let importCode = '';

  function refreshDevices() {
    registerCurrentDevice();
    devices = loadSyncRecords();
  }

  function showFeedback(text: string, type: 'success' | 'error' | 'info') {
    feedbackMessage = { text, type };
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
    feedbackTimeout = window.setTimeout(() => { feedbackMessage = null; }, 4000);
  }

  function handleExport() {
    playSFX('click');
    exportToFile();
    broadcastSync();
    refreshDevices();
    showFeedback('存档数据已导出为 JSON 文件', 'success');
  }

  async function handleImport() {
    playSFX('click');
    const result = await importFromFile();
    if (result.success) {
      refreshDevices();
      showFeedback(result.message, 'success');
    } else {
      showFeedback(result.message, 'error');
    }
  }

  function handleGenerateShareCode() {
    playSFX('click');
    try {
      shareCode = generateShareCode();
      showShareCode = true;
      showFeedback('分享码已生成，可复制发送到其他设备', 'info');
    } catch (e) {
      showFeedback('生成分享码失败：' + (e as Error).message, 'error');
    }
  }

  function handleImportFromCode() {
    if (!importCode.trim()) {
      showFeedback('请输入分享码', 'error');
      return;
    }
    playSFX('click');
    const result = importFromShareCode(importCode.trim());
    if (result.success) {
      importCode = '';
      refreshDevices();
      showFeedback(result.message, 'success');
    } else {
      showFeedback(result.message, 'error');
    }
  }

  function handleCopyCode() {
    navigator.clipboard?.writeText(shareCode).then(() => {
      showFeedback('分享码已复制到剪贴板', 'success');
    }).catch(() => {
      showFeedback('复制失败，请手动选择复制', 'error');
    });
  }

  function formatTime(ts: number): string {
    return new Date(ts).toLocaleString('zh-CN');
  }

  onMount(() => {
    refreshDevices();
    initSyncChannel(() => {
      refreshDevices();
      showFeedback('检测到其他设备的同步数据', 'info');
    });
  });

  onDestroy(() => {
    closeSyncChannel();
    if (feedbackTimeout) clearTimeout(feedbackTimeout);
  });
</script>

<div class="sync-view">
  {#if feedbackMessage}
    <div class="sync-feedback" class:success={feedbackMessage.type === 'success'} class:error={feedbackMessage.type === 'error'} class:info={feedbackMessage.type === 'info'}>
      {feedbackMessage.text}
    </div>
  {/if}

  <div class="sync-section">
    <h4 class="sync-section-title">☁️ 数据同步</h4>
    <p class="sync-section-desc">将你的存档数据同步到其他设备。支持文件导入导出和分享码两种方式。</p>

    <div class="sync-actions">
      <button class="sync-btn export" on:click={handleExport}>
        <span class="btn-icon">📤</span>
        <div class="btn-text">
          <span class="btn-label">导出数据</span>
          <span class="btn-sub">保存为 JSON 文件</span>
        </div>
      </button>
      <button class="sync-btn import" on:click={handleImport}>
        <span class="btn-icon">📥</span>
        <div class="btn-text">
          <span class="btn-label">导入数据</span>
          <span class="btn-sub">从文件恢复存档</span>
        </div>
      </button>
    </div>
  </div>

  <div class="sync-section">
    <h4 class="sync-section-title">🔗 分享码同步</h4>
    <p class="sync-section-desc">生成分享码发送到其他设备，或输入其他设备的分享码来同步数据。</p>

    <div class="share-actions">
      <button class="share-btn" on:click={handleGenerateShareCode}>
        生成分享码
      </button>
    </div>

    {#if showShareCode}
      <div class="share-code-box">
        <div class="sc-label">你的分享码：</div>
        <textarea class="sc-textarea" readonly rows="3">{shareCode}</textarea>
        <button class="sc-copy-btn" on:click={handleCopyCode}>📋 复制</button>
      </div>
    {/if}

    <div class="import-code-box">
      <div class="sc-label">输入分享码：</div>
      <div class="ic-row">
        <textarea class="sc-textarea" rows="3" bind:value={importCode} placeholder="粘贴其他设备的分享码..."></textarea>
        <button class="share-btn" on:click={handleImportFromCode}>导入</button>
      </div>
    </div>
  </div>

  <div class="sync-section">
    <h4 class="sync-section-title">📱 已同步设备</h4>
    <div class="device-list">
      {#each devices as dev (dev.deviceId)}
        <div class="device-card">
          <div class="dev-header">
            <span class="dev-name">{dev.deviceName}</span>
            <span class="dev-id">{dev.deviceId.slice(0, 12)}...</span>
          </div>
          <div class="dev-stats">
            <span class="dev-stat">💾 {dev.saveSlotCount} 存档</span>
            <span class="dev-stat">🔍 {dev.memoryClueCount} 线索</span>
            <span class="dev-stat">🔄 {dev.playthroughCount} 周目</span>
          </div>
          <div class="dev-time">最后同步：{formatTime(dev.lastSyncAt)}</div>
        </div>
      {/each}
      {#if devices.length === 0}
        <div class="no-devices">暂无已同步的设备记录</div>
      {/if}
    </div>
  </div>

  <div class="sync-section">
    <h4 class="sync-section-title">ℹ️ 同步说明</h4>
    <div class="sync-help">
      <div class="help-item">
        <span class="help-icon">📤</span>
        <div>
          <strong>文件导出/导入</strong>
          <p>将完整存档（含存档槽、全局记忆、设置）导出为 JSON 文件，在其他设备上导入即可同步。</p>
        </div>
      </div>
      <div class="help-item">
        <span class="help-icon">🔗</span>
        <div>
          <strong>分享码</strong>
          <p>将数据编码为文本分享码，适合通过聊天工具传输。导入时自动合并最新数据。</p>
        </div>
      </div>
      <div class="help-item">
        <span class="help-icon">📡</span>
        <div>
          <strong>实时同步</strong>
          <p>同一浏览器中打开多个标签页时，通过 BroadcastChannel 自动检测数据变更。</p>
        </div>
      </div>
      <div class="help-item">
        <span class="help-icon">🛡️</span>
        <div>
          <strong>合并策略</strong>
          <p>导入时按时间戳智能合并：存档槽以较新的为准，全局记忆取并集，设置合并覆盖。</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .sync-view {
    padding: 22px 26px;
    height: 100%;
    overflow-y: auto;
  }

  .sync-feedback {
    margin-bottom: 16px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.82rem;
    animation: fadeInUp 0.3s ease-out;
  }

  .sync-feedback.success { background: rgba(60, 180, 100, 0.12); border: 1px solid rgba(60, 200, 120, 0.3); color: #80e8a0; }
  .sync-feedback.error { background: rgba(200, 60, 60, 0.12); border: 1px solid rgba(255, 100, 100, 0.3); color: #ff9090; }
  .sync-feedback.info { background: rgba(60, 130, 200, 0.12); border: 1px solid rgba(60, 160, 255, 0.3); color: #90c8ff; }

  .sync-section {
    margin-bottom: 24px;
    padding: 18px 20px;
    background: rgba(12, 22, 40, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.18);
    border-radius: 10px;
  }

  .sync-section-title {
    font-size: 0.95rem;
    color: #6ab0e8;
    margin: 0 0 8px 0;
    font-weight: 600;
  }

  .sync-section-desc {
    font-size: 0.8rem;
    color: #7090b0;
    line-height: 1.5;
    margin: 0 0 16px 0;
  }

  .sync-actions {
    display: flex;
    gap: 14px;
  }

  .sync-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    padding: 14px 18px;
    background: rgba(20, 35, 60, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    color: inherit;
  }

  .sync-btn:hover { border-color: rgba(60, 130, 200, 0.5); transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); }

  .btn-icon { font-size: 1.5rem; }

  .btn-text { display: flex; flex-direction: column; gap: 2px; }

  .btn-label { font-size: 0.88rem; color: #c0d8f0; font-weight: 600; }
  .btn-sub { font-size: 0.7rem; color: #6080a0; }

  .share-actions { margin-bottom: 14px; }

  .share-btn {
    padding: 8px 18px;
    background: rgba(40, 70, 120, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #a0d0ff;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .share-btn:hover { background: rgba(60, 100, 160, 0.6); }

  .share-code-box,
  .import-code-box {
    margin-top: 12px;
    padding: 14px;
    background: rgba(10, 18, 35, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 8px;
  }

  .sc-label { font-size: 0.75rem; color: #6ab0e8; margin-bottom: 8px; }

  .sc-textarea {
    width: 100%;
    padding: 8px 12px;
    background: rgba(8, 14, 28, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 6px;
    color: #b0c8e0;
    font-size: 0.7rem;
    font-family: 'Courier New', monospace;
    resize: vertical;
    outline: none;
  }

  .sc-textarea:focus { border-color: rgba(60, 130, 200, 0.5); }

  .sc-copy-btn {
    margin-top: 8px;
    padding: 5px 12px;
    background: rgba(40, 70, 120, 0.4);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 5px;
    color: #90b8d0;
    font-size: 0.75rem;
    cursor: pointer;
  }

  .ic-row {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .ic-row .sc-textarea { flex: 1; }

  .device-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 10px;
  }

  .device-card {
    padding: 12px 14px;
    background: rgba(15, 25, 45, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.18);
    border-radius: 8px;
  }

  .dev-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .dev-name { font-size: 0.85rem; color: #c0d8f0; font-weight: 600; }

  .dev-id {
    font-family: 'Courier New', monospace;
    font-size: 0.65rem;
    color: #405878;
  }

  .dev-stats {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
  }

  .dev-stat { font-size: 0.72rem; color: #7090b0; }

  .dev-time { font-size: 0.68rem; color: #405878; }

  .no-devices {
    text-align: center;
    padding: 24px;
    color: #506880;
    font-size: 0.82rem;
  }

  .sync-help {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .help-item {
    display: flex;
    gap: 12px;
    padding: 10px;
    background: rgba(15, 25, 45, 0.3);
    border-radius: 6px;
  }

  .help-icon { font-size: 1.2rem; flex-shrink: 0; }

  .help-item strong { font-size: 0.82rem; color: #a0c8f0; }

  .help-item p { font-size: 0.75rem; color: #7090b0; margin: 2px 0 0 0; line-height: 1.5; }

  @media (max-width: 600px) {
    .sync-actions { flex-direction: column; }
    .ic-row { flex-direction: column; }
  }
</style>

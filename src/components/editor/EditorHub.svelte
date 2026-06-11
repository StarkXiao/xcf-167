<script lang="ts">
  import { get } from 'svelte/store';
  import {
    editorState,
    allNodes,
    setActiveTab,
    selectNode,
    addNode,
    deleteNode,
    exportAsJSON,
    importData,
    resetToOriginal,
    setPreviewNode,
    markClean,
    type EditorTab
  } from '../../lib/editorStore';
  import NodeEditor from './NodeEditor.svelte';
  import DanmakuEditor from './DanmakuEditor.svelte';
  import SfxEditor from './SfxEditor.svelte';
  import EndingEditor from './EndingEditor.svelte';
  import PreviewPlayer from './PreviewPlayer.svelte';
  import { playSFX } from '../../lib/audio';

  export let onBackToMenu: () => void;

  let searchQuery = '';
  let showImportModal = false;
  let importText = '';
  let showExportModal = false;
  let exportText = '';
  let fileInput: HTMLInputElement | null = null;

  $: filteredNodes = get(allNodes).filter(n =>
    n.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  $: currentTab = $editorState.activeTab;
  $: selectedId = $editorState.selectedNodeId;
  $: isDirty = $editorState.isDirty;
  $: showPreview = $editorState.showPreview;
  $: previewNodeId = $editorState.previewNodeId;

  const tabs: { id: EditorTab; label: string; icon: string }[] = [
    { id: 'nodes', label: '剧情节点', icon: '📝' },
    { id: 'danmaku', label: '弹幕时间轴', icon: '💬' },
    { id: 'sfx', label: '音效触发', icon: '🔊' },
    { id: 'endings', label: '结局条件', icon: '🎬' },
    { id: 'preview', label: '预览试玩', icon: '▶' }
  ];

  function handleTabClick(tabId: EditorTab) {
    playSFX('click');
    setActiveTab(tabId);
  }

  function handleSelectNode(nodeId: string) {
    playSFX('select');
    selectNode(nodeId);
  }

  function handleAddNode() {
    playSFX('notify');
    addNode();
  }

  function handleDeleteNode(nodeId: string) {
    if (confirm(`确定要删除节点 "${nodeId}" 吗？`)) {
      playSFX('warning');
      deleteNode(nodeId);
    }
  }

  function handleBack() {
    if (isDirty && !confirm('有未保存的更改，确定要返回吗？')) return;
    playSFX('click');
    onBackToMenu();
  }

  function handleExport() {
    playSFX('click');
    exportText = exportAsJSON();
    showExportModal = true;
  }

  function copyExportToClipboard() {
    navigator.clipboard.writeText(exportText);
    playSFX('notify');
  }

  function downloadExport() {
    const blob = new Blob([exportText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deep-sea-story-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSFX('notify');
  }

  function handleImport() {
    playSFX('click');
    showImportModal = true;
    importText = '';
  }

  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importText = ev.target?.result as string;
    };
    reader.readAsText(file);
  }

  function doImport() {
    try {
      const data = JSON.parse(importText);
      if (importData(data)) {
        playSFX('notify');
        showImportModal = false;
        importText = '';
      } else {
        alert('数据格式错误，缺少 nodes 或 endings 字段');
      }
    } catch (e) {
      alert('JSON 解析失败: ' + (e as Error).message);
    }
  }

  function handleReset() {
    if (confirm('确定要重置所有更改，恢复到原始数据吗？此操作不可撤销！')) {
      playSFX('warning');
      resetToOriginal();
    }
  }

  function handleStartPreview() {
    if (selectedId) {
      playSFX('select');
      setPreviewNode(selectedId);
      setActiveTab('preview');
    } else {
      alert('请先选择一个节点');
    }
  }

  function handleClosePreview() {
    playSFX('click');
    setPreviewNode(null);
  }
</script>

<div class="editor-container">
  <header class="editor-header">
    <div class="header-left">
      <button class="back-btn" on:click={handleBack}>
        <span>←</span>
        <span>返回主菜单</span>
      </button>
      <div class="title-section">
        <span class="title-icon">🔬</span>
        <div>
          <h1 class="editor-title">深海研究所后台</h1>
          <p class="editor-subtitle">剧情编辑与内容管理系统 v1.0</p>
        </div>
        {#if isDirty}
          <span class="dirty-badge">● 未保存</span>
        {/if}
      </div>
    </div>
    <div class="header-right">
      <button class="header-btn" on:click={handleReset} title="重置为原始数据">
        <span>↺</span> 重置
      </button>
      <button class="header-btn" on:click={handleImport} title="导入 JSON 数据">
        <span>📥</span> 导入
      </button>
      <button class="header-btn primary" on:click={handleExport} title="导出为 JSON">
        <span>📤</span> 导出
      </button>
    </div>
  </header>

  <nav class="editor-tabs">
    {#each tabs as tab}
      <button
        class="tab-btn {currentTab === tab.id ? 'active' : ''}"
        on:click={() => handleTabClick(tab.id)}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
    <div class="tabs-spacer"></div>
    <button class="preview-shortcut" on:click={handleStartPreview} title="从当前节点预览">
      <span>▶</span> 预览此节点
    </button>
  </nav>

  <div class="editor-body">
    {#if currentTab !== 'preview'}
      <aside class="sidebar">
        <div class="sidebar-header">
          <h3>节点列表</h3>
          <button class="add-btn" on:click={handleAddNode} title="新增节点">
            <span>+</span> 新增
          </button>
        </div>
        <div class="search-box">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="搜索节点ID或标题..."
          />
        </div>
        <div class="node-count">共 {filteredNodes.length} 个节点</div>
        <div class="node-list">
          {#each filteredNodes as node}
            <div
              class="node-item {selectedId === node.id ? 'selected' : ''}"
              on:click={() => handleSelectNode(node.id)}
            >
              <div class="node-info">
                <span class="node-id">{node.id}</span>
                {#if node.isEnding}
                  <span class="node-tag ending">结局</span>
                {/if}
                {#if node.isRewindCheckpoint}
                  <span class="node-tag checkpoint">回溯点</span>
                {/if}
                {#if node.title}
                  <span class="node-title">{node.title}</span>
                {/if}
              </div>
              <div class="node-meta">
                <span>💬 {node.dialogues?.length || 0}</span>
                <span>🎯 {node.danmakus?.length || 0}</span>
                {#if node.choices?.length}
                  <span>🔀 {node.choices.length}</span>
                {/if}
                {#if node.id !== 'start'}
                  <button
                    class="delete-mini"
                    on:click|stopPropagation={() => handleDeleteNode(node.id)}
                    title="删除节点"
                  >×</button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </aside>
    {/if}

    <main class="editor-content">
      {#if currentTab === 'nodes'}
        <NodeEditor />
      {:else if currentTab === 'danmaku'}
        <DanmakuEditor />
      {:else if currentTab === 'sfx'}
        <SfxEditor />
      {:else if currentTab === 'endings'}
        <EndingEditor />
      {:else if currentTab === 'preview'}
        <PreviewPlayer onClose={handleClosePreview} />
      {/if}
    </main>
  </div>

  {#if showExportModal}
    <div class="modal-overlay" on:click={() => showExportModal = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h3>导出剧情数据</h3>
          <button class="close-btn" on:click={() => showExportModal = false}>×</button>
        </div>
        <div class="modal-body">
          <textarea readonly value={exportText} class="json-textarea"></textarea>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" on:click={copyExportToClipboard}>
            📋 复制到剪贴板
          </button>
          <button class="modal-btn primary" on:click={downloadExport}>
            💾 下载 JSON 文件
          </button>
        </div>
      </div>
    </div>
  {/if}

  {#if showImportModal}
    <div class="modal-overlay" on:click={() => showImportModal = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h3>导入剧情数据</h3>
          <button class="close-btn" on:click={() => showImportModal = false}>×</button>
        </div>
        <div class="modal-body">
          <div class="import-actions">
            <button class="file-btn" on:click={() => fileInput?.click()}>
              📁 选择 JSON 文件
            </button>
            <input
              bind:this={fileInput}
              type="file"
              accept=".json"
              style="display:none"
              on:change={handleFileSelect}
            />
            <span class="or-text">或粘贴 JSON 内容：</span>
          </div>
          <textarea
            bind:value={importText}
            placeholder={'{"nodes": [...], "endings": [...]}'}
            class="json-textarea"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button class="modal-btn" on:click={() => showImportModal = false}>取消</button>
          <button class="modal-btn primary" on:click={doImport} disabled={!importText.trim()}>
            ✓ 确认导入
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .editor-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #0a0f1a;
    color: #c0d8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    background: linear-gradient(180deg, #0d1525 0%, #0a0f1a 100%);
    border-bottom: 1px solid rgba(0, 200, 160, 0.2);
    gap: 20px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: rgba(0, 200, 160, 0.1);
    border-color: rgba(0, 200, 160, 0.3);
    color: #00c8a0;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-icon {
    font-size: 2rem;
  }

  .editor-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #00d4b0;
    margin: 0;
    letter-spacing: 0.05em;
    text-shadow: 0 0 15px rgba(0, 212, 176, 0.3);
  }

  .editor-subtitle {
    font-size: 0.75rem;
    color: #5a8aaa;
    margin: 2px 0 0;
    letter-spacing: 0.1em;
  }

  .dirty-badge {
    margin-left: 12px;
    padding: 4px 10px;
    background: rgba(255, 120, 80, 0.15);
    border: 1px solid rgba(255, 120, 80, 0.4);
    border-radius: 12px;
    font-size: 0.75rem;
    color: #ff8866;
    animation: pulse 1.5s infinite;
  }

  .header-right {
    display: flex;
    gap: 10px;
  }

  .header-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #a0c0e0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .header-btn:hover {
    background: rgba(0, 200, 160, 0.1);
    border-color: rgba(0, 200, 160, 0.4);
    color: #00d4b0;
  }

  .header-btn.primary {
    background: linear-gradient(135deg, rgba(0, 200, 160, 0.25), rgba(0, 160, 130, 0.15));
    border-color: rgba(0, 200, 160, 0.5);
    color: #00ffd0;
  }

  .header-btn.primary:hover {
    background: linear-gradient(135deg, rgba(0, 220, 180, 0.4), rgba(0, 180, 140, 0.25));
  }

  .editor-tabs {
    display: flex;
    align-items: center;
    padding: 0 20px;
    background: #0d1525;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    gap: 4px;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6a8aaa;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    margin-bottom: -1px;
  }

  .tab-btn:hover {
    color: #a0c8e8;
    background: rgba(255, 255, 255, 0.03);
  }

  .tab-btn.active {
    color: #00d4b0;
    border-bottom-color: #00d4b0;
    background: rgba(0, 200, 160, 0.06);
  }

  .tab-icon {
    font-size: 1rem;
  }

  .tabs-spacer {
    flex: 1;
  }

  .preview-shortcut {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: linear-gradient(135deg, rgba(0, 200, 160, 0.2), rgba(0, 160, 200, 0.15));
    border: 1px solid rgba(0, 200, 200, 0.4);
    border-radius: 6px;
    color: #60f0d0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .preview-shortcut:hover {
    background: linear-gradient(135deg, rgba(0, 220, 180, 0.35), rgba(0, 180, 220, 0.25));
    transform: translateY(-1px);
  }

  .editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 280px;
    min-width: 240px;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    background: #0d1525;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .sidebar-header h3 {
    margin: 0;
    font-size: 0.95rem;
    color: #8ab0d0;
    font-weight: 600;
  }

  .add-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(0, 200, 160, 0.12);
    border: 1px solid rgba(0, 200, 160, 0.35);
    border-radius: 5px;
    color: #00d4b0;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }

  .add-btn:hover {
    background: rgba(0, 200, 160, 0.25);
  }

  .search-box {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .search-box input {
    width: 100%;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.2s;
  }

  .search-box input:focus {
    border-color: rgba(0, 200, 160, 0.5);
    background: rgba(0, 200, 160, 0.05);
  }

  .search-box input::placeholder {
    color: #4a6a8a;
  }

  .node-count {
    padding: 8px 16px;
    font-size: 0.75rem;
    color: #5a8aaa;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .node-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }

  .node-item {
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
  }

  .node-item:hover {
    background: rgba(0, 200, 160, 0.06);
    border-color: rgba(0, 200, 160, 0.15);
  }

  .node-item.selected {
    background: rgba(0, 200, 160, 0.12);
    border-color: rgba(0, 200, 160, 0.4);
  }

  .node-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .node-id {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #8ab0d0;
    font-weight: 600;
  }

  .node-tag {
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 0.65rem;
    font-weight: 500;
  }

  .node-tag.ending {
    background: rgba(255, 150, 80, 0.15);
    color: #ff9650;
    border: 1px solid rgba(255, 150, 80, 0.3);
  }

  .node-tag.checkpoint {
    background: rgba(150, 100, 255, 0.15);
    color: #b090ff;
    border: 1px solid rgba(150, 100, 255, 0.3);
  }

  .node-title {
    font-size: 0.8rem;
    color: #a0c8e8;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .node-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.7rem;
    color: #5a8aaa;
  }

  .delete-mini {
    margin-left: auto;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 80, 80, 0.1);
    border: 1px solid rgba(255, 80, 80, 0.3);
    border-radius: 3px;
    color: #ff6666;
    cursor: pointer;
    font-size: 0.8rem;
    line-height: 1;
    transition: all 0.15s;
  }

  .delete-mini:hover {
    background: rgba(255, 80, 80, 0.25);
  }

  .editor-content {
    flex: 1;
    overflow: auto;
    background: #0a0f1a;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal {
    width: 90%;
    max-width: 700px;
    max-height: 80vh;
    background: #0d1525;
    border: 1px solid rgba(0, 200, 160, 0.3);
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 200, 160, 0.05);
  }

  .modal-header h3 {
    margin: 0;
    color: #00d4b0;
    font-size: 1.1rem;
  }

  .close-btn {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 1.3rem;
    border-radius: 5px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 80, 80, 0.15);
    color: #ff8080;
  }

  .modal-body {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
  }

  .json-textarea {
    width: 100%;
    height: 300px;
    padding: 12px;
    background: #060a12;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #a0e0c8;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    line-height: 1.5;
    resize: vertical;
    outline: none;
  }

  .json-textarea:focus {
    border-color: rgba(0, 200, 160, 0.4);
  }

  .import-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
    flex-wrap: wrap;
  }

  .file-btn {
    padding: 8px 16px;
    background: rgba(0, 200, 160, 0.12);
    border: 1px solid rgba(0, 200, 160, 0.35);
    border-radius: 6px;
    color: #00d4b0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .file-btn:hover {
    background: rgba(0, 200, 160, 0.25);
  }

  .or-text {
    font-size: 0.85rem;
    color: #6a8aaa;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.2);
  }

  .modal-btn {
    padding: 10px 18px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #a0c0e0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .modal-btn:hover {
    background: rgba(0, 200, 160, 0.1);
    border-color: rgba(0, 200, 160, 0.4);
    color: #00d4b0;
  }

  .modal-btn.primary {
    background: linear-gradient(135deg, rgba(0, 200, 160, 0.3), rgba(0, 160, 130, 0.2));
    border-color: rgba(0, 200, 160, 0.5);
    color: #00ffd0;
  }

  .modal-btn.primary:hover {
    background: linear-gradient(135deg, rgba(0, 220, 180, 0.45), rgba(0, 180, 140, 0.3));
  }

  .modal-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

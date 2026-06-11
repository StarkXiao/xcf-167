<script lang="ts">
  import { get } from 'svelte/store';
  import {
    clipEditorState,
    selectedNode,
    selectedSegment,
    segmentDialogues,
    segmentDanmakus,
    currentVersion,
    compareVersions,
    setClipTab,
    selectClipNode,
    addSegment,
    updateSegment,
    deleteSegment,
    selectSegment,
    createVersion,
    updateVersion,
    deleteVersion,
    selectVersionForCompare,
    setCurrentVersion,
    moveDanmaku,
    exportClipVersion,
    importClipVersion,
    compareVersionsDiff,
    type ClipTab,
    type ClipSegment
  } from '../../lib/clipEditorStore';
  import { allNodes, sfxTypes } from '../../lib/editorStore';
  import { playSFX } from '../../lib/audio';
  import type { SFXType, Danmaku } from '../../types/game';

  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function inputChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }

  $: state = $clipEditorState;
  $: currentTab = state.activeTab;
  $: node = $selectedNode;
  $: segment = $selectedSegment;
  $: dialogues = $segmentDialogues;
  $: danmakus = $segmentDanmakus;
  $: version = $currentVersion;
  $: compareList = $compareVersions;

  const tabs: { id: ClipTab; label: string; icon: string }[] = [
    { id: 'slicing', label: '台词切片', icon: '✂️' },
    { id: 'danmaku', label: '弹幕重排', icon: '💬' },
    { id: 'sfx', label: '音效试听', icon: '🔊' },
    { id: 'export', label: '片段导出', icon: '📤' },
    { id: 'compare', label: '版本对比', icon: '⚖️' }
  ];

  let sliceStartIndex = 0;
  let sliceEndIndex = 0;
  let newSegmentName = '';
  let showImportModal = false;
  let importText = '';
  let showExportModal = false;
  let exportText = '';
  let newVersionName = '';
  let draggedDanmakuId: string | null = null;
  let dragOverIndex: number | null = null;

  $: if (node && node.dialogues) {
    if (sliceEndIndex >= node.dialogues.length) {
      sliceEndIndex = node.dialogues.length - 1;
    }
    if (sliceStartIndex > sliceEndIndex) {
      sliceStartIndex = sliceEndIndex;
    }
  }

  function handleTabClick(tabId: ClipTab) {
    playSFX('click');
    setClipTab(tabId);
  }

  function handleNodeSelect(nodeId: string) {
    playSFX('select');
    selectClipNode(nodeId);
    const n = get(allNodes).find(n => n.id === nodeId);
    if (n?.dialogues) {
      sliceStartIndex = 0;
      sliceEndIndex = Math.min(2, n.dialogues.length - 1);
    }
  }

  function handleAddSegment() {
    if (!node) return;
    playSFX('notify');
    const name = newSegmentName.trim() || undefined;
    addSegment(node.id, sliceStartIndex, sliceEndIndex, name);
    newSegmentName = '';
  }

  function handleDeleteSegment(segId: string) {
    if (confirm('确定要删除这个片段吗？')) {
      playSFX('warning');
      deleteSegment(segId);
    }
  }

  function handleCreateVersion() {
    const name = newVersionName.trim() || `版本 ${state.versions.length + 1}`;
    playSFX('notify');
    createVersion(name);
    newVersionName = '';
  }

  function handleDeleteVersion(verId: string) {
    if (confirm('确定要删除这个版本吗？')) {
      playSFX('warning');
      deleteVersion(verId);
    }
  }

  function handleExport(verId: string) {
    playSFX('click');
    exportText = exportClipVersion(verId);
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
    a.download = `clip-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSFX('notify');
  }

  function handleImport() {
    playSFX('click');
    showImportModal = true;
    importText = '';
  }

  function doImport() {
    if (importClipVersion(importText)) {
      playSFX('notify');
      showImportModal = false;
      importText = '';
    } else {
      alert('导入失败：数据格式错误');
    }
  }

  function testPlay(type: string) {
    playSFX(type as SFXType);
  }

  function handleDragStart(dmId: string) {
    draggedDanmakuId = dmId;
  }

  function handleDragOver(e: DragEvent, index: number) {
    e.preventDefault();
    dragOverIndex = index;
  }

  function handleDrop(index: number) {
    if (draggedDanmakuId && segment) {
      moveDanmaku(segment.id, draggedDanmakuId, index);
    }
    draggedDanmakuId = null;
    dragOverIndex = null;
  }

  function handleDragEnd() {
    draggedDanmakuId = null;
    dragOverIndex = null;
  }

  function formatTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, '0');
    const mmm = (ms % 1000).toString().padStart(3, '0');
    return `${m}:${ss}.${mmm}`;
  }

  function getOrderedDanmakus(): Danmaku[] {
    if (!segment || !version) return danmakus;
    const order = version.danmakuOrder[segment.id];
    if (!order || order.length === 0) return danmakus;
    
    const dmMap = new Map(danmakus.map(d => [d.id, d]));
    const ordered: Danmaku[] = [];
    for (const id of order) {
      const dm = dmMap.get(id);
      if (dm) ordered.push(dm);
    }
    for (const dm of danmakus) {
      if (!order.includes(dm.id)) ordered.push(dm);
    }
    return ordered;
  }

  $: orderedDanmakus = getOrderedDanmakus();

  function initDanmakuOrder() {
    if (!segment || !version) return;
    const ids = danmakus.map(d => d.id);
    const newOrder = { ...version.danmakuOrder, [segment.id]: ids };
    updateVersion(version.id, { danmakuOrder: newOrder });
  }

  $: diffResult = (() => {
    if (state.selectedVersionIds.length !== 2) return null;
    return compareVersionsDiff(state.selectedVersionIds[0], state.selectedVersionIds[1]);
  })();
</script>

<div class="clip-editor">
  <nav class="clip-tabs">
    {#each tabs as tab}
      <button
        class="clip-tab-btn {currentTab === tab.id ? 'active' : ''}"
        on:click={() => handleTabClick(tab.id)}
      >
        <span class="tab-icon">{tab.icon}</span>
        <span class="tab-label">{tab.label}</span>
      </button>
    {/each}
  </nav>

  <div class="clip-content">
    {#if currentTab === 'slicing'}
      <div class="slicing-panel">
        <div class="panel-section">
          <h3 class="section-title">🎬 选择源节点</h3>
          <select
            value={state.selectedNodeId || ''}
            on:change={(e) => handleNodeSelect(selectValue(e) || '')}
            class="input full"
          >
            <option value="">请选择节点...</option>
            {#each get(allNodes) as n}
              <option value={n.id}>{n.id} {n.title ? `- ${n.title}` : ''}</option>
            {/each}
          </select>
        </div>

        {#if node && node.dialogues}
          <div class="panel-section">
            <h3 class="section-title">✂️ 台词切片范围</h3>
            <div class="slice-range">
              <div class="range-input">
                <label>起始对白 #</label>
                <input
                  type="range"
                  min="0"
                  max={node.dialogues.length - 1}
                  bind:value={sliceStartIndex}
                  class="range-slider"
                />
                <span class="range-value">{sliceStartIndex + 1}</span>
              </div>
              <div class="range-input">
                <label>结束对白 #</label>
                <input
                  type="range"
                  min="0"
                  max={node.dialogues.length - 1}
                  bind:value={sliceEndIndex}
                  class="range-slider"
                />
                <span class="range-value">{sliceEndIndex + 1}</span>
              </div>
              <div class="slice-info">
                共 <strong>{sliceEndIndex - sliceStartIndex + 1}</strong> 段对白
              </div>
            </div>

            <div class="dialogue-preview">
              <h4>对白预览</h4>
              <div class="dialogue-list">
                {#each node.dialogues.slice(sliceStartIndex, sliceEndIndex + 1) as dialogue, i}
                  <div class="dialogue-item">
                    <span class="d-index">{sliceStartIndex + i + 1}</span>
                    <span class="d-speaker">{dialogue.speaker || '(旁白)'}</span>
                    <span class="d-text">{dialogue.text}</span>
                  </div>
                {/each}
              </div>
            </div>

            <div class="add-segment-form">
              <input
                type="text"
                bind:value={newSegmentName}
                placeholder="片段名称（可选）"
                class="input"
              />
              <button class="action-btn primary" on:click={handleAddSegment}>
                <span>+</span> 创建片段
              </button>
            </div>
          </div>
        {/if}

        <div class="panel-section">
          <h3 class="section-title">📋 已创建片段 ({state.segments.length})</h3>
          {#if state.segments.length === 0}
            <div class="empty-state">
              <span class="empty-icon">📦</span>
              <p>还没有创建任何片段</p>
            </div>
          {:else}
            <div class="segment-list">
              {#each state.segments as seg}
                <div 
                  class="segment-card {state.selectedSegmentId === seg.id ? 'selected' : ''}"
                  on:click={() => selectSegment(seg.id)}
                >
                  <div class="seg-header">
                    <span class="seg-name">{seg.name}</span>
                    <button
                      class="icon-btn danger tiny"
                      on:click|stopPropagation={() => handleDeleteSegment(seg.id)}
                      title="删除"
                    >×</button>
                  </div>
                  <div class="seg-meta">
                    <span class="seg-node">{seg.nodeId}</span>
                    <span class="seg-range">对白 #{seg.startDialogueIndex + 1} - #{seg.endDialogueIndex + 1}</span>
                  </div>
                  <div class="seg-stats">
                    <span>💬 {seg.endDialogueIndex - seg.startDialogueIndex + 1} 段对白</span>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

    {:else if currentTab === 'danmaku'}
      <div class="danmaku-panel">
        <div class="panel-section">
          <h3 class="section-title">💬 弹幕重排</h3>
          <p class="section-desc">选择一个片段，拖拽弹幕调整播放顺序</p>
          
          <div class="segment-selector">
            <label>选择片段</label>
            <select
              value={state.selectedSegmentId || ''}
              on:change={(e) => selectSegment(selectValue(e) || null)}
              class="input"
            >
              <option value="">请选择片段...</option>
              {#each state.segments as seg}
                <option value={seg.id}>{seg.name}</option>
              {/each}
            </select>
          </div>

          {#if version}
            <div class="version-badge">
              当前编辑版本: <strong>{version.name}</strong>
            </div>
          {:else}
            <div class="warning-box">
              ⚠️ 请先在「片段导出」中创建一个版本，然后再调整弹幕顺序
            </div>
          {/if}
        </div>

        {#if segment && version}
          <div class="panel-section">
            <div class="section-header">
              <h3 class="section-title">弹幕列表（拖拽排序）</h3>
              <button class="action-btn small" on:click={initDanmakuOrder}>
                重置顺序
              </button>
            </div>
            
            {#if orderedDanmakus.length === 0}
              <div class="empty-state">
                <span class="empty-icon">💬</span>
                <p>这个片段没有弹幕</p>
              </div>
            {:else}
              <div class="danmaku-sort-list">
                {#each orderedDanmakus as dm, index}
                  <div
                    class="danmaku-sort-item"
                    class:dragging={draggedDanmakuId === dm.id}
                    class:drag-over={dragOverIndex === index}
                    draggable="true"
                    on:dragstart={() => handleDragStart(dm.id)}
                    on:dragover={(e) => handleDragOver(e, index)}
                    on:drop={() => handleDrop(index)}
                    on:dragend={handleDragEnd}
                  >
                    <span class="drag-handle">⋮⋮</span>
                    <span class="dm-order">{index + 1}</span>
                    <span 
                      class="dm-color-dot"
                      style:background={dm.color || '#66ccff'}
                    ></span>
                    <span class="dm-username">{dm.username}</span>
                    <span class="dm-content">{dm.content}</span>
                    {#if dm.isImportant}
                      <span class="dm-flag important">⭐</span>
                    {/if}
                    {#if dm.isBackendOnly}
                      <span class="dm-flag backend">🔧</span>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          <div class="panel-section">
            <h3 class="section-title">⏱️ 时间轴预览</h3>
            <div class="timeline-preview">
              <div class="timeline-scale">
                {#each Array.from({ length: 6 }) as _, i}
                  <div class="scale-mark">
                    <span>{i * 2}s</span>
                  </div>
                {/each}
              </div>
              <div class="timeline-track">
                {#each orderedDanmakus as dm, i}
                  {@const position = Math.min((i / orderedDanmakus.length) * 90 + 5, 95)}
                  <div
                    class="timeline-dot"
                    style="left: {position}%;"
                    style:background={dm.color || '#66ccff'}
                    title={`${dm.username}: ${dm.content}`}
                  ></div>
                {/each}
              </div>
            </div>
          </div>
        {/if}
      </div>

    {:else if currentTab === 'sfx'}
      <div class="sfx-panel">
        <div class="panel-section">
          <h3 class="section-title">🔊 音效试听</h3>
          <p class="section-desc">点击音效试听，可用于剪辑时的音效选择</p>
        </div>

        <div class="panel-section">
          <h3 class="subsection-title">📚 音效素材库</h3>
          
          <div class="sfx-categories">
            <div class="sfx-category">
              <div class="category-label">环境声</div>
              <div class="sfx-chips">
                {#each ['bubbles', 'water_drip', 'water_flow', 'hull_pressure', 'metal_creak', 'metal_crash', 'thunder', 'sonar'] as type}
                  <button
                    class="sfx-chip"
                    on:click={() => testPlay(type)}
                    title="点击试听"
                  >
                    <span class="chip-icon">▶</span>
                    <span class="chip-name">{type}</span>
                  </button>
                {/each}
              </div>
            </div>

            <div class="sfx-category">
              <div class="category-label">系统提示</div>
              <div class="sfx-chips">
                {#each ['click', 'select', 'warning', 'alarm', 'static', 'radio_noise', 'keyboard', 'notify', 'door_slam'] as type}
                  <button
                    class="sfx-chip"
                    on:click={() => testPlay(type)}
                    title="点击试听"
                  >
                    <span class="chip-icon">▶</span>
                    <span class="chip-name">{type}</span>
                  </button>
                {/each}
              </div>
            </div>

            <div class="sfx-category">
              <div class="category-label">心理氛围</div>
              <div class="sfx-chips">
                {#each ['whisper', 'heartbeat', 'breath', 'glass_crack'] as type}
                  <button
                    class="sfx-chip"
                    on:click={() => testPlay(type)}
                    title="点击试听"
                  >
                    <span class="chip-icon">▶</span>
                    <span class="chip-name">{type}</span>
                  </button>
                {/each}
              </div>
            </div>
          </div>
        </div>

        {#if segment}
          <div class="panel-section">
            <h3 class="subsection-title">🎯 当前片段音效</h3>
            <div class="segment-sfx-list">
              {#each dialogues as dialogue, idx}
                {#if dialogue.sfx && dialogue.sfx.length > 0}
                  <div class="dialogue-sfx-card">
                    <div class="ds-header">
                      <span class="ds-index">#{idx + 1}</span>
                      <span class="ds-speaker">{dialogue.speaker || '(旁白)'}</span>
                      <span class="ds-text">{dialogue.text.slice(0, 50)}...</span>
                    </div>
                    <div class="ds-sfx-list">
                      {#each dialogue.sfx as s}
                        <button class="sfx-chip small" on:click={() => testPlay(s.sfx)}>
                          <span class="chip-icon">▶</span>
                          <span class="chip-name">{s.sfx}</span>
                          <span class="chip-delay">+{s.delay || 0}ms</span>
                        </button>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      </div>

    {:else if currentTab === 'export'}
      <div class="export-panel">
        <div class="panel-section">
          <h3 class="section-title">📦 版本管理</h3>
          <p class="section-desc">创建剪辑版本，可导出或用于对比</p>
          
          <div class="create-version-form">
            <input
              type="text"
              bind:value={newVersionName}
              placeholder="版本名称（可选）"
              class="input"
            />
            <button class="action-btn primary" on:click={handleCreateVersion}>
              <span>+</span> 创建版本
            </button>
          </div>

          <div class="version-count">
            当前 <strong>{state.segments.length}</strong> 个片段，<strong>{state.versions.length}</strong> 个版本
          </div>
        </div>

        {#if state.versions.length === 0}
          <div class="empty-state">
            <span class="empty-icon">📦</span>
            <p>还没有创建任何版本</p>
            <p class="hint">创建版本后可以导出、对比不同的剪辑方案</p>
          </div>
        {:else}
          <div class="version-list">
            {#each state.versions as ver}
              <div class="version-card {state.currentVersionId === ver.id ? 'active' : ''}">
                <div class="ver-header" on:click={() => setCurrentVersion(ver.id)}>
                  <span class="ver-name">{ver.name}</span>
                  <div class="ver-actions">
                    <button class="icon-btn tiny" on:click|stopPropagation={() => handleExport(ver.id)} title="导出">
                      📤
                    </button>
                    <button
                      class="icon-btn danger tiny"
                      on:click|stopPropagation={() => handleDeleteVersion(ver.id)}
                      title="删除"
                    >×</button>
                  </div>
                </div>
                <div class="ver-meta">
                  <span>📋 {ver.segments.length} 个片段</span>
                  <span>🕐 {new Date(ver.createdAt).toLocaleString()}</span>
                </div>
                <div class="ver-segments">
                  {#each ver.segments.slice(0, 3) as seg}
                    <span class="ver-seg-tag">{seg.name}</span>
                  {/each}
                  {#if ver.segments.length > 3}
                    <span class="ver-seg-more">+{ver.segments.length - 3}</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <div class="panel-section">
          <h3 class="section-title">📥 导入</h3>
          <button class="action-btn" on:click={handleImport}>
            <span>📥</span> 导入剪辑版本
          </button>
        </div>
      </div>

    {:else if currentTab === 'compare'}
      <div class="compare-panel">
        <div class="panel-section">
          <h3 class="section-title">⚖️ 多版本对比</h3>
          <p class="section-desc">选择两个版本进行对比分析</p>
          
          <div class="version-picker">
            {#each state.versions as ver}
              <label class="version-check {state.selectedVersionIds.includes(ver.id) ? 'checked' : ''}">
                <input
                  type="checkbox"
                  checked={state.selectedVersionIds.includes(ver.id)}
                  disabled={state.selectedVersionIds.length >= 2 && !state.selectedVersionIds.includes(ver.id)}
                  on:change={(e) => selectVersionForCompare(ver.id, inputChecked(e))}
                />
                <span class="vc-name">{ver.name}</span>
                <span class="vc-segments">{ver.segments.length} 片段</span>
              </label>
            {/each}
          </div>
        </div>

        {#if state.versions.length === 0}
          <div class="empty-state">
            <span class="empty-icon">⚖️</span>
            <p>还没有版本可供对比</p>
            <p class="hint">请先在「片段导出」中创建版本</p>
          </div>
        {:else if state.selectedVersionIds.length < 2}
          <div class="empty-state">
            <span class="empty-icon">👆</span>
            <p>请选择两个版本进行对比</p>
          </div>
        {:else if diffResult}
          <div class="diff-results">
            <div class="diff-section">
              <h4>📋 片段差异</h4>
              
              {#if diffResult.segments.added.length > 0}
                <div class="diff-group added">
                  <span class="diff-label">新增片段</span>
                  {#each diffResult.segments.added as seg}
                    <div class="diff-item">+ {seg.name}</div>
                  {/each}
                </div>
              {/if}
              
              {#if diffResult.segments.removed.length > 0}
                <div class="diff-group removed">
                  <span class="diff-label">移除片段</span>
                  {#each diffResult.segments.removed as seg}
                    <div class="diff-item">- {seg.name}</div>
                  {/each}
                </div>
              {/if}
              
              {#if diffResult.segments.changed.length > 0}
                <div class="diff-group changed">
                  <span class="diff-label">修改片段</span>
                  {#each diffResult.segments.changed as change}
                    <div class="diff-item">
                      ~ {change.id}: {change.field} 
                      <span class="diff-old">{String(change.old)}</span> 
                      → 
                      <span class="diff-new">{String(change.new)}</span>
                    </div>
                  {/each}
                </div>
              {/if}
              
              {#if diffResult.segments.added.length === 0 
                && diffResult.segments.removed.length === 0 
                && diffResult.segments.changed.length === 0}
                <div class="diff-no-change">片段完全相同</div>
              {/if}
            </div>

            <div class="diff-section">
              <h4>💬 弹幕顺序差异</h4>
              {#if diffResult.danmakuOrder.changedSegments.length > 0}
                <div class="diff-group changed">
                  <span class="diff-label">弹幕顺序有变化的片段</span>
                  {#each diffResult.danmakuOrder.changedSegments as segId}
                    <div class="diff-item">{segId}</div>
                  {/each}
                </div>
              {:else}
                <div class="diff-no-change">弹幕顺序完全相同</div>
              {/if}
            </div>

            <div class="diff-summary">
              <div class="summary-item">
                <span class="summary-label">总片段数</span>
                <span class="summary-value">{state.versions.find(v => v.id === state.selectedVersionIds[0])?.segments.length || 0} 
                  → 
                  {state.versions.find(v => v.id === state.selectedVersionIds[1])?.segments.length || 0}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if showExportModal}
    <div class="modal-overlay" on:click={() => showExportModal = false}>
      <div class="modal" on:click|stopPropagation>
        <div class="modal-header">
          <h3>导出剪辑数据</h3>
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
          <h3>导入剪辑版本</h3>
          <button class="close-btn" on:click={() => showImportModal = false}>×</button>
        </div>
        <div class="modal-body">
          <textarea
            bind:value={importText}
            placeholder="粘贴 JSON 数据..."
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
  .clip-editor {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #0a0f1a;
    color: #c0d8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  .clip-tabs {
    display: flex;
    gap: 2px;
    padding: 0 16px;
    background: #0d1525;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .clip-tab-btn {
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

  .clip-tab-btn:hover {
    color: #a0c8e8;
    background: rgba(255, 255, 255, 0.03);
  }

  .clip-tab-btn.active {
    color: #00d4b0;
    border-bottom-color: #00d4b0;
    background: rgba(0, 200, 160, 0.06);
  }

  .tab-icon {
    font-size: 1rem;
  }

  .clip-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  .panel-section {
    background: #0d1525;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 18px;
    margin-bottom: 18px;
  }

  .section-title {
    margin: 0 0 12px;
    font-size: 1rem;
    color: #00d4b0;
    font-weight: 600;
  }

  .subsection-title {
    margin: 0 0 12px;
    font-size: 0.9rem;
    color: #ffc050;
    font-weight: 600;
  }

  .section-desc {
    margin: 0 0 14px;
    color: #6a8aaa;
    font-size: 0.82rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
  }

  .input {
    padding: 7px 11px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }

  .input:focus {
    border-color: rgba(0, 200, 160, 0.5);
  }

  .input.full {
    width: 100%;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(0, 200, 160, 0.15);
    border: 1px solid rgba(0, 200, 160, 0.4);
    border-radius: 6px;
    color: #00d4b0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(0, 200, 160, 0.28);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, rgba(0, 200, 160, 0.3), rgba(0, 160, 130, 0.2));
    border-color: rgba(0, 200, 160, 0.5);
    color: #00ffd0;
  }

  .action-btn.small {
    padding: 5px 10px;
    font-size: 0.78rem;
  }

  .icon-btn {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.15s;
  }

  .icon-btn:hover {
    background: rgba(0, 200, 160, 0.15);
    color: #00d4b0;
  }

  .icon-btn.danger {
    background: rgba(255, 80, 80, 0.12);
    border-color: rgba(255, 80, 80, 0.3);
    color: #ff8080;
  }

  .icon-btn.danger:hover {
    background: rgba(255, 80, 80, 0.25);
  }

  .icon-btn.tiny {
    width: 22px;
    height: 22px;
    font-size: 0.75rem;
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: #5a8aaa;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .empty-icon {
    font-size: 2.5rem;
    opacity: 0.5;
  }

  .hint {
    font-size: 0.8rem;
    color: #4a6a8a;
  }

  .slice-range {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 18px;
  }

  .range-input {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .range-input label {
    width: 80px;
    font-size: 0.82rem;
    color: #6a8aaa;
  }

  .range-slider {
    flex: 1;
    accent-color: #00d4b0;
  }

  .range-value {
    width: 30px;
    text-align: center;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #00d4b0;
  }

  .slice-info {
    text-align: center;
    padding: 8px;
    background: rgba(0, 200, 160, 0.06);
    border-radius: 6px;
    font-size: 0.85rem;
    color: #6a8aaa;
  }

  .slice-info strong {
    color: #00d4b0;
    font-size: 1.1rem;
  }

  .dialogue-preview {
    margin-bottom: 16px;
  }

  .dialogue-preview h4 {
    margin: 0 0 10px;
    font-size: 0.85rem;
    color: #8ab0d0;
    font-weight: 500;
  }

  .dialogue-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
  }

  .dialogue-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 8px 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    font-size: 0.82rem;
  }

  .dialogue-item:last-child {
    border-bottom: none;
  }

  .d-index {
    width: 24px;
    text-align: center;
    font-family: 'Courier New', monospace;
    color: #5a8aaa;
    font-size: 0.75rem;
    padding-top: 1px;
  }

  .d-speaker {
    color: #ffd080;
    font-weight: 600;
    flex-shrink: 0;
  }

  .d-text {
    color: #a0c0e0;
    line-height: 1.4;
  }

  .add-segment-form {
    display: flex;
    gap: 10px;
  }

  .add-segment-form .input {
    flex: 1;
  }

  .segment-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 12px;
  }

  .segment-card {
    padding: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .segment-card:hover {
    background: rgba(0, 200, 160, 0.06);
    border-color: rgba(0, 200, 160, 0.2);
  }

  .segment-card.selected {
    background: rgba(0, 200, 160, 0.1);
    border-color: rgba(0, 200, 160, 0.5);
  }

  .seg-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .seg-name {
    font-weight: 600;
    color: #a0c8e8;
    font-size: 0.9rem;
  }

  .seg-meta {
    display: flex;
    gap: 10px;
    margin-bottom: 6px;
    font-size: 0.75rem;
    color: #5a8aaa;
  }

  .seg-node {
    font-family: 'Courier New', monospace;
  }

  .seg-stats {
    font-size: 0.78rem;
    color: #6a8aaa;
  }

  .version-badge {
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(0, 200, 160, 0.08);
    border: 1px solid rgba(0, 200, 160, 0.2);
    border-radius: 6px;
    font-size: 0.82rem;
    color: #6a8aaa;
  }

  .version-badge strong {
    color: #00d4b0;
  }

  .warning-box {
    margin-top: 12px;
    padding: 10px 14px;
    background: rgba(255, 180, 80, 0.08);
    border: 1px solid rgba(255, 180, 80, 0.25);
    border-radius: 6px;
    font-size: 0.82rem;
    color: #ffc080;
  }

  .segment-selector {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 12px;
  }

  .segment-selector label {
    font-size: 0.78rem;
    color: #6a8aaa;
  }

  .danmaku-sort-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 350px;
    overflow-y: auto;
  }

  .danmaku-sort-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
    cursor: grab;
    transition: all 0.2s;
  }

  .danmaku-sort-item:hover {
    background: rgba(0, 200, 160, 0.06);
  }

  .danmaku-sort-item.dragging {
    opacity: 0.5;
    background: rgba(0, 200, 160, 0.1);
  }

  .danmaku-sort-item.drag-over {
    border-color: rgba(0, 200, 160, 0.6);
    background: rgba(0, 200, 160, 0.08);
  }

  .drag-handle {
    color: #4a6a8a;
    cursor: grab;
    font-size: 0.9rem;
    letter-spacing: -2px;
  }

  .dm-order {
    width: 24px;
    text-align: center;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #00d4b0;
    font-size: 0.8rem;
  }

  .dm-color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dm-username {
    font-weight: 600;
    color: #8ab0d0;
    font-size: 0.82rem;
    min-width: 80px;
  }

  .dm-content {
    flex: 1;
    color: #a0c0e0;
    font-size: 0.82rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dm-flag {
    font-size: 0.75rem;
  }

  .timeline-preview {
    padding: 14px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
  }

  .timeline-scale {
    display: flex;
    margin-bottom: 8px;
  }

  .scale-mark {
    flex: 1;
    font-size: 0.65rem;
    color: #4a6a8a;
  }

  .timeline-track {
    position: relative;
    height: 20px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
  }

  .timeline-dot {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.15s;
  }

  .timeline-dot:hover {
    transform: translate(-50%, -50%) scale(1.5);
  }

  .sfx-categories {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .sfx-category {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .category-label {
    width: 70px;
    flex-shrink: 0;
    font-size: 0.78rem;
    color: #8ab0d0;
    padding-top: 4px;
    font-weight: 500;
  }

  .sfx-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }

  .sfx-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    color: #a0c0e0;
    cursor: pointer;
    font-size: 0.78rem;
    transition: all 0.15s;
  }

  .sfx-chip:hover {
    background: rgba(255, 192, 80, 0.12);
    border-color: rgba(255, 192, 80, 0.4);
    color: #ffc050;
  }

  .sfx-chip.small {
    padding: 4px 8px;
    font-size: 0.72rem;
  }

  .chip-icon {
    font-size: 0.6rem;
    opacity: 0.7;
  }

  .chip-delay {
    font-size: 0.65rem;
    color: #5a8aaa;
    opacity: 0.8;
  }

  .segment-sfx-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }

  .dialogue-sfx-card {
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
  }

  .ds-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 0.8rem;
  }

  .ds-index {
    width: 28px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 192, 80, 0.12);
    border: 1px solid rgba(255, 192, 80, 0.25);
    border-radius: 4px;
    color: #ffc050;
    font-family: 'Courier New', monospace;
    font-weight: 600;
    font-size: 0.75rem;
  }

  .ds-speaker {
    color: #ffd080;
    font-weight: 600;
  }

  .ds-text {
    color: #8ab0d0;
    font-size: 0.78rem;
    opacity: 0.8;
  }

  .ds-sfx-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .create-version-form {
    display: flex;
    gap: 10px;
    margin-bottom: 14px;
  }

  .create-version-form .input {
    flex: 1;
  }

  .version-count {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 6px;
    font-size: 0.82rem;
    color: #6a8aaa;
  }

  .version-count strong {
    color: #00d4b0;
    font-size: 1rem;
  }

  .version-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .version-card {
    padding: 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .version-card.active {
    border-color: rgba(0, 200, 160, 0.4);
    background: rgba(0, 200, 160, 0.06);
  }

  .ver-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    cursor: pointer;
  }

  .ver-name {
    font-weight: 600;
    color: #a0c8e8;
    font-size: 0.95rem;
  }

  .ver-actions {
    display: flex;
    gap: 6px;
  }

  .ver-meta {
    display: flex;
    gap: 14px;
    margin-bottom: 10px;
    font-size: 0.75rem;
    color: #5a8aaa;
  }

  .ver-segments {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .ver-seg-tag {
    padding: 2px 8px;
    background: rgba(0, 200, 160, 0.08);
    border: 1px solid rgba(0, 200, 160, 0.2);
    border-radius: 10px;
    font-size: 0.7rem;
    color: #6ac8b0;
  }

  .ver-seg-more {
    padding: 2px 8px;
    font-size: 0.7rem;
    color: #5a8aaa;
  }

  .version-picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .version-check {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .version-check:hover {
    background: rgba(0, 200, 160, 0.04);
  }

  .version-check.checked {
    background: rgba(0, 200, 160, 0.1);
    border-color: rgba(0, 200, 160, 0.4);
  }

  .version-check input {
    accent-color: #00d4b0;
  }

  .vc-name {
    flex: 1;
    font-weight: 500;
    color: #a0c0e0;
  }

  .vc-segments {
    font-size: 0.78rem;
    color: #5a8aaa;
  }

  .diff-results {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .diff-section {
    padding: 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
  }

  .diff-section h4 {
    margin: 0 0 12px;
    font-size: 0.9rem;
    color: #ffc050;
    font-weight: 600;
  }

  .diff-group {
    margin-bottom: 10px;
  }

  .diff-group:last-child {
    margin-bottom: 0;
  }

  .diff-label {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .diff-group.added .diff-label {
    background: rgba(0, 200, 120, 0.15);
    color: #40d090;
  }

  .diff-group.removed .diff-label {
    background: rgba(255, 80, 80, 0.15);
    color: #ff7070;
  }

  .diff-group.changed .diff-label {
    background: rgba(255, 180, 80, 0.15);
    color: #ffc060;
  }

  .diff-item {
    padding: 4px 10px;
    font-size: 0.8rem;
    color: #a0c0e0;
    font-family: 'Courier New', monospace;
  }

  .diff-group.added .diff-item {
    border-left: 2px solid #40d090;
  }

  .diff-group.removed .diff-item {
    border-left: 2px solid #ff7070;
  }

  .diff-group.changed .diff-item {
    border-left: 2px solid #ffc060;
  }

  .diff-old {
    color: #ff7070;
    text-decoration: line-through;
  }

  .diff-new {
    color: #40d090;
    font-weight: 600;
  }

  .diff-no-change {
    padding: 12px;
    text-align: center;
    color: #5a8aaa;
    font-size: 0.85rem;
    font-style: italic;
  }

  .diff-summary {
    padding: 14px;
    background: rgba(0, 200, 160, 0.06);
    border: 1px solid rgba(0, 200, 160, 0.2);
    border-radius: 8px;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .summary-label {
    font-size: 0.82rem;
    color: #6a8aaa;
  }

  .summary-value {
    font-size: 0.9rem;
    color: #00d4b0;
    font-weight: 600;
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
    max-width: 650px;
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
    padding: 14px 18px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 200, 160, 0.05);
  }

  .modal-header h3 {
    margin: 0;
    color: #00d4b0;
    font-size: 1rem;
  }

  .close-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 1.2rem;
    border-radius: 5px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 80, 80, 0.15);
    color: #ff8080;
  }

  .modal-body {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
  }

  .json-textarea {
    width: 100%;
    height: 250px;
    padding: 10px;
    background: #060a12;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #a0e0c8;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    resize: vertical;
    outline: none;
  }

  .json-textarea:focus {
    border-color: rgba(0, 200, 160, 0.4);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 12px 18px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.2);
  }

  .modal-btn {
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #a0c0e0;
    cursor: pointer;
    font-size: 0.85rem;
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

<script lang="ts">
  import {
    workshopState,
    currentCreation,
    currentNodes,
    currentEndings,
    currentDanmakuTemplates,
    currentSfxTemplates,
    selectedNode,
    savedCreations,
    validationResult,
    nodeTemplates,
    danmakuPresetTemplates,
    sfxPresetTemplates,
    newCreation,
    loadCreation,
    saveCreation,
    deleteCreation,
    updateCreationMeta,
    addNodeFromTemplate,
    selectNode,
    updateNode,
    deleteNode,
    addDialogueToNode,
    updateDialogue,
    deleteDialogue,
    addChoiceToNode,
    updateChoice,
    deleteChoice,
    addDanmakuToNode,
    applyDanmakuTemplate,
    updateDanmakuInNode,
    deleteDanmakuFromNode,
    addSfxToDialogue,
    applySfxTemplate,
    updateSfxInDialogue,
    deleteSfxFromDialogue,
    addEnding,
    updateEnding,
    deleteEnding,
    addCustomDanmakuTemplate,
    addCustomSfxTemplate,
    validateCreation,
    generateShareCode,
    importFromShareCode,
    exportAsJSON,
    importFromJSON,
    setTrialing,
    setActiveTab,
    closeWorkshop
  } from '../lib/workshopStore';
  import { playSFX } from '../lib/audio';
  import type { WorkshopTab, SFXType, MoodType, BGMType } from '../types/game';

  export let isOpen = false;
  export let onClose: () => void;

  let importCodeInput = '';
  let importJsonInput = '';
  let newDanmakuTplName = '';
  let newDanmakuTplDesc = '';
  let newSfxTplName = '';
  let newSfxTplDesc = '';
  let trialNodeId = 'start';
  let trialDialogueIdx = 0;
  let trialAutoPlay = false;
  let trialAutoTimer: ReturnType<typeof setTimeout> | null = null;

  const SFX_OPTIONS: SFXType[] = [
    'click', 'select', 'warning', 'sonar', 'bubbles',
    'water_drip', 'water_flow', 'metal_creak', 'metal_crash',
    'hull_pressure', 'alarm', 'static', 'radio_noise',
    'keyboard', 'whisper', 'heartbeat', 'breath',
    'glass_crack', 'thunder', 'door_slam', 'notify'
  ];

  const MOOD_OPTIONS: MoodType[] = ['normal', 'tense', 'scared', 'calm', 'whisper', 'urgent', 'mystery', 'terrified'];
  const BGM_OPTIONS: BGMType[] = ['deep', 'tense', 'calm', 'mystery'];

  function asBGM(val: string): BGMType | undefined {
    return BGM_OPTIONS.includes(val as BGMType) ? (val as BGMType) : undefined;
  }

  function asMood(val: string): MoodType | undefined {
    return MOOD_OPTIONS.includes(val as MoodType) ? (val as MoodType) : undefined;
  }

  function asSFX(val: string): SFXType | undefined {
    return SFX_OPTIONS.includes(val as SFXType) ? (val as SFXType) : undefined;
  }

  function handleClose() {
    playSFX('click');
    if (trialAutoTimer) clearTimeout(trialAutoTimer);
    closeWorkshop();
    onClose();
  }

  function handleNewCreation() {
    playSFX('select');
    newCreation();
  }

  function handleLoadCreation(id: string) {
    playSFX('select');
    loadCreation(id);
  }

  function handleSave() {
    playSFX('click');
    saveCreation();
  }

  function handleDeleteCreation(id: string) {
    playSFX('warning');
    deleteCreation(id);
  }

  function handleAddNode(tplId: string) {
    playSFX('select');
    addNodeFromTemplate(tplId);
  }

  function handleSelectNode(nodeId: string) {
    playSFX('click');
    selectNode(nodeId);
  }

  function handleDeleteNode(nodeId: string) {
    playSFX('warning');
    deleteNode(nodeId);
  }

  function handleAddDialogue(nodeId: string) {
    addDialogueToNode(nodeId);
  }

  function handleDeleteDialogue(nodeId: string, idx: number) {
    deleteDialogue(nodeId, idx);
  }

  function handleAddChoice(nodeId: string) {
    addChoiceToNode(nodeId);
  }

  function handleDeleteChoice(nodeId: string, idx: number) {
    deleteChoice(nodeId, idx);
  }

  function handleAddDanmaku(nodeId: string, dialogueIdx: number) {
    addDanmakuToNode(nodeId, dialogueIdx);
  }

  function handleApplyDanmakuTemplate(nodeId: string, tplId: string) {
    playSFX('select');
    applyDanmakuTemplate(nodeId, tplId);
  }

  function handleDeleteDanmaku(nodeId: string, idx: number) {
    deleteDanmakuFromNode(nodeId, idx);
  }

  function handleAddSfx(nodeId: string, dialogueIdx: number) {
    addSfxToDialogue(nodeId, dialogueIdx);
  }

  function handleApplySfxTemplate(nodeId: string, dialogueIdx: number, tplId: string) {
    playSFX('select');
    applySfxTemplate(nodeId, dialogueIdx, tplId);
  }

  function handleDeleteSfx(nodeId: string, dialogueIdx: number, sfxIdx: number) {
    deleteSfxFromDialogue(nodeId, dialogueIdx, sfxIdx);
  }

  function handleAddEnding() {
    playSFX('select');
    addEnding();
  }

  function handleDeleteEnding(id: string) {
    playSFX('warning');
    deleteEnding(id);
  }

  function handleValidate() {
    playSFX('sonar');
    validateCreation();
    setActiveTab('validate');
  }

  function handleGenerateShare() {
    playSFX('select');
    generateShareCode();
  }

  function handleImportCode() {
    const ok = importFromShareCode(importCodeInput.trim());
    if (ok) {
      playSFX('select');
      importCodeInput = '';
    } else {
      playSFX('warning');
    }
  }

  function handleImportJSON() {
    const ok = importFromJSON(importJsonInput.trim());
    if (ok) {
      playSFX('select');
      importJsonInput = '';
    } else {
      playSFX('warning');
    }
  }

  function handleExportJSON() {
    const json = exportAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    playSFX('select');
  }

  function handleCopyShareCode() {
    const state = $workshopState;
    if (state.shareCode) {
      navigator.clipboard.writeText(state.shareCode).then(() => {
        playSFX('select');
      });
    }
  }

  function handleAddCustomDanmakuTpl() {
    if (!newDanmakuTplName.trim()) return;
    addCustomDanmakuTemplate(newDanmakuTplName.trim(), newDanmakuTplDesc.trim());
    newDanmakuTplName = '';
    newDanmakuTplDesc = '';
    playSFX('select');
  }

  function handleAddCustomSfxTpl() {
    if (!newSfxTplName.trim()) return;
    addCustomSfxTemplate(newSfxTplName.trim(), newSfxTplDesc.trim());
    newSfxTplName = '';
    newSfxTplDesc = '';
    playSFX('select');
  }

  function startTrialPlay() {
    const creation = $currentCreation;
    if (!creation || creation.nodes.length === 0) return;
    setTrialing(true);
    trialNodeId = creation.nodes.find(n => n.id === 'start') ? 'start' : creation.nodes[0].id;
    trialDialogueIdx = 0;
    playSFX('select');
  }

  function stopTrialPlay() {
    setTrialing(false);
    if (trialAutoTimer) {
      clearTimeout(trialAutoTimer);
      trialAutoTimer = null;
    }
    trialAutoPlay = false;
  }

  function trialAdvanceDialogue() {
    const node = $currentCreation?.nodes.find(n => n.id === trialNodeId);
    if (!node) return;
    if (trialDialogueIdx < node.dialogues.length - 1) {
      trialDialogueIdx++;
      if (trialAutoPlay) scheduleTrialAutoAdvance();
    }
  }

  function trialPrevDialogue() {
    if (trialDialogueIdx > 0) trialDialogueIdx--;
  }

  function trialSelectChoice(nextNodeId: string) {
    const node = $currentCreation?.nodes.find(n => n.id === nextNodeId);
    if (node) {
      trialNodeId = nextNodeId;
      trialDialogueIdx = 0;
      if (trialAutoPlay) scheduleTrialAutoAdvance();
    }
  }

  function trialGoToEnd() {
    stopTrialPlay();
    setActiveTab('nodes');
  }

  function toggleTrialAutoPlay() {
    trialAutoPlay = !trialAutoPlay;
    if (trialAutoPlay) scheduleTrialAutoAdvance();
    else if (trialAutoTimer) {
      clearTimeout(trialAutoTimer);
      trialAutoTimer = null;
    }
  }

  function scheduleTrialAutoAdvance() {
    if (trialAutoTimer) clearTimeout(trialAutoTimer);
    trialAutoTimer = setTimeout(() => {
      const node = $currentCreation?.nodes.find(n => n.id === trialNodeId);
      if (!node) return;
      if (trialDialogueIdx < node.dialogues.length - 1) {
        trialDialogueIdx++;
        scheduleTrialAutoAdvance();
      }
    }, 2500);
  }

  $: allNodeIds = $currentCreation?.nodes.map(n => n.id) || [];
  $: trialCurrentNode = $currentCreation?.nodes.find(n => n.id === trialNodeId) || null;
  $: trialCurrentDialogue = trialCurrentNode?.dialogues[trialDialogueIdx] || null;
  $: trialCurrentChoices = trialCurrentNode?.choices || [];
</script>

{#if isOpen}
<div class="workshop-overlay" on:click|stopPropagation>
  <div class="workshop-container">
    <div class="workshop-header">
      <div class="header-left">
        <h2 class="workshop-title">玩家创作工坊</h2>
        <span class="workshop-subtitle">PLAYER CREATION WORKSHOP — v1.0</span>
      </div>
      <div class="header-right">
        {#if $currentCreation}
          <span class="creation-badge">正在编辑: {$currentCreation.title}</span>
        {/if}
        <button class="close-btn" on:click={handleClose}>✕</button>
      </div>
    </div>

    {#if !$currentCreation}
      <div class="workshop-body">
        <div class="welcome-screen">
          <div class="welcome-icon">🛠</div>
          <h3 class="welcome-title">欢迎来到创作工坊</h3>
          <p class="welcome-desc">设计你自己的深海剧情 — 自定义节点、分支、弹幕和音效</p>
          <button class="action-btn primary" on:click={handleNewCreation}>创建新作品</button>

          {#if $savedCreations.length > 0}
            <div class="saved-section">
              <h4 class="saved-title">已保存的作品</h4>
              <div class="saved-list">
                {#each $savedCreations as c (c.id)}
                  <div class="saved-item">
                    <div class="saved-item-info">
                      <span class="saved-item-title">{c.title}</span>
                      <span class="saved-item-meta">{c.nodes.length} 节点 · {c.endings.length} 结局 · v{c.version}</span>
                      <span class="saved-item-time">{new Date(c.updatedAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <div class="saved-item-actions">
                      <button class="sm-btn" on:click={() => handleLoadCreation(c.id)}>加载</button>
                      <button class="sm-btn danger" on:click={() => handleDeleteCreation(c.id)}>删除</button>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <div class="import-section">
            <h4 class="saved-title">导入作品</h4>
            <div class="import-row">
              <input type="text" class="import-input" placeholder="粘贴分享码..." bind:value={importCodeInput} />
              <button class="sm-btn" on:click={handleImportCode} disabled={!importCodeInput.trim()}>导入码</button>
            </div>
            <div class="import-row">
              <textarea class="import-textarea" placeholder="粘贴JSON内容..." bind:value={importJsonInput}></textarea>
              <button class="sm-btn" on:click={handleImportJSON} disabled={!importJsonInput.trim()}>导入JSON</button>
            </div>
          </div>
        </div>
      </div>
    {:else if $workshopState.isTrialing}
      <div class="workshop-body trial-mode">
        <div class="trial-header">
          <button class="back-btn" on:click={stopTrialPlay}>← 退出试玩</button>
          <span class="trial-badge">试玩模式</span>
          <div class="trial-controls">
            <button class="sm-btn" on:click={toggleTrialAutoPlay}>
              {trialAutoPlay ? '⏸ 暂停' : '▶ 自动'}
            </button>
          </div>
        </div>
        <div class="trial-stage">
          {#if trialCurrentNode}
            <div class="trial-node-info">
              <span class="trial-node-id">[{trialNodeId}]</span>
              {#if trialCurrentNode.title}
                <span class="trial-node-title">{trialCurrentNode.title}</span>
              {/if}
            </div>
            {#if trialCurrentDialogue}
              <div class="trial-dialogue-box">
                {#if trialCurrentDialogue.speaker}
                  <div class="trial-speaker">{trialCurrentDialogue.speaker}</div>
                {/if}
                <div class="trial-text">{trialCurrentDialogue.text}</div>
                {#if trialCurrentDialogue.mood && trialCurrentDialogue.mood !== 'normal'}
                  <div class="trial-mood-tag">情绪: {trialCurrentDialogue.mood}</div>
                {/if}
              </div>
            {:else}
              <div class="trial-dialogue-box empty">
                <div class="trial-text">— 此节点没有更多对白 —</div>
              </div>
            {/if}
            {#if trialCurrentDialogue}
              <div class="trial-nav">
                <button class="sm-btn" on:click={trialPrevDialogue} disabled={trialDialogueIdx <= 0}>◀ 上一句</button>
                <span class="trial-progress">{trialDialogueIdx + 1} / {trialCurrentNode.dialogues.length}</span>
                <button class="sm-btn" on:click={trialAdvanceDialogue} disabled={trialDialogueIdx >= trialCurrentNode.dialogues.length - 1}>下一句 ▶</button>
              </div>
            {/if}
            {#if trialDialogueIdx >= trialCurrentNode.dialogues.length - 1 && trialCurrentChoices.length > 0}
              <div class="trial-choices">
                <div class="trial-choices-label">做出选择:</div>
                {#each trialCurrentChoices as choice, i}
                  <button class="trial-choice-btn" on:click={() => trialSelectChoice(choice.nextNodeId)}>
                    {choice.text || `选项 ${i + 1}`}
                  </button>
                {/each}
              </div>
            {:else if trialDialogueIdx >= trialCurrentNode.dialogues.length - 1 && trialCurrentNode.nextNodeId}
              <div class="trial-choices">
                <button class="trial-choice-btn" on:click={() => trialSelectChoice(trialCurrentNode.nextNodeId || '')}>
                  继续前进 →
                </button>
              </div>
            {:else if trialDialogueIdx >= trialCurrentNode.dialogues.length - 1 && trialCurrentNode.isEnding}
              <div class="trial-ending">
                <div class="trial-ending-icon">🏁</div>
                <div class="trial-ending-title">{trialCurrentNode.endingTitle || '结局'}</div>
                <div class="trial-ending-desc">{trialCurrentNode.endingDescription || ''}</div>
                <button class="action-btn" on:click={trialGoToEnd}>返回编辑</button>
              </div>
            {/if}
            {#if trialCurrentNode.danmakus && trialCurrentNode.danmakus.length > 0}
              <div class="trial-danmaku-preview">
                {#each trialCurrentNode.danmakus.filter(d => d.dialogueIndex === trialDialogueIdx) as dm}
                  <div class="trial-dm" style="color: {dm.color || '#66ccff'}">
                    <span class="dm-user">{dm.username}</span>: {dm.content}
                  </div>
                {/each}
              </div>
            {/if}
          {:else}
            <div class="trial-empty">
              <p>节点 "{trialNodeId}" 不存在</p>
              <button class="action-btn" on:click={stopTrialPlay}>返回编辑</button>
            </div>
          {/if}
        </div>
        <div class="trial-node-list">
          <span class="node-list-label">节点跳转:</span>
          {#each allNodeIds as nid}
            <button class="node-jump-btn" class:active={nid === trialNodeId} on:click={() => { trialNodeId = nid; trialDialogueIdx = 0; }}>
              {nid}
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <div class="tab-bar">
        <button class="tab-btn" class:active={$workshopState.activeTab === 'nodes'} on:click={() => setActiveTab('nodes')}>
          <span class="tab-icon">📝</span> 节点编辑
        </button>
        <button class="tab-btn" class:active={$workshopState.activeTab === 'branches'} on:click={() => setActiveTab('branches')}>
          <span class="tab-icon">🔀</span> 分支管理
        </button>
        <button class="tab-btn" class:active={$workshopState.activeTab === 'danmaku'} on:click={() => setActiveTab('danmaku')}>
          <span class="tab-icon">💬</span> 弹幕模板
        </button>
        <button class="tab-btn" class:active={$workshopState.activeTab === 'sfx'} on:click={() => setActiveTab('sfx')}>
          <span class="tab-icon">🔊</span> 音效模板
        </button>
        <button class="tab-btn" class:active={$workshopState.activeTab === 'validate'} on:click={handleValidate}>
          <span class="tab-icon">✅</span> 校验
        </button>
        <button class="tab-btn" class:active={$workshopState.activeTab === 'trial'} on:click={() => { setActiveTab('trial'); startTrialPlay(); }}>
          <span class="tab-icon">🎮</span> 试玩
        </button>
        <button class="tab-btn" class:active={$workshopState.activeTab === 'share'} on:click={() => setActiveTab('share')}>
          <span class="tab-icon">📤</span> 分享
        </button>
      </div>

      <div class="workshop-toolbar">
        <div class="toolbar-left">
          <input type="text" class="title-input" placeholder="作品标题"
            value={$currentCreation.title}
            on:input={(e) => updateCreationMeta('title', e.currentTarget.value)} />
          <input type="text" class="author-input" placeholder="作者"
            value={$currentCreation.author}
            on:input={(e) => updateCreationMeta('author', e.currentTarget.value)} />
        </div>
        <div class="toolbar-right">
          <button class="sm-btn" on:click={handleSave}>💾 保存</button>
          <button class="sm-btn" on:click={handleValidate}>🔍 校验</button>
          <span class="node-count">节点: {$currentNodes.length} | 结局: {$currentEndings.length}</span>
        </div>
      </div>

      <div class="workshop-body has-content">
        {#if $workshopState.activeTab === 'nodes'}
          <div class="editor-split">
            <div class="node-list-panel">
              <div class="panel-header">
                <span>节点列表</span>
                <div class="panel-actions">
                  {#each nodeTemplates as tpl}
                    <button class="tpl-add-btn" title={tpl.description} on:click={() => handleAddNode(tpl.id)}>
                      + {tpl.label}
                    </button>
                  {/each}
                </div>
              </div>
              <div class="node-list">
                {#each $currentNodes as node (node.id)}
                  <div class="node-item" class:active={$workshopState.selectedNodeId === node.id} on:click={() => handleSelectNode(node.id)}>
                    <div class="node-item-header">
                      <span class="node-item-id">{node.id}</span>
                      {#if node.isEnding}
                        <span class="node-tag ending">结局</span>
                      {/if}
                      {#if node.isRewindCheckpoint}
                        <span class="node-tag checkpoint">检查点</span>
                      {/if}
                    </div>
                    <div class="node-item-info">
                      {node.dialogues.length} 对白
                      {#if node.choices}· {node.choices.length} 选项{/if}
                      {#if node.danmakus}· {node.danmakus.length} 弹幕{/if}
                    </div>
                    <button class="node-del-btn" on:click|stopPropagation={() => handleDeleteNode(node.id)}>✕</button>
                  </div>
                {/each}
                {#if $currentNodes.length === 0}
                  <div class="empty-hint">点击上方模板按钮添加第一个节点</div>
                {/if}
              </div>
            </div>

            <div class="node-edit-panel">
              {#if $selectedNode}
                {@const node = $selectedNode}
                <div class="edit-section">
                  <div class="edit-row">
                    <label>节点ID</label>
                    <input type="text" class="edit-input" value={node.id} readonly />
                  </div>
                  <div class="edit-row">
                    <label>标题</label>
                    <input type="text" class="edit-input" value={node.title || ''}
                      on:input={(e) => updateNode(node.id, { title: e.currentTarget.value })} />
                  </div>
                  <div class="edit-row">
                    <label>BGM</label>
                    <select class="edit-select" value={node.bgm || ''}
                      on:change={(e) => updateNode(node.id, { bgm: asBGM(e.currentTarget.value) })}>
                      <option value="">无</option>
                      {#each BGM_OPTIONS as bgm}
                        <option value={bgm}>{bgm}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <div class="edit-section">
                  <div class="section-header">
                    <h4>对白 ({node.dialogues.length})</h4>
                    <button class="sm-btn" on:click={() => handleAddDialogue(node.id)}>+ 添加对白</button>
                  </div>
                  {#each node.dialogues as dl, i}
                    <div class="dialogue-card">
                      <div class="dialogue-card-header">
                        <span class="dialogue-idx">#{i + 1}</span>
                        <button class="del-sm-btn" on:click={() => handleDeleteDialogue(node.id, i)} disabled={node.dialogues.length <= 1}>✕</button>
                      </div>
                      <div class="edit-row">
                        <label>说话人</label>
                        <input type="text" class="edit-input" value={dl.speaker}
                          on:input={(e) => updateDialogue(node.id, i, { speaker: e.currentTarget.value })} />
                      </div>
                      <div class="edit-row">
                        <label>内容</label>
                        <textarea class="edit-textarea" value={dl.text}
                          on:input={(e) => updateDialogue(node.id, i, { text: e.currentTarget.value })}></textarea>
                      </div>
                      <div class="edit-row inline">
                        <label>情绪</label>
                        <select class="edit-select sm" value={dl.mood || 'normal'}
                          on:change={(e) => updateDialogue(node.id, i, { mood: asMood(e.currentTarget.value) })}>
                          {#each MOOD_OPTIONS as m}
                            <option value={m}>{m}</option>
                          {/each}
                        </select>
                        <label class="check-label">
                          <input type="checkbox" checked={dl.autoAdvance || false}
                            on:change={(e) => updateDialogue(node.id, i, { autoAdvance: e.currentTarget.checked })} />
                          自动推进
                        </label>
                      </div>
                      {#if dl.sfx && dl.sfx.length > 0}
                        <div class="sfx-list">
                          <span class="sub-label">音效触发:</span>
                          {#each dl.sfx as sfxItem, si}
                            <div class="sfx-item">
                              <select class="edit-select xs" value={sfxItem.sfx}
                                on:change={(e) => updateSfxInDialogue(node.id, i, si, { sfx: asSFX(e.currentTarget.value) })}>
                                {#each SFX_OPTIONS as s}
                                  <option value={s}>{s}</option>
                                {/each}
                              </select>
                              <input type="number" class="edit-input xs" value={sfxItem.delay || 0} placeholder="延迟ms"
                                on:input={(e) => updateSfxInDialogue(node.id, i, si, { delay: parseInt(e.currentTarget.value) || 0 })} />
                              <input type="number" class="edit-input xs" value={sfxItem.volume ?? 0.8} placeholder="音量" min="0" max="1" step="0.1"
                                on:input={(e) => updateSfxInDialogue(node.id, i, si, { volume: parseFloat(e.currentTarget.value) || 0.8 })} />
                              <button class="del-sm-btn" on:click={() => handleDeleteSfx(node.id, i, si)}>✕</button>
                            </div>
                          {/each}
                        </div>
                      {/if}
                      <div class="sfx-actions">
                        <button class="xs-btn" on:click={() => handleAddSfx(node.id, i)}>+ 音效</button>
                        {#each sfxPresetTemplates as sfxTpl}
                          <button class="xs-btn tpl" on:click={() => handleApplySfxTemplate(node.id, i, sfxTpl.id)}>
                            🎵 {sfxTpl.name}
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>

                {#if node.choices && node.choices.length > 0}
                  <div class="edit-section">
                    <div class="section-header">
                      <h4>选项 ({node.choices.length})</h4>
                      <button class="sm-btn" on:click={() => handleAddChoice(node.id)}>+ 添加选项</button>
                    </div>
                    {#each node.choices as choice, ci}
                      <div class="choice-card">
                        <div class="choice-card-header">
                          <span>选项 #{ci + 1}</span>
                          <button class="del-sm-btn" on:click={() => handleDeleteChoice(node.id, ci)}>✕</button>
                        </div>
                        <div class="edit-row">
                          <label>文本</label>
                          <input type="text" class="edit-input" value={choice.text}
                            on:input={(e) => updateChoice(node.id, ci, { text: e.currentTarget.value })} />
                        </div>
                        <div class="edit-row">
                          <label>跳转节点</label>
                          <select class="edit-select" value={choice.nextNodeId}
                            on:change={(e) => updateChoice(node.id, ci, { nextNodeId: e.currentTarget.value })}>
                            <option value="">— 选择目标节点 —</option>
                            {#each allNodeIds as nid}
                              <option value={nid}>{nid}</option>
                            {/each}
                          </select>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}

                {#if node.danmakus && node.danmakus.length > 0}
                  <div class="edit-section">
                    <div class="section-header">
                      <h4>弹幕 ({node.danmakus.length})</h4>
                    </div>
                    {#each node.danmakus as dm, di}
                      <div class="danmaku-card">
                        <div class="danmaku-card-header">
                          <span>弹幕 #{di + 1}</span>
                          <button class="del-sm-btn" on:click={() => handleDeleteDanmaku(node.id, di)}>✕</button>
                        </div>
                        <div class="edit-row inline">
                          <input type="text" class="edit-input sm" value={dm.username} placeholder="用户名"
                            on:input={(e) => updateDanmakuInNode(node.id, di, { username: e.currentTarget.value })} />
                          <input type="text" class="edit-input" value={dm.content} placeholder="弹幕内容"
                            on:input={(e) => updateDanmakuInNode(node.id, di, { content: e.currentTarget.value })} />
                          <input type="color" class="color-input" value={dm.color || '#66ccff'}
                            on:input={(e) => updateDanmakuInNode(node.id, di, { color: e.currentTarget.value })} />
                        </div>
                        <div class="edit-row inline">
                          <label class="check-label">
                            <input type="checkbox" checked={dm.isImportant || false}
                              on:change={(e) => updateDanmakuInNode(node.id, di, { isImportant: e.currentTarget.checked })} />
                            重要
                          </label>
                          <label class="check-label">
                            <input type="checkbox" checked={dm.isBackendOnly || false}
                              on:change={(e) => updateDanmakuInNode(node.id, di, { isBackendOnly: e.currentTarget.checked })} />
                            后台
                          </label>
                        </div>
                      </div>
                    {/each}
                  </div>
                {/if}

                <div class="edit-section">
                  <div class="section-header"><h4>弹幕操作</h4></div>
                  <div class="danmaku-tpl-actions">
                    <button class="sm-btn" on:click={() => handleAddDanmaku(node.id, 0)}>+ 单条弹幕</button>
                    {#each danmakuPresetTemplates as dmTpl}
                      <button class="xs-btn tpl" on:click={() => handleApplyDanmakuTemplate(node.id, dmTpl.id)}>
                        💬 {dmTpl.name}
                      </button>
                    {/each}
                  </div>
                </div>

                <div class="edit-section">
                  <div class="section-header"><h4>节点属性</h4></div>
                  <div class="edit-row inline">
                    <label class="check-label">
                      <input type="checkbox" checked={node.isEnding || false}
                        on:change={(e) => updateNode(node.id, { isEnding: e.currentTarget.checked })} />
                      结局节点
                    </label>
                    <label class="check-label">
                      <input type="checkbox" checked={node.isRewindCheckpoint || false}
                        on:change={(e) => updateNode(node.id, { isRewindCheckpoint: e.currentTarget.checked })} />
                      回溯检查点
                    </label>
                  </div>
                  {#if node.isEnding}
                    <div class="edit-row">
                      <label>结局ID</label>
                      <select class="edit-select" value={node.endingId || ''}
                        on:change={(e) => updateNode(node.id, { endingId: e.currentTarget.value })}>
                        <option value="">— 选择结局 —</option>
                        {#each $currentEndings as e}
                          <option value={e.id}>{e.title}</option>
                        {/each}
                      </select>
                    </div>
                  {/if}
                  <div class="edit-row">
                    <label>下一节点(自动)</label>
                    <select class="edit-select" value={node.nextNodeId || ''}
                      on:change={(e) => updateNode(node.id, { nextNodeId: e.currentTarget.value || undefined })}>
                      <option value="">无</option>
                      {#each allNodeIds as nid}
                        {#if nid !== node.id}
                          <option value={nid}>{nid}</option>
                        {/if}
                      {/each}
                    </select>
                  </div>
                </div>
              {:else}
                <div class="no-selection">
                  <p>← 选择一个节点进行编辑</p>
                  {#if $currentNodes.length === 0}
                    <p class="sub">使用上方模板按钮添加第一个节点</p>
                  {/if}
                </div>
              {/if}
            </div>
          </div>

        {:else if $workshopState.activeTab === 'branches'}
          <div class="branch-panel">
            <div class="panel-section">
              <div class="section-header">
                <h4 class="section-title">结局定义</h4>
                <button class="sm-btn" on:click={handleAddEnding}>+ 添加结局</button>
              </div>
              <div class="ending-list">
                {#each $currentEndings as ending}
                  <div class="ending-card">
                    <div class="ending-card-header">
                      <input type="text" class="edit-input sm" value={ending.title}
                        on:input={(e) => updateEnding(ending.id, { title: e.currentTarget.value })} />
                      <label class="check-label">
                        <input type="checkbox" checked={ending.isGood}
                          on:change={(e) => updateEnding(ending.id, { isGood: e.currentTarget.checked })} />
                        好结局
                      </label>
                      <button class="del-sm-btn" on:click={() => handleDeleteEnding(ending.id)}>✕</button>
                    </div>
                    <textarea class="edit-textarea sm" value={ending.description} placeholder="结局描述"
                      on:input={(e) => updateEnding(ending.id, { description: e.currentTarget.value })}></textarea>
                  </div>
                {/each}
                {#if $currentEndings.length === 0}
                  <div class="empty-hint">尚未定义结局</div>
                {/if}
              </div>
            </div>
            <div class="panel-section">
              <h4 class="section-title">分支连接概览</h4>
              <div class="branch-map">
                {#each $currentNodes as node}
                  <div class="branch-map-node">
                    <span class="bmn-id">{node.id}</span>
                    {#if node.nextNodeId}
                      <span class="bmn-arrow">→ {node.nextNodeId}</span>
                    {/if}
                    {#if node.choices}
                      {#each node.choices as c, i}
                        <span class="bmn-branch">
                          {#if c.nextNodeId}选项{i + 1} → {c.nextNodeId}{:else}选项{i + 1} → ⚠ 未连接{/if}
                        </span>
                      {/each}
                    {/if}
                    {#if node.nextNodeBranches}
                      {#each node.nextNodeBranches as b, i}
                        <span class="bmn-branch">
                          分支{i + 1} → {b.nextNodeId || '⚠ 未连接'} (优先级: {b.priority || 0})
                        </span>
                      {/each}
                    {/if}
                    {#if node.isEnding}
                      <span class="bmn-tag ending">🏁 结局</span>
                    {/if}
                  </div>
                {/each}
                {#if $currentNodes.length === 0}
                  <div class="empty-hint">暂无节点</div>
                {/if}
              </div>
            </div>
          </div>

        {:else if $workshopState.activeTab === 'danmaku'}
          <div class="template-panel">
            <div class="panel-section">
              <h4 class="section-title">预设弹幕模板</h4>
              <div class="template-grid">
                {#each danmakuPresetTemplates as tpl}
                  <div class="template-card">
                    <h5 class="tpl-name">{tpl.name}</h5>
                    <p class="tpl-desc">{tpl.description}</p>
                    <div class="tpl-preview">
                      {#each tpl.danmakus as dm}
                        <div class="tpl-dm" style="color: {dm.color || '#66ccff'}">
                          <span class="dm-user">{dm.username}</span>: {dm.content}
                        </div>
                      {/each}
                    </div>
                    <p class="tpl-count">{tpl.danmakus.length} 条弹幕</p>
                  </div>
                {/each}
              </div>
            </div>
            <div class="panel-section">
              <h4 class="section-title">自定义弹幕模板</h4>
              <div class="tpl-add-form">
                <input type="text" class="edit-input" placeholder="模板名称" bind:value={newDanmakuTplName} />
                <input type="text" class="edit-input" placeholder="模板描述" bind:value={newDanmakuTplDesc} />
                <button class="sm-btn" on:click={handleAddCustomDanmakuTpl} disabled={!newDanmakuTplName.trim()}>+ 创建</button>
              </div>
              {#if $currentDanmakuTemplates.length > 0}
                <div class="template-grid">
                  {#each $currentDanmakuTemplates as tpl}
                    <div class="template-card custom">
                      <h5 class="tpl-name">{tpl.name}</h5>
                      <p class="tpl-desc">{tpl.description}</p>
                      <div class="tpl-preview">
                        {#each tpl.danmakus as dm}
                          <div class="tpl-dm" style="color: {dm.color || '#66ccff'}">
                            <span class="dm-user">{dm.username}</span>: {dm.content}
                          </div>
                        {/each}
                      </div>
                      <p class="tpl-count">{tpl.danmakus.length} 条弹幕</p>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-hint">暂无自定义弹幕模板</div>
              {/if}
            </div>
          </div>

        {:else if $workshopState.activeTab === 'sfx'}
          <div class="template-panel">
            <div class="panel-section">
              <h4 class="section-title">预设音效模板</h4>
              <div class="template-grid">
                {#each sfxPresetTemplates as tpl}
                  <div class="template-card">
                    <h5 class="tpl-name">{tpl.name}</h5>
                    <p class="tpl-desc">{tpl.description}</p>
                    <div class="tpl-sfx-list">
                      {#each tpl.triggers as t, i}
                        <div class="tpl-sfx-item">
                          <span class="sfx-idx">{i + 1}.</span>
                          <span class="sfx-name">{t.sfx}</span>
                          <span class="sfx-delay">延迟 {t.delay || 0}ms</span>
                          <span class="sfx-vol">音量 {t.volume ?? 0.8}</span>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
            <div class="panel-section">
              <h4 class="section-title">自定义音效模板</h4>
              <div class="tpl-add-form">
                <input type="text" class="edit-input" placeholder="模板名称" bind:value={newSfxTplName} />
                <input type="text" class="edit-input" placeholder="模板描述" bind:value={newSfxTplDesc} />
                <button class="sm-btn" on:click={handleAddCustomSfxTpl} disabled={!newSfxTplName.trim()}>+ 创建</button>
              </div>
              {#if $currentSfxTemplates.length > 0}
                <div class="template-grid">
                  {#each $currentSfxTemplates as tpl}
                    <div class="template-card custom">
                      <h5 class="tpl-name">{tpl.name}</h5>
                      <p class="tpl-desc">{tpl.description}</p>
                      <div class="tpl-sfx-list">
                        {#each tpl.triggers as t, i}
                          <div class="tpl-sfx-item">
                            <span class="sfx-idx">{i + 1}.</span>
                            <span class="sfx-name">{t.sfx}</span>
                            <span class="sfx-delay">延迟 {t.delay || 0}ms</span>
                            <span class="sfx-vol">音量 {t.volume ?? 0.8}</span>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="empty-hint">暂无自定义音效模板</div>
              {/if}
            </div>
          </div>

        {:else if $workshopState.activeTab === 'validate'}
          <div class="validate-panel">
            {#if $validationResult}
              {@const vr = $validationResult}
              <div class="validate-summary" class:valid={vr.isValid} class:invalid={!vr.isValid}>
                <div class="validate-icon">{vr.isValid ? '✅' : '❌'}</div>
                <div class="validate-status">{vr.isValid ? '校验通过' : '校验未通过'}</div>
              </div>
              <div class="validate-stats">
                <div class="stat-item"><span class="stat-val">{vr.stats.nodeCount}</span><span class="stat-label">节点</span></div>
                <div class="stat-item"><span class="stat-val">{vr.stats.dialogueCount}</span><span class="stat-label">对白</span></div>
                <div class="stat-item"><span class="stat-val">{vr.stats.danmakuCount}</span><span class="stat-label">弹幕</span></div>
                <div class="stat-item"><span class="stat-val">{vr.stats.choiceCount}</span><span class="stat-label">选项</span></div>
                <div class="stat-item"><span class="stat-val">{vr.stats.endingCount}</span><span class="stat-label">结局</span></div>
                <div class="stat-item warn"><span class="stat-val">{vr.stats.orphanNodes.length}</span><span class="stat-label">孤立节点</span></div>
                <div class="stat-item warn"><span class="stat-val">{vr.stats.unreachableNodes.length}</span><span class="stat-label">不可达节点</span></div>
              </div>
              {#if vr.issues.length > 0}
                <div class="issues-list">
                  <h4 class="section-title">问题列表</h4>
                  {#each vr.issues as issue}
                    <div class="issue-item" class:error={issue.severity === 'error'} class:warning={issue.severity === 'warning'} class:info={issue.severity === 'info'}>
                      <span class="issue-severity">
                        {issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <span class="issue-msg">{issue.message}</span>
                      {#if issue.nodeId}
                        <button class="xs-btn" on:click={() => { handleSelectNode(issue.nodeId || ''); setActiveTab('nodes'); }}>
                          定位 → {issue.nodeId}
                        </button>
                      {/if}
                    </div>
                  {/each}
                </div>
              {:else}
                <div class="no-issues">没有任何问题 🎉</div>
              {/if}
            {:else}
              <div class="no-validation">
                <p>尚未执行校验</p>
                <button class="action-btn" on:click={handleValidate}>开始校验</button>
              </div>
            {/if}
          </div>

        {:else if $workshopState.activeTab === 'trial'}
          <div class="trial-start-panel">
            <div class="trial-start-content">
              <div class="trial-start-icon">🎮</div>
              <h3 class="trial-start-title">试玩模式</h3>
              <p class="trial-start-desc">模拟体验你的创作内容，验证剧情流程是否通顺</p>
              {#if $currentNodes.length === 0}
                <p class="trial-warning">⚠ 需要至少一个节点才能试玩</p>
              {:else}
                <button class="action-btn primary" on:click={startTrialPlay}>开始试玩</button>
              {/if}
            </div>
          </div>

        {:else if $workshopState.activeTab === 'share'}
          <div class="share-panel">
            <div class="panel-section">
              <h4 class="section-title">分享作品</h4>
              <p class="share-desc">生成分享码或导出JSON，与其他玩家分享你的创作</p>
              <div class="share-actions">
                <button class="action-btn" on:click={handleGenerateShare}>生成分享码</button>
                <button class="action-btn" on:click={handleExportJSON}>导出JSON文件</button>
              </div>
              {#if $workshopState.shareCode}
                <div class="share-code-section">
                  <label>分享码 (复制发送给其他玩家):</label>
                  <div class="share-code-box">
                    <textarea class="share-code-text" readonly>{$workshopState.shareCode}</textarea>
                    <button class="sm-btn" on:click={handleCopyShareCode}>📋 复制</button>
                  </div>
                </div>
              {/if}
            </div>
            <div class="panel-section">
              <h4 class="section-title">导入作品</h4>
              <div class="import-form">
                <div class="import-row">
                  <input type="text" class="import-input" placeholder="粘贴分享码..." bind:value={importCodeInput} />
                  <button class="sm-btn" on:click={handleImportCode} disabled={!importCodeInput.trim()}>导入码</button>
                </div>
                <div class="import-row">
                  <textarea class="import-textarea" placeholder="粘贴JSON内容..." bind:value={importJsonInput}></textarea>
                  <button class="sm-btn" on:click={handleImportJSON} disabled={!importJsonInput.trim()}>导入JSON</button>
                </div>
              </div>
            </div>
            <div class="panel-section">
              <h4 class="section-title">作品信息</h4>
              <div class="info-grid">
                <div class="info-item"><span class="info-label">标题</span><span class="info-value">{$currentCreation.title}</span></div>
                <div class="info-item"><span class="info-label">作者</span><span class="info-value">{$currentCreation.author}</span></div>
                <div class="info-item"><span class="info-label">版本</span><span class="info-value">v{$currentCreation.version}</span></div>
                <div class="info-item"><span class="info-label">节点</span><span class="info-value">{$currentCreation.nodes.length}</span></div>
                <div class="info-item"><span class="info-label">结局</span><span class="info-value">{$currentCreation.endings.length}</span></div>
                <div class="info-item"><span class="info-label">更新时间</span><span class="info-value">{new Date($currentCreation.updatedAt).toLocaleString('zh-CN')}</span></div>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
{/if}

<style>
  .workshop-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.92);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }

  .workshop-container {
    width: 100%;
    max-width: 1400px;
    height: 92vh;
    max-height: 960px;
    background: linear-gradient(180deg, rgba(8, 16, 30, 0.99), rgba(4, 10, 22, 0.99));
    border: 1px solid rgba(60, 130, 200, 0.35);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.8), 0 0 60px rgba(60, 130, 200, 0.08);
  }

  .workshop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 28px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.25);
    background: linear-gradient(180deg, rgba(15, 30, 60, 0.6), transparent);
  }

  .workshop-title {
    font-size: 1.5rem;
    color: #6ab0e8;
    margin: 0;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-shadow: 0 0 20px rgba(60, 130, 200, 0.3);
  }

  .workshop-subtitle {
    font-size: 0.7rem;
    color: rgba(100, 160, 220, 0.5);
    letter-spacing: 0.15em;
    font-family: 'Courier New', monospace;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .creation-badge {
    padding: 4px 12px;
    background: rgba(60, 130, 200, 0.15);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    font-size: 0.8rem;
    color: #90c0e0;
  }

  .close-btn {
    width: 34px;
    height: 34px;
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

  .close-btn:hover { background: rgba(160, 50, 50, 0.8); }

  .tab-bar {
    display: flex;
    gap: 0;
    padding: 0 28px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.2);
    background: rgba(10, 20, 40, 0.4);
    overflow-x: auto;
  }

  .tab-btn {
    padding: 12px 18px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: #6090b0;
    font-size: 0.82rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .tab-btn:hover { color: #90c0e0; }

  .tab-btn.active {
    color: #6ab0e8;
    border-bottom-color: #6ab0e8;
    background: rgba(60, 130, 200, 0.08);
  }

  .tab-icon { margin-right: 6px; }

  .workshop-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 28px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.15);
    background: rgba(8, 16, 30, 0.5);
    gap: 12px;
    flex-wrap: wrap;
  }

  .toolbar-left, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .title-input {
    padding: 8px 14px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    font-size: 0.9rem;
    font-weight: 600;
    width: 200px;
    outline: none;
  }

  .title-input:focus { border-color: rgba(60, 130, 200, 0.6); }

  .author-input {
    padding: 8px 14px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    font-size: 0.8rem;
    width: 120px;
    outline: none;
  }

  .node-count { font-size: 0.78rem; color: #7090b0; }

  .workshop-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .workshop-body.has-content { display: flex; flex-direction: column; }

  .welcome-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 40px 28px;
    text-align: center;
  }

  .welcome-icon { font-size: 3rem; margin-bottom: 16px; }

  .welcome-title {
    font-size: 1.6rem;
    color: #6ab0e8;
    margin: 0 0 10px 0;
    font-weight: 700;
  }

  .welcome-desc {
    font-size: 0.9rem;
    color: #7090b0;
    margin: 0 0 24px 0;
    max-width: 480px;
    line-height: 1.6;
  }

  .action-btn {
    padding: 12px 24px;
    background: rgba(30, 60, 100, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.4);
    border-radius: 8px;
    color: #90c0e0;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover { background: rgba(40, 80, 130, 0.8); border-color: rgba(60, 130, 200, 0.6); }

  .action-btn.primary {
    background: linear-gradient(135deg, rgba(60, 130, 200, 0.4), rgba(40, 90, 160, 0.3));
    border-color: #6ab0e8;
    color: #b0d8f0;
    font-weight: 600;
  }

  .action-btn.primary:hover { background: linear-gradient(135deg, rgba(60, 130, 200, 0.6), rgba(40, 90, 160, 0.5)); }

  .sm-btn {
    padding: 6px 14px;
    background: rgba(30, 50, 80, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #90c0e0;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .sm-btn:hover { background: rgba(40, 70, 110, 0.8); }
  .sm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .sm-btn.danger { border-color: rgba(255, 80, 80, 0.3); color: #ff9090; }
  .sm-btn.danger:hover { background: rgba(120, 40, 40, 0.6); }

  .xs-btn {
    padding: 4px 10px;
    background: rgba(25, 45, 70, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 4px;
    color: #80a8c8;
    font-size: 0.72rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .xs-btn:hover { background: rgba(35, 60, 95, 0.7); }
  .xs-btn.tpl { border-color: rgba(100, 200, 160, 0.25); color: #80c8b0; }

  .del-sm-btn {
    width: 22px;
    height: 22px;
    background: rgba(80, 30, 30, 0.5);
    border: 1px solid rgba(255, 80, 80, 0.2);
    border-radius: 4px;
    color: #ff8080;
    font-size: 0.7rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .del-sm-btn:hover { background: rgba(140, 40, 40, 0.7); }
  .del-sm-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .saved-section { margin-top: 32px; width: 100%; max-width: 600px; text-align: left; }

  .saved-title {
    font-size: 1rem;
    color: #6ab0e8;
    margin: 0 0 12px 0;
    font-weight: 600;
  }

  .saved-list { display: flex; flex-direction: column; gap: 8px; }

  .saved-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 18px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 8px;
  }

  .saved-item-info { display: flex; flex-direction: column; gap: 2px; }
  .saved-item-title { font-size: 0.9rem; color: #c0d8f0; font-weight: 600; }
  .saved-item-meta { font-size: 0.75rem; color: #7090b0; }
  .saved-item-time { font-size: 0.7rem; color: #507090; }
  .saved-item-actions { display: flex; gap: 8px; }

  .import-section { margin-top: 28px; width: 100%; max-width: 600px; text-align: left; }
  .import-row { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }

  .import-input {
    flex: 1;
    padding: 8px 14px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    font-size: 0.82rem;
    outline: none;
  }

  .import-textarea {
    flex: 1;
    padding: 8px 14px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    font-size: 0.78rem;
    font-family: monospace;
    outline: none;
    resize: vertical;
    min-height: 60px;
  }

  .editor-split { display: flex; flex: 1; min-height: 0; }

  .node-list-panel {
    width: 260px;
    min-width: 220px;
    border-right: 1px solid rgba(60, 130, 200, 0.2);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.15);
    font-size: 0.85rem;
    color: #90c0e0;
    font-weight: 600;
    flex-wrap: wrap;
    gap: 6px;
  }

  .panel-actions { display: flex; gap: 4px; flex-wrap: wrap; }

  .tpl-add-btn {
    padding: 3px 8px;
    background: rgba(40, 80, 120, 0.4);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 4px;
    color: #80b8d8;
    font-size: 0.68rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .tpl-add-btn:hover { background: rgba(50, 100, 150, 0.6); }

  .node-list { flex: 1; overflow-y: auto; padding: 8px; }

  .node-item {
    padding: 10px 12px;
    background: rgba(15, 25, 50, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .node-item:hover { border-color: rgba(60, 130, 200, 0.35); }
  .node-item.active { border-color: rgba(60, 130, 200, 0.6); background: rgba(20, 40, 70, 0.8); }

  .node-item-header { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .node-item-id { font-family: 'Courier New', monospace; font-size: 0.78rem; color: #6ab0e8; }

  .node-tag { padding: 1px 6px; border-radius: 3px; font-size: 0.62rem; font-weight: 600; }
  .node-tag.ending { background: rgba(255, 80, 80, 0.15); color: #ff9090; border: 1px solid rgba(255, 80, 80, 0.3); }
  .node-tag.checkpoint { background: rgba(100, 200, 160, 0.15); color: #80c8b0; border: 1px solid rgba(100, 200, 160, 0.3); }
  .node-item-info { font-size: 0.7rem; color: #6080a0; }

  .node-del-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: rgba(80, 30, 30, 0.4);
    border: none;
    border-radius: 3px;
    color: #ff8080;
    font-size: 0.65rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.2s;
  }

  .node-item:hover .node-del-btn { opacity: 1; }
  .node-del-btn:hover { background: rgba(140, 40, 40, 0.6); }

  .empty-hint { text-align: center; color: #506880; font-size: 0.8rem; padding: 24px 12px; }

  .node-edit-panel { flex: 1; overflow-y: auto; padding: 20px 24px; }

  .no-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #506880;
    font-size: 0.9rem;
  }

  .no-selection .sub { font-size: 0.78rem; margin-top: 6px; }

  .edit-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.1);
  }

  .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .section-header h4 { font-size: 0.9rem; color: #6ab0e8; margin: 0; font-weight: 600; }

  .edit-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .edit-row.inline { flex-wrap: wrap; gap: 8px; }
  .edit-row label { font-size: 0.78rem; color: #7090b0; min-width: 70px; flex-shrink: 0; }

  .edit-input {
    flex: 1;
    padding: 7px 12px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.82rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .edit-input:focus { border-color: rgba(60, 130, 200, 0.5); }
  .edit-input.sm { max-width: 160px; }
  .edit-input.xs { max-width: 80px; padding: 4px 8px; font-size: 0.75rem; }
  .edit-input[readonly] { color: #5090c0; background: rgba(10, 18, 35, 0.6); }

  .edit-textarea {
    flex: 1;
    padding: 7px 12px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.82rem;
    outline: none;
    resize: vertical;
    min-height: 40px;
    font-family: inherit;
    line-height: 1.5;
  }

  .edit-textarea:focus { border-color: rgba(60, 130, 200, 0.5); }
  .edit-textarea.sm { min-height: 50px; }

  .edit-select {
    padding: 7px 12px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.82rem;
    outline: none;
    cursor: pointer;
  }

  .edit-select.sm { max-width: 120px; }
  .edit-select.xs { max-width: 100px; padding: 4px 8px; font-size: 0.75rem; }
  .edit-select option { background: #0a1428; }

  .check-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.78rem;
    color: #8098b0;
    cursor: pointer;
    min-width: auto;
  }

  .check-label input[type="checkbox"] { accent-color: #6ab0e8; }

  .color-input {
    width: 30px;
    height: 26px;
    padding: 0;
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    flex-shrink: 0;
  }

  .dialogue-card {
    padding: 12px 14px;
    background: rgba(12, 22, 42, 0.7);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .dialogue-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .dialogue-idx { font-family: 'Courier New', monospace; font-size: 0.72rem; color: #5090c0; }

  .sub-label { font-size: 0.72rem; color: #607890; margin-bottom: 4px; display: block; }

  .sfx-list {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(60, 130, 200, 0.1);
  }

  .sfx-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .sfx-actions {
    display: flex;
    gap: 4px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .choice-card {
    padding: 10px 14px;
    background: rgba(20, 40, 60, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
    margin-bottom: 6px;
  }

  .choice-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 0.78rem;
    color: #8098b0;
  }

  .danmaku-card {
    padding: 8px 12px;
    background: rgba(10, 20, 40, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.1);
    border-radius: 5px;
    margin-bottom: 6px;
  }

  .danmaku-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
    font-size: 0.72rem;
    color: #7090b0;
  }

  .danmaku-tpl-actions {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .branch-panel, .template-panel, .validate-panel, .share-panel {
    padding: 24px 28px;
  }

  .panel-section { margin-bottom: 24px; }

  .section-title {
    font-size: 1rem;
    color: #6ab0e8;
    margin: 0 0 14px 0;
    font-weight: 600;
  }

  .ending-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ending-card {
    padding: 14px;
    background: rgba(15, 25, 50, 0.7);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 8px;
  }

  .ending-card-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .branch-map {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .branch-map-node {
    padding: 10px 14px;
    background: rgba(12, 22, 42, 0.7);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .bmn-id {
    font-family: 'Courier New', monospace;
    font-size: 0.82rem;
    color: #6ab0e8;
    font-weight: 600;
  }

  .bmn-arrow {
    font-size: 0.78rem;
    color: #90c0e0;
  }

  .bmn-branch {
    font-size: 0.72rem;
    color: #7090b0;
    padding: 2px 8px;
    background: rgba(30, 50, 80, 0.4);
    border-radius: 4px;
  }

  .bmn-tag.ending {
    font-size: 0.72rem;
    padding: 2px 6px;
    background: rgba(255, 80, 80, 0.1);
    border-radius: 3px;
  }

  .template-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
  }

  .template-card {
    padding: 16px;
    background: rgba(15, 25, 50, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 8px;
    transition: border-color 0.2s;
  }

  .template-card:hover { border-color: rgba(60, 130, 200, 0.4); }
  .template-card.custom { border-color: rgba(100, 200, 160, 0.25); }

  .tpl-name {
    font-size: 0.92rem;
    color: #c0d8f0;
    margin: 0 0 4px 0;
    font-weight: 600;
  }

  .tpl-desc {
    font-size: 0.75rem;
    color: #7090b0;
    margin: 0 0 10px 0;
  }

  .tpl-preview {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-bottom: 8px;
  }

  .tpl-dm { font-size: 0.72rem; }
  .dm-user { font-weight: 600; }
  .tpl-count { font-size: 0.68rem; color: #507090; margin: 0; }

  .tpl-sfx-list { display: flex; flex-direction: column; gap: 4px; }

  .tpl-sfx-item {
    display: flex;
    gap: 8px;
    font-size: 0.72rem;
    color: #90a8c0;
  }

  .sfx-idx { color: #507090; }
  .sfx-name { color: #6ab0e8; font-weight: 600; }
  .sfx-delay, .sfx-vol { color: #6080a0; }

  .tpl-add-form {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
    align-items: center;
  }

  .validate-summary {
    text-align: center;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 8px;
  }

  .validate-summary.valid { background: rgba(40, 120, 80, 0.15); border: 1px solid rgba(80, 200, 120, 0.3); }
  .validate-summary.invalid { background: rgba(120, 40, 40, 0.15); border: 1px solid rgba(255, 80, 80, 0.3); }
  .validate-icon { font-size: 2rem; margin-bottom: 8px; }
  .validate-status { font-size: 1.1rem; color: #c0d8f0; font-weight: 600; }

  .validate-stats {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 16px;
    background: rgba(15, 25, 50, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
  }

  .stat-item.warn { border-color: rgba(255, 180, 60, 0.25); }
  .stat-val { font-size: 1.2rem; color: #c0d8f0; font-weight: 700; }
  .stat-label { font-size: 0.7rem; color: #7090b0; }

  .issues-list { max-height: 400px; overflow-y: auto; }

  .issue-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-radius: 6px;
    margin-bottom: 6px;
    font-size: 0.82rem;
  }

  .issue-item.error { background: rgba(80, 20, 20, 0.2); border: 1px solid rgba(255, 80, 80, 0.2); }
  .issue-item.warning { background: rgba(80, 60, 10, 0.2); border: 1px solid rgba(255, 180, 60, 0.2); }
  .issue-item.info { background: rgba(20, 40, 80, 0.2); border: 1px solid rgba(60, 130, 200, 0.2); }

  .issue-msg { flex: 1; color: #c0d8f0; }
  .issue-severity { flex-shrink: 0; }

  .no-issues {
    text-align: center;
    padding: 30px;
    color: #80c8b0;
    font-size: 0.9rem;
  }

  .no-validation {
    text-align: center;
    padding: 40px;
    color: #506880;
  }

  .trial-mode { display: flex; flex-direction: column; }

  .trial-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 28px;
    border-bottom: 1px solid rgba(60, 130, 200, 0.2);
    background: rgba(8, 16, 30, 0.5);
  }

  .back-btn {
    padding: 8px 16px;
    background: rgba(30, 50, 80, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #90c0e0;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .back-btn:hover { background: rgba(40, 70, 110, 0.8); }

  .trial-badge {
    padding: 4px 12px;
    background: rgba(100, 200, 160, 0.15);
    border: 1px solid rgba(100, 200, 160, 0.3);
    border-radius: 6px;
    color: #80c8b0;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .trial-stage {
    flex: 1;
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .trial-node-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .trial-node-id {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #5090c0;
  }

  .trial-node-title { font-size: 0.9rem; color: #c0d8f0; }

  .trial-dialogue-box {
    max-width: 600px;
    width: 100%;
    padding: 20px 24px;
    background: rgba(12, 22, 42, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .trial-dialogue-box.empty { text-align: center; }
  .trial-speaker { font-size: 0.82rem; color: #6ab0e8; font-weight: 600; margin-bottom: 6px; }
  .trial-text { font-size: 1rem; color: #c0d8f0; line-height: 1.7; }

  .trial-mood-tag {
    margin-top: 8px;
    font-size: 0.72rem;
    color: #6080a0;
    padding: 2px 8px;
    background: rgba(30, 50, 80, 0.4);
    border-radius: 4px;
    display: inline-block;
  }

  .trial-nav {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .trial-progress { font-size: 0.78rem; color: #7090b0; font-family: 'Courier New', monospace; }

  .trial-choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 500px;
    width: 100%;
  }

  .trial-choices-label { font-size: 0.82rem; color: #9098b0; margin-bottom: 4px; }

  .trial-choice-btn {
    padding: 12px 20px;
    background: rgba(30, 60, 100, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.35);
    border-radius: 8px;
    color: #c0d8f0;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }

  .trial-choice-btn:hover {
    background: rgba(40, 80, 130, 0.7);
    border-color: rgba(60, 130, 200, 0.6);
  }

  .trial-ending { text-align: center; }
  .trial-ending-icon { font-size: 2.5rem; margin-bottom: 10px; }
  .trial-ending-title { font-size: 1.3rem; color: #c0d8f0; font-weight: 700; margin-bottom: 6px; }
  .trial-ending-desc { font-size: 0.85rem; color: #7090b0; margin-bottom: 16px; }

  .trial-danmaku-preview {
    max-width: 600px;
    width: 100%;
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(8, 16, 30, 0.4);
    border-radius: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
  }

  .trial-dm { font-size: 0.72rem; }

  .trial-empty { text-align: center; color: #7090b0; }

  .trial-node-list {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 28px;
    border-top: 1px solid rgba(60, 130, 200, 0.15);
    overflow-x: auto;
    flex-wrap: wrap;
  }

  .node-list-label { font-size: 0.72rem; color: #507090; flex-shrink: 0; }

  .node-jump-btn {
    padding: 3px 8px;
    background: rgba(30, 50, 80, 0.4);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 4px;
    color: #80a8c8;
    font-size: 0.68rem;
    font-family: 'Courier New', monospace;
    cursor: pointer;
    transition: all 0.2s;
  }

  .node-jump-btn:hover { background: rgba(40, 70, 110, 0.6); }
  .node-jump-btn.active { border-color: #6ab0e8; color: #6ab0e8; background: rgba(60, 130, 200, 0.15); }

  .trial-start-panel {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  .trial-start-content { text-align: center; }
  .trial-start-icon { font-size: 3rem; margin-bottom: 14px; }
  .trial-start-title { font-size: 1.4rem; color: #6ab0e8; margin: 0 0 8px 0; font-weight: 700; }
  .trial-start-desc { font-size: 0.85rem; color: #7090b0; margin: 0 0 20px 0; max-width: 400px; }
  .trial-warning { color: #ffcc44; font-size: 0.85rem; }

  .share-desc { font-size: 0.85rem; color: #7090b0; margin: 0 0 14px 0; }

  .share-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 18px;
  }

  .share-code-section { margin-top: 16px; }
  .share-code-section label { font-size: 0.78rem; color: #7090b0; display: block; margin-bottom: 6px; }

  .share-code-box { display: flex; gap: 8px; align-items: flex-start; }

  .share-code-text {
    flex: 1;
    padding: 8px 12px;
    background: rgba(10, 18, 35, 0.8);
    border: 1px solid rgba(60, 130, 200, 0.25);
    border-radius: 6px;
    color: #c0d8f0;
    font-size: 0.7rem;
    font-family: monospace;
    resize: vertical;
    min-height: 50px;
    max-height: 120px;
  }

  .import-form { display: flex; flex-direction: column; gap: 8px; }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 10px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 14px;
    background: rgba(15, 25, 50, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 6px;
  }

  .info-label { font-size: 0.75rem; color: #7090b0; }
  .info-value { font-size: 0.82rem; color: #c0d8f0; font-weight: 500; }

  @media (max-width: 900px) {
    .workshop-overlay { padding: 10px; }
    .workshop-container { height: 96vh; }
    .tab-bar { overflow-x: auto; padding: 0 16px; }
    .tab-btn { padding: 10px 14px; font-size: 0.78rem; }
    .editor-split { flex-direction: column; }
    .node-list-panel { width: 100%; min-width: auto; max-height: 200px; border-right: none; border-bottom: 1px solid rgba(60, 130, 200, 0.2); }
    .template-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 600px) {
    .workshop-header { padding: 12px 16px; }
    .workshop-title { font-size: 1.1rem; }
    .tab-icon { display: none; }
    .workshop-toolbar { flex-direction: column; align-items: flex-start; }
    .title-input, .author-input { width: 100%; }
    .validate-stats { gap: 8px; }
    .stat-item { padding: 8px 10px; }
  }
</style>
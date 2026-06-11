<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import {
    editorState,
    allNodes,
    selectedNode,
    selectNode,
    setActiveTab,
    setPreviewNode
  } from '../../lib/editorStore';
  import { playSFX, playBGM, stopBGM } from '../../lib/audio';
  import type { StoryNode, DialogueLine, Choice, Danmaku, Ending } from '../../types/game';

  export let onClose: () => void;

  $: nodes = $allNodes;
  $: startNodeId = $editorState.previewNodeId || $editorState.selectedNodeId || 'start';
  $: startNode = nodes.find(n => n.id === startNodeId);

  let currentNodeId: string = '';
  let dialogueIndex: number = 0;
  let displayedText: string = '';
  let isTyping: boolean = false;
  let typingInterval: any = null;
  let activeDanmakus: any[] = [];
  let danmakuTimeouts: any[] = [];
  let availableChoices: Choice[] = [];
  let showChoices: boolean = false;
  let currentEnding: Ending | null = null;
  let visitedPath: string[] = [];
  let autoAdvanceTimer: any = null;

  let currentNode: StoryNode | undefined;
  let currentDialogue: DialogueLine | undefined;
  let dialogueCount: number = 0;
  let atDialogueEnd: boolean = false;
  let hasChoices: boolean = false;
  let allEndings: Ending[] = [];

  $: currentNode = nodes.find(n => n.id === currentNodeId);
  $: currentDialogue = currentNode?.dialogues?.[dialogueIndex];
  $: dialogueCount = currentNode?.dialogues?.length || 0;
  $: atDialogueEnd = dialogueIndex >= dialogueCount - 1;
  $: hasChoices = !!(currentNode?.choices && currentNode.choices.length > 0);
  $: allEndings = $editorState.editedEndings ? Array.from($editorState.editedEndings.values()) : [];

  function getNode(id: string): StoryNode | undefined {
    return nodes.find(n => n.id === id);
  }

  function startPreview() {
    resetPreview();
    if (startNode) {
      loadNode(startNode.id);
    } else {
      alert('请先选择一个节点');
    }
  }

  function resetPreview() {
    stopAllTimers();
    stopBGM();
    currentNodeId = '';
    dialogueIndex = 0;
    displayedText = '';
    isTyping = false;
    activeDanmakus = [];
    availableChoices = [];
    showChoices = false;
    currentEnding = null;
    visitedPath = [];
  }

  function stopAllTimers() {
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
    danmakuTimeouts.forEach(t => clearTimeout(t));
    danmakuTimeouts = [];
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function loadNode(nodeId: string) {
    const node = getNode(nodeId);
    if (!node) {
      alert(`找不到节点: ${nodeId}`);
      return;
    }

    stopAllTimers();
    activeDanmakus = [];

    currentNodeId = nodeId;
    dialogueIndex = 0;
    visitedPath = [...visitedPath, nodeId];

    if (node.bgm) {
      playBGM(node.bgm);
    }

    if (node.isEnding && node.endingId) {
      const ending = allEndings.find(e => e.id === node.endingId);
      if (ending) {
        currentEnding = ending;
        return;
      }
    }

    showDialogue(0);
  }

  function showDialogue(idx: number) {
    if (!currentNode || !currentNode.dialogues?.[idx]) return;

    stopAllTimers();
    const dialogue = currentNode.dialogues[idx];

    if (dialogue.bgm) {
      playBGM(dialogue.bgm);
    }

    if (dialogue.sfx) {
      dialogue.sfx.forEach(sfx => {
        const delay = sfx.delay || 0;
        const t = setTimeout(() => {
          playSFX(sfx.sfx, sfx.volume);
        }, delay);
        danmakuTimeouts.push(t);
      });
    }

    triggerDanmakus(idx);
    typeText(dialogue.text);

    if (dialogue.autoAdvance) {
      const delay = (dialogue.autoAdvanceDelay || 2000) + dialogue.text.length * 40;
      autoAdvanceTimer = setTimeout(() => {
        advanceDialogueInternal();
      }, delay);
    }
  }

  function typeText(text: string) {
    displayedText = '';
    isTyping = true;
    let i = 0;

    if (typingInterval) clearInterval(typingInterval);

    typingInterval = setInterval(() => {
      if (i < text.length) {
        displayedText += text[i];
        i++;
      } else {
        clearInterval(typingInterval);
        typingInterval = null;
        isTyping = false;
      }
    }, 30);
  }

  function skipTyping() {
    if (!currentDialogue) return;
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
    displayedText = currentDialogue.text;
    isTyping = false;
  }

  function triggerDanmakus(dlgIdx: number) {
    if (!currentNode?.danmakus) return;

    const danmakusForDialogue = currentNode.danmakus.filter(
      d => (d.dialogueIndex ?? 0) === dlgIdx
    );

    danmakusForDialogue.forEach(danmaku => {
      const delay = danmaku.relativeMs ?? danmaku.timestamp ?? 0;
      const t = setTimeout(() => {
        spawnDanmaku(danmaku);
      }, delay);
      danmakuTimeouts.push(t);
    });
  }

  function spawnDanmaku(danmaku: Danmaku) {
    const id = `dm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const lane = Math.floor(Math.random() * 5);
    const duration = 8000 + Math.random() * 4000;

    activeDanmakus = [...activeDanmakus, {
      ...danmaku,
      id,
      lane,
      duration
    }];

    const t = setTimeout(() => {
      activeDanmakus = activeDanmakus.filter(d => d.id !== id);
    }, duration);
    danmakuTimeouts.push(t);
  }

  function advanceDialogueInternal() {
    if (isTyping) {
      skipTyping();
      return;
    }

    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }

    if (!atDialogueEnd) {
      dialogueIndex++;
      showDialogue(dialogueIndex);
    } else {
      if (hasChoices) {
        availableChoices = currentNode!.choices!.filter(c => true);
        showChoices = true;
      } else if (currentNode?.nextNodeId) {
        loadNode(currentNode.nextNodeId);
      } else if (currentNode?.isEnding) {
        const endingId = currentNode.endingId;
        if (endingId) {
          const ending = allEndings.find(e => e.id === endingId);
          if (ending) {
            currentEnding = ending;
          }
        } else if (currentNode.endingTitle) {
          currentEnding = {
            id: 'inline',
            title: currentNode.endingTitle,
            description: currentNode.endingDescription || '',
            isGood: false
          };
        }
      } else {
        alert('此节点已结束（没有后续节点或选项）');
      }
    }
  }

  function handleAdvance() {
    playSFX('click');
    advanceDialogueInternal();
  }

  function handleSelectChoice(choice: Choice) {
    playSFX('select');
    showChoices = false;
    if (choice.effect) {
      // 变量效果记录但仅做提示
      console.log('变量效果:', choice.effect);
    }
    if (choice.nextNodeId) {
      loadNode(choice.nextNodeId);
    } else {
      alert('此选项没有设置跳转节点');
    }
  }

  function handleRestart() {
    playSFX('click');
    startPreview();
  }

  function handleJumpToNode() {
    const ids = nodes.map(n => n.id);
    const id = prompt(`输入要跳转的节点ID:\n可选: ${ids.slice(0, 10).join(', ')}${ids.length > 10 ? '...' : ''}`, currentNodeId);
    if (id && getNode(id)) {
      playSFX('click');
      loadNode(id);
    } else if (id) {
      alert('找不到该节点');
    }
  }

  function handleBackToEditor() {
    stopAllTimers();
    stopBGM();
    setPreviewNode(null);
  }

  function handleEditThisNode() {
    if (currentNodeId) {
      playSFX('click');
      selectNode(currentNodeId);
      setActiveTab('nodes');
      setPreviewNode(null);
    }
  }

  onMount(() => {
    startPreview();
  });

  onDestroy(() => {
    stopAllTimers();
    stopBGM();
  });
</script>

<div class="preview-container">
  <header class="preview-header">
    <div class="header-left">
      <button class="back-btn" on:click={handleBackToEditor}>
        <span>←</span> 返回编辑器
      </button>
      <div class="title-area">
        <span class="title-icon">▶</span>
        <h2>剧情预览模式</h2>
      </div>
      <div class="node-info">
        <span class="node-label">当前节点:</span>
        <span class="node-id">{currentNodeId || '(未加载)'}</span>
        {#if currentNode?.title}
          <span class="node-title">{currentNode.title}</span>
        {/if}
      </div>
    </div>
    <div class="header-controls">
      <button class="ctrl-btn" on:click={handleJumpToNode} title="跳转到指定节点">
        🔀 跳转节点
      </button>
      <button class="ctrl-btn" on:click={handleEditThisNode} title="编辑当前节点">
        ✏️ 编辑此节点
      </button>
      <button class="ctrl-btn primary" on:click={handleRestart} title="重新预览">
        ↺ 从头开始
      </button>
    </div>
  </header>

  <div class="preview-scene" on:click={!showChoices && !currentEnding ? handleAdvance : undefined}>
    <div class="scene-bg {currentNode?.background || 'default-bg'}">
      <div class="bg-overlay"></div>

      <div class="danmaku-layer">
        {#each activeDanmakus as dm}
          <div
            class="danmaku-item"
            style="
              top: {dm.lane * 18 + 5}%;
              color: {dm.color || '#ffffff'};
              animation-duration: {dm.duration}ms;
              font-weight: {dm.isImportant ? '700' : '400'};
              border-color: {dm.isBackendOnly ? '#00ffcc' : 'transparent'};
              background: {dm.isImportant ? 'rgba(255,204,0,0.15)' : dm.isBackendOnly ? 'rgba(0,255,204,0.1)' : 'transparent'};
            "
            class:important={dm.isImportant}
            class:backend={dm.isBackendOnly}
          >
            <span class="dm-username">{dm.username}:</span>
            <span class="dm-content">{dm.content}</span>
          </div>
        {/each}
      </div>

      {#if currentEnding}
        <div class="ending-overlay">
          <div class="ending-card {currentEnding.isGood ? 'good' : 'bad'}">
            <div class="ending-icon">{currentEnding.isGood ? '🌟' : '💀'}</div>
            <div class="ending-type">{currentEnding.isGood ? '— 好结局 —' : '— 坏结局 —'}</div>
            <h3 class="ending-title">{currentEnding.title}</h3>
            <p class="ending-desc">{currentEnding.description}</p>
            <div class="ending-actions">
              <button class="ending-btn" on:click|stopPropagation={handleRestart}>
                ↺ 重新预览
              </button>
              <button class="ending-btn primary" on:click|stopPropagation={handleBackToEditor}>
                返回编辑
              </button>
            </div>
          </div>
        </div>
      {:else}
        <div class="dialogue-area">
          {#if currentDialogue?.speaker}
            <div class="speaker-box">
              <span class="speaker-name">{currentDialogue.speaker}</span>
              {#if currentDialogue.mood}
                <span class="mood-tag">【{currentDialogue.mood}】</span>
              {/if}
            </div>
          {/if}
          <div class="dialogue-box">
            <p class="dialogue-text">{displayedText}{#if isTyping}<span class="cursor">|</span>{/if}</p>
            <div class="progress-info">
              <span>{dialogueIndex + 1} / {dialogueCount}</span>
              {#if !showChoices && !isTyping}
                <span class="click-hint">▼ 点击继续</span>
              {/if}
            </div>
          </div>
        </div>

        {#if showChoices}
          <div class="choices-panel" on:click|stopPropagation>
            <div class="choices-title">请做出选择：</div>
            <div class="choices-list">
              {#each availableChoices as choice, idx}
                <button
                  class="choice-btn"
                  on:click={() => handleSelectChoice(choice)}
                  style="--idx: {idx};"
                >
                  <span class="choice-num">{idx + 1}</span>
                  <span class="choice-text">{choice.text}</span>
                  {#if choice.nextNodeId}
                    <span class="choice-target">→ {choice.nextNodeId}</span>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      {/if}

      <div class="path-trail">
        <span class="trail-label">路径:</span>
        {#each visitedPath as nid, idx}
          <span class="trail-node">{nid}</span>
          {#if idx < visitedPath.length - 1}
            <span class="trail-arrow">→</span>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <footer class="preview-footer">
    <div class="footer-hint">
      💡 提示：点击画面或对白框可推进剧情 · 可随时用顶部按钮跳转或编辑节点
    </div>
    <div class="footer-info">
      <span>节点数: {nodes.length}</span>
      <span>·</span>
      <span>当前深度: {visitedPath.length}</span>
    </div>
  </footer>
</div>

<style>
  .preview-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #0a0f1a;
    color: #c0d8f0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  }

  .preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: linear-gradient(180deg, #0d1525 0%, #0a0f1a 100%);
    border-bottom: 1px solid rgba(0, 255, 200, 0.2);
    gap: 16px;
    flex-wrap: wrap;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: rgba(0, 255, 200, 0.1);
    border-color: rgba(0, 255, 200, 0.3);
    color: #00ffc8;
  }

  .title-area {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .title-icon {
    color: #00ffc8;
    animation: pulse 1.5s infinite;
  }

  .title-area h2 {
    margin: 0;
    font-size: 1rem;
    color: #00ffc8;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-shadow: 0 0 10px rgba(0, 255, 200, 0.3);
  }

  .node-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
  }

  .node-label {
    color: #5a8aaa;
  }

  .node-id {
    padding: 2px 8px;
    background: rgba(0, 255, 200, 0.1);
    border: 1px solid rgba(0, 255, 200, 0.25);
    border-radius: 4px;
    color: #00ffc8;
    font-family: 'Courier New', monospace;
  }

  .node-title {
    color: #a0c0e0;
  }

  .header-controls {
    display: flex;
    gap: 8px;
  }

  .ctrl-btn {
    padding: 7px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    color: #a0c0e0;
    cursor: pointer;
    font-size: 0.82rem;
    transition: all 0.2s;
  }

  .ctrl-btn:hover {
    background: rgba(192, 144, 255, 0.12);
    border-color: rgba(192, 144, 255, 0.35);
    color: #c090ff;
  }

  .ctrl-btn.primary {
    background: rgba(0, 255, 200, 0.12);
    border-color: rgba(0, 255, 200, 0.4);
    color: #00ffc8;
  }

  .ctrl-btn.primary:hover {
    background: rgba(0, 255, 200, 0.25);
  }

  .preview-scene {
    flex: 1;
    overflow: hidden;
    cursor: pointer;
  }

  .scene-bg {
    width: 100%;
    height: 100%;
    position: relative;
    background:
      radial-gradient(ellipse at 30% 20%, rgba(20, 60, 100, 0.4) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(0, 80, 80, 0.3) 0%, transparent 50%),
      linear-gradient(180deg, #0a1628 0%, #050d18 100%);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }

  .scene-bg.default-bg {
    background:
      radial-gradient(ellipse at 50% 30%, rgba(0, 100, 150, 0.25) 0%, transparent 60%),
      linear-gradient(180deg, #081420 0%, #040a12 100%);
  }

  .scene-bg.cockpit {
    background:
      radial-gradient(ellipse at 50% 100%, rgba(255, 150, 50, 0.15) 0%, transparent 40%),
      linear-gradient(180deg, #0c1a2e 0%, #060d1a 100%);
  }

  .scene-bg.descent {
    background:
      radial-gradient(ellipse at 50% 50%, rgba(30, 80, 180, 0.3) 0%, transparent 60%),
      linear-gradient(180deg, #050e1e 0%, #020610 100%);
  }

  .scene-bg.intro {
    background:
      radial-gradient(ellipse at 50% 40%, rgba(80, 80, 80, 0.2) 0%, transparent 60%),
      linear-gradient(180deg, #0a0a0e 0%, #050508 100%);
  }

  .bg-overlay {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        0deg,
        transparent 0px,
        transparent 2px,
        rgba(0, 0, 0, 0.08) 2px,
        rgba(0, 0, 0, 0.08) 4px
      );
    pointer-events: none;
  }

  .danmaku-layer {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 45%;
    overflow: hidden;
    pointer-events: none;
  }

  .danmaku-item {
    position: absolute;
    white-space: nowrap;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid;
    font-size: 0.95rem;
    animation: danmakuSlide linear forwards;
    right: -100%;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }

  @keyframes danmakuSlide {
    from { right: -30%; }
    to { right: 110%; }
  }

  .dm-username {
    font-weight: 600;
    margin-right: 6px;
    opacity: 0.85;
  }

  .dialogue-area {
    position: relative;
    z-index: 10;
    padding: 20px;
  }

  .speaker-box {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    background: linear-gradient(135deg, rgba(0, 180, 200, 0.25), rgba(0, 120, 160, 0.15));
    border: 1px solid rgba(0, 200, 220, 0.5);
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    margin-left: 12px;
    position: relative;
    top: 1px;
  }

  .speaker-name {
    color: #60e0ff;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.05em;
  }

  .mood-tag {
    font-size: 0.75rem;
    color: #ffc060;
    opacity: 0.9;
  }

  .dialogue-box {
    background: linear-gradient(180deg, rgba(10, 25, 45, 0.92) 0%, rgba(5, 15, 30, 0.95) 100%);
    border: 1px solid rgba(0, 200, 220, 0.35);
    border-radius: 12px;
    padding: 24px 28px 14px;
    backdrop-filter: blur(8px);
    box-shadow: 0 -4px 30px rgba(0, 100, 150, 0.2);
  }

  .dialogue-text {
    margin: 0 0 12px;
    font-size: 1.1rem;
    color: #e0e8f0;
    line-height: 1.9;
    min-height: 4.2em;
    white-space: pre-wrap;
  }

  .cursor {
    display: inline-block;
    color: #00ffc8;
    animation: blink 0.8s step-end infinite;
    font-weight: 300;
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.78rem;
    color: #5a8aaa;
    padding-top: 8px;
    border-top: 1px dashed rgba(0, 200, 220, 0.15);
  }

  .click-hint {
    color: #00ffc8;
    animation: slideDown 1s ease-in-out infinite;
  }

  @keyframes slideDown {
    0%, 100% { transform: translateY(0); opacity: 0.7; }
    50% { transform: translateY(3px); opacity: 1; }
  }

  .choices-panel {
    position: absolute;
    left: 50%;
    top: 45%;
    transform: translate(-50%, -50%);
    z-index: 20;
    width: min(90%, 520px);
    padding: 20px;
    background: linear-gradient(180deg, rgba(20, 30, 55, 0.96), rgba(10, 20, 40, 0.98));
    border: 1px solid rgba(192, 144, 255, 0.4);
    border-radius: 12px;
    box-shadow: 0 8px 40px rgba(100, 50, 200, 0.3);
  }

  .choices-title {
    text-align: center;
    color: #c090ff;
    font-size: 0.9rem;
    margin-bottom: 16px;
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  .choices-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .choice-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    background: rgba(192, 144, 255, 0.06);
    border: 1px solid rgba(192, 144, 255, 0.25);
    border-radius: 8px;
    color: #d0c0f0;
    cursor: pointer;
    font-size: 0.95rem;
    text-align: left;
    transition: all 0.2s;
    animation: choiceIn 0.3s ease-out backwards;
    animation-delay: calc(var(--idx) * 0.08s);
  }

  @keyframes choiceIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .choice-btn:hover {
    background: rgba(192, 144, 255, 0.18);
    border-color: rgba(192, 144, 255, 0.6);
    transform: translateX(4px);
  }

  .choice-num {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(192, 144, 255, 0.2);
    border: 1px solid rgba(192, 144, 255, 0.4);
    border-radius: 50%;
    font-family: 'Courier New', monospace;
    font-weight: 700;
    font-size: 0.85rem;
    color: #c090ff;
    flex-shrink: 0;
  }

  .choice-text {
    flex: 1;
    line-height: 1.5;
  }

  .choice-target {
    font-size: 0.75rem;
    color: #706090;
    font-family: 'Courier New', monospace;
  }

  .ending-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(6px);
    animation: fadeIn 0.8s ease-out;
  }

  .ending-card {
    width: min(90%, 560px);
    padding: 36px 32px;
    border-radius: 16px;
    text-align: center;
    border: 1px solid;
    animation: endingPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes endingPop {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .ending-card.good {
    background: linear-gradient(180deg, rgba(20, 60, 40, 0.95), rgba(10, 35, 25, 0.98));
    border-color: rgba(100, 255, 150, 0.45);
    box-shadow: 0 10px 50px rgba(0, 150, 80, 0.35);
  }

  .ending-card.bad {
    background: linear-gradient(180deg, rgba(60, 20, 25, 0.95), rgba(35, 10, 15, 0.98));
    border-color: rgba(255, 100, 100, 0.45);
    box-shadow: 0 10px 50px rgba(150, 30, 50, 0.35);
  }

  .ending-icon {
    font-size: 3.5rem;
    margin-bottom: 12px;
    animation: float 2s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .ending-type {
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    margin-bottom: 12px;
    opacity: 0.8;
  }

  .ending-card.good .ending-type { color: #64ff96; }
  .ending-card.bad .ending-type { color: #ff8080; }

  .ending-title {
    margin: 0 0 18px;
    font-size: 1.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
  }

  .ending-card.good .ending-title { color: #64ff96; text-shadow: 0 0 20px rgba(100,255,150,0.4); }
  .ending-card.bad .ending-title { color: #ff8080; text-shadow: 0 0 20px rgba(255,100,100,0.4); }

  .ending-desc {
    margin: 0 0 28px;
    color: #c0d0e0;
    line-height: 1.9;
    font-size: 0.95rem;
  }

  .ending-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
  }

  .ending-btn {
    padding: 12px 24px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    color: #c0d0e0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .ending-btn:hover {
    background: rgba(255, 255, 255, 0.12);
  }

  .ending-btn.primary {
    background: rgba(0, 255, 200, 0.15);
    border-color: rgba(0, 255, 200, 0.5);
    color: #00ffc8;
  }

  .ending-btn.primary:hover {
    background: rgba(0, 255, 200, 0.28);
  }

  .path-trail {
    position: absolute;
    top: 12px;
    left: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    font-size: 0.75rem;
    z-index: 5;
    backdrop-filter: blur(4px);
    max-width: calc(100% - 32px);
    overflow-x: auto;
  }

  .trail-label {
    color: #5a8aaa;
    margin-right: 4px;
  }

  .trail-node {
    padding: 2px 8px;
    background: rgba(0, 255, 200, 0.08);
    border: 1px solid rgba(0, 255, 200, 0.2);
    border-radius: 3px;
    color: #80e0d0;
    font-family: 'Courier New', monospace;
  }

  .trail-arrow {
    color: #4a6a8a;
    opacity: 0.6;
  }

  .preview-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: #0d1525;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    flex-wrap: wrap;
    gap: 10px;
  }

  .footer-hint {
    font-size: 0.8rem;
    color: #6a8aaa;
  }

  .footer-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.78rem;
    color: #5a8aaa;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>

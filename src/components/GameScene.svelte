<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import BackgroundLayer from './BackgroundLayer.svelte';
  import DanmakuLayer from './DanmakuLayer.svelte';
  import DialogueBox from './DialogueBox.svelte';
  import ChoicePanel from './ChoicePanel.svelte';
  import GameMenu from './GameMenu.svelte';
  import EndingScreen from './EndingScreen.svelte';
  import EvidenceBoard from './EvidenceBoard.svelte';
  import TrustPanel from './TrustPanel.svelte';
  import TrustNotifications from './TrustNotifications.svelte';
  import AnonymousMailbox from './AnonymousMailbox.svelte';
  import TerminalLog from './TerminalLog.svelte';
  import AnonymousNotification from './AnonymousNotification.svelte';
  import {
    gameState,
    activeDanmakus,
    isTyping,
    showMenu,
    loadState,
    resetGameState,
    settings
  } from '../lib/store';
  import {
    evidenceBoard,
    collectEvidenceByNode,
    openEvidenceBoard,
    closeEvidenceBoard,
    resetEvidenceBoard,
    setCanOpenBoard,
    collectAllEvidence
  } from '../lib/evidence';
  import {
    getCurrentNode,
    getAvailableChoices,
    isAtDialogueEnd,
    hasChoices,
    advance,
    selectChoice,
    goToNode,
    restartGame,
    getEndingById,
    triggerDanmakusForDialogue,
    triggerDanmakuAtChar,
    clearDanmakuTimeouts,
    unlockClueFromNode
  } from '../lib/engine';
  import { playBGM, playSFX, initAudio, resumeAudio, stopBGM } from '../lib/audio';
  import { currentPlaythrough, unlockEvidenceId } from '../lib/memory';
  import {
    initSignalCorruption,
    destroySignalCorruption,
    resetCorruption,
    setCorruptionTarget,
    increaseCorruption,
    decreaseCorruption,
    signalCorruption,
    corruptionSeverity
  } from '../lib/signalCorruption';
  import {
    initHullDamage,
    destroyHullDamage,
    resetHullDamage,
    hullDamage,
    channelDegradation,
    overallIntegrity,
    activeAlerts,
    dismissAlert
  } from '../lib/hullDamage';
  import { resetTrustState } from '../lib/trust';
  import {
    rewindState,
    canRewind,
    stabilityLevel,
    resetRewindState
  } from '../lib/timeRewind';
  import {
    checkAndTriggerMessages,
    resetAnonymousSenderState,
    openMailbox,
    openTerminalLog,
    anonymousSenderState,
    unreadEmailCount,
    unreadTerminalCount,
    getAnonymousSenderPersistentState,
    restoreAnonymousSenderState,
    clearPendingTriggers,
    latestMessagePreview
  } from '../lib/anonymousSender';
  import {
    isInChapterReplay,
    currentReplayChapterId,
    getCurrentReplayChapter,
    recordReplayNodeVisit,
    recordReplayChoice,
    createChapterSave,
    getChapterSaves,
    getCurrentReplayProgress,
    deleteChapterSave,
    recordReplayNodeSnapshot
  } from '../lib/chapterReview';
  import type { SaveSlot, StoryNode, DialogueLine, Choice, Ending, MoodType, RewindCheckpoint, CrewStoryNode, CrewPerspectiveId } from '../types/game';
  import { getNode, rewindToCheckpoint, getCurrentCrewNode, isCrewNode } from '../lib/engine';
  import { currentCrewPerspective, crewMentalStates } from '../lib/store';
  import { CREW_PERSPECTIVE_CONFIG } from '../types/game';

  export let onBackToMenu: () => void;
  export let onShowEndingsGallery: () => void;
  export let onShowChapterReview: () => void = () => {};
  export let onNodeReached: ((nodeId: string) => void) | undefined = undefined;

  let showChapterSavePanel = false;

  let currentNode: StoryNode | undefined;
  let currentDialogue: DialogueLine | null = null;
  let availableChoices: Choice[] = [];
  let showChoices = false;
  let isEnding = false;
  let currentEnding: Ending | null = null;
  let showGameMenu = false;
  let showTrustPanel = false;
  let showRewindPanel = false;
  let lastNodeId = '';
  let rewindMessage = '';
  let showRewindMessage = false;
  let lastVariableKeys = '';
  let lastAnonymousSignature = '';

  function buildAnonymousSignature(): string {
    const s = get(anonymousSenderState);
    const emailSig = s.emails.map(e => `${e.id}:${e.isRead ? '1' : '0'}`).join('|');
    const termSig = s.terminalRecords.map(t => `${t.id}:${t.isRead ? '1' : '0'}`).join('|');
    const trigSig = s.triggeredIds.join(',');
    return `${emailSig}__${termSig}__${trigSig}__${s.unreadEmailCount}_${s.unreadTerminalCount}`;
  }

  function syncEvidenceToMemory(nodeId: string) {
    const state = get(evidenceBoard);
    state.collectedEvidence.forEach(ev => {
      unlockEvidenceId(ev.id);
    });
  }

  function syncCluesFromVariables() {
    const state = get(gameState);
    Object.entries(state.variables).forEach(([key, value]) => {
      if (value === true && (
        key.startsWith('clue') ||
        key.startsWith('creature_is_artificial') ||
        key.startsWith('crew_knew') ||
        key.startsWith('previous_incident') ||
        key.startsWith('signal_response') ||
        key.startsWith('full_truth')
      )) {
        unlockClueFromNode(key, lastNodeId);
      }
    });
  }

  function updateState() {
    currentNode = getCurrentNode();
    if (!currentNode) return;

    const state = get(gameState);

    if (currentNode.id !== lastNodeId) {
      collectEvidenceByNode(currentNode.id);
      syncEvidenceToMemory(currentNode.id);
      applyNodeCorruption(currentNode);
      lastNodeId = currentNode.id;
      recordReplayNodeVisit(currentNode.id);
      if (onNodeReached) {
        onNodeReached(currentNode.id);
      }
      if (currentNode.id === 'early_sign') {
        setCanOpenBoard(true);
      }
      checkAndTriggerMessages({
        nodeId: currentNode.id,
        dialogueIndex: state.dialogueIndex,
        variables: state.variables
      });
    }

    const varKeys = Object.keys(state.variables).sort().join(',');
    if (varKeys !== lastVariableKeys) {
      lastVariableKeys = varKeys;
      checkAndTriggerMessages({
        nodeId: currentNode.id,
        dialogueIndex: state.dialogueIndex,
        variables: state.variables
      });
    }

    syncCluesFromVariables();

    applyVariableCorruption(state.variables);

    if (state.dialogueIndex < currentNode.dialogues.length) {
      currentDialogue = currentNode.dialogues[state.dialogueIndex];
      if ($isInChapterReplay && currentDialogue) {
        recordReplayNodeSnapshot(
          currentNode.id,
          state.dialogueIndex,
          state.variables,
          currentDialogue.text,
          currentNode.title
        );
      }
    } else {
      currentDialogue = null;
      if ($isInChapterReplay) {
        recordReplayNodeSnapshot(
          currentNode.id,
          state.dialogueIndex,
          state.variables,
          currentNode.title || '',
          currentNode.title
        );
      }
    }

    if (isAtDialogueEnd() && hasChoices()) {
      availableChoices = getAvailableChoices();
      showChoices = true;
    } else {
      showChoices = false;
      availableChoices = [];
    }

    if (currentNode.isEnding && currentNode.endingId && isAtDialogueEnd() && !showChoices) {
      isEnding = true;
      currentEnding = getEndingById(currentNode.endingId) || null;
      stopBGM();
    }

    if (currentNode.background) {
      const crewNode = getCurrentCrewNode();
      if (crewNode) {
        const crewConfig = CREW_PERSPECTIVE_CONFIG[crewNode.perspectiveId];
        if (crewConfig) {
          playBGM(currentNode.bgm || crewConfig.defaultBgm);
        } else {
          playBGM('mystery');
        }
      } else if (currentNode.background === 'tense' || currentNode.background === 'damage') {
        playBGM('tense');
      } else if (currentNode.background === 'creature' || currentNode.background === 'dark') {
        playBGM('mystery');
      } else if (currentNode.background === 'escape' || currentNode.background === 'ascent') {
        playBGM('calm');
      } else {
        playBGM('deep');
      }
    }
  }

  function applyNodeCorruption(node: StoryNode) {
  }

  function applyVariableCorruption(variables: Record<string, string | number | boolean>) {
  }

  function handleDialogueComplete() {
    playSFX('click');
    advance();
    updateState();
  }

  function handleLineStart() {
    const state = get(gameState);
    if (currentDialogue) {
      const charDelay = getCharDelayForDialogue(currentDialogue);
      triggerDanmakusForDialogue(state.dialogueIndex, charDelay);
    }
  }

  function handleCharTyped(e: CustomEvent<{ index: number; char: string }>) {
    const state = get(gameState);
    if (currentDialogue) {
      const charDelay = getCharDelayForDialogue(currentDialogue);
      triggerDanmakuAtChar(state.dialogueIndex, e.detail.index, charDelay);
    }
  }

  function getCharDelayForDialogue(d: DialogueLine): number {
    const textSpeed = $settings.textSpeed;
    const base = d.baseTypingSpeed !== undefined
      ? Math.max(15, 100 - d.baseTypingSpeed)
      : Math.max(15, 100 - textSpeed);
    const moodMultipliers: Record<MoodType, number> = {
      normal: 1.0, tense: 0.7, scared: 1.4, calm: 1.3, whisper: 1.6, urgent: 0.5,
      mystery: 1.2, terrified: 1.8
    };
    return base * moodMultipliers[d.mood || 'normal'];
  }

  function calculateCharTime(text: string, targetIndex: number, charDelay: number): number {
    let time = 0;
    const punctuationPause = charDelay * 2.5;
    for (let i = 0; i < Math.min(targetIndex, text.length); i++) {
      const char = text[i];
      time += charDelay;
      if (char === '。' || char === '！' || char === '？' || char === '…' || char === '—') {
        time += punctuationPause;
      } else if (char === '，' || char === '、' || char === '；' || char === '：') {
        time += charDelay * 1.2;
      }
    }
    return time;
  }

  function handleChoice(choiceId: string) {
    const state = get(gameState);
    const choice = availableChoices.find(c => c.id === choiceId);
    if (choice && state.currentNodeId) {
      recordReplayChoice(state.currentNodeId, choiceId, choice.text);
    }
    selectChoice(choiceId);
    updateState();
  }

  function handleGameAreaClick() {
    if (!showChoices && !isEnding && !showGameMenu) {
      resumeAudio();
      handleDialogueComplete();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      if ($evidenceBoard.isBoardOpen) {
        closeEvidenceBoard();
      } else if (showTrustPanel) {
        showTrustPanel = false;
      } else if (showRewindPanel) {
        showRewindPanel = false;
      } else if ($anonymousSenderState.isMailboxOpen) {
        $anonymousSenderState.isMailboxOpen = false;
        $anonymousSenderState.viewingEmailId = null;
      } else if ($anonymousSenderState.isTerminalOpen) {
        $anonymousSenderState.isTerminalOpen = false;
        $anonymousSenderState.viewingTerminalId = null;
      } else {
        showGameMenu = !showGameMenu;
      }
    } else if (e.key === 'e' || e.key === 'E') {
      if ($evidenceBoard.canOpenBoard && !isEnding && !showGameMenu && !showTrustPanel && !showRewindPanel) {
        openEvidenceBoard();
      }
    } else if (e.key === 't' || e.key === 'T') {
      if (!isEnding && !showGameMenu && !$evidenceBoard.isBoardOpen && !showRewindPanel) {
        showTrustPanel = !showTrustPanel;
      }
    } else if (e.key === 'r' || e.key === 'R') {
      if (!isEnding && !showGameMenu && !$evidenceBoard.isBoardOpen && !showTrustPanel) {
        showRewindPanel = !showRewindPanel;
        if (showRewindPanel) {
          playSFX('click');
        }
      }
    } else if (e.key === 'm' || e.key === 'M') {
      if (!isEnding && !showGameMenu && !$evidenceBoard.isBoardOpen && !showTrustPanel && !showRewindPanel) {
        playSFX('select');
        openMailbox();
      }
    } else if (e.key === '`') {
      if (!isEnding && !showGameMenu && !$evidenceBoard.isBoardOpen && !showTrustPanel && !showRewindPanel) {
        playSFX('keyboard');
        openTerminalLog();
      }
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (!$evidenceBoard.isBoardOpen && !showChoices && !isEnding && !showGameMenu && !showTrustPanel && !showRewindPanel && !$anonymousSenderState.isMailboxOpen && !$anonymousSenderState.isTerminalOpen) {
        e.preventDefault();
        handleDialogueComplete();
      }
    }
  }

  function handleMenuClose() {
    showGameMenu = false;
  }

  function handleLoadSlot(slot: SaveSlot) {
    clearDanmakuTimeouts();
    loadState(slot.state);
    restoreAnonymousSenderState(slot.state.anonymousSenderState);
    resetEvidenceBoard();
    resetCorruption();
    resetHullDamage();
    resetTrustState();
    resetRewindState();
    isEnding = false;
    currentEnding = null;
    lastNodeId = '';
    lastVariableKeys = '';
    showRewindPanel = false;
    updateState();
    lastAnonymousSignature = buildAnonymousSignature();
    const state = get(gameState);
    triggerDanmakusForDialogue(state.dialogueIndex);
  }

  function persistAnonymousSenderToGameState(force = false) {
    const signature = buildAnonymousSignature();
    if (!force && signature === lastAnonymousSignature) return;
    lastAnonymousSignature = signature;
    gameState.update(state => ({
      ...state,
      anonymousSenderState: getAnonymousSenderPersistentState(),
      updatedAt: Date.now()
    }));
  }

  function handleRestart() {
    clearDanmakuTimeouts();
    resetGameState();
    resetAnonymousSenderState();
    resetEvidenceBoard();
    resetCorruption();
    resetHullDamage();
    resetTrustState();
    resetRewindState();
    isEnding = false;
    currentEnding = null;
    lastNodeId = '';
    lastVariableKeys = '';
    showRewindPanel = false;
    goToNode('start');
    updateState();
    triggerDanmakusForDialogue(0);
    playBGM('deep');
  }

  function handleShowEndings() {
    onShowEndingsGallery();
  }

  function handleRewindCheckpoint(checkpoint: RewindCheckpoint) {
    const result = rewindToCheckpoint(checkpoint);
    if (result.success) {
      showRewindPanel = false;
      showRewindMessage = true;
      rewindMessage = '时间回溯中...数据流正在重构';
      setTimeout(() => {
        showRewindMessage = false;
        updateState();
      }, 1500);
    } else {
      showRewindMessage = true;
      rewindMessage = result.reason || '回溯失败';
      setTimeout(() => {
        showRewindMessage = false;
      }, 2000);
    }
  }

  function formatCheckpointTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function getCheckpointNodeTitle(nodeId: string): string {
    const node = getNode(nodeId);
    return node?.title || nodeId;
  }

  function handleSaveChapterGame() {
    if (!$isInChapterReplay) return;
    const state = get(gameState);
    const chapter = getCurrentReplayChapter();
    if (!chapter) return;

    const preview = currentDialogue?.text || currentNode?.title || '';
    createChapterSave(
      chapter.id,
      state.currentNodeId,
      state.dialogueIndex,
      state.variables,
      preview
    );
    playSFX('notify');
  }

  function handleShowChapterSaves() {
    showChapterSavePanel = !showChapterSavePanel;
  }

  const CREW_DISPLAY_NAMES: Record<string, string> = {
    ahai: '👁 阿海',
    xiaolin: '📷 小林',
    laozhou: '🔧 老周',
    suboshi: '🔬 苏博士'
  };

  const MENTAL_STATE_LABELS: Record<string, string> = {
    calm: '冷静',
    anxious: '焦虑',
    terrified: '恐惧',
    determined: '坚定',
    broken: '崩溃',
    resigned: '认命'
  };

  const MENTAL_STATE_COLORS: Record<string, string> = {
    calm: '#66ff66',
    anxious: '#ffcc00',
    terrified: '#ff4444',
    determined: '#44aaff',
    broken: '#880000',
    resigned: '#888888'
  };

  function getCrewDisplayName(id: string): string {
    return CREW_DISPLAY_NAMES[id] || id;
  }

  function getMentalStateLabel(state: string): string {
    return MENTAL_STATE_LABELS[state] || state;
  }

  function getMentalStateColor(state: string): string {
    return MENTAL_STATE_COLORS[state] || '#888888';
  }

  onMount(() => {
    initAudio();
    resumeAudio();
    initSignalCorruption();
    initHullDamage();
    resetEvidenceBoard();
    resetCorruption();
    resetHullDamage();
    const initialState = get(gameState);
    if (initialState.anonymousSenderState) {
      restoreAnonymousSenderState(initialState.anonymousSenderState);
    } else {
      resetAnonymousSenderState();
    }
    lastVariableKeys = Object.keys(initialState.variables).sort().join(',');
    lastAnonymousSignature = buildAnonymousSignature();
    updateState();
    playBGM('deep');
    triggerDanmakusForDialogue(get(gameState).dialogueIndex);
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    destroySignalCorruption();
    destroyHullDamage();
    clearDanmakuTimeouts();
    clearPendingTriggers();
    stopBGM();
    window.removeEventListener('keydown', handleKeydown);
  });

  $: if ($gameState) {
    if (!isEnding && !showGameMenu) {
      updateState();
    }
  }

  $: $anonymousSenderState, persistAnonymousSenderToGameState();
</script>

<div class="game-scene" on:click={handleGameAreaClick}>
  <BackgroundLayer background={currentNode?.background || 'default'} />

  {#if currentNode?.title}
    <div class="node-title-bar" style="animation: fadeIn 0.6s ease-out;">
      <span class="title-text">{currentNode.title}</span>
      {#if $isInChapterReplay}
        <span class="chapter-replay-badge">
          <span class="replay-icon">⟲</span>
          章节重播: {getCurrentReplayChapter()?.title || ''}
        </span>
      {:else if $currentPlaythrough > 1}
        <span class="playthrough-badge">第 {$currentPlaythrough} 周目</span>
      {/if}
      {#if $signalCorruption.level >= 15}
        <span 
          class="signal-status"
          class:signal-mild={$corruptionSeverity === 'mild'}
          class:signal-moderate={$corruptionSeverity === 'moderate'}
          class:signal-severe={$corruptionSeverity === 'severe'}
          class:signal-critical={$corruptionSeverity === 'critical'}
        >
          <span class="signal-icon">📡</span>
          <span class="signal-text">
            {#if $corruptionSeverity === 'mild'}信号微弱
            {:else if $corruptionSeverity === 'moderate'}信号干扰
            {:else if $corruptionSeverity === 'severe'}信号严重丢失
            {:else if $corruptionSeverity === 'critical'}信号崩溃
            {/if}
          </span>
          <span class="signal-bar">
            {#each Array.from({ length: 5 }) as _, i}
              <span 
                class="signal-bar-seg"
                class:active={i < 5 - Math.ceil($signalCorruption.level / 20)}
              ></span>
            {/each}
          </span>
        </span>
      {/if}
    </div>
  {/if}

  <DanmakuLayer danmakus={$activeDanmakus} />

  {#if $currentCrewPerspective}
    {@const crewConfig = CREW_PERSPECTIVE_CONFIG[$currentCrewPerspective]}
    {@const crewMental = $crewMentalStates[$currentCrewPerspective]}
    <div class="crew-perspective-overlay" style="border-color: {crewConfig.innerVoiceColor};">
      <div class="perspective-indicator">
        <span class="perspective-name" style="color: {crewConfig.innerVoiceColor};">
          {getCrewDisplayName($currentCrewPerspective)}
        </span>
        {#if crewMental}
          <span class="mental-state" style="color: {getMentalStateColor(crewMental.mentalState)};">
            {getMentalStateLabel(crewMental.mentalState)}
          </span>
        {/if}
      </div>
    </div>
  {/if}

  {#if !isEnding}
    {#if !showChoices}
      <DialogueBox 
        dialogue={currentDialogue} 
        onComplete={handleDialogueComplete}
        on:lineStart={handleLineStart}
        on:charTyped={handleCharTyped}
      />
    {:else}
      <ChoicePanel choices={availableChoices} onSelect={handleChoice} />
    {/if}
  {:else if currentEnding}
    <EndingScreen 
      ending={currentEnding} 
      onRestart={handleRestart}
      onBackToMenu={onBackToMenu}
      onShowEndings={handleShowEndings}
      onShowChapterReview={onShowChapterReview}
    />
  {/if}

  {#if !isEnding && !showGameMenu}
    <button 
      class="menu-toggle"
      on:click|stopPropagation={() => { playSFX('click'); showGameMenu = true; }}
    >
      ☰
    </button>
    {#if $evidenceBoard.canOpenBoard}
      <button 
        class="evidence-toggle"
        on:click|stopPropagation={() => { playSFX('notify'); openEvidenceBoard(); }}
      >
        🔍
        {#if $evidenceBoard.collectedEvidence.length > 0}
          <span class="evidence-badge">{$evidenceBoard.collectedEvidence.length}</span>
        {/if}
      </button>
    {/if}
    <button 
      class="mail-toggle"
      on:click|stopPropagation={() => { playSFX('select'); openMailbox(); }}
    >
      📧
      {#if $unreadEmailCount > 0}
        <span class="mail-badge">{$unreadEmailCount}</span>
      {/if}
    </button>
    <button 
      class="terminal-toggle"
      on:click|stopPropagation={() => { playSFX('keyboard'); openTerminalLog(); }}
    >
      💻
      {#if $unreadTerminalCount > 0}
        <span class="terminal-badge">{$unreadTerminalCount}</span>
      {/if}
    </button>
    <button 
      class="trust-toggle"
      on:click|stopPropagation={() => { playSFX('click'); showTrustPanel = true; }}
    >
      👥
    </button>
    <button 
      class="rewind-toggle"
      class:rewind-active={$rewindState.isRewindMode}
      class:rewind-disabled={!$canRewind}
      on:click|stopPropagation={() => { playSFX('sonar'); showRewindPanel = !showRewindPanel; }}
    >
      ⏪
    </button>
    {#if $isInChapterReplay}
      <button 
        class="chapter-save-toggle"
        on:click|stopPropagation={() => { playSFX('select'); handleShowChapterSaves(); }}
      >
        💾
      </button>
    {/if}
    <div class="stability-indicator" class:stability-critical={$stabilityLevel === 'critical'} class:stability-unstable={$stabilityLevel === 'unstable'} class:stability-fragile={$stabilityLevel === 'fragile'}>
      <span class="stability-icon">◈</span>
      <div class="stability-bar-wrap">
        <div class="stability-bar" style="width: {($rewindState.stability / $rewindState.maxStability) * 100}%"></div>
      </div>
      <span class="stability-text">{$rewindState.stability}</span>
    </div>
    {#if $overallIntegrity < 95}
      <div class="hull-integrity-indicator" class:integrity-critical={$overallIntegrity < 30} class:integrity-damaged={$overallIntegrity < 60}>
        <span class="integrity-icon">🛡</span>
        <div class="integrity-bar-wrap">
          <div class="integrity-bar" style="width: {$overallIntegrity}%"></div>
        </div>
        <span class="integrity-text">{Math.round($overallIntegrity)}%</span>
      </div>
    {/if}
    {#if $activeAlerts.length > 0}
      <div class="damage-alerts">
        {#each $activeAlerts as alert (alert.id)}
          <div 
            class="damage-alert"
            class:alert-warning={alert.severity === 'warning'}
            class:alert-critical={alert.severity === 'critical'}
            class:alert-offline={alert.severity === 'offline'}
            class:alert-recovering={alert.severity === 'recovering'}
            class:alert-repaired={alert.severity === 'repaired'}
            class:alert-kind-repair={alert.kind === 'repair'}
            on:click|stopPropagation={() => dismissAlert(alert.id)}
          >
            <span class="alert-icon">
              {#if alert.kind === 'repair'}
                {alert.severity === 'repaired' ? '✓' : '↺'}
              {:else if alert.severity === 'offline'}✕{:else if alert.severity === 'critical'}⚠{:else}⚡{/if}
            </span>
            <span class="alert-text">{alert.message}</span>
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  <GameMenu 
    isOpen={showGameMenu}
    onClose={handleMenuClose}
    onLoadSlot={handleLoadSlot}
    onBackToMenu={() => { clearDanmakuTimeouts(); stopBGM(); onBackToMenu(); }}
  />

  {#if $evidenceBoard.isBoardOpen}
    <EvidenceBoard onClose={() => {}} />
  {/if}

  <TrustPanel isOpen={showTrustPanel} onClose={() => { showTrustPanel = false; }} />
  <TrustNotifications />
  <AnonymousMailbox />
  <TerminalLog />
  <AnonymousNotification />

  {#if showRewindPanel}
    <div class="rewind-panel-backdrop" on:click|stopPropagation={() => { showRewindPanel = false; }}>
      <div class="rewind-panel" on:click|stopPropagation>
        <div class="rewind-panel-header">
          <h3 class="rewind-panel-title">⏪ 时间回溯模式</h3>
          <button class="rewind-close-btn" on:click={() => { showRewindPanel = false; }}>✕</button>
        </div>
        <div class="rewind-panel-info">
          <div class="stability-display">
            <span class="stability-label">时空稳定度</span>
            <div class="stability-bar-large-wrap">
              <div 
                class="stability-bar-large" 
                style="width: {($rewindState.stability / $rewindState.maxStability) * 100}%"
                class:bar-critical={$stabilityLevel === 'critical'}
                class:bar-unstable={$stabilityLevel === 'unstable'}
                class:bar-fragile={$stabilityLevel === 'fragile'}
              ></div>
            </div>
            <span class="stability-num">{$rewindState.stability} / {$rewindState.maxStability}</span>
          </div>
          <p class="rewind-warning">
            ⚠️ 回溯将消耗稳定度，并可能导致弹幕顺序错乱、音效偏移、线索判定改变。
          </p>
          {#if $rewindState.rewindCount > 0}
            <p class="rewind-count">
              已回溯次数：{$rewindState.rewindCount} — 系统不稳定性随次数增加
            </p>
          {/if}
        </div>
        <div class="rewind-checkpoints-list">
          <h4 class="checkpoints-title">可用时间锚点</h4>
          {#if $rewindState.checkpoints.length === 0}
            <p class="no-checkpoints">尚未检测到关键锚点...继续推进剧情以生成锚点。</p>
          {:else}
            {#each [...$rewindState.checkpoints].reverse() as checkpoint (checkpoint.id)}
              <button 
                class="checkpoint-item"
                disabled={$rewindState.stability < 15}
                on:click={() => handleRewindCheckpoint(checkpoint)}
              >
                <div class="checkpoint-info">
                  <span class="checkpoint-label">{checkpoint.label || getCheckpointNodeTitle(checkpoint.nodeId)}</span>
                  <span class="checkpoint-time">{formatCheckpointTime(checkpoint.timestamp)}</span>
                </div>
                <div class="checkpoint-meta">
                  <span class="checkpoint-node">节点: {checkpoint.nodeId}</span>
                  <span class="checkpoint-cost">消耗: 15+ 稳定度</span>
                </div>
                {#if checkpoint.snapshot.unlockedClues.length > 0}
                  <div class="checkpoint-clues">
                    🔍 已解锁 {checkpoint.snapshot.unlockedClues.length} 条线索
                  </div>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}

  {#if showRewindMessage}
    <div class="rewind-message-overlay">
      <div class="rewind-message-content">
        <div class="rewind-spinner"></div>
        <p class="rewind-message-text">{rewindMessage}</p>
      </div>
    </div>
  {/if}

  {#if $rewindState.isRewindMode}
    <div class="rewind-active-overlay"></div>
  {/if}

  {#if showChapterSavePanel && $isInChapterReplay}
    <div class="chapter-save-backdrop" on:click|stopPropagation={() => { showChapterSavePanel = false; }}>
      <div class="chapter-save-panel" on:click|stopPropagation>
        <div class="panel-header">
          <h3 class="panel-title">💾 章节存档</h3>
          <button class="panel-close" on:click={() => { showChapterSavePanel = false; }}>✕</button>
        </div>

        <div class="save-actions">
          <button class="save-new-btn" on:click={handleSaveChapterGame}>
            <span class="save-icon">＋</span>
            <span>保存当前进度</span>
          </button>
        </div>

        <div class="save-list-header">
          <h4 class="save-list-title">存档槽位</h4>
          <span class="save-count">
            {getChapterSaves($currentReplayChapterId || '').length} 个存档
          </span>
        </div>

        <div class="save-list">
          {#if getChapterSaves($currentReplayChapterId || '').length === 0}
            <div class="no-saves">
              <p>暂无存档</p>
              <p class="no-saves-hint">点击上方按钮保存当前章节进度</p>
            </div>
          {:else}
            {#each getChapterSaves($currentReplayChapterId || '') as save}
              <div class="save-item">
                <div class="save-info">
                  <div class="save-preview">{save.preview}</div>
                  <div class="save-meta">
                    <span class="save-time">{new Date(save.savedAt).toLocaleString('zh-CN')}</span>
                    <span class="save-node">节点: {save.nodeId}</span>
                  </div>
                </div>
                <div class="save-actions-inline">
                  <button 
                    class="save-delete-btn" 
                    on:click={() => deleteChapterSave(save.chapterId, save.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .game-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .crew-perspective-overlay {
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-radius: 0;
    pointer-events: none;
    z-index: 12;
    animation: perspectiveFadeIn 0.8s ease-out;
    box-shadow: inset 0 0 40px rgba(0,0,0,0.3);
  }

  .perspective-indicator {
    position: absolute;
    top: 50px;
    right: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(0, 10, 25, 0.7);
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(4px);
  }

  .perspective-name {
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 1px;
  }

  .mental-state {
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.5px;
  }

  @keyframes perspectiveFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .node-title-bar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px 20px calc(16px + env(safe-area-inset-top));
    background: linear-gradient(180deg, rgba(0, 10, 25, 0.8), transparent);
    z-index: 15;
    text-align: center;
    pointer-events: none;
  }

  .title-text {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #64b4ff;
    letter-spacing: 0.15em;
    text-shadow: 0 0 10px rgba(100, 180, 255, 0.5);
    opacity: 0.9;
  }

  .playthrough-badge {
    margin-left: 12px;
    padding: 2px 10px;
    background: rgba(255, 200, 100, 0.15);
    border: 1px solid rgba(255, 200, 100, 0.3);
    border-radius: 10px;
    font-size: 0.7rem;
    color: #ffd890;
    font-family: 'Courier New', monospace;
  }

  .signal-status {
    margin-left: 12px;
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 0.65rem;
    font-family: 'Courier New', monospace;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(6px);
  }

  .signal-status.signal-mild {
    background: rgba(100, 200, 255, 0.12);
    border: 1px solid rgba(100, 200, 255, 0.35);
    color: #64c8ff;
  }

  .signal-status.signal-moderate {
    background: rgba(255, 200, 100, 0.15);
    border: 1px solid rgba(255, 200, 100, 0.4);
    color: #ffc864;
  }

  .signal-status.signal-severe {
    background: rgba(255, 100, 100, 0.18);
    border: 1px solid rgba(255, 100, 100, 0.5);
    color: #ff8080;
    animation: signalPulse 1s infinite;
  }

  .signal-status.signal-critical {
    background: rgba(255, 50, 80, 0.22);
    border: 1px solid rgba(255, 50, 80, 0.6);
    color: #ff5070;
    animation: signalPulse 0.4s infinite;
  }

  .signal-icon {
    font-size: 0.8rem;
    line-height: 1;
  }

  .signal-text {
    letter-spacing: 0.05em;
  }

  .signal-bar {
    display: inline-flex;
    gap: 2px;
    align-items: flex-end;
    height: 10px;
  }

  .signal-bar-seg {
    width: 3px;
    height: 100%;
    background: rgba(100, 100, 100, 0.4);
    border-radius: 1px;
  }

  .signal-bar-seg.active {
    background: currentColor;
    box-shadow: 0 0 4px currentColor;
  }

  .signal-bar-seg:nth-child(1) { height: 20%; }
  .signal-bar-seg:nth-child(2) { height: 40%; }
  .signal-bar-seg:nth-child(3) { height: 60%; }
  .signal-bar-seg:nth-child(4) { height: 80%; }
  .signal-bar-seg:nth-child(5) { height: 100%; }

  @keyframes signalPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .menu-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 16px;
    width: 40px;
    height: 40px;
    background: rgba(20, 40, 70, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 8px;
    color: #a0c8f0;
    font-size: 1.2rem;
    cursor: pointer;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .menu-toggle:hover, .menu-toggle:active {
    background: rgba(40, 80, 140, 0.8);
    border-color: rgba(100, 180, 255, 0.6);
  }

  .evidence-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 64px;
    width: 40px;
    height: 40px;
    background: rgba(20, 50, 40, 0.6);
    border: 1px solid rgba(100, 255, 150, 0.3);
    border-radius: 8px;
    font-size: 1.1rem;
    cursor: pointer;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .evidence-toggle:hover, .evidence-toggle:active {
    background: rgba(40, 100, 70, 0.8);
    border-color: rgba(100, 255, 150, 0.6);
    box-shadow: 0 0 12px rgba(100, 255, 150, 0.3);
  }

  .evidence-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #ff6464, #ff3232);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    box-shadow: 0 0 6px rgba(255, 100, 100, 0.5);
  }

  @media (max-width: 480px) {
    .title-text {
      font-size: 0.7rem;
    }

    .menu-toggle {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }

    .evidence-toggle {
      width: 36px;
      height: 36px;
      right: 56px;
      font-size: 1rem;
    }

    .mail-toggle {
      width: 36px;
      height: 36px;
      right: 96px;
      font-size: 0.9rem;
    }

    .terminal-toggle {
      width: 36px;
      height: 36px;
      right: 136px;
      font-size: 0.9rem;
    }

    .trust-toggle {
      width: 36px;
      height: 36px;
      right: 176px;
      font-size: 0.9rem;
    }
  }

  .mail-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 112px;
    width: 40px;
    height: 40px;
    background: rgba(60, 35, 15, 0.6);
    border: 1px solid rgba(255, 180, 100, 0.3);
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .mail-toggle:hover, .mail-toggle:active {
    background: rgba(100, 60, 25, 0.8);
    border-color: rgba(255, 180, 100, 0.6);
    box-shadow: 0 0 12px rgba(255, 150, 80, 0.3);
  }

  .mail-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #ffa040, #ff7020);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    box-shadow: 0 0 6px rgba(255, 150, 80, 0.5);
  }

  .terminal-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 160px;
    width: 40px;
    height: 40px;
    background: rgba(15, 40, 25, 0.6);
    border: 1px solid rgba(100, 255, 150, 0.3);
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .terminal-toggle:hover, .terminal-toggle:active {
    background: rgba(25, 70, 45, 0.8);
    border-color: rgba(100, 255, 150, 0.6);
    box-shadow: 0 0 12px rgba(80, 255, 130, 0.3);
  }

  .terminal-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    background: linear-gradient(135deg, #40ff80, #20c050);
    color: #002211;
    font-size: 0.65rem;
    font-weight: 700;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    box-shadow: 0 0 6px rgba(80, 255, 130, 0.5);
  }

  .trust-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 208px;
    width: 40px;
    height: 40px;
    background: rgba(30, 40, 70, 0.6);
    border: 1px solid rgba(180, 160, 255, 0.3);
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .trust-toggle:hover, .trust-toggle:active {
    background: rgba(60, 80, 140, 0.8);
    border-color: rgba(180, 160, 255, 0.6);
    box-shadow: 0 0 12px rgba(180, 160, 255, 0.3);
  }

  .rewind-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 256px;
    width: 40px;
    height: 40px;
    background: rgba(20, 30, 60, 0.6);
    border: 1px solid rgba(100, 200, 255, 0.3);
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: #a0e8ff;
  }

  .rewind-toggle:hover, .rewind-toggle:active {
    background: rgba(40, 80, 140, 0.85);
    border-color: rgba(100, 200, 255, 0.7);
    box-shadow: 0 0 15px rgba(100, 200, 255, 0.4);
  }

  .rewind-toggle.rewind-active {
    background: rgba(60, 100, 200, 0.85);
    border-color: rgba(150, 220, 255, 0.8);
    box-shadow: 0 0 20px rgba(100, 200, 255, 0.6);
    animation: rewindPulse 0.6s infinite;
  }

  .rewind-toggle.rewind-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @keyframes rewindPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
  }

  .stability-indicator {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    left: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(10, 20, 40, 0.65);
    border: 1px solid rgba(100, 200, 255, 0.25);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    z-index: 35;
    font-family: 'Courier New', monospace;
  }

  .stability-icon {
    font-size: 0.85rem;
    color: #64d8ff;
  }

  .stability-bar-wrap {
    width: 60px;
    height: 6px;
    background: rgba(50, 50, 80, 0.6);
    border-radius: 3px;
    overflow: hidden;
  }

  .stability-bar {
    height: 100%;
    background: linear-gradient(90deg, #64ff96, #64d8ff);
    border-radius: 3px;
    transition: width 0.4s ease, background 0.4s ease;
  }

  .stability-indicator.stability-fragile .stability-bar {
    background: linear-gradient(90deg, #ffd864, #ff9650);
  }

  .stability-indicator.stability-unstable .stability-bar {
    background: linear-gradient(90deg, #ff9650, #ff5050);
  }

  .stability-indicator.stability-critical .stability-bar {
    background: linear-gradient(90deg, #ff3030, #ff0060);
    animation: criticalBlink 0.5s infinite;
  }

  @keyframes criticalBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .stability-text {
    font-size: 0.7rem;
    color: #a0e8ff;
    min-width: 22px;
    text-align: right;
  }

  .hull-integrity-indicator {
    position: absolute;
    top: calc(56px + env(safe-area-inset-top));
    left: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(10, 20, 40, 0.65);
    border: 1px solid rgba(100, 200, 255, 0.25);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    z-index: 35;
    font-family: 'Courier New', monospace;
  }

  .integrity-icon {
    font-size: 0.85rem;
  }

  .integrity-bar-wrap {
    width: 60px;
    height: 6px;
    background: rgba(50, 50, 80, 0.6);
    border-radius: 3px;
    overflow: hidden;
  }

  .integrity-bar {
    height: 100%;
    background: linear-gradient(90deg, #64d8ff, #64ff96);
    border-radius: 3px;
    transition: width 0.4s ease, background 0.4s ease;
  }

  .hull-integrity-indicator.integrity-damaged .integrity-bar {
    background: linear-gradient(90deg, #ffd864, #ff9650);
  }

  .hull-integrity-indicator.integrity-critical .integrity-bar {
    background: linear-gradient(90deg, #ff3030, #ff0060);
    animation: criticalBlink 0.5s infinite;
  }

  .integrity-text {
    font-size: 0.7rem;
    color: #a0e8ff;
    min-width: 30px;
    text-align: right;
  }

  .hull-integrity-indicator.integrity-damaged .integrity-text {
    color: #ffc864;
  }

  .hull-integrity-indicator.integrity-critical .integrity-text {
    color: #ff5070;
  }

  .damage-alerts {
    position: absolute;
    top: calc(88px + env(safe-area-inset-top));
    left: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 36;
    pointer-events: none;
  }

  .damage-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    backdrop-filter: blur(8px);
    animation: alertSlideIn 0.3s ease-out;
    pointer-events: auto;
    cursor: pointer;
  }

  .damage-alert.alert-warning {
    background: rgba(255, 200, 100, 0.15);
    border: 1px solid rgba(255, 200, 100, 0.4);
    color: #ffc864;
  }

  .damage-alert.alert-critical {
    background: rgba(255, 100, 100, 0.18);
    border: 1px solid rgba(255, 100, 100, 0.5);
    color: #ff8080;
    animation: alertSlideIn 0.3s ease-out, criticalPulse 0.6s infinite;
  }

  .damage-alert.alert-offline {
    background: rgba(255, 50, 80, 0.22);
    border: 1px solid rgba(255, 50, 80, 0.6);
    color: #ff5070;
    animation: alertSlideIn 0.3s ease-out, criticalPulse 0.3s infinite;
  }

  .damage-alert.alert-recovering {
    background: rgba(100, 200, 255, 0.15);
    border: 1px solid rgba(100, 200, 255, 0.4);
    color: #64c8ff;
  }

  .damage-alert.alert-repaired {
    background: rgba(100, 255, 180, 0.18);
    border: 1px solid rgba(100, 255, 180, 0.5);
    color: #64ffb4;
    animation: alertSlideIn 0.3s ease-out, repairedGlow 1.2s ease-out;
  }

  .damage-alert.alert-kind-repair .alert-icon {
    filter: drop-shadow(0 0 4px currentColor);
  }

  .alert-icon {
    font-size: 0.9rem;
    line-height: 1;
  }

  .alert-text {
    letter-spacing: 0.05em;
  }

  @keyframes alertSlideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes criticalPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  @keyframes repairedGlow {
    0% { box-shadow: 0 0 0 0 rgba(100, 255, 180, 0.5); opacity: 0; }
    20% { opacity: 1; }
    100% { box-shadow: 0 0 20px 6px rgba(100, 255, 180, 0); }
  }

  .rewind-panel-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 5, 15, 0.75);
    backdrop-filter: blur(8px);
    z-index: 80;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .rewind-panel {
    background: linear-gradient(180deg, rgba(10, 25, 55, 0.95), rgba(5, 15, 35, 0.98));
    border: 1px solid rgba(100, 200, 255, 0.35);
    border-radius: 14px;
    max-width: 480px;
    width: 100%;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 40px rgba(80, 160, 255, 0.2), inset 0 1px 0 rgba(150, 220, 255, 0.1);
  }

  .rewind-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(100, 200, 255, 0.15);
    background: rgba(20, 40, 80, 0.4);
  }

  .rewind-panel-title {
    margin: 0;
    font-size: 1rem;
    color: #80dcff;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.08em;
    text-shadow: 0 0 10px rgba(100, 200, 255, 0.5);
  }

  .rewind-close-btn {
    background: none;
    border: none;
    color: #8090a0;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .rewind-close-btn:hover {
    background: rgba(255, 80, 80, 0.2);
    color: #ff8080;
  }

  .rewind-panel-info {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(100, 200, 255, 0.1);
  }

  .stability-display {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  .stability-label {
    font-size: 0.8rem;
    color: #80a0c0;
    font-family: 'Courier New', monospace;
    min-width: 72px;
  }

  .stability-bar-large-wrap {
    flex: 1;
    height: 10px;
    background: rgba(40, 50, 80, 0.6);
    border-radius: 5px;
    overflow: hidden;
    border: 1px solid rgba(100, 150, 200, 0.2);
  }

  .stability-bar-large {
    height: 100%;
    background: linear-gradient(90deg, #64ff96, #64d8ff);
    border-radius: 5px;
    transition: width 0.5s ease;
  }

  .stability-bar-large.bar-fragile {
    background: linear-gradient(90deg, #ffd864, #ff9650);
  }

  .stability-bar-large.bar-unstable {
    background: linear-gradient(90deg, #ff9650, #ff5050);
  }

  .stability-bar-large.bar-critical {
    background: linear-gradient(90deg, #ff3030, #ff0060);
    animation: barFlash 0.4s infinite;
  }

  @keyframes barFlash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .stability-num {
    font-size: 0.8rem;
    color: #a0e8ff;
    font-family: 'Courier New', monospace;
    min-width: 56px;
    text-align: right;
  }

  .rewind-warning {
    margin: 0;
    font-size: 0.8rem;
    color: #ffcc80;
    line-height: 1.5;
    padding: 8px 12px;
    background: rgba(255, 150, 50, 0.08);
    border-left: 3px solid rgba(255, 180, 80, 0.6);
    border-radius: 0 4px 4px 0;
  }

  .rewind-count {
    margin: 10px 0 0;
    font-size: 0.75rem;
    color: #a080ff;
    font-family: 'Courier New', monospace;
  }

  .rewind-checkpoints-list {
    padding: 16px 20px 20px;
    overflow-y: auto;
    flex: 1;
  }

  .checkpoints-title {
    margin: 0 0 12px;
    font-size: 0.85rem;
    color: #80c0ff;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
  }

  .no-checkpoints {
    margin: 0;
    padding: 20px;
    text-align: center;
    color: #607080;
    font-size: 0.85rem;
    font-style: italic;
    background: rgba(50, 60, 80, 0.2);
    border-radius: 8px;
    border: 1px dashed rgba(100, 150, 200, 0.2);
  }

  .checkpoint-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    padding: 12px 14px;
    margin-bottom: 10px;
    background: rgba(20, 40, 75, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }

  .checkpoint-item:hover:not(:disabled) {
    background: rgba(40, 80, 140, 0.65);
    border-color: rgba(100, 200, 255, 0.5);
    box-shadow: 0 0 15px rgba(100, 180, 255, 0.2);
    transform: translateX(2px);
  }

  .checkpoint-item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .checkpoint-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .checkpoint-label {
    font-size: 0.9rem;
    color: #c0e8ff;
    font-weight: 500;
  }

  .checkpoint-time {
    font-size: 0.7rem;
    color: #80a0c0;
    font-family: 'Courier New', monospace;
  }

  .checkpoint-meta {
    display: flex;
    gap: 12px;
    font-size: 0.7rem;
  }

  .checkpoint-node {
    color: #608090;
    font-family: 'Courier New', monospace;
  }

  .checkpoint-cost {
    color: #ffa060;
    font-family: 'Courier New', monospace;
  }

  .checkpoint-clues {
    font-size: 0.72rem;
    color: #90d0a0;
    padding-top: 4px;
    border-top: 1px dashed rgba(100, 200, 150, 0.2);
  }

  .rewind-message-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 10, 30, 0.85);
    backdrop-filter: blur(12px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .rewind-message-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .rewind-spinner {
    width: 50px;
    height: 50px;
    border: 3px solid rgba(100, 200, 255, 0.2);
    border-top: 3px solid #64d8ff;
    border-radius: 50%;
    animation: rewindSpin 0.8s linear infinite;
    box-shadow: 0 0 20px rgba(100, 200, 255, 0.4);
  }

  @keyframes rewindSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .rewind-message-text {
    margin: 0;
    font-size: 1rem;
    color: #80dcff;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.1em;
    text-shadow: 0 0 15px rgba(100, 200, 255, 0.6);
    animation: textGlitch 0.3s infinite;
  }

  @keyframes textGlitch {
    0%, 100% { transform: translate(0); }
    25% { transform: translate(-1px, 1px); }
    50% { transform: translate(1px, -1px); }
    75% { transform: translate(-1px, -1px); }
  }

  .rewind-active-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 25;
    background: 
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(100, 200, 255, 0.03) 3px,
        rgba(100, 200, 255, 0.03) 6px
      );
    animation: rewindScan 2s linear infinite;
    mix-blend-mode: screen;
  }

  @keyframes rewindScan {
    0% { background-position: 0 0; }
    100% { background-position: 0 100px; }
  }

  @media (max-width: 480px) {
    .rewind-toggle {
      width: 36px;
      height: 36px;
      right: 216px;
      font-size: 0.9rem;
    }

    .stability-indicator {
      padding: 3px 8px;
      top: calc(8px + env(safe-area-inset-top));
    }

    .stability-bar-wrap {
      width: 45px;
    }

    .rewind-panel {
      max-height: 90vh;
    }

    .rewind-panel-header,
    .rewind-panel-info,
    .rewind-checkpoints-list {
      padding-left: 14px;
      padding-right: 14px;
    }
  }

  .chapter-replay-badge {
    margin-left: 12px;
    padding: 3px 12px;
    background: linear-gradient(135deg, rgba(100, 200, 255, 0.15), rgba(60, 120, 200, 0.15));
    border: 1px solid rgba(100, 200, 255, 0.4);
    border-radius: 12px;
    font-size: 0.72rem;
    color: #80dcff;
    font-family: 'Courier New', monospace;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    animation: replayPulse 2s infinite;
  }

  .replay-icon {
    font-size: 0.8rem;
  }

  @keyframes replayPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .chapter-save-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 304px;
    width: 40px;
    height: 40px;
    background: rgba(35, 25, 60, 0.6);
    border: 1px solid rgba(200, 150, 255, 0.35);
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    z-index: 40;
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    animation: saveGlow 2s infinite;
  }

  .chapter-save-toggle:hover {
    background: rgba(60, 45, 100, 0.8);
    border-color: rgba(200, 150, 255, 0.6);
    box-shadow: 0 0 15px rgba(200, 150, 255, 0.3);
  }

  @keyframes saveGlow {
    0%, 100% { box-shadow: 0 0 5px rgba(200, 150, 255, 0.2); }
    50% { box-shadow: 0 0 12px rgba(200, 150, 255, 0.4); }
  }

  .chapter-save-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 90;
    backdrop-filter: blur(8px);
    padding: 16px;
    animation: fadeIn 0.25s ease-out;
  }

  .chapter-save-panel {
    background: linear-gradient(180deg, rgba(15, 25, 50, 0.98), rgba(8, 15, 35, 1));
    border: 1px solid rgba(150, 120, 220, 0.35);
    border-radius: 12px;
    padding: 20px;
    width: 100%;
    max-width: 480px;
    max-height: 80vh;
    overflow-y: auto;
    animation: fadeInUp 0.3s ease-out;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(150, 120, 220, 0.2);
  }

  .panel-title {
    color: #c0a8ff;
    font-size: 1rem;
    margin: 0;
  }

  .panel-close {
    background: transparent;
    border: none;
    color: #7a8aaa;
    font-size: 1.1rem;
    cursor: pointer;
    padding: 4px 8px;
  }

  .save-actions {
    margin-bottom: 16px;
  }

  .save-new-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(135deg, rgba(120, 80, 200, 0.6), rgba(80, 50, 150, 0.6));
    border: 1px solid rgba(180, 140, 255, 0.5);
    border-radius: 8px;
    color: #e8dfff;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s;
  }

  .save-new-btn:hover {
    background: linear-gradient(135deg, rgba(140, 100, 220, 0.7), rgba(100, 70, 170, 0.7));
    transform: translateY(-1px);
  }

  .save-icon {
    font-size: 1.1rem;
  }

  .save-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .save-list-title {
    color: #a0c8e8;
    font-size: 0.85rem;
    margin: 0;
  }

  .save-count {
    font-size: 0.72rem;
    color: #6a8aaa;
    font-family: 'Courier New', monospace;
  }

  .save-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .no-saves {
    text-align: center;
    padding: 24px;
    color: #5a7a9a;
  }

  .no-saves-hint {
    font-size: 0.78rem;
    color: #4a6a8a;
    margin-top: 6px;
  }

  .save-item {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    padding: 12px;
    background: rgba(30, 40, 70, 0.4);
    border: 1px solid rgba(100, 180, 255, 0.15);
    border-radius: 8px;
    gap: 12px;
  }

  .save-info {
    flex: 1;
    min-width: 0;
  }

  .save-preview {
    color: #c0d8f0;
    font-size: 0.82rem;
    line-height: 1.4;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .save-meta {
    display: flex;
    gap: 12px;
    font-size: 0.7rem;
    color: #5a7a9a;
  }

  .save-time {
    font-family: 'Courier New', monospace;
  }

  .save-node {
    font-family: 'Courier New', monospace;
  }

  .save-actions-inline {
    display: flex;
    align-items: center;
  }

  .save-delete-btn {
    background: rgba(150, 60, 60, 0.2);
    border: 1px solid rgba(200, 80, 80, 0.3);
    color: #d08080;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.72rem;
    transition: all 0.2s;
  }

  .save-delete-btn:hover {
    background: rgba(180, 60, 60, 0.4);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    .chapter-save-toggle {
      width: 36px;
      height: 36px;
      right: 256px;
      font-size: 0.9rem;
    }
  }
</style>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import PodcastSubtitles from './PodcastSubtitles.svelte';
  import PodcastChoices from './PodcastChoices.svelte';
  import PodcastBackground from './PodcastBackground.svelte';
  import PodcastControls from './PodcastControls.svelte';
  import PodcastDanmaku from './PodcastDanmaku.svelte';
  import PodcastEnding from './PodcastEnding.svelte';
  import {
    gameState,
    activeDanmakus,
    isTyping,
    settings
  } from '../lib/store';
  import {
    getCurrentNode,
    getAvailableChoices,
    isAtDialogueEnd,
    hasChoices,
    advance,
    selectChoice,
    goToNode,
    getEndingById,
    triggerDanmakusForDialogue,
    triggerDanmakuAtChar,
    clearDanmakuTimeouts,
    unlockClueFromNode,
    getChoiceDisplayText
  } from '../lib/engine';
  import { playBGM, playSFX, initAudio, resumeAudio, stopBGM } from '../lib/audio';
  import { currentPlaythrough, unlockEvidenceId } from '../lib/memory';
  import {
    initSignalCorruption,
    destroySignalCorruption,
    resetCorruption,
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
    anonymousSenderState,
    getAnonymousSenderPersistentState,
    restoreAnonymousSenderState,
    clearPendingTriggers
  } from '../lib/anonymousSender';
  import {
    podcastState,
    podcastSettings,
    setPlaying,
    setPaused,
    togglePlay,
    setWaitingForChoice,
    setCurrentMood,
    setDialogueProgress,
    setCurrentNodeTitle,
    triggerHaptic,
    openMenu,
    progressPercent,
    moodColor
  } from '../lib/podcastStore';
  import type { StoryNode, DialogueLine, Choice, Ending, MoodType, SaveSlot } from '../types/game';
  import {
    loadState as loadGameState,
    resetGameState,
    gameState as gameStateStore
  } from '../lib/store';
  import {
    saveToSlot,
    loadSaveSlots,
    deleteSlot,
    hasAnySave,
    loadFromSlot
  } from '../lib/storage';

  export let onBackToMenu: () => void;

  let currentNode: StoryNode | undefined;
  let currentDialogue: DialogueLine | null = null;
  let availableChoices: Choice[] = [];
  let showChoices = false;
  let isEnding = false;
  let currentEnding: Ending | null = null;
  let lastNodeId = '';
  let lastVariableKeys = '';
  let autoAdvanceTimer: number | null = null;

  function getCharDelayForDialogue(d: DialogueLine): number {
    const textSpeed = get(settings).textSpeed;
    const base = d.baseTypingSpeed !== undefined
      ? Math.max(15, 100 - d.baseTypingSpeed)
      : Math.max(15, 100 - textSpeed);
    const moodMultipliers: Record<MoodType, number> = {
      normal: 1.0, tense: 0.7, scared: 1.4, calm: 1.3, whisper: 1.6, urgent: 0.5,
      mystery: 1.2, terrified: 1.8
    };
    const pSettings = get(podcastSettings);
    return (base * moodMultipliers[d.mood || 'normal']) / pSettings.narrationSpeed;
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

  function updateState() {
    currentNode = getCurrentNode();
    if (!currentNode) return;

    const state = get(gameState);

    if (currentNode.id !== lastNodeId) {
      lastNodeId = currentNode.id;
      if (currentNode.title) {
        setCurrentNodeTitle(currentNode.title);
      }
      checkAndTriggerMessages({
        nodeId: currentNode.id,
        dialogueIndex: state.dialogueIndex,
        variables: state.variables
      });
      if (currentNode.endingWeightEffects && currentNode.endingWeightEffects.length > 0) {
      }
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

    if (state.dialogueIndex < currentNode.dialogues.length) {
      currentDialogue = currentNode.dialogues[state.dialogueIndex];
      if (currentDialogue) {
        setCurrentMood(currentDialogue.mood || 'normal');
        setDialogueProgress(state.dialogueIndex + 1, currentNode.dialogues.length);
        playSfxForDialogue(currentDialogue);
      }
    } else {
      currentDialogue = null;
    }

    if (isAtDialogueEnd() && hasChoices()) {
      availableChoices = getAvailableChoices().map(c => ({
        ...c,
        text: getChoiceDisplayText(c)
      }));
      showChoices = true;
      setWaitingForChoice(true);
      triggerHaptic('medium');
    } else {
      showChoices = false;
      availableChoices = [];
      setWaitingForChoice(false);
    }

    if (currentNode.isEnding && currentNode.endingId && isAtDialogueEnd() && !showChoices) {
      isEnding = true;
      currentEnding = getEndingById(currentNode.endingId) || null;
      stopBGM();
      setPlaying(false);
    }

    if (currentNode.background) {
      if (currentNode.background === 'tense' || currentNode.background === 'damage') {
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

  function playSfxForDialogue(dialogue: DialogueLine) {
    if (dialogue.sfx) {
      dialogue.sfx.forEach(trigger => {
        const delay = trigger.delay || 0;
        window.setTimeout(() => {
          playSFX(trigger.sfx, trigger.volume);
        }, delay);
      });
    }
  }

  function handleDialogueComplete() {
    playSFX('click');
    triggerHaptic('light');
    clearAutoAdvanceTimer();
    advance();
    updateState();
    scheduleAutoAdvance();
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

  function handleChoice(choiceId: string) {
    triggerHaptic('medium');
    selectChoice(choiceId);
    updateState();
    scheduleAutoAdvance();
  }

  function handlePlayerAreaClick() {
    if (!showChoices && !isEnding) {
      resumeAudio();
      handleDialogueComplete();
    }
  }

  function handleTogglePlay() {
    triggerHaptic('light');
    togglePlay();
  }

  function handleOpenMenu() {
    triggerHaptic('light');
    openMenu();
  }

  function handleSaveGame() {
    const state = get(gameStateStore);
    const preview = currentDialogue?.text || currentNode?.title || '';
    const latestSlot = Math.max(0, ...loadSaveSlots().map(s => s.id)) + 1;
    const slotId = latestSlot > 0 ? latestSlot : 1;
    saveToSlot(slotId, state, preview);
    triggerHaptic('medium');
    playSFX('notify');
  }

  function clearAutoAdvanceTimer() {
    if (autoAdvanceTimer !== null) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function scheduleAutoAdvance() {
    clearAutoAdvanceTimer();
    const pSettings = get(podcastSettings);
    if (!pSettings.autoPlay) return;
    if (!currentDialogue) return;
    if (showChoices || isEnding) return;

    if (currentDialogue.autoAdvance) {
      const baseDelay = currentDialogue.autoAdvanceDelay || 2000;
      const adjustedDelay = baseDelay / pSettings.narrationSpeed;
      autoAdvanceTimer = window.setTimeout(() => {
        handleDialogueComplete();
      }, adjustedDelay);
    } else {
      const textLength = currentDialogue.text.length;
      const charDelay = getCharDelayForDialogue(currentDialogue);
      const readingTime = calculateCharTime(currentDialogue.text, textLength, charDelay);
      const pauseTime = 800 / pSettings.narrationSpeed;
      const totalDelay = readingTime + pauseTime;
      autoAdvanceTimer = window.setTimeout(() => {
        handleDialogueComplete();
      }, Math.max(1500, totalDelay));
    }
  }

  function handleRestart() {
    clearDanmakuTimeouts();
    resetGameState();
    resetAnonymousSenderState();
    resetCorruption();
    resetHullDamage();
    resetTrustState();
    resetRewindState();
    isEnding = false;
    currentEnding = null;
    lastNodeId = '';
    lastVariableKeys = '';
    goToNode('start');
    updateState();
    triggerDanmakusForDialogue(0);
    playBGM('deep');
    setPlaying(true);
    scheduleAutoAdvance();
  }

  onMount(() => {
    initAudio();
    resumeAudio();
    initSignalCorruption();
    initHullDamage();
    resetCorruption();
    resetHullDamage();
    const initialState = get(gameState);
    if (initialState.anonymousSenderState) {
      restoreAnonymousSenderState(initialState.anonymousSenderState);
    } else {
      resetAnonymousSenderState();
    }
    lastVariableKeys = Object.keys(initialState.variables).sort().join(',');
    updateState();
    playBGM('deep');
    triggerDanmakusForDialogue(get(gameState).dialogueIndex);
    setPlaying(true);
    scheduleAutoAdvance();
  });

  onDestroy(() => {
    destroySignalCorruption();
    destroyHullDamage();
    clearDanmakuTimeouts();
    clearPendingTriggers();
    clearAutoAdvanceTimer();
    stopBGM();
  });

  $: if ($gameState && !isEnding) {
    if (!showChoices) {
      updateState();
    }
  }
</script>

<div class="podcast-player" on:click={handlePlayerAreaClick}>
  <PodcastBackground 
    mood={currentDialogue?.mood || 'calm'} 
    corruption={$signalCorruption.level}
  />

  <div class="podcast-header">
    <div class="header-left">
      <button 
        class="menu-btn"
        on:click|stopPropagation={handleOpenMenu}
      >
        ☰
      </button>
    </div>
    <div class="header-center">
      {#if currentNode?.title}
        <span class="node-title">{currentNode.title}</span>
      {/if}
      {#if $currentPlaythrough > 1}
        <span class="playthrough-badge">第 {$currentPlaythrough} 周目</span>
      {/if}
    </div>
    <div class="header-right">
      <button 
        class="save-btn"
        on:click|stopPropagation={handleSaveGame}
      >
        💾
      </button>
    </div>
  </div>

  {#if $signalCorruption.level >= 15}
    <div 
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
    </div>
  {/if}

  <PodcastDanmaku danmakus={$activeDanmakus} />

  <div class="podcast-content">
    {#if !isEnding}
      {#if !showChoices}
        <PodcastSubtitles 
          dialogue={currentDialogue}
          onComplete={handleDialogueComplete}
          on:lineStart={handleLineStart}
          on:charTyped={handleCharTyped}
        />
      {:else}
        <PodcastChoices 
          choices={availableChoices} 
          onSelect={handleChoice} 
        />
      {/if}
    {:else if currentEnding}
      <PodcastEnding 
        ending={currentEnding} 
        onRestart={handleRestart}
        onBackToMenu={onBackToMenu}
      />
    {/if}
  </div>

  <PodcastControls 
    isPlaying={$podcastState.isPlaying}
    isPaused={$podcastState.isPaused}
    progress={$progressPercent}
    moodColor={$moodColor}
    dialogueIndex={$gameState.dialogueIndex + 1}
    totalDialogues={currentNode?.dialogues.length || 0}
    onTogglePlay={handleTogglePlay}
    onBack={handleDialogueComplete}
    onMenu={handleOpenMenu}
  />

  {#if $overallIntegrity < 95}
    <div class="integrity-indicator" class:integrity-critical={$overallIntegrity < 30} class:integrity-damaged={$overallIntegrity < 60}>
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
          on:click|stopPropagation={() => dismissAlert(alert.id)}
        >
          <span class="alert-icon">
            {#if alert.severity === 'offline'}✕{:else if alert.severity === 'critical'}⚠{:else}⚡{/if}
          </span>
          <span class="alert-text">{alert.message}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .podcast-player {
    position: absolute;
    inset: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .podcast-header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: calc(12px + env(safe-area-inset-top)) 16px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 30;
    background: linear-gradient(180deg, rgba(5, 8, 16, 0.9), transparent);
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
  }

  .header-center {
    flex: 1;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .menu-btn, .save-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(20, 30, 50, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.25);
    color: #a0c8f0;
    font-size: 1.1rem;
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .menu-btn:hover, .save-btn:hover,
  .menu-btn:active, .save-btn:active {
    background: rgba(40, 70, 120, 0.8);
    border-color: rgba(100, 180, 255, 0.5);
  }

  .node-title {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    color: #64b4ff;
    letter-spacing: 0.12em;
    text-shadow: 0 0 8px rgba(100, 180, 255, 0.4);
  }

  .playthrough-badge {
    font-size: 0.65rem;
    color: #ffc864;
    background: rgba(255, 200, 100, 0.12);
    border: 1px solid rgba(255, 200, 100, 0.3);
    padding: 2px 8px;
    border-radius: 8px;
    letter-spacing: 0.05em;
  }

  .signal-status {
    position: absolute;
    top: calc(60px + env(safe-area-inset-top));
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 0.7rem;
    font-family: 'Courier New', monospace;
    display: flex;
    align-items: center;
    gap: 6px;
    backdrop-filter: blur(6px);
    z-index: 25;
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
    animation: pulse 1s infinite;
  }

  .signal-status.signal-critical {
    background: rgba(255, 50, 80, 0.22);
    border: 1px solid rgba(255, 50, 80, 0.6);
    color: #ff5070;
    animation: pulse 0.4s infinite;
  }

  .signal-icon {
    font-size: 0.75rem;
  }

  .podcast-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 100px 20px 140px;
    position: relative;
    z-index: 10;
  }

  .integrity-indicator {
    position: absolute;
    top: calc(96px + env(safe-area-inset-top));
    left: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: rgba(10, 20, 40, 0.65);
    border: 1px solid rgba(100, 200, 255, 0.25);
    border-radius: 12px;
    backdrop-filter: blur(8px);
    z-index: 25;
    font-family: 'Courier New', monospace;
  }

  .integrity-icon {
    font-size: 0.85rem;
  }

  .integrity-bar-wrap {
    width: 50px;
    height: 5px;
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

  .integrity-indicator.integrity-damaged .integrity-bar {
    background: linear-gradient(90deg, #ffd864, #ff9650);
  }

  .integrity-indicator.integrity-critical .integrity-bar {
    background: linear-gradient(90deg, #ff3030, #ff0060);
    animation: pulse 0.5s infinite;
  }

  .integrity-text {
    font-size: 0.7rem;
    color: #a0e8ff;
    min-width: 28px;
    text-align: right;
  }

  .integrity-indicator.integrity-damaged .integrity-text {
    color: #ffc864;
  }

  .integrity-indicator.integrity-critical .integrity-text {
    color: #ff5070;
  }

  .damage-alerts {
    position: absolute;
    top: calc(140px + env(safe-area-inset-top));
    left: 16px;
    right: 16px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 28;
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
    animation: fadeInDown 0.3s ease-out;
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
    animation: fadeInDown 0.3s ease-out, pulse 0.6s infinite;
  }

  .damage-alert.alert-offline {
    background: rgba(255, 50, 80, 0.22);
    border: 1px solid rgba(255, 50, 80, 0.6);
    color: #ff5070;
    animation: fadeInDown 0.3s ease-out, pulse 0.3s infinite;
  }

  .alert-icon {
    font-size: 0.9rem;
    line-height: 1;
  }

  @media (max-width: 480px) {
    .podcast-content {
      padding: 80px 16px 130px;
    }

    .menu-btn, .save-btn {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }

    .node-title {
      font-size: 0.7rem;
    }
  }
</style>

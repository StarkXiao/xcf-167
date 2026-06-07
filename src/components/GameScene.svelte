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
  import { resetTrustState } from '../lib/trust';
  import type { SaveSlot, StoryNode, DialogueLine, Choice, Ending, MoodType } from '../types/game';

  export let onBackToMenu: () => void;
  export let onShowEndingsGallery: () => void;

  let currentNode: StoryNode | undefined;
  let currentDialogue: DialogueLine | null = null;
  let availableChoices: Choice[] = [];
  let showChoices = false;
  let isEnding = false;
  let currentEnding: Ending | null = null;
  let showGameMenu = false;
  let showTrustPanel = false;
  let lastNodeId = '';

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

    if (currentNode.id !== lastNodeId) {
      collectEvidenceByNode(currentNode.id);
      syncEvidenceToMemory(currentNode.id);
      applyNodeCorruption(currentNode);
      lastNodeId = currentNode.id;
      if (currentNode.id === 'early_sign') {
        setCanOpenBoard(true);
      }
    }

    syncCluesFromVariables();

    const state = get(gameState);
    applyVariableCorruption(state.variables);

    if (state.dialogueIndex < currentNode.dialogues.length) {
      currentDialogue = currentNode.dialogues[state.dialogueIndex];
    } else {
      currentDialogue = null;
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

  function applyNodeCorruption(node: StoryNode) {
    const bgCorruptionMap: Record<string, number> = {
      tense: 40,
      damage: 55,
      dark: 30,
      creature: 35,
      glitch: 65,
      escape: 20,
      ascent: 10
    };
    
    let target = 0;
    if (node.background && bgCorruptionMap[node.background] !== undefined) {
      target = bgCorruptionMap[node.background];
    }
    
    if (node.isEnding) {
      if (node.endingId === 'ending_madness' || node.endingId === 'ending_silence') {
        target = Math.max(target, 75);
      } else if (node.endingId === 'ending_loop') {
        target = Math.max(target, 60);
      } else {
        target = Math.min(target, 15);
      }
    }
    
    setCorruptionTarget(target);
  }

  function applyVariableCorruption(variables: Record<string, string | number | boolean>) {
    let bonus = 0;
    if (variables.signal_unstable === true) bonus += 25;
    if (variables.creature_nearby === true) bonus += 20;
    if (variables.damage_hull === true) bonus += 30;
    if (variables.protocol_breach === true) bonus += 35;
    if (variables.full_truth === true) bonus += 40;
    if (variables.sanity_low === true) bonus += 30;
    
    if (bonus > 0) {
      const current = get(signalCorruption).targetLevel;
      if (current < bonus) {
        setCorruptionTarget(bonus);
      }
    }
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
      normal: 1.0, tense: 0.7, scared: 1.4, calm: 1.3, whisper: 1.6, urgent: 0.5
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
      } else {
        showGameMenu = !showGameMenu;
      }
    } else if (e.key === 'e' || e.key === 'E') {
      if ($evidenceBoard.canOpenBoard && !isEnding && !showGameMenu && !showTrustPanel) {
        openEvidenceBoard();
      }
    } else if (e.key === 't' || e.key === 'T') {
      if (!isEnding && !showGameMenu && !$evidenceBoard.isBoardOpen) {
        showTrustPanel = !showTrustPanel;
      }
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (!$evidenceBoard.isBoardOpen && !showChoices && !isEnding && !showGameMenu && !showTrustPanel) {
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
    resetEvidenceBoard();
    resetCorruption();
    resetTrustState();
    isEnding = false;
    currentEnding = null;
    lastNodeId = '';
    updateState();
    const state = get(gameState);
    triggerDanmakusForDialogue(state.dialogueIndex);
  }

  function handleRestart() {
    clearDanmakuTimeouts();
    resetGameState();
    resetEvidenceBoard();
    resetCorruption();
    resetTrustState();
    isEnding = false;
    currentEnding = null;
    lastNodeId = '';
    goToNode('start');
    updateState();
    triggerDanmakusForDialogue(0);
    playBGM('deep');
  }

  function handleShowEndings() {
    onShowEndingsGallery();
  }

  onMount(() => {
    initAudio();
    resumeAudio();
    initSignalCorruption();
    resetEvidenceBoard();
    resetCorruption();
    updateState();
    playBGM('deep');
    triggerDanmakusForDialogue(get(gameState).dialogueIndex);
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    destroySignalCorruption();
    clearDanmakuTimeouts();
    stopBGM();
    window.removeEventListener('keydown', handleKeydown);
  });

  $: if ($gameState) {
    if (!isEnding && !showGameMenu) {
      updateState();
    }
  }
</script>

<div class="game-scene" on:click={handleGameAreaClick}>
  <BackgroundLayer background={currentNode?.background || 'default'} />

  {#if currentNode?.title}
    <div class="node-title-bar" style="animation: fadeIn 0.6s ease-out;">
      <span class="title-text">{currentNode.title}</span>
      {#if $currentPlaythrough > 1}
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
    />
  {/if}

  {#if !isEnding && !showGameMenu && $evidenceBoard.canOpenBoard}
    <button 
      class="menu-toggle"
      on:click|stopPropagation={() => { playSFX('click'); showGameMenu = true; }}
    >
      ☰
    </button>
    <button 
      class="evidence-toggle"
      on:click|stopPropagation={() => { playSFX('notify'); openEvidenceBoard(); }}
    >
      🔍
      {#if $evidenceBoard.collectedEvidence.length > 0}
        <span class="evidence-badge">{$evidenceBoard.collectedEvidence.length}</span>
      {/if}
    </button>
    <button 
      class="trust-toggle"
      on:click|stopPropagation={() => { playSFX('click'); showTrustPanel = true; }}
    >
      👥
    </button>
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
</div>

<style>
  .game-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
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
  }

  .trust-toggle {
    position: absolute;
    top: calc(12px + env(safe-area-inset-top));
    right: 112px;
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

  @media (max-width: 480px) {
    .trust-toggle {
      width: 36px;
      height: 36px;
      right: 100px;
      font-size: 0.9rem;
    }
  }
</style>

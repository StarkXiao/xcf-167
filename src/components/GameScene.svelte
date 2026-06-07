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
    clearDanmakuTimeouts
  } from '../lib/engine';
  import { playBGM, playSFX, initAudio, resumeAudio, stopBGM } from '../lib/audio';
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
  let lastNodeId = '';

  function updateState() {
    currentNode = getCurrentNode();
    if (!currentNode) return;

    if (currentNode.id !== lastNodeId) {
      collectEvidenceByNode(currentNode.id);
      lastNodeId = currentNode.id;
      if (currentNode.id === 'early_sign') {
        setCanOpenBoard(true);
      }
    }

    const state = get(gameState);
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
      } else {
        showGameMenu = !showGameMenu;
      }
    } else if (e.key === 'e' || e.key === 'E') {
      if ($evidenceBoard.canOpenBoard && !isEnding && !showGameMenu) {
        openEvidenceBoard();
      }
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (!$evidenceBoard.isBoardOpen && !showChoices && !isEnding && !showGameMenu) {
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
    resetEvidenceBoard();
    updateState();
    playBGM('deep');
    triggerDanmakusForDialogue(get(gameState).dialogueIndex);
    window.addEventListener('keydown', handleKeydown);
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
</style>

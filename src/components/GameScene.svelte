<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import BackgroundLayer from './BackgroundLayer.svelte';
  import DanmakuLayer from './DanmakuLayer.svelte';
  import DialogueBox from './DialogueBox.svelte';
  import ChoicePanel from './ChoicePanel.svelte';
  import GameMenu from './GameMenu.svelte';
  import EndingScreen from './EndingScreen.svelte';
  import {
    gameState,
    activeDanmakus,
    isTyping,
    showMenu,
    loadState,
    resetGameState
  } from '../lib/store';
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
    clearDanmakuTimeouts
  } from '../lib/engine';
  import { playBGM, playSFX, initAudio, resumeAudio, stopBGM } from '../lib/audio';
  import type { SaveSlot, StoryNode, DialogueLine, Choice, Ending } from '../types/game';

  export let onBackToMenu: () => void;
  export let onShowEndingsGallery: () => void;

  let currentNode: StoryNode | undefined;
  let currentDialogue: DialogueLine | null = null;
  let availableChoices: Choice[] = [];
  let showChoices = false;
  let isEnding = false;
  let currentEnding: Ending | null = null;
  let showGameMenu = false;

  function updateState() {
    currentNode = getCurrentNode();
    if (!currentNode) return;

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
      showGameMenu = !showGameMenu;
    } else if (e.key === ' ' || e.key === 'Enter') {
      if (!showChoices && !isEnding && !showGameMenu) {
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
    isEnding = false;
    currentEnding = null;
    updateState();
    const state = get(gameState);
    triggerDanmakusForDialogue(state.dialogueIndex);
  }

  function handleRestart() {
    clearDanmakuTimeouts();
    resetGameState();
    isEnding = false;
    currentEnding = null;
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
      <DialogueBox dialogue={currentDialogue} onComplete={handleDialogueComplete} />
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

  {#if !isEnding && !showGameMenu}
    <button 
      class="menu-toggle"
      on:click|stopPropagation={() => { playSFX('click'); showGameMenu = true; }}
    >
      ☰
    </button>
  {/if}

  <GameMenu 
    isOpen={showGameMenu}
    onClose={handleMenuClose}
    onLoadSlot={handleLoadSlot}
    onBackToMenu={() => { clearDanmakuTimeouts(); stopBGM(); onBackToMenu(); }}
  />
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

  @media (max-width: 480px) {
    .title-text {
      font-size: 0.7rem;
    }

    .menu-toggle {
      width: 36px;
      height: 36px;
      font-size: 1rem;
    }
  }
</style>

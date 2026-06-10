<script lang="ts">
  import { onMount } from 'svelte';
  import MainMenu from './components/MainMenu.svelte';
  import GameScene from './components/GameScene.svelte';
  import EndingsGallery from './components/EndingsGallery.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import AchievementsGallery from './components/AchievementsGallery.svelte';
  import ChapterReview from './components/ChapterReview.svelte';
  import ChapterEndOverlay from './components/ChapterEndOverlay.svelte';
  import { gameState, resetGameState, loadState } from './lib/store';
  import { goToNode, triggerDanmakusForDialogue, getCurrentNode } from './lib/engine';
  import { initAudio, stopBGM } from './lib/audio';
  import { resetAnonymousSenderState, restoreAnonymousSenderState } from './lib/anonymousSender';
  import {
    startChapterReplay,
    endChapterReplay,
    cancelChapterReplay,
    isInChapterReplay,
    isCurrentReplayEndNode,
    createChapterSave,
    loadChapterSave,
    getCurrentReplayChapter
  } from './lib/chapterReview';
  import { currentPlaythrough } from './lib/memory';
  import type { GameScene as GameSceneType, SaveSlot, ChapterDefinition, ChapterSaveSlot } from './types/game';
  import { get } from 'svelte/store';

  let scene: GameSceneType = 'menu';
  let showSettings = false;
  let showEndings = false;
  let showAchievements = false;
  let showChapterReview = false;
  let showChapterEnd = false;
  let chapterEndNodeId = '';

  function handleNewGame() {
    resetGameState();
    resetAnonymousSenderState();
    cancelChapterReplay();
    goToNode('start');
    scene = 'playing';
    setTimeout(() => {
      triggerDanmakusForDialogue(0);
    }, 200);
  }

  function handleContinue(slot: SaveSlot) {
    loadState(slot.state);
    restoreAnonymousSenderState(slot.state.anonymousSenderState);
    cancelChapterReplay();
    scene = 'playing';
    setTimeout(() => {
      const state = get(gameState);
      triggerDanmakusForDialogue(state.dialogueIndex);
    }, 100);
  }

  function handleShowEndings() {
    showEndings = true;
  }

  function handleShowSettings() {
    showSettings = true;
  }

  function handleShowAchievements() {
    showAchievements = true;
  }

  function handleShowChapterReview() {
    showChapterReview = true;
  }

  function handleBackToMenu() {
    stopBGM();
    if (get(isInChapterReplay)) {
      const state = get(gameState);
      endChapterReplay(state.variables, state.currentNodeId, true);
    }
    showChapterEnd = false;
    scene = 'menu';
  }

  function handleCloseEndings() {
    showEndings = false;
  }

  function handleCloseSettings() {
    showSettings = false;
  }

  function handleCloseAchievements() {
    showAchievements = false;
  }

  function handleCloseChapterReview() {
    showChapterReview = false;
  }

  function handleReplayChapter(chapter: ChapterDefinition) {
    resetGameState();
    resetAnonymousSenderState();
    const state = get(gameState);
    startChapterReplay(chapter.id, state.variables);
    goToNode(chapter.startNodeId);
    scene = 'playing';
    setTimeout(() => {
      triggerDanmakusForDialogue(0);
    }, 200);
  }

  function handleLoadChapterSave(slot: ChapterSaveSlot) {
    resetGameState();
    resetAnonymousSenderState();
    const savedSlot = loadChapterSave(slot.chapterId, slot.id);
    if (!savedSlot) return;

    startChapterReplay(savedSlot.chapterId, savedSlot.variables);

    gameState.update(s => ({
      ...s,
      currentNodeId: savedSlot.nodeId,
      dialogueIndex: savedSlot.dialogueIndex,
      variables: { ...savedSlot.variables }
    }));

    scene = 'playing';
    showChapterReview = false;

    setTimeout(() => {
      triggerDanmakusForDialogue(savedSlot.dialogueIndex);
    }, 200);
  }

  function handleNodeReached(nodeId: string) {
    if (!get(isInChapterReplay)) return;

    if (isCurrentReplayEndNode(nodeId)) {
      chapterEndNodeId = nodeId;
      showChapterEnd = true;
    }
  }

  function handleChapterEndContinue() {
    const state = get(gameState);
    endChapterReplay(state.variables, chapterEndNodeId, true);
    showChapterEnd = false;
    showChapterReview = true;
    scene = 'menu';
  }

  function handleChapterEndKeepGoing() {
    showChapterEnd = false;
  }

  function handleChapterEndSaveAndExit() {
    const state = get(gameState);
    const chapter = getCurrentReplayChapter();
    if (chapter) {
      const node = getCurrentNode();
      const preview = node?.dialogues?.[0]?.text || '';
      createChapterSave(
        chapter.id,
        state.currentNodeId,
        state.dialogueIndex,
        state.variables,
        preview
      );
    }
    endChapterReplay(state.variables, chapterEndNodeId, true);
    showChapterEnd = false;
    showChapterReview = true;
    scene = 'menu';
  }

  onMount(() => {
    initAudio();
  });
</script>

<div id="game-container">
  {#if scene === 'menu'}
    <MainMenu 
      onNewGame={handleNewGame}
      onContinue={handleContinue}
      onShowEndings={handleShowEndings}
      onShowSettings={handleShowSettings}
      onShowAchievements={handleShowAchievements}
      onShowChapterReview={handleShowChapterReview}
    />
  {:else if scene === 'playing'}
    <GameScene 
      onBackToMenu={handleBackToMenu} 
      onShowEndingsGallery={handleShowEndings}
      onShowChapterReview={handleShowChapterReview}
      onNodeReached={handleNodeReached}
    />
  {/if}

  <EndingsGallery isOpen={showEndings} onClose={handleCloseEndings} />
  <SettingsPanel isOpen={showSettings} onClose={handleCloseSettings} />
  <AchievementsGallery isOpen={showAchievements} onClose={handleCloseAchievements} />
  <ChapterReview 
    isOpen={showChapterReview} 
    onClose={handleCloseChapterReview} 
    onReplayChapter={handleReplayChapter}
    onLoadChapterSave={handleLoadChapterSave}
  />
  <ChapterEndOverlay
    isOpen={showChapterEnd}
    onContinue={handleChapterEndContinue}
    onKeepGoing={handleChapterEndKeepGoing}
    onSaveAndExit={handleChapterEndSaveAndExit}
  />
</div>

<style>
  #game-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
</style>

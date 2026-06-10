<script lang="ts">
  import { onMount } from 'svelte';
  import MainMenu from './components/MainMenu.svelte';
  import GameScene from './components/GameScene.svelte';
  import EndingsGallery from './components/EndingsGallery.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import AchievementsGallery from './components/AchievementsGallery.svelte';
  import ChapterReview from './components/ChapterReview.svelte';
  import { gameState, resetGameState, loadState } from './lib/store';
  import { goToNode, triggerDanmakusForDialogue } from './lib/engine';
  import { initAudio, stopBGM } from './lib/audio';
  import { resetAnonymousSenderState, restoreAnonymousSenderState } from './lib/anonymousSender';
  import { addChapterRecord, getChapterNodeIds } from './lib/chapterReview';
  import { currentPlaythrough } from './lib/memory';
  import type { GameScene as GameSceneType, SaveSlot, ChapterDefinition, ChapterPlayRecord } from './types/game';
  import { get } from 'svelte/store';

  let scene: GameSceneType = 'menu';
  let showSettings = false;
  let showEndings = false;
  let showAchievements = false;
  let showChapterReview = false;

  let chapterReplayVars: Record<string, string | number | boolean> | null = null;
  let chapterReplayChapterId: string | null = null;

  function handleNewGame() {
    resetGameState();
    resetAnonymousSenderState();
    goToNode('start');
    scene = 'playing';
    setTimeout(() => {
      triggerDanmakusForDialogue(0);
    }, 200);
  }

  function handleContinue(slot: SaveSlot) {
    loadState(slot.state);
    restoreAnonymousSenderState(slot.state.anonymousSenderState);
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
    if (chapterReplayChapterId) {
      recordChapterReplayCompletion();
      chapterReplayVars = null;
      chapterReplayChapterId = null;
    }
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
    chapterReplayVars = {};
    chapterReplayChapterId = chapter.id;
    goToNode(chapter.startNodeId);
    scene = 'playing';
    setTimeout(() => {
      triggerDanmakusForDialogue(0);
    }, 200);
  }

  function recordChapterReplayCompletion() {
    if (!chapterReplayChapterId || !chapterReplayVars) return;
    const state = get(gameState);
    const nodeIds = getChapterNodeIds(chapterReplayChapterId);
    const isInChapter = nodeIds.has(state.currentNodeId);

    if (!isInChapter && state.visitedNodes.some(nId => nodeIds.has(nId))) {
      const varsBefore = chapterReplayVars;
      const varsAfter = { ...state.variables };
      const cluesHit: string[] = [];
      for (const [key, val] of Object.entries(varsAfter)) {
        if (
          (key.startsWith('clue') || key.startsWith('full_truth')) &&
          varsBefore[key] !== val
        ) {
          cluesHit.push(key);
        }
      }

      const record: ChapterPlayRecord = {
        chapterId: chapterReplayChapterId,
        nodeId: state.currentNodeId,
        variablesBefore: varsBefore,
        variablesAfter: varsAfter,
        choicesMade: [],
        cluesHit,
        trustChanges: [],
        danmakuHighlights: [],
        timestamp: Date.now(),
        playthroughNumber: get(currentPlaythrough)
      };
      addChapterRecord(record);
    }
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
    <GameScene onBackToMenu={handleBackToMenu} onShowEndingsGallery={handleShowEndings} onShowChapterReview={handleShowChapterReview} />
  {/if}

  <EndingsGallery isOpen={showEndings} onClose={handleCloseEndings} />
  <SettingsPanel isOpen={showSettings} onClose={handleCloseSettings} />
  <AchievementsGallery isOpen={showAchievements} onClose={handleCloseAchievements} />
  <ChapterReview isOpen={showChapterReview} onClose={handleCloseChapterReview} onReplayChapter={handleReplayChapter} />
</div>

<style>
  #game-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte';
  import MainMenu from './components/MainMenu.svelte';
  import GameScene from './components/GameScene.svelte';
  import EndingsGallery from './components/EndingsGallery.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import { gameState, resetGameState, loadState } from './lib/store';
  import { goToNode, triggerDanmakusForDialogue } from './lib/engine';
  import { initAudio, stopBGM } from './lib/audio';
  import { resetAnonymousSenderState, restoreAnonymousSenderState } from './lib/anonymousSender';
  import type { GameScene as GameSceneType, SaveSlot } from './types/game';
  import { get } from 'svelte/store';

  let scene: GameSceneType = 'menu';
  let showSettings = false;
  let showEndings = false;

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

  function handleBackToMenu() {
    stopBGM();
    scene = 'menu';
  }

  function handleCloseEndings() {
    showEndings = false;
  }

  function handleCloseSettings() {
    showSettings = false;
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
    />
  {:else if scene === 'playing'}
    <GameScene onBackToMenu={handleBackToMenu} onShowEndingsGallery={handleShowEndings} />
  {/if}

  <EndingsGallery isOpen={showEndings} onClose={handleCloseEndings} />
  <SettingsPanel isOpen={showSettings} onClose={handleCloseSettings} />
</div>

<style>
  #game-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }
</style>

<script lang="ts">
  import { playSFX } from '../lib/audio';
  import { getAllEndings } from '../lib/engine';
  import { unlockedEndings } from '../lib/store';
  import { globalMemory, unlockedClueList, currentPlaythrough } from '../lib/memory';

  export let isOpen: boolean;
  export let onClose: () => void;

  const allEndings = getAllEndings();

  function getEndingPlaythroughs(endingId: string): number[] {
    return $globalMemory.playthroughHistory
      .filter(p => p.endingId === endingId)
      .map(p => p.playthrough);
  }

  function formatPlaythroughs(nums: number[]): string {
    if (nums.length === 0) return '';
    return `第 ${nums.join(', ')} 周目达成`;
  }
</script>

{#if isOpen}
  <div class="overlay" on:click={onClose}>
    <div class="panel" on:click|stopPropagation style="animation: fadeInUp 0.3s ease-out;">
      <button class="close-btn" on:click={() => { playSFX('click'); onClose(); }}>×</button>
      <h2 class="panel-title">结局收集</h2>
      <div class="progress-section">
        <p class="progress-text">已解锁: {$unlockedEndings.length} / {allEndings.length}</p>
        <div class="extra-stats">
          <span class="stat">第 {$currentPlaythrough} 周目</span>
          {#if $unlockedClueList.length > 0}
            <span class="stat clue-stat">🔍 线索: {$unlockedClueList.length}</span>
          {/if}
          <span class="stat">通关次数: {$globalMemory.playthroughHistory.length}</span>
        </div>
      </div>

      {#if $unlockedClueList.length > 0}
        <div class="clues-section">
          <h3 class="clues-title">已收集线索</h3>
          <div class="clues-list">
            {#each $unlockedClueList as clue}
              <div class="clue-item">
                <span class="clue-icon">✦</span>
                <div class="clue-info">
                  <span class="clue-id">{clue.id}</span>
                  <span class="clue-meta">第 {clue.firstPlaythrough} 周目解锁</span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <div class="endings-grid">
        {#each allEndings as ending}
          {@const unlocked = $unlockedEndings.includes(ending.id)}
          {@const playthroughs = getEndingPlaythroughs(ending.id)}
          <div class="ending-card" class:unlocked class:good={ending.isGood} class:bad={!ending.isGood}>
            <div class="ending-icon">
              {#if unlocked}
                {#if ending.isGood}
                  <span class="icon-good">✓</span>
                {:else}
                  <span class="icon-bad">✗</span>
                {/if}
              {:else}
                <span class="icon-locked">?</span>
              {/if}
            </div>
            <div class="ending-info">
              <h3 class="ending-title">
                {#if unlocked}
                  {ending.title}
                {:else}
                  ???
                {/if}
              </h3>
              <p class="ending-desc">
                {#if unlocked}
                  {ending.description}
                {:else}
                  尚未解锁此结局...
                {/if}
              </p>
              <div class="ending-meta">
                <span class="ending-tag" class:good-tag={ending.isGood} class:bad-tag={!ending.isGood}>
                  {#if unlocked}
                    {ending.isGood ? 'Good End' : 'Bad End'}
                  {:else}
                    未解锁
                  {/if}
                </span>
                {#if unlocked && playthroughs.length > 0}
                  <span class="playthrough-tag">{formatPlaythroughs(playthroughs)}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <button class="close-action" on:click={() => { playSFX('click'); onClose(); }}>
        返回
      </button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(8px);
    padding: 16px;
  }

  .panel {
    position: relative;
    background: linear-gradient(180deg, rgba(15, 30, 55, 0.98), rgba(8, 18, 35, 1));
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 12px;
    padding: 24px 20px;
    width: 100%;
    max-width: 520px;
    max-height: 85vh;
    overflow-y: auto;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 16px;
    background: transparent;
    border: none;
    color: #6a8aaa;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }

  .panel-title {
    color: #64b4ff;
    text-align: center;
    margin-bottom: 8px;
    font-size: 1.3rem;
  }

  .progress-section {
    text-align: center;
    margin-bottom: 20px;
  }

  .progress-text {
    color: #8ab0d0;
    font-size: 0.85rem;
    margin: 0 0 8px 0;
  }

  .extra-stats {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .stat {
    font-size: 0.75rem;
    color: #6a8aaa;
    padding: 3px 10px;
    background: rgba(40, 70, 120, 0.3);
    border-radius: 10px;
  }

  .stat.clue-stat {
    color: #ffd890;
    background: rgba(200, 150, 80, 0.2);
  }

  .clues-section {
    margin-bottom: 20px;
    padding: 12px;
    background: rgba(40, 30, 15, 0.3);
    border: 1px solid rgba(255, 200, 100, 0.15);
    border-radius: 8px;
  }

  .clues-title {
    font-size: 0.85rem;
    color: #ffd890;
    margin-bottom: 10px;
    text-align: center;
  }

  .clues-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .clue-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: rgba(255, 200, 100, 0.05);
    border-radius: 4px;
  }

  .clue-icon {
    color: #ffd890;
    font-size: 0.8rem;
  }

  .clue-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 1;
    gap: 8px;
  }

  .clue-id {
    font-size: 0.8rem;
    color: #ffe8c0;
    font-family: 'Courier New', monospace;
  }

  .clue-meta {
    font-size: 0.7rem;
    color: #a08060;
    flex-shrink: 0;
  }

  .endings-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .ending-card {
    display: flex;
    gap: 14px;
    padding: 14px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.15);
    border-radius: 8px;
    opacity: 0.5;
    transition: all 0.3s;
  }

  .ending-card.unlocked {
    opacity: 1;
    background: rgba(25, 50, 85, 0.7);
  }

  .ending-card.unlocked.good {
    border-color: rgba(100, 200, 150, 0.4);
  }

  .ending-card.unlocked.bad {
    border-color: rgba(200, 100, 100, 0.4);
  }

  .ending-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(40, 70, 120, 0.5);
    border-radius: 50%;
    font-size: 1.3rem;
  }

  .ending-card.good .ending-icon {
    background: rgba(60, 150, 100, 0.4);
  }

  .ending-card.bad .ending-icon {
    background: rgba(150, 60, 60, 0.4);
  }

  .icon-good {
    color: #64d4a0;
  }

  .icon-bad {
    color: #d46464;
  }

  .icon-locked {
    color: #5a7a9a;
  }

  .ending-info {
    flex: 1;
    min-width: 0;
  }

  .ending-title {
    color: #d0e4f8;
    font-size: 1rem;
    margin-bottom: 6px;
  }

  .ending-card:not(.unlocked) .ending-title {
    color: #5a7a9a;
  }

  .ending-desc {
    color: #8ab0d0;
    font-size: 0.8rem;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .ending-card:not(.unlocked) .ending-desc {
    color: #4a6a8a;
    font-style: italic;
  }

  .ending-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ending-tag {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 0.7rem;
    background: rgba(100, 180, 255, 0.15);
    color: #8ab0d0;
  }

  .good-tag {
    background: rgba(100, 200, 150, 0.2);
    color: #8ad0b0;
  }

  .bad-tag {
    background: rgba(200, 100, 100, 0.2);
    color: #d08a8a;
  }

  .playthrough-tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.65rem;
    background: rgba(255, 200, 100, 0.15);
    color: #c0a070;
    font-family: 'Courier New', monospace;
  }

  .close-action {
    display: block;
    margin: 0 auto;
    padding: 10px 32px;
    background: rgba(40, 70, 120, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .close-action:hover {
    background: rgba(60, 100, 170, 0.7);
  }

  @media (max-width: 480px) {
    .panel {
      padding: 20px 14px;
    }

    .ending-card {
      padding: 12px;
      gap: 10px;
    }

    .ending-icon {
      width: 38px;
      height: 38px;
      font-size: 1.1rem;
    }

    .ending-title {
      font-size: 0.9rem;
    }

    .ending-desc {
      font-size: 0.75rem;
    }
  }
</style>

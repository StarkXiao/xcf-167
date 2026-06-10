<script lang="ts">
  import { playSFX } from '../lib/audio';
  import { getCurrentReplayChapter, getCurrentReplayProgress } from '../lib/chapterReview';
  import { get } from 'svelte/store';

  export let isOpen: boolean;
  export let onContinue: () => void;
  export let onKeepGoing: () => void;
  export let onSaveAndExit: () => void;

  $: chapter = getCurrentReplayChapter();
  $: progress = getCurrentReplayProgress();

  function handleContinue() {
    playSFX('select');
    onContinue();
  }

  function handleKeepGoing() {
    playSFX('click');
    onKeepGoing();
  }

  function handleSaveAndExit() {
    playSFX('select');
    onSaveAndExit();
  }
</script>

{#if isOpen && chapter}
  <div class="overlay" on:click|stopPropagation>
    <div class="panel" style="animation: fadeInUp 0.4s ease-out;">
      <div class="chapter-end-header">
        <span class="chapter-end-badge">
          {chapter.depth || ''}
        </span>
        <h2 class="chapter-end-title">章节完成</h2>
        <h3 class="chapter-end-subtitle">{chapter.title}</h3>
      </div>

      <div class="progress-section">
        <div class="progress-label">
          <span>章节探索进度</span>
          <span>{progress.current} / {progress.total} 节点</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            style="width: {progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%;"
          ></div>
        </div>
      </div>

      <p class="chapter-end-hint">
        本章所有选择与变量变化已自动记录到案情复盘档案
      </p>

      <div class="chapter-end-actions">
        <button class="action-btn primary" on:click={handleContinue}>
          <span>📋 查看复盘</span>
        </button>
        <button class="action-btn" on:click={handleSaveAndExit}>
          <span>💾 保存并退出</span>
        </button>
        <button class="action-btn subtle" on:click={handleKeepGoing}>
          <span>▶ 继续推进剧情</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 10, 25, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 150;
    backdrop-filter: blur(10px);
    padding: 16px;
  }

  .panel {
    position: relative;
    background: linear-gradient(180deg, rgba(15, 35, 65, 0.98), rgba(5, 15, 30, 1));
    border: 1px solid rgba(100, 180, 255, 0.35);
    border-radius: 14px;
    padding: 32px 28px;
    width: 100%;
    max-width: 420px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 100, 200, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .chapter-end-header {
    margin-bottom: 24px;
  }

  .chapter-end-badge {
    display: inline-block;
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #5a9aba;
    background: rgba(40, 80, 130, 0.4);
    padding: 4px 12px;
    border-radius: 12px;
    margin-bottom: 12px;
    letter-spacing: 0.05em;
  }

  .chapter-end-title {
    color: #64b4ff;
    font-size: 0.9rem;
    font-weight: 500;
    margin: 0 0 4px 0;
    letter-spacing: 0.3em;
  }

  .chapter-end-subtitle {
    color: #e0f0ff;
    font-size: 1.4rem;
    margin: 0;
    font-weight: 600;
  }

  .progress-section {
    margin-bottom: 20px;
    padding: 16px;
    background: rgba(20, 45, 80, 0.4);
    border-radius: 8px;
    text-align: left;
  }

  .progress-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.78rem;
    color: #8ab0d0;
    margin-bottom: 8px;
  }

  .progress-bar {
    height: 6px;
    background: rgba(40, 70, 120, 0.5);
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a90d0, #64b4ff);
    border-radius: 3px;
    transition: width 0.6s ease-out;
  }

  .chapter-end-hint {
    color: #6a8aaa;
    font-size: 0.78rem;
    margin: 0 0 24px 0;
    line-height: 1.5;
  }

  .chapter-end-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    width: 100%;
    padding: 12px 20px;
    background: rgba(30, 55, 90, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.25);
    border-radius: 6px;
    color: #c0d8f0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(50, 85, 140, 0.6);
    border-color: rgba(100, 180, 255, 0.5);
    transform: translateY(-1px);
  }

  .action-btn.primary {
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.7), rgba(40, 80, 160, 0.7));
    border-color: rgba(100, 180, 255, 0.6);
    color: #e8f4ff;
    font-weight: 500;
  }

  .action-btn.primary:hover {
    background: linear-gradient(135deg, rgba(70, 140, 220, 0.8), rgba(50, 100, 180, 0.8));
  }

  .action-btn.subtle {
    background: transparent;
    border-color: rgba(100, 180, 255, 0.15);
    color: #8ab0d0;
  }

  .action-btn.subtle:hover {
    background: rgba(40, 70, 120, 0.3);
    border-color: rgba(100, 180, 255, 0.3);
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    .panel {
      padding: 24px 20px;
    }

    .chapter-end-subtitle {
      font-size: 1.2rem;
    }
  }
</style>

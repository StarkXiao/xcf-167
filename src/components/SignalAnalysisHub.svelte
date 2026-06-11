<script lang="ts">
  import { onMount } from 'svelte';
  import type { SignalAnalysisModule } from '../types/game';
  import {
    signalAnalysis,
    availableSonarChallenges,
    availableNoiseChallenges,
    availableSubtitleChallenges,
    totalCompletedChallenges,
    closeSignalHub,
    selectModule,
    backToHubView,
    startChallenge,
    unlockAllModules
  } from '../lib/signalAnalysis';
  import { sonarChallenges, noiseChallenges, subtitleChallenges } from '../data/signalAnalysis';
  import { playSFX } from '../lib/audio';
  import SonarSpectrum from './SonarSpectrum.svelte';
  import NoiseRecognition from './NoiseRecognition.svelte';
  import SubtitleCorrection from './SubtitleCorrection.svelte';

  export let onClose: () => void;

  $: activeModule = $signalAnalysis.activeModule;
  $: activeChallengeId = $signalAnalysis.activeChallengeId;

  $: activeSonarChallenge = activeModule === 'sonar' && activeChallengeId
    ? sonarChallenges.find(c => c.id === activeChallengeId)
    : null;

  $: activeNoiseChallenge = activeModule === 'noise' && activeChallengeId
    ? noiseChallenges.find(c => c.id === activeChallengeId)
    : null;

  $: activeSubtitleChallenge = activeModule === 'subtitle' && activeChallengeId
    ? subtitleChallenges.find(c => c.id === activeChallengeId)
    : null;

  $: totalChallenges = sonarChallenges.length + noiseChallenges.length + subtitleChallenges.length;

  const moduleInfo: Record<SignalAnalysisModule, {
    name: string;
    icon: string;
    description: string;
    color: string;
    bgGradient: string;
  }> = {
    sonar: {
      name: '声呐图谱分析',
      icon: '📡',
      description: '解析深度扫描的声呐回波数据，识别人造信号模式和异常频率特征',
      color: '#66ccff',
      bgGradient: 'linear-gradient(135deg, rgba(50,120,180,0.25), rgba(30,60,100,0.1))'
    },
    noise: {
      name: '噪声识别',
      icon: '🎧',
      description: '从舱内舱外多轨录音中分离有效信号，定位加密通讯和异常声纹',
      color: '#ffaa66',
      bgGradient: 'linear-gradient(135deg, rgba(180,120,50,0.25), rgba(100,60,30,0.1))'
    },
    subtitle: {
      name: '字幕纠错',
      icon: '✍️',
      description: '修复信号干扰导致的字幕损坏，还原被篡改的关键对话内容',
      color: '#cc88ff',
      bgGradient: 'linear-gradient(135deg, rgba(140,80,180,0.25), rgba(80,40,100,0.1))'
    }
  };

  const moduleKeys: SignalAnalysisModule[] = ['sonar', 'noise', 'subtitle'];

  function getModuleProgress(module: SignalAnalysisModule): { completed: number; total: number } {
    let arr;
    switch (module) {
      case 'sonar':
        arr = $availableSonarChallenges;
        break;
      case 'noise':
        arr = $availableNoiseChallenges;
        break;
      case 'subtitle':
        arr = $availableSubtitleChallenges;
        break;
    }
    return {
      completed: arr.filter(c => c.effectiveStatus === 'completed').length,
      total: arr.length
    };
  }

  function getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'available': return 'status-available';
      case 'in_progress': return 'status-progress';
      case 'locked':
      default: return 'status-locked';
    }
  }

  function getStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return '已完成';
      case 'available': return '可挑战';
      case 'in_progress': return '进行中';
      case 'locked':
      default: return '未解锁';
    }
  }

  function getDifficultyColor(diff: string): string {
    switch (diff) {
      case 'easy': return '#66ff99';
      case 'medium': return '#ffcc66';
      case 'hard': return '#ff6666';
      default: return '#cccccc';
    }
  }

  function getDifficultyLabel(diff: string): string {
    switch (diff) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return diff;
    }
  }

  function handleStartChallenge(module: SignalAnalysisModule, challengeId: string, status: string) {
    if (status === 'locked') {
      playSFX('warning');
      return;
    }
    startChallenge(module, challengeId);
  }

  function handleBackFromModule() {
    backToHubView();
  }

  function handleClose() {
    closeSignalHub();
    onClose();
  }

  onMount(() => {
    unlockAllModules();
  });
</script>

<div class="signal-hub-overlay">
  <div class="signal-hub-container">
    <div class="hub-header">
      <div class="hub-title-section">
        <div class="hub-icon">🔬</div>
        <div>
          <h1>异常信号解析</h1>
          <p class="hub-subtitle">深度取证分析系统 · 分支任务模块</p>
        </div>
      </div>

      <div class="hub-stats">
        <div class="stat-item">
          <span class="stat-value">{$totalCompletedChallenges}</span>
          <span class="stat-divider">/</span>
          <span class="stat-total">{totalChallenges}</span>
          <span class="stat-label">任务完成</span>
        </div>
        <div class="stat-item score">
          <span class="stat-value">{$signalAnalysis.totalScore}</span>
          <span class="stat-label">累计得分</span>
        </div>
      </div>

      <button class="close-btn" on:click={handleClose}>
        ✕ 关闭
      </button>
    </div>

    {#if !activeModule}
      <div class="module-selection">
        <div class="modules-grid">
          {#each moduleKeys as moduleKey}
            {@const info = moduleInfo[moduleKey]}
            {@const progress = getModuleProgress(moduleKey)}
            {@const unlocked = $signalAnalysis.modulesUnlocked[moduleKey]}
            <div
              class="module-card"
              class:unlocked={unlocked}
              style="background: {info.bgGradient}; border-color: {info.color}33;"
              on:click={() => unlocked && selectModule(moduleKey)}
            >
              <div class="module-header">
                <span class="module-icon" style="filter: drop-shadow(0 0 10px {info.color}66)">{info.icon}</span>
                <div class="module-progress-badge">
                  {progress.completed}/{progress.total}
                </div>
              </div>

              <h2 style="color: {info.color}">{info.name}</h2>
              <p class="module-desc">{info.description}</p>

              <div class="module-progress">
                <div class="progress-bar-bg">
                  <div
                    class="progress-bar-fill"
                    style="width: {progress.total > 0 ? (progress.completed / progress.total * 100) : 0}%; background: {info.color};"
                  ></div>
                </div>
                <span class="progress-text">{Math.round(progress.total > 0 ? (progress.completed / progress.total * 100) : 0)}%</span>
              </div>

              {#if !unlocked}
                <div class="module-locked-overlay">
                  <span>🔒 完成前置任务后解锁</span>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        <div class="system-notice">
          <span class="notice-icon">ℹ️</span>
          <div class="notice-content">
            <strong>系统提示：</strong>
            支线任务的完成情况会<strong>反向影响</strong>主剧情的结局判定。
            解析出的关键信号将解锁新的推理线索和证据，改变各结局的发生概率。
          </div>
        </div>
      </div>
    {:else if activeModule === 'sonar'}
      {#if !activeSonarChallenge}
        <div class="challenge-list-view">
          <div class="list-header">
            <button class="back-btn" on:click={handleBackFromModule}>← 返回模块选择</button>
            <h2 style="color: {moduleInfo.sonar.color}">
              {moduleInfo.sonar.icon} {moduleInfo.sonar.name} · 任务列表
            </h2>
          </div>
          <div class="challenges-grid">
            {#each $availableSonarChallenges as challenge, i}
              <div
                class="challenge-card {getStatusClass(challenge.effectiveStatus)}"
                on:click={() => handleStartChallenge('sonar', challenge.id, challenge.effectiveStatus)}
              >
                <div class="challenge-index">#{i + 1}</div>
                <div class="challenge-body">
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description.slice(0, 50)}...</p>
                  <div class="challenge-meta">
                    <span class="difficulty" style="color: {getDifficultyColor(challenge.difficulty)}">
                      ● {getDifficultyLabel(challenge.difficulty)}
                    </span>
                    <span class="challenge-status {getStatusClass(challenge.effectiveStatus)}">
                      {getStatusLabel(challenge.effectiveStatus)}
                    </span>
                  </div>
                  {#if challenge.progress?.score > 0}
                    <div class="challenge-score">最高分：{challenge.progress.score}</div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <SonarSpectrum challenge={activeSonarChallenge} />
      {/if}
    {:else if activeModule === 'noise'}
      {#if !activeNoiseChallenge}
        <div class="challenge-list-view">
          <div class="list-header">
            <button class="back-btn" on:click={handleBackFromModule}>← 返回模块选择</button>
            <h2 style="color: {moduleInfo.noise.color}">
              {moduleInfo.noise.icon} {moduleInfo.noise.name} · 任务列表
            </h2>
          </div>
          <div class="challenges-grid">
            {#each $availableNoiseChallenges as challenge, i}
              <div
                class="challenge-card {getStatusClass(challenge.effectiveStatus)}"
                on:click={() => handleStartChallenge('noise', challenge.id, challenge.effectiveStatus)}
              >
                <div class="challenge-index">#{i + 1}</div>
                <div class="challenge-body">
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description.slice(0, 50)}...</p>
                  <div class="challenge-meta">
                    <span class="difficulty" style="color: {getDifficultyColor(challenge.difficulty)}">
                      ● {getDifficultyLabel(challenge.difficulty)}
                    </span>
                    <span class="challenge-status {getStatusClass(challenge.effectiveStatus)}">
                      {getStatusLabel(challenge.effectiveStatus)}
                    </span>
                  </div>
                  {#if challenge.progress?.score > 0}
                    <div class="challenge-score">最高分：{challenge.progress.score}</div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <NoiseRecognition challenge={activeNoiseChallenge} />
      {/if}
    {:else if activeModule === 'subtitle'}
      {#if !activeSubtitleChallenge}
        <div class="challenge-list-view">
          <div class="list-header">
            <button class="back-btn" on:click={handleBackFromModule}>← 返回模块选择</button>
            <h2 style="color: {moduleInfo.subtitle.color}">
              {moduleInfo.subtitle.icon} {moduleInfo.subtitle.name} · 任务列表
            </h2>
          </div>
          <div class="challenges-grid">
            {#each $availableSubtitleChallenges as challenge, i}
              <div
                class="challenge-card {getStatusClass(challenge.effectiveStatus)}"
                on:click={() => handleStartChallenge('subtitle', challenge.id, challenge.effectiveStatus)}
              >
                <div class="challenge-index">#{i + 1}</div>
                <div class="challenge-body">
                  <h3>{challenge.title}</h3>
                  <p>{challenge.description.slice(0, 50)}...</p>
                  <div class="challenge-meta">
                    <span class="difficulty" style="color: {getDifficultyColor(challenge.difficulty)}">
                      ● {getDifficultyLabel(challenge.difficulty)}
                    </span>
                    <span class="challenge-status {getStatusClass(challenge.effectiveStatus)}">
                      {getStatusLabel(challenge.effectiveStatus)}
                    </span>
                  </div>
                  {#if challenge.progress?.score > 0}
                    <div class="challenge-score">最高分：{challenge.progress.score}</div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <SubtitleCorrection challenge={activeSubtitleChallenge} />
      {/if}
    {/if}
  </div>
</div>

<style>
  .signal-hub-overlay {
    position: fixed;
    inset: 0;
    background: rgba(5, 10, 20, 0.85);
    backdrop-filter: blur(8px);
    z-index: 950;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .signal-hub-container {
    width: 100%;
    max-width: 1100px;
    max-height: 92vh;
    background: linear-gradient(180deg, rgba(15, 30, 50, 0.98), rgba(10, 20, 35, 0.98));
    border: 1px solid #3a5070;
    border-radius: 16px;
    box-shadow:
      0 0 0 1px rgba(100, 160, 220, 0.1),
      0 20px 60px rgba(0, 0, 0, 0.6),
      0 0 100px rgba(80, 140, 200, 0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .hub-header {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 18px 24px;
    border-bottom: 1px solid #2a3a50;
    background: linear-gradient(180deg, rgba(30, 50, 80, 0.5), transparent);
    flex-shrink: 0;
  }

  .hub-title-section {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
  }

  .hub-icon {
    font-size: 32px;
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(100, 160, 220, 0.1);
    border: 1px solid rgba(100, 160, 220, 0.3);
    border-radius: 12px;
  }

  .hub-title-section h1 {
    margin: 0;
    font-size: 20px;
    color: #e0ecf8;
    letter-spacing: 1px;
  }

  .hub-subtitle {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #6688aa;
    letter-spacing: 0.5px;
  }

  .hub-stats {
    display: flex;
    gap: 20px;
  }

  .stat-item {
    display: flex;
    align-items: baseline;
    gap: 4px;
    padding: 8px 16px;
    background: rgba(40, 60, 90, 0.4);
    border: 1px solid #3a4a60;
    border-radius: 10px;
  }

  .stat-item.score {
    background: rgba(255, 200, 100, 0.08);
    border-color: rgba(255, 200, 100, 0.25);
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: #88ccff;
    font-family: 'SF Mono', monospace;
  }

  .stat-item.score .stat-value {
    color: #ffcc88;
  }

  .stat-divider {
    color: #556677;
    font-size: 18px;
  }

  .stat-total {
    font-size: 16px;
    color: #557799;
  }

  .stat-label {
    margin-left: 8px;
    font-size: 11px;
    color: #667788;
  }

  .close-btn {
    background: rgba(120, 50, 50, 0.2);
    border: 1px solid rgba(200, 80, 80, 0.3);
    color: #dd9999;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(180, 60, 60, 0.3);
    color: #ffaaaa;
    border-color: rgba(220, 100, 100, 0.4);
  }

  .module-selection {
    padding: 28px;
    overflow-y: auto;
    flex: 1;
  }

  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .module-card {
    border: 1px solid;
    border-radius: 14px;
    padding: 22px;
    cursor: pointer;
    transition: all 0.25s ease;
    position: relative;
    overflow: hidden;
  }

  .module-card:hover.unlocked {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  }

  .module-card:not(.unlocked) {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .module-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .module-icon {
    font-size: 38px;
  }

  .module-progress-badge {
    background: rgba(0, 0, 0, 0.35);
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #aaccee;
    font-family: monospace;
  }

  .module-card h2 {
    margin: 0 0 10px 0;
    font-size: 18px;
  }

  .module-desc {
    margin: 0 0 16px 0;
    font-size: 13px;
    color: #99aabb;
    line-height: 1.7;
    min-height: 52px;
  }

  .module-progress {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .progress-bar-bg {
    flex: 1;
    height: 8px;
    background: rgba(0, 0, 0, 0.35);
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
    box-shadow: 0 0 8px currentColor;
  }

  .progress-text {
    font-size: 12px;
    color: #8899aa;
    font-family: monospace;
    min-width: 40px;
    text-align: right;
  }

  .module-locked-overlay {
    position: absolute;
    inset: 0;
    background: rgba(10, 15, 25, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
  }

  .module-locked-overlay span {
    color: #8899aa;
    font-size: 13px;
    padding: 6px 14px;
    background: rgba(60, 80, 100, 0.5);
    border-radius: 8px;
  }

  .system-notice {
    display: flex;
    gap: 14px;
    padding: 16px 20px;
    background: linear-gradient(135deg, rgba(100, 160, 220, 0.08), rgba(150, 100, 200, 0.08));
    border: 1px solid rgba(100, 160, 220, 0.2);
    border-radius: 12px;
  }

  .notice-icon {
    font-size: 22px;
    flex-shrink: 0;
  }

  .notice-content {
    font-size: 13px;
    color: #aabbcc;
    line-height: 1.7;
  }

  .notice-content strong {
    color: #ccddee;
  }

  .challenge-list-view {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .list-header {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 22px;
  }

  .back-btn {
    background: transparent;
    border: 1px solid #3a4a60;
    color: #88aacc;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
  }

  .back-btn:hover {
    background: rgba(80, 120, 160, 0.15);
    color: #aaccee;
  }

  .list-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .challenges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 14px;
  }

  .challenge-card {
    display: flex;
    gap: 14px;
    background: rgba(15, 28, 45, 0.75);
    border: 1px solid #2a3a50;
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .challenge-card:hover:not(.status-locked) {
    border-color: #4a6a8a;
    transform: translateX(3px);
  }

  .challenge-card.status-completed {
    border-color: rgba(102, 255, 153, 0.35);
    background: rgba(102, 255, 153, 0.04);
  }

  .challenge-card.status-locked {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .challenge-index {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(80, 120, 180, 0.15);
    border: 1px solid rgba(100, 150, 200, 0.25);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    color: #88bbee;
    font-family: monospace;
    flex-shrink: 0;
  }

  .challenge-card.status-completed .challenge-index {
    background: rgba(102, 255, 153, 0.1);
    border-color: rgba(102, 255, 153, 0.25);
    color: #88ffbb;
  }

  .challenge-body {
    flex: 1;
    min-width: 0;
  }

  .challenge-body h3 {
    margin: 0 0 6px 0;
    font-size: 14px;
    color: #dde7f0;
  }

  .challenge-body p {
    margin: 0 0 10px 0;
    font-size: 12px;
    color: #778899;
    line-height: 1.6;
  }

  .challenge-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .difficulty {
    font-size: 11px;
    font-weight: 600;
  }

  .challenge-status {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 8px;
  }

  .challenge-status.status-completed {
    background: rgba(102, 255, 153, 0.12);
    color: #88ffbb;
  }
  .challenge-status.status-available {
    background: rgba(102, 200, 255, 0.12);
    color: #88ccff;
  }
  .challenge-status.status-progress {
    background: rgba(255, 200, 102, 0.12);
    color: #ffcc88;
  }
  .challenge-status.status-locked {
    background: rgba(100, 100, 120, 0.2);
    color: #778899;
  }

  .challenge-score {
    margin-top: 8px;
    font-size: 11px;
    color: #ffcc88;
    font-family: monospace;
  }
</style>

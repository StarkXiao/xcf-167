<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { audioLogEntries } from '../data/archive';
  import { evidenceCards } from '../data/evidence';
  import { initAudio, playSFX, stopBGM } from '../lib/audio';
  import type { SFXType } from '../types/game';

  let playingId: string | null = null;
  let loopEnabled = false;
  let volume = 0.7;
  let waveform: number[] = [];
  let animFrame: number | null = null;
  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let playbackCount = 0;

  $: currentEntry = audioLogEntries.find(e => e.id === playingId);

  function handlePlay(entry: typeof audioLogEntries[0]) {
    initAudio();
    if (playingId === entry.id) {
      playingId = null;
      waveform = [];
      return;
    }
    playingId = entry.id;
    playbackCount++;
    const sfxType = entry.sfxType as SFXType;
    if (loopEnabled) {
      playLooping(sfxType);
    } else {
      playSFX(sfxType, volume);
    }
    startWaveform();
  }

  let loopInterval: number | null = null;

  function playLooping(sfxType: SFXType) {
    stopLooping();
    playSFX(sfxType, volume);
    loopInterval = window.setInterval(() => {
      if (playingId) playSFX(sfxType, volume);
    }, 2000);
  }

  function stopLooping() {
    if (loopInterval !== null) {
      clearInterval(loopInterval);
      loopInterval = null;
    }
  }

  function startWaveform() {
    if (animFrame) cancelAnimationFrame(animFrame);
    const update = () => {
      if (!playingId) { waveform = []; return; }
      waveform = Array.from({ length: 32 }, (_, i) =>
        Math.sin(Date.now() / 200 + i * 0.5) * 0.3 + Math.random() * 0.15 + 0.05
      );
      animFrame = requestAnimationFrame(update);
    };
    update();
  }

  function handleStopAll() {
    playingId = null;
    stopLooping();
    waveform = [];
    if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  }

  function handleVolumeChange(e: Event) {
    const input = e.target as HTMLInputElement;
    volume = parseFloat(input.value);
  }

  function getRelatedEvidence(entry: typeof audioLogEntries[0]) {
    return evidenceCards.filter(e => entry.id === e.id || (e.sfxType && e.sfxType === entry.sfxType));
  }

  onDestroy(() => {
    handleStopAll();
  });
</script>

<div class="audio-view">
  <div class="audio-controls-bar">
    <div class="volume-control">
      <span class="vol-label">🔊 音量</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        bind:value={volume}
        on:input={handleVolumeChange}
        class="vol-slider"
      />
      <span class="vol-value">{Math.round(volume * 100)}%</span>
    </div>
    <label class="loop-toggle">
      <input type="checkbox" bind:checked={loopEnabled} on:change={() => { if (!loopEnabled) stopLooping(); }} />
      <span class="loop-label">循环播放</span>
    </label>
    <button class="stop-btn" on:click={handleStopAll}>⏹ 全部停止</button>
  </div>

  {#if playingId && currentEntry}
    <div class="now-playing">
      <div class="np-indicator">
        <span class="np-pulse"></span>
        <span class="np-text">正在播放</span>
      </div>
      <div class="np-title">{currentEntry.title}</div>
      <div class="waveform">
        {#each waveform as val, i}
          <div class="wave-bar" style="height: {val * 100}%;"></div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="audio-logs">
    {#each audioLogEntries as entry (entry.id)}
      {@const related = getRelatedEvidence(entry)}
      <div class="audio-log-card" class:playing={playingId === entry.id}>
        <div class="al-header">
          <div class="al-info">
            <span class="al-type">🔊 声效记录</span>
            <h4 class="al-title">{entry.title}</h4>
          </div>
          <button
            class="play-btn"
            class:active={playingId === entry.id}
            on:click={() => handlePlay(entry)}
          >
            {playingId === entry.id ? '⏸' : '▶'}
          </button>
        </div>
        <p class="al-desc">{entry.description}</p>
        <div class="al-cases">
          <span class="al-cases-label">关联案件：</span>
          {#each entry.relatedCases as rcid}
            <span class="al-case-tag">{rcid}</span>
          {/each}
        </div>
        {#if related.length > 0}
          <div class="al-evidence-refs">
            <span class="al-ev-label">关联证据：</span>
            {#each related as ev}
              <span class="al-ev-tag" style="border-left: 3px solid {ev.color || '#64b5f6'};">{ev.title}</span>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="audio-stats">
    <span class="audio-stat">共 {audioLogEntries.length} 条声效记录</span>
    <span class="audio-stat">已播放 {playbackCount} 次</span>
  </div>
</div>

<style>
  .audio-view {
    padding: 22px 26px;
    height: 100%;
    overflow-y: auto;
  }

  .audio-controls-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 14px 18px;
    background: rgba(15, 25, 45, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.2);
    border-radius: 10px;
    margin-bottom: 18px;
    flex-wrap: wrap;
  }

  .volume-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .vol-label { font-size: 0.8rem; color: #7090b0; }

  .vol-slider {
    width: 100px;
    accent-color: #4488cc;
  }

  .vol-value {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #6ab0e8;
    min-width: 32px;
  }

  .loop-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  .loop-toggle input { accent-color: #4488cc; }
  .loop-label { font-size: 0.8rem; color: #90b8d0; }

  .stop-btn {
    padding: 6px 14px;
    background: rgba(80, 40, 40, 0.5);
    border: 1px solid rgba(255, 100, 100, 0.25);
    border-radius: 6px;
    color: #ff9090;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.2s;
    margin-left: auto;
  }

  .stop-btn:hover { background: rgba(120, 40, 40, 0.6); }

  .now-playing {
    padding: 18px 22px;
    background: linear-gradient(135deg, rgba(20, 40, 70, 0.6), rgba(15, 30, 55, 0.8));
    border: 1px solid rgba(60, 130, 200, 0.35);
    border-radius: 10px;
    margin-bottom: 18px;
  }

  .np-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .np-pulse {
    width: 8px;
    height: 8px;
    background: #44cc88;
    border-radius: 50%;
    animation: pulse 1.2s infinite;
  }

  .np-text {
    font-size: 0.72rem;
    color: #44cc88;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
  }

  .np-title {
    font-size: 1rem;
    color: #c0d8f0;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .waveform {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 40px;
  }

  .wave-bar {
    flex: 1;
    background: linear-gradient(180deg, #4488cc, #2a5588);
    border-radius: 2px 2px 0 0;
    min-height: 3px;
    transition: height 0.1s;
  }

  .audio-logs {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .audio-log-card {
    padding: 16px 18px;
    background: rgba(15, 25, 45, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.18);
    border-radius: 10px;
    transition: all 0.2s;
  }

  .audio-log-card.playing {
    border-color: rgba(60, 180, 120, 0.4);
    background: rgba(20, 45, 50, 0.5);
  }

  .al-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 8px;
  }

  .al-type {
    font-size: 0.68rem;
    color: #5090c0;
    padding: 2px 8px;
    background: rgba(60, 130, 200, 0.08);
    border-radius: 3px;
  }

  .al-title {
    font-size: 0.95rem;
    color: #c0d8f0;
    margin: 6px 0 0 0;
    font-weight: 600;
  }

  .play-btn {
    width: 40px;
    height: 40px;
    background: rgba(40, 70, 120, 0.5);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 50%;
    color: #a0d0ff;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .play-btn:hover { background: rgba(60, 100, 160, 0.6); }
  .play-btn.active { background: rgba(60, 160, 100, 0.5); border-color: rgba(60, 180, 120, 0.5); color: #88ffcc; }

  .al-desc {
    font-size: 0.82rem;
    color: #8098b0;
    line-height: 1.6;
    margin: 0 0 10px 0;
  }

  .al-cases {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .al-cases-label { font-size: 0.72rem; color: #5090b0; }

  .al-case-tag {
    font-size: 0.68rem;
    padding: 2px 8px;
    background: rgba(60, 130, 200, 0.1);
    border-radius: 3px;
    color: #7090b0;
  }

  .al-evidence-refs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .al-ev-label { font-size: 0.72rem; color: #5090b0; }

  .al-ev-tag {
    font-size: 0.72rem;
    padding: 3px 10px;
    background: rgba(20, 35, 60, 0.5);
    border-radius: 4px;
    color: #90b8d0;
  }

  .audio-stats {
    display: flex;
    gap: 16px;
    margin-top: 18px;
    padding-top: 14px;
    border-top: 1px solid rgba(60, 130, 200, 0.15);
  }

  .audio-stat { font-size: 0.72rem; color: #405878; }

  @media (max-width: 600px) {
    .audio-view { padding: 16px; }
    .audio-controls-bar { flex-direction: column; align-items: flex-start; }
    .stop-btn { margin-left: 0; }
  }
</style>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { settings } from '../lib/store';
  import { signalCorruption, getVisualArtifactChance } from '../lib/signalCorruption';
  import { currentPlaythrough } from '../lib/memory';
  import type { Danmaku } from '../types/game';

  export let danmakus: Danmaku[];

  let container: HTMLElement;
  let occupiedTracks: Map<string, { endTime: number; track: number }> = new Map();
  const TRACK_COUNT = 6;

  $: danmakuEnabled = $settings.danmakuEnabled;
  $: danmakuSpeed = $settings.danmakuSpeed;
  $: corruptionLevel = $signalCorruption.level;
  $: artifactChance = getVisualArtifactChance(corruptionLevel);
  $: pseudoLiveMode = $settings.pseudoLiveMode;
  $: showBackstageView = $settings.showBackstageView;
  $: playthrough = $currentPlaythrough;

  function getTrack(danmakuId: string, width: number): number {
    const now = Date.now();
    const duration = (8000 / danmakuSpeed);
    
    for (let i = 0; i < TRACK_COUNT; i++) {
      let occupied = false;
      for (const [, info] of occupiedTracks) {
        if (info.track === i && info.endTime > now - 2000) {
          occupied = true;
          break;
        }
      }
      if (!occupied) {
        occupiedTracks.set(danmakuId, { endTime: now + duration, track: i });
        return i;
      }
    }
    return Math.floor(Math.random() * TRACK_COUNT);
  }

  function getDanmakuStyle(d: Danmaku, track: number): string {
    const baseDuration = 8 / danmakuSpeed;
    let duration = corruptionLevel > 40 ? baseDuration * (0.7 + Math.random() * 0.6) : baseDuration;
    if (pseudoLiveMode && d.isBackstageOnly) {
      duration = duration * 1.3;
    }
    const color = d.color || '#ffffff';
    let style = `top: calc(${track} * (100% / ${TRACK_COUNT}) + 5%); animation-duration: ${duration}s; color: ${color};`;
    if (corruptionLevel > 50 && Math.random() < (corruptionLevel - 50) / 100) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 10;
      style += ` transform: translate(${offsetX}px, ${offsetY}px);`;
    }
    if (pseudoLiveMode && d.isBackstageOnly) {
      style += ' letter-spacing: 0.02em;';
    }
    return style;
  }

  onDestroy(() => {
    occupiedTracks.clear();
  });
</script>

{#if danmakuEnabled}
  <div 
    class="danmaku-layer" 
    bind:this={container}
    class:corrupted={corruptionLevel >= 30}
    class:heavily-corrupted={corruptionLevel >= 65}
    class:pseudo-live={pseudoLiveMode}
    class:backstage-enabled={pseudoLiveMode && showBackstageView && playthrough >= 2}
  >
    {#if corruptionLevel >= 40}
      <div class="danmaku-noise-overlay"></div>
    {/if}
    {#if pseudoLiveMode && playthrough >= 2}
      <div class="backstage-indicator">
        <span class="bs-dot"></span>
        <span class="bs-label">后台视角 · 第{playthrough}周目</span>
      </div>
    {/if}
    {#each danmakus as d}
      {@const track = getTrack(d.id, 200)}
      <div 
        class="danmaku-item"
        style={getDanmakuStyle(d, track)}
        class:important={d.isImportant}
        class:glitched={corruptionLevel >= 45 && Math.random() < (corruptionLevel - 40) / 100}
        class:backstage-only={pseudoLiveMode && d.isBackstageOnly}
        class:playthrough-gated={d.playthroughRequired && playthrough >= d.playthroughRequired}
      >
        {#if pseudoLiveMode && d.isBackstageOnly}
          <span class="dm-tag">[后台]</span>
        {/if}
        {#if d.isImportant && playthrough >= 2}
          <span class="dm-tag dm-tag-important">[关键]</span>
        {/if}
        <span class="dm-username">{d.username}:</span>
        <span class="dm-content">{d.content}</span>
      </div>
    {/each}
  </div>
{/if}

<style>
  .danmaku-layer {
    position: absolute;
    top: 5%;
    left: 0;
    right: 0;
    height: 55%;
    pointer-events: none;
    overflow: hidden;
    z-index: 20;
  }

  .danmaku-item {
    position: absolute;
    white-space: nowrap;
    font-size: 0.85rem;
    padding: 2px 8px;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 4px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    animation: danmakuMove linear forwards;
    font-family: 'Microsoft YaHei', sans-serif;
  }

  .danmaku-item.important {
    background: rgba(255, 80, 80, 0.3);
    border: 1px solid rgba(255, 100, 100, 0.5);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .danmaku-item.backstage-only {
    background: linear-gradient(90deg, rgba(255, 200, 80, 0.25), rgba(200, 100, 255, 0.25));
    border: 1px solid rgba(255, 200, 100, 0.5);
    font-family: 'Courier New', monospace;
  }

  .danmaku-item.playthrough-gated {
    background: rgba(100, 255, 180, 0.2);
    border: 1px solid rgba(100, 255, 180, 0.4);
  }

  .dm-tag {
    font-size: 0.65rem;
    padding: 1px 6px;
    border-radius: 8px;
    margin-right: 6px;
    background: rgba(255, 200, 100, 0.3);
    border: 1px solid rgba(255, 200, 100, 0.5);
    color: #ffd890;
  }

  .dm-tag-important {
    background: rgba(255, 100, 100, 0.3);
    border: 1px solid rgba(255, 100, 100, 0.5);
    color: #ff9090;
  }

  .danmaku-layer.pseudo-live {
    border-top: 1px solid rgba(100, 180, 255, 0.2);
  }

  .danmaku-layer.backstage-enabled {
    box-shadow: inset 0 0 60px rgba(255, 200, 100, 0.05);
  }

  .backstage-indicator {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: rgba(40, 30, 15, 0.8);
    border: 1px solid rgba(255, 200, 100, 0.4);
    border-radius: 20px;
    font-family: 'Courier New', monospace;
    font-size: 0.7rem;
    color: #ffd890;
    z-index: 5;
    backdrop-filter: blur(6px);
  }

  .bs-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ffc864;
    animation: bsBlink 1.2s infinite;
  }

  @keyframes bsBlink {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(255, 200, 100, 0.8); }
    50% { opacity: 0.4; box-shadow: 0 0 2px rgba(255, 200, 100, 0.3); }
  }

  .bs-label {
    letter-spacing: 0.08em;
  }

  .dm-username {
    opacity: 0.7;
    margin-right: 4px;
    font-size: 0.75rem;
  }

  .dm-content {
    color: inherit;
  }

  .danmaku-layer.corrupted {
    filter: contrast(1.1) saturate(0.85);
  }

  .danmaku-layer.heavily-corrupted {
    filter: contrast(1.25) saturate(0.6) hue-rotate(10deg);
    animation: danmakuLayerShake 0.3s infinite;
  }

  .danmaku-noise-overlay {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.6;
    animation: noiseShift 0.2s infinite;
  }

  .danmaku-item.glitched {
    animation: danmakuGlitch 0.15s infinite;
    text-shadow: 
      2px 0 rgba(255, 0, 100, 0.6),
      -2px 0 rgba(0, 255, 255, 0.6);
  }

  @keyframes danmakuLayerShake {
    0%, 100% { transform: translate(0, 0); }
    33% { transform: translate(-1px, 0.5px); }
    66% { transform: translate(1px, -0.5px); }
  }

  @keyframes noiseShift {
    0%, 100% { transform: translate(0, 0); opacity: 0.5; }
    50% { transform: translate(1px, 1px); opacity: 0.7; }
  }

  @keyframes danmakuGlitch {
    0%, 100% { transform: translate(0); opacity: 1; }
    25% { transform: translate(-2px, 1px); opacity: 0.85; }
    50% { transform: translate(2px, -1px); opacity: 0.9; }
    75% { transform: translate(-1px, 2px); opacity: 0.8; }
  }

  @media (max-width: 480px) {
    .danmaku-item {
      font-size: 0.7rem;
      padding: 1px 6px;
    }
    .danmaku-item.important {
      font-size: 0.8rem;
    }
    .dm-username {
      font-size: 0.65rem;
    }
  }
</style>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { settings } from '../lib/store';
  import { signalCorruption, getVisualArtifactChance, getChannelLevel } from '../lib/signalCorruption';
  import type { Danmaku } from '../types/game';

  export let danmakus: Danmaku[];

  let container: HTMLElement;
  let occupiedTracks: Map<string, { endTime: number; track: number }> = new Map();
  const TRACK_COUNT = 6;

  $: danmakuEnabled = $settings.danmakuEnabled;
  $: danmakuSpeed = $settings.danmakuSpeed;
  $: corruptionLevel = $signalCorruption.level;
  $: artifactChance = getVisualArtifactChance(corruptionLevel);
  $: channelLevel = getChannelLevel();
  $: danmakuDegradation = channelLevel.communication;

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
    const effective = Math.max(corruptionLevel, danmakuDegradation);
    const duration = effective > 40 ? baseDuration * (0.7 + Math.random() * 0.6) : baseDuration;
    const color = d.color || '#ffffff';
    let style = `top: calc(${track} * (100% / ${TRACK_COUNT}) + 5%); animation-duration: ${duration}s; color: ${color};`;
    if (effective > 50 && Math.random() < (effective - 50) / 100) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 10;
      style += ` transform: translate(${offsetX}px, ${offsetY}px);`;
    }
    if (danmakuDegradation > 80 && Math.random() < (danmakuDegradation - 80) / 40) {
      style += ` opacity: 0.3;`;
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
    class:corrupted={danmakuDegradation >= 30}
    class:heavily-corrupted={danmakuDegradation >= 65}
    class:communication-offline={danmakuDegradation >= 90}
  >
    {#if danmakuDegradation >= 40}
      <div class="danmaku-noise-overlay"></div>
    {/if}
    {#each danmakus as d}
      {@const track = getTrack(d.id, 200)}
      <div 
        class="danmaku-item"
        style={getDanmakuStyle(d, track)}
        class:important={d.isImportant}
        class:backend-only={d.isBackendOnly}
        class:glitched={danmakuDegradation >= 45 && Math.random() < (danmakuDegradation - 40) / 100}
      >
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

  .danmaku-item.backend-only {
    background: rgba(0, 255, 200, 0.15);
    border: 1px solid rgba(0, 255, 200, 0.4);
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    opacity: 0.9;
    box-shadow: 0 0 8px rgba(0, 255, 200, 0.3);
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

  .danmaku-layer.communication-offline {
    filter: contrast(1.4) saturate(0.3) brightness(0.6);
    animation: danmakuLayerShake 0.15s infinite;
  }

  .danmaku-layer.communication-offline .danmaku-item {
    opacity: 0.4;
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

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { settings } from '../lib/store';
  import type { Danmaku } from '../types/game';

  export let danmakus: Danmaku[];

  let container: HTMLElement;
  let occupiedTracks: Map<string, { endTime: number; track: number }> = new Map();
  const TRACK_COUNT = 6;

  $: danmakuEnabled = $settings.danmakuEnabled;
  $: danmakuSpeed = $settings.danmakuSpeed;

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

  onDestroy(() => {
    occupiedTracks.clear();
  });
</script>

{#if danmakuEnabled}
  <div class="danmaku-layer" bind:this={container}>
    {#each danmakus as d}
      {@const track = getTrack(d.id, 200)}
      <div 
        class="danmaku-item"
        style="top: calc({track} * (100% / {TRACK_COUNT}) + 5%); animation-duration: {8 / danmakuSpeed}s; color: {d.color || '#ffffff'};"
        class:important={d.isImportant}
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

  .dm-username {
    opacity: 0.7;
    margin-right: 4px;
    font-size: 0.75rem;
  }

  .dm-content {
    color: inherit;
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

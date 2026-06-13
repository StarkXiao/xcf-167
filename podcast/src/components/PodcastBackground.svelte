<script lang="ts">
  import type { MoodType } from '../types/game';

  export let mood: MoodType = 'calm';
  export let corruption: number = 0;

  const moodGradients: Record<MoodType, string> = {
    normal: 'radial-gradient(ellipse at 50% 40%, rgba(30, 60, 120, 0.25), transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(20, 50, 100, 0.15), transparent 50%)',
    calm: 'radial-gradient(ellipse at 50% 40%, rgba(20, 80, 100, 0.2), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(10, 60, 80, 0.15), transparent 50%)',
    tense: 'radial-gradient(ellipse at 50% 30%, rgba(120, 40, 20, 0.2), transparent 55%), radial-gradient(ellipse at 30% 80%, rgba(100, 30, 10, 0.15), transparent 50%)',
    scared: 'radial-gradient(ellipse at 50% 40%, rgba(80, 20, 100, 0.22), transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(60, 10, 80, 0.15), transparent 50%)',
    whisper: 'radial-gradient(ellipse at 50% 50%, rgba(30, 30, 60, 0.25), transparent 60%), radial-gradient(ellipse at 40% 70%, rgba(20, 20, 50, 0.18), transparent 50%)',
    urgent: 'radial-gradient(ellipse at 50% 30%, rgba(150, 50, 10, 0.25), transparent 55%), radial-gradient(ellipse at 60% 80%, rgba(120, 30, 0, 0.18), transparent 50%)',
    mystery: 'radial-gradient(ellipse at 50% 40%, rgba(40, 40, 100, 0.22), transparent 55%), radial-gradient(ellipse at 30% 70%, rgba(30, 50, 90, 0.15), transparent 50%)',
    terrified: 'radial-gradient(ellipse at 50% 35%, rgba(120, 0, 40, 0.28), transparent 50%), radial-gradient(ellipse at 60% 75%, rgba(80, 0, 60, 0.2), transparent 50%)'
  };

  const moodAccent: Record<MoodType, string> = {
    normal: '#4080c0',
    calm: '#30a0a0',
    tense: '#c05030',
    scared: '#8040a0',
    whisper: '#5050a0',
    urgent: '#c04010',
    mystery: '#5060b0',
    terrified: '#a00040'
  };

  let vizBars: number[] = Array.from({ length: 32 }, () => Math.random());

  let vizInterval: number;

  function updateViz() {
    vizBars = vizBars.map((v, i) => {
      const target = 0.15 + Math.random() * 0.85;
      return v + (target - v) * 0.3;
    });
  }

  import { onMount, onDestroy } from 'svelte';

  onMount(() => {
    vizInterval = window.setInterval(updateViz, 120);
  });

  onDestroy(() => {
    if (vizInterval) clearInterval(vizInterval);
  });
</script>

<div class="podcast-bg" style="background: {moodGradients[mood] || moodGradients.calm};">
  <div class="bg-base"></div>
  <div class="viz-container">
    {#each vizBars as bar, i}
      <div
        class="viz-bar"
        style="height: {bar * 100}%; background: {moodAccent[mood] || '#4080c0'}; opacity: {0.15 + bar * 0.35};"
      ></div>
    {/each}
  </div>
  <div class="bg-depth-particles">
    {#each Array.from({ length: 12 }) as _, i}
      <div
        class="particle"
        style="
          left: {(i * 8.3) + Math.random() * 5}%;
          animation-delay: {i * 0.7}s;
          animation-duration: {6 + Math.random() * 4}s;
          background: {moodAccent[mood] || '#4080c0'};
        "
      ></div>
    {/each}
  </div>
  {#if corruption > 40}
    <div class="corruption-noise" style="opacity: {Math.min(0.15, (corruption - 40) / 400)};"></div>
  {/if}
  {#if corruption > 70}
    <div class="corruption-scanlines"></div>
  {/if}
</div>

<style>
  .podcast-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    transition: background 1.5s ease;
  }

  .bg-base {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, #050810 0%, #0a1525 50%, #050810 100%);
  }

  .viz-container {
    position: absolute;
    bottom: 120px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 60px;
    width: 85%;
    max-width: 400px;
    opacity: 0.6;
  }

  .viz-bar {
    flex: 1;
    min-height: 4px;
    border-radius: 2px 2px 0 0;
    transition: height 0.12s ease-out;
    box-shadow: 0 0 6px currentColor;
  }

  .bg-depth-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    bottom: -10px;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    opacity: 0;
    animation: particleRise linear infinite;
  }

  @keyframes particleRise {
    0% {
      transform: translateY(0) scale(1);
      opacity: 0;
    }
    10% {
      opacity: 0.4;
    }
    80% {
      opacity: 0.2;
    }
    100% {
      transform: translateY(-100vh) scale(0.3);
      opacity: 0;
    }
  }

  .corruption-noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    pointer-events: none;
    animation: noiseShift 0.2s infinite;
  }

  .corruption-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.1) 2px,
      rgba(0, 0, 0, 0.1) 4px
    );
    pointer-events: none;
  }

  @keyframes noiseShift {
    0%, 100% { transform: translate(0); }
    25% { transform: translate(-1px, 1px); }
    75% { transform: translate(1px, -1px); }
  }
</style>

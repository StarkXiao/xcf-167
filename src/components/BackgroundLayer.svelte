<script lang="ts">
  import { signalCorruption, getVisualArtifactChance, getChannelLevel } from '../lib/signalCorruption';

  export let background: string = 'default';

  $: bgStyle = getBackgroundStyle(background);
  $: corruptionLevel = $signalCorruption.level;
  $: channelLevel = getChannelLevel();
  $: visualDegradation = channelLevel.visual;
  $: powerDegradation = channelLevel.power;
  $: showCorruption = visualDegradation >= 20;
  $: showHeavyCorruption = visualDegradation >= 55;
  $: showCriticalCorruption = visualDegradation >= 80;

  function getBackgroundStyle(bg: string): string {
    const styles: Record<string, string> = {
      intro: 'linear-gradient(180deg, #0a1525 0%, #001a33 50%, #000d1a 100%)',
      cockpit: 'linear-gradient(180deg, #0d1f35 0%, #071525 50%, #030a14 100%)',
      descent: 'linear-gradient(180deg, #001a33 0%, #001528 30%, #001020 60%, #000810 100%)',
      dark: 'linear-gradient(180deg, #000d1a 0%, #000810 50%, #000000 100%)',
      creature: 'linear-gradient(180deg, #0a1020 0%, #050a15 50%, #000510 100%)',
      tense: 'linear-gradient(180deg, #1a0a0a 0%, #100505 50%, #050000 100%)',
      damage: 'linear-gradient(180deg, #1a0505 0%, #0f0303 50%, #050000 100%)',
      glitch: 'linear-gradient(180deg, #0a0a15 0%, #050510 50%, #000005 100%)',
      escape: 'linear-gradient(180deg, #0a1a25 0%, #051018 50%, #000508 100%)',
      ascent: 'linear-gradient(180deg, #001a33 0%, #002550 30%, #003066 60%, #004080 100%)',
      danmaku: 'linear-gradient(180deg, #0a1525 0%, #051018 50%, #000810 100%)',
      default: 'linear-gradient(180deg, #0a0f1a 0%, #050810 100%)'
    };
    return styles[bg] || styles.default;
  }
</script>

<div 
  class="background-layer" 
  style="background: {bgStyle};"
  class:bg-corrupted={showCorruption}
  class:bg-heavily-corrupted={showHeavyCorruption}
  class:bg-critically-corrupted={showCriticalCorruption}
>
  <div class="noise-overlay"></div>
  <div class="vignette"></div>
  {#if background === 'dark' || background === 'creature' || background === 'glitch'}
    <div class="particle-layer">
      {#each Array.from({ length: 20 }) as _, i}
        <div 
          class="particle"
          style="left: {Math.random() * 100}%; top: {Math.random() * 100}%; animation-delay: {Math.random() * 5}s; opacity: {0.2 + Math.random() * 0.4};"
        ></div>
      {/each}
    </div>
  {/if}
  {#if background === 'damage' || background === 'tense'}
    <div class="warning-flash"></div>
  {/if}
  {#if background === 'glitch'}
    <div class="glitch-effect"></div>
  {/if}
  {#if showCorruption}
    <div class="corruption-scanlines" class:heavy={showHeavyCorruption}></div>
  {/if}
  {#if showHeavyCorruption}
    <div class="corruption-chromatic"></div>
  {/if}
  {#if showCriticalCorruption}
    <div class="corruption-blocks">
      {#each Array.from({ length: 8 }) as _, i}
        <div 
          class="corruption-block"
          style="top: {Math.random() * 100}%; left: {Math.random() * 100}%; width: {20 + Math.random() * 150}px; height: {2 + Math.random() * 8}px; animation-delay: {Math.random() * 2}s;"
        ></div>
      {/each}
    </div>
    <div class="corruption-tear" class:visible={Math.random() < 0.3}></div>
  {/if}
  {#if powerDegradation >= 40}
    <div class="power-blackout" style="--power-intensity: {powerDegradation / 100}"></div>
  {/if}
</div>

<style>
  .background-layer {
    position: absolute;
    inset: 0;
    transition: background 1s ease;
    z-index: 0;
  }

  .noise-overlay {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    opacity: 0.5;
  }

  .vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.6) 100%);
    pointer-events: none;
  }

  .particle-layer {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: rgba(100, 180, 255, 0.6);
    border-radius: 50%;
    animation: pulse 3s infinite;
  }

  .warning-flash {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 50%, rgba(255, 30, 30, 0.08) 100%);
    animation: pulse 1.5s infinite;
    pointer-events: none;
  }

  .glitch-effect {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0, 255, 255, 0.02) 2px,
      rgba(0, 255, 255, 0.02) 4px
    );
    animation: glitch 0.3s infinite;
    pointer-events: none;
  }

  .background-layer.bg-corrupted {
    filter: contrast(1.08) saturate(0.9);
  }

  .background-layer.bg-heavily-corrupted {
    filter: contrast(1.2) saturate(0.7) hue-rotate(-10deg) brightness(0.95);
    animation: bgWobble 0.6s infinite;
  }

  .background-layer.bg-critically-corrupted {
    filter: contrast(1.35) saturate(0.5) hue-rotate(-20deg) brightness(0.85);
    animation: bgWobble 0.25s infinite;
  }

  .corruption-scanlines {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.12) 2px,
      rgba(0, 0, 0, 0.12) 4px
    );
    pointer-events: none;
    z-index: 5;
    animation: corruptionScroll 6s linear infinite;
  }

  .corruption-scanlines.heavy {
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 1px,
      rgba(0, 0, 0, 0.2) 1px,
      rgba(0, 0, 0, 0.2) 3px
    );
  }

  .corruption-chromatic {
    position: absolute;
    inset: 0;
    background: 
      linear-gradient(90deg, rgba(255, 0, 80, 0.04) 0%, transparent 30%, transparent 70%, rgba(0, 255, 200, 0.04) 100%);
    pointer-events: none;
    z-index: 6;
    animation: chromaticShift 0.8s infinite;
    mix-blend-mode: screen;
  }

  .corruption-blocks {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 7;
    overflow: hidden;
  }

  .corruption-block {
    position: absolute;
    background: rgba(0, 0, 0, 0.7);
    animation: blockFlicker 0.15s infinite;
  }

  .corruption-tear {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, 
      transparent 0%, 
      rgba(255, 0, 100, 0.6) 20%, 
      rgba(0, 255, 200, 0.6) 50%, 
      rgba(255, 255, 0, 0.6) 80%, 
      transparent 100%
    );
    pointer-events: none;
    z-index: 8;
    opacity: 0;
    left: 30%;
    animation: tearSweep 2s ease-in-out infinite;
  }

  .corruption-tear.visible {
    opacity: 1;
  }

  @keyframes bgWobble {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(-0.5px, 0.5px) scale(1.002); }
    50% { transform: translate(0.5px, -0.5px) scale(0.998); }
    75% { transform: translate(-0.3px, -0.3px) scale(1.001); }
  }

  @keyframes corruptionScroll {
    0% { background-position: 0 0; }
    100% { background-position: 0 100px; }
  }

  @keyframes chromaticShift {
    0%, 100% { transform: translateX(0); opacity: 0.8; }
    33% { transform: translateX(2px); opacity: 1; }
    66% { transform: translateX(-2px); opacity: 0.6; }
  }

  @keyframes blockFlicker {
    0%, 100% { opacity: 0.9; transform: translateX(0); }
    50% { opacity: 0.4; transform: translateX(5px); }
  }

  @keyframes tearSweep {
    0% { left: -5%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { left: 105%; opacity: 0; }
  }

  .power-blackout {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 9;
    background: rgba(0, 0, 0, 0);
    animation: powerBlackout 0.2s infinite;
  }

  @keyframes powerBlackout {
    0%, 100% { background: rgba(0, 0, 0, 0); }
    15% { background: rgba(0, 0, 0, calc(var(--power-intensity) * 0.6)); }
    25% { background: rgba(0, 0, 0, 0); }
    45% { background: rgba(0, 0, 0, calc(var(--power-intensity) * 0.4)); }
    55% { background: rgba(0, 0, 0, 0); }
    75% { background: rgba(0, 0, 0, calc(var(--power-intensity) * 0.7)); }
    85% { background: rgba(0, 0, 0, 0); }
  }
</style>

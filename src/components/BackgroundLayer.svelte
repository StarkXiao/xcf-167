<script lang="ts">
  export let background: string = 'default';

  $: bgStyle = getBackgroundStyle(background);

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

<div class="background-layer" style="background: {bgStyle};">
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
</style>

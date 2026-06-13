<script lang="ts">
  import type { Danmaku } from '../types/game';

  export let danmakus: Danmaku[] = [];
</script>

<div class="danmaku-layer">
  {#each danmakus as danmaku (danmaku.id)}
    <div
      class="danmaku-item"
      style="
        color: {danmaku.color || '#c0d8f0'};
        animation-duration: {6 + Math.random() * 3}s;
        animation-delay: {Math.random() * 0.5}s;
        top: {5 + Math.random() * 55}%;
      "
    >
      {#if danmaku.isImportant}
        <span class="danmaku-important">★</span>
      {/if}
      {danmaku.content}
    </div>
  {/each}
</div>

<style>
  .danmaku-layer {
    position: absolute;
    top: 80px;
    left: 0;
    right: 0;
    height: 50%;
    z-index: 5;
    pointer-events: none;
    overflow: hidden;
  }

  .danmaku-item {
    position: absolute;
    white-space: nowrap;
    font-size: 0.78rem;
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
    letter-spacing: 0.03em;
    opacity: 0.6;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
    animation: danmakuSlide linear forwards;
    padding: 2px 6px;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.15);
  }

  .danmaku-important {
    margin-right: 3px;
    font-size: 0.7rem;
  }

  @keyframes danmakuSlide {
    from {
      transform: translateX(100vw);
      opacity: 0.6;
    }
    10% {
      opacity: 0.65;
    }
    85% {
      opacity: 0.4;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }
</style>

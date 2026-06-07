<script lang="ts">
  import type { EvidenceCard } from '../types/game';
  import type { DragState } from '../types/game';
  import { dragState, startDrag, updateDragPosition, endDrag } from '../lib/evidence';
  import { get } from 'svelte/store';

  export let evidence: EvidenceCard;
  export let draggable = true;
  export let compact = false;

  let cardElement: HTMLElement;

  const typeLabels: Record<string, string> = {
    danmaku: '弹幕',
    dialogue: '台词',
    sfx: '声效'
  };

  const typeColors: Record<string, string> = {
    danmaku: '#64b4ff',
    dialogue: '#ffd700',
    sfx: '#ff7fff'
  };

  function getTypeLabel(type: string): string {
    return typeLabels[type] || type;
  }

  function getTypeColor(type: string): string {
    return typeColors[type] || '#888';
  }

  function handleMouseDown(e: MouseEvent) {
    if (!draggable) return;
    e.preventDefault();
    const rect = cardElement.getBoundingClientRect();
    startDrag(evidence.id, e.clientX - rect.left, e.clientY - rect.top);

    function handleMouseMove(ev: MouseEvent) {
      updateDragPosition(ev.clientX, ev.clientY);
    }

    function handleMouseUp() {
      endDrag();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  function handleTouchStart(e: TouchEvent) {
    if (!draggable) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = cardElement.getBoundingClientRect();
    startDrag(evidence.id, touch.clientX - rect.left, touch.clientY - rect.top);

    function handleTouchMove(ev: TouchEvent) {
      const t = ev.touches[0];
      updateDragPosition(t.clientX, t.clientY);
    }

    function handleTouchEnd() {
      endDrag();
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  }

  $: isDraggingThis = $dragState.isDragging && $dragState.evidenceId === evidence.id;
</script>

<div
  class="evidence-card"
  class:compact={compact}
  class:dragging={isDraggingThis}
  class:used={evidence.status === 'used'}
  class:placed={evidence.status === 'placed'}
  bind:this={cardElement}
  on:mousedown={handleMouseDown}
  on:touchstart={handleTouchStart}
  style="--type-color: {getTypeColor(evidence.type)}; --accent-color: {evidence.color || getTypeColor(evidence.type)};"
>
  <div class="card-header">
    <span class="type-badge">{getTypeLabel(evidence.type)}</span>
    <div class="importance-stars">
      {#each Array(evidence.importance) as _, i}
        <span class="star">★</span>
      {/each}
    </div>
  </div>

  <div class="card-title">{evidence.title}</div>

  {#if !compact}
    {#if evidence.type === 'danmaku' && evidence.username}
      <div class="meta-row">
        <span class="meta-label">用户：</span>
        <span class="meta-value" style="color: {evidence.color || '#fff'}">{evidence.username}</span>
      </div>
    {/if}
    {#if evidence.type === 'dialogue' && evidence.speaker}
      <div class="meta-row">
        <span class="meta-label">说话人：</span>
        <span class="meta-value">{evidence.speaker}</span>
      </div>
    {/if}
    {#if evidence.type === 'sfx' && evidence.sfxType}
      <div class="meta-row">
        <span class="meta-label">声效类型：</span>
        <span class="meta-value">{evidence.sfxType}</span>
      </div>
    {/if}

    <div class="card-content">
      {evidence.content}
    </div>

    <div class="card-tags">
      {#each evidence.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}

  {#if compact}
    <div class="card-content compact-content">
      {evidence.content}
    </div>
  {/if}

  {#if evidence.status === 'used'}
    <div class="used-overlay">
      <span>已使用</span>
    </div>
  {/if}
</div>

<style>
  .evidence-card {
    position: relative;
    background: linear-gradient(145deg, rgba(15, 30, 55, 0.95), rgba(10, 20, 40, 0.98));
    border: 1px solid var(--type-color, rgba(100, 180, 255, 0.4));
    border-radius: 8px;
    padding: 12px 14px;
    cursor: grab;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    min-width: 180px;
    max-width: 220px;
    overflow: hidden;
  }

  .evidence-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent-color, #64b4ff), transparent);
    opacity: 0.6;
  }

  .evidence-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 15px var(--type-color, rgba(100, 180, 255, 0.2));
    border-color: var(--accent-color, rgba(100, 180, 255, 0.7));
  }

  .evidence-card:active {
    cursor: grabbing;
  }

  .evidence-card.dragging {
    opacity: 0.9;
    transform: scale(1.05) rotate(2deg);
    z-index: 1000;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px var(--accent-color, rgba(100, 180, 255, 0.4));
    cursor: grabbing;
  }

  .evidence-card.used {
    opacity: 0.5;
    filter: grayscale(0.3);
  }

  .evidence-card.placed {
    border-style: dashed;
  }

  .evidence-card.compact {
    padding: 8px 10px;
    min-width: 140px;
    max-width: 160px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .type-badge {
    display: inline-block;
    padding: 2px 8px;
    background: var(--type-color, #64b4ff);
    color: #0a0f1a;
    font-size: 0.7rem;
    font-weight: 700;
    border-radius: 3px;
    letter-spacing: 0.05em;
  }

  .importance-stars {
    display: flex;
    gap: 1px;
  }

  .star {
    color: #ffd700;
    font-size: 0.7rem;
    text-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
  }

  .card-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #e0f0ff;
    margin-bottom: 8px;
    line-height: 1.4;
    word-break: break-word;
  }

  .compact .card-title {
    font-size: 0.75rem;
    margin-bottom: 4px;
  }

  .meta-row {
    font-size: 0.75rem;
    color: #a0b8d0;
    margin-bottom: 4px;
  }

  .meta-label {
    color: #7088a0;
  }

  .meta-value {
    color: #c0d8f0;
    font-weight: 500;
  }

  .card-content {
    font-size: 0.8rem;
    color: #b8c8d8;
    line-height: 1.6;
    background: rgba(0, 0, 0, 0.3);
    border-left: 2px solid var(--accent-color, #64b4ff);
    padding: 6px 10px;
    margin: 8px 0;
    border-radius: 0 4px 4px 0;
    font-style: italic;
    word-break: break-word;
  }

  .compact-content {
    font-size: 0.7rem;
    padding: 4px 8px;
    margin: 4px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }

  .tag {
    display: inline-block;
    padding: 1px 6px;
    background: rgba(100, 180, 255, 0.15);
    border: 1px solid rgba(100, 180, 255, 0.3);
    color: #80b8e8;
    font-size: 0.65rem;
    border-radius: 3px;
    text-transform: lowercase;
  }

  .used-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .used-overlay span {
    color: #ff8080;
    font-size: 1rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    text-shadow: 0 0 10px rgba(255, 128, 128, 0.5);
    transform: rotate(-5deg);
  }

  @media (max-width: 480px) {
    .evidence-card {
      min-width: 140px;
      max-width: 160px;
      padding: 10px 12px;
    }

    .evidence-card.compact {
      min-width: 120px;
      max-width: 140px;
      padding: 6px 8px;
    }

    .card-title {
      font-size: 0.8rem;
    }

    .card-content {
      font-size: 0.75rem;
    }
  }
</style>

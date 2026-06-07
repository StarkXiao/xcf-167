<script lang="ts">
  import { onMount, onDestroy, beforeUpdate } from 'svelte';
  import { isTyping } from '../lib/store';
  import { settings } from '../lib/store';
  import { playSFX } from '../lib/audio';
  import type { DialogueLine } from '../types/game';

  export let dialogue: DialogueLine | null;
  export let onComplete: () => void;

  let displayedText = '';
  let typingInterval: number | null = null;
  let isComplete = false;

  $: textSpeed = $settings.textSpeed;

  function startTyping() {
    if (!dialogue) return;
    
    displayedText = '';
    isComplete = false;
    isTyping.set(true);
    
    const fullText = dialogue.text;
    let index = 0;
    
    if (typingInterval) clearInterval(typingInterval);
    
    const charDelay = Math.max(15, 100 - textSpeed);
    
    typingInterval = window.setInterval(() => {
      if (index < fullText.length) {
        displayedText += fullText[index];
        index++;
        if (index % 3 === 0 && Math.random() > 0.7) {
          playSFX('click');
        }
      } else {
        completeTyping();
      }
    }, charDelay);
  }

  function completeTyping() {
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
    if (dialogue) {
      displayedText = dialogue.text;
    }
    isComplete = true;
    isTyping.set(false);
  }

  function handleClick() {
    if (!isComplete) {
      completeTyping();
    } else {
      onComplete();
    }
  }

  $: if (dialogue) {
    startTyping();
  }

  onDestroy(() => {
    if (typingInterval) clearInterval(typingInterval);
    isTyping.set(false);
  });
</script>

<div class="dialogue-box" on:click={handleClick}>
  {#if dialogue}
    {#if dialogue.speaker}
      <div class="speaker-name">{dialogue.speaker}</div>
    {/if}
    <div class="dialogue-text">
      {displayedText}
      {#if !isComplete}
        <span class="cursor">|</span>
      {/if}
    </div>
    {#if isComplete}
      <div class="advance-hint">
        <span class="hint-arrow">▼</span>
      </div>
    {/if}
  {/if}
</div>

<style>
  .dialogue-box {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 20px calc(30px + env(safe-area-inset-bottom));
    background: linear-gradient(transparent, rgba(0, 10, 25, 0.95) 30%);
    min-height: 35%;
    z-index: 30;
    cursor: pointer;
  }

  .speaker-name {
    display: inline-block;
    padding: 4px 12px;
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.8), rgba(40, 80, 160, 0.8));
    color: #e0f0ff;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 4px 4px 0 0;
    margin-bottom: 0;
    letter-spacing: 0.05em;
    border: 1px solid rgba(100, 180, 255, 0.4);
    border-bottom: none;
  }

  .dialogue-text {
    background: rgba(10, 25, 45, 0.9);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 0 8px 8px 8px;
    padding: 16px 20px;
    color: #d0e4f8;
    font-size: 1rem;
    line-height: 1.8;
    min-height: 80px;
    white-space: pre-wrap;
    word-break: break-word;
    backdrop-filter: blur(10px);
  }

  .cursor {
    color: #64b4ff;
    animation: pulse 0.8s infinite;
    margin-left: 2px;
  }

  .advance-hint {
    position: absolute;
    right: 30px;
    bottom: calc(20px + env(safe-area-inset-bottom));
    color: #64b4ff;
    animation: pulse 1.2s infinite;
  }

  .hint-arrow {
    font-size: 0.8rem;
  }

  @media (max-width: 480px) {
    .dialogue-box {
      padding: 16px 12px calc(24px + env(safe-area-inset-bottom));
      min-height: 40%;
    }

    .speaker-name {
      font-size: 0.8rem;
      padding: 3px 10px;
    }

    .dialogue-text {
      padding: 12px 14px;
      font-size: 0.9rem;
      line-height: 1.7;
    }
  }
</style>

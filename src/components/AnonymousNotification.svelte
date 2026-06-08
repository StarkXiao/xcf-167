<script lang="ts">
  import { playSFX } from '../lib/audio';
  import {
    anonymousSenderState,
    openMailbox,
    openTerminalLog
  } from '../lib/anonymousSender';

  function handleNotificationClick() {
    const notif = $anonymousSenderState.activeNotification;
    if (!notif) return;
    playSFX('select');
    if (notif.type === 'email') {
      openMailbox();
    } else {
      openTerminalLog();
    }
  }
</script>

{#if $anonymousSenderState.activeNotification}
  <div
    class="anon-notification"
    on:click={handleNotificationClick}
    class:notif-email={$anonymousSenderState.activeNotification.type === 'email'}
    class:notif-terminal={$anonymousSenderState.activeNotification.type === 'terminal'}
    style="animation: slideIn 0.5s ease-out;"
  >
    <div class="notif-icon">
      {#if $anonymousSenderState.activeNotification.type === 'email'}
        📧
      {:else}
        💻
      {/if}
    </div>
    <div class="notif-content">
      <div class="notif-label">
        {$anonymousSenderState.activeNotification.type === 'email' ? '新邮件' : '新终端记录'}
      </div>
      <div class="notif-subject">
        {$anonymousSenderState.activeNotification.subject}
      </div>
    </div>
    <div class="notif-arrow">→</div>
  </div>
{/if}

<style>
  .anon-notification {
    position: fixed;
    top: calc(70px + env(safe-area-inset-top));
    right: 16px;
    max-width: 320px;
    padding: 12px 16px;
    border-radius: 10px;
    cursor: pointer;
    z-index: 150;
    display: flex;
    align-items: center;
    gap: 12px;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s ease;
  }

  .anon-notification:hover {
    transform: translateX(-4px);
  }

  .anon-notification.notif-email {
    background: linear-gradient(135deg, rgba(80, 45, 20, 0.92), rgba(50, 28, 12, 0.95));
    border: 1px solid rgba(255, 150, 80, 0.4);
  }

  .anon-notification.notif-terminal {
    background: linear-gradient(135deg, rgba(15, 50, 30, 0.92), rgba(8, 28, 18, 0.95));
    border: 1px solid rgba(100, 255, 150, 0.4);
  }

  .notif-icon {
    font-size: 1.4rem;
    flex-shrink: 0;
  }

  .notif-content {
    flex: 1;
    min-width: 0;
  }

  .notif-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    margin-bottom: 3px;
    font-family: 'Courier New', monospace;
  }

  .notif-email .notif-label {
    color: #ffa060;
  }

  .notif-terminal .notif-label {
    color: #60e890;
  }

  .notif-subject {
    font-size: 0.85rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .notif-email .notif-subject {
    color: #ffe0c0;
  }

  .notif-terminal .notif-subject {
    color: #c0ffd0;
  }

  .notif-arrow {
    font-size: 0.9rem;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .notif-email .notif-arrow {
    color: #ffa060;
  }

  .notif-terminal .notif-arrow {
    color: #60e890;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(40px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (max-width: 480px) {
    .anon-notification {
      left: 12px;
      right: 12px;
      max-width: none;
      top: calc(60px + env(safe-area-inset-top));
    }
  }
</style>

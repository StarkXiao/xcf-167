<script lang="ts">
  import { activeNotifications, getCrewMember, getTrustLevelColor } from '../lib/trust';
  import type { CrewMemberId } from '../types/game';

  function getMemberName(id: CrewMemberId): string {
    return getCrewMember(id)?.name || id;
  }
</script>

<div class="trust-notifications-container">
  {#each $activeNotifications as notification (notification.id)}
    <div
      class="trust-notification"
      class:positive={notification.value > 0}
      class:negative={notification.value < 0}
      style="border-color: {getTrustLevelColor(notification.value > 0 ? 'trust' : 'distrust')}"
    >
      <span class="notification-icon">
        {notification.value > 0 ? '▲' : '▼'}
      </span>
      <div class="notification-content">
        <span class="notification-name">{getMemberName(notification.target)}</span>
        <span class="notification-value">
          {notification.value > 0 ? '+' : ''}{notification.value} 信任
        </span>
        {#if notification.reason}
          <span class="notification-reason">{notification.reason}</span>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .trust-notifications-container {
    position: fixed;
    top: calc(80px + env(safe-area-inset-top));
    right: 16px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  }

  .trust-notification {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(10, 25, 50, 0.92);
    border: 1px solid;
    border-radius: 10px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    animation: slideInRight 0.4s ease-out, fadeOut 0.4s ease-in 2.6s forwards;
    max-width: 280px;
  }

  .trust-notification.positive {
    background: linear-gradient(135deg, rgba(20, 60, 40, 0.92), rgba(10, 30, 25, 0.92));
  }

  .trust-notification.negative {
    background: linear-gradient(135deg, rgba(60, 20, 30, 0.92), rgba(40, 10, 20, 0.92));
  }

  .notification-icon {
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .trust-notification.positive .notification-icon {
    color: #60d090;
    background: rgba(100, 255, 150, 0.15);
  }

  .trust-notification.negative .notification-icon {
    color: #ff8080;
    background: rgba(255, 100, 100, 0.15);
  }

  .notification-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .notification-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: #e0f0ff;
  }

  .notification-value {
    font-size: 0.75rem;
    font-family: 'Courier New', monospace;
    font-weight: 700;
  }

  .trust-notification.positive .notification-value {
    color: #60d090;
  }

  .trust-notification.negative .notification-value {
    color: #ff8080;
  }

  .notification-reason {
    font-size: 0.7rem;
    color: #80a0b0;
    line-height: 1.4;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(20px);
    }
  }

  @media (max-width: 480px) {
    .trust-notifications-container {
      top: calc(70px + env(safe-area-inset-top));
      right: 10px;
      left: 10px;
    }
    .trust-notification {
      max-width: none;
    }
  }
</style>

<script lang="ts">
  import { playSFX } from '../lib/audio';
  import {
    anonymousSenderState,
    closeMailbox,
    viewEmail,
    markEmailRead
  } from '../lib/anonymousSender';
  import type { AnonymousEmail } from '../types/game';

  let isOpen = false;
  let selectedEmail: AnonymousEmail | null = null;

  $: {
    isOpen = $anonymousSenderState.isMailboxOpen;
    if ($anonymousSenderState.viewingEmailId) {
      selectedEmail = $anonymousSenderState.emails.find(e => e.id === $anonymousSenderState.viewingEmailId) || null;
    } else {
      selectedEmail = null;
    }
  }

  function handleClose() {
    playSFX('click');
    closeMailbox();
  }

  function handleSelectEmail(email: AnonymousEmail) {
    playSFX('select');
    viewEmail(email.id);
  }

  function handleBack() {
    playSFX('click');
    $anonymousSenderState.viewingEmailId = null;
  }

  function formatTime(timestamp: number): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleString('zh-CN');
  }
</script>

{#if isOpen}
  <div class="overlay" on:click={handleClose}>
    <div class="mailbox-panel" on:click|stopPropagation style="animation: fadeInUp 0.3s ease-out;">
      <button class="close-btn" on:click={handleClose}>✕</button>

      {#if !selectedEmail}
        <div class="panel-header">
          <h2 class="panel-title">📧 匿名发件箱</h2>
          <p class="panel-subtitle">来自不可追踪来源的加密消息</p>
        </div>

        <div class="email-list">
          {#if $anonymousSenderState.emails.length === 0}
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p class="empty-text">暂无邮件</p>
              <p class="empty-hint">继续推进剧情，匿名线索会陆续送达...</p>
            </div>
          {:else}
            {#each $anonymousSenderState.emails as email (email.id)}
              <button
                class="email-item"
                class:unread={!email.isRead}
                on:click={() => handleSelectEmail(email)}
              >
                <div class="email-header">
                  {#if !email.isRead}
                    <span class="unread-dot"></span>
                  {/if}
                  <span class="email-subject">{email.subject}</span>
                </div>
                <div class="email-meta">
                  <span class="email-sender">{email.sender}</span>
                  <span class="email-time">{formatTime(email.timestamp)}</span>
                </div>
                {#if email.tags && email.tags.length > 0}
                  <div class="email-tags">
                    {#each email.tags as tag}
                      <span class="tag">{tag}</span>
                    {/each}
                  </div>
                {/if}
              </button>
            {/each}
          {/if}
        </div>
      {:else}
        <div class="email-view">
          <button class="back-btn" on:click={handleBack}>← 返回列表</button>
          <div class="email-detail-header">
            <h3 class="email-detail-subject">{selectedEmail.subject}</h3>
            <div class="email-detail-meta">
              <span class="email-detail-sender">发件人：{selectedEmail.sender}</span>
              <span class="email-detail-time">{formatTime(selectedEmail.timestamp)}</span>
            </div>
            {#if selectedEmail.tags && selectedEmail.tags.length > 0}
              <div class="email-detail-tags">
                {#each selectedEmail.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
          <div class="email-body">
            <pre class="email-content">{selectedEmail.content}</pre>
          </div>
          {#if selectedEmail.attachedClue}
            <div class="email-clue">
              <span class="clue-icon">🔍</span>
              <span class="clue-text">已解锁相关线索</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    backdrop-filter: blur(10px);
    padding: 20px;
  }

  .mailbox-panel {
    position: relative;
    background: linear-gradient(180deg, rgba(10, 20, 40, 0.98), rgba(5, 12, 28, 0.98));
    border: 1px solid rgba(255, 180, 100, 0.3);
    border-radius: 14px;
    padding: 24px;
    width: 100%;
    max-width: 560px;
    max-height: 85vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 50px rgba(255, 150, 80, 0.15), inset 0 1px 0 rgba(255, 200, 150, 0.08);
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 16px;
    background: transparent;
    border: none;
    color: #8a7a6a;
    font-size: 1.3rem;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
    transition: all 0.2s;
  }

  .close-btn:hover {
    color: #ffb080;
  }

  .panel-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 180, 100, 0.15);
  }

  .panel-title {
    color: #ffc070;
    margin: 0 0 6px;
    font-size: 1.3rem;
    letter-spacing: 0.08em;
    text-shadow: 0 0 15px rgba(255, 180, 100, 0.4);
  }

  .panel-subtitle {
    color: #8a7a6a;
    margin: 0;
    font-size: 0.8rem;
    font-style: italic;
  }

  .email-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .empty-state {
    text-align: center;
    padding: 50px 20px;
    color: #6a5a4a;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
    margin-bottom: 12px;
  }

  .empty-text {
    font-size: 1.1rem;
    margin: 0 0 6px;
    color: #8a7a6a;
  }

  .empty-hint {
    font-size: 0.8rem;
    margin: 0;
    font-style: italic;
  }

  .email-item {
    text-align: left;
    padding: 14px 16px;
    background: rgba(40, 25, 15, 0.5);
    border: 1px solid rgba(255, 180, 100, 0.15);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .email-item:hover {
    background: rgba(60, 40, 20, 0.7);
    border-color: rgba(255, 180, 100, 0.4);
    transform: translateX(2px);
  }

  .email-item.unread {
    background: rgba(80, 50, 25, 0.5);
    border-color: rgba(255, 150, 80, 0.35);
  }

  .email-item.unread:hover {
    background: rgba(100, 60, 30, 0.7);
  }

  .email-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .unread-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #ff8040;
    box-shadow: 0 0 8px rgba(255, 120, 60, 0.6);
    flex-shrink: 0;
  }

  .email-subject {
    color: #ffd8a0;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .email-item.unread .email-subject {
    color: #ffe8c0;
    font-weight: 600;
  }

  .email-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .email-sender {
    color: #a08870;
    font-size: 0.78rem;
    font-family: 'Courier New', monospace;
  }

  .email-time {
    color: #6a5a4a;
    font-size: 0.72rem;
    font-family: 'Courier New', monospace;
  }

  .email-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tag {
    padding: 2px 8px;
    background: rgba(255, 150, 80, 0.12);
    border: 1px solid rgba(255, 150, 80, 0.3);
    border-radius: 10px;
    font-size: 0.68rem;
    color: #ffa060;
  }

  .email-view {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .back-btn {
    align-self: flex-start;
    background: none;
    border: none;
    color: #a08870;
    font-size: 0.85rem;
    cursor: pointer;
    padding: 4px 8px;
    margin-bottom: 12px;
    transition: all 0.2s;
  }

  .back-btn:hover {
    color: #ffc070;
  }

  .email-detail-header {
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 180, 100, 0.15);
    margin-bottom: 16px;
  }

  .email-detail-subject {
    color: #ffe0a0;
    margin: 0 0 10px;
    font-size: 1.15rem;
    text-shadow: 0 0 10px rgba(255, 180, 100, 0.3);
  }

  .email-detail-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .email-detail-sender {
    color: #c0a080;
    font-size: 0.82rem;
    font-family: 'Courier New', monospace;
  }

  .email-detail-time {
    color: #8a7a6a;
    font-size: 0.78rem;
    font-family: 'Courier New', monospace;
  }

  .email-detail-tags {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .email-body {
    flex: 1;
    overflow-y: auto;
    background: rgba(20, 12, 5, 0.6);
    border: 1px solid rgba(255, 150, 80, 0.1);
    border-radius: 8px;
    padding: 18px;
  }

  .email-content {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    color: #e0d0b8;
    font-size: 0.92rem;
    line-height: 1.8;
    font-family: inherit;
  }

  .email-clue {
    margin-top: 14px;
    padding: 10px 14px;
    background: rgba(100, 255, 150, 0.08);
    border: 1px solid rgba(100, 255, 150, 0.25);
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .clue-icon {
    font-size: 1rem;
  }

  .clue-text {
    color: #80e8a0;
    font-size: 0.85rem;
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .mailbox-panel {
      padding: 18px 14px;
      max-height: 90vh;
    }

    .panel-title {
      font-size: 1.1rem;
    }

    .email-content {
      font-size: 0.85rem;
      line-height: 1.7;
    }
  }
</style>

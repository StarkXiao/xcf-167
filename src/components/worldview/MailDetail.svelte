<script lang="ts">
  import type { MailCorrespondence } from '../../types/game';
  import { playSFX } from '../../lib/audio';
  import RelationNav from './RelationNav.svelte';

  export let node: MailCorrespondence;
  export let onBack: () => void;
  export let unlockedIds: string[] = [];
  export let onNavigate: (node: any) => void = () => {};

  function handleBack() {
    playSFX('click');
    onBack();
  }

  function getSecurityColor(level?: string): string {
    switch (level) {
      case 'public': return '#66dd88';
      case 'internal': return '#66aaff';
      case 'restricted': return '#ddaa44';
      case 'classified': return '#dd4444';
      default: return '#888';
    }
  }

  function getSecurityLabel(level?: string): string {
    switch (level) {
      case 'public': return '公开';
      case 'internal': return '内部';
      case 'restricted': return '受限';
      case 'classified': return '机密';
      default: return '未分级';
    }
  }

  function isSignatureLine(line: string, index: number): boolean {
    return index > 0 && (line.startsWith('——') || line.startsWith('--') || line.includes('致敬') || line.includes('敬礼'));
  }

  $: contentLines = node.content.split('\n').map(line => line.trim()).filter(Boolean);
</script>

<div class="detail-view">
  <button class="back-btn" on:click={handleBack}>← 返回列表</button>

  <div class="mail-header">
    <div class="mail-icon">{node.icon}</div>
    <div class="mail-title-wrap">
      <h2 class="mail-title">{node.title}</h2>
      <span class="mail-subtitle">邮件往来记录</span>
    </div>
    {#if node.securityLevel}
      <span class="security-badge" style="background: {getSecurityColor(node.securityLevel)}20; color: {getSecurityColor(node.securityLevel)}; border-color: {getSecurityColor(node.securityLevel)}60;">
        🔒 {getSecurityLabel(node.securityLevel)}
      </span>
    {/if}
  </div>

  <div class="mail-meta">
    <div class="meta-row">
      <span class="meta-label">发件人</span>
      <span class="meta-value sender">{node.from}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">收件人</span>
      <span class="meta-value">{node.to}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">日期</span>
      <span class="meta-value">{node.date}</span>
    </div>
    <div class="meta-row">
      <span class="meta-label">主题</span>
      <span class="meta-value subject">{node.subject}</span>
    </div>
  </div>

  <div class="mail-body">
    <div class="mail-content">
      {#each contentLines as line, i}
        <p class="mail-line" class:signature={isSignatureLine(line, i)}>
          {line}
        </p>
      {/each}
    </div>
  </div>

  {#if node.attachments && node.attachments.length > 0}
    <div class="mail-section">
      <h3 class="section-title">📎 附件</h3>
      <div class="attachments-list">
        {#each node.attachments as att}
          <div class="attachment-item">
            <span class="att-icon">📄</span>
            <span class="att-name">{att}</span>
            <span class="att-encrypted">已加密</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if node.tags && node.tags.length > 0}
    <div class="mail-section">
      <h3 class="section-title">🏷️ 标签</h3>
      <div class="tags-row">
        {#each node.tags as tag}
          <span class="mail-tag">{tag}</span>
        {/each}
      </div>
    </div>
  {/if}

  <RelationNav currentNode={node} {unlockedIds} onNavigate={onNavigate} />
</div>

<style>
  .detail-view {
    padding: 24px 28px;
    height: 100%;
    overflow-y: auto;
    animation: fadeIn 0.3s ease-out;
  }

  .back-btn {
    padding: 8px 16px;
    background: rgba(30, 50, 80, 0.6);
    border: 1px solid rgba(60, 130, 200, 0.3);
    border-radius: 6px;
    color: #90c0e0;
    font-size: 0.85rem;
    cursor: pointer;
    margin-bottom: 20px;
    transition: all 0.2s;
  }

  .back-btn:hover { background: rgba(40, 70, 110, 0.8); }

  .mail-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .mail-icon {
    font-size: 3rem;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(220, 170, 100, 0.15), rgba(200, 150, 80, 0.08));
    border: 1px solid rgba(220, 170, 100, 0.25);
    border-radius: 12px;
    flex-shrink: 0;
  }

  .mail-title-wrap {
    flex: 1;
    min-width: 200px;
  }

  .mail-title {
    font-size: 1.6rem;
    color: #c0d8f0;
    margin: 0 0 4px 0;
    font-weight: 700;
  }

  .mail-subtitle {
    font-size: 0.85rem;
    color: #ddaa66;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.05em;
  }

  .security-badge {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    border: 1px solid;
  }

  .mail-meta {
    padding: 18px;
    background: rgba(15, 30, 55, 0.6);
    border: 1px solid rgba(220, 170, 100, 0.2);
    border-radius: 10px;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .meta-row {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }

  .meta-label {
    font-size: 0.75rem;
    color: #8a7a5a;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    width: 60px;
    flex-shrink: 0;
    padding-top: 2px;
  }

  .meta-value {
    font-size: 0.88rem;
    color: #c0d8f0;
    flex: 1;
  }

  .meta-value.sender {
    color: #ddaa66;
    font-weight: 600;
  }

  .meta-value.subject {
    color: #ffe8c0;
    font-weight: 500;
  }

  .mail-body {
    margin-bottom: 24px;
  }

  .mail-content {
    padding: 24px;
    background: linear-gradient(180deg, rgba(20, 35, 60, 0.7), rgba(15, 25, 45, 0.8));
    border: 1px solid rgba(60, 130, 200, 0.15);
    border-radius: 10px;
    font-family: 'Courier New', monospace;
    line-height: 2;
  }

  .mail-line {
    font-size: 0.88rem;
    color: #b0c8e0;
    margin: 0 0 8px 0;
  }

  .mail-line.signature {
    color: #8a9aac;
    font-style: italic;
    margin-top: 16px;
    padding-top: 8px;
    border-top: 1px solid rgba(100, 130, 160, 0.15);
  }

  .mail-section {
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 0.95rem;
    color: #ddaa66;
    margin: 0 0 10px 0;
    font-weight: 600;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(220, 170, 100, 0.2);
  }

  .attachments-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .attachment-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(15, 30, 55, 0.5);
    border: 1px solid rgba(220, 170, 100, 0.15);
    border-radius: 6px;
  }

  .att-icon {
    font-size: 1rem;
  }

  .att-name {
    flex: 1;
    font-size: 0.82rem;
    color: #c0b090;
    font-family: 'Courier New', monospace;
  }

  .att-encrypted {
    font-size: 0.7rem;
    color: #c0a070;
    padding: 2px 8px;
    background: rgba(220, 170, 100, 0.1);
    border-radius: 4px;
  }

  .tags-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .mail-tag {
    font-size: 0.75rem;
    padding: 4px 12px;
    background: rgba(220, 170, 100, 0.1);
    color: #c0a070;
    border: 1px solid rgba(220, 170, 100, 0.2);
    border-radius: 4px;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 700px) {
    .detail-view { padding: 16px; }
    .mail-icon { width: 60px; height: 60px; font-size: 2rem; }
    .mail-title { font-size: 1.25rem; }
    .mail-content { padding: 16px; }
  }
</style>

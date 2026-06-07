<script lang="ts">
  import { crewTrustList, overallTrustLevel, getTrustLevelLabel, getTrustLevelColor, getCrewMember } from '../lib/trust';
  import type { CrewMemberId } from '../types/game';

  export let isOpen: boolean;
  export let onClose: () => void;

  function getMemberInitial(id: CrewMemberId): string {
    const member = getCrewMember(id);
    return member?.name?.charAt(0) || '?';
  }
</script>

{#if isOpen}
  <div class="trust-panel-overlay" on:click|stopPropagation={onClose}>
    <div class="trust-panel" on:click|stopPropagation>
      <div class="panel-header">
        <h3>船员信任状态</h3>
        <button class="close-btn" on:click={onClose}>✕</button>
      </div>

      <div class="overall-trust">
        <span class="overall-label">整体信任度</span>
        <span class="overall-level" style="color: {getTrustLevelColor($overallTrustLevel)}">
          {getTrustLevelLabel($overallTrustLevel)}
        </span>
      </div>

      <div class="crew-list">
        {#each $crewTrustList as { member, trust }}
          <div class="crew-item">
            <div class="crew-avatar" style="border-color: {getTrustLevelColor(trust.level)}">
              {getMemberInitial(member.id)}
            </div>
            <div class="crew-info">
              <div class="crew-name-row">
                <span class="crew-name">{member.name}</span>
                <span class="crew-role">{member.role}</span>
              </div>
              <div class="crew-desc">{member.description}</div>
              <div class="trust-bar-container">
                <div class="trust-bar-track">
                  <div
                    class="trust-bar-fill"
                    style="width: {50 + trust.value / 2}%; background: {getTrustLevelColor(trust.level)};"
                  ></div>
                  <div class="trust-bar-midpoint"></div>
                </div>
                <span class="trust-value" style="color: {getTrustLevelColor(trust.level)}">
                  {trust.value > 0 ? '+' : ''}{trust.value}
                </span>
                <span class="trust-level" style="color: {getTrustLevelColor(trust.level)}">
                  {getTrustLevelLabel(trust.level)}
                </span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="panel-hint">
        <p>💡 通过回放中的对话细节和关键抉择来建立或破坏与船员的信任关系。</p>
        <p>💡 不同船员的信任倾向会影响剧情走向和最终结局。</p>
      </div>
    </div>
  </div>
{/if}

<style>
  .trust-panel-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.85);
    backdrop-filter: blur(8px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease-out;
  }

  .trust-panel {
    background: linear-gradient(180deg, rgba(10, 25, 50, 0.98), rgba(5, 15, 35, 0.98));
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 16px;
    max-width: 600px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 0 40px rgba(100, 180, 255, 0.15), inset 0 0 60px rgba(100, 180, 255, 0.05);
    animation: slideUp 0.4s ease-out;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.15);
    position: sticky;
    top: 0;
    background: inherit;
    z-index: 1;
  }

  .panel-header h3 {
    margin: 0;
    font-family: 'Courier New', monospace;
    font-size: 1.1rem;
    color: #64b4ff;
    letter-spacing: 0.1em;
    text-shadow: 0 0 10px rgba(100, 180, 255, 0.5);
  }

  .close-btn {
    background: rgba(100, 180, 255, 0.1);
    border: 1px solid rgba(100, 180, 255, 0.3);
    color: #a0c8f0;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: rgba(255, 100, 100, 0.2);
    border-color: rgba(255, 100, 100, 0.5);
    color: #ff8080;
  }

  .overall-trust {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: rgba(100, 180, 255, 0.05);
    border-bottom: 1px solid rgba(100, 180, 255, 0.1);
  }

  .overall-label {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    color: #80a0c0;
    letter-spacing: 0.1em;
  }

  .overall-level {
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    font-weight: 700;
    text-shadow: 0 0 8px currentColor;
  }

  .crew-list {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .crew-item {
    display: flex;
    gap: 14px;
    padding: 14px;
    background: rgba(20, 40, 70, 0.4);
    border: 1px solid rgba(100, 180, 255, 0.12);
    border-radius: 12px;
    transition: all 0.3s;
  }

  .crew-item:hover {
    background: rgba(30, 60, 100, 0.5);
    border-color: rgba(100, 180, 255, 0.25);
  }

  .crew-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
    font-size: 1.2rem;
    font-weight: 700;
    background: rgba(0, 20, 40, 0.6);
    flex-shrink: 0;
    text-shadow: 0 0 6px currentColor;
  }

  .crew-info {
    flex: 1;
    min-width: 0;
  }

  .crew-name-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 4px;
  }

  .crew-name {
    font-size: 1rem;
    font-weight: 600;
    color: #e0f0ff;
  }

  .crew-role {
    font-size: 0.75rem;
    color: #6090b0;
    font-family: 'Courier New', monospace;
  }

  .crew-desc {
    font-size: 0.75rem;
    color: #7090b0;
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .trust-bar-container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .trust-bar-track {
    flex: 1;
    height: 8px;
    background: rgba(40, 60, 90, 0.6);
    border-radius: 4px;
    position: relative;
    overflow: hidden;
  }

  .trust-bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease, background 0.3s;
    box-shadow: 0 0 8px currentColor;
  }

  .trust-bar-midpoint {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 1px;
    background: rgba(150, 180, 210, 0.4);
  }

  .trust-value {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    font-weight: 700;
    min-width: 36px;
    text-align: right;
  }

  .trust-level {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    min-width: 40px;
  }

  .panel-hint {
    padding: 14px 20px 20px;
    border-top: 1px solid rgba(100, 180, 255, 0.1);
    margin-top: 8px;
  }

  .panel-hint p {
    margin: 6px 0;
    font-size: 0.75rem;
    color: #6090b0;
    line-height: 1.6;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    .trust-panel {
      max-height: 90vh;
    }
    .crew-item {
      padding: 12px;
      gap: 10px;
    }
    .crew-avatar {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }
  }
</style>

<script lang="ts">
  import {
    allEndings,
    allNodes,
    selectedEnding,
    selectEnding,
    updateEnding,
    addEnding,
    deleteEnding,
    selectNode,
    setActiveTab,
    crewMembers,
    trustLevels,
    trustLevelLabels
  } from '../../lib/editorStore';
  import { playSFX } from '../../lib/audio';
  import type { TrustLevel } from '../../types/game';

  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }
  function textareaValue(e: Event): string { return (e.target as HTMLTextAreaElement).value; }

  $: endings = $allEndings;
  $: ending = $selectedEnding;
  $: nodes = $allNodes;

  $: endingNodeMap = (() => {
    const map: Record<string, { nodeId: string; title: string; path: string }[]> = {};
    for (const n of nodes) {
      if (n.endingId) {
        if (!map[n.endingId]) map[n.endingId] = [];
        map[n.endingId].push({
          nodeId: n.id,
          title: n.title || n.id,
          path: n.id
        });
      }
    }
    return map;
  })();

  $: endingPathMap = (() => {
    const map: Record<string, { fromNodeId: string; fromTitle: string; branches: { toNodeId: string; toTitle: string; condition: string }[] }[]> = {};
    for (const n of nodes) {
      if (n.nextNodeBranches) {
        for (const b of n.nextNodeBranches) {
          const target = nodes.find(nd => nd.id === b.nextNodeId);
          if (target?.isEnding && target.endingId) {
            const eid = target.endingId;
            if (!map[eid]) map[eid] = [];
            const cond = describeCondition(b.condition, b.trustCondition, b.memoryCondition);
            map[eid].push({
              fromNodeId: n.id,
              fromTitle: n.title || n.id,
              branches: [{ toNodeId: b.nextNodeId, toTitle: target.title || target.id, condition: cond }]
            });
          }
        }
      }
      if (n.choices) {
        for (const c of n.choices) {
          const target = nodes.find(nd => nd.id === c.nextNodeId);
          if (target?.isEnding && target.endingId) {
            const eid = target.endingId;
            if (!map[eid]) map[eid] = [];
            const cond = describeCondition(c.condition, c.trustCondition, c.memoryCondition);
            map[eid].push({
              fromNodeId: n.id,
              fromTitle: n.title || n.id,
              branches: [{ toNodeId: c.nextNodeId, toTitle: target.title || target.id, condition: cond }]
            });
          }
        }
      }
    }
    return map;
  })();

  $: goodCount = endings.filter(e => e.isGood).length;
  $: badCount = endings.length - goodCount;

  function describeCondition(stateCond?: Record<string, any>, trustCond?: any, memCond?: any): string {
    const parts: string[] = [];
    if (stateCond) {
      const entries = Object.entries(stateCond);
      if (entries.length) parts.push(`变量: ${entries.map(([k, v]) => `${k}=${v}`).join(', ')}`);
    }
    if (trustCond?.crewRequirements?.length) {
      const reqs = trustCond.crewRequirements.map((r: any) => {
        const member = crewMembers.find(c => c.id === r.memberId);
        const name = member?.name || r.memberId;
        if (r.minValue !== undefined) return `${name}信任≥${r.minValue}`;
        if (r.maxValue !== undefined) return `${name}信任≤${r.maxValue}`;
        if (r.minLevel) return `${name}≥${trustLevelLabels[r.minLevel as TrustLevel] || r.minLevel}`;
        return name;
      });
      parts.push(`信任: ${reqs.join(', ')}`);
    }
    if (trustCond?.overallMinValue !== undefined) parts.push(`总体信任≥${trustCond.overallMinValue}`);
    if (memCond?.playthroughAtLeast) parts.push(`周目≥${memCond.playthroughAtLeast}`);
    if (memCond?.requiredClues?.length) parts.push(`线索: ${memCond.requiredClues.join(', ')}`);
    if (memCond?.anyClues?.length) parts.push(`任一线索: ${memCond.anyClues.join(', ')}`);
    return parts.length ? parts.join(' | ') : '无条件';
  }

  function handleSelect(endingId: string) {
    playSFX('select');
    selectEnding(endingId);
  }

  function handleAddEnding() {
    playSFX('notify');
    addEnding();
  }

  function handleDeleteEnding(endingId: string) {
    if (confirm(`确定删除结局 "${endings.find(e => e.id === endingId)?.title || endingId}" 吗？`)) {
      playSFX('warning');
      deleteEnding(endingId);
    }
  }

  function handleUpdate(field: string, value: any) {
    if (!ending) return;
    playSFX('click');
    updateEnding(ending.id, { [field]: value });
  }

  function goToNode(nodeId: string) {
    playSFX('select');
    selectNode(nodeId);
    setActiveTab('nodes');
  }
</script>

<div class="ending-editor">
  <section class="section">
    <h2 class="section-title">🎬 结局条件编辑器</h2>
    <p class="section-desc">管理所有游戏结局，编辑触发条件、信任要求和路径关联</p>

    <div class="stats-bar">
      <div class="stat-card good">
        <span class="stat-icon">🌟</span>
        <div class="stat-info">
          <span class="stat-value">{goodCount}</span>
          <span class="stat-label">好结局</span>
        </div>
      </div>
      <div class="stat-card bad">
        <span class="stat-icon">💀</span>
        <div class="stat-info">
          <span class="stat-value">{badCount}</span>
          <span class="stat-label">坏结局</span>
        </div>
      </div>
      <div class="stat-card total">
        <span class="stat-icon">🎯</span>
        <div class="stat-info">
          <span class="stat-value">{endings.length}</span>
          <span class="stat-label">总结局数</span>
        </div>
      </div>
      <div class="stats-spacer"></div>
      <button class="action-btn add" on:click={handleAddEnding}>
        <span>+</span> 新增结局
      </button>
    </div>
  </section>

  <div class="editor-layout">
    <aside class="endings-list">
      <div class="list-header">
        <h3>结局列表</h3>
      </div>
      <div class="list-content">
        {#each endings as e}
          <div
            class="ending-item {ending?.id === e.id ? 'selected' : ''}"
            class:good={e.isGood}
            class:bad={!e.isGood}
            on:click={() => handleSelect(e.id)}
          >
            <div class="item-main">
              <span class="ending-icon">{e.isGood ? '🌟' : '💀'}</span>
              <div class="item-info">
                <span class="ending-title">{e.title}</span>
                <span class="ending-id">{e.id}</span>
              </div>
            </div>
            <div class="item-meta">
              {#if endingNodeMap[e.id]?.length}
                <span class="link-count">🔗 {endingNodeMap[e.id].length}</span>
              {/if}
              {#if e.id !== endings[0]?.id}
                <button
                  class="icon-btn danger tiny"
                  on:click|stopPropagation={() => handleDeleteEnding(e.id)}
                  title="删除"
                >×</button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </aside>

    <main class="ending-detail">
      {#if !ending}
        <div class="empty-state">
          <span class="empty-icon">🎬</span>
          <p>请在左侧选择或创建一个结局</p>
        </div>
      {:else}
        <section class="section">
          <div class="detail-header">
            <h3 class="detail-title">
              <span class="type-badge {ending.isGood ? 'good' : 'bad'}">
                {ending.isGood ? '好结局' : '坏结局'}
              </span>
              {ending.title}
            </h3>
          </div>

          <div class="form-grid">
            <div class="form-item">
              <label>结局 ID</label>
              <input type="text" value={ending.id} disabled class="input disabled" />
            </div>
            <div class="form-item">
              <label>结局标题</label>
              <input
                type="text"
                value={ending.title}
                on:input={(e) => handleUpdate('title', inputValue(e))}
                class="input"
                placeholder="例如：深海真相"
              />
            </div>
            <div class="form-item checkbox-item-inline">
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  checked={ending.isGood}
                  on:change={(e) => handleUpdate('isGood', inputChecked(e))}
                />
                <span>好结局（勾选为好结局，否则为坏结局）</span>
              </label>
            </div>
            <div class="form-item full">
              <label>结局描述</label>
              <textarea
                value={ending.description}
                on:input={(e) => handleUpdate('description', textareaValue(e))}
                class="input textarea"
                rows="4"
                placeholder="详细描述这个结局发生了什么..."
              ></textarea>
            </div>
            <div class="form-item full">
              <label>解锁条件说明（给策划的备注，不影响逻辑）</label>
              <input
                type="text"
                value={ending.unlockCondition || ''}
                on:input={(e) => handleUpdate('unlockCondition', inputValue(e))}
                class="input"
                placeholder="例如：收集所有线索、信任度达到80%..."
              />
            </div>
          </div>
        </section>

        <section class="section">
          <h3 class="subsection-title">🔗 直接触发节点</h3>
          <p class="subsection-desc">设置了 isEnding + endingId 的节点，到达即触发此结局</p>

          {#if !endingNodeMap[ending.id]?.length}
            <div class="empty-mini">
              <p>暂无直接触发节点。在节点编辑器中将节点的 endingId 设为 "{ending.id}" 即可关联。</p>
            </div>
          {:else}
            <div class="linked-nodes">
              {#each endingNodeMap[ending.id] as entry}
                {@const node = nodes.find(n => n.id === entry.nodeId)}
                <div class="linked-node-card" on:click={() => goToNode(entry.nodeId)}>
                  <div class="ln-icon">📝</div>
                  <div class="ln-info">
                    <span class="ln-id">{entry.nodeId}</span>
                    <span class="ln-title">{entry.title}</span>
                  </div>
                  <div class="ln-meta">
                    {#if node?.dialogues?.length}
                      <span>💬 {node.dialogues.length}</span>
                    {/if}
                  </div>
                  <button class="goto-btn">跳转 →</button>
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <section class="section">
          <h3 class="subsection-title">🔀 条件路径到达</h3>
          <p class="subsection-desc">通过分支条件（nextNodeBranches）或选项条件（choice.condition/trustCondition）可到达此结局的路径</p>

          {#if !endingPathMap[ending.id]?.length}
            <div class="empty-mini">
              <p>暂无条件路径。可在节点编辑器中添加 nextNodeBranches 或为选项设置条件来创建条件路径。</p>
            </div>
          {:else}
            <div class="path-list">
              {#each endingPathMap[ending.id] as pathEntry}
                <div class="path-entry">
                  <div class="path-from" on:click={() => goToNode(pathEntry.fromNodeId)}>
                    <span class="path-node-id">{pathEntry.fromNodeId}</span>
                    <span class="path-node-title">{pathEntry.fromTitle}</span>
                  </div>
                  {#each pathEntry.branches as branch}
                    <div class="path-arrow-row">
                      <span class="path-arrow">→</span>
                      <span class="path-condition-tag">{branch.condition}</span>
                      <span class="path-arrow">→</span>
                      <span class="path-to-node">{branch.toTitle}</span>
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
          {/if}
        </section>

        <section class="section">
          <h3 class="subsection-title">⚙️ 结局权重系统说明</h3>
          <p class="subsection-desc">
            真实游戏中，"命运裁定"节点（ending_resolve_*）通过结局权重系统（EndingWeight）动态决定最终结局。
            选项的 trustEffect 会影响各结局的权重。权重最高的结局将被触发。
          </p>
          <div class="weight-info">
            <div class="weight-row header">
              <span>选项</span>
              <span>影响结局权重</span>
            </div>
            {#each nodes.filter(n => n.choices?.length) as choiceNode}
              {#each (choiceNode.choices || []) as choice}
                <div class="weight-row">
                  <span class="weight-choice">[{choiceNode.id}] {choice.text}</span>
                  <span class="weight-effect">{choice.trustEffect?.hintText || '见信任效果'}</span>
                </div>
              {/each}
            {/each}
          </div>
        </section>

        <section class="section">
          <h3 class="subsection-title">📋 预览卡片</h3>
          <div class="preview-card {ending.isGood ? 'good' : 'bad'}">
            <div class="preview-header">
              <span class="preview-icon">{ending.isGood ? '🌟' : '💀'}</span>
              <div>
                <h4 class="preview-title">{ending.title}</h4>
                <span class="preview-type">{ending.isGood ? '好结局' : '坏结局'}</span>
              </div>
            </div>
            <p class="preview-desc">{ending.description}</p>
            {#if ending.unlockCondition}
              <div class="preview-condition">
                <span class="condition-label">解锁条件：</span>
                <span>{ending.unlockCondition}</span>
              </div>
            {/if}
            <div class="preview-reach-info">
              <span>直接触发: {endingNodeMap[ending.id]?.length || 0} 个节点</span>
              <span>·</span>
              <span>条件路径: {endingPathMap[ending.id]?.length || 0} 条</span>
            </div>
          </div>
        </section>
      {/if}
    </main>
  </div>
</div>

<style>
  .ending-editor {
    padding: 24px;
    max-width: 1300px;
    margin: 0 auto;
  }

  .section {
    margin-bottom: 24px;
    background: #0d1525;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 20px;
  }

  .section-title {
    margin: 0 0 6px;
    font-size: 1.1rem;
    color: #00d4b0;
    font-weight: 600;
  }

  .section-desc {
    margin: 0 0 18px;
    color: #6a8aaa;
    font-size: 0.85rem;
  }

  .subsection-title {
    margin: 0 0 6px;
    font-size: 0.95rem;
    color: #c090ff;
    font-weight: 600;
  }

  .subsection-desc {
    margin: 0 0 14px;
    color: #6a8aaa;
    font-size: 0.8rem;
  }

  .stats-bar {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
    padding: 14px;
    background: rgba(192, 144, 255, 0.04);
    border: 1px solid rgba(192, 144, 255, 0.12);
    border-radius: 8px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid;
  }

  .stat-card.good { background: rgba(100, 255, 150, 0.08); border-color: rgba(100, 255, 150, 0.25); }
  .stat-card.bad { background: rgba(255, 100, 100, 0.08); border-color: rgba(255, 100, 100, 0.25); }
  .stat-card.total { background: rgba(192, 144, 255, 0.08); border-color: rgba(192, 144, 255, 0.25); }
  .stat-icon { font-size: 1.6rem; }
  .stat-info { display: flex; flex-direction: column; }
  .stat-value { font-size: 1.4rem; font-weight: 700; line-height: 1; }
  .stat-card.good .stat-value { color: #64ff96; }
  .stat-card.bad .stat-value { color: #ff6464; }
  .stat-card.total .stat-value { color: #c090ff; }
  .stat-label { font-size: 0.72rem; color: #6a8aaa; margin-top: 2px; }
  .stats-spacer { flex: 1; }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(192, 144, 255, 0.15);
    border: 1px solid rgba(192, 144, 255, 0.4);
    border-radius: 6px;
    color: #c090ff;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .action-btn:hover { background: rgba(192, 144, 255, 0.28); }

  .editor-layout {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 20px;
    align-items: start;
  }

  .endings-list {
    background: #0d1525;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    overflow: hidden;
    position: sticky;
    top: 0;
  }

  .list-header {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(192, 144, 255, 0.05);
  }

  .list-header h3 { margin: 0; font-size: 0.9rem; color: #a0c0e0; font-weight: 600; }
  .list-content { max-height: 600px; overflow-y: auto; padding: 8px; }

  .ending-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
    border: 1px solid transparent;
    margin-bottom: 4px;
  }

  .ending-item:hover { background: rgba(255, 255, 255, 0.03); }
  .ending-item.selected { background: rgba(192, 144, 255, 0.12); border-color: rgba(192, 144, 255, 0.4); }
  .ending-item.good.selected { background: rgba(100, 255, 150, 0.08); border-color: rgba(100, 255, 150, 0.35); }
  .ending-item.bad.selected { background: rgba(255, 100, 100, 0.08); border-color: rgba(255, 100, 100, 0.35); }
  .item-main { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
  .ending-icon { font-size: 1.3rem; flex-shrink: 0; }
  .item-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .ending-title { font-size: 0.88rem; color: #c0d8f0; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ending-id { font-size: 0.72rem; color: #5a8aaa; font-family: 'Courier New', monospace; }
  .item-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .link-count { font-size: 0.7rem; color: #8ab0d0; padding: 2px 6px; background: rgba(255, 255, 255, 0.04); border-radius: 8px; }

  .icon-btn {
    width: 22px; height: 22px;
    display: inline-flex; align-items: center; justify-content: center;
    background: rgba(255, 80, 80, 0.12); border: 1px solid rgba(255, 80, 80, 0.3);
    border-radius: 4px; color: #ff8080; cursor: pointer; font-size: 0.85rem; transition: all 0.15s;
  }
  .icon-btn:hover { background: rgba(255, 80, 80, 0.25); }
  .icon-btn.tiny { width: 20px; height: 20px; font-size: 0.8rem; }

  .empty-state, .empty-mini {
    padding: 40px 20px; text-align: center; color: #5a8aaa;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .empty-mini { padding: 24px; font-size: 0.85rem; background: rgba(255, 255, 255, 0.02); border-radius: 6px; }
  .empty-icon { font-size: 2.5rem; opacity: 0.5; }

  .detail-header { margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid rgba(255, 255, 255, 0.06); }
  .detail-title { margin: 0; font-size: 1.1rem; color: #e0e6ed; display: flex; align-items: center; gap: 10px; }

  .type-badge { padding: 4px 12px; border-radius: 12px; font-size: 0.78rem; font-weight: 600; }
  .type-badge.good { background: rgba(100, 255, 150, 0.15); color: #64ff96; border: 1px solid rgba(100, 255, 150, 0.35); }
  .type-badge.bad { background: rgba(255, 100, 100, 0.15); color: #ff8080; border: 1px solid rgba(255, 100, 100, 0.35); }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .form-item { display: flex; flex-direction: column; gap: 5px; }
  .form-item.full { grid-column: 1 / -1; }
  .form-item.checkbox-item-inline { grid-column: 1 / -1; }
  .form-item label { font-size: 0.8rem; color: #6a8aaa; font-weight: 500; }

  .input {
    padding: 8px 12px; background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 5px;
    color: #c0d8f0; font-size: 0.9rem; outline: none; transition: all 0.2s; font-family: inherit;
  }
  .input:focus { border-color: rgba(192, 144, 255, 0.5); background: rgba(192, 144, 255, 0.04); }
  .input.disabled { opacity: 0.6; background: rgba(255, 255, 255, 0.02); }
  .input.textarea { resize: vertical; min-height: 80px; line-height: 1.6; }

  .checkbox-item { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.88rem; color: #a0c0e0; }
  .checkbox-item input { width: 16px; height: 16px; accent-color: #c090ff; }

  .linked-nodes { display: flex; flex-direction: column; gap: 8px; }

  .linked-node-card {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px;
    background: rgba(192, 144, 255, 0.04); border: 1px solid rgba(192, 144, 255, 0.12);
    border-radius: 6px; cursor: pointer; transition: all 0.15s;
  }
  .linked-node-card:hover { background: rgba(192, 144, 255, 0.1); border-color: rgba(192, 144, 255, 0.3); transform: translateX(4px); }
  .ln-icon { font-size: 1.3rem; }
  .ln-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .ln-id { font-family: 'Courier New', monospace; font-size: 0.78rem; color: #c090ff; }
  .ln-title { font-size: 0.85rem; color: #a0c0e0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ln-meta { display: flex; gap: 10px; font-size: 0.75rem; color: #6a8aaa; }

  .goto-btn {
    padding: 5px 10px; background: rgba(192, 144, 255, 0.15);
    border: 1px solid rgba(192, 144, 255, 0.3); border-radius: 4px;
    color: #c090ff; cursor: pointer; font-size: 0.78rem; transition: all 0.15s;
  }
  .goto-btn:hover { background: rgba(192, 144, 255, 0.28); }

  .path-list { display: flex; flex-direction: column; gap: 10px; }
  .path-entry {
    padding: 12px 14px; background: rgba(0, 200, 160, 0.04);
    border: 1px solid rgba(0, 200, 160, 0.12); border-radius: 6px;
  }
  .path-from {
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    margin-bottom: 6px;
  }
  .path-from:hover { opacity: 0.8; }
  .path-node-id { font-family: 'Courier New', monospace; font-size: 0.8rem; color: #00d4b0; }
  .path-node-title { font-size: 0.85rem; color: #a0c0e0; }
  .path-arrow-row { display: flex; align-items: center; gap: 8px; padding-left: 20px; margin-bottom: 4px; }
  .path-arrow { color: #5a8aaa; font-size: 0.8rem; }
  .path-condition-tag {
    font-size: 0.78rem; color: #c090ff; padding: 2px 8px;
    background: rgba(192, 144, 255, 0.08); border: 1px solid rgba(192, 144, 255, 0.2);
    border-radius: 4px;
  }
  .path-to-node { font-size: 0.82rem; color: #a0c0e0; }

  .weight-info {
    background: rgba(0, 0, 0, 0.2); border-radius: 6px; padding: 10px;
    max-height: 200px; overflow-y: auto;
  }
  .weight-row {
    display: flex; gap: 12px; padding: 6px 10px; font-size: 0.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }
  .weight-row.header { color: #6a8aaa; font-weight: 600; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
  .weight-choice { color: #a0c0e0; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .weight-effect { color: #c090ff; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .preview-card { padding: 20px; border-radius: 8px; border: 1px solid; }
  .preview-card.good { background: linear-gradient(135deg, rgba(100, 255, 150, 0.08), rgba(100, 255, 150, 0.02)); border-color: rgba(100, 255, 150, 0.25); }
  .preview-card.bad { background: linear-gradient(135deg, rgba(255, 100, 100, 0.08), rgba(255, 100, 100, 0.02)); border-color: rgba(255, 100, 100, 0.25); }
  .preview-header { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
  .preview-icon { font-size: 2.2rem; }
  .preview-title { margin: 0 0 3px; font-size: 1.2rem; color: #e0e6ed; }
  .preview-type { font-size: 0.8rem; }
  .preview-card.good .preview-type { color: #64ff96; }
  .preview-card.bad .preview-type { color: #ff8080; }
  .preview-desc { margin: 0 0 14px; color: #a0c0e0; font-size: 0.92rem; line-height: 1.7; }
  .preview-condition {
    padding: 10px 14px; background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 5px;
    font-size: 0.85rem; color: #8ab0d0; margin-bottom: 10px;
  }
  .condition-label { color: #c090ff; font-weight: 600; margin-right: 6px; }
  .preview-reach-info { font-size: 0.8rem; color: #6a8aaa; display: flex; gap: 8px; }
</style>

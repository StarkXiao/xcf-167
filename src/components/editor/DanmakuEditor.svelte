<script lang="ts">
  import { get } from 'svelte/store';
  import {
    editorState,
    allNodes,
    selectedNode,
    setDanmakuFilter,
    addDanmaku,
    updateDanmaku,
    deleteDanmaku
  } from '../../lib/editorStore';
  import { playSFX } from '../../lib/audio';

  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function inputChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }

  $: node = $selectedNode;
  $: filter = $editorState.danmakuFilter;

  $: filteredDanmakus = (() => {
    const result: { nodeId: string; nodeTitle: string; danmakus: Array<{ index: number; data: any }> }[] = [];
    const nodes = filter.nodeId
      ? get(allNodes).filter(n => n.id === filter.nodeId)
      : get(allNodes);

    for (const n of nodes) {
      if (!n.danmakus || n.danmakus.length === 0) continue;
      let nodeDanmakus = n.danmakus.map((d, i) => ({ index: i, data: d }));
      
      if (filter.showBackendOnly) {
        nodeDanmakus = nodeDanmakus.filter(d => d.data.isBackendOnly);
      }
      if (filter.dialogueIndex !== null && filter.dialogueIndex !== undefined) {
        nodeDanmakus = nodeDanmakus.filter(d => d.data.dialogueIndex === filter.dialogueIndex);
      }

      nodeDanmakus.sort((a, b) => {
        const ai = (a.data.dialogueIndex ?? 0) * 100000 + (a.data.relativeMs ?? a.data.timestamp ?? 0);
        const bi = (b.data.dialogueIndex ?? 0) * 100000 + (b.data.relativeMs ?? b.data.timestamp ?? 0);
        return ai - bi;
      });

      if (nodeDanmakus.length > 0) {
        result.push({
          nodeId: n.id,
          nodeTitle: n.title || n.id,
          danmakus: nodeDanmakus
        });
      }
    }
    return result;
  })();

  $: totalCount = filteredDanmakus.reduce((sum, g) => sum + g.danmakus.length, 0);

  function handleFilterField(field: string, value: any) {
    playSFX('click');
    setDanmakuFilter({ [field]: value });
  }

  function handleAddDanmaku() {
    if (!node) {
      alert('请先在左侧选择一个节点');
      return;
    }
    playSFX('notify');
    addDanmaku(node.id);
  }

  function handleUpdateDanmaku(nodeId: string, danmakuIndex: number, field: string, value: any) {
    updateDanmaku(nodeId, danmakuIndex, { [field]: value });
  }

  function handleDeleteDanmaku(nodeId: string, danmakuIndex: number) {
    if (confirm('确定删除这条弹幕吗？')) {
      playSFX('warning');
      deleteDanmaku(nodeId, danmakuIndex);
    }
  }

  function formatTime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const ss = (s % 60).toString().padStart(2, '0');
    const mmm = (ms % 1000).toString().padStart(3, '0');
    return `${m}:${ss}.${mmm}`;
  }
</script>

<div class="danmaku-editor">
  <section class="section">
    <h2 class="section-title">弹幕时间轴编辑器</h2>
    <p class="section-desc">管理所有节点的弹幕数据，可按节点、对白序号筛选，并可视化时间轴</p>

    <div class="filter-bar">
      <div class="filter-group">
        <label>筛选节点</label>
        <select
          value={filter.nodeId || ''}
          on:change={(e) => handleFilterField('nodeId', selectValue(e) || null)}
          class="input"
        >
          <option value="">全部节点</option>
          {#each get(allNodes) as n}
            <option value={n.id}>{n.id} {n.title ? `- ${n.title}` : ''}</option>
          {/each}
        </select>
      </div>
      <div class="filter-group">
        <label>对白序号</label>
        <input
          type="number"
          value={filter.dialogueIndex ?? ''}
          on:input={(e) => {
            const v = inputValue(e);
            handleFilterField('dialogueIndex', v === '' ? null : Number(v));
          }}
          class="input small"
          placeholder="全部"
          min="0"
        />
      </div>
      <div class="filter-group">
        <label class="checkbox-item">
          <input
            type="checkbox"
            checked={filter.showBackendOnly}
            on:change={(e) => handleFilterField('showBackendOnly', inputChecked(e))}
          />
          <span>仅显示后台弹幕</span>
        </label>
      </div>
      <div class="filter-actions">
        <div class="count-info">共 <strong>{totalCount}</strong> 条弹幕</div>
        <button class="action-btn add" on:click={handleAddDanmaku}>
          <span>+</span> 添加弹幕到当前节点
        </button>
      </div>
    </div>
  </section>

  {#if filteredDanmakus.length === 0}
    <div class="empty-state">
      <span class="empty-icon">💬</span>
      <p>当前筛选条件下没有弹幕</p>
      {#if node}
        <button class="action-btn add" on:click={handleAddDanmaku}>添加第一条弹幕</button>
      {/if}
    </div>
  {:else}
    <div class="danmaku-groups">
      {#each filteredDanmakus as group}
        <section class="section danmaku-group">
          <div class="group-header">
            <h3 class="group-title">
              <span class="node-id-tag">{group.nodeId}</span>
              {group.nodeTitle !== group.nodeId && group.nodeTitle}
            </h3>
            <span class="group-count">{group.danmakus.length} 条</span>
          </div>

          <div class="timeline-container">
            <div class="timeline-scale">
              {#each Array.from({ length: 6 }) as _, i}
                <div class="scale-mark">
                  <span>{i * 2}s</span>
                  <div class="scale-line"></div>
                </div>
              {/each}
            </div>

            <div class="timeline-tracks">
              {#each group.danmakus as dm}
                {@const position = Math.min(((dm.data.relativeMs ?? dm.data.timestamp ?? 0) / 10000) * 100, 98)}
                {@const dialogueOffset = (dm.data.dialogueIndex ?? 0) * 20}
                <div
                  class="timeline-item"
                  style="left: {position}%; top: {dialogueOffset % 80}px;"
                  style:background={dm.data.color || '#66ccff'}
                  style:border-color={dm.data.isBackendOnly ? '#00ffcc' : 'transparent'}
                  class:important={dm.data.isImportant}
                  class:backend={dm.data.isBackendOnly}
                  title={`${dm.data.username}: ${dm.data.content}`}
                >
                  <span class="tl-username">{dm.data.username}</span>
                  <span class="tl-content">{dm.data.content}</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="danmaku-table-wrap">
            <table class="danmaku-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>用户名</th>
                  <th>内容</th>
                  <th>对白#</th>
                  <th>相对时间</th>
                  <th>颜色</th>
                  <th>标记</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {#each group.danmakus as dm}
                  <tr class:important={dm.data.isImportant} class:backend={dm.data.isBackendOnly}>
                    <td class="col-index">{dm.index + 1}</td>
                    <td class="col-user">
                      <input
                        type="text"
                        value={dm.data.username}
                        on:input={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'username', inputValue(e))}
                        class="table-input"
                      />
                    </td>
                    <td class="col-content">
                      <input
                        type="text"
                        value={dm.data.content}
                        on:input={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'content', inputValue(e))}
                        class="table-input wide"
                      />
                    </td>
                    <td class="col-num">
                      <input
                        type="number"
                        value={dm.data.dialogueIndex ?? 0}
                        on:input={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'dialogueIndex', Number(inputValue(e)))}
                        class="table-input tiny"
                        min="0"
                      />
                    </td>
                    <td class="col-time">
                      <div class="time-input-wrap">
                        <input
                          type="number"
                          value={dm.data.relativeMs ?? dm.data.timestamp ?? 0}
                          on:input={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'relativeMs', Number(inputValue(e)))}
                          class="table-input small mono"
                          min="0"
                          step="50"
                        />
                        <span class="time-hint">{formatTime(dm.data.relativeMs ?? dm.data.timestamp ?? 0)}</span>
                      </div>
                    </td>
                    <td class="col-color">
                      <div class="color-input-wrap">
                        <input
                          type="color"
                          value={dm.data.color || '#ffffff'}
                          on:input={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'color', inputValue(e))}
                          class="color-picker"
                        />
                        <input
                          type="text"
                          value={dm.data.color || ''}
                          on:input={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'color', inputValue(e))}
                          class="table-input tiny mono"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </td>
                    <td class="col-flags">
                      <label class="mini-check" title="重要弹幕">
                        <input
                          type="checkbox"
                          checked={!!dm.data.isImportant}
                          on:change={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'isImportant', inputChecked(e))}
                        />
                        <span>⭐</span>
                      </label>
                      <label class="mini-check" title="后台弹幕">
                        <input
                          type="checkbox"
                          checked={!!dm.data.isBackendOnly}
                          on:change={(e) => handleUpdateDanmaku(group.nodeId, dm.index, 'isBackendOnly', inputChecked(e))}
                        />
                        <span>🔧</span>
                      </label>
                    </td>
                    <td class="col-actions">
                      <button
                        class="icon-btn danger tiny"
                        on:click={() => handleDeleteDanmaku(group.nodeId, dm.index)}
                        title="删除"
                      >×</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .danmaku-editor {
    padding: 24px;
    max-width: 1200px;
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

  .filter-bar {
    display: flex;
    align-items: flex-end;
    gap: 16px;
    flex-wrap: wrap;
    padding: 14px;
    background: rgba(0, 200, 160, 0.04);
    border: 1px solid rgba(0, 200, 160, 0.12);
    border-radius: 8px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .filter-group label {
    font-size: 0.78rem;
    color: #6a8aaa;
    font-weight: 500;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: #a0c0e0;
    cursor: pointer;
    flex-direction: row !important;
    margin-top: auto;
  }

  .checkbox-item input {
    accent-color: #00d4b0;
  }

  .input {
    padding: 7px 11px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.2s;
  }

  .input:focus {
    border-color: rgba(0, 200, 160, 0.5);
  }

  .input.small {
    width: 100px;
  }

  .filter-actions {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .count-info {
    font-size: 0.85rem;
    color: #6a8aaa;
  }

  .count-info strong {
    color: #00d4b0;
    font-size: 1rem;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(0, 200, 160, 0.15);
    border: 1px solid rgba(0, 200, 160, 0.4);
    border-radius: 6px;
    color: #00d4b0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(0, 200, 160, 0.28);
  }

  .empty-state {
    padding: 60px 20px;
    text-align: center;
    color: #5a8aaa;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .danmaku-group {
    margin-bottom: 20px;
  }

  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .group-title {
    margin: 0;
    font-size: 0.95rem;
    color: #a0c0e0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .node-id-tag {
    padding: 3px 10px;
    background: rgba(0, 200, 160, 0.12);
    border: 1px solid rgba(0, 200, 160, 0.3);
    border-radius: 4px;
    color: #00d4b0;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
  }

  .group-count {
    font-size: 0.8rem;
    color: #6a8aaa;
    padding: 3px 10px;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 10px;
  }

  .timeline-container {
    margin-bottom: 18px;
    padding: 14px;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    overflow-x: auto;
  }

  .timeline-scale {
    display: flex;
    position: relative;
    margin-bottom: 6px;
    height: 24px;
  }

  .scale-mark {
    flex: 1;
    position: relative;
  }

  .scale-mark span {
    font-size: 0.7rem;
    color: #4a6a8a;
  }

  .scale-line {
    position: absolute;
    left: 0;
    top: 20px;
    width: 1px;
    height: 90px;
    background: rgba(255, 255, 255, 0.05);
  }

  .timeline-tracks {
    position: relative;
    height: 100px;
    min-width: 500px;
  }

  .timeline-item {
    position: absolute;
    max-width: 180px;
    padding: 4px 8px;
    background: #66ccff;
    color: #000;
    border-radius: 4px;
    font-size: 0.72rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border: 1px solid;
    cursor: default;
    transition: transform 0.15s, box-shadow 0.15s;
    z-index: 1;
  }

  .timeline-item:hover {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    z-index: 10;
    white-space: normal;
    max-width: 250px;
  }

  .timeline-item.important {
    box-shadow: 0 0 8px rgba(255, 204, 0, 0.5);
  }

  .timeline-item.backend {
    font-style: italic;
  }

  .tl-username {
    font-weight: 700;
    margin-right: 6px;
  }

  .danmaku-table-wrap {
    overflow-x: auto;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 6px;
  }

  .danmaku-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    min-width: 800px;
  }

  .danmaku-table th,
  .danmaku-table td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .danmaku-table th {
    background: rgba(0, 200, 160, 0.08);
    color: #00d4b0;
    font-weight: 600;
    font-size: 0.8rem;
    position: sticky;
    top: 0;
  }

  .danmaku-table tbody tr {
    transition: background 0.15s;
  }

  .danmaku-table tbody tr:hover {
    background: rgba(0, 200, 160, 0.04);
  }

  .danmaku-table tbody tr.important {
    background: rgba(255, 204, 0, 0.05);
  }

  .danmaku-table tbody tr.backend {
    background: rgba(0, 255, 204, 0.04);
  }

  .col-index {
    width: 40px;
    color: #5a8aaa;
    font-family: 'Courier New', monospace;
  }

  .table-input {
    width: 100%;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 4px;
    color: #c0d8f0;
    font-size: 0.82rem;
    outline: none;
    transition: all 0.15s;
  }

  .table-input:focus {
    border-color: rgba(0, 200, 160, 0.5);
    background: rgba(0, 200, 160, 0.04);
  }

  .table-input.wide {
    min-width: 200px;
  }

  .table-input.small {
    width: 90px;
  }

  .table-input.tiny {
    width: 70px;
  }

  .table-input.mono {
    font-family: 'Courier New', monospace;
  }

  .time-input-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .time-hint {
    font-size: 0.72rem;
    color: #5a8aaa;
    font-family: 'Courier New', monospace;
    white-space: nowrap;
  }

  .color-input-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .color-picker {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
  }

  .col-flags {
    display: flex;
    gap: 8px;
  }

  .mini-check {
    display: flex;
    align-items: center;
    gap: 3px;
    cursor: pointer;
  }

  .mini-check input {
    width: 14px;
    height: 14px;
    accent-color: #00d4b0;
  }

  .col-actions {
    width: 50px;
    text-align: center;
  }

  .icon-btn {
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 80, 80, 0.12);
    border: 1px solid rgba(255, 80, 80, 0.3);
    border-radius: 4px;
    color: #ff8080;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.15s;
  }

  .icon-btn:hover {
    background: rgba(255, 80, 80, 0.25);
  }

  .icon-btn.tiny {
    width: 22px;
    height: 22px;
    font-size: 0.85rem;
  }
</style>

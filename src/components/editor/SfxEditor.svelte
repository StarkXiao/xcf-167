<script lang="ts">
  import { get } from 'svelte/store';
  import {
    editorState,
    allNodes,
    selectedNode,
    sfxTypes,
    setSfxFilter,
    addSfx,
    updateSfx,
    deleteSfx
  } from '../../lib/editorStore';
  import { playSFX } from '../../lib/audio';
  import type { SFXType } from '../../types/game';

  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }

  $: node = $selectedNode;
  $: filter = $editorState.sfxFilter;

  $: sfxEntries = (() => {
    const result: {
      nodeId: string;
      nodeTitle: string;
      dialogues: Array<{
        dialogueIndex: number;
        speaker: string;
        text: string;
        sfxList: Array<{ sfxIndex: number; data: any }>;
      }>;
    }[] = [];

    const nodes = filter.nodeId
      ? get(allNodes).filter(n => n.id === filter.nodeId)
      : get(allNodes);

    for (const n of nodes) {
      const dialoguesWithSfx: any[] = [];

      for (let dIdx = 0; dIdx < (n.dialogues?.length || 0); dIdx++) {
        if (filter.dialogueIndex !== null && filter.dialogueIndex !== undefined && dIdx !== filter.dialogueIndex) continue;

        const dialogue = n.dialogues[dIdx];
        if (!dialogue.sfx || dialogue.sfx.length === 0) continue;

        let sfxList = dialogue.sfx.map((s, sIdx) => ({ sfxIndex: sIdx, data: s }));
        if (filter.sfxType) {
          sfxList = sfxList.filter(s => s.data.sfx === filter.sfxType);
        }
        if (sfxList.length === 0) continue;

        dialoguesWithSfx.push({
          dialogueIndex: dIdx,
          speaker: dialogue.speaker,
          text: dialogue.text,
          sfxList
        });
      }

      if (dialoguesWithSfx.length > 0) {
        result.push({
          nodeId: n.id,
          nodeTitle: n.title || n.id,
          dialogues: dialoguesWithSfx
        });
      }
    }
    return result;
  })();

  $: totalSfxCount = sfxEntries.reduce((sum, g) =>
    sum + g.dialogues.reduce((s, d) => s + d.sfxList.length, 0), 0
  );

  const sfxCategoryMap: Record<string, string[]> = {
    '环境声': ['bubbles', 'water_drip', 'water_flow', 'hull_pressure', 'metal_creak', 'metal_crash', 'thunder', 'sonar'],
    '系统提示': ['click', 'select', 'warning', 'alarm', 'static', 'radio_noise', 'keyboard', 'notify', 'door_slam'],
    '心理氛围': ['whisper', 'heartbeat', 'breath', 'glass_crack']
  };

  function handleFilterField(field: string, value: any) {
    playSFX('click');
    setSfxFilter({ [field]: value });
  }

  function handleAddSfx() {
    if (!node) {
      alert('请先在左侧选择一个节点');
      return;
    }
    const dialogueIndex = filter.dialogueIndex ?? 0;
    if (!node.dialogues || !node.dialogues[dialogueIndex]) {
      alert('该节点没有对应序号的对白');
      return;
    }
    playSFX('notify');
    addSfx(node.id, dialogueIndex);
  }

  function handleUpdateSfx(nodeId: string, dialogueIndex: number, sfxIndex: number, field: string, value: any) {
    updateSfx(nodeId, dialogueIndex, sfxIndex, { [field]: value });
  }

  function handleDeleteSfx(nodeId: string, dialogueIndex: number, sfxIndex: number) {
    if (confirm('确定删除这个音效吗？')) {
      playSFX('warning');
      deleteSfx(nodeId, dialogueIndex, sfxIndex);
    }
  }

  function testPlay(type: string) {
    playSFX(type as SFXType);
  }
</script>

<div class="sfx-editor">
  <section class="section">
    <h2 class="section-title">🔊 音效触发编辑器</h2>
    <p class="section-desc">管理所有对白触发的音效，包括类型、延迟、音量等参数</p>

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
        <label>音效类型</label>
        <select
          value={filter.sfxType || ''}
          on:change={(e) => handleFilterField('sfxType', selectValue(e) || null)}
          class="input"
        >
          <option value="">全部类型</option>
          {#each sfxTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </div>
      <div class="filter-actions">
        <div class="count-info">共 <strong>{totalSfxCount}</strong> 个音效</div>
        <button class="action-btn add" on:click={handleAddSfx}>
          <span>+</span> 添加音效
        </button>
      </div>
    </div>
  </section>

  <section class="section sfx-library">
    <h3 class="subsection-title">📚 音效素材库（点击试听）</h3>
    <div class="sfx-categories">
      {#each Object.entries(sfxCategoryMap) as [category, types]}
        <div class="sfx-category">
          <div class="category-label">{category}</div>
          <div class="sfx-chips">
            {#each types as type}
              <button
                class="sfx-chip"
                class:active={filter.sfxType === type}
                on:click={() => testPlay(type)}
                on:dblclick={() => handleFilterField('sfxType', filter.sfxType === type ? null : type)}
                title="单击试听 · 双击筛选"
              >
                <span class="chip-icon">▶</span>
                <span class="chip-name">{type}</span>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  {#if sfxEntries.length === 0}
    <div class="empty-state">
      <span class="empty-icon">🔊</span>
      <p>当前筛选条件下没有音效数据</p>
      {#if node}
        <button class="action-btn add" on:click={handleAddSfx}>添加第一个音效</button>
      {/if}
    </div>
  {:else}
    <div class="sfx-groups">
      {#each sfxEntries as group}
        <section class="section sfx-group">
          <div class="group-header">
            <h3 class="group-title">
              <span class="node-id-tag">{group.nodeId}</span>
              {group.nodeTitle !== group.nodeId && group.nodeTitle}
            </h3>
            <span class="group-count">
              {group.dialogues.length} 段对白 · {group.dialogues.reduce((s, d) => s + d.sfxList.length, 0)} 个音效
            </span>
          </div>

          <div class="dialogue-sfx-list">
            {#each group.dialogues as dEntry}
              <div class="dialogue-sfx-card">
                <div class="dialogue-header">
                  <span class="dialogue-index">#{dEntry.dialogueIndex + 1}</span>
                  <span class="speaker-tag">{dEntry.speaker || '(旁白)'}</span>
                  <span class="dialogue-text">
                    {dEntry.text.length > 120 ? dEntry.text.slice(0, 120) + '...' : dEntry.text}
                  </span>
                </div>

                <div class="sfx-rows">
                  {#each dEntry.sfxList as sEntry}
                    <div class="sfx-row">
                      <div class="sfx-row-fields">
                        <div class="field-block">
                          <label>音效类型</label>
                          <div class="type-select-wrap">
                            <select
                              value={sEntry.data.sfx}
                              on:change={(e) => handleUpdateSfx(group.nodeId, dEntry.dialogueIndex, sEntry.sfxIndex, 'sfx', selectValue(e))}
                              class="input"
                            >
                              {#each sfxTypes as type}
                                <option value={type}>{type}</option>
                              {/each}
                            </select>
                            <button
                              class="play-btn"
                              on:click={() => testPlay(sEntry.data.sfx)}
                              title="试听"
                            >▶</button>
                          </div>
                        </div>

                        <div class="field-block">
                          <label>延迟 (ms)</label>
                          <div class="range-wrap">
                            <input
                              type="range"
                              min="0"
                              max="5000"
                              step="50"
                              value={sEntry.data.delay ?? 0}
                              on:input={(e) => handleUpdateSfx(group.nodeId, dEntry.dialogueIndex, sEntry.sfxIndex, 'delay', Number(inputValue(e)))}
                              class="range-input"
                            />
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={sEntry.data.delay ?? 0}
                              on:input={(e) => handleUpdateSfx(group.nodeId, dEntry.dialogueIndex, sEntry.sfxIndex, 'delay', Number(inputValue(e)))}
                              class="input tiny number-input"
                            />
                          </div>
                        </div>

                        <div class="field-block">
                          <label>音量 (0-1)</label>
                          <div class="range-wrap">
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.05"
                              value={sEntry.data.volume ?? 0.8}
                              on:input={(e) => handleUpdateSfx(group.nodeId, dEntry.dialogueIndex, sEntry.sfxIndex, 'volume', Number(inputValue(e)))}
                              class="range-input"
                            />
                            <input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              value={sEntry.data.volume ?? 0.8}
                              on:input={(e) => handleUpdateSfx(group.nodeId, dEntry.dialogueIndex, sEntry.sfxIndex, 'volume', Number(inputValue(e)))}
                              class="input tiny number-input"
                            />
                          </div>
                        </div>
                      </div>

                      <div class="sfx-visual">
                        <div
                          class="timeline-bar"
                          style="--delay: {Math.min((sEntry.data.delay ?? 0) / 5000 * 100, 100)}%;"
                        >
                          <div class="bar-fill"></div>
                          <div
                            class="sfx-marker"
                            style="left: {Math.min((sEntry.data.delay ?? 0) / 5000 * 100, 95)}%; opacity: {sEntry.data.volume ?? 0.8};"
                          ></div>
                        </div>
                        <div class="timeline-labels">
                          <span>0s</span>
                          <span>2.5s</span>
                          <span>5s</span>
                        </div>
                      </div>

                      <button
                        class="icon-btn danger tiny"
                        on:click={() => handleDeleteSfx(group.nodeId, dEntry.dialogueIndex, sEntry.sfxIndex)}
                        title="删除"
                      >×</button>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sfx-editor {
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

  .subsection-title {
    margin: 0 0 14px;
    font-size: 0.95rem;
    color: #ffc050;
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
    background: rgba(255, 192, 80, 0.04);
    border: 1px solid rgba(255, 192, 80, 0.12);
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

  .input {
    padding: 7px 11px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.85rem;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }

  .input:focus {
    border-color: rgba(255, 192, 80, 0.5);
  }

  .input.small {
    width: 100px;
  }

  .input.tiny {
    width: 65px;
    padding: 5px 8px;
    font-size: 0.8rem;
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
    color: #ffc050;
    font-size: 1rem;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 192, 80, 0.15);
    border: 1px solid rgba(255, 192, 80, 0.4);
    border-radius: 6px;
    color: #ffc050;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .action-btn:hover {
    background: rgba(255, 192, 80, 0.28);
  }

  .sfx-categories {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sfx-category {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .category-label {
    width: 80px;
    flex-shrink: 0;
    font-size: 0.8rem;
    color: #8ab0d0;
    padding-top: 6px;
    font-weight: 500;
  }

  .sfx-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    flex: 1;
  }

  .sfx-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    color: #a0c0e0;
    cursor: pointer;
    font-size: 0.78rem;
    transition: all 0.15s;
  }

  .sfx-chip:hover {
    background: rgba(255, 192, 80, 0.12);
    border-color: rgba(255, 192, 80, 0.4);
    color: #ffc050;
  }

  .sfx-chip.active {
    background: rgba(255, 192, 80, 0.2);
    border-color: rgba(255, 192, 80, 0.6);
    color: #ffc050;
  }

  .chip-icon {
    font-size: 0.65rem;
    opacity: 0.7;
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

  .sfx-group {
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
    background: rgba(255, 192, 80, 0.12);
    border: 1px solid rgba(255, 192, 80, 0.3);
    border-radius: 4px;
    color: #ffc050;
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

  .dialogue-sfx-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .dialogue-sfx-card {
    padding: 14px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
  }

  .dialogue-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.06);
  }

  .dialogue-index {
    width: 34px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 192, 80, 0.12);
    border: 1px solid rgba(255, 192, 80, 0.25);
    border-radius: 5px;
    color: #ffc050;
    font-family: 'Courier New', monospace;
    font-size: 0.78rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .speaker-tag {
    font-size: 0.82rem;
    color: #ffd080;
    font-weight: 600;
    flex-shrink: 0;
  }

  .dialogue-text {
    font-size: 0.82rem;
    color: #a0c0e0;
    opacity: 0.8;
  }

  .sfx-rows {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .sfx-row {
    display: flex;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
    background: rgba(255, 192, 80, 0.03);
    border: 1px solid rgba(255, 192, 80, 0.08);
    border-radius: 6px;
  }

  .sfx-row-fields {
    display: flex;
    gap: 16px;
    flex: 1;
    flex-wrap: wrap;
  }

  .field-block {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 160px;
  }

  .field-block label {
    font-size: 0.72rem;
    color: #6a8aaa;
    font-weight: 500;
  }

  .type-select-wrap {
    display: flex;
    gap: 4px;
  }

  .play-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 200, 160, 0.12);
    border: 1px solid rgba(0, 200, 160, 0.3);
    border-radius: 5px;
    color: #00d4b0;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .play-btn:hover {
    background: rgba(0, 200, 160, 0.25);
  }

  .range-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .range-input {
    flex: 1;
    accent-color: #ffc050;
    min-width: 100px;
  }

  .number-input {
    font-family: 'Courier New', monospace;
  }

  .sfx-visual {
    width: 200px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    justify-content: center;
  }

  .timeline-bar {
    position: relative;
    height: 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 3px;
    overflow: hidden;
  }

  .bar-fill {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: var(--delay);
    background: linear-gradient(90deg, rgba(255, 192, 80, 0.3), rgba(255, 192, 80, 0.08));
  }

  .sfx-marker {
    position: absolute;
    top: 2px;
    bottom: 2px;
    width: 4px;
    background: #ffc050;
    border-radius: 2px;
    box-shadow: 0 0 6px rgba(255, 192, 80, 0.6);
    transition: left 0.2s, opacity 0.2s;
  }

  .timeline-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: #4a6a8a;
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
    align-self: center;
    flex-shrink: 0;
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

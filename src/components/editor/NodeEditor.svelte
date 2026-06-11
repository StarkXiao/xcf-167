<script lang="ts">
  import { get } from 'svelte/store';
  import {
    editorState,
    selectedNode,
    nodeOptions,
    moodTypes,
    bgmTypes,
    sfxTypes,
    updateNode,
    addDialogue,
    updateDialogue,
    deleteDialogue,
    moveDialogue,
    selectDialogue,
    addChoice,
    updateChoice,
    deleteChoice,
    addSfx,
    updateSfx,
    deleteSfx
  } from '../../lib/editorStore';
  import { playSFX } from '../../lib/audio';
  import type { BGMType, MoodType, SFXType } from '../../types/game';

  function inputValue(e: Event): string { return (e.target as HTMLInputElement).value; }
  function inputNumber(e: Event): number { return Number((e.target as HTMLInputElement).value); }
  function inputChecked(e: Event): boolean { return (e.target as HTMLInputElement).checked; }
  function selectValue(e: Event): string { return (e.target as HTMLSelectElement).value; }
  function textareaValue(e: Event): string { return (e.target as HTMLTextAreaElement).value; }

  $: node = $selectedNode;
  $: selectedDialogueIdx = $editorState.selectedDialogueIndex;
  $: dialogues = node?.dialogues || [];
  $: choices = node?.choices || [];

  function handleNodeUpdate(field: string, value: any) {
    if (!node) return;
    playSFX('click');
    updateNode(node.id, { [field]: value });
  }

  function handleAddDialogue() {
    if (!node) return;
    playSFX('notify');
    addDialogue(node.id);
  }

  function handleUpdateDialogue(index: number, field: string, value: any) {
    if (!node) return;
    updateDialogue(node.id, index, { [field]: value });
  }

  function handleDeleteDialogue(index: number) {
    if (!node) return;
    if (confirm(`确定删除第 ${index + 1} 条对白吗？`)) {
      playSFX('warning');
      deleteDialogue(node.id, index);
    }
  }

  function handleMoveDialogue(index: number, direction: -1 | 1) {
    if (!node) return;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= dialogues.length) return;
    playSFX('click');
    moveDialogue(node.id, index, newIndex);
  }

  function handleSelectDialogue(index: number) {
    playSFX('select');
    selectDialogue(index);
  }

  function handleAddChoice() {
    if (!node) return;
    playSFX('notify');
    addChoice(node.id);
  }

  function handleUpdateChoice(index: number, field: string, value: any) {
    if (!node) return;
    updateChoice(node.id, index, { [field]: value });
  }

  function handleDeleteChoice(index: number) {
    if (!node) return;
    if (confirm(`确定删除第 ${index + 1} 个选项吗？`)) {
      playSFX('warning');
      deleteChoice(node.id, index);
    }
  }

  function handleAddSfx(dialogueIndex: number) {
    if (!node) return;
    playSFX('notify');
    addSfx(node.id, dialogueIndex);
  }

  function handleUpdateSfx(dialogueIndex: number, sfxIndex: number, field: string, value: any) {
    if (!node) return;
    updateSfx(node.id, dialogueIndex, sfxIndex, { [field]: value });
  }

  function handleDeleteSfx(dialogueIndex: number, sfxIndex: number) {
    if (!node) return;
    playSFX('warning');
    deleteSfx(node.id, dialogueIndex, sfxIndex);
  }

  function testPlaySfx(sfxType: string) {
    playSFX(sfxType as SFXType);
  }
</script>

{#if !node}
  <div class="empty-state">
    <span class="empty-icon">📝</span>
    <p>请在左侧选择或创建一个剧情节点</p>
  </div>
{:else}
  <div class="node-editor">
    <section class="section node-basic">
      <h2 class="section-title">节点基本信息</h2>
      <div class="form-grid">
        <div class="form-item">
          <label>节点 ID</label>
          <input
            type="text"
            value={node.id}
            disabled
            class="input disabled"
          />
        </div>
        <div class="form-item">
          <label>节点标题</label>
          <input
            type="text"
            value={node.title || ''}
            on:input={(e) => handleNodeUpdate('title', inputValue(e))}
            class="input"
            placeholder="例如：【直播开始】"
          />
        </div>
        <div class="form-item">
          <label>背景场景</label>
          <input
            type="text"
            value={node.background || ''}
            on:input={(e) => handleNodeUpdate('background', inputValue(e))}
            class="input"
            placeholder="intro, cockpit, descent..."
          />
        </div>
        <div class="form-item">
          <label>背景音乐 BGM</label>
          <select
            value={node.bgm || ''}
            on:change={(e) => handleNodeUpdate('bgm', selectValue(e) || undefined)}
            class="input"
          >
            <option value="">— 不设置 —</option>
            {#each bgmTypes as bgm}
              <option value={bgm}>{bgm}</option>
            {/each}
          </select>
        </div>
        <div class="form-item checkbox-grid">
          <label class="checkbox-item">
            <input
              type="checkbox"
              checked={!!node.isRewindCheckpoint}
              on:change={(e) => handleNodeUpdate('isRewindCheckpoint', inputChecked(e))}
            />
            <span>回溯检查点</span>
          </label>
          <label class="checkbox-item">
            <input
              type="checkbox"
              checked={!!node.isEnding}
              on:change={(e) => handleNodeUpdate('isEnding', inputChecked(e))}
            />
            <span>结局节点</span>
          </label>
        </div>
        {#if node.isRewindCheckpoint}
          <div class="form-item full">
            <label>回溯点标签</label>
            <input
              type="text"
              value={node.rewindCheckpointLabel || ''}
              on:input={(e) => handleNodeUpdate('rewindCheckpointLabel', inputValue(e))}
              class="input"
              placeholder="例如：下潜800米"
            />
          </div>
        {/if}
        {#if node.isEnding}
          <div class="form-item">
            <label>结局 ID</label>
            <input
              type="text"
              value={node.endingId || ''}
              on:input={(e) => handleNodeUpdate('endingId', inputValue(e))}
              class="input"
              placeholder="例如：ending_truth"
            />
          </div>
          <div class="form-item">
            <label>结局标题</label>
            <input
              type="text"
              value={node.endingTitle || ''}
              on:input={(e) => handleNodeUpdate('endingTitle', inputValue(e))}
              class="input"
            />
          </div>
          <div class="form-item full">
            <label>结局描述</label>
            <textarea
              value={node.endingDescription || ''}
              on:input={(e) => handleNodeUpdate('endingDescription', textareaValue(e))}
              class="input textarea"
              rows="3"
            ></textarea>
          </div>
        {/if}
        <div class="form-item full">
          <label>下一节点（线性跳转）</label>
          <select
            value={node.nextNodeId || ''}
            on:change={(e) => handleNodeUpdate('nextNodeId', selectValue(e) || undefined)}
            class="input"
          >
            <option value="">— 无（通过选项或结局结束）—</option>
            {#each get(nodeOptions) as opt}
              <option value={opt.id}>{opt.label}</option>
            {/each}
          </select>
        </div>
      </div>
    </section>

    <section class="section dialogues-section">
      <div class="section-header">
        <h2 class="section-title">对白列表 <span class="count-badge">{dialogues.length}</span></h2>
        <button class="action-btn add" on:click={handleAddDialogue}>
          <span>+</span> 添加对白
        </button>
      </div>

      <div class="dialogue-list">
        {#each dialogues as dialogue, idx}
          <div
            class="dialogue-card {selectedDialogueIdx === idx ? 'expanded' : ''}"
            class:selected={selectedDialogueIdx === idx}
          >
            <div class="dialogue-header" on:click={() => handleSelectDialogue(idx)}>
              <div class="dialogue-index">#{idx + 1}</div>
              <div class="dialogue-preview">
                <span class="speaker-tag">{dialogue.speaker || '(旁白)'}</span>
                <span class="text-preview">
                  {dialogue.text.length > 80 ? dialogue.text.slice(0, 80) + '...' : dialogue.text}
                </span>
              </div>
              <div class="dialogue-meta">
                {#if dialogue.mood}
                  <span class="meta-tag mood">{dialogue.mood}</span>
                {/if}
                {#if dialogue.sfx?.length}
                  <span class="meta-tag sfx">🔊 {dialogue.sfx.length}</span>
                {/if}
                {#if dialogue.autoAdvance}
                  <span class="meta-tag auto">⏩ 自动</span>
                {/if}
              </div>
              <div class="dialogue-actions" on:click|stopPropagation>
                <button
                  class="icon-btn"
                  on:click={() => handleMoveDialogue(idx, -1)}
                  disabled={idx === 0}
                  title="上移"
                >↑</button>
                <button
                  class="icon-btn"
                  on:click={() => handleMoveDialogue(idx, 1)}
                  disabled={idx === dialogues.length - 1}
                  title="下移"
                >↓</button>
                <button
                  class="icon-btn danger"
                  on:click={() => handleDeleteDialogue(idx)}
                  title="删除"
                >×</button>
              </div>
            </div>

            {#if selectedDialogueIdx === idx}
              <div class="dialogue-body">
                <div class="form-grid">
                  <div class="form-item">
                    <label>说话者</label>
                    <input
                      type="text"
                      value={dialogue.speaker}
                      on:input={(e) => handleUpdateDialogue(idx, 'speaker', inputValue(e))}
                      class="input"
                      placeholder="留空为旁白"
                    />
                  </div>
                  <div class="form-item">
                    <label>情绪氛围</label>
                    <select
                      value={dialogue.mood || ''}
                      on:change={(e) => handleUpdateDialogue(idx, 'mood', selectValue(e) || undefined)}
                      class="input"
                    >
                      <option value="">— 默认 —</option>
                      {#each moodTypes as m}
                        <option value={m}>{m}</option>
                      {/each}
                    </select>
                  </div>
                  <div class="form-item">
                    <label>对白 BGM 切换</label>
                    <select
                      value={dialogue.bgm || ''}
                      on:change={(e) => handleUpdateDialogue(idx, 'bgm', selectValue(e) || undefined)}
                      class="input"
                    >
                      <option value="">— 不变 —</option>
                      {#each bgmTypes as bgm}
                        <option value={bgm}>{bgm}</option>
                      {/each}
                    </select>
                  </div>
                  <div class="form-item checkbox-grid small">
                    <label class="checkbox-item">
                      <input
                        type="checkbox"
                        checked={!!dialogue.autoAdvance}
                        on:change={(e) => handleUpdateDialogue(idx, 'autoAdvance', inputChecked(e))}
                      />
                      <span>自动继续</span>
                    </label>
                    {#if dialogue.autoAdvance}
                      <div class="form-item-inline">
                        <label>延迟(ms)</label>
                        <input
                          type="number"
                          value={dialogue.autoAdvanceDelay || 2000}
                          on:input={(e) => handleUpdateDialogue(idx, 'autoAdvanceDelay', Number(inputValue(e)))}
                          class="input small"
                          min="100"
                          step="100"
                        />
                      </div>
                    {/if}
                  </div>
                  <div class="form-item full">
                    <label>对白文本</label>
                    <textarea
                      value={dialogue.text}
                      on:input={(e) => handleUpdateDialogue(idx, 'text', textareaValue(e))}
                      class="input textarea"
                      rows="4"
                    ></textarea>
                  </div>
                </div>

                <div class="sfx-subsection">
                  <div class="subsection-header">
                    <span class="subsection-title">🔊 音效触发 ({dialogue.sfx?.length || 0})</span>
                    <button class="action-btn small add" on:click={() => handleAddSfx(idx)}>
                      + 添加音效
                    </button>
                  </div>
                  {#if dialogue.sfx?.length}
                    <div class="sfx-list">
                      {#each dialogue.sfx as sfx, sIdx}
                        <div class="sfx-item">
                          <div class="sfx-fields">
                            <select
                              value={sfx.sfx}
                              on:change={(e) => handleUpdateSfx(idx, sIdx, 'sfx', selectValue(e))}
                              class="input small"
                            >
                              {#each sfxTypes as type}
                                <option value={type}>{type}</option>
                              {/each}
                            </select>
                            <button class="test-btn" on:click={() => testPlaySfx(sfx.sfx)} title="试听">▶</button>
                            <div class="sfx-param">
                              <label>延迟(ms)</label>
                              <input
                                type="number"
                                value={sfx.delay || 0}
                                on:input={(e) => handleUpdateSfx(idx, sIdx, 'delay', Number(inputValue(e)))}
                                class="input tiny"
                                min="0"
                                step="50"
                              />
                            </div>
                            <div class="sfx-param">
                              <label>音量</label>
                              <input
                                type="number"
                                value={sfx.volume ?? 0.8}
                                on:input={(e) => handleUpdateSfx(idx, sIdx, 'volume', Number(inputValue(e)))}
                                class="input tiny"
                                min="0"
                                max="1"
                                step="0.1"
                              />
                            </div>
                          </div>
                          <button class="icon-btn danger tiny" on:click={() => handleDeleteSfx(idx, sIdx)} title="删除">×</button>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <p class="hint-text">暂无音效，点击"添加音效"按钮创建</p>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <section class="section choices-section">
      <div class="section-header">
        <h2 class="section-title">选择分支 <span class="count-badge">{choices.length}</span></h2>
        <button class="action-btn add" on:click={handleAddChoice}>
          <span>+</span> 添加选项
        </button>
      </div>

      {#if choices.length === 0}
        <p class="hint-text">无选项，节点将通过"下一节点"线性跳转或到达结局</p>
      {:else}
        <div class="choice-list">
          {#each choices as choice, cIdx}
            <div class="choice-card">
              <div class="choice-header">
                <span class="choice-index">选项 #{cIdx + 1}</span>
                <span class="choice-id">{choice.id}</span>
                <button class="icon-btn danger tiny" on:click={() => handleDeleteChoice(cIdx)} title="删除">×</button>
              </div>
              <div class="form-grid">
                <div class="form-item full">
                  <label>选项文本</label>
                  <input
                    type="text"
                    value={choice.text}
                    on:input={(e) => handleUpdateChoice(cIdx, 'text', inputValue(e))}
                    class="input"
                  />
                </div>
                <div class="form-item">
                  <label>跳转节点</label>
                  <select
                    value={choice.nextNodeId || ''}
                    on:change={(e) => handleUpdateChoice(cIdx, 'nextNodeId', selectValue(e))}
                    class="input"
                  >
                    <option value="">— 请选择 —</option>
                    {#each get(nodeOptions) as opt}
                      <option value={opt.id}>{opt.label}</option>
                    {/each}
                  </select>
                </div>
                <div class="form-item">
                  <label>效果变量 (JSON)</label>
                  <input
                    type="text"
                    value={choice.effect ? JSON.stringify(choice.effect) : ''}
                    on:input={(e) => {
                      const val = inputValue(e);
                      try {
                        handleUpdateChoice(cIdx, 'effect', val ? JSON.parse(val) : undefined);
                      } catch {}
                    }}
                    class="input mono"
                    placeholder={'{"key": "value"}'}
                  />
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
{/if}

<style>
  .node-editor {
    padding: 24px;
    max-width: 1000px;
    margin: 0 auto;
  }

  .empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #5a8aaa;
    gap: 12px;
  }

  .empty-icon {
    font-size: 3rem;
    opacity: 0.5;
  }

  .section {
    margin-bottom: 32px;
    background: #0d1525;
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 20px;
  }

  .section-title {
    margin: 0;
    font-size: 1.05rem;
    color: #00d4b0;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .count-badge {
    padding: 2px 8px;
    background: rgba(0, 200, 160, 0.15);
    border-radius: 10px;
    font-size: 0.8rem;
    color: #80f0d0;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .form-item.full {
    grid-column: 1 / -1;
  }

  .form-item label {
    font-size: 0.8rem;
    color: #6a8aaa;
    font-weight: 500;
  }

  .input {
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    color: #c0d8f0;
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;
  }

  .input:focus {
    border-color: rgba(0, 200, 160, 0.5);
    background: rgba(0, 200, 160, 0.04);
  }

  .input.disabled {
    opacity: 0.6;
    background: rgba(255, 255, 255, 0.02);
  }

  .input.textarea {
    resize: vertical;
    min-height: 60px;
    line-height: 1.6;
  }

  .input.small {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .input.tiny {
    padding: 4px 8px;
    font-size: 0.8rem;
    width: 70px;
  }

  .input.mono {
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
  }

  .checkbox-grid {
    grid-column: 1 / -1;
    flex-direction: row;
    gap: 24px;
  }

  .checkbox-grid.small {
    gap: 16px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    color: #a0c0e0;
  }

  .checkbox-item input {
    width: 16px;
    height: 16px;
    accent-color: #00d4b0;
  }

  .form-item-inline {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-item-inline label {
    margin: 0;
    white-space: nowrap;
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

  .action-btn.small {
    padding: 5px 10px;
    font-size: 0.8rem;
  }

  .dialogue-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .dialogue-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .dialogue-card.selected {
    border-color: rgba(0, 200, 160, 0.4);
    background: rgba(0, 200, 160, 0.03);
  }

  .dialogue-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .dialogue-header:hover {
    background: rgba(0, 200, 160, 0.05);
  }

  .dialogue-index {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 200, 160, 0.12);
    border: 1px solid rgba(0, 200, 160, 0.3);
    border-radius: 6px;
    color: #00d4b0;
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .dialogue-preview {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .speaker-tag {
    font-size: 0.8rem;
    color: #ffd080;
    font-weight: 600;
  }

  .text-preview {
    font-size: 0.85rem;
    color: #a0c0e0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dialogue-meta {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }

  .meta-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .meta-tag.mood {
    background: rgba(180, 120, 255, 0.12);
    color: #c090ff;
    border: 1px solid rgba(180, 120, 255, 0.25);
  }

  .meta-tag.sfx {
    background: rgba(255, 200, 80, 0.12);
    color: #ffc050;
  }

  .meta-tag.auto {
    background: rgba(80, 200, 255, 0.12);
    color: #50c8ff;
  }

  .dialogue-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .icon-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.15s;
  }

  .icon-btn:hover:not(:disabled) {
    background: rgba(0, 200, 160, 0.1);
    color: #00d4b0;
    border-color: rgba(0, 200, 160, 0.3);
  }

  .icon-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .icon-btn.danger:hover:not(:disabled) {
    background: rgba(255, 80, 80, 0.15);
    color: #ff8080;
    border-color: rgba(255, 80, 80, 0.4);
  }

  .icon-btn.tiny {
    width: 22px;
    height: 22px;
    font-size: 0.8rem;
  }

  .dialogue-body {
    padding: 0 14px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    padding-top: 16px;
  }

  .sfx-subsection {
    margin-top: 18px;
    padding: 14px;
    background: rgba(255, 200, 80, 0.03);
    border: 1px solid rgba(255, 200, 80, 0.1);
    border-radius: 6px;
  }

  .subsection-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .subsection-title {
    font-size: 0.9rem;
    color: #ffc050;
    font-weight: 600;
  }

  .sfx-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .sfx-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 5px;
  }

  .sfx-fields {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    flex-wrap: wrap;
  }

  .test-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 200, 160, 0.12);
    border: 1px solid rgba(0, 200, 160, 0.3);
    border-radius: 4px;
    color: #00d4b0;
    cursor: pointer;
    transition: all 0.15s;
  }

  .test-btn:hover {
    background: rgba(0, 200, 160, 0.25);
  }

  .sfx-param {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .sfx-param label {
    font-size: 0.72rem;
    color: #6a8aaa;
  }

  .hint-text {
    padding: 20px;
    text-align: center;
    color: #5a8aaa;
    font-size: 0.85rem;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 6px;
  }

  .choice-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .choice-card {
    padding: 14px;
    background: rgba(180, 120, 255, 0.04);
    border: 1px solid rgba(180, 120, 255, 0.15);
    border-radius: 8px;
  }

  .choice-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .choice-index {
    padding: 3px 10px;
    background: rgba(180, 120, 255, 0.15);
    border: 1px solid rgba(180, 120, 255, 0.3);
    border-radius: 4px;
    color: #c090ff;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .choice-id {
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    color: #5a8aaa;
    flex: 1;
  }
</style>

<script lang="ts">
  import { playSFX } from '../lib/audio';
  import { settings as settingsStore } from '../lib/store';
  import { saveSettings, type GameSettings } from '../lib/storage';
  import { setBGMVolume, setSFXVolume, toggleMute, isMuted } from '../lib/audio';

  export let isOpen: boolean;
  export let onClose: () => void;

  let localSettings: GameSettings;

  function syncSettings() {
    localSettings = { ...$settingsStore };
  }

  $: if (isOpen) {
    syncSettings();
  }

  function handleTextSpeedChange(e: Event) {
    const target = e.target as HTMLInputElement;
    localSettings.textSpeed = Number(target.value);
  }

  function handleBGMVolume(e: Event) {
    const target = e.target as HTMLInputElement;
    localSettings.bgmVolume = Number(target.value);
    setBGMVolume(localSettings.bgmVolume);
  }

  function handleSFXVolume(e: Event) {
    const target = e.target as HTMLInputElement;
    localSettings.sfxVolume = Number(target.value);
    setSFXVolume(localSettings.sfxVolume);
  }

  function handleDanmakuToggle() {
    localSettings.danmakuEnabled = !localSettings.danmakuEnabled;
    playSFX('click');
  }

  function handleDanmakuSpeed(e: Event) {
    const target = e.target as HTMLInputElement;
    localSettings.danmakuSpeed = Number(target.value);
  }

  function handlePseudoLiveModeToggle() {
    localSettings.pseudoLiveMode = !localSettings.pseudoLiveMode;
    playSFX('click');
  }

  function handleSave() {
    playSFX('select');
    saveSettings(localSettings);
    settingsStore.set(localSettings);
    onClose();
  }

  function handleCancel() {
    playSFX('click');
    onClose();
  }
</script>

{#if isOpen}
  <div class="overlay" on:click={handleCancel}>
    <div class="panel" on:click|stopPropagation style="animation: fadeInUp 0.3s ease-out;">
      <button class="close-btn" on:click={handleCancel}>×</button>
      <h2 class="panel-title">设置</h2>

      <div class="settings-list">
        <div class="setting-item">
          <label class="setting-label">文字速度</label>
          <div class="setting-control">
            <span class="range-label">慢</span>
            <input 
              type="range" 
              min="10" 
              max="90" 
              bind:value={localSettings.textSpeed}
              on:input={handleTextSpeedChange}
            />
            <span class="range-label">快</span>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">背景音乐音量</label>
          <div class="setting-control">
            <span class="range-value">{Math.round(localSettings.bgmVolume * 100)}%</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              on:input={handleBGMVolume}
              value={localSettings.bgmVolume}
            />
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">音效音量</label>
          <div class="setting-control">
            <span class="range-value">{Math.round(localSettings.sfxVolume * 100)}%</span>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.05"
              on:input={handleSFXVolume}
              value={localSettings.sfxVolume}
            />
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">显示弹幕</label>
          <div class="setting-control">
            <button 
              class="toggle-btn"
              class:active={localSettings.danmakuEnabled}
              on:click={handleDanmakuToggle}
            >
              {localSettings.danmakuEnabled ? '开启' : '关闭'}
            </button>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">弹幕速度</label>
          <div class="setting-control">
            <span class="range-label">慢</span>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.25"
              on:input={handleDanmakuSpeed}
              value={localSettings.danmakuSpeed}
            />
            <span class="range-label">快</span>
          </div>
        </div>

        <div class="setting-item">
          <label class="setting-label">
            伪直播模式
            <span class="setting-hint">首周目隐藏关键弹幕，二周目开放后台视角</span>
          </label>
          <div class="setting-control">
            <button 
              class="toggle-btn"
              class:active={localSettings.pseudoLiveMode}
              on:click={handlePseudoLiveModeToggle}
            >
              {localSettings.pseudoLiveMode ? '开启' : '关闭'}
            </button>
          </div>
        </div>
      </div>

      <div class="button-row">
        <button class="cancel-btn" on:click={handleCancel}>取消</button>
        <button class="save-btn" on:click={handleSave}>保存</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(8px);
    padding: 20px;
  }

  .panel {
    position: relative;
    background: linear-gradient(180deg, rgba(15, 30, 55, 0.95), rgba(8, 18, 35, 0.98));
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 12px;
    padding: 24px;
    width: 100%;
    max-width: 420px;
  }

  .close-btn {
    position: absolute;
    top: 12px;
    right: 16px;
    background: transparent;
    border: none;
    color: #6a8aaa;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 4px 8px;
    line-height: 1;
  }

  .panel-title {
    color: #64b4ff;
    text-align: center;
    margin-bottom: 24px;
    font-size: 1.2rem;
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 28px;
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-label {
    color: #a0b8d0;
    font-size: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .setting-hint {
    color: #6a8aaa;
    font-size: 0.75rem;
    font-weight: normal;
    opacity: 0.85;
  }

  .setting-control {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .range-label {
    color: #6a8aaa;
    font-size: 0.75rem;
    min-width: 24px;
  }

  .range-value {
    color: #64b4ff;
    font-size: 0.8rem;
    min-width: 40px;
    font-family: monospace;
  }

  input[type='range'] {
    flex: 1;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: rgba(100, 180, 255, 0.2);
    border-radius: 2px;
    outline: none;
  }

  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #64b4ff, #3c78c8);
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 0 8px rgba(100, 180, 255, 0.5);
  }

  input[type='range']::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: linear-gradient(135deg, #64b4ff, #3c78c8);
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(100, 180, 255, 0.5);
  }

  .toggle-btn {
    padding: 6px 20px;
    background: rgba(40, 70, 120, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 20px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.8), rgba(40, 80, 160, 0.8));
    border-color: #64b4ff;
    color: #e0f0ff;
  }

  .button-row {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .cancel-btn, .save-btn {
    padding: 10px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .cancel-btn {
    background: transparent;
    border: 1px solid rgba(100, 180, 255, 0.3);
    color: #8ab0d0;
  }

  .cancel-btn:hover {
    background: rgba(100, 180, 255, 0.1);
  }

  .save-btn {
    background: linear-gradient(135deg, #3c78c8, #2850a0);
    border: 1px solid #64b4ff;
    color: #e0f0ff;
  }

  .save-btn:hover {
    background: linear-gradient(135deg, #4c88d8, #3860b0);
  }

  @media (max-width: 480px) {
    .panel {
      padding: 20px 16px;
    }
  }
</style>

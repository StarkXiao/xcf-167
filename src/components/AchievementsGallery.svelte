<script lang="ts">
  import { playSFX } from '../lib/audio';
  import {
    achievementProgress,
    unlockedAchievementIds,
    unlockedArchivesList,
    unlockedAudiosList,
    availableSkins,
    setCurrentSkin,
    getAllAchievements,
    achievementState,
    currentSkin
  } from '../lib/achievements';
  import type { AchievementCategory, Achievement, ArchiveEntry, SpecialAudio, MenuSkin } from '../types/game';

  export let isOpen: boolean;
  export let onClose: () => void;

  type Tab = 'achievements' | 'archives' | 'audios' | 'skins';

  let activeTab: Tab = 'achievements';
  let selectedArchive: ArchiveEntry | null = null;
  let selectedAudio: SpecialAudio | null = null;

  const allAchievements = getAllAchievements();

  const categoryLabels: Record<AchievementCategory, string> = {
    story: '剧情',
    clue: '线索',
    ending: '结局',
    trust: '信任',
    evidence: '证据',
    secret: '隐藏',
    special: '特殊'
  };

  const rarityColors: Record<string, { color: string; bg: string; label: string }> = {
    common: { color: '#8ab0d0', bg: 'rgba(100, 150, 200, 0.2)', label: '普通' },
    rare: { color: '#64d4a0', bg: 'rgba(100, 200, 150, 0.2)', label: '稀有' },
    epic: { color: '#cc88ff', bg: 'rgba(200, 136, 255, 0.2)', label: '史诗' },
    legendary: { color: '#ffd700', bg: 'rgba(255, 215, 0, 0.2)', label: '传说' }
  };

  const archiveCategoryLabels: Record<string, string> = {
    character: '人物档案',
    document: '官方文件',
    audio_log: '音频记录',
    secret: '机密档案',
    development: '开发日志'
  };

  function setTab(tab: Tab) {
    playSFX('click');
    activeTab = tab;
    selectedArchive = null;
    selectedAudio = null;
  }

  function isAchievementUnlocked(achievement: Achievement): boolean {
    return $unlockedAchievementIds.includes(achievement.id);
  }

  function getAchievementPlaythrough(achievement: Achievement): number | undefined {
    const info = $achievementState.unlockedAchievements[achievement.id];
    return info?.playthrough;
  }

  function handleSelectArchive(archive: ArchiveEntry) {
    if (!archive.isUnlocked) return;
    playSFX('select');
    selectedArchive = archive;
  }

  function handlePlayAudio(audio: SpecialAudio | null) {
    if (!audio || !audio.isUnlocked) return;
    playSFX('select');
    if (audio.sfxType) {
      playSFX(audio.sfxType, 0.8);
    }
    selectedAudio = audio;
  }

  function handleSelectSkin(skin: MenuSkin) {
    if (!skin.isUnlocked) return;
    setCurrentSkin(skin.id);
  }

  function backFromDetail() {
    playSFX('click');
    selectedArchive = null;
    selectedAudio = null;
  }
</script>

{#if isOpen}
  <div class="overlay" on:click={onClose}>
    <div class="panel" on:click|stopPropagation style="animation: fadeInUp 0.3s ease-out;">
      <button class="close-btn" on:click={() => { playSFX('click'); onClose(); }}>×</button>

      {#if !selectedArchive && !selectedAudio}
        <h2 class="panel-title">成就与档案</h2>

        <div class="progress-section">
          <div class="progress-grid">
            <div class="progress-item">
              <span class="progress-num">{$achievementProgress.unlocked}/{$achievementProgress.total}</span>
              <span class="progress-label">成就</span>
            </div>
            <div class="progress-item">
              <span class="progress-num">{$achievementProgress.archivesUnlocked}/{$achievementProgress.archivesTotal}</span>
              <span class="progress-label">档案</span>
            </div>
            <div class="progress-item">
              <span class="progress-num">{$achievementProgress.audiosUnlocked}/{$achievementProgress.audiosTotal}</span>
              <span class="progress-label">音频</span>
            </div>
            <div class="progress-item">
              <span class="progress-num">{$achievementProgress.skinsUnlocked}/{$achievementProgress.skinsTotal}</span>
              <span class="progress-label">皮肤</span>
            </div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn {activeTab === 'achievements' ? 'active' : ''}" on:click={() => setTab('achievements')}>
            🏆 成就
          </button>
          <button class="tab-btn {activeTab === 'archives' ? 'active' : ''}" on:click={() => setTab('archives')}>
            📂 档案
          </button>
          <button class="tab-btn {activeTab === 'audios' ? 'active' : ''}" on:click={() => setTab('audios')}>
            🎵 音频
          </button>
          <button class="tab-btn {activeTab === 'skins' ? 'active' : ''}" on:click={() => setTab('skins')}>
            🎨 皮肤
          </button>
        </div>

        <div class="content">
          {#if activeTab === 'achievements'}
            <div class="achievements-list">
              {#each allAchievements as achievement}
                {@const unlocked = isAchievementUnlocked(achievement)}
                {@const rarity = rarityColors[achievement.rarity]}
                <div class="achievement-card" class:unlocked class:secret-locked={!unlocked && achievement.isSecret}>
                  <div class="achievement-icon" style="background: {unlocked ? rarity.bg : 'rgba(60, 60, 60, 0.3)'}">
                    {#if unlocked || !achievement.isSecret}
                      <span style="color: {unlocked ? rarity.color : '#5a7a9a'}">{achievement.icon}</span>
                    {:else}
                      <span style="color: #3a5a7a">?</span>
                    {/if}
                  </div>
                  <div class="achievement-info">
                    <h3 class="achievement-title" style="color: {unlocked ? rarity.color : '#4a6a8a'}">
                      {#if unlocked || !achievement.isSecret}
                        {achievement.title}
                      {:else}
                        ???
                      {/if}
                    </h3>
                    <p class="achievement-desc">
                      {#if unlocked}
                        {achievement.description}
                      {:else if achievement.isSecret}
                        {achievement.unlockHint || '隐藏成就，继续探索...'}
                      {:else}
                        {achievement.description}
                      {/if}
                    </p>
                    <div class="achievement-meta">
                      <span class="achievement-category">{categoryLabels[achievement.category]}</span>
                      <span class="achievement-rarity" style="background: {rarity.bg}; color: {rarity.color}">{rarity.label}</span>
                      {#if unlocked}
                        <span class="achievement-playthrough">第 {getAchievementPlaythrough(achievement)} 周目</span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {:else if activeTab === 'archives'}
            <div class="archives-grid">
              {#each $unlockedArchivesList as archive}
                <div class="archive-card" class:unlocked={archive.isUnlocked} on:click={() => handleSelectArchive(archive)}>
                  <div class="archive-icon">
                    {#if archive.category === 'character'}👤{:else if archive.category === 'document'}📄{:else if archive.category === 'secret'}🔒{:else if archive.category === 'development'}💾{:else}🎙️{/if}
                  </div>
                  <div class="archive-info">
                    <h3 class="archive-title">{archive.isUnlocked ? archive.title : '???'}</h3>
                    <span class="archive-category">{archiveCategoryLabels[archive.category] || archive.category}</span>
                  </div>
                </div>
              {/each}
            </div>
          {:else if activeTab === 'audios'}
            <div class="audios-list">
              {#each $unlockedAudiosList as audio}
                <div class="audio-card" class:unlocked={audio.isUnlocked} on:click={() => handlePlayAudio(audio)}>
                  <div class="audio-icon">
                    {audio.isUnlocked ? '▶️' : '🔇'}
                  </div>
                  <div class="audio-info">
                    <h3 class="audio-title">{audio.isUnlocked ? audio.title : '???'}</h3>
                    <p class="audio-desc">{audio.isUnlocked ? audio.description : '尚未解锁...'}</p>
                  </div>
                  {#if audio.isUnlocked}
                    <span class="play-hint">点击播放</span>
                  {/if}
                </div>
              {/each}
            </div>
          {:else if activeTab === 'skins'}
            <div class="skins-grid">
              {#each $availableSkins as skin}
                <div class="skin-card"
                     class:unlocked={skin.isUnlocked}
                     class:selected={$currentSkin.id === skin.id}
                     on:click={() => handleSelectSkin(skin)}>
                  <div class="skin-preview" style="background: {skin.gradient}; border: 2px solid {skin.accentColor}">
                    <div class="skin-preview-bar" style="background: {skin.buttonBg}; border: 1px solid {skin.buttonBorder}"></div>
                    <div class="skin-preview-bar" style="background: {skin.buttonBg}; border: 1px solid {skin.buttonBorder}"></div>
                    <div class="skin-preview-circle" style="background: {skin.bgDecoration};"></div>
                  </div>
                  <div class="skin-info">
                    <h3 class="skin-title" style="color: {skin.isUnlocked ? skin.accentColor : '#5a7a9a'}">
                      {skin.isUnlocked ? skin.name : '???'}
                    </h3>
                    <p class="skin-desc">
                      {skin.isUnlocked ? skin.description : '完成特定成就解锁'}
                    </p>
                    {#if $currentSkin.id === skin.id}
                      <span class="skin-selected">已装备中</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {:else if selectedArchive}
        <button class="back-btn" on:click={backFromDetail}>← 返回列表</button>
        <h2 class="panel-title">{selectedArchive.title}</h2>
        <div class="archive-detail">
          <span class="archive-detail-category">
            {archiveCategoryLabels[selectedArchive.category] || selectedArchive.category}
          </span>
          <div class="archive-detail-content">
            {#each selectedArchive.content.split('\n') as line}
              {#if line.trim() !== ''}
                <p>{line}</p>
              {:else}
                <br />
              {/if}
            {/each}
          </div>
        </div>
      {:else if selectedAudio}
        <button class="back-btn" on:click={backFromDetail}>← 返回列表</button>
        <h2 class="panel-title">{selectedAudio.title}</h2>
        <div class="audio-detail">
          <p class="audio-detail-desc">{selectedAudio.description}</p>
          <button class="audio-play-btn" on:click={() => handlePlayAudio(selectedAudio)}>
            ▶ 再次播放
          </button>
        </div>
      {/if}

      <button class="close-action" on:click={() => { playSFX('click'); onClose(); }}>
        返回
      </button>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 5, 15, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    backdrop-filter: blur(8px);
    padding: 16px;
  }

  .panel {
    position: relative;
    background: linear-gradient(180deg, rgba(15, 30, 55, 0.98), rgba(8, 18, 35, 1));
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 12px;
    padding: 24px 20px;
    width: 100%;
    max-width: 560px;
    max-height: 85vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
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
    margin-bottom: 16px;
    font-size: 1.3rem;
  }

  .progress-section {
    margin-bottom: 16px;
  }

  .progress-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .progress-item {
    text-align: center;
    padding: 10px 6px;
    background: rgba(30, 50, 80, 0.4);
    border-radius: 8px;
    border: 1px solid rgba(100, 180, 255, 0.15);
  }

  .progress-num {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: #64b4ff;
  }

  .progress-label {
    display: block;
    font-size: 0.7rem;
    color: #6a8aaa;
    margin-top: 2px;
  }

  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(100, 180, 255, 0.2);
  }

  .tab-btn {
    flex: 1;
    padding: 10px 8px;
    background: transparent;
    border: none;
    color: #6a8aaa;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }

  .tab-btn:hover {
    color: #8ab0d0;
  }

  .tab-btn.active {
    color: #64b4ff;
    border-bottom-color: #64b4ff;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    margin-bottom: 16px;
  }

  .achievements-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .achievement-card {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    opacity: 0.6;
    transition: all 0.2s;
  }

  .achievement-card.unlocked {
    opacity: 1;
    background: rgba(25, 50, 85, 0.7);
  }

  .achievement-card.secret-locked {
    opacity: 0.4;
  }

  .achievement-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }

  .achievement-info {
    flex: 1;
    min-width: 0;
  }

  .achievement-title {
    font-size: 1rem;
    margin-bottom: 4px;
  }

  .achievement-desc {
    color: #8ab0d0;
    font-size: 0.8rem;
    line-height: 1.5;
    margin-bottom: 6px;
  }

  .achievement-meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .achievement-category,
  .achievement-rarity,
  .achievement-playthrough {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(60, 100, 160, 0.3);
    color: #8ab0d0;
  }

  .achievement-rarity {
    font-weight: 500;
  }

  .achievement-playthrough {
    font-family: 'Courier New', monospace;
    background: rgba(255, 200, 100, 0.15);
    color: #ffd890;
  }

  .archives-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .archive-card {
    padding: 12px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    opacity: 0.6;
    transition: all 0.2s;
  }

  .archive-card.unlocked {
    opacity: 1;
  }

  .archive-card.unlocked:hover {
    background: rgba(40, 70, 120, 0.7);
    border-color: rgba(100, 180, 255, 0.5);
  }

  .archive-icon {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }

  .archive-title {
    font-size: 0.9rem;
    color: #d0e4f8;
    margin-bottom: 4px;
  }

  .archive-category {
    font-size: 0.7rem;
    color: #8ab0d0;
  }

  .audios-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .audio-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    opacity: 0.5;
  }

  .audio-card.unlocked {
    opacity: 1;
  }

  .audio-card.unlocked:hover {
    background: rgba(40, 70, 120, 0.7);
    border-color: rgba(100, 180, 255, 0.4);
  }

  .audio-icon {
    font-size: 1.5rem;
    width: 40px;
    text-align: center;
  }

  .audio-info {
    flex: 1;
  }

  .audio-title {
    font-size: 0.95rem;
    color: #d0e4f8;
    margin-bottom: 2px;
  }

  .audio-desc {
    color: #8ab0d0;
    font-size: 0.75rem;
  }

  .play-hint {
    font-size: 0.7rem;
    color: #64b4ff;
  }

  .skins-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .skin-card {
    padding: 12px;
    background: rgba(20, 40, 70, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.2);
    border-radius: 8px;
    cursor: pointer;
    opacity: 0.5;
    transition: all 0.2s;
  }

  .skin-card.unlocked {
    opacity: 1;
  }

  .skin-card.selected {
    border-color: rgba(100, 180, 255, 0.6);
    background: rgba(30, 60, 110, 0.6);
  }

  .skin-card.unlocked:hover {
    transform: translateY(-2px);
  }

  .skin-preview {
    height: 80px;
    border-radius: 6px;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 10px;
    gap: 6px;
  }

  .skin-preview-bar {
    height: 12px;
    border-radius: 3px;
  }

  .skin-preview-circle {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
  }

  .skin-title {
    font-size: 0.95rem;
    margin-bottom: 4px;
  }

  .skin-desc {
    font-size: 0.7rem;
    color: #8ab0d0;
  }

  .skin-selected {
    display: inline-block;
    margin-top: 6px;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(100, 180, 255, 0.2);
    color: #64b4ff;
    font-size: 0.7rem;
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    background: transparent;
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    padding: 8px 16px;
    color: #8ab0d0;
    cursor: pointer;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .back-btn:hover {
    background: rgba(100, 180, 255, 0.1);
  }

  .archive-detail-category {
    display: inline-block;
    padding: 4px 12px;
    background: rgba(255, 200, 100, 0.15);
    color: #ffd890;
    border-radius: 10px;
    font-size: 0.8rem;
    margin-bottom: 16px;
  }

  .archive-detail-content {
    background: rgba(10, 25, 45, 0.6);
    border: 1px solid rgba(100, 180, 255, 0.15);
    border-radius: 8px;
    padding: 16px;
    color: #c0d8f0;
    font-size: 0.9rem;
    line-height: 1.8;
    margin-bottom: 16px;
  }

  .archive-detail-content p {
    margin: 0;
  }

  .audio-detail {
    text-align: center;
    padding: 20px;
  }

  .audio-detail-desc {
    color: #c0d8f0;
    font-size: 0.95rem;
    margin-bottom: 20px;
  }

  .audio-play-btn {
    padding: 12px 32px;
    background: linear-gradient(135deg, rgba(60, 120, 200, 0.8), rgba(40, 80, 160, 0.8));
    border: 1px solid #64b4ff;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
    cursor: pointer;
  }

  .close-action {
    display: block;
    margin: 16px auto 0;
    padding: 10px 32px;
    background: rgba(40, 70, 120, 0.5);
    border: 1px solid rgba(100, 180, 255, 0.3);
    border-radius: 6px;
    color: #c0d8f0;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .close-action:hover {
    background: rgba(60, 100, 170, 0.7);
  }

  @media (max-width: 480px) {
    .panel {
      padding: 20px 14px;
    }

    .progress-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .archives-grid,
    .skins-grid {
      grid-template-columns: 1fr;
    }

    .achievement-card {
      padding: 10px;
      gap: 10px;
    }

    .tab-btn {
      padding: 8px 4px;
      font-size: 0.75rem;
    }
  }
</style>

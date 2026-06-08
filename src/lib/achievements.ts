import { writable, derived, get } from 'svelte/store';
import type {
  Achievement,
  AchievementCondition,
  AchievementState,
  ArchiveEntry,
  SpecialAudio,
  MenuSkin,
  CrewMemberId,
  TrustLevel
} from '../types/game';
import { achievements, archives, specialAudios, menuSkins } from '../data/achievements';
import { globalMemory } from './memory';
import { trustState } from './trust';
import { gameState } from './store';
import { playSFX } from './audio';

const ACHIEVEMENT_KEY = 'deep_sea_achievements';

function createInitialAchievementState(): AchievementState {
  return {
    unlockedAchievements: {},
    unlockedArchives: ['archive_intro'],
    unlockedAudios: [],
    unlockedSkins: ['skin_default'],
    currentSkin: 'skin_default',
    mistakeCountTotal: 0,
    mistakeCountThisPlaythrough: 0,
    totalPlaythroughs: 0,
    choicesMadeThisPlaythrough: [],
    currentPath: undefined
  };
}

function loadAchievementState(): AchievementState {
  try {
    const data = localStorage.getItem(ACHIEVEMENT_KEY);
    if (data) {
      const parsed = JSON.parse(data) as AchievementState;
      return {
        ...createInitialAchievementState(),
        ...parsed
      };
    }
  } catch (e) {
    console.error('Failed to load achievement state:', e);
  }
  return createInitialAchievementState();
}

function saveAchievementState(state: AchievementState): void {
  try {
    localStorage.setItem(ACHIEVEMENT_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save achievement state:', e);
  }
}

export const achievementState = writable<AchievementState>(loadAchievementState());

achievementState.subscribe(state => {
  saveAchievementState(state);
});

export const unlockedAchievementIds = derived(achievementState, $state =>
  Object.keys($state.unlockedAchievements)
);

export const unlockedAchievementList = derived(achievementState, $state =>
  Object.entries($state.unlockedAchievements).map(([id, info]) => ({
    ...achievements.find(a => a.id === id),
    unlockedAt: info.unlockedAt,
    playthrough: info.playthrough
  }))
);

export const currentSkin = derived(achievementState, $state =>
  menuSkins.find(s => s.id === $state.currentSkin) || menuSkins[0]
);

export const availableSkins = derived(achievementState, $state =>
  menuSkins.map(skin => ({
    ...skin,
    isUnlocked: $state.unlockedSkins.includes(skin.id)
  }))
);

export const unlockedArchivesList = derived(achievementState, $state =>
  archives.map(archive => ({
    ...archive,
    isUnlocked: $state.unlockedArchives.includes(archive.id)
  }))
);

export const unlockedAudiosList = derived(achievementState, $state =>
  specialAudios.map(audio => ({
    ...audio,
    isUnlocked: $state.unlockedAudios.includes(audio.id)
  }))
);

export const achievementProgress = derived(achievementState, $state => ({
  total: achievements.length,
  unlocked: Object.keys($state.unlockedAchievements).length,
  archivesTotal: archives.length,
  archivesUnlocked: $state.unlockedArchives.length,
  audiosTotal: specialAudios.length,
  audiosUnlocked: $state.unlockedAudios.length,
  skinsTotal: menuSkins.length,
  skinsUnlocked: $state.unlockedSkins.length
}));

function checkTrustLevel(memberId: CrewMemberId, minLevel: TrustLevel): boolean {
  try {
    const state = get(trustState);
    const member = state.crew[memberId];
    if (!member) return false;

    const levelOrder: TrustLevel[] = ['hostile', 'distrust', 'neutral', 'trust', 'loyal'];
    const memberLevelIndex = levelOrder.indexOf(member.level);
    const minLevelIndex = levelOrder.indexOf(minLevel);
    return memberLevelIndex >= minLevelIndex;
  } catch {
    return false;
  }
}

function checkAchievementCondition(condition: AchievementCondition): boolean {
  const memory = get(globalMemory);
  const achState = get(achievementState);
  const gState = get(gameState);

  const allHistoryChoices = memory.playthroughHistory.flatMap(p => p.choicesMade || []);
  const currentAndHistoryChoices = [...allHistoryChoices, ...achState.choicesMadeThisPlaythrough];

  const allHistoryPaths = memory.playthroughHistory.map(p => p.pathTaken).filter(Boolean) as string[];
  const currentAndHistoryPaths = [...allHistoryPaths];
  if (achState.currentPath) currentAndHistoryPaths.push(achState.currentPath);
  const gameVarPath = gState.variables.path as string | undefined;
  if (gameVarPath && !currentAndHistoryPaths.includes(gameVarPath)) currentAndHistoryPaths.push(gameVarPath);

  const allHistoryMistakes = memory.playthroughHistory.reduce((sum, p) => sum + (p.mistakeCount || 0), 0);
  const totalMistakes = allHistoryMistakes + achState.mistakeCountThisPlaythrough + achState.mistakeCountTotal;

  if (condition.requiredPlaythroughAtLeast) {
    if (memory.currentPlaythrough < condition.requiredPlaythroughAtLeast) return false;
  }

  if (condition.requiredEndings) {
    const unlockedEndings = memory.playthroughHistory
      .map(p => p.endingId)
      .filter(Boolean) as string[];
    for (const endingId of condition.requiredEndings) {
      if (!unlockedEndings.includes(endingId)) return false;
    }
  }

  if (condition.anyEndings) {
    const unlockedEndings = memory.playthroughHistory
      .map(p => p.endingId)
      .filter(Boolean) as string[];
    const hasAny = condition.anyEndings.some(id => unlockedEndings.includes(id));
    if (!hasAny) return false;
  }

  if (condition.requiredAllEndings) {
    const allEndingIds = ['ending_truth', 'ending_survival', 'ending_silence', 'ending_madness', 'ending_loop'];
    const unlockedEndings = memory.playthroughHistory
      .map(p => p.endingId)
      .filter(Boolean) as string[];
    const uniqueUnlocked = Array.from(new Set(unlockedEndings));
    if (uniqueUnlocked.length < allEndingIds.length) return false;
  }

  if (condition.requiredClues) {
    for (const clueId of condition.requiredClues) {
      if (!memory.unlockedClues[clueId]) return false;
    }
  }

  if (condition.requiredClueCountAtLeast) {
    const clueCount = Object.keys(memory.unlockedClues).length;
    if (clueCount < condition.requiredClueCountAtLeast) return false;
  }

  if (condition.requiredEvidenceCountAtLeast) {
    const evCount = memory.unlockedEvidenceIds.length;
    if (evCount < condition.requiredEvidenceCountAtLeast) return false;
  }

  if (condition.requiredMistakeCountAtMost !== undefined) {
    if (totalMistakes > condition.requiredMistakeCountAtMost) return false;
  }

  if (condition.requiredMistakeCountAtLeast) {
    if (totalMistakes < condition.requiredMistakeCountAtLeast) return false;
  }

  if (condition.requiredTrustLevel) {
    for (const req of condition.requiredTrustLevel) {
      if (req.minLevel && !checkTrustLevel(req.memberId, req.minLevel)) return false;
    }
  }

  if (condition.requiredPaths) {
    const hasPath = condition.requiredPaths.some(pathId => currentAndHistoryPaths.includes(pathId));
    if (!hasPath) {
      const visitedNodes = memory.playthroughHistory.flatMap(p => p.nodesVisited || []);
      const gVisited = gState.visitedNodes || [];
      const allVisited = [...visitedNodes, ...gVisited];
      let pathFound = false;
      if (condition.requiredPaths.includes('live') && allVisited.some(n => n.includes('path_live'))) pathFound = true;
      if (condition.requiredPaths.includes('stop') && allVisited.some(n => n.includes('path_stop'))) pathFound = true;
      if (condition.requiredPaths.includes('ascent') && allVisited.some(n => n.includes('path_ascent'))) pathFound = true;
      if (!pathFound) return false;
    }
  }

  if (condition.requiredChoices) {
    const hasChoice = condition.requiredChoices.some(choiceId =>
      currentAndHistoryChoices.some(c => c.choiceId === choiceId)
    );
    if (!hasChoice) return false;
  }

  return true;
}

export interface AchievementCheckContext {
  endingUnlocked?: string;
  playthroughComplete?: boolean;
  clueUnlocked?: string;
  evidenceCollected?: string;
  choiceMade?: string;
  misjudgmentMade?: boolean;
  deductionCompleted?: string;
}

export function checkAndUnlockAchievements(_context?: AchievementCheckContext): Achievement[] {
  const state = get(achievementState);
  const memory = get(globalMemory);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of achievements) {
    if (state.unlockedAchievements[achievement.id]) continue;
    if (checkAchievementCondition(achievement.condition)) {
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    achievementState.update(s => {
      const newState = { ...s };
      newlyUnlocked.forEach(achievement => {
        newState.unlockedAchievements[achievement.id] = {
          unlockedAt: Date.now(),
          playthrough: memory.currentPlaythrough
        };
        if (achievement.reward?.archiveId && !newState.unlockedArchives.includes(achievement.reward.archiveId)) {
          newState.unlockedArchives = [...newState.unlockedArchives, achievement.reward.archiveId];
        }
        if (achievement.reward?.audioId && !newState.unlockedAudios.includes(achievement.reward.audioId)) {
          newState.unlockedAudios = [...newState.unlockedAudios, achievement.reward.audioId];
        }
        if (achievement.reward?.skinId && !newState.unlockedSkins.includes(achievement.reward.skinId)) {
          newState.unlockedSkins = [...newState.unlockedSkins, achievement.reward.skinId];
        }
      });
      return newState;
    });

    playSFX('notify');
  }

  return newlyUnlocked;
}

export function unlockAchievement(achievementId: string): boolean {
  const achievement = achievements.find(a => a.id === achievementId);
  if (!achievement) return false;

  const state = get(achievementState);
  if (state.unlockedAchievements[achievementId]) return false;

  const memory = get(globalMemory);
  achievementState.update(s => {
    const newState = { ...s };
    newState.unlockedAchievements[achievementId] = {
      unlockedAt: Date.now(),
      playthrough: memory.currentPlaythrough
    };
    if (achievement.reward?.archiveId && !newState.unlockedArchives.includes(achievement.reward.archiveId)) {
      newState.unlockedArchives = [...newState.unlockedArchives, achievement.reward.archiveId];
    }
    if (achievement.reward?.audioId && !newState.unlockedAudios.includes(achievement.reward.audioId)) {
      newState.unlockedAudios = [...newState.unlockedAudios, achievement.reward.audioId];
    }
    if (achievement.reward?.skinId && !newState.unlockedSkins.includes(achievement.reward.skinId)) {
      newState.unlockedSkins = [...newState.unlockedSkins, achievement.reward.skinId];
    }
    return newState;
  });

  playSFX('notify');
  return true;
}

export function addMistakeCount(): void {
  achievementState.update(s => ({
    ...s,
    mistakeCountTotal: s.mistakeCountTotal + 1,
    mistakeCountThisPlaythrough: s.mistakeCountThisPlaythrough + 1
  }));
}

export function recordMisjudgment(): void {
  addMistakeCount();
}

export function recordChoice(nodeId: string, choiceId: string): void {
  achievementState.update(s => ({
    ...s,
    choicesMadeThisPlaythrough: [...s.choicesMadeThisPlaythrough, { nodeId, choiceId }]
  }));
}

export function recordChoiceMade(nodeId: string, choiceId: string): void {
  recordChoice(nodeId, choiceId);
}

export function setCurrentPath(pathId: string): void {
  achievementState.update(s => ({
    ...s,
    currentPath: pathId
  }));
  checkAndUnlockAchievements();
}

export function getPlaythroughDataForRecord(): {
  choicesMade: { nodeId: string; choiceId: string }[];
  mistakeCount: number;
  pathTaken?: string;
} {
  const state = get(achievementState);
  return {
    choicesMade: [...state.choicesMadeThisPlaythrough],
    mistakeCount: state.mistakeCountThisPlaythrough,
    pathTaken: state.currentPath
  };
}

export function resetPlaythroughTracking(): void {
  achievementState.update(s => ({
    ...s,
    choicesMadeThisPlaythrough: [],
    mistakeCountThisPlaythrough: 0,
    currentPath: undefined,
    totalPlaythroughs: s.totalPlaythroughs + 1
  }));
}

export function setCurrentSkin(skinId: string): boolean {
  const state = get(achievementState);
  if (!state.unlockedSkins.includes(skinId)) return false;
  achievementState.update(s => ({ ...s, currentSkin: skinId }));
  playSFX('select');
  return true;
}

export function getAchievementById(id: string): Achievement | undefined {
  return achievements.find(a => a.id === id);
}

export function getArchiveById(id: string): ArchiveEntry | undefined {
  return archives.find(a => a.id === id);
}

export function getAudioById(id: string): SpecialAudio | undefined {
  return specialAudios.find(a => a.id === id);
}

export function getSkinById(id: string): MenuSkin | undefined {
  return menuSkins.find(s => s.id === id);
}

export function getAllAchievements(): Achievement[] {
  return achievements;
}

export function getAllArchives(): ArchiveEntry[] {
  return archives;
}

export function getAllAudios(): SpecialAudio[] {
  return specialAudios;
}

export function getAllSkins(): MenuSkin[] {
  return menuSkins;
}

export function resetAchievements(): void {
  achievementState.set(createInitialAchievementState());
}

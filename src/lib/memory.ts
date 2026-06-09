import { writable, derived, get } from 'svelte/store';
import type {
  GlobalMemory,
  UnlockedClue,
  MemoryCondition,
  PlaythroughRecord,
  DialogueVariant,
  AudioHint
} from '../types/game';
import { checkAndUnlockAchievements } from './achievements';

const MEMORY_KEY = 'deep_sea_global_memory';

function createInitialGlobalMemory(): GlobalMemory {
  return {
    currentPlaythrough: 1,
    unlockedClues: {},
    unlockedEvidenceIds: [],
    playthroughHistory: [],
    audioHintsTriggered: [],
    dialogueVariantsUsed: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

function loadMemoryFromStorage(): GlobalMemory {
  try {
    const data = localStorage.getItem(MEMORY_KEY);
    if (data) {
      const parsed = JSON.parse(data) as GlobalMemory;
      return {
        ...createInitialGlobalMemory(),
        ...parsed
      };
    }
  } catch (e) {
    console.error('Failed to load global memory:', e);
  }
  return createInitialGlobalMemory();
}

function saveMemoryToStorage(memory: GlobalMemory): void {
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(memory));
  } catch (e) {
    console.error('Failed to save global memory:', e);
  }
}

export const globalMemory = writable<GlobalMemory>(loadMemoryFromStorage());

globalMemory.subscribe(memory => {
  saveMemoryToStorage(memory);
});

export const unlockedClueIds = derived(globalMemory, $mem =>
  Object.keys($mem.unlockedClues)
);

export const unlockedClueList = derived(globalMemory, $mem =>
  Object.values($mem.unlockedClues)
);

export const currentPlaythrough = derived(globalMemory, $mem =>
  $mem.currentPlaythrough
);

export const playthroughCount = derived(globalMemory, $mem =>
  $mem.playthroughHistory.length + 1
);

export const hasAnyMemory = derived(globalMemory, $mem =>
  Object.keys($mem.unlockedClues).length > 0 ||
  $mem.playthroughHistory.length > 0 ||
  $mem.unlockedEvidenceIds.length > 0
);

export const unlockedEndingIdsFromMemory = derived(globalMemory, $mem =>
  Array.from(new Set($mem.playthroughHistory.map(p => p.endingId).filter(Boolean) as string[]))
);

export function checkMemoryCondition(condition?: MemoryCondition): boolean {
  if (!condition) return true;
  const memory = get(globalMemory);

  if (condition.requiredClues) {
    for (const clueId of condition.requiredClues) {
      if (!memory.unlockedClues[clueId]) return false;
    }
  }

  if (condition.anyClues) {
    const hasAny = condition.anyClues.some(clueId => memory.unlockedClues[clueId]);
    if (!hasAny) return false;
  }

  if (condition.requiredEndings) {
    const unlockedEndings = memory.playthroughHistory
      .map(p => p.endingId)
      .filter(Boolean) as string[];
    for (const endingId of condition.requiredEndings) {
      if (!unlockedEndings.includes(endingId)) return false;
    }
  }

  if (condition.requiredEvidence) {
    for (const evId of condition.requiredEvidence) {
      if (!memory.unlockedEvidenceIds.includes(evId)) return false;
    }
  }

  if (condition.playthroughAtLeast) {
    if (memory.currentPlaythrough < condition.playthroughAtLeast) return false;
  }

  return true;
}

export function unlockClue(
  clueId: string,
  source?: { nodeId?: string; endingId?: string }
): boolean {
  const memory = get(globalMemory);
  if (memory.unlockedClues[clueId]) return false;

  const clue: UnlockedClue = {
    id: clueId,
    unlockedAt: Date.now(),
    firstPlaythrough: memory.currentPlaythrough,
    sourceNodeId: source?.nodeId,
    sourceEndingId: source?.endingId
  };

  globalMemory.update(m => ({
    ...m,
    unlockedClues: { ...m.unlockedClues, [clueId]: clue },
    updatedAt: Date.now()
  }));
  checkAndUnlockAchievements({
    clueUnlocked: clueId
  });
  return true;
}

export function isClueUnlocked(clueId: string): boolean {
  const memory = get(globalMemory);
  return !!memory.unlockedClues[clueId];
}

export function unlockEvidenceId(evidenceId: string): boolean {
  const memory = get(globalMemory);
  if (memory.unlockedEvidenceIds.includes(evidenceId)) return false;

  globalMemory.update(m => ({
    ...m,
    unlockedEvidenceIds: [...m.unlockedEvidenceIds, evidenceId],
    updatedAt: Date.now()
  }));
  checkAndUnlockAchievements({
    evidenceCollected: evidenceId
  });
  return true;
}

export function recordPlaythrough(record: Omit<PlaythroughRecord, 'playthrough' | 'completedAt'>): void {
  const memory = get(globalMemory);
  const fullRecord: PlaythroughRecord = {
    ...record,
    playthrough: memory.currentPlaythrough,
    completedAt: Date.now()
  };

  globalMemory.update(m => ({
    ...m,
    playthroughHistory: [...m.playthroughHistory, fullRecord],
    currentPlaythrough: m.currentPlaythrough + 1,
    updatedAt: Date.now()
  }));
}

export function selectDialogueVariant(
  variants: DialogueVariant[] | undefined
): DialogueVariant | null {
  if (!variants || variants.length === 0) return null;

  for (const variant of variants) {
    const memoryOk = checkMemoryCondition(variant.memoryCondition);
    if (memoryOk) {
      return variant;
    }
  }
  return null;
}

export function getApplicableAudioHints(hints: AudioHint[] | undefined): AudioHint[] {
  if (!hints || hints.length === 0) return [];
  const memory = get(globalMemory);
  const playthrough = memory.currentPlaythrough;

  return hints.filter(hint => {
    if (!checkMemoryCondition(hint.memoryCondition)) return false;
    if (hint.playthroughExclusive && hint.id.includes(`p${playthrough}`)) return true;
    if (hint.oncePerPlaythrough) {
      const perPlaythroughId = `${hint.id}_p${playthrough}`;
      if (memory.audioHintsTriggered.includes(perPlaythroughId)) return false;
    }
    return true;
  });
}

export function markAudioHintTriggered(hintId: string): void {
  const memory = get(globalMemory);
  const playthroughId = `${hintId}_p${memory.currentPlaythrough}`;
  if (memory.audioHintsTriggered.includes(playthroughId)) return;

  globalMemory.update(m => ({
    ...m,
    audioHintsTriggered: [...m.audioHintsTriggered, playthroughId],
    updatedAt: Date.now()
  }));
}

export function markDialogueVariantUsed(variantKey: string): void {
  globalMemory.update(m => ({
    ...m,
    dialogueVariantsUsed: [...m.dialogueVariantsUsed, variantKey],
    updatedAt: Date.now()
  }));
}

export function hasUnlockedAnyOfEnding(endingIds: string[]): boolean {
  const memory = get(globalMemory);
  const unlockedEndings = memory.playthroughHistory
    .map(p => p.endingId)
    .filter(Boolean) as string[];
  return endingIds.some(id => unlockedEndings.includes(id));
}

export function getMemorySummaryForMenu(): {
  playthrough: number;
  cluesCount: number;
  endingsCount: number;
  evidenceCount: number;
  latestEnding?: { id: string; title?: string };
  hasNewGamePlus: boolean;
} {
  const memory = get(globalMemory);
  const allEndings = memory.playthroughHistory
    .map(p => p.endingId)
    .filter(Boolean) as string[];
  const uniqueEndings = Array.from(new Set(allEndings));
  const lastRecord = memory.playthroughHistory[memory.playthroughHistory.length - 1];

  return {
    playthrough: memory.currentPlaythrough,
    cluesCount: Object.keys(memory.unlockedClues).length,
    endingsCount: uniqueEndings.length,
    evidenceCount: memory.unlockedEvidenceIds.length,
    latestEnding: lastRecord?.endingId
      ? { id: lastRecord.endingId }
      : undefined,
    hasNewGamePlus: memory.currentPlaythrough > 1
  };
}

export function resetGlobalMemory(): void {
  globalMemory.set(createInitialGlobalMemory());
}

export function exportMemory(): GlobalMemory {
  return get(globalMemory);
}

export function importMemory(memory: GlobalMemory): void {
  globalMemory.set({
    ...createInitialGlobalMemory(),
    ...memory,
    updatedAt: Date.now()
  });
}

export function isFirstPlaythrough(): boolean {
  const memory = get(globalMemory);
  return memory.currentPlaythrough <= 1;
}

export function isNewGamePlus(): boolean {
  const memory = get(globalMemory);
  return memory.currentPlaythrough >= 2;
}

export function shouldShowImportantDanmaku(pseudoLiveMode: boolean): boolean {
  if (!pseudoLiveMode) return true;
  return !isFirstPlaythrough();
}

export function shouldShowBackendPerspective(pseudoLiveMode: boolean): boolean {
  if (!pseudoLiveMode) return false;
  return isNewGamePlus();
}

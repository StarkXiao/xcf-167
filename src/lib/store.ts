import { writable, derived, get } from 'svelte/store';
import type { GameState, GameScene, Danmaku, CrewMentalState, CrewMemberId, CrewPerspectiveId } from '../types/game';
import { createNewGameState, loadSettings, type GameSettings } from './storage';
import { unlockedEndingIdsFromMemory } from './memory';

const DEFAULT_MENTAL_STATES: Record<CrewMemberId, CrewMentalState> = {
  ahai: { memberId: 'ahai', mentalState: 'anxious', fearLevel: 10, anxietyLevel: 20, resolveLevel: 30, sanityEdge: 80, secretExposure: 'hidden', hasBrokenDown: false, hasConfessed: false },
  xiaolin: { memberId: 'xiaolin', mentalState: 'anxious', fearLevel: 20, anxietyLevel: 30, resolveLevel: 20, sanityEdge: 60, secretExposure: 'hidden', hasBrokenDown: false, hasConfessed: false },
  laozhou: { memberId: 'laozhou', mentalState: 'calm', fearLevel: 5, anxietyLevel: 10, resolveLevel: 60, sanityEdge: 90, secretExposure: 'hidden', hasBrokenDown: false, hasConfessed: false },
  suboshi: { memberId: 'suboshi', mentalState: 'calm', fearLevel: 15, anxietyLevel: 25, resolveLevel: 50, sanityEdge: 85, secretExposure: 'hidden', hasBrokenDown: false, hasConfessed: false }
};

export const gameState = writable<GameState>(createNewGameState());
export const currentScene = writable<GameScene>('menu');
export const settings = writable<GameSettings>(loadSettings());

export const activeDanmakus = writable<Danmaku[]>([]);
export const isTyping = writable(false);
export const showMenu = writable(false);

export const currentCrewPerspective = derived(gameState, $state => $state.currentCrewPerspective);
export const crewMentalStates = derived(gameState, $state => $state.crewMentalStates || DEFAULT_MENTAL_STATES);

export const currentVariables = derived(gameState, $state => $state.variables);
export const unlockedEndings = derived(
  [gameState, unlockedEndingIdsFromMemory],
  ([$state, $memoryEndings]) => {
    const combined = new Set([...$state.unlockedEndings, ...$memoryEndings]);
    return Array.from(combined);
  }
);

export function setCrewPerspective(perspectiveId: CrewPerspectiveId): void {
  gameState.update(state => ({
    ...state,
    currentCrewPerspective: perspectiveId,
    updatedAt: Date.now()
  }));
}

export function initCrewMentalStates(): void {
  gameState.update(state => {
    if (state.crewMentalStates) return state;
    return {
      ...state,
      crewMentalStates: { ...DEFAULT_MENTAL_STATES },
      updatedAt: Date.now()
    };
  });
}

export function updateCrewMentalState(memberId: CrewMemberId, updates: Partial<CrewMentalState>): void {
  gameState.update(state => {
    const existingStates = state.crewMentalStates || DEFAULT_MENTAL_STATES;
    const current = existingStates[memberId] || DEFAULT_MENTAL_STATES[memberId];
    const updatedMental: CrewMentalState = {
      memberId,
      mentalState: updates.mentalState ?? current.mentalState,
      fearLevel: updates.fearLevel ?? current.fearLevel,
      anxietyLevel: updates.anxietyLevel ?? current.anxietyLevel,
      resolveLevel: updates.resolveLevel ?? current.resolveLevel,
      sanityEdge: updates.sanityEdge ?? current.sanityEdge,
      secretExposure: updates.secretExposure ?? current.secretExposure,
      hasBrokenDown: updates.hasBrokenDown ?? current.hasBrokenDown,
      hasConfessed: updates.hasConfessed ?? current.hasConfessed
    };
    const newStates: Record<CrewMemberId, CrewMentalState> = {
      ...existingStates,
      [memberId]: updatedMental
    };
    return {
      ...state,
      crewMentalStates: newStates,
      updatedAt: Date.now()
    };
  });
}

export function applyMentalStateChanges(changes: { memberId: CrewMemberId; mentalState?: any; fearDelta?: number; anxietyDelta?: number; resolveDelta?: number; sanityDelta?: number; secretExposure?: any; hasBrokenDown?: boolean; hasConfessed?: boolean }[]): void {
  gameState.update(state => {
    const baseStates = state.crewMentalStates || DEFAULT_MENTAL_STATES;
    const newStates: Record<CrewMemberId, CrewMentalState> = { ...baseStates } as Record<CrewMemberId, CrewMentalState>;
    for (const change of changes) {
      const current = newStates[change.memberId] || DEFAULT_MENTAL_STATES[change.memberId];
      newStates[change.memberId] = {
        ...current,
        memberId: change.memberId,
        ...(change.mentalState ? { mentalState: change.mentalState } : {}),
        ...(change.fearDelta !== undefined ? { fearLevel: Math.max(0, Math.min(100, current.fearLevel + change.fearDelta)) } : {}),
        ...(change.anxietyDelta !== undefined ? { anxietyLevel: Math.max(0, Math.min(100, current.anxietyLevel + change.anxietyDelta)) } : {}),
        ...(change.resolveDelta !== undefined ? { resolveLevel: Math.max(0, Math.min(100, current.resolveLevel + change.resolveDelta)) } : {}),
        ...(change.sanityDelta !== undefined ? { sanityEdge: Math.max(0, Math.min(100, current.sanityEdge + change.sanityDelta)) } : {}),
        ...(change.secretExposure ? { secretExposure: change.secretExposure } : {}),
        ...(change.hasBrokenDown !== undefined ? { hasBrokenDown: change.hasBrokenDown } : {}),
        ...(change.hasConfessed !== undefined ? { hasConfessed: change.hasConfessed } : {})
      };
    }
    return { ...state, crewMentalStates: newStates, updatedAt: Date.now() };
  });
}

export function setVariable(key: string, value: string | number | boolean): void {
  gameState.update(state => ({
    ...state,
    variables: { ...state.variables, [key]: value },
    updatedAt: Date.now()
  }));
}

export function getVariable(key: string): string | number | boolean | undefined {
  let value: string | number | boolean | undefined;
  gameState.subscribe(s => { value = s.variables[key]; })();
  return value;
}

export function markNodeVisited(nodeId: string): void {
  gameState.update(state => {
    if (state.visitedNodes.includes(nodeId)) return state;
    return {
      ...state,
      visitedNodes: [...state.visitedNodes, nodeId],
      updatedAt: Date.now()
    };
  });
}

export function unlockEnding(endingId: string): void {
  gameState.update(state => {
    if (state.unlockedEndings.includes(endingId)) return state;
    return {
      ...state,
      unlockedEndings: [...state.unlockedEndings, endingId],
      updatedAt: Date.now()
    };
  });
}

export function setCurrentNode(nodeId: string): void {
  gameState.update(state => ({
    ...state,
    currentNodeId: nodeId,
    dialogueIndex: 0,
    updatedAt: Date.now()
  }));
  markNodeVisited(nodeId);
}

export function advanceDialogue(): void {
  gameState.update(state => ({
    ...state,
    dialogueIndex: state.dialogueIndex + 1,
    updatedAt: Date.now()
  }));
}

export function resetGameState(): void {
  gameState.set(createNewGameState());
  activeDanmakus.set([]);
}

export function loadState(state: GameState): void {
  gameState.set(state);
  activeDanmakus.set([]);
}

export function addDanmaku(danmaku: Danmaku): void {
  activeDanmakus.update(list => [...list, danmaku]);
}

export function removeDanmaku(id: string): void {
  activeDanmakus.update(list => list.filter(d => d.id !== id));
}

export function clearDanmakus(): void {
  activeDanmakus.set([]);
}

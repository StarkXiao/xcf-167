import { writable, get } from 'svelte/store';
import type { StateCondition, StateEffect, MemoryCondition, TrustCondition, Choice } from '../types/game';
import { globalMemory } from './memory';
import { checkTrustCondition } from './trust';

export interface PreviewPlayState {
  stateVariables: Record<string, any>;
  endingWeights: Record<string, number>;
  playthroughNumber: number;
  unlockedClues: Record<string, boolean>;
  visitedNodes: Set<string>;
  visitedPath: string[];
}

function createInitialPreviewState(): PreviewPlayState {
  return {
    stateVariables: {},
    endingWeights: {},
    playthroughNumber: 1,
    unlockedClues: {},
    visitedNodes: new Set(),
    visitedPath: []
  };
}

export const previewPlayState = writable<PreviewPlayState>(createInitialPreviewState());

export function resetPreviewPlayState(): void {
  previewPlayState.set(createInitialPreviewState());
}

export function applyPreviewEffect(effect?: StateEffect): void {
  if (!effect) return;
  previewPlayState.update(s => {
    const newState = { ...s, stateVariables: { ...s.stateVariables } };
    for (const [key, value] of Object.entries(effect)) {
      newState.stateVariables[key] = value;
    }
    return newState;
  });
}

export function applyPreviewMemoryEffect(choice: Choice): void {
  if (choice.memoryEffect?.clueToUnlock) {
    previewPlayState.update(s => ({
      ...s,
      unlockedClues: { ...s.unlockedClues, [choice.memoryEffect!.clueToUnlock!]: true }
    }));
  }
}

export function addPreviewEndingWeight(endingId: string, value: number, _source: string): void {
  previewPlayState.update(s => {
    const newWeights = { ...s.endingWeights };
    newWeights[endingId] = (newWeights[endingId] || 0) + value;
    return { ...s, endingWeights: newWeights };
  });
}

export function addVisitedNode(nodeId: string): void {
  previewPlayState.update(s => {
    const newVisited = new Set(s.visitedNodes);
    newVisited.add(nodeId);
    return {
      ...s,
      visitedNodes: newVisited,
      visitedPath: [...s.visitedPath, nodeId]
    };
  });
}

export function incrementPlaythrough(): void {
  previewPlayState.update(s => ({
    ...s,
    playthroughNumber: s.playthroughNumber + 1
  }));
}

export function checkPreviewCondition(condition?: StateCondition): boolean {
  if (!condition) return true;
  const state = get(previewPlayState);
  for (const [key, value] of Object.entries(condition)) {
    if (state.stateVariables[key] !== value) return false;
  }
  return true;
}

export function checkPreviewTrustCondition(condition?: TrustCondition): boolean {
  return checkTrustCondition(condition);
}

export function checkPreviewMemoryCondition(condition?: MemoryCondition): boolean {
  if (!condition) return true;
  const state = get(previewPlayState);
  const memory = get(globalMemory);

  if (condition.requiredClues) {
    for (const clueId of condition.requiredClues) {
      if (!state.unlockedClues[clueId] && !memory.unlockedClues[clueId]) return false;
    }
  }

  if (condition.anyClues) {
    const hasAny = condition.anyClues.some(clueId => state.unlockedClues[clueId] || memory.unlockedClues[clueId]);
    if (!hasAny) return false;
  }

  if (condition.requiredEndings) {
    const memoryEndings = memory.playthroughHistory.map(p => p.endingId).filter(Boolean) as string[];
    for (const endingId of condition.requiredEndings) {
      if (!memoryEndings.includes(endingId)) return false;
    }
  }

  if (condition.playthroughAtLeast) {
    if (state.playthroughNumber < condition.playthroughAtLeast && memory.currentPlaythrough < condition.playthroughAtLeast) return false;
  }

  return true;
}

export function checkAllPreviewConditions(
  stateCondition?: StateCondition,
  memoryCondition?: MemoryCondition,
  trustCondition?: TrustCondition
): boolean {
  return checkPreviewCondition(stateCondition)
    && checkPreviewTrustCondition(trustCondition)
    && checkPreviewMemoryCondition(memoryCondition);
}

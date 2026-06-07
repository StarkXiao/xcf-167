import { writable, derived } from 'svelte/store';
import type { GameState, GameScene } from '../types/game';
import { createNewGameState, loadSettings, type GameSettings } from './storage';
import type { Danmaku } from '../types/game';

export const gameState = writable<GameState>(createNewGameState());
export const currentScene = writable<GameScene>('menu');
export const settings = writable<GameSettings>(loadSettings());

export const activeDanmakus = writable<Danmaku[]>([]);
export const isTyping = writable(false);
export const showMenu = writable(false);

export const currentVariables = derived(gameState, $state => $state.variables);
export const unlockedEndings = derived(gameState, $state => $state.unlockedEndings);

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

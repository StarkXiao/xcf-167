import type { GameState, SaveSlot, GlobalMemory } from '../types/game';
import { importMemory, exportMemory } from './memory';

const SAVE_KEY = 'deep_sea_save_slots';
const SETTINGS_KEY = 'deep_sea_settings';
const MAX_SLOTS = 5;

export interface GameSettings {
  textSpeed: number;
  bgmVolume: number;
  sfxVolume: number;
  danmakuEnabled: boolean;
  danmakuSpeed: number;
}

const defaultSettings: GameSettings = {
  textSpeed: 50,
  bgmVolume: 0.5,
  sfxVolume: 0.7,
  danmakuEnabled: true,
  danmakuSpeed: 1
};

export const defaultGameState: GameState = {
  currentNodeId: 'start',
  dialogueIndex: 0,
  variables: {},
  unlockedEndings: [],
  visitedNodes: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export interface SaveSlotWithMemory extends SaveSlot {
  memorySnapshot?: GlobalMemory;
}

export function createNewGameState(): GameState {
  return {
    ...defaultGameState,
    variables: {},
    visitedNodes: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

export function loadSaveSlots(): SaveSlot[] {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (data) {
      const slots = JSON.parse(data) as SaveSlotWithMemory[];
      return slots.length > 0 ? slots : [];
    }
  } catch (e) {
    console.error('Failed to load save slots:', e);
  }
  return [];
}

export function saveToSlot(slotId: number, state: GameState, preview: string): SaveSlot {
  const slots = loadSaveSlots() as SaveSlotWithMemory[];
  const memorySnapshot = exportMemory();
  const slot: SaveSlotWithMemory = {
    id: slotId,
    state: { ...state, updatedAt: Date.now() },
    savedAt: Date.now(),
    preview,
    memorySnapshot
  };
  
  const existingIndex = slots.findIndex(s => s.id === slotId);
  if (existingIndex >= 0) {
    slots[existingIndex] = slot;
  } else {
    slots.push(slot);
  }
  
  slots.sort((a, b) => a.id - b.id);
  localStorage.setItem(SAVE_KEY, JSON.stringify(slots.slice(0, MAX_SLOTS)));
  return slot;
}

export function loadFromSlot(slotId: number): SaveSlot | null {
  const slots = loadSaveSlots() as SaveSlotWithMemory[];
  const slot = slots.find(s => s.id === slotId) || null;
  if (slot?.memorySnapshot) {
    importMemory(slot.memorySnapshot);
  }
  return slot;
}

export function deleteSlot(slotId: number): void {
  const slots = loadSaveSlots().filter(s => s.id !== slotId);
  localStorage.setItem(SAVE_KEY, JSON.stringify(slots));
}

export function clearAllSaves(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function loadSettings(): GameSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...defaultSettings };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function hasAnySave(): boolean {
  return loadSaveSlots().length > 0;
}

export interface Danmaku {
  id: string;
  username: string;
  content: string;
  timestamp: number;
  dialogueIndex?: number;
  relativeMs?: number;
  color?: string;
  isImportant?: boolean;
}

export interface Choice {
  id: string;
  text: string;
  nextNodeId: string;
  condition?: StateCondition;
  effect?: StateEffect;
}

export interface StateCondition {
  [key: string]: string | number | boolean;
}

export interface StateEffect {
  [key: string]: string | number | boolean;
}

export type SFXType =
  | 'click' | 'select' | 'warning' | 'sonar' | 'bubbles'
  | 'water_drip' | 'water_flow' | 'metal_creak' | 'metal_crash'
  | 'hull_pressure' | 'alarm' | 'static' | 'radio_noise'
  | 'keyboard' | 'whisper' | 'heartbeat' | 'breath'
  | 'glass_crack' | 'thunder' | 'door_slam' | 'notify';

export interface AudioTrigger {
  sfx: SFXType;
  atCharIndex?: number;
  delay?: number;
  volume?: number;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  audioId?: string;
  delay?: number;
  sfx?: AudioTrigger[];
  bgm?: 'deep' | 'tense' | 'calm' | 'mystery';
  baseTypingSpeed?: number;
  mood?: 'normal' | 'tense' | 'scared' | 'calm' | 'whisper' | 'urgent';
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
}

export interface StoryNode {
  id: string;
  background?: string;
  title?: string;
  dialogues: DialogueLine[];
  danmakus?: Danmaku[];
  choices?: Choice[];
  nextNodeId?: string;
  effects?: StateEffect;
  isEnding?: boolean;
  endingId?: string;
  endingTitle?: string;
  endingDescription?: string;
}

export interface Ending {
  id: string;
  title: string;
  description: string;
  isGood: boolean;
  unlockCondition?: string;
}

export interface GameState {
  currentNodeId: string;
  dialogueIndex: number;
  variables: Record<string, string | number | boolean>;
  unlockedEndings: string[];
  visitedNodes: string[];
  createdAt: number;
  updatedAt: number;
}

export interface SaveSlot {
  id: number;
  state: GameState;
  savedAt: number;
  preview: string;
}

export type GameScene = 'menu' | 'playing' | 'endings' | 'settings';

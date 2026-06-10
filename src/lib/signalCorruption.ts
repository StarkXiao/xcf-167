import { writable, derived, get } from 'svelte/store';
import type { SignalCorruptionState, CorruptionEffect, ChannelDegradation } from '../types/game';
import { hullDamage } from './hullDamage';

const GLITCH_CHARS = '░▒▓█▀▄■□●○◊◘◙☺☻♥♦♣♠♂♀♪♫☼►◄↕‼¶§▬↨↑↓→←∟↔▲▼@#$%&*()_+-=[]{}|;:,.<>?/~`';

const defaultChannelDegradation: ChannelDegradation = {
  visual: 0, danmaku: 0, audio: 0, control: 0, power: 0, combined: 0
};

export const signalCorruption = writable<SignalCorruptionState>({
  level: 0,
  targetLevel: 0,
  lastUpdate: Date.now(),
  fluctuation: 0,
  channelDegradation: { ...defaultChannelDegradation }
});

let corruptionTimer: number | null = null;

export function initSignalCorruption(): void {
  if (corruptionTimer !== null) return;
  corruptionTimer = window.setInterval(() => {
    signalCorruption.update(state => {
      const now = Date.now();
      const dt = (now - state.lastUpdate) / 1000;
      const ch = getChannelDegradationFromHull();

      const targetLevel = ch.combined;
      const approachSpeed = 0.3;
      let newLevel = state.level + (targetLevel - state.level) * approachSpeed * dt;
      const fluctuationAmount = Math.sin(now / 800) * 3 + Math.sin(now / 2300) * 2 + (Math.random() - 0.5) * 4;
      newLevel += fluctuationAmount * (targetLevel / 100);
      newLevel = Math.max(0, Math.min(100, newLevel));

      return {
        ...state,
        level: newLevel,
        targetLevel,
        fluctuation: fluctuationAmount,
        lastUpdate: now,
        channelDegradation: ch
      };
    });
  }, 100);
}

export function destroySignalCorruption(): void {
  if (corruptionTimer !== null) {
    clearInterval(corruptionTimer);
    corruptionTimer = null;
  }
}

export function setCorruptionTarget(target: number): void {
  signalCorruption.update(state => ({
    ...state,
    targetLevel: Math.max(0, Math.min(100, target))
  }));
}

export function increaseCorruption(amount: number): void {
  signalCorruption.update(state => ({
    ...state,
    targetLevel: Math.max(0, Math.min(100, state.targetLevel + amount))
  }));
}

export function decreaseCorruption(amount: number): void {
  signalCorruption.update(state => ({
    ...state,
    targetLevel: Math.max(0, Math.min(100, state.targetLevel - amount))
  }));
}

export function resetCorruption(): void {
  signalCorruption.set({
    level: 0,
    targetLevel: 0,
    lastUpdate: Date.now(),
    fluctuation: 0,
    channelDegradation: { ...defaultChannelDegradation }
  });
}

function getChannelDegradationFromHull(): ChannelDegradation {
  const state = get(hullDamage);
  const s = state.systems;
  const visual = Math.max(s.hull.damage, s.camera.damage) * 0.9;
  const danmaku = s.communication.damage * 0.95;
  const audio = s.sonar.damage * 0.9;
  const control = s.control.damage * 0.85;
  const power = s.power.damage * 0.95;
  const combined = visual * 0.25 + danmaku * 0.2 + audio * 0.2 + control * 0.15 + power * 0.2;
  return {
    visual: Math.min(100, visual),
    danmaku: Math.min(100, danmaku),
    audio: Math.min(100, audio),
    control: Math.min(100, control),
    power: Math.min(100, power),
    combined: Math.min(100, combined)
  };
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function getCurrentCorruption(): number {
  return get(signalCorruption).level;
}

export function getChannelLevel(): ChannelDegradation {
  return get(signalCorruption).channelDegradation;
}

export function glitchSubtitleText(text: string, corruptionLevel: number, seed?: number): string {
  if (corruptionLevel < 5) return text;
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const intensity = corruptionLevel / 100;
  const charSwapChance = intensity * 0.12;
  const charInsertChance = intensity * 0.08;
  const charDeleteChance = intensity * 0.05;
  const charRepeatChance = intensity * 0.06;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (/[\u4e00-\u9fa5a-zA-Z0-9]/.test(char)) {
      if (rand() < charDeleteChance) {
        continue;
      }
      if (rand() < charSwapChance) {
        result += GLITCH_CHARS[Math.floor(rand() * GLITCH_CHARS.length)];
      } else {
        result += char;
      }
      if (rand() < charRepeatChance) {
        result += char;
      }
      if (rand() < charInsertChance) {
        result += GLITCH_CHARS[Math.floor(rand() * GLITCH_CHARS.length)];
      }
    } else {
      result += char;
    }
  }
  if (intensity > 0.5 && rand() < (intensity - 0.5) * 0.3) {
    const insertPos = Math.floor(rand() * result.length);
    const glitchLen = Math.floor(rand() * 3) + 1;
    let glitchStr = '';
    for (let j = 0; j < glitchLen; j++) {
      glitchStr += GLITCH_CHARS[Math.floor(rand() * GLITCH_CHARS.length)];
    }
    result = result.slice(0, insertPos) + glitchStr + result.slice(insertPos);
  }
  return result;
}

export function calculateDanmakuDelay(baseDelay: number, corruptionLevel: number): number {
  const ch = getChannelLevel();
  const danmakuCorruption = ch.danmaku;
  const effectiveCorruption = Math.max(corruptionLevel, danmakuCorruption);
  if (effectiveCorruption < 10) return baseDelay;
  const intensity = effectiveCorruption / 100;
  const jitterAmount = intensity * 2000;
  const jitter = (Math.random() - 0.3) * jitterAmount;
  const extraDelay = intensity * intensity * 3000;
  return Math.max(0, baseDelay + jitter + extraDelay);
}

export function getDanmakuReorderChance(corruptionLevel: number): number {
  const ch = getChannelLevel();
  const effective = Math.max(corruptionLevel, ch.danmaku);
  return Math.min(0.6, (effective / 100) * 0.7);
}

export function getAudioDistortionParams(corruptionLevel: number): {
  noiseAmount: number;
  pitchShift: number;
  filterCutoff: number;
  lfoDepth: number;
} {
  const ch = getChannelLevel();
  const effective = Math.max(corruptionLevel, ch.audio);
  const intensity = effective / 100;
  return {
    noiseAmount: intensity * 0.15,
    pitchShift: (Math.random() - 0.5) * intensity * 50,
    filterCutoff: Math.max(200, 8000 - intensity * 7000),
    lfoDepth: intensity * 0.4
  };
}

export function shouldHideChoice(corruptionLevel: number, choiceIndex: number): boolean {
  const ch = getChannelLevel();
  const effective = Math.max(corruptionLevel, ch.control);
  if (effective < 30) return false;
  const intensity = (effective - 30) / 70;
  const hideChance = intensity * 0.25;
  return Math.random() < hideChance * (choiceIndex + 1) * 0.5;
}

export function glitchChoiceText(text: string, corruptionLevel: number): string {
  if (corruptionLevel < 20) return text;
  return glitchSubtitleText(text, corruptionLevel * 0.7);
}

export function shouldScrambleChoices(corruptionLevel: number): boolean {
  const ch = getChannelLevel();
  const effective = Math.max(corruptionLevel, ch.control);
  return effective > 50 && Math.random() < (effective - 50) / 100;
}

export function getVisualArtifactChance(corruptionLevel: number): number {
  const ch = getChannelLevel();
  const effective = Math.max(corruptionLevel, ch.visual);
  return Math.min(0.8, (effective / 100) * 0.9);
}

export function getCorruptionSeverity(): 'none' | 'mild' | 'moderate' | 'severe' | 'critical' {
  const level = getCurrentCorruption();
  if (level < 10) return 'none';
  if (level < 30) return 'mild';
  if (level < 55) return 'moderate';
  if (level < 80) return 'severe';
  return 'critical';
}

export const corruptionSeverity = derived(signalCorruption, $state => {
  const level = $state.level;
  if (level < 10) return 'none';
  if (level < 30) return 'mild';
  if (level < 55) return 'moderate';
  if (level < 80) return 'severe';
  return 'critical';
});

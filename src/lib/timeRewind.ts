import { writable, derived, get } from 'svelte/store';
import type { RewindState, RewindCheckpoint, RewindEffect, SFXType, Danmaku } from '../types/game';
import { gameState, setVariable } from './store';
import { increaseCorruption } from './signalCorruption';
import { playSFX } from './audio';

const MAX_CHECKPOINTS = 10;
const BASE_STABILITY_COST = 15;
const STABILITY_REGEN_PER_NODE = 5;
const DANMAKU_SHUFFLE_CHANCE_BASE = 0.3;
const SFX_OVERRIDE_CHANCE_BASE = 0.25;
const CLUE_ALTERATION_CHANCE_BASE = 0.2;

function createInitialRewindState(): RewindState {
  return {
    isRewindMode: false,
    stability: 100,
    maxStability: 100,
    checkpoints: [],
    rewindCount: 0,
    activeRewind: null,
    rewindDanmakuShuffle: false,
    rewireSfxTrigger: false,
    rewindClueOverride: false,
    lastRewindTime: 0
  };
}

export const rewindState = writable<RewindState>(createInitialRewindState());

export const canRewind = derived(rewindState, $state => {
  return $state.checkpoints.length > 0 && $state.stability >= BASE_STABILITY_COST;
});

export const stabilityLevel = derived(rewindState, $state => {
  const pct = ($state.stability / $state.maxStability) * 100;
  if (pct >= 80) return 'stable';
  if (pct >= 50) return 'fragile';
  if (pct >= 25) return 'unstable';
  return 'critical';
});

let triggeredSfxLog: string[] = [];
let danmakuOrderLog: string[] = [];

export function logTriggeredSfx(sfxType: SFXType): void {
  triggeredSfxLog.push(`${sfxType}-${Date.now()}`);
  if (triggeredSfxLog.length > 100) {
    triggeredSfxLog = triggeredSfxLog.slice(-50);
  }
}

export function logDanmakuDisplayed(danmakuId: string): void {
  if (!danmakuOrderLog.includes(danmakuId)) {
    danmakuOrderLog.push(danmakuId);
  }
}

export function createCheckpoint(label?: string): RewindCheckpoint | null {
  const state = get(gameState);
  const rState = get(rewindState);

  const unlockedClues: string[] = Object.entries(state.variables)
    .filter(([k, v]) => v === true && (
      k.startsWith('clue') ||
      k.startsWith('creature_is_artificial') ||
      k.startsWith('crew_knew') ||
      k.startsWith('previous_incident') ||
      k.startsWith('signal_response') ||
      k.startsWith('full_truth')
    ))
    .map(([k]) => k);

  const checkpoint: RewindCheckpoint = {
    id: `ckpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nodeId: state.currentNodeId,
    dialogueIndex: state.dialogueIndex,
    timestamp: Date.now(),
    label,
    snapshot: {
      variables: { ...state.variables },
      danmakuOrder: [...danmakuOrderLog],
      triggeredSfx: [...triggeredSfxLog],
      unlockedClues
    }
  };

  rewindState.update(s => {
    const newCheckpoints = [...s.checkpoints, checkpoint];
    if (newCheckpoints.length > MAX_CHECKPOINTS) {
      newCheckpoints.shift();
    }
    return { ...s, checkpoints: newCheckpoints };
  });

  return checkpoint;
}

export function removeCheckpoint(checkpointId: string): void {
  rewindState.update(s => ({
    ...s,
    checkpoints: s.checkpoints.filter(c => c.id !== checkpointId)
  }));
}

export function clearCheckpoints(): void {
  rewindState.update(s => ({ ...s, checkpoints: [] }));
}

export function generateRewindEffect(checkpoint: RewindCheckpoint): RewindEffect {
  const rState = get(rewindState);
  const instabilityFactor = 1 - (rState.stability / rState.maxStability);
  const rewindIntensity = Math.min(1, instabilityFactor + rState.rewindCount * 0.05);

  const effect: RewindEffect = {
    stabilityCost: BASE_STABILITY_COST + Math.floor(rewindIntensity * 20)
  };

  if (Math.random() < DANMAKU_SHUFFLE_CHANCE_BASE + rewindIntensity * 0.4) {
    effect.danmakuReorderSeed = Math.floor(Math.random() * 100000);
  }

  if (Math.random() < SFX_OVERRIDE_CHANCE_BASE + rewindIntensity * 0.3) {
    const sfxPool: SFXType[] = [
      'static', 'radio_noise', 'whisper', 'sonar', 'metal_creak',
      'heartbeat', 'breath', 'water_drip', 'warning', 'notify'
    ];
    const overrideCount = Math.floor(Math.random() * 3) + 1;
    effect.sfxOverride = [];
    for (let i = 0; i < overrideCount; i++) {
      const original = sfxPool[Math.floor(Math.random() * sfxPool.length)];
      let replacement = sfxPool[Math.floor(Math.random() * sfxPool.length)];
      while (replacement === original) {
        replacement = sfxPool[Math.floor(Math.random() * sfxPool.length)];
      }
      effect.sfxOverride.push({
        originalSfx: original,
        replacementSfx: replacement,
        delay: Math.floor(Math.random() * 500)
      });
    }
  }

  if (Math.random() < CLUE_ALTERATION_CHANCE_BASE + rewindIntensity * 0.25) {
    const clueVars = Object.entries(get(gameState).variables)
      .filter(([k, v]) => typeof v === 'boolean' && (
        k.startsWith('clue') ||
        k.startsWith('creature_is_artificial') ||
        k.startsWith('crew_knew') ||
        k.startsWith('previous_incident') ||
        k.startsWith('signal_response')
      ));
    if (clueVars.length > 0) {
      const [clueId, currentVal] = clueVars[Math.floor(Math.random() * clueVars.length)];
      effect.clueAlteration = [{
        clueId,
        newValue: !(currentVal as boolean)
      }];
    }
  }

  return effect;
}

export function initiateRewind(checkpoint: RewindCheckpoint): {
  success: boolean;
  effect?: RewindEffect;
  reason?: string;
} {
  const rState = get(rewindState);

  if (rState.isRewindMode) {
    return { success: false, reason: '已处于回溯模式中' };
  }

  const effect = generateRewindEffect(checkpoint);

  if (rState.stability < effect.stabilityCost) {
    return { success: false, reason: `稳定度不足（需要 ${effect.stabilityCost}）` };
  }

  playSFX('static', 0.7);
  setTimeout(() => playSFX('radio_noise', 0.5), 150);

  rewindState.update(s => ({
    ...s,
    isRewindMode: true,
    activeRewind: checkpoint,
    stability: Math.max(0, s.stability - effect.stabilityCost),
    rewindCount: s.rewindCount + 1,
    rewindDanmakuShuffle: effect.danmakuReorderSeed !== undefined,
    rewireSfxTrigger: (effect.sfxOverride?.length || 0) > 0,
    rewindClueOverride: (effect.clueAlteration?.length || 0) > 0,
    lastRewindTime: Date.now()
  }));

  increaseCorruption(15 + Math.floor(rState.rewindCount * 3));

  if (effect.clueAlteration) {
    effect.clueAlteration.forEach(({ clueId, newValue }) => {
      setVariable(clueId, newValue);
    });
  }

  return { success: true, effect };
}

export function finalizeRewind(): void {
  rewindState.update(s => ({
    ...s,
    isRewindMode: false,
    activeRewind: null,
    rewindDanmakuShuffle: false,
    rewireSfxTrigger: false,
    rewindClueOverride: false
  }));
  playSFX('notify', 0.5);
}

export function cancelRewind(): void {
  rewindState.update(s => ({
    ...s,
    isRewindMode: false,
    activeRewind: null,
    rewindDanmakuShuffle: false,
    rewireSfxTrigger: false,
    rewindClueOverride: false
  }));
}

export function regenerateStability(amount?: number): void {
  const regenAmount = amount ?? STABILITY_REGEN_PER_NODE;
  rewindState.update(s => ({
    ...s,
    stability: Math.min(s.maxStability, s.stability + regenAmount)
  }));
}

export function consumeStability(amount: number): boolean {
  const state = get(rewindState);
  if (state.stability < amount) return false;
  rewindState.update(s => ({
    ...s,
    stability: Math.max(0, s.stability - amount)
  }));
  return true;
}

export function resetRewindState(): void {
  rewindState.set(createInitialRewindState());
  triggeredSfxLog = [];
  danmakuOrderLog = [];
}

export function shuffleDanmakusWithSeed(danmakus: Danmaku[], seed: number): Danmaku[] {
  const result = [...danmakus];
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getSfxOverride(currentSfx: SFXType, effect: RewindEffect | undefined): { sfx: SFXType; delay?: number } | null {
  if (!effect?.sfxOverride) return null;
  const override = effect.sfxOverride.find(o => o.originalSfx === currentSfx);
  if (override) {
    return { sfx: override.replacementSfx, delay: override.delay };
  }
  return null;
}

export function getActiveRewindEffect(): RewindEffect | null {
  const state = get(rewindState);
  if (!state.activeRewind) return null;
  return generateRewindEffect(state.activeRewind);
}

import { writable, derived, get } from 'svelte/store';
import type {
  CrewMember,
  CrewMemberId,
  TrustLevel,
  TrustChange,
  TrustState,
  TrustEffect,
  TrustNotification,
  TrustCondition
} from '../types/game';

export const CREW_MEMBERS: CrewMember[] = [
  {
    id: 'ahai',
    name: '阿海',
    role: '主播 / 探险队长',
    description: '深海探险直播的主播，性格乐观开朗，是团队的核心。'
  },
  {
    id: 'xiaolin',
    name: '小林',
    role: '摄影师',
    description: '负责全程记录画面，年轻细心，有些敏感。'
  },
  {
    id: 'laozhou',
    name: '老周',
    role: '工程师',
    description: '经验丰富的工程师，负责潜水器维护和驾驶，沉稳可靠。'
  },
  {
    id: 'suboshi',
    name: '苏博士',
    role: '海洋生物学家',
    description: '严谨的科学家，对深海生物有深入研究。'
  }
];

const TRUST_MIN = -100;
const TRUST_MAX = 100;
const NOTIFICATION_DURATION = 3000;

function getTrustLevel(value: number): TrustLevel {
  if (value <= -60) return 'hostile';
  if (value <= -20) return 'distrust';
  if (value <= 20) return 'neutral';
  if (value <= 60) return 'trust';
  return 'loyal';
}

function clampTrust(value: number): number {
  return Math.max(TRUST_MIN, Math.min(TRUST_MAX, value));
}

export function getTrustLevelLabel(level: TrustLevel): string {
  const labels: Record<TrustLevel, string> = {
    hostile: '敌对',
    distrust: '怀疑',
    neutral: '中立',
    trust: '信任',
    loyal: '忠诚'
  };
  return labels[level];
}

export function getTrustLevelColor(level: TrustLevel): string {
  const colors: Record<TrustLevel, string> = {
    hostile: '#ff4040',
    distrust: '#ff9060',
    neutral: '#a0c8f0',
    trust: '#60d090',
    loyal: '#40ff80'
  };
  return colors[level];
}

function createInitialCrewTrust(): Record<CrewMemberId, TrustState['crew'][CrewMemberId]> {
  const crew = {} as Record<CrewMemberId, TrustState['crew'][CrewMemberId]>;
  CREW_MEMBERS.forEach(member => {
    crew[member.id] = {
      memberId: member.id,
      value: 0,
      level: 'neutral',
      history: []
    };
  });
  return crew;
}

function createInitialTrustState(): TrustState {
  return {
    crew: createInitialCrewTrust(),
    overallTrust: 0,
    activeNotifications: []
  };
}

export const trustState = writable<TrustState>(createInitialTrustState());

export const crewTrustList = derived(trustState, $state => {
  return CREW_MEMBERS.map(member => ({
    member,
    trust: $state.crew[member.id]
  }));
});

export const overallTrustLevel = derived(trustState, $state => {
  return getTrustLevel($state.overallTrust);
});

export const activeNotifications = derived(trustState, $state => {
  return $state.activeNotifications;
});

export function getCrewTrust(memberId: CrewMemberId): number {
  const state = get(trustState);
  return state.crew[memberId]?.value ?? 0;
}

export function getCrewTrustLevel(memberId: CrewMemberId): TrustLevel {
  const state = get(trustState);
  return state.crew[memberId]?.level ?? 'neutral';
}

function recalculateOverallTrust(state: TrustState): number {
  const values = Object.values(state.crew).map(c => c.value);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function applyTrustChange(change: TrustChange): void {
  trustState.update(state => {
    const newCrew = { ...state.crew };
    const targets: CrewMemberId[] = change.target === 'all'
      ? CREW_MEMBERS.map(m => m.id)
      : [change.target];

    targets.forEach(targetId => {
      const current = newCrew[targetId];
      if (!current) return;

      const newValue = clampTrust(current.value + change.value);
      const newLevel = getTrustLevel(newValue);

      newCrew[targetId] = {
        ...current,
        value: newValue,
        level: newLevel,
        history: [
          ...current.history,
          {
            value: change.value,
            reason: change.reason,
            source: change.source,
            timestamp: Date.now()
          }
        ]
      };
    });

    const newNotifications = targets.map(targetId => ({
      id: `trust-${Date.now()}-${targetId}-${Math.random()}`,
      target: targetId,
      value: change.value,
      reason: change.reason,
      timestamp: Date.now(),
      duration: NOTIFICATION_DURATION
    }));

    const newState: TrustState = {
      ...state,
      crew: newCrew,
      activeNotifications: [...state.activeNotifications, ...newNotifications]
    };

    newState.overallTrust = recalculateOverallTrust(newState);

    setTimeout(() => {
      removeExpiredNotifications();
    }, NOTIFICATION_DURATION + 100);

    return newState;
  });
}

export function applyTrustEffect(effect: TrustEffect | undefined): void {
  if (!effect?.changes?.length) return;
  effect.changes.forEach(change => applyTrustChange(change));
}

function removeExpiredNotifications(): void {
  const now = Date.now();
  trustState.update(state => ({
    ...state,
    activeNotifications: state.activeNotifications.filter(
      n => now - n.timestamp < n.duration
    )
  }));
}

export function checkCrewTrustRequirement(
  memberId: CrewMemberId,
  minLevel?: TrustLevel,
  minValue?: number
): boolean {
  const trust = getCrewTrust(memberId);
  const level = getCrewTrustLevel(memberId);

  const levelOrder: TrustLevel[] = ['hostile', 'distrust', 'neutral', 'trust', 'loyal'];

  if (minLevel !== undefined) {
    const requiredIndex = levelOrder.indexOf(minLevel);
    const currentIndex = levelOrder.indexOf(level);
    if (currentIndex < requiredIndex) return false;
  }

  if (minValue !== undefined && trust < minValue) {
    return false;
  }

  return true;
}

export function getTrustEndingModifiers(): Record<string, number> {
  const state = get(trustState);
  const modifiers: Record<string, number> = {};
  const overall = state.overallTrust;

  modifiers['ending_truth'] = overall >= 20 ? 20 : overall >= 0 ? 5 : overall >= -20 ? -10 : -25;
  modifiers['ending_survival'] = overall >= 40 ? 30 : overall >= 0 ? 15 : overall >= -20 ? -5 : -20;
  modifiers['ending_silence'] = overall <= -20 ? 25 : overall <= 0 ? 10 : -15;
  modifiers['ending_madness'] = overall <= -40 ? 30 : overall <= -20 ? 15 : overall <= 0 ? 5 : -10;
  modifiers['ending_loop'] = overall <= -20 ? 20 : 0;

  CREW_MEMBERS.forEach(member => {
    const trust = state.crew[member.id].value;
    if (member.id === 'suboshi') {
      modifiers['ending_truth'] += trust >= 30 ? 15 : trust >= 0 ? 5 : trust <= -30 ? -15 : 0;
    }
    if (member.id === 'laozhou') {
      modifiers['ending_survival'] += trust >= 30 ? 20 : trust >= 0 ? 10 : trust <= -30 ? -20 : 0;
    }
    if (member.id === 'ahai') {
      modifiers['ending_madness'] += trust <= -30 ? 20 : trust <= 0 ? 10 : 0;
    }
    if (member.id === 'xiaolin') {
      modifiers['ending_silence'] += trust <= -20 ? 15 : 0;
    }
  });

  return modifiers;
}

export function applyTrustEndingWeights(
  addModifier: (endingId: string, value: number, source: string) => void
): void {
  const modifiers = getTrustEndingModifiers();
  Object.entries(modifiers).forEach(([endingId, value]) => {
    if (value !== 0) {
      addModifier(endingId, value, 'trust_overall');
    }
  });
}

export function resetTrustState(): void {
  trustState.set(createInitialTrustState());
}

export function getCrewMember(id: CrewMemberId): CrewMember | undefined {
  return CREW_MEMBERS.find(m => m.id === id);
}

export function checkTrustCondition(condition: TrustCondition | undefined): boolean {
  if (!condition) return true;

  const state = get(trustState);
  const levelOrder: TrustLevel[] = ['hostile', 'distrust', 'neutral', 'trust', 'loyal'];

  if (condition.overallMinValue !== undefined && state.overallTrust < condition.overallMinValue) {
    return false;
  }
  if (condition.overallMaxValue !== undefined && state.overallTrust > condition.overallMaxValue) {
    return false;
  }
  if (condition.overallMinLevel !== undefined) {
    const overallLevel = getTrustLevel(state.overallTrust);
    const requiredIndex = levelOrder.indexOf(condition.overallMinLevel);
    const currentIndex = levelOrder.indexOf(overallLevel);
    if (currentIndex < requiredIndex) return false;
  }

  if (condition.crewRequirements && condition.crewRequirements.length > 0) {
    for (const req of condition.crewRequirements) {
      const crew = state.crew[req.memberId];
      if (!crew) return false;

      if (req.minValue !== undefined && crew.value < req.minValue) return false;
      if (req.maxValue !== undefined && crew.value > req.maxValue) return false;
      if (req.minLevel !== undefined) {
        const requiredIndex = levelOrder.indexOf(req.minLevel);
        const currentIndex = levelOrder.indexOf(crew.level);
        if (currentIndex < requiredIndex) return false;
      }
    }
  }

  return true;
}

export function getLockedEnding(candidates: string[]): string | null {
  const state = get(trustState);
  const suboshiTrust = state.crew.suboshi.value;
  const laozhouTrust = state.crew.laozhou.value;
  const ahaiTrust = state.crew.ahai.value;
  const xiaolinTrust = state.crew.xiaolin.value;
  const overall = state.overallTrust;

  if (suboshiTrust >= 60 && candidates.includes('ending_truth')) {
    return 'ending_truth';
  }
  if (laozhouTrust >= 60 && candidates.includes('ending_survival')) {
    return 'ending_survival';
  }
  if (ahaiTrust <= -60 && candidates.includes('ending_madness')) {
    return 'ending_madness';
  }
  if (xiaolinTrust <= -60 && candidates.includes('ending_silence')) {
    return 'ending_silence';
  }
  if (overall <= -60 && candidates.includes('ending_loop')) {
    return 'ending_loop';
  }

  return null;
}

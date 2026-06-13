import { writable, derived, get } from 'svelte/store';
import type {
  SubmarineSystem,
  SystemDamageState,
  HullDamageState,
  DamageEffect,
  RepairEffect,
  DamageAlert,
  ChannelDegradation,
  SystemAlertSeverity
} from '../types/game';
import { SUBMARINE_SYSTEM_LABELS } from '../types/game';

const SYSTEMS: SubmarineSystem[] = ['hull', 'camera', 'communication', 'sonar', 'control', 'power'];

function createInitialSystems(): Record<SubmarineSystem, SystemDamageState> {
  const result = {} as Record<SubmarineSystem, SystemDamageState>;
  const now = Date.now();
  for (const sys of SYSTEMS) {
    result[sys] = { damage: 0, targetDamage: 0, lastUpdate: now };
  }
  return result;
}

export const hullDamage = writable<HullDamageState>({
  systems: createInitialSystems(),
  alerts: [],
  alertIdCounter: 0
});

let damageTimer: number | null = null;

export function initHullDamage(): void {
  if (damageTimer !== null) return;
  damageTimer = window.setInterval(() => {
    hullDamage.update(state => {
      const now = Date.now();
      let changed = false;
      const newSystems = { ...state.systems };
      for (const sys of SYSTEMS) {
        const s = newSystems[sys];
        const dt = (now - s.lastUpdate) / 1000;
        const approachSpeed = 0.4;
        let newDamage = s.damage + (s.targetDamage - s.damage) * approachSpeed * dt;
        const fluctuation = Math.sin(now / 1200 + SYSTEMS.indexOf(sys)) * 2 + (Math.random() - 0.5) * 3;
        newDamage += fluctuation * (s.targetDamage / 100) * 0.3;
        newDamage = Math.max(0, Math.min(100, newDamage));
        if (Math.abs(newDamage - s.damage) > 0.01) {
          changed = true;
        }
        newSystems[sys] = { ...s, damage: newDamage, lastUpdate: now };
      }
      if (!changed) return state;
      return { ...state, systems: newSystems };
    });
  }, 100);
}

export function destroyHullDamage(): void {
  if (damageTimer !== null) {
    clearInterval(damageTimer);
    damageTimer = null;
  }
}

function getDamageSeverity(target: number): SystemAlertSeverity {
  if (target >= 90) return 'offline';
  if (target >= 60) return 'critical';
  if (target >= 30) return 'warning';
  return 'recovering';
}

function getRepairSeverity(target: number, before: number): SystemAlertSeverity {
  if (target <= 0) return 'repaired';
  if (target < before - 25) return 'repaired';
  return 'recovering';
}

export function applyDamage(effect: DamageEffect): void {
  hullDamage.update(state => {
    const sys = state.systems[effect.system];
    const beforeTarget = sys.targetDamage;
    const newTarget = Math.min(100, sys.targetDamage + effect.damage);
    const severity: SystemAlertSeverity = getDamageSeverity(newTarget);
    const alert: DamageAlert = {
      system: effect.system,
      message: effect.message || `${SUBMARINE_SYSTEM_LABELS[effect.system]}受损`,
      timestamp: Date.now(),
      severity,
      id: `dmg_${state.alertIdCounter}`,
      kind: 'damage',
      damageBefore: beforeTarget,
      damageAfter: newTarget
    };
    return {
      systems: {
        ...state.systems,
        [effect.system]: { ...sys, targetDamage: newTarget }
      },
      alerts: [...state.alerts, alert],
      alertIdCounter: state.alertIdCounter + 1
    };
  });
}

export function applyRepair(effect: RepairEffect): void {
  hullDamage.update(state => {
    const sys = state.systems[effect.system];
    const beforeTarget = sys.targetDamage;
    const newTarget = Math.max(0, sys.targetDamage - effect.amount);
    const severity: SystemAlertSeverity = getRepairSeverity(newTarget, beforeTarget);
    const alert: DamageAlert = {
      system: effect.system,
      message: effect.message || (newTarget <= 0
        ? `${SUBMARINE_SYSTEM_LABELS[effect.system]}修复完成`
        : `${SUBMARINE_SYSTEM_LABELS[effect.system]}正在修复`),
      timestamp: Date.now(),
      severity,
      id: `rep_${state.alertIdCounter}`,
      kind: 'repair',
      damageBefore: beforeTarget,
      damageAfter: newTarget
    };
    return {
      systems: {
        ...state.systems,
        [effect.system]: { ...sys, targetDamage: newTarget }
      },
      alerts: [...state.alerts, alert],
      alertIdCounter: state.alertIdCounter + 1
    };
  });
}

export function applyDamageEffects(effects: DamageEffect[] | undefined): void {
  if (!effects) return;
  effects.forEach(e => applyDamage(e));
}

export function applyRepairEffects(effects: RepairEffect[] | undefined): void {
  if (!effects) return;
  effects.forEach(e => applyRepair(e));
}

export function dismissAlert(alertId: string): void {
  hullDamage.update(state => ({
    ...state,
    alerts: state.alerts.filter(a => a.id !== alertId)
  }));
}

export function clearAlerts(): void {
  hullDamage.update(state => ({ ...state, alerts: [] }));
}

export function resetHullDamage(): void {
  hullDamage.set({
    systems: createInitialSystems(),
    alerts: [],
    alertIdCounter: 0
  });
}

export function getSystemDamage(system: SubmarineSystem): number {
  return get(hullDamage).systems[system].damage;
}

export function getSystemTargetDamage(system: SubmarineSystem): number {
  return get(hullDamage).systems[system].targetDamage;
}

export function getChannelDegradation(): ChannelDegradation {
  const state = get(hullDamage);
  const s = state.systems;

  const visual = Math.max(s.hull.damage, s.camera.damage) * 0.9;
  const communication = s.communication.damage * 0.95;
  const audio = s.sonar.damage * 0.9;
  const control = s.control.damage * 0.85;
  const power = s.power.damage * 0.95;

  const combined =
    visual * 0.25 +
    communication * 0.2 +
    audio * 0.2 +
    control * 0.15 +
    power * 0.2;

  return {
    visual: Math.min(100, visual),
    communication: Math.min(100, communication),
    audio: Math.min(100, audio),
    control: Math.min(100, control),
    power: Math.min(100, power),
    combined: Math.min(100, combined)
  };
}

export function getOverallIntegrity(): number {
  const state = get(hullDamage);
  let total = 0;
  for (const sys of SYSTEMS) {
    total += state.systems[sys].damage;
  }
  return Math.max(0, 100 - total / SYSTEMS.length);
}

export const channelDegradation = derived(hullDamage, ($state) => {
  const s = $state.systems;
  const visual = Math.max(s.hull.damage, s.camera.damage) * 0.9;
  const communication = s.communication.damage * 0.95;
  const audio = s.sonar.damage * 0.9;
  const control = s.control.damage * 0.85;
  const power = s.power.damage * 0.95;
  const combined = visual * 0.25 + communication * 0.2 + audio * 0.2 + control * 0.15 + power * 0.2;
  return {
    visual: Math.min(100, visual),
    communication: Math.min(100, communication),
    audio: Math.min(100, audio),
    control: Math.min(100, control),
    power: Math.min(100, power),
    combined: Math.min(100, combined)
  };
});

export const overallIntegrity = derived(hullDamage, ($state) => {
  let total = 0;
  for (const sys of SYSTEMS) {
    total += $state.systems[sys].damage;
  }
  return Math.max(0, 100 - total / SYSTEMS.length);
});

export const activeAlerts = derived(hullDamage, ($state) => {
  const now = Date.now();
  return $state.alerts.filter(a => now - a.timestamp < 8000);
});

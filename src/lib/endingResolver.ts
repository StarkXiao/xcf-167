export interface EndingJudgmentInfo {
  locked?: string;
  weights?: { endingId: string; weight: number; probability: number }[];
  selected?: string;
  via?: string;
}

export type AddEndingModifierFn = (endingId: string, value: number, source: string) => void;
export type GetLockedEndingFn = (candidates: string[]) => string | null;
export type SelectWeightedEndingFn = (candidates: string[]) => string | null;
export type GetAllEndingWeightsFn = () => { endingId: string; weight: number; probability: number }[];
export type ApplyTrustEndingWeightsFn = (addModifier: AddEndingModifierFn) => void;

export interface EndingResolverDeps {
  addModifier: AddEndingModifierFn;
  applyTrustEndingWeights: ApplyTrustEndingWeightsFn;
  getLockedEnding: GetLockedEndingFn;
  selectWeightedEnding: SelectWeightedEndingFn;
  getAllEndingWeights: GetAllEndingWeightsFn;
}

export const choiceWeightMap: Record<string, Record<string, Record<string, number>>> = {
  intro_2: {
    c_fast: { ending_truth: -10, ending_loop: 10 },
    c_normal: { ending_truth: 10, ending_survival: 5 }
  },
  first_contact: {
    c_stay: { ending_survival: 10, ending_truth: 5 },
    c_danmaku: { ending_truth: 15, ending_madness: 5 },
    c_creature: { ending_truth: 20, ending_madness: 10, ending_silence: 5 }
  },
  critical_choice: {
    c_keep_live: { ending_truth: 25, ending_madness: 15, ending_silence: 10 },
    c_keep_live_2: { ending_truth: 20, ending_madness: 10 },
    c_stop_live: { ending_survival: 25, ending_loop: 10 },
    c_emergency: { ending_survival: 15, ending_silence: 20, ending_truth: 5 }
  },
  stop_continue: {
    c_trust_su: { ending_survival: 30, ending_silence: -10 },
    c_doubt: { ending_loop: 30, ending_truth: 10, ending_madness: 10 }
  }
};

export const endingRedirectMap: Record<string, { candidates: string[]; nodeMap: Record<string, string> }> = {
  ending_resolve_live: {
    candidates: ['ending_truth', 'ending_madness'],
    nodeMap: {
      ending_truth: 'ending_truth_node',
      ending_madness: 'ending_madness_node'
    }
  },
  ending_resolve_ascent: {
    candidates: ['ending_survival', 'ending_silence', 'ending_truth'],
    nodeMap: {
      ending_survival: 'ending_survival_ascent',
      ending_silence: 'ending_silence',
      ending_truth: 'ending_truth_ascent'
    }
  },
  ending_resolve_stop: {
    candidates: ['ending_survival', 'ending_loop', 'ending_madness'],
    nodeMap: {
      ending_survival: 'ending_survival_stop',
      ending_loop: 'ending_loop_stop',
      ending_madness: 'ending_madness_stop'
    }
  }
};

export function applyChoiceWeight(
  nodeId: string,
  choiceId: string,
  addModifier: AddEndingModifierFn
): void {
  const modifiers = choiceWeightMap[nodeId]?.[choiceId];
  if (modifiers) {
    Object.entries(modifiers).forEach(([endingId, value]) => {
      addModifier(endingId, value, `choice:${nodeId}:${choiceId}`);
    });
  }
}

export function resolveEndingRedirect(
  currentNodeId: string,
  nextNodeId: string,
  deps: EndingResolverDeps
): string {
  const config = endingRedirectMap[currentNodeId];
  if (!config) return nextNodeId;

  deps.applyTrustEndingWeights(deps.addModifier);

  const locked = deps.getLockedEnding(config.candidates);
  if (locked) {
    return config.nodeMap[locked] || nextNodeId;
  }

  const weightedEnding = deps.selectWeightedEnding(config.candidates);
  if (weightedEnding) {
    return config.nodeMap[weightedEnding] || nextNodeId;
  }

  return nextNodeId;
}

export function buildJudgmentInfo(
  redirected: string,
  nextNodeId: string,
  currentNodeId: string,
  allWeights: { endingId: string; weight: number; probability: number }[],
  getLockedEnding: GetLockedEndingFn
): EndingJudgmentInfo | null {
  if (redirected === nextNodeId) return null;

  const eConfig = endingRedirectMap[currentNodeId];
  if (!eConfig) return null;

  const locked = getLockedEnding(eConfig.candidates);

  const info: EndingJudgmentInfo = {
    weights: allWeights.filter(w => eConfig.candidates.includes(w.endingId)),
    selected: Object.entries(eConfig.nodeMap).find(([, v]) => v === redirected)?.[0] || redirected,
    via: 'weighted'
  };

  if (locked) {
    info.locked = locked;
    info.via = 'locked';
  }

  return info;
}

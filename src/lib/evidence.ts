import { writable, derived, get } from 'svelte/store';
import type {
  EvidenceCard,
  EvidenceSlot,
  EvidenceBoardState,
  DragState,
  EvidenceHistory,
  EndingWeight,
  EvidenceStatus
} from '../types/game';
import {
  evidenceCards,
  evidenceSlots,
  deductionRules,
  baseEndingWeights
} from '../data/evidence';
import { setVariable } from './store';

function createInitialEndingWeights(): EndingWeight[] {
  return Object.entries(baseEndingWeights).map(([endingId, baseWeight]) => ({
    endingId,
    weight: baseWeight,
    baseWeight,
    modifiers: []
  }));
}

function createInitialEvidenceBoardState(): EvidenceBoardState {
  return {
    collectedEvidence: [],
    slots: JSON.parse(JSON.stringify(evidenceSlots)),
    placedEvidence: new Map(),
    unlockedRules: [],
    completedRules: [],
    history: [],
    mistakeCount: 0,
    maxMistakes: 5,
    endingWeights: createInitialEndingWeights(),
    isBoardOpen: false,
    canOpenBoard: false
  };
}

export const evidenceBoard = writable<EvidenceBoardState>(createInitialEvidenceBoardState());

export const dragState = writable<DragState>({
  isDragging: false,
  evidenceId: null,
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0
});

export const availableEvidence = derived(evidenceBoard, $board => {
  return $board.collectedEvidence.filter(e => e.status === 'collected');
});

export const placedEvidenceCards = derived(evidenceBoard, $board => {
  const result: { slot: EvidenceSlot; evidence: EvidenceCard | null }[] = [];
  for (const slot of $board.slots) {
    const evidenceId = $board.placedEvidence.get(slot.id);
    const evidence = evidenceId
      ? $board.collectedEvidence.find(e => e.id === evidenceId) || null
      : null;
    result.push({ slot, evidence });
  }
  return result;
});

export const availableRules = derived(evidenceBoard, $board => {
  return deductionRules.filter(rule => {
    if ($board.completedRules.includes(rule.id)) return false;
    const allSlotsFilled = rule.requiredSlots.every(slotId => {
      const evidenceId = $board.placedEvidence.get(slotId);
      return evidenceId !== undefined;
    });
    return allSlotsFilled;
  });
});

export const predictedEnding = derived(evidenceBoard, $board => {
  const weights = [...$board.endingWeights].sort((a, b) => b.weight - a.weight);
  const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w.weight), 0);
  if (totalWeight <= 0) return null;
  return {
    topEnding: weights[0],
    allWeights: weights.map(w => ({
      ...w,
      probability: Math.max(0, w.weight) / totalWeight
    }))
  };
});

export function collectEvidence(evidenceId: string): void {
  evidenceBoard.update(state => {
    if (state.collectedEvidence.some(e => e.id === evidenceId)) return state;
    const template = evidenceCards.find(e => e.id === evidenceId);
    if (!template) return state;
    const newCard: EvidenceCard = {
      ...template,
      status: 'collected',
      collectedAt: Date.now()
    };
    return {
      ...state,
      collectedEvidence: [...state.collectedEvidence, newCard]
    };
  });
}

export function collectEvidenceByNode(nodeId: string): void {
  const cardsForNode = evidenceCards.filter(e => e.sourceNodeId === nodeId);
  cardsForNode.forEach(card => collectEvidence(card.id));
}

export function collectAllEvidence(): void {
  evidenceCards.forEach(card => collectEvidence(card.id));
}

export function updateEvidenceStatus(evidenceId: string, status: EvidenceStatus): void {
  evidenceBoard.update(state => ({
    ...state,
    collectedEvidence: state.collectedEvidence.map(e =>
      e.id === evidenceId ? { ...e, status } : e
    )
  }));
}

export function placeEvidence(slotId: string, evidenceId: string): boolean {
  const state = get(evidenceBoard);
  const slot = state.slots.find(s => s.id === slotId);
  const evidence = state.collectedEvidence.find(e => e.id === evidenceId);
  if (!slot || !evidence) return false;

  if (state.placedEvidence.has(slotId)) {
    const oldEvidenceId = state.placedEvidence.get(slotId);
    if (oldEvidenceId) {
      updateEvidenceStatus(oldEvidenceId, 'collected');
    }
  }

  const currentSlotForEvidence = [...state.placedEvidence.entries()]
    .find(([, eid]) => eid === evidenceId)?.[0];
  if (currentSlotForEvidence) {
    evidenceBoard.update(s => {
      const newMap = new Map(s.placedEvidence);
      newMap.delete(currentSlotForEvidence);
      return { ...s, placedEvidence: newMap };
    });
  }

  evidenceBoard.update(s => {
    const newMap = new Map(s.placedEvidence);
    newMap.set(slotId, evidenceId);
    return { ...s, placedEvidence: newMap };
  });

  updateEvidenceStatus(evidenceId, 'placed');
  return true;
}

export function removeEvidenceFromSlot(slotId: string): void {
  const state = get(evidenceBoard);
  const evidenceId = state.placedEvidence.get(slotId);
  if (!evidenceId) return;

  evidenceBoard.update(s => {
    const newMap = new Map(s.placedEvidence);
    newMap.delete(slotId);
    return { ...s, placedEvidence: newMap };
  });

  updateEvidenceStatus(evidenceId, 'collected');
}

export function clearAllSlots(): void {
  const state = get(evidenceBoard);
  state.placedEvidence.forEach((evidenceId) => {
    updateEvidenceStatus(evidenceId, 'collected');
  });
  evidenceBoard.update(s => ({
    ...s,
    placedEvidence: new Map()
  }));
}

export function checkTagsMatch(evidence: EvidenceCard, slot: EvidenceSlot): boolean {
  if (!slot.requiredTags || slot.requiredTags.length === 0) return true;
  return slot.requiredTags.some(tag => evidence.tags.includes(tag));
}

export function attemptDeduction(ruleId: string): { success: boolean; feedback: string } {
  const state = get(evidenceBoard);
  const rule = deductionRules.find(r => r.id === ruleId);
  if (!rule) return { success: false, feedback: '推理规则不存在' };

  const isCorrect = rule.requiredEvidence.every(({ slotId, evidenceId }) => {
    const placedId = state.placedEvidence.get(slotId);
    return placedId === evidenceId;
  });

  const historyEntry: EvidenceHistory = {
    ruleId,
    evidenceIds: rule.requiredSlots.map(slotId => state.placedEvidence.get(slotId) || '').filter(Boolean),
    isCorrect,
    timestamp: Date.now(),
    feedback: rule.outcome.feedback
  };

  evidenceBoard.update(s => {
    let newMistakeCount = s.mistakeCount;
    let newEndingWeights = s.endingWeights;
    let newCompletedRules = s.completedRules;
    let newUnlockedRules = s.unlockedRules;

    if (isCorrect) {
      if (!newCompletedRules.includes(ruleId)) {
        newCompletedRules = [...newCompletedRules, ruleId];
      }
      if (rule.outcome.endingWeights) {
        newEndingWeights = s.endingWeights.map(ew => {
          const modifier = rule.outcome.endingWeights![ew.endingId];
          if (modifier === undefined) return ew;
          return {
            ...ew,
            weight: ew.weight + modifier,
            modifiers: [...ew.modifiers, { source: ruleId, value: modifier }]
          };
        });
      }
    } else {
      newMistakeCount = s.mistakeCount + 1;
    }

    return {
      ...s,
      history: [...s.history, historyEntry],
      mistakeCount: newMistakeCount,
      completedRules: newCompletedRules,
      unlockedRules: newUnlockedRules,
      endingWeights: newEndingWeights
    };
  });

  if (isCorrect) {
    rule.requiredSlots.forEach(slotId => {
      const evidenceId = state.placedEvidence.get(slotId);
      if (evidenceId) updateEvidenceStatus(evidenceId, 'used');
    });
    if (rule.outcome.clueUnlocked) {
      setVariable(rule.outcome.clueUnlocked, true);
    }
    return { success: true, feedback: rule.outcome.feedback };
  } else {
    return {
      success: false,
      feedback: '这个推理组合似乎不太对...再想想证据之间的关联。'
    };
  }
}

export function rollbackLastDeduction(): boolean {
  const state = get(evidenceBoard);
  if (state.history.length === 0) return false;

  const lastEntry = state.history[state.history.length - 1];
  const rule = deductionRules.find(r => r.id === lastEntry.ruleId);

  evidenceBoard.update(s => {
    let newEndingWeights = s.endingWeights;
    let newCompletedRules = s.completedRules;
    let newMistakeCount = s.mistakeCount;

    if (lastEntry.isCorrect && rule?.outcome.endingWeights) {
      newEndingWeights = s.endingWeights.map(ew => ({
        ...ew,
        modifiers: ew.modifiers.filter(m => m.source !== rule.id),
        weight: ew.weight - (rule.outcome.endingWeights![ew.endingId] || 0)
      }));
      newCompletedRules = s.completedRules.filter(id => id !== rule.id);
    } else if (!lastEntry.isCorrect) {
      newMistakeCount = Math.max(0, s.mistakeCount - 1);
    }

    return {
      ...s,
      history: s.history.slice(0, -1),
      mistakeCount: newMistakeCount,
      completedRules: newCompletedRules,
      endingWeights: newEndingWeights
    };
  });

  return true;
}

export function openEvidenceBoard(): void {
  evidenceBoard.update(s => ({ ...s, isBoardOpen: true }));
}

export function closeEvidenceBoard(): void {
  evidenceBoard.update(s => ({ ...s, isBoardOpen: false }));
}

export function toggleEvidenceBoard(): void {
  evidenceBoard.update(s => ({ ...s, isBoardOpen: !s.isBoardOpen }));
}

export function setCanOpenBoard(can: boolean): void {
  evidenceBoard.update(s => ({ ...s, canOpenBoard: can }));
}

export function resetEvidenceBoard(): void {
  evidenceBoard.set(createInitialEvidenceBoardState());
}

export function startDrag(evidenceId: string, x: number, y: number): void {
  dragState.set({
    isDragging: true,
    evidenceId,
    startX: x,
    startY: y,
    currentX: x,
    currentY: y
  });
}

export function updateDragPosition(x: number, y: number): void {
  dragState.update(s => ({
    ...s,
    currentX: x,
    currentY: y
  }));
}

export function endDrag(): void {
  dragState.set({
    isDragging: false,
    evidenceId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0
  });
}

export function getRuleById(ruleId: string) {
  return deductionRules.find(r => r.id === ruleId);
}

export function getAllRules() {
  return deductionRules;
}

export function getPredictedEnding(): string | null {
  const state = get(evidenceBoard);
  const weights = [...state.endingWeights].sort((a, b) => b.weight - a.weight);
  const totalWeight = weights.reduce((sum, w) => sum + Math.max(0, w.weight), 0);
  if (totalWeight <= 0) return null;
  return weights[0].endingId;
}

export function getEndingWeight(endingId: string): number {
  const state = get(evidenceBoard);
  const ew = state.endingWeights.find(w => w.endingId === endingId);
  return ew ? ew.weight : 0;
}

export function getAllEndingWeights(): { endingId: string; weight: number; probability: number }[] {
  const state = get(evidenceBoard);
  const totalWeight = state.endingWeights.reduce((sum, w) => sum + Math.max(0, w.weight), 0);
  if (totalWeight <= 0) {
    return state.endingWeights.map(w => ({
      endingId: w.endingId,
      weight: w.weight,
      probability: 1 / state.endingWeights.length
    }));
  }
  return state.endingWeights
    .map(w => ({
      endingId: w.endingId,
      weight: w.weight,
      probability: Math.max(0, w.weight) / totalWeight
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function selectWeightedEnding(candidateEndingIds?: string[]): string | null {
  const allWeights = getAllEndingWeights();
  let candidates = allWeights;
  if (candidateEndingIds && candidateEndingIds.length > 0) {
    candidates = allWeights.filter(w => candidateEndingIds.includes(w.endingId));
  }
  if (candidates.length === 0) return null;

  const totalProb = candidates.reduce((sum, c) => sum + c.probability, 0);
  if (totalProb <= 0) {
    return candidates[0].endingId;
  }

  let roll = Math.random() * totalProb;
  for (const candidate of candidates) {
    roll -= candidate.probability;
    if (roll <= 0) {
      return candidate.endingId;
    }
  }
  return candidates[candidates.length - 1].endingId;
}

export function addEndingWeightModifier(endingId: string, modifier: number, source: string): void {
  evidenceBoard.update(state => ({
    ...state,
    endingWeights: state.endingWeights.map(ew => {
      if (ew.endingId !== endingId) return ew;
      return {
        ...ew,
        weight: ew.weight + modifier,
        modifiers: [...ew.modifiers, { source, value: modifier }]
      };
    })
  }));
}

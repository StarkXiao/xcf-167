import { writable, derived, get } from 'svelte/store';
import type {
  CaseId,
  CaseState,
  CaseLinkageState,
  CrossCaseClue,
  SharedVariable,
  MainStoryBeat,
  CaseTransition
} from '../types/caseLinkage';
import { caseDefinitions, crossCaseClues, mainStoryBeats, caseTransitions } from '../data/caseLinkage';
import {
  gameState,
  setCurrentNode,
  setVariable,
  resetGameState,
  getVariable
} from './store';
import {
  unlockClue,
  isClueUnlocked,
  currentPlaythrough,
  recordPlaythrough
} from './memory';
import { checkCondition } from './engine';

const createInitialCaseState = (caseId: CaseId): CaseState => ({
  caseId,
  status: caseDefinitions[caseId]?.status || 'locked',
  currentNodeId: caseDefinitions[caseId]?.startNodeId || '',
  dialogueIndex: 0,
  variables: {},
  unlockedEndings: [],
  visitedNodes: [],
  cluesUnlocked: [],
  evidenceCollected: [],
  choicesMade: [],
  playthroughCount: 0
});

const createInitialState = (): CaseLinkageState => {
  const cases: Record<CaseId, CaseState> = {} as Record<CaseId, CaseState>;
  const crossClues: Record<string, CrossCaseClue> = {};
  const sharedVars: Record<string, SharedVariable> = {};

  Object.keys(caseDefinitions).forEach(id => {
    cases[id as CaseId] = createInitialCaseState(id as CaseId);
  });

  crossCaseClues.forEach(clue => {
    crossClues[clue.id] = clue;
  });

  return {
    activeCaseId: null,
    cases,
    sharedVariables: sharedVars,
    crossCaseClues: crossClues,
    mainStoryBeats: [...mainStoryBeats],
    currentMainStoryBeatIndex: 0,
    isCaseSelectionOpen: false,
    isClueBoardOpen: false,
    isMainStoryRevealOpen: false,
    allCasesCompleted: false,
    mainStoryCompleted: false,
    totalCluesCollected: 0,
    totalEvidenceCollected: 0
  };
};

export const caseLinkageState = writable<CaseLinkageState>(createInitialState());

export const availableCases = derived(caseLinkageState, $state => {
  return Object.values($state.cases)
    .filter(c => c.status !== 'locked' && c.status !== 'hidden')
    .sort((a, b) => {
      const defA = caseDefinitions[a.caseId];
      const defB = caseDefinitions[b.caseId];
      return (defA?.order || 0) - (defB?.order || 0);
    });
});

export const unlockedCrossCaseClues = derived(caseLinkageState, $state => {
  return Object.values($state.crossCaseClues).filter(clue =>
    clue.sourceCaseId ? isCaseClueUnlocked(clue.sourceCaseId, clue.id) : false
  );
});

export const unlockedMainStoryBeats = derived(caseLinkageState, $state => {
  return $state.mainStoryBeats.filter(beat => beat.isUnlocked);
});

export const activeCaseDefinition = derived(caseLinkageState, $state => {
  return $state.activeCaseId ? caseDefinitions[$state.activeCaseId] : null;
});

export function isCaseClueUnlocked(caseId: CaseId, clueId: string): boolean {
  const state = get(caseLinkageState);
  return state.cases[caseId]?.cluesUnlocked.includes(clueId) || isClueUnlocked(clueId);
}

export function checkCaseUnlockCondition(caseId: CaseId): boolean {
  const def = caseDefinitions[caseId];
  if (!def) return false;

  const condition = def.unlockCondition;
  const state = get(caseLinkageState);
  const playthroughCount = get(currentPlaythrough);

  if (condition.requiredPlaythroughAtLeast && playthroughCount < condition.requiredPlaythroughAtLeast) {
    return false;
  }

  if (condition.requiredCaseCompletion) {
    for (const requiredCaseId of condition.requiredCaseCompletion) {
      const caseState = state.cases[requiredCaseId];
      if (!caseState || caseState.status !== 'completed') {
        return false;
      }
    }
  }

  if (condition.requiredClues) {
    for (const clueId of condition.requiredClues) {
      if (!isClueUnlocked(clueId)) {
        return false;
      }
    }
  }

  return true;
}

export function unlockCaseIfEligible(caseId: CaseId): boolean {
  if (checkCaseUnlockCondition(caseId)) {
    caseLinkageState.update(state => ({
      ...state,
      cases: {
        ...state.cases,
        [caseId]: {
          ...state.cases[caseId],
          status: 'available'
        }
      }
    }));
    return true;
  }
  return false;
}

export function setSharedVariable(
  key: string,
  value: string | number | boolean,
  sourceCaseId: CaseId,
  description: string,
  affectsCases: CaseId[],
  isPersistent: boolean = true
): void {
  const sharedVar: SharedVariable = {
    key,
    value,
    sourceCaseId,
    description,
    affectsCases,
    isPersistent,
    lastUpdatedAt: Date.now()
  };

  caseLinkageState.update(state => ({
    ...state,
    sharedVariables: {
      ...state.sharedVariables,
      [key]: sharedVar
    }
  }));

  setVariable(key, value);
}

export function getSharedVariable(key: string): SharedVariable | undefined {
  return get(caseLinkageState).sharedVariables[key];
}

export function carryOverSharedVariables(toCaseId: CaseId, variableKeys: string[]): void {
  const state = get(caseLinkageState);
  variableKeys.forEach(key => {
    const sharedVar = state.sharedVariables[key];
    if (sharedVar && sharedVar.affectsCases.includes(toCaseId)) {
      setVariable(key, sharedVar.value);
    }
  });
}

export function unlockCrossCaseClue(clueId: string, sourceCaseId: CaseId): void {
  const clue = crossCaseClues.find(c => c.id === clueId);
  if (!clue) return;

  unlockClue(clueId);

  caseLinkageState.update(state => {
    const caseState = state.cases[sourceCaseId];
    if (!caseState) return state;

    const newCluesUnlocked = caseState.cluesUnlocked.includes(clueId)
      ? caseState.cluesUnlocked
      : [...caseState.cluesUnlocked, clueId];

    return {
      ...state,
      cases: {
        ...state.cases,
        [sourceCaseId]: {
          ...caseState,
          cluesUnlocked: newCluesUnlocked
        }
      },
      totalCluesCollected: state.totalCluesCollected + 1
    };
  });

  checkAndUnlockMainStoryBeat();
  checkAndUnlockRelatedCases();
}

export function checkAndUnlockMainStoryBeat(): void {
  caseLinkageState.update(state => {
    const newBeats = state.mainStoryBeats.map(beat => {
      if (beat.isUnlocked) return beat;

      const allCluesUnlocked = beat.requiredClues.every(clueId => isClueUnlocked(clueId));
      const allCasesCompleted = beat.requiredCases.every(caseId =>
        state.cases[caseId]?.status === 'completed'
      );

      if (allCluesUnlocked && allCasesCompleted) {
        return {
          ...beat,
          isUnlocked: true,
          unlockedAt: Date.now()
        };
      }
      return beat;
    });

    const newIndex = newBeats.filter(b => b.isUnlocked).length - 1;
    const allBeatsUnlocked = newBeats.every(b => b.isUnlocked);

    return {
      ...state,
      mainStoryBeats: newBeats,
      currentMainStoryBeatIndex: Math.max(0, newIndex),
      mainStoryCompleted: allBeatsUnlocked
    };
  });
}

export function checkAndUnlockRelatedCases(): void {
  Object.keys(caseDefinitions).forEach(caseId => {
    unlockCaseIfEligible(caseId as CaseId);
  });
}

export function switchToCase(caseId: CaseId): void {
  const state = get(caseLinkageState);
  const caseState = state.cases[caseId];
  const def = caseDefinitions[caseId];

  if (!caseState || !def) return;
  if (caseState.status === 'locked' || caseState.status === 'hidden') return;

  if (state.activeCaseId) {
    saveCurrentCaseState();
  }

  resetGameState();

  gameState.update(gs => ({
    ...gs,
    currentNodeId: caseState.currentNodeId || def.startNodeId,
    dialogueIndex: caseState.dialogueIndex,
    variables: { ...caseState.variables }
  }));

  Object.entries(state.sharedVariables).forEach(([key, sharedVar]) => {
    if (sharedVar.affectsCases.includes(caseId)) {
      setVariable(key, sharedVar.value);
    }
  });

  caseLinkageState.update(s => ({
    ...s,
    activeCaseId: caseId,
    cases: {
      ...s.cases,
      [caseId]: {
        ...s.cases[caseId],
        status: 'in_progress'
      }
    },
    isCaseSelectionOpen: false
  }));
}

export function saveCurrentCaseState(): void {
  const state = get(caseLinkageState);
  const activeCaseId = state.activeCaseId;
  if (!activeCaseId) return;

  const gs = get(gameState);
  const def = caseDefinitions[activeCaseId];

  const sharedVarUpdates: Record<string, SharedVariable> = {};
  Object.entries(gs.variables).forEach(([key, value]) => {
    if (key.startsWith('shared_') && def) {
      if (!state.sharedVariables[key] || state.sharedVariables[key].value !== value) {
        sharedVarUpdates[key] = {
          key,
          value,
          sourceCaseId: activeCaseId,
          description: `从 ${def.title} 设置的共享变量`,
          affectsCases: def.relatedCaseIds,
          isPersistent: true,
          lastUpdatedAt: Date.now()
        };
      }
    }
  });

  caseLinkageState.update(s => ({
    ...s,
    sharedVariables: {
      ...s.sharedVariables,
      ...sharedVarUpdates
    },
    cases: {
      ...s.cases,
      [activeCaseId]: {
        ...s.cases[activeCaseId],
        currentNodeId: gs.currentNodeId,
        dialogueIndex: gs.dialogueIndex,
        variables: { ...gs.variables },
        visitedNodes: Array.from(new Set([...s.cases[activeCaseId].visitedNodes, gs.currentNodeId]))
      }
    }
  }));
}

export function completeCase(caseId: CaseId, endingId: string): void {
  const def = caseDefinitions[caseId];
  if (!def) return;

  const clState = get(caseLinkageState);
  const currentCaseState = clState.cases[caseId];
  
  recordPlaythrough({
    endingId,
    cluesUnlocked: currentCaseState?.cluesUnlocked || [],
    evidenceCollected: currentCaseState?.evidenceCollected || [],
    nodesVisited: currentCaseState?.visitedNodes || [],
    choicesMade: currentCaseState?.choicesMade || [],
    mistakeCount: 0,
    pathTaken: caseId
  });

  caseLinkageState.update(state => {
    const caseState = state.cases[caseId];
    const newUnlockedEndings = caseState.unlockedEndings.includes(endingId)
      ? caseState.unlockedEndings
      : [...caseState.unlockedEndings, endingId];

    const allEndingsUnlocked = def.endNodeIds.every(eid =>
      newUnlockedEndings.includes(eid)
    );

    const allCasesCompleted = Object.values(state.cases).every(cs =>
      cs.caseId === caseId || cs.status === 'completed'
    );

    return {
      ...state,
      cases: {
        ...state.cases,
        [caseId]: {
          ...caseState,
          status: 'completed',
          unlockedEndings: newUnlockedEndings,
          playthroughCount: caseState.playthroughCount + 1,
          completedAt: Date.now(),
          bestEndingId: allEndingsUnlocked ? endingId : caseState.bestEndingId
        }
      },
      allCasesCompleted,
      activeCaseId: null
    };
  });

  checkCaseTransition(caseId, endingId);
  checkAndUnlockMainStoryBeat();
  checkAndUnlockRelatedCases();
}

export function checkCaseTransition(fromCaseId: CaseId, endingId: string): CaseTransition | null {
  const transition = caseTransitions.find(
    t => t.fromCaseId === fromCaseId && t.triggerNodeId === endingId
  );

  if (transition && transition.autoTransition) {
    carryOverSharedVariables(transition.toCaseId, transition.carryOverVariables);
    transition.carryOverClues.forEach(clueId => {
      if (!isClueUnlocked(clueId)) {
        unlockClue(clueId);
      }
    });
  }

  return transition || null;
}

export function recordCaseChoice(caseId: CaseId, nodeId: string, choiceId: string): void {
  caseLinkageState.update(state => ({
    ...state,
    cases: {
      ...state.cases,
      [caseId]: {
        ...state.cases[caseId],
        choicesMade: [...state.cases[caseId].choicesMade, { nodeId, choiceId }]
      }
    }
  }));
}

export function recordCaseEvidence(caseId: CaseId, evidenceId: string): void {
  caseLinkageState.update(state => {
    const caseState = state.cases[caseId];
    if (!caseState || caseState.evidenceCollected.includes(evidenceId)) return state;

    return {
      ...state,
      cases: {
        ...state.cases,
        [caseId]: {
          ...caseState,
          evidenceCollected: [...caseState.evidenceCollected, evidenceId]
        }
      },
      totalEvidenceCollected: state.totalEvidenceCollected + 1
    };
  });
}

export function openCaseSelection(): void {
  saveCurrentCaseState();
  caseLinkageState.update(state => ({
    ...state,
    isCaseSelectionOpen: true
  }));
}

export function closeCaseSelection(): void {
  caseLinkageState.update(state => ({
    ...state,
    isCaseSelectionOpen: false
  }));
}

export function openClueBoard(): void {
  caseLinkageState.update(state => ({
    ...state,
    isClueBoardOpen: true
  }));
}

export function closeClueBoard(): void {
  caseLinkageState.update(state => ({
    ...state,
    isClueBoardOpen: false
  }));
}

export function openMainStoryReveal(): void {
  caseLinkageState.update(state => ({
    ...state,
    isMainStoryRevealOpen: true
  }));
}

export function closeMainStoryReveal(): void {
  caseLinkageState.update(state => ({
    ...state,
    isMainStoryRevealOpen: false
  }));
}

export function resetCaseLinkage(): void {
  caseLinkageState.set(createInitialState());
}

export function getCaseProgress(caseId: CaseId): number {
  const state = get(caseLinkageState);
  const caseState = state.cases[caseId];
  const def = caseDefinitions[caseId];

  if (!caseState || !def) return 0;
  if (caseState.status === 'locked') return 0;
  if (caseState.status === 'completed') return 100;

  const totalNodes = def.nodes.length;
  const visitedNodes = caseState.visitedNodes.length;
  return Math.round((visitedNodes / totalNodes) * 100);
}

export function getOverallProgress(): number {
  const state = get(caseLinkageState);
  const available = Object.values(state.cases).filter(c => c.status !== 'locked' && c.status !== 'hidden');
  if (available.length === 0) return 0;

  const totalProgress = available.reduce((sum, c) => sum + getCaseProgress(c.caseId), 0);
  return Math.round(totalProgress / available.length);
}

export function getRelatedCluesForCase(caseId: CaseId): CrossCaseClue[] {
  return crossCaseClues.filter(clue =>
    clue.relatedCaseIds.includes(caseId) && isCaseClueUnlocked(clue.sourceCaseId, clue.id)
  );
}

export function getCluesByCategory(category: CrossCaseClue['category']): CrossCaseClue[] {
  return crossCaseClues.filter(clue =>
    clue.category === category && isCaseClueUnlocked(clue.sourceCaseId, clue.id)
  );
}

export function processNodeEffectsForCaseLinkage(nodeId: string): void {
  const state = get(caseLinkageState);
  const activeCaseId = state.activeCaseId;
  if (!activeCaseId) return;

  const def = caseDefinitions[activeCaseId];
  if (!def) return;

  const node = def.nodes.find(n => n.id === nodeId);
  if (!node) return;

  if (node.effects) {
    Object.entries(node.effects).forEach(([key, value]) => {
      if (key.startsWith('shared_')) {
        setSharedVariable(
          key,
          value,
          activeCaseId,
          `从 ${node.title || nodeId} 设置的共享变量`,
          def.relatedCaseIds
        );
      }

      if (key.startsWith('cross_case_clue_')) {
        const suffix = key.substring('cross_case_clue_'.length);
        
        if (/^\d+$/.test(suffix)) {
          const clueIndex = parseInt(suffix, 10);
          const crossClueIds = def.crossCaseClueIds;
          if (crossClueIds[clueIndex]) {
            unlockCrossCaseClue(crossClueIds[clueIndex], activeCaseId);
          }
        } else {
          if (crossCaseClues.find(c => c.id === suffix)) {
            unlockCrossCaseClue(suffix, activeCaseId);
          }
        }
      }
    });
  }

  if (node.isEnding && node.endingId) {
    completeCase(activeCaseId, node.endingId);
  }
}

export function initializeCaseLinkage(): void {
  checkAndUnlockRelatedCases();
  checkAndUnlockMainStoryBeat();
}

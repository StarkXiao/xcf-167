import { writable, derived, get } from 'svelte/store';
import type {
  SignalAnalysisState,
  SignalAnalysisModule,
  SignalAnalysisProgress,
  SignalAnalysisStatus,
  SonarChallenge,
  NoiseChallenge,
  SubtitleChallenge
} from '../types/game';
import {
  sonarChallenges,
  noiseChallenges,
  subtitleChallenges,
  getSonarChallenge,
  getNoiseChallenge,
  getSubtitleChallenge
} from '../data/signalAnalysis';
import { setVariable } from './store';
import { addEndingWeightModifier, collectEvidence, applyEndingWeightModifiers } from './evidence';
import { playSFX } from './audio';
import { goToNode } from './engine';

function createInitialProgress(
  challenges: { id: string }[],
  module: SignalAnalysisModule
): SignalAnalysisProgress[] {
  return challenges.map(c => ({
    challengeId: c.id,
    module,
    status: 'locked' as SignalAnalysisStatus,
    attempts: 0,
    score: 0,
    cluesUnlocked: [],
    evidenceCollected: []
  }));
}

function createInitialState(): SignalAnalysisState {
  return {
    isHubOpen: false,
    activeModule: null,
    activeChallengeId: null,
    sonarProgress: createInitialProgress(sonarChallenges, 'sonar'),
    noiseProgress: createInitialProgress(noiseChallenges, 'noise'),
    subtitleProgress: createInitialProgress(subtitleChallenges, 'subtitle'),
    selectedPatternIds: [],
    selectedSegmentIds: [],
    selectedErrorIds: [],
    currentCorrectionInput: {},
    totalScore: 0,
    modulesUnlocked: {
      sonar: false,
      noise: false,
      subtitle: false
    },
    hubTriggered: false,
    pendingStoryNode: null
  };
}

export const signalAnalysis = writable<SignalAnalysisState>(createInitialState());

export const availableSonarChallenges = derived(signalAnalysis, $state => {
  return sonarChallenges.map((challenge, index) => {
    const progress = $state.sonarProgress[index];
    const prevProgress = index > 0 ? $state.sonarProgress[index - 1] : null;
    let effectiveStatus: SignalAnalysisStatus = progress?.status || 'locked';
    if (effectiveStatus === 'locked') {
      if (index === 0) {
        effectiveStatus = $state.modulesUnlocked.sonar ? 'available' : 'locked';
      } else if (prevProgress && prevProgress.status === 'completed') {
        effectiveStatus = 'available';
      }
    }
    return { ...challenge, effectiveStatus, progress };
  });
});

export const availableNoiseChallenges = derived(signalAnalysis, $state => {
  return noiseChallenges.map((challenge, index) => {
    const progress = $state.noiseProgress[index];
    const prevProgress = index > 0 ? $state.noiseProgress[index - 1] : null;
    let effectiveStatus: SignalAnalysisStatus = progress?.status || 'locked';
    if (effectiveStatus === 'locked') {
      if (index === 0) {
        effectiveStatus = $state.modulesUnlocked.noise ? 'available' : 'locked';
      } else if (prevProgress && prevProgress.status === 'completed') {
        effectiveStatus = 'available';
      }
    }
    return { ...challenge, effectiveStatus, progress };
  });
});

export const availableSubtitleChallenges = derived(signalAnalysis, $state => {
  return subtitleChallenges.map((challenge, index) => {
    const progress = $state.subtitleProgress[index];
    const prevProgress = index > 0 ? $state.subtitleProgress[index - 1] : null;
    let effectiveStatus: SignalAnalysisStatus = progress?.status || 'locked';
    if (effectiveStatus === 'locked') {
      if (index === 0) {
        effectiveStatus = $state.modulesUnlocked.subtitle ? 'available' : 'locked';
      } else if (prevProgress && prevProgress.status === 'completed') {
        effectiveStatus = 'available';
      }
    }
    return { ...challenge, effectiveStatus, progress };
  });
});

export const totalCompletedChallenges = derived(signalAnalysis, $state => {
  const all = [...$state.sonarProgress, ...$state.noiseProgress, ...$state.subtitleProgress];
  return all.filter(p => p.status === 'completed').length;
});

export const allProgressArray = derived(signalAnalysis, $state => {
  return [...$state.sonarProgress, ...$state.noiseProgress, ...$state.subtitleProgress];
});

function unlockProgress(module: SignalAnalysisModule, challengeId: string): void {
  signalAnalysis.update(state => {
    const arr =
      module === 'sonar' ? state.sonarProgress :
      module === 'noise' ? state.noiseProgress :
      state.subtitleProgress;
    const newArr = arr.map(p =>
      p.challengeId === challengeId && p.status === 'locked'
        ? { ...p, status: 'available' as const }
        : p
    );
    return {
      ...state,
      sonarProgress: module === 'sonar' ? newArr : state.sonarProgress,
      noiseProgress: module === 'noise' ? newArr : state.noiseProgress,
      subtitleProgress: module === 'subtitle' ? newArr : state.subtitleProgress
    };
  });
}

export function unlockModule(module: SignalAnalysisModule): void {
  signalAnalysis.update(state => {
    const newUnlocked = { ...state.modulesUnlocked, [module]: true };
    let newState = { ...state, modulesUnlocked: newUnlocked };

    const arr =
      module === 'sonar' ? state.sonarProgress :
      module === 'noise' ? state.noiseProgress :
      state.subtitleProgress;

    if (arr.length > 0 && arr[0].status === 'locked') {
      const newArr = arr.map((p, i) =>
        i === 0 ? { ...p, status: 'available' as SignalAnalysisStatus } : p
      );
      newState = {
        ...newState,
        sonarProgress: module === 'sonar' ? newArr : newState.sonarProgress,
        noiseProgress: module === 'noise' ? newArr : newState.noiseProgress,
        subtitleProgress: module === 'subtitle' ? newArr : newState.subtitleProgress
      };
    }
    return newState;
  });
  playSFX('notify');
}

export function unlockAllModules(): void {
  unlockModule('sonar');
  unlockModule('noise');
  unlockModule('subtitle');
}

export function triggerHub(): void {
  signalAnalysis.update(state => ({ ...state, hubTriggered: true }));
}

export function openSignalHub(): void {
  signalAnalysis.update(state => ({ ...state, isHubOpen: true }));
  playSFX('click');
}

export function closeSignalHub(): void {
  signalAnalysis.update(state => ({
    ...state,
    isHubOpen: false,
    activeModule: null,
    activeChallengeId: null,
    selectedPatternIds: [],
    selectedSegmentIds: [],
    selectedErrorIds: [],
    currentCorrectionInput: {}
  }));
  playSFX('click');
}

export function consumePendingStoryNode(): string | null {
  const state = get(signalAnalysis);
  const pending = state.pendingStoryNode;
  if (pending) {
    signalAnalysis.update(s => ({ ...s, pendingStoryNode: null }));
  }
  return pending;
}

export function selectModule(module: SignalAnalysisModule): void {
  signalAnalysis.update(state => ({
    ...state,
    activeModule: module,
    activeChallengeId: null,
    selectedPatternIds: [],
    selectedSegmentIds: [],
    selectedErrorIds: [],
    currentCorrectionInput: {}
  }));
  playSFX('click');
}

export function backToHubView(): void {
  signalAnalysis.update(state => ({
    ...state,
    activeModule: null,
    activeChallengeId: null
  }));
  playSFX('click');
}

export function startChallenge(module: SignalAnalysisModule, challengeId: string): void {
  signalAnalysis.update(state => {
    const progressArr =
      module === 'sonar' ? state.sonarProgress :
      module === 'noise' ? state.noiseProgress :
      state.subtitleProgress;

    const newProgress = progressArr.map(p =>
      p.challengeId === challengeId
        ? { ...p, status: 'in_progress' as SignalAnalysisStatus }
        : p
    );

    return {
      ...state,
      activeModule: module,
      activeChallengeId: challengeId,
      selectedPatternIds: [],
      selectedSegmentIds: [],
      selectedErrorIds: [],
      currentCorrectionInput: {},
      sonarProgress: module === 'sonar' ? newProgress : state.sonarProgress,
      noiseProgress: module === 'noise' ? newProgress : state.noiseProgress,
      subtitleProgress: module === 'subtitle' ? newProgress : state.subtitleProgress
    };
  });
  playSFX('click');
}

export function toggleSonarPattern(patternId: string): void {
  signalAnalysis.update(state => {
    const exists = state.selectedPatternIds.includes(patternId);
    return {
      ...state,
      selectedPatternIds: exists
        ? state.selectedPatternIds.filter(id => id !== patternId)
        : [...state.selectedPatternIds, patternId]
    };
  });
  playSFX('click');
}

export function toggleNoiseSegment(segmentId: string): void {
  signalAnalysis.update(state => {
    const exists = state.selectedSegmentIds.includes(segmentId);
    return {
      ...state,
      selectedSegmentIds: exists
        ? state.selectedSegmentIds.filter(id => id !== segmentId)
        : [...state.selectedSegmentIds, segmentId]
    };
  });
  playSFX('click');
}

export function toggleSubtitleError(errorId: string): void {
  signalAnalysis.update(state => {
    const exists = state.selectedErrorIds.includes(errorId);
    return {
      ...state,
      selectedErrorIds: exists
        ? state.selectedErrorIds.filter(id => id !== errorId)
        : [...state.selectedErrorIds, errorId]
    };
  });
}

export function setCorrectionInput(errorId: string, value: string): void {
  signalAnalysis.update(state => ({
    ...state,
    currentCorrectionInput: {
      ...state.currentCorrectionInput,
      [errorId]: value
    }
  }));
}

function applyRewards(
  module: SignalAnalysisModule,
  challengeId: string,
  challenge: SonarChallenge | NoiseChallenge | SubtitleChallenge,
  score: number,
  isPerfect: boolean
): void {
  if (challenge.rewardClueId) {
    setVariable(challenge.rewardClueId, true);
  }

  if (challenge.rewardEvidenceId) {
    collectEvidence(challenge.rewardEvidenceId);
  }

  if (challenge.endingWeightModifiers) {
    Object.entries(challenge.endingWeightModifiers).forEach(([endingId, weight]) => {
      const actualWeight = isPerfect ? weight : Math.round(weight * 0.7);
      addEndingWeightModifier(endingId, actualWeight, `${module}_${challengeId}`);
    });
  }

  const indexMap: Record<SignalAnalysisModule, number> = {
    sonar: sonarChallenges.findIndex(c => c.id === challengeId),
    noise: noiseChallenges.findIndex(c => c.id === challengeId),
    subtitle: subtitleChallenges.findIndex(c => c.id === challengeId)
  };

  const nextIndex = indexMap[module] + 1;
  const challengesArr =
    module === 'sonar' ? sonarChallenges :
    module === 'noise' ? noiseChallenges :
    subtitleChallenges;

  if (nextIndex < challengesArr.length) {
    unlockProgress(module, challengesArr[nextIndex].id);
  }

  const state = get(signalAnalysis);
  const moduleProgress =
    module === 'sonar' ? state.sonarProgress :
    module === 'noise' ? state.noiseProgress :
    state.subtitleProgress;

  const allModuleCompleted = moduleProgress.every(p => p.status === 'completed');
  if (allModuleCompleted) {
    const completionNodeId: Record<SignalAnalysisModule, string> = {
      sonar: 'signal_sonar_complete',
      noise: 'signal_noise_complete',
      subtitle: 'signal_subtitle_complete'
    };

    signalAnalysis.update(s => ({
      ...s,
      pendingStoryNode: completionNodeId[module]
    }));
  }

  const allCompleted = [
    ...state.sonarProgress,
    ...state.noiseProgress,
    ...state.subtitleProgress
  ].every(p => p.status === 'completed');

  if (allCompleted) {
    applyEndingWeightModifiers(
      [
        { endingId: 'ending_truth', weight: 20 },
        { endingId: 'ending_survival', weight: 15 },
        { endingId: 'ending_conspiracy', weight: 10 }
      ],
      'signal_analysis_all_complete'
    );

    signalAnalysis.update(s => ({
      ...s,
      pendingStoryNode: 'signal_all_complete'
    }));
  }
}

export function submitSonarChallenge(): { success: boolean; feedback: string; score: number; isPerfect: boolean } {
  const state = get(signalAnalysis);
  const challenge = getSonarChallenge(state.activeChallengeId || '');
  if (!challenge) {
    return { success: false, feedback: '挑战不存在', score: 0, isPerfect: false };
  }

  const targetIds = [...challenge.targetPatternIds].sort();
  const selectedIds = [...state.selectedPatternIds].sort();

  const correctSelected = targetIds.filter(id => selectedIds.includes(id)).length;
  const wrongSelected = selectedIds.filter(id => !targetIds.includes(id)).length;
  const missed = targetIds.filter(id => !selectedIds.includes(id)).length;

  const totalItems = challenge.patterns.length;
  const score = Math.max(0, Math.round(
    (correctSelected * 100 - wrongSelected * 30 - missed * 20) /
    targetIds.length
  ));
  const isPerfect = wrongSelected === 0 && missed === 0;
  const success = correctSelected === targetIds.length;

  signalAnalysis.update(s => {
    const newProgress = s.sonarProgress.map(p =>
      p.challengeId === challenge.id
        ? {
            ...p,
            status: success ? 'completed' as SignalAnalysisStatus : p.status,
            attempts: p.attempts + 1,
            score: Math.max(p.score, score),
            completedAt: success ? Date.now() : p.completedAt,
            cluesUnlocked: success && challenge.rewardClueId
              ? Array.from(new Set([...p.cluesUnlocked, challenge.rewardClueId]))
              : p.cluesUnlocked,
            evidenceCollected: success && challenge.rewardEvidenceId
              ? Array.from(new Set([...p.evidenceCollected, challenge.rewardEvidenceId]))
              : p.evidenceCollected
          }
        : p
    );
    return {
      ...s,
      sonarProgress: newProgress,
      totalScore: s.totalScore + score
    };
  });

  if (success) {
    applyRewards('sonar', challenge.id, challenge, score, isPerfect);
    playSFX('notify');
  } else {
    playSFX('warning');
  }

  const feedbackParts: string[] = [];
  if (correctSelected === targetIds.length) {
    feedbackParts.push('所有目标信号都找到了！');
  } else {
    feedbackParts.push(`找到 ${correctSelected}/${targetIds.length} 个目标信号`);
    if (wrongSelected > 0) feedbackParts.push(`误选 ${wrongSelected} 个无关信号`);
    if (missed > 0) feedbackParts.push(`漏选 ${missed} 个目标信号`);
  }

  return {
    success,
    score,
    isPerfect,
    feedback: feedbackParts.join('，')
  };
}

export function submitNoiseChallenge(): { success: boolean; feedback: string; score: number; isPerfect: boolean } {
  const state = get(signalAnalysis);
  const challenge = getNoiseChallenge(state.activeChallengeId || '');
  if (!challenge) {
    return { success: false, feedback: '挑战不存在', score: 0, isPerfect: false };
  }

  const targetIds = [...challenge.targetSegmentIds].sort();
  const selectedIds = [...state.selectedSegmentIds].sort();

  const correctSelected = targetIds.filter(id => selectedIds.includes(id)).length;
  const wrongSelected = selectedIds.filter(id => !targetIds.includes(id)).length;
  const missed = targetIds.filter(id => !selectedIds.includes(id)).length;

  const score = Math.max(0, Math.round(
    (correctSelected * 100 - wrongSelected * 30 - missed * 20) /
    targetIds.length
  ));
  const isPerfect = wrongSelected === 0 && missed === 0;
  const success = correctSelected === targetIds.length;

  signalAnalysis.update(s => {
    const newProgress = s.noiseProgress.map(p =>
      p.challengeId === challenge.id
        ? {
            ...p,
            status: success ? 'completed' as SignalAnalysisStatus : p.status,
            attempts: p.attempts + 1,
            score: Math.max(p.score, score),
            completedAt: success ? Date.now() : p.completedAt,
            cluesUnlocked: success && challenge.rewardClueId
              ? Array.from(new Set([...p.cluesUnlocked, challenge.rewardClueId]))
              : p.cluesUnlocked,
            evidenceCollected: success && challenge.rewardEvidenceId
              ? Array.from(new Set([...p.evidenceCollected, challenge.rewardEvidenceId]))
              : p.evidenceCollected
          }
        : p
    );
    return {
      ...s,
      noiseProgress: newProgress,
      totalScore: s.totalScore + score
    };
  });

  if (success) {
    applyRewards('noise', challenge.id, challenge, score, isPerfect);
    playSFX('notify');
  } else {
    playSFX('warning');
  }

  const feedbackParts: string[] = [];
  if (correctSelected === targetIds.length) {
    feedbackParts.push('所有目标片段都找到了！');
  } else {
    feedbackParts.push(`找到 ${correctSelected}/${targetIds.length} 个目标片段`);
    if (wrongSelected > 0) feedbackParts.push(`误选 ${wrongSelected} 个无关片段`);
    if (missed > 0) feedbackParts.push(`漏选 ${missed} 个目标片段`);
  }

  return {
    success,
    score,
    isPerfect,
    feedback: feedbackParts.join('，')
  };
}

export function submitSubtitleChallenge(): { success: boolean; feedback: string; score: number; isPerfect: boolean } {
  const state = get(signalAnalysis);
  const challenge = getSubtitleChallenge(state.activeChallengeId || '');
  if (!challenge) {
    return { success: false, feedback: '挑战不存在', score: 0, isPerfect: false };
  }

  let correctCount = 0;
  let wrongCount = 0;
  const errorDetails: string[] = [];

  challenge.errors.forEach(error => {
    const userInput = (state.currentCorrectionInput[error.id] || '').trim();
    const expected = error.correction;

    if (userInput === expected) {
      correctCount++;
    } else {
      wrongCount++;
      errorDetails.push(`第${challenge.errors.indexOf(error) + 1}处错误修正不正确`);
    }
  });

  const total = challenge.errors.length;
  const score = Math.max(0, Math.round((correctCount * 100 - wrongCount * 10) / total));
  const isPerfect = wrongCount === 0;
  const success = correctCount === total;

  signalAnalysis.update(s => {
    const newProgress = s.subtitleProgress.map(p =>
      p.challengeId === challenge.id
        ? {
            ...p,
            status: success ? 'completed' as SignalAnalysisStatus : p.status,
            attempts: p.attempts + 1,
            score: Math.max(p.score, score),
            completedAt: success ? Date.now() : p.completedAt,
            cluesUnlocked: success && challenge.rewardClueId
              ? Array.from(new Set([...p.cluesUnlocked, challenge.rewardClueId]))
              : p.cluesUnlocked,
            evidenceCollected: success && challenge.rewardEvidenceId
              ? Array.from(new Set([...p.evidenceCollected, challenge.rewardEvidenceId]))
              : p.evidenceCollected
          }
        : p
    );
    return {
      ...s,
      subtitleProgress: newProgress,
      totalScore: s.totalScore + score
    };
  });

  if (success) {
    applyRewards('subtitle', challenge.id, challenge, score, isPerfect);
    playSFX('notify');
  } else {
    playSFX('warning');
  }

  let feedback = '';
  if (correctCount === total) {
    feedback = '完美！所有字幕错误都已正确修复！';
    if (challenge.hiddenMessage) {
      feedback += `\n\n隐藏信息：${challenge.hiddenMessage}`;
    }
  } else {
    feedback = `正确修复 ${correctCount}/${total} 处错误`;
    if (errorDetails.length > 0) {
      feedback += `\n${errorDetails.join('；')}`;
    }
  }

  return {
    success,
    score,
    isPerfect,
    feedback
  };
}

export function resetSelections(): void {
  signalAnalysis.update(state => ({
    ...state,
    selectedPatternIds: [],
    selectedSegmentIds: [],
    selectedErrorIds: [],
    currentCorrectionInput: {}
  }));
  playSFX('click');
}

export function resetSignalAnalysis(): void {
  signalAnalysis.set(createInitialState());
}

import type { StoryNode, Ending, GameState, EvidenceCard, UnlockedClue } from './game';

export type CaseId = 'case_pioneer' | 'case_abyss' | 'case_phantom';

export type CaseStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'hidden';

export type CaseSeverity = 'critical' | 'major' | 'minor';

export interface CaseDefinition {
  id: CaseId;
  title: string;
  subtitle: string;
  designation: string;
  status: CaseStatus;
  severity: CaseSeverity;
  date: string;
  location: string;
  depth: string;
  summary: string;
  fullDescription: string;
  crewNames: string[];
  victimCount: number;
  survivorCount: number;
  coverStory: string;
  classifiedInfo: string;
  unlockCondition: {
    requiredClues?: string[];
    requiredCaseCompletion?: CaseId[];
    requiredPlaythroughAtLeast?: number;
  };
  startNodeId: string;
  endNodeIds: string[];
  nodes: StoryNode[];
  endings: Ending[];
  relatedCaseIds: CaseId[];
  crossCaseClueIds: string[];
  primaryThemeColor: string;
  secondaryThemeColor: string;
  icon: string;
  order: number;
}

export interface CrossCaseClue {
  id: string;
  title: string;
  description: string;
  sourceCaseId: CaseId;
  sourceNodeId?: string;
  sourceEndingId?: string;
  relatedCaseIds: CaseId[];
  importance: number;
  category: 'personnel' | 'technology' | 'organization' | 'creature' | 'protocol' | 'location';
  evidenceCards?: string[];
  timelinePosition: string;
  isKeyEvidence: boolean;
  unlocksMainStoryBeat?: string;
}

export interface SharedVariable {
  key: string;
  value: string | number | boolean;
  sourceCaseId: CaseId;
  description: string;
  affectsCases: CaseId[];
  isPersistent: boolean;
  lastUpdatedAt: number;
  updatedInNodeId?: string;
}

export interface CaseState {
  caseId: CaseId;
  status: CaseStatus;
  currentNodeId: string;
  dialogueIndex: number;
  variables: Record<string, string | number | boolean>;
  unlockedEndings: string[];
  visitedNodes: string[];
  cluesUnlocked: string[];
  evidenceCollected: string[];
  choicesMade: { nodeId: string; choiceId: string }[];
  playthroughCount: number;
  completedAt?: number;
  bestEndingId?: string;
}

export interface MainStoryBeat {
  id: string;
  title: string;
  description: string;
  requiredClues: string[];
  requiredCases: CaseId[];
  isUnlocked: boolean;
  unlockedAt?: number;
  order: number;
  revealContent: string;
  backgroundImage?: string;
}

export interface CaseLinkageState {
  activeCaseId: CaseId | null;
  cases: Record<CaseId, CaseState>;
  sharedVariables: Record<string, SharedVariable>;
  crossCaseClues: Record<string, CrossCaseClue>;
  mainStoryBeats: MainStoryBeat[];
  currentMainStoryBeatIndex: number;
  isCaseSelectionOpen: boolean;
  isClueBoardOpen: boolean;
  isMainStoryRevealOpen: boolean;
  allCasesCompleted: boolean;
  mainStoryCompleted: boolean;
  totalCluesCollected: number;
  totalEvidenceCollected: number;
}

export interface CaseTransition {
  fromCaseId: CaseId;
  toCaseId: CaseId;
  triggerNodeId: string;
  triggerClueId?: string;
  transitionText: string;
  autoTransition: boolean;
  carryOverVariables: string[];
  carryOverClues: string[];
}

export interface CaseSaveData {
  version: number;
  savedAt: number;
  caseStates: Record<CaseId, CaseState>;
  sharedVariables: Record<string, SharedVariable>;
  unlockedCrossCaseClues: string[];
  mainStoryProgress: number;
  currentMainStoryBeat: string;
}

export const CASE_THEMES: Record<CaseId, { primary: string; secondary: string; accent: string }> = {
  case_pioneer: {
    primary: '#1e3a5f',
    secondary: '#2d5a87',
    accent: '#4da6ff'
  },
  case_abyss: {
    primary: '#3d1f5c',
    secondary: '#5a2d87',
    accent: '#b366ff'
  },
  case_phantom: {
    primary: '#5c1f3d',
    secondary: '#872d5a',
    accent: '#ff66b3'
  }
};

export const CROSS_CASE_CATEGORY_LABELS: Record<CrossCaseClue['category'], string> = {
  personnel: '人员关联',
  technology: '技术关联',
  organization: '组织关联',
  creature: '生物关联',
  protocol: '协议关联',
  location: '地点关联'
};

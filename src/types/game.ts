export interface Danmaku {
  id: string;
  username: string;
  content: string;
  timestamp: number;
  dialogueIndex?: number;
  relativeMs?: number;
  color?: string;
  isImportant?: boolean;
  isBackendOnly?: boolean;
}

export interface Choice {
  id: string;
  text: string;
  nextNodeId: string;
  condition?: StateCondition;
  trustCondition?: TrustCondition;
  effect?: StateEffect;
  trustEffect?: TrustEffect;
  memoryCondition?: MemoryCondition;
  memoryText?: string;
  memoryEffect?: { clueToUnlock?: string };
}

export interface StateCondition {
  [key: string]: string | number | boolean;
}

export interface StateEffect {
  [key: string]: string | number | boolean;
}

export type BGMType = 'deep' | 'tense' | 'calm' | 'mystery';

export type MoodType = 'normal' | 'tense' | 'scared' | 'calm' | 'whisper' | 'urgent';

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

export interface DialogueVariant {
  text: string;
  condition?: StateCondition;
  trustCondition?: TrustCondition;
  memoryCondition?: MemoryCondition;
  isNewGamePlus?: boolean;
}

export interface MemoryCondition {
  requiredClues?: string[];
  requiredEndings?: string[];
  requiredEvidence?: string[];
  playthroughAtLeast?: number;
  anyClues?: string[];
}

export interface AudioHint {
  id: string;
  memoryCondition: MemoryCondition;
  sfx: SFXType;
  volume?: number;
  delay?: number;
  oncePerPlaythrough?: boolean;
  playthroughExclusive?: boolean;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  audioId?: string;
  delay?: number;
  sfx?: AudioTrigger[];
  bgm?: BGMType;
  baseTypingSpeed?: number;
  mood?: MoodType;
  autoAdvance?: boolean;
  autoAdvanceDelay?: number;
  trustEffect?: TrustEffect;
  memoryVariants?: DialogueVariant[];
  memoryHints?: AudioHint[];
  memoryCondition?: MemoryCondition;
  isMemoryLine?: boolean;
  isBackendOnly?: boolean;
  backendPerspective?: boolean;
}

export interface StoryNode {
  id: string;
  background?: string;
  title?: string;
  bgm?: BGMType;
  dialogues: DialogueLine[];
  danmakus?: Danmaku[];
  choices?: Choice[];
  nextNodeId?: string;
  nextNodeBranches?: NextNodeBranch[];
  effects?: StateEffect;
  trustEffect?: TrustEffect;
  trustCondition?: TrustCondition;
  isEnding?: boolean;
  endingId?: string;
  endingTitle?: string;
  endingDescription?: string;
  memoryDialogues?: DialogueLine[];
  memoryHints?: AudioHint[];
  isRewindCheckpoint?: boolean;
  rewindCheckpointLabel?: string;
  damageEffects?: DamageEffect[];
  repairEffects?: RepairEffect[];
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
  anonymousSenderState?: Omit<AnonymousSenderState, 'activeNotification' | 'isMailboxOpen' | 'isTerminalOpen' | 'viewingEmailId' | 'viewingTerminalId'>;
  createdAt: number;
  updatedAt: number;
}

export interface SaveSlot {
  id: number;
  state: GameState;
  savedAt: number;
  preview: string;
  unreadEmailCount?: number;
  unreadTerminalCount?: number;
  latestMessagePreview?: string;
}

export type GameScene = 'menu' | 'playing' | 'endings' | 'settings';

export type EvidenceType = 'danmaku' | 'dialogue' | 'sfx';

export type EvidenceStatus = 'collected' | 'placed' | 'used' | 'invalid';

export interface EvidenceCard {
  id: string;
  type: EvidenceType;
  title: string;
  content: string;
  sourceNodeId?: string;
  sourceDialogueIndex?: number;
  color?: string;
  username?: string;
  speaker?: string;
  sfxType?: string;
  status: EvidenceStatus;
  importance: number;
  tags: string[];
  collectedAt: number;
}

export interface EvidenceSlot {
  id: string;
  x: number;
  y: number;
  label: string;
  requiredTags?: string[];
  filledBy?: string;
  order: number;
}

export interface DeductionRule {
  id: string;
  name: string;
  description: string;
  requiredSlots: string[];
  requiredEvidence: { slotId: string; evidenceId: string }[];
  outcome: {
    clueUnlocked?: string;
    endingWeights?: Record<string, number>;
    trustEffect?: TrustEffect;
    wrongTrustEffect?: TrustEffect;
    isCorrect: boolean;
    feedback: string;
  };
}

export interface EvidenceHistory {
  ruleId: string;
  evidenceIds: string[];
  isCorrect: boolean;
  timestamp: number;
  feedback: string;
}

export interface EndingWeight {
  endingId: string;
  weight: number;
  baseWeight: number;
  modifiers: { source: string; value: number }[];
}

export interface EvidenceBoardState {
  collectedEvidence: EvidenceCard[];
  slots: EvidenceSlot[];
  placedEvidence: Map<string, string>;
  unlockedRules: string[];
  completedRules: string[];
  history: EvidenceHistory[];
  mistakeCount: number;
  maxMistakes: number;
  endingWeights: EndingWeight[];
  isBoardOpen: boolean;
  canOpenBoard: boolean;
}

export interface DragState {
  isDragging: boolean;
  evidenceId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface UnlockedClue {
  id: string;
  unlockedAt: number;
  firstPlaythrough: number;
  sourceNodeId?: string;
  sourceEndingId?: string;
}

export interface PlaythroughRecord {
  playthrough: number;
  endingId?: string;
  completedAt: number;
  cluesUnlocked: string[];
  evidenceCollected: string[];
  nodesVisited: string[];
  choicesMade: { nodeId: string; choiceId: string }[];
  mistakeCount: number;
  pathTaken?: string;
}

export interface GlobalMemory {
  currentPlaythrough: number;
  unlockedClues: Record<string, UnlockedClue>;
  unlockedEvidenceIds: string[];
  playthroughHistory: PlaythroughRecord[];
  audioHintsTriggered: string[];
  dialogueVariantsUsed: string[];
  createdAt: number;
  updatedAt: number;
}

export type SubmarineSystem = 'hull' | 'camera' | 'communication' | 'sonar' | 'control' | 'power';

export const SUBMARINE_SYSTEM_LABELS: Record<SubmarineSystem, string> = {
  hull: '舱体外壳',
  camera: '摄像系统',
  communication: '通信模块',
  sonar: '声呐系统',
  control: '操控面板',
  power: '动力核心'
};

export interface SystemDamageState {
  damage: number;
  targetDamage: number;
  lastUpdate: number;
}

export interface DamageAlert {
  system: SubmarineSystem;
  message: string;
  timestamp: number;
  severity: 'warning' | 'critical' | 'offline';
  id: string;
}

export interface HullDamageState {
  systems: Record<SubmarineSystem, SystemDamageState>;
  alerts: DamageAlert[];
  alertIdCounter: number;
}

export interface DamageEffect {
  system: SubmarineSystem;
  damage: number;
  message?: string;
}

export interface RepairEffect {
  system: SubmarineSystem;
  amount: number;
  message?: string;
}

export interface ChannelDegradation {
  visual: number;
  danmaku: number;
  audio: number;
  control: number;
  power: number;
  combined: number;
}

export interface SignalCorruptionState {
  level: number;
  targetLevel: number;
  lastUpdate: number;
  fluctuation: number;
  channelDegradation: ChannelDegradation;
}

export interface CorruptionEffect {
  type: 'subtitle_glitch' | 'danmaku_delay' | 'audio_distort' | 'choice_hide' | 'visual_artifact';
  intensity: number;
  seed?: number;
}

export type CrewMemberId = 'ahai' | 'xiaolin' | 'laozhou' | 'suboshi';

export type TrustLevel = 'hostile' | 'distrust' | 'neutral' | 'trust' | 'loyal';

export interface CrewMember {
  id: CrewMemberId;
  name: string;
  role: string;
  avatar?: string;
  description: string;
}

export interface TrustChange {
  target: CrewMemberId | 'all';
  value: number;
  reason?: string;
  source?: string;
}

export interface CrewTrustState {
  memberId: CrewMemberId;
  value: number;
  level: TrustLevel;
  history: { value: number; reason?: string; source?: string; timestamp: number }[];
}

export interface TrustState {
  crew: Record<CrewMemberId, CrewTrustState>;
  overallTrust: number;
  activeNotifications: TrustNotification[];
}

export interface TrustNotification {
  id: string;
  target: CrewMemberId;
  value: number;
  reason?: string;
  timestamp: number;
  duration: number;
}

export interface TrustEffect {
  changes: TrustChange[];
  hintText?: string;
}

export interface CrewTrustRequirement {
  memberId: CrewMemberId;
  minValue?: number;
  maxValue?: number;
  minLevel?: TrustLevel;
}

export interface TrustCondition {
  crewRequirements?: CrewTrustRequirement[];
  overallMinValue?: number;
  overallMaxValue?: number;
  overallMinLevel?: TrustLevel;
}

export interface NextNodeBranch {
  nextNodeId: string;
  condition?: StateCondition;
  trustCondition?: TrustCondition;
  memoryCondition?: MemoryCondition;
  priority?: number;
}

export interface RewindCheckpoint {
  id: string;
  nodeId: string;
  dialogueIndex: number;
  timestamp: number;
  label?: string;
  snapshot: {
    variables: Record<string, string | number | boolean>;
    danmakuOrder: string[];
    triggeredSfx: string[];
    unlockedClues: string[];
  };
}

export interface RewindState {
  isRewindMode: boolean;
  stability: number;
  maxStability: number;
  checkpoints: RewindCheckpoint[];
  rewindCount: number;
  activeRewind: RewindCheckpoint | null;
  rewindDanmakuShuffle: boolean;
  rewireSfxTrigger: boolean;
  rewindClueOverride: boolean;
  lastRewindTime: number;
}

export interface RewindEffect {
  danmakuReorderSeed?: number;
  sfxOverride?: { originalSfx: SFXType; replacementSfx: SFXType; delay?: number }[];
  clueAlteration?: { clueId: string; newValue: boolean }[];
  stabilityCost: number;
}

export type AnonymousMessageType = 'email' | 'terminal';

export interface AnonymousEmail {
  id: string;
  subject: string;
  sender: string;
  timestamp: number;
  content: string;
  isRead: boolean;
  attachedClue?: string;
  tags?: string[];
}

export interface TerminalRecord {
  id: string;
  title: string;
  timestamp: number;
  content: string;
  isRead: boolean;
  command?: string;
  output?: string;
  securityLevel?: 'public' | 'restricted' | 'classified';
  attachedClue?: string;
}

export interface AnonymousTrigger {
  id: string;
  messageType: AnonymousMessageType;
  messageId: string;
  triggerNodeId?: string;
  triggerVariable?: { key: string; value: string | number | boolean };
  triggerDialogueIndex?: number;
  memoryCondition?: MemoryCondition;
  trustCondition?: TrustCondition;
  delayMs?: number;
}

export interface AnonymousSenderState {
  emails: AnonymousEmail[];
  terminalRecords: TerminalRecord[];
  triggeredIds: string[];
  unreadEmailCount: number;
  unreadTerminalCount: number;
  activeNotification: {
    type: AnonymousMessageType;
    id: string;
    subject?: string;
  } | null;
  isMailboxOpen: boolean;
  isTerminalOpen: boolean;
  viewingEmailId: string | null;
  viewingTerminalId: string | null;
}

export type AchievementCategory = 'story' | 'clue' | 'ending' | 'trust' | 'evidence' | 'secret' | 'special';

export interface AchievementCondition {
  requiredEndings?: string[];
  requiredClues?: string[];
  requiredChoices?: string[];
  requiredPaths?: string[];
  requiredPlaythroughAtLeast?: number;
  requiredMistakeCountAtMost?: number;
  requiredMistakeCountAtLeast?: number;
  requiredClueCountAtLeast?: number;
  requiredEvidenceCountAtLeast?: number;
  requiredAllEndings?: boolean;
  anyEndings?: string[];
  requiredTrustLevel?: {
    memberId: CrewMemberId;
    minLevel?: TrustLevel;
  }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  isSecret: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: AchievementCondition;
  unlockHint?: string;
  reward?: {
    archiveId?: string;
    audioId?: string;
    skinId?: string;
  };
}

export interface ArchiveEntry {
  id: string;
  title: string;
  content: string;
  category: 'character' | 'document' | 'audio_log' | 'secret' | 'development';
  unlockedAt?: number;
  isUnlocked: boolean;
}

export interface SpecialAudio {
  id: string;
  title: string;
  description: string;
  sfxType?: SFXType;
  customPattern?: {
    type: 'tone' | 'noise' | 'sequence';
    freqs?: number[];
    duration?: number;
  };
  isUnlocked: boolean;
}

export interface MenuSkin {
  id: string;
  name: string;
  description: string;
  gradient: string;
  accentColor: string;
  titleColor: string;
  subtitleColor: string;
  buttonBg: string;
  buttonBorder: string;
  bgDecoration: string;
  particleColor: string;
  isUnlocked: boolean;
}

export interface AchievementState {
  unlockedAchievements: Record<string, {
    unlockedAt: number;
    playthrough: number;
  }>;
  unlockedArchives: string[];
  unlockedAudios: string[];
  unlockedSkins: string[];
  currentSkin: string;
  mistakeCountTotal: number;
  mistakeCountThisPlaythrough: number;
  totalPlaythroughs: number;
  choicesMadeThisPlaythrough: { nodeId: string; choiceId: string }[];
  currentPath?: string;
}



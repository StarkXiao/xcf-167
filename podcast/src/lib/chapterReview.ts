import { writable, derived, get } from 'svelte/store';
import type {
  ChapterDefinition,
  ChapterPlayRecord,
  ChapterSaveSlot,
  EndingComparisonEntry,
  StoryNode,
  GameState,
  ChapterNodeSnapshot
} from '../types/game';
import { storyData } from '../data/story';
import { globalMemory, currentPlaythrough } from './memory';
import { getNode } from './engine';

const CHAPTER_RECORDS_KEY = 'deep_sea_chapter_records';
const CHAPTER_SAVES_KEY = 'deep_sea_chapter_saves';
const CHAPTER_REPLAY_KEY = 'deep_sea_chapter_replay_session';

export interface ChapterReplaySession {
  chapterId: string;
  startNodeId: string;
  variablesSnapshot: Record<string, string | number | boolean>;
  choicesMade: { nodeId: string; choiceId: string; choiceText: string }[];
  cluesHit: string[];
  trustChanges: { target: string; value: number; reason?: string }[];
  danmakuHighlights: string[];
  nodesVisited: string[];
  nodeSnapshots: ChapterNodeSnapshot[];
  startTime: number;
  isActive: boolean;
}

export const chapters: ChapterDefinition[] = [
  {
    id: 'ch_intro',
    title: '直播开场',
    startNodeId: 'start',
    endNodeIds: ['intro_2'],
    description: '数据缓存恢复，直播回放开始加载。你是一名数字取证分析师，收到了匿名邮件中的完整直播数据备份。',
    depth: '0m'
  },
  {
    id: 'ch_descent',
    title: '下潜探索',
    startNodeId: 'intro_1',
    endNodeIds: ['mid_dive'],
    description: '深渊号开始下潜，船员们向观众做自我介绍。在深度800米处，你们看到了发光的管水母群。',
    depth: '800m'
  },
  {
    id: 'ch_anomaly',
    title: '首次异常',
    startNodeId: 'early_sign',
    endNodeIds: ['first_contact'],
    description: '深度1500米，声呐探测到异常信号。一个巨大的不明物体正在接近潜水器。',
    depth: '1500m'
  },
  {
    id: 'ch_contact',
    title: '第一次接触',
    startNodeId: 'first_contact',
    endNodeIds: ['tension_rises'],
    description: '未知生物出现在舷窗外。它有一双类似眼睛的东西，正盯着潜水器。弹幕瞬间爆炸。',
    depth: '3200m'
  },
  {
    id: 'ch_analysis',
    title: '线索分析',
    startNodeId: 'analyze_crew',
    endNodeIds: ['critical_choice'],
    description: '你开始分析船员反应、弹幕记录或生物细节。每条路径都揭示不同的线索，指向不同的真相。',
    depth: '3200m'
  },
  {
    id: 'ch_critical',
    title: '关键抉择',
    startNodeId: 'critical_choice',
    endNodeIds: ['path_live', 'path_stop', 'path_ascent'],
    description: '苏博士要求关掉直播，阿海坚持继续。这个选择将决定所有人的命运走向。',
    depth: '3200m'
  },
  {
    id: 'ch_live',
    title: '直播继续线',
    startNodeId: 'path_live',
    endNodeIds: ['ending_truth_node', 'ending_madness_node'],
    description: '坚持直播，直面深海中的未知存在。信号在03:17:42中断，但最后一帧隐藏着惊人的真相。',
    depth: '10000m'
  },
  {
    id: 'ch_stop',
    title: '直播中断线',
    startNodeId: 'path_stop',
    endNodeIds: ['ending_survival_stop', 'ending_loop_stop', 'ending_madness_stop'],
    description: '关掉直播后，苏博士启动了协议07。你发现后台录制仍在继续，真正的秘密才刚刚揭开。',
    depth: '10000m'
  },
  {
    id: 'ch_ascent',
    title: '紧急上浮线',
    startNodeId: 'path_ascent',
    endNodeIds: ['ending_survival_ascent', 'ending_truth_ascent', 'ending_silence'],
    description: '老周启动紧急上浮程序，但那东西似乎不愿放你们离开。深海与海面之间，是一场生死竞速。',
    depth: '10000m'
  }
];

function loadChapterRecords(): ChapterPlayRecord[] {
  try {
    const data = localStorage.getItem(CHAPTER_RECORDS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveChapterRecords(records: ChapterPlayRecord[]): void {
  localStorage.setItem(CHAPTER_RECORDS_KEY, JSON.stringify(records));
}

function loadChapterSaves(): ChapterSaveSlot[] {
  try {
    const data = localStorage.getItem(CHAPTER_SAVES_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

function saveChapterSaves(saves: ChapterSaveSlot[]): void {
  localStorage.setItem(CHAPTER_SAVES_KEY, JSON.stringify(saves));
}

function loadReplaySession(): ChapterReplaySession | null {
  try {
    const data = localStorage.getItem(CHAPTER_REPLAY_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.isActive) return parsed;
    }
  } catch {}
  return null;
}

function saveReplaySession(session: ChapterReplaySession | null): void {
  if (session) {
    localStorage.setItem(CHAPTER_REPLAY_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(CHAPTER_REPLAY_KEY);
  }
}

export const chapterRecords = writable<ChapterPlayRecord[]>(loadChapterRecords());
export const chapterSaves = writable<ChapterSaveSlot[]>(loadChapterSaves());
export const replaySession = writable<ChapterReplaySession | null>(loadReplaySession());

chapterRecords.subscribe(saveChapterRecords);
chapterSaves.subscribe(saveChapterSaves);
replaySession.subscribe(saveReplaySession);

export const isInChapterReplay = derived(replaySession, $s => $s?.isActive ?? false);
export const currentReplayChapterId = derived(replaySession, $s => $s?.chapterId ?? null);

export const chaptersWithStatus = derived(
  [chapterRecords, globalMemory, chapterSaves],
  ([$records, $memory, $saves]) => {
    return chapters.map(ch => {
      const records = $records.filter(r => r.chapterId === ch.id);
      const saves = $saves.filter(s => s.chapterId === ch.id);
      const visited = $memory.playthroughHistory.some(p =>
        p.nodesVisited.some(nId => {
          const node = getNode(nId);
          return node && isNodeInChapter(node, ch);
        })
      );
      return {
        chapter: ch,
        hasRecord: records.length > 0,
        recordCount: records.length,
        saveCount: saves.length,
        hasVisited: visited,
        latestRecord: records[records.length - 1] || null,
        latestSave: saves[saves.length - 1] || null
      };
    });
  }
);

function isNodeInChapter(node: StoryNode, chapter: ChapterDefinition): boolean {
  const allNodeIds = collectChapterNodeIds(chapter);
  return allNodeIds.has(node.id);
}

function collectChapterNodeIds(chapter: ChapterDefinition): Set<string> {
  const ids = new Set<string>();
  const allNodes = storyData.nodes;
  const startIdx = allNodes.findIndex(n => n.id === chapter.startNodeId);
  if (startIdx === -1) return ids;

  const queue: string[] = [chapter.startNodeId];
  const visited = new Set<string>();
  const endSet = new Set(chapter.endNodeIds);

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    ids.add(currentId);

    const node = allNodes.find(n => n.id === currentId);
    if (!node) continue;

    if (endSet.has(currentId)) continue;

    if (node.nextNodeId) queue.push(node.nextNodeId);
    if (node.choices) {
      node.choices.forEach(c => queue.push(c.nextNodeId));
    }
    if (node.nextNodeBranches) {
      node.nextNodeBranches.forEach(b => queue.push(b.nextNodeId));
    }
  }

  return ids;
}

export function getChapterForNode(nodeId: string): ChapterDefinition | null {
  for (const ch of chapters) {
    if (isNodeInChapter({ id: nodeId } as StoryNode, ch)) {
      return ch;
    }
  }
  return null;
}

export function startChapterReplay(chapterId: string, initialVariables: Record<string, string | number | boolean>): void {
  const chapter = chapters.find(c => c.id === chapterId);
  if (!chapter) return;

  const session: ChapterReplaySession = {
    chapterId,
    startNodeId: chapter.startNodeId,
    variablesSnapshot: { ...initialVariables },
    choicesMade: [],
    cluesHit: [],
    trustChanges: [],
    danmakuHighlights: [],
    nodesVisited: [chapter.startNodeId],
    nodeSnapshots: [],
    startTime: Date.now(),
    isActive: true
  };

  replaySession.set(session);
}

export function endChapterReplay(
  finalVariables: Record<string, string | number | boolean>,
  finalNodeId: string,
  forceSave = false
): ChapterPlayRecord | null {
  const session = get(replaySession);
  if (!session || !session.isActive) return null;

  const chapter = chapters.find(c => c.id === session.chapterId);
  if (!chapter) {
    replaySession.set(null);
    return null;
  }

  const hasVisitedChapterNodes = session.nodesVisited.some(nId =>
    collectChapterNodeIds(chapter).has(nId)
  );

  if (!hasVisitedChapterNodes && !forceSave) {
    replaySession.set(null);
    return null;
  }

  const varsBefore = session.variablesSnapshot;
  const varsAfter = { ...finalVariables };

  const cluesHit: string[] = [];
  const allKeys = new Set([...Object.keys(varsBefore), ...Object.keys(varsAfter)]);
  for (const key of allKeys) {
    if (
      (key.startsWith('clue') || key === 'full_truth') &&
      varsBefore[key] !== varsAfter[key] &&
      varsAfter[key]
    ) {
      cluesHit.push(key);
    }
  }

  const record: ChapterPlayRecord = {
    chapterId: session.chapterId,
    nodeId: finalNodeId,
    variablesBefore: varsBefore,
    variablesAfter: varsAfter,
    choicesMade: session.choicesMade,
    cluesHit,
    trustChanges: session.trustChanges,
    danmakuHighlights: session.danmakuHighlights,
    timestamp: Date.now(),
    playthroughNumber: get(currentPlaythrough),
    nodeSnapshots: session.nodeSnapshots
  };

  chapterRecords.update(records => [...records, record]);
  replaySession.set(null);

  return record;
}

export function cancelChapterReplay(): void {
  replaySession.set(null);
}

export function recordReplayChoice(
  nodeId: string,
  choiceId: string,
  choiceText: string
): void {
  replaySession.update(session => {
    if (!session) return session;
    return {
      ...session,
      choicesMade: [
        ...session.choicesMade,
        { nodeId, choiceId, choiceText }
      ]
    };
  });
}

export function recordReplayNodeVisit(nodeId: string): void {
  replaySession.update(session => {
    if (!session) return session;
    if (session.nodesVisited.includes(nodeId)) return session;
    return {
      ...session,
      nodesVisited: [...session.nodesVisited, nodeId]
    };
  });
}

export function recordReplayNodeSnapshot(
  nodeId: string,
  dialogueIndex: number,
  variables: Record<string, string | number | boolean>,
  dialoguePreview = '',
  nodeTitle?: string
): void {
  replaySession.update(session => {
    if (!session) return session;

    const snapshot: ChapterNodeSnapshot = {
      nodeId,
      dialogueIndex,
      variables: { ...variables },
      dialoguePreview: dialoguePreview.slice(0, 80),
      nodeTitle,
      visitedAt: Date.now()
    };

    const filteredSnapshots = session.nodeSnapshots.filter(
      s => !(s.nodeId === nodeId && s.dialogueIndex === dialogueIndex)
    );

    return {
      ...session,
      nodeSnapshots: [...filteredSnapshots, snapshot]
    };
  });
}

export function getNodeSnapshotsByRecord(record: ChapterPlayRecord): ChapterNodeSnapshot[] {
  return record.nodeSnapshots || [];
}

export function recordReplayTrustChange(
  target: string,
  value: number,
  reason?: string
): void {
  replaySession.update(session => {
    if (!session) return session;
    return {
      ...session,
      trustChanges: [
        ...session.trustChanges,
        { target, value, reason }
      ]
    };
  });
}

export function isNodeInCurrentReplayChapter(nodeId: string): boolean {
  const session = get(replaySession);
  if (!session || !session.isActive) return true;

  const chapter = chapters.find(c => c.id === session.chapterId);
  if (!chapter) return true;

  const chapterNodes = collectChapterNodeIds(chapter);
  return chapterNodes.has(nodeId);
}

export function isCurrentReplayEndNode(nodeId: string): boolean {
  const session = get(replaySession);
  if (!session || !session.isActive) return false;

  const chapter = chapters.find(c => c.id === session.chapterId);
  if (!chapter) return false;

  return chapter.endNodeIds.includes(nodeId);
}

export function getCurrentReplayChapter(): ChapterDefinition | null {
  const session = get(replaySession);
  if (!session) return null;
  return chapters.find(c => c.id === session.chapterId) || null;
}

export function addChapterRecord(record: ChapterPlayRecord): void {
  chapterRecords.update(records => [...records, record]);
}

export function getChapterRecords(chapterId: string): ChapterPlayRecord[] {
  return get(chapterRecords).filter(r => r.chapterId === chapterId);
}

export function createChapterSave(
  chapterId: string,
  nodeId: string,
  dialogueIndex: number,
  variables: Record<string, string | number | boolean>,
  preview: string,
  slotId?: string
): ChapterSaveSlot {
  const slot: ChapterSaveSlot = {
    id: slotId || `slot_${Date.now()}`,
    chapterId,
    nodeId,
    dialogueIndex,
    variables: { ...variables },
    savedAt: Date.now(),
    preview: preview.slice(0, 60)
  };

  chapterSaves.update(saves => {
    const filtered = saves.filter(
      s => !(s.chapterId === slot.chapterId && s.id === slot.id)
    );
    return [...filtered, slot];
  });

  return slot;
}

export function saveChapterGame(slot: ChapterSaveSlot): void {
  chapterSaves.update(saves => {
    const filtered = saves.filter(
      s => !(s.chapterId === slot.chapterId && s.id === slot.id)
    );
    return [...filtered, slot];
  });
}

export function loadChapterSave(
  chapterId: string,
  slotId: string
): ChapterSaveSlot | null {
  return (
    get(chapterSaves).find(
      s => s.chapterId === chapterId && s.id === slotId
    ) || null
  );
}

export function deleteChapterSave(chapterId: string, slotId: string): void {
  chapterSaves.update(saves =>
    saves.filter(s => !(s.chapterId === chapterId && s.id === slotId))
  );
}

export function getChapterSaves(chapterId: string): ChapterSaveSlot[] {
  return get(chapterSaves)
    .filter(s => s.chapterId === chapterId)
    .sort((a, b) => b.savedAt - a.savedAt);
}

export function getAllChapterSaves(): ChapterSaveSlot[] {
  return get(chapterSaves).sort((a, b) => b.savedAt - a.savedAt);
}

export function clearChapterRecords(chapterId?: string): void {
  if (chapterId) {
    chapterRecords.update(records =>
      records.filter(r => r.chapterId !== chapterId)
    );
  } else {
    chapterRecords.set([]);
  }
}

export function getVariableDiff(
  before: Record<string, string | number | boolean>,
  after: Record<string, string | number | boolean>
): { key: string; before: string | number | boolean; after: string | number | boolean }[] {
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diff: { key: string; before: string | number | boolean; after: string | number | boolean }[] = [];
  for (const key of allKeys) {
    const bVal = before[key];
    const aVal = after[key];
    if (bVal !== aVal) {
      diff.push({ key, before: bVal ?? '(无)', after: aVal ?? '(无)' });
    }
  }
  return diff;
}

export function buildEndingComparison(): EndingComparisonEntry[] {
  const memory = get(globalMemory);
  return memory.playthroughHistory
    .filter(p => p.endingId)
    .map(p => {
      const ending = storyData.endings.find(e => e.id === p.endingId);
      return {
        endingId: p.endingId!,
        title: ending?.title || p.endingId!,
        isGood: ending?.isGood ?? false,
        playthroughNumber: p.playthrough,
        completedAt: p.completedAt,
        keyChoices: p.choicesMade.map(c => ({
          nodeId: c.nodeId,
          choiceId: c.choiceId,
          choiceText: c.choiceId
        })),
        finalVariables: {},
        cluesUnlocked: p.cluesUnlocked
      };
    });
}

export function getChapterNodeIds(chapterId: string): Set<string> {
  const chapter = chapters.find(c => c.id === chapterId);
  if (!chapter) return new Set();
  return collectChapterNodeIds(chapter);
}

export function getCurrentReplayProgress(): { current: number; total: number } {
  const session = get(replaySession);
  if (!session) return { current: 0, total: 0 };

  const chapter = chapters.find(c => c.id === session.chapterId);
  if (!chapter) return { current: 0, total: 0 };

  const total = collectChapterNodeIds(chapter).size;
  const chapterNodes = collectChapterNodeIds(chapter);
  const current = session.nodesVisited.filter(n => chapterNodes.has(n)).length;

  return { current, total };
}

export function restoreStateFromChapterSave(slot: ChapterSaveSlot, gameStateStore: typeof import('./store').gameState): void {
  const state: Partial<GameState> = {
    currentNodeId: slot.nodeId,
    dialogueIndex: slot.dialogueIndex,
    variables: { ...slot.variables }
  };
  gameStateStore.update(s => ({ ...s, ...state, dialogueIndex: 0 }));
}

import { writable, derived, get } from 'svelte/store';
import type { StoryNode, Danmaku, DialogueLine, AudioTrigger, SFXType } from '../types/game';
import { allNodes } from './editorStore';

export type ClipTab = 'slicing' | 'danmaku' | 'sfx' | 'export' | 'compare';

export interface ClipSegment {
  id: string;
  name: string;
  nodeId: string;
  startDialogueIndex: number;
  endDialogueIndex: number;
  description?: string;
  createdAt: number;
}

export interface ClipVersion {
  id: string;
  name: string;
  segments: ClipSegment[];
  danmakuOrder: Record<string, string[]>;
  sfxOverrides: Record<string, AudioTrigger[]>;
  createdAt: number;
  updatedAt: number;
}

export interface ClipEditorState {
  activeTab: ClipTab;
  selectedNodeId: string | null;
  segments: ClipSegment[];
  selectedSegmentId: string | null;
  versions: ClipVersion[];
  selectedVersionIds: string[];
  currentVersionId: string | null;
  previewPlayhead: number;
  isPlaying: boolean;
  danmakuFilter: {
    segmentId: string | null;
    showImportantOnly: boolean;
  };
}

function createInitialState(): ClipEditorState {
  return {
    activeTab: 'slicing',
    selectedNodeId: null,
    segments: [],
    selectedSegmentId: null,
    versions: [],
    selectedVersionIds: [],
    currentVersionId: null,
    previewPlayhead: 0,
    isPlaying: false,
    danmakuFilter: {
      segmentId: null,
      showImportantOnly: false
    }
  };
}

const initialState = createInitialState();
export const clipEditorState = writable<ClipEditorState>(initialState);

export const selectedNode = derived([clipEditorState, allNodes], ([$state, $nodes]) => {
  if (!$state.selectedNodeId) return null;
  return $nodes.find(n => n.id === $state.selectedNodeId) || null;
});

export const selectedSegment = derived(clipEditorState, $state => {
  if (!$state.selectedSegmentId) return null;
  return $state.segments.find(s => s.id === $state.selectedSegmentId) || null;
});

export const segmentDialogues = derived([selectedSegment, selectedNode], ([$segment, $node]) => {
  if (!$segment || !$node || !$node.dialogues) return [];
  return $node.dialogues.slice($segment.startDialogueIndex, $segment.endDialogueIndex + 1);
});

export const segmentDanmakus = derived([selectedSegment, selectedNode], ([$segment, $node]) => {
  if (!$segment || !$node || !$node.danmakus) return [];
  return $node.danmakus.filter(d => {
    const dIdx = d.dialogueIndex ?? 0;
    return dIdx >= $segment.startDialogueIndex && dIdx <= $segment.endDialogueIndex;
  });
});

export const currentVersion = derived(clipEditorState, $state => {
  if (!$state.currentVersionId) return null;
  return $state.versions.find(v => v.id === $state.currentVersionId) || null;
});

export const compareVersions = derived(clipEditorState, $state => {
  return $state.versions.filter(v => $state.selectedVersionIds.includes(v.id));
});

export function setClipTab(tab: ClipTab) {
  clipEditorState.update(s => ({ ...s, activeTab: tab }));
}

export function selectClipNode(nodeId: string | null) {
  clipEditorState.update(s => ({ ...s, selectedNodeId: nodeId, selectedSegmentId: null }));
}

export function addSegment(nodeId: string, startIdx: number, endIdx: number, name?: string): string {
  const node = get(allNodes).find(n => n.id === nodeId);
  if (!node) return '';
  
  const newId = `seg_${Date.now()}`;
  const defaultName = name || `${node.title || node.id} - 片段${get(clipEditorState).segments.length + 1}`;
  
  const newSegment: ClipSegment = {
    id: newId,
    name: defaultName,
    nodeId,
    startDialogueIndex: startIdx,
    endDialogueIndex: endIdx,
    createdAt: Date.now()
  };
  
  clipEditorState.update(s => ({
    ...s,
    segments: [...s.segments, newSegment],
    selectedSegmentId: newId
  }));
  
  return newId;
}

export function updateSegment(segmentId: string, updates: Partial<ClipSegment>) {
  clipEditorState.update(s => ({
    ...s,
    segments: s.segments.map(seg => 
      seg.id === segmentId ? { ...seg, ...updates } : seg
    )
  }));
}

export function deleteSegment(segmentId: string) {
  clipEditorState.update(s => {
    const newSegments = s.segments.filter(seg => seg.id !== segmentId);
    return {
      ...s,
      segments: newSegments,
      selectedSegmentId: s.selectedSegmentId === segmentId 
        ? (newSegments[0]?.id || null) 
        : s.selectedSegmentId
    };
  });
}

export function selectSegment(segmentId: string | null) {
  clipEditorState.update(s => ({ ...s, selectedSegmentId: segmentId }));
}

export function moveDanmaku(segmentId: string, danmakuId: string, newIndex: number) {
  clipEditorState.update(s => {
    const version = s.versions.find(v => v.id === s.currentVersionId);
    if (!version) return s;
    
    const segKey = segmentId;
    const currentOrder = version.danmakuOrder[segKey] || [];
    const oldIndex = currentOrder.indexOf(danmakuId);
    if (oldIndex === -1) return s;
    
    const newOrder = [...currentOrder];
    newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, danmakuId);
    
    const newVersions = s.versions.map(v => 
      v.id === s.currentVersionId 
        ? { 
            ...v, 
            danmakuOrder: { ...v.danmakuOrder, [segKey]: newOrder },
            updatedAt: Date.now()
          } 
        : v
    );
    
    return { ...s, versions: newVersions };
  });
}

export function createVersion(name: string): string {
  const newId = `ver_${Date.now()}`;
  const $state = get(clipEditorState);
  
  const newVersion: ClipVersion = {
    id: newId,
    name,
    segments: JSON.parse(JSON.stringify($state.segments)),
    danmakuOrder: {},
    sfxOverrides: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  clipEditorState.update(s => ({
    ...s,
    versions: [...s.versions, newVersion],
    currentVersionId: newId
  }));
  
  return newId;
}

export function updateVersion(versionId: string, updates: Partial<ClipVersion>) {
  clipEditorState.update(s => ({
    ...s,
    versions: s.versions.map(v => 
      v.id === versionId ? { ...v, ...updates, updatedAt: Date.now() } : v
    )
  }));
}

export function deleteVersion(versionId: string) {
  clipEditorState.update(s => {
    const newVersions = s.versions.filter(v => v.id !== versionId);
    return {
      ...s,
      versions: newVersions,
      currentVersionId: s.currentVersionId === versionId 
        ? (newVersions[newVersions.length - 1]?.id || null)
        : s.currentVersionId,
      selectedVersionIds: s.selectedVersionIds.filter(id => id !== versionId)
    };
  });
}

export function selectVersionForCompare(versionId: string, selected: boolean) {
  clipEditorState.update(s => ({
    ...s,
    selectedVersionIds: selected
      ? [...s.selectedVersionIds, versionId]
      : s.selectedVersionIds.filter(id => id !== versionId)
  }));
}

export function setCurrentVersion(versionId: string | null) {
  clipEditorState.update(s => ({ ...s, currentVersionId: versionId }));
}

export function togglePlay() {
  clipEditorState.update(s => ({ ...s, isPlaying: !s.isPlaying }));
}

export function setPlayhead(ms: number) {
  clipEditorState.update(s => ({ ...s, previewPlayhead: ms }));
}

export function setDanmakuFilter(filter: Partial<ClipEditorState['danmakuFilter']>) {
  clipEditorState.update(s => ({
    ...s,
    danmakuFilter: { ...s.danmakuFilter, ...filter }
  }));
}

export function exportClipVersion(versionId: string): string {
  const version = get(clipEditorState).versions.find(v => v.id === versionId);
  if (!version) return '';
  
  const nodesMap = new Map<string, StoryNode>();
  const $allNodes = get(allNodes);
  
  for (const segment of version.segments) {
    const origNode = $allNodes.find(n => n.id === segment.nodeId);
    if (!origNode) continue;
    
    const existingNode = nodesMap.get(segment.nodeId);
    const baseDialogues = existingNode?.dialogues || [];
    const baseDanmakus = existingNode?.danmakus || [];
    
    const segmentDialogues = origNode.dialogues?.slice(
      segment.startDialogueIndex, 
      segment.endDialogueIndex + 1
    ) || [];
    
    const segmentDanmakus = origNode.danmakus?.filter(d => {
      const dIdx = d.dialogueIndex ?? 0;
      return dIdx >= segment.startDialogueIndex && dIdx <= segment.endDialogueIndex;
    }).map(d => ({
      ...d,
      dialogueIndex: (d.dialogueIndex ?? 0) - segment.startDialogueIndex
    })) || [];
    
    nodesMap.set(segment.nodeId, {
      ...origNode,
      dialogues: [...baseDialogues, ...segmentDialogues],
      danmakus: [...baseDanmakus, ...segmentDanmakus]
    });
  }
  
  const exportData = {
    version: version.name,
    versionId: version.id,
    exportedAt: Date.now(),
    segments: version.segments,
    nodes: Array.from(nodesMap.values()),
    danmakuOrder: version.danmakuOrder,
    sfxOverrides: version.sfxOverrides
  };
  
  return JSON.stringify(exportData, null, 2);
}

export function importClipVersion(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    if (!data.version || !data.segments || !data.nodes) return false;
    
    const newId = `ver_${Date.now()}`;
    const newVersion: ClipVersion = {
      id: newId,
      name: `${data.version} (导入)`,
      segments: data.segments,
      danmakuOrder: data.danmakuOrder || {},
      sfxOverrides: data.sfxOverrides || {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    clipEditorState.update(s => ({
      ...s,
      versions: [...s.versions, newVersion],
      currentVersionId: newId
    }));
    
    return true;
  } catch (e) {
    return false;
  }
}

export function compareVersionsDiff(versionId1: string, versionId2: string) {
  const $state = get(clipEditorState);
  const v1 = $state.versions.find(v => v.id === versionId1);
  const v2 = $state.versions.find(v => v.id === versionId2);
  
  if (!v1 || !v2) return null;
  
  const diff = {
    segments: {
      added: [] as ClipSegment[],
      removed: [] as ClipSegment[],
      changed: [] as { id: string; field: string; old: any; new: any }[]
    },
    danmakuOrder: {
      changedSegments: [] as string[]
    },
    sfxOverrides: {
      changedSegments: [] as string[]
    }
  };
  
  const v1SegMap = new Map(v1.segments.map(s => [s.id, s]));
  const v2SegMap = new Map(v2.segments.map(s => [s.id, s]));
  
  for (const s of v1.segments) {
    if (!v2SegMap.has(s.id)) {
      diff.segments.removed.push(s);
    }
  }
  
  for (const s of v2.segments) {
    if (!v1SegMap.has(s.id)) {
      diff.segments.added.push(s);
    } else {
      const oldSeg = v1SegMap.get(s.id)!;
      const fields = ['name', 'nodeId', 'startDialogueIndex', 'endDialogueIndex'] as const;
      for (const field of fields) {
        if (oldSeg[field] !== s[field]) {
          diff.segments.changed.push({ id: s.id, field, old: oldSeg[field], new: s[field] });
        }
      }
    }
  }
  
  const allSegIds = new Set([...Object.keys(v1.danmakuOrder), ...Object.keys(v2.danmakuOrder)]);
  for (const segId of allSegIds) {
    const order1 = v1.danmakuOrder[segId] || [];
    const order2 = v2.danmakuOrder[segId] || [];
    if (order1.join(',') !== order2.join(',')) {
      diff.danmakuOrder.changedSegments.push(segId);
    }
  }
  
  return diff;
}

export function resetClipEditor() {
  clipEditorState.set(createInitialState());
}

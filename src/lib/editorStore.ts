import { writable, derived, get } from 'svelte/store';
import type {
  StoryNode,
  Danmaku,
  Ending,
  DialogueLine,
  AudioTrigger,
  Choice,
  BGMType,
  MoodType,
  SFXType,
  NextNodeBranch,
  StateCondition,
  TrustCondition,
  MemoryCondition,
  TrustEffect,
  CrewMemberId,
  TrustLevel
} from '../types/game';
import { nodes as originalNodes, endings as originalEndings } from '../data/story';
import { crewNodes as crewOriginalNodes, crewEndings as crewOriginalEndings } from '../data/crewStory';

export type EditorTab = 'nodes' | 'danmaku' | 'sfx' | 'endings' | 'preview';

export interface EditorState {
  activeTab: EditorTab;
  selectedNodeId: string | null;
  selectedDialogueIndex: number | null;
  selectedEndingId: string | null;
  editedNodes: Map<string, StoryNode>;
  editedEndings: Map<string, Ending>;
  danmakuFilter: {
    nodeId: string | null;
    dialogueIndex: number | null;
    showBackendOnly: boolean;
  };
  sfxFilter: {
    nodeId: string | null;
    dialogueIndex: number | null;
    sfxType: SFXType | null;
  };
  isDirty: boolean;
  showPreview: boolean;
  previewNodeId: string | null;
}

function createInitialState(): EditorState {
  const editedNodes = new Map<string, StoryNode>();
  const allOriginalNodes = [...originalNodes, ...crewOriginalNodes];
  allOriginalNodes.forEach(node => {
    editedNodes.set(node.id, JSON.parse(JSON.stringify(node)));
  });

  const editedEndings = new Map<string, Ending>();
  const allOriginalEndings = [...originalEndings, ...crewOriginalEndings];
  allOriginalEndings.forEach(ending => {
    editedEndings.set(ending.id, JSON.parse(JSON.stringify(ending)));
  });

  return {
    activeTab: 'nodes',
    selectedNodeId: allOriginalNodes[0]?.id || null,
    selectedDialogueIndex: null,
    selectedEndingId: allOriginalEndings[0]?.id || null,
    editedNodes,
    editedEndings,
    danmakuFilter: {
      nodeId: null,
      dialogueIndex: null,
      showBackendOnly: false
    },
    sfxFilter: {
      nodeId: null,
      dialogueIndex: null,
      sfxType: null
    },
    isDirty: false,
    showPreview: false,
    previewNodeId: null
  };
}

const initialState = createInitialState();

export const editorState = writable<EditorState>(initialState);

export const allNodes = derived(editorState, $state => {
  return Array.from($state.editedNodes.values()).sort((a, b) => {
    if (a.id === 'start') return -1;
    if (b.id === 'start') return 1;
    return a.id.localeCompare(b.id);
  });
});

export const allEndings = derived(editorState, $state => {
  return Array.from($state.editedEndings.values());
});

export const selectedNode = derived(editorState, $state => {
  if (!$state.selectedNodeId) return null;
  return $state.editedNodes.get($state.selectedNodeId) || null;
});

export const selectedEnding = derived(editorState, $state => {
  if (!$state.selectedEndingId) return null;
  return $state.editedEndings.get($state.selectedEndingId) || null;
});

export const nodeOptions = derived(allNodes, $nodes => {
  return $nodes.map(n => ({ id: n.id, label: `${n.id}${n.title ? ` - ${n.title}` : ''}` }));
});

export const sfxTypes: SFXType[] = [
  'click', 'select', 'warning', 'sonar', 'bubbles',
  'water_drip', 'water_flow', 'metal_creak', 'metal_crash',
  'hull_pressure', 'alarm', 'static', 'radio_noise',
  'keyboard', 'whisper', 'heartbeat', 'breath',
  'glass_crack', 'thunder', 'door_slam', 'notify'
];

export const moodTypes: MoodType[] = [
  'normal', 'tense', 'scared', 'calm', 'whisper', 'urgent', 'mystery', 'terrified'
];

export const bgmTypes: BGMType[] = ['deep', 'tense', 'calm', 'mystery'];

export function setActiveTab(tab: EditorTab) {
  editorState.update(s => ({ ...s, activeTab: tab }));
}

export function selectNode(nodeId: string) {
  editorState.update(s => ({ ...s, selectedNodeId: nodeId, selectedDialogueIndex: null }));
}

export function selectDialogue(index: number) {
  editorState.update(s => ({ ...s, selectedDialogueIndex: index }));
}

export function selectEnding(endingId: string) {
  editorState.update(s => ({ ...s, selectedEndingId: endingId }));
}

export function updateNode(nodeId: string, updates: Partial<StoryNode>) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node) return s;
    const newNode = { ...node, ...updates };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, newNode);
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function addNode(): string {
  const newId = `node_${Date.now()}`;
  const newNode: StoryNode = {
    id: newId,
    title: '新节点',
    dialogues: [{ speaker: '', text: '新对白' }]
  };
  editorState.update(s => {
    const newMap = new Map(s.editedNodes);
    newMap.set(newId, newNode);
    return { ...s, editedNodes: newMap, selectedNodeId: newId, selectedDialogueIndex: 0, isDirty: true };
  });
  return newId;
}

export function deleteNode(nodeId: string) {
  editorState.update(s => {
    if (s.editedNodes.size <= 1) return s;
    const newMap = new Map(s.editedNodes);
    newMap.delete(nodeId);
    const remainingIds = Array.from(newMap.keys());
    return {
      ...s,
      editedNodes: newMap,
      selectedNodeId: remainingIds[0] || null,
      selectedDialogueIndex: null,
      isDirty: true
    };
  });
}

export function addDialogue(nodeId: string) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node) return s;
    const newDialogues = [...node.dialogues, { speaker: '', text: '新对白' } as DialogueLine];
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, dialogues: newDialogues });
    return { ...s, editedNodes: newMap, selectedDialogueIndex: newDialogues.length - 1, isDirty: true };
  });
}

export function updateDialogue(nodeId: string, index: number, updates: Partial<DialogueLine>) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.dialogues[index]) return s;
    const newDialogues = [...node.dialogues];
    newDialogues[index] = { ...newDialogues[index], ...updates };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, dialogues: newDialogues });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function deleteDialogue(nodeId: string, index: number) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || node.dialogues.length <= 1) return s;
    const newDialogues = node.dialogues.filter((_, i) => i !== index);
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, dialogues: newDialogues });
    return { ...s, editedNodes: newMap, selectedDialogueIndex: null, isDirty: true };
  });
}

export function moveDialogue(nodeId: string, fromIndex: number, toIndex: number) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node) return s;
    const newDialogues = [...node.dialogues];
    const [removed] = newDialogues.splice(fromIndex, 1);
    newDialogues.splice(toIndex, 0, removed);
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, dialogues: newDialogues });
    return { ...s, editedNodes: newMap, selectedDialogueIndex: toIndex, isDirty: true };
  });
}

export function addDanmaku(nodeId: string) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node) return s;
    const newDanmakus = [...(node.danmakus || [])];
    const newDanmaku: Danmaku = {
      id: `d_${Date.now()}`,
      username: '新用户',
      content: '新弹幕',
      timestamp: 0,
      dialogueIndex: 0,
      relativeMs: 0,
      color: '#66ccff'
    };
    newDanmakus.push(newDanmaku);
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, danmakus: newDanmakus });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateDanmaku(nodeId: string, danmakuIndex: number, updates: Partial<Danmaku>) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.danmakus?.[danmakuIndex]) return s;
    const newDanmakus = [...node.danmakus];
    newDanmakus[danmakuIndex] = { ...newDanmakus[danmakuIndex], ...updates };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, danmakus: newDanmakus });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function deleteDanmaku(nodeId: string, danmakuIndex: number) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.danmakus) return s;
    const newDanmakus = node.danmakus.filter((_, i) => i !== danmakuIndex);
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, danmakus: newDanmakus });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function addChoice(nodeId: string) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node) return s;
    const newChoices = [...(node.choices || [])];
    newChoices.push({
      id: `c_${Date.now()}`,
      text: '新选项',
      nextNodeId: ''
    } as Choice);
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, choices: newChoices });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateChoice(nodeId: string, index: number, updates: Partial<Choice>) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.choices?.[index]) return s;
    const newChoices = [...node.choices];
    newChoices[index] = { ...newChoices[index], ...updates };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, choices: newChoices });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function deleteChoice(nodeId: string, index: number) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.choices) return s;
    const newChoices = node.choices.filter((_, i) => i !== index);
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, choices: newChoices });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function addSfx(nodeId: string, dialogueIndex: number) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.dialogues[dialogueIndex]) return s;
    const newDialogues = [...node.dialogues];
    const dialogue = { ...newDialogues[dialogueIndex] };
    const newSfx: AudioTrigger[] = [...(dialogue.sfx || [])];
    newSfx.push({ sfx: 'click', delay: 0, volume: 0.8 });
    dialogue.sfx = newSfx;
    newDialogues[dialogueIndex] = dialogue;
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, dialogues: newDialogues });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateSfx(nodeId: string, dialogueIndex: number, sfxIndex: number, updates: Partial<AudioTrigger>) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.dialogues[dialogueIndex]?.sfx?.[sfxIndex]) return s;
    const newDialogues = [...node.dialogues];
    const dialogue = { ...newDialogues[dialogueIndex] };
    const newSfx = [...(dialogue.sfx || [])];
    newSfx[sfxIndex] = { ...newSfx[sfxIndex], ...updates };
    dialogue.sfx = newSfx;
    newDialogues[dialogueIndex] = dialogue;
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, dialogues: newDialogues });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function deleteSfx(nodeId: string, dialogueIndex: number, sfxIndex: number) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node || !node.dialogues[dialogueIndex]) return s;
    const newDialogues = [...node.dialogues];
    const dialogue = { ...newDialogues[dialogueIndex] };
    const newSfx = (dialogue.sfx || []).filter((_, i) => i !== sfxIndex);
    dialogue.sfx = newSfx.length > 0 ? newSfx : undefined;
    newDialogues[dialogueIndex] = dialogue;
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, dialogues: newDialogues });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateEnding(endingId: string, updates: Partial<Ending>) {
  editorState.update(s => {
    const ending = s.editedEndings.get(endingId);
    if (!ending) return s;
    const newEnding = { ...ending, ...updates };
    const newMap = new Map(s.editedEndings);
    newMap.set(endingId, newEnding);
    return { ...s, editedEndings: newMap, isDirty: true };
  });
}

export function addEnding(): string {
  const newId = `ending_${Date.now()}`;
  const newEnding: Ending = {
    id: newId,
    title: '新结局',
    description: '结局描述',
    isGood: false
  };
  editorState.update(s => {
    const newMap = new Map(s.editedEndings);
    newMap.set(newId, newEnding);
    return { ...s, editedEndings: newMap, selectedEndingId: newId, isDirty: true };
  });
  return newId;
}

export function deleteEnding(endingId: string) {
  editorState.update(s => {
    if (s.editedEndings.size <= 1) return s;
    const newMap = new Map(s.editedEndings);
    newMap.delete(endingId);
    const remainingIds = Array.from(newMap.keys());
    return {
      ...s,
      editedEndings: newMap,
      selectedEndingId: remainingIds[0] || null,
      isDirty: true
    };
  });
}

export function setDanmakuFilter(filter: Partial<EditorState['danmakuFilter']>) {
  editorState.update(s => ({
    ...s,
    danmakuFilter: { ...s.danmakuFilter, ...filter }
  }));
}

export function setSfxFilter(filter: Partial<EditorState['sfxFilter']>) {
  editorState.update(s => ({
    ...s,
    sfxFilter: { ...s.sfxFilter, ...filter }
  }));
}

export function setPreviewNode(nodeId: string | null) {
  editorState.update(s => ({ ...s, previewNodeId: nodeId, showPreview: nodeId !== null }));
}

export function togglePreview() {
  editorState.update(s => ({ ...s, showPreview: !s.showPreview }));
}

export function exportData(): { nodes: StoryNode[]; endings: Ending[] } {
  const $state = get(editorState);
  return {
    nodes: Array.from($state.editedNodes.values()),
    endings: Array.from($state.editedEndings.values())
  };
}

export function exportAsJSON(): string {
  return JSON.stringify(exportData(), null, 2);
}

export function importData(data: { nodes: StoryNode[]; endings: Ending[] }) {
  if (!data.nodes || !data.endings) return false;
  const nodeMap = new Map<string, StoryNode>();
  data.nodes.forEach(n => nodeMap.set(n.id, JSON.parse(JSON.stringify(n))));
  const endingMap = new Map<string, Ending>();
  data.endings.forEach(e => endingMap.set(e.id, JSON.parse(JSON.stringify(e))));
  editorState.update(s => ({
    ...s,
    editedNodes: nodeMap,
    editedEndings: endingMap,
    selectedNodeId: data.nodes[0]?.id || null,
    selectedEndingId: data.endings[0]?.id || null,
    isDirty: false
  }));
  return true;
}

export function resetToOriginal() {
  editorState.set(createInitialState());
}

export function markClean() {
  editorState.update(s => ({ ...s, isDirty: false }));
}

export function addBranch(nodeId: string) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node) return s;
    const branches = [...(node.nextNodeBranches || [])];
    branches.push({ nextNodeId: '', priority: 0 });
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, nextNodeBranches: branches });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateBranch(nodeId: string, branchIndex: number, updates: Partial<NextNodeBranch>) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node?.nextNodeBranches?.[branchIndex]) return s;
    const branches = [...node.nextNodeBranches];
    branches[branchIndex] = { ...branches[branchIndex], ...updates };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, nextNodeBranches: branches });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function deleteBranch(nodeId: string, branchIndex: number) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node?.nextNodeBranches) return s;
    const branches = node.nextNodeBranches.filter((_, i) => i !== branchIndex);
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, nextNodeBranches: branches.length > 0 ? branches : undefined });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateChoiceCondition(nodeId: string, choiceIndex: number, condition: StateCondition | undefined) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node?.choices?.[choiceIndex]) return s;
    const choices = [...node.choices];
    choices[choiceIndex] = { ...choices[choiceIndex], condition };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, choices });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateChoiceTrustCondition(nodeId: string, choiceIndex: number, trustCondition: TrustCondition | undefined) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node?.choices?.[choiceIndex]) return s;
    const choices = [...node.choices];
    choices[choiceIndex] = { ...choices[choiceIndex], trustCondition };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, choices });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateChoiceMemoryCondition(nodeId: string, choiceIndex: number, memoryCondition: MemoryCondition | undefined) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node?.choices?.[choiceIndex]) return s;
    const choices = [...node.choices];
    choices[choiceIndex] = { ...choices[choiceIndex], memoryCondition };
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, choices });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export function updateNodeTrustEffect(nodeId: string, trustEffect: TrustEffect | undefined) {
  editorState.update(s => {
    const node = s.editedNodes.get(nodeId);
    if (!node) return s;
    const newMap = new Map(s.editedNodes);
    newMap.set(nodeId, { ...node, trustEffect });
    return { ...s, editedNodes: newMap, isDirty: true };
  });
}

export const crewMembers: { id: CrewMemberId; name: string; role: string }[] = [
  { id: 'ahai', name: '阿海', role: '主播' },
  { id: 'xiaolin', name: '小林', role: '摄影师' },
  { id: 'laozhou', name: '老周', role: '工程师' },
  { id: 'suboshi', name: '苏博士', role: '生物学家' }
];

export const trustLevels: TrustLevel[] = ['hostile', 'distrust', 'neutral', 'trust', 'loyal'];

export const trustLevelLabels: Record<TrustLevel, string> = {
  hostile: '敌对',
  distrust: '怀疑',
  neutral: '中立',
  trust: '信任',
  loyal: '忠诚'
};

export function collectAllVariables(): string[] {
  const $state = get(editorState);
  const varSet = new Set<string>();
  $state.editedNodes.forEach(node => {
    if (node.effects) Object.keys(node.effects).forEach(k => varSet.add(k));
    if (node.choices) node.choices.forEach(c => {
      if (c.effect) Object.keys(c.effect).forEach(k => varSet.add(k));
      if (c.condition) Object.keys(c.condition).forEach(k => varSet.add(k));
    });
    if (node.nextNodeBranches) node.nextNodeBranches.forEach(b => {
      if (b.condition) Object.keys(b.condition).forEach(k => varSet.add(k));
    });
  });
  return Array.from(varSet).sort();
}

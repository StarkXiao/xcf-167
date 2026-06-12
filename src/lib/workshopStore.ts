import { writable, derived, get } from 'svelte/store';
import type {
  WorkshopState,
  WorkshopTab,
  WorkshopCreation,
  WorkshopDanmakuTemplate,
  WorkshopSfxTemplate,
  WorkshopNodeTemplate,
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  WorkshopSharePayload,
  StoryNode,
  Ending,
  Danmaku,
  DialogueLine,
  Choice,
  AudioTrigger,
  NextNodeBranch,
  SFXType,
  MoodType,
  BGMType
} from '../types/game';

const STORAGE_KEY = 'deep-sea-workshop-creations';

function createEmptyCreation(): WorkshopCreation {
  return {
    id: `creation_${Date.now()}`,
    title: '未命名创作',
    author: '匿名分析师',
    description: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    nodes: [],
    endings: [],
    danmakuTemplates: [],
    sfxTemplates: []
  };
}

function loadSavedCreations(): WorkshopCreation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCreationsToStorage(creations: WorkshopCreation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(creations));
  } catch {}
}

const initialState: WorkshopState = {
  isOpen: false,
  activeTab: 'nodes',
  currentCreation: null,
  savedCreations: loadSavedCreations(),
  validationResult: null,
  isValidating: false,
  isTrialing: false,
  isSharing: false,
  shareCode: null,
  selectedNodeId: null,
  selectedDanmakuTemplateId: null,
  selectedSfxTemplateId: null
};

export const workshopState = writable<WorkshopState>(initialState);

export const currentCreation = derived(workshopState, $s => $s.currentCreation);

export const currentNodes = derived(workshopState, $s => $s.currentCreation?.nodes || []);

export const currentEndings = derived(workshopState, $s => $s.currentCreation?.endings || []);

export const currentDanmakuTemplates = derived(workshopState, $s => $s.currentCreation?.danmakuTemplates || []);

export const currentSfxTemplates = derived(workshopState, $s => $s.currentCreation?.sfxTemplates || []);

export const selectedNode = derived(workshopState, $s => {
  if (!$s.currentCreation || !$s.selectedNodeId) return null;
  return $s.currentCreation.nodes.find(n => n.id === $s.selectedNodeId) || null;
});

export const savedCreations = derived(workshopState, $s => $s.savedCreations);

export const validationResult = derived(workshopState, $s => $s.validationResult);

export const nodeTemplates: WorkshopNodeTemplate[] = [
  {
    id: 'tpl_dialogue',
    type: 'dialogue',
    label: '对话节点',
    description: '包含角色对话的剧情节点',
    defaultData: {
      title: '【新对话】',
      background: 'cockpit',
      bgm: 'calm',
      dialogues: [
        { speaker: '角色名', text: '对话内容...' }
      ]
    }
  },
  {
    id: 'tpl_choice',
    type: 'choice',
    label: '抉择节点',
    description: '包含玩家选项的分支节点',
    defaultData: {
      title: '【抉择时刻】',
      background: 'dark',
      bgm: 'tense',
      dialogues: [
        { speaker: '', text: '你需要做出选择...', mood: 'tense' as MoodType }
      ],
      choices: [
        { id: 'c_1', text: '选项一', nextNodeId: '' },
        { id: 'c_2', text: '选项二', nextNodeId: '' }
      ]
    }
  },
  {
    id: 'tpl_branch',
    type: 'branch',
    label: '条件分支节点',
    description: '根据条件自动跳转的分支节点',
    defaultData: {
      title: '【自动分支】',
      background: 'damage',
      bgm: 'mystery',
      dialogues: [
        { speaker: '系统', text: '条件判定中...', mood: 'calm' as MoodType, autoAdvance: true, autoAdvanceDelay: 1500 }
      ],
      nextNodeBranches: [
        { nextNodeId: '', priority: 10 }
      ]
    }
  },
  {
    id: 'tpl_ending',
    type: 'ending',
    label: '结局节点',
    description: '故事结局',
    defaultData: {
      title: '【结局】',
      background: 'glitch',
      dialogues: [
        { speaker: '', text: '一切归于沉寂...' }
      ],
      isEnding: true,
      endingId: '',
      endingTitle: '新结局',
      endingDescription: '结局描述...'
    }
  },
  {
    id: 'tpl_checkpoint',
    type: 'checkpoint',
    label: '回溯检查点',
    description: '可回溯的关键节点',
    defaultData: {
      title: '【关键节点】',
      background: 'descent',
      bgm: 'mystery',
      isRewindCheckpoint: true,
      rewindCheckpointLabel: '检查点',
      dialogues: [
        { speaker: '', text: '重要事件发生了...' }
      ]
    }
  }
];

export const danmakuPresetTemplates: WorkshopDanmakuTemplate[] = [
  {
    id: 'dm_tpl_viewer',
    name: '观众互动',
    description: '模拟直播间观众弹幕氛围',
    danmakus: [
      { username: '前排占座', content: '来了来了！', timestamp: 0, dialogueIndex: 0, relativeMs: 200, color: '#66ccff' },
      { username: '吃瓜群众', content: '前排围观', timestamp: 0, dialogueIndex: 0, relativeMs: 600, color: '#ffcc00' },
      { username: '老粉', content: '终于更新了', timestamp: 0, dialogueIndex: 0, relativeMs: 1200, color: '#99ff99' },
      { username: '潜水员', content: '...', timestamp: 0, dialogueIndex: 0, relativeMs: 2000 },
      { username: '弹幕护体', content: '弹幕护体！', timestamp: 0, dialogueIndex: 0, relativeMs: 3000, color: '#ff9999' }
    ]
  },
  {
    id: 'dm_tpl_tense',
    name: '紧张氛围',
    description: '危险场景下的弹幕反应',
    danmakus: [
      { username: '害怕的人', content: '我不敢看了', timestamp: 0, dialogueIndex: 0, relativeMs: 300, color: '#9999ff' },
      { username: '冷静分析', content: '等等，这不对劲', timestamp: 0, dialogueIndex: 0, relativeMs: 800, color: '#ffcc00', isImportant: true },
      { username: '慌了', content: '快跑！！！', timestamp: 0, dialogueIndex: 0, relativeMs: 1500, color: '#ff6666', isImportant: true },
      { username: '目击者', content: '我看到了！！', timestamp: 0, dialogueIndex: 0, relativeMs: 2200, color: '#ff6666' }
    ]
  },
  {
    id: 'dm_tpl_hint',
    name: '知情人暗示',
    description: '隐藏线索的弹幕模板',
    danmakus: [
      { username: '匿名用户', content: '别相信他们说的', timestamp: 0, dialogueIndex: 0, relativeMs: 1000, color: '#ff0000', isImportant: true },
      { username: '内部人士', content: '这只是一场实验', timestamp: 0, dialogueIndex: 0, relativeMs: 3000, color: '#00ffcc', isBackendOnly: true },
      { username: '系统消息', content: '数据校验异常', timestamp: 0, dialogueIndex: 0, relativeMs: 4500, color: '#00ffcc', isBackendOnly: true }
    ]
  }
];

export const sfxPresetTemplates: WorkshopSfxTemplate[] = [
  {
    id: 'sfx_tpl_sonar_ping',
    name: '声呐探测',
    description: '声呐系统的探测音效序列',
    triggers: [
      { sfx: 'sonar', delay: 0, volume: 0.8 },
      { sfx: 'sonar', delay: 800, volume: 0.6 },
      { sfx: 'sonar', delay: 1600, volume: 0.5 }
    ]
  },
  {
    id: 'sfx_tpl_hull_alert',
    name: '船体警报',
    description: '船体受压的紧张音效序列',
    triggers: [
      { sfx: 'metal_creak', delay: 0, volume: 0.6 },
      { sfx: 'hull_pressure', delay: 400, volume: 0.7 },
      { sfx: 'alarm', delay: 1000, volume: 0.5 },
      { sfx: 'heartbeat', delay: 1500, volume: 0.6 }
    ]
  },
  {
    id: 'sfx_tpl_signal_break',
    name: '信号中断',
    description: '信号逐渐恶化的音效序列',
    triggers: [
      { sfx: 'static', delay: 0, volume: 0.3 },
      { sfx: 'radio_noise', delay: 500, volume: 0.5 },
      { sfx: 'static', delay: 1200, volume: 0.7 },
      { sfx: 'static', delay: 2000, volume: 0.9 },
      { sfx: 'alarm', delay: 2500, volume: 0.4 }
    ]
  },
  {
    id: 'sfx_tpl_calm_descent',
    name: '平静下潜',
    description: '安全下潜时的环境音效',
    triggers: [
      { sfx: 'bubbles', delay: 0, volume: 0.4 },
      { sfx: 'water_drip', delay: 1500, volume: 0.3 },
      { sfx: 'bubbles', delay: 3000, volume: 0.3 }
    ]
  }
];

export function openWorkshop(): void {
  workshopState.update(s => ({ ...s, isOpen: true }));
}

export function closeWorkshop(): void {
  workshopState.update(s => ({ ...s, isOpen: false }));
}

export function setActiveTab(tab: WorkshopTab): void {
  workshopState.update(s => ({ ...s, activeTab: tab }));
}

export function newCreation(): void {
  const creation = createEmptyCreation();
  workshopState.update(s => ({
    ...s,
    currentCreation: creation,
    selectedNodeId: null,
    selectedDanmakuTemplateId: null,
    selectedSfxTemplateId: null,
    validationResult: null,
    shareCode: null,
    activeTab: 'nodes'
  }));
}

export function loadCreation(id: string): void {
  const state = get(workshopState);
  const creation = state.savedCreations.find(c => c.id === id);
  if (creation) {
    workshopState.update(s => ({
      ...s,
      currentCreation: JSON.parse(JSON.stringify(creation)),
      selectedNodeId: null,
      validationResult: null,
      shareCode: null,
      activeTab: 'nodes'
    }));
  }
}

export function saveCreation(): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const updated = {
      ...s.currentCreation,
      updatedAt: Date.now(),
      version: s.currentCreation.version + 1
    };
    const existing = s.savedCreations.findIndex(c => c.id === updated.id);
    const newSaved = [...s.savedCreations];
    if (existing >= 0) {
      newSaved[existing] = updated;
    } else {
      newSaved.push(updated);
    }
    saveCreationsToStorage(newSaved);
    return {
      ...s,
      currentCreation: updated,
      savedCreations: newSaved
    };
  });
}

export function deleteCreation(id: string): void {
  workshopState.update(s => {
    const newSaved = s.savedCreations.filter(c => c.id !== id);
    saveCreationsToStorage(newSaved);
    const newCurrent = s.currentCreation?.id === id ? null : s.currentCreation;
    return {
      ...s,
      savedCreations: newSaved,
      currentCreation: newCurrent,
      selectedNodeId: newCurrent ? s.selectedNodeId : null
    };
  });
}

export function updateCreationMeta(field: 'title' | 'author' | 'description', value: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: { ...s.currentCreation, [field]: value, updatedAt: Date.now() }
    };
  });
}

export function addNodeFromTemplate(templateId: string): string {
  const template = nodeTemplates.find(t => t.id === templateId);
  if (!template) return '';

  const newId = `ws_node_${Date.now()}`;
  const newNode: StoryNode = {
    id: newId,
    ...template.defaultData,
    dialogues: template.defaultData.dialogues
      ? template.defaultData.dialogues.map(d => ({ ...d }))
      : [{ speaker: '', text: '新对白' }],
    choices: template.defaultData.choices
      ? template.defaultData.choices.map(c => ({ ...c, id: `${c.id}_${Date.now()}` }))
      : undefined
  };

  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        nodes: [...s.currentCreation.nodes, newNode],
        updatedAt: Date.now()
      },
      selectedNodeId: newId
    };
  });
  return newId;
}

export function selectNode(nodeId: string | null): void {
  workshopState.update(s => ({ ...s, selectedNodeId: nodeId }));
}

export function updateNode(nodeId: string, updates: Partial<StoryNode>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n =>
      n.id === nodeId ? { ...n, ...updates } : n
    );
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function deleteNode(nodeId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        nodes: s.currentCreation.nodes.filter(n => n.id !== nodeId),
        updatedAt: Date.now()
      },
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId
    };
  });
}

export function addDialogueToNode(nodeId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId) return n;
      return { ...n, dialogues: [...n.dialogues, { speaker: '', text: '新对白' } as DialogueLine] };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function updateDialogue(nodeId: string, index: number, updates: Partial<DialogueLine>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.dialogues[index]) return n;
      const dialogues = [...n.dialogues];
      dialogues[index] = { ...dialogues[index], ...updates };
      return { ...n, dialogues };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function deleteDialogue(nodeId: string, index: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || n.dialogues.length <= 1) return n;
      return { ...n, dialogues: n.dialogues.filter((_, i) => i !== index) };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function addChoiceToNode(nodeId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId) return n;
      const choices = [...(n.choices || []), { id: `c_ws_${Date.now()}`, text: '新选项', nextNodeId: '' } as Choice];
      return { ...n, choices };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function updateChoice(nodeId: string, choiceIndex: number, updates: Partial<Choice>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.choices?.[choiceIndex]) return n;
      const choices = [...n.choices];
      choices[choiceIndex] = { ...choices[choiceIndex], ...updates };
      return { ...n, choices };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function deleteChoice(nodeId: string, choiceIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.choices) return n;
      return { ...n, choices: n.choices.filter((_, i) => i !== choiceIndex) };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function addBranchToNode(nodeId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId) return n;
      const branches = [...(n.nextNodeBranches || []), { nextNodeId: '', priority: (n.nextNodeBranches?.length || 0) + 1 } as NextNodeBranch];
      return { ...n, nextNodeBranches: branches };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function updateBranchInNode(nodeId: string, branchIndex: number, updates: Partial<NextNodeBranch>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.nextNodeBranches?.[branchIndex]) return n;
      const branches = [...n.nextNodeBranches];
      branches[branchIndex] = { ...branches[branchIndex], ...updates };
      return { ...n, nextNodeBranches: branches };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function deleteBranchFromNode(nodeId: string, branchIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.nextNodeBranches) return n;
      const branches = n.nextNodeBranches.filter((_, i) => i !== branchIndex);
      return { ...n, nextNodeBranches: branches.length > 0 ? branches : undefined };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function addDanmakuToNode(nodeId: string, dialogueIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId) return n;
      const danmakus = [...(n.danmakus || [])];
      danmakus.push({
        id: `dm_ws_${Date.now()}`,
        username: '观众',
        content: '弹幕内容',
        timestamp: 0,
        dialogueIndex,
        relativeMs: 500 + Math.random() * 2000,
        color: '#66ccff'
      });
      return { ...n, danmakus };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function applyDanmakuTemplate(nodeId: string, templateId: string): void {
  const template = danmakuPresetTemplates.find(t => t.id === templateId);
  if (!template) return;

  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId) return n;
      const newDanmakus: Danmaku[] = template.danmakus.map((d, i) => ({
        ...d,
        id: `dm_ws_${Date.now()}_${i}`
      }));
      return { ...n, danmakus: [...(n.danmakus || []), ...newDanmakus] };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function updateDanmakuInNode(nodeId: string, danmakuIndex: number, updates: Partial<Danmaku>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.danmakus?.[danmakuIndex]) return n;
      const danmakus = [...n.danmakus];
      danmakus[danmakuIndex] = { ...danmakus[danmakuIndex], ...updates };
      return { ...n, danmakus };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function deleteDanmakuFromNode(nodeId: string, danmakuIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.danmakus) return n;
      return { ...n, danmakus: n.danmakus.filter((_, i) => i !== danmakuIndex) };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function addSfxToDialogue(nodeId: string, dialogueIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.dialogues[dialogueIndex]) return n;
      const dialogues = [...n.dialogues];
      const d = { ...dialogues[dialogueIndex] };
      d.sfx = [...(d.sfx || []), { sfx: 'click' as SFXType, delay: 0, volume: 0.8 }];
      dialogues[dialogueIndex] = d;
      return { ...n, dialogues };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function applySfxTemplate(nodeId: string, dialogueIndex: number, templateId: string): void {
  const template = sfxPresetTemplates.find(t => t.id === templateId);
  if (!template) return;

  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.dialogues[dialogueIndex]) return n;
      const dialogues = [...n.dialogues];
      const d = { ...dialogues[dialogueIndex] };
      d.sfx = [...(d.sfx || []), ...template.triggers.map(t => ({ ...t }))];
      dialogues[dialogueIndex] = d;
      return { ...n, dialogues };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function updateSfxInDialogue(nodeId: string, dialogueIndex: number, sfxIndex: number, updates: Partial<AudioTrigger>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.dialogues[dialogueIndex]?.sfx?.[sfxIndex]) return n;
      const dialogues = [...n.dialogues];
      const d = { ...dialogues[dialogueIndex] };
      const sfxList = [...(d.sfx || [])];
      sfxList[sfxIndex] = { ...sfxList[sfxIndex], ...updates };
      d.sfx = sfxList;
      dialogues[dialogueIndex] = d;
      return { ...n, dialogues };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function deleteSfxFromDialogue(nodeId: string, dialogueIndex: number, sfxIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.dialogues[dialogueIndex]) return n;
      const dialogues = [...n.dialogues];
      const d = { ...dialogues[dialogueIndex] };
      const sfxList = (d.sfx || []).filter((_, i) => i !== sfxIndex);
      d.sfx = sfxList.length > 0 ? sfxList : undefined;
      dialogues[dialogueIndex] = d;
      return { ...n, dialogues };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function addEnding(): string {
  const newId = `ws_ending_${Date.now()}`;
  const newEnding: Ending = {
    id: newId,
    title: '新结局',
    description: '结局描述',
    isGood: false
  };
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        endings: [...s.currentCreation.endings, newEnding],
        updatedAt: Date.now()
      }
    };
  });
  return newId;
}

export function updateEnding(endingId: string, updates: Partial<Ending>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const endings = s.currentCreation.endings.map(e =>
      e.id === endingId ? { ...e, ...updates } : e
    );
    return {
      ...s,
      currentCreation: { ...s.currentCreation, endings, updatedAt: Date.now() }
    };
  });
}

export function deleteEnding(endingId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        endings: s.currentCreation.endings.filter(e => e.id !== endingId),
        updatedAt: Date.now()
      }
    };
  });
}

export function addCustomDanmakuTemplate(name: string, description: string): void {
  const tpl: WorkshopDanmakuTemplate = {
    id: `dm_tpl_custom_${Date.now()}`,
    name,
    description,
    danmakus: [
      { username: '模板用户', content: '模板弹幕内容', timestamp: 0, dialogueIndex: 0, relativeMs: 0, color: '#66ccff' }
    ]
  };
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        danmakuTemplates: [...s.currentCreation.danmakuTemplates, tpl],
        updatedAt: Date.now()
      }
    };
  });
}

export function addCustomSfxTemplate(name: string, description: string): void {
  const tpl: WorkshopSfxTemplate = {
    id: `sfx_tpl_custom_${Date.now()}`,
    name,
    description,
    triggers: [{ sfx: 'click' as SFXType, delay: 0, volume: 0.8 }]
  };
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        sfxTemplates: [...s.currentCreation.sfxTemplates, tpl],
        updatedAt: Date.now()
      }
    };
  });
}

export function updateCustomDanmakuTemplate(templateId: string, updates: Partial<WorkshopDanmakuTemplate>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const danmakuTemplates = s.currentCreation.danmakuTemplates.map(t =>
      t.id === templateId ? { ...t, ...updates } : t
    );
    return {
      ...s,
      currentCreation: { ...s.currentCreation, danmakuTemplates, updatedAt: Date.now() }
    };
  });
}

export function deleteCustomDanmakuTemplate(templateId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        danmakuTemplates: s.currentCreation.danmakuTemplates.filter(t => t.id !== templateId),
        updatedAt: Date.now()
      },
      selectedDanmakuTemplateId: s.selectedDanmakuTemplateId === templateId ? null : s.selectedDanmakuTemplateId
    };
  });
}

export function addDanmakuToTemplate(templateId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const danmakuTemplates = s.currentCreation.danmakuTemplates.map(t => {
      if (t.id !== templateId) return t;
      return { ...t, danmakus: [...t.danmakus, { username: '观众', content: '新弹幕', timestamp: 0, dialogueIndex: 0, relativeMs: Math.random() * 3000, color: '#66ccff' }] };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, danmakuTemplates, updatedAt: Date.now() }
    };
  });
}

export function updateDanmakuInTemplate(templateId: string, danmakuIndex: number, updates: Partial<Omit<Danmaku, 'id'>>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const danmakuTemplates = s.currentCreation.danmakuTemplates.map(t => {
      if (t.id !== templateId || !t.danmakus[danmakuIndex]) return t;
      const danmakus = [...t.danmakus];
      danmakus[danmakuIndex] = { ...danmakus[danmakuIndex], ...updates };
      return { ...t, danmakus };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, danmakuTemplates, updatedAt: Date.now() }
    };
  });
}

export function deleteDanmakuFromTemplate(templateId: string, danmakuIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const danmakuTemplates = s.currentCreation.danmakuTemplates.map(t => {
      if (t.id !== templateId) return t;
      return { ...t, danmakus: t.danmakus.filter((_, i) => i !== danmakuIndex) };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, danmakuTemplates, updatedAt: Date.now() }
    };
  });
}

export function applyCustomDanmakuTemplate(nodeId: string, templateId: string): void {
  const state = get(workshopState);
  if (!state.currentCreation) return;
  const template = state.currentCreation.danmakuTemplates.find(t => t.id === templateId);
  if (!template) return;

  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId) return n;
      const newDanmakus: Danmaku[] = template.danmakus.map((d, i) => ({
        ...d,
        id: `dm_ws_${Date.now()}_${i}`
      }));
      return { ...n, danmakus: [...(n.danmakus || []), ...newDanmakus] };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function updateCustomSfxTemplate(templateId: string, updates: Partial<WorkshopSfxTemplate>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const sfxTemplates = s.currentCreation.sfxTemplates.map(t =>
      t.id === templateId ? { ...t, ...updates } : t
    );
    return {
      ...s,
      currentCreation: { ...s.currentCreation, sfxTemplates, updatedAt: Date.now() }
    };
  });
}

export function deleteCustomSfxTemplate(templateId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    return {
      ...s,
      currentCreation: {
        ...s.currentCreation,
        sfxTemplates: s.currentCreation.sfxTemplates.filter(t => t.id !== templateId),
        updatedAt: Date.now()
      },
      selectedSfxTemplateId: s.selectedSfxTemplateId === templateId ? null : s.selectedSfxTemplateId
    };
  });
}

export function addTriggerToSfxTemplate(templateId: string): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const sfxTemplates = s.currentCreation.sfxTemplates.map(t => {
      if (t.id !== templateId) return t;
      return { ...t, triggers: [...t.triggers, { sfx: 'click' as SFXType, delay: 0, volume: 0.8 }] };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, sfxTemplates, updatedAt: Date.now() }
    };
  });
}

export function updateTriggerInSfxTemplate(templateId: string, triggerIndex: number, updates: Partial<AudioTrigger>): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const sfxTemplates = s.currentCreation.sfxTemplates.map(t => {
      if (t.id !== templateId || !t.triggers[triggerIndex]) return t;
      const triggers = [...t.triggers];
      triggers[triggerIndex] = { ...triggers[triggerIndex], ...updates };
      return { ...t, triggers };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, sfxTemplates, updatedAt: Date.now() }
    };
  });
}

export function deleteTriggerFromSfxTemplate(templateId: string, triggerIndex: number): void {
  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const sfxTemplates = s.currentCreation.sfxTemplates.map(t => {
      if (t.id !== templateId) return t;
      return { ...t, triggers: t.triggers.filter((_, i) => i !== triggerIndex) };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, sfxTemplates, updatedAt: Date.now() }
    };
  });
}

export function applyCustomSfxTemplate(nodeId: string, dialogueIndex: number, templateId: string): void {
  const state = get(workshopState);
  if (!state.currentCreation) return;
  const template = state.currentCreation.sfxTemplates.find(t => t.id === templateId);
  if (!template) return;

  workshopState.update(s => {
    if (!s.currentCreation) return s;
    const nodes = s.currentCreation.nodes.map(n => {
      if (n.id !== nodeId || !n.dialogues[dialogueIndex]) return n;
      const dialogues = [...n.dialogues];
      const d = { ...dialogues[dialogueIndex] };
      d.sfx = [...(d.sfx || []), ...template.triggers.map(t => ({ ...t }))];
      dialogues[dialogueIndex] = d;
      return { ...n, dialogues };
    });
    return {
      ...s,
      currentCreation: { ...s.currentCreation, nodes, updatedAt: Date.now() }
    };
  });
}

export function selectDanmakuTemplate(templateId: string | null): void {
  workshopState.update(s => ({ ...s, selectedDanmakuTemplateId: templateId }));
}

export function selectSfxTemplate(templateId: string | null): void {
  workshopState.update(s => ({ ...s, selectedSfxTemplateId: templateId }));
}

export function validateCreation(): ValidationResult {
  const state = get(workshopState);
  const creation = state.currentCreation;
  if (!creation) {
    return {
      isValid: false,
      issues: [{ severity: 'error', message: '没有正在编辑的创作' }],
      stats: { nodeCount: 0, dialogueCount: 0, danmakuCount: 0, choiceCount: 0, endingCount: 0, orphanNodes: [], unreachableNodes: [] }
    };
  }

  const issues: ValidationIssue[] = [];
  const nodeIds = new Set(creation.nodes.map(n => n.id));
  const allTargetIds = new Set<string>();
  const referencedNodeIds = new Set<string>();

  if (creation.nodes.length === 0) {
    issues.push({ severity: 'error', message: '至少需要一个剧情节点' });
  }

  if (creation.endings.length === 0) {
    issues.push({ severity: 'warning', message: '建议添加至少一个结局定义' });
  }

  if (!creation.title.trim()) {
    issues.push({ severity: 'error', field: 'title', message: '创作标题不能为空' });
  }

  let hasStartNode = false;

  for (const node of creation.nodes) {
    if (!node.id.trim()) {
      issues.push({ severity: 'error', nodeId: node.id, field: 'id', message: `节点ID不能为空` });
    }

    if (node.id === 'start' || node.dialogues.some(d => d.text.includes('开始'))) {
      hasStartNode = true;
    }

    if (node.dialogues.length === 0) {
      issues.push({ severity: 'error', nodeId: node.id, field: 'dialogues', message: `节点 "${node.id}" 没有任何对白` });
    }

    for (let i = 0; i < node.dialogues.length; i++) {
      const d = node.dialogues[i];
      if (!d.text.trim()) {
        issues.push({ severity: 'warning', nodeId: node.id, field: `dialogues[${i}].text`, message: `节点 "${node.id}" 第${i + 1}条对白内容为空` });
      }
    }

    if (node.choices) {
      for (let i = 0; i < node.choices.length; i++) {
        const c = node.choices[i];
        if (!c.text.trim()) {
          issues.push({ severity: 'warning', nodeId: node.id, field: `choices[${i}].text`, message: `节点 "${node.id}" 第${i + 1}个选项文本为空` });
        }
        if (c.nextNodeId && !nodeIds.has(c.nextNodeId)) {
          issues.push({ severity: 'error', nodeId: node.id, field: `choices[${i}].nextNodeId`, message: `选项 "${c.text}" 指向不存在的节点 "${c.nextNodeId}"` });
        }
        if (c.nextNodeId) {
          referencedNodeIds.add(c.nextNodeId);
          allTargetIds.add(c.nextNodeId);
        }
      }
    }

    if (node.nextNodeId) {
      if (!nodeIds.has(node.nextNodeId)) {
        issues.push({ severity: 'error', nodeId: node.id, field: 'nextNodeId', message: `节点 "${node.id}" 的后续节点 "${node.nextNodeId}" 不存在` });
      }
      referencedNodeIds.add(node.nextNodeId);
      allTargetIds.add(node.nextNodeId);
    }

    if (node.nextNodeBranches) {
      for (let i = 0; i < node.nextNodeBranches.length; i++) {
        const b = node.nextNodeBranches[i];
        if (b.nextNodeId && !nodeIds.has(b.nextNodeId)) {
          issues.push({ severity: 'error', nodeId: node.id, field: `nextNodeBranches[${i}].nextNodeId`, message: `分支 ${i + 1} 指向不存在的节点 "${b.nextNodeId}"` });
        }
        if (b.nextNodeId) {
          referencedNodeIds.add(b.nextNodeId);
          allTargetIds.add(b.nextNodeId);
        }
      }
    }

    if (node.isEnding && node.endingId) {
      const endingExists = creation.endings.some(e => e.id === node.endingId);
      if (!endingExists) {
        issues.push({ severity: 'warning', nodeId: node.id, field: 'endingId', message: `结局节点引用了不存在的结局 "${node.endingId}"` });
      }
    }

    if (node.danmakus) {
      for (let i = 0; i < node.danmakus.length; i++) {
        const dm = node.danmakus[i];
        if (!dm.content.trim()) {
          issues.push({ severity: 'info', nodeId: node.id, field: `danmakus[${i}].content`, message: `弹幕 #${i + 1} 内容为空` });
        }
      }
    }
  }

  if (!hasStartNode && creation.nodes.length > 0) {
    issues.push({ severity: 'warning', message: '建议设置一个ID为 "start" 的起始节点' });
  }

  const orphanNodes = creation.nodes
    .filter(n => n.id !== 'start' && !referencedNodeIds.has(n.id))
    .map(n => n.id);

  if (orphanNodes.length > 0) {
    issues.push({
      severity: 'warning',
      message: `以下节点没有被任何选项或跳转引用: ${orphanNodes.join(', ')}`
    });
  }

  const unreachableNodes: string[] = [];
  if (hasStartNode) {
    const visited = new Set<string>();
    const queue = ['start'];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      const node = creation.nodes.find(n => n.id === current);
      if (!node) continue;
      if (node.nextNodeId) queue.push(node.nextNodeId);
      if (node.choices) node.choices.forEach(c => { if (c.nextNodeId) queue.push(c.nextNodeId); });
      if (node.nextNodeBranches) node.nextNodeBranches.forEach(b => { if (b.nextNodeId) queue.push(b.nextNodeId); });
    }
    for (const n of creation.nodes) {
      if (!visited.has(n.id)) unreachableNodes.push(n.id);
    }
  }

  if (unreachableNodes.length > 0) {
    issues.push({
      severity: 'warning',
      message: `以下节点从起始节点不可达: ${unreachableNodes.join(', ')}`
    });
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;

  let totalDialogues = 0;
  let totalDanmakus = 0;
  let totalChoices = 0;

  for (const node of creation.nodes) {
    totalDialogues += node.dialogues.length;
    totalDanmakus += node.danmakus?.length || 0;
    totalChoices += node.choices?.length || 0;
  }

  const result: ValidationResult = {
    isValid: errorCount === 0,
    issues,
    stats: {
      nodeCount: creation.nodes.length,
      dialogueCount: totalDialogues,
      danmakuCount: totalDanmakus,
      choiceCount: totalChoices,
      endingCount: creation.endings.length,
      orphanNodes,
      unreachableNodes
    }
  };

  workshopState.update(s => ({ ...s, validationResult: result }));
  return result;
}

export function generateShareCode(): string {
  const state = get(workshopState);
  const creation = state.currentCreation;
  if (!creation) return '';

  const payload: WorkshopSharePayload = {
    format: 'deep-sea-workshop-v1',
    creation,
    exportedAt: Date.now(),
    checksum: btoa(JSON.stringify(creation)).slice(0, 12)
  };

  const json = JSON.stringify(payload);
  const code = btoa(unescape(encodeURIComponent(json)));

  workshopState.update(s => ({ ...s, shareCode: code }));
  return code;
}

export function importFromShareCode(code: string): boolean {
  try {
    const json = decodeURIComponent(escape(atob(code)));
    const payload: WorkshopSharePayload = JSON.parse(json);

    if (payload.format !== 'deep-sea-workshop-v1') {
      return false;
    }

    if (!payload.creation || !payload.creation.nodes) {
      return false;
    }

    const creation: WorkshopCreation = {
      ...payload.creation,
      id: `creation_${Date.now()}`,
      updatedAt: Date.now()
    };

    workshopState.update(s => ({
      ...s,
      currentCreation: creation,
      selectedNodeId: null,
      validationResult: null,
      shareCode: null,
      activeTab: 'nodes'
    }));
    return true;
  } catch {
    return false;
  }
}

export function exportAsJSON(): string {
  const state = get(workshopState);
  if (!state.currentCreation) return '{}';
  return JSON.stringify(state.currentCreation, null, 2);
}

export function importFromJSON(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!data.nodes || !Array.isArray(data.nodes)) return false;

    const creation: WorkshopCreation = {
      id: data.id || `creation_${Date.now()}`,
      title: data.title || '导入的创作',
      author: data.author || '未知',
      description: data.description || '',
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now(),
      version: data.version || 1,
      nodes: data.nodes,
      endings: data.endings || [],
      danmakuTemplates: data.danmakuTemplates || [],
      sfxTemplates: data.sfxTemplates || []
    };

    workshopState.update(s => ({
      ...s,
      currentCreation: creation,
      selectedNodeId: null,
      validationResult: null,
      activeTab: 'nodes'
    }));
    return true;
  } catch {
    return false;
  }
}

export function setTrialing(isTrialing: boolean): void {
  workshopState.update(s => ({ ...s, isTrialing }));
}

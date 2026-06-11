import { writable, derived, get } from 'svelte/store';
import type {
  WorldviewCategory,
  WorldviewNode,
  WorldviewTab
} from '../types/game';
import {
  allWorldviewNodes,
  getNodeById,
  worldviewRootNodeIds,
} from '../data/worldview';
import { globalMemory, unlockedClueList, currentPlaythrough } from './memory';
import { unlockedEndings } from './store';

export interface WorldviewState {
  isOpen: boolean;
  activeTab: WorldviewTab;
  activeCategory: WorldviewCategory | 'all';
  selectedNodeId: string | null;
  expandedCategories: Record<WorldviewCategory, boolean>;
  expandedNodeIds: string[];
  searchQuery: string;
}

const DEFAULT_STATE: WorldviewState = {
  isOpen: false,
  activeTab: 'tree',
  activeCategory: 'all',
  selectedNodeId: null,
  expandedCategories: {
    creature: true,
    equipment: false,
    mail: false,
    chronology: false
  },
  expandedNodeIds: [...worldviewRootNodeIds],
  searchQuery: ''
};

export const worldviewState = writable<WorldviewState>(DEFAULT_STATE);

export function isNodeUnlocked(node: WorldviewNode): boolean {
  const memory = get(globalMemory);
  const endings = get(unlockedEndings);
  const playthrough = get(currentPlaythrough);

  if (node.requiresClues && node.requiresClues.length > 0) {
    const allClues = node.requiresClues.every(clueId => 
      Object.keys(memory.unlockedClues).includes(clueId)
    );
    if (!allClues) return false;
  }

  if (node.requiresEndings && node.requiresEndings.length > 0) {
    const allEndings = node.requiresEndings.every(eId => endings.includes(eId));
    if (!allEndings) return false;
  }

  if (node.requiresPlaythroughAtLeast !== undefined) {
    if (playthrough < node.requiresPlaythroughAtLeast) return false;
  }

  return true;
}

export const unlockedWorldviewNodes = derived(
  [globalMemory, unlockedEndings, currentPlaythrough],
  ([$memory, $endings, $playthrough]) => {
    return allWorldviewNodes.filter(node => {
      if (node.requiresClues && node.requiresClues.length > 0) {
        const allClues = node.requiresClues.every(clueId => 
          Object.keys($memory.unlockedClues).includes(clueId)
        );
        if (!allClues) return false;
      }
      if (node.requiresEndings && node.requiresEndings.length > 0) {
        const allEndings = node.requiresEndings.every(eId => $endings.includes(eId));
        if (!allEndings) return false;
      }
      if (node.requiresPlaythroughAtLeast !== undefined) {
        if ($playthrough < node.requiresPlaythroughAtLeast) return false;
      }
      return true;
    }).map(n => n.id);
  }
);

export const totalUnlockedCount = derived(
  unlockedWorldviewNodes,
  $nodes => $nodes.length
);

export const totalNodeCount = allWorldviewNodes.length;

export const progressPercentage = derived(
  totalUnlockedCount,
  $count => Math.round(($count / totalNodeCount) * 100)
);

export function openWorldview(): void {
  worldviewState.update(s => ({ ...s, isOpen: true }));
}

export function closeWorldview(): void {
  worldviewState.update(s => ({ ...s, isOpen: false, selectedNodeId: null }));
}

export function setActiveTab(tab: WorldviewTab): void {
  worldviewState.update(s => ({ ...s, activeTab: tab, selectedNodeId: null }));
}

export function setActiveCategory(category: WorldviewCategory | 'all'): void {
  worldviewState.update(s => ({ ...s, activeCategory: category }));
}

export function selectNode(nodeId: string | null): void {
  worldviewState.update(s => ({ ...s, selectedNodeId: nodeId }));
}

export function toggleCategory(category: WorldviewCategory): void {
  worldviewState.update(s => ({
    ...s,
    expandedCategories: {
      ...s.expandedCategories,
      [category]: !s.expandedCategories[category]
    }
  }));
}

export function toggleNodeExpand(nodeId: string): void {
  worldviewState.update(s => {
    const isExpanded = s.expandedNodeIds.includes(nodeId);
    return {
      ...s,
      expandedNodeIds: isExpanded
        ? s.expandedNodeIds.filter(id => id !== nodeId)
        : [...s.expandedNodeIds, nodeId]
    };
  });
}

export function setSearchQuery(query: string): void {
  worldviewState.update(s => ({ ...s, searchQuery: query }));
}

export function getNodeUnlockHints(node: WorldviewNode): string[] {
  const hints: string[] = [];
  if (node.requiresClues && node.requiresClues.length > 0) {
    hints.push(`需要解锁 ${node.requiresClues.length} 条线索`);
  }
  if (node.requiresEndings && node.requiresEndings.length > 0) {
    hints.push(`需要达成 ${node.requiresEndings.length} 个结局`);
  }
  if (node.requiresPlaythroughAtLeast !== undefined) {
    hints.push(`需要第 ${node.requiresPlaythroughAtLeast} 周目及以上`);
  }
  return hints;
}

export function selectTab(tab: WorldviewTab): void {
  setActiveTab(tab);
}

export function unlockNode(nodeId: string): void {
}

export function getUnlockedNodeIds(): string[] {
  return get(unlockedWorldviewNodes);
}

export function getActiveCategoryLabels(): string {
  const state = get(worldviewState);
  return state.activeCategory === 'all' ? '全部' : state.activeCategory;
}

export function updateWorldviewUnlocks(): void {
  get(unlockedWorldviewNodes);
}

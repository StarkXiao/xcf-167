import type { StoryNode, Choice, StateCondition, StateEffect, Danmaku } from '../types/game';
import { storyData } from '../data/story';
import {
  gameState,
  setCurrentNode,
  advanceDialogue,
  setVariable,
  unlockEnding,
  addDanmaku,
  removeDanmaku,
  clearDanmakus,
  resetGameState,
  isTyping
} from './store';
import { get } from 'svelte/store';

export function getNode(nodeId: string): StoryNode | undefined {
  return storyData.nodes.find(n => n.id === nodeId);
}

export function getCurrentNode(): StoryNode | undefined {
  const state = get(gameState);
  return getNode(state.currentNodeId);
}

export function checkCondition(condition?: StateCondition): boolean {
  if (!condition) return true;
  const state = get(gameState);
  for (const [key, value] of Object.entries(condition)) {
    if (state.variables[key] !== value) return false;
  }
  return true;
}

export function applyEffect(effect?: StateEffect): void {
  if (!effect) return;
  for (const [key, value] of Object.entries(effect)) {
    setVariable(key, value);
  }
}

export function getAvailableChoices(): Choice[] {
  const node = getCurrentNode();
  if (!node?.choices) return [];
  return node.choices.filter(c => checkCondition(c.condition));
}

export function canAdvance(): boolean {
  const node = getCurrentNode();
  if (!node) return false;
  const state = get(gameState);
  return state.dialogueIndex < node.dialogues.length - 1;
}

export function isAtDialogueEnd(): boolean {
  const node = getCurrentNode();
  if (!node) return false;
  const state = get(gameState);
  return state.dialogueIndex >= node.dialogues.length - 1;
}

export function hasChoices(): boolean {
  return getAvailableChoices().length > 0;
}

export function advance(): void {
  const typing = get(isTyping);
  if (typing) return;
  
  const node = getCurrentNode();
  if (!node) return;
  
  if (node.effects) {
    applyEffect(node.effects);
  }
  
  if (canAdvance()) {
    advanceDialogue();
    const state = get(gameState);
    triggerDanmakusForDialogue(state.dialogueIndex);
    return;
  }
  
  if (isAtDialogueEnd()) {
    if (node.isEnding && node.endingId) {
      unlockEnding(node.endingId);
      return;
    }
    
    if (node.choices && node.choices.length > 0) {
      return;
    }
    
    if (node.nextNodeId) {
      goToNode(node.nextNodeId);
    }
  }
}

export function selectChoice(choiceId: string): void {
  const node = getCurrentNode();
  if (!node?.choices) return;
  
  const choice = node.choices.find(c => c.id === choiceId);
  if (!choice || !checkCondition(choice.condition)) return;
  
  if (choice.effect) {
    applyEffect(choice.effect);
  }
  
  goToNode(choice.nextNodeId);
}

export function goToNode(nodeId: string): void {
  const targetNode = getNode(nodeId);
  if (!targetNode) {
    console.error('Node not found:', nodeId);
    return;
  }
  
  clearDanmakus();
  setCurrentNode(nodeId);
  
  if (targetNode.danmakus && targetNode.danmakus.length > 0) {
    setTimeout(() => triggerDanmakusForDialogue(0), 300);
  }
}

let danmakuTimeouts: number[] = [];

export function triggerDanmakusForDialogue(dialogueIndex: number): void {
  clearDanmakuTimeouts();
  
  const node = getCurrentNode();
  if (!node?.danmakus) return;
  
  const baseTime = dialogueIndex * 10000;
  const relevantDanmakus = node.danmakus.filter(
    d => d.timestamp >= baseTime && d.timestamp < baseTime + 10000
  );
  
  relevantDanmakus.forEach(danmaku => {
    const delay = Math.max(0, danmaku.timestamp - baseTime);
    const timeout = window.setTimeout(() => {
      addDanmaku(danmaku);
      
      window.setTimeout(() => {
        removeDanmaku(danmaku.id);
      }, 8000);
    }, delay);
    danmakuTimeouts.push(timeout);
  });
}

export function clearDanmakuTimeouts(): void {
  danmakuTimeouts.forEach(t => clearTimeout(t));
  danmakuTimeouts = [];
}

export function restartGame(): void {
  clearDanmakuTimeouts();
  resetGameState();
  goToNode('start');
}

export function getAllEndings() {
  return storyData.endings;
}

export function getEndingById(id: string) {
  return storyData.endings.find(e => e.id === id);
}

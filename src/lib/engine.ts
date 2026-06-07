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
import { getEndingWeight, selectWeightedEnding, addEndingWeightModifier } from './evidence';

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
      const redirectedNodeId = resolveEndingRedirect(node.id, node.nextNodeId);
      goToNode(redirectedNodeId);
    }
  }
}

function resolveEndingRedirect(currentNodeId: string, nextNodeId: string): string {
  const endingRedirectMap: Record<string, string[]> = {
    live_continue: ['ending_truth', 'ending_madness'],
    ascent_ending: ['ending_survival', 'ending_silence', 'ending_truth'],
    stop_continue: ['ending_survival', 'ending_loop', 'ending_madness'],
    ending_path_live: ['ending_truth', 'ending_madness'],
    ending_resolve_live: ['ending_truth', 'ending_madness'],
    ending_resolve_ascent: ['ending_survival', 'ending_silence', 'ending_truth'],
    ending_resolve_stop: ['ending_survival', 'ending_loop', 'ending_madness']
  };

  if (endingRedirectMap[currentNodeId]) {
    const candidates = endingRedirectMap[currentNodeId];
    const weightedEnding = selectWeightedEnding(candidates);
    if (weightedEnding) {
      const endingNodeMap: Record<string, string> = {
        ending_truth: 'ending_truth_node',
        ending_survival: 'ending_survival',
        ending_silence: 'ending_silence',
        ending_madness: 'ending_madness_node',
        ending_loop: 'ending_loop'
      };
      return endingNodeMap[weightedEnding] || nextNodeId;
    }
  }

  return nextNodeId;
}

export function selectChoice(choiceId: string): void {
  const node = getCurrentNode();
  if (!node?.choices) return;
  
  const choice = node.choices.find(c => c.id === choiceId);
  if (!choice || !checkCondition(choice.condition)) return;
  
  if (choice.effect) {
    applyEffect(choice.effect);
  }

  applyChoiceWeightModifier(node.id, choiceId);
  
  goToNode(choice.nextNodeId);
}

function applyChoiceWeightModifier(nodeId: string, choiceId: string): void {
  const weightMap: Record<string, Record<string, Record<string, number>>> = {
    intro_2: {
      c_fast: { ending_truth: -10, ending_loop: 10 },
      c_normal: { ending_truth: 10, ending_survival: 5 }
    },
    first_contact: {
      c_stay: { ending_survival: 10, ending_truth: 5 },
      c_danmaku: { ending_truth: 15, ending_madness: 5 },
      c_creature: { ending_truth: 20, ending_madness: 10, ending_silence: 5 }
    },
    critical_choice: {
      c_keep_live: { ending_truth: 25, ending_madness: 15, ending_silence: 10 },
      c_keep_live_2: { ending_truth: 20, ending_madness: 10 },
      c_stop_live: { ending_survival: 25, ending_loop: 10 },
      c_emergency: { ending_survival: 15, ending_silence: 20, ending_truth: 5 }
    },
    stop_continue: {
      c_trust_su: { ending_survival: 30, ending_silence: -10 },
      c_doubt: { ending_loop: 30, ending_truth: 10, ending_madness: 10 }
    }
  };

  const modifiers = weightMap[nodeId]?.[choiceId];
  if (modifiers) {
    Object.entries(modifiers).forEach(([endingId, value]) => {
      addEndingWeightModifier(endingId, value, `choice:${nodeId}:${choiceId}`);
    });
  }
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

function calculateCharTime(text: string, targetIndex: number, charDelay: number): number {
  let time = 0;
  const punctuationPause = charDelay * 2.5;
  for (let i = 0; i < Math.min(targetIndex, text.length); i++) {
    const char = text[i];
    time += charDelay;
    if (char === '。' || char === '！' || char === '？' || char === '…' || char === '—') {
      time += punctuationPause;
    } else if (char === '，' || char === '、' || char === '；' || char === '：') {
      time += charDelay * 1.2;
    }
  }
  return time;
}

function calculateTotalTypingDuration(text: string, charDelay: number): number {
  return calculateCharTime(text, text.length, charDelay);
}

export function triggerDanmakusForDialogue(dialogueIndex: number, charDelay: number = 50): void {
  clearDanmakuTimeouts();
  
  const node = getCurrentNode();
  if (!node?.danmakus) return;
  
  const dialogue = node.dialogues[dialogueIndex];
  if (!dialogue) return;
  
  const fullText = dialogue.text;
  const totalTypingDuration = calculateTotalTypingDuration(fullText, charDelay);
  
  const relevantDanmakus = node.danmakus.filter(d => {
    if (d.dialogueIndex !== undefined) {
      return d.dialogueIndex === dialogueIndex;
    }
    const baseTime = dialogueIndex * 10000;
    return d.timestamp >= baseTime && d.timestamp < baseTime + 10000;
  });
  
  relevantDanmakus.forEach(danmaku => {
    let delay: number;
    
    if (danmaku.dialogueIndex !== undefined && danmaku.relativeMs !== undefined) {
      delay = Math.max(0, danmaku.relativeMs);
    } else if (danmaku.dialogueIndex !== undefined) {
      const progress = (danmaku.timestamp % 10000) / 10000;
      delay = Math.max(0, progress * totalTypingDuration);
    } else {
      const baseTime = dialogueIndex * 10000;
      delay = Math.max(0, danmaku.timestamp - baseTime);
    }
    
    const timeout = window.setTimeout(() => {
      addDanmaku(danmaku);
      
      window.setTimeout(() => {
        removeDanmaku(danmaku.id);
      }, 8000);
    }, delay);
    danmakuTimeouts.push(timeout);
  });
}

export function triggerDanmakuAtChar(dialogueIndex: number, charIndex: number, charDelay: number = 50): void {
  const node = getCurrentNode();
  if (!node?.danmakus) return;
  
  const dialogue = node.dialogues[dialogueIndex];
  if (!dialogue) return;
  
  const elapsedMs = calculateCharTime(dialogue.text, charIndex, charDelay);
  const tolerance = charDelay * 3;
  
  const dueDanmakus = node.danmakus.filter(d => {
    if (d.dialogueIndex !== dialogueIndex) return false;
    const targetMs = d.relativeMs !== undefined ? d.relativeMs : (d.timestamp % 10000);
    return Math.abs(targetMs - elapsedMs) <= tolerance;
  });
  
  dueDanmakus.forEach(danmaku => {
    addDanmaku(danmaku);
    window.setTimeout(() => {
      removeDanmaku(danmaku.id);
    }, 8000);
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

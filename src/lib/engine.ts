import type {
  StoryNode,
  Choice,
  StateCondition,
  StateEffect,
  Danmaku,
  DialogueLine,
  DialogueVariant,
  AudioHint,
  MemoryCondition
} from '../types/game';
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
import { getEndingWeight, selectWeightedEnding, addEndingWeightModifier, evidenceBoard } from './evidence';
import {
  checkMemoryCondition,
  selectDialogueVariant,
  getApplicableAudioHints,
  markAudioHintTriggered,
  markDialogueVariantUsed,
  unlockClue,
  recordPlaythrough,
  isClueUnlocked
} from './memory';
import { playSFX } from './audio';
import { calculateDanmakuDelay, getDanmakuReorderChance, getCurrentCorruption, glitchSubtitleText } from './signalCorruption';

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

export function checkAllConditions(
  stateCondition?: StateCondition,
  memoryCondition?: MemoryCondition
): boolean {
  const memoryOk = checkMemoryCondition(memoryCondition);
  if (memoryCondition && memoryOk) {
    return true;
  }
  return checkCondition(stateCondition) && memoryOk;
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
  return node.choices.filter(c => checkAllConditions(c.condition, c.memoryCondition));
}

export function getChoiceDisplayText(choice: Choice): string {
  if (choice.memoryText && checkMemoryCondition(choice.memoryCondition)) {
    return choice.memoryText;
  }
  return choice.text;
}

export function getEffectiveDialogue(dialogue: DialogueLine): { text: string; isMemoryVariant: boolean; variant?: DialogueVariant } {
  if (dialogue.memoryVariants && dialogue.memoryVariants.length > 0) {
    const variant = selectDialogueVariant(dialogue.memoryVariants);
    if (variant) {
      const stateOk = variant.condition ? checkCondition(variant.condition) : true;
      if (stateOk) {
        return {
          text: variant.text,
          isMemoryVariant: true,
          variant
        };
      }
    }
  }
  return {
    text: dialogue.text,
    isMemoryVariant: false
  };
}

export function triggerMemoryAudioHints(dialogue: DialogueLine): void {
  const hints = dialogue.memoryHints || [];
  const applicable = getApplicableAudioHints(hints);
  applicable.forEach(hint => {
    const delay = hint.delay || 0;
    window.setTimeout(() => {
      playSFX(hint.sfx, hint.volume);
      markAudioHintTriggered(hint.id);
    }, delay);
  });
}

export function triggerNodeMemoryHints(node: StoryNode): void {
  const hints = node.memoryHints || [];
  const applicable = getApplicableAudioHints(hints);
  applicable.forEach(hint => {
    const delay = hint.delay || 0;
    window.setTimeout(() => {
      playSFX(hint.sfx, hint.volume);
      markAudioHintTriggered(hint.id);
    }, delay);
  });
}

export function processChoiceMemoryEffect(choice: Choice): void {
  if (choice.memoryEffect?.clueToUnlock) {
    unlockClue(choice.memoryEffect.clueToUnlock);
  }
}

export function unlockClueFromNode(clueId: string, nodeId: string): boolean {
  return unlockClue(clueId, { nodeId });
}

export function getCurrentDialogueWithMemory(): { line: DialogueLine; effectiveText: string; isMemoryVariant: boolean } | null {
  const node = getCurrentNode();
  if (!node) return null;
  const state = get(gameState);

  let dialogues = node.dialogues;
  if (node.memoryDialogues && node.memoryDialogues.length > 0) {
    const allMemoryOk = node.memoryDialogues.every(d =>
      d.memoryCondition ? checkMemoryCondition(d.memoryCondition) : true
    );
    if (allMemoryOk) {
      dialogues = [...node.memoryDialogues, ...node.dialogues];
    }
  }

  if (state.dialogueIndex >= dialogues.length) return null;
  const line = dialogues[state.dialogueIndex];
  const effective = getEffectiveDialogue(line);

  return {
    line,
    effectiveText: effective.text,
    isMemoryVariant: effective.isMemoryVariant
  };
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

    const nextDialogue = node.dialogues[state.dialogueIndex];
    if (nextDialogue) {
      triggerMemoryAudioHints(nextDialogue);
    }
    return;
  }
  
  if (isAtDialogueEnd()) {
    if (node.isEnding && node.endingId) {
      unlockEnding(node.endingId);
      recordPlaythroughCompletion(node.endingId);
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

function recordPlaythroughCompletion(endingId: string): void {
  const state = get(gameState);
  const evidenceState = getEvidenceStateIds();
  recordPlaythrough({
    endingId,
    cluesUnlocked: Object.keys(state.variables).filter(k => k.startsWith('clue') || k.startsWith('full_truth') || k.startsWith('creature') || k.startsWith('crew') || k.startsWith('previous') || k.startsWith('signal')),
    evidenceCollected: evidenceState,
    nodesVisited: state.visitedNodes,
    choicesMade: []
  });
}

function getEvidenceStateIds(): string[] {
  try {
    const state = get(evidenceBoard);
    return state.collectedEvidence.map(e => e.id);
  } catch {
    return [];
  }
}

function resolveEndingRedirect(currentNodeId: string, nextNodeId: string): string {
  const endingRedirectMap: Record<string, { candidates: string[]; nodeMap: Record<string, string> }> = {
    ending_resolve_live: {
      candidates: ['ending_truth', 'ending_madness'],
      nodeMap: {
        ending_truth: 'ending_truth_node',
        ending_madness: 'ending_madness_node'
      }
    },
    ending_resolve_ascent: {
      candidates: ['ending_survival', 'ending_silence', 'ending_truth'],
      nodeMap: {
        ending_survival: 'ending_survival_ascent',
        ending_silence: 'ending_silence',
        ending_truth: 'ending_truth_ascent'
      }
    },
    ending_resolve_stop: {
      candidates: ['ending_survival', 'ending_loop', 'ending_madness'],
      nodeMap: {
        ending_survival: 'ending_survival_stop',
        ending_loop: 'ending_loop_stop',
        ending_madness: 'ending_madness_stop'
      }
    }
  };

  const config = endingRedirectMap[currentNodeId];
  if (config) {
    const weightedEnding = selectWeightedEnding(config.candidates);
    if (weightedEnding) {
      return config.nodeMap[weightedEnding] || nextNodeId;
    }
  }

  return nextNodeId;
}

export function selectChoice(choiceId: string): void {
  const node = getCurrentNode();
  if (!node?.choices) return;
  
  const choice = node.choices.find(c => c.id === choiceId);
  if (!choice || !checkAllConditions(choice.condition, choice.memoryCondition)) return;
  
  if (choice.effect) {
    applyEffect(choice.effect);
  }

  processChoiceMemoryEffect(choice);
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

  triggerNodeMemoryHints(targetNode);

  if (targetNode.dialogues && targetNode.dialogues.length > 0) {
    triggerMemoryAudioHints(targetNode.dialogues[0]);
  }
  
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
  const corruptionLevel = getCurrentCorruption();
  
  let relevantDanmakus = node.danmakus.filter(d => {
    if (d.dialogueIndex !== undefined) {
      return d.dialogueIndex === dialogueIndex;
    }
    const baseTime = dialogueIndex * 10000;
    return d.timestamp >= baseTime && d.timestamp < baseTime + 10000;
  });
  
  if (corruptionLevel > 25 && Math.random() < getDanmakuReorderChance(corruptionLevel)) {
    relevantDanmakus = [...relevantDanmakus].sort(() => Math.random() - 0.5);
  }
  
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
    
    delay = calculateDanmakuDelay(delay, corruptionLevel);
    
    const timeout = window.setTimeout(() => {
      const corruptedDanmaku = { ...danmaku };
      if (corruptionLevel > 35) {
        corruptedDanmaku.content = glitchSubtitleText(danmaku.content, corruptionLevel * 0.6);
      }
      if (corruptionLevel > 60 && Math.random() < 0.3) {
        corruptedDanmaku.color = ['#ff0066', '#00ffcc', '#ffff00', '#ff6600', '#6600ff'][Math.floor(Math.random() * 5)];
      }
      addDanmaku(corruptedDanmaku);
      
      const displayDuration = corruptionLevel > 70 ? 5000 + Math.random() * 3000 : 8000;
      window.setTimeout(() => {
        removeDanmaku(danmaku.id);
      }, displayDuration);
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
  const corruptionLevel = getCurrentCorruption();
  
  const dueDanmakus = node.danmakus.filter(d => {
    if (d.dialogueIndex !== dialogueIndex) return false;
    const targetMs = d.relativeMs !== undefined ? d.relativeMs : (d.timestamp % 10000);
    return Math.abs(targetMs - elapsedMs) <= tolerance;
  });
  
  dueDanmakus.forEach(danmaku => {
    const corruptedDanmaku = { ...danmaku };
    if (corruptionLevel > 35) {
      corruptedDanmaku.content = glitchSubtitleText(danmaku.content, corruptionLevel * 0.6);
    }
    if (corruptionLevel > 60 && Math.random() < 0.3) {
      corruptedDanmaku.color = ['#ff0066', '#00ffcc', '#ffff00', '#ff6600', '#6600ff'][Math.floor(Math.random() * 5)];
    }
    addDanmaku(corruptedDanmaku);
    const displayDuration = corruptionLevel > 70 ? 5000 + Math.random() * 3000 : 8000;
    window.setTimeout(() => {
      removeDanmaku(danmaku.id);
    }, displayDuration);
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

import type {
  StoryNode,
  Choice,
  StateCondition,
  StateEffect,
  Danmaku,
  DialogueLine,
  DialogueVariant,
  AudioHint,
  MemoryCondition,
  RewindCheckpoint,
  RewindEffect,
  CrewStoryNode,
  CrewChoice,
  CrewEndingBranch,
  CrewMemberId,
  CrewDanmaku,
  CrewInnerThought,
  MentalStateChange,
  CrewMentalState
} from '../types/game';
import { storyData } from '../data/story';
import { crewStoryData } from '../data/crewStory';
import { caseDefinitions } from '../data/caseLinkage';
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
  isTyping,
  settings,
  setCrewPerspective,
  initCrewMentalStates,
  applyMentalStateChanges,
  currentCrewPerspective,
  crewMentalStates,
  updateCrewMentalState
} from './store';
import { get } from 'svelte/store';
import { getEndingWeight, selectWeightedEnding, addEndingWeightModifier, evidenceBoard } from './evidence';
import { applyChoiceWeight, endingRedirectMap } from './previewEndingResolver';
import {
  checkMemoryCondition,
  selectDialogueVariant,
  getApplicableAudioHints,
  markAudioHintTriggered,
  markDialogueVariantUsed,
  unlockClue,
  recordPlaythrough,
  isClueUnlocked,
  shouldShowImportantDanmaku,
  shouldShowBackendPerspective
} from './memory';
import { playSFX, playSFXWithRewind } from './audio';
import { calculateDanmakuDelay, getDanmakuReorderChance, getCurrentCorruption, glitchSubtitleText, getChannelLevel } from './signalCorruption';
import { applyTrustEffect, applyTrustEndingWeights, checkTrustCondition, getLockedEnding, getCrewTrust } from './trust';
import type { TrustCondition, NextNodeBranch } from '../types/game';
import {
  createCheckpoint,
  regenerateStability,
  shuffleDanmakusWithSeed,
  getActiveRewindEffect,
  rewindState,
  finalizeRewind,
  initiateRewind
} from './timeRewind';
import { checkAndUnlockAchievements, recordChoice, recordMisjudgment, getPlaythroughDataForRecord, resetPlaythroughTracking, setCurrentPath } from './achievements';
import { applyDamageEffects, applyRepairEffects, resetHullDamage } from './hullDamage';
import {
  processNodeEffectsForCaseLinkage,
  recordCaseChoice,
  caseLinkageState,
  saveCurrentCaseState
} from './caseLinkage';

const getAllCaseNodes = (): StoryNode[] => {
  const nodes: StoryNode[] = [];
  Object.values(caseDefinitions).forEach(caseDef => {
    nodes.push(...caseDef.nodes);
  });
  return nodes;
};

const getAllCaseEndings = () => {
  const endings: any[] = [];
  Object.values(caseDefinitions).forEach(caseDef => {
    endings.push(...caseDef.endings);
  });
  return endings;
};

const allNodes: StoryNode[] = [
  ...storyData.nodes,
  ...crewStoryData.nodes as StoryNode[],
  ...getAllCaseNodes()
];

const allEndings = [...storyData.endings, ...crewStoryData.endings as any[], ...getAllCaseEndings()];

export function isCrewNode(node: StoryNode): node is CrewStoryNode {
  return !!(node as CrewStoryNode).perspectiveId;
}

export function getCrewNode(nodeId: string): CrewStoryNode | undefined {
  return crewStoryData.nodes.find(n => n.id === nodeId);
}

export function getNode(nodeId: string): StoryNode | undefined {
  return allNodes.find(n => n.id === nodeId);
}

export function getCurrentNode(): StoryNode | undefined {
  const state = get(gameState);
  return getNode(state.currentNodeId);
}

export function getCurrentCrewNode(): CrewStoryNode | undefined {
  const state = get(gameState);
  return getCrewNode(state.currentNodeId);
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
  memoryCondition?: MemoryCondition,
  trustCondition?: TrustCondition
): boolean {
  if (!checkTrustCondition(trustCondition)) return false;
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
  if (!node) return [];
  const crewNode = getCrewNode(node.id);
  if (crewNode?.crewChoices && crewNode.crewChoices.length > 0) {
    return crewNode.crewChoices.filter(c => checkAllConditions(c.condition, c.memoryCondition, c.trustCondition));
  }
  if (!node.choices) return [];
  return node.choices.filter(c => checkAllConditions(c.condition, c.memoryCondition, c.trustCondition));
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
  const pseudoLiveMode = get(settings).pseudoLiveMode;
  const showBackend = shouldShowBackendPerspective(pseudoLiveMode);

  let dialogues = node.dialogues;
  if (node.memoryDialogues && node.memoryDialogues.length > 0) {
    const allMemoryOk = node.memoryDialogues.every(d =>
      d.memoryCondition ? checkMemoryCondition(d.memoryCondition) : true
    );
    if (allMemoryOk) {
      dialogues = [...node.memoryDialogues, ...node.dialogues];
    }
  }

  if (!showBackend) {
    dialogues = dialogues.filter(d => !d.isBackendOnly);
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

function getFilteredDialogues(node: StoryNode): DialogueLine[] {
  let dialogues = node.dialogues;
  if (node.memoryDialogues && node.memoryDialogues.length > 0) {
    const allMemoryOk = node.memoryDialogues.every(d =>
      d.memoryCondition ? checkMemoryCondition(d.memoryCondition) : true
    );
    if (allMemoryOk) {
      dialogues = [...node.memoryDialogues, ...node.dialogues];
    }
  }
  const pseudoLiveMode = get(settings).pseudoLiveMode;
  const showBackend = shouldShowBackendPerspective(pseudoLiveMode);
  if (!showBackend) {
    dialogues = dialogues.filter(d => !d.isBackendOnly);
  }
  return dialogues;
}

export function canAdvance(): boolean {
  const node = getCurrentNode();
  if (!node) return false;
  const state = get(gameState);
  const dialogues = getFilteredDialogues(node);
  return state.dialogueIndex < dialogues.length - 1;
}

export function isAtDialogueEnd(): boolean {
  const node = getCurrentNode();
  if (!node) return false;
  const state = get(gameState);
  const dialogues = getFilteredDialogues(node);
  return state.dialogueIndex >= dialogues.length - 1;
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

  if (node.trustEffect) {
    applyTrustEffect(node.trustEffect);
  }
  
  if (canAdvance()) {
    const stateBefore = get(gameState);
    const currentDialogue = node.dialogues[stateBefore.dialogueIndex];
    if (currentDialogue?.trustEffect) {
      applyTrustEffect(currentDialogue.trustEffect);
    }

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
    const state = get(gameState);
    const lastDialogue = node.dialogues[state.dialogueIndex];
    if (lastDialogue?.trustEffect) {
      applyTrustEffect(lastDialogue.trustEffect);
    }

    if (node.isEnding && node.endingId) {
      unlockEnding(node.endingId);
      recordPlaythroughCompletion(node.endingId);
      return;
    }
    
    const crewNode = getCrewNode(node.id);
    if (crewNode?.crewChoices && crewNode.crewChoices.length > 0) {
      return;
    }
    
    if (node.choices && node.choices.length > 0) {
      return;
    }

    if (crewNode?.crewEndingBranches && crewNode.crewEndingBranches.length > 0) {
      const crewNextId = resolveCrewEndingBranches(crewNode.crewEndingBranches);
      if (crewNextId) {
        goToNode(crewNextId);
        return;
      }
    }
    
    const effectiveNextId = resolveNextNodeBranches(node, node.nextNodeId);
    if (effectiveNextId) {
      const redirectedNodeId = resolveEndingRedirect(node.id, effectiveNextId);
      goToNode(redirectedNodeId);
    }
  }
}

function recordPlaythroughCompletion(endingId: string): void {
  const state = get(gameState);
  const evidenceState = getEvidenceStateIds();
  const playthroughData = getPlaythroughDataForRecord();
  const pathFromVars = state.variables.path as string | undefined;
  recordPlaythrough({
    endingId,
    cluesUnlocked: Object.keys(state.variables).filter(k => k.startsWith('clue') || k.startsWith('full_truth') || k.startsWith('creature') || k.startsWith('crew') || k.startsWith('previous') || k.startsWith('signal')),
    evidenceCollected: evidenceState,
    nodesVisited: state.visitedNodes,
    choicesMade: playthroughData.choicesMade,
    mistakeCount: playthroughData.mistakeCount,
    pathTaken: playthroughData.pathTaken || pathFromVars
  });
  resetPlaythroughTracking();
  checkAndUnlockAchievements({
    endingUnlocked: endingId,
    playthroughComplete: true
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

export function resolveNextNodeBranches(node: StoryNode, defaultNextId?: string): string | undefined {
  if (!node.nextNodeBranches || node.nextNodeBranches.length === 0) {
    return defaultNextId;
  }

  const sorted = [...node.nextNodeBranches].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const branch of sorted) {
    if (checkAllConditions(branch.condition, branch.memoryCondition, branch.trustCondition)) {
      return branch.nextNodeId;
    }
  }

  return defaultNextId;
}

function resolveCrewEndingBranches(branches: CrewEndingBranch[]): string | undefined {
  const state = get(gameState);
  const mentalStates: Record<CrewMemberId, CrewMentalState> = state.crewMentalStates || {} as Record<CrewMemberId, CrewMentalState>;

  const sorted = [...branches].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  for (const branch of sorted) {
    const stateOk = !branch.condition || checkCondition(branch.condition);
    const trustOk = !branch.trustCondition || checkTrustCondition(branch.trustCondition);
    const memoryOk = !branch.memoryCondition || checkMemoryCondition(branch.memoryCondition);
    
    let perspectiveOk = true;
    if (branch.requiredPerspectiveStates) {
      for (const req of branch.requiredPerspectiveStates) {
        const ms = mentalStates[req.memberId];
        if (!ms) { perspectiveOk = false; break; }
        if (req.minMentalState && ms.mentalState !== req.minMentalState) {
          const stateOrder: Record<string, number> = { calm: 0, anxious: 1, determined: 2, terrified: 3, resigned: 4, broken: 5 };
          if ((stateOrder[ms.mentalState] ?? 0) < (stateOrder[req.minMentalState] ?? 0)) { perspectiveOk = false; break; }
        }
        if (req.maxFearLevel !== undefined && ms.fearLevel > req.maxFearLevel) { perspectiveOk = false; break; }
        if (req.minResolveLevel !== undefined && ms.resolveLevel < req.minResolveLevel) { perspectiveOk = false; break; }
        if (req.requiredSecretExposure && ms.secretExposure !== req.requiredSecretExposure) { perspectiveOk = false; break; }
        if (req.requiredHasConfessed !== undefined && ms.hasConfessed !== req.requiredHasConfessed) { perspectiveOk = false; break; }
        if (req.requiredHasBrokenDown !== undefined && ms.hasBrokenDown !== req.requiredHasBrokenDown) { perspectiveOk = false; break; }
      }
    }

    let relationshipOk = true;
    if (branch.requiredCrewRelationships) {
      for (const req of branch.requiredCrewRelationships) {
        const trustVal = getTrustValue(req.from, req.to);
        if (req.minTrust !== undefined && trustVal < req.minTrust) { relationshipOk = false; break; }
        if (req.maxTrust !== undefined && trustVal > req.maxTrust) { relationshipOk = false; break; }
      }
    }

    if (stateOk && trustOk && memoryOk && perspectiveOk && relationshipOk) {
      return branch.nextNodeId;
    }
  }

  return undefined;
}

function getTrustValue(from: CrewMemberId, to: CrewMemberId): number {
  return getCrewTrust(to);
}

function resolveEndingRedirect(currentNodeId: string, nextNodeId: string): string {
  const config = endingRedirectMap[currentNodeId];
  if (config) {
    applyTrustEndingWeights(addEndingWeightModifier);

    const locked = getLockedEnding(config.candidates);
    if (locked) {
      return config.nodeMap[locked] || nextNodeId;
    }

    const weightedEnding = selectWeightedEnding(config.candidates);
    if (weightedEnding) {
      return config.nodeMap[weightedEnding] || nextNodeId;
    }
  }

  return nextNodeId;
}

export function selectChoice(choiceId: string): void {
  const node = getCurrentNode();
  if (!node) return;
  
  const crewNode = getCrewNode(node.id);
  let choice: Choice | undefined;
  let crewChoice: CrewChoice | undefined;
  
  if (crewNode?.crewChoices && crewNode.crewChoices.length > 0) {
    crewChoice = crewNode.crewChoices.find(c => c.id === choiceId);
    choice = crewChoice;
  }
  if (!choice) {
    choice = node.choices?.find(c => c.id === choiceId);
  }
  
  if (!choice || !checkAllConditions(choice.condition, choice.memoryCondition, choice.trustCondition)) return;
  
  if (choice.effect) {
    applyEffect(choice.effect);
  }

  if (choice.trustEffect) {
    applyTrustEffect(choice.trustEffect);
  }

  if (crewChoice) {
    if (crewChoice.affectsMentalState) {
      applyMentalStateChanges(crewChoice.affectsMentalState);
    }
    if (crewChoice.crewRelationshipImpact) {
      for (const rel of crewChoice.crewRelationshipImpact) {
        applyTrustEffect({
          changes: [{ target: rel.to, value: rel.trustDelta, reason: `${rel.from}的选择` }],
          hintText: undefined
        });
      }
    }
    if (crewChoice.revealsSecretTo) {
      for (const targetId of crewChoice.revealsSecretTo) {
        const currentStates = get(gameState).crewMentalStates;
        const sourceState = currentStates?.[crewChoice.perspectiveId];
        if (sourceState && sourceState.secretExposure !== 'exposed') {
          updateCrewMentalState(crewChoice.perspectiveId, { secretExposure: 'hinted' });
        }
      }
    }
  }

  processChoiceMemoryEffect(choice);
  applyChoiceWeightModifier(node.id, choiceId);
  recordChoice(node.id, choiceId);

  const clState = get(caseLinkageState);
  if (clState.activeCaseId) {
    recordCaseChoice(clState.activeCaseId, node.id, choiceId);
  }
  
  if (choiceId === 'c_keep_live' || choiceId === 'c_keep_live_2') {
    setCurrentPath('live');
  } else if (choiceId === 'c_stop_live') {
    setCurrentPath('stop');
  } else if (choiceId === 'c_emergency') {
    setCurrentPath('ascent');
  }
  
  checkAndUnlockAchievements({
    choiceMade: choiceId
  });
  
  goToNode(choice.nextNodeId);
}

function applyChoiceWeightModifier(nodeId: string, choiceId: string): void {
  applyChoiceWeight(nodeId, choiceId, addEndingWeightModifier);
}

export function goToNode(nodeId: string): void {
  const targetNode = getNode(nodeId);
  if (!targetNode) {
    console.error('Node not found:', nodeId);
    return;
  }

  const rState = get(rewindState);
  if (rState.isRewindMode && rState.activeRewind) {
    finalizeRewind();
  }
  
  const crewNode = getCrewNode(nodeId);
  if (crewNode) {
    initCrewMentalStates();
    setCrewPerspective(crewNode.perspectiveId);
    if (crewNode.perspectiveSwitch) {
      const transitionSfx: Record<string, string> = {
        seamless: 'click',
        blackout: 'static',
        glitch: 'radio_noise',
        memory_flash: 'heartbeat'
      };
      const sfx = transitionSfx[crewNode.perspectiveSwitch.transitionType] || 'click';
      playSFX(sfx as any, 0.5);
    }
  }

  clearDanmakus();
  setCurrentNode(nodeId);

  applyDamageEffects(targetNode.damageEffects);
  applyRepairEffects(targetNode.repairEffects);

  if (targetNode.isRewindCheckpoint) {
    createCheckpoint(targetNode.rewindCheckpointLabel || targetNode.title);
  }

  regenerateStability();

  triggerNodeMemoryHints(targetNode);

  processNodeEffectsForCaseLinkage(nodeId);

  const clState = get(caseLinkageState);
  if (clState.activeCaseId) {
    saveCurrentCaseState();
  }

  if (targetNode.dialogues && targetNode.dialogues.length > 0) {
    triggerMemoryAudioHints(targetNode.dialogues[0]);
  }
  
  if (crewNode?.privateDanmakus && crewNode.privateDanmakus.length > 0) {
    setTimeout(() => triggerCrewDanmakus(crewNode.privateDanmakus!), 500);
  } else if (targetNode.danmakus && targetNode.danmakus.length > 0) {
    setTimeout(() => triggerDanmakusForDialogue(0), 300);
  }

  if (crewNode?.innerThoughts && crewNode.innerThoughts.length > 0) {
    setTimeout(() => triggerInnerThoughts(crewNode.innerThoughts!), 800);
  }
}

export function triggerCrewDanmakus(danmakus: CrewDanmaku[]): void {
  const perspective = get(currentCrewPerspective);
  for (const dm of danmakus) {
    const isCurrentPerspective = dm.sourcePerspective === perspective;
    if (dm.isPrivateChat && !isCurrentPerspective) continue;
    if (dm.isInnerThought && !isCurrentPerspective) continue;
    
    addDanmaku({
      ...dm,
      color: dm.isInnerThought ? (dm.color || '#ff9999') : dm.color
    });
    
    const displayDuration = dm.isInnerThought ? 6000 : 8000;
    setTimeout(() => removeDanmaku(dm.id), displayDuration);
  }
}

export function triggerInnerThoughts(thoughts: CrewInnerThought[]): void {
  const perspective = get(currentCrewPerspective);
  const relevantThoughts = thoughts.filter(t => t.perspectiveId === perspective);
  
  for (const thought of relevantThoughts) {
    const thoughtDanmaku: Danmaku = {
      id: `thought_${thought.perspectiveId}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      username: thought.speaker,
      content: thought.text,
      timestamp: Date.now(),
      color: '#ffcc99',
      isImportant: thought.triggersSecret || thought.thoughtDepth === 'suppressed'
    };
    addDanmaku(thoughtDanmaku);
    setTimeout(() => removeDanmaku(thoughtDanmaku.id), 7000);
  }
}

export function rewindToCheckpoint(checkpoint: RewindCheckpoint): {
  success: boolean;
  reason?: string;
} {
  const result = initiateRewind(checkpoint);
  if (!result.success) {
    return result;
  }

  clearDanmakus();
  clearDanmakuTimeouts();

  gameState.update(state => ({
    ...state,
    currentNodeId: checkpoint.nodeId,
    dialogueIndex: checkpoint.dialogueIndex,
    variables: { ...checkpoint.snapshot.variables },
    updatedAt: Date.now()
  }));

  const targetNode = getNode(checkpoint.nodeId);
  if (targetNode?.danmakus && targetNode.danmakus.length > 0) {
    setTimeout(() => triggerDanmakusForDialogue(checkpoint.dialogueIndex), 500);
  }

  return { success: true };
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
  const channelLevel = getChannelLevel();
  const rewindEffect = getActiveRewindEffect();
  const pseudoLiveMode = get(settings).pseudoLiveMode;
  const showImportant = shouldShowImportantDanmaku(pseudoLiveMode);
  const showBackend = shouldShowBackendPerspective(pseudoLiveMode);

  const danmakuCorruption = Math.max(corruptionLevel, channelLevel.communication);
  
  let relevantDanmakus = node.danmakus.filter(d => {
    if (d.dialogueIndex !== undefined) {
      return d.dialogueIndex === dialogueIndex;
    }
    const baseTime = dialogueIndex * 10000;
    return d.timestamp >= baseTime && d.timestamp < baseTime + 10000;
  });

  if (!showImportant) {
    relevantDanmakus = relevantDanmakus.filter(d => !d.isImportant);
  }

  if (!showBackend) {
    relevantDanmakus = relevantDanmakus.filter(d => !d.isBackendOnly);
  }
  
  if (rewindEffect?.danmakuReorderSeed !== undefined) {
    relevantDanmakus = shuffleDanmakusWithSeed(relevantDanmakus, rewindEffect.danmakuReorderSeed);
  } else if (danmakuCorruption > 25 && Math.random() < getDanmakuReorderChance(danmakuCorruption)) {
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
    
    delay = calculateDanmakuDelay(delay, danmakuCorruption);

    if (rewindEffect?.danmakuReorderSeed !== undefined) {
      delay = delay * (0.7 + Math.random() * 0.6);
    }
    
    const timeout = window.setTimeout(() => {
      const corruptedDanmaku = { ...danmaku };
      if (danmakuCorruption > 35 || rewindEffect) {
        const glitchIntensity = rewindEffect ? danmakuCorruption * 0.8 : danmakuCorruption * 0.6;
        corruptedDanmaku.content = glitchSubtitleText(danmaku.content, glitchIntensity);
      }
      if (danmakuCorruption > 60 || rewindEffect?.danmakuReorderSeed !== undefined) {
        if (Math.random() < (rewindEffect ? 0.5 : 0.3)) {
          corruptedDanmaku.color = ['#ff0066', '#00ffcc', '#ffff00', '#ff6600', '#6600ff', '#ff9900', '#00ff66'][Math.floor(Math.random() * 7)];
        }
      }
      if (channelLevel.communication > 70 && Math.random() < (channelLevel.communication - 70) / 60) {
        corruptedDanmaku.content = '[信号丢失]';
      }
      addDanmaku(corruptedDanmaku);
      
      const displayDuration = (danmakuCorruption > 70 || rewindEffect)
        ? 5000 + Math.random() * 4000
        : 8000;
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
  const channelLevel = getChannelLevel();
  const pseudoLiveMode = get(settings).pseudoLiveMode;
  const showImportant = shouldShowImportantDanmaku(pseudoLiveMode);
  const showBackend = shouldShowBackendPerspective(pseudoLiveMode);
  const danmakuCorruption = Math.max(corruptionLevel, channelLevel.communication);
  
  let dueDanmakus = node.danmakus.filter(d => {
    if (d.dialogueIndex !== dialogueIndex) return false;
    const targetMs = d.relativeMs !== undefined ? d.relativeMs : (d.timestamp % 10000);
    return Math.abs(targetMs - elapsedMs) <= tolerance;
  });

  if (!showImportant) {
    dueDanmakus = dueDanmakus.filter(d => !d.isImportant);
  }

  if (!showBackend) {
    dueDanmakus = dueDanmakus.filter(d => !d.isBackendOnly);
  }
  
  dueDanmakus.forEach(danmaku => {
    const corruptedDanmaku = { ...danmaku };
    if (danmakuCorruption > 35) {
      corruptedDanmaku.content = glitchSubtitleText(danmaku.content, danmakuCorruption * 0.6);
    }
    if (danmakuCorruption > 60 && Math.random() < 0.3) {
      corruptedDanmaku.color = ['#ff0066', '#00ffcc', '#ffff00', '#ff6600', '#6600ff'][Math.floor(Math.random() * 5)];
    }
    if (channelLevel.communication > 70 && Math.random() < (channelLevel.communication - 70) / 60) {
      corruptedDanmaku.content = '[信号丢失]';
    }
    addDanmaku(corruptedDanmaku);
    const displayDuration = danmakuCorruption > 70 ? 5000 + Math.random() * 3000 : 8000;
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
  resetHullDamage();
  goToNode('start');
}

export function getAllEndings() {
  return allEndings;
}

export function getEndingById(id: string) {
  return allEndings.find(e => e.id === id);
}

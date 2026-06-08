import { writable, derived, get } from 'svelte/store';
import type {
  AnonymousSenderState,
  AnonymousEmail,
  TerminalRecord,
  AnonymousTrigger,
  AnonymousMessageType
} from '../types/game';
import { anonymousEmails, terminalRecords, anonymousTriggers } from '../data/anonymousSender';
import { gameState } from './store';
import { checkMemoryCondition } from './memory';
import { checkTrustCondition } from './trust';
import { playSFX } from './audio';

function createInitialState(): AnonymousSenderState {
  return {
    emails: [],
    terminalRecords: [],
    triggeredIds: [],
    unreadEmailCount: 0,
    unreadTerminalCount: 0,
    activeNotification: null,
    isMailboxOpen: false,
    isTerminalOpen: false,
    viewingEmailId: null,
    viewingTerminalId: null
  };
}

export const anonymousSenderState = writable<AnonymousSenderState>(createInitialState());

export const unreadEmailCount = derived(
  anonymousSenderState,
  $s => $s.unreadEmailCount
);

export const unreadTerminalCount = derived(
  anonymousSenderState,
  $s => $s.unreadTerminalCount
);

export const totalUnreadCount = derived(
  anonymousSenderState,
  $s => $s.unreadEmailCount + $s.unreadTerminalCount
);

export const latestMessagePreview = derived(
  anonymousSenderState,
  $s => {
    const all = [
      ...$s.emails.map(e => ({ type: 'email' as AnonymousMessageType, subject: e.subject, timestamp: e.timestamp })),
      ...$s.terminalRecords.map(t => ({ type: 'terminal' as AnonymousMessageType, subject: t.title, timestamp: t.timestamp }))
    ];
    if (all.length === 0) return '';
    all.sort((a, b) => b.timestamp - a.timestamp);
    const latest = all[0];
    return `${latest.type === 'email' ? '📧' : '💻'} ${latest.subject}`;
  }
);

function findEmailById(id: string): AnonymousEmail | undefined {
  return anonymousEmails.find(e => e.id === id);
}

function findTerminalById(id: string): TerminalRecord | undefined {
  return terminalRecords.find(t => t.id === id);
}

export function receiveEmail(emailId: string): boolean {
  const template = findEmailById(emailId);
  if (!template) return false;

  const state = get(anonymousSenderState);
  if (state.emails.some(e => e.id === emailId)) return false;

  const newEmail: AnonymousEmail = {
    ...template,
    timestamp: Date.now(),
    isRead: false
  };

  anonymousSenderState.update(s => ({
    ...s,
    emails: [newEmail, ...s.emails],
    unreadEmailCount: s.unreadEmailCount + 1,
    activeNotification: {
      type: 'email',
      id: emailId,
      subject: newEmail.subject
    }
  }));

  playSFX('notify');

  setTimeout(() => {
    anonymousSenderState.update(s => ({
      ...s,
      activeNotification: null
    }));
  }, 4000);

  return true;
}

export function receiveTerminalRecord(recordId: string): boolean {
  const template = findTerminalById(recordId);
  if (!template) return false;

  const state = get(anonymousSenderState);
  if (state.terminalRecords.some(t => t.id === recordId)) return false;

  const newRecord: TerminalRecord = {
    ...template,
    timestamp: Date.now(),
    isRead: false
  };

  anonymousSenderState.update(s => ({
    ...s,
    terminalRecords: [newRecord, ...s.terminalRecords],
    unreadTerminalCount: s.unreadTerminalCount + 1,
    activeNotification: {
      type: 'terminal',
      id: recordId,
      subject: newRecord.title
    }
  }));

  playSFX('keyboard');

  setTimeout(() => {
    anonymousSenderState.update(s => ({
      ...s,
      activeNotification: null
    }));
  }, 4000);

  return true;
}

export function markEmailRead(emailId: string): void {
  anonymousSenderState.update(s => {
    const email = s.emails.find(e => e.id === emailId);
    if (!email || email.isRead) return s;
    return {
      ...s,
      emails: s.emails.map(e =>
        e.id === emailId ? { ...e, isRead: true } : e
      ),
      unreadEmailCount: Math.max(0, s.unreadEmailCount - 1)
    };
  });
}

export function markTerminalRead(recordId: string): void {
  anonymousSenderState.update(s => {
    const record = s.terminalRecords.find(t => t.id === recordId);
    if (!record || record.isRead) return s;
    return {
      ...s,
      terminalRecords: s.terminalRecords.map(t =>
        t.id === recordId ? { ...t, isRead: true } : t
      ),
      unreadTerminalCount: Math.max(0, s.unreadTerminalCount - 1)
    };
  });
}

export function openMailbox(): void {
  anonymousSenderState.update(s => ({ ...s, isMailboxOpen: true, isTerminalOpen: false }));
}

export function closeMailbox(): void {
  anonymousSenderState.update(s => ({ ...s, isMailboxOpen: false, viewingEmailId: null }));
}

export function openTerminalLog(): void {
  anonymousSenderState.update(s => ({ ...s, isTerminalOpen: true, isMailboxOpen: false }));
}

export function closeTerminalLog(): void {
  anonymousSenderState.update(s => ({ ...s, isTerminalOpen: false, viewingTerminalId: null }));
}

export function viewEmail(emailId: string): void {
  markEmailRead(emailId);
  anonymousSenderState.update(s => ({ ...s, viewingEmailId: emailId }));
}

export function viewTerminalRecord(recordId: string): void {
  markTerminalRead(recordId);
  anonymousSenderState.update(s => ({ ...s, viewingTerminalId: recordId }));
}

export function checkAndTriggerMessages(context: {
  nodeId?: string;
  dialogueIndex?: number;
  variables?: Record<string, string | number | boolean>;
}): void {
  const state = get(anonymousSenderState);
  const triggers = anonymousTriggers.filter(t => !state.triggeredIds.includes(t.id));

  for (const trigger of triggers) {
    if (shouldTrigger(trigger, context)) {
      fireTrigger(trigger);
    }
  }
}

function shouldTrigger(
  trigger: AnonymousTrigger,
  context: {
    nodeId?: string;
    dialogueIndex?: number;
    variables?: Record<string, string | number | boolean>;
  }
): boolean {
  if (trigger.triggerNodeId && trigger.triggerNodeId !== context.nodeId) {
    return false;
  }

  if (trigger.triggerDialogueIndex !== undefined) {
    if (context.dialogueIndex === undefined) return false;
    if (context.dialogueIndex < trigger.triggerDialogueIndex) return false;
  }

  if (trigger.triggerVariable) {
    const vars = context.variables || get(gameState).variables;
    if (vars[trigger.triggerVariable.key] !== trigger.triggerVariable.value) {
      return false;
    }
  }

  if (trigger.memoryCondition && !checkMemoryCondition(trigger.memoryCondition)) {
    return false;
  }

  if (trigger.trustCondition && !checkTrustCondition(trigger.trustCondition)) {
    return false;
  }

  return true;
}

let pendingTimeouts: Map<string, number> = new Map();

function fireTrigger(trigger: AnonymousTrigger): void {
  if (pendingTimeouts.has(trigger.id)) return;

  anonymousSenderState.update(s => ({
    ...s,
    triggeredIds: [...s.triggeredIds, trigger.id]
  }));

  const delay = trigger.delayMs || 0;

  const timeout = window.setTimeout(() => {
    pendingTimeouts.delete(trigger.id);
    if (trigger.messageType === 'email') {
      receiveEmail(trigger.messageId);
    } else if (trigger.messageType === 'terminal') {
      receiveTerminalRecord(trigger.messageId);
    }
  }, delay);

  pendingTimeouts.set(trigger.id, timeout);
}

export function clearPendingTriggers(): void {
  pendingTimeouts.forEach(t => clearTimeout(t));
  pendingTimeouts.clear();
}

export function resetAnonymousSenderState(): void {
  clearPendingTriggers();
  anonymousSenderState.set(createInitialState());
}

export function getAnonymousSenderPersistentState():
  Omit<AnonymousSenderState, 'activeNotification' | 'isMailboxOpen' | 'isTerminalOpen' | 'viewingEmailId' | 'viewingTerminalId'> {
  const s = get(anonymousSenderState);
  return {
    emails: s.emails,
    terminalRecords: s.terminalRecords,
    triggeredIds: s.triggeredIds,
    unreadEmailCount: s.unreadEmailCount,
    unreadTerminalCount: s.unreadTerminalCount
  };
}

export function restoreAnonymousSenderState(
  persisted: Omit<AnonymousSenderState, 'activeNotification' | 'isMailboxOpen' | 'isTerminalOpen' | 'viewingEmailId' | 'viewingTerminalId'> | undefined
): void {
  if (!persisted) {
    resetAnonymousSenderState();
    return;
  }
  anonymousSenderState.update(s => ({
    ...s,
    emails: persisted.emails || [],
    terminalRecords: persisted.terminalRecords || [],
    triggeredIds: persisted.triggeredIds || [],
    unreadEmailCount: persisted.unreadEmailCount || 0,
    unreadTerminalCount: persisted.unreadTerminalCount || 0,
    activeNotification: null,
    isMailboxOpen: false,
    isTerminalOpen: false,
    viewingEmailId: null,
    viewingTerminalId: null
  }));
}

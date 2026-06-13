import type { SyncRecord, SyncPayload } from '../types/game';
import { loadSaveSlots, saveToSlot, loadSettings, saveSettings } from './storage';
import { exportMemory, importMemory } from './memory';

const SYNC_CHANNEL_NAME = 'deep_sea_archive_sync';
const SYNC_STORAGE_KEY = 'deep_sea_sync_records';
const DEVICE_ID_KEY = 'deep_sea_device_id';

let channel: BroadcastChannel | null = null;

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'iOS设备';
  if (/Android/.test(ua)) return 'Android设备';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux PC';
  return '未知设备';
}

export function loadSyncRecords(): SyncRecord[] {
  try {
    const data = localStorage.getItem(SYNC_STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load sync records:', e);
  }
  return [];
}

function saveSyncRecords(records: SyncRecord[]): void {
  localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(records));
}

export function registerCurrentDevice(): SyncRecord {
  const records = loadSyncRecords();
  const deviceId = getDeviceId();
  const existing = records.find(r => r.deviceId === deviceId);

  const slots = loadSaveSlots();
  const mem = exportMemory();
  const clueCount = mem ? Object.keys(mem.unlockedClues || {}).length : 0;
  const playthroughCount = mem ? mem.currentPlaythrough : 0;

  const record: SyncRecord = {
    id: existing?.id || 'sync_' + Date.now().toString(36),
    deviceId,
    deviceName: getDeviceName(),
    lastSyncAt: Date.now(),
    saveSlotCount: slots.length,
    memoryClueCount: clueCount,
    playthroughCount
  };

  const idx = records.findIndex(r => r.deviceId === deviceId);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }

  saveSyncRecords(records);
  return record;
}

export function exportSyncPayload(): SyncPayload {
  const slots = loadSaveSlots();
  const mem = exportMemory();
  const settings = loadSettings();

  return {
    version: 1,
    exportedAt: Date.now(),
    deviceId: getDeviceId(),
    deviceName: getDeviceName(),
    saveSlots: JSON.stringify(slots),
    memory: JSON.stringify(mem),
    settings: JSON.stringify(settings)
  };
}

export function importSyncPayload(payload: SyncPayload): { success: boolean; message: string } {
  try {
    if (payload.version !== 1) {
      return { success: false, message: '不支持的同步数据版本' };
    }

    if (payload.deviceId === getDeviceId()) {
      return { success: false, message: '不能从同一设备导入数据' };
    }

    const incomingSlots = JSON.parse(payload.saveSlots);
    const incomingMemory = JSON.parse(payload.memory);
    const incomingSettings = JSON.parse(payload.settings);

    const localSlots = loadSaveSlots();

    for (const slot of incomingSlots) {
      const localIdx = localSlots.findIndex(s => s.id === slot.id);
      if (localIdx >= 0) {
        if (slot.savedAt > localSlots[localIdx].savedAt) {
          saveToSlot(slot.id, slot.state, slot.preview);
        }
      } else {
        saveToSlot(slot.id, slot.state, slot.preview);
      }
    }

    importMemory(incomingMemory);

    const localSettings = loadSettings();
    saveSettings({ ...localSettings, ...incomingSettings });

    registerCurrentDevice();

    broadcastSync();

    return { success: true, message: '数据同步成功' };
  } catch (e) {
    return { success: false, message: '同步数据格式错误：' + (e as Error).message };
  }
}

export function exportToFile(): void {
  const payload = exportSyncPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deep_sea_archive_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromFile(): Promise<{ success: boolean; message: string }> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ success: false, message: '未选择文件' });
        return;
      }
      try {
        const text = await file.text();
        const payload = JSON.parse(text) as SyncPayload;
        const result = importSyncPayload(payload);
        resolve(result);
      } catch (e) {
        resolve({ success: false, message: '文件格式错误' });
      }
    };
    input.click();
  });
}

export function initSyncChannel(onRemoteSync?: () => void): void {
  try {
    if (typeof BroadcastChannel === 'undefined') return;
    channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    channel.onmessage = () => {
      registerCurrentDevice();
      onRemoteSync?.();
    };
  } catch (e) {
    console.warn('BroadcastChannel not available:', e);
  }
}

export function broadcastSync(): void {
  try {
    channel?.postMessage({ type: 'sync', deviceId: getDeviceId(), timestamp: Date.now() });
  } catch (e) {
    // ignore
  }
}

export function closeSyncChannel(): void {
  channel?.close();
  channel = null;
}

export function generateShareCode(): string {
  const payload = exportSyncPayload();
  const json = JSON.stringify(payload);
  return btoa(encodeURIComponent(json));
}

export function importFromShareCode(code: string): { success: boolean; message: string } {
  try {
    const json = decodeURIComponent(atob(code));
    const payload = JSON.parse(json) as SyncPayload;
    return importSyncPayload(payload);
  } catch (e) {
    return { success: false, message: '分享码格式错误' };
  }
}

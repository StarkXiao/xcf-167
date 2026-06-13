import { writable, derived, get } from 'svelte/store';
import type { MoodType } from '../types/game';

export interface PodcastSettings {
  autoPlay: boolean;
  showSubtitles: boolean;
  subtitleSize: 'small' | 'medium' | 'large';
  narrationSpeed: number;
  ambientVolume: number;
  voiceVolume: number;
  sfxVolume: number;
  immersiveMode: boolean;
  shakeEnabled: boolean;
}

export interface PodcastState {
  isPlaying: boolean;
  isPaused: boolean;
  isWaitingForChoice: boolean;
  showMenu: boolean;
  currentMood: MoodType;
  dialogueProgress: number;
  totalDialogues: number;
  currentNodeTitle: string;
  ambientActive: boolean;
  playbackRate: number;
  isLoading: boolean;
}

const defaultSettings: PodcastSettings = {
  autoPlay: true,
  showSubtitles: true,
  subtitleSize: 'medium',
  narrationSpeed: 1,
  ambientVolume: 0.4,
  voiceVolume: 0.8,
  sfxVolume: 0.6,
  immersiveMode: true,
  shakeEnabled: true
};

const SETTINGS_KEY = 'deep_sea_podcast_settings';

function loadSettings(): PodcastSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Failed to load podcast settings:', e);
  }
  return { ...defaultSettings };
}

function saveSettings(settings: PodcastSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save podcast settings:', e);
  }
}

export const podcastSettings = writable<PodcastSettings>(loadSettings());

podcastSettings.subscribe(saveSettings);

const defaultState: PodcastState = {
  isPlaying: false,
  isPaused: false,
  isWaitingForChoice: false,
  showMenu: false,
  currentMood: 'calm',
  dialogueProgress: 0,
  totalDialogues: 0,
  currentNodeTitle: '',
  ambientActive: false,
  playbackRate: 1,
  isLoading: false
};

export const podcastState = writable<PodcastState>(defaultState);

export function setPlaying(playing: boolean): void {
  podcastState.update(s => ({ ...s, isPlaying: playing, isPaused: !playing && s.isPlaying ? false : s.isPaused }));
}

export function setPaused(paused: boolean): void {
  podcastState.update(s => ({ ...s, isPaused: paused }));
}

export function togglePlay(): boolean {
  const state = get(podcastState);
  const newPlaying = !state.isPlaying;
  podcastState.update(s => ({ ...s, isPlaying: newPlaying, isPaused: false }));
  return newPlaying;
}

export function setWaitingForChoice(waiting: boolean): void {
  podcastState.update(s => ({ ...s, isWaitingForChoice: waiting, isPlaying: waiting ? false : s.isPlaying }));
}

export function setCurrentMood(mood: MoodType): void {
  podcastState.update(s => ({ ...s, currentMood: mood }));
}

export function setDialogueProgress(current: number, total: number): void {
  podcastState.update(s => ({ ...s, dialogueProgress: current, totalDialogues: total }));
}

export function setCurrentNodeTitle(title: string): void {
  podcastState.update(s => ({ ...s, currentNodeTitle: title }));
}

export function setPlaybackRate(rate: number): void {
  podcastState.update(s => ({ ...s, playbackRate: rate }));
}

export function setLoading(loading: boolean): void {
  podcastState.update(s => ({ ...s, isLoading: loading }));
}

export function openMenu(): void {
  podcastState.update(s => ({ ...s, showMenu: true }));
}

export function closeMenu(): void {
  podcastState.update(s => ({ ...s, showMenu: false }));
}

export function updatePodcastSetting<K extends keyof PodcastSettings>(
  key: K,
  value: PodcastSettings[K]
): void {
  podcastSettings.update(s => ({ ...s, [key]: value }));
}

export function resetPodcastState(): void {
  podcastState.set({ ...defaultState });
}

export const progressPercent = derived(
  podcastState,
  s => s.totalDialogues > 0 ? Math.round((s.dialogueProgress / s.totalDialogues) * 100) : 0
);

export const moodColor = derived(podcastState, s => {
  const moodColors: Record<MoodType, string> = {
    normal: '#64b4ff',
    calm: '#40c8a0',
    tense: '#ffb040',
    scared: '#ff6060',
    whisper: '#a080ff',
    urgent: '#ff4040',
    mystery: '#80a0ff',
    terrified: '#ff0040'
  };
  return moodColors[s.currentMood] || '#64b4ff';
});

export function triggerHaptic(intensity: 'light' | 'medium' | 'heavy' = 'medium'): void {
  const settings = get(podcastSettings);
  if (!settings.shakeEnabled) return;
  
  if (navigator.vibrate) {
    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 25,
      heavy: [40, 30, 40]
    };
    try {
      navigator.vibrate(patterns[intensity]);
    } catch (e) {
      // ignore
    }
  }
}

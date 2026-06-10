import type { SFXType, BGMType, MoodType } from '../types/game';
import { signalCorruption, getAudioDistortionParams, getChannelLevel } from './signalCorruption';
import { get } from 'svelte/store';
import { logTriggeredSfx, getActiveRewindEffect, getSfxOverride } from './timeRewind';

let audioContext: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
type BGMNode = { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode; lfoGain?: GainNode };
let bgmNodes: BGMNode[] = [];
let noiseBuffer: AudioBuffer | null = null;
let bgmNoiseNode: AudioBufferSourceNode | null = null;
let bgmNoiseGain: GainNode | null = null;
let bgmFilter: BiquadFilterNode | null = null;
let corruptionUpdateTimer: number | null = null;

let bgmVolume = 0.3;
let sfxVolume = 0.5;
let muted = false;
let currentBGMType: string | null = null;

const getSafeAudioTime = (): number => audioContext?.currentTime ?? 0;

export function initAudio(): void {
  if (audioContext) return;
  
  try {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    bgmGain = audioContext.createGain();
    bgmGain.gain.value = muted ? 0 : bgmVolume;
    bgmGain.connect(audioContext.destination);
    
    sfxGain = audioContext.createGain();
    sfxGain.gain.value = muted ? 0 : sfxVolume;
    sfxGain.connect(audioContext.destination);
    
    noiseBuffer = createNoiseBuffer(audioContext, 2);
  } catch (e) {
    console.error('Failed to init audio:', e);
  }
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function resumeAudio(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

function startCorruptionAudioUpdate(): void {
  if (corruptionUpdateTimer !== null) return;
  corruptionUpdateTimer = window.setInterval(() => {
    if (!audioContext || !bgmGain) return;
    const corruptionLevel = get(signalCorruption).level;
    const ch = getChannelLevel();
    const effectiveAudio = Math.max(corruptionLevel, ch.audio);
    const params = getAudioDistortionParams(effectiveAudio);
    const ctx = audioContext;
    
    if (bgmFilter) {
      bgmFilter.frequency.setValueAtTime(params.filterCutoff, ctx.currentTime);
    }
    
    if (bgmNoiseGain) {
      bgmNoiseGain.gain.setValueAtTime(muted ? 0 : params.noiseAmount, ctx.currentTime);
    }
    
    if (ch.audio >= 70 && bgmGain) {
      const blackoutGain = 1 - (ch.audio - 70) / 100;
      bgmGain.gain.setValueAtTime(Math.max(0.15, blackoutGain), ctx.currentTime);
    } else if (bgmGain) {
      bgmGain.gain.setValueAtTime(muted ? 0 : 0.5, ctx.currentTime);
    }
    
    bgmNodes.forEach(({ osc, lfo, lfoGain }, i) => {
      if (lfo && lfoGain) {
        const baseLfoRate = currentBGMType === 'tense' ? 0.25 
          : currentBGMType === 'mystery' ? 0.12 
          : currentBGMType === 'calm' ? 0.06 
          : 0.08;
        lfo.frequency.setValueAtTime(baseLfoRate + i * 0.03 + params.pitchShift * 0.001, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.024 + params.lfoDepth * 0.05, ctx.currentTime);
      }
      osc.detune.setValueAtTime(
        params.pitchShift + Math.sin(Date.now() / 500 + i) * effectiveAudio * 0.05, 
        ctx.currentTime
      );
    });
  }, 100);
}

function stopCorruptionAudioUpdate(): void {
  if (corruptionUpdateTimer !== null) {
    clearInterval(corruptionUpdateTimer);
    corruptionUpdateTimer = null;
  }
}

export function playBGM(type: BGMType = 'deep'): void {
  if (currentBGMType === type) return;
  currentBGMType = type;
  
  stopBGM();
  if (!audioContext || !bgmGain) return;
  
  const ctx = audioContext;
  const presets: Record<string, { freqs: number[]; lfoRate: number; baseVol: number }> = {
    deep:    { freqs: [43.65, 55, 82.5],       lfoRate: 0.08, baseVol: 0.08 },
    tense:   { freqs: [58.27, 73.42, 110],     lfoRate: 0.25, baseVol: 0.1 },
    calm:    { freqs: [55, 65.41, 98],          lfoRate: 0.06, baseVol: 0.06 },
    mystery: { freqs: [49, 58.27, 87.31],       lfoRate: 0.12, baseVol: 0.07 }
  };
  
  const preset = presets[type] || presets.deep;
  
  bgmFilter = ctx.createBiquadFilter();
  bgmFilter.type = 'lowpass';
  bgmFilter.frequency.value = 8000;
  bgmFilter.Q.value = 0.5;
  bgmFilter.connect(bgmGain);
  
  bgmNoiseGain = ctx.createGain();
  bgmNoiseGain.gain.value = 0;
  bgmNoiseGain.connect(bgmGain);
  
  if (noiseBuffer) {
    bgmNoiseNode = ctx.createBufferSource();
    bgmNoiseNode.buffer = noiseBuffer;
    bgmNoiseNode.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 1500;
    noiseFilter.Q.value = 0.3;
    bgmNoiseNode.connect(noiseFilter);
    noiseFilter.connect(bgmNoiseGain);
    bgmNoiseNode.start();
  }
  
  preset.freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = preset.baseVol / (i + 1);
    
    const lfo = ctx.createOscillator();
    const lfoGainNode = ctx.createGain();
    lfo.frequency.value = preset.lfoRate + i * 0.03;
    lfoGainNode.gain.value = preset.baseVol * 0.3;
    lfo.connect(lfoGainNode);
    lfoGainNode.connect(gain.gain);
    lfo.start();
    
    osc.connect(gain);
    gain.connect(bgmFilter as BiquadFilterNode);
    osc.start();
    
    bgmNodes.push({ osc, gain, lfo, lfoGain: lfoGainNode });
  });
  
  startCorruptionAudioUpdate();
}

function stopSingleNode(node: BGMNode, ctx: AudioContext): void {
  try {
    const now = ctx.currentTime;
    node.gain.gain.cancelScheduledValues(now);
    node.gain.gain.setValueAtTime(node.gain.gain.value, now);
    node.gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    node.osc.stop(now + 0.5);
    if (node.lfo) node.lfo.stop(now + 0.5);
  } catch (e) {
    // ignore
  }
}

export function stopBGM(): void {
  stopCorruptionAudioUpdate();
  const ctx = audioContext;
  if (ctx) {
    bgmNodes.forEach(node => stopSingleNode(node, ctx));
  }
  bgmNodes = [];
  
  if (bgmNoiseNode && ctx) {
    try {
      bgmNoiseNode.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // ignore
    }
    bgmNoiseNode = null;
  }
  if (bgmNoiseGain && ctx) {
    try {
      const now = ctx.currentTime;
      bgmNoiseGain.gain.cancelScheduledValues(now);
      bgmNoiseGain.gain.setValueAtTime(bgmNoiseGain.gain.value, now);
      bgmNoiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    } catch (e) {
      // ignore
    }
    bgmNoiseGain = null;
  }
  bgmFilter = null;
  currentBGMType = null;
}

export function playSFX(type: SFXType, customVolume?: number): void {
  if (!audioContext || !sfxGain) return;

  logTriggeredSfx(type);

  const ch = getChannelLevel();
  const sonarDegradation = ch.audio;

  if (sonarDegradation >= 85) {
    if (type === 'sonar' || type === 'bubbles' || type === 'water_drip') return;
    if (Math.random() < (sonarDegradation - 85) / 30) return;
  }

  let vol = customVolume !== undefined ? customVolume : 1;
  if (sonarDegradation > 30) {
    const sonarDampen = 1 - (sonarDegradation - 30) / 140;
    vol *= Math.max(0.2, sonarDampen);
    if (type === 'sonar') vol *= 0.5;
  }

  _playSFXInternal(type, vol);
}

export function playSFXWithRewind(type: SFXType, customVolume?: number): void {
  if (!audioContext || !sfxGain) return;

  const rewindEffect = getActiveRewindEffect();
  const override = rewindEffect ? getSfxOverride(type, rewindEffect) : null;

  const actualType = override ? override.sfx : type;
  const actualDelay = override?.delay || 0;
  const actualVolume = customVolume !== undefined ? customVolume : 1;

  logTriggeredSfx(actualType);

  if (actualDelay > 0) {
    setTimeout(() => {
      _playSFXInternal(actualType, actualVolume);
    }, actualDelay);
  } else {
    _playSFXInternal(actualType, actualVolume);
  }
}

function _playSFXInternal(type: SFXType, vol: number): void {
  if (!audioContext || !sfxGain) return;
  
  const now = audioContext.currentTime;
  
  switch (type) {
    case 'click':
      playTone(800, 0.04, 'square', 0.08 * vol, now);
      break;
      
    case 'select':
      playTone(523, 0.06, 'sine', 0.12 * vol, now);
      playTone(784, 0.06, 'sine', 0.08 * vol, now + 0.04);
      break;
      
    case 'notify':
      playTone(880, 0.05, 'sine', 0.1 * vol, now);
      playTone(1108, 0.08, 'sine', 0.08 * vol, now + 0.06);
      break;
      
    case 'warning':
      for (let i = 0; i < 3; i++) {
        playTone(880, 0.12, 'sawtooth', 0.12 * vol, now + i * 0.2);
      }
      break;
      
    case 'alarm':
      for (let i = 0; i < 4; i++) {
        playTone(i % 2 === 0 ? 1200 : 800, 0.15, 'square', 0.15 * vol, now + i * 0.18);
      }
      break;
      
    case 'sonar':
      playTone(1800, 0.015, 'sine', 0.08 * vol, now);
      playTone(1200, 0.04, 'sine', 0.06 * vol, now + 0.08);
      playTone(800, 0.08, 'sine', 0.04 * vol, now + 0.18);
      break;
      
    case 'bubbles':
      for (let i = 0; i < 8; i++) {
        playTone(
          300 + Math.random() * 500,
          0.04 + Math.random() * 0.12,
          'sine',
          0.04 * vol,
          now + i * (0.08 + Math.random() * 0.1)
        );
      }
      break;
      
    case 'water_drip':
      playTone(1200 + Math.random() * 400, 0.02, 'sine', 0.08 * vol, now);
      playNoise(0.05, 0.06 * vol, 'lowpass', 800, now);
      break;
      
    case 'water_flow':
      playNoise(0.4, 0.05 * vol, 'lowpass', 600, now);
      for (let i = 0; i < 6; i++) {
        playTone(200 + Math.random() * 300, 0.1, 'sine', 0.02 * vol, now + i * 0.07);
      }
      break;
      
    case 'metal_creak':
      playTone(80 + Math.random() * 40, 0.6, 'sawtooth', 0.06 * vol, now);
      playTone(120 + Math.random() * 60, 0.4, 'square', 0.04 * vol, now + 0.1);
      playNoise(0.5, 0.03 * vol, 'bandpass', 200, now);
      break;
      
    case 'metal_crash':
      playNoise(0.3, 0.2 * vol, 'lowpass', 1500, now);
      playTone(100, 0.4, 'sawtooth', 0.15 * vol, now);
      playTone(60, 0.5, 'square', 0.1 * vol, now + 0.02);
      break;
      
    case 'hull_pressure':
      playTone(50, 1.2, 'sine', 0.08 * vol, now);
      playTone(75, 1.0, 'triangle', 0.05 * vol, now + 0.1);
      playNoise(1.0, 0.02 * vol, 'lowpass', 200, now);
      break;
      
    case 'static':
      playNoise(0.3, 0.05 * vol, 'highpass', 2000, now);
      break;
      
    case 'radio_noise':
      playNoise(0.4, 0.07 * vol, 'bandpass', 1500, now);
      playTone(2000 + Math.random() * 1000, 0.05, 'sine', 0.03 * vol, now + 0.1);
      playTone(1500 + Math.random() * 800, 0.05, 'sine', 0.03 * vol, now + 0.25);
      break;
      
    case 'keyboard':
      for (let i = 0; i < 5; i++) {
        playTone(
          600 + Math.random() * 400,
          0.02,
          'square',
          0.04 * vol,
          now + i * (0.04 + Math.random() * 0.05)
        );
      }
      break;
      
    case 'whisper':
      playNoise(0.6, 0.08 * vol, 'bandpass', 3000, now);
      playTone(800, 0.5, 'sine', 0.02 * vol, now + 0.1);
      break;
      
    case 'heartbeat':
      playTone(60, 0.15, 'sine', 0.15 * vol, now);
      playTone(50, 0.1, 'sine', 0.1 * vol, now + 0.2);
      playTone(60, 0.15, 'sine', 0.12 * vol, now + 0.5);
      playTone(50, 0.1, 'sine', 0.08 * vol, now + 0.7);
      break;
      
    case 'breath':
      playNoise(0.4, 0.05 * vol, 'lowpass', 500, now);
      playNoise(0.3, 0.03 * vol, 'lowpass', 400, now + 0.5);
      break;
      
    case 'glass_crack':
      playNoise(0.15, 0.12 * vol, 'highpass', 3000, now);
      playTone(3000, 0.1, 'sine', 0.06 * vol, now);
      playTone(2000, 0.15, 'triangle', 0.04 * vol, now + 0.05);
      break;
      
    case 'thunder':
      playNoise(0.8, 0.15 * vol, 'lowpass', 200, now);
      playTone(80, 0.6, 'sawtooth', 0.1 * vol, now + 0.05);
      playTone(50, 0.8, 'sine', 0.08 * vol, now + 0.1);
      break;
      
    case 'door_slam':
      playNoise(0.2, 0.18 * vol, 'lowpass', 800, now);
      playTone(150, 0.3, 'square', 0.1 * vol, now);
      playTone(100, 0.25, 'sawtooth', 0.08 * vol, now + 0.02);
      break;
  }
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  startTime: number
): void {
  if (!audioContext || !sfxGain) return;
  const ctx = audioContext;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playNoise(
  duration: number,
  volume: number,
  filterType: BiquadFilterType,
  filterFreq: number,
  startTime: number
): void {
  if (!audioContext || !sfxGain || !noiseBuffer) return;
  const ctx = audioContext;
  
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  
  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  
  source.start(startTime);
  source.stop(startTime + duration + 0.05);
}

export function playTypingSound(mood: MoodType = 'normal'): void {
  const freqMap: Record<MoodType, number> = {
    normal: 700,
    tense: 900,
    scared: 600,
    calm: 500,
    whisper: 400,
    urgent: 1000
  };
  const volMap: Record<MoodType, number> = {
    normal: 0.05,
    tense: 0.07,
    scared: 0.03,
    calm: 0.03,
    whisper: 0.02,
    urgent: 0.08
  };
  const ch = getChannelLevel();
  if (ch.audio >= 80 && Math.random() < (ch.audio - 80) / 40) return;
  const audioDampen = ch.audio > 40 ? 1 - (ch.audio - 40) / 120 : 1;
  playTone(
    freqMap[mood] || 700,
    0.015,
    'square',
    (volMap[mood] || 0.05) * Math.max(0.2, audioDampen),
    getSafeAudioTime()
  );
}

export function setBGMVolume(vol: number): void {
  bgmVolume = Math.max(0, Math.min(1, vol));
  if (bgmGain && !muted && audioContext) {
    bgmGain.gain.value = bgmVolume;
  }
}

export function setSFXVolume(vol: number): void {
  sfxVolume = Math.max(0, Math.min(1, vol));
  if (sfxGain && !muted && audioContext) {
    sfxGain.gain.value = sfxVolume;
  }
}

export function toggleMute(): boolean {
  muted = !muted;
  if (bgmGain) bgmGain.gain.value = muted ? 0 : bgmVolume;
  if (sfxGain) sfxGain.gain.value = muted ? 0 : sfxVolume;
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

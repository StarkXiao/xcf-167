import type { SFXType, BGMType, MoodType } from '../types/game';

let audioContext: AudioContext | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let bgmNodes: { osc: OscillatorNode; gain: GainNode; lfo?: OscillatorNode }[] = [];
let noiseBuffer: AudioBuffer | null = null;

let bgmVolume = 0.3;
let sfxVolume = 0.5;
let muted = false;
let currentBGMType: string | null = null;

export function initAudio(): void {
  if (audioContext) return;
  
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
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

export function playBGM(type: BGMType = 'deep'): void {
  if (currentBGMType === type) return;
  currentBGMType = type;
  
  stopBGM();
  if (!audioContext || !bgmGain) return;
  
  const presets: Record<string, { freqs: number[]; lfoRate: number; baseVol: number }> = {
    deep:    { freqs: [43.65, 55, 82.5],       lfoRate: 0.08, baseVol: 0.08 },
    tense:   { freqs: [58.27, 73.42, 110],     lfoRate: 0.25, baseVol: 0.1 },
    calm:    { freqs: [55, 65.41, 98],          lfoRate: 0.06, baseVol: 0.06 },
    mystery: { freqs: [49, 58.27, 87.31],       lfoRate: 0.12, baseVol: 0.07 }
  };
  
  const preset = presets[type] || presets.deep;
  
  preset.freqs.forEach((freq, i) => {
    const osc = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = preset.baseVol / (i + 1);
    
    const lfo = audioContext!.createOscillator();
    const lfoGain = audioContext!.createGain();
    lfo.frequency.value = preset.lfoRate + i * 0.03;
    lfoGain.gain.value = preset.baseVol * 0.3;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    
    osc.connect(gain);
    gain.connect(bgmGain!);
    osc.start();
    
    bgmNodes.push({ osc, gain, lfo });
  });
}

export function stopBGM(): void {
  bgmNodes.forEach(({ osc, gain, lfo }) => {
    try {
      gain.gain.cancelScheduledValues(audioContext?.currentTime || 0);
      gain.gain.setValueAtTime(gain.gain.value, audioContext!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext!.currentTime + 0.5);
      osc.stop(audioContext!.currentTime + 0.5);
      if (lfo) lfo.stop(audioContext!.currentTime + 0.5);
    } catch (e) {}
  });
  bgmNodes = [];
  currentBGMType = null;
}

export function playSFX(type: SFXType, customVolume?: number): void {
  if (!audioContext || !sfxGain) return;
  
  const now = audioContext.currentTime;
  const vol = customVolume !== undefined ? customVolume : 1;
  
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
  
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  
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
  
  const source = audioContext.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;
  
  const filter = audioContext.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  
  const gain = audioContext.createGain();
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
  const freqMap: Record<string, number> = {
    normal: 700,
    tense: 900,
    scared: 600,
    calm: 500,
    whisper: 400,
    urgent: 1000
  };
  const volMap: Record<string, number> = {
    normal: 0.05,
    tense: 0.07,
    scared: 0.03,
    calm: 0.03,
    whisper: 0.02,
    urgent: 0.08
  };
  playTone(
    freqMap[mood] || 700,
    0.015,
    'square',
    volMap[mood] || 0.05,
    audioContext?.currentTime || 0
  );
}

export function setBGMVolume(vol: number): void {
  bgmVolume = Math.max(0, Math.min(1, vol));
  if (bgmGain && !muted) {
    bgmGain.gain.value = bgmVolume;
  }
}

export function setSFXVolume(vol: number): void {
  sfxVolume = Math.max(0, Math.min(1, vol));
  if (sfxGain && !muted) {
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

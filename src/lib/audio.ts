let audioContext: AudioContext | null = null;
let bgmOscillator: OscillatorNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

let bgmVolume = 0.3;
let sfxVolume = 0.5;
let muted = false;

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
  } catch (e) {
    console.error('Failed to init audio:', e);
  }
}

export function resumeAudio(): void {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
}

export function playBGM(type: 'deep' | 'tense' | 'calm' | 'mystery' = 'deep'): void {
  stopBGM();
  if (!audioContext || !bgmGain) return;
  
  const frequencies: Record<string, number[]> = {
    deep: [55, 82.5, 110],
    tense: [73.42, 110, 146.83],
    calm: [65.41, 98, 130.81],
    mystery: [58.27, 87.31, 116.54]
  };
  
  const freqs = frequencies[type] || frequencies.deep;
  
  freqs.forEach((freq, i) => {
    const osc = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = freq;
    gain.gain.value = 0.1 / (i + 1);
    
    const lfo = audioContext!.createOscillator();
    const lfoGain = audioContext!.createGain();
    lfo.frequency.value = 0.1 + i * 0.05;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    
    osc.connect(gain);
    gain.connect(bgmGain!);
    osc.start();
    
    if (i === 0) {
      bgmOscillator = osc;
    }
  });
}

export function stopBGM(): void {
  if (bgmGain) {
    bgmGain.gain.cancelScheduledValues(audioContext?.currentTime || 0);
  }
}

export function playSFX(type: 'click' | 'select' | 'warning' | 'sonar' | 'bubbles' = 'click'): void {
  if (!audioContext || !sfxGain) return;
  
  const now = audioContext.currentTime;
  
  switch (type) {
    case 'click':
      playTone(800, 0.05, 'square', 0.1, now);
      break;
    case 'select':
      playTone(600, 0.08, 'sine', 0.15, now);
      playTone(900, 0.08, 'sine', 0.1, now + 0.05);
      break;
    case 'warning':
      for (let i = 0; i < 3; i++) {
        playTone(880, 0.15, 'sawtooth', 0.15, now + i * 0.25);
      }
      break;
    case 'sonar':
      playTone(2000, 0.02, 'sine', 0.1, now);
      playTone(1500, 0.05, 'sine', 0.08, now + 0.1);
      break;
    case 'bubbles':
      for (let i = 0; i < 5; i++) {
        playTone(400 + Math.random() * 400, 0.05 + Math.random() * 0.1, 'sine', 0.05, now + i * 0.1);
      }
      break;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType, volume: number, startTime: number): void {
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

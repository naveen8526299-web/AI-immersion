let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playCoinSound(enabled: boolean, volume = 0.5) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(Math.max(0.01, volume * 0.2), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  gain.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(987.77, now); // B5
  osc1.frequency.setValueAtTime(1318.51, now + 0.09); // E6
  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + 0.35);
}

export function playShieldUnlockSound(enabled: boolean, volume = 0.6) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const start = ctx.currentTime + idx * 0.08;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.max(0.01, volume * 0.18), start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
    gain.connect(ctx.destination);

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    osc.connect(gain);
    osc.start(start);
    osc.stop(start + 0.45);
  });
}

export function playThanosWarningSound(enabled: boolean, volume = 0.6) {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(Math.max(0.01, volume * 0.25), now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
  gain.connect(ctx.destination);

  // Dramatic low cosmic brass-like chord
  [110, 146.83, 155.56].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 0.88, now + 0.8);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.85);
  });
}

export function speakHeroLine(text: string, enabled: boolean, volume = 0.7) {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.volume = Math.min(1, Math.max(0, volume));
    utter.rate = 1.04;
    utter.pitch = 1.05;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore speech synthesis errors on unsupported browsers
  }
}

export function stopHeroSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

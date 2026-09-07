// Shared Web Audio sound system (A4.9). Extends the synthesis approach that
// already lived in LoginPage.jsx so the whole app uses one mute flag and one
// set of tiny synthesized cues instead of external audio assets.
//
// Sounds are quiet, short, and OFF by default for anything repeating (e.g.
// cross-role event received) -- only explicit, rare actions play by default,
// and everything respects the mute flag and prefers-reduced-motion.

const STORAGE_KEY = 'fundiq.soundMuted';

let audioCtx = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundMuted(muted) {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch {
    // ignore persistence failures
  }
}

function prefersReducedMotion() {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
  } catch {
    return false;
  }
}

function tone(ctx, { freq, duration, type = 'sine', gain = 0.08, startAt = 0, freqEnd }) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = type;
  const t0 = ctx.currentTime + startAt;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
  gainNode.gain.setValueAtTime(0.0001, t0);
  gainNode.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

// cue name -> synthesis recipe
const CUES = {
  loginSuccess: (ctx) => {
    tone(ctx, { freq: 523.25, duration: 0.14, gain: 0.09 });
    tone(ctx, { freq: 783.99, duration: 0.18, gain: 0.08, startAt: 0.1 });
  },
  alertOpened: (ctx) => {
    tone(ctx, { freq: 440, duration: 0.1, gain: 0.06, type: 'triangle' });
  },
  actionSubmitted: (ctx) => {
    tone(ctx, { freq: 600, duration: 0.08, gain: 0.07, type: 'sine' });
    tone(ctx, { freq: 900, duration: 0.08, gain: 0.05, startAt: 0.06 });
  },
  crossRoleEvent: (ctx) => {
    tone(ctx, { freq: 660, duration: 0.12, gain: 0.05, type: 'sine' });
  },
  error: (ctx) => {
    tone(ctx, { freq: 220, duration: 0.18, gain: 0.07, type: 'sawtooth', freqEnd: 140 });
  },
};

/**
 * Play a named cue. No-op if muted, reduced-motion is requested, or Web
 * Audio is unavailable -- the app must work identically with sound off.
 */
export function playCue(name, { force = false } = {}) {
  if (!force && (isSoundMuted() || prefersReducedMotion())) return;
  const ctx = getContext();
  const recipe = CUES[name];
  if (!ctx || !recipe) return;
  try {
    recipe(ctx);
  } catch {
    // audio failures must never break app flow
  }
}

export const SOUND_CUES = Object.keys(CUES);

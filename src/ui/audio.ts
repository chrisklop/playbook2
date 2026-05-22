/**
 * Tiny procedural-audio module. Generates short tones via Web Audio API —
 * no external sound files to ship, works offline in the PWA.
 *
 * Mute toggle persists via state.audioMuted (default false). When muted,
 * no sounds play and no AudioContext is created.
 *
 * Sources of inspiration for the chime patterns:
 *   - AdVenture Capitalist's coin/click chimes (single-note, soft attack)
 *   - Cookie Clicker's milestone fanfare (3-note ascending major triad)
 */

let ctx: AudioContext | null = null;
let lastClickAt = 0;
const CLICK_THROTTLE_MS = 40;

let mutedFlag = false;
let musicMutedFlag = false;

export function setMuted(v: boolean): void {
  mutedFlag = v;
}

export function isMuted(): boolean {
  return mutedFlag;
}

// ============================================================
// Looped background music
// ============================================================
//
// One HTMLAudioElement, loop=true, paused/played by the music-muted flag.
// We use HTMLAudioElement (not Web Audio decoded buffers) so the file can
// be a regular MP3/OGG that streams from /public, no decoding overhead,
// and the browser handles gapless looping natively.
//
// Browsers block autoplay until the user has interacted with the page,
// so we lazily start playback on the first attempt and silently catch
// the autoplay-block promise rejection. Once any click/tap occurs, the
// next call to startMusic() succeeds.

let musicEl: HTMLAudioElement | null = null;
let musicVolume = 0.20; // background level — well under the SFX chimes
let musicLoaded = false;

export function setMusicMuted(v: boolean): void {
  musicMutedFlag = v;
  if (!musicEl) return;
  if (v) musicEl.pause();
  else startMusic();
}

/**
 * Load and configure the background music track. Idempotent — calling
 * twice with the same URL is a no-op. Call once at app boot.
 *
 * @param url Public-folder URL (e.g. import.meta.env.BASE_URL + 'music/playbook-loop.mp3').
 */
export function loadMusic(url: string): void {
  if (musicLoaded && musicEl?.src.endsWith(url)) return;
  if (typeof Audio === 'undefined') return;
  musicEl = new Audio(url);
  musicEl.loop = true;
  musicEl.volume = musicVolume;
  musicEl.preload = 'auto';
  musicLoaded = true;
  // Don't auto-start — startMusic() will be called when the player
  // interacts (and unmuted). Autoplay would be blocked anyway.
  if (!musicMutedFlag) startMusic();
}

export function startMusic(): void {
  if (!musicEl || musicMutedFlag) return;
  // play() returns a promise that rejects when autoplay is blocked.
  // Swallow it — first user gesture will succeed on the next call.
  void musicEl.play().catch(() => {});
}

export function setMusicVolume(v: number): void {
  musicVolume = Math.max(0, Math.min(1, v));
  if (musicEl) musicEl.volume = musicVolume;
}

function getCtx(): AudioContext | null {
  if (mutedFlag) return null;
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.08,
  startOffsetSec = 0,
): void {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + startOffsetSec;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  // Soft attack + exponential decay so it sounds like a chime, not a beep.
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** A short low click — fires on every tap. Throttled so rapid taps don't stack. */
export function playClick(): void {
  const now = Date.now();
  if (now - lastClickAt < CLICK_THROTTLE_MS) return;
  lastClickAt = now;
  tone(880, 0.04, 'square', 0.03);
}

/** Buy generator — slightly fuller click. */
export function playBuy(): void {
  tone(660, 0.08, 'sine', 0.06);
  tone(990, 0.06, 'sine', 0.04, 0.02);
}

/** Manager hired — 3-note ascending major triad. The classic AdCap "graduation" moment. */
export function playManagerHired(): void {
  tone(523.25, 0.12, 'sine', 0.08); // C5
  tone(659.25, 0.12, 'sine', 0.08, 0.1); // E5
  tone(783.99, 0.2, 'sine', 0.09, 0.2); // G5
}

/** Upgrade purchased — quick rising 2-note ping. */
export function playUpgrade(): void {
  tone(659.25, 0.1, 'triangle', 0.07);
  tone(987.77, 0.14, 'triangle', 0.08, 0.08);
}

/** Milestone crossed (×2 production unlock) — bright 3-note ping. */
export function playMilestone(): void {
  tone(440, 0.08, 'sine', 0.07);
  tone(659.25, 0.08, 'sine', 0.07, 0.07);
  tone(880, 0.16, 'sine', 0.09, 0.14);
}

/** Prestige — descending whoosh into a high resolve. Reserved for the era transition. */
export function playPrestige(): void {
  // Quick sweep down then up — feels like a transition.
  tone(440, 0.4, 'sawtooth', 0.06);
  tone(220, 0.3, 'sawtooth', 0.06, 0.1);
  tone(880, 0.4, 'sine', 0.1, 0.4);
}

// ============================================================
// Musical cues — short one-shot clips that temporarily duck/replace
// the main background loop. Used for frenzy bursts and the prestige
// transition. Falls back gracefully if the file is missing or audio
// is muted.
// ============================================================

const cueEls: Record<string, HTMLAudioElement> = {};
let activeCueKey: string | null = null;
let cueRestoreTimer: number | null = null;

/** Pre-load a one-shot musical cue. Keyed so it can be replayed without
 *  re-fetching. Safe to call multiple times with the same key. */
export function loadCue(key: string, url: string): void {
  if (typeof Audio === 'undefined') return;
  if (cueEls[key]?.src.endsWith(url)) return;
  const el = new Audio(url);
  el.preload = 'auto';
  el.volume = musicVolume;
  cueEls[key] = el;
}

/**
 * Play a preloaded cue. While it plays the background loop is paused.
 * When the cue ends (or `maxDurationMs` elapses, whichever first), the
 * loop resumes from where it left off. A second call to playCue stops
 * any in-flight cue and starts the new one cleanly.
 */
export function playCue(key: string, maxDurationMs = 11000): void {
  if (musicMutedFlag) return;
  const cue = cueEls[key];
  if (!cue) return;

  // Cancel any previously-running cue first.
  if (activeCueKey) {
    const prev = cueEls[activeCueKey];
    if (prev) {
      prev.pause();
      prev.currentTime = 0;
    }
    if (cueRestoreTimer !== null) {
      window.clearTimeout(cueRestoreTimer);
      cueRestoreTimer = null;
    }
  }

  activeCueKey = key;
  cue.volume = musicVolume;
  cue.currentTime = 0;
  if (musicEl) musicEl.pause();
  void cue.play().catch(() => {});

  const restore = () => {
    cueRestoreTimer = null;
    activeCueKey = null;
    if (!musicMutedFlag) startMusic();
  };

  cue.onended = () => {
    if (cueRestoreTimer !== null) {
      window.clearTimeout(cueRestoreTimer);
      cueRestoreTimer = null;
    }
    restore();
  };
  cueRestoreTimer = window.setTimeout(restore, maxDurationMs);
}

/** Stop the currently-playing cue (if any) and restore the loop immediately.
 *  Safe to call when nothing is playing — it's a no-op. */
export function stopCue(): void {
  if (!activeCueKey) return;
  const cue = cueEls[activeCueKey];
  if (cue) {
    cue.pause();
    cue.currentTime = 0;
    cue.onended = null;
  }
  if (cueRestoreTimer !== null) {
    window.clearTimeout(cueRestoreTimer);
    cueRestoreTimer = null;
  }
  activeCueKey = null;
  if (!musicMutedFlag) startMusic();
}

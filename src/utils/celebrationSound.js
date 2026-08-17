/**
 * Plays a short, pleasant celebration chime (ascending major arpeggio).
 * Used for task completion and focus session completion.
 */
function scheduleChime(ctx) {
  const t = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.55, t);
  masterGain.gain.linearRampToValueAtTime(0.55, t + 0.45);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.75);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 523.25, start: 0, duration: 0.2 },
    { freq: 659.25, start: 0.1, duration: 0.2 },
    { freq: 783.99, start: 0.2, duration: 0.22 },
    { freq: 1046.5, start: 0.32, duration: 0.35 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    g.gain.setValueAtTime(1, t + start);
    g.gain.exponentialRampToValueAtTime(0.01, t + start + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + start);
    osc.stop(t + start + duration);
  });
}

/**
 * Plays a short attention ping for “Still focusing?” check-ins.
 */
function scheduleCheckInPing(ctx) {
  const t = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.4, t);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 659.25, start: 0, duration: 0.18 },
    { freq: 880.0, start: 0.14, duration: 0.28 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    g.gain.setValueAtTime(1, t + start);
    g.gain.exponentialRampToValueAtTime(0.01, t + start + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + start);
    osc.stop(t + start + duration);
  });
}

/** Soft descending tone — focus session paused (idle). */
function schedulePauseTone(ctx) {
  const t = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.38, t);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.65);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 587.33, start: 0, duration: 0.22 },
    { freq: 440.0, start: 0.16, duration: 0.32 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    g.gain.setValueAtTime(1, t + start);
    g.gain.exponentialRampToValueAtTime(0.01, t + start + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + start);
    osc.stop(t + start + duration);
  });
}

/** Soft ascending tone — welcome back / session resumed. */
function scheduleResumeTone(ctx) {
  const t = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.4, t);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 523.25, start: 0, duration: 0.2 },
    { freq: 659.25, start: 0.12, duration: 0.22 },
    { freq: 783.99, start: 0.26, duration: 0.28 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    g.gain.setValueAtTime(1, t + start);
    g.gain.exponentialRampToValueAtTime(0.01, t + start + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + start);
    osc.stop(t + start + duration);
  });
}

function playWithAudioContext(schedule) {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => schedule(ctx)).catch(() => {});
    } else {
      schedule(ctx);
    }
  } catch (_) {}
}

/** Warmer, longer fanfare for the daily +1 streak modal. */
function scheduleStreakChime(ctx) {
  const t = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.5, t);
  masterGain.gain.linearRampToValueAtTime(0.5, t + 0.7);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t + 1.15);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 392.0, start: 0, duration: 0.22, type: 'triangle' },
    { freq: 523.25, start: 0.1, duration: 0.22, type: 'sine' },
    { freq: 659.25, start: 0.22, duration: 0.24, type: 'sine' },
    { freq: 783.99, start: 0.36, duration: 0.28, type: 'sine' },
    { freq: 1046.5, start: 0.52, duration: 0.48, type: 'triangle' },
  ];

  notes.forEach(({ freq, start, duration, type }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    g.gain.setValueAtTime(1, t + start);
    g.gain.exponentialRampToValueAtTime(0.01, t + start + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + start);
    osc.stop(t + start + duration);
  });
}

export function playCelebrationChime() {
  playWithAudioContext(scheduleChime);
}

export function playStreakChime() {
  playWithAudioContext(scheduleStreakChime);
}

export function playFocusCheckInSound() {
  playWithAudioContext(scheduleCheckInPing);
}

export function playFocusPausedSound() {
  playWithAudioContext(schedulePauseTone);
}

export function playFocusResumeSound() {
  playWithAudioContext(scheduleResumeTone);
}

/** Brighter fanfare for joining a team workspace. */
function scheduleWorkspaceJoinChime(ctx) {
  const t = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.5, t);
  masterGain.gain.linearRampToValueAtTime(0.5, t + 0.9);
  masterGain.gain.exponentialRampToValueAtTime(0.01, t + 1.45);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 392.0, start: 0, duration: 0.2, type: 'triangle' },
    { freq: 523.25, start: 0.08, duration: 0.22, type: 'sine' },
    { freq: 659.25, start: 0.18, duration: 0.24, type: 'sine' },
    { freq: 783.99, start: 0.32, duration: 0.28, type: 'triangle' },
    { freq: 1046.5, start: 0.48, duration: 0.55, type: 'sine' },
    { freq: 1318.51, start: 0.62, duration: 0.55, type: 'triangle' },
  ];

  notes.forEach(({ freq, start, duration, type }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = type;
    g.gain.setValueAtTime(0.9, t + start);
    g.gain.exponentialRampToValueAtTime(0.01, t + start + duration);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + start);
    osc.stop(t + start + duration);
  });

  const shimmer = ctx.createOscillator();
  const shimmerGain = ctx.createGain();
  shimmer.type = 'sine';
  shimmer.frequency.setValueAtTime(2093, t + 0.5);
  shimmer.frequency.exponentialRampToValueAtTime(2637, t + 1.1);
  shimmerGain.gain.setValueAtTime(0.0001, t);
  shimmerGain.gain.setValueAtTime(0.12, t + 0.5);
  shimmerGain.gain.exponentialRampToValueAtTime(0.01, t + 1.2);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(masterGain);
  shimmer.start(t + 0.48);
  shimmer.stop(t + 1.25);
}

export function playWorkspaceJoinChime() {
  playWithAudioContext(scheduleWorkspaceJoinChime);
}

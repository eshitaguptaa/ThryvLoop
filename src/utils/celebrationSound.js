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

export function playCelebrationChime() {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => scheduleChime(ctx)).catch(() => {});
    } else {
      scheduleChime(ctx);
    }
  } catch (_) {}
}

/* audio.js — the bell and warning-clap tones, via Web Audio.
   No knowledge of settings, timer, or DOM. */

let audioCtx = null;

export function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function tone(freq, start, dur, type, gainPeak) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak || 0.3, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

export function playBell() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [880, 1320, 1760].forEach(function (f, i) {
    tone(f, t, 1.1, "sine", 0.22 - i * 0.05);
  });
}

export function playFinalBell() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  for (let i = 0; i < 3; i++) {
    const start = t + i * 0.5;
    [660, 990, 1320].forEach(function (f, j) {
      tone(f, start, 1.0, "sine", 0.2 - j * 0.04);
    });
  }
}

export function playWarningClap() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(1000, t, 0.09, "square", 0.28);
  tone(1000, t + 0.14, 0.09, "square", 0.28);
}

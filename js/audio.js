/* audio.js — bell/warning tones via Web Audio.
   Bell sound is selectable (settings.bellType); everything else about
   this module still knows nothing about the DOM or the timer. */

import { settings } from "./state.js";

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

// Each pattern is a function(startTime, gainMultiplier) that schedules one
// "ring" of the bell. gainMultiplier lets playFinalBell() fade later rings
// in the triple-ring sequence, same as the original design.
const BELL_PATTERNS = {
  classic: function (t, g) {
    [880, 1320, 1760].forEach(function (f, i) {
      tone(f, t, 1.1, "sine", (0.22 - i * 0.05) * g);
    });
  },
  digital: function (t, g) {
    tone(1500, t, 0.11, "square", 0.26 * g);
    tone(1500, t + 0.16, 0.11, "square", 0.26 * g);
    tone(1500, t + 0.32, 0.11, "square", 0.26 * g);
  },
  airhorn: function (t, g) {
    tone(300, t, 0.85, "sawtooth", 0.28 * g);
    tone(304, t, 0.85, "sawtooth", 0.16 * g);
  },
  buzzer: function (t, g) {
    tone(150, t, 0.45, "square", 0.32 * g);
    tone(150, t + 0.5, 0.45, "square", 0.32 * g);
  }
};

function getPattern() {
  return BELL_PATTERNS[settings.bellType] || BELL_PATTERNS.classic;
}

export function playBell() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  getPattern()(t, 1);
}

export function playFinalBell() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const pattern = getPattern();
  for (let i = 0; i < 3; i++) {
    pattern(t + i * 0.6, 1 - i * 0.15);
  }
}

export function playWarningClap() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(1000, t, 0.09, "square", 0.28);
  tone(1000, t + 0.14, 0.09, "square", 0.28);
}

/* audio.js — bell/warning tones via Web Audio.
   Bell sound is selectable (settings.bellType). All tones route through a
   shared master-gain + compressor bus so overall loudness can be boosted
   without harsh clipping. Still knows nothing about the DOM or the timer. */

import { settings } from "./state.js";

let audioCtx = null;
let masterGain = null;
let compressor = null;

export function ensureAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
    if (audioCtx) {
      // Compressor first: gently limits peaks so boosting masterGain below
      // doesn't produce harsh digital clipping when tones overlap.
      compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-10, audioCtx.currentTime);
      compressor.knee.setValueAtTime(20, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(6, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.002, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.15, audioCtx.currentTime);
      compressor.connect(audioCtx.destination);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1.8; // overall loudness boost
      masterGain.connect(compressor);
    }
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
  gain.connect(masterGain || audioCtx.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

// Each pattern is a function(startTime, gainMultiplier) that schedules one
// "ring" of the bell. gainMultiplier lets playFinalBell() fade later rings
// in the triple-ring sequence, same as the original design. Base gain
// values bumped up from the original release per user feedback that the
// app was too quiet overall.
const BELL_PATTERNS = {
  classic: function (t, g) {
    [880, 1320, 1760].forEach(function (f, i) {
      tone(f, t, 1.1, "sine", (0.34 - i * 0.07) * g);
    });
  },
  digital: function (t, g) {
    tone(1500, t, 0.11, "square", 0.4 * g);
    tone(1500, t + 0.16, 0.11, "square", 0.4 * g);
    tone(1500, t + 0.32, 0.11, "square", 0.4 * g);
  },
  airhorn: function (t, g) {
    tone(300, t, 0.85, "sawtooth", 0.42 * g);
    tone(304, t, 0.85, "sawtooth", 0.24 * g);
  },
  buzzer: function (t, g) {
    tone(150, t, 0.45, "square", 0.46 * g);
    tone(150, t + 0.5, 0.45, "square", 0.46 * g);
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
  tone(1000, t, 0.09, "square", 0.4);
  tone(1000, t + 0.14, 0.09, "square", 0.4);
}
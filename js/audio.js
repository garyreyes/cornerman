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
      compressor.threshold.setValueAtTime(-16, audioCtx.currentTime);
      compressor.knee.setValueAtTime(20, audioCtx.currentTime);
      compressor.ratio.setValueAtTime(8, audioCtx.currentTime);
      compressor.attack.setValueAtTime(0.002, audioCtx.currentTime);
      compressor.release.setValueAtTime(0.15, audioCtx.currentTime);
      compressor.connect(audioCtx.destination);

      masterGain = audioCtx.createGain();
      masterGain.gain.value = 2.6; // overall loudness boost (compressor's lower
      // threshold/higher ratio above keeps this from clipping when tones overlap)
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

// A short burst of filtered white noise — used for percussive, non-tonal
// hits (the UFC-style clapper) that a pure oscillator can't produce.
function noiseBurst(start, dur, gainPeak, filterFreq, filterQ) {
  if (!audioCtx) return;
  const bufferSize = Math.max(1, Math.floor(audioCtx.sampleRate * dur));
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq || 2000;
  filter.Q.value = filterQ || 1;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(gainPeak || 0.5, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain || audioCtx.destination);
  src.start(start);
  src.stop(start + dur + 0.02);
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
  // Struck-metal ring bell: a fundamental plus inharmonic partials (real
  // bells don't ring at clean integer multiples), each with its own decay
  // so the higher partials die out first — the actual physics of a strike.
  ring: function (t, g) {
    const fundamental = 950;
    [
      [1.0, 0.42, 1.9],
      [2.4, 0.24, 1.3],
      [3.1, 0.15, 0.9],
      [4.3, 0.1, 0.6],
      [5.8, 0.06, 0.4]
    ].forEach(function (partial) {
      const ratio = partial[0], gainMul = partial[1], durMul = partial[2];
      tone(fundamental * ratio, t, 1.9 * durMul, "sine", gainMul * g);
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

function playWarningClap() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(1000, t, 0.09, "square", 0.4);
  tone(1000, t + 0.14, 0.09, "square", 0.4);
}

// UFC-style 10-second clacker: a sharp, dry wooden crack (two quick
// noise-burst hits), not a tone at all — noise is what makes it read as
// a physical smack instead of a beep.
function playWarningClapper() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  noiseBurst(t, 0.05, 0.95, 2200, 3);
  noiseBurst(t + 0.09, 0.06, 0.95, 1800, 3);
}

export function playTenSecondWarning() {
  if (!audioCtx) return;
  if (settings.warningSoundType === "clapper") playWarningClapper();
  else if (settings.warningSoundType === "none") return;
  else playWarningClap();
}
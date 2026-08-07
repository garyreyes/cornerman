/* speech.js — everything touching window.speechSynthesis.
   Exposes the current voice list as a live-updating export so the UI
   layer can re-render its <select> whenever the OS reports new voices. */

import { settings } from "./state.js";
import { clamp } from "./utils.js";

export let availableVoices = [];

// Many TTS engines implement SpeechSynthesisUtterance.rate via naive
// resampling rather than true time-stretching, which raises pitch as an
// unwanted side effect ("chipmunk voice") at higher rates. We can't fix
// the engine, but we can counter-tune pitch down as rate climbs so the
// perceived pitch stays closer to natural — a heuristic, not a real fix,
// since not every engine has this artifact in the first place.
function pitchForRate(rate) {
  return clamp(1 - (rate - 1) * 0.12, 0.7, 1.0);
}
let onVoicesChangedCb = null;

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  availableVoices = window.speechSynthesis.getVoices();
  if (onVoicesChangedCb) onVoicesChangedCb(availableVoices);
}

// Call once at startup with a callback to run whenever the voice list changes.
export function initVoices(onVoicesChanged) {
  onVoicesChangedCb = onVoicesChanged;
  if ("speechSynthesis" in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export function speakCombo(picked) {
  if (!settings.voiceEnabled) return;
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const text =
      settings.calloutMode === "names"
        ? picked.map(function (p) { return p.name; }).join(", ")
        : picked.map(function (p) { return p.num; }).join(", ");
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = settings.voiceRate;
    utter.pitch = pitchForRate(settings.voiceRate);
    utter.volume = 1.0;
    if (settings.voiceURI) {
      const match = availableVoices.filter(function (v) { return v.voiceURI === settings.voiceURI; })[0];
      if (match) utter.voice = match;
    }
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

// Speaks a single number (used for the 3-2-1 rest countdown). Respects the
// same master voice toggle and voice/rate choice as the combo call-outs.
export function speakCountdown(n) {
  if (!settings.voiceEnabled) return;
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(String(n));
    utter.rate = settings.voiceRate;
    utter.pitch = pitchForRate(settings.voiceRate);
    utter.volume = 1.0;
    if (settings.voiceURI) {
      const match = availableVoices.filter(function (v) { return v.voiceURI === settings.voiceURI; })[0];
      if (match) utter.voice = match;
    }
    window.speechSynthesis.speak(utter);
  } catch (e) {}
}

// A near-silent, near-instant utterance that "wakes up" the speech engine —
// some mobile browsers need this before the first real call-out will speak.
export function primeSpeech() {
  if (!("speechSynthesis" in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    u.rate = 10;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

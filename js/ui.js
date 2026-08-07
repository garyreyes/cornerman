/* ui.js — the only module allowed to touch the DOM.
   It renders state/settings onto the page and wires up every control.
   Timer logic lives in timer.js and reports back through the callbacks
   registered below, so this file never has to know *how* the countdown
   works — only what to display when it changes. */

import { settings, state } from "./state.js";
import { clamp, fmt } from "./utils.js";
import * as timer from "./timer.js";
import { initVoices, availableVoices, speakCombo, speakCountdown } from "./speech.js";
import { ensureAudio, playBell } from "./audio.js";
import { primeSpeech } from "./speech.js";
import { saveSettings } from "./storage.js";
import { renderPunchList, addPunch } from "./punchEditor.js";
import { renderPresetList, addPreset, parsePresetInput } from "./presetEditor.js";

const $ = function (id) { return document.getElementById(id); };

const timerDisplay = $("timerDisplay");
const phaseBadge = $("phaseBadge");
const roundCounter = $("roundCounter");
const comboNumbers = $("comboNumbers");
const comboNames = $("comboNames");
const statsRow = $("statsRow");
const roundLights = $("roundLights");
const startBtn = $("startBtn");
const resetBtn = $("resetBtn");
const settingsBtn = $("settingsBtn");
const sheetOverlay = $("sheetOverlay");
const settingsSheet = $("settingsSheet");
const closeSheetBtn = $("closeSheetBtn");
const punchListEl = $("punchList");
const addPunchBtn = $("addPunchBtn");
const voiceSelect = $("voiceSelect");
const presetListEl = $("presetList");
const presetInput = $("presetInput");
const addPresetBtn = $("addPresetBtn");
const randomComboSettings = $("randomComboSettings");
const presetComboSettings = $("presetComboSettings");
const punchesSection = $("punchesSection");

const punchEditorOpts = { onChange: saveSettings, onLabelsChange: updateSettingsLabels };
const presetEditorOpts = { onChange: saveSettings };

/* ---------- core render ---------- */
function renderLights() {
  roundLights.innerHTML = "";
  for (let i = 1; i <= settings.rounds; i++) {
    const d = document.createElement("div");
    d.className = "light";
    if (i < state.round) d.className += " lit";
    if (i === state.round && state.phase !== "idle" && state.phase !== "done") d.className += " active";
    roundLights.appendChild(d);
  }
}

function render(remainingSec) {
  if (remainingSec === undefined) {
    remainingSec =
      state.phase === "work" ? settings.roundLen : state.phase === "rest" ? settings.restLen : settings.roundLen;
  }
  timerDisplay.textContent = fmt(remainingSec);
  roundCounter.textContent = "Round " + Math.min(state.round, settings.rounds) + " / " + settings.rounds;

  phaseBadge.classList.remove("work", "rest", "done");
  if (state.phase === "work") {
    phaseBadge.textContent = "Work";
    phaseBadge.classList.add("work");
  } else if (state.phase === "rest") {
    phaseBadge.textContent = "Rest";
    phaseBadge.classList.add("rest");
  } else if (state.phase === "done") {
    phaseBadge.textContent = "Finished";
    phaseBadge.classList.add("done");
  } else {
    phaseBadge.textContent = "Ready";
  }

  renderLights();
}

function showCombo(picked) {
  if (!picked) {
    comboNumbers.textContent = "—";
    comboNames.textContent = "Enable at least one punch in Settings";
    return;
  }
  comboNumbers.textContent = picked.map(function (p) { return p.num; }).join("-");
  comboNames.textContent = picked.map(function (p) { return p.name.toUpperCase(); }).join(" · ");
  comboNumbers.classList.remove("pulse");
  void comboNumbers.offsetWidth;
  comboNumbers.classList.add("pulse");
  state.comboCount++;
  statsRow.textContent = "Combos called: " + state.comboCount;
}

function setRestMessage(text) {
  comboNames.textContent = text;
}

function showRestCountdown(n) {
  comboNumbers.textContent = String(n);
  comboNumbers.classList.remove("pulse");
  void comboNumbers.offsetWidth;
  comboNumbers.classList.add("pulse");
}

function clearComboNumbers() {
  comboNumbers.textContent = "—";
}

function finishWorkoutUI() {
  comboNumbers.textContent = "🥊";
  comboNames.textContent = "Workout complete";
  startBtn.textContent = "Start";
  startBtn.classList.remove("running");
}

function resetUI() {
  startBtn.textContent = "Start";
  startBtn.classList.remove("running");
  comboNumbers.textContent = "—";
  comboNames.textContent = "Press start to begin";
  statsRow.textContent = "Combos called: 0";
  render(settings.roundLen);
}

function onTimerStart() {
  statsRow.textContent = "Combos called: 0";
}

timer.initTimer({
  render: render,
  showCombo: showCombo,
  setRestMessage: setRestMessage,
  showRestCountdown: showRestCountdown,
  clearComboNumbers: clearComboNumbers,
  onFinish: finishWorkoutUI,
  onReset: resetUI,
  onStart: onTimerStart
});

/* ---------- start / pause / reset controls ---------- */
function uiStart() {
  timer.start();
  startBtn.textContent = "Pause";
  startBtn.classList.add("running");
}
function uiPause() {
  timer.pause();
  startBtn.textContent = "Resume";
  startBtn.classList.remove("running");
}
startBtn.addEventListener("click", function () {
  if (state.phase === "done") {
    timer.reset();
    uiStart();
    return;
  }
  if (!state.running) {
    uiStart();
  } else {
    uiPause();
  }
});
resetBtn.addEventListener("click", function () {
  timer.reset();
});

/* ---------- settings sheet ---------- */
function openSheet() {
  renderPunchList(punchListEl, settings, punchEditorOpts);
  renderPresetList(presetListEl, settings, presetEditorOpts);
  populateVoiceSelect();
  updateSettingsLabels();
  updateVoiceStatus();
  sheetOverlay.classList.add("open");
  settingsSheet.classList.add("open");
}
function closeSheet() {
  sheetOverlay.classList.remove("open");
  settingsSheet.classList.remove("open");
  if (state.phase === "idle") render(settings.roundLen);
  saveSettings();
}
settingsBtn.addEventListener("click", openSheet);
closeSheetBtn.addEventListener("click", closeSheet);
sheetOverlay.addEventListener("click", closeSheet);

function updateSettingsLabels() {
  $("roundLenVal").textContent = fmt(settings.roundLen);
  $("restLenVal").textContent = fmt(settings.restLen);
  $("roundsVal").textContent = settings.rounds;
  $("comboMinVal").textContent = settings.comboMin;
  $("comboMaxVal").textContent = settings.comboMax;
  $("gapMinVal").textContent = settings.comboGapMin + "s";
  $("gapMaxVal").textContent = settings.comboGapMax + "s";
  $("voiceToggle").checked = settings.voiceEnabled;
  $("voiceRateSlider").value = settings.voiceRate;
  $("voiceRateVal").textContent = settings.voiceRate.toFixed(1) + "x";
  document.querySelectorAll("#gapPresets button").forEach(function (btn) {
    const lo = parseInt(btn.getAttribute("data-gap-min"), 10);
    const hi = parseInt(btn.getAttribute("data-gap-max"), 10);
    btn.classList.toggle("active", lo === settings.comboGapMin && hi === settings.comboGapMax);
  });
  document.querySelectorAll("#calloutModeRow button").forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-mode") === settings.calloutMode);
  });
  $("bellTypeSelect").value = settings.bellType;
  $("restCountdownToggle").checked = settings.restCountdownEnabled;
  document.querySelectorAll("#comboModeRow button").forEach(function (btn) {
    btn.classList.toggle("active", btn.getAttribute("data-combo-mode") === settings.comboMode);
  });
  randomComboSettings.style.display = settings.comboMode === "presets" ? "none" : "";
  presetComboSettings.style.display = settings.comboMode === "presets" ? "" : "none";
  punchesSection.style.display = settings.comboMode === "presets" ? "none" : "";
}

document.querySelectorAll(".stepper button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    const action = btn.getAttribute("data-action");
    switch (action) {
      case "round-inc": settings.roundLen = clamp(settings.roundLen + 15, 15, 1200); break;
      case "round-dec": settings.roundLen = clamp(settings.roundLen - 15, 15, 1200); break;
      case "rest-inc": settings.restLen = clamp(settings.restLen + 15, 5, 600); break;
      case "rest-dec": settings.restLen = clamp(settings.restLen - 15, 5, 600); break;
      case "rounds-inc": settings.rounds = clamp(settings.rounds + 1, 1, 30); break;
      case "rounds-dec": settings.rounds = clamp(settings.rounds - 1, 1, 30); break;
      case "min-inc": settings.comboMin = clamp(settings.comboMin + 1, 1, settings.comboMax); break;
      case "min-dec": settings.comboMin = clamp(settings.comboMin - 1, 1, settings.comboMax); break;
      case "max-inc": settings.comboMax = clamp(settings.comboMax + 1, settings.comboMin, 12); break;
      case "max-dec": settings.comboMax = clamp(settings.comboMax - 1, settings.comboMin, 12); break;
      case "gapmin-inc": settings.comboGapMin = clamp(settings.comboGapMin + 1, 1, settings.comboGapMax); break;
      case "gapmin-dec": settings.comboGapMin = clamp(settings.comboGapMin - 1, 1, settings.comboGapMax); break;
      case "gapmax-inc": settings.comboGapMax = clamp(settings.comboGapMax + 1, settings.comboGapMin, 60); break;
      case "gapmax-dec": settings.comboGapMax = clamp(settings.comboGapMax - 1, settings.comboGapMin, 60); break;
    }
    updateSettingsLabels();
    if (state.phase === "idle") render(settings.roundLen);
    saveSettings();
  });
});

document.querySelectorAll("#gapPresets button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    settings.comboGapMin = parseInt(btn.getAttribute("data-gap-min"), 10);
    settings.comboGapMax = parseInt(btn.getAttribute("data-gap-max"), 10);
    updateSettingsLabels();
    saveSettings();
  });
});

document.querySelectorAll("#calloutModeRow button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    settings.calloutMode = btn.getAttribute("data-mode");
    updateSettingsLabels();
    saveSettings();
  });
});

document.querySelectorAll("#comboModeRow button").forEach(function (btn) {
  btn.addEventListener("click", function () {
    settings.comboMode = btn.getAttribute("data-combo-mode");
    updateSettingsLabels();
    saveSettings();
  });
});

function tryAddPreset() {
  const sequence = parsePresetInput(presetInput.value);
  if (!sequence.length) return;
  addPreset(settings, sequence);
  renderPresetList(presetListEl, settings, presetEditorOpts);
  presetInput.value = "";
  presetInput.focus();
  saveSettings();
}
addPresetBtn.addEventListener("click", tryAddPreset);
presetInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    tryAddPreset();
  }
});

$("bellTypeSelect").addEventListener("change", function () {
  settings.bellType = $("bellTypeSelect").value;
  saveSettings();
});

$("restCountdownToggle").addEventListener("change", function () {
  settings.restCountdownEnabled = $("restCountdownToggle").checked;
  saveSettings();
});

$("testBellBtn").addEventListener("click", function () {
  ensureAudio();
  playBell();
});

$("testCountdownBtn").addEventListener("click", function () {
  ensureAudio();
  primeSpeech();
  [3, 2, 1].forEach(function (n, i) {
    setTimeout(function () {
      showRestCountdown(n);
      speakCountdown(n);
    }, 150 + i * 900);
  });
});

$("voiceToggle").addEventListener("change", function () {
  settings.voiceEnabled = $("voiceToggle").checked;
  saveSettings();
});

voiceSelect.addEventListener("change", function () {
  settings.voiceURI = voiceSelect.value;
  saveSettings();
});

$("voiceRateSlider").addEventListener("input", function () {
  settings.voiceRate = parseFloat($("voiceRateSlider").value);
  $("voiceRateVal").textContent = settings.voiceRate.toFixed(1) + "x";
});
$("voiceRateSlider").addEventListener("change", function () {
  saveSettings();
});

$("testVoiceBtn").addEventListener("click", function () {
  ensureAudio();
  primeSpeech();
  let sample = settings.punches.slice(0, 3);
  if (!sample.length) sample = [{ num: 1, name: "Jab" }, { num: 2, name: "Straight" }, { num: 3, name: "Lead Hook" }];
  setTimeout(function () { speakCombo(sample); }, 120);
  updateVoiceStatus();
});

function populateVoiceSelect() {
  const current = settings.voiceURI || "";
  voiceSelect.innerHTML = '<option value="">Standard (device default)</option>';
  availableVoices.forEach(function (v) {
    const opt = document.createElement("option");
    opt.value = v.voiceURI;
    opt.textContent = v.name + (v.lang ? " (" + v.lang + ")" : "");
    voiceSelect.appendChild(opt);
  });
  voiceSelect.value = current;
}

function updateVoiceStatus() {
  const el = $("voiceStatus");
  if (!el) return;
  if (!("speechSynthesis" in window)) {
    el.textContent = "Speech isn't available in this browser. Try opening the saved file in Safari or Chrome directly instead of an in-app browser.";
    el.classList.add("warn");
  } else if (availableVoices.length === 0) {
    el.textContent = "No device voices detected yet. Tap \"Test voice\" — if you hear nothing, try opening this page in your phone's regular browser (Safari/Chrome) rather than inside another app.";
    el.classList.add("warn");
  } else {
    el.textContent = availableVoices.length + " device voice(s) found. Tap \"Test voice\" to preview.";
    el.classList.remove("warn");
  }
}

initVoices(function () {
  populateVoiceSelect();
});

/* ---------- punch list editor ---------- */
addPunchBtn.addEventListener("click", function () {
  addPunch(settings);
  renderPunchList(punchListEl, settings, punchEditorOpts);
  saveSettings();
  const inputs = punchListEl.querySelectorAll(".punch-name");
  if (inputs.length) {
    const last = inputs[inputs.length - 1];
    last.focus();
    last.select();
  }
});

/* ---------- public init, called once settings are loaded ---------- */
export function initUI() {
  updateSettingsLabels();
  render(settings.roundLen);
}
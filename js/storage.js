/* storage.js — reading and writing settings to persistent storage.
   Nothing in here knows about the DOM or the timer; it only ever
   touches the shared `settings` object from state.js. */

import { settings, defaultPunches, normalizePunches } from "./state.js";

const SETTINGS_KEY = "cornerman:settings";

export function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}
  try {
    if (window.storage && window.storage.set) {
      window.storage.set(SETTINGS_KEY, JSON.stringify(settings), false).catch(function () {});
    }
  } catch (e) {}
}

function applyParsed(parsed) {
  Object.assign(settings, parsed);
  if (!Array.isArray(settings.punches) || settings.punches.length === 0) {
    settings.punches = defaultPunches.slice();
  }
  settings.punches = normalizePunches(settings.punches);
  if (!Array.isArray(settings.comboPresets)) {
    settings.comboPresets = [];
  }
}

export function loadSettings(cb) {
  let applied = false;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        applyParsed(parsed);
        applied = true;
      }
    }
  } catch (e) {}

  if (applied) {
    cb();
    return;
  }

  try {
    if (window.storage && window.storage.get) {
      window.storage
        .get(SETTINGS_KEY, false)
        .then(function (res) {
          if (res && res.value) {
            try {
              const parsed2 = JSON.parse(res.value);
              if (parsed2 && typeof parsed2 === "object") applyParsed(parsed2);
            } catch (e) {}
          }
          cb();
        })
        .catch(function () {
          cb();
        });
    } else {
      cb();
    }
  } catch (e) {
    cb();
  }
}
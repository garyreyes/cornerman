/* comboEngine.js — pure logic for picking a random punch combo.
   No DOM, no audio, no speech — easy to unit test in isolation. */

import { settings } from "./state.js";
import { clamp, randInt } from "./utils.js";

export function generateCombo() {
  const min = clamp(settings.comboMin, 1, settings.comboMax || 1);
  const /* comboEngine.js — picks the next combo to call out.
   Two independent sources, selected by settings.comboMode:
     - "random"  — existing behavior, random length/punches each time
     - "presets" — picks one whole saved sequence and returns it exactly
                   as authored, in order, with no shuffling and no cap
                   on how many punches it contains.
   Both paths return the same shape ([{num, name}, ...]) so nothing
   downstream (timer, speech, UI) needs to know which mode is active. */

import { settings } from "./state.js";
import { clamp, randInt } from "./utils.js";

function generateRandomCombo() {
  const min = clamp(settings.comboMin, 1, settings.comboMax || 1);
  const max = Math.max(min, settings.comboMax);
  const len = randInt(min, max);
  const list = settings.punches.filter(function (p) { return p.enabled !== false; });
  if (!list.length) return null;
  const picked = [];
  for (let i = 0; i < len; i++) {
    picked.push(list[randInt(0, list.length - 1)]);
  }
  return picked;
}

function generatePresetCombo() {
  const list = settings.comboPresets.filter(function (p) {
    return p.enabled !== false && Array.isArray(p.sequence) && p.sequence.length > 0;
  });
  if (!list.length) return null;
  const preset = list[randInt(0, list.length - 1)];

  const punchByNum = {};
  settings.punches.forEach(function (p) { punchByNum[p.num] = p; });

  // Map each number in the preset to its live punch (so a renamed punch
  // is reflected automatically); fall back to a generic label if the
  // punch it referenced was since deleted, rather than breaking.
  return preset.sequence.map(function (num) {
    return punchByNum[num] || { num: num, name: "Punch " + num };
  });
}

export function generateCombo() {
  return settings.comboMode === "presets" ? generatePresetCombo() : generateRandomCombo();
}max = Math.max(min, settings.comboMax);
  const len = randInt(min, max);
  const list = settings.punches.filter(function (p) { return p.enabled !== false; });
  if (!list.length) return null;
  const picked = [];
  for (let i = 0; i < len; i++) {
    picked.push(list[randInt(0, list.length - 1)]);
  }
  return picked;
}

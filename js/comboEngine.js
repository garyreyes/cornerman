/* comboEngine.js — pure logic for picking a random punch combo.
   No DOM, no audio, no speech — easy to unit test in isolation. */

import { settings } from "./state.js";
import { clamp, randInt } from "./utils.js";

export function generateCombo() {
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

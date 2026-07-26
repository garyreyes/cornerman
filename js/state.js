/* state.js — the single source of truth for settings and runtime state.
   Other modules import `settings` / `state` and read/write their
   properties directly; because ES module objects are shared by reference,
   every module sees the same live data (mirrors the original single-file
   design, just split apart). */

export const defaultPunches = [
  { num: 1, name: "Jab", enabled: true },
  { num: 2, name: "Straight", enabled: true },
  { num: 3, name: "Lead Hook", enabled: true },
  { num: 4, name: "Rear Hook", enabled: true },
  { num: 5, name: "Lead Uppercut", enabled: true },
  { num: 6, name: "Rear Uppercut", enabled: true }
];

// Standard name options offered in each punch row's quick-fill list.
// Picking one only fills in the NAME — it never touches the number,
// so numbers and names can always be mixed and matched freely.
export const PUNCH_PRESETS = [
  { label: "Lead Jab", value: "Lead Jab" },
  { label: "Rear Straight / Cross", value: "Rear Straight" },
  { label: "Lead Hook", value: "Lead Hook" },
  { label: "Rear Hook (or Rear Overhand)", value: "Rear Hook" },
  { label: "Lead Uppercut", value: "Lead Uppercut" },
  { label: "Rear Uppercut", value: "Rear Uppercut" },
  { label: "Lead Body Hook (Liver Shot)", value: "Lead Body Hook" },
  { label: "Rear Body Hook", value: "Rear Body Hook" },
  { label: "Lead Body Jab / Straight", value: "Lead Body Straight" },
  { label: "Rear Body Straight", value: "Rear Body Straight" },
  { label: "Overhand", value: "Overhand" }
];

export function createDefaultSettings() {
  return {
    roundLen: 150, // seconds
    restLen: 30,
    rounds: 10,
    comboMin: 1,
    comboMax: 6,
    comboGapMin: 3, // seconds between combo call-outs
    comboGapMax: 6,
    voiceEnabled: true,
    voiceRate: 1.5, // speech speed multiplier
    voiceURI: "", // "" = device default voice
    calloutMode: "numbers", // "numbers" | "names"
    bellType: "classic", // "classic" | "digital" | "airhorn" | "buzzer"
    restCountdownEnabled: true, // speak "3, 2, 1" during the last 3s of rest
    punches: defaultPunches.slice()
  };
}

export const settings = createDefaultSettings();

export const state = {
  phase: "idle", // idle | work | rest | done
  round: 1,
  running: false,
  endTime: null,
  remaining: null, // ms remaining, used while paused
  tickHandle: null,
  tenWarned: false,
  nextComboAt: 0,
  comboCount: 0,
  lastRestCountdown: null // tracks which second (3/2/1) was last spoken, to fire once each
};

export function normalizePunches(list) {
  list.forEach(function (p) {
    if (typeof p.enabled !== "boolean") p.enabled = true;
    if (typeof p.num !== "number") p.num = parseInt(p.num, 10) || 1;
  });
  return list;
}

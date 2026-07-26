/* utils.js — pure, dependency-free helper functions. */

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

export function randInt(lo, hi) {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

export function fmt(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ":" + (s < 10 ? "0" + s : s);
}

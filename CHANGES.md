# Cornerman — Changelog

Every entry below documents one working session's changes. Newest first.
Claude Code: see the MANDATORY WORKFLOW RULE in `CLAUDE.md` — add a new
entry here after every change, before ending your turn.

---

## 2026-08-07 — Applied the queued settings reorganization to the real repo
- `CLAUDE.md` and `CHANGES.md` themselves did not exist on disk (only as
  in-memory context from a prior session) — recreated both at the project
  root as the first step, since the mandatory workflow rule depends on
  `CHANGES.md` existing.
- Ported the settings reorg described in the (now recreated) 2026-08-04
  entry below into the actual source files: moved the "Mode" stepper-row
  out of `cornerman.html`'s "Combinations" section into its own standalone
  `<section><h3>Mode</h3>` between "Round" and "Sounds"; added
  `id="punchesSection"` to the Punches `<section>`.
- `js/ui.js`: added a `punchesSection` const (`$("punchesSection")`) and a
  `punchesSection.style.display = settings.comboMode === "presets" ? "none" : ""`
  line inside `updateSettingsLabels()`, alongside the existing
  random/preset panel toggle. `settings.punches` data itself is untouched
  — only the editor UI hides.
- Bumped `sw.js` `CACHE_NAME` from `cornerman-v9` to `cornerman-v11`.
- Ran `npm run build` — regenerated `www/` successfully, no errors.
- Verified via `grep` on the built source: section order is now
  `Round, Mode, Sounds, Combinations, Combo Timing, Punches`;
  `punchesSection` id and `comboModeRow` wiring both present exactly once
  each in the expected places. Did not get a live browser/Playwright
  check in this session (background dev server didn't come up in the
  sandbox) — worth a quick manual click-through before shipping.
- Files touched: `cornerman.html`, `js/ui.js`, `sw.js`, plus new
  `CLAUDE.md`, `CHANGES.md`.
- Next: re-sync Android (`npm run build && npx cap sync android`) so the
  native build picks up this reorg together with the already-shipped
  presets feature in one pass. Voice speed "chipmunk" pitch issue (see
  below) is still unstarted.

## 2026-08-04 — Settings reorganization: Mode moved up, Punches hidden in Presets mode
**Status: built and Playwright-tested in a scratch sandbox during that
session, applied to the real repo on 2026-08-07 (see entry above).**

- Moved the "Mode" control (Random/Presets) out of the "Combinations"
  section into its own standalone section, placed directly below "Round"
  and above "Sounds" — confirmed with user this ordering is correct.
- When Mode = Presets: the entire "Punches" section (the editable numbered
  1-6 list) is now hidden. The underlying `settings.punches` data is left
  completely untouched — only the editor UI is hidden — since preset
  sequences still look up punch names by number internally.
- Confirmed with user: "Combo Timing" (gap presets, Voice call-outs toggle,
  Call out Number/Word toggle, Announcer voice, Voice speed, Test voice)
  stays visible and fully functional in **both** modes, unchanged. The
  Number/Word toggle already worked correctly for presets before this
  change (no code needed there) — presets were already returning
  `{num, name}` objects same as random mode.
- Files touched (changes existed in sandbox only until 2026-08-07):
  `cornerman.html` (section reordered, added `id="punchesSection"` to the
  Punches `<section>`), `js/ui.js` (added `punchesSection` DOM ref +
  visibility toggle in `updateSettingsLabels()`, alongside the existing
  random/preset panel toggle), `sw.js` (cache bumped to `cornerman-v11`).
- Verified via Playwright: section order (`Round, Mode, Sounds, Combinations,
  Combo Timing, Punches`), Punches hides/shows correctly both directions,
  Call out row stays visible in Presets mode, settings persist correctly,
  punches array data stays intact (all 6 names) while hidden. Full original
  regression suite also re-run — zero regressions.

**Queued next (not started):** voice speed slider currently causes a
"chipmunk" pitch-shift at higher rates — most TTS engines simulate faster
rate via audio resampling, which raises pitch as an unwanted side effect;
this isn't something `SpeechSynthesisUtterance.rate` alone controls or
fixes. **Explicit user requirement: fix the actual perceived pace/speed —
do NOT paper over this with a pitch-shifted "chipmunk" workaround.**
Needs real investigation before implementing — candidate directions:
capping the max rate value to a range less prone to the resampling
artifact, and/or shortening the gap between call-outs as a way to increase
felt intensity without further distorting the voice itself. No code
written yet for this — starts from scratch.

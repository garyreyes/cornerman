# Cornerman — Changelog

Every entry below documents one working session's changes. Newest first.
Claude Code: see the MANDATORY WORKFLOW RULE in `CLAUDE.md` — add a new
entry here after every change, before ending your turn.

---

## 2026-08-07 (5) — Combo-frequency range widened for advanced-boxer challenge mode
- User's actual goal (after walking back an initial "10x voice speed" ask
  once I explained that's literally unintelligible on any TTS engine, not
  just a chipmunk-pitch problem — real speech tops out ~2.5–3x before
  becoming noise): a skilled boxer should be able to push the app to feel
  genuinely too-fast-to-keep-up, as a difficulty/speed-training dial. The
  actual lever for that is combo **frequency**, not voice rate — shortening
  the gap between call-outs has zero voice-quality tradeoff, unlike rate.
- Widened `comboGapMin`/`comboGapMax` range: floor dropped from 1s to
  **0.5s**, step size dropped from whole seconds to **0.5s** (steppers in
  `js/ui.js`, floor clamp in `js/timer.js`'s per-combo gap calculation).
  Ceiling unchanged (60s) — slow/reaction-training end of the range is
  untouched.
- Added two new gap presets below the existing "Fast · 3–6s": **"Rapid ·
  1–2s"** and **"Blitz · 0.5–1s"** in `cornerman.html`'s `#gapPresets` row.
  At Blitz settings, a new combo can fire before speech for the previous
  one finishes — `speakCombo()` already `cancel()`s in-flight speech before
  starting the next utterance, so this reads as rapid-fire barking rather
  than overlapping audio, which is the intended effect for a speed-training
  mode (not a bug to fix).
- Preset/stepper values switched from `parseInt` to `parseFloat` throughout
  (`js/ui.js`) to carry the new fractional-second values correctly.
- Bumped `sw.js` `CACHE_NAME` to `cornerman-v14`. Ran
  `npm run build && npx cap sync android` — both succeeded.
- Files touched: `cornerman.html`, `js/ui.js`, `js/timer.js`, `sw.js`.
- Voice rate itself was left as-is from the prior session (default 2.0,
  slider capped at 3) — that was a deliberate choice this session, not an
  oversight, since the real fix for "too slow" turned out to be frequency,
  not rate.

## 2026-08-07 (4) — Presets are now editable in place
- `js/presetEditor.js`: the preset row's sequence display (`1-2-3` etc.,
  previously a static, non-interactive `<div class="preset-label">`) is
  now a text `<input>` (reusing `.preset-text-input` styling from the "add
  preset" row, alongside `.preset-label`). Editing and committing (blur or
  Enter) re-parses the text with the existing `parsePresetInput()` — same
  "1 2 3" / "1, 2, 3" free-typed format as adding a new one — and writes
  the result back onto `preset.sequence`. An edit that parses to an empty
  sequence is rejected and the input reverts to the last valid value,
  rather than silently leaving a preset with zero punches.
- Previously the only way to change an existing preset was delete +
  re-add; that workflow still works but is no longer necessary.
- `parsePresetInput()` was moved up in the file (it's now used by the
  render function, not just re-exported for `ui.js`'s add-preset flow) —
  no behavior change, same function, just relocated above its first use.
- Bumped `sw.js` `CACHE_NAME` to `cornerman-v13`. Ran
  `npm run build && npx cap sync android` — both succeeded.
- Files touched: `js/presetEditor.js`, `sw.js`.

## 2026-08-07 (3) — Faster/louder call-outs, real bell tone, 10-sec warning options
- **Faster voice**: default `voiceRate` raised 1.5 → 2.0; slider max capped
  5 → 3 (candidate mitigation from the earlier chipmunk investigation —
  narrowing the range keeps users off the multipliers most prone to the
  resampling artifact). Added a pitch-compensation heuristic in
  `js/speech.js` (`pitchForRate()`): `utter.pitch` is nudged down slightly
  as rate climbs (`1 - (rate-1)*0.12`, clamped to `[0.7, 1.0]`) to counter
  engines that raise pitch as a side effect of a faster rate. **This is a
  heuristic, not a verified fix** — it hasn't been tested against a real
  "chipmunk"-affected engine/device yet, only reasoned through. Needs a
  real-device check before calling the chipmunk issue closed.
- **Louder bell/warning tones**: `masterGain` in `js/audio.js` raised
  1.8 → 2.6; compressor threshold lowered −10 → −16 dB and ratio raised
  6 → 8 so the extra gain doesn't clip when tones overlap. Spoken
  call-outs were **not** touched — `SpeechSynthesisUtterance.volume` was
  already at its 1.0 ceiling; there's no louder to give it from JS.
- **New "Ring (Boxing Bell)" bell option**: added alongside the existing
  Classic/Digital/Air Horn/Buzzer choices (kept Classic as-is per user
  request — this is additive, not a replacement). Synthesized as a
  fundamental + 4 inharmonic partials (ratios 2.4/3.1/4.3/5.8×, real bells
  don't ring at clean integer harmonics) each with its own decay length,
  approximating a struck-metal ring instead of the old clean chime.
- **10-second warning is now selectable**: new "10-second warning" dropdown
  in Sounds (Clap / Clapper (UFC-style) / None), backed by new
  `settings.warningSoundType`. The UFC-style "Clapper" is synthesized
  noise, not a tone — added a `noiseBurst()` helper (buffered white noise
  through a bandpass filter with a fast decay) in `js/audio.js`, since a
  pure oscillator can't produce a percussive "crack." `js/timer.js` now
  calls a new `playTenSecondWarning()` dispatcher instead of the old
  `playWarningClap()` directly; the old clap tone is preserved as the
  default so existing behavior doesn't silently change for users who don't
  touch the new setting. Added a "Test warning" button next to it, same
  pattern as "Test bell."
- Bumped `sw.js` `CACHE_NAME` to `cornerman-v12`. Ran
  `npm run build && npx cap sync android` — both succeeded.
- Files touched: `js/state.js`, `js/audio.js`, `js/speech.js`,
  `js/timer.js`, `js/ui.js`, `cornerman.html`, `sw.js`.
- Next: real-device test of the pitch-compensation heuristic against
  whatever engine originally produced the "chipmunk" complaint — if it
  doesn't help, the harder fix (pre-recorded audio + real time-stretching)
  is still on the table per the original investigation notes below.

## 2026-08-07 (2) — Recreated android/ via Capacitor, committed both changes
- Committed the settings-reorg change from the entry below (commit `dc2c0e6`).
- `npx cap sync android` failed: **the `android/` directory did not exist
  in this repo at all**, despite `CLAUDE.md` referencing
  `android/app/build.gradle` / `android/variables.gradle` and git log
  showing a prior "Add preset combo mode" commit. Same pattern as
  `CLAUDE.md`/`CHANGES.md` earlier this session — referenced in context but
  never actually present on disk/in git history for this checkout.
- Ran `npx cap add android` (user confirmed) to scaffold a fresh native
  project — `appId` correctly picked up as `com.gary.cornerman` from
  `capacitor.config.json`. **`versionCode` starts at 1, `versionName`
  "1.0"** since there was no prior native project to read old values from.
  **If a build was ever uploaded to Play Console with a higher versionCode,
  bump `android/app/build.gradle` before the next upload** — this fresh
  scaffold does not know about that history.
- App icon/splash are Capacitor's **default placeholder assets**, not the
  custom icon/splash from the "Add custom app icon and splash screen" git
  history (`a4969cd`) — that customization lived only in the previous
  native project and needs to be redone/reapplied now that `android/` is
  freshly generated. Not done this session.
- Ran `npx cap sync android` — copied the current `www/` (settings reorg +
  presets mode) into the new native project successfully.
- Committed the new `android/` tree as-is (user confirmed), per
  `.gitignore`'s existing comment that the android project itself should
  be committed once created.
- Files touched: `android/` (new, 53 files), per `.gitignore` excluding
  `android/.gradle/`, `android/app/build/`, `android/build/`,
  `android/local.properties`.
- Next: reapply the custom app icon/splash screen assets to the new
  `android/` project; open in Android Studio (`npx cap open android`) to
  confirm it builds before assuming this is release-ready.

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

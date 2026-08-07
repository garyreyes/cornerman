# Cornerman — Claude Code Project Instructions

Boxing round timer + randomized punch-combo caller. Vanilla JS, ES modules, no
framework/bundler. Deployed two ways from one source: GitHub Pages (web/PWA)
and a Capacitor-wrapped native Android app, mid-process toward Play Store
publication.

## MANDATORY WORKFLOW RULE

**After completing any code change — no matter how small — append a new
entry to `CHANGES.md` at the project root before ending your turn.** Never
skip this, even for a one-line fix. Format:

```
## YYYY-MM-DD — <short summary>
- What changed and why (1-3 bullets)
- Files touched: `path/to/file.js`, `path/to/other.js`
- Anything the next session needs to know (follow-up needed, known issue, etc.)
```

Newest entries go at the **top** of the file, under the title line. This is
the project's running memory across sessions — treat it as seriously as the
code itself.

## Architecture (read before editing)

- `js/state.js` — single source of truth. Exports `settings` and `state`
  objects; every other module imports and mutates these directly (shared
  by reference, no store library).
- `js/timer.js` — round/rest countdown engine. **Zero DOM access.** Reports
  everything through a `callbacks` object registered via `initTimer(cb)`.
- `js/ui.js` — the **only** module allowed to touch `document`/DOM. Implements
  timer's callbacks, wires every button/input listener. Settings sheet
  section order: Round → Mode (Random/Presets toggle) → Sounds →
  Combinations (random min/max OR presets list, depending on mode) → Combo
  Timing (always visible regardless of mode) → Punches (hidden entirely
  when Mode = Presets, via `punchesSection` display toggle — the underlying
  `settings.punches` data is never touched, only the editor UI).
- `js/comboEngine.js` — `generateCombo()` dispatches on `settings.comboMode`:
  `"random"` (existing random-length logic) or `"presets"` (returns one
  saved sequence exactly as authored, no shuffling, no length cap). Both
  paths return the same shape: `Array<{num, name}>`.
- `js/storage.js` — persists `settings` to `localStorage`. Merges saved JSON
  onto `createDefaultSettings()` via `Object.assign`, so new setting fields
  automatically get their default for existing users — don't write manual
  migration code, just add the field to `createDefaultSettings()`.
- `js/audio.js` — all Web Audio tones route through a shared
  `masterGain → DynamicsCompressor → destination` chain (deliberate, for
  loudness without clipping). Five bell patterns:
  classic/ring/digital/airhorn/buzzer (`ring` is the struck-metal boxing
  bell, inharmonic partials with independent decays). 10-second warning
  sound is separately selectable via `settings.warningSoundType`
  (`clap`/`clapper`/`none`) through the `playTenSecondWarning()`
  dispatcher — `clapper` is synthesized filtered noise (`noiseBurst()`),
  not a tone, to read as a physical UFC-style crack rather than a beep.
- `js/speech.js` — Web Speech API wrapper. `speakCombo()` for call-outs,
  `speakCountdown()` for the rest-phase 3-2-1 voice. Both apply
  `pitchForRate()`, a heuristic that nudges `utter.pitch` down as
  `voiceRate` climbs, to counter TTS engines that raise pitch as a side
  effect of a faster rate ("chipmunk" artifact) — unverified against a
  real affected device, see `CHANGES.md`.
- `js/punchEditor.js`, `js/presetEditor.js` — render + wire their respective
  editable lists in the Settings sheet. Same pattern: `render*List(container,
  settings, opts)` + an `add*()` helper. Preset rows are directly editable
  in place (text input parsed via `parsePresetInput()` on change) — no need
  to delete and re-add to change a sequence.

## Build commands

```
npm run build          # regenerates www/ from cornerman.html, css/, js/
npx cap sync android    # copies www/ into the native Android project
npx cap open android    # opens Android Studio
```

Local dev server for quick browser testing (no build step needed for the web
version — it's plain ES modules):
```
python3 -m http.server 8791
```

## Critical gotchas (each has caused a real bug this project)

1. **`www/` is generated output, gitignored — never hand-edit it.** It's a
   copy of the root source files, rebuilt by `npm run build`. Always edit
   the root-level `cornerman.html`, `css/styles.css`, `js/*.js`. Check the
   file's full path/breadcrumb before editing if unsure which copy you're in.
2. **Bump `CACHE_NAME` in `sw.js` on every release that changes code.** The
   service worker is cache-first; without a version bump, users (including
   you, testing) keep getting served stale JS/HTML even after a successful
   deploy.
3. **`cornerman.html` (not `index.html`) is the canonical entry point** —
   GitHub Pages serves it directly, and `manifest.json`'s `start_url` points
   to it. `www/index.html` is just a renamed build copy for Capacitor, which
   requires that exact filename.
4. When replacing a whole file's contents, verify the **entire** old content
   was cleared first (select-all + delete) before pasting new content —
   partial pastes have previously produced silently corrupted files (old
   code fragments left dangling after the new code).

## Data model

`settings` (persisted, key `cornerman:settings`): `roundLen`, `restLen`,
`rounds`, `comboMin`, `comboMax`, `comboGapMin`, `comboGapMax`,
`voiceEnabled`, `voiceRate` (default 2.0, slider capped to 3), `voiceURI`,
`calloutMode` (`"numbers"|"names"`),
`bellType` (`"classic"|"ring"|"digital"|"airhorn"|"buzzer"`),
`warningSoundType` (`"clap"|"clapper"|"none"`, plays at 10s left in a
round), `restCountdownEnabled`, `comboMode` (`"random"|"presets"`),
`comboPresets: [{sequence: number[], enabled}]`,
`punches: [{num, name, enabled}]`.

`state` (runtime only, not persisted): `phase`, `round`, `running`,
`endTime`, `remaining`, `tickHandle`, `tenWarned`, `nextComboAt`,
`comboCount`, `lastRestCountdown`.

## Native/release context

- `capacitor.config.json`: `appId: "com.gary.cornerman"` — **permanent, do
  not change** without understanding this breaks the Play Store listing.
- Release keystore lives **outside the repo** on the developer's machine
  (`C:\Users\gary\AndroidKeystores\cornerman-upload-key.jks`) — never ask to
  commit or move it into the project.
- `android/app/build.gradle` holds `versionCode`/`versionName` — bump
  `versionCode` (integer, strictly increasing) on every Play Store upload.
- `android/variables.gradle`: `compileSdkVersion`/`targetSdkVersion` = 36
  (Android 16 requirement).

## Current known open items

- Voice speed slider produces a "chipmunk" pitch-shift at higher rates
  (resampling artifact, not a simple parameter fix) — needs real
  investigation. User explicitly does not want a pitch-based workaround;
  actual perceived pace must increase. See `CHANGES.md` for candidate
  directions.
- Google Play Console developer account registration is blocked on the $25
  fee — Philippine e-wallet (GCash/Maya) virtual cards are rejected as
  prepaid; needs a real bank-issued card.
- Preset combo mode + the settings reorg (Mode section, Punches hidden in
  Presets mode) are both shipped in source and synced into `android/`.
- `android/` was freshly re-scaffolded via `npx cap add android` on
  2026-08-07 (it did not exist on disk before that). It currently has
  **Capacitor's default icon/splash placeholders, not the custom app icon
  and splash screen** from earlier project history — needs to be redone.
  `versionCode` restarted at 1 — verify against Play Console history
  before the next upload if a build was ever submitted previously.

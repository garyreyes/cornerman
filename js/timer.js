/* timer.js — the round/rest countdown engine.
   This module never touches the DOM directly. It reports what happened
   through the callbacks passed to initTimer(), so it can be reasoned
   about (and eventually unit-tested) on its own. */

import { settings, state } from "./state.js";
import { clamp, randInt } from "./utils.js";
import { generateCombo } from "./comboEngine.js";
import { playBell, playFinalBell, playTenSecondWarning, ensureAudio } from "./audio.js";
import { speakCombo, speakCountdown, primeSpeech } from "./speech.js";

let callbacks = {
  render: function () {},
  showCombo: function () {},
  setRestMessage: function () {},
  showRestCountdown: function () {},
  clearComboNumbers: function () {},
  onFinish: function () {},
  onReset: function () {},
  onStart: function () {}
};

// UI layer calls this once at startup to hook into timer events.
export function initTimer(cb) {
  callbacks = Object.assign(callbacks, cb);
}

function startPhase(phase, durationSec) {
  state.phase = phase;
  state.tenWarned = false;
  state.endTime = Date.now() + durationSec * 1000;
  if (phase === "work") {
    const firstGapMs = Math.min(settings.comboGapMin, 2) * 1000;
    state.nextComboAt = Date.now() + randInt(Math.max(500, firstGapMs), Math.max(1500, settings.comboGapMin * 1000));
    callbacks.clearComboNumbers();
  } else {
    state.lastRestCountdown = null;
    callbacks.showCombo(null);
    callbacks.setRestMessage("Rest — hands down, breathe");
  }
}

function tick() {
  const now = Date.now();
  const remainingMs = state.endTime - now;
  const remainingSec = Math.ceil(remainingMs / 1000);

  if (state.phase === "work") {
    if (remainingSec <= 10 && remainingSec > 0 && !state.tenWarned) {
      state.tenWarned = true;
      playTenSecondWarning();
    }
    if (now >= state.nextComboAt && remainingMs > 2500) {
      const combo = generateCombo();
      if (combo) {
        callbacks.showCombo(combo);
        speakCombo(combo);
      }
      const gapMin = clamp(settings.comboGapMin, 0.5, settings.comboGapMax);
      const gapMax = Math.max(gapMin, settings.comboGapMax);
      state.nextComboAt = now + randInt(gapMin * 1000, gapMax * 1000);
    }
  } else if (state.phase === "rest") {
    if (
      settings.restCountdownEnabled &&
      remainingSec <= 3 &&
      remainingSec >= 1 &&
      state.lastRestCountdown !== remainingSec
    ) {
      state.lastRestCountdown = remainingSec;
      callbacks.showRestCountdown(remainingSec);
      speakCountdown(remainingSec);
    }
  }

  if (remainingMs <= 0) {
    if (state.phase === "work") {
      if (state.round >= settings.rounds) {
        finishWorkout();
        return;
      } else {
        playBell();
        startPhase("rest", settings.restLen);
      }
    } else if (state.phase === "rest") {
      state.round++;
      playBell();
      startPhase("work", settings.roundLen);
    }
    callbacks.render();
    return;
  }

  callbacks.render(Math.max(0, remainingSec));
}

function finishWorkout() {
  state.phase = "done";
  state.running = false;
  clearInterval(state.tickHandle);
  playFinalBell();
  callbacks.onFinish();
  callbacks.render(0);
}

export function start() {
  ensureAudio();
  primeSpeech();
  if (state.phase === "idle" || state.phase === "done") {
    state.round = 1;
    state.comboCount = 0;
    state.lastRestCountdown = null;
    callbacks.onStart();
    startPhase("work", settings.roundLen);
    playBell();
  } else if (state.remaining !== null) {
    state.endTime = Date.now() + state.remaining;
    state.remaining = null;
  }
  state.running = true;
  clearInterval(state.tickHandle);
  state.tickHandle = setInterval(tick, 200);
  tick();
}

export function pause() {
  state.running = false;
  state.remaining = Math.max(0, state.endTime - Date.now());
  clearInterval(state.tickHandle);
}

export function reset() {
  clearInterval(state.tickHandle);
  state.phase = "idle";
  state.round = 1;
  state.running = false;
  state.remaining = null;
  state.comboCount = 0;
  state.lastRestCountdown = null;
  callbacks.onReset();
}

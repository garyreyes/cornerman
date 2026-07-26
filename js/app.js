/* app.js — the only script tag loaded by index/cornerman.html.
   Loads persisted settings, then boots the UI. Everything else
   (timer, audio, speech, combo logic, punch editor) is wired
   together inside the modules it imports. */

import { loadSettings } from "./storage.js";
import { initUI } from "./ui.js";

loadSettings(function () {
  initUI();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}

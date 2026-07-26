/* punchEditor.js — renders and wires the editable punch list
   (add / rename / renumber / enable-disable / delete). */

import { PUNCH_PRESETS } from "./state.js";
import { clamp } from "./utils.js";

export function renderPunchList(container, settings, opts) {
  const onChange = (opts && opts.onChange) || function () {};
  const onLabelsChange = (opts && opts.onLabelsChange) || function () {};

  container.innerHTML = "";
  settings.punches
    .slice()
    .sort(function (a, b) { return a.num - b.num; })
    .forEach(function (p) {
      const row = document.createElement("div");
      row.className = "punch-row" + (p.enabled === false ? " disabled" : "");

      const numEl = document.createElement("input");
      numEl.className = "punch-num-input";
      numEl.type = "number";
      numEl.inputMode = "numeric";
      numEl.value = p.num;
      numEl.setAttribute("aria-label", "Number for " + p.name);
      numEl.addEventListener("change", function () {
        const n = parseInt(numEl.value, 10);
        p.num = isNaN(n) ? p.num : n;
        renderPunchList(container, settings, opts);
        onChange();
      });

      const nameEl = document.createElement("input");
      nameEl.className = "punch-name";
      nameEl.type = "text";
      nameEl.value = p.name;
      nameEl.setAttribute("aria-label", "Name for punch " + p.num);
      nameEl.addEventListener("input", function () {
        p.name = nameEl.value;
        onChange();
      });

      const presetSel = document.createElement("select");
      presetSel.className = "preset-select";
      presetSel.setAttribute("aria-label", "Fill name " + p.num + " from standard list");
      const placeholderOpt = document.createElement("option");
      placeholderOpt.value = "";
      placeholderOpt.textContent = "\u25BE";
      presetSel.appendChild(placeholderOpt);
      PUNCH_PRESETS.forEach(function (preset, idx) {
        const opt = document.createElement("option");
        opt.value = idx;
        opt.textContent = preset.label;
        presetSel.appendChild(opt);
      });
      presetSel.addEventListener("change", function () {
        if (presetSel.value === "") return;
        const chosen = PUNCH_PRESETS[parseInt(presetSel.value, 10)];
        if (chosen) {
          nameEl.value = chosen.value;
          p.name = chosen.value;
          onChange();
        }
        presetSel.value = "";
      });

      const enableLabel = document.createElement("label");
      enableLabel.className = "switch switch-sm";
      enableLabel.title = "Enable in random combos";
      const enableInput = document.createElement("input");
      enableInput.type = "checkbox";
      enableInput.checked = p.enabled !== false;
      enableInput.setAttribute("aria-label", "Include " + p.name + " in combos");
      const enableSlider = document.createElement("span");
      enableSlider.className = "switch-slider";
      enableInput.addEventListener("change", function () {
        p.enabled = enableInput.checked;
        row.classList.toggle("disabled", !enableInput.checked);
        onChange();
      });
      enableLabel.appendChild(enableInput);
      enableLabel.appendChild(enableSlider);

      const delEl = document.createElement("button");
      delEl.className = "punch-del";
      delEl.setAttribute("aria-label", "Remove punch " + p.num);
      delEl.textContent = "✕";
      delEl.addEventListener("click", function () {
        settings.punches = settings.punches.filter(function (x) { return x !== p; });
        settings.comboMax = clamp(settings.comboMax, 1, 12);
        renderPunchList(container, settings, opts);
        onLabelsChange();
        onChange();
      });

      row.appendChild(numEl);
      row.appendChild(nameEl);
      row.appendChild(presetSel);
      row.appendChild(enableLabel);
      row.appendChild(delEl);
      container.appendChild(row);
    });
}

export function addPunch(settings) {
  const maxNum = settings.punches.reduce(function (m, p) { return Math.max(m, p.num); }, 0);
  settings.punches.push({ num: maxNum + 1, name: "New Punch", enabled: true });
}

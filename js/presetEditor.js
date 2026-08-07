/* presetEditor.js — renders and wires the editable combo-preset list.
   A preset is a fixed, exact punch sequence (e.g. [1,2,3]) called out
   in that order with no randomization and no length limit — as opposed
   to comboEngine's random mode. */

// Parses free-typed text like "1 2 3" or "1, 2, 3" into [1,2,3].
// No maximum length — a 10+ punch preset parses exactly the same way
// as a 2-punch one.
export function parsePresetInput(text) {
  return text
    .split(/[\s,]+/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; })
    .map(function (s) { return parseInt(s, 10); })
    .filter(function (n) { return !isNaN(n) && n > 0; });
}

export function renderPresetList(container, settings, opts) {
  const onChange = (opts && opts.onChange) || function () {};

  container.innerHTML = "";

  if (!settings.comboPresets.length) {
    const empty = document.createElement("p");
    empty.className = "punch-hint";
    empty.textContent = "No presets yet — add one below.";
    container.appendChild(empty);
    return;
  }

  settings.comboPresets.forEach(function (preset) {
    const row = document.createElement("div");
    row.className = "punch-row" + (preset.enabled === false ? " disabled" : "");

    const input = document.createElement("input");
    input.className = "preset-text-input preset-label";
    input.type = "text";
    input.inputMode = "numeric";
    input.value = preset.sequence.join(" ");
    input.setAttribute("aria-label", "Edit preset sequence " + preset.sequence.join("-"));
    input.addEventListener("change", function () {
      const parsed = parsePresetInput(input.value);
      if (!parsed.length) {
        input.value = preset.sequence.join(" "); // revert — don't allow an empty sequence
        return;
      }
      preset.sequence = parsed;
      input.value = parsed.join(" ");
      onChange();
    });

    const enableLabel = document.createElement("label");
    enableLabel.className = "switch switch-sm";
    enableLabel.title = "Enable this preset in rotation";
    const enableInput = document.createElement("input");
    enableInput.type = "checkbox";
    enableInput.checked = preset.enabled !== false;
    enableInput.setAttribute("aria-label", "Include preset " + preset.sequence.join("-") + " in rotation");
    const enableSlider = document.createElement("span");
    enableSlider.className = "switch-slider";
    enableInput.addEventListener("change", function () {
      preset.enabled = enableInput.checked;
      row.classList.toggle("disabled", !enableInput.checked);
      onChange();
    });
    enableLabel.appendChild(enableInput);
    enableLabel.appendChild(enableSlider);

    const delEl = document.createElement("button");
    delEl.className = "punch-del";
    delEl.setAttribute("aria-label", "Remove preset " + preset.sequence.join("-"));
    delEl.textContent = "✕";
    delEl.addEventListener("click", function () {
      settings.comboPresets = settings.comboPresets.filter(function (x) { return x !== preset; });
      renderPresetList(container, settings, opts);
      onChange();
    });

    row.appendChild(input);
    row.appendChild(enableLabel);
    row.appendChild(delEl);
    container.appendChild(row);
  });
}

export function addPreset(settings, sequence) {
  if (!sequence || !sequence.length) return false;
  settings.comboPresets.push({ sequence: sequence, enabled: true });
  return true;
}
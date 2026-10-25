/**
 * Lab contract for PHY 2048. The numbers live here. The scene is drawn later,
 * by the physics shell, so init and syncViews stay empty on purpose.
 */
import { defineLab as checkLab } from '@flux/core';
import { cells, kv } from '@flux/shells/physics/shared.js';

/**
 * A lab says what it reads out once, as `readoutCells(state, computed)`: [label, value, class?]
 * rows. The readout strip and the equation panel's live rows are both made from it.
 */
export function defineLab(spec) {
  const fromCells = spec.readoutCells
    ? {
        readout: (state, computed) => cells(spec.readoutCells(state, computed)),
        // The first two cells are the headline numbers above; the rest are listed under them.
        liveRows: (state, computed) => spec.readoutCells(state, computed).slice(2).map(([k, v]) => kv(k, v)).join(''),
      }
    : {};
  return checkLab({
    live: false,
    orbit: true,
    hint: '',
    keys: { r: 'reset', R: 'reset' },
    toggles: [],
    legend: null,
    defaultState: () => ({}),
    scenarios: [],
    predictions: [],
    controls: () => '',
    bind() {},
    syncControls() {},
    init: () => ({}),
    enter() {},
    exit() {},
    recompute() {},
    syncViews() {},
    law: () => [],
    liveRows: () => '',
    readout: () => '',
    coach: () => ({ title: '', body: '' }),
    plot: () => null,
    pointer: null,
    ...spec,
    ...fromCells,
    kind: 'scene3d',
  });
}

export function sliderRow(id, label, value, min, max, step) {
  return `<label class="field"><span>${label}</span><div class="slider-row"><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" /></div></label>`;
}

export function bindSlider(api, id, set) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', (e) => {
    set(api.slice(), Number(e.target.value));
    api.bump();
  });
}

export function putSlider(id, value, digits = 2) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = String(Number(value.toFixed(digits)));
}

/** A number for a readout. Finite values only; the check rejects anything else. */
export function fmt(x, n = 4) {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 0.01 && a < 1e5) return String(Number(x.toPrecision(n)));
  const [m, e] = x.toExponential(n - 1).split('e');
  return `${Number(m)}e${Number(e)}`;
}

/**
 * A slider over a quantity that spans decades (a radius from 1 m to 2 km). It holds log10 of the
 * value; the shell's box shows the value itself (`data-log`).
 */
export function logSliderRow(id, label, value, min, max) {
  return `<label class="field"><span>${label}</span><div class="slider-row"><input type="range" id="${id}" min="${Math.log10(min)}" max="${Math.log10(max)}" step="0.001" value="${Math.log10(value)}" data-log="10" /></div></label>`;
}

/** Bind a log slider: the state gets the value, to three significant figures. */
export function bindLogSlider(api, id, set) {
  bindSlider(api, id, (s, x) => set(s, Number((10 ** x).toPrecision(3))));
}

export function putLogSlider(id, value) {
  if (value > 0) putSlider(id, Math.log10(value), 4);
}

/**
 * Lab contract for PHY 2048. The numbers live here. The scene is drawn later,
 * by the physics shell, so init and syncViews stay empty on purpose.
 */
import { defineLab as checkLab } from '@flux/core';

export function defineLab(spec) {
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

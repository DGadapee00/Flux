import { beamGap, cantileverTip, simplePoint, simpleUniform } from '@flux/subjects/mechanics/sections.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that the moment peaks where the shear changes sign, because dM/dx = V.
 * A cantilever never crosses zero shear, so its peak stays at the wall.
 *
 * Second method: internalAt on the left-hand segment, at every station.
 */

const KN = 1000;

const SCENARIOS = [
  { id: 'point', name: 'Point load at midspan', P: 10e3, w: 5e3, L: 4, a: 2, x: 2 },
  { id: 'uniform', name: 'Uniform load', P: 10e3, w: 5e3, L: 4, a: 2, x: 2 },
  { id: 'cantilever', name: 'Cantilever, tip load', P: 8e3, w: 5e3, L: 2, a: 1, x: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, w: sc.w, L: sc.L, a: sc.a, x: sc.x });
}

function modelOf(state) {
  if (state.scenarioId === 'uniform') return simpleUniform(state.w, state.L);
  if (state.scenarioId === 'cantilever') return cantileverTip(state.P, state.L);
  const a = Math.min(Math.max(state.a, 1e-3), Math.max(state.L - 1e-3, 1e-3));
  return simplePoint(state.P, state.L, a);
}

export default defineLab({
  id: 'diagrams',
  exam: 'u6',
  title: 'Shear and moment',
  hint: 'The moment peaks where the shear crosses zero. On a cantilever the shear never crosses, so the peak is at the wall.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('point', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    if (state.scenarioId === 'uniform') return { key: 'w', lo: 1e3, hi: 20e3 };
    return { key: 'P', lo: 1e3, hi: 30e3 };
  },
  controls() {
    return `
      ${slider('dg-p', 'point load (kN)', 10, 1, 30, 0.5)}
      ${slider('dg-w', 'uniform load (kN/m)', 5, 1, 20, 0.5)}
      ${slider('dg-l', 'span (m)', 4, 1, 8, 0.1)}
      ${slider('dg-a', 'load position from the left (m)', 2, 0.2, 6, 0.1)}
      ${slider('dg-x', 'cut position (m)', 2, 0, 8, 0.05)}
      <p class="tiny">Sagging moment is positive. Shear is positive when the left segment is pushed up. Distributed load is downward.</p>`;
  },
  bind(api) {
    bindSlider('dg-p', (s, v) => { s.P = v * KN; }, api);
    bindSlider('dg-w', (s, v) => { s.w = v * KN; }, api);
    bindSlider('dg-l', (s, v) => { s.L = v; }, api);
    bindSlider('dg-a', (s, v) => { s.a = v; }, api);
    bindSlider('dg-x', (s, v) => { s.x = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('dg-p', state.P / KN);
    set('dg-w', state.w / KN);
    set('dg-l', state.L);
    set('dg-a', state.a);
    set('dg-x', state.x);
    const point = state.scenarioId === 'point';
    const uniform = state.scenarioId === 'uniform';
    showField('dg-p', !uniform);
    showField('dg-w', uniform);
    showField('dg-a', point);
  },
  compute(state) {
    const model = modelOf(state);
    const x = Math.min(Math.max(state.x, 0), state.L);
    const here = model.at(x);
    return {
      V: here.V,
      M: here.M,
      Vmax: model.Vmax,
      Mmax: model.Mmax,
      xM: model.xM,
      left: model.left,
      w: state.w,
      P: state.P,
      L: state.L,
      gap: beamGap(model),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const model = modelOf(state);
    const pts = [];
    let yLo = 0;
    let yHi = 1;
    const mark = (x) => {
      const M = model.at(x).M / KN;
      pts.push([x, M]);
      yLo = Math.min(yLo, M);
      yHi = Math.max(yHi, M);
    };
    for (let i = 0; i <= 40; i++) mark((state.L * i) / 40);
    mark(model.xM);
    pts.sort((p, q) => p[0] - q[0]);
    const pad = Math.max(yHi - yLo, 1) * 0.08;
    const P = plotIn(B, B.free, { lo: 0, hi: state.L }, { lo: yLo - pad, hi: yHi + pad });
    axes(P, { xLabel: 'x (m)', yLabel: 'moment (kN·m)' });
    line(P, pts, { color: C.gold, width: 3 });
    line(P, [[c.xM, yLo - pad], [c.xM, yHi + pad]], { color: C.teal, width: 2, dash: [5, 4] });
    const x = Math.min(Math.max(state.x, 0), state.L);
    dot(P, x, c.M / KN, { color: C.gold, r: 5 });
  },
  law(state) {
    if (state.scenarioId === 'uniform') return [String.raw`M=\frac{wL^2}{8}`];
    if (state.scenarioId === 'cantilever') return [String.raw`M=-PL`];
    return [String.raw`M=\frac{Pa(L-a)}{L}`];
  },
  liveRows(state, c) {
    return [
      kv('shear at the cut', `${fig(c.V / KN)} kN`),
      kv('moment at the cut', `${fig(c.M / KN)} kN·m`),
      kv('largest shear', `${fig(c.Vmax / KN)} kN`),
      kv('peak moment', `${fig(c.Mmax / KN)} kN·m`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['V cut', `${fig(c.V / KN)} kN`],
      ['M cut', `${fig(c.M / KN)} kN·m`],
      ['V max', `${fig(c.Vmax / KN)} kN`],
      ['M peak', `${fig(c.Mmax / KN)} kN·m`],
    ]);
  },
  coach(state, c) {
    const atWall = state.scenarioId === 'cantilever';
    return {
      title: atWall ? 'The shear never crosses zero' : 'The peak sits on the shear crossing',
      body: atWall
        ? `The wall moment is ${fig(c.Mmax / KN)} kN·m and the shear is ${fig(c.Vmax / KN)} kN all along the span. dM/dx = V, and V does not change sign, so the extreme moment is at the wall.`
        : `The peak moment is ${fig(c.Mmax / KN)} kN·m, at ${fig(c.xM)} m. The larger shear is ${fig(c.Vmax / KN)} kN. The teal line is where the shear changes sign.`,
    };
  },
});

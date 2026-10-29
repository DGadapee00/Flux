import { combinedCircle, combinedReduced } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, couple, dot, hidden, label, line, panes, poly, sceneIn, seg, wall } from './diagram.js';
import { stressElement } from './elements.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that bending and torsion meet at the outer fiber, so the principal
 * stress is not the bending stress and von Mises is not equal to it either.
 *
 * Second method: 4P/(πd²) + 32M/(πd³) and 16T/(πd³).
 */

const MPA = 1e6;
const SCENARIOS = [
  { id: 'both', name: 'Axial, bending and torque', P: 10e3, M: 400, T: 300, d: 0.04 },
  { id: 'bend', name: 'Bending only', P: 0, M: 500, T: 0, d: 0.04 },
  { id: 'torque', name: 'Torque only', P: 0, M: 0, T: 400, d: 0.04 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, M: sc.M, T: sc.T, d: sc.d });
}

/**
 * The bar, fixed in a wall, with its three loads at the free end: the axial force P along it, the
 * bending moment M in the page, and the torque T about its axis. The element sits on the top fiber
 * at the wall, where the bending stress is largest and the torsion stress is at its outer value.
 */
function member(B, rect, state, c, veiled) {
  const S = sceneIn(B, rect, { x0: -0.4, x1: 3.9, y0: -1.25, y1: 1.25 }, 8);
  wall(S, 0, -0.7, 0.7, { side: -1 });
  poly(S, [[0, -0.3], [2.8, -0.3], [2.8, 0.3], [0, 0.3]], { fill: alpha(C.text, 0.1), stroke: C.text, width: 1.5 });
  for (let a = 0; a <= 24; a++) {
    const t = (a / 24) * 2 * Math.PI;
    if (a) seg(S, [2.8 + 0.12 * Math.cos(t - Math.PI / 12), 0.3 * Math.sin(t - Math.PI / 12)], [2.8 + 0.12 * Math.cos(t), 0.3 * Math.sin(t)], { color: C.text, width: 1.2 });
  }
  if (Math.abs(state.P) > 1) arrow(S, [2.95, 0], state.P > 0 ? 0 : Math.PI, 30, { color: C.pink, tail: state.P < 0 });
  if (Math.abs(state.M) > 1e-6) couple(S, [2.8, 0], { r: 22, ccw: state.M > 0, color: C.pink });
  if (Math.abs(state.T) > 1e-6) {
    // A torque about the bar's axis: a double-headed arrow along it, right-hand rule.
    arrow(S, [3.05, -0.75], 0, 34, { color: C.purple, width: 2.5 });
    arrow(S, [3.05, -0.75], 0, 24, { color: C.purple, width: 2.5 });
  }
  stressElement(S, [0.75, 0.62], { half: 0.2, sx: c.sx, txy: c.txy, scale: Math.max(Math.abs(c.sx), Math.abs(c.txy), 1), full: 26, names: false });
  seg(S, [0.75, 0.42], [0.75, 0.3], { color: alpha(C.text, 0.5), width: 1, dash: [2, 2] });
  if (!veiled) {
    label(S, `σx ${fig(c.sx / 1e6)} MPa`, [0.75, 0.82], { color: C.gold, dy: -12 });
    label(S, `τ ${fig(c.txy / 1e6)} MPa`, [0.95, 0.62], { color: C.teal, dx: 28, align: 'left' });
    if (Math.abs(state.P) > 1) label(S, `P ${fig(state.P / 1e3)} kN`, [2.95, 0], { color: C.pink, dx: 22, dy: -12 });
    if (Math.abs(state.M) > 1e-6) label(S, `M ${fig(state.M)} N·m`, [2.8, 0.3], { color: C.pink, dy: -30 });
    if (Math.abs(state.T) > 1e-6) label(S, `T ${fig(state.T)} N·m`, [3.05, -0.75], { color: C.purple, dy: 14, dx: 16 });
  }
}

export default defineLab({
  id: 'combined',
  exam: 'u5',
  title: 'Combined loading',
  hint: 'At the outer fiber, bending and torsion are both at their peaks. The principal stress is not Mc/I.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('both', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'T', lo: 0, hi: 800 }),
  controls() {
    return `
      ${slider('cb-p', 'axial force (kN)', 10, -40, 40, 1)}
      ${slider('cb-m', 'bending moment (N·m)', 400, 0, 800, 10)}
      ${slider('cb-t', 'torque (N·m)', 300, 0, 800, 10)}
      ${slider('cb-d', 'diameter (mm)', 40, 20, 80, 1)}
      <p class="tiny">Solid circular bar. The point is the outer fiber in bending. Tension is positive. E is not used: this is stress, not deformation.</p>`;
  },
  bind(api) {
    bindSlider('cb-p', (s, v) => { s.P = v * 1e3; }, api);
    bindSlider('cb-m', (s, v) => { s.M = v; }, api);
    bindSlider('cb-t', (s, v) => { s.T = v; }, api);
    bindSlider('cb-d', (s, v) => { s.d = v * 1e-3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('cb-p', state.P / 1e3);
    set('cb-m', state.M);
    set('cb-t', state.T);
    set('cb-d', state.d * 1e3);
  },
  compute(state) {
    const s = combinedCircle(state.P, state.M, state.T, state.d);
    const red = combinedReduced(state.P, state.M, state.T, state.d);
    const gap = Math.max(Math.abs(s.sx - red.sx), Math.abs(s.txy - red.txy))
      / Math.max(Math.abs(s.sx), Math.abs(s.txy), 1);
    return { ...s, axial: red.axial, bend: red.bend, T: state.T, d: state.d, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.45, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
    const vm = [];
    const normal = [];
    let yHi = 1;
    for (let i = 0; i <= 40; i++) {
      const T = (800 * i) / 40;
      const s = combinedCircle(state.P, state.M, T, state.d);
      vm.push([T, s.vm / MPA]);
      normal.push([T, s.sx / MPA]);
      yHi = Math.max(yHi, s.vm / MPA, Math.abs(s.sx / MPA));
    }
    const P = chartIn(B, R, { lo: 0, hi: 800 }, { lo: 0, hi: yHi * 1.1 });
    axes(P, { xLabel: 'torque (N·m)', yLabel: 'stress (MPa)' });
    line(P, normal, { color: C.gold, width: 3 });
    line(P, vm, { color: C.teal, width: 3 });
    dot(P, state.T, c.sx / MPA, { color: C.gold, r: 5 });
    dot(P, state.T, c.vm / MPA, { color: C.teal, r: 5 });
  },
  law: () => [String.raw`\sigma_x=\frac{P}{A}+\frac{Mc}{I}`],
  liveRows(state, c) {
    return [
      kv('σx', `${fig(c.sx / MPA)} MPa`),
      kv('τxy', `${fig(c.txy / MPA)} MPa`),
      kv('von Mises', `${fig(c.vm / MPA)} MPa`),
      kv('Tresca', `${fig(c.tresca / MPA)} MPa`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['σx', `${fig(c.sx / MPA)} MPa`],
      ['τ', `${fig(c.txy / MPA)} MPa`],
      ['σ1', `${fig(c.s1 / MPA)} MPa`],
      ['vm', `${fig(c.vm / MPA)} MPa`],
    ]);
  },
  coach(state, c) {
    const plain = Math.abs(c.txy) < 1;
    return {
      title: plain ? 'No shear at this fiber' : 'Shear has moved the principal',
      body: plain
        ? `σx is ${fig(c.sx / MPA)} MPa and it is the only stress, so von Mises equals it.`
        : `σx is ${fig(c.sx / MPA)} MPa and τ is ${fig(c.txy / MPA)} MPa. σ1 is ${fig(c.s1 / MPA)} MPa. von Mises is ${fig(c.vm / MPA)} MPa and Tresca is ${fig(c.tresca / MPA)} MPa.`,
    };
  },
});

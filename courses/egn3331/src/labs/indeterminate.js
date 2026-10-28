import { fixedFixed, fixedFixedByStiffness } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that a bar held between two walls shares a load in proportion to stiffness.
 * The shorter side is stiffer, so it carries more of P.
 *
 * Second method: the force method, R_left = P(L−a)/L, against two springs k = AE/L.
 */

const E = 200e9;
const A = 400e-6;
const L = 2;

const SCENARIOS = [
  { id: 'mid', name: 'Load at midspan', a: 1 },
  { id: 'left', name: 'Load near the left wall', a: 0.4 },
  { id: 'right', name: 'Load near the right wall', a: 1.6 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, a: sc.a, P: 20e3 });
}

export default defineLab({
  id: 'indeterminate',
  exam: 'u3',
  title: 'Indeterminate bar',
  hint: 'Slide the load toward one wall. That side shortens, stiffens, and takes more of the force.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('mid', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'a', lo: 0.2, hi: 1.8 }),
  controls() {
    return `
      ${slider('in-a', 'load position a (m)', 1, 0.2, 1.8, 0.02)}
      ${slider('in-P', 'load P (kN)', 20, 5, 80, 1)}
      <p class="tiny">The bar is 2 m long, 400 mm², E = 200 GPa, fixed to both walls. a is measured from the left wall.</p>`;
  },
  bind(api) {
    bindSlider('in-a', (s, v) => { s.a = v; }, api);
    bindSlider('in-P', (s, v) => { s.P = v * 1e3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('in-a', state.a);
    set('in-P', state.P / 1e3);
  },
  compute(state) {
    const force = fixedFixed(state.P, L, state.a);
    const spring = fixedFixedByStiffness(state.P, L, state.a, A, E);
    const gap = Math.max(Math.abs(force.left - spring.left), Math.abs(force.right - spring.right)) / Math.max(state.P, 1);
    return { ...force, kL: spring.kL, kR: spring.kR, P: state.P, a: state.a, L, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const P = plotIn(B, B.free, { lo: 0.2, hi: 1.8 }, { lo: 0, hi: c.P / 1e3 * 1.05 });
    axes(P, { xLabel: 'load position a (m)', yLabel: 'wall reaction (kN)' });
    const left = [];
    const right = [];
    for (let i = 0; i <= 40; i++) {
      const a = 0.2 + (1.6 * i) / 40;
      const r = fixedFixed(c.P, L, a);
      left.push([a, r.left / 1e3]);
      right.push([a, r.right / 1e3]);
    }
    line(P, left, { color: C.gold, width: 3 });
    line(P, right, { color: C.teal, width: 3 });
    line(P, [[1, 0], [1, c.P / 1e3]], { color: alpha(C.text, 0.35), width: 1.5, dash: [4, 4] });
    dot(P, c.a, c.left / 1e3, { color: C.gold, r: 5 });
    dot(P, c.a, c.right / 1e3, { color: C.teal, r: 5 });
  },
  law: () => [String.raw`R_L=P\frac{L-a}{L}`],
  liveRows(state, c) {
    return [
      kv('left stiffness', `${fig(c.kL / 1e6)} MN/m`),
      kv('right stiffness', `${fig(c.kR / 1e6)} MN/m`),
      kv('left share', fig(c.left / c.P)),
      kv('right share', fig(c.right / c.P)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['left wall', `${fig(c.left / 1e3)} kN`],
      ['right wall', `${fig(c.right / 1e3)} kN`],
      ['left share', fig(c.left / c.P)],
      ['position', `${fig(c.a)} m`],
    ]);
  },
  coach(state, c) {
    if (Math.abs(c.a - 1) < 0.05) {
      return {
        title: 'Equal lengths, equal shares',
        body: String.raw`The load is at midspan, so each wall carries ${fig(c.P / 2 / 1e3)} kN. The two stiffnesses match.`,
      };
    }
    const near = c.a < 1 ? 'left' : 'right';
    const big = c.a < 1 ? c.left : c.right;
    return {
      title: 'The short side carries more',
      body: String.raw`The ${near} segment is the shorter one, so it is stiffer and carries ${fig(big / 1e3)} kN of the ${fig(c.P / 1e3)} kN. Statics alone cannot find either reaction. The walls do not move, and that extra fact splits the load.`,
    };
  },
});

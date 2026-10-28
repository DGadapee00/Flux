import { hoopFromSplit, sphereFromCap, thinCylinder, thinSphere } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that a closed thin cylinder's hoop stress is twice its longitudinal stress,
 * and that a sphere at the same pressure, radius and thickness carries half that hoop stress.
 *
 * Second method: the half-cylinder split force 2prL against two walls of thickness t,
 * and the hemispherical cap balance πr²p = σ·2πrt.
 */

const SCENARIOS = [
  { id: 'cylinder', name: 'Closed cylinder', kind: 'cylinder', p: 2e6, r: 0.2, t: 0.005 },
  { id: 'sphere', name: 'Sphere', kind: 'sphere', p: 2e6, r: 0.2, t: 0.005 },
  { id: 'thin', name: 'Thinner cylinder', kind: 'cylinder', p: 2e6, r: 0.2, t: 0.002 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, kind: sc.kind, p: sc.p, r: sc.r, t: sc.t });
}

function stresses(state) {
  return state.kind === 'sphere' ? thinSphere(state.p, state.r, state.t) : thinCylinder(state.p, state.r, state.t);
}

export default defineLab({
  id: 'vessel',
  exam: 'u4',
  title: 'Thin-walled vessel',
  hint: 'A closed cylinder carries twice as much stress around the wall as along it. A sphere carries the smaller of those two.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('cylinder', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'p', lo: 0.2e6, hi: 4e6 }),
  controls() {
    return `
      ${slider('vs-p', 'pressure (MPa)', 2, 0.2, 4, 0.1)}
      ${slider('vs-r', 'inside radius (mm)', 200, 50, 400, 5)}
      ${slider('vs-t', 'thickness (mm)', 5, 1, 20, 0.5)}
      <p class="tiny">Thin-wall formulas, inside radius. A cylinder is closed. A sphere uses the same pressure, radius and thickness.</p>`;
  },
  bind(api) {
    bindSlider('vs-p', (s, v) => { s.p = v * 1e6; }, api);
    bindSlider('vs-r', (s, v) => { s.r = v * 1e-3; }, api);
    bindSlider('vs-t', (s, v) => { s.t = v * 1e-3; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('vs-p', state.p / 1e6);
    set('vs-r', state.r * 1e3);
    set('vs-t', state.t * 1e3);
  },
  compute(state) {
    const s = stresses(state);
    const check = state.kind === 'sphere' ? sphereFromCap(state.p, state.r, state.t) : hoopFromSplit(state.p, state.r, state.t);
    const gap = Math.abs(s.hoop - check) / Math.max(Math.abs(s.hoop), 1);
    return { ...s, check, p: state.p, r: state.r, t: state.t, kind: state.kind, rt: state.r / state.t, gap };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const yHi = Math.max(c.hoop, c.axial, 1) / 1e6 * 1.15;
    const P = plotIn(B, B.free, { lo: 0, hi: 4 }, { lo: 0, hi: yHi * (4e6 / c.p) });
    axes(P, { xLabel: 'pressure (MPa)', yLabel: 'stress (MPa)' });
    const hoop = [];
    const axial = [];
    for (let i = 0; i <= 40; i++) {
      const p = (4e6 * i) / 40;
      const s = state.kind === 'sphere' ? thinSphere(p, c.r, c.t) : thinCylinder(p, c.r, c.t);
      hoop.push([p / 1e6, s.hoop / 1e6]);
      axial.push([p / 1e6, s.axial / 1e6]);
    }
    line(P, hoop, { color: C.gold, width: 3 });
    line(P, axial, { color: C.teal, width: 3 });
    dot(P, c.p / 1e6, c.hoop / 1e6, { color: C.gold, r: 5 });
    dot(P, c.p / 1e6, c.axial / 1e6, { color: C.teal, r: 5 });
  },
  law: (state) => [state.kind === 'sphere' ? String.raw`\sigma=\frac{pr}{2t}` : String.raw`\sigma_h=\frac{pr}{t}`],
  liveRows(state, c) {
    return [
      kv('hoop', `${fig(c.hoop / 1e6)} MPa`),
      kv('longitudinal', `${fig(c.axial / 1e6)} MPa`),
      kv('r/t', fig(c.rt)),
      kv('balance', `${fig(c.check / 1e6)} MPa`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['hoop', `${fig(c.hoop / 1e6)} MPa`],
      ['long', `${fig(c.axial / 1e6)} MPa`],
      ['r/t', fig(c.rt)],
      ['pressure', `${fig(c.p / 1e6)} MPa`],
    ]);
  },
  coach(state, c) {
    if (state.kind === 'sphere') {
      return {
        title: 'A sphere has no hoop of its own',
        body: String.raw`Both membrane stresses are ${fig(c.hoop / 1e6)} MPa, which is $pr/(2t)$. There is no direction that carries twice that.`,
      };
    }
    return {
      title: 'The hoop stress is the one that splits it',
      body: String.raw`The hoop stress is ${fig(c.hoop / 1e6)} MPa and the longitudinal stress is ${fig(c.axial / 1e6)} MPa. A closed cylinder fails along its length, where the stress is larger.`,
    };
  },
});

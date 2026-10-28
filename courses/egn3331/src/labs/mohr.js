import { eigen2, principal2, transform } from '@flux/subjects/mechanics/materials.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, axes, begin, dot, line, plotIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that shear drops to zero on the principal planes, and that the largest
 * in-plane shear sits 45° from those planes.
 *
 * Second method: the eigenvalues of the 2×2 stress matrix.
 */

const MPA = 1e6;
const SCENARIOS = [
  { id: 'general', name: 'With shear', sx: 80e6, sy: 20e6, txy: 30e6, theta: 0 },
  { id: 'principal', name: 'On the principal plane', sx: 80e6, sy: 20e6, txy: 30e6, theta: 22.5 },
  { id: 'uni', name: 'Uniaxial, turned 30°', sx: 100e6, sy: 0, txy: 0, theta: 30 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, sx: sc.sx, sy: sc.sy, txy: sc.txy, theta: sc.theta });
}

export default defineLab({
  id: 'mohr',
  exam: 'u5',
  title: "Mohr's circle",
  hint: 'Shear is zero on the principal planes. The largest in-plane shear is 45° away from them.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('general', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: -90, hi: 90 }),
  controls() {
    return `
      ${slider('mh-x', 'σx (MPa)', 80, -100, 150, 5)}
      ${slider('mh-y', 'σy (MPa)', 20, -100, 150, 5)}
      ${slider('mh-t', 'τxy (MPa)', 30, -80, 80, 5)}
      ${slider('mh-a', 'θ (degrees)', 0, -90, 90, 1)}
      <p class="tiny">Plane stress. θ turns the element counterclockwise. Tension is positive.</p>`;
  },
  bind(api) {
    bindSlider('mh-x', (s, v) => { s.sx = v * MPA; }, api);
    bindSlider('mh-y', (s, v) => { s.sy = v * MPA; }, api);
    bindSlider('mh-t', (s, v) => { s.txy = v * MPA; }, api);
    bindSlider('mh-a', (s, v) => { s.theta = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('mh-x', state.sx / MPA);
    set('mh-y', state.sy / MPA);
    set('mh-t', state.txy / MPA);
    set('mh-a', state.theta);
  },
  compute(state) {
    const p = principal2(state.sx, state.sy, state.txy);
    const e = eigen2(state.sx, state.sy, state.txy);
    const tr = transform(state.sx, state.sy, state.txy, state.theta);
    const gap = Math.max(Math.abs(p.s1 - e.s1), Math.abs(p.s2 - e.s2)) / Math.max(Math.abs(p.s1), Math.abs(p.s2), 1);
    return {
      ...tr, s1: p.s1, s2: p.s2, R: p.R, avg: p.avg, thetaP: (p.theta * 180) / Math.PI, gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    let yHi = 1;
    const normal = [];
    const shear = [];
    for (let i = 0; i <= 60; i++) {
      const th = -90 + (180 * i) / 60;
      const tr = transform(state.sx, state.sy, state.txy, th);
      normal.push([th, tr.sx / MPA]);
      shear.push([th, tr.txy / MPA]);
      yHi = Math.max(yHi, Math.abs(tr.sx / MPA), Math.abs(tr.txy / MPA));
    }
    const P = plotIn(B, B.free, { lo: -90, hi: 90 }, { lo: -yHi * 1.1, hi: yHi * 1.1 });
    axes(P, { xLabel: 'θ (degrees)', yLabel: 'stress (MPa)' });
    line(P, normal, { color: C.gold, width: 3 });
    line(P, shear, { color: C.teal, width: 3 });
    dot(P, state.theta, c.sx / MPA, { color: C.gold, r: 5 });
    dot(P, state.theta, c.txy / MPA, { color: C.teal, r: 5 });
  },
  law: () => [String.raw`\sigma_{x'}=\frac{\sigma_x+\sigma_y}{2}+\frac{\sigma_x-\sigma_y}{2}\cos 2\theta+\tau_{xy}\sin 2\theta`],
  liveRows(state, c) {
    return [
      kv('σx′', `${fig(c.sx / MPA)} MPa`),
      kv('τx′y′', `${fig(c.txy / MPA)} MPa`),
      kv('σ1', `${fig(c.s1 / MPA)} MPa`),
      kv('σ2', `${fig(c.s2 / MPA)} MPa`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['σx′', `${fig(c.sx / MPA)} MPa`],
      ['τ', `${fig(c.txy / MPA)} MPa`],
      ['σ1', `${fig(c.s1 / MPA)} MPa`],
      ['θp', `${fig(c.thetaP)}°`],
    ]);
  },
  coach(state, c) {
    const onP = Math.abs(c.txy) < 0.02 * Math.max(Math.abs(c.R), 1);
    return {
      title: onP ? 'Shear has dropped out' : 'This plane still carries shear',
      body: onP
        ? `At ${fig(c.thetaP)}° the shear is zero. The principals are ${fig(c.s1 / MPA)} MPa and ${fig(c.s2 / MPA)} MPa.`
        : `σx′ is ${fig(c.sx / MPA)} MPa and the shear is ${fig(c.txy / MPA)} MPa. The principals are ${fig(c.s1 / MPA)} MPa and ${fig(c.s2 / MPA)} MPa, at ${fig(c.thetaP)}°.`,
    };
  },
});

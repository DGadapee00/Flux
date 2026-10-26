/**
 * Shows that the works of all the forces on a body add up to its change of kinetic energy, that the
 * normal force does no work because it is at right angles to the motion, and that the stopping
 * distance grows as the square of the speed.
 *
 * A block moves along a ramp: pushed up it, shoved up it and left to stop, or sliding down it. Each
 * force's work is F·d·cos(angle) over the distance travelled, and their sum gives the final kinetic
 * energy. The check finds the acceleration from Newton's second law and the final speed from
 * v² = v0² + 2ad, with no work in it.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { kineticEnergy, work } from '@flux/subjects/mechanics/energy.js';
import { Arrow, M, fatLine, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const FORCE = QUANTITY_COLORS.a;
/** The bar chart's zero line, under the ramp. */
const BASE = -3.0;

const SCENARIOS = [
  { id: 'push', name: 'Pushing a 50 kg crate 3 m up a 10° ramp', mode: 'push', m: 50, theta: 10, F: 300, phi: 0, mu: 0.3, d: 3, v0: 0 },
  { id: 'shove', name: 'A 2 kg box shoved up a 20° ramp at 4 m/s', mode: 'shove', m: 2, theta: 20, F: 0, phi: 0, mu: 0.2, d: 1, v0: 4 },
  { id: 'slide', name: 'A 2 kg box sliding 2 m down a 30° ramp', mode: 'slide', m: 2, theta: 30, F: 0, phi: 0, mu: 0.2, d: 2, v0: 0 },
];

/** The works over the trip, the distance, and the final kinetic energy. */
function trip(s) {
  const th = s.theta * DEG;
  const push = s.mode === 'push' ? s.F : 0;
  const N = Math.max(0, s.m * G * Math.cos(th) - push * Math.sin(s.phi * DEG));
  const up = s.mode === 'slide' ? -1 : 1;
  const K0 = kineticEnergy(s.m, s.v0);
  // Shoved and left alone, it goes until gravity and friction have taken all of K0.
  const D = s.mode === 'shove' ? K0 / (s.m * G * Math.sin(th) + s.mu * N) : s.d;
  const WF = work(push, D, s.phi);
  const Wg = -s.m * G * Math.sin(th) * up * D;
  const WN = work(N, D, 90);
  const Wf = -s.mu * N * D;
  const Wnet = WF + Wg + WN + Wf;
  // Shoved and left alone, it ends at rest; the sum would leave rounding dust.
  const Kf = s.mode === 'shove' ? 0 : Math.max(0, K0 + Wnet);
  return { N, D, K0, WF, Wg, WN: Math.abs(WN) < 1e-9 ? 0 : WN, Wf, Wnet, Kf, vf: Math.sqrt((2 * Kf) / s.m), stalls: K0 + Wnet < -1e-9 };
}

export default defineLab({
  id: 'work-energy',
  exam: 'u4',
  title: 'Work and energy',
  hint: 'Each force does work along the motion. Their sum is the change in kinetic energy.',
  orbit: false,
  fit: { w: 8.6, h: 12.6 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'we-speed',
      scenario: 'shove',
      ask: String.raw`Shove the box twice as fast, $8\ \mathrm{m/s}$ instead of $4$. What happens to its kinetic energy at the start and to how far it slides before it stops?`,
      apply(s) { s.v0 *= 2; },
      watch: [
        { id: 'K0', label: 'the kinetic energy at the start', get: (c) => c.K0, mode: 'factor' },
        { id: 'D', label: 'how far it slides', get: (c) => c.D, mode: 'factor' },
      ],
      expect: { K0: 4, D: 4 },
      why: String.raw`$K = \tfrac12mv^2$, so twice the speed is four times the energy. Gravity and friction take it away at a fixed rate per metre, so it takes four times the distance to remove it.`,
    },
    {
      id: 'we-normal',
      scenario: 'push',
      ask: String.raw`Push the crate at $30^\circ$ above the ramp instead of along it. Part of the push now presses less on the ramp. Does the normal force now do some work on the crate?`,
      apply(s) { s.phi = 30; },
      watch: [{ id: 'WN', label: 'the normal force does work', get: (c) => Math.abs(c.WN) > 1e-9, mode: 'bool' }],
      expect: { WN: false },
      why: String.raw`The normal force changes size, but it stays at $90^\circ$ to the ramp and so to the motion. Its work is $Nd\cos90^\circ = 0$. The smaller normal force does cut friction's work.`,
    },
    {
      id: 'we-mass',
      scenario: 'slide',
      ask: String.raw`A box twice as heavy, $4\ \mathrm{kg}$, slides the same $2\ \mathrm{m}$ down the same ramp. What happens to the work friction does and to the box's final speed?`,
      apply(s) { s.m *= 2; },
      watch: [
        { id: 'Wf', label: 'the work done by friction', get: (c) => c.Wf, mode: 'factor' },
        { id: 'vf', label: 'the final speed', get: (c) => c.vf, mode: 'factor' },
      ],
      expect: { Wf: 2, vf: 1 },
      why: String.raw`Gravity and friction both do twice the work on twice the mass, so the box gains twice the kinetic energy. But $\tfrac12mv^2$ with twice $m$ needs the same $v$: the speed does not change.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('push', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('we-m', 'Mass (kg)', 50, 0.5, 100, 0.5)}${sliderRow('we-theta', 'Angle of the ramp (°)', 10, 0, 45, 1)}${sliderRow('we-F', 'Push (N), when pushing', 300, 0, 800, 5)}${sliderRow('we-phi', 'Angle of the push above the ramp (°)', 0, 0, 60, 1)}${sliderRow('we-mu', 'Coefficient of kinetic friction', 0.3, 0, 1, 0.01)}${sliderRow('we-d', 'Distance (m), when pushing or sliding', 3, 0.1, 10, 0.1)}${sliderRow('we-v0', 'Starting speed (m/s)', 0, 0, 15, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'we-m', (s, x) => { s.m = x; });
    bindSlider(api, 'we-theta', (s, x) => { s.theta = x; });
    bindSlider(api, 'we-F', (s, x) => { s.F = x; });
    bindSlider(api, 'we-phi', (s, x) => { s.phi = x; });
    bindSlider(api, 'we-mu', (s, x) => { s.mu = x; });
    bindSlider(api, 'we-d', (s, x) => { s.d = x; });
    bindSlider(api, 'we-v0', (s, x) => { s.v0 = x; });
  },
  syncControls(state) {
    putSlider('we-m', state.m, 1);
    putSlider('we-theta', state.theta, 0);
    putSlider('we-F', state.F, 0);
    putSlider('we-phi', state.phi, 0);
    putSlider('we-mu', state.mu, 2);
    putSlider('we-d', state.d, 1);
    putSlider('we-v0', state.v0, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ramp = fatLine(new Array(4 * 3).fill(0), { color: M.grey, width: 2.5 });
    const block = fatLine(new Array(5 * 3).fill(0), { color: M.blue, width: 3 });
    const arrows = {};
    for (const key of ['F', 'w', 'N', 'f']) arrows[key] = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE);
    const motion = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.016);
    const names = {};
    for (const [key, html] of [['F', '<i>F</i>'], ['w', '<i>mg</i>'], ['N', '<i>N</i>'], ['f', '<i>f</i>'], ['d', '<i>d</i>']]) names[key] = label(html, 0, 0, 0, 'graph-title');
    const base = fatLine([-3.4, BASE, 0, 3.4, BASE, 0], { color: M.greyDark, width: 1.5 });
    const bars = [];
    const barNames = [];
    const barValues = [];
    for (const key of ['W_F', 'W_g', 'W_N', 'W_f', 'W_net', 'ΔK']) {
      bars.push(fatLine([0, 0, 0, 0, 1, 0], { color: key === 'ΔK' ? M.yellow : (key === 'W_net' ? M.white : FORCE), width: 16 }));
      barNames.push(label(key.replace('_', '<sub>') + (key.includes('_') ? '</sub>' : ''), 0, 0, 0, 'graph-axis'));
      barValues.push(label('', 0, 0, 0, 'graph-tick x'));
    }
    const title = label('work over the trip (J)', 1.9, -0.1, 0, 'graph-title');
    group.add(ramp, block, motion, base, title, ...Object.values(arrows), ...Object.values(names), ...bars, ...barNames, ...barValues);
    group.visible = false;
    return { group, ramp, block, arrows, motion, names, bars, barNames, barValues };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    Object.assign(computed, trip(state));
    computed.dK = computed.Kf - computed.K0;
  },
  second(state) {
    // Newton's second law along the motion, then v² = v0² + 2ad.
    const th = state.theta * DEG;
    const push = state.mode === 'push' ? state.F : 0;
    const N = Math.max(0, state.m * G * Math.cos(th) - push * Math.sin(state.phi * DEG));
    const along = state.mode === 'slide' ? -1 : 1;
    const a = (push * Math.cos(state.phi * DEG) - along * state.m * G * Math.sin(th) - state.mu * N) / state.m;
    const D = state.mode === 'shove' ? (state.v0 * state.v0) / (-2 * a) : state.d;
    const v2 = state.v0 * state.v0 + 2 * a * D;
    return { D, vf: Math.sqrt(Math.max(0, v2)), N };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const th = state.theta * DEG;
    const L = 6.8;
    const x0 = -3.4;
    const y0 = 0.9;
    const top = { x: x0 + L * Math.cos(th), y: y0 + L * Math.sin(th) };
    updateFatLine(h.ramp, [x0, y0, 0, top.x, y0, 0, top.x, top.y, 0, x0, y0, 0]);
    const u = { x: Math.cos(th), y: Math.sin(th) };
    const n = { x: -Math.sin(th), y: Math.cos(th) };
    const base = { x: x0 + 0.5 * L * u.x, y: y0 + 0.5 * L * u.y };
    const s = 0.8;
    const c = { x: base.x + n.x * s * 0.5, y: base.y + n.y * s * 0.5 };
    const corner = (a, b) => [base.x + u.x * a * s + n.x * b * s, base.y + u.y * a * s + n.y * b * s, 0.02];
    updateFatLine(h.block, [...corner(-0.5, 0), ...corner(0.5, 0), ...corner(0.5, 1), ...corner(-0.5, 1), ...corner(-0.5, 0)]);
    const k = 1.8 / Math.max(state.m * G, state.mode === 'push' ? state.F : 0, 1e-9);
    const push = state.mode === 'push' ? state.F : 0;
    const pd = { x: Math.cos(th + state.phi * DEG), y: Math.sin(th + state.phi * DEG) };
    placeArrow(h.arrows.F, c.x - pd.x * push * k, c.y - pd.y * push * k, c.x, c.y, 0.05);
    placeArrow(h.arrows.w, c.x, c.y, c.x, c.y - state.m * G * k, 0.05);
    placeArrow(h.arrows.N, c.x, c.y, c.x + n.x * computed.N * k, c.y + n.y * computed.N * k, 0.05);
    const fdir = state.mode === 'slide' ? 1 : -1;
    placeArrow(h.arrows.f, base.x, base.y, base.x + u.x * fdir * state.mu * computed.N * k, base.y + u.y * fdir * state.mu * computed.N * k, 0.05);
    const mdir = state.mode === 'slide' ? -1 : 1;
    placeArrow(h.motion, c.x + n.x * 1.3, c.y + n.y * 1.3, c.x + n.x * 1.3 + u.x * mdir * 1.2, c.y + n.y * 1.3 + u.y * mdir * 1.2, 0.05);
    h.names.F.visible = h.arrows.F.visible;
    h.names.F.position.set(c.x - pd.x * push * k * 0.6 + n.x * 0.35, c.y - pd.y * push * k * 0.6 + n.y * 0.35, 0);
    h.names.w.position.set(c.x + 0.4, c.y - state.m * G * k * 0.8, 0);
    h.names.N.position.set(c.x + n.x * (computed.N * k + 0.3), c.y + n.y * (computed.N * k + 0.3), 0);
    h.names.f.visible = h.arrows.f.visible;
    h.names.f.position.set(base.x + u.x * fdir * (state.mu * computed.N * k + 0.3) - n.x * 0.3, base.y + u.y * fdir * (state.mu * computed.N * k + 0.3) - n.y * 0.3, 0);
    h.names.d.position.set(c.x + n.x * 1.7 + u.x * mdir * 0.6, c.y + n.y * 1.7 + u.y * mdir * 0.6, 0);
    // The bar chart: one bar per force's work, then their sum, then ΔK, which matches it.
    const vals = [computed.WF, computed.Wg, computed.WN, computed.Wf, computed.Wnet, computed.dK];
    const big = Math.max(...vals.map(Math.abs), 1e-9);
    const scale = 2.6 / big;
    vals.forEach((val, i) => {
      const x = -2.75 + i * 1.1;
      const y1 = BASE + val * scale;
      // A zero bar would draw as a blob; its value label says zero instead.
      h.bars[i].visible = Math.abs(val * scale) > 0.02;
      if (h.bars[i].visible) updateFatLine(h.bars[i], [x, BASE, 0.01, x, y1, 0.01]);
      h.barNames[i].position.set(x, val >= 0 ? BASE - 0.45 : BASE + 0.4, 0);
      h.barValues[i].element.textContent = String(fmt(val, 3)).replace('-', '−');
      h.barValues[i].position.set(x, y1 + (val >= 0 ? 0.3 : -0.3), 0);
    });
  },
  law: () => [
    String.raw`W = Fd\cos\phi`,
    String.raw`W_{\text{net}} = \Delta K = \tfrac12mv_f^2 - \tfrac12mv_0^2`,
  ],
  readoutCells(state, computed) {
    return [
      ['Net work', `${fmt(computed.Wnet)} J`],
      ['Final speed', computed.stalls ? 'it stops before the end' : `${fmt(computed.vf)} m/s`, computed.stalls ? 'warn' : ''],
      ['Work by the push', `${fmt(computed.WF)} J`],
      ['Work by gravity', `${fmt(computed.Wg)} J`],
      ['Work by the normal force', `${fmt(computed.WN)} J`],
      ['Work by friction', `${fmt(computed.Wf)} J`],
      ['Distance travelled', `${fmt(computed.D)} m`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'The works add up to ΔK',
      body: [
        String.raw`Each force does work $W = Fd\cos\phi$, where $\phi$ is the angle between the force and the motion. A force along the motion does positive work, one against it negative work, and one across it none. The normal force is always across the ramp, so its work is zero.`,
        String.raw`The work–energy theorem: the works add to the change in kinetic energy. Here $W_{\text{net}} = ${fmt(computed.Wnet, 4)}$ J, and $K$ goes from $${fmt(computed.K0, 4)}$ to $${fmt(computed.Kf, 4)}$ J.`,
        String.raw`<b>What the model leaves out.</b> The block is a point, so none of the work goes into turning it, and the friction coefficient is one fixed number. The heat friction makes is counted only as lost kinetic energy. Chapter 8 follows where it goes, as thermal energy.`,
      ],
    };
  },
});

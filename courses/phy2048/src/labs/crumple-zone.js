/**
 * Application lab: a driver stopped by a seatbelt, and the same driver stopped by the steering wheel.
 * Shows that the same change of momentum over a longer time cuts the average force.
 *
 * F = Δp/Δt for a stop from v to rest. The check is the work–energy view: the average force times
 * the stopping distance equals ½mv², with the distance read by stepping a constant acceleration.
 * Numbers from OpenStax University Physics Vol. 1 §9.2, "The Benefits of Impulse": 27 m/s, weight
 * 860 N, 2.5 s against 0.20 s. The book uses g = 9.80 and prints 948 N and 1.185 × 10⁴ N.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { Arrow, M, QUANTITY_COLORS, createGraph, fatLine, label, placeArrow } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const BOOK_M = 860 / G;

const SCENARIOS = [
  { id: 'belt', name: 'Seatbelt and airbag: stopped from 27 m/s in 2.5 s', m: BOOK_M, v: 27, T: 2.5 },
  { id: 'wheel', name: 'Steering wheel: the same stop in 0.20 s', m: BOOK_M, v: 27, T: 0.2 },
];

function closed(state) {
  const J = -state.m * state.v;
  const F = J / state.T;
  const K = 0.5 * state.m * state.v * state.v;
  return { J, F, d: (state.v * state.T) / 2, K, a: F / state.m, m: state.m };
}

/** Step a constant acceleration to a stop, and read the distance. The force is mΔv/Δt. */
function stepped(state) {
  const a = -state.v / state.T;
  const n = 4000;
  const dt = state.T / n;
  let x = 0;
  let vel = state.v;
  let J = 0;
  const F = state.m * a;
  for (let i = 0; i < n; i += 1) {
    const vm = vel + 0.5 * a * dt;
    x += vm * dt;
    vel += a * dt;
    J += F * dt;
  }
  const K = 0.5 * state.m * state.v * state.v;
  return { J, F, d: K / Math.abs(F), K, a, m: state.m, x };
}

export default defineLab({
  id: 'crumple-zone',
  exam: 'u5',
  title: 'Crumple zone',
  hint: 'The same change of momentum, spread over a longer time, means a smaller average force.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'crumple-time',
      scenario: 'belt',
      ask: 'Take twice as long to stop, from the same speed. What happens to the average force, and to the stopping distance?',
      apply(s) { s.T *= 2; },
      watch: [
        { id: 'F', label: 'the average force', get: (c) => Math.abs(c.F), mode: 'factor' },
        { id: 'd', label: 'the stopping distance', get: (c) => c.d, mode: 'factor' },
      ],
      expect: { F: 0.5, d: 2 },
      why: String.raw`Impulse is $F\Delta t = \Delta p$. The change of momentum is fixed, so twice the time halves the force. A steady stop covers $d = v\Delta t/2$, so the distance doubles.`,
    },
    {
      id: 'crumple-speed',
      scenario: 'belt',
      ask: 'Double the speed, and stop in the same time. What happens to the average force, and to the kinetic energy?',
      apply(s) { s.v *= 2; },
      watch: [
        { id: 'F', label: 'the average force', get: (c) => Math.abs(c.F), mode: 'factor' },
        { id: 'K', label: 'the kinetic energy', get: (c) => c.K, mode: 'factor' },
      ],
      expect: { F: 2, K: 4 },
      why: String.raw`$\Delta p = mv$, so the force doubles with the speed. Kinetic energy scales with the square of the speed, so it becomes four times as large.`,
    },
    {
      id: 'crumple-wheel',
      scenario: 'belt',
      ask: 'Stop in 0.20 s instead, against the wheel. Is the average force more than ten times the driver’s weight?',
      apply(s) { s.T = 0.2; },
      watch: [{ id: 'heavy', label: 'force above ten weights', get: (c, s) => Math.abs(c.F) > 10 * s.m * G, mode: 'bool' }],
      expect: { heavy: true },
      why: String.raw`The seatbelt stop is about one weight. The wheel stop is $2.5/0.20 = 12.5$ times shorter, so the force is 12.5 times larger: about 14 weights.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('belt', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('cz-m', 'Mass (kg)', BOOK_M, 40, 120, 0.1)}${sliderRow('cz-v', 'Speed (m/s)', 27, 5, 40, 0.1)}${sliderRow('cz-T', 'Stopping time (s)', 2.5, 0.05, 4, 0.05)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'cz-m', (s, v) => { s.m = v; });
    bindSlider(api, 'cz-v', (s, v) => { s.v = v; });
    bindSlider(api, 'cz-T', (s, v) => { s.T = v; });
  },
  syncControls(state) {
    putSlider('cz-m', state.m, 2);
    putSlider('cz-v', state.v, 1);
    putSlider('cz-T', state.T, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const graph = createGraph(group, { x: -5.5, y: -0.2, w: 7.4, h: 3.4, color: FORCE, name: 'force (N)', xName: 'time (s)', samples: 81 });
    const track = fatLine([-4.6, -2.7, 0, 4.6, -2.7, 0], { color: M.greyDark, width: 2 });
    const car = fatLine([-0.55, -2.7, 0, 0.55, -2.7, 0, 0.55, -2.05, 0, -0.55, -2.05, 0, -0.55, -2.7, 0], { color: M.blue, width: 2.5 });
    const v0 = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.016);
    const name = label('stop', 0, 0, 0, 'graph-axis');
    group.add(track, car, v0, name);
    group.visible = false;
    return { group, graph, v0, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    Object.assign(computed, closed(state));
  },
  second(state) {
    const r = stepped(state);
    delete r.x;
    return r;
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.graph) return;
    ctx.grid.visible = false;
    const lo = Math.min(0, computed.F);
    const hi = Math.max(0, computed.F);
    h.graph.set({
      t0: 0,
      t1: state.T,
      lo: lo - Math.abs(computed.F) * 0.15 - 1,
      hi: hi + Math.abs(computed.F) * 0.15 + 1,
      f: () => computed.F,
      name: 'force (N)',
    });
    const reach = Math.min(3.2, 0.15 * computed.d);
    placeArrow(h.v0, -1.2, -2.15, -1.2 + Math.min(2.4, state.v * 0.08), -2.15, 0.08);
    h.name.position.set(-1.2 + reach, -1.7, 0);
  },
  law: () => [String.raw`F_{\mathrm{avg}} = \dfrac{\Delta p}{\Delta t}`, String.raw`F_{\mathrm{avg}}\,d = \tfrac12 mv^2`],
  readoutCells(state, computed) {
    return [
      ['Average force', `${fmt(computed.F)} N`],
      ['Stopping distance', `${fmt(computed.d)} m`],
      ['Impulse', `${fmt(computed.J)} N·s`],
      ['Kinetic energy', `${fmt(computed.K)} J`],
      ['Mass', `${fmt(computed.m)} kg`],
      ['Acceleration', `${fmt(computed.a)} m/s²`],
      ['Force, in weights', fmt(Math.abs(computed.F) / (state.m * G), 3)],
    ];
  },
  coach(state, computed) {
    const weights = Math.abs(computed.F) / (state.m * G);
    return {
      title: 'Spread the same impulse',
      body: [
        String.raw`Stopping from $${fmt(state.v)}$ m/s changes the momentum by $${fmt(computed.J)}$ N·s. Over $${fmt(state.T)}$ s the average force is $${fmt(computed.F)}$ N, about $${fmt(weights, 3)}$ times the weight.`,
        String.raw`The car travels $${fmt(computed.d)}$ m while it stops. The force times that distance equals the kinetic energy, $${fmt(computed.K)}$ J.`,
        String.raw`<b>What the course model leaves out.</b> A real stop is not one constant force. The belt, the airbag and the crumple zone share it, and the body is not a single mass. The book divides the 860 N weight by $g = 9.80$ and prints 948 N and $1.185\times 10^{4}$ N. Here $g = 9.81$.`,
      ],
    };
  },
});

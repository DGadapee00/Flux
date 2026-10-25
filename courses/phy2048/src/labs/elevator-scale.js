/**
 * Application lab: a bathroom scale on the floor of an elevator.
 *
 * Shows that a scale reads the normal force it pushes with, m(g + a), and not the weight; that it
 * reads the weight at any steady speed, up or down; and that it reads more whenever the acceleration
 * points up, which includes an elevator slowing on its way down.
 *
 * Numbers: OpenStax University Physics Vol. 1 §6.1, "What Does the Bathroom Scale Read in an
 * Elevator?": a 75.0 kg man, an elevator accelerating up at 1.20 m/s². The book prints 825 N, and
 * 735 N at constant speed (g = 9.80). The closed form is `apparentWeight`, Newton's second law in the
 * ground's frame. The check works in the elevator's frame: there the man is at rest, so the scale's
 * push, his weight and a pseudo-force −ma add to zero.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { apparentWeight } from '@flux/subjects/mechanics/dynamics.js';
import { Arrow, M, createGraph, dot, fatLine, graphSegment, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
/** The trip: 1 s at rest, speed up for ta, cruise for tc, slow for ta, 1 s at rest. */
const REST = 1;

const SCENARIOS = [
  { id: 'start', name: 'Going up, speeding up at 1.20 m/s²', m: 75, A: 1.2, dir: 'up', ta: 2, tc: 4, t: 2 },
  { id: 'cruise', name: 'Going up at a steady speed', m: 75, A: 1.2, dir: 'up', ta: 2, tc: 4, t: 5 },
  { id: 'arrive', name: 'Going down, slowing to stop', m: 75, A: 1.2, dir: 'down', ta: 2, tc: 4, t: 8 },
];

/** The elevator's upward acceleration at time t of the trip. */
function accel(s, t) {
  const sign = s.dir === 'up' ? 1 : -1;
  const t1 = REST + s.ta;
  const t2 = t1 + s.tc;
  const t3 = t2 + s.ta;
  if (t < REST || t >= t3) return 0;
  if (t < t1) return sign * s.A;
  if (t < t2) return 0;
  return -sign * s.A;
}

/** Velocity and position at t, by the areas of the piecewise-constant a(t). */
function motion(s, t) {
  const edges = [0, REST, REST + s.ta, REST + s.ta + s.tc, REST + 2 * s.ta + s.tc, Infinity];
  let v = 0;
  let y = 0;
  for (let i = 0; i < edges.length - 1 && t > edges[i]; i += 1) {
    const dt = Math.min(t, edges[i + 1]) - edges[i];
    const a = accel(s, edges[i] + 1e-9);
    y += v * dt + 0.5 * a * dt * dt;
    v += a * dt;
  }
  return { v, y };
}

const span = (s) => 2 * REST + 2 * s.ta + s.tc;

export default defineLab({
  id: 'elevator-scale',
  exam: 'u3',
  title: 'Elevator scale',
  app: true,
  hint: 'Move through the trip. The scale reads the push it gives, not the weight.',
  orbit: false,
  fit: { w: 12.6, h: 9.6 },
  camera: { pos: new THREE.Vector3(0, 0, 24), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'scale-cruise',
      scenario: 'start',
      ask: String.raw`The elevator stops speeding up and climbs at a steady $2.4\ \mathrm{m/s}$. Does the scale now read the man's weight, $736\ \mathrm{N}$?`,
      apply(s) { s.t = 5; },
      watch: [{ id: 'weight', label: 'it reads his weight', get: (c) => Math.abs(c.N - c.W) < 1e-6, mode: 'bool' }],
      expect: { weight: true },
      why: String.raw`At a steady speed the acceleration is zero, so the scale's push must balance the weight exactly: $N = mg$. Moving up does not add anything. Only accelerating does.`,
    },
    {
      id: 'scale-arrive',
      scenario: 'arrive',
      ask: String.raw`The elevator is going down and slowing to a stop at the ground floor. Does the scale read more than the man's weight?`,
      apply() {},
      watch: [{ id: 'more', label: 'it reads more than his weight', get: (c) => c.N > c.W + 1e-6, mode: 'bool' }],
      expect: { more: true },
      why: String.raw`Slowing a downward motion takes an upward acceleration. The scale must push up with more than his weight to supply it: $N = m(g + 1.20) = 826\ \mathrm{N}$. The direction of motion does not matter; the direction of the acceleration does.`,
    },
    {
      id: 'scale-double',
      scenario: 'start',
      ask: String.raw`A faster elevator speeds up at $2.40\ \mathrm{m/s^2}$ instead of $1.20$. By what factor does the excess of the reading over his weight change?`,
      apply(s) { s.A *= 2; },
      watch: [{ id: 'extra', label: 'the reading minus the weight', get: (c) => c.N - c.W, mode: 'factor' }],
      expect: { extra: 2 },
      why: String.raw`$N - mg = ma$. The excess is the force that accelerates him, so it doubles with the acceleration: from $90$ to $180\ \mathrm{N}$. The reading itself does not double.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('start', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('el-m', 'Mass of the rider (kg)', 75, 10, 150, 0.5)}${sliderRow('el-A', 'Acceleration while starting and stopping (m/s²)', 1.2, 0, 9.81, 0.05)}${sliderRow('el-t', 'Moment in the trip (s)', 2, 0, 10, 0.05)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'el-m', (s, x) => { s.m = x; });
    bindSlider(api, 'el-A', (s, x) => { s.A = x; });
    bindSlider(api, 'el-t', (s, x) => { s.t = x; });
  },
  syncControls(state) {
    putSlider('el-m', state.m, 1);
    putSlider('el-A', state.A, 2);
    const t = document.getElementById('el-t');
    if (t) t.max = String(span(state));
    putSlider('el-t', state.t, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const shaft = fatLine([-5.6, -4, 0, -5.6, 4.2, 0, -3.4, 4.2, 0, -3.4, -4, 0], { color: M.greyDark, width: 1.5 });
    const car = fatLine(new Array(5 * 3).fill(0), { color: M.grey, width: 2.5 });
    const person = dot(M.blue, 0.22);
    const arrows = {
      N: new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, FORCE),
      W: new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, FORCE),
      a: new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, M.yellow, undefined, undefined, 0.02),
    };
    const names = {
      N: label('<i>N</i>', 0, 0, 0, 'graph-title'),
      W: label('<i>mg</i>', 0, 0, 0, 'graph-title'),
      a: label('<i>a</i>', 0, 0, 0, 'graph-title'),
    };
    const graph = createGraph(group, { x: -1.9, y: -3.2, w: 7.4, h: 6.6, color: FORCE, name: '', xName: 'time <i>t</i> (s)' });
    const title = label('scale reading (N)', 3.9, 3.75, 0, 'graph-title');
    const weight = fatLine([0, 0, 0, 1, 0, 0], { color: M.yellow, width: 2 });
    const weightName = label('weight', 5.0, 0, 0, 'graph-axis');
    group.add(shaft, car, person, title, weight, weightName, ...Object.values(arrows), ...Object.values(names));
    group.visible = false;
    return { group, car, person, arrows, names, graph, weight, weightName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const a = accel(state, state.t);
    const r = apparentWeight({ mass: state.m, a, g: G });
    const mo = motion(state, state.t);
    computed.a = a;
    computed.N = r.N;
    computed.kg = r.kg;
    computed.W = r.weight;
    computed.v = mo.v;
    computed.peak = motion(state, REST + state.ta).v;
    computed.phase = a === 0 ? (Math.abs(mo.v) < 1e-9 ? 'at rest' : 'steady speed') : (a * mo.v > 0 ? 'speeding up' : 'slowing down');
  },
  second(state) {
    // In the elevator's frame the rider is at rest: N + (−mg) + (−ma) = 0, with up positive.
    const a = accel(state, state.t);
    const pseudo = -state.m * a;
    const N = -(-state.m * G + pseudo);
    // The speed by stepping the acceleration in small time steps.
    const h = 1e-4;
    let v = 0;
    for (let t = 0; t < state.t - 1e-12; t += h) v += accel(state, Math.min(t + 0.5 * h, state.t)) * Math.min(h, state.t - t);
    return { N: Math.max(0, N), a, v };
  },
  syncViews(state, computed, ctx) {
    const hd = ctx.handle;
    if (!hd) return;
    ctx.grid.visible = false;
    const T = span(state);
    const top = Math.max(1e-9, Math.abs(motion(state, T).y));
    const y = motion(state, state.t).y;
    // The car moves up the shaft on an up trip, down on a down trip.
    const frac = state.dir === 'up' ? y / top : 1 + y / top;
    const cy = -3.2 + 6.2 * Math.min(1, Math.max(0, frac));
    updateFatLine(hd.car, [-5.4, cy - 0.7, 0, -3.6, cy - 0.7, 0, -3.6, cy + 0.9, 0, -5.4, cy + 0.9, 0, -5.4, cy - 0.7, 0]);
    hd.person.position.set(-4.5, cy - 0.2, 0.05);
    const k = 1.4 / Math.max(computed.W, 1e-9);
    placeArrow(hd.arrows.N, -4.5, cy - 0.2, -4.5, cy - 0.2 + computed.N * k, 0.06);
    placeArrow(hd.arrows.W, -4.2, cy - 0.2, -4.2, cy - 0.2 - computed.W * k, 0.06);
    placeArrow(hd.arrows.a, -3.9, cy, -3.9, cy + (computed.a / G) * 2, 0.06);
    hd.names.N.position.set(-4.85, cy - 0.2 + computed.N * k * 0.8, 0);
    hd.names.W.position.set(-3.75, cy - 0.2 - computed.W * k * 0.8, 0);
    hd.names.a.visible = hd.arrows.a.visible;
    hd.names.a.position.set(-3.65, cy + (computed.a / G) * 2 + (computed.a > 0 ? 0.2 : -0.2), 0);
    const reading = (t) => apparentWeight({ mass: state.m, a: accel(state, t), g: G }).N;
    const hi = state.m * (G + Math.max(state.A, 0.5)) * 1.15;
    hd.graph.set({ t0: 0, t1: T, lo: 0, hi, f: reading });
    hd.graph.mark(state.t, computed.N);
    graphSegment(hd.weight, hd.graph, { t0: 0, v0: computed.W, t1: T, v1: computed.W, lo: 0, hi });
    hd.weightName.position.set(hd.graph.sx(T) - 0.6, hd.graph.sy(computed.W) - 0.3, 0);
  },
  law: () => [
    String.raw`N - mg = ma \quad\Rightarrow\quad N = m(g + a)`,
    String.raw`\text{elevator frame: } N - mg - ma = 0`,
  ],
  readoutCells(state, computed) {
    return [
      ['Scale reads', `${fmt(computed.N)} N`],
      ['A scale marked in kg shows', `${fmt(computed.kg)} kg`],
      ['His weight, mg', `${fmt(computed.W)} N`],
      ['Elevator', `${computed.phase}, a = ${fmt(computed.a, 3)} m/s² (up +)`],
      ['Velocity', `${fmt(computed.v, 3)} m/s (up +)`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'A scale reads the push, not the weight',
      body: [
        String.raw`Two forces act on the rider: his weight $mg$ down and the scale's push $N$ up. The scale shows $N$. Newton's second law, with up positive, gives $N = m(g + a) = ${fmt(computed.N, 4)}$ N. That is more than the weight while $a$ points up and less while it points down.`,
        String.raw`The direction of travel does not enter. Speeding up on the way up and slowing on the way down both have $a$ up, and both read high. At a steady speed, in either direction, the scale reads ${fmt(computed.W, 4)} N, the weight. The yellow line on the graph is that weight.`,
        String.raw`<b>What the course model leaves out.</b> A real elevator does not switch its acceleration on and off. Its controller ramps it smoothly to keep the jerk, the rate of change of acceleration, comfortable, so the reading slides between values instead of jumping. A spring scale also bounces for a moment after each change. The 1.20 m/s² is the book's figure. The rider is a point who does not flex his knees.`,
      ],
    };
  },
});

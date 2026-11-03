/**
 * Application lab: one wheel from the Curiosity rover, rolling without slipping
 * down a basin.
 * Shows the speed at the bottom from energy, with the rotational share, and
 * how a slide with no friction is faster because nothing is stored in the spin.
 *
 * Numbers from OpenStax University Physics Vol. 1 §11.1, "Curiosity Rover":
 * radius 25 cm, mass 5 kg, a 25 m drop, Mars g = 3.71 m/s², modeled as a hoop.
 * The book prints 9.63 m/s.
 */
import * as THREE from 'three';
import { inertiaDisk, inertiaHoop, inertiaSphere, rollingSpeed } from '@flux/subjects/mechanics/rotation.js';
import { M, QUANTITY_COLORS, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const SHAPES = [['hoop', 'Thin hoop, the book model'], ['disk', 'Solid disk'], ['sphere', 'Solid sphere'], ['slide', 'Slides, no friction']];
const base = { shape: 'hoop', m: 5, R: 0.25, h: 25, g: 3.71, theta: 20 };
const SCENARIOS = [
  { ...base, id: 'mars', name: 'Curiosity’s wheel, a hoop, 25 m down on Mars' },
  { ...base, id: 'slide', name: 'The same drop with no friction, so it slides', shape: 'slide' },
  { ...base, id: 'earth', name: 'The same hoop dropped 25 m on Earth', g: 9.81 },
];

function moment(state) {
  if (state.shape === 'disk') return inertiaDisk(state.m, state.R);
  if (state.shape === 'sphere') return inertiaSphere(state.m, state.R);
  if (state.shape === 'slide') return 0;
  return inertiaHoop(state.m, state.R);
}

function closed(state) {
  const I = moment(state);
  const k = state.shape === 'slide' ? 0 : I / (state.m * state.R * state.R);
  const speed = state.shape === 'slide'
    ? { v: Math.sqrt(2 * state.g * state.h), omega: 0, k: 0 }
    : rollingSpeed({ mass: state.m, radius: state.R, I, height: state.h, g: state.g });
  const Ktrans = 0.5 * state.m * speed.v * speed.v;
  const Krot = 0.5 * (state.shape === 'slide' ? 0 : I) * (speed.omega ** 2);
  return { v: speed.v, omega: speed.omega, k, Ktrans, Krot, I };
}

function stepped(state) {
  const exact = closed(state);
  const th = state.theta * Math.PI / 180;
  const s = state.h / Math.sin(th);
  const a = state.g * Math.sin(th) / (1 + exact.k);
  if (!(a > 0)) return exact;
  const t = Math.sqrt((2 * s) / a);
  const n = 5000;
  const dt = t / n;
  let x = 0;
  let v = 0;
  for (let i = 0; i < n; i += 1) {
    x += v * dt + 0.5 * a * dt * dt;
    v += a * dt;
  }
  const omega = state.shape === 'slide' ? 0 : v / state.R;
  const I = state.shape === 'slide' ? 0 : exact.I;
  return { ...exact, v, omega, Ktrans: 0.5 * state.m * v * v, Krot: 0.5 * I * omega * omega };
}

function ring(x, y, r) {
  const pts = [];
  for (let i = 0; i <= 40; i += 1) {
    const a = (i / 40) * Math.PI * 2;
    pts.push(x + r * Math.cos(a), y + r * Math.sin(a), 0.03);
  }
  return pts;
}

export default defineLab({
  id: 'rover-wheel',
  exam: 'u7',
  title: 'Rover wheel',
  hint: 'A rolling wheel is slower than a slide down the same drop. Part of the energy is in the spin.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'rover-drop',
      scenario: 'mars',
      ask: 'Double the drop, and keep the wheel and the planet. What happens to the speed at the bottom?',
      apply(s) { s.h *= 2; },
      watch: [{ id: 'v', label: 'the speed', get: (c) => c.v, mode: 'factor' }],
      factors: [4, 2, 1.414, 1, 0.5],
      expect: { v: 1.414 },
      why: String.raw`$v = \sqrt{2gh/(1+k)}$. Twice the height brings a square root of two, about 1.414, not a factor of two.`,
    },
    {
      id: 'rover-radius',
      scenario: 'mars',
      ask: 'Double the wheel’s radius, at the same mass. What happens to the speed at the bottom?',
      apply(s) { s.R *= 2; },
      watch: [{ id: 'v', label: 'the speed', get: (c) => c.v, mode: 'factor' }],
      expect: { v: 1 },
      why: String.raw`For a hoop, $I = mR^2$, so $k = 1$ at any radius. The speed depends on the drop and on $k$, not on the radius.`,
    },
    {
      id: 'rover-slide',
      scenario: 'mars',
      ask: 'Let the wheel slide with no friction, instead of rolling. What happens to the speed at the bottom?',
      apply(s) { s.shape = 'slide'; },
      watch: [{ id: 'v', label: 'the speed', get: (c) => c.v }],
      mode: 'dir',
      expect: { v: 'bigger' },
      why: String.raw`A slide puts the whole drop into $\frac12 mv^2$. Rolling also fills $\frac12 I\omega^2$, so the center is slower.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('mars', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('rw-shape', 'Model', SHAPES, 'hoop')}${sliderRow('rw-m', 'Mass (kg)', 5, 1, 20, 0.1)}${sliderRow('rw-R', 'Radius (m)', 0.25, 0.05, 1, 0.01)}${sliderRow('rw-h', 'Drop (m)', 25, 1, 40, 0.5)}${sliderRow('rw-g', 'g (m/s²)', 3.71, 1, 12, 0.01)}${sliderRow('rw-th', 'Slope (°)', 20, 10, 45, 1)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'rw-shape', (s, v) => { s.shape = v; });
    bindSlider(api, 'rw-m', (s, v) => { s.m = v; });
    bindSlider(api, 'rw-R', (s, v) => { s.R = v; });
    bindSlider(api, 'rw-h', (s, v) => { s.h = v; });
    bindSlider(api, 'rw-g', (s, v) => { s.g = v; });
    bindSlider(api, 'rw-th', (s, v) => { s.theta = v; });
  },
  syncControls(state) {
    putSelect('rw-shape', state.shape);
    putSlider('rw-m', state.m, 1);
    putSlider('rw-R', state.R, 2);
    putSlider('rw-h', state.h, 1);
    putSlider('rw-g', state.g, 2);
    putSlider('rw-th', state.theta, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const basin = fatLine([-3.2, 1.4, 0, 0.4, -1.6, 0, 3.2, -1.6, 0], { color: M.grey, width: 2 });
    const wheel = fatLine(new Array(41 * 3).fill(0), { color: M.blue, width: 2.5 });
    const hub = fatLine(new Array(6).fill(0), { color: M.gold, width: 2 });
    const kTrans = fatLine(new Array(6).fill(0), { color: QUANTITY_COLORS.v, width: 8 });
    const kRot = fatLine(new Array(6).fill(0), { color: M.gold, width: 8 });
    const n1 = label('move', 0, 0, 0, 'graph-axis');
    const n2 = label('spin', 0, 0, 0, 'graph-axis');
    group.add(basin, wheel, hub, kTrans, kRot, n1, n2);
    group.visible = false;
    return { group, basin, wheel, hub, kTrans, kRot, n1, n2 };
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
    return stepped(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.wheel) return;
    ctx.grid.visible = false;
    updateFatLine(h.wheel, ring(-1.15, -0.15, 0.72));
    updateFatLine(h.hub, [-1.15 - 0.55, -0.15, 0.04, -1.15 + 0.55, -0.15, 0.04]);
    const scale = 1.6 / Math.max(computed.Ktrans, computed.Krot, 1);
    const y0 = -1.5;
    updateFatLine(h.kTrans, [0.8, y0, 0.02, 0.8, y0 + computed.Ktrans * scale, 0.02]);
    updateFatLine(h.kRot, [1.8, y0, 0.02, 1.8, y0 + Math.max(computed.Krot, 0) * scale, 0.02]);
    h.n1.position.set(0.8, y0 - 0.35, 0);
    h.n2.position.set(1.8, y0 - 0.35, 0);
    void state;
  },
  law: (state) => (state.shape === 'slide'
    ? [String.raw`v = \sqrt{2gh}`]
    : [String.raw`v = \sqrt{\dfrac{2gh}{1+k}}`, String.raw`k = I/(mR^2)`]),
  readoutCells(_state, computed) {
    return [
      ['Speed at the bottom', `${fmt(computed.v)} m/s`],
      ['Translational energy', `${fmt(computed.Ktrans)} J`],
      ['Rotational energy', `${fmt(computed.Krot)} J`],
      ['k = I/(mR²)', fmt(computed.k)],
    ];
  },
  coach(state, computed) {
    return {
      title: 'Some of the drop is in the spin',
      body: [
        String.raw`The wheel arrives at $${fmt(computed.v)}$ m/s. Translation holds $${fmt(computed.Ktrans)}$ J and rotation $${fmt(computed.Krot)}$ J.`,
        state.scenarioId === 'mars'
          ? 'The book prints 9.63 m/s. The wheel is a thin hoop, so k = 1 and v = √(gh) on Mars, where the book uses g = 3.71 m/s². The 5 kg cancels.'
          : 'A steeper slope changes the time, not this speed. Without slipping, the drop and the shape are the whole story.',
        String.raw`<b>What the course model leaves out.</b> A real rover wheel is not a thin hoop, and the basin is not a straight ramp. The tire sinks, and the sand drags. The book’s 25 cm, 5 kg, 25 m, and 3.71 m/s² are the figures for this example. The no-friction slide is a comparison, not a second reading of the book.`,
      ],
    };
  },
});

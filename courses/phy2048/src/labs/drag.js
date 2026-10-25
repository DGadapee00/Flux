/**
 * Shows that a falling body with drag settles at a terminal speed that does not depend on how fast it
 * started, that the linear case gets 63% of the way there in one time constant m/b, and that four
 * times the area halves a quadratic terminal speed.
 *
 * The closed forms are `linearFall` (an exponential) and `quadraticFall` (tanh below the terminal
 * speed, coth above it). The check integrates m dv/dt = mg − F(v) with RK4 over the same window.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { dragConstant, linearFall, quadraticFall, rk4Line, terminalSpeed } from '@flux/subjects/mechanics/drag.js';
import { M, createGraph, fatLine, graphSegment, label, niceRange, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const RHO = 1.21;

const SCENARIOS = [
  { id: 'oil', name: 'A bead sinking in thick oil: linear drag', model: 'linear', m: 0.05, b: 0.5, C: 1, A: 0.7, v0: 0, T: 0.6 },
  { id: 'skydiver', name: 'A skydiver, spread-eagle: quadratic drag', model: 'quadratic', m: 85, b: 0.5, C: 1, A: 0.7, v0: 0, T: 20 },
  { id: 'dive', name: 'The same skydiver, leaving a fast dive at 70 m/s', model: 'quadratic', m: 85, b: 0.5, C: 1, A: 0.7, v0: 70, T: 20 },
];

/** The drag force at speed v, and the closed-form fall over [0, t]. */
function model(s) {
  if (s.model === 'linear') {
    return {
      force: (v) => s.b * v,
      at: (t) => linearFall({ m: s.m, b: s.b, g: G, v0: s.v0, t }),
      vt: terminalSpeed({ m: s.m, g: G, b: s.b }),
    };
  }
  const k = dragConstant({ rho: RHO, C: s.C, A: s.A });
  return {
    force: (v) => k * v * Math.abs(v),
    at: (t) => quadraticFall({ m: s.m, k, g: G, v0: s.v0, t }),
    vt: terminalSpeed({ m: s.m, g: G, k }),
  };
}

export default defineLab({
  id: 'drag',
  exam: 'u3',
  title: 'Drag',
  hint: 'Change the mass, the drag and the starting speed. Every fall settles at one speed.',
  orbit: false,
  fit: { w: 12.4, h: 8.4 },
  camera: { pos: new THREE.Vector3(0, -0.2, 22), target: new THREE.Vector3(0, -0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'drag-area',
      scenario: 'skydiver',
      ask: String.raw`The skydiver opens a drogue that makes the area four times as big, $2.8\ \mathrm{m^2}$, with the same drag coefficient. What happens to the terminal speed?`,
      apply(s) { s.A *= 4; },
      watch: [{ id: 'vt', label: 'the terminal speed', get: (c) => c.vt, mode: 'factor' }],
      expect: { vt: 0.5 },
      why: String.raw`At terminal speed $\tfrac12\rho CAv_t^2 = mg$, so $v_t \propto 1/\sqrt{A}$. Four times the area halves it, from 44 to 22 m/s. Drag grows as the square of the speed, so a quarter of the speed is not needed.`,
    },
    {
      id: 'drag-mass',
      scenario: 'oil',
      ask: String.raw`Drop a bead twice as heavy, with the same size and shape, so the same $b$. What happens to its terminal speed in the oil?`,
      apply(s) { s.m *= 2; },
      watch: [{ id: 'vt', label: 'the terminal speed', get: (c) => c.vt, mode: 'factor' }],
      expect: { vt: 2 },
      why: String.raw`With linear drag $bv_t = mg$, so $v_t = mg/b$ grows in proportion to the mass. With quadratic drag it would grow only as $\sqrt m$, by 1.41.`,
    },
    {
      id: 'drag-start',
      scenario: 'skydiver',
      ask: String.raw`Instead of falling from rest, the skydiver comes out of a steep dive at $70\ \mathrm{m/s}$. After $20\ \mathrm{s}$, how does her speed compare with the speed she would have reached from rest?`,
      apply(s) { s.v0 = 70; },
      watch: [{ id: 'vEnd', label: 'the speed after 20 s', get: (c) => c.vEnd }],
      mode: 'dir',
      expect: { vEnd: 'same' },
      why: String.raw`Above $v_t$ drag beats the weight and slows her; below it the weight wins and speeds her up. Either way she ends at $v_t = 44$ m/s. The start fades out within a few multiples of $v_t/g = 4.5$ s.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('skydiver', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('dg-m', 'Mass (kg)', 85, 0.01, 200, 0.01)}${sliderRow('dg-b', 'Linear: drag constant b (kg/s)', 0.5, 0.01, 5, 0.01)}${sliderRow('dg-A', 'Quadratic: area facing the air, A (m²)', 0.7, 0.05, 30, 0.05)}${sliderRow('dg-C', 'Quadratic: drag coefficient, C', 1, 0.1, 1.5, 0.05)}${sliderRow('dg-v0', 'Starting speed, downward (m/s)', 0, 0, 120, 0.5)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'dg-m', (s, x) => { s.m = x; });
    bindSlider(api, 'dg-b', (s, x) => { s.b = x; });
    bindSlider(api, 'dg-A', (s, x) => { s.A = x; });
    bindSlider(api, 'dg-C', (s, x) => { s.C = x; });
    bindSlider(api, 'dg-v0', (s, x) => { s.v0 = x; });
  },
  syncControls(state) {
    putSlider('dg-m', state.m, 2);
    putSlider('dg-b', state.b, 2);
    putSlider('dg-A', state.A, 2);
    putSlider('dg-C', state.C, 2);
    putSlider('dg-v0', state.v0, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const graph = createGraph(group, { x: -5.6, y: -3.4, w: 11.2, h: 6.4, color: QUANTITY_COLORS.v, name: '', xName: 'time <i>t</i> (s)' });
    // The title sits at the right: the top-left corner is under the course panel on a laptop.
    const title = label(String.raw`<i>v</i> (m/s), downward`, 3.6, 3.35, 0, 'graph-title');
    const free = fatLine([0, 0, 0, 1, 0, 0], { color: M.yellow, width: 2 });
    const freeName = label('free fall', 0, 0, 0, 'graph-axis');
    group.add(title, free, freeName);
    group.visible = false;
    return { group, graph, free, freeName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const md = model(state);
    const end = md.at(state.T);
    computed.vt = md.vt;
    computed.vEnd = end.v;
    computed.yEnd = end.y;
    computed.a0 = G - md.force(state.v0) / state.m;
    // The time constant: m/b for linear drag; v_t/g, the time free fall would take to reach v_t, for quadratic.
    computed.tau = state.model === 'linear' ? state.m / state.b : md.vt / G;
    computed.vTau = md.at(computed.tau).v;
    computed.share = computed.vTau / md.vt;
  },
  second(state) {
    const md = model(state);
    const acc = (v) => G - md.force(v) / state.m;
    const end = rk4Line(acc, { v0: state.v0, t1: state.T, steps: 4000 });
    const tau = state.model === 'linear' ? state.m / state.b : md.vt / G;
    const mid = rk4Line(acc, { v0: state.v0, t1: tau, steps: 4000 });
    return { vEnd: end.v, yEnd: end.y, vTau: mid.v, a0: acc(state.v0) };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const md = model(state);
    const [lo, hi] = niceRange([0, computed.vt * 1.15, state.v0 * 1.05]);
    h.graph.set({ t0: 0, t1: state.T, lo, hi, f: (t) => md.at(t).v });
    // Free fall from the same start, for comparison: a straight line of slope g, cut at the frame.
    graphSegment(h.free, h.graph, { t0: 0, v0: state.v0, t1: state.T, v1: state.v0 + G * state.T, lo, hi });
    const tTop = Math.min(state.T, (hi - state.v0) / G);
    h.freeName.visible = h.free.visible;
    h.freeName.position.set(h.graph.sx(tTop) + 0.75, h.graph.sy(state.v0 + G * tTop) - 0.25, 0);
    h.graph.mark(computed.tau, computed.vTau);
  },
  law(state) {
    if (state && state.model === 'linear') return [String.raw`m\dfrac{dv}{dt} = mg - bv`, String.raw`v = v_t + (v_0 - v_t)e^{-t/\tau},\quad v_t = \dfrac{mg}{b},\quad \tau = \dfrac{m}{b}`];
    return [String.raw`m\dfrac{dv}{dt} = mg - \tfrac12\rho C A v^2`, String.raw`v_t = \sqrt{\dfrac{2mg}{\rho CA}}`];
  },
  readoutCells(state, computed) {
    return [
      ['Terminal speed', `${fmt(computed.vt)} m/s`],
      [`Speed after ${fmt(state.T, 3)} s`, `${fmt(computed.vEnd)} m/s`],
      [state.model === 'linear' ? 'One time constant, $m/b$' : '$v_t/g$', `${fmt(computed.tau, 3)} s`],
      ['Speed then (the yellow mark)', String.raw`${fmt(computed.vTau)} m/s, ${fmt(100 * computed.share, 3)}% of $v_t$`],
      ['Acceleration at the start', `${fmt(computed.a0)} m/s²`],
      [`Distance fallen in ${fmt(state.T, 3)} s`, `${fmt(computed.yEnd)} m`],
    ];
  },
  coach(state, computed) {
    const body = [
      String.raw`The weight is fixed and the drag grows with speed. While drag is less than $mg$ the body speeds up; while it is more, the body slows. At $v_t = ${fmt(computed.vt, 4)}$ m/s they balance, the net force is zero, and so is the acceleration. The yellow line is free fall, which never levels off.`,
      state.model === 'linear'
        ? String.raw`With $F = bv$ the gap to $v_t$ shrinks by the same fraction each second: $v = v_t(1 - e^{-t/\tau})$ from rest. After one time constant $\tau = m/b$ it is $1 - 1/e = 63\%$ of the way.`
        : String.raw`With $F = \tfrac12\rho CAv^2$, from rest $v = v_t\tanh(gt/v_t)$. After $v_t/g$ it is $\tanh 1 = 76\%$ of the way. A body that starts faster than $v_t$ slows down to it.`,
      String.raw`<b>What the model leaves out.</b> The drag coefficient is taken as a constant, and the air's density as the same at every height. Buoyancy is left out, which matters for a bead in oil. A real body may also tumble or turn, which changes its area.`,
    ];
    return { title: 'Drag grows until it matches the weight', body };
  },
});

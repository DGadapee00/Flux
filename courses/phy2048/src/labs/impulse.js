/**
 * Shows that a short large force and a long small one with the same area give the same change of
 * momentum, and that the shape of the pulse matters: the same peak and the same duration do not
 * mean the same impulse.
 *
 * The area is the closed form for a rectangle, a tent, or a half-sine. The check is a midpoint
 * sum of the same F(t). A scenario is the book's driver, stopped by a steady force (§9.2).
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { pulseForce, pulseImpulse } from '@flux/subjects/mechanics/momentum.js';
import { Arrow, M, QUANTITY_COLORS, createGraph, fatLine, label, placeArrow } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const SHAPES = [['rect', 'Rectangle'], ['tri', 'Triangle'], ['sine', 'Half-sine']];

const SCENARIOS = [
  { id: 'stop', name: 'A steady push that stops a 2 kg mass', m: 2, v0: 4, peak: -16, T: 0.5, shape: 'rect' },
  { id: 'tent', name: 'The same change of momentum, as a triangle', m: 2, v0: 4, peak: -32, T: 0.5, shape: 'tri' },
  { id: 'belt', name: 'The book’s driver: 860 N, 27 m/s, stopped in 2.5 s', m: 860 / G, v0: 27, peak: -(860 / G) * 27 / 2.5, T: 2.5, shape: 'rect' },
];

function areaOf(state) {
  const piece = (t0, t1) => {
    const n = 4000;
    const dt = (t1 - t0) / n;
    let sum = 0;
    for (let i = 0; i < n; i += 1) sum += pulseForce(state.shape, state.peak, state.T, t0 + (i + 0.5) * dt) * dt;
    return sum;
  };
  if (state.shape === 'tri') return piece(0, state.T / 2) + piece(state.T / 2, state.T);
  return piece(0, state.T);
}

function numbers(state) {
  const J = pulseImpulse(state.shape, state.peak, state.T);
  const dv = J / state.m;
  return { J, dv, vf: state.v0 + dv, Favg: J / state.T, peak: state.peak };
}

export default defineLab({
  id: 'impulse',
  exam: 'u5',
  title: 'Impulse',
  hint: 'Change the peak, the duration and the shape. The area under F(t) is the change of momentum.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'impulse-longer',
      scenario: 'stop',
      ask: String.raw`Keep the area the same and take twice as long. What happens to the peak force?`,
      apply(s) { s.T *= 2; s.peak *= 0.5; },
      watch: [
        { id: 'J', label: 'the impulse', get: (c) => c.J },
        { id: 'peak', label: 'the peak force', get: (c) => c.peak },
      ],
      mode: 'dir',
      expect: { J: 'same', peak: 'smaller' },
      why: String.raw`Impulse is the area under $F(t)$. Stretching the pulse and halving its height leaves the area, and so $\Delta p$, alone. The peak force is what gets smaller. That is the whole point of a long stop.`,
    },
    {
      id: 'impulse-shape',
      scenario: 'stop',
      ask: String.raw`Keep the same peak and the same duration, but make the pulse a triangle instead of a rectangle. What happens to the impulse?`,
      apply(s) { s.shape = 'tri'; },
      watch: [{ id: 'J', label: 'the impulse', get: (c) => Math.abs(c.J), mode: 'factor' }],
      expect: { J: 0.5 },
      why: String.raw`A triangle with the same base and the same height has half the area of the rectangle. The peak is not the impulse. The area is.`,
    },
    {
      id: 'impulse-mass',
      scenario: 'stop',
      ask: String.raw`The same push acts on a mass twice as large. What happens to the change of velocity?`,
      apply(s) { s.m *= 2; },
      watch: [{ id: 'dv', label: 'the change of velocity', get: (c) => Math.abs(c.dv), mode: 'factor' }],
      expect: { dv: 0.5 },
      why: String.raw`$J = \Delta p = m\,\Delta v$. The impulse did not change, so twice the mass means half the change of velocity.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('stop', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('im-shape', 'Shape of F(t)', SHAPES, 'rect')}${sliderRow('im-peak', 'Peak force (N)', -16, -2000, 2000, 1)}${sliderRow('im-T', 'Duration (s)', 0.5, 0.05, 4, 0.05)}${sliderRow('im-m', 'Mass (kg)', 2, 0.05, 120, 0.05)}${sliderRow('im-v0', 'Starting velocity (m/s)', 4, -40, 40, 0.1)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'im-shape', (s, v) => { s.shape = v; });
    bindSlider(api, 'im-peak', (s, v) => { s.peak = v; });
    bindSlider(api, 'im-T', (s, v) => { s.T = v; });
    bindSlider(api, 'im-m', (s, v) => { s.m = v; });
    bindSlider(api, 'im-v0', (s, v) => { s.v0 = v; });
  },
  syncControls(state) {
    putSelect('im-shape', state.shape);
    putSlider('im-peak', state.peak, 1);
    putSlider('im-T', state.T, 2);
    putSlider('im-m', state.m, 2);
    putSlider('im-v0', state.v0, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const graph = createGraph(group, { x: -5.4, y: -0.15, w: 10.4, h: 3.5, color: FORCE, name: 'force (N)', xName: 'time (s)', samples: 161 });
    const track = fatLine([-4.2, -2.7, 0, 4.2, -2.7, 0], { color: M.greyDark, width: 2 });
    const v0 = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.016);
    const vf = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.yellow, undefined, undefined, 0.02);
    const n0 = label('start', 0, 0, 0, 'graph-axis');
    const nf = label('after', 0, 0, 0, 'graph-axis');
    group.add(track, v0, vf, n0, nf);
    group.visible = false;
    return { group, graph, v0, vf, n0, nf };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    Object.assign(computed, numbers(state));
  },
  second(state) {
    const J = areaOf(state);
    const dv = J / state.m;
    return { J, dv, vf: state.v0 + dv, Favg: J / state.T, peak: state.peak };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.graph) return;
    ctx.grid.visible = false;
    const lo = Math.min(0, state.peak) - Math.abs(state.peak) * 0.15 - 1;
    const hi = Math.max(0, state.peak) + Math.abs(state.peak) * 0.15 + 1;
    h.graph.set({
      t0: 0,
      t1: state.T,
      lo,
      hi,
      f: (t) => pulseForce(state.shape, state.peak, state.T, t),
      name: 'force (N)',
    });
    const scale = 3.2 / Math.max(8, Math.abs(state.v0), Math.abs(computed.vf));
    const y = -2.7;
    const x0 = -1.2;
    placeArrow(h.v0, x0, y, x0 + state.v0 * scale, y, 0.04);
    placeArrow(h.vf, x0, y - 0.55, x0 + computed.vf * scale, y - 0.55, 0.05);
    h.n0.position.set(x0 + state.v0 * scale + Math.sign(state.v0 || 1) * 0.55, y + 0.28, 0);
    h.nf.position.set(x0 + computed.vf * scale + Math.sign(computed.vf || 1) * 0.55, y - 0.85, 0);
  },
  law: () => [
    String.raw`J = \int F\,dt = \Delta p = m\,\Delta v`,
    String.raw`\text{rectangle } FT,\quad \text{triangle }\tfrac12 FT,\quad \text{half-sine }\dfrac{2FT}{\pi}`,
  ],
  readoutCells(state, computed) {
    return [
      ['Impulse', `${fmt(computed.J)} N·s`],
      ['Velocity afterward', `${fmt(computed.vf)} m/s`],
      ['Average force', `${fmt(computed.Favg)} N`],
      ['Peak force', `${fmt(state.peak)} N`],
      ['Change of velocity', `${fmt(computed.dv)} m/s`],
    ];
  },
  coach(state, computed) {
    const same = Math.abs(computed.J - pulseImpulse('rect', state.peak, state.T)) < 1e-6;
    return {
      title: 'The area is the whole story',
      body: [
        String.raw`The impulse is the area under the curve, $${fmt(computed.J)}$ N·s. It equals $m\Delta v$, so the velocity goes from $${fmt(state.v0)}$ to $${fmt(computed.vf)}$ m/s.`,
        same
          ? 'This pulse is a rectangle, so the average force is the peak.'
          : String.raw`The peak is $${fmt(state.peak)}$ N, but the average over the duration is only $${fmt(computed.Favg)}$ N. A triangle or a half-sine spends time below its peak.`,
        state.scenarioId === 'belt'
          ? String.raw`These are the book’s numbers for a driver of weight 860 N stopped from 27 m/s in 2.5 s. The book divides by $g = 9.80$ and prints an average force of 948 N. Here $g = 9.81$.`
          : 'Stretch the pulse and the peak falls, if you keep the area fixed. Shorten it and the peak rises.',
      ],
    };
  },
});

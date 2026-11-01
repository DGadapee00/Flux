/**
 * Shows the pressure at a fire-hose nozzle from continuity, Bernoulli, and the rise.
 *
 * The closed form is Bernoulli between the hose and the nozzle. The check is the same
 * energy per unit volume written out as a difference that has to vanish.
 *
 * Numbers: OpenStax University Physics Vol. 1 §14.6, "Calculating Pressure: A Fire Hose
 * Nozzle" (6.40 cm hose, 40.0 L/s, 1.62×10⁶ N/m², a 10.0 m rise, a 3.00 cm nozzle).
 * The book rounds the speeds to 12.4 m/s and 56.6 m/s and prints −2.9 kPa. This lab
 * keeps full precision, and the coach says so.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { bernoulli, circleArea, flowSpeed, pressureDownstream } from '@flux/subjects/mechanics/fluids.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const base = { Q: 0.04, d1: 0.064, d2: 0.03, p1: 1.62e6, h: 10, rho: 1000 };
const SCENARIOS = [
  { ...base, id: 'book', name: 'The book’s hose, 10.0 m up' },
  { ...base, id: 'level', name: 'The same hose, no rise', h: 0 },
  { ...base, id: 'wider', name: 'A 4.00 cm nozzle', d2: 0.04 },
];

function closed(state) {
  const A1 = circleArea(state.d1);
  const A2 = circleArea(state.d2);
  const v1 = flowSpeed(state.Q, A1);
  const v2 = flowSpeed(state.Q, A2);
  const p2 = pressureDownstream({ p1: state.p1, v1, h1: 0, v2, h2: state.h, rho: state.rho, g: G });
  return { A1, A2, v1, v2, p2 };
}

function hosePts(rise) {
  const y = Math.min(rise, 2.4);
  return [-4.2, -1.2, 0, -0.2, -1.2, 0, 0.8, -1.2 + y, 0, 3.6, -1.2 + y, 0];
}

export default defineLab({
  id: 'fire-hose',
  exam: 'u10',
  title: 'Fire hose',
  app: true,
  hint: 'The nozzle is faster because it is narrower, and higher up the ladder. Both changes come out of the pressure.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'hose-area',
      scenario: 'book',
      ask: 'Halve the nozzle area and keep the flow and the rise. What happens to the nozzle speed, and to the pressure there?',
      apply(s) { s.d2 *= Math.SQRT1_2; },
      watch: [
        { id: 'v2', label: 'the nozzle speed', get: (c) => c.v2 },
        { id: 'p2', label: 'the nozzle pressure', get: (c) => c.p2, mode: 'dir', signed: true },
      ],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { v2: 2, p2: 'smaller' },
      why: 'The same volume has to pass a smaller opening, so the speed doubles. The extra kinetic energy, and the climb, are paid for by a lower pressure.',
    },
    {
      id: 'hose-rise',
      scenario: 'book',
      ask: 'Double the rise and leave the nozzle alone. What happens to the pressure at the nozzle?',
      apply(s) { s.h *= 2; },
      watch: [{ id: 'p2', label: 'the nozzle pressure', get: (c) => c.p2, signed: true }],
      mode: 'dir',
      expect: { p2: 'smaller' },
      why: 'Bernoulli charges ρgh for the climb. A higher nozzle, at the same speeds, has a lower pressure.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('book', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('fh-Q', 'Flow (L/s)', 40, 5, 80, 1)}${sliderRow('fh-d2', 'Nozzle diameter (cm)', 3, 1, 6, 0.1)}${sliderRow('fh-h', 'Rise (m)', 10, 0, 30, 0.5)}${sliderRow('fh-p', 'Hose gauge pressure (MPa)', 1.62, 0.2, 3, 0.01)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'fh-Q', (s, v) => { s.Q = v / 1000; });
    bindSlider(api, 'fh-d2', (s, v) => { s.d2 = v / 100; });
    bindSlider(api, 'fh-h', (s, v) => { s.h = v; });
    bindSlider(api, 'fh-p', (s, v) => { s.p1 = v * 1e6; });
  },
  syncControls(state) {
    putSlider('fh-Q', state.Q * 1000, 1);
    putSlider('fh-d2', state.d2 * 100, 2);
    putSlider('fh-h', state.h, 1);
    putSlider('fh-p', state.p1 / 1e6, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const hose = fatLine(hosePts(2), { color: M.blue, width: 6 });
    const nozzle = fatLine([3.2, 0.6, 0, 4.4, 0.6, 0], { color: M.gold, width: 3 });
    const speed = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.014);
    const name = label('nozzle', 0, -3.2, 0, 'graph-axis');
    group.add(hose, nozzle, speed, name);
    group.visible = false;
    return { group, hose, nozzle, speed, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.d1 = Math.max(state.d1, 1e-4);
    state.d2 = Math.min(Math.max(state.d2, 1e-4), state.d1);
    state.Q = Math.max(state.Q, 1e-6);
    state.h = Math.max(state.h, 0);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const v1 = state.Q / (Math.PI * (state.d1 / 2) ** 2);
    const v2 = state.Q / (Math.PI * (state.d2 / 2) ** 2);
    const up = bernoulli(state.p1, state.rho, v1, 0, G);
    const down = bernoulli(0, state.rho, v2, state.h, G);
    const p2 = up - down;
    if (Math.abs(bernoulli(p2, state.rho, v2, state.h, G) - up) > 1e-6 * Math.max(1, Math.abs(up))) return { p2: NaN };
    return { A1: circleArea(state.d1), A2: circleArea(state.d2), v1, v2, p2 };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.hose) return;
    ctx.grid.visible = false;
    const rise = 0.4 + 2.2 * Math.min(state.h, 30) / 30;
    updateFatLine(h.hose, hosePts(rise));
    const y = -1.2 + Math.min(rise, 2.4);
    updateFatLine(h.nozzle, [3.2, y, 0, 4.3, y, 0]);
    placeArrow(h.speed, 4.3, y, 4.3 + 0.9, y, 0.06);
    h.name.element.textContent = state.h > 0 ? 'up the ladder' : 'level';
  },
  law() {
    return [
      String.raw`A_1 v_1 = A_2 v_2`,
      String.raw`p_2 = p_1 + \tfrac12\rho(v_1^{2} - v_2^{2}) - \rho g h`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Hose speed', `${fmt(computed.v1)} m/s`],
      ['Nozzle speed', `${fmt(computed.v2)} m/s`],
      ['Nozzle gauge pressure', `${fmt(computed.p2)} Pa`],
      ['Flow', `${fmt(state.Q * 1000)} L/s`],
      ['Rise', `${fmt(state.h)} m`],
      ['Hose pressure', `${fmt(state.p1)} Pa`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'Speed, then the climb',
      body: [
        String.raw`The hose moves at $${fmt(computed.v1)}$ m/s and the nozzle at $${fmt(computed.v2)}$ m/s. After the rise of $${fmt(state.h)}$ m the gauge pressure is $${fmt(computed.p2)}$ Pa.`,
        '<b>What the course model leaves out.</b> The book rounds those speeds to 12.4 m/s and 56.6 m/s and prints −2.9 kPa, which is zero next to the air pressure outside the nozzle. This readout keeps the unrounded speeds, so the residual is a little different, and still nothing beside 1.62 MPa. A real nozzle also loses pressure to friction and to the bend, and the stream breaks up in the air. None of that is in Bernoulli’s sum.',
      ],
    };
  },
});

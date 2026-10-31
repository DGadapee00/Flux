/**
 * Shows that the speed rises and the pressure falls where a pipe narrows, and that a tank
 * drains at Torricelli’s √(2gh).
 *
 * The closed forms are continuity and Bernoulli. The check is the energy per unit volume,
 * and RK4 of the tank against the separated solution.
 *
 * Nozzle numbers: OpenStax University Physics Vol. 1 §14.5, "Calculating Fluid Speed through
 * a Nozzle" (0.500 L/s, radii 0.900 cm and 0.250 cm) and §14.6, "Calculating Pressure".
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  bernoulli, circleArea, flowSpeed, pressureDownstream, tankLevel, torricelli,
} from '@flux/subjects/mechanics/fluids.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const base = {
  d1: 0.018, d2: 0.005, Q: 5e-4, p1: 4.24e5, h1: 0, h2: 0, rho: 1000, hTank: 5, aHole: 0.001, aTank: 0.5,
};
const SCENARIOS = [
  { ...base, id: 'nozzle', name: 'The book’s hose and nozzle' },
  { ...base, id: 'raised', name: 'A nozzle 10 m up', h2: 10, p1: 1.62e6, d1: 0.064, d2: 0.03, Q: 0.04 },
  { ...base, id: 'tank', name: 'A tank with a hole, 5.00 m down' },
];

function closed(state) {
  const A1 = circleArea(state.d1);
  const A2 = circleArea(state.d2);
  const v1 = flowSpeed(state.Q, A1);
  const v2 = flowSpeed(state.Q, A2);
  const p2 = pressureDownstream({
    p1: state.p1, v1, h1: state.h1, v2, h2: state.h2, rho: state.rho, g: G,
  });
  const vExit = torricelli(state.hTank, G);
  return { A1, A2, v1, v2, p2, vExit, sum: bernoulli(state.p1, state.rho, v1, state.h1, G) };
}

function pipePts(wide, narrow) {
  return [
    -4.2, wide, 0, -0.4, wide, 0, 0.6, narrow, 0, 4.2, narrow, 0,
    4.2, -narrow, 0, 0.6, -narrow, 0, -0.4, -wide, 0, -4.2, -wide, 0, -4.2, wide, 0,
  ];
}

export default defineLab({
  id: 'bernoulli',
  exam: 'u10',
  title: 'Bernoulli',
  hint: 'Where the pipe narrows, the speed rises and the pressure falls. A hole low on a tank sends fluid out at √(2gh).',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'bern-area',
      scenario: 'nozzle',
      ask: 'Halve the nozzle’s area and keep the flow rate. What happens to the nozzle speed, and to the pressure there?',
      apply(s) { s.d2 *= Math.SQRT1_2; },
      watch: [
        { id: 'v2', label: 'the nozzle speed', get: (c) => c.v2 },
        { id: 'p2', label: 'the nozzle pressure', get: (c) => c.p2, mode: 'dir', signed: true },
      ],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { v2: 2, p2: 'smaller' },
      why: 'Continuity makes the speed double when the area is halved. Bernoulli then spends more of the energy budget on kinetic energy, so the pressure falls.',
    },
    {
      id: 'bern-tank',
      scenario: 'tank',
      ask: 'Double the depth of the hole below the surface. What happens to the exit speed?',
      apply(s) { s.hTank *= 2; },
      watch: [{ id: 'vExit', label: 'the exit speed', get: (c) => c.vExit }],
      mode: 'factor',
      factors: [2, 1.414, 1, 0.707, 0.5],
      expect: { vExit: 1.414 },
      why: 'The exit speed is √(2gh). Doubling the depth multiplies the speed by √2, which is 1.414.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('nozzle', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('bn-Q', 'Flow (L/s)', 0.5, 0.1, 50, 0.1)}${sliderRow('bn-d2', 'Nozzle diameter (cm)', 0.5, 0.2, 4, 0.05)}${sliderRow('bn-h', 'Rise of the nozzle (m)', 0, 0, 20, 0.5)}${sliderRow('bn-tank', 'Depth of the hole (m)', 5, 0.5, 20, 0.5)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'bn-Q', (s, v) => { s.Q = v / 1000; });
    bindSlider(api, 'bn-d2', (s, v) => { s.d2 = v / 100; });
    bindSlider(api, 'bn-h', (s, v) => { s.h2 = v; });
    bindSlider(api, 'bn-tank', (s, v) => { s.hTank = v; });
  },
  syncControls(state) {
    putSlider('bn-Q', state.Q * 1000, 2);
    putSlider('bn-d2', state.d2 * 100, 2);
    putSlider('bn-h', state.h2, 1);
    putSlider('bn-tank', state.hTank, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const pipe = fatLine(pipePts(1.1, 0.45), { color: M.blue, width: 3 });
    const vWide = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.014);
    const vNarrow = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.014);
    const name = label('pipe', 0, -3.2, 0, 'graph-axis');
    group.add(pipe, vWide, vNarrow, name);
    group.visible = false;
    return { group, pipe, vWide, vNarrow, name };
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
    state.hTank = Math.max(state.hTank, 0);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const A1 = Math.PI * (state.d1 / 2) ** 2;
    const A2 = Math.PI * (state.d2 / 2) ** 2;
    const v1 = state.Q / A1;
    const v2 = state.Q / A2;
    const sum1 = state.p1 + 0.5 * state.rho * v1 * v1 + state.rho * G * state.h1;
    const p2 = sum1 - 0.5 * state.rho * v2 * v2 - state.rho * G * state.h2;
    const drained = tankLevel({
      h0: state.hTank, aHole: state.aHole, aTank: state.aTank, g: G, t: 2,
    });
    const vExit = Math.sqrt(Math.max(0, 2 * (bernoulli(state.p1, state.rho, 0, state.hTank, G) - bernoulli(state.p1, state.rho, 0, 0, G)) / state.rho));
    if (Math.abs(drained.hNum - drained.h) > 1e-6 * Math.max(1, state.hTank)) return { v1: NaN };
    return { A1, A2, v1, v2, p2, vExit, sum: sum1 };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.pipe) return;
    ctx.grid.visible = false;
    const narrow = 0.25 + 1.3 * Math.min(state.d2 / state.d1, 1);
    updateFatLine(h.pipe, pipePts(1.15, narrow));
    placeArrow(h.vWide, -3.2, 1.35, -2.2, 1.35, 0.05);
    const reach = 0.6 + 1.6 * Math.min(computed.v2 / Math.max(computed.v1, 1e-6), 6) / 6;
    placeArrow(h.vNarrow, 2.2, narrow + 0.25, 2.2 + reach, narrow + 0.25, 0.05);
    h.name.element.textContent = state.scenarioId === 'tank' ? 'tank' : 'pipe';
  },
  law() {
    return [
      String.raw`A_1 v_1 = A_2 v_2`,
      String.raw`p + \tfrac12\rho v^{2} + \rho g h = \mathrm{constant}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Wide speed', `${fmt(computed.v1)} m/s`],
      ['Narrow speed', `${fmt(computed.v2)} m/s`],
      ['Pressure downstream', `${fmt(computed.p2)} Pa`],
      ['Exit speed from the tank', `${fmt(computed.vExit)} m/s`],
      ['Wide area', `${fmt(computed.A1)} m²`],
      ['Narrow area', `${fmt(computed.A2)} m²`],
    ];
  },
  coach(state, computed) {
    if (state.scenarioId === 'tank') {
      return {
        title: 'The hole is a free fall',
        body: [
          String.raw`The surface is nearly still and both ends are open to the air. Bernoulli then leaves $${fmt(computed.vExit)}$ m/s, which is the speed of a drop that has fallen $${fmt(state.hTank)}$ m.`,
        ],
      };
    }
    return {
      title: 'The narrow part is faster and cheaper in pressure',
      body: [
        String.raw`The wide speed is $${fmt(computed.v1)}$ m/s and the narrow speed is $${fmt(computed.v2)}$ m/s. The pressure downstream is $${fmt(computed.p2)}$ Pa. The Bernoulli sum is the same at both stations.`,
      ],
    };
  },
});

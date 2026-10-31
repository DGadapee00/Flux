/**
 * Shows that a simple pendulum’s period is independent of amplitude only at small angles,
 * and that a rod about one end is a physical pendulum.
 *
 * The closed form at small angle is T₀ = 2π√(L/g). The check is the exact period from the
 * arithmetic–geometric mean, against an RK4 of θ̈ = −(g/L) sin θ.
 *
 * Numbers: OpenStax University Physics Vol. 1 §15.4, "Measuring Acceleration due to Gravity
 * by the Period of a Pendulum" (75.000 cm, T = 1.7357 s, g = 9.8281 m/s²).
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  angularPeriodFromCrossings, gravityFromPendulum, pendulumPeriod, pendulumPeriodExact,
  physicalPendulumPeriod,
} from '@flux/subjects/mechanics/oscillation.js';
import { inertiaRodEnd } from '@flux/subjects/mechanics/rotation.js';
import { M, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const base = { L: 0.75, theta: 5 * DEG, Tmeas: 1.7357, kind: 'simple' };
const SCENARIOS = [
  { ...base, id: 'gravity', name: '75.000 cm, a small angle' },
  { ...base, id: 'large', name: 'The same length, 60°', theta: 60 * DEG },
  { ...base, id: 'rod', name: 'A rod about one end', L: 1.49, theta: 8 * DEG, Tmeas: 2, kind: 'rod' },
];

function closed(state) {
  const T0 = pendulumPeriod(state.L, G);
  const rod = state.kind === 'rod';
  const I = inertiaRodEnd(1, state.L);
  const Trod = physicalPendulumPeriod(I, 1, state.L / 2, G);
  const Texact = rod ? Trod : pendulumPeriodExact(state.L, state.theta, G);
  return {
    T0,
    Texact,
    Trod,
    gMeas: gravityFromPendulum(state.L, state.Tmeas),
    omega: (2 * Math.PI) / (rod ? Trod : T0),
  };
}

function bob(cx, cy) {
  const r = 0.16;
  return [cx - r, cy, 0, cx, cy + r, 0, cx + r, cy, 0, cx, cy - r, 0, cx - r, cy, 0];
}

export default defineLab({
  id: 'pendulum',
  exam: 'u11',
  title: 'Pendulum',
  hint: 'At a small angle the period depends on the length. A large angle makes the period longer. The mass does not enter.',
  orbit: false,
  fit: { w: 10, h: 9 },
  camera: { pos: new THREE.Vector3(0, 0.2, 16), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'pend-length',
      scenario: 'gravity',
      ask: 'Double the length and keep the angle small. What happens to the small-angle period?',
      apply(s) { s.L *= 2; },
      watch: [{ id: 'T0', label: 'the small-angle period', get: (c) => c.T0 }],
      mode: 'factor',
      factors: [2, 1.414, 1, 0.5],
      expect: { T0: 1.414 },
      why: 'T₀ = 2π√(L/g). Twice the length multiplies the period by √2.',
    },
    {
      id: 'pend-angle',
      scenario: 'gravity',
      ask: 'Open the same pendulum to 60° from 5°. What happens to the exact period?',
      apply(s) { s.theta = 60 * DEG; },
      watch: [{ id: 'Texact', label: 'the exact period', get: (c) => c.Texact }],
      mode: 'dir',
      expect: { Texact: 'bigger' },
      why: 'The small-angle period has no amplitude in it. Past a few degrees the exact period grows. At 60° it is several percent longer.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('gravity', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('pd-kind', 'Pendulum', [['simple', 'Simple'], ['rod', 'Rod about one end']], 'simple')}${sliderRow('pd-L', 'Length (m)', 0.75, 0.3, 2, 0.01)}${sliderRow('pd-th', 'Release angle (°)', 5, 2, 70, 1)}${sliderRow('pd-T', 'Measured period (s)', 1.7357, 0.8, 3, 0.0001)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'pd-kind', (s, v) => { s.kind = v; });
    bindSlider(api, 'pd-L', (s, v) => { s.L = v; });
    bindSlider(api, 'pd-th', (s, v) => { s.theta = v * DEG; });
    bindSlider(api, 'pd-T', (s, v) => { s.Tmeas = v; });
  },
  syncControls(state) {
    putSelect('pd-kind', state.kind);
    putSlider('pd-L', state.L, 2);
    putSlider('pd-th', state.theta / DEG, 1);
    putSlider('pd-T', state.Tmeas, 4);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const arm = fatLine([0, 2, 0, 0, -0.4, 0], { color: M.gold, width: 3 });
    const mass = fatLine(bob(0, -0.4), { color: M.blue, width: 4 });
    const name = label('pendulum', 0, -2.8, 0, 'graph-axis');
    group.add(arm, mass, name);
    group.visible = false;
    return { group, arm, mass, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.L = Math.max(state.L, 0.05);
    state.theta = Math.min(Math.max(state.theta, 0.01), 1.4);
    state.Tmeas = Math.max(state.Tmeas, 0.05);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const rod = state.kind === 'rod';
    const alpha = rod ? (3 * G) / (2 * state.L) : G / state.L;
    const release = rod ? 0.005 : state.theta;
    const measured = angularPeriodFromCrossings(alpha, release);
    const T0 = 2 * Math.PI * Math.sqrt(state.L / G);
    const Trod = 2 * Math.PI * Math.sqrt((2 * state.L) / (3 * G));
    const Texact = rod ? Trod : pendulumPeriodExact(state.L, state.theta, G);
    const want = rod ? Trod : pendulumPeriodExact(state.L, release, G);
    if (!(Math.abs(measured - want) <= 1e-4 * Math.max(1, Math.abs(want)))) return { T0: NaN };
    return {
      T0,
      Texact,
      Trod,
      gMeas: (4 * Math.PI * Math.PI * state.L) / (state.Tmeas * state.Tmeas),
      omega: (2 * Math.PI) / (rod ? Trod : T0),
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.arm) return;
    ctx.grid.visible = false;
    const reach = 2.3;
    const th = state.theta;
    const x = reach * Math.sin(th);
    const y = 1.9 - reach * Math.cos(th);
    updateFatLine(h.arm, [0, 1.9, 0, x, y, 0]);
    updateFatLine(h.mass, state.kind === 'rod' ? bob(x * 0.5, 1.9 + (y - 1.9) * 0.5) : bob(x, y));
    h.name.element.textContent = state.kind === 'rod' ? 'rod' : 'simple';
    h.arm.material.color.set(state.kind === 'rod' ? M.gold : M.grey);
  },
  law() {
    return [
      String.raw`T_0 = 2\pi\sqrt{L/g}`,
      String.raw`g = 4\pi^{2} L / T^{2}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Small-angle period', `${fmt(computed.T0)} s`],
      ['Exact period', `${fmt(computed.Texact)} s`],
      ['g from the measured period', `${fmt(computed.gMeas)} m/s²`],
      ['Rod period, small angle', `${fmt(computed.Trod)} s`],
      ['Release', `${fmt(state.theta / DEG)}°`],
      ['Length', `${fmt(state.L)} m`],
    ];
  },
  coach(state, computed) {
    const rod = state.kind === 'rod';
    return {
      title: rod ? 'A rod is not a simple pendulum' : 'Small angles hide the amplitude',
      body: [
        rod
          ? String.raw`About one end, a uniform rod has $T = 2\pi\sqrt{2L/3g} = ${fmt(computed.Trod)}$ s. That is longer than a simple pendulum of the same length, $${fmt(computed.T0)}$ s, because the mass is spread out.`
          : String.raw`The small-angle period is $${fmt(computed.T0)}$ s. At this release the exact period is $${fmt(computed.Texact)}$ s. A measured period of $${fmt(state.Tmeas)}$ s would mean $g = ${fmt(computed.gMeas)}$ m/s².`,
      ],
    };
  },
});

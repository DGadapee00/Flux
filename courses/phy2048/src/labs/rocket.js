/**
 * Shows that a rocket’s change of velocity grows with the logarithm of the mass ratio, not with the
 * mass burned, and that gravity subtracts g times the burn time.
 *
 * Δv = ve ln(m0/mf) − g tb, with tb = (m0 − mf)/ṁ. The check integrates m dv/dt = ṁ ve − mg
 * with the midpoint rule. One scenario is the book’s spacecraft thruster (§9.7). It cannot lift
 * its own weight. A second scenario is an illustrative lifter, not a book number.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { rocketDeltaV } from '@flux/subjects/mechanics/momentum.js';
import { Arrow, M, QUANTITY_COLORS, createGraph, fatLine, label, placeArrow } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;

const GRAV = [['0', 'Coast, no gravity'], ['1', 'Gravity on']];

const SCENARIOS = [
  { id: 'coast', name: 'The book’s thruster, coasting: ve 250 m/s, 200 kg/s, 20 000 kg down to 14 000 kg', m0: 20000, mf: 14000, ve: 250, mdot: 200, gOn: 0, v0: 0 },
  { id: 'gravity', name: 'The same thruster, fired upward against gravity', m0: 20000, mf: 14000, ve: 250, mdot: 200, gOn: 1, v0: 0 },
  { id: 'lifter', name: 'An illustrative lifter: ve 2800 m/s, not a book number', m0: 20000, mf: 8000, ve: 2800, mdot: 200, gOn: 1, v0: 0 },
];

function ready(state) {
  const m0 = Math.max(state.m0, 1);
  const mf = Math.min(Math.max(state.mf, 1), m0 * 0.98);
  const mdot = Math.max(state.mdot, 0.1);
  const g = state.gOn ? G : 0;
  return { m0, mf, ve: state.ve, mdot, g, v0: state.v0 || 0 };
}

function closed(state) {
  const s = ready(state);
  const r = rocketDeltaV(s);
  const thrust = s.mdot * s.ve;
  return {
    dv: r.dv,
    tb: r.tb,
    speed: r.speed,
    burned: r.burned,
    ratio: r.ratio,
    thrust,
    a0: thrust / s.m0 - s.g,
    weight: s.m0 * G,
    per: r.dv / r.burned,
  };
}

/** Midpoint steps of dv/dt = ve ṁ / m − g, with m falling at a steady rate. */
function stepped(state) {
  const s = ready(state);
  const burned = s.m0 - s.mf;
  const tb = burned / s.mdot;
  const n = 8000;
  const dt = tb / n;
  let m = s.m0;
  let speed = s.v0;
  for (let i = 0; i < n; i += 1) {
    const mid = m - 0.5 * s.mdot * dt;
    speed += (s.mdot * s.ve / mid - s.g) * dt;
    m -= s.mdot * dt;
  }
  const thrust = s.mdot * s.ve;
  return {
    dv: speed - s.v0,
    tb,
    speed,
    burned,
    ratio: s.m0 / s.mf,
    thrust,
    a0: thrust / s.m0 - s.g,
    weight: s.m0 * G,
    per: (speed - s.v0) / burned,
  };
}

export default defineLab({
  id: 'rocket',
  exam: 'u5',
  title: 'Rocket',
  hint: 'Δv follows the mass ratio, through a logarithm. Gravity costs g times the burn time.',
  orbit: false,
  fit: { w: 12.4, h: 8.4 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'rocket-ve',
      scenario: 'coast',
      ask: 'Double the exhaust speed, still coasting. What happens to the change of velocity?',
      apply(s) { s.ve *= 2; },
      watch: [{ id: 'dv', label: 'the change of velocity', get: (c) => c.dv, mode: 'factor' }],
      expect: { dv: 2 },
      why: String.raw`With no gravity, $\Delta v = v_e \ln(m_0/m_f)$. The mass ratio did not change, so twice the exhaust speed means twice $\Delta v$.`,
    },
    {
      id: 'rocket-fuel',
      scenario: 'coast',
      ask: 'Double the propellant and keep the payload. What happens to Δv, and to Δv per kilogram burned?',
      apply(s) { s.m0 = s.mf + 2 * (s.m0 - s.mf); },
      watch: [
        { id: 'dv', label: 'the change of velocity', get: (c) => c.dv },
        { id: 'per', label: 'Δv per kilogram burned', get: (c) => c.per },
      ],
      mode: 'dir',
      expect: { dv: 'bigger', per: 'smaller' },
      why: String.raw`$\Delta v$ grows as $\ln(m_0/m_f)$, so more propellant does add speed, but less than in proportion. Each extra kilogram is thrown from a rocket that is already heavier, and it buys less $\Delta v$ than the kilogram before it.`,
    },
    {
      id: 'rocket-gravity',
      scenario: 'coast',
      ask: 'Fire the same thruster straight up, with gravity on. What happens to the change of velocity?',
      apply(s) { s.gOn = 1; },
      watch: [{ id: 'dv', label: 'the change of velocity', get: (c) => c.dv, mode: 'dir', signed: true }],
      expect: { dv: 'smaller' },
      why: String.raw`Gravity subtracts $g t_b$ from the coasting result. This thruster’s thrust is less than the rocket’s weight, so the velocity change points downward.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('coast', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('rk-g', 'Gravity', GRAV, '0')}${sliderRow('rk-ve', 'Exhaust speed (m/s)', 250, 50, 4000, 10)}${sliderRow('rk-mdot', 'Burn rate (kg/s)', 200, 1, 400, 1)}${sliderRow('rk-m0', 'Starting mass (kg)', 20000, 500, 30000, 100)}${sliderRow('rk-mf', 'Mass at burnout (kg)', 14000, 200, 29000, 100)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'rk-g', (s, v) => { s.gOn = Number(v); });
    bindSlider(api, 'rk-ve', (s, v) => { s.ve = v; });
    bindSlider(api, 'rk-mdot', (s, v) => { s.mdot = v; });
    bindSlider(api, 'rk-m0', (s, v) => { s.m0 = v; });
    bindSlider(api, 'rk-mf', (s, v) => { s.mf = v; });
  },
  syncControls(state) {
    putSelect('rk-g', String(state.gOn));
    putSlider('rk-ve', state.ve, 0);
    putSlider('rk-mdot', state.mdot, 0);
    putSlider('rk-m0', state.m0, 0);
    putSlider('rk-mf', state.mf, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const graph = createGraph(group, { x: -5.6, y: 0.35, w: 7.2, h: 3.2, color: M.white, name: 'speed (m/s)', xName: 'time (s)', samples: 161 });
    const ground = fatLine([-5.4, -2.6, 0, 5.4, -2.6, 0], { color: M.greyDark, width: 2 });
    const thrust = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.02);
    const weight = new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, M.gold, undefined, undefined, 0.016);
    const tagT = label('thrust', 0, 0, 0, 'graph-axis');
    const tagW = label('weight', 0, 0, 0, 'graph-axis');
    group.add(ground, thrust, weight, tagT, tagW);
    group.visible = false;
    return { group, graph, thrust, weight, tagT, tagW };
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
    if (!h?.graph) return;
    ctx.grid.visible = false;
    const s = ready(state);
    const samples = [];
    const n = 80;
    for (let i = 0; i <= n; i += 1) {
      const t = (computed.tb * i) / n;
      const m = s.m0 - s.mdot * t;
      samples.push(s.v0 + s.ve * Math.log(s.m0 / m) - s.g * t);
    }
    const lo = Math.min(0, ...samples);
    const hi = Math.max(0, ...samples);
    h.graph.set({
      t0: 0,
      t1: Math.max(computed.tb, 0.1),
      lo: lo - Math.abs(hi - lo) * 0.1 - 1,
      hi: hi + Math.abs(hi - lo) * 0.15 + 1,
      f: (t) => {
        const m = Math.max(s.mf, s.m0 - s.mdot * t);
        return s.v0 + s.ve * Math.log(s.m0 / m) - s.g * t;
      },
      name: 'speed (m/s)',
    });
    const scale = 2.2 / Math.max(computed.thrust, computed.weight);
    placeArrow(h.thrust, 3.4, -2.6, 3.4, -2.6 + computed.thrust * scale, 0.06);
    placeArrow(h.weight, 4.5, -2.6, 4.5, -2.6 - Math.min(2.2, computed.weight * scale), 0.06);
    h.tagT.position.set(3.4, -2.6 + computed.thrust * scale + 0.35, 0);
    h.tagW.position.set(4.5, -3.15, 0);
  },
  law: () => [
    String.raw`\Delta v = v_e \ln\dfrac{m_0}{m_f} - g\,t_b`,
    String.raw`t_b = (m_0 - m_f)/\dot m`,
  ],
  readoutCells(_state, computed) {
    return [
      ['Change of velocity', `${fmt(computed.dv)} m/s`],
      ['Speed at burnout', `${fmt(computed.speed)} m/s`],
      ['Burn time', `${fmt(computed.tb)} s`],
      ['Thrust', `${fmt(computed.thrust)} N`],
      ['Weight at the start', `${fmt(computed.weight)} N`],
      ['Acceleration at ignition', `${fmt(computed.a0)} m/s²`],
      ['Mass ratio', fmt(computed.ratio, 3)],
      ['Propellant burned', `${fmt(computed.burned)} kg`],
    ];
  },
  coach(state, computed) {
    const lifts = computed.thrust > computed.weight;
    return {
      title: lifts ? 'Thrust beats the weight' : 'Thrust loses to the weight',
      body: [
        String.raw`The mass ratio is $${fmt(computed.ratio, 3)}$, so a coast would gain $${fmt(state.ve * Math.log(computed.ratio))}$ m/s. Gravity over the burn subtracts $${fmt((state.gOn ? G : 0) * computed.tb)}$ m/s.`,
        lifts
          ? 'The thrust arrow is longer than the weight. This lifter’s exhaust speed is an illustrative 2800 m/s, not the book’s thruster. Drag and a nozzle that spreads the exhaust speed are left out.'
          : 'The book’s thruster pushes with 5.00 × 10⁴ N. The rocket weighs about 1.96 × 10⁵ N, so a vertical burn loses speed. The book’s acceleration is the thrust divided by the mass, with gravity left out of that figure.',
        'Doubling the propellant does not double Δv. The gain is a logarithm of the mass ratio.',
      ],
    };
  },
});

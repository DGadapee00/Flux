/**
 * Shows that momentum is conserved for every one-dimensional collision, that the kinetic energy
 * lost grows as the bodies stick more, and that equal masses with one at rest exchange velocities
 * when the collision is elastic.
 *
 * Closed form from momentum and the restitution. The check solves the same two equations by
 * eliminating one unknown, and checks the lost energy against ½μ(1−e²)v_rel².
 */
import * as THREE from 'three';
import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import { collide1D, impactLoss } from '@flux/subjects/mechanics/momentum.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const VEL = QUANTITY_COLORS.v;

const SCENARIOS = [
  { id: 'exchange', name: 'Equal masses, elastic', m1: 2, m2: 2, u1: 4, u2: 0, e: 1 },
  { id: 'stick', name: 'Equal masses, they stick', m1: 2, m2: 2, u1: 4, u2: 0, e: 0 },
  { id: 'heavy', name: 'Heavy target, elastic', m1: 2, m2: 6, u1: 4, u2: 0, e: 1 },
];

function block(w, h) {
  return fatLine(new Array(5 * 3).fill(0), { color: M.blue, width: 3 });
}

function setBlock(line, x, y, w, h, color) {
  line.material.color.set(color);
  updateFatLine(line, [
    x - w, y, 0.02, x + w, y, 0.02, x + w, y + h, 0.02, x - w, y + h, 0.02, x - w, y, 0.02,
  ]);
}

export default defineLab({
  id: 'collide',
  exam: 'u5',
  title: 'Collisions',
  hint: 'Slide the restitution from 1 (elastic) to 0 (they stick). Momentum is kept either way.',
  orbit: false,
  fit: { w: 12.2, h: 8.4 },
  camera: { pos: new THREE.Vector3(0, -0.2, 24), target: new THREE.Vector3(0, -0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'collide-stick',
      scenario: 'exchange',
      ask: 'Drop the restitution from 1 to 0, so the masses stick. What happens to the kinetic energy lost?',
      apply(s) { s.e = 0; },
      watch: [
        { id: 'lost', label: 'the kinetic energy lost', get: (c) => c.lost },
      ],
      mode: 'dir',
      expect: { lost: 'bigger' },
      why: String.raw`An elastic collision keeps the kinetic energy, so the loss is zero. Sticking throws away the motion relative to the centre of mass, which is the most this collision can lose. Momentum is conserved in both.`,
    },
    {
      id: 'collide-speed',
      scenario: 'exchange',
      ask: 'Double the incoming speed. Leave the collision elastic. What happens to the target’s final speed, and to the kinetic energy?',
      apply(s) { s.u1 *= 2; },
      watch: [
        { id: 'v2', label: 'the target\'s final speed', get: (c) => c.v2, mode: 'factor' },
        { id: 'K', label: 'the kinetic energy afterward', get: (c) => c.K, mode: 'factor' },
      ],
      expect: { v2: 2, K: 4 },
      why: String.raw`Every velocity in this collision scales with the incoming speed, so the target leaves twice as fast. Kinetic energy scales with the square of the speed, so it becomes four times as large.`,
    },
    {
      id: 'collide-heavy',
      scenario: 'exchange',
      ask: 'Make the target three times as heavy. Keep the collision elastic. What happens to the incoming mass’s final velocity?',
      apply(s) { s.m2 = 6; },
      watch: [
        { id: 'v1', label: 'the incoming mass\'s final velocity', get: (c) => c.v1, mode: 'dir', signed: true },
      ],
      expect: { v1: 'smaller' },
      why: String.raw`Equal masses exchange velocities, so the incoming mass stops. A heavier target sends it back, and the velocity changes sign.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('exchange', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('co-m1', 'Incoming mass (kg)', 2, 0.01, 20, 0.01)}${sliderRow('co-m2', 'Target mass (kg)', 2, 0.01, 20, 0.01)}${sliderRow('co-u1', 'Incoming velocity (m/s)', 4, -8, 12, 0.01)}${sliderRow('co-u2', 'Target velocity (m/s)', 0, -8, 12, 0.01)}${sliderRow('co-e', 'Restitution e', 1, 0, 1, 0.01)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'co-m1', (s, v) => { s.m1 = v; });
    bindSlider(api, 'co-m2', (s, v) => { s.m2 = v; });
    bindSlider(api, 'co-u1', (s, v) => { s.u1 = v; });
    bindSlider(api, 'co-u2', (s, v) => { s.u2 = v; });
    bindSlider(api, 'co-e', (s, v) => { s.e = v; });
  },
  syncControls(state) {
    putSlider('co-m1', state.m1, 2);
    putSlider('co-m2', state.m2, 2);
    putSlider('co-u1', state.u1, 2);
    putSlider('co-u2', state.u2, 2);
    putSlider('co-e', state.e, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const track = fatLine([-5.2, 0.55, 0, 5.2, 0.55, 0], { color: M.greyDark, width: 2.5 });
    const bodies = [block(), block()];
    bodies[1].material = bodies[1].material.clone();
    const arrows = ['u1', 'u2', 'v1', 'v2'].map(() => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, VEL, undefined, undefined, 0.018));
    const names = ['1', '2'].map((t) => label(t, 0, 0, 0, 'graph-axis'));
    const base = fatLine([-3.4, -2.15, 0, 3.4, -2.15, 0], { color: M.grey, width: 1.5 });
    const bars = [0, 1, 2, 3].map((i) => fatLine([0, 0, 0, 0, 1, 0], { color: i < 2 ? M.teal : M.white, width: 14 }));
    const barNames = ['p before', 'p after', 'K before', 'K after'].map((t) => label(t, 0, 0, 0, 'graph-axis'));
    const title = label('momentum and energy', 0, -3.35, 0, 'graph-title');
    group.add(track, ...bodies, ...arrows, ...names, base, ...bars, ...barNames, title);
    group.visible = false;
    return { group, bodies, arrows, names, bars, barNames };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    const hit = collide1D(state.m1, state.m2, state.u1, state.u2, state.e);
    const K0 = kineticEnergy(state.m1, state.u1) + kineticEnergy(state.m2, state.u2);
    const K = kineticEnergy(state.m1, hit.v1) + kineticEnergy(state.m2, hit.v2);
    computed.v1 = hit.v1;
    computed.v2 = hit.v2;
    computed.K0 = K0;
    computed.K = K;
    computed.lost = K0 - K;
    computed.p0 = state.m1 * state.u1 + state.m2 * state.u2;
    computed.p = state.m1 * hit.v1 + state.m2 * hit.v2;
  },
  second(state) {
    const { m1, m2, u1, u2, e } = state;
    const p = m1 * u1 + m2 * u2;
    const rel = e * (u1 - u2);
    const det = m1 + m2;
    const v1 = (p - m2 * rel) / det;
    const v2 = (p + m1 * rel) / det;
    const K0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const K = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
    return { v1, v2, K0, K, lost: impactLoss(m1, m2, u1, u2, e), p0: p, p: m1 * v1 + m2 * v2 };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.bodies) return;
    ctx.grid.visible = false;
    const w1 = Math.min(0.7, 0.28 + 0.12 * Math.sqrt(state.m1));
    const w2 = Math.min(0.7, 0.28 + 0.12 * Math.sqrt(state.m2));
    const y = 0.55;
    const hgt = 0.7;
    setBlock(h.bodies[0], -1.7, y, w1, hgt, M.blue);
    setBlock(h.bodies[1], 1.7, y, w2, hgt, M.gold);
    h.names[0].position.set(-1.7, y + hgt + 0.35, 0);
    h.names[1].position.set(1.7, y + hgt + 0.35, 0);
    const speeds = [state.u1, state.u2, computed.v1, computed.v2];
    const scale = 1.5 / Math.max(2, ...speeds.map((v) => Math.abs(v)));
    const spots = [[-1.7, 2.15], [1.7, 2.15], [-1.7, y + 0.35], [1.7, y + 0.35]];
    speeds.forEach((v, i) => {
      const [x, yy] = spots[i];
      placeArrow(h.arrows[i], x, yy, x + v * scale, yy, 0.06);
    });
    const vals = [computed.p0, computed.p, computed.K0, computed.K];
    const scaleB = 1.5 / Math.max(1, ...vals.map((v) => Math.abs(v)));
    vals.forEach((val, i) => {
      const x = -2.4 + i * 1.6;
      const top = -2.15 + val * scaleB;
      if (Math.abs(val * scaleB) < 0.03) h.bars[i].visible = false;
      else {
        h.bars[i].visible = true;
        updateFatLine(h.bars[i], [x, -2.15, 0.02, x, top, 0.02]);
      }
      h.barNames[i].position.set(x, -2.7, 0);
    });
  },
  law() {
    return [String.raw`m_1 u_1 + m_2 u_2 = m_1 v_1 + m_2 v_2`, String.raw`v_2 - v_1 = e\,(u_1 - u_2)`];
  },
  readoutCells(_state, computed) {
    return [
      ['Velocity of mass 1 after', `${fmt(computed.v1)} m/s`],
      ['Velocity of mass 2 after', `${fmt(computed.v2)} m/s`],
      ['Momentum before', `${fmt(computed.p0)} kg·m/s`],
      ['Momentum after', `${fmt(computed.p)} kg·m/s`],
      ['Kinetic energy before', `${fmt(computed.K0)} J`],
      ['Kinetic energy after', `${fmt(computed.K)} J`],
      ['Kinetic energy lost', `${fmt(computed.lost)} J`],
    ];
  },
  coach(state) {
    return {
      title: 'Restitution',
      body: [
        String.raw`$e = 1$ keeps the kinetic energy. $e = 0$ means the two masses leave together. Between those, momentum is kept and some kinetic energy is not.`,
        state.m1 === state.m2 && state.u2 === 0 && state.e === 1
          ? 'Equal masses, target at rest, elastic: they exchange velocities. The incoming mass stops.'
          : 'The centre-of-mass velocity does not change. Only the motion relative to it can be lost.',
      ],
    };
  },
});

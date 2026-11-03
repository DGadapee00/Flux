/**
 * Shows that a particle's angular momentum depends on the origin, and that on a
 * straight line past the origin it stays constant and equals momentum times the
 * miss distance.
 *
 * The closed form is the z component of r × p. With no force, the check is the
 * area swept, 2m ΔA / Δt. With a force, the check is the vector cross product.
 */
import * as THREE from 'three';
import { particleAngularMomentum } from '@flux/subjects/mechanics/momentum.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { Arrow, M, QUANTITY_COLORS, dot, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const base = { m: 2, x: 4, y: 1, vx: 3, vy: 0, ax: 0, ay: 0 };
const SCENARIOS = [
  { ...base, id: 'miss', name: 'A particle misses the origin' },
  { ...base, id: 'through', name: 'The velocity points along the position, so L is zero', x: 4, y: 1, vx: 4, vy: 1 },
  { ...base, id: 'meteor', name: 'A meteor 25 km east and 25 km north, falling at 2.0 km/s', m: 15, x: 25000, y: 25000, vx: 0, vy: -2000, ax: 0, ay: -2 },
];

function now(state) {
  return {
    x: state.x,
    y: state.y,
    vx: state.vx,
    vy: state.vy,
  };
}

function closed(state) {
  const p = now(state);
  const Lz = state.m * (p.x * p.vy - p.y * p.vx);
  const tau = state.m * (p.x * state.ay - p.y * state.ax);
  const miss = Math.hypot(p.vx, p.vy) > 0
    ? Math.abs(p.x * p.vy - p.y * p.vx) / Math.hypot(p.vx, p.vy)
    : 0;
  return { Lz, tau, miss };
}

function swept(state) {
  const T = 0.4;
  const n = 4000;
  const dt = T / n;
  let area = 0;
  let x = state.x;
  let y = state.y;
  const vx = state.vx;
  const vy = state.vy;
  for (let i = 0; i < n; i += 1) {
    area += 0.5 * (x * vy - y * vx) * dt;
    x += vx * dt;
    y += vy * dt;
  }
  return (2 * state.m * area) / T;
}

function stepped(state) {
  const exact = closed(state);
  if (state.ax === 0 && state.ay === 0) return { ...exact, Lz: swept(state) };
  const L = particleAngularMomentum(state.m, v(state.x, state.y, 0), v(state.vx, state.vy, 0));
  return { ...exact, Lz: L.z };
}

export default defineLab({
  id: 'particle-l',
  exam: 'u7',
  title: 'Angular momentum of a particle',
  hint: 'L is r × p about the origin you chose. A straight miss keeps it constant.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'pl-speed',
      scenario: 'miss',
      ask: 'Double both velocity components. What happens to the angular momentum?',
      apply(s) { s.vx *= 2; s.vy *= 2; },
      watch: [{ id: 'Lz', label: 'the angular momentum', get: (c) => c.Lz, mode: 'factor' }],
      expect: { Lz: 2 },
      why: String.raw`$L = m(xv_y - yv_x)$. Doubling the velocity doubles the momentum, and $L$ follows.`,
    },
    {
      id: 'pl-origin',
      scenario: 'miss',
      ask: 'Point the velocity along the position, so the particle is heading straight away from the origin. What happens to the angular momentum?',
      apply(s) { s.vx = s.x; s.vy = s.y; },
      watch: [{ id: 'Lz', label: 'the angular momentum', get: (c) => c.Lz }],
      mode: 'dir',
      expect: { Lz: 'smaller' },
      why: String.raw`Then $\vec r$ and $\vec v$ are parallel, so the cross product is zero. The same particle, about an origin on its line, has no angular momentum.`,
    },
    {
      id: 'pl-mass',
      scenario: 'miss',
      ask: 'Double the mass, and keep the path. What happens to the angular momentum?',
      apply(s) { s.m *= 2; },
      watch: [{ id: 'Lz', label: 'the angular momentum', get: (c) => c.Lz, mode: 'factor' }],
      expect: { Lz: 2 },
      why: String.raw`Angular momentum is $m$ times $xv_y - yv_x$. Twice the mass, twice $L$, on the same path.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('miss', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('pl-m', 'Mass (kg)', 2, 0.2, 30, 0.1)}${sliderRow('pl-x', 'x (m)', 4, -30000, 30000, 1)}${sliderRow('pl-y', 'y (m)', 1, -30000, 30000, 1)}${sliderRow('pl-vx', 'vx (m/s)', 3, -3000, 3000, 0.1)}${sliderRow('pl-vy', 'vy (m/s)', 0, -3000, 3000, 0.1)}${sliderRow('pl-ay', 'ay (m/s²)', 0, -8, 4, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'pl-m', (s, v) => { s.m = v; });
    bindSlider(api, 'pl-x', (s, v) => { s.x = v; });
    bindSlider(api, 'pl-y', (s, v) => { s.y = v; });
    bindSlider(api, 'pl-vx', (s, v) => { s.vx = v; });
    bindSlider(api, 'pl-vy', (s, v) => { s.vy = v; });
    bindSlider(api, 'pl-ay', (s, v) => { s.ay = v; });
  },
  syncControls(state) {
    putSlider('pl-m', state.m, 1);
    putSlider('pl-x', state.x, 0);
    putSlider('pl-y', state.y, 0);
    putSlider('pl-vx', state.vx, 1);
    putSlider('pl-vy', state.vy, 1);
    putSlider('pl-ay', state.ay, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const path = fatLine(new Array(6).fill(0), { color: M.grey, width: 1.5 });
    const origin = dot(QUANTITY_COLORS.mark, 0.12);
    const mass = dot(M.gold, 0.16);
    const velocity = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.014);
    const arm = fatLine(new Array(6).fill(0), { color: M.blue, width: 1.5 });
    const name = label('origin', 0, 0, 0, 'graph-axis');
    group.add(path, arm, origin, mass, velocity, name);
    group.visible = false;
    return { group, path, arm, origin, mass, velocity, name };
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
    if (!h?.mass) return;
    ctx.grid.visible = false;
    const scale = 2.2 / Math.max(Math.hypot(state.x, state.y), 1);
    const x = state.x * scale;
    const y = state.y * scale;
    h.origin.position.set(0, 0, 0.02);
    h.mass.position.set(x, y, 0.04);
    h.name.position.set(0.35, -0.35, 0);
    updateFatLine(h.arm, [0, 0, 0.02, x, y, 0.02]);
    const vlen = Math.hypot(state.vx, state.vy);
    const dirx = vlen > 0 ? state.vx / vlen : 1;
    const diry = vlen > 0 ? state.vy / vlen : 0;
    const tip = 1.3;
    updateFatLine(h.path, [x - dirx * 2.4, y - diry * 2.4, 0.01, x + dirx * 2.4, y + diry * 2.4, 0.01]);
    placeArrow(h.velocity, x, y, x + dirx * tip, y + diry * tip, 0.05);
    void computed;
  },
  law: () => [String.raw`L_z = m(xv_y - yv_x)`, String.raw`\tau_z = m(xa_y - ya_x)`],
  readoutCells(_state, computed) {
    return [
      ['Angular momentum', `${fmt(computed.Lz)} kg·m²/s`],
      ['Torque', `${fmt(computed.tau)} N·m`],
      ['Miss distance', `${fmt(computed.miss)} m`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'The origin is part of the answer',
      body: [
        String.raw`$L_z = ${fmt(computed.Lz)}$ kg·m²/s about this origin. The miss distance is ${fmt(computed.miss)} m.`,
        state.scenarioId === 'meteor'
          ? 'The book prints 7.50×10⁸ kg·m²/s into the page, and a torque of 7.5×10⁵ N·m the same way. The 25 km position is where the observer looks, at that instant.'
          : 'Move the origin onto the particle’s line and the angular momentum drops to zero. The particle did not change. The reference point did.',
        Math.abs(state.ay) + Math.abs(state.ax) > 0
          ? 'A force changes L. The torque about this origin is the rate of that change.'
          : 'With no force, L is constant, and the area swept per second is L/(2m).',
      ],
    };
  },
});

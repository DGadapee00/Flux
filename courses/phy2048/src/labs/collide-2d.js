/**
 * Shows that momentum is conserved by components, and that equal masses with one at rest leave at a
 * right angle when the collision is elastic. A wreck is the other model: the two vehicles leave as one.
 *
 * The disc case projects the velocities onto the contact normal and runs a one-dimensional collision
 * there. The check writes those components out by hand and checks the lost energy against
 * ½μ(1 − e²)v_rel,n². The wreck adds the momenta as vectors. The check recomputes the shared
 * kinetic energy as p²/2M.
 */
import * as THREE from 'three';
import { kineticEnergy } from '@flux/subjects/mechanics/energy.js';
import { collide1D, discCollision, impactLoss } from '@flux/subjects/mechanics/momentum.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const DEG = Math.PI / 180;
const VEL = QUANTITY_COLORS.v;
const N = 40;

const MODES = [['disc', 'Smooth discs'], ['wreck', 'Wreck: they move as one']];

const SCENARIOS = [
  { id: 'equal', name: 'Equal discs, one at rest, elastic', mode: 'disc', m1: 0.5, m2: 0.5, u1: 2, u2: 0, theta: 40, e: 1 },
  { id: 'heavy', name: 'A light disc into a heavy one', mode: 'disc', m1: 0.2, m2: 0.8, u1: 3, u2: 0, theta: 30, e: 1 },
  { id: 'traffic', name: 'The book’s wreck: 1200 kg at 16.67 m/s and 3000 kg at 11.1 m/s, at 90°', mode: 'wreck', m1: 1200, m2: 3000, u1: 16.67, u2: 11.1, theta: 90, e: 0 },
];

function circle(color) {
  return fatLine(new Array((N + 1) * 3).fill(0), { color, width: 2.5 });
}

function setCircle(line, x, y, r) {
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const a = (i / N) * Math.PI * 2;
    pts.push(x + r * Math.cos(a), y + r * Math.sin(a), 0.02);
  }
  updateFatLine(line, pts);
}

function block() {
  return fatLine(new Array(15).fill(0), { color: M.blue, width: 3 });
}

function setBlock(line, x, y, w, h, color) {
  line.material.color.set(color);
  updateFatLine(line, [x - w, y, 0.02, x + w, y, 0.02, x + w, y + h, 0.02, x - w, y + h, 0.02, x - w, y, 0.02]);
}

/** Closed form. Disc 1 moves along +x. Disc 2 moves along +x too. The contact normal is at θ. */
function discClosed(state) {
  const hit = discCollision({
    m1: state.m1, m2: state.m2, u1x: state.u1, u1y: 0, u2x: state.u2, u2y: 0, thetaDeg: state.theta, e: state.e,
  });
  const K0 = kineticEnergy(state.m1, state.u1) + kineticEnergy(state.m2, state.u2);
  const K = kineticEnergy(state.m1, Math.hypot(hit.v1x, hit.v1y)) + kineticEnergy(state.m2, Math.hypot(hit.v2x, hit.v2y));
  const px = state.m1 * hit.v1x + state.m2 * hit.v2x - (state.m1 * state.u1 + state.m2 * state.u2);
  const py = state.m1 * hit.v1y + state.m2 * hit.v2y;
  return pack(hit.v1x, hit.v1y, hit.v2x, hit.v2y, K0, K, px, py);
}

/** The same collision written as a one-dimensional hit on the normal, by hand. */
function discByHand(state) {
  const th = state.theta * DEG;
  const nx = Math.cos(th);
  const ny = Math.sin(th);
  const tx = -ny;
  const ty = nx;
  const un1 = state.u1 * nx;
  const ut1 = state.u1 * tx;
  const un2 = state.u2 * nx;
  const ut2 = state.u2 * tx;
  const hit = collide1D(state.m1, state.m2, un1, un2, state.e);
  const v1x = hit.v1 * nx + ut1 * tx;
  const v1y = hit.v1 * ny + ut1 * ty;
  const v2x = hit.v2 * nx + ut2 * tx;
  const v2y = hit.v2 * ny + ut2 * ty;
  const K0 = 0.5 * state.m1 * state.u1 * state.u1 + 0.5 * state.m2 * state.u2 * state.u2;
  const K = 0.5 * state.m1 * (v1x * v1x + v1y * v1y) + 0.5 * state.m2 * (v2x * v2x + v2y * v2y);
  const px = state.m1 * v1x + state.m2 * v2x - (state.m1 * state.u1 + state.m2 * state.u2);
  const py = state.m1 * v1y + state.m2 * v2y;
  const out = pack(v1x, v1y, v2x, v2y, K0, K, px, py);
  out.lost = impactLoss(state.m1, state.m2, un1, un2, state.e);
  return out;
}

function wreckClosed(state) {
  const th = state.theta * DEG;
  const px0 = state.m1 * state.u1 + state.m2 * state.u2 * Math.cos(th);
  const py0 = state.m2 * state.u2 * Math.sin(th);
  const total = state.m1 + state.m2;
  const vx = px0 / total;
  const vy = py0 / total;
  const K0 = kineticEnergy(state.m1, state.u1) + kineticEnergy(state.m2, state.u2);
  const K = kineticEnergy(total, Math.hypot(vx, vy));
  const out = pack(vx, vy, vx, vy, K0, K, 0, 0);
  out.angle = Math.atan2(vy, vx) / DEG;
  return out;
}

/** p²/2M is the kinetic energy of one body carrying the whole momentum. */
function wreckEnergy(state) {
  const th = state.theta * DEG;
  const px0 = state.m1 * state.u1 + state.m2 * state.u2 * Math.cos(th);
  const py0 = state.m2 * state.u2 * Math.sin(th);
  const total = state.m1 + state.m2;
  const K0 = 0.5 * state.m1 * state.u1 * state.u1 + 0.5 * state.m2 * state.u2 * state.u2;
  const K = (px0 * px0 + py0 * py0) / (2 * total);
  const vx = px0 / total;
  const vy = py0 / total;
  const out = pack(vx, vy, vx, vy, K0, K, 0, 0);
  out.angle = Math.atan2(vy, vx) / DEG;
  out.lost = K0 - K;
  return out;
}

function between(v1x, v1y, v2x, v2y) {
  const a = Math.atan2(v1y, v1x);
  const b = Math.atan2(v2y, v2x);
  let deg = Math.abs(a - b) / DEG;
  if (deg > 180) deg = 360 - deg;
  return deg;
}

function pack(v1x, v1y, v2x, v2y, K0, K, px, py) {
  return {
    v1x, v1y, v2x, v2y,
    speed1: Math.hypot(v1x, v1y),
    speed2: Math.hypot(v2x, v2y),
    speed: Math.hypot(v1x, v1y),
    angle: between(v1x, v1y, v2x, v2y),
    K0, K, lost: K0 - K, px, py,
    p0: 0, p: 0,
  };
}

export default defineLab({
  id: 'collide-2d',
  exam: 'u5',
  title: 'Collisions in two dimensions',
  hint: 'Disc 1 comes in along +x. The contact normal sits at θ. A wreck adds the two momenta and leaves as one body.',
  orbit: false,
  fit: { w: 12.2, h: 8.6 },
  camera: { pos: new THREE.Vector3(0, -0.2, 24), target: new THREE.Vector3(0, -0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'angle-fixed',
      scenario: 'equal',
      ask: 'Equal masses, one at rest, elastic. Change the incoming angle. What happens to the angle between the two outgoing velocities?',
      apply(s) { s.theta = 70; },
      watch: [{ id: 'angle', label: 'the angle between the outgoing velocities', get: (c) => c.angle }],
      mode: 'dir',
      expect: { angle: 'same' },
      why: String.raw`It stays a right angle. The masses are equal and the target is at rest, so the two velocity vectors after an elastic collision are perpendicular for any glancing angle.`,
    },
    {
      id: 'restitution-loss',
      scenario: 'equal',
      ask: 'Drop the restitution from 1 to 0. What happens to the kinetic energy lost?',
      apply(s) { s.e = 0; },
      watch: [{ id: 'lost', label: 'the kinetic energy lost', get: (c) => c.lost }],
      mode: 'dir',
      expect: { lost: 'bigger' },
      why: String.raw`At $e = 1$ nothing is lost. At $e = 0$ the normal relative velocity is removed. With no friction the discs still slide past each other along the tangent, so this is not a rigid stick.`,
    },
    {
      id: 'double-speed',
      scenario: 'equal',
      ask: 'Double disc 1’s incoming speed, with disc 2 at rest. What happens to disc 1’s outgoing speed, and to the kinetic energy?',
      apply(s) { s.u1 *= 2; },
      watch: [
        { id: 'speed1', label: 'disc 1’s outgoing speed', get: (c) => c.speed1, mode: 'factor' },
        { id: 'K', label: 'the kinetic energy afterward', get: (c) => c.K, mode: 'factor' },
      ],
      expect: { speed1: 2, K: 4 },
      why: String.raw`Every velocity scales with the one incoming speed, so each outgoing speed doubles. Kinetic energy scales with the square of the speed, so it becomes four times as large.`,
    },
    {
      id: 'wreck-speed',
      scenario: 'traffic',
      ask: 'In the wreck, double both incoming speeds. What happens to the shared speed?',
      apply(s) { s.u1 *= 2; s.u2 *= 2; },
      watch: [
        { id: 'speed', label: 'the shared speed', get: (c) => c.speed, mode: 'factor' },
        { id: 'lost', label: 'the kinetic energy lost', get: (c) => c.lost, mode: 'factor' },
      ],
      expect: { speed: 2, lost: 4 },
      why: String.raw`Both momenta double, and so does the shared velocity. The kinetic energy lost scales with the square of the speeds.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('equal', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('c2-mode', 'Model', MODES, 'disc')}${sliderRow('c2-m1', 'Mass 1 (kg)', 0.5, 0.1, 4000, 0.1)}${sliderRow('c2-m2', 'Mass 2 (kg)', 0.5, 0.1, 4000, 0.1)}${sliderRow('c2-u1', 'Speed 1, along +x (m/s)', 2, 0, 40, 0.01)}${sliderRow('c2-u2', 'Speed 2 (m/s)', 0, 0, 40, 0.01)}${sliderRow('c2-th', 'Angle θ (°)', 40, 5, 170, 1)}<div id="c2-rest">${sliderRow('c2-e', 'Restitution e (discs)', 1, 0, 1, 0.01)}</div></div>`;
  },
  bind(api) {
    bindSelect(api, 'c2-mode', (s, v) => { s.mode = v; });
    bindSlider(api, 'c2-m1', (s, v) => { s.m1 = v; });
    bindSlider(api, 'c2-m2', (s, v) => { s.m2 = v; });
    bindSlider(api, 'c2-u1', (s, v) => { s.u1 = v; });
    bindSlider(api, 'c2-u2', (s, v) => { s.u2 = v; });
    bindSlider(api, 'c2-th', (s, v) => { s.theta = v; });
    bindSlider(api, 'c2-e', (s, v) => { s.e = v; });
  },
  syncControls(state) {
    const rest = document.getElementById('c2-rest');
    if (rest) rest.hidden = state.mode !== 'disc';
    putSelect('c2-mode', state.mode);
    putSlider('c2-m1', state.m1, 1);
    putSlider('c2-m2', state.m2, 1);
    putSlider('c2-u1', state.u1, 2);
    putSlider('c2-u2', state.u2, 2);
    putSlider('c2-th', state.theta, 0);
    putSlider('c2-e', state.e, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const rings = [circle(M.blue), circle(M.gold)];
    const boxes = [block(), block()];
    boxes[1].material = boxes[1].material.clone();
    const normal = fatLine([-2, 0, 0, 2, 0, 0], { color: M.grey, width: 1.5 });
    const arrows = [0, 1, 2, 3].map(() => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, VEL, undefined, undefined, 0.016));
    const names = ['1', '2'].map((t) => label(t, 0, 0, 0, 'graph-axis'));
    const base = fatLine([-3.4, -2.35, 0, 3.4, -2.35, 0], { color: M.grey, width: 1.5 });
    const bars = [0, 1, 2, 3].map((i) => fatLine([0, 0, 0, 0, 1, 0], { color: i < 2 ? M.teal : M.white, width: 14 }));
    const barNames = ['p before', 'p after', 'K before', 'K after'].map((t) => label(t, 0, 0, 0, 'graph-axis'));
    const title = label('momentum and energy', 0, -3.45, 0, 'graph-title');
    group.add(normal, ...rings, ...boxes, ...arrows, ...names, base, ...bars, ...barNames, title);
    group.visible = false;
    return { group, rings, boxes, normal, arrows, names, bars, barNames };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    const r = state.mode === 'wreck' ? wreckClosed(state) : discClosed(state);
    const th = state.theta * DEG;
    const p0x = state.m1 * state.u1 + state.m2 * state.u2 * (state.mode === 'wreck' ? Math.cos(th) : 1);
    const p0y = state.mode === 'wreck' ? state.m2 * state.u2 * Math.sin(th) : 0;
    r.p0 = Math.hypot(p0x, p0y);
    r.p = Math.hypot(p0x + r.px, p0y + r.py);
    Object.assign(computed, r);
  },
  second(state) {
    const r = state.mode === 'wreck' ? wreckEnergy(state) : discByHand(state);
    const th = state.theta * DEG;
    const p0x = state.m1 * state.u1 + state.m2 * state.u2 * (state.mode === 'wreck' ? Math.cos(th) : 1);
    const p0y = state.mode === 'wreck' ? state.m2 * state.u2 * Math.sin(th) : 0;
    r.p0 = Math.hypot(p0x, p0y);
    r.p = Math.hypot(p0x + r.px, p0y + r.py);
    return r;
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.rings) return;
    ctx.grid.visible = false;
    const disc = state.mode === 'disc';
    h.rings.forEach((line) => { line.visible = disc; });
    h.boxes.forEach((line) => { line.visible = !disc; });
    h.normal.visible = disc;
    const th = state.theta * DEG;
    if (disc) {
      const r1 = 0.28 + 0.12 * Math.sqrt(state.m1);
      const r2 = 0.28 + 0.12 * Math.sqrt(state.m2);
      const x1 = -1.5;
      const y1 = 0.4;
      const x2 = x1 + (r1 + r2 + 0.08) * Math.cos(th);
      const y2 = y1 + (r1 + r2 + 0.08) * Math.sin(th);
      setCircle(h.rings[0], x1, y1, r1);
      setCircle(h.rings[1], x2, y2, r2);
      updateFatLine(h.normal, [x1 - 1.1 * Math.cos(th), y1 - 1.1 * Math.sin(th), 0, x2 + 0.8 * Math.cos(th), y2 + 0.8 * Math.sin(th), 0]);
      h.names[0].position.set(x1, y1 + r1 + 0.28, 0);
      h.names[1].position.set(x2, y2 + r2 + 0.28, 0);
      const scale = 1.3 / Math.max(1.5, state.u1, state.u2, computed.speed1, computed.speed2);
      placeArrow(h.arrows[0], x1 - state.u1 * scale, y1 + r1 + 0.55, x1, y1 + r1 + 0.55, 0.08);
      placeArrow(h.arrows[1], x2 - state.u2 * scale, y2 + r2 + 0.55, x2, y2 + r2 + 0.55, 0.08);
      placeArrow(h.arrows[2], x1, y1, x1 + computed.v1x * scale, y1 + computed.v1y * scale, 0.05);
      placeArrow(h.arrows[3], x2, y2, x2 + computed.v2x * scale, y2 + computed.v2y * scale, 0.05);
    } else {
      setBlock(h.boxes[0], -1.6, 0.15, 0.45, 0.55, M.blue);
      setBlock(h.boxes[1], 0.3, 1.15, 0.55, 0.4, M.gold);
      h.names[0].position.set(-1.6, 1.05, 0);
      h.names[1].position.set(0.3, 1.85, 0);
      placeArrow(h.arrows[0], -3.1, 0.45, -2.2, 0.45, 0.08);
      placeArrow(h.arrows[1], 0.3 - 0.9 * Math.cos(th), 1.35 - 0.9 * Math.sin(th), 0.3, 1.35, 0.08);
      const sp = Math.hypot(computed.v1x, computed.v1y) || 1;
      placeArrow(h.arrows[2], -0.6, 0.7, -0.6 + 1.3 * computed.v1x / sp, 0.7 + 1.3 * computed.v1y / sp, 0.06);
      h.arrows[3].visible = false;
    }
    const vals = [computed.p0, computed.p, computed.K0, computed.K];
    const scaleB = 1.4 / Math.max(1, ...vals.map((v) => Math.abs(v)));
    vals.forEach((val, i) => {
      const x = -2.4 + i * 1.6;
      const top = -2.35 + Math.abs(val) * scaleB;
      if (Math.abs(val) * scaleB < 0.03) h.bars[i].visible = false;
      else {
        h.bars[i].visible = true;
        updateFatLine(h.bars[i], [x, -2.35, 0.02, x, top, 0.02]);
      }
      h.barNames[i].position.set(x, -2.85, 0);
    });
  },
  law(state) {
    if (state.mode === 'wreck') return [String.raw`\vec p_1 + \vec p_2 = (m_1+m_2)\vec v`, String.raw`K = \dfrac{p^2}{2M}`];
    return [String.raw`v_{2n}-v_{1n} = e\,(u_{1n}-u_{2n})`, String.raw`\vec p_x,\ \vec p_y\ \text{each stay the same}`];
  },
  readoutCells(state, computed) {
    if (state.mode === 'wreck') {
      return [
        ['Shared speed', `${fmt(computed.speed)} m/s`],
        ['Direction from +x', `${fmt(computed.angle, 3)}°`],
        ['Momentum before', `${fmt(computed.p0)} kg·m/s`],
        ['Momentum after', `${fmt(computed.p)} kg·m/s`],
        ['Kinetic energy before', `${fmt(computed.K0)} J`],
        ['Kinetic energy after', `${fmt(computed.K)} J`],
        ['Kinetic energy lost', `${fmt(computed.lost)} J`],
      ];
    }
    return [
      ['Speed of disc 1', `${fmt(computed.speed1)} m/s`],
      ['Speed of disc 2', `${fmt(computed.speed2)} m/s`],
      ['Angle between them', `${fmt(computed.angle, 3)}°`],
      ['Δpₓ', `${fmt(computed.px)} kg·m/s`],
      ['Δp_y', `${fmt(computed.py)} kg·m/s`],
      ['Kinetic energy before', `${fmt(computed.K0)} J`],
      ['Kinetic energy after', `${fmt(computed.K)} J`],
      ['Kinetic energy lost', `${fmt(computed.lost)} J`],
    ];
  },
  coach(state, computed) {
    if (state.mode === 'wreck') {
      return {
        title: 'One velocity afterward',
        body: [
          String.raw`The two vehicles move off together at $${fmt(computed.speed)}$ m/s, $${fmt(computed.angle, 3)}^\circ$ from the first vehicle’s direction. Kinetic energy drops by $${fmt(computed.lost)}$ J.`,
          'Restitution is not used here. A wreck is the perfectly inelastic case in two dimensions: one shared velocity, along the total momentum.',
        ],
      };
    }
    const right = state.m1 === state.m2 && state.u2 === 0 && state.e === 1;
    return {
      title: 'Only the normal is shared',
      body: [
        state.e === 0
          ? 'No normal rebound. The discs still keep their own tangent velocities, because a smooth contact has no friction. They do not lock into one rigid body.'
          : String.raw`The tangent part of each velocity is unchanged. The normal part is an ordinary one-dimensional collision with restitution $${fmt(state.e, 2)}$.`,
        right
          ? 'Equal mass, target at rest, elastic: the outgoing velocities stay perpendicular however you set the incoming angle.'
          : String.raw`The kinetic energy lost is $${fmt(computed.lost)}$ J. Momentum along each axis is unchanged.`,
      ],
    };
  },
});

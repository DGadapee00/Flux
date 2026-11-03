/**
 * Shows that a body rolling without slipping has a = g sinθ / (1 + I/(mR²)),
 * so the mass and the radius cancel and a sphere beats a disk beats a hoop.
 * The contact point is instantaneously at rest. Static friction is whatever
 * enforces v = ωR, and it is not μN unless the wheel is on the verge of slipping.
 *
 * The closed form is Newton's laws. The check is the energy result for the
 * speed after a distance along the plane, and a stepped slide when friction is kinetic.
 */
import * as THREE from 'three';
import {
  inertiaDisk, inertiaHoop, inertiaSphere, rollingIncline, rollingSlip,
} from '@flux/subjects/mechanics/rotation.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const SHAPES = [['sphere', 'Solid sphere'], ['disk', 'Disk or solid cylinder'], ['hoop', 'Thin hoop']];
const MODES = [['roll', 'Rolls without slipping'], ['slip', 'Slips, kinetic friction']];

const base = { shape: 'disk', mode: 'roll', m: 2, R: 0.2, theta: 30, s: 1.5, mu: 0.1 };
const SCENARIOS = [
  { ...base, id: 'disk', name: 'A disk rolls, 30°' },
  { ...base, id: 'sphere', name: 'A solid sphere on the same hill', shape: 'sphere' },
  { ...base, id: 'hoop', name: 'A thin hoop on the same hill', shape: 'hoop' },
  { ...base, id: 'slip', name: 'The disk slips, μk = 0.10', mode: 'slip', mu: 0.1 },
];

function moment(state) {
  if (state.shape === 'hoop') return inertiaHoop(state.m, state.R);
  if (state.shape === 'sphere') return inertiaSphere(state.m, state.R);
  return inertiaDisk(state.m, state.R);
}

function closed(state) {
  const I = moment(state);
  const roll = rollingIncline({ mass: state.m, radius: state.R, I, thetaDeg: state.theta, g: G });
  const slip = rollingSlip({ mass: state.m, radius: state.R, I, thetaDeg: state.theta, mu: state.mu, g: G });
  const slipping = state.mode === 'slip';
  const a = slipping ? slip.a : roll.a;
  const alpha = slipping ? slip.alpha : roll.alpha;
  const s = Math.max(state.s, 0);
  const v = a > 0 ? Math.sqrt(2 * a * s) : 0;
  const t = a > 1e-9 ? v / a : 0;
  const omega = slipping ? alpha * t : v / state.R;
  return {
    I, a, alpha, v, omega, f: slipping ? slip.f : roll.f, muMin: roll.muMin, k: roll.k, N: roll.N,
  };
}

function stepped(state) {
  const exact = closed(state);
  const n = 8000;
  const s = Math.max(state.s, 0);
  if (!(exact.a > 1e-9) || !(s > 0)) return exact;
  const dt = Math.sqrt((2 * s) / exact.a) / n;
  let x = 0;
  let v = 0;
  let th = 0;
  let w = 0;
  for (let i = 0; i < n; i += 1) {
    x += v * dt + 0.5 * exact.a * dt * dt;
    v += exact.a * dt;
    th += w * dt + 0.5 * exact.alpha * dt * dt;
    w += exact.alpha * dt;
  }
  return { ...exact, v, omega: w };
}

function ring(x, y, r) {
  const pts = [];
  for (let i = 0; i <= 48; i += 1) {
    const a = (i / 48) * Math.PI * 2;
    pts.push(x + r * Math.cos(a), y + r * Math.sin(a), 0.02);
  }
  return pts;
}

export default defineLab({
  id: 'rolling',
  exam: 'u7',
  title: 'Rolling',
  hint: 'Without slipping, only the shape sets the acceleration. A sphere beats a disk, and a disk beats a hoop.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'roll-shape',
      scenario: 'disk',
      ask: 'Replace the disk with a solid sphere, same mass, radius, and hill. What happens to the acceleration?',
      apply(s) { s.shape = 'sphere'; },
      watch: [{ id: 'a', label: 'the acceleration', get: (c) => c.a }],
      mode: 'dir',
      expect: { a: 'bigger' },
      why: String.raw`A sphere has $I = \frac25 mR^2$, a disk $\frac12 mR^2$. Less of the energy goes into spinning, so the sphere's center speeds up faster.`,
    },
    {
      id: 'roll-radius',
      scenario: 'disk',
      ask: 'Double the radius, and keep the mass and the hill. What happens to the acceleration?',
      apply(s) { s.R *= 2; },
      watch: [{ id: 'a', label: 'the acceleration', get: (c) => c.a, mode: 'factor' }],
      expect: { a: 1 },
      why: String.raw`$a = g\sin\theta / (1 + I/(mR^2))$. For a given shape, $I$ grows as $R^2$, so the radius cancels.`,
    },
    {
      id: 'roll-hoop',
      scenario: 'disk',
      ask: 'Replace the disk with a thin hoop of the same mass and radius. What happens to the acceleration?',
      apply(s) { s.shape = 'hoop'; },
      watch: [{ id: 'a', label: 'the acceleration', get: (c) => c.a }],
      mode: 'dir',
      expect: { a: 'smaller' },
      why: String.raw`A hoop has $I = mR^2$, twice a disk. More of the drop goes into spinning, so the center accelerates less.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('disk', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('rl-shape', 'Body', SHAPES, 'disk')}${selectRow('rl-mode', 'Contact', MODES, 'roll')}${sliderRow('rl-m', 'Mass (kg)', 2, 0.2, 20, 0.1)}${sliderRow('rl-R', 'Radius (m)', 0.2, 0.05, 1, 0.01)}${sliderRow('rl-th', 'Incline (°)', 30, 10, 60, 1)}${sliderRow('rl-s', 'Distance along the plane (m)', 1.5, 0.2, 8, 0.1)}${sliderRow('rl-mu', 'Kinetic friction μ', 0.1, 0, 0.8, 0.01)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'rl-shape', (s, v) => { s.shape = v; });
    bindSelect(api, 'rl-mode', (s, v) => { s.mode = v; });
    bindSlider(api, 'rl-m', (s, v) => { s.m = v; });
    bindSlider(api, 'rl-R', (s, v) => { s.R = v; });
    bindSlider(api, 'rl-th', (s, v) => { s.theta = v; });
    bindSlider(api, 'rl-s', (s, v) => { s.s = v; });
    bindSlider(api, 'rl-mu', (s, v) => { s.mu = v; });
  },
  syncControls(state) {
    putSelect('rl-shape', state.shape);
    putSelect('rl-mode', state.mode);
    putSlider('rl-m', state.m, 2);
    putSlider('rl-R', state.R, 2);
    putSlider('rl-th', state.theta, 0);
    putSlider('rl-s', state.s, 2);
    putSlider('rl-mu', state.mu, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ramp = fatLine([-3.4, -1.5, 0, 2.6, 1.3, 0], { color: M.grey, width: 2 });
    const body = fatLine(new Array(49 * 3).fill(0), { color: M.blue, width: 2.5 });
    const spoke = fatLine(new Array(6).fill(0), { color: M.blue, width: 2 });
    const mark = fatLine(new Array(6).fill(0), { color: M.gold, width: 3 });
    const friction = new Arrow(new THREE.Vector3(-1, 0.4, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.014);
    const speed = new Arrow(new THREE.Vector3(1, -0.4, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.014);
    const name = label('f', 0, 0, 0, 'graph-axis');
    group.add(ramp, body, spoke, mark, friction, speed, name);
    group.visible = false;
    return { group, ramp, body, spoke, mark, friction, speed, name };
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
    if (!h?.body) return;
    ctx.grid.visible = false;
    const th = Math.min(Math.max(state.theta, 10), 60) * Math.PI / 180;
    const x0 = -3.3;
    const y0 = -1.55;
    const len = 5.6;
    const x1 = x0 + len * Math.cos(th);
    const y1 = y0 + len * Math.sin(th);
    updateFatLine(h.ramp, [x0, y0, 0, x1, y1, 0]);
    const rv = 0.95;
    const along = 0.42;
    const cx = x0 + along * (x1 - x0) - rv * Math.sin(th);
    const cy = y0 + along * (y1 - y0) + rv * Math.cos(th);
    updateFatLine(h.body, ring(cx, cy, rv));
    const turned = state.mode === 'slip'
      ? 0.5 * computed.alpha * (computed.a > 1e-9 ? computed.v / computed.a : 0)
      : state.s / Math.max(state.R, 0.05);
    const contact = th - Math.PI / 2;
    const ang = contact - turned;
    updateFatLine(h.spoke, [cx, cy, 0.03, cx + rv * Math.cos(ang), cy + rv * Math.sin(ang), 0.03]);
    updateFatLine(h.mark, [
      cx + 0.7 * rv * Math.cos(contact), cy + 0.7 * rv * Math.sin(contact), 0.04,
      cx + rv * Math.cos(contact), cy + rv * Math.sin(contact), 0.04,
    ]);
    const cpx = cx + rv * Math.cos(contact);
    const cpy = cy + rv * Math.sin(contact);
    placeArrow(h.friction, cpx, cpy, cpx + 1.2 * Math.cos(th), cpy + 1.2 * Math.sin(th), 0.06);
    h.name.position.set(cpx + 1.45 * Math.cos(th), cpy + 1.45 * Math.sin(th) + 0.25, 0);
    const vlen = Math.max(0.4, Math.min(1.35, computed.v / 4));
    placeArrow(h.speed, cx, cy, cx - vlen * Math.cos(th), cy - vlen * Math.sin(th), 0.05);
  },
  law(state) {
    if (state.mode === 'slip') return [String.raw`a = g(\sin\theta - \mu\cos\theta)`, String.raw`\alpha = \mu mg\cos\theta\, R / I`];
    return [String.raw`a = \dfrac{g\sin\theta}{1 + I/(mR^2)}`, String.raw`v = \omega R`];
  },
  readoutCells(state, computed) {
    const rows = [
      ['Acceleration', `${fmt(computed.a)} m/s²`],
      ['Speed after this distance', `${fmt(computed.v)} m/s`],
      ['Angular acceleration', `${fmt(computed.alpha)} rad/s²`],
      ['Friction', `${fmt(computed.f)} N`],
      ['μ needed to keep rolling', fmt(computed.muMin)],
    ];
    if (state.mode === 'roll') rows.push(['Angular speed', `${fmt(computed.omega)} rad/s`]);
    return rows;
  },
  coach(state, computed) {
    const shape = state.shape === 'hoop' ? 'hoop' : state.shape === 'sphere' ? 'sphere' : 'disk';
    return {
      title: state.mode === 'slip' ? 'Kinetic friction both slows and spins' : 'The shape sets the pace',
      body: [
        state.mode === 'slip'
          ? String.raw`The center accelerates at $${fmt(computed.a)}$ m/s², the same formula as a block that slides. Friction $${fmt(computed.f)}$ N also torques the body, but $v$ is not $\omega R$. Every shape shares this center acceleration. The shape still sets the spin, through $I$.`
          : String.raw`This ${shape} has $k = I/(mR^2) = ${fmt(computed.k)}$. The acceleration is $${fmt(computed.a)}$ m/s². Static friction is $${fmt(computed.f)}$ N, which is $\mu N$ only if $\mu$ is exactly ${fmt(computed.muMin)}. Down the plane the sphere leads, then the disk, then the hoop. Doubling the radius does not change the acceleration.`,
      ],
    };
  },
});

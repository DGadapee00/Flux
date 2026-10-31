/**
 * Shows that α = τ/I, and that putting the same mass farther from the axis lowers α.
 *
 * τ = r F sin φ and the tabulated I are the closed form. The check integrates ω and θ
 * at constant α, and checks the work τθ against the change in ½Iω².
 */
import * as THREE from 'three';
import {
  angularAcceleration, constAlpha, inertiaDisk, inertiaHoop, inertiaPoint, inertiaRodEnd, rotationalKE, torqueMag,
} from '@flux/subjects/mechanics/rotation.js';
import { Arrow, M, QUANTITY_COLORS, createGraph, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const SHAPES = [['disk', 'Disk'], ['ring', 'Ring'], ['rod', 'Rod about one end']];
const N = 48;

const base = { shape: 'disk', m: 2, R: 0.4, L: 1.2, F: 8, phi: 90, w0: 0, t: 1, rider: 0, riderAt: 0.3 };
const W0 = 10000 * 2 * Math.PI / 60;
const A_STOP = -W0 / 30;

const SCENARIOS = [
  { ...base, id: 'disk', name: 'A disk, force at the rim' },
  { ...base, id: 'ring', name: 'A ring of the same mass and radius', shape: 'ring' },
  { ...base, id: 'rod', name: 'A rod, pivoted at one end', shape: 'rod', m: 3, L: 2, F: 6 },
  { ...base, id: 'reel', name: 'Fishing reel: α = 110 rad/s² for 2.00 s, radius 4.50 cm', m: 2, R: 0.045, F: 4.95, t: 2 },
  { ...base, id: 'centrifuge', name: 'Centrifuge: 10 000 rpm, radius 20 cm, slowing for 29 s', m: 2, R: 0.2, F: A_STOP * 0.2, w0: W0, t: 29 },
  { ...base, id: 'merry', name: 'Merry-go-round: 50 kg, radius 1.50 m, push 250 N', m: 50, R: 1.5, F: 250 },
  { ...base, id: 'child', name: 'The same merry-go-round with an 18 kg child at 1.25 m', m: 50, R: 1.5, F: 250, rider: 18, riderAt: 1.25 },
];

function geometry(state) {
  const rod = state.shape === 'rod';
  const radius = rod ? state.L : state.R;
  const body = rod
    ? inertiaRodEnd(state.m, state.L)
    : state.shape === 'ring'
      ? inertiaHoop(state.m, state.R)
      : inertiaDisk(state.m, state.R);
  const Ibare = body;
  const I = body + inertiaPoint(state.rider || 0, state.riderAt || 0);
  const tau = torqueMag(radius, state.F, state.phi);
  const alpha = angularAcceleration(tau, I);
  const alphaBare = angularAcceleration(tau, Ibare);
  return { rod, radius, I, Ibare, tau, alpha, alphaBare };
}

function closed(state) {
  const g = geometry(state);
  const spun = constAlpha({ theta0: 0, omega0: state.w0, alpha: g.alpha, t: state.t });
  const at = g.radius * g.alpha;
  const ac = g.radius * spun.omega * spun.omega;
  const K = rotationalKE(g.I, spun.omega);
  const tStop = g.alpha !== 0 && state.w0 * g.alpha < 0 ? -state.w0 / g.alpha : 0;
  return {
    I: g.I,
    tau: g.tau,
    alpha: g.alpha,
    alphaBare: g.alphaBare,
    theta: spun.theta,
    omega: spun.omega,
    at,
    ac,
    a: Math.hypot(at, ac),
    W: g.tau * spun.theta,
    K,
    revs: spun.theta / (2 * Math.PI),
    tStop,
  };
}

/** Midpoint step of constant α. The work is τ times the midpoint ω. */
function stepped(state) {
  const g = geometry(state);
  const n = 8000;
  const dt = state.t > 0 ? state.t / n : 0;
  let theta = 0;
  let omega = state.w0;
  let W = 0;
  for (let i = 0; i < n; i += 1) {
    const mid = omega + 0.5 * g.alpha * dt;
    theta += mid * dt;
    omega += g.alpha * dt;
    W += g.tau * mid * dt;
  }
  const at = g.radius * g.alpha;
  const ac = g.radius * omega * omega;
  const tStop = g.alpha !== 0 && state.w0 * g.alpha < 0 ? -state.w0 / g.alpha : 0;
  return {
    I: g.I, tau: g.tau, alpha: g.alpha, alphaBare: g.alphaBare, theta, omega, at, ac,
    a: Math.hypot(at, ac), W, K: rotationalKE(g.I, omega), revs: theta / (2 * Math.PI), tStop,
  };
}

function ring(x, y, r) {
  const pts = [];
  for (let i = 0; i <= N; i += 1) {
    const a = (i / N) * Math.PI * 2;
    pts.push(x + r * Math.cos(a), y + r * Math.sin(a), 0.02);
  }
  return pts;
}

export default defineLab({
  id: 'rotor',
  exam: 'u6',
  title: 'Rotor',
  hint: 'A force off the axis twists the body. The same mass, farther out, twists more slowly.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 24), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'rotor-out',
      scenario: 'disk',
      ask: 'Replace the disk with a ring of the same mass and radius. What happens to the angular acceleration?',
      apply(s) { s.shape = 'ring'; },
      watch: [{ id: 'alpha', label: 'the angular acceleration', get: (c) => c.alpha }],
      mode: 'dir',
      expect: { alpha: 'smaller' },
      why: String.raw`A ring has $I = mR^2$. A disk has half of that, because its mass is not all at the rim. The torque did not change, so $\alpha = \tau/I$ falls.`,
    },
    {
      id: 'rotor-force',
      scenario: 'disk',
      ask: 'Double the force, at the same angle. What happens to the torque and to the angular acceleration?',
      apply(s) { s.F *= 2; },
      watch: [
        { id: 'tau', label: 'the torque', get: (c) => c.tau, mode: 'factor' },
        { id: 'alpha', label: 'the angular acceleration', get: (c) => c.alpha, mode: 'factor' },
      ],
      expect: { tau: 2, alpha: 2 },
      why: String.raw`$\tau = rF\sin\phi$, so the torque doubles with the force. $I$ does not change, and $\alpha$ doubles with the torque.`,
    },
    {
      id: 'rotor-radius',
      scenario: 'disk',
      ask: 'Double the radius. Keep the same force. What happens to the angular acceleration?',
      apply(s) { s.R *= 2; },
      watch: [{ id: 'alpha', label: 'the angular acceleration', get: (c) => c.alpha, mode: 'factor' }],
      expect: { alpha: 0.5 },
      why: String.raw`The torque is $RF$, so it doubles. The disk's moment is $\frac12 mR^2$, so it becomes four times as large. $\alpha = \tau/I$ is cut in half.`,
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
    return `<div class="lab-block">${selectRow('ro-shape', 'Body', SHAPES, 'disk')}${sliderRow('ro-m', 'Mass (kg)', 2, 0.2, 80, 0.1)}${sliderRow('ro-F', 'Force (N)', 8, -80, 400, 0.5)}${sliderRow('ro-phi', 'Angle φ (°)', 90, 15, 165, 1)}${sliderRow('ro-w0', 'Starting ω (rad/s)', 0, -20, 1200, 0.1)}${sliderRow('ro-t', 'Time (s)', 1, 0.05, 40, 0.05)}<div id="ro-round">${sliderRow('ro-R', 'Radius (m)', 0.4, 0.04, 6, 0.01)}${sliderRow('ro-rider', 'Rider mass (kg)', 0, 0, 40, 0.5)}${sliderRow('ro-at', 'Rider distance (m)', 0.3, 0, 2, 0.05)}</div><div id="ro-rod">${sliderRow('ro-L', 'Rod length (m)', 1.2, 0.2, 3, 0.05)}</div></div>`;
  },
  bind(api) {
    bindSelect(api, 'ro-shape', (s, v) => { s.shape = v; });
    bindSlider(api, 'ro-m', (s, v) => { s.m = v; });
    bindSlider(api, 'ro-F', (s, v) => { s.F = v; });
    bindSlider(api, 'ro-phi', (s, v) => { s.phi = v; });
    bindSlider(api, 'ro-w0', (s, v) => { s.w0 = v; });
    bindSlider(api, 'ro-t', (s, v) => { s.t = v; });
    bindSlider(api, 'ro-R', (s, v) => { s.R = v; });
    bindSlider(api, 'ro-rider', (s, v) => { s.rider = v; });
    bindSlider(api, 'ro-at', (s, v) => { s.riderAt = v; });
    bindSlider(api, 'ro-L', (s, v) => { s.L = v; });
  },
  syncControls(state) {
    putSelect('ro-shape', state.shape);
    putSlider('ro-m', state.m, 2);
    putSlider('ro-F', state.F, 2);
    putSlider('ro-phi', state.phi, 0);
    putSlider('ro-w0', state.w0, 2);
    putSlider('ro-t', state.t, 2);
    putSlider('ro-R', state.R, 3);
    putSlider('ro-rider', state.rider, 1);
    putSlider('ro-at', state.riderAt, 2);
    putSlider('ro-L', state.L, 2);
    const round = document.getElementById('ro-round');
    const rod = document.getElementById('ro-rod');
    if (round) round.hidden = state.shape === 'rod';
    if (rod) rod.hidden = state.shape !== 'rod';
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const graph = createGraph(group, { x: -5.4, y: 1.35, w: 10.2, h: 2.5, color: QUANTITY_COLORS.v, name: 'ω (rad/s)', xName: 'time (s)', samples: 81 });
    const body = fatLine(new Array((N + 1) * 3).fill(0), { color: M.blue, width: 2.5 });
    const rodLine = fatLine(new Array(6).fill(0), { color: M.blue, width: 3 });
    const spoke = fatLine(new Array(6).fill(0), { color: M.blue, width: 2 });
    const rider = fatLine(new Array(15).fill(0), { color: M.gold, width: 2.5 });
    const force = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016);
    const speed = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.014);
    const name = label('F', 0, 0, 0, 'graph-axis');
    group.add(body, rodLine, spoke, rider, force, speed, name);
    group.visible = false;
    return { group, graph, body, rodLine, spoke, rider, force, speed, name };
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
    const samples = [];
    for (let i = 0; i <= 40; i += 1) samples.push(state.w0 + computed.alpha * state.t * (i / 40));
    const lo = Math.min(0, ...samples);
    const hi = Math.max(0, ...samples);
    h.graph.set({
      t0: 0,
      t1: Math.max(state.t, 0.05),
      lo: lo - Math.abs(hi - lo) * 0.12 - 0.2,
      hi: hi + Math.abs(hi - lo) * 0.12 + 0.2,
      f: (t) => state.w0 + computed.alpha * t,
      name: 'ω (rad/s)',
    });
    const cx = -0.2;
    const cy = -1.7;
    const rod = state.shape === 'rod';
    const rv = 1.15;
    h.body.visible = !rod;
    h.rodLine.visible = rod;
    h.spoke.visible = state.shape === 'disk';
    if (rod) {
      updateFatLine(h.rodLine, [cx - rv, cy, 0.02, cx + rv, cy, 0.02]);
    } else {
      updateFatLine(h.body, ring(cx, cy, rv));
      updateFatLine(h.spoke, [cx - rv, cy, 0.02, cx + rv, cy, 0.02]);
    }
    const tip = rod ? cx + rv : cx + rv;
    const sign = Math.sign(state.F || 1);
    placeArrow(h.force, tip, cy, tip, cy + sign * 1.15, 0.06);
    h.name.position.set(tip + 0.35, cy + sign * 0.7, 0);
    const vlen = Math.max(0.3, Math.min(1.4, Math.abs(computed.omega) / 20));
    placeArrow(h.speed, tip, cy + 0.15, tip - Math.sign(computed.omega || 1) * vlen, cy + 0.15, 0.05);
    const showRider = !rod && state.rider > 0;
    h.rider.visible = showRider;
    if (showRider) {
      const u = Math.min(0.95, state.riderAt / Math.max(state.R, 0.05));
      const x = cx + u * rv;
      updateFatLine(h.rider, [x - 0.12, cy - 0.12, 0.04, x + 0.12, cy - 0.12, 0.04, x + 0.12, cy + 0.12, 0.04, x - 0.12, cy + 0.12, 0.04, x - 0.12, cy - 0.12, 0.04]);
    }
  },
  law(state) {
    if (state.shape === 'rod') return [String.raw`\tau = LF\sin\phi`, String.raw`I = \tfrac13 mL^2`, String.raw`\alpha = \tau/I`];
    if (state.shape === 'ring') return [String.raw`\tau = RF\sin\phi`, String.raw`I = mR^2`, String.raw`\alpha = \tau/I`];
    return [String.raw`\tau = RF\sin\phi`, String.raw`I = \tfrac12 mR^2`, String.raw`\alpha = \tau/I`];
  },
  readoutCells(_state, computed) {
    return [
      ['Angular acceleration', `${fmt(computed.alpha)} rad/s²`],
      ['Angular velocity', `${fmt(computed.omega)} rad/s`],
      ['Torque', `${fmt(computed.tau)} N·m`],
      ['Moment of inertia', `${fmt(computed.I)} kg·m²`],
      ['Angle turned', `${fmt(computed.theta)} rad`],
      ['Revolutions', fmt(computed.revs)],
      ['Tangential acceleration', `${fmt(computed.at)} m/s²`],
      ['Centripetal acceleration', `${fmt(computed.ac)} m/s²`],
      ['Time to stop', `${fmt(computed.tStop)} s`],
    ];
  },
  coach(state, computed) {
    const far = state.shape === 'ring'
      ? 'Every bit of this ring sits at the rim, so I is twice a disk of the same mass and radius.'
      : 'A disk keeps mass in close to the axis. A ring of the same mass and radius has twice the moment, and half the angular acceleration, under the same torque.';
    return {
      title: 'Mass farther out resists more',
      body: [
        String.raw`The torque is $${fmt(computed.tau)}$ N·m and $I = ${fmt(computed.I)}$ kg·m², so $\alpha = ${fmt(computed.alpha)}$ rad/s².`,
        far,
        state.scenarioId === 'reel'
          ? 'These are the reel’s α, time, and radius from the example. The 2 kg is a disk that produces that α under a tangent force. The reel’s own mass is not given.'
          : 'Work by the torque equals the gain in rotational kinetic energy. The angle and the angular velocity follow the same rules as x and v, in radians.',
      ],
    };
  },
});

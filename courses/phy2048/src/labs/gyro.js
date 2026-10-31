/**
 * Shows that a spinning wheel on a pivot precesses at Ω = mgr / (Iω),
 * slower when the spin is faster.
 *
 * The closed form is that rate. The check turns the angular-momentum vector
 * by dL = τ dt and reads the angle it swept.
 */
import * as THREE from 'three';
import { inertiaDisk, precessionRate } from '@flux/subjects/mechanics/rotation.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { M, QUANTITY_COLORS, dot, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const base = { m: 0.3, R: 0.05, d: 0.05, rev: 20, g: 9.8 };
const SCENARIOS = [
  { ...base, id: 'book', name: 'A 0.30 kg disk, 20 rev/s, pivot 5.0 cm from the center' },
  { ...base, id: 'fast', name: 'The same gyroscope, spun twice as fast', rev: 40 },
  { ...base, id: 'earth', name: 'The same disk, with g = 9.81 m/s²', g: G },
];

function closed(state) {
  const I = inertiaDisk(state.m, state.R);
  const omega = state.rev * 2 * Math.PI;
  const pre = precessionRate({ mass: state.m, r: state.d, I, omega, g: state.g });
  return { I, omega, omegaP: pre.omegaP, period: pre.period, L: pre.L };
}

function stepped(state) {
  const exact = closed(state);
  const tau = state.m * state.g * state.d;
  const T = 0.25;
  const n = 6000;
  const dphi = (tau / exact.L) * (T / n);
  let Lx = exact.L;
  let Ly = 0;
  for (let i = 0; i < n; i += 1) {
    const c = Math.cos(dphi);
    const s = Math.sin(dphi);
    const nx = Lx * c - Ly * s;
    const ny = Lx * s + Ly * c;
    Lx = nx;
    Ly = ny;
  }
  const omegaP = Math.atan2(Ly, Lx) / T;
  return { ...exact, omegaP, period: (2 * Math.PI) / Math.abs(omegaP) };
}

export default defineLab({
  id: 'gyro',
  exam: 'u7',
  title: 'Gyroscope',
  hint: 'The wheel precesses because gravity torques it. A faster spin precesses more slowly.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'gyro-spin',
      scenario: 'book',
      ask: 'Double the spin of the disk. What happens to the precession rate?',
      apply(s) { s.rev *= 2; },
      watch: [{ id: 'omegaP', label: 'the precession rate', get: (c) => c.omegaP, mode: 'factor' }],
      expect: { omegaP: 0.5 },
      why: String.raw`$\Omega = mgr/(I\omega)$. The torque did not change. Doubling $\omega$ doubles $L$, so the precession rate is cut in half.`,
    },
    {
      id: 'gyro-mass',
      scenario: 'book',
      ask: 'Double the mass, and keep the spin in revolutions per second and the radii. What happens to the precession rate?',
      apply(s) { s.m *= 2; },
      watch: [{ id: 'omegaP', label: 'the precession rate', get: (c) => c.omegaP, mode: 'factor' }],
      expect: { omegaP: 1 },
      why: String.raw`The torque is $mgr$, so it doubles. A disk's $I$ also doubles with the mass, and $L = I\omega$ doubles. The ratio $\tau/L$ is unchanged.`,
    },
    {
      id: 'gyro-arm',
      scenario: 'book',
      ask: 'Double the distance from the pivot to the center of the disk. What happens to the precession rate?',
      apply(s) { s.d *= 2; },
      watch: [{ id: 'omegaP', label: 'the precession rate', get: (c) => c.omegaP, mode: 'factor' }],
      expect: { omegaP: 2 },
      why: String.raw`The torque is $mgr$. A longer lever arm doubles the torque. $I$ and $\omega$ stay as they were, so $\Omega$ doubles.`,
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
    return `<div class="lab-block">${sliderRow('gy-m', 'Disk mass (kg)', 0.3, 0.1, 2, 0.01)}${sliderRow('gy-R', 'Disk radius (m)', 0.05, 0.02, 0.3, 0.01)}${sliderRow('gy-d', 'Pivot to center (m)', 0.05, 0.02, 0.4, 0.01)}${sliderRow('gy-rev', 'Spin (rev/s)', 20, 2, 40, 1)}${sliderRow('gy-g', 'g (m/s²)', 9.8, 1.6, 12, 0.01)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'gy-m', (s, v) => { s.m = v; });
    bindSlider(api, 'gy-R', (s, v) => { s.R = v; });
    bindSlider(api, 'gy-d', (s, v) => { s.d = v; });
    bindSlider(api, 'gy-rev', (s, v) => { s.rev = v; });
    bindSlider(api, 'gy-g', (s, v) => { s.g = v; });
  },
  syncControls(state) {
    putSlider('gy-m', state.m, 2);
    putSlider('gy-R', state.R, 2);
    putSlider('gy-d', state.d, 2);
    putSlider('gy-rev', state.rev, 0);
    putSlider('gy-g', state.g, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const orbit = fatLine(new Array(49 * 3).fill(0), { color: M.grey, width: 1.5 });
    const disk = fatLine(new Array(33 * 3).fill(0), { color: M.blue, width: 2.5 });
    const shaft = fatLine(new Array(6).fill(0), { color: M.blue, width: 2 });
    const pivot = dot(QUANTITY_COLORS.mark, 0.12);
    const name = label('pivot', 0, 0, 0, 'graph-axis');
    group.add(orbit, shaft, disk, pivot, name);
    group.visible = false;
    return { group, orbit, shaft, disk, pivot, name };
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
  syncViews(_state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.disk) return;
    ctx.grid.visible = false;
    const R = 1.7;
    const pts = [];
    for (let i = 0; i <= 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      pts.push(R * Math.cos(a), R * Math.sin(a), 0.01);
    }
    updateFatLine(h.orbit, pts);
    const ang = 0.6;
    const x = R * Math.cos(ang);
    const y = R * Math.sin(ang);
    updateFatLine(h.shaft, [0, 0, 0.02, x, y, 0.02]);
    const disk = [];
    for (let i = 0; i <= 32; i += 1) {
      const a = (i / 32) * Math.PI * 2;
      disk.push(x + 0.45 * Math.cos(a), y + 0.45 * Math.sin(a), 0.03);
    }
    updateFatLine(h.disk, disk);
    h.pivot.position.set(0, 0, 0.04);
    h.name.position.set(0.35, -0.4, 0);
    void computed;
  },
  law: () => [String.raw`\Omega = \dfrac{mgr}{I\omega}`, String.raw`I = \tfrac12 mR^2`],
  readoutCells(_state, computed) {
    return [
      ['Precession rate', `${fmt(computed.omegaP)} rad/s`],
      ['Precession period', `${fmt(computed.period)} s`],
      ['Spin', `${fmt(computed.omega)} rad/s`],
      ['Angular momentum', `${fmt(computed.L)} kg·m²/s`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'Faster spin, slower precession',
      body: [
        String.raw`$\Omega = ${fmt(computed.omegaP)}$ rad/s, so one turn of the precession takes ${fmt(computed.period)} s.`,
        state.scenarioId === 'book'
          ? 'The book prints 3.12 rad/s and a period of 2.0 s, using g = 9.8 m/s² and ω = 125.66 rad/s.'
          : 'The torque is the weight times the distance from the pivot to the center. The pivot force itself has no torque about the pivot.',
      ],
    };
  },
});

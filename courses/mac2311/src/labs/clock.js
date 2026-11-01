/** Shows that a pendulum's finite-amplitude period exceeds the small-angle limit, and an infinite series needs an explicit truncation bound. */
import * as THREE from 'three';
import { G_STANDARD, RAD_PER_DEG } from '@flux/subjects/convert.js';
import { pendulumSeries } from '@flux/subjects/math/pendulum-series.js';
import { cells, kv } from '@flux/shells/math/shared.js';
import { fmtNum as fmt } from '@flux/shells/math/format.js';
import { defineLab } from './define.js';
const BASE_LENGTH = G_STANDARD * (4 / (2 * Math.PI)) ** 2;
const SCENARIOS = [
  { id: 'small', name: '4 s calibration · assumed 5° amplitude', angle: 5, L: BASE_LENGTH, n: 4 },
  { id: 'wide', name: 'Same effective length · assumed 90° amplitude', angle: 90, L: BASE_LENGTH, n: 4 },
  { id: 'slow', name: 'Near the upright limit · assumed 170°', angle: 170, L: BASE_LENGTH, n: 12 },
];
const seconds = (value) => String.raw`$${fmt(value)}\,\mathrm{s}$`;
const apply = (id, s) =>
  Object.assign(s, SCENARIOS.find((x) => x.id === id) || SCENARIOS[0], { scenarioId: id, show: {} });
export default defineLab({
  id: 'clock',
  exam: 'c6',
  title: 'Pendulum clock',
  frame: false,
  orbit: false,
  cameraFor(s) {
    const base = typeof window !== 'undefined' && window.innerWidth <= 720 ? 25 : 16;
    const z = base * Math.max(1, s.L / BASE_LENGTH);
    return { pos: new THREE.Vector3(0, 1, z), target: new THREE.Vector3(0, 1, 0) };
  },
  hint: 'Turning point in schematic drawing units. Readouts use SI; length is the effective point-mass length.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('small', s);
    return s;
  },
  applyScenario: apply,
  controls: () =>
    `<div class="lab-block"><label class="field"><span>Amplitude (degrees)</span><div class="slider-row"><input id="clock-angle" type="range" min="0" max="170" step="1"></div></label><label class="field"><span>Series terms</span><div class="slider-row"><input id="clock-n" type="range" min="1" max="40" step="1"></div></label><label class="field"><span>Effective length / calibrated length</span><div class="slider-row"><input id="clock-length" type="range" min="0.25" max="2" step="0.05"></div></label></div>`,
  bind(api) {
    for (const k of ['angle', 'n'])
      document.getElementById('clock-' + k).addEventListener('input', (e) => {
        api.slice()[k] = Number(e.target.value);
        api.bump();
      });
    document.getElementById('clock-length').addEventListener('input', (e) => {
      api.slice().L = BASE_LENGTH * Number(e.target.value);
      api.fitView?.();
    });
  },
  syncControls(s) {
    for (const k of ['angle', 'n']) document.getElementById('clock-' + k).value = s[k];
    document.getElementById('clock-length').value = s.L / BASE_LENGTH;
  },
  recompute(s, c) {
    Object.assign(c, pendulumSeries(s.L, s.angle * RAD_PER_DEG, s.n));
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(0.65, 48),
      new THREE.MeshBasicMaterial({ color: 0x15343c, side: THREE.DoubleSide }),
    );
    face.position.y = 1.9;
    group.add(face);
    const hand = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 2.3, 0.02),
        new THREE.Vector3(0, 1.9, 0.02),
        new THREE.Vector3(0.35, 1.7, 0.02),
      ]),
      new THREE.LineBasicMaterial({ color: 0xcccccc }),
    );
    group.add(hand);
    const rod = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1.4, 0)]),
      new THREE.LineBasicMaterial({ color: 0xf4d345 }),
    );
    group.add(rod);
    const bob = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 32),
      new THREE.MeshBasicMaterial({ color: 0xf4d345 }),
    );
    bob.position.z = 0.04;
    group.add(bob);
    const guide = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 65 }, (_, i) => {
          const a = -Math.PI + (2 * Math.PI * i) / 64;
          return new THREE.Vector3(2.4 * Math.sin(a), 1 - 2.4 * Math.cos(a), -0.02);
        }),
      ),
      new THREE.LineBasicMaterial({ color: 0x58c4dd, transparent: true, opacity: 0.35 }),
    );
    group.add(guide);
    return { group, rod, bob, guide };
  },
  enter(ctx, h) {
    h.group.visible = true;
  },
  exit(ctx, h) {
    h.group.visible = false;
  },
  syncViews(s, c, ctx) {
    const h = ctx.handle,
      a = s.angle * RAD_PER_DEG,
      length = (2.4 * s.L) / BASE_LENGTH,
      x = length * Math.sin(a),
      y = 1 - length * Math.cos(a);
    h.guide.geometry.setFromPoints(
      Array.from({ length: 65 }, (_, i) => {
        const a = -Math.PI + (2 * Math.PI * i) / 64;
        return new THREE.Vector3(length * Math.sin(a), 1 - length * Math.cos(a), -0.02);
      }),
    );
    h.rod.geometry.setFromPoints([new THREE.Vector3(0, 1, 0), new THREE.Vector3(x, y, 0)]);
    h.bob.position.set(x, y, 0.04);
  },
  law: () => [
    String.raw`T=4\sqrt{L/g}\,K(k),\quad k=\sin(\theta_0/2)`,
    String.raw`\frac{T}{T_0}=\sum_{j=0}^{\infty}c_jm^j,\quad m=k^2`,
    String.raw`c_0=1,\quad c_j/c_{j-1}=((2j-1)/(2j))^2`,
  ],
  liveRows: (s, c) =>
    kv('effective L', `${fmt(s.L)} m`) +
    kv('small-angle T₀', seconds(c.T0)) +
    kv('nonlinear period', seconds(c.period)) +
    kv('series approximation', seconds(c.series)) +
    kv('error bound', seconds(c.tailBound)) +
    kv('slow-clock loss', `${fmt(c.lossPerDay)} s/day`),
  readout: (s, c) =>
    cells([
      ['period', seconds(c.period)],
      ['series', seconds(c.series)],
      ['actual error', seconds(c.error)],
      ['error bound', seconds(c.tailBound)],
    ]),
  coach: () => ({
    title: 'Finite amplitude is a correction, not a new constant',
    body: [
      'Energy gives an elliptic integral for one full period. The lab evaluates it by the arithmetic-geometric mean. A positive power series approaches it from below; a geometric majorant bounds the omitted tail. Near the upright position the series converges slowly. More terms improve the calculation without changing the pendulum.',
      'Parliament lists a 2 s beat and 4.4 m overall pendulum length for the Great Clock. A beat is half a cycle: the reference full period is 4 s. We calibrate an equivalent point-mass length from T₀=4 s using standard gravity 9.80665 m/s²; this inferred length is not the published overall length. Amplitudes are teaching assumptions. <a href="https://www.parliament.uk/about/living-heritage/building/palace/big-ben/facts-figures/great-clock-facts/" target="_blank" rel="noopener">Official clock facts</a>. <a href="https://dlmf.nist.gov/19.2" target="_blank" rel="noopener">Integral definition</a>; <a href="https://dlmf.nist.gov/19.5" target="_blank" rel="noopener">series</a>.',
      '<b>What the course model leaves out.</b> A real clock has a distributed pendulum, escapement, damping, temperature compensation and local gravity. This is a calibrated point-mass model, not a timing prediction for the actual Great Clock. The drawing shows a turning point and scales the rod with effective length; the clock face is schematic. Clock loss assumes a mechanism calibrated to the small-angle period.',
    ],
  }),
});

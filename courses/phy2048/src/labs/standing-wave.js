/**
 * Shows nodes and antinodes on a string fixed at both ends, and f_n = nv/(2L).
 * Doubling the amplitude multiplies the power by four.
 *
 * The closed form is the mode sum. The check is a finite-difference period, read
 * from an antinode's zero crossings.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  modeFrequency, standingPeriodFromCrossings, wavePower, waveSpeed,
} from '@flux/subjects/mechanics/waves.js';
import {
  M, QUANTITY_COLORS, createGraph, dot, fatLine, label, updateFatLine,
} from '../scene/kit.js';
import {
  bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow,
} from './define.js';

const N = 121;
const base = { L: 2, mu: 0.006, m: 2, n: 1, A: 0.02, cycles: 0 };
const SCENARIOS = [
  { ...base, id: 'book', name: '2.00 m, a 2.00 kg hanger, the fundamental' },
  { ...base, id: 'second', name: 'The second mode', n: 2 },
  { ...base, id: 'third', name: 'The third mode', n: 3 },
];

function fields(state) {
  const tension = state.m * G;
  const v = waveSpeed(tension, state.mu);
  const n = state.n;
  const f = modeFrequency(n, v, state.L);
  const omega = 2 * Math.PI * f;
  const T = 1 / f;
  const t = state.cycles * T;
  const k = (n * Math.PI) / state.L;
  const mid = state.L / (2 * n);
  const y = state.A * Math.sin(k * mid) * Math.cos(omega * t);
  return {
    v, f, f1: modeFrequency(1, v, state.L), T, omega, k, t, tension,
    y, lambda: (2 * state.L) / n,
    P: wavePower({ mu: state.mu, A: state.A, omega, v }),
  };
}

export default defineLab({
  id: 'standing-wave',
  exam: 'u12',
  title: 'Standing wave',
  hint: 'A string fixed at both ends holds only the shapes with a node at each end. The frequencies are whole multiples of the lowest one.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 11.6, h: 9.2 },
  camera: { pos: new THREE.Vector3(0.1, 0.1, 18), target: new THREE.Vector3(0.1, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'stand-power',
      scenario: 'book',
      ask: 'Double the amplitude and keep the tension. What happens to the average power?',
      apply(s) { s.A *= 2; },
      watch: [{ id: 'P', label: 'the average power', get: (c) => c.P }],
      mode: 'factor',
      factors: [8, 4, 2, 1],
      expect: { P: 4 },
      why: 'The average power is ½μA²ω²v. The amplitude is squared. Twice the swing is four times the power.',
    },
    {
      id: 'stand-length',
      scenario: 'book',
      ask: 'Use half the length, the same hanger, still the fundamental. What happens to the frequency?',
      apply(s) { s.L *= 0.5; },
      watch: [{ id: 'f', label: 'the frequency', get: (c) => c.f }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { f: 2 },
      why: 'f₁ = v/(2L). Half the length doubles the fundamental. The speed did not change.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('book', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true } });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="sw-play">Play</button>${sliderRow('sw-L', 'Length (m)', 2, 0.5, 4, 0.1)}${sliderRow('sw-m', 'Hanging mass (kg)', 2, 0.4, 8, 0.1)}${sliderRow('sw-mu', 'Mass per length (g/m)', 6, 1, 20, 0.5)}${selectRow('sw-n', 'Mode', [['1', 'Fundamental'], ['2', 'Second'], ['3', 'Third']], '1')}${sliderRow('sw-A', 'Amplitude (cm)', 2, 0.5, 8, 0.1)}${sliderRow('sw-c', 'Cycles', 0, 0, 2, 0.01)}</div>`;
  },
  bind(api) {
    document.getElementById('sw-play').addEventListener('click', () => api.toggleSweep());
    bindSlider(api, 'sw-L', (s, v) => { s.L = v; });
    bindSlider(api, 'sw-m', (s, v) => { s.m = v; });
    bindSlider(api, 'sw-mu', (s, v) => { s.mu = v / 1000; });
    bindSelect(api, 'sw-n', (s, v) => { s.n = Number(v); });
    bindSlider(api, 'sw-A', (s, v) => { s.A = v / 100; });
    bindSlider(api, 'sw-c', (s, v) => { s.cycles = v; });
  },
  syncControls(state) {
    const play = document.getElementById('sw-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putSlider('sw-L', state.L, 2);
    putSlider('sw-m', state.m, 2);
    putSlider('sw-mu', state.mu * 1000, 2);
    putSelect('sw-n', String(state.n));
    putSlider('sw-A', state.A * 100, 2);
    putSlider('sw-c', state.cycles, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const posts = fatLine([-4.4, -0.4, 0, -4.4, 1.7, 0, 3.6, 1.7, 0, 3.6, -0.4, 0], { color: M.grey, width: 2.5 });
    const cord = fatLine([3.6, 1.7, 0, 3.6, 0.15, 0], { color: M.greyDark, width: 1.6 });
    const mass = fatLine([3.35, -0.15, 0, 3.85, -0.15, 0, 3.85, -0.7, 0, 3.35, -0.7, 0, 3.35, -0.15, 0], { color: M.blue, width: 3 });
    const rope = fatLine(new Array(N * 3).fill(0), { color: M.gold, width: 3.5 });
    const nodes = [0, 1].map(() => dot(M.yellow, 0.08));
    const massName = label('hanger', 4.15, -0.42, 0, 'graph-axis');
    const graph = createGraph(group, {
      x: -4.5, y: -3.7, w: 7.6, h: 2.05, color: QUANTITY_COLORS.x, samples: 121,
      name: 'antinode (m)', xName: 'time (s)',
    });
    group.add(posts, cord, mass, rope, massName, ...nodes);
    group.visible = false;
    return { group, rope, nodes, graph };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.L = Math.max(state.L, 0.2);
    state.mu = Math.max(state.mu, 1e-4);
    state.m = Math.max(state.m, 0.05);
    state.n = Math.min(3, Math.max(1, Math.round(state.n)));
    state.A = Math.max(state.A, 1e-4);
    Object.assign(computed, fields(state));
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.cycles = (state.cycles + dt) % 2;
    return true;
  },
  second(state) {
    const tension = state.m * G;
    const v = waveSpeed(tension, state.mu);
    const got = standingPeriodFromCrossings({
      tension, mu: state.mu, length: state.L, mode: state.n,
    });
    const expect = 1 / modeFrequency(state.n, v, state.L);
    if (!(Math.abs(got - expect) <= 0.004 * expect)) return { v: NaN };
    const row = fields(state);
    return { v: row.v, f: row.f, f1: row.f1, lambda: row.lambda, P: row.P, y: row.y };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.rope) return;
    ctx.grid.visible = false;
    const gain = 1.05 / Math.max(state.A, 1e-3);
    const x0 = -4.4;
    const x1 = 3.6;
    const pts = new Array(N * 3);
    for (let i = 0; i < N; i += 1) {
      const x = (i / (N - 1)) * state.L;
      const y = state.A * Math.sin(computed.k * x) * Math.cos(computed.omega * computed.t);
      pts[i * 3] = x0 + (i / (N - 1)) * (x1 - x0);
      pts[i * 3 + 1] = 1.7 + y * gain;
      pts[i * 3 + 2] = 0.02;
    }
    updateFatLine(h.rope, pts);
    for (let i = 0; i < 2; i += 1) {
      const show = i < state.n - 1;
      h.nodes[i].visible = show;
      if (!show) continue;
      const frac = (i + 1) / state.n;
      h.nodes[i].position.set(x0 + frac * (x1 - x0), 1.7, 0.06);
    }
    const t1 = computed.T;
    h.graph.set({
      t0: 0,
      t1,
      lo: -state.A * 1.25,
      hi: state.A * 1.25,
      f: (time) => state.A * Math.sin(computed.k * (state.L / (2 * state.n))) * Math.cos(computed.omega * time),
    });
    h.graph.mark(computed.t % t1, computed.y);
  },
  law() {
    return [
      String.raw`v = \sqrt{mg/\mu}`,
      String.raw`f_n = n v/(2L)`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Wave speed', `${fmt(computed.v)} m/s`],
      ['This mode', `${fmt(computed.f)} Hz`],
      ['Fundamental', `${fmt(computed.f1)} Hz`],
      ['Wavelength', `${fmt(computed.lambda)} m`],
      ['Antinode now', `${fmt(computed.y)} m`],
      ['Average power', `${fmt(computed.P)} W`],
    ];
  },
  coach(state, computed) {
    return {
      title: state.n === 1 ? 'Half a wavelength fits' : `${state.n} half-wavelengths fit`,
      body: String.raw`The hanger weighs $${fmt(computed.tension)}$ N, so the wave speed is $${fmt(computed.v)}$ m/s. Mode $${state.n}$ has wavelength $${fmt(computed.lambda)}$ m and frequency $${fmt(computed.f)}$ Hz. A node sits at each end, and at any interior mark. The picture is one cycle per second, slower than the real string, and the height is stretched. The plot is the true antinode. Doubling that height would multiply the power by four.`,
    };
  },
});

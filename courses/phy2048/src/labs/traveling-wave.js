/**
 * Shows that the speed is set by the rope, v = √(F/μ), not by the frequency or the
 * amplitude, and that a point of the rope only moves up and down.
 *
 * The closed form is v = √(F/μ) and y = A sin(kx − ωt). The check is a finite-difference
 * pulse: its peak must travel at that speed.
 */
import * as THREE from 'three';
import {
  pulseSpeed, travelingWave, wavePower, waveSpeed,
} from '@flux/subjects/mechanics/waves.js';
import {
  M, QUANTITY_COLORS, createGraph, dot, fatLine, label, updateFatLine,
} from '../scene/kit.js';
import {
  bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow,
} from './define.js';

const N = 81;
const VIEW = 8;
const base = { tension: 5, mu: 0.2, f: 2, A: 0.2, probe: 2.5, cycles: 0 };
const SCENARIOS = [
  { ...base, id: 'rope', name: 'A 30 m rope: the wave takes 6.00 s' },
  { ...base, id: 'tight', name: 'Four times the tension', tension: 20 },
  { ...base, id: 'formula', name: 'y = 0.200 sin(6.28x − 1.57t)', tension: 0.0125, mu: 0.2, f: 0.25, A: 0.2, probe: 0.6 },
];

function fields(state) {
  const v = waveSpeed(state.tension, state.mu);
  const T = 1 / state.f;
  const lambda = v * T;
  const omega = (2 * Math.PI) / T;
  const k = omega / v;
  const t = state.cycles * T;
  const here = travelingWave({ A: state.A, k, omega, x: state.probe, t });
  return {
    v, T, lambda, omega, k, t,
    y: here.y,
    vy: here.vy,
    vmax: state.A * omega,
    P: wavePower({ mu: state.mu, A: state.A, omega, v }),
  };
}

function stringPoints(c, gain) {
  const out = new Array(N * 3);
  for (let i = 0; i < N; i += 1) {
    const x = (i / (N - 1)) * VIEW;
    const y = travelingWave({ A: c.A, k: c.k, omega: c.omega, x, t: c.t }).y;
    out[i * 3] = -4.6 + (x / VIEW) * 8.4;
    out[i * 3 + 1] = 1.15 + y * gain;
    out[i * 3 + 2] = 0;
  }
  return out;
}

export default defineLab({
  id: 'traveling-wave',
  exam: 'u12',
  title: 'Traveling wave',
  hint: 'The rope’s tension and its mass per length set the speed. Shaking faster changes the wavelength, not the speed.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 11.4, h: 9 },
  camera: { pos: new THREE.Vector3(0, 0.15, 18), target: new THREE.Vector3(0, 0.15, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'wave-tension',
      scenario: 'rope',
      ask: 'Quadruple the tension and keep the rope. What happens to the wave speed?',
      apply(s) { s.tension *= 4; },
      watch: [{ id: 'v', label: 'the wave speed', get: (c) => c.v }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { v: 2 },
      why: 'v = √(F/μ). Four times the tension is twice the speed. The frequency was not in it.',
    },
    {
      id: 'wave-frequency',
      scenario: 'rope',
      ask: 'Shake the end twice as fast, at the same tension. What happens to the wave speed?',
      apply(s) { s.f *= 2; },
      watch: [{ id: 'v', label: 'the wave speed', get: (c) => c.v }],
      mode: 'factor',
      factors: [2, 1, 0.5, 0.25],
      expect: { v: 1 },
      why: 'The speed is a property of the rope. Twice the frequency cuts the wavelength in half, and v = fλ stays put.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('rope', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true } });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="tw-play">Play</button>${logSliderRow('tw-F', 'Tension (N)', 5, 1e-4, 400)}${logSliderRow('tw-mu', 'Mass per length (kg/m)', 0.2, 1e-3, 2)}${sliderRow('tw-f', 'Frequency (Hz)', 2, 0.1, 80, 0.1)}${sliderRow('tw-A', 'Amplitude (m)', 0.2, 0.01, 0.4, 0.01)}${sliderRow('tw-x', 'Watch this point (m)', 2.5, 0, 8, 0.1)}${sliderRow('tw-c', 'Cycles', 0, 0, 2, 0.01)}</div>`;
  },
  bind(api) {
    document.getElementById('tw-play').addEventListener('click', () => api.toggleSweep());
    bindLogSlider(api, 'tw-F', (s, v) => { s.tension = v; });
    bindLogSlider(api, 'tw-mu', (s, v) => { s.mu = v; });
    bindSlider(api, 'tw-f', (s, v) => { s.f = v; });
    bindSlider(api, 'tw-A', (s, v) => { s.A = v; });
    bindSlider(api, 'tw-x', (s, v) => { s.probe = v; });
    bindSlider(api, 'tw-c', (s, v) => { s.cycles = v; });
  },
  syncControls(state) {
    const play = document.getElementById('tw-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putLogSlider('tw-F', state.tension);
    putLogSlider('tw-mu', state.mu);
    putSlider('tw-f', state.f, 2);
    putSlider('tw-A', state.A, 3);
    putSlider('tw-x', state.probe, 2);
    putSlider('tw-c', state.cycles, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const hand = fatLine([-4.85, 0.7, 0, -4.85, 1.6, 0], { color: M.grey, width: 3 });
    const rope = fatLine(new Array(N * 3).fill(0), { color: M.gold, width: 3.5 });
    const bead = dot(M.blue, 0.12);
    const name = label('a point of the rope', 0, 0, 0, 'graph-axis');
    const graph = createGraph(group, {
      x: -4.6, y: -3.55, w: 9.2, h: 2.2, color: QUANTITY_COLORS.x, samples: 121,
      name: 'height (m)', xName: 'time (s)',
    });
    group.add(hand, rope, bead, name);
    group.visible = false;
    return { group, rope, bead, name, graph };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.tension = Math.max(state.tension, 1e-6);
    state.mu = Math.max(state.mu, 1e-6);
    state.f = Math.max(state.f, 0.05);
    state.A = Math.max(state.A, 1e-4);
    state.probe = Math.min(Math.max(state.probe, 0), VIEW);
    state.cycles = Math.min(Math.max(state.cycles, 0), 2);
    Object.assign(computed, fields(state), { A: state.A });
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.cycles = (state.cycles + dt) % 2;
    return true;
  },
  second(state) {
    const v = waveSpeed(state.tension, state.mu);
    const got = pulseSpeed({ tension: state.tension, mu: state.mu });
    if (!(Math.abs(got - v) <= 0.02 * v)) return { v: NaN };
    const row = fields(state);
    return { v: row.v, T: row.T, lambda: row.lambda, y: row.y, vy: row.vy, P: row.P };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.rope) return;
    ctx.grid.visible = false;
    const gain = 1.15 / Math.max(state.A, 1e-3);
    updateFatLine(h.rope, stringPoints(computed, gain));
    const xDraw = -4.6 + (state.probe / VIEW) * 8.4;
    const yDraw = 1.15 + computed.y * gain;
    h.bead.position.set(xDraw, yDraw, 0.05);
    h.name.position.set(xDraw, yDraw + 0.38, 0);
    const t1 = computed.T;
    h.graph.set({
      t0: 0,
      t1,
      lo: -state.A * 1.25,
      hi: state.A * 1.25,
      f: (time) => travelingWave({
        A: state.A, k: computed.k, omega: computed.omega, x: state.probe, t: time,
      }).y,
    });
    h.graph.mark(computed.t % t1, computed.y);
  },
  law() {
    return [
      String.raw`v = \sqrt{F/\mu}`,
      String.raw`y = A\sin(kx - \omega t)`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Wave speed', `${fmt(computed.v)} m/s`],
      ['Wavelength', `${fmt(computed.lambda)} m`],
      ['Period', `${fmt(computed.T)} s`],
      ['Height at the point', `${fmt(computed.y)} m`],
      ['Particle speed there', `${fmt(computed.vy)} m/s`],
      ['Average power', `${fmt(computed.P)} W`],
    ];
  },
  coach(state, computed) {
    const across = Math.abs(computed.vy) > 0.2 * computed.vmax;
    return {
      title: across ? 'The point moves across, not along' : 'The wave passes, the rope stays',
      body: String.raw`The speed is $${fmt(computed.v)}$ m/s, from the tension and the mass per length. The wavelength is $${fmt(computed.lambda)}$ m. At the watched point the rope is $${fmt(computed.y)}$ m from rest and its transverse speed is $${fmt(computed.vy)}$ m/s. The fastest that point ever goes is $${fmt(computed.vmax)}$ m/s, which is not the wave speed. The picture stretches the height so the wave can be seen. The plot under it is the true height.`,
    };
  },
});

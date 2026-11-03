/**
 * Shows a driven oscillator’s steady amplitude, a peak near the natural frequency,
 * and the phase lag that passes through π/2 there. A free ring-down is on the same page.
 *
 * The closed form is A = F₀ / √(m²(ω₀² − ω²)² + b²ω²). The check integrates to steady
 * state and reads the late peak.
 */
import * as THREE from 'three';
import {
  amplitudePeakOmega, drivenAmplitude, drivenLag, drivenSteadyAmplitude, resonanceAmplitude,
  springOmega, underdampedMotion,
} from '@flux/subjects/mechanics/oscillation.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const base = { m: 1, k: 100, b: 0.5, F0: 2, omega: 10, A0: 0.05, t: 0.4 };
const SCENARIOS = [
  { ...base, id: 'light', name: 'Light damping, driven at ω₀' },
  { ...base, id: 'heavy', name: 'Heavier damping, still at ω₀', b: 2 },
  { ...base, id: 'half', name: 'The same oscillator, driven at ω₀/2', omega: 5 },
];

function closed(state) {
  const omega0 = springOmega(state.m, state.k);
  const A = drivenAmplitude({
    F0: state.F0, mass: state.m, k: state.k, b: state.b, omega: state.omega,
  });
  const lag = drivenLag(state.m, state.k, state.b, state.omega);
  const ring = underdampedMotion({
    A0: state.A0, mass: state.m, k: state.k, b: state.b, t: state.t,
  });
  return {
    omega0,
    A,
    lag,
    Amax: resonanceAmplitude(state.F0, state.b, omega0),
    peak: amplitudePeakOmega(state.m, state.k, state.b),
    envelope: ring.envelope,
    omegaD: ring.omega,
    x: ring.x,
    drivenX: A * Math.sin(state.omega * state.t - lag),
  };
}

function coil(x0, x1) {
  const pts = [];
  const segs = 16;
  for (let i = 0; i <= segs; i += 1) {
    const along = x0 + ((x1 - x0) * i) / segs;
    const side = i === 0 || i === segs ? 0 : (i % 2 === 0 ? 0.22 : -0.22);
    pts.push(along, side, 0);
  }
  return pts;
}

function box(cx) {
  return [cx - 0.35, -0.35, 0, cx + 0.35, -0.35, 0, cx + 0.35, 0.35, 0, cx - 0.35, 0.35, 0, cx - 0.35, -0.35, 0];
}

export default defineLab({
  id: 'resonance',
  exam: 'u11',
  title: 'Resonance',
  hint: 'The steady swing is tallest near the natural frequency, and taller when the damping is lighter. The lag there is a quarter cycle.',
  orbit: false,
  fit: { w: 12, h: 8 },
  camera: { pos: new THREE.Vector3(0, 0.3, 18), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'damp-half',
      scenario: 'light',
      ask: 'Double the damping while driving at the natural frequency. What happens to the steady amplitude?',
      apply(s) { s.b *= 2; },
      watch: [{ id: 'A', label: 'the steady amplitude', get: (c) => c.A }],
      mode: 'factor',
      factors: [2, 1, 0.5, 0.25],
      expect: { A: 0.5 },
      why: 'On resonance, A = F₀/(b ω₀). Twice the damping halves the amplitude. Off resonance the factor is not exactly one half.',
    },
    {
      id: 'drive-peak',
      scenario: 'half',
      ask: 'Drive at the natural frequency instead of at half of it. What happens to the steady amplitude?',
      apply(s) { s.omega = Math.sqrt(s.k / s.m); },
      watch: [{ id: 'A', label: 'the steady amplitude', get: (c) => c.A }],
      mode: 'dir',
      expect: { A: 'bigger' },
      why: 'Half the natural frequency is far from the peak. Moving the drive onto ω₀ raises the steady amplitude.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('light', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('rs-w', 'Drive ω (rad/s)', 10, 1, 30, 0.1)}${sliderRow('rs-b', 'Damping b (kg/s)', 0.5, 0.2, 4, 0.1)}${sliderRow('rs-F', 'Drive amplitude (N)', 2, 0.5, 6, 0.1)}${sliderRow('rs-m', 'Mass (kg)', 1, 0.4, 3, 0.1)}${sliderRow('rs-k', 'Spring constant (N/m)', 100, 40, 200, 1)}${sliderRow('rs-t', 'Time (s)', 0.4, 0, 2, 0.01)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'rs-w', (s, v) => { s.omega = v; });
    bindSlider(api, 'rs-b', (s, v) => { s.b = v; });
    bindSlider(api, 'rs-F', (s, v) => { s.F0 = v; });
    bindSlider(api, 'rs-m', (s, v) => { s.m = v; });
    bindSlider(api, 'rs-k', (s, v) => { s.k = v; });
    bindSlider(api, 'rs-t', (s, v) => { s.t = v; });
  },
  syncControls(state) {
    putSlider('rs-w', state.omega, 2);
    putSlider('rs-b', state.b, 2);
    putSlider('rs-F', state.F0, 2);
    putSlider('rs-m', state.m, 2);
    putSlider('rs-k', state.k, 1);
    putSlider('rs-t', state.t, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const wall = fatLine([-3.4, -0.7, 0, -3.4, 0.7, 0], { color: M.grey, width: 6 });
    const spring = fatLine(coil(-3.4, -0.4), { color: M.gold, width: 3 });
    const block = fatLine(box(0), { color: M.blue, width: 4 });
    const drive = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.a, undefined, undefined, 0.014);
    const name = label('driven', 0, -2.4, 0, 'graph-axis');
    group.add(wall, spring, block, drive, name);
    group.visible = false;
    return { group, wall, spring, block, drive, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.m = Math.max(state.m, 0.05);
    state.k = Math.max(state.k, 1);
    state.b = Math.min(Math.max(state.b, 0.05), 0.85 * 2 * Math.sqrt(state.m * state.k));
    state.F0 = Math.max(state.F0, 1e-4);
    state.omega = Math.max(state.omega, 0.2);
    state.A0 = Math.max(state.A0, 1e-4);
    state.t = Math.max(state.t, 0);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const omega0 = Math.sqrt(state.k / state.m);
    const A = drivenAmplitude({
      F0: state.F0, mass: state.m, k: state.k, b: state.b, omega: state.omega,
    });
    const steady = drivenSteadyAmplitude({
      mass: state.m, k: state.k, b: state.b, F0: state.F0, omega: state.omega,
    });
    if (!(Math.abs(steady - A) <= 2e-3 * Math.max(1, Math.abs(A)))) return { A: NaN };
    const lag = drivenLag(state.m, state.k, state.b, state.omega);
    const gamma = state.b / (2 * state.m);
    const inside = state.k / state.m - gamma * gamma;
    const omegaD = Math.sqrt(inside);
    const envelope = state.A0 * Math.exp(-gamma * state.t);
    return {
      omega0,
      A,
      lag,
      Amax: state.F0 / (state.b * omega0),
      peak: amplitudePeakOmega(state.m, state.k, state.b),
      envelope,
      omegaD,
      x: envelope * Math.cos(omegaD * state.t),
      drivenX: A * Math.sin(state.omega * state.t - lag),
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.spring) return;
    ctx.grid.visible = false;
    const gain = 1.4 / Math.max(computed.A, 0.05);
    const end = -0.3 + computed.drivenX * gain;
    updateFatLine(h.spring, coil(-3.4, end - 0.4));
    updateFatLine(h.block, box(end));
    const push = 0.4 + 0.7 * Math.min(state.F0, 6) / 6;
    placeArrow(h.drive, end + 0.55, 0, end + 0.55 + push, 0, 0.06);
    h.name.element.textContent = Math.abs(state.omega - computed.omega0) < 0.15 * computed.omega0 ? 'on resonance' : 'off resonance';
  },
  law() {
    return [
      String.raw`A = \dfrac{F_0}{\sqrt{m^{2}(\omega_0^{2}-\omega^{2})^{2} + b^{2}\omega^{2}}}`,
      String.raw`A(\omega_0) = \dfrac{F_0}{b\,\omega_0}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Steady amplitude', `${fmt(computed.A)} m`],
      ['Phase lag', `${fmt(computed.lag)} rad`],
      ['Natural frequency', `${fmt(computed.omega0)} rad/s`],
      ['Amplitude at ω₀', `${fmt(computed.Amax)} m`],
      ['True peak of A(ω)', `${fmt(computed.peak)} rad/s`],
      ['Free envelope now', `${fmt(computed.envelope)} m`],
      ['Damped ω', `${fmt(computed.omegaD)} rad/s`],
    ];
  },
  coach(state, computed) {
    return {
      title: 'The peak sits near the natural frequency',
      body: [
        String.raw`Driving at $${fmt(state.omega)}$ rad/s gives a steady amplitude $${fmt(computed.A)}$ m and a lag of $${fmt(computed.lag)}$ rad. At $$\omega_0$$ the book’s amplitude is $${fmt(computed.Amax)}$ m. The true peak of this formula is at $${fmt(computed.peak)}$ rad/s, a little under $$\omega_0$$ when the damping is not tiny.`,
        String.raw`Left alone, an amplitude $${fmt(state.A0)}$ m has shrunk to $${fmt(computed.envelope)}$ m by $${fmt(state.t)}$ s, and the oscillation is at $${fmt(computed.omegaD)}$ rad/s rather than $$\omega_0$$.`,
      ],
    };
  },
});

/**
 * A six-string guitar's high E and low E. Shows why a heavier string needs a
 * different tension for the same wave speed, and why the pitch follows √(F/μ).
 *
 * Numbers: OpenStax University Physics Vol. 1 §16.3. High E, μ = 3.09×10⁻⁴ kg/m
 * at 56.40 N, prints 427.23 m/s. Low E, μ = 5.78×10⁻³ kg/m, prints 1055 N for
 * that same speed. The open pitches 329.63 Hz and 82.41 Hz are the section's.
 * The scale length is v/(2f) from those two high-E figures.
 *
 * The closed form is v = √(F/μ) and f = v/(2L). The check is the finite-difference
 * period of the open string.
 */
import * as THREE from 'three';
import {
  lengthFromPitch, modeFrequency, standingPeriodFromCrossings, tensionForSpeed, waveSpeed,
} from '@flux/subjects/mechanics/waves.js';
import {
  M, QUANTITY_COLORS, createGraph, fatLine, label, updateFatLine,
} from '../scene/kit.js';
import {
  bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow,
} from './define.js';

const HIGH_MU = 3.09e-4;
const LOW_MU = 5.78e-3;
const HIGH_T = 56.4;
const HIGH_PITCH = 329.63;
const LOW_PITCH = 82.41;
const SCALE = lengthFromPitch(waveSpeed(HIGH_T, HIGH_MU), HIGH_PITCH);
const N = 81;

const high = { mu: HIGH_MU, tension: HIGH_T, length: SCALE, pitch: HIGH_PITCH };
const SCENARIOS = [
  { ...high, id: 'high', name: 'High E at 56.40 N' },
  {
    ...high,
    id: 'same',
    name: 'Low E at the high-E speed',
    mu: LOW_MU,
    tension: tensionForSpeed(LOW_MU, waveSpeed(HIGH_T, HIGH_MU)),
    pitch: HIGH_PITCH,
  },
  {
    ...high,
    id: 'tuned',
    name: 'Low E at 82.41 Hz',
    mu: LOW_MU,
    tension: tensionForSpeed(LOW_MU, 2 * SCALE * LOW_PITCH),
    pitch: LOW_PITCH,
  },
];

function fields(state) {
  const v = waveSpeed(state.tension, state.mu);
  const f = modeFrequency(1, v, state.length);
  const T = 1 / f;
  const t = state.cycles * T;
  const k = Math.PI / state.length;
  const y = 0.002 * Math.sin(k * state.length / 2) * Math.cos(2 * Math.PI * f * t);
  return { v, f, T, t, y, length: state.length };
}

/** Nut and bridge, in scene units. The vibrating length is the string between them. */
const NUT = -4.35;
const BRIDGE = 2.55;
const UPPER = { x: 0.85, y: 0, r: 1.05 };
const LOWER = { x: 2.55, y: 0, r: 1.28 };

function arc(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a), 0);
  }
  return out;
}

/** Two overlapping circles. The outline keeps the outer arc of each, a guitar waist. */
function bodyOutline() {
  const d = LOWER.x - UPPER.x;
  const angleU = Math.acos((UPPER.r ** 2 + d ** 2 - LOWER.r ** 2) / (2 * UPPER.r * d));
  const angleL = Math.acos((LOWER.r ** 2 + d ** 2 - UPPER.r ** 2) / (2 * LOWER.r * d));
  const upper = arc(UPPER.x, UPPER.y, UPPER.r, angleU, 2 * Math.PI - angleU, 48);
  const lower = arc(LOWER.x, LOWER.y, LOWER.r, Math.PI + angleL, 2 * Math.PI + (Math.PI - angleL), 56);
  return upper.concat(lower, upper.slice(0, 3));
}

function ring(cx, cy, r, n) {
  return arc(cx, cy, r, 0, 2 * Math.PI, n);
}

export default defineLab({
  id: 'guitar-string',
  exam: 'u12',
  title: 'Guitar string',
  app: true,
  hint: 'The high E and the low E are the same length. A heavier string needs more tension to keep the same wave speed, and the pitch follows the square root of that tension.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 12.2, h: 9.6 },
  camera: { pos: new THREE.Vector3(0.15, 0.15, 18), target: new THREE.Vector3(0.15, 0.15, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'guitar-tension',
      scenario: 'high',
      ask: 'Quadruple the high E tension and keep the string. What happens to the wave speed?',
      apply(s) { s.tension *= 4; },
      watch: [{ id: 'v', label: 'the wave speed', get: (c) => c.v }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { v: 2 },
      why: 'v = √(F/μ). Four times the tension doubles the speed, and the open pitch rises with it.',
    },
    {
      id: 'guitar-length',
      scenario: 'high',
      ask: 'Double the vibrating length. What happens to the frequency?',
      apply(s) { s.length *= 2; },
      watch: [{ id: 'f', label: 'the frequency', get: (c) => c.f }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { f: 0.5 },
      why: 'f = v/(2L). Twice the length halves the frequency. A finger does the opposite: it shortens the vibrating length and the pitch rises.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('high', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true }, cycles: 0 });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="gu-play">Play</button>${logSliderRow('gu-F', 'Tension (N)', 56.4, 5, 2000)}${logSliderRow('gu-mu', 'Mass per length (kg/m)', HIGH_MU, 1e-4, 0.02)}${sliderRow('gu-L', 'Vibrating length (m)', SCALE, 0.25, 1.2, 0.01)}${sliderRow('gu-c', 'Cycles', 0, 0, 2, 0.01)}</div>`;
  },
  bind(api) {
    document.getElementById('gu-play').addEventListener('click', () => api.toggleSweep());
    bindLogSlider(api, 'gu-F', (s, v) => { s.tension = v; });
    bindLogSlider(api, 'gu-mu', (s, v) => { s.mu = v; });
    bindSlider(api, 'gu-L', (s, v) => { s.length = v; });
    bindSlider(api, 'gu-c', (s, v) => { s.cycles = v; });
  },
  syncControls(state) {
    const play = document.getElementById('gu-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putLogSlider('gu-F', state.tension);
    putLogSlider('gu-mu', state.mu);
    putSlider('gu-L', state.length, 3);
    putSlider('gu-c', state.cycles, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const body = fatLine(bodyOutline(), { color: M.grey, width: 3 });
    const hole = fatLine(ring(UPPER.x + 0.12, 0, 0.34, 28), { color: M.greyDark, width: 2 });
    const rosette = fatLine(ring(UPPER.x + 0.12, 0, 0.42, 28), { color: M.greyDark, width: 1.2 });
    const neck = fatLine([-4.55, 0.2, 0, 0.15, 0.2, 0, 0.15, -0.2, 0, -4.55, -0.2, 0, -4.55, 0.2, 0], { color: M.grey, width: 2.5 });
    const head = fatLine([-5.2, 0.42, 0, -4.55, 0.26, 0, -4.55, -0.26, 0, -5.2, -0.42, 0, -5.2, 0.42, 0], { color: M.greyDark, width: 2.5 });
    const pegs = [-0.24, 0, 0.24].map((y) => fatLine([-5.28, y, 0.02, -4.95, y, 0.02], { color: M.grey, width: 2.2 }));
    const frets = Array.from({ length: 8 }, (_, i) => {
      const x = -4.15 + i * 0.5;
      return fatLine([x, -0.16, 0.02, x, 0.16, 0.02], { color: M.greyDark, width: 1.3 });
    });
    const bridge = fatLine([BRIDGE, -0.28, 0.03, BRIDGE, 0.28, 0.03], { color: M.greyDark, width: 3 });
    const idle = [-0.18, -0.09, 0.09, 0.18].map((y) => fatLine(
      [NUT, y, 0.02, BRIDGE, y, 0.02],
      { color: M.greyDark, width: 1.1 },
    ));
    const string = fatLine(new Array(N * 3).fill(0), { color: M.gold, width: 2.6 });
    const which = label('high E', -2.5, 0.62, 0, 'graph-axis');
    const graph = createGraph(group, {
      x: -4.7, y: -4.15, w: 8.2, h: 1.9, color: QUANTITY_COLORS.x, samples: 121,
      name: 'midpoint (m)', xName: 'time (s)',
    });
    group.add(body, hole, rosette, neck, head, bridge, string, which, ...pegs, ...frets, ...idle);
    group.visible = false;
    return { group, string, which, graph };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.tension = Math.max(state.tension, 0.1);
    state.mu = Math.max(state.mu, 1e-6);
    state.length = Math.max(state.length, 0.05);
    Object.assign(computed, fields(state));
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.cycles = (state.cycles + dt) % 2;
    return true;
  },
  second(state) {
    const v = waveSpeed(state.tension, state.mu);
    const got = standingPeriodFromCrossings({
      tension: state.tension, mu: state.mu, length: state.length, mode: 1,
    });
    const expect = (2 * state.length) / v;
    if (!(Math.abs(got - expect) <= 0.004 * Math.max(expect, 1e-4))) return { v: NaN };
    const row = fields(state);
    return { v: row.v, f: row.f, y: row.y };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.string) return;
    ctx.grid.visible = false;
    const x0 = NUT;
    const x1 = BRIDGE;
    const heavy = state.mu > 0.001;
    h.string.material.color.set(heavy ? M.blue : M.gold);
    h.which.element.textContent = heavy ? 'low E' : 'high E';
    const amp = 0.55;
    const pts = new Array(N * 3);
    for (let i = 0; i < N; i += 1) {
      const s = i / (N - 1);
      const y = amp * Math.sin(Math.PI * s) * Math.cos(2 * Math.PI * state.cycles);
      pts[i * 3] = x0 + s * (x1 - x0);
      pts[i * 3 + 1] = y;
      pts[i * 3 + 2] = 0.04;
    }
    updateFatLine(h.string, pts);
    const t1 = computed.T;
    h.graph.set({
      t0: 0,
      t1,
      lo: -0.0025,
      hi: 0.0025,
      f: (time) => 0.002 * Math.cos(2 * Math.PI * computed.f * time),
    });
    h.graph.mark(computed.t % t1, computed.y);
  },
  law() {
    return [
      String.raw`v = \sqrt{F/\mu}`,
      String.raw`f = v/(2L)`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Wave speed', `${fmt(computed.v)} m/s`],
      ['Open frequency', `${fmt(computed.f)} Hz`],
      ['Tension', `${fmt(state.tension)} N`],
      ['Mass per length', `${fmt(state.mu)} kg/m`],
      ['Vibrating length', `${fmt(state.length)} m`],
      ['Midpoint now', `${fmt(computed.y)} m`],
    ];
  },
  coach(state, computed) {
    const heavy = state.mu > 0.001;
    return {
      title: heavy ? 'The heavier string' : 'The high E',
      body: [
        String.raw`This string's wave speed is $${fmt(computed.v)}$ m/s, so an open length of $${fmt(state.length)}$ m sounds at $${fmt(computed.f)}$ Hz. The high E in the section is $3.09\times 10^{-4}\ \mathrm{kg/m}$ at $56.40\ \mathrm{N}$, and $427.23\ \mathrm{m/s}$. The same speed on the low E, about twenty times heavier, takes about $1055\ \mathrm{N}$.`,
        '<b>What the course model leaves out.</b> A real guitar does not put 1055 N on the low E. It tunes that string to 82.41 Hz, so the wave is slower and the tension stays ordinary. The picture vibrates once a second, not at the real pitch, and the swing is enlarged. The plot is a 2.00 mm pluck, an illustrative amplitude. Frets, the body, and stiffness of a real string are not in v = √(F/μ).',
      ],
    };
  },
});

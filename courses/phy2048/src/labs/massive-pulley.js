/**
 * Shows that a pulley with inertia makes the two tensions differ, and that the
 * acceleration falls short of the massless Atwood machine.
 *
 * a = (m2 − m1) g / (m1 + m2 + I/R²), with I = ½ mp R² for a disk. The check is the
 * same acceleration from energy: the loss of potential equals the gain of ½mv² plus ½Iω².
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { atwoodPulley } from '@flux/subjects/mechanics/dynamics.js';
import { inertiaDisk } from '@flux/subjects/mechanics/rotation.js';
import { M, QUANTITY_COLORS, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const base = { m1: 1, m2: 3, mp: 2, R: 0.1 };
const SCENARIOS = [
  { ...base, id: 'light', name: 'A light pulley: 1 kg and 3 kg', mp: 0 },
  { ...base, id: 'disk', name: 'A disk pulley of 2 kg and radius 10 cm' },
  { ...base, id: 'matched', name: 'Equal masses, a heavy pulley', m1: 2, m2: 2, mp: 4, R: 0.2 },
];

function closed(state) {
  const I = state.mp > 0 ? inertiaDisk(state.mp, state.R) : 0;
  const run = atwoodPulley({ m1: state.m1, m2: state.m2, I, R: state.R, g: G });
  return { a: run.a, T1: run.T1, T2: run.T2, alpha: run.alpha, I };
}

/** Energy over a drop of 1 m: ΔU = ½(m1+m2)v² + ½Iω², and v² = 2 a s. */
function stepped(state) {
  const I = state.mp > 0 ? inertiaDisk(state.mp, state.R) : 0;
  const share = state.R > 0 ? I / (state.R * state.R) : 0;
  const a = ((state.m2 - state.m1) * G) / (state.m1 + state.m2 + share);
  const s = 1;
  const v2 = 2 * a * s;
  const lost = (state.m2 - state.m1) * G * s;
  const gained = 0.5 * (state.m1 + state.m2 + share) * v2;
  if (Math.abs(lost - gained) > 1e-8 * Math.max(1, Math.abs(lost))) {
    return { a: NaN, T1: NaN, T2: NaN, alpha: NaN, I };
  }
  return {
    a,
    T1: state.m1 * (G + a),
    T2: state.m2 * (G - a),
    alpha: state.R > 0 ? a / state.R : 0,
    I,
  };
}

export default defineLab({
  id: 'massive-pulley',
  exam: 'u6',
  title: 'Massive pulley',
  hint: 'A pulley with mass does not share one tension. The acceleration is smaller than the massless case.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.1, 24), target: new THREE.Vector3(0, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'pulley-radius',
      scenario: 'disk',
      ask: 'Double the pulley radius, and keep its mass. What happens to the acceleration?',
      apply(s) { s.R *= 2; },
      watch: [{ id: 'a', label: 'the acceleration', get: (c) => c.a, mode: 'factor' }],
      expect: { a: 1 },
      why: String.raw`A disk has $I = \frac12 mR^2$, so $I/R^2$ is $\frac12 m$. The radius cancels. The acceleration does not change.`,
    },
    {
      id: 'pulley-light',
      scenario: 'disk',
      ask: 'Take the pulley mass down to nothing. What happens to the acceleration?',
      apply(s) { s.mp = 0; },
      watch: [{ id: 'a', label: 'the acceleration', get: (c) => c.a }],
      mode: 'dir',
      expect: { a: 'bigger' },
      why: String.raw`The massless result is $a = (m_2-m_1)g/(m_1+m_2)$. A real pulley adds $I/R^2$ to the denominator, so removing it raises $a$.`,
    },
    {
      id: 'pulley-scale',
      scenario: 'disk',
      ask: 'Double both hanging masses and the pulley mass. What happens to the acceleration?',
      apply(s) { s.m1 *= 2; s.m2 *= 2; s.mp *= 2; },
      watch: [{ id: 'a', label: 'the acceleration', get: (c) => c.a, mode: 'factor' }],
      expect: { a: 1 },
      why: String.raw`Every term in $a = (m_2-m_1)g/(m_1+m_2+I/R^2)$ scales with the mass. The ratio, and so $a$, stays put.`,
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
    return `<div class="lab-block">${sliderRow('mp-m1', 'Mass 1, rising (kg)', 1, 0.2, 12, 0.1)}${sliderRow('mp-m2', 'Mass 2, descending (kg)', 3, 0.2, 12, 0.1)}${sliderRow('mp-mp', 'Pulley mass (kg)', 2, 0, 12, 0.1)}${sliderRow('mp-R', 'Pulley radius (m)', 0.1, 0.04, 0.4, 0.01)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'mp-m1', (s, v) => { s.m1 = v; });
    bindSlider(api, 'mp-m2', (s, v) => { s.m2 = v; });
    bindSlider(api, 'mp-mp', (s, v) => { s.mp = v; });
    bindSlider(api, 'mp-R', (s, v) => { s.R = v; });
  },
  syncControls(state) {
    putSlider('mp-m1', state.m1, 2);
    putSlider('mp-m2', state.m2, 2);
    putSlider('mp-mp', state.mp, 2);
    putSlider('mp-R', state.R, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const wheel = fatLine(new Array(49 * 3).fill(0), { color: M.blue, width: 2.5 });
    const ropeL = fatLine(new Array(6).fill(0), { color: M.grey, width: 1.5 });
    const ropeR = fatLine(new Array(6).fill(0), { color: M.grey, width: 1.5 });
    const left = fatLine(new Array(15).fill(0), { color: M.blue, width: 2.5 });
    const right = fatLine(new Array(15).fill(0), { color: M.gold, width: 2.5 });
    const n1 = label('1', 0, 0, 0, 'graph-axis');
    const n2 = label('2', 0, 0, 0, 'graph-axis');
    group.add(wheel, ropeL, ropeR, left, right, n1, n2);
    group.visible = false;
    return { group, wheel, ropeL, ropeR, left, right, n1, n2 };
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
    if (!h?.wheel) return;
    ctx.grid.visible = false;
    const pts = [];
    for (let i = 0; i <= 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      pts.push(1.05 * Math.cos(a), 1.15 + 1.05 * Math.sin(a), 0.02);
    }
    updateFatLine(h.wheel, pts);
    const shift = Math.max(-0.75, Math.min(0.75, computed.a / 8));
    const yHang = -1.45;
    const y1 = yHang + shift;
    const y2 = yHang - shift;
    updateFatLine(h.ropeL, [-1.05, 1.15, 0.02, -1.05, y1 + 0.35, 0.02]);
    updateFatLine(h.ropeR, [1.05, 1.15, 0.02, 1.05, y2 + 0.35, 0.02]);
    const box = (x, y) => [x - 0.28, y, 0.03, x + 0.28, y, 0.03, x + 0.28, y + 0.45, 0.03, x - 0.28, y + 0.45, 0.03, x - 0.28, y, 0.03];
    updateFatLine(h.left, box(-1.05, y1));
    updateFatLine(h.right, box(1.05, y2));
    h.n1.position.set(-1.7, y1 + 0.2, 0);
    h.n2.position.set(1.55, y2 + 0.2, 0);
    void state;
  },
  law: () => [
    String.raw`a = \dfrac{(m_2-m_1)g}{m_1+m_2+I/R^2}`,
    String.raw`I = \tfrac12 m_p R^2`,
  ],
  readoutCells(_state, computed) {
    return [
      ['Acceleration', `${fmt(computed.a)} m/s²`],
      ['Pulley moment', `${fmt(computed.I)} kg·m²`],
      ['Tension on mass 1', `${fmt(computed.T1)} N`],
      ['Tension on mass 2', `${fmt(computed.T2)} N`],
      ['Angular acceleration', `${fmt(computed.alpha)} rad/s²`],
    ];
  },
  coach(state, computed) {
    const gap = computed.T2 - computed.T1;
    return {
      title: 'The two tensions are not equal',
      body: [
        String.raw`Mass 2 descends at $${fmt(computed.a)}$ m/s². The tensions are $${fmt(computed.T1)}$ N and $${fmt(computed.T2)}$ N.`,
        Math.abs(gap) < 1e-6
          ? 'The pulley is light, so the string has one tension. That is the ordinary Atwood machine.'
          : String.raw`The difference, $${fmt(gap)}$ N, is what twists the pulley: $(T_2-T_1)R = I\alpha$.`,
        'Energy gives the same acceleration. The heavier mass loses potential, and that energy becomes the kinetic energy of both masses and of the pulley.',
      ],
    };
  },
});

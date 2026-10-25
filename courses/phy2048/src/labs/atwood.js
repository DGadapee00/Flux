/**
 * Shows that the string's tension is not the hanging weight while the system accelerates: it is less
 * than the falling block's weight and more than the rising one's. It equals the weight only when
 * nothing accelerates.
 *
 * Two set-ups: an Atwood machine (two blocks over a pulley) and a block on a table pulled by a hanging
 * one, with or without friction. The closed form solves ΣF = ma for each block (`atwood`,
 * `hangingIncline` on a level table). The check is energy: after the hanging block drops h,
 * ½(m₁ + m₂)v² equals the work of gravity less the work of friction, so a = v²/2h, and T follows from
 * the other block alone.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { atwood, hangingIncline } from '@flux/subjects/mechanics/dynamics.js';
import { Arrow, M, dot, fatLine, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const DROP = 1;

const SCENARIOS = [
  { id: 'atwood', name: 'An Atwood machine: 2.00 kg and 4.00 kg', mode: 'atwood', m1: 2, m2: 4, mu: 0 },
  { id: 'table', name: 'A 5.00 kg block on a smooth table, 3.00 kg hanging', mode: 'table', m1: 5, m2: 3, mu: 0 },
  { id: 'rough', name: 'The same on a rough table, μ = 0.20', mode: 'table', m1: 5, m2: 3, mu: 0.2 },
];

/** a is positive when m2 (the right-hand or hanging block) goes down. */
function solve(s) {
  if (s.mode === 'atwood') {
    const r = atwood(s.m1, s.m2, G);
    return { a: r.a, T: r.T, holds: Math.abs(r.a) < 1e-12 };
  }
  const r = hangingIncline({ block: s.m1, hang: s.m2, thetaDeg: 0, muk: s.mu, mus: s.mu, g: G });
  return { a: r.a, T: r.T, holds: r.holds };
}

const box = (m) => 0.45 + 0.22 * Math.cbrt(m);

export default defineLab({
  id: 'atwood',
  exam: 'u3',
  title: 'Atwood machine',
  hint: 'Change the masses and the friction. Compare the tension with the hanging weight.',
  orbit: false,
  fit: { w: 12, h: 10.4 },
  camera: { pos: new THREE.Vector3(0, 0, 24), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'atwood-double',
      scenario: 'atwood',
      ask: String.raw`Double both masses, to $4.00$ and $8.00\ \mathrm{kg}$. What happens to the acceleration and to the tension?`,
      apply(s) { s.m1 *= 2; s.m2 *= 2; },
      watch: [
        { id: 'a', label: 'the acceleration', get: (c) => c.a, mode: 'factor' },
        { id: 'T', label: 'the tension', get: (c) => c.T, mode: 'factor' },
      ],
      expect: { a: 1, T: 2 },
      why: String.raw`The acceleration is $(m_2 - m_1)g/(m_1 + m_2)$: doubling both masses doubles the top and the bottom, so it does not change. The tension is $m_1(g + a)$, and $m_1$ has doubled.`,
    },
    {
      id: 'atwood-hang',
      scenario: 'table',
      ask: String.raw`The $3.00\ \mathrm{kg}$ block hangs from the string. Is the tension in the string equal to its weight, $29.4\ \mathrm{N}$?`,
      apply() {},
      watch: [{ id: 'equal', label: 'the tension equals the hanging weight', get: (c, s) => Math.abs(c.T - s.m2 * G) < 1e-6, mode: 'bool' }],
      expect: { equal: false },
      why: String.raw`If the string pulled up with the full $29.4\ \mathrm{N}$, the hanging block would have no net force and could not speed up. It does speed up, at $3.68\ \mathrm{m/s^2}$, so $T = m_2(g - a) = 18.4\ \mathrm{N}$.`,
    },
    {
      id: 'atwood-rough',
      scenario: 'table',
      ask: String.raw`Roughen the table, from no friction to $\mu = 0.20$. What happens to the acceleration and to the tension?`,
      apply(s) { s.mu = 0.2; },
      watch: [
        { id: 'a', label: 'the acceleration', get: (c) => c.a },
        { id: 'T', label: 'the tension', get: (c) => c.T },
      ],
      mode: 'dir',
      expect: { a: 'smaller', T: 'bigger' },
      why: String.raw`Friction holds the table block back, so the pair speeds up more slowly. The hanging block then needs less net force, $m_2 a$, so the string holds back more of its weight: $T = m_2(g - a)$ grows from 18.4 to 22.1 N.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('atwood', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('at-m1', 'Mass 1, left or on the table (kg)', 2, 0.1, 20, 0.1)}${sliderRow('at-m2', 'Mass 2, hanging on the right (kg)', 4, 0.1, 20, 0.1)}${sliderRow('at-mu', 'Friction on the table, μ (static and kinetic)', 0, 0, 1, 0.01)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'at-m1', (s, x) => { s.m1 = x; });
    bindSlider(api, 'at-m2', (s, x) => { s.m2 = x; });
    bindSlider(api, 'at-mu', (s, x) => { s.mu = x; });
  },
  syncControls(state) {
    putSlider('at-m1', state.m1, 2);
    putSlider('at-m2', state.m2, 2);
    putSlider('at-mu', state.mu, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ring = [];
    for (let i = 0; i <= 40; i += 1) ring.push(0.5 * Math.cos((i / 40) * 2 * Math.PI), 0.5 * Math.sin((i / 40) * 2 * Math.PI), 0);
    const pulley = fatLine(ring, { color: M.grey, width: 2.5 });
    const axle = dot(M.grey, 0.07);
    const string = fatLine(new Array(4 * 3).fill(0), { color: M.white, width: 1.8 });
    const table = fatLine(new Array(3 * 3).fill(0), { color: M.grey, width: 2.5 });
    const box1 = fatLine(new Array(5 * 3).fill(0), { color: M.blue, width: 3 });
    const box2 = fatLine(new Array(5 * 3).fill(0), { color: M.blue, width: 3 });
    const arrows = {};
    for (const key of ['T1', 'T2', 'W1', 'W2', 'f']) arrows[key] = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE);
    const acc1 = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.yellow, undefined, undefined, 0.02);
    const acc2 = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.yellow, undefined, undefined, 0.02);
    const names = {};
    for (const [key, html] of [['T1', '<i>T</i>'], ['T2', '<i>T</i>'], ['W1', '<i>m</i>₁<i>g</i>'], ['W2', '<i>m</i>₂<i>g</i>'], ['f', '<i>f</i>'], ['m1', '1'], ['m2', '2']]) {
      names[key] = label(html, 0, 0, 0, 'graph-title');
    }
    group.add(table, pulley, axle, string, box1, box2, acc1, acc2, ...Object.values(arrows), ...Object.values(names));
    group.visible = false;
    return { group, pulley, axle, string, table, box1, box2, arrows, acc1, acc2, names };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const r = solve(state);
    computed.a = r.a;
    computed.T = r.T;
    computed.holds = r.holds;
    computed.W2 = state.m2 * G;
    computed.f = state.mode === 'table' ? (r.holds ? state.m2 * G : state.mu * state.m1 * G) : 0;
    // Speed after the hanging block has dropped 1 m from rest.
    computed.v = Math.sqrt(2 * Math.abs(r.a) * DROP);
  },
  second(state) {
    // Energy over a 1 m drop of block 2, from rest: ½(m₁ + m₂)v² = (work of gravity) − (work of friction).
    const total = state.m1 + state.m2;
    let work;
    if (state.mode === 'atwood') work = (state.m2 - state.m1) * G * DROP;
    else {
      const drive = state.m2 * G;
      const grip = state.mu * state.m1 * G;
      work = drive > grip + 1e-9 ? (drive - grip) * DROP : 0;
    }
    const v = Math.sqrt((2 * Math.abs(work)) / total);
    const a = (Math.sign(work) * v * v) / (2 * DROP);
    // The tension from block 1 alone: it rises (Atwood) or is dragged along (table).
    let T;
    if (state.mode === 'atwood') T = state.m1 * (G + a);
    else T = a > 0 ? state.m1 * a + state.mu * state.m1 * G : state.m2 * G;
    return { a, T, v };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const k = 2.4 / Math.max(state.m1 * G, state.m2 * G, computed.T, 1e-9);
    const s1 = box(state.m1);
    const s2 = box(state.m2);
    const sq = (cx, cy, s) => [cx - s / 2, cy - s / 2, 0.02, cx + s / 2, cy - s / 2, 0.02, cx + s / 2, cy + s / 2, 0.02, cx - s / 2, cy + s / 2, 0.02, cx - s / 2, cy - s / 2, 0.02];
    const aLen = 1.6 * (computed.a / G);
    let p;
    let b1;
    let b2;
    if (state.mode === 'atwood') {
      p = { x: 0, y: 3.4 };
      b1 = { x: -0.5, y: -0.4 };
      b2 = { x: 0.5, y: -0.4 };
      // The heavier block hangs lower, so the picture shows which way it goes.
      const shift = Math.max(-1, Math.min(1, computed.a / G)) * 0.8;
      b1.y += shift;
      b2.y -= shift;
      b1.x = -1.6;
      b2.x = 1.6;
      h.table.visible = false;
      updateFatLine(h.string, [b1.x, b1.y + s1 / 2, 0, b1.x, p.y, 0, b2.x, p.y, 0, b2.x, b2.y + s2 / 2, 0]);
      updateFatLine(h.box1, sq(b1.x, b1.y, s1));
      updateFatLine(h.box2, sq(b2.x, b2.y, s2));
      placeArrow(h.arrows.T1, b1.x, b1.y + s1 / 2, b1.x, b1.y + s1 / 2 + computed.T * k, 0.05);
      placeArrow(h.arrows.W1, b1.x, b1.y - s1 / 2, b1.x, b1.y - s1 / 2 - state.m1 * G * k, 0.05);
      placeArrow(h.acc1, b1.x - s1 / 2 - 0.45, b1.y, b1.x - s1 / 2 - 0.45, b1.y + aLen, 0.06);
      placeArrow(h.acc2, b2.x + s2 / 2 + 0.45, b2.y, b2.x + s2 / 2 + 0.45, b2.y - aLen, 0.06);
      h.names.T1.position.set(b1.x - 0.35, b1.y + s1 / 2 + computed.T * k * 0.6, 0);
      h.names.W1.position.set(b1.x - 0.55, b1.y - s1 / 2 - state.m1 * G * k * 0.6, 0);
      h.arrows.f.visible = false;
      h.names.f.visible = false;
    } else {
      p = { x: 2.6, y: 1.6 };
      b1 = { x: -1.8, y: 1.6 - 0.5 + s1 / 2 };
      b2 = { x: 3.1, y: -1.6 };
      h.table.visible = true;
      updateFatLine(h.table, [-5.5, 1.1, 0, 2.6, 1.1, 0, 2.6, -4.2, 0]);
      updateFatLine(h.string, [b1.x + s1 / 2, b1.y, 0, p.x, p.y, 0, b2.x, p.y, 0, b2.x, b2.y + s2 / 2, 0]);
      updateFatLine(h.box1, sq(b1.x, b1.y, s1));
      updateFatLine(h.box2, sq(b2.x, b2.y, s2));
      placeArrow(h.arrows.T1, b1.x + s1 / 2, b1.y, b1.x + s1 / 2 + computed.T * k, b1.y, 0.05);
      placeArrow(h.arrows.W1, b1.x, b1.y, b1.x, b1.y - state.m1 * G * k, 0.05);
      h.arrows.W1.visible = false;
      placeArrow(h.arrows.f, b1.x - s1 / 2, 1.1 + 0.08, b1.x - s1 / 2 - computed.f * k, 1.1 + 0.08, 0.05);
      h.arrows.f.visible = computed.f > 1e-9;
      h.names.f.visible = h.arrows.f.visible;
      h.names.f.position.set(b1.x - s1 / 2 - computed.f * k * 0.6, 1.55, 0);
      placeArrow(h.acc1, b1.x, b1.y + s1 / 2 + 0.45, b1.x + aLen, b1.y + s1 / 2 + 0.45, 0.06);
      placeArrow(h.acc2, b2.x + s2 / 2 + 0.45, b2.y, b2.x + s2 / 2 + 0.45, b2.y - aLen, 0.06);
      h.names.T1.position.set(b1.x + s1 / 2 + computed.T * k * 0.55, b1.y + 0.35, 0);
    }
    h.names.W1.visible = state.mode === 'atwood';
    h.pulley.position.set(p.x, p.y - (state.mode === 'atwood' ? 0 : 0.5), 0);
    h.axle.position.set(p.x, p.y - (state.mode === 'atwood' ? 0 : 0.5), 0);
    placeArrow(h.arrows.T2, b2.x, b2.y + s2 / 2, b2.x, b2.y + s2 / 2 + computed.T * k, 0.05);
    placeArrow(h.arrows.W2, b2.x, b2.y - s2 / 2, b2.x, b2.y - s2 / 2 - state.m2 * G * k, 0.05);
    h.names.T2.position.set(b2.x + 0.35, b2.y + s2 / 2 + computed.T * k * 0.6, 0);
    h.names.W2.position.set(b2.x + 0.6, b2.y - s2 / 2 - state.m2 * G * k * 0.6, 0);
    h.names.m1.position.set(b1.x, b1.y, 0.1);
    h.names.m2.position.set(b2.x, b2.y, 0.1);
  },
  law(state) {
    if (state && state.mode === 'table') {
      return [String.raw`T - \mu m_1 g = m_1 a,\qquad m_2 g - T = m_2 a`, String.raw`a = \dfrac{(m_2 - \mu m_1)g}{m_1 + m_2}`];
    }
    return [String.raw`T - m_1 g = m_1 a,\qquad m_2 g - T = m_2 a`, String.raw`a = \dfrac{(m_2 - m_1)g}{m_1 + m_2},\qquad T = \dfrac{2m_1m_2 g}{m_1 + m_2}`];
  },
  readoutCells(state, computed) {
    return [
      ['Acceleration', `${fmt(computed.a)} m/s²`],
      ['Tension', `${fmt(computed.T)} N`],
      ['Hanging weight, m₂g', `${fmt(computed.W2)} N`],
      ['Speed after a 1 m drop', `${fmt(computed.v)} m/s`],
      ...(state.mode === 'table' ? [['Friction on the table block', `${fmt(computed.f)} N${computed.holds ? ', static: it holds' : ''}`]] : []),
    ];
  },
  coach(state, computed) {
    const body = [
      String.raw`Draw each block on its own. The string pulls both with the same $T$, because it and the pulley have no mass and no friction. Newton's second law for each block gives two equations in $a$ and $T$.`,
      computed.holds
        ? String.raw`Nothing moves, so nothing accelerates, and the string holds the hanging block's full weight: $T = m_2 g = ${fmt(computed.T, 4)}$ N.`
        : String.raw`The hanging block speeds up, so the string cannot pull with its whole weight: $T = m_2(g - a) = ${fmt(computed.T, 4)}$ N, against $m_2 g = ${fmt(computed.W2, 4)}$ N. Setting $T = m_2 g$ would leave it no net force.`,
      String.raw`<b>What the model leaves out.</b> A real pulley has mass and turns, so it takes some of the force: Unit 6 adds that. A real string stretches a little, and the axle has friction.`,
    ];
    return { title: 'Tension is not the hanging weight', body };
  },
});

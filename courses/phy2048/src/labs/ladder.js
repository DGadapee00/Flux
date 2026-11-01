/**
 * Shows that a ladder against a smooth wall needs friction at the floor, and that
 * the friction depends on the angle and on where a person stands, not on the length.
 *
 * The closed form is the moment balance about the floor. The check is the same body
 * solved as three unknown reactions.
 */
import * as THREE from 'three';
import { rigidBody2D } from '@flux/subjects/mechanics/statics.js';
import { v } from '@flux/subjects/mechanics/vectors.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const LADDER = 4.4;

const base = { ladderW: 400, personW: 0, frac: 0.5, theta: 53 };
const SCENARIOS = [
  { ...base, id: 'book', name: 'A 400.0 N ladder at 53° to the floor' },
  { ...base, id: 'person', name: 'A 700 N person halfway up', personW: 700, frac: 0.5 },
  { ...base, id: 'high', name: 'The same person, most of the way up', personW: 700, frac: 0.85 },
];

function closed(state) {
  const th = state.theta * Math.PI / 180;
  const wall = (state.ladderW * 0.5 + state.personW * state.frac) / Math.tan(th);
  const normal = state.ladderW + state.personW;
  return { normal, wall, friction: wall, mu: wall / normal };
}

function solved(state) {
  const th = state.theta * Math.PI / 180;
  const L = 5;
  const basePt = v(L * Math.cos(th), 0, 0);
  const top = v(0, L * Math.sin(th), 0);
  const along = (frac) => v(L * Math.cos(th) * (1 - frac), L * Math.sin(th) * frac, 0);
  const loads = [{ at: along(0.5), F: v(0, -state.ladderW, 0) }];
  if (state.personW > 0) loads.push({ at: along(state.frac), F: v(0, -state.personW, 0) });
  const body = rigidBody2D({
    about: basePt,
    loads,
    unknowns: [
      { at: basePt, dir: v(0, 1, 0) },
      { at: basePt, dir: v(-1, 0, 0) },
      { at: top, dir: v(1, 0, 0) },
    ],
  });
  const [normal, friction, wall] = body.reactions;
  return { normal, wall, friction, mu: friction / normal };
}

export default defineLab({
  id: 'ladder',
  exam: 'u8',
  title: 'Ladder',
  hint: 'The wall is smooth. The floor’s friction is what keeps the ladder from slipping, and the length cancels.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.3, 22), target: new THREE.Vector3(0, 0.3, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'lad-high',
      scenario: 'person',
      ask: 'The person climbs from halfway up to 85% of the way up. What happens to the friction coefficient the floor must supply?',
      apply(s) { s.frac = 0.85; },
      watch: [{ id: 'mu', label: 'μ at the floor', get: (c) => c.mu }],
      mode: 'dir',
      expect: { mu: 'bigger' },
      why: 'A person higher up has a longer lever arm about the floor, so the wall has to push harder. Friction matches that push, and the normal force does not change.',
    },
    {
      id: 'lad-steep',
      scenario: 'book',
      ask: 'Raise the ladder from 53° to 70°, with nobody on it. What happens to μ?',
      apply(s) { s.theta = 70; },
      watch: [{ id: 'mu', label: 'μ at the floor', get: (c) => c.mu }],
      mode: 'dir',
      expect: { mu: 'smaller' },
      why: 'A steeper ladder puts the weight closer to the wall’s line. The wall push falls, and so does the friction that matches it.',
    },
    {
      id: 'lad-weight',
      scenario: 'book',
      ask: 'Double the ladder’s weight and keep the angle. What happens to μ?',
      apply(s) { s.ladderW *= 2; },
      watch: [{ id: 'mu', label: 'μ at the floor', get: (c) => c.mu, mode: 'factor' }],
      expect: { mu: 1 },
      why: 'Both the friction and the normal force double. Their ratio, μ, does not care how heavy the ladder is.',
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
    return `<div class="lab-block">${sliderRow('ld-w', 'Ladder weight (N)', 400, 50, 2000, 10)}${sliderRow('ld-p', 'Person weight (N)', 0, 0, 1500, 10)}${sliderRow('ld-f', 'Person, fraction of the way up', 0.5, 0, 1, 0.01)}${sliderRow('ld-th', 'Angle with the floor (°)', 53, 20, 80, 1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'ld-w', (s, v) => { s.ladderW = v; });
    bindSlider(api, 'ld-p', (s, v) => { s.personW = v; });
    bindSlider(api, 'ld-f', (s, v) => { s.frac = v; });
    bindSlider(api, 'ld-th', (s, v) => { s.theta = v; });
  },
  syncControls(state) {
    putSlider('ld-w', state.ladderW, 0);
    putSlider('ld-p', state.personW, 0);
    putSlider('ld-f', state.frac, 2);
    putSlider('ld-th', state.theta, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const wall = fatLine([0, 0, 0, 0, 1, 0], { color: M.grey, width: 2 });
    const floor = fatLine([0, 0, 0, 1, 0, 0], { color: M.grey, width: 2 });
    const rail = fatLine([0, 0, 0, 1, 1, 0], { color: M.blue, width: 3 });
    const normal = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016);
    const friction = new Arrow(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016);
    const push = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, M.white, undefined, undefined, 0.016);
    const weight = new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.014);
    const name = label('f', 0, 0, 0, 'graph-axis');
    group.add(wall, floor, rail, normal, friction, push, weight, name);
    group.visible = false;
    return { group, wall, floor, rail, normal, friction, push, weight, name };
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
    return solved(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.rail) return;
    ctx.grid.visible = false;
    const th = state.theta * Math.PI / 180;
    const xWall = -2.3;
    const y0 = -1.7;
    const xBase = xWall + LADDER * Math.cos(th);
    const yTop = y0 + LADDER * Math.sin(th);
    updateFatLine(h.wall, [xWall, y0 - 0.2, 0, xWall, yTop + 0.3, 0]);
    updateFatLine(h.floor, [xWall - 0.2, y0, 0, xBase + 0.8, y0, 0]);
    updateFatLine(h.rail, [xBase, y0, 0.02, xWall, yTop, 0.02]);
    const midX = (xBase + xWall) / 2;
    const midY = (y0 + yTop) / 2;
    placeArrow(h.weight, midX, midY, midX, midY - 1.05, 0.05);
    placeArrow(h.normal, xBase, y0, xBase, y0 + 1.15, 0.06);
    const fLen = Math.max(0.4, Math.min(1.5, computed.friction / Math.max(computed.normal, 1) * 2.2));
    placeArrow(h.friction, xBase, y0, xBase - fLen, y0, 0.07);
    h.name.position.set(xBase - fLen - 0.25, y0 + 0.28, 0);
    placeArrow(h.push, xWall, yTop, xWall + 1.15, yTop, 0.06);
  },
  law() {
    return [String.raw`N = W_{\mathrm{ladder}} + W_{\mathrm{person}}`, String.raw`f = \left(\tfrac12 W_{\mathrm{ladder}} + f_p W_{\mathrm{person}}\right)\cot\theta`];
  },
  readoutCells(state, computed) {
    return [
      ['Floor normal', `${fmt(computed.normal)} N`],
      ['Friction', `${fmt(computed.friction)} N`],
      ['Wall push', `${fmt(computed.wall)} N`],
      ['μ needed', fmt(computed.mu)],
    ];
  },
  coach(state, computed) {
    return {
      title: 'The length never enters',
      body: [
        String.raw`The floor pushes up with $${fmt(computed.normal)}$ N. The wall pushes sideways with $${fmt(computed.wall)}$ N, and friction matches it. μ must be at least ${fmt(computed.mu)}.`,
        'Both lever arms grow with the length, so the length cancels. A longer ladder at the same angle asks for the same μ. A person higher up does not.',
      ],
    };
  },
});

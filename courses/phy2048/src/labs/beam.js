/**
 * Shows that the two supports under a board trade off as a person walks, and that
 * a support force of zero is the tipping point.
 *
 * The closed form takes moments about the left support. The check takes them about the right.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { boardReactions, boardReactionsAboutRight } from '@flux/subjects/mechanics/statics.js';
import { Arrow, M, QUANTITY_COLORS, dot, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;

const base = { L: 6, inset: 0, mBoard: 70, mPerson: 50, x: 1.5, g: G };
const SCENARIOS = [
  { ...base, id: 'scaffold', name: 'A 50 kg person, 1.5 m from the left end of a 6.0 m scaffold' },
  { ...base, id: 'middle', name: 'The same person at the center', x: 3 },
  { ...base, id: 'overhang', name: 'Supports set in, person near the right end', inset: 1.2, x: 5.6, mPerson: 80 },
];

function weights(state) {
  return { weight: state.mBoard * state.g, load: state.mPerson * state.g };
}

function closed(state) {
  const spec = { length: state.L, inset: state.inset, at: state.x, ...weights(state) };
  const ends = boardReactions(spec);
  return { left: ends.left, right: ends.right, ...spec };
}

function aboutRight(state) {
  const spec = { length: state.L, inset: state.inset, at: state.x, ...weights(state) };
  return boardReactionsAboutRight(spec);
}

function sceneX(state, at) {
  return -3.1 + (at / state.L) * 6.2;
}

export default defineLab({
  id: 'beam',
  exam: 'u8',
  title: 'Beam',
  hint: 'The supports trade off as the person walks. A support that would have to pull is the tipping point.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'beam-walk',
      scenario: 'scaffold',
      ask: 'The person walks from 1.5 m to 4.5 m, still on the same board. What happens to the right support?',
      apply(s) { s.x = 4.5; },
      watch: [{ id: 'right', label: 'the right support', get: (c) => c.right }],
      mode: 'dir',
      expect: { right: 'bigger' },
      why: 'Moving the weight toward a support hands that support more of the load. The other one gives it up.',
    },
    {
      id: 'beam-mass',
      scenario: 'scaffold',
      ask: 'Double the person’s mass and leave the board alone. What happens to the right support?',
      apply(s) { s.mPerson *= 2; },
      watch: [{ id: 'right', label: 'the right support', get: (c) => c.right }],
      mode: 'dir',
      expect: { right: 'bigger' },
      why: 'The board’s weight does not change, so the right support grows, but not by a factor of two.',
    },
    {
      id: 'beam-board',
      scenario: 'middle',
      ask: 'Double the board’s mass and leave the person at the center. What happens to the left support?',
      apply(s) { s.mBoard *= 2; },
      watch: [{ id: 'left', label: 'the left support', get: (c) => c.left }],
      mode: 'dir',
      expect: { left: 'bigger' },
      why: 'The board is half of what the supports carry when the person stands at the center. A heavier board raises both supports. It does not double them, because the person is still there.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('scaffold', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('bm-L', 'Length (m)', 6, 2, 8, 0.1)}${sliderRow('bm-in', 'Support inset (m)', 0, 0, 2, 0.1)}${sliderRow('bm-mb', 'Board mass (kg)', 70, 5, 200, 1)}${sliderRow('bm-mp', 'Person mass (kg)', 50, 0, 150, 1)}${sliderRow('bm-x', 'Person from the left end (m)', 1.5, 0, 8, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'bm-L', (s, v) => { s.L = v; });
    bindSlider(api, 'bm-in', (s, v) => { s.inset = v; });
    bindSlider(api, 'bm-mb', (s, v) => { s.mBoard = v; });
    bindSlider(api, 'bm-mp', (s, v) => { s.mPerson = v; });
    bindSlider(api, 'bm-x', (s, v) => { s.x = v; });
  },
  syncControls(state) {
    putSlider('bm-L', state.L, 1);
    putSlider('bm-in', state.inset, 1);
    putSlider('bm-mb', state.mBoard, 0);
    putSlider('bm-mp', state.mPerson, 0);
    putSlider('bm-x', state.x, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const board = fatLine([-3.1, 0, 0, 3.1, 0, 0], { color: M.blue, width: 3 });
    const left = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016);
    const right = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, M.white, undefined, undefined, 0.016);
    const weight = new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.014);
    const personLoad = new Arrow(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.014);
    const person = dot(M.gold, 0.16);
    const leftName = label('left', 0, 0, 0, 'graph-axis');
    const rightName = label('right', 0, 0, 0, 'graph-axis');
    const boardName = label('W', 0, 0, 0, 'graph-axis');
    const personName = label('P', 0, 0, 0, 'graph-axis');
    group.add(board, left, right, weight, personLoad, person, leftName, rightName, boardName, personName);
    group.visible = false;
    return {
      group, board, left, right, weight, personLoad, person, leftName, rightName, boardName, personName,
    };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.inset = Math.min(state.inset, state.L / 2 - 0.05);
    state.x = Math.min(Math.max(state.x, 0), state.L);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const ends = aboutRight(state);
    return { left: ends.left, right: ends.right, ...weights(state), length: state.L, inset: state.inset, at: state.x };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.board) return;
    ctx.grid.visible = false;
    updateFatLine(h.board, [-3.1, 0, 0, 3.1, 0, 0]);
    const y = 0;
    const xl = sceneX(state, state.inset);
    const xr = sceneX(state, state.L - state.inset);
    const xp = sceneX(state, state.x);
    const scale = 1.6 / Math.max(computed.weight + computed.load, 1);
    const lLen = Math.max(0.35, Math.min(1.8, Math.abs(computed.left) * scale));
    const rLen = Math.max(0.35, Math.min(1.8, Math.abs(computed.right) * scale));
    const wLen = Math.max(0.35, Math.min(1.5, computed.weight * scale));
    const pLen = computed.load < 1 ? 0.02 : Math.max(0.25, Math.min(1.5, computed.load * scale));
    const lSign = computed.left >= 0 ? 1 : -1;
    const rSign = computed.right >= 0 ? 1 : -1;
    const xw = sceneX(state, state.L / 2);
    placeArrow(h.left, xl, y, xl, y + lSign * lLen, 0.05);
    placeArrow(h.right, xr, y, xr, y + rSign * rLen, 0.05);
    placeArrow(h.weight, xw, y, xw, y - wLen, 0.04);
    const pDraw = Math.abs(xp - xw) < 0.45 ? xp + 0.45 : xp;
    placeArrow(h.personLoad, pDraw, y, pDraw, y - pLen, 0.05);
    h.person.visible = computed.load >= 1;
    h.person.position.set(xp, 0.28, 0.06);
    h.personName.visible = computed.load >= 1;
    h.leftName.position.set(xl, y + lSign * (lLen + 0.28), 0);
    h.rightName.position.set(xr, y + rSign * (rLen + 0.28), 0);
    h.boardName.position.set(xw - 0.28, y - wLen - 0.2, 0);
    h.personName.position.set(pDraw + 0.28, y - pLen - 0.2, 0);
  },
  law() {
    return [String.raw`N_R = \dfrac{W(L/2 - a) + P(x - a)}{L - 2a}`, String.raw`N_L + N_R = W + P`];
  },
  readoutCells(state, computed) {
    const tip = computed.left < -1 || computed.right < -1;
    return [
      ['Left support', `${fmt(computed.left)} N`],
      ['Right support', `${fmt(computed.right)} N`],
      ['Board weight', `${fmt(computed.weight)} N`],
      ['Person weight', `${fmt(computed.load)} N`],
      ['Support that must pull', tip ? 'yes, the board tips' : 'no'],
    ];
  },
  coach(state, computed) {
    const tip = computed.left < -1 || computed.right < -1;
    return {
      title: tip ? 'One support has run out' : 'The two supports share the weight',
      body: [
        String.raw`The left support pushes with $${fmt(computed.left)}$ N and the right with $${fmt(computed.right)}$ N. Their sum is the board plus the person.`,
        tip
          ? 'A negative push means that support would have to hold the board down. A roller cannot do that, so the board tips about the other support.'
          : 'Walk the person toward one end and that support grows while the other shrinks. The trade is linear in the person’s position.',
      ],
    };
  },
});

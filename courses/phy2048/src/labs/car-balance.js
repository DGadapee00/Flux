/**
 * Shows where a car’s center of mass sits between the axles, and that braking
 * moves load onto the front wheels without moving that center.
 *
 * The closed form is the moment balance about the rear axle. The check is the
 * same balance about the front axle.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { axleSplit } from '@flux/subjects/mechanics/statics.js';
import { Arrow, M, QUANTITY_COLORS, dot, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;

const base = { d: 2.5, share: 0.52, weight: 12000, h: 0.55, a: 0, g: G };
const SCENARIOS = [
  { ...base, id: 'level', name: 'Level ground, 52% of the weight on the front axle' },
  { ...base, id: 'brake', name: 'Braking at 2.5 m/s²', a: 2.5 },
  { ...base, id: 'hard', name: 'Braking at 6.0 m/s²', a: 6 },
];

function closed(state) {
  return axleSplit({
    wheelbase: state.d,
    weight: state.weight,
    frontShare: state.share,
    height: state.h,
    decel: state.a,
    g: state.g,
  });
}

function aboutFront(state) {
  const xRear = state.share * state.d;
  const transfer = (state.weight * state.a * state.h) / (state.g * state.d);
  const rear = (state.weight * (state.d - xRear)) / state.d - transfer;
  const front = state.weight - rear;
  return { xRear, front, rear, transfer };
}

function axleX(kind) {
  return kind === 'rear' ? -2.15 : 2.15;
}

export default defineLab({
  id: 'car-balance',
  exam: 'u8',
  title: 'Car weight balance',
  hint: 'The axle split locates the center of mass. Braking moves load forward. It does not move the center.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.15, 22), target: new THREE.Vector3(0, 0.15, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'car-brake',
      scenario: 'brake',
      ask: 'Double the deceleration, from 2.5 m/s² to 5.0 m/s². What happens to the load that shifts onto the front axle?',
      apply(s) { s.a *= 2; },
      watch: [{ id: 'transfer', label: 'the load transfer', get: (c) => c.transfer, mode: 'factor' }],
      expect: { transfer: 2 },
      why: 'The transfer is W a h / (g d). It is proportional to the deceleration. The center of mass does not move.',
    },
    {
      id: 'car-base',
      scenario: 'brake',
      ask: 'Double the wheelbase and keep the height and the deceleration. What happens to the load transfer?',
      apply(s) { s.d *= 2; },
      watch: [{ id: 'transfer', label: 'the load transfer', get: (c) => c.transfer, mode: 'factor' }],
      expect: { transfer: 0.5 },
      why: 'A longer wheelbase is a longer lever arm for the axle forces, so the same inertial moment needs a smaller force.',
    },
    {
      id: 'car-share',
      scenario: 'level',
      ask: 'On level ground, with no braking, double the weight. What happens to the front axle force?',
      apply(s) { s.weight *= 2; },
      watch: [{ id: 'front', label: 'the front axle force', get: (c) => c.front, mode: 'factor' }],
      expect: { front: 2 },
      why: 'At rest the front axle carries a fixed share of the weight. Double the weight and that force doubles. The distance from the rear axle does not change.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('level', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('cb-d', 'Wheelbase (m)', 2.5, 1.5, 4, 0.1)}${sliderRow('cb-s', 'Front share at rest', 0.52, 0.3, 0.7, 0.01)}${sliderRow('cb-w', 'Weight (N)', 12000, 2000, 30000, 100)}${sliderRow('cb-h', 'Center height (m)', 0.55, 0.2, 1.2, 0.01)}${sliderRow('cb-a', 'Deceleration (m/s²)', 0, 0, 8, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'cb-d', (s, v) => { s.d = v; });
    bindSlider(api, 'cb-s', (s, v) => { s.share = v; });
    bindSlider(api, 'cb-w', (s, v) => { s.weight = v; });
    bindSlider(api, 'cb-h', (s, v) => { s.h = v; });
    bindSlider(api, 'cb-a', (s, v) => { s.a = v; });
  },
  syncControls(state) {
    putSlider('cb-d', state.d, 2);
    putSlider('cb-s', state.share, 2);
    putSlider('cb-w', state.weight, 0);
    putSlider('cb-h', state.h, 2);
    putSlider('cb-a', state.a, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const body = fatLine(new Array(18).fill(0), { color: M.blue, width: 2.5 });
    const rear = dot(M.grey, 0.28);
    const front = dot(M.grey, 0.28);
    const mark = dot(QUANTITY_COLORS.mark, 0.12);
    const rearForce = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, M.white, undefined, undefined, 0.016);
    const frontForce = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016);
    const rearName = label('rear', 0, 0, 0, 'graph-axis');
    const frontName = label('front', 0, 0, 0, 'graph-axis');
    const cmName = label('CM', 0, 0, 0, 'graph-axis');
    group.add(body, rear, front, mark, rearForce, frontForce, rearName, frontName, cmName);
    group.visible = false;
    return { group, body, rear, front, mark, rearForce, frontForce, rearName, frontName, cmName };
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
    return aboutFront(state);
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.body) return;
    ctx.grid.visible = false;
    const yr = -0.55;
    const xr = axleX('rear');
    const xf = axleX('front');
    const yb = 0.55;
    updateFatLine(h.body, [xr, yr, 0, xf, yr, 0, xf, yb, 0, xr + 0.4, yb + 0.35, 0, xr, yb, 0, xr, yr, 0]);
    h.rear.position.set(xr, yr, 0.04);
    h.front.position.set(xf, yr, 0.04);
    const xcm = xr + (computed.xRear / state.d) * (xf - xr);
    h.mark.position.set(xcm, state.h * 1.3, 0.08);
    h.cmName.position.set(xcm, state.h * 1.3 + 0.38, 0);
    const scale = 1.5 / Math.max(state.weight, 1);
    const rLen = Math.max(0.25, Math.min(1.7, Math.abs(computed.rear) * scale));
    const fLen = Math.max(0.25, Math.min(1.7, Math.abs(computed.front) * scale));
    placeArrow(h.rearForce, xr, yr, xr, yr + Math.sign(computed.rear || 1) * rLen, 0.06);
    placeArrow(h.frontForce, xf, yr, xf, yr + Math.sign(computed.front || 1) * fLen, 0.06);
    h.rearName.position.set(xr, yr - 0.45, 0);
    h.frontName.position.set(xf, yr - 0.45, 0);
  },
  law() {
    return [String.raw`x = s\,d`, String.raw`\Delta N = \dfrac{W a h}{g d}`];
  },
  readoutCells(state, computed) {
    return [
      ['CM from the rear axle', `${fmt(computed.xRear)} m`],
      ['Front axle', `${fmt(computed.front)} N`],
      ['Rear axle', `${fmt(computed.rear)} N`],
      ['Load shifted forward', `${fmt(computed.transfer)} N`],
    ];
  },
  coach(state, computed) {
    return {
      title: state.a > 0 ? 'Braking loads the front axle' : 'The center sits 52% of the way forward',
      body: [
        String.raw`On level ground the center of mass is $${fmt(computed.xRear)}$ m ahead of the rear axle. The front axle carries $${fmt(computed.front)}$ N and the rear $${fmt(computed.rear)}$ N.`,
        state.a > 0
          ? String.raw`Braking at $${fmt(state.a)}$ m/s² shifts $${fmt(computed.transfer)}$ N forward. The center of mass stays put. The axle forces move.`
          : 'The weight cancels when you solve for the center. Only the share and the wheelbase remain.',
        '<b>What the course model leaves out.</b> The book’s car gives the 2.5 m wheelbase and the 52% front share. It does not give a height or a braking rate. The 0.55 m height and the braking scenarios are ours, so the load shift has a number. A real stop also pitches the body on its springs, and the two wheels on one axle are not a single force.',
      ],
    };
  },
});

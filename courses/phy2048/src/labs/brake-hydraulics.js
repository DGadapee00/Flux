/**
 * Shows that the master cylinder’s pressure reaches every wheel cylinder, so the force
 * is multiplied by the ratio of the areas, and that the work balances.
 *
 * The closed form is F2 = F1 (d2/d1)². The check is A1 x1 = A2 x2 for an incompressible fluid.
 *
 * Numbers: OpenStax University Physics Vol. 1 §14.3, "Calculating Force on Wheel Cylinders:
 * Pascal Puts on the Brakes" (100 N on the pedal, 500 N on a 0.500 cm master piston,
 * 2.50 cm wheel pistons, 1.25×10⁴ N at each wheel).
 */
import * as THREE from 'three';
import { circleArea, hydraulicStroke } from '@flux/subjects/mechanics/fluids.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const base = { Fpedal: 100, lever: 5, d1: 0.005, d2: 0.025, x1: 0.02, wheels: 4 };
const SCENARIOS = [
  { ...base, id: 'book', name: 'The book’s brake' },
  { ...base, id: 'harder', name: 'Twice the pedal force', Fpedal: 200 },
  { ...base, id: 'larger', name: 'A 5.00 cm wheel piston', d2: 0.05 },
];

function closed(state) {
  const F1 = state.Fpedal * state.lever;
  const hydro = hydraulicStroke(F1, state.d1, state.d2, state.x1);
  const p = F1 / circleArea(state.d1);
  return { F1, F2: hydro.F2, x2: hydro.x2, W: hydro.W, p, wheels: state.wheels };
}

function piston(x, half) {
  return [x, -half, 0, x + 0.7, -half, 0, x + 0.7, half, 0, x, half, 0, x, -half, 0];
}

export default defineLab({
  id: 'brake-hydraulics',
  exam: 'u10',
  title: 'Brake hydraulics',
  app: true,
  hint: 'The pedal force is multiplied once by the lever and again by the area ratio. Each wheel cylinder sees the same pressure.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'brake-force',
      scenario: 'book',
      ask: 'Double the force on the pedal and leave the pistons alone. What happens to the force at each wheel?',
      apply(s) { s.Fpedal *= 2; },
      watch: [{ id: 'F2', label: 'the wheel force', get: (c) => c.F2 }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { F2: 2 },
      why: 'Pressure is force over area. Twice the input force is twice the pressure, and twice the force on the same wheel piston.',
    },
    {
      id: 'brake-diameter',
      scenario: 'book',
      ask: 'Double the wheel-cylinder diameter and leave the pedal alone. What happens to the force at each wheel?',
      apply(s) { s.d2 *= 2; },
      watch: [{ id: 'F2', label: 'the wheel force', get: (c) => c.F2 }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { F2: 4 },
      why: 'The area grows with the square of the diameter. The pressure is unchanged, so the force is multiplied by 4.',
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
    return `<div class="lab-block">${sliderRow('bk-F', 'Pedal force (N)', 100, 20, 400, 5)}${sliderRow('bk-d1', 'Master diameter (cm)', 0.5, 0.3, 2, 0.05)}${sliderRow('bk-d2', 'Wheel diameter (cm)', 2.5, 1, 8, 0.1)}${sliderRow('bk-x', 'Master travel (cm)', 2, 0.5, 6, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'bk-F', (s, v) => { s.Fpedal = v; });
    bindSlider(api, 'bk-d1', (s, v) => { s.d1 = v / 100; });
    bindSlider(api, 'bk-d2', (s, v) => { s.d2 = v / 100; });
    bindSlider(api, 'bk-x', (s, v) => { s.x1 = v / 100; });
  },
  syncControls(state) {
    putSlider('bk-F', state.Fpedal, 0);
    putSlider('bk-d1', state.d1 * 100, 2);
    putSlider('bk-d2', state.d2 * 100, 2);
    putSlider('bk-x', state.x1 * 100, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const master = fatLine(piston(-3.2, 0.45), { color: M.gold, width: 3 });
    const wheel = fatLine(piston(1.6, 1.5), { color: M.gold, width: 3 });
    const line = fatLine([-2.5, 0, 0, 1.6, 0, 0], { color: M.blue, width: 3 });
    const push = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.014);
    const out = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016);
    const name = label('brake', 0, -3.2, 0, 'graph-axis');
    group.add(master, wheel, line, push, out, name);
    group.visible = false;
    return { group, master, wheel, line, push, out, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.d1 = Math.max(state.d1, 1e-4);
    state.d2 = Math.max(state.d2, state.d1);
    state.lever = Math.max(state.lever, 1);
    state.x1 = Math.max(state.x1, 0);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const F1 = state.Fpedal * state.lever;
    const A1 = circleArea(state.d1);
    const A2 = circleArea(state.d2);
    const F2 = F1 * (A2 / A1);
    const x2 = state.x1 * (A1 / A2);
    if (Math.abs(F1 * state.x1 - F2 * x2) > 1e-8 * Math.max(1, Math.abs(F1 * state.x1))) return { F2: NaN };
    return { F1, F2, x2, W: F1 * state.x1, p: F1 / A1, wheels: state.wheels };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.master) return;
    ctx.grid.visible = false;
    const small = 0.28 + 0.5 * Math.min(state.d1 / 0.01, 1.5);
    const big = 0.6 + 1.5 * Math.min(state.d2 / 0.04, 1.6);
    updateFatLine(h.master, piston(-3.2, small));
    updateFatLine(h.wheel, piston(1.6, big));
    placeArrow(h.push, -4.4, 0, -3.3, 0, 0.05);
    placeArrow(h.out, 2.4, 0, 2.4 + 0.5 + big, 0, 0.05);
    h.name.element.textContent = `${state.wheels} wheels`;
  },
  law() {
    return [
      String.raw`F_2 = F_1\left(\dfrac{d_2}{d_1}\right)^{2}`,
      String.raw`F_1 x_1 = F_2 x_2`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Force at one wheel', `${fmt(computed.F2)} N`],
      ['Pressure', `${fmt(computed.p)} Pa`],
      ['Force on the master', `${fmt(computed.F1)} N`],
      ['Wheel travel', `${fmt(computed.x2 * 100)} cm`],
      ['Work', `${fmt(computed.W)} J`],
      ['Wheel cylinders', fmt(computed.wheels, 1)],
    ];
  },
  coach(state, computed) {
    return {
      title: 'The lever, then the liquid',
      body: [
        String.raw`The pedal’s $${fmt(state.Fpedal, 4)}$ N becomes $${fmt(computed.F1, 4)}$ N on the master piston, a lever of $${fmt(state.lever, 2)}$. Each wheel then pushes with $${fmt(computed.F2)}$ N. The master moves $${fmt(state.x1 * 100, 3)}$ cm and one wheel moves $${fmt(computed.x2 * 100, 3)}$ cm. The works match.`,
        '<b>What the course model leaves out.</b> The book’s 100 N is the driver’s push. The 500 N is already after the lever, and that is the force this picture multiplies. Air in the lines compresses before the pads move, which is why the lines are bled. A power brake adds a pump, so the driver is no longer the whole source of the work. Each of the four wheels gets the same force only while the pistons match.',
      ],
    };
  },
});

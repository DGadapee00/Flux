/**
 * Shows that pressure depends on depth and not on the width of the container, and that a
 * small piston balances a large one in the ratio of their areas.
 *
 * The closed form is p = ρgh and F2/F1 = (d2/d1)². The check sums thin slices of the
 * column and of the wall, and compares the piston areas directly.
 *
 * Dam numbers: OpenStax University Physics Vol. 1 §14.1, "What Force Must a Dam Withstand?"
 * (500 m wide, 80.0 m deep). Brake numbers: §14.3, "Calculating Force on Wheel Cylinders"
 * (0.500 cm and 2.50 cm, 500 N).
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  circleArea, columnPressure, gaugePressure, hydraulicStroke, uTubeHeight, wallForce, wallForceSlices,
} from '@flux/subjects/mechanics/fluids.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;

const base = { rho: 1000, depth: 80, width: 500, F1: 500, d1: 0.005, d2: 0.025, x1: 0.02, rho1: 1000, rho2: 800, h2: 0.2 };
const SCENARIOS = [
  { ...base, id: 'dam', name: 'The book’s dam, 500 m by 80.0 m' },
  { ...base, id: 'wide', name: 'Same depth, twice the width', width: 1000 },
  { ...base, id: 'brakes', name: 'The book’s wheel cylinder' },
  { ...base, id: 'utube', name: 'Two liquids in an open U-tube' },
];

function closed(state) {
  const wall = wallForce(state.rho, state.depth, state.width, G);
  const hydro = hydraulicStroke(state.F1, state.d1, state.d2, state.x1);
  const tube = uTubeHeight(state.rho1, state.rho2, state.h2);
  return {
    p: wall.p,
    F: wall.F,
    pBottom: gaugePressure(state.rho, state.depth, G),
    F2: hydro.F2,
    x2: hydro.x2,
    W: hydro.W,
    h1: tube.h1,
    diff: tube.diff,
  };
}

function box(x0, y0, x1, y1) {
  return [x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0, x0, y0, 0];
}

export default defineLab({
  id: 'pressure-depth',
  exam: 'u10',
  title: 'Pressure and depth',
  hint: 'Pressure is ρgh. A wider lake at the same depth pushes no harder per square metre. The pistons share one pressure, so the forces scale with the areas.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'depth-width',
      scenario: 'dam',
      ask: 'Double the width of the dam and leave the depth alone. What happens to the average pressure, and to the force on the dam?',
      apply(s) { s.width *= 2; },
      watch: [
        { id: 'p', label: 'the average pressure', get: (c) => c.p },
        { id: 'F', label: 'the force', get: (c) => c.F },
      ],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { p: 1, F: 2 },
      why: 'Pressure depends on depth, not on width. The force is pressure times area, and the area did double, so the force doubles.',
    },
    {
      id: 'depth-double',
      scenario: 'dam',
      ask: 'Double the water depth and leave the width alone. What happens to the average pressure, and to the force?',
      apply(s) { s.depth *= 2; },
      watch: [
        { id: 'p', label: 'the average pressure', get: (c) => c.p },
        { id: 'F', label: 'the force', get: (c) => c.F },
      ],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { p: 2, F: 4 },
      why: 'Average pressure is ρg times half the depth, so it doubles. The wetted area also doubles, and the force is the product, so the force is multiplied by 4.',
    },
    {
      id: 'depth-piston',
      scenario: 'brakes',
      ask: 'Double the wheel-cylinder diameter and leave the pedal force alone. What happens to the force at the wheel?',
      apply(s) { s.d2 *= 2; },
      watch: [{ id: 'F2', label: 'the wheel force', get: (c) => c.F2 }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { F2: 4 },
      why: 'Area scales with the square of the diameter. Doubling the diameter multiplies the area, and the force, by 4.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('dam', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('pd-depth', 'Depth (m)', 80, 5, 120, 1)}${sliderRow('pd-width', 'Width (m)', 500, 50, 1000, 10)}${sliderRow('pd-rho', 'Density (kg/m³)', 1000, 500, 14000, 10)}${sliderRow('pd-F', 'Pedal-cylinder force (N)', 500, 100, 2000, 10)}${sliderRow('pd-d2', 'Wheel diameter (cm)', 2.5, 0.5, 8, 0.1)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'pd-depth', (s, v) => { s.depth = v; });
    bindSlider(api, 'pd-width', (s, v) => { s.width = v; });
    bindSlider(api, 'pd-rho', (s, v) => { s.rho = v; });
    bindSlider(api, 'pd-F', (s, v) => { s.F1 = v; });
    bindSlider(api, 'pd-d2', (s, v) => { s.d2 = v / 100; });
  },
  syncControls(state) {
    putSlider('pd-depth', state.depth, 0);
    putSlider('pd-width', state.width, 0);
    putSlider('pd-rho', state.rho, 0);
    putSlider('pd-F', state.F1, 0);
    putSlider('pd-d2', state.d2 * 100, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const wall = fatLine(box(-4.6, -2.4, -1.2, 2.2), { color: M.grey, width: 2 });
    const water = fatLine(box(-4.4, -2.2, -1.4, 1.6), { color: M.blue, width: 2 });
    const arrows = [0, 1, 2, 3].map(() => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.012));
    const small = fatLine(box(1.2, -0.4, 1.7, 0.4), { color: M.gold, width: 3 });
    const large = fatLine(box(3.2, -1.6, 4.4, 1.6), { color: M.gold, width: 3 });
    const link = fatLine([-0.2, 0, 0, 1.2, 0, 0, 1.7, 0, 0, 3.2, 0, 0], { color: M.greyDark, width: 2 });
    const name = label('', 0, -3.3, 0, 'graph-axis');
    group.add(wall, water, small, large, link, name, ...arrows);
    group.visible = false;
    return { group, wall, water, arrows, small, large, link, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.depth = Math.max(state.depth, 0.1);
    state.width = Math.max(state.width, 1);
    state.d1 = Math.max(state.d1, 1e-4);
    state.d2 = Math.max(state.d2, state.d1);
    state.rho1 = Math.max(state.rho1, 1);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const pBottom = columnPressure(state.rho, state.depth, G);
    const F2 = state.F1 * (circleArea(state.d2) / circleArea(state.d1));
    const x2 = state.x1 * (circleArea(state.d1) / circleArea(state.d2));
    const h1 = state.h2 * state.rho2 / state.rho1;
    return {
      p: columnPressure(state.rho, state.depth / 2, G),
      F: wallForceSlices(state.rho, state.depth, state.width, G),
      pBottom,
      F2,
      x2,
      W: state.F1 * state.x1,
      h1,
      diff: state.h2 - h1,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.wall) return;
    ctx.grid.visible = false;
    const wide = 1.2 + 2.2 * Math.min(state.width, 1000) / 1000;
    updateFatLine(h.wall, box(-4.8, -2.4, -4.8 + wide, 2.2));
    const fill = -2.2 + 3.6 * Math.min(state.depth, 120) / 120;
    updateFatLine(h.water, box(-4.6, -2.2, -4.8 + wide - 0.15, fill));
    h.arrows.forEach((arrow, i) => {
      const y = -2 + i * 1.15;
      const len = 0.35 + i * 0.45;
      placeArrow(arrow, -4.5 + wide, y, -4.5 + wide + len, y, 0.04);
    });
    const big = 0.5 + 1.4 * Math.min(state.d2 / 0.05, 1.4);
    updateFatLine(h.large, box(3.1, -big, 4.3, big));
    h.name.element.textContent = state.scenarioId === 'utube'
      ? 'U-tube'
      : (state.scenarioId === 'brakes' ? 'pistons' : 'depth');
  },
  law() {
    return [
      String.raw`p = \rho g h`,
      String.raw`\dfrac{F_2}{F_1} = \left(\dfrac{d_2}{d_1}\right)^{2}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Average pressure', `${fmt(computed.p)} Pa`],
      ['Force on the wall', `${fmt(computed.F)} N`],
      ['Pressure at the bottom', `${fmt(computed.pBottom)} Pa`],
      ['Wheel force', `${fmt(computed.F2)} N`],
      ['Wheel travel', `${fmt(computed.x2)} m`],
      ['Work in', `${fmt(computed.W)} J`],
    ];
  },
  coach(state, computed) {
    if (state.scenarioId === 'utube') {
      return {
        title: 'The two arms meet at one pressure',
        body: [
          String.raw`The lighter column stands $${fmt(state.h2)}$ m above the interface. The heavier column stands $${fmt(computed.h1)}$ m. The difference is $${fmt(computed.diff)}$ m. The products ρh match, so the pressures match.`,
        ],
      };
    }
    if (state.scenarioId === 'brakes') {
      return {
        title: 'One pressure, two forces',
        body: [
          String.raw`$${fmt(state.F1, 4)}$ N on the small piston becomes $${fmt(computed.F2)}$ N on the wheel piston. The wheel moves $${fmt(computed.x2 * 100, 3)}$ cm while the pedal cylinder moves $${fmt(state.x1 * 100, 3)}$ cm. The work is $${fmt(computed.W)}$ J either way.`,
        ],
      };
    }
    return {
      title: 'Depth sets the pressure',
      body: [
        String.raw`At half the depth the pressure is $${fmt(computed.p)}$ Pa. At the bottom it is twice that, $${fmt(computed.pBottom)}$ Pa. The wall feels $${fmt(computed.F)}$ N. Widening the reservoir does not change the pressure.`,
      ],
    };
  },
});

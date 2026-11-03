/**
 * Shows that the period of a mass on a spring depends on m and k, not on the amplitude,
 * and that hanging the spring only moves the equilibrium.
 *
 * The closed form is T = 2π√(m/k). The check reads the period from RK4 zero crossings.
 *
 * Numbers: OpenStax University Physics Vol. 1 §15.1, "Determining the Equations of Motion
 * for a Block and a Spring" (2.00 kg, 32.0 N/m, released from rest at +0.0200 m).
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  shm, shmEnergy, springOmega, springPeriod, springPeriodFromCrossings, verticalShift,
} from '@flux/subjects/mechanics/oscillation.js';
import { Arrow, M, QUANTITY_COLORS, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const base = { m: 2, k: 32, A: 0.02, t: 0, hang: 'flat' };
const SCENARIOS = [
  { ...base, id: 'book', name: 'The book’s block, 2.00 kg' },
  { ...base, id: 'heavy', name: 'Twice the mass', m: 4 },
  { ...base, id: 'hang', name: 'The same spring, hung', hang: 'hang', t: 0.2 },
];

function closed(state) {
  const omega = springOmega(state.m, state.k);
  const T = springPeriod(state.m, state.k);
  const motion = shm({ A: state.A, omega, phi: 0, t: state.t });
  const shift = state.hang === 'hang' ? verticalShift(state.m, state.k, G) : 0;
  return {
    omega,
    T,
    f: 1 / T,
    vmax: state.A * omega,
    amax: state.A * omega * omega,
    E: shmEnergy(state.k, state.A),
    x: motion.x,
    v: motion.v,
    a: motion.a,
    shift,
  };
}

const ZIG = 8;

function coil(x0, x1, y, amp, vertical) {
  const pts = [];
  const segs = ZIG * 2;
  for (let i = 0; i <= segs; i += 1) {
    const along = x0 + ((x1 - x0) * i) / segs;
    const side = i === 0 || i === segs ? 0 : (i % 2 === 0 ? amp : -amp);
    if (vertical) pts.push(side, along, 0);
    else pts.push(along, y + side, 0);
  }
  return pts;
}

function box(cx, cy, w, h) {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  return [x0, y0, 0, x1, y0, 0, x1, y1, 0, x0, y1, 0, x0, y0, 0];
}

export default defineLab({
  id: 'spring-mass',
  exam: 'u11',
  title: 'Spring and mass',
  hint: 'The period cares about the mass and the spring. The amplitude, and hanging the spring, do not change it.',
  orbit: false,
  fit: { w: 12, h: 8 },
  camera: { pos: new THREE.Vector3(0, 0.2, 18), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'spring-mass',
      scenario: 'book',
      ask: 'Double the mass and leave the spring and the amplitude. What happens to the period?',
      apply(s) { s.m *= 2; },
      watch: [{ id: 'T', label: 'the period', get: (c) => c.T }],
      mode: 'factor',
      factors: [2, 1.414, 1, 0.5],
      expect: { T: 1.414 },
      why: 'T = 2π√(m/k). Twice the mass, and the same spring, multiplies the period by √2.',
    },
    {
      id: 'spring-amp',
      scenario: 'book',
      ask: 'Double the amplitude and leave the mass and the spring. What happens to the period?',
      apply(s) { s.A *= 2; },
      watch: [{ id: 'T', label: 'the period', get: (c) => c.T }],
      mode: 'factor',
      factors: [2, 1.414, 1, 0.5],
      expect: { T: 1 },
      why: 'The amplitude is not in T = 2π√(m/k). A larger swing takes a faster trip over a longer path, and the period stays put.',
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
    return `<div class="lab-block">${selectRow('sm-hang', 'Spring', [['flat', 'Horizontal'], ['hang', 'Hung vertically']], 'flat')}${sliderRow('sm-m', 'Mass (kg)', 2, 0.2, 8, 0.1)}${sliderRow('sm-k', 'Spring constant (N/m)', 32, 4, 80, 1)}${sliderRow('sm-A', 'Amplitude (cm)', 2, 0.5, 8, 0.1)}${sliderRow('sm-t', 'Time (s)', 0, 0, 3, 0.01)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'sm-hang', (s, v) => { s.hang = v; });
    bindSlider(api, 'sm-m', (s, v) => { s.m = v; });
    bindSlider(api, 'sm-k', (s, v) => { s.k = v; });
    bindSlider(api, 'sm-A', (s, v) => { s.A = v / 100; });
    bindSlider(api, 'sm-t', (s, v) => { s.t = v; });
  },
  syncControls(state) {
    putSelect('sm-hang', state.hang);
    putSlider('sm-m', state.m, 2);
    putSlider('sm-k', state.k, 1);
    putSlider('sm-A', state.A * 100, 2);
    putSlider('sm-t', state.t, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const wall = fatLine([0, 0, 0, 0, 1, 0], { color: M.grey, width: 6 });
    const spring = fatLine(coil(-3, -0.6, 0, 0.28, false), { color: M.gold, width: 3 });
    const block = fatLine(box(0, 0, 0.7, 0.7), { color: M.blue, width: 4 });
    const mark = fatLine([0, 0, 0, 0.4, 0, 0], { color: M.yellow, width: 2 });
    const speed = new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.012);
    const name = label('block', 0, -2.6, 0, 'graph-axis');
    group.add(wall, spring, block, mark, speed, name);
    group.visible = false;
    return { group, wall, spring, block, mark, speed, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.m = Math.max(state.m, 1e-4);
    state.k = Math.max(state.k, 1e-4);
    state.A = Math.max(state.A, 1e-6);
    state.t = Math.max(state.t, 0);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const measured = springPeriodFromCrossings(state.m, state.k);
    const want = springPeriod(state.m, state.k);
    if (!(Math.abs(measured - want) <= 1e-6 * Math.max(1, Math.abs(want)))) return { T: NaN };
    const omega = Math.sqrt(state.k / state.m);
    const phase = omega * state.t;
    const x = state.A * Math.cos(phase);
    return {
      omega,
      T: (2 * Math.PI) / omega,
      f: omega / (2 * Math.PI),
      vmax: state.A * omega,
      amax: state.A * omega * omega,
      E: 0.5 * state.k * state.A * state.A,
      x,
      v: -state.A * omega * Math.sin(phase),
      a: -omega * omega * x,
      shift: state.hang === 'hang' ? (state.m * G) / state.k : 0,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.spring) return;
    ctx.grid.visible = false;
    const swing = (computed.x / state.A) * 0.7;
    const hang = state.hang === 'hang';
    if (hang) {
      const end = 0.2 + swing;
      const blockY = end - 0.45;
      updateFatLine(h.wall, [-0.55, 2.4, 0, 0.55, 2.4, 0]);
      updateFatLine(h.spring, coil(2.4, end, 0, 0.22, true));
      updateFatLine(h.block, box(0, blockY, 0.7, 0.7));
      updateFatLine(h.mark, [-1.05, -0.25, 0, 1.05, -0.25, 0]);
      const dir = computed.v >= 0 ? 0.65 : -0.65;
      placeArrow(h.speed, 0.55, blockY, 0.55, blockY + dir, 0.05);
    } else {
      const end = -0.5 + swing;
      updateFatLine(h.wall, [-3.3, -0.7, 0, -3.3, 0.7, 0]);
      updateFatLine(h.spring, coil(-3.3, end - 0.35, 0, 0.28, false));
      updateFatLine(h.block, box(end + 0.15, 0, 0.75, 0.75));
      updateFatLine(h.mark, [-0.35, -1.15, 0, -0.35, -0.7, 0]);
      const reach = computed.v >= 0 ? 0.75 : -0.75;
      placeArrow(h.speed, end + 0.15, 0.55, end + 0.15 + reach, 0.55, 0.05);
    }
    h.name.element.textContent = hang ? 'hung' : 'horizontal';
  },
  law() {
    return [
      String.raw`\omega = \sqrt{k/m}`,
      String.raw`T = 2\pi\sqrt{m/k}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Period', `${fmt(computed.T)} s`],
      ['Angular frequency', `${fmt(computed.omega)} rad/s`],
      ['Position from equilibrium', `${fmt(computed.x)} m`],
      ['Velocity', `${fmt(computed.v)} m/s`],
      ['Max speed', `${fmt(computed.vmax)} m/s`],
      ['Max acceleration', `${fmt(computed.amax)} m/s²`],
      ['Energy', `${fmt(computed.E)} J`],
      ['Equilibrium shift', `${fmt(computed.shift)} m`],
    ];
  },
  coach(state, computed) {
    const hung = state.hang === 'hang';
    return {
      title: hung ? 'Gravity only moves the rest point' : 'The period ignores the amplitude',
      body: [
        hung
          ? String.raw`Hung, the spring stretches $${fmt(computed.shift)}$ m and then oscillates about that point. The period is still $${fmt(computed.T)}$ s, the same $${fmt(computed.omega)}$ rad/s as on the table.`
          : String.raw`Released from rest at $${fmt(state.A)}$ m, the block has period $${fmt(computed.T)}$ s. The fastest it gets is $${fmt(computed.vmax)}$ m/s. Doubling the amplitude leaves that period alone.`,
        'The picture stretches the swing so a 2 cm motion is visible. The readouts keep the metres.',
      ],
    };
  },
});

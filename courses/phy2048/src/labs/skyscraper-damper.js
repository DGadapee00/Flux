/**
 * Shows a uniform beam, pivoted at one end, tuned to a building’s sway, and the two
 * of them moving against each other.
 *
 * The closed form is T = 2π√(2L/3g), so L = 3g/(8π²f²). The check is an RK4 of the rod
 * alone, and an RK4 of the building and the beam together.
 *
 * Numbers: OpenStax University Physics Vol. 1 §15.4, "Reducing the Swaying of a Skyscraper"
 * (0.50 Hz, a uniform beam of 100 metric tons). The building’s mass, 1.00×10⁶ kg, is
 * illustrative. The section does not print it.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  angularPeriodFromCrossings, coupledDamper, tunedDamperLength,
} from '@flux/subjects/mechanics/oscillation.js';
import {
  M, QUANTITY_COLORS, createGraph, dot, fatLine, label, niceRange, updateFatLine,
} from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const BUILDING = 1e6;
const SPAN = 8;
const SAMPLES = 161;
/** Drawing metres per real metre of sway, and the factor on the beam angle. Both are named in the coach. */
const SWAY = 28;
const ANGLE = 8;
const BX = -4.05;
const base = { f: 0.5, m: 1e5, t: 0 };
const SCENARIOS = [
  { ...base, id: 'book', name: '0.50 Hz, 100 metric tons' },
  { ...base, id: 'faster', name: 'A 1.00 Hz sway', f: 1 },
  { ...base, id: 'later', name: 'The beam against the sway', t: 2.75 },
];

/** One integration over the plotted window, reused while the mass and the frequency stay put. */
let stored = { key: '' };
function history(f, m) {
  const key = `${f}|${m}`;
  if (stored.key === key) return stored;
  const L = tunedDamperLength(f, G);
  const run = coupledDamper({
    M: BUILDING, m, L, f, g: G, x0: 0.02, t1: SPAN, steps: 4000, trace: SAMPLES,
  });
  stored = { key, T: 1 / f, L, I: (m * L * L) / 3, run };
  return stored;
}

function atTime(run, t) {
  const ts = run.traceT;
  const tt = Math.min(Math.max(t, 0), ts[ts.length - 1]);
  let i = 1;
  while (i < ts.length - 1 && ts[i] < tt) i += 1;
  const span = ts[i] - ts[i - 1];
  const u = span > 0 ? (tt - ts[i - 1]) / span : 0;
  return {
    x: run.traceX[i - 1] + u * (run.traceX[i] - run.traceX[i - 1]),
    th: run.traceTh[i - 1] + u * (run.traceTh[i] - run.traceTh[i - 1]),
  };
}

function pose(state) {
  const row = history(state.f, state.m);
  const p = atTime(row.run, state.t);
  return { T: row.T, L: row.L, I: row.I, x: p.x, th: p.th, run: row.run };
}

/** A stepped tower, closed, in drawing coordinates. The sway is added at the centre. */
const TOWER = [
  [-1.15, -3.3], [1.15, -3.3], [1.15, -0.35], [0.78, -0.35], [0.78, 1.2],
  [0.48, 1.2], [0.48, 2.4], [0.2, 2.4], [0.2, 3.05], [0.055, 3.05],
  [0.055, 3.72], [-0.055, 3.72], [-0.055, 3.05], [-0.2, 3.05], [-0.2, 2.4],
  [-0.48, 2.4], [-0.48, 1.2], [-0.78, 1.2], [-0.78, -0.35], [-1.15, -0.35],
];
const FLOORS = [-2.55, -1.8, -1.05];

function towerLine(x) {
  const out = [];
  for (const [dx, y] of TOWER) out.push(BX + x + dx, y, 0);
  out.push(BX + x + TOWER[0][0], TOWER[0][1], 0);
  return out;
}

export default defineLab({
  id: 'skyscraper-damper',
  exam: 'u11',
  title: 'Skyscraper damper',
  app: true,
  hint: 'A beam tuned to the building’s frequency swings the other way and takes energy out of the sway. The plots are the true motion.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 12.2, h: 8.8 },
  camera: { pos: new THREE.Vector3(0.2, 0.1, 18), target: new THREE.Vector3(0.2, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'sway-fast',
      scenario: 'book',
      ask: 'Double the building’s frequency and retune the beam. What happens to the length?',
      apply(s) { s.f *= 2; },
      watch: [{ id: 'L', label: 'the beam length', get: (c) => c.L }],
      mode: 'factor',
      factors: [4, 1, 0.5, 0.25],
      expect: { L: 0.25 },
      why: 'The length follows 1/f². Twice the frequency is a quarter of the length.',
    },
    {
      id: 'sway-mass',
      scenario: 'book',
      ask: 'Double the beam’s mass and keep the frequency. What happens to the length?',
      apply(s) { s.m *= 2; },
      watch: [{ id: 'L', label: 'the beam length', get: (c) => c.L }],
      mode: 'factor',
      factors: [4, 1, 0.5, 0.25],
      expect: { L: 1 },
      why: 'For a uniform beam about one end the mass cancels. The length is set by the frequency and by g.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('book', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true } });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="sk-play">Play</button>${sliderRow('sk-f', 'Building frequency (Hz)', 0.5, 0.2, 1.5, 0.01)}${sliderRow('sk-m', 'Beam mass (metric tons)', 100, 20, 400, 5)}${sliderRow('sk-t', 'Time (s)', 0, 0, 8, 0.05)}</div>`;
  },
  bind(api) {
    document.getElementById('sk-play').addEventListener('click', () => api.toggleSweep());
    bindSlider(api, 'sk-f', (s, v) => { s.f = v; });
    bindSlider(api, 'sk-m', (s, v) => { s.m = v * 1000; });
    bindSlider(api, 'sk-t', (s, v) => { s.t = v; });
  },
  syncControls(state) {
    const play = document.getElementById('sk-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putSlider('sk-f', state.f, 2);
    putSlider('sk-m', state.m / 1000, 1);
    putSlider('sk-t', state.t, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const building = fatLine(towerLine(0), { color: M.grey, width: 3.5 });
    const floors = FLOORS.map(() => fatLine([0, 0, 0, 1, 0, 0], { color: M.greyDark, width: 1.4 }));
    const ground = fatLine([BX - 1.55, -3.3, 0, BX + 1.55, -3.3, 0], { color: M.greyDark, width: 2 });
    const beam = fatLine([0, 0, 0, 0, 1, 0], { color: M.gold, width: 5 });
    const bob = dot(M.blue, 0.16);
    const pivot = dot(M.yellow, 0.07);
    const name = label('damper', BX, 0, 0, 'graph-axis');
    const xGraph = createGraph(group, {
      x: -1.15, y: 0.95, w: 6.35, h: 2.25, color: QUANTITY_COLORS.x, samples: SAMPLES,
      name: 'building displacement (m)', xName: '',
    });
    const thGraph = createGraph(group, {
      x: -1.15, y: -3.3, w: 6.35, h: 2.25, color: M.gold, samples: SAMPLES,
      name: 'beam angle (rad)', xName: 'time (s)',
    });
    group.add(building, ground, beam, bob, pivot, name, ...floors);
    group.visible = false;
    return { group, building, floors, beam, bob, pivot, name, xGraph, thGraph };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.f = Math.max(state.f, 0.05);
    state.m = Math.max(state.m, 100);
    state.t = Math.max(state.t, 0);
    Object.assign(computed, pose(state));
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.t += dt;
    if (state.t > SPAN) state.t = 0;
    return true;
  },
  second(state) {
    const T = 1 / state.f;
    const L = (3 * G) / (8 * Math.PI * Math.PI * state.f * state.f);
    const I = (state.m * L * L) / 3;
    const period = angularPeriodFromCrossings((3 * G) / (2 * L), 0.005);
    if (!(Math.abs(period - T) <= 1e-4 * Math.max(1, T))) return { L: NaN };
    const beat = coupledDamper({
      M: BUILDING, m: state.m, L, f: state.f, g: G, x0: 0.02, t1: 6, steps: 5000,
    });
    const drift = Math.abs(beat.energy1 - beat.energy0);
    if (!(drift <= 1e-4 * Math.abs(beat.energy0) && beat.thPeak > 1e-3 && beat.opposed)) return { L: NaN };
    const shown = pose(state);
    return { T, L, I, x: shown.x, th: shown.th };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.building) return;
    ctx.grid.visible = false;
    const x = computed.x * SWAY;
    updateFatLine(h.building, towerLine(x));
    const half = 1.02;
    for (let i = 0; i < FLOORS.length; i += 1) {
      const y = FLOORS[i];
      updateFatLine(h.floors[i], [BX + x - half, y, 0.02, BX + x + half, y, 0.02]);
    }
    const pivotX = BX + x;
    const pivotY = 2.15;
    const reach = 1.7;
    const tipX = pivotX + reach * Math.sin(computed.th * ANGLE);
    const tipY = pivotY - reach * Math.cos(computed.th * ANGLE);
    updateFatLine(h.beam, [pivotX, pivotY, 0.04, tipX, tipY, 0.04]);
    h.pivot.position.set(pivotX, pivotY, 0.06);
    h.bob.position.set(tipX, tipY, 0.07);
    const oppose = computed.x * computed.th < 0;
    h.name.element.textContent = oppose ? 'opposing' : 'damper';
    h.name.position.set(tipX - 0.15, tipY - 0.38, 0);
    const xs = computed.run.traceX;
    const ths = computed.run.traceTh;
    const [xLo, xHi] = niceRange(xs, { pad: 0.18 });
    const [thLo, thHi] = niceRange(ths, { pad: 0.18 });
    const t = Math.min(state.t, SPAN);
    h.xGraph.set({ t0: 0, t1: SPAN, lo: xLo, hi: xHi, f: (time) => atTime(computed.run, time).x });
    h.xGraph.mark(t, computed.x);
    h.thGraph.set({ t0: 0, t1: SPAN, lo: thLo, hi: thHi, f: (time) => atTime(computed.run, time).th });
    h.thGraph.mark(t, computed.th);
  },
  law() {
    return [
      String.raw`T = 2\pi\sqrt{2L/(3g)}`,
      String.raw`L = 3g/(8\pi^{2} f^{2})`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Beam length', `${fmt(computed.L)} m`],
      ['Period', `${fmt(computed.T)} s`],
      ['Moment about the pivot', `${fmt(computed.I)} kg·m²`],
      ['Building displacement', `${fmt(computed.x)} m`],
      ['Beam angle', `${fmt(computed.th)} rad`],
      ['Building mass, fixed', `${fmt(BUILDING)} kg`],
    ];
  },
  coach(state, computed) {
    const oppose = computed.x * computed.th < 0;
    return {
      title: oppose ? 'The beam moves the other way' : 'Tune the length to the sway',
      body: [
        String.raw`A sway of $${fmt(state.f)}$ Hz has period $${fmt(computed.T)}$ s. A uniform beam about one end needs length $${fmt(computed.L)}$ m. The mass, $${fmt(state.m)}$ kg, cancels. At this instant the building is at $${fmt(computed.x)}$ m and the beam is at $${fmt(computed.th)}$ rad.`,
        '<b>What the course model leaves out.</b> The picture stretches the sway about 28 times and the angle about 8 times, so a few centimetres and a few degrees can be seen. The plots beside the tower are the true values. The building mass, 1.00×10⁶ kg, is not in the section. A real tower is not a rigid block on one spring, and the damper is often a tuned mass or a water tank, not a uniform beam. The small-angle equations miss a large storm.',
      ],
    };
  },
});
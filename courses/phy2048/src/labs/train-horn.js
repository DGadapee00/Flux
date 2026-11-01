/**
 * A locomotive sounding its horn at a crossing. Shows the higher pitch on the
 * way in, the lower pitch on the way out, and that the two shifts are not the
 * same size.
 *
 * Numbers: OpenStax University Physics Vol. 1 §17.7, "Calculating a Doppler
 * Shift". A 150 Hz horn, 35.0 m/s, in air at 340 m/s. The section prints 167 Hz
 * approaching and 136 Hz receding, and shifts of 17 Hz and 14 Hz.
 *
 * The closed form is f' = fv/(v ∓ vs). The check is the arrival gap of a pulse
 * train. The passing case uses the component of the train's velocity along the
 * line from the horn to the listener.
 */
import * as THREE from 'three';
import { doppler, dopplerFromArrivals } from '@flux/subjects/mechanics/waves.js';
import { M, QUANTITY_COLORS, createGraph, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const F = 150;
const V = 340;
const SPEED = 35;
const MISS = 12;
const WHEEL_N = 20;

function arc(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a), 0);
  }
  return out;
}

function lineSpeed(state) {
  if (state.mode === 'pass') {
    const x = (state.cycles - 1) * 90;
    return (-state.speed * x) / Math.hypot(x, state.miss);
  }
  return state.speed * state.sense;
}

function fields(state) {
  const vsLine = lineSpeed(state);
  const fObs = doppler({ f: state.f, v: state.v, vs: vsLine });
  const fin = doppler({ f: state.f, v: state.v, vs: state.speed });
  const fout = doppler({ f: state.f, v: state.v, vs: -state.speed });
  return { fObs, vsLine, rise: fin - state.f, drop: state.f - fout, fin, fout };
}

const head = { f: F, v: V, speed: SPEED, sense: 1, mode: 'head', miss: MISS };
const SCENARIOS = [
  { ...head, id: 'in', name: 'Approaching, 150 Hz at 35.0 m/s' },
  { ...head, id: 'out', name: 'Receding, the same horn', sense: -1 },
  { ...head, id: 'pass', name: 'Passing the crossing, 12 m off the track', mode: 'pass' },
];

const WHEELS = [-0.95, 0.15, 1.2];

function spokes(cx, cy, r, angle) {
  const pts = [];
  for (let k = 0; k < 3; k += 1) {
    const a = angle + (k * 2 * Math.PI) / 3;
    pts.push(cx, cy, 0.06, cx + r * Math.cos(a), cy + r * Math.sin(a), 0.06);
  }
  return pts;
}

export default defineLab({
  id: 'train-horn',
  exam: 'u13',
  title: 'Train horn',
  app: true,
  hint: 'A train horn is higher on the way in than it is low on the way out. The two shifts are not equal, and a listener moving at the train\'s speed would hear a different note.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 12.6, h: 9.8 },
  camera: { pos: new THREE.Vector3(0.2, 0.05, 18), target: new THREE.Vector3(0.2, 0.05, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'horn-recede',
      scenario: 'in',
      ask: 'The train has passed and is receding at the same speed. What happens to the pitch?',
      apply(s) { s.sense = -1; },
      watch: [{ id: 'f', label: 'the pitch', get: (c) => c.fObs }],
      mode: 'dir',
      expect: { f: 'smaller' },
      why: 'Receding puts a plus in the denominator, fv/(v + vs). The pitch falls, and it falls by less than the rise on the way in.',
    },
    {
      id: 'horn-symmetry',
      scenario: 'in',
      ask: 'Double the train\'s speed. Is the rise on the way in equal to the drop on the way out?',
      apply(s) { s.speed *= 2; },
      watch: [{ id: 'same', label: 'the rise equals the drop', get: (c) => Math.abs(c.rise - c.drop) < 0.5, mode: 'bool' }],
      expect: { same: false },
      why: 'fv/(v − vs) and fv/(v + vs) are not symmetric about f. The way in always shifts more than the way out.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('in', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true }, cycles: 0 });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="tr-play">Play</button>${sliderRow('tr-f', 'Horn frequency (Hz)', F, 80, 400, 1)}${sliderRow('tr-v', 'Sound speed (m/s)', V, 300, 400, 1)}${sliderRow('tr-s', 'Train speed (m/s)', SPEED, 5, 80, 1)}${sliderRow('tr-c', 'Cycles', 0, 0, 2, 0.01)}</div>`;
  },
  bind(api) {
    document.getElementById('tr-play').addEventListener('click', () => api.toggleSweep());
    bindSlider(api, 'tr-f', (s, v) => { s.f = v; });
    bindSlider(api, 'tr-v', (s, v) => { s.v = v; });
    bindSlider(api, 'tr-s', (s, v) => { s.speed = v; });
    bindSlider(api, 'tr-c', (s, v) => { s.cycles = v; });
  },
  syncControls(state) {
    const play = document.getElementById('tr-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putSlider('tr-f', state.f, 0);
    putSlider('tr-v', state.v, 0);
    putSlider('tr-s', state.speed, 0);
    putSlider('tr-c', state.cycles, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const railA = fatLine([-5.7, 0.5, 0, 5.7, 0.5, 0], { color: M.grey, width: 2 });
    const railB = fatLine([-5.7, 0.34, 0, 5.7, 0.34, 0], { color: M.greyDark, width: 1.4 });
    const ties = Array.from({ length: 14 }, (_, i) => {
      const x = -5.2 + i * 0.8;
      return fatLine([x, 0.28, 0, x, 0.5, 0], { color: M.greyDark, width: 2.2 });
    });
    const train = new THREE.Group();
    const tender = fatLine([-2.75, 0.58, 0, -1.62, 0.58, 0, -1.62, 1.28, 0, -2.75, 1.28, 0, -2.75, 0.58, 0], { color: M.grey, width: 2.6 });
    const coal = fatLine(arc(-2.18, 1.28, 0.52, 0, Math.PI, 14), { color: M.greyDark, width: 2 });
    const cab = fatLine([-1.6, 0.62, 0, -0.28, 0.62, 0, -0.28, 1.22, 0, -0.16, 1.22, 0, -0.16, 1.74, 0, -1.68, 1.74, 0, -1.68, 0.62, 0, -1.6, 0.62, 0], { color: M.grey, width: 2.8 });
    const window = fatLine([-1.42, 1.18, 0.03, -0.52, 1.18, 0.03, -0.52, 1.55, 0.03, -1.42, 1.55, 0.03, -1.42, 1.18, 0.03], { color: M.greyDark, width: 1.8 });
    const boiler = fatLine([-0.28, 0.64, 0, 1.5, 0.64, 0, 1.82, 0.86, 0, 1.82, 1.08, 0, 1.48, 1.24, 0, -0.28, 1.24, 0, -0.28, 0.64, 0], { color: M.grey, width: 2.8 });
    const stack = fatLine([1.12, 1.24, 0.03, 1.12, 1.78, 0.03, 1.42, 1.84, 0.03, 1.42, 1.24, 0.03], { color: M.greyDark, width: 2.4 });
    const pilot = fatLine([1.82, 0.48, 0.03, 2.4, 0.08, 0.03, 1.72, 0.08, 0.03, 1.82, 0.48, 0.03], { color: M.grey, width: 2.4 });
    const lamp = fatLine(arc(1.62, 0.98, 0.1, 0, 2 * Math.PI, 10), { color: M.yellow, width: 2 });
    const horn = fatLine([-0.95, 1.74, 0.04, -0.95, 2.02, 0.04, -0.58, 1.98, 0.04], { color: M.gold, width: 3 });
    const chassis = fatLine([-1.6, 0.5, 0.02, 1.7, 0.5, 0.02], { color: M.greyDark, width: 2 });
    const wheels = WHEELS.map((x) => fatLine(arc(x, 0.32, 0.3, 0, 2 * Math.PI, WHEEL_N), { color: M.grey, width: 2.4 }));
    const spokeLines = WHEELS.map(() => fatLine(new Array(18).fill(0), { color: M.greyDark, width: 1.8 }));
    const rod = fatLine([0, 0, 0, 1, 0, 0], { color: M.gold, width: 2 });
    const hornTag = label('horn', -0.75, 2.28, 0, 'graph-axis');
    train.scale.set(0.72, 0.72, 1);
    train.add(tender, coal, cab, window, boiler, stack, pilot, lamp, horn, chassis, rod, hornTag, ...wheels, ...spokeLines);
    const person = fatLine([1.55, 0.5, 0.12, 1.55, 1.28, 0.12, 1.28, 0.98, 0.12, 1.55, 1.28, 0.12, 1.82, 1.52, 0.12, 1.55, 1.28, 0.12, 1.55, 1.66, 0.12], { color: M.blue, width: 2.4 });
    const head = fatLine(arc(1.55, 1.88, 0.2, 0, 2 * Math.PI, 14).map((v, i) => (i % 3 === 2 ? 0.12 : v)), { color: M.blue, width: 2.2 });
    const post = fatLine([0.55, 0.5, 0.08, 0.55, 2.05, 0.08], { color: M.grey, width: 2.2 });
    const buckA = fatLine([0.18, 2.15, 0.1, 0.92, 2.55, 0.1], { color: M.white, width: 2.4 });
    const buckB = fatLine([0.18, 2.55, 0.1, 0.92, 2.15, 0.1], { color: M.white, width: 2.4 });
    const who = label('listener', 1.55, 2.32, 0, 'graph-axis');
    const graph = createGraph(group, {
      x: -4.8, y: -4.15, w: 8.5, h: 1.85, color: QUANTITY_COLORS.x, samples: 141,
      name: 'pitch (Hz)', xName: '',
    });
    const xCap = label('radial (m/s)', -0.55, -4.95, 0, 'graph-axis');
    group.add(railA, railB, train, person, head, post, buckA, buckB, who, xCap, ...ties);
    group.visible = false;
    return { group, train, spokeLines, rod, graph, xCap };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.f = Math.max(state.f, 1);
    state.v = Math.max(state.v, 1);
    state.speed = Math.min(Math.max(state.speed, 0.5), state.v * 0.9);
    Object.assign(computed, fields(state));
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.cycles = (state.cycles + dt) % 2;
    return true;
  },
  second(state) {
    const row = fields(state);
    const got = dopplerFromArrivals({ f: state.f, v: state.v, vs: row.vsLine });
    if (!(Math.abs(got - row.fObs) <= 0.004 * Math.max(row.fObs, 1))) return { fObs: NaN };
    return { fObs: row.fObs, rise: row.rise };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.train) return;
    ctx.grid.visible = false;
    const x = state.mode === 'pass' ? -2.55 + state.cycles * 2.65 : (state.sense > 0 ? -2.35 : 4.05);
    h.train.position.set(x, 0.5, 0);
    const spin = state.cycles * Math.PI * 3;
    h.spokeLines.forEach((spoke, i) => {
      updateFatLine(spoke, spokes(WHEELS[i], 0.32, 0.22, spin));
    });
    const pin = 0.2;
    updateFatLine(h.rod, [
      WHEELS[0] + pin * Math.cos(spin), 0.32 + pin * Math.sin(spin), 0.07,
      WHEELS[2] + pin * Math.cos(spin), 0.32 + pin * Math.sin(spin), 0.07,
    ]);
    const span = 70;
    h.graph.set({
      t0: -span,
      t1: span,
      lo: 110,
      hi: 210,
      name: 'pitch (Hz)',
      f: (u) => doppler({ f: state.f, v: state.v, vs: u }),
    });
    h.graph.mark(computed.vsLine, computed.fObs);
  },
  law() {
    return [
      String.raw`f' = f\dfrac{v}{v \mp v_s}`,
      String.raw`v_s > 0\ \mathrm{toward\ the\ listener}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Heard', `${fmt(computed.fObs)} Hz`],
      ['Radial speed', `${fmt(computed.vsLine)} m/s`],
      ['Horn', `${fmt(state.f)} Hz`],
      ['Train speed', `${fmt(state.speed)} m/s`],
      ['Rise, head-on', `${fmt(computed.rise)} Hz`],
      ['Drop, head-on', `${fmt(computed.drop)} Hz`],
    ];
  },
  coach(state, computed) {
    const passing = state.mode === 'pass';
    return {
      title: passing ? 'Passing the crossing' : (state.sense > 0 ? 'Approaching' : 'Receding'),
      body: [
        passing
          ? String.raw`The horn is ${fmt(state.f)} Hz and the train is doing ${fmt(state.speed)} m/s. Only the part of that velocity aimed at the listener shifts the pitch, so the note heard now is ${fmt(computed.fObs)} Hz. Far up the track this is the head-on pair: ${fmt(computed.fin)} Hz in, ${fmt(computed.fout)} Hz out.`
          : String.raw`Head-on, the pitch is $f v/(v \mp v_s) = ${fmt(computed.fObs)}$ Hz. Section 17.7 prints 167 Hz approaching and 136 Hz receding, from 150 Hz at 35.0 m/s in air at 340 m/s. The rise is about 17 Hz and the drop is 14 Hz.`,
        '<b>What the course model leaves out.</b> The printed numbers assume the train is far enough that its motion is along the line to the listener. A 12 m miss, used only while it passes, is not in the section. The horn is not a point, the ground reflects, and wind is ignored. The picture takes two seconds to pass and the locomotive is enlarged. The plot is the true pitch.',
      ],
    };
  },
});

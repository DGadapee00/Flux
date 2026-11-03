/**
 * A horn and a listener, then a jet past the speed of sound. Shows that a
 * moving source and a moving listener at one speed do not give the same pitch,
 * and that past Mach 1 the wavefronts form a cone.
 *
 * Numbers: OpenStax University Physics Vol. 1 §17.7. A 150 Hz horn at 35.0 m/s
 * in 340 m/s air prints 167 Hz on the way in and 136 Hz on the way out.
 * The jet is §17.8: 3529.60 km/h, Mach 2.85. The cone angle is computed here.
 *
 * The closed form is f' = f(v + vo)/(v − vs) and sin θ = 1/M. The check is a
 * pulse train's arrival gaps, and the tangent from the source to a wavefront.
 */
import * as THREE from 'three';
import {
  doppler, dopplerFromArrivals, machAngle, machAngleFromWavefront,
} from '@flux/subjects/mechanics/waves.js';
import { M, QUANTITY_COLORS, createGraph, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSlider, defineLab, fmt, putSlider, sliderRow } from './define.js';

const F = 150;
const V = 340;
const VS = 35;
const JET = (3529.6 * 1000) / 3600;
const SOUND = JET / 2.85;
const ARC = 32;
const DEG = 180 / Math.PI;

function arc(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a), 0);
  }
  return out;
}

function fields(state) {
  const supersonic = state.vs > state.v;
  const M = Math.abs(state.vs) / state.v;
  const fObs = supersonic ? state.f : doppler({ f: state.f, v: state.v, vo: state.vo, vs: state.vs });
  return {
    fObs,
    M,
    theta: supersonic ? machAngle(M) : 0,
    supersonic,
    shift: fObs - state.f,
  };
}

const horn = { f: F, v: V, vs: VS, vo: 0, kind: 'horn' };
const SCENARIOS = [
  { ...horn, id: 'approach', name: 'A 150 Hz horn approaching at 35.0 m/s' },
  { ...horn, id: 'walker', name: 'The listener walks toward a still horn at 35.0 m/s', vs: 0, vo: VS },
  { ...horn, id: 'shock', name: 'Mach 2.85, 3529.60 km/h', v: SOUND, vs: JET, kind: 'shock' },
];

export default defineLab({
  id: 'doppler',
  exam: 'u13',
  title: 'Doppler effect',
  hint: 'A source moving toward you raises the pitch more than you do by walking toward the source at the same speed. Past the speed of sound the crests pile into a cone.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 12.2, h: 9.4 },
  camera: { pos: new THREE.Vector3(0.15, 0.1, 18), target: new THREE.Vector3(0.15, 0.1, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'doppler-who',
      scenario: 'approach',
      ask: 'Keep 35.0 m/s, but let the listener walk toward a still horn. What happens to the pitch?',
      apply(s) { s.vs = 0; s.vo = VS; },
      watch: [{ id: 'f', label: 'the observed frequency', get: (c) => c.fObs }],
      mode: 'dir',
      expect: { f: 'smaller' },
      why: 'The listener adds speed in the numerator, f(v + vo)/v. The horn subtracts it in the denominator, fv/(v − vs), and that raises the pitch more.',
    },
    {
      id: 'doppler-cone',
      scenario: 'approach',
      ask: 'Send the horn at twice the speed of sound. Does a shock cone form?',
      apply(s) { s.vs = 2 * s.v; },
      watch: [{ id: 'cone', label: 'a shock cone', get: (c) => c.supersonic, mode: 'bool' }],
      expect: { cone: true },
      why: 'Past Mach 1 the source outruns its own crests. They pile up on a cone with sin θ = v/vs. The subsonic formula has already divided by zero.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('approach', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true }, cycles: 0 });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="do-play">Play</button>${sliderRow('do-f', 'Emitted frequency (Hz)', F, 50, 400, 1)}${sliderRow('do-v', 'Sound speed (m/s)', V, 300, 400, 1)}${sliderRow('do-vs', 'Source speed toward you (m/s)', VS, -80, 1200, 1)}${sliderRow('do-vo', 'Your speed toward the source (m/s)', 0, -40, 80, 1)}</div>`;
  },
  bind(api) {
    document.getElementById('do-play').addEventListener('click', () => api.toggleSweep());
    bindSlider(api, 'do-f', (s, v) => { s.f = v; });
    bindSlider(api, 'do-v', (s, v) => { s.v = v; });
    bindSlider(api, 'do-vs', (s, v) => { s.vs = v; });
    bindSlider(api, 'do-vo', (s, v) => { s.vo = v; });
  },
  syncControls(state) {
    const play = document.getElementById('do-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putSlider('do-f', state.f, 0);
    putSlider('do-v', state.v, 0);
    putSlider('do-vs', state.vs, 0);
    putSlider('do-vo', state.vo, 0);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const hornBody = fatLine([-3.7, 0.15, 0, -3.15, 0.15, 0, -3.15, 0.85, 0, -3.7, 0.85, 0, -3.7, 0.15, 0], { color: M.grey, width: 2.6 });
    const bell = fatLine([-3.15, 0.28, 0.02, -2.55, -0.05, 0.02, -2.55, 1.05, 0.02, -3.15, 0.72, 0.02], { color: M.gold, width: 2.6 });
    const person = fatLine([4.05, -0.2, 0, 4.05, 0.7, 0, 3.75, 0.4, 0, 4.05, 0.7, 0, 4.4, 0.95, 0, 4.05, 0.7, 0, 4.05, 1.05, 0], { color: M.blue, width: 2.4 });
    const head = fatLine(arc(4.05, 1.28, 0.22, 0, 2 * Math.PI, 16), { color: M.blue, width: 2.2 });
    const jet = fatLine([
      0.2, 0.45, 0, 1.5, 0.45, 0, 2.05, 0.62, 0, 1.55, 0.78, 0, 0.15, 0.78, 0,
      -0.35, 1.15, 0, -0.7, 1.15, 0, -0.35, 0.78, 0, -0.55, 0.45, 0, 0.2, 0.45, 0,
    ], { color: M.grey, width: 2.6 });
    const wing = fatLine([0.55, 0.6, 0.02, 0.15, -0.15, 0.02, 0.85, 0.6, 0.02], { color: M.greyDark, width: 2.2 });
    const waves = Array.from({ length: 4 }, () => fatLine(new Array((ARC + 1) * 3).fill(0), { color: M.blue, width: 1.5 }));
    const coneA = fatLine([0, 0, 0, 1, 0, 0], { color: M.gold, width: 2.4 });
    const coneB = fatLine([0, 0, 0, 1, 0, 0], { color: M.gold, width: 2.4 });
    const who = label('listener', 4.05, 1.75, 0, 'graph-axis');
    const graph = createGraph(group, {
      x: -4.7, y: -4.05, w: 8.6, h: 1.9, color: QUANTITY_COLORS.x, samples: 141,
      name: 'pitch (Hz)', xName: '',
    });
    const xCap = label('source (m/s)', -0.4, -4.85, 0, 'graph-axis');
    group.add(hornBody, bell, person, head, jet, wing, coneA, coneB, who, xCap, ...waves);
    group.visible = false;
    return { group, hornBody, bell, jet, wing, waves, coneA, coneB, graph, xCap };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.f = Math.max(state.f, 1);
    state.v = Math.max(state.v, 1);
    Object.assign(computed, fields(state));
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.cycles = (state.cycles + dt) % 2;
    return true;
  },
  second(state) {
    const row = fields(state);
    if (row.supersonic) {
      const got = machAngleFromWavefront(row.M);
      if (!(Math.abs(got - row.theta) <= 0.01)) return { theta: NaN };
      return { fObs: row.fObs, theta: row.theta };
    }
    const got = dopplerFromArrivals({ f: state.f, v: state.v, vo: state.vo, vs: state.vs });
    if (!(Math.abs(got - row.fObs) <= 0.004 * Math.max(row.fObs, 1))) return { fObs: NaN };
    return { fObs: row.fObs, theta: row.theta };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.waves) return;
    ctx.grid.visible = false;
    const shock = computed.supersonic;
    h.hornBody.visible = !shock;
    h.bell.visible = !shock;
    h.jet.visible = shock;
    h.wing.visible = shock;
    h.coneA.visible = shock;
    h.coneB.visible = shock;
    const origin = shock ? 1.7 : -2.55;
    h.waves.forEach((wave, k) => {
      const phase = ((k / 4) + state.cycles * 0.5) % 1;
      const radius = 0.35 + phase * (shock ? 1.6 : 2.4);
      const sweep = shock ? Math.PI * 0.85 : 1.15;
      updateFatLine(wave, arc(origin - (shock ? 1.4 : 0), 0.5, radius, Math.PI - sweep, Math.PI + sweep, ARC));
    });
    if (shock) {
      const nose = 2.05;
      const len = 3.2;
      const th = computed.theta;
      updateFatLine(h.coneA, [nose, 0.62, 0.04, nose - len * Math.cos(th), 0.62 + len * Math.sin(th), 0.04]);
      updateFatLine(h.coneB, [nose, 0.62, 0.04, nose - len * Math.cos(th), 0.62 - len * Math.sin(th), 0.04]);
      h.xCap.element.textContent = 'Mach';
      h.graph.set({
        t0: 1.05,
        t1: 4,
        lo: 0,
        hi: 80,
        name: 'angle (°)',
        f: (m) => machAngle(m) * DEG,
      });
      h.graph.mark(computed.M, computed.theta * DEG);
    } else {
      const movingListener = Math.abs(state.vo) > Math.abs(state.vs);
      h.xCap.element.textContent = movingListener ? 'listener (m/s)' : 'source (m/s)';
      const t0 = movingListener ? -20 : -80;
      const t1 = movingListener ? 80 : 200;
      const fOf = (u) => (movingListener
        ? doppler({ f: state.f, v: state.v, vo: u, vs: 0 })
        : doppler({ f: state.f, v: state.v, vo: 0, vs: u }));
      const mark = movingListener ? state.vo : state.vs;
      h.graph.set({
        t0,
        t1,
        lo: Math.min(fOf(t0), fOf(0)) - 10,
        hi: fOf(Math.min(t1, state.v * 0.55)) + 15,
        name: 'pitch (Hz)',
        f: fOf,
      });
      h.graph.mark(mark, computed.fObs);
    }
  },
  law() {
    return [
      String.raw`f' = f\dfrac{v \pm v_o}{v \mp v_s}`,
      String.raw`\sin\theta = v/v_s`,
    ];
  },
  readoutCells(state, computed) {
    if (computed.supersonic) {
      return [
        ['Mach', fmt(computed.M)],
        ['Cone angle', `${fmt(computed.theta * DEG)}°`],
        ['Source speed', `${fmt(state.vs)} m/s`],
        ['Sound speed', `${fmt(state.v)} m/s`],
        ['Emitted', `${fmt(state.f)} Hz`],
        ['Formula', 'the cone, not f\''],
      ];
    }
    return [
      ['Observed', `${fmt(computed.fObs)} Hz`],
      ['Shift', `${fmt(computed.shift)} Hz`],
      ['Emitted', `${fmt(state.f)} Hz`],
      ['Source toward you', `${fmt(state.vs)} m/s`],
      ['You toward source', `${fmt(state.vo)} m/s`],
      ['Sound speed', `${fmt(state.v)} m/s`],
    ];
  },
  coach(state, computed) {
    if (computed.supersonic) {
      return {
        title: 'A shock cone',
        body: [
          String.raw`The source is at Mach ${fmt(computed.M)}. The half-angle satisfies $\sin\theta = 1/M$, so $\theta = ${fmt(computed.theta * DEG)}^{\circ}$. Section 17.8 gives 3529.60 km/h and Mach 2.85. It does not print the angle. The angle is $\sin^{-1}(1/2.85)$.`,
          'The picture holds the jet still and draws the cone around it. A boom is this cone sweeping over a listener, not the moment the jet first passes Mach 1.',
        ],
      };
    }
    const other = Math.abs(state.vo) > 1 && Math.abs(state.vs) < 1;
    return {
      title: other ? 'The listener moves' : 'The horn moves',
      body: [
        String.raw`The observed pitch is ${fmt(computed.fObs)} Hz, a shift of ${fmt(computed.shift)} Hz from ${fmt(state.f)} Hz. Section 17.7 prints 167 Hz as the horn approaches and 136 Hz as it recedes. The rises are not equal: 17 Hz on the way in, 14 Hz on the way out.`,
        other
          ? 'Walking toward a still horn uses the numerator, v + vo. That is less of a rise than the horn coming at you, which shrinks the denominator.'
          : 'A positive source speed points toward the listener and shrinks the denominator. The crests in the picture are spaced for the eye. The plot is the true pitch.',
      ],
    };
  },
});

/**
 * An organ pipe, stopped or open, and two tuning forks. Shows that a tube
 * closed at one end has only odd harmonics and f1 = v/(4L), that an open tube
 * has every whole multiple and f1 = v/(2L), and that two tones beat at |f1 − f2|.
 *
 * Numbers: OpenStax University Physics Vol. 1 §17.5. A stopped pipe with a
 * 128 Hz fundamental in 22.0 °C air prints L = 0.672 m, from v = 344 m/s.
 * The fourth overtone is the n = 9 mode, printed as 1.15 kHz. The forks are
 * §17.6, 256 Hz and 512 Hz, which beat at 256 Hz.
 *
 * The closed form is the mode formula and the beat formula. The check is the
 * period read from a finite-difference pipe, and the spacing of the envelope.
 */
import * as THREE from 'three';
import {
  beatFrequency, beatPeriodFromEnvelope, closedPipeFrequency, closedPipeLength,
  modeFrequency, pipePeriodFromCrossings, soundSpeed, wavelength,
} from '@flux/subjects/mechanics/waves.js';
import { M, QUANTITY_COLORS, createGraph, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const TEMP = 22;
const V0 = soundSpeed(TEMP);
const LENGTH = closedPipeLength(V0, 128);
const NSHAPE = 64;

function fields(state) {
  const v = soundSpeed(state.temp);
  if (state.end === 'beats') {
    const f = beatFrequency(state.f1, state.f2);
    return { v, f, L: state.length, lambda: wavelength(v, state.f1), n: 0, beats: true };
  }
  const n = state.end === 'closed' ? 2 * state.m - 1 : state.m;
  const f = state.end === 'closed' ? closedPipeFrequency(n, v, state.length) : modeFrequency(n, v, state.length);
  return { v, f, L: state.length, lambda: wavelength(v, f), n, beats: false };
}

const base = { temp: TEMP, length: LENGTH, end: 'closed', m: 1, f1: 256, f2: 512 };
const SCENARIOS = [
  { ...base, id: 'stopped', name: 'Stopped pipe, 128 Hz, 22.0 °C' },
  { ...base, id: 'open', name: 'The same pipe, open at both ends', end: 'open' },
  { ...base, id: 'forks', name: 'Forks at 256 Hz and 512 Hz', end: 'beats' },
];

function modePoints(end, n, amp) {
  const pts = new Array(NSHAPE * 3);
  for (let i = 0; i < NSHAPE; i += 1) {
    const s = i / (NSHAPE - 1);
    const y = -0.35 + s * 3.15;
    let shape;
    // s = 0 is the mouth. A stopped pipe is open there and closed at the cap.
    if (end === 'closed') shape = Math.cos(n * Math.PI * s / 2);
    else shape = Math.cos(n * Math.PI * s);
    pts[i * 3] = 0.85 + amp * shape;
    pts[i * 3 + 1] = y;
    pts[i * 3 + 2] = 0.03;
  }
  return pts;
}

export default defineLab({
  id: 'pipe-modes',
  exam: 'u13',
  title: 'Pipe modes',
  hint: 'A stopped pipe holds only odd harmonics, and its lowest note is v/(4L). Open both ends and every whole multiple appears, at twice that fundamental. Two close tones beat at the difference.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 11.6, h: 9.6 },
  camera: { pos: new THREE.Vector3(0.35, 0.15, 18), target: new THREE.Vector3(0.35, 0.15, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'pipe-length',
      scenario: 'stopped',
      ask: 'Double the length of the stopped pipe. What happens to the fundamental?',
      apply(s) { s.length *= 2; },
      watch: [{ id: 'f', label: 'the frequency', get: (c) => c.f }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { f: 0.5 },
      why: 'f1 = v/(4L). Twice the length halves the frequency. The speed of sound did not change.',
    },
    {
      id: 'pipe-open',
      scenario: 'stopped',
      ask: 'Open the stopped end, and keep the length. What happens to the fundamental?',
      apply(s) { s.end = 'open'; },
      watch: [{ id: 'f', label: 'the frequency', get: (c) => c.f }],
      mode: 'factor',
      factors: [4, 2, 1, 0.5],
      expect: { f: 2 },
      why: 'An open pipe fits half a wavelength, so f1 = v/(2L). That is twice the stopped fundamental, v/(4L).',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('stopped', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true }, cycles: 0 });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="pi-play">Play</button>${selectRow('pi-end', 'Pipe', [['closed', 'Stopped'], ['open', 'Open'], ['beats', 'Two forks']], 'closed')}${sliderRow('pi-T', 'Air temperature (°C)', TEMP, 0, 40, 0.5)}${sliderRow('pi-L', 'Length (m)', LENGTH, 0.2, 2, 0.001)}${sliderRow('pi-m', 'Mode', 1, 1, 5, 1)}${sliderRow('pi-c', 'Cycles', 0, 0, 2, 0.01)}</div>`;
  },
  bind(api) {
    document.getElementById('pi-play').addEventListener('click', () => api.toggleSweep());
    bindSelect(api, 'pi-end', (s, v) => { s.end = v; });
    bindSlider(api, 'pi-T', (s, v) => { s.temp = v; });
    bindSlider(api, 'pi-L', (s, v) => { s.length = v; });
    bindSlider(api, 'pi-m', (s, v) => { s.m = Math.round(v); });
    bindSlider(api, 'pi-c', (s, v) => { s.cycles = v; });
  },
  syncControls(state) {
    const play = document.getElementById('pi-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putSelect('pi-end', state.end);
    putSlider('pi-T', state.temp, 1);
    putSlider('pi-L', state.length, 3);
    putSlider('pi-m', state.m, 0);
    putSlider('pi-c', state.cycles, 2);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const wall = fatLine([-0.42, -0.4, 0, -0.42, 2.85, 0, 0.42, 2.85, 0, 0.42, -0.4, 0], { color: M.grey, width: 2.8 });
    const bore = fatLine([-0.22, -0.15, 0.02, -0.22, 2.7, 0.02, 0.22, 2.7, 0.02, 0.22, -0.15, 0.02], { color: M.greyDark, width: 1.4 });
    const mouth = fatLine([0.42, -0.05, 0.03, 0.62, 0.15, 0.03, 0.42, 0.35, 0.03], { color: M.gold, width: 2.4 });
    const cap = fatLine([-0.5, 2.85, 0.04, 0.5, 2.85, 0.04], { color: M.grey, width: 4 });
    const shape = fatLine(new Array(NSHAPE * 3).fill(0), { color: M.gold, width: 2.4 });
    const nodes = Array.from({ length: 5 }, () => fatLine([0, 0, 0, 0.01, 0, 0], { color: M.yellow, width: 6 }));
    const forkA = fatLine([-2.55, -0.15, 0, -2.55, 1.45, 0, -1.85, 1.45, 0, -1.85, -0.15, 0], { color: M.gold, width: 2.6 });
    const forkB = fatLine([1.55, -0.15, 0, 1.55, 1.45, 0, 2.25, 1.45, 0, 2.25, -0.15, 0], { color: M.blue, width: 2.6 });
    const tagA = label('256 Hz', -2.05, 1.9, 0, 'graph-axis');
    const tagB = label('512 Hz', 1.85, 1.9, 0, 'graph-axis');
    const graph = createGraph(group, {
      x: -4.5, y: -4.15, w: 8.2, h: 1.85, color: QUANTITY_COLORS.x, samples: 161,
      name: 'antinode', xName: 'time (s)',
    });
    group.add(wall, bore, mouth, cap, shape, forkA, forkB, tagA, tagB, ...nodes);
    group.visible = false;
    return { group, wall, bore, mouth, cap, shape, nodes, forkA, forkB, tagA, tagB, graph };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.length = Math.max(state.length, 0.05);
    state.m = Math.max(1, Math.round(state.m));
    Object.assign(computed, fields(state));
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.cycles = (state.cycles + dt) % 2;
    return true;
  },
  second(state) {
    const row = fields(state);
    if (row.beats) {
      const got = beatPeriodFromEnvelope({ f1: state.f1, f2: state.f2 });
      const want = 1 / row.f;
      if (!(Math.abs(got - want) <= 0.04 * want)) return { f: NaN };
      return { v: row.v, f: row.f };
    }
    const got = pipePeriodFromCrossings({
      speed: row.v, length: state.length, end: state.end, harmonic: row.n,
    });
    const want = 1 / row.f;
    if (!(Math.abs(got - want) <= 0.006 * want)) return { f: NaN };
    return { v: row.v, f: row.f, L: row.L };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.shape) return;
    ctx.grid.visible = false;
    const beats = computed.beats;
    h.wall.visible = !beats;
    h.bore.visible = !beats;
    h.mouth.visible = !beats;
    h.cap.visible = !beats && state.end === 'closed';
    h.shape.visible = !beats;
    h.forkA.visible = beats;
    h.forkB.visible = beats;
    h.tagA.visible = beats;
    h.tagB.visible = beats;
    const phase = Math.cos(2 * Math.PI * state.cycles);
    if (!beats) {
      updateFatLine(h.shape, modePoints(state.end, computed.n, 0.7 * phase));
      h.nodes.forEach((node, i) => {
        const closed = state.end === 'closed';
        const count = closed ? (computed.n + 1) / 2 : computed.n;
        node.visible = i < count;
        if (i >= count) return;
        const s = closed ? (2 * i + 1) / computed.n : (2 * i + 1) / (2 * computed.n);
        const y = -0.35 + Math.min(Math.max(s, 0), 1) * 3.15;
        updateFatLine(node, [0.85, y, 0.05, 0.95, y, 0.05]);
      });
    } else {
      h.nodes.forEach((node) => { node.visible = false; });
    }
    const period = computed.beats ? 2 / computed.f : 1 / computed.f;
    h.graph.set({
      t0: 0,
      t1: period,
      lo: -2.2,
      hi: 2.2,
      name: computed.beats ? 'sum' : 'antinode',
      f: (t) => (computed.beats
        ? Math.sin(2 * Math.PI * state.f1 * t) + Math.sin(2 * Math.PI * state.f2 * t)
        : Math.cos(2 * Math.PI * computed.f * t)),
    });
    const now = (state.cycles / 2) * period;
    const yNow = computed.beats
      ? Math.sin(2 * Math.PI * state.f1 * now) + Math.sin(2 * Math.PI * state.f2 * now)
      : Math.cos(2 * Math.PI * state.cycles);
    h.graph.mark(now, yNow);
  },
  law() {
    return [
      String.raw`f_n = nv/(4L)\ \mathrm{(stopped,\ odd\ n)}`,
      String.raw`f_n = nv/(2L)\ \mathrm{(open)}`,
    ];
  },
  readoutCells(state, computed) {
    if (computed.beats) {
      return [
        ['Beat frequency', `${fmt(computed.f)} Hz`],
        ['Sound speed', `${fmt(computed.v)} m/s`],
        ['Lower fork', `${fmt(state.f1)} Hz`],
        ['Upper fork', `${fmt(state.f2)} Hz`],
        ['Air', `${fmt(state.temp)} °C`],
        ['Beat period', `${fmt(1 / computed.f)} s`],
      ];
    }
    return [
      ['Frequency', `${fmt(computed.f)} Hz`],
      ['Sound speed', `${fmt(computed.v)} m/s`],
      ['Length', `${fmt(state.length)} m`],
      ['Harmonic n', `${computed.n}`],
      ['Wavelength', `${fmt(computed.lambda)} m`],
      ['Ends', state.end === 'closed' ? 'one closed' : 'both open'],
    ];
  },
  coach(state, computed) {
    if (computed.beats) {
      return {
        title: 'Two forks',
        body: [
          String.raw`The beat frequency is $|f_2 - f_1| = ${fmt(computed.f)}$ Hz. Section 17.6 strikes 256 Hz and 512 Hz together and prints 256 Hz. The picture moves the forks once a second. The plot is the true sum, over two beat periods.`,
          'A beat this fast is an octave, not the slow throb of two close notes. The same formula gives that throb when the forks are a few hertz apart.',
        ],
      };
    }
    const stopped = state.end === 'closed';
    return {
      title: stopped ? 'Stopped pipe' : 'Open pipe',
      body: [
        String.raw`At ${fmt(state.temp)} °C the sound speed is ${fmt(computed.v)} m/s. Mode ${computed.n} of a ${fmt(state.length)} m pipe sounds at ${fmt(computed.f)} Hz. Section 17.5 prints 344 m/s and 0.672 m for a 128 Hz stopped pipe in 22.0 °C air, and 1.15 kHz for the fourth overtone.`,
        stopped
          ? 'A stopped end is a displacement node. An open end is an antinode. Only odd n fits. The picture is one cycle per second, and the swing is enlarged. The plot is that swing against true time.'
          : 'Both ends open, so half a wavelength fits and every whole n is allowed. The same length as the 128 Hz stopped pipe sounds at 256 Hz. End correction, a fraction of the radius, is not in f = nv/(2L).',
      ],
    };
  },
});

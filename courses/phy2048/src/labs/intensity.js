/**
 * A loudspeaker in the open. Shows that intensity falls as 1/r², so doubling
 * the distance divides the intensity by four and drops the level by about 6 dB,
 * and that two incoherent sources add their intensities, about 3 dB, not their
 * decibel readings.
 *
 * Numbers: OpenStax University Physics Vol. 1 §17.3. A pressure amplitude of
 * 0.656 Pa in 0 °C air (ρ = 1.29 kg/m³, v = 331 m/s) prints 5.04×10⁻⁴ W/m²
 * and 87 dB. The spreading scenarios use a point source with that intensity
 * at 2.00 m.
 *
 * The closed form is I = P/(4πr²) and β = 10 log10(I/I0). The check is the
 * power summed over the sphere, and, for the plane wave, the period average
 * of pressure times particle velocity.
 */
import * as THREE from 'three';
import {
  I0, decibels, intensityFromPressure, intensityFromPressureSamples, radiatedPower,
  sphereIntensity,
} from '@flux/subjects/mechanics/waves.js';
import { M, QUANTITY_COLORS, createGraph, fatLine, label, updateFatLine } from '../scene/kit.js';
import {
  bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow,
} from './define.js';

const RHO = 1.29;
const V_AIR = 331;
const DP = 0.656;
const BOOK_I = intensityFromPressure(DP, RHO, V_AIR);
const AT = 2;
const BOOK_P = BOOK_I * 4 * Math.PI * AT * AT;
const ARC = 28;

function arc(cx, cy, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push(cx + r * Math.cos(a), cy + r * Math.sin(a), 0);
  }
  return out;
}

function fields(state) {
  const pressure = state.kind === 'pressure';
  const one = pressure
    ? intensityFromPressure(state.dp, state.rho, state.speed)
    : sphereIntensity(state.power, state.radius);
  const sources = pressure ? 1 : state.sources;
  const I = one * sources;
  return {
    I,
    beta: decibels(I),
    one,
    sources,
    radius: state.radius,
    pressure,
  };
}

const spread = { kind: 'sphere', power: BOOK_P, radius: AT, sources: 1, dp: DP, rho: RHO, speed: V_AIR };
const SCENARIOS = [
  { ...spread, id: 'pressure', name: 'A 0.656 Pa plane wave, 0 °C air', kind: 'pressure' },
  { ...spread, id: 'spread', name: 'That intensity at 2.00 m, spreading' },
  { ...spread, id: 'pair', name: 'Two such speakers, incoherent', sources: 2 },
];

export default defineLab({
  id: 'intensity',
  exam: 'u13',
  title: 'Intensity',
  hint: 'A point source spreads its power over a sphere. Twice the distance is a quarter of the intensity, about 6 dB down. A second identical source adds about 3 dB, not a second copy of the level.',
  orbit: false,
  keys: { ' ': 'sweep', r: 'reset', R: 'reset' },
  fit: { w: 12.2, h: 9.4 },
  camera: { pos: new THREE.Vector3(0.1, 0.15, 18), target: new THREE.Vector3(0.1, 0.15, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'level-distance',
      scenario: 'spread',
      ask: 'Double the distance from the speaker. What happens to the intensity?',
      apply(s) { s.radius *= 2; },
      watch: [{ id: 'I', label: 'the intensity', get: (c) => c.I }],
      mode: 'factor',
      factors: [4, 2, 1, 0.25],
      expect: { I: 0.25 },
      why: 'The same power covers four times the area. The intensity is divided by four, and the level drops by 10 log10(4) = 6.02 dB.',
    },
    {
      id: 'level-pair',
      scenario: 'spread',
      ask: 'Add a second identical speaker at the same place. What happens to the intensity?',
      apply(s) { s.sources += 1; },
      watch: [{ id: 'I', label: 'the intensity', get: (c) => c.I }],
      mode: 'factor',
      factors: [4, 2, 1, 0.25],
      expect: { I: 2 },
      why: 'Incoherent sources add intensities, not decibels. Twice the intensity is 10 log10(2) = 3.01 dB, so 60 dB and 60 dB make 63 dB.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('spread', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[1];
    Object.assign(state, sc, { scenarioId: sc.id, anim: { playing: true }, cycles: 0 });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block"><button type="button" class="btn" id="in-play">Play</button>${logSliderRow('in-P', 'Power (W)', BOOK_P, 1e-6, 0.05)}${sliderRow('in-r', 'Distance (m)', AT, 0.5, 8, 0.1)}${sliderRow('in-n', 'Speakers', 1, 1, 2, 1)}${sliderRow('in-dp', 'Pressure amplitude (Pa)', DP, 0.02, 2, 0.001)}</div>`;
  },
  bind(api) {
    document.getElementById('in-play').addEventListener('click', () => api.toggleSweep());
    bindLogSlider(api, 'in-P', (s, v) => { s.power = v; s.kind = 'sphere'; });
    bindSlider(api, 'in-r', (s, v) => { s.radius = v; s.kind = 'sphere'; });
    bindSlider(api, 'in-n', (s, v) => { s.sources = v; s.kind = 'sphere'; });
    bindSlider(api, 'in-dp', (s, v) => { s.dp = v; s.kind = 'pressure'; });
  },
  syncControls(state) {
    const play = document.getElementById('in-play');
    if (play) play.textContent = state.anim?.playing ? 'Pause' : 'Play';
    putLogSlider('in-P', state.power);
    putSlider('in-r', state.radius, 2);
    putSlider('in-n', state.sources, 0);
    putSlider('in-dp', state.dp, 3);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const box = fatLine([-4.55, -0.7, 0, -3.15, -0.7, 0, -3.15, 0.85, 0, -4.55, 0.85, 0, -4.55, -0.7, 0], { color: M.grey, width: 2.8 });
    const cone = fatLine([-3.15, -0.28, 0.02, -2.55, -0.62, 0.02, -2.55, 0.72, 0.02, -3.15, 0.38, 0.02], { color: M.gold, width: 2.6 });
    const cap = fatLine(arc(-2.55, 0.05, 0.67, -Math.PI / 2, Math.PI / 2, 18), { color: M.gold, width: 2 });
    const person = fatLine([
      0, -0.55, 0, 0, 0.35, 0, -0.28, 0.05, 0, 0, 0.35, 0, 0.22, 0.55, 0, 0, 0.35, 0,
      0, 0.72, 0,
    ], { color: M.blue, width: 2.4 });
    const head = fatLine(arc(0, 0.95, 0.22, 0, 2 * Math.PI, 18), { color: M.blue, width: 2.2 });
    const who = label('listener', 0, 1.4, 0, 'graph-axis');
    const waves = Array.from({ length: 4 }, () => fatLine(new Array((ARC + 1) * 3).fill(0), { color: M.blue, width: 1.6 }));
    const graph = createGraph(group, {
      x: -4.7, y: -4.05, w: 8.6, h: 1.9, color: QUANTITY_COLORS.x, samples: 121,
      name: 'level (dB)', xName: '',
    });
    const xCap = label('distance (m)', -0.4, -4.85, 0, 'graph-axis');
    group.add(box, cone, cap, person, head, who, xCap, ...waves);
    group.visible = false;
    return { group, person, head, who, waves, graph, xCap };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.power = Math.max(state.power, 1e-8);
    state.radius = Math.max(state.radius, 0.2);
    state.sources = Math.max(1, Math.round(state.sources));
    state.dp = Math.max(state.dp, 1e-4);
    Object.assign(computed, fields(state));
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.cycles = (state.cycles + dt) % 2;
    return true;
  },
  second(state) {
    const row = fields(state);
    if (state.kind === 'pressure') {
      const got = intensityFromPressureSamples({ dp: state.dp, rho: state.rho, speed: state.speed });
      if (Math.abs(got - row.one) > 1e-6 * Math.max(row.one, 1e-9)) return { I: NaN };
    } else {
      const got = radiatedPower(state.power, state.radius);
      if (Math.abs(got - state.power) > 3e-4 * state.power) return { I: NaN };
    }
    return { I: row.I, beta: row.beta };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.waves) return;
    ctx.grid.visible = false;
    const speaker = -2.55;
    const xListener = speaker + 1.15 + 0.55 * state.radius;
    const pose = [xListener, -0.55, 0, xListener, 0.35, 0, xListener - 0.28, 0.05, 0, xListener, 0.35, 0, xListener + 0.22, 0.55, 0, xListener, 0.35, 0, xListener, 0.72, 0];
    updateFatLine(h.person, pose);
    const head = arc(xListener, 0.95, 0.22, 0, 2 * Math.PI, 18);
    updateFatLine(h.head, head);
    h.who.position.set(xListener, 1.4, 0);
    h.waves.forEach((wave, k) => {
      const phase = (k + state.cycles) / 4;
      const reach = 0.25 + phase * (xListener - speaker);
      updateFatLine(wave, arc(speaker, 0.05, reach, -0.9, 0.9, ARC));
    });
    if (computed.pressure) {
      h.xCap.element.textContent = 'time (s)';
      h.graph.set({
        t0: 0,
        t1: 1,
        lo: -0.9,
        hi: 0.9,
        name: 'pressure (Pa)',
        f: (t) => state.dp * Math.sin(2 * Math.PI * t),
      });
      h.graph.mark(state.cycles % 1, state.dp * Math.sin(2 * Math.PI * state.cycles));
    } else {
      h.xCap.element.textContent = 'distance (m)';
      const r0 = 0.5;
      const r1 = 8;
      const low = decibels(sphereIntensity(state.power, r1) * state.sources);
      const high = decibels(sphereIntensity(state.power, r0) * state.sources);
      h.graph.set({
        t0: r0,
        t1: r1,
        lo: low - 2,
        hi: high + 2,
        name: 'level (dB)',
        f: (r) => decibels(sphereIntensity(state.power, r) * state.sources),
      });
      h.graph.mark(state.radius, computed.beta);
    }
  },
  law() {
    return [
      String.raw`I = P/(4\pi r^{2})`,
      String.raw`\beta = 10\log_{10}(I/I_{0})`,
    ];
  },
  readoutCells(state, computed) {
    const rows = [
      ['Intensity', `${fmt(computed.I)} W/m²`],
      ['Level', `${fmt(computed.beta)} dB`],
    ];
    if (computed.pressure) {
      rows.push(
        ['Pressure amplitude', `${fmt(state.dp)} Pa`],
        ['Threshold I0', `${fmt(I0)} W/m²`],
        ['Air', '0 °C, 1.29 kg/m³'],
        ['Wave', 'plane, not a sphere'],
      );
    } else {
      rows.push(
        ['Power', `${fmt(state.power)} W`],
        ['Distance', `${fmt(state.radius)} m`],
        ['Speakers', `${state.sources}`],
        ['One speaker', `${fmt(computed.one)} W/m²`],
      );
    }
    return rows;
  },
  coach(state, computed) {
    if (computed.pressure) {
      return {
        title: 'A pressure amplitude',
        body: [
          String.raw`The intensity is $I = (\Delta p)^{2}/(2\rho v) = ${fmt(computed.I)}\ \mathrm{W/m^{2}}$, so the level is ${fmt(computed.beta)} dB. Section 17.3 prints $5.04\times 10^{-4}\ \mathrm{W/m^{2}}$ and 87 dB. The air is at $0^{\circ}\mathrm{C}$: $\rho = 1.29\ \mathrm{kg/m^{3}}$ and $v = 331\ \mathrm{m/s}$.`,
          'This is a plane wave. Distance is not in the formula. The picture still draws a speaker so the wave has a home. The plot is the pressure, not a level.',
        ],
      };
    }
    const twice = decibels(sphereIntensity(state.power, 2 * state.radius) * state.sources);
    return {
      title: state.sources > 1 ? 'Two speakers' : 'Spreading',
      body: [
        String.raw`At ${fmt(state.radius)} m the intensity is ${fmt(computed.I)} W/m², which is ${fmt(computed.beta)} dB above $10^{-12}\ \mathrm{W/m^{2}}$. Twice as far, the level would be ${fmt(twice)} dB. That drop is $10\log_{10} 4 = 6.02$ dB. A second identical source would add 3.01 dB, not another ${fmt(computed.beta)} dB.`,
        'The wave is a sphere, and none of the power is absorbed on the way. A real room reflects. The picture draws a few crests so the spreading is visible. The plot is the true level.',
      ],
    };
  },
});

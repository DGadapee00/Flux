/**
 * Shows that equal times sweep equal areas, and that the period follows the semi-major axis
 * alone: T² ∝ a³.
 *
 * The area and the arc come from the Kepler solution. The check integrates the area with RK4
 * and measures the arc as a chain of chords.
 */
import * as THREE from 'three';
import {
  GRAV, circularOrbitPeriod, eccentricFromMean, eccentricFromTrue, ellipseRadius,
  semiMajorAxis, sweptArea, trueFromEccentric, wedgeArc, wedgeArcChord, wedgeArea,
} from '@flux/subjects/mechanics/gravitation.js';
import { M, dot, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow } from './define.js';

const ARC = 48;
const YEAR = 365 * 24 * 3600;
const AU = 1.5e11;
const SUN = 2.0e30;
const halleyA = semiMajorAxis(SUN, 75.3 * YEAR);
const halleyE = 1 - (0.586 * AU) / halleyA;

const base = { M: SUN, a: AU, e: 0.6, nu0: 180, frac: 0.08 };
const SCENARIOS = [
  { ...base, id: 'wedge', name: 'An ellipse, wedge starting at aphelion' },
  { ...base, id: 'peri', name: 'The same wedge starting at perihelion', nu0: 0 },
  { ...base, id: 'halley', name: 'Halley’s comet: 75.3 yr, perihelion 0.586 AU', a: halleyA, e: halleyE, nu0: 0, frac: 0.04 },
];

function nuOf(state) {
  return (state.nu0 * Math.PI) / 180;
}

function closed(state) {
  const nu = nuOf(state);
  return {
    a: state.a,
    T: circularOrbitPeriod(state.M, state.a),
    area: wedgeArea(state.a, state.e, state.frac),
    arc: wedgeArc(state.a, state.e, nu, state.frac),
    peri: ellipseRadius(state.a, state.e, 0),
    aph: ellipseRadius(state.a, state.e, Math.PI),
    b: state.a * Math.sqrt(1 - state.e * state.e),
  };
}

function trace(a, e, nu0, frac, scale) {
  const E0 = eccentricFromTrue(nu0, e);
  const M0 = E0 - e * Math.sin(E0);
  const pts = [0, 0, 0];
  for (let i = 0; i <= ARC; i += 1) {
    const E = eccentricFromMean(M0 + (2 * Math.PI * frac * i) / ARC, e);
    const nu = trueFromEccentric(E, e);
    const r = ellipseRadius(a, e, nu) * scale;
    pts.push(r * Math.cos(nu), r * Math.sin(nu), 0.03);
  }
  pts.push(0, 0, 0);
  return pts;
}

function ellipsePts(a, e, scale) {
  const pts = [];
  for (let i = 0; i <= 120; i += 1) {
    const nu = (2 * Math.PI * i) / 120;
    const r = ellipseRadius(a, e, nu) * scale;
    pts.push(r * Math.cos(nu), r * Math.sin(nu), 0);
  }
  return pts;
}

export default defineLab({
  id: 'kepler',
  exam: 'u9',
  title: "Kepler's laws",
  hint: 'Equal times sweep equal areas. The period depends on the semi-major axis, not on how stretched the ellipse is.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'kepler-axis',
      scenario: 'wedge',
      ask: 'Double the semi-major axis and leave the eccentricity alone. What happens to the period?',
      apply(s) { s.a *= 2; },
      watch: [{ id: 'T', label: 'the period', get: (c) => c.T }],
      mode: 'factor',
      factors: [2.828, 2, 1, 0.707, 0.5],
      expect: { T: 2.828 },
      why: 'T² = (4π² / GM) a³. Doubling a multiplies T by 2^(3/2), which is 2.828. The eccentricity does not enter.',
    },
    {
      id: 'kepler-mass',
      scenario: 'wedge',
      ask: 'Double the central mass and leave the ellipse alone. What happens to the period?',
      apply(s) { s.M *= 2; },
      watch: [{ id: 'T', label: 'the period', get: (c) => c.T }],
      mode: 'factor',
      factors: [2.828, 2, 1, 0.707, 0.5],
      expect: { T: 0.707 },
      why: 'The period scales as 1/√M. Doubling the central mass divides the period by √2, which is 0.707.',
    },
    {
      id: 'kepler-arc',
      scenario: 'wedge',
      ask: 'Move the same time wedge from aphelion to perihelion. What happens to the arc length and to the area?',
      apply(s) { s.nu0 = 0; },
      watch: [
        { id: 'arc', label: 'the arc length', get: (c) => c.arc },
        { id: 'area', label: 'the area', get: (c) => c.area, mode: 'dir' },
      ],
      mode: 'dir',
      expect: { arc: 'bigger', area: 'same' },
      why: 'The area of an equal-time wedge does not depend on where it sits. Near perihelion the body is faster, so the same area is a longer arc.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('wedge', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${logSliderRow('kp-a', 'Semi-major axis (m)', AU, 1e7, 5e12)}${sliderRow('kp-e', 'Eccentricity', 0.6, 0, 0.9, 0.01)}${sliderRow('kp-nu', 'Wedge starts at (degrees from perihelion)', 180, 0, 180, 1)}${sliderRow('kp-f', 'Wedge, as a fraction of the period', 0.08, 0.02, 0.2, 0.01)}${logSliderRow('kp-M', 'Central mass (kg)', SUN, 1e23, 3e30)}</div>`;
  },
  bind(api) {
    bindLogSlider(api, 'kp-a', (s, v) => { s.a = v; });
    bindSlider(api, 'kp-e', (s, v) => { s.e = v; });
    bindSlider(api, 'kp-nu', (s, v) => { s.nu0 = v; });
    bindSlider(api, 'kp-f', (s, v) => { s.frac = v; });
    bindLogSlider(api, 'kp-M', (s, v) => { s.M = v; });
  },
  syncControls(state) {
    putLogSlider('kp-a', state.a);
    putSlider('kp-e', state.e, 2);
    putSlider('kp-nu', state.nu0, 0);
    putSlider('kp-f', state.frac, 2);
    putLogSlider('kp-M', state.M);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const ellipse = fatLine(new Array(121 * 3).fill(0), { color: M.greyDark, width: 2 });
    const wedge = fatLine(new Array((ARC + 3) * 3).fill(0), { color: M.white, width: 3 });
    const other = fatLine(new Array((ARC + 3) * 3).fill(0), { color: M.pink, width: 2.5 });
    const sun = dot(M.gold, 0.16);
    const body = dot(M.white, 0.12);
    const note = label('equal time', 0, -4.5, 0, 'graph-axis');
    group.add(ellipse, other, wedge, sun, body, note);
    group.visible = false;
    return { group, ellipse, wedge, other, sun, body, note };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.e = Math.min(0.98, Math.max(0, state.e));
    state.frac = Math.min(0.25, Math.max(0.01, state.frac));
    state.a = Math.max(state.a, 1);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const mu = GRAV * state.M;
    const nu = nuOf(state);
    const steps = state.e > 0.9 ? 12000 : 6000;
    return {
      a: state.a,
      T: 2 * Math.PI * state.a * Math.sqrt(state.a / mu),
      area: sweptArea(state.M, state.a, state.e, nu, state.frac, steps),
      arc: wedgeArcChord(state.a, state.e, nu, state.frac),
      peri: state.a * (1 - state.e),
      aph: state.a * (1 + state.e),
      b: state.a * Math.sqrt(1 - state.e * state.e),
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.ellipse) return;
    ctx.grid.visible = false;
    const scale = 4.4 / (state.a * (1 + state.e));
    updateFatLine(h.ellipse, ellipsePts(state.a, state.e, scale));
    const nu = nuOf(state);
    updateFatLine(h.wedge, trace(state.a, state.e, nu, state.frac, scale));
    updateFatLine(h.other, trace(state.a, state.e, nu + Math.PI, state.frac, scale));
    const r = ellipseRadius(state.a, state.e, nu) * scale;
    h.body.position.set(r * Math.cos(nu), r * Math.sin(nu), 0.08);
    h.sun.position.set(0, 0, 0.04);
  },
  law() {
    return [
      String.raw`T^{2} = \dfrac{4\pi^{2}}{GM}\, a^{3}`,
      String.raw`\dfrac{dA}{dt} = \dfrac{L}{2m}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Period', `${fmt(computed.T)} s`],
      ['Wedge area', `${fmt(computed.area)} m²`],
      ['Arc length', `${fmt(computed.arc)} m`],
      ['Perihelion', `${fmt(computed.peri)} m`],
      ['Aphelion', `${fmt(computed.aph)} m`],
      ['Semi-minor axis', `${fmt(computed.b)} m`],
    ];
  },
  coach(state, computed) {
    const years = computed.T / YEAR;
    return {
      title: 'Equal areas, one period',
      body: [
        String.raw`The white wedge and the pink wedge each last $${fmt(state.frac * 100, 3)}$% of the period. Each has area $${fmt(computed.area)}$ m². The arcs differ because the speed does.`,
        String.raw`The period is $${fmt(years, 4)}$ years. Stretching the ellipse at fixed semi-major axis leaves that period alone and changes the arc.`,
      ],
    };
  },
});

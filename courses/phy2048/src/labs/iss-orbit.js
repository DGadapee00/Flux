/**
 * Shows the International Space Station’s orbital speed and period from its altitude, and that
 * neither one depends on the station’s mass.
 *
 * The closed form is v = √(GM/r) and T = 2πr/v. The check is an RK4 step of that circular orbit:
 * the specific angular momentum has to survive it.
 *
 * Numbers: OpenStax University Physics Vol. 1 §13.4, "The International Space Station"
 * (400 km, Earth 5.96×10²⁴ kg, radius 6.37×10⁶ m). The station’s mass is not in that example.
 * 4.20×10⁵ kg is a round figure so the readout has a mass to double. The speed does not use it.
 */
import * as THREE from 'three';
import {
  GRAV, circularOrbitEnergy, circularOrbitPeriod, circularOrbitSpeed, escapeSpeed, gravityField,
  rk4Central,
} from '@flux/subjects/mechanics/gravitation.js';
import { M, dot, fatLine, label, updateFatLine } from '../scene/kit.js';
import { bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow } from './define.js';

const RING = 97;
const EARTH_M = 5.96e24;
const EARTH_R = 6.37e6;

const base = { M: EARTH_M, R: EARTH_R, alt: 4e5, m: 4.2e5 };
const SCENARIOS = [
  { ...base, id: 'iss', name: '400 km, the book’s ISS altitude' },
  { ...base, id: 'surface', name: 'A circular orbit at the surface', alt: 0 },
  { ...base, id: 'higher', name: '2 000 km up', alt: 2e6 },
  { ...base, id: 'gps', name: 'About 20 000 km, the book’s round GPS altitude', alt: 2.0e7 },
];

function radius(state) {
  return state.R + state.alt;
}

function closed(state) {
  const r = radius(state);
  const v = circularOrbitSpeed(state.M, r);
  return {
    r,
    v,
    T: circularOrbitPeriod(state.M, r),
    g: gravityField(state.M, r),
    E: circularOrbitEnergy(state.m, state.M, r),
    vesc: escapeSpeed(state.M, r),
    h: r * v,
  };
}

function ring(n, rad) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const t = (2 * Math.PI * i) / (n - 1);
    pts.push(rad * Math.cos(t), rad * Math.sin(t), 0);
  }
  return pts;
}

export default defineLab({
  id: 'iss-orbit',
  exam: 'u9',
  title: 'ISS orbit',
  app: true,
  hint: 'The station’s speed is √(GM/r). Its mass cancels, so a heavier station in the same orbit is not slower.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'iss-mass',
      scenario: 'iss',
      ask: 'Double the station’s mass and leave the altitude alone. What happens to the orbital speed?',
      apply(s) { s.m *= 2; },
      watch: [{ id: 'v', label: 'the orbital speed', get: (c) => c.v }],
      mode: 'factor',
      factors: [4, 2.828, 2, 1, 0.5],
      expect: { v: 1 },
      why: 'Gravity and inertia both grow with the station’s mass, and the mass cancels. The speed is √(GM/r).',
    },
    {
      id: 'iss-radius',
      scenario: 'iss',
      ask: 'Double the distance from Earth’s center, measured from the center. What happens to the period?',
      apply(s) { s.alt = 2 * (s.R + s.alt) - s.R; },
      watch: [{ id: 'T', label: 'the period', get: (c) => c.T }],
      mode: 'factor',
      factors: [4, 2.828, 2, 1, 0.5],
      expect: { T: 2.828 },
      why: 'T² ∝ r³. Doubling the radius from the center, not the altitude, multiplies the period by 2.828.',
    },
    {
      id: 'iss-g',
      scenario: 'iss',
      ask: 'Raise the station from 400 km to 2 000 km. What happens to g at the orbit?',
      apply(s) { s.alt = 2e6; },
      watch: [{ id: 'g', label: 'g at the orbit', get: (c) => c.g }],
      mode: 'dir',
      expect: { g: 'smaller' },
      why: 'g = GM/r². A higher orbit is farther from the center, so the field is weaker. It is not zero.',
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('iss', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${sliderRow('iss-alt', 'Altitude (km)', 400, 0, 20000, 10)}${logSliderRow('iss-m', 'Station mass (kg)', base.m, 100, 1e7)}${logSliderRow('iss-M', 'Planet mass (kg)', EARTH_M, 1e22, 1e26)}${logSliderRow('iss-R', 'Planet radius (m)', EARTH_R, 1e6, 1e8)}</div>`;
  },
  bind(api) {
    bindSlider(api, 'iss-alt', (s, v) => { s.alt = v * 1000; });
    bindLogSlider(api, 'iss-m', (s, v) => { s.m = v; });
    bindLogSlider(api, 'iss-M', (s, v) => { s.M = v; });
    bindLogSlider(api, 'iss-R', (s, v) => { s.R = v; });
  },
  syncControls(state) {
    putSlider('iss-alt', state.alt / 1000, 0);
    putLogSlider('iss-m', state.m);
    putLogSlider('iss-M', state.M);
    putLogSlider('iss-R', state.R);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const earth = fatLine(ring(RING, 1), { color: M.blue, width: 3 });
    const orbit = fatLine(ring(RING, 1.2), { color: M.grey, width: 2 });
    const station = dot(M.gold, 0.14);
    const name = label('ISS', 0, 0, 0, 'graph-title');
    group.add(earth, orbit, station, name);
    group.visible = false;
    return { group, earth, orbit, station, name };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.alt = Math.max(0, state.alt);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const r = radius(state);
    const mu = GRAV * state.M;
    const g = mu / (r * r);
    const v = Math.sqrt(g * r);
    const local = Math.sqrt((r * r * r) / mu);
    const steps = 4000;
    const end = rk4Central({ M: state.M, x: r, y: 0, vx: 0, vy: v, dt: (0.05 * local) / steps, steps });
    if (Math.abs(end.h - r * v) > 1e-8 * r * v) return { v: NaN, h: NaN };
    return {
      r,
      v,
      T: (2 * Math.PI * r) / v,
      g,
      E: state.m * (0.5 * v * v - mu / r),
      vesc: Math.sqrt(2 * g * r),
      h: end.h,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.earth) return;
    ctx.grid.visible = false;
    const scale = 3.3 / computed.r;
    updateFatLine(h.earth, ring(RING, state.R * scale));
    updateFatLine(h.orbit, ring(RING, computed.r * scale));
    const x = computed.r * scale;
    const gap = (computed.r - state.R) * scale;
    const stationR = gap < 0.2 ? state.R * scale + 0.28 : x;
    h.station.position.set(stationR, 0, 0.08);
    h.name.position.set(stationR, 0.45, 0);
  },
  law() {
    return [
      String.raw`v = \sqrt{GM/r}`,
      String.raw`T = 2\pi\sqrt{r^{3}/GM}`,
    ];
  },
  readoutCells(state, computed) {
    return [
      ['Orbital speed', `${fmt(computed.v)} m/s`],
      ['Period', `${fmt(computed.T)} s`],
      ['g at the orbit', `${fmt(computed.g)} m/s²`],
      ['Radius from the center', `${fmt(computed.r)} m`],
      ['Energy', `${fmt(computed.E)} J`],
      ['Escape speed there', `${fmt(computed.vesc)} m/s`],
    ];
  },
  coach(state, computed) {
    const minutes = computed.T / 60;
    return {
      title: 'Low orbit is still deep in the field',
      body: [
        String.raw`At this altitude g is $${fmt(computed.g)}$ m/s², the speed is $${fmt(computed.v)}$ m/s, and the period is $${fmt(minutes, 4)}$ minutes. The station is falling the whole time. The ground curves away under it.`,
        'Doubling the mass leaves the speed and the period where they are. The drawing is to scale, so a 400 km shell sits close to the surface.',
        '<b>What the course model leaves out.</b> The book’s example gives the 400 km altitude, Earth’s mass, and Earth’s radius. It does not give the station’s mass, and the speed does not need it. The 4.20×10⁵ kg is a round figure. A real station also drags on the upper atmosphere, so it reboosts. The orbit is not a perfect circle, and Earth is not a perfect sphere.',
      ],
    };
  },
});

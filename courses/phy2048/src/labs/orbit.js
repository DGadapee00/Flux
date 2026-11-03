/**
 * Shows that a tangential launch is a circle only at √(GM/r), an ellipse on either side of it,
 * and an escape once the speed reaches √2 times the circular speed.
 *
 * The closed form is the conic from energy and angular momentum. The check is an RK4 step of the
 * same inverse-square motion: specific angular momentum has to survive the step.
 */
import * as THREE from 'three';
import {
  GRAV, circularOrbitPeriod, circularOrbitSpeed, conic, ellipseRadius, escapeSpeed,
  gravityEnergy, gravityField, gravityForce, rk4Central,
} from '@flux/subjects/mechanics/gravitation.js';
import { Arrow, M, QUANTITY_COLORS, dot, fatLine, label, placeArrow, updateFatLine } from '../scene/kit.js';
import { bindLogSlider, bindSlider, defineLab, fmt, logSliderRow, putLogSlider, putSlider, sliderRow } from './define.js';

const PATH = 181;
const RING = 97;
const EARTH_M = 5.96e24;
const EARTH_R = 6.37e6;

const base = { M: EARTH_M, r: EARTH_R + 4e5, R: EARTH_R, f: 1, m: 9000 };
const SCENARIOS = [
  { ...base, id: 'iss', name: 'A 9000 kg craft in the 400 km orbit' },
  { ...base, id: 'ellipse', name: 'Launched slower than the circular speed', r: 8 * EARTH_R, f: 0.7 },
  { ...base, id: 'escape', name: 'Launched at escape speed', f: Math.SQRT2 },
  { ...base, id: 'pair', name: 'Two 9000 kg vehicles, 10 m apart', M: 9000, m: 9000, r: 10, R: 10, f: 1 },
];

function ring(n, rad) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const t = (2 * Math.PI * i) / (n - 1);
    pts.push(rad * Math.cos(t), rad * Math.sin(t), 0);
  }
  return pts;
}

function closed(state) {
  const vCirc = circularOrbitSpeed(state.M, state.r);
  const v = state.f * vCirc;
  const launched = conic(state.M, state.r, v);
  const bound = launched.bound ? 1 : 0;
  const U = gravityEnergy(state.m, state.M, state.r);
  const Us = gravityEnergy(state.m, state.M, state.R);
  const E = state.m * launched.specE;
  return {
    v,
    g: gravityField(state.M, state.r),
    vesc: escapeSpeed(state.M, state.r),
    force: gravityForce(state.m, state.M, state.r),
    accel: gravityForce(state.m, state.M, state.r) / state.m,
    E,
    K: 0.5 * state.m * v * v,
    dU: U - Us,
    dE: E - Us,
    e: launched.e,
    a: launched.a,
    T: bound ? circularOrbitPeriod(state.M, launched.a) : 0,
    bound,
    h: launched.h,
  };
}

function pathOf(state) {
  const v = state.f * circularOrbitSpeed(state.M, state.r);
  const launched = conic(state.M, state.r, v);
  const pts = [];
  if (!launched.bound) {
    // Stop where the branch would leave the frame. Clipping the radius to a circle
    // draws an escape as a closed orbit, which is the wrong picture.
    const mu = GRAV * state.M;
    const e = Math.max(launched.e, 1);
    const p = (launched.h * launched.h) / mu;
    const cap = 4 * state.r;
    const radAt = (nu) => p / (1 + e * Math.cos(nu));
    let nuLim = Math.acos(Math.max(-1, Math.min(1, -1 / Math.max(e, 1.0000001)))) * 0.98;
    if (!(radAt(nuLim) > 0) || radAt(nuLim) > cap) {
      let lo = 0;
      let hi = nuLim;
      for (let k = 0; k < 40; k += 1) {
        const mid = (lo + hi) / 2;
        const rad = radAt(mid);
        if (!(rad > 0) || rad > cap) hi = mid;
        else lo = mid;
      }
      nuLim = lo;
    }
    for (let i = 0; i < PATH; i += 1) {
      const nu = -nuLim + (2 * nuLim * i) / (PATH - 1);
      const rad = radAt(nu);
      pts.push(rad * Math.cos(nu), rad * Math.sin(nu));
    }
    return pts;
  }
  const nuLaunch = state.f >= 1 ? 0 : Math.PI;
  for (let i = 0; i < PATH; i += 1) {
    const nu = (2 * Math.PI * i) / (PATH - 1);
    const rad = ellipseRadius(launched.a, launched.e, nu);
    const ang = nu - nuLaunch;
    pts.push(rad * Math.cos(ang), rad * Math.sin(ang));
  }
  return pts;
}

export default defineLab({
  id: 'orbit',
  exam: 'u9',
  title: 'Orbit',
  hint: 'Circular speed is √(GM/r). Escape is √2 times that, and the total energy is then zero.',
  orbit: false,
  fit: { w: 12.4, h: 8.2 },
  camera: { pos: new THREE.Vector3(0, 0.2, 22), target: new THREE.Vector3(0, 0.2, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'orbit-radius',
      scenario: 'iss',
      ask: 'Double the orbital radius and keep the launch at the circular speed. What happens to the period?',
      apply(s) { s.r *= 2; },
      watch: [{ id: 'T', label: 'the period', get: (c) => c.T }],
      mode: 'factor',
      factors: [4, 2.828, 2, 1, 0.5],
      expect: { T: 2.828 },
      why: 'Kepler’s third law gives T² ∝ r³, so doubling the radius multiplies the period by 2^(3/2), which is 2.828.',
    },
    {
      id: 'orbit-mass',
      scenario: 'iss',
      ask: 'Double the craft’s mass and leave the orbit alone. What happens to the orbital speed?',
      apply(s) { s.m *= 2; },
      watch: [{ id: 'v', label: 'the orbital speed', get: (c) => c.v }],
      mode: 'factor',
      factors: [4, 2.828, 2, 1, 0.5],
      expect: { v: 1 },
      why: 'The craft’s mass cancels between the gravitational force and Newton’s second law. The speed depends on the central mass and the radius.',
    },
    {
      id: 'orbit-fast',
      scenario: 'iss',
      ask: 'Raise the launch from the circular speed to 1.25 times that speed. What happens to the eccentricity?',
      apply(s) { s.f = 1.25; },
      watch: [{ id: 'e', label: 'the eccentricity', get: (c) => c.e }],
      mode: 'dir',
      expect: { e: 'bigger' },
      why: 'A circular orbit has eccentricity zero. Any other tangential speed stretches the path into an ellipse, so the eccentricity rises.',
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
    return `<div class="lab-block">${logSliderRow('orb-r', 'Radius from the center (m)', base.r, 5, 2e11)}${sliderRow('orb-f', 'Launch speed, in circular speeds', 1, 0.55, 1.45, 0.01)}${logSliderRow('orb-m', 'Craft mass (kg)', 9000, 1, 1e6)}${logSliderRow('orb-M', 'Central mass (kg)', EARTH_M, 1e3, 3e30)}</div>`;
  },
  bind(api) {
    bindLogSlider(api, 'orb-r', (s, v) => { s.r = v; });
    bindSlider(api, 'orb-f', (s, v) => { s.f = v; });
    bindLogSlider(api, 'orb-m', (s, v) => { s.m = v; });
    bindLogSlider(api, 'orb-M', (s, v) => { s.M = v; });
  },
  syncControls(state) {
    putLogSlider('orb-r', state.r);
    putSlider('orb-f', state.f, 2);
    putLogSlider('orb-m', state.m);
    putLogSlider('orb-M', state.M);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const path = fatLine(new Array(PATH * 3).fill(0), { color: M.grey, width: 2 });
    const planet = fatLine(ring(RING, 0.22), { color: M.blue, width: 3 });
    const craft = dot(M.gold, 0.14);
    const vel = new Arrow(new THREE.Vector3(0, 1, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.v, undefined, undefined, 0.016);
    const pull = new Arrow(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(), 1, QUANTITY_COLORS.a, undefined, undefined, 0.014);
    const vName = label('<i>v</i>', 0, 0, 0, 'graph-title');
    const fName = label('<i>F</i>', 0, 0, 0, 'graph-axis');
    const kind = label('', 0, -4.6, 0, 'graph-axis');
    group.add(path, planet, craft, vel, pull, vName, fName, kind);
    group.visible = false;
    return { group, path, planet, craft, vel, pull, vName, fName, kind };
  },
  enter(ctx, handle) { handle.group.visible = true; },
  exit(ctx, handle) {
    handle.group.visible = false;
    if (ctx.grid) ctx.grid.visible = true;
  },
  recompute(state, computed) {
    state.f = Math.min(1.45, Math.max(0.55, state.f));
    state.r = Math.max(state.r, 1);
    state.R = Math.max(state.R, 1);
    Object.assign(computed, closed(state));
  },
  second(state) {
    const mu = GRAV * state.M;
    const vCirc = Math.sqrt(mu / state.r);
    const v = state.f * vCirc;
    const specE = 0.5 * v * v - mu / state.r;
    const h = state.r * v;
    const local = Math.sqrt((state.r * state.r * state.r) / mu);
    const steps = 4000;
    const end = rk4Central({ M: state.M, x: state.r, y: 0, vx: 0, vy: v, dt: (0.04 * local) / steps, steps });
    const scale = mu / state.r;
    const kept = Math.abs(end.h - h) <= 1e-8 * Math.abs(h) && Math.abs(end.specE - specE) <= 1e-8 * scale;
    if (!kept) return { v: NaN, h: NaN };
    const bound = specE < 0;
    const e = Math.sqrt(Math.max(0, 1 + (2 * specE * h * h) / (mu * mu)));
    const a = bound ? -mu / (2 * specE) : 0;
    const U = (-mu * state.m) / state.r;
    const Us = (-mu * state.m) / state.R;
    const E = state.m * specE;
    return {
      v,
      g: vCirc * vCirc / state.r,
      vesc: vCirc * Math.SQRT2,
      force: (mu * state.m) / (state.r * state.r),
      accel: mu / (state.r * state.r),
      E,
      K: 0.5 * state.m * v * v,
      dU: U - Us,
      dE: E - Us,
      e,
      a,
      T: bound ? 2 * Math.PI * Math.sqrt((a * a * a) / mu) : 0,
      bound: bound ? 1 : 0,
      h: end.h,
    };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h?.path) return;
    ctx.grid.visible = false;
    const raw = pathOf(state);
    let far = state.r;
    for (let i = 0; i < raw.length; i += 2) far = Math.max(far, Math.hypot(raw[i], raw[i + 1]));
    const s = 4.5 / far;
    const drawn = [];
    for (let i = 0; i < raw.length; i += 2) drawn.push(raw[i] * s, raw[i + 1] * s, 0);
    updateFatLine(h.path, drawn);
    const bodyR = state.r < 100 ? 0.22 : Math.max(state.R, 1) * s;
    updateFatLine(h.planet, ring(RING, bodyR));
    let x = state.r * s;
    if (x < bodyR + 0.16) x = bodyR + 0.22;
    h.craft.position.set(x, 0, 0.08);
    placeArrow(h.vel, x, 0.2, x, 0.2 + 1.7, 0.06);
    placeArrow(h.pull, x - 0.25, -0.15, x - 1.7, -0.15, 0.05);
    h.vName.position.set(x + 0.35, 1.7, 0);
    h.fName.position.set(x - 2.05, -0.15, 0);
    const kind = computed.bound ? (computed.e < 0.02 ? 'circle' : 'ellipse') : 'not bound';
    h.kind.element.textContent = kind;
  },
  law() {
    return [
      String.raw`v = \sqrt{GM/r}`,
      String.raw`E = -\dfrac{GMm}{2a}`,
    ];
  },
  readoutCells(state, computed) {
    const kind = computed.bound ? (computed.e < 0.02 ? 'circle' : 'ellipse') : 'escape';
    return [
      ['Speed', `${fmt(computed.v)} m/s`],
      ['Period', computed.bound ? `${fmt(computed.T)} s` : 'not bound'],
      ['Eccentricity', fmt(computed.e, 3)],
      ['Force', `${fmt(computed.force)} N`],
      ['Energy', `${fmt(Math.abs(computed.E) < 1e-8 * Math.max(Math.abs(gravityEnergy(state.m, state.M, state.r)), 1) ? 0 : computed.E)} J`],
      ['Escape speed', `${fmt(computed.vesc)} m/s`],
      ['Path', kind],
    ];
  },
  coach(state, computed) {
    const pair = state.r < 100;
    return {
      title: pair ? 'The pull between two vehicles' : (computed.bound ? 'Bound to the central mass' : 'This launch escapes'),
      body: pair
        ? [
            String.raw`The force is $${fmt(computed.force)}$ N, and each vehicle’s initial acceleration is $${fmt(computed.accel)}$ m/s². The circular speed on the readout is the speed one vehicle would need to orbit the other. The example has them at rest relative to each other.`,
          ]
        : [
            String.raw`Circular speed here is $${fmt(computed.vesc / Math.SQRT2)}$ m/s. The launch is $${fmt(state.f, 3)}$ times that, so the eccentricity is $${fmt(computed.e, 3)}$.`,
            computed.bound
              ? `Below the circular speed the launch point is the far end of the ellipse. Above it, the launch point is the near end. The period follows the semi-major axis, not the launch radius.${state.f < 1 && computed.a * (1 - computed.e) < state.R ? ' The near end is inside the planet, so that launch hits the ground.' : ''}`
              : 'At escape the total energy is zero and the path does not close. A faster launch leaves with energy to spare.',
          ],
    };
  },
});

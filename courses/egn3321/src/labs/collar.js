import { G } from '@flux/subjects/mechanics/constants.js';
import { collarPath } from '@flux/subjects/mechanics/energy.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeDot, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'smooth',
    name: 'Spring and gravity',
    mass: 2,
    k: 80,
    theta: 30,
    mu: 0,
    x1: 0.5,
    x2: 0,
    xFar: 0.75,
    v1: 0,
  },
  {
    id: 'rough',
    name: 'The same slide with friction',
    mass: 2,
    k: 80,
    theta: 30,
    mu: 0.2,
    x1: 0.5,
    x2: 0,
    xFar: 0.75,
    v1: 0,
  },
  {
    id: 'return',
    name: 'Out and back to the same stretch',
    mass: 2,
    k: 50,
    theta: 25,
    mu: 0.2,
    x1: 0.2,
    x2: 0.2,
    xFar: 0.6,
    v1: 4,
  },
];

const OX = -1.55;
const OY = 1.22;
const SCALE = 3.2;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.k = sc.k;
  state.theta = sc.theta;
  state.mu = sc.mu;
  state.x1 = sc.x1;
  state.x2 = sc.x2;
  state.xFar = sc.xFar;
  state.v1 = sc.v1;
}

function basis(theta) {
  const th = (theta * Math.PI) / 180;
  return { ux: Math.cos(th), uy: -Math.sin(th), nx: Math.sin(th), ny: Math.cos(th) };
}

function at(x, b) {
  return { x: OX + SCALE * x * b.ux, y: OY + SCALE * x * b.uy };
}

function pointsFor(state) {
  if (state.scenarioId === 'return') return [state.x1, state.xFar, state.x2];
  return [state.x1, state.x2];
}

/** Midpoint integration of a = g sinθ − (k/m) x − μ g cosθ along the rod. */
function integratedSpeed(state, points) {
  const steps = 800;
  const th = (state.theta * Math.PI) / 180;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  let v2 = state.v1 * state.v1;
  for (let leg = 0; leg < points.length - 1; leg++) {
    const x1 = points[leg];
    const x2 = points[leg + 1];
    const dir = Math.sign(x2 - x1) || 1;
    const dx = (x2 - x1) / steps;
    for (let i = 0; i < steps; i++) {
      const x = x1 + (i + 0.5) * dx;
      const a = G * sin - (state.k / state.mass) * x - state.mu * G * cos * dir;
      v2 += 2 * a * dx;
      if (v2 < -1e-8) return 0;
    }
  }
  return Math.sqrt(Math.max(0, v2));
}

function springLine(x0, x1, b, coils = 7) {
  const pts = [];
  const n = coils * 2;
  for (let i = 0; i <= n; i++) {
    const u = n === 0 ? 0 : i / n;
    const x = x0 + (x1 - x0) * u;
    const side = i === 0 || i === n ? 0 : (i % 2 === 0 ? -0.11 : 0.11);
    const p = at(x, b);
    pts.push({ x: p.x + side * b.nx, y: p.y + side * b.ny });
  }
  return pts;
}

export default defineLab({
  id: 'collar',
  exam: 'u3',
  title: 'Collar',
  hint: 'Change the end stretch. The spring work uses only the two end stretches.',
  camera: { pos: new THREE.Vector3(-0.35, 0.4, 8), target: new THREE.Vector3(-0.35, 0.4, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('smooth', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('co-mass', 'mass (kg)', 2, 0.5, 6, 0.1)}
      ${slider('co-k', 'k (N/m)', 80, 10, 140, 1)}
      ${slider('co-theta', 'θ (deg)', 30, 0, 50, 1)}
      ${slider('co-mu', 'μₖ', 0, 0, 0.6, 0.01)}
      ${slider('co-x1', 'start (m)', 0.5, 0, 0.8, 0.01)}
      ${slider('co-x2', 'end (m)', 0, 0, 0.8, 0.01)}
      ${slider('co-xfar', 'detour (m)', 0.6, 0, 1, 0.01)}
      ${slider('co-v1', 'v₁ (m/s)', 0, 0, 6, 0.1)}
      <p class="tiny">Grey is weight, gold is the spring, teal is the rod, pink is friction. x is down the rod from the unstretched point.</p>`;
  },
  bind(api) {
    bindSlider('co-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('co-k', (s, v) => { s.k = v; }, api);
    bindSlider('co-theta', (s, v) => { s.theta = v; }, api);
    bindSlider('co-mu', (s, v) => { s.mu = v; }, api);
    bindSlider('co-x1', (s, v) => { s.x1 = v; }, api);
    bindSlider('co-x2', (s, v) => { s.x2 = v; }, api);
    bindSlider('co-xfar', (s, v) => { s.xFar = v; }, api);
    bindSlider('co-v1', (s, v) => { s.v1 = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('co-mass', state.mass);
    set('co-k', state.k);
    set('co-theta', state.theta);
    set('co-mu', state.mu);
    set('co-x1', state.x1);
    set('co-x2', state.x2);
    set('co-xfar', state.xFar);
    set('co-v1', state.v1);
    showField('co-xfar', state.scenarioId === 'return');
  },
  init(ctx) {
    const group = new THREE.Group();
    const rod = makeLine(M.grey);
    const wall = makeLine(M.greyDark);
    const spring = makeLine(M.gold);
    const collar = makeDot(M.white, 0.1);
    const end = makeDot(M.grey, 0.06);
    const mk = (color) => forceArrow(new THREE.Vector3(0, -1, 0), color, 0.03, 0.2, 0.13);
    const weight = mk(M.grey);
    const pull = mk(M.gold);
    const normal = mk(M.teal);
    const friction = mk(M.pink);
    group.add(rod, wall, spring, collar, end, weight, pull, normal, friction);
    ctx.scene.add(group);
    return { group, rod, wall, spring, collar, end, weight, pull, normal, friction };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const points = pointsFor(state);
    const row = collarPath({
      mass: state.mass,
      k: state.k,
      thetaDeg: state.theta,
      points,
      v1: state.v1,
      mu: state.mu,
      g: G,
    });
    const speed = integratedSpeed(state, points);
    Object.assign(computed, {
      speed: row.speed,
      spring: row.spring,
      gravity: row.gravity,
      friction: row.friction,
      direct: row.direct,
      normal: row.normal,
      reaches: row.reaches ? 1 : 0,
      gap: Math.abs(row.speed - speed) / Math.max(1, Math.abs(row.speed)),
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const b = basis(state.theta);
    const start = at(state.x1, b);
    const finish = at(state.x2, b);
    setLine(h.rod, [at(-0.02, b), at(1.05, b)]);
    const wall = at(0, b);
    setLine(h.wall, [
      { x: wall.x - 0.22 * b.nx, y: wall.y - 0.22 * b.ny },
      { x: wall.x + 0.22 * b.nx, y: wall.y + 0.22 * b.ny },
    ]);
    setLine(h.spring, springLine(0, state.x1, b));
    h.collar.position.set(start.x, start.y, 0);
    const mark = state.scenarioId === 'return' ? at(state.xFar, b) : finish;
    h.end.position.set(mark.x, mark.y, 0);
    const scale = 1.5 / Math.max(state.mass * G, state.k * Math.abs(state.x1), 1);
    const push = (arrow, fx, fy) => {
      placeIncomingArrow(arrow, new THREE.Vector3(start.x, start.y, 0), fx, fy, { scale, minLength: 0.08, gap: 0.02 });
    };
    push(h.weight, 0, -state.mass * G);
    push(h.pull, -state.k * state.x1 * b.ux, -state.k * state.x1 * b.uy);
    push(h.normal, computed.normal * b.nx, computed.normal * b.ny);
    const dir = Math.sign(pointsFor(state)[1] - state.x1) || 1;
    const f = state.mu * computed.normal;
    push(h.friction, -f * dir * b.ux, -f * dir * b.uy);
  },
  law() {
    return [
      String.raw`T_1+\sum U_{1-2}=T_2`,
      String.raw`U_s=\dfrac{1}{2}k(s_1^2-s_2^2)`,
    ];
  },
  liveRows(state, c) {
    return [
      kv('$v_2$', `${fig(c.speed)} m/s`),
      kv('$U_s$', `${fig(c.spring)} J`),
      kv('$U_g$', `${fig(c.gravity)} J`),
      kv('$U_f$', `${fig(c.friction)} J`),
    ].join('');
  },
  readout(state, c) {
    if (state.scenarioId === 'return') {
      return cells([
        ['speed', `${fig(c.speed)} m/s`],
        ['spring', `${fig(c.spring)} J`],
        ['ends', `${fig(c.direct)} J`],
        ['friction', `${fig(c.friction)} J`],
      ]);
    }
    return cells([
      ['speed', `${fig(c.speed)} m/s`],
      ['spring', `${fig(c.spring)} J`],
      ['gravity', `${fig(c.gravity)} J`],
      ['friction', `${fig(c.friction)} J`],
    ]);
  },
  coach(state, c) {
    if (!c.reaches) {
      return {
        title: 'It does not reach the end',
        body: 'The works do not leave any kinetic energy. Shorten the climb, ease the friction, or add speed.',
      };
    }
    if (state.scenarioId === 'return') {
      return {
        title: 'The spring work uses the end stretches',
        body: String.raw`Along the detour, $U_s = ${fig(c.spring)}\ \mathrm{J}$. From the end stretches alone, $U_s = ${fig(c.direct)}\ \mathrm{J}$. Friction took ${fig(c.friction)}\ \mathrm{J}.`,
      };
    }
    if (state.mu > 1e-9) {
      return {
        title: 'Friction takes energy off the slide',
        body: String.raw`The spring still does ${fig(c.spring)}\ \mathrm{J}. Friction does ${fig(c.friction)}\ \mathrm{J}, and the speed at the end is ${fig(c.speed)}\ \mathrm{m/s}.`,
      };
    }
    return {
      title: 'Only the end stretches enter the spring work',
      body: String.raw`$U_s = \frac{1}{2}k(s_1^2-s_2^2) = ${fig(c.spring)}\ \mathrm{J}$. The speed at the end is ${fig(c.speed)}\ \mathrm{m/s}.`,
    };
  },
});

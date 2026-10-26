/**
 * Shows that the work of a conservative force depends only on where the path starts and ends, and
 * that the work of friction, or of a swirling force, depends on the path taken.
 *
 * A body goes from A to B by one of three paths: a straight line, two legs with a corner, or a
 * half-circle. A fourth path goes out by the half-circle and back by the straight line. Four forces
 * act, one at a time: gravity, a spring anchored at the origin, kinetic friction, and a swirl
 * F = c(−y, x), which circles the origin. The closed forms are −mgΔy, ½k(r_A² − r_B²), −μmg·L, and
 * c∫(x dy − y dx), done leg by leg. The check integrates F · dr along each leg by Simpson's rule.
 */
import * as THREE from 'three';
import { G } from '@flux/subjects/mechanics/constants.js';
import { workAlongPath } from '@flux/subjects/mechanics/energy.js';
import { Arrow, M, dot, fatLine, label, placeArrow, updateFatLine, QUANTITY_COLORS } from '../scene/kit.js';
import { bindSelect, bindSlider, defineLab, fmt, putSelect, putSlider, selectRow, sliderRow } from './define.js';

const FORCE = QUANTITY_COLORS.a;
const A = { x: -3.5, y: -2 };
const B = { x: 3, y: 1.5 };
const C = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
const R = Math.hypot(B.x - A.x, B.y - A.y) / 2;
const TA = Math.atan2(A.y - C.y, A.x - C.x);
const TB = Math.atan2(B.y - C.y, B.x - C.x);
const CORNER = { x: A.x, y: B.y };

const FIELDS = [
  ['gravity', 'Gravity, mg downward'],
  ['spring', 'A spring anchored at the origin'],
  ['friction', 'Kinetic friction, against the motion'],
  ['swirl', 'A swirl around the origin, c(−y, x)'],
];
const PATHS = [
  ['straight', 'Straight from A to B'],
  ['corner', 'Up, then across'],
  ['arc', 'A half-circle below the line'],
  ['round', 'Out by the half-circle, back by the line'],
];

const SCENARIOS = [
  { id: 'gravity', name: 'Gravity on a 2 kg body', field: 'gravity', path: 'straight', m: 2, k: 20, mu: 0.3, c: 5 },
  { id: 'spring', name: 'A spring of 20 N/m', field: 'spring', path: 'straight', m: 2, k: 20, mu: 0.3, c: 5 },
  { id: 'friction', name: 'Friction on a 2 kg body sliding on a floor, μ = 0.3', field: 'friction', path: 'straight', m: 2, k: 20, mu: 0.3, c: 5 },
  { id: 'swirl', name: 'A swirl of 5 N/m', field: 'swirl', path: 'straight', m: 2, k: 20, mu: 0.3, c: 5 },
];

/** A path as legs: a line from a to b, or an arc about the centre from angle t0 to t1. */
function legs(path) {
  const line = (a, b) => ({ kind: 'line', a, b });
  const arc = { kind: 'arc', t0: TA, t1: TB + (TB < TA ? 2 * Math.PI : 0) };
  if (path === 'corner') return [line(A, CORNER), line(CORNER, B)];
  if (path === 'arc') return [arc];
  if (path === 'round') return [arc, line(B, A)];
  return [line(A, B)];
}

/** The arc runs counterclockwise from A, under the line, to B. */
function arcPoint(leg, u) {
  const t = leg.t0 + (leg.t1 - leg.t0) * u;
  return { x: C.x + R * Math.cos(t), y: C.y + R * Math.sin(t) };
}

function legPoint(leg, u) {
  if (leg.kind === 'arc') return arcPoint(leg, u);
  return { x: leg.a.x + (leg.b.x - leg.a.x) * u, y: leg.a.y + (leg.b.y - leg.a.y) * u };
}

const legEnds = (leg) => [legPoint(leg, 0), legPoint(leg, 1)];
const legLength = (leg) => (leg.kind === 'arc' ? R * (leg.t1 - leg.t0) : Math.hypot(leg.b.x - leg.a.x, leg.b.y - leg.a.y));

/** The work of the chosen force along one leg, in closed form. */
function legWork(s, leg) {
  const [p, q] = legEnds(leg);
  if (s.field === 'gravity') return -s.m * G * (q.y - p.y);
  if (s.field === 'spring') return 0.5 * s.k * (p.x * p.x + p.y * p.y - q.x * q.x - q.y * q.y);
  if (s.field === 'friction') return -s.mu * s.m * G * legLength(leg);
  // The swirl: W = c ∫ (x dy − y dx). On a line that is x0·y1 − y0·x1; on the arc it is
  // R[cx(sin t1 − sin t0) − cy(cos t1 − cos t0)] + R²(t1 − t0).
  if (leg.kind === 'line') return s.c * (p.x * q.y - p.y * q.x);
  return s.c * (R * (C.x * (Math.sin(leg.t1) - Math.sin(leg.t0)) - C.y * (Math.cos(leg.t1) - Math.cos(leg.t0))) + R * R * (leg.t1 - leg.t0));
}

const pathWork = (s, path) => legs(path).reduce((sum, leg) => sum + legWork(s, leg), 0);
const pathLength = (path) => legs(path).reduce((sum, leg) => sum + legLength(leg), 0);

/** The force itself, for the integral and the arrows. */
function force(s, x, y, t) {
  if (s.field === 'gravity') return { x: 0, y: -s.m * G };
  if (s.field === 'spring') return { x: -s.k * x, y: -s.k * y };
  if (s.field === 'friction') return { x: -s.mu * s.m * G * t.x, y: -s.mu * s.m * G * t.y };
  return { x: -s.c * y, y: s.c * x };
}

const LATTICE = [];
for (let i = 0; i < 7; i += 1) for (let j = 0; j < 5; j += 1) LATTICE.push({ x: -5.4 + i * 1.8, y: -3.6 + j * 1.8 });

export default defineLab({
  id: 'work-path',
  exam: 'u4',
  title: 'Work along a path',
  hint: 'Pick a force and a path from A to B. Compare the work along the three paths.',
  orbit: false,
  fit: { w: 12.6, h: 9.4 },
  camera: { pos: new THREE.Vector3(0, -0.3, 24), target: new THREE.Vector3(0, -0.3, 0) },
  scenarios: SCENARIOS,
  predictions: [
    {
      id: 'wp-spring-arc',
      scenario: 'spring',
      ask: 'Take the body from A to B by the half-circle instead of the straight line. What happens to the work the spring does?',
      apply(s) { s.path = 'arc'; },
      watch: [{ id: 'W', label: 'the work done by the spring', get: (c) => c.W, signed: true }],
      mode: 'dir',
      expect: { W: 'same' },
      why: String.raw`The spring force is conservative. Its work is $\tfrac12k(r_A^2 - r_B^2)$, which depends only on how far A and B are from the anchor. The longer path changes nothing.`,
    },
    {
      id: 'wp-friction-arc',
      scenario: 'friction',
      ask: 'Slide the body from A to B by the half-circle instead of the straight line. What happens to the energy friction takes?',
      apply(s) { s.path = 'arc'; },
      watch: [{ id: 'loss', label: 'the energy friction takes', get: (c) => -c.W }],
      mode: 'dir',
      expect: { loss: 'bigger' },
      why: String.raw`Friction points against the motion at every step, so its work is $-\mu mg$ times the length of the path. The half-circle is $\pi/2$ times as long as the line, so friction takes $\pi/2$ times as much.`,
    },
    {
      id: 'wp-gravity-round',
      scenario: 'gravity',
      ask: 'Take the body out to B by the half-circle and back to A by the line. Does gravity do any net work on the round trip?',
      apply(s) { s.path = 'round'; },
      watch: [{ id: 'net', label: 'gravity does net work', get: (c) => Math.abs(c.W) > 1e-6, mode: 'bool' }],
      expect: { net: false },
      why: String.raw`Gravity's work is $-mg\,\Delta y$. A round trip ends at the height it began, so $\Delta y = 0$. What gravity took on the way up it gave back on the way down.`,
    },
    {
      id: 'wp-swirl-round',
      scenario: 'swirl',
      ask: 'Now the swirl. Take the same round trip: out by the half-circle, back by the line. Does the swirl do any net work?',
      apply(s) { s.path = 'round'; },
      watch: [{ id: 'net', label: 'the swirl does net work', get: (c) => Math.abs(c.W) > 1e-6, mode: 'bool' }],
      expect: { net: true },
      why: String.raw`The round trip goes counterclockwise, the way the swirl points, so it pushes the body forward the whole way. Its work is $c$ times twice the area enclosed, $c\pi R^2$. A force whose work round a closed path is not zero is not conservative: no potential energy can describe it.`,
    },
  ],
  defaultState() {
    const state = {};
    this.applyScenario('gravity', state);
    return state;
  },
  applyScenario(id, state) {
    const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    Object.assign(state, sc, { scenarioId: sc.id });
    delete state.id;
    delete state.name;
  },
  controls() {
    return `<div class="lab-block">${selectRow('wp-field', 'Force', FIELDS, 'gravity')}${selectRow('wp-path', 'Path', PATHS, 'straight')}${sliderRow('wp-m', 'Mass, for gravity and friction (kg)', 2, 0.1, 10, 0.1)}${sliderRow('wp-k', 'Spring constant k (N/m)', 20, 1, 100, 1)}${sliderRow('wp-mu', 'Coefficient of kinetic friction', 0.3, 0, 1, 0.01)}${sliderRow('wp-c', 'Swirl strength c (N/m)', 5, -20, 20, 0.5)}</div>`;
  },
  bind(api) {
    bindSelect(api, 'wp-field', (s, v) => { s.field = v; });
    bindSelect(api, 'wp-path', (s, v) => { s.path = v; });
    bindSlider(api, 'wp-m', (s, x) => { s.m = x; });
    bindSlider(api, 'wp-k', (s, x) => { s.k = x; });
    bindSlider(api, 'wp-mu', (s, x) => { s.mu = x; });
    bindSlider(api, 'wp-c', (s, x) => { s.c = x; });
  },
  syncControls(state) {
    putSelect('wp-field', state.field);
    putSelect('wp-path', state.path);
    putSlider('wp-m', state.m, 1);
    putSlider('wp-k', state.k, 0);
    putSlider('wp-mu', state.mu, 2);
    putSlider('wp-c', state.c, 1);
  },
  init(ctx) {
    const group = new THREE.Group();
    ctx.scene.add(group);
    const field = LATTICE.map(() => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.012));
    const along = Array.from({ length: 6 }, () => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, FORCE, undefined, undefined, 0.016));
    const ghosts = PATHS.slice(0, 3).map(() => fatLine(new Array(121 * 3).fill(0), { color: M.greyDark, width: 1.5 }));
    const path = fatLine(new Array(241 * 3).fill(0), { color: M.white, width: 3.5 });
    const heads = Array.from({ length: 2 }, () => new Arrow(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.5, M.white, 0.3, 0.22, 0.02));
    const a = dot(M.yellow, 0.14);
    const b = dot(M.yellow, 0.14);
    a.position.set(A.x, A.y, 0.05);
    b.position.set(B.x, B.y, 0.05);
    const aName = label('A', A.x - 0.4, A.y - 0.1, 0, 'graph-title');
    const bName = label('B', B.x + 0.4, B.y + 0.1, 0, 'graph-title');
    const origin = dot(M.grey, 0.08);
    const oName = label('origin', 0.55, -0.3, 0, 'graph-axis');
    group.add(...field, ...along, ...ghosts, path, ...heads, a, b, aName, bName, origin, oName);
    group.visible = false;
    return { group, field, along, ghosts, path, heads, origin, oName };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    computed.W = pathWork(state, state.path);
    computed.L = pathLength(state.path);
    computed.Wstraight = pathWork(state, 'straight');
    computed.Wcorner = pathWork(state, 'corner');
    computed.Warc = pathWork(state, 'arc');
  },
  second(state) {
    // F · dr integrated numerically, leg by leg, so the corner's kink falls between legs.
    const along = (path) => legs(path).reduce((sum, leg) => sum + workAlongPath((x, y, t) => force(state, x, y, t), (u) => legPoint(leg, u), 2000), 0);
    return { W: along(state.path), Wstraight: along('straight'), Wcorner: along('corner'), Warc: along('arc') };
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    if (!h) return;
    ctx.grid.visible = false;
    const trace = (path, n) => {
      const ls = legs(path);
      const pts = [];
      for (let i = 0; i < n; i += 1) {
        const u = (i / (n - 1)) * ls.length;
        const leg = ls[Math.min(ls.length - 1, Math.floor(u))];
        const p = legPoint(leg, u - Math.min(ls.length - 1, Math.floor(u)));
        pts.push(p.x, p.y, 0.02);
      }
      return pts;
    };
    PATHS.slice(0, 3).forEach(([id], i) => updateFatLine(h.ghosts[i], trace(id, 121)));
    updateFatLine(h.path, trace(state.path, 241));
    // A head partway along each leg shows the direction of travel.
    const ls = legs(state.path);
    h.heads.forEach((head, i) => {
      const leg = ls[i];
      if (!leg) {
        head.visible = false;
        return;
      }
      const p = legPoint(leg, 0.55);
      const q = legPoint(leg, 0.6);
      placeArrow(head, p.x, p.y, q.x, q.y, 0.04);
      head.setLength(0.5, 0.3, 0.22);
    });
    const friction = state.field === 'friction';
    // Field arrows on a lattice; friction has no field, so its arrows sit on the path instead.
    const mags = LATTICE.map((p) => force(state, p.x, p.y, { x: 1, y: 0 }));
    const big = Math.max(...mags.map((f) => Math.hypot(f.x, f.y)), 1e-9);
    h.field.forEach((arrow, i) => {
      const p = LATTICE[i];
      const f = mags[i];
      const len = (0.8 * Math.hypot(f.x, f.y)) / big;
      const ux = f.x / (Math.hypot(f.x, f.y) || 1);
      const uy = f.y / (Math.hypot(f.x, f.y) || 1);
      placeArrow(arrow, p.x - (ux * len) / 2, p.y - (uy * len) / 2, p.x + (ux * len) / 2, p.y + (uy * len) / 2, 0.01);
      if (friction || len < 0.05) arrow.visible = false;
    });
    h.along.forEach((arrow, i) => {
      const u = ((i + 0.5) / h.along.length) * ls.length;
      const leg = ls[Math.min(ls.length - 1, Math.floor(u))];
      const f = u - Math.floor(u);
      const p = legPoint(leg, f);
      const q = legPoint(leg, Math.min(1, f + 0.01));
      const r = legPoint(leg, Math.max(0, f - 0.01));
      const tx = q.x - r.x;
      const ty = q.y - r.y;
      const tl = Math.hypot(tx, ty) || 1;
      // Beside the path, not on it, so the path does not hide them.
      const ox = p.x - (0.4 * ty) / tl;
      const oy = p.y + (0.4 * tx) / tl;
      placeArrow(arrow, ox, oy, ox - (0.9 * tx) / tl, oy - (0.9 * ty) / tl, 0.03);
      if (!friction) arrow.visible = false;
    });
    const centred = state.field === 'spring' || state.field === 'swirl';
    h.origin.position.set(0, 0, 0.05);
    h.origin.visible = centred;
    h.oName.visible = centred;
  },
  law: () => [
    String.raw`W = \int_A^B \vec F\cdot d\vec r`,
    String.raw`\text{conservative: } W_{A\to B} = U_A - U_B,\qquad \oint \vec F\cdot d\vec r = 0`,
  ],
  readoutCells(state, computed) {
    return [
      ['Work along this path', `${fmt(computed.W)} J`],
      ['Length of the path', `${fmt(computed.L)} m`],
      ['Straight from A to B', `${fmt(computed.Wstraight)} J`],
      ['Up, then across', `${fmt(computed.Wcorner)} J`],
      ['Half-circle', `${fmt(computed.Warc)} J`],
    ];
  },
  coach(state, computed) {
    const same = Math.abs(computed.Wstraight - computed.Warc) < 1e-6 * Math.max(1, Math.abs(computed.Warc)) && Math.abs(computed.Wcorner - computed.Warc) < 1e-6 * Math.max(1, Math.abs(computed.Warc));
    return {
      title: same ? 'Three paths, one answer' : 'The work depends on the path',
      body: [
        String.raw`The work of a force along a path adds up $\vec F\cdot d\vec r$ over every small step. Only the part of the force along the step counts. The three grey paths all join A to B.`,
        same
          ? String.raw`All three paths give $${fmt(computed.W, 4)}$ J. That is what makes a force conservative: its work depends only on the ends. So a potential energy can be defined, with $W_{A\to B} = U_A - U_B$.`
          : String.raw`The straight line gives $${fmt(computed.Wstraight, 4)}$ J and the half-circle $${fmt(computed.Warc, 4)}$ J. A force whose work depends on the path is not conservative, and has no potential energy.`,
        String.raw`<b>What the model leaves out.</b> For friction, read the picture as a level floor seen from above; friction has one fixed size, $\mu mg$. The swirl is a made-up field: a stirred fluid pushes this way, but its push also depends on how fast the body moves.`,
      ],
    };
  },
});

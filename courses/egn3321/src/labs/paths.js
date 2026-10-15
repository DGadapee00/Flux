import { G } from '@flux/subjects/mechanics/constants.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeDot, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { archMotion, cornerMotion, lineMotion, pathReport } from './pathwork.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'smooth',
    name: 'Gravity and a spring',
    mass: 1.2,
    k: 20,
    mu: 0,
    rise: 0.35,
    ax: 0.2,
    ay: 1,
    bx: 1.4,
    by: 0.4,
  },
  {
    id: 'rough',
    name: 'The same paths with friction',
    mass: 1.2,
    k: 20,
    mu: 0.25,
    rise: 0.35,
    ax: 0.2,
    ay: 1,
    bx: 1.4,
    by: 0.4,
  },
  {
    id: 'level',
    name: 'Ends at one height',
    mass: 1.2,
    k: 30,
    mu: 0,
    rise: 0.4,
    ax: 0.2,
    ay: 0.7,
    bx: 1.5,
    by: 0.7,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.k = sc.k;
  state.mu = sc.mu;
  state.rise = sc.rise;
  state.ax = sc.ax;
  state.ay = sc.ay;
  state.bx = sc.bx;
  state.by = sc.by;
}

function samples(motion, n = 40) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const p = motion(i / n);
    pts.push({ x: p.x, y: p.y });
  }
  return pts;
}

export default defineLab({
  id: 'paths',
  exam: 'u3',
  title: 'Paths',
  hint: 'Turn on friction. Only that work changes from path to path.',
  camera: { pos: new THREE.Vector3(0.8, 0.55, 4.4), target: new THREE.Vector3(0.8, 0.55, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('smooth', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('pa-mass', 'mass (kg)', 1.2, 0.4, 4, 0.1)}
      ${slider('pa-k', 'k (N/m)', 20, 0, 80, 1)}
      ${slider('pa-mu', 'μₖ', 0, 0, 0.6, 0.01)}
      ${slider('pa-rise', 'arch rise (m)', 0.35, 0, 0.8, 0.01)}
      ${slider('pa-ay', 'start height (m)', 1, 0.2, 1.6, 0.05)}
      ${slider('pa-by', 'end height (m)', 0.4, 0.2, 1.6, 0.05)}
      <p class="tiny">White is straight, gold turns a corner, teal arches. The spring is anchored at the origin.</p>`;
  },
  bind(api) {
    bindSlider('pa-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('pa-k', (s, v) => { s.k = v; }, api);
    bindSlider('pa-mu', (s, v) => { s.mu = v; }, api);
    bindSlider('pa-rise', (s, v) => { s.rise = v; }, api);
    bindSlider('pa-ay', (s, v) => { s.ay = v; }, api);
    bindSlider('pa-by', (s, v) => { s.by = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('pa-mass', state.mass);
    set('pa-k', state.k);
    set('pa-mu', state.mu);
    set('pa-rise', state.rise);
    set('pa-ay', state.ay);
    set('pa-by', state.by);
  },
  init(ctx) {
    const group = new THREE.Group();
    const line = makeLine(M.white);
    const corner = makeLine(M.gold);
    const arch = makeLine(M.teal);
    const spring = makeLine(M.gold);
    const anchor = makeDot(M.grey, 0.05);
    const start = makeDot(M.white, 0.07);
    const end = makeDot(M.red, 0.07);
    const mk = (color) => forceArrow(new THREE.Vector3(0, -1, 0), color, 0.025, 0.16, 0.1);
    const weight = mk(M.grey);
    const pull = mk(M.gold);
    group.add(line, corner, arch, spring, anchor, start, end, weight, pull);
    ctx.scene.add(group);
    return { group, line, corner, arch, spring, anchor, start, end, weight, pull };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const row = pathReport({
      mass: state.mass,
      k: state.k,
      mu: state.mu,
      rise: state.rise,
      ax: state.ax,
      ay: state.ay,
      bx: state.bx,
      by: state.by,
      g: G,
    });
    Object.assign(computed, row);
  },
  syncViews(state, computed, ctx) {
    void computed;
    const h = ctx.handle;
    const A = [state.ax, state.ay];
    const B = [state.bx, state.by];
    setLine(h.line, samples(lineMotion(A, B)));
    setLine(h.corner, samples(cornerMotion(A, B)));
    setLine(h.arch, samples(archMotion(A, B, state.rise)));
    setLine(h.spring, [{ x: 0, y: 0 }, { x: A[0], y: A[1] }]);
    h.anchor.position.set(0, 0, 0);
    h.start.position.set(A[0], A[1], 0);
    h.end.position.set(B[0], B[1], 0);
    const len = Math.hypot(A[0], A[1]);
    const scale = 0.9 / Math.max(state.mass * G, state.k * len, 1);
    placeIncomingArrow(h.weight, new THREE.Vector3(A[0], A[1], 0), 0, -state.mass * G, { scale, minLength: 0.08, gap: 0.02 });
    const stretch = len;
    const fx = len > 1e-9 ? -state.k * stretch * (A[0] / len) : 0;
    const fy = len > 1e-9 ? -state.k * stretch * (A[1] / len) : 0;
    placeIncomingArrow(h.pull, new THREE.Vector3(A[0], A[1], 0), fx, fy, { scale, minLength: 0.08, gap: 0.02 });
  },
  law() {
    return [String.raw`U=-\Delta V`, String.raw`U_f=-\mu mg\,s`];
  },
  liveRows(state, c) {
    return [
      kv('line', `${fig(c.workLine)} J`),
      kv('corner', `${fig(c.workCorner)} J`),
      kv('arch', `${fig(c.workArch)} J`),
      kv('$-\\Delta V$', `${fig(c.potential)} J`),
    ].join('');
  },
  readout(state, c) {
    void state;
    return cells([
      ['line', `${fig(c.workLine)} J`],
      ['corner', `${fig(c.workCorner)} J`],
      ['arch', `${fig(c.workArch)} J`],
      ['−ΔV', `${fig(c.potential)} J`],
    ]);
  },
  coach(state, c) {
    const same = Math.abs(c.workLine - c.workArch) < 0.05 && Math.abs(c.workLine - c.workCorner) < 0.05;
    if (state.mu > 1e-9) {
      return {
        title: same ? 'These paths happen to match' : 'Friction follows the length',
        body: String.raw`$-\Delta V = ${fig(c.potential)}\ \mathrm{J}$ on every path. Friction makes the arch ${fig(c.workArch)}\ \mathrm{J} and the straight path ${fig(c.workLine)}\ \mathrm{J}.`,
      };
    }
    if (Math.abs(state.ay - state.by) < 1e-9) {
      return {
        title: 'The weight does no work',
        body: String.raw`The ends share a height, so gravity drops out. The spring still does ${fig(c.potential)}\ \mathrm{J} on every path.`,
      };
    }
    return {
      title: 'The path does not enter',
      body: String.raw`Straight, corner, and arch each do ${fig(c.workLine)}\ \mathrm{J}. That is $-\Delta V$.`,
    };
  },
});

import { G } from '@flux/subjects/mechanics/constants.js';
import { centralInertia, rollOrSlip } from '@flux/subjects/mechanics/inertia.js';
import { forceArrow, placeIncomingArrow } from '@flux/shells/engineering/fbd.js';
import { M, makeDot, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const BODY = { mass: 2, radius: 0.25, theta: 30 };

const SCENARIOS = [
  { id: 'disk', name: 'Disk', shape: 'disk', mu: 0.3, ...BODY },
  { id: 'hoop', name: 'Hoop', shape: 'hoop', mu: 0.15, ...BODY },
  { id: 'sphere', name: 'Sphere', shape: 'sphere', mu: 0.3, ...BODY },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.shape = sc.shape;
  state.mass = sc.mass ?? state.mass ?? 2;
  state.radius = sc.radius ?? state.radius ?? 0.25;
  state.theta = sc.theta ?? state.theta ?? 30;
  state.mu = sc.mu ?? state.mu ?? 0.3;
}

function circle(cx, cy, radius, n = 56) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (2 * Math.PI * i) / n;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}

function frame(cx, cy, span) {
  const z = Math.max(span, 0.35) * 2.05;
  return { pos: new THREE.Vector3(cx, cy, z), target: new THREE.Vector3(cx, cy, 0) };
}

export default defineLab({
  id: 'roll-slip',
  exam: 'u6',
  title: 'Roll or slip',
  hint: 'Rolling acceleration is g sin θ over 1 + k²/R². A hoop needs more friction than a disk.',
  scenarios: SCENARIOS,
  cameraFor(state) {
    const R = Math.max(Number(state.radius) || 0.25, 0.1);
    const th = (Number(state.theta) || 30) * Math.PI / 180;
    const cx = -R * Math.sin(th);
    const cy = R * Math.cos(th);
    return frame(cx, cy * 0.65, R * 3.4);
  },
  defaultState() {
    const s = {};
    apply('disk', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('rs-mass', 'mass (kg)', 2, 0.5, 8, 0.5)}
      ${slider('rs-radius', 'radius (m)', 0.25, 0.1, 0.6, 0.05)}
      ${slider('rs-theta', 'incline (deg)', 30, 10, 60, 1)}
      ${slider('rs-mu', 'friction μ', 0.3, 0, 0.8, 0.01)}
      <p class="tiny">Pink is friction, up the plane. Teal is the normal. Grey is the weight. A hoop is a ring, a disk has a hub, and a sphere has an equator.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('rs-mass', 'mass');
    link('rs-radius', 'radius');
    link('rs-theta', 'theta');
    link('rs-mu', 'mu');
  },
  syncControls(state) {
    for (const [id, key] of [['rs-mass', 'mass'], ['rs-radius', 'radius'], ['rs-theta', 'theta'], ['rs-mu', 'mu']]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  init(ctx) {
    const group = new THREE.Group();
    const ground = makeLine(M.grey);
    const body = makeLine(M.white);
    const mark = makeLine(M.gold);
    const hub = makeDot(M.white, 0.02);
    const weight = forceArrow(new THREE.Vector3(0, -1, 0), M.grey, 0.028, 0.18, 0.12);
    const normal = forceArrow(new THREE.Vector3(0, 1, 0), M.teal, 0.028, 0.18, 0.12);
    const friction = forceArrow(new THREE.Vector3(1, 0, 0), M.pink, 0.028, 0.18, 0.12);
    group.add(ground, body, mark, hub, weight, normal, friction);
    ctx.scene.add(group);
    return { group, ground, body, mark, hub, weight, normal, friction };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const mass = Number(state.mass) || 0;
    const radius = Number(state.radius) || 0;
    const I = centralInertia(state.shape, mass, radius);
    const row = rollOrSlip({
      mass,
      radius,
      I,
      thetaDeg: Number(state.theta) || 0,
      mu: Number(state.mu) || 0,
      g: G,
    });
    const th = (Number(state.theta) || 0) * Math.PI / 180;
    Object.assign(computed, {
      a: row.a,
      alpha: row.alpha,
      f: row.f,
      N: row.N,
      muMin: row.muMin,
      mode: row.mode,
      v: row.vKin,
      gap: row.gap,
      cx: -radius * Math.sin(th),
      cy: radius * Math.cos(th),
      ux: Math.cos(th),
      uy: Math.sin(th),
      nx: -Math.sin(th),
      ny: Math.cos(th),
    });
  },
  syncViews(state, c, ctx) {
    const h = ctx.handle;
    const R = Math.max(Number(state.radius) || 0.1, 0.08);
    const reach = R * 3.2;
    setLine(h.ground, [
      { x: -c.ux * reach, y: -c.uy * reach },
      { x: c.ux * reach * 0.7, y: c.uy * reach * 0.7 },
    ]);
    setLine(h.body, circle(c.cx, c.cy, R));
    h.mark.visible = true;
    if (state.shape === 'sphere') {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const a = (2 * Math.PI * i) / 48;
        pts.push({ x: c.cx + R * Math.cos(a), y: c.cy + 0.32 * R * Math.sin(a) });
      }
      setLine(h.mark, pts);
    } else if (state.shape === 'hoop') {
      setLine(h.mark, circle(c.cx, c.cy, R * 0.92));
    } else {
      setLine(h.mark, circle(c.cx, c.cy, R * 0.18));
    }
    h.hub.visible = true;
    h.hub.position.set(c.cx, c.cy, 0);
    h.hub.scale.setScalar((R * 0.14) / 0.02);
    const weight = (Number(state.mass) || 0) * G;
    const scale = (1.15 * R) / Math.max(weight, 1e-6);
    const center = new THREE.Vector3(c.cx, c.cy, 0);
    const contact = new THREE.Vector3(0, 0, 0);
    placeIncomingArrow(h.weight, center, 0, -weight, { scale, minLength: 0, gap: R * 0.04 });
    placeIncomingArrow(h.normal, contact, c.N * c.nx, c.N * c.ny, { scale, minLength: 0, gap: R * 0.05 });
    placeIncomingArrow(h.friction, contact, c.f * c.ux, c.f * c.uy, { scale, minLength: 0, gap: R * 0.05 });
  },
  law: () => [String.raw`a=g\sin\theta/(1+k_G^2/R^2)`],
  liveRows(state, c) {
    const motion = c.mode === 'roll' ? 'rolls' : 'slips';
    return [
      kv('a', `${fig(c.a)} m/s²`),
      kv('f', `${fig(c.f)} N`),
      kv('motion', motion),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['a', fig(c.a)],
      ['f N', fig(c.f)],
      ['motion', c.mode === 'roll' ? 'rolls' : 'slips'],
    ]);
  },
  coach(state, c) {
    const motion = c.mode === 'roll' ? 'rolls' : 'slips';
    if (c.mode === 'roll') {
      return {
        title: 'Friction is enough',
        body: `It ${motion}. a is ${fig(c.a)} m/s². Friction is ${fig(c.f)} N, and the incline needs μ of at least ${fig(c.muMin)}. After 1 m the speed is ${fig(c.v)} m/s.`,
      };
    }
    return {
      title: 'Friction is at its limit',
      body: `It ${motion}. a is ${fig(c.a)} m/s². Friction is ${fig(c.f)} N, which is μN. Rolling would need μ of ${fig(c.muMin)}.`,
    };
  },
});
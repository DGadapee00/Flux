import { impulse, impulseRamp } from '@flux/subjects/mechanics/momentum.js';
import { M, makeArrow, makeDot, makeLine, setArrow, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'pair',
    name: 'Equal areas',
    mass: 2,
    v0: 0,
    f1: 100,
    s1: 0,
    t1: 0.4,
    f2: 40,
    t2: 1,
  },
  {
    id: 'short',
    name: 'A short pulse',
    mass: 2,
    v0: 0,
    f1: 400,
    s1: 0,
    t1: 0.1,
    f2: 20,
    t2: 1,
  },
  {
    id: 'ramp',
    name: 'A rising force',
    mass: 4,
    v0: 0,
    f1: 10,
    s1: 30,
    t1: 2,
    f2: 0,
    t2: 0,
  },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mass = sc.mass;
  state.v0 = sc.v0;
  state.f1 = sc.f1;
  state.s1 = sc.s1;
  state.t1 = sc.t1;
  state.f2 = sc.f2;
  state.t2 = sc.t2;
}

/** Midpoint integration of m dv/dt = F, split at the break so each piece is linear. */
function integratedSpeed(state) {
  if (!(state.mass > 0)) return state.v0;
  const steps = 2000;
  let v = state.v0;
  const legs = [
    [0, state.t1, (t) => state.f1 + state.s1 * t],
    [state.t1, state.t1 + state.t2, () => state.f2],
  ];
  for (const [t0, t1, force] of legs) {
    if (!(t1 > t0)) continue;
    const dt = (t1 - t0) / steps;
    for (let i = 0; i < steps; i++) {
      const t = t0 + (i + 0.5) * dt;
      v += (force(t) / state.mass) * dt;
    }
  }
  return v;
}

function areas(state) {
  const j1 = impulseRamp(state.f1, state.s1, 0, state.t1);
  const j2 = impulse(state.f2, state.t2);
  const J = j1 + j2;
  const dv = J / state.mass;
  return { j1, j2, J, dv, v: state.v0 + dv };
}

function graph(state) {
  const tmax = Math.max(state.t1 + state.t2, 0.2);
  const samples = [0, state.f1, state.f1 + state.s1 * state.t1, state.f2];
  const hi = Math.max(1, ...samples);
  const lo = Math.min(0, ...samples);
  const span = Math.max(hi - lo, 1);
  const mapX = (t) => -2.15 + (t / tmax) * 4.3;
  const mapY = (F) => -1.05 + ((F - lo) / span) * 2.45;
  const pts = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = state.t1 * (i / n);
    pts.push({ x: mapX(t), y: mapY(state.f1 + state.s1 * t) });
  }
  if (state.t2 > 0) {
    pts.push({ x: mapX(state.t1), y: mapY(state.f2) });
    pts.push({ x: mapX(state.t1 + state.t2), y: mapY(state.f2) });
  }
  const y0 = mapY(0);
  return {
    pts,
    axis: [{ x: mapX(0), y: y0 }, { x: mapX(tmax), y: y0 }],
    upright: [{ x: mapX(0), y: mapY(lo) }, { x: mapX(0), y: mapY(hi) }],
    brk: [{ x: mapX(state.t1), y: y0 }, { x: mapX(state.t1), y: mapY(hi) }],
  };
}

export default defineLab({
  id: 'impulse',
  exam: 'u4',
  title: 'Impulse',
  hint: 'Two shapes with the same area give the same change in speed.',
  camera: { pos: new THREE.Vector3(0, 0.15, 8), target: new THREE.Vector3(0, 0.15, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pair', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('im-mass', 'mass (kg)', 2, 0.5, 8, 0.1)}
      ${slider('im-v0', 'v₀ (m/s)', 0, -4, 8, 0.1)}
      ${slider('im-f1', 'F₁ (N)', 100, 0, 500, 1)}
      ${slider('im-t1', 't₁ (s)', 0.4, 0.05, 3, 0.05)}
      ${slider('im-s1', 'slope (N/s)', 0, -20, 80, 1)}
      ${slider('im-f2', 'F₂ (N)', 40, 0, 200, 1)}
      ${slider('im-t2', 't₂ (s)', 1, 0, 3, 0.05)}
      <p class="tiny">Gold is the force. The grey break is where the second piece starts.</p>`;
  },
  bind(api) {
    bindSlider('im-mass', (s, v) => { s.mass = v; }, api);
    bindSlider('im-v0', (s, v) => { s.v0 = v; }, api);
    bindSlider('im-f1', (s, v) => { s.f1 = v; }, api);
    bindSlider('im-t1', (s, v) => { s.t1 = v; }, api);
    bindSlider('im-s1', (s, v) => { s.s1 = v; }, api);
    bindSlider('im-f2', (s, v) => { s.f2 = v; }, api);
    bindSlider('im-t2', (s, v) => { s.t2 = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('im-mass', state.mass);
    set('im-v0', state.v0);
    set('im-f1', state.f1);
    set('im-t1', state.t1);
    set('im-s1', state.s1);
    set('im-f2', state.f2);
    set('im-t2', state.t2);
    const ramp = state.scenarioId === 'ramp';
    showField('im-s1', ramp);
    showField('im-f2', !ramp);
    showField('im-t2', !ramp);
  },
  init(ctx) {
    const group = new THREE.Group();
    const curve = makeLine(M.gold);
    const axis = makeLine(M.grey);
    const upright = makeLine(M.grey);
    const brk = makeLine(M.greyDark);
    const mass = makeDot(M.white, 0.1);
    const vel = makeArrow(M.white);
    group.add(curve, axis, upright, brk, mass, vel);
    ctx.scene.add(group);
    return { group, curve, axis, upright, brk, mass, vel };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    if (!(state.mass > 0)) {
      Object.assign(computed, { j1: 0, j2: 0, J: 0, dv: 0, v: state.v0 || 0, gap: 0 });
      return;
    }
    const row = areas(state);
    const speed = integratedSpeed(state);
    Object.assign(computed, row, {
      gap: Math.abs(row.v - speed) / Math.max(1, Math.abs(row.v)),
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const g = graph(state);
    setLine(h.curve, g.pts);
    setLine(h.axis, g.axis);
    setLine(h.upright, g.upright);
    setLine(h.brk, g.brk);
    h.mass.position.set(-2.15, -1.7, 0);
    const scale = 1.3 / Math.max(Math.abs(computed.v), 1);
    setArrow(h.vel, { x: -2.15, y: -1.7 }, { x: computed.v * scale, y: 0 }, 1.5);
  },
  law() {
    return [
      String.raw`\int F\,dt=m\Delta v`,
      String.raw`J=J_1+J_2`,
    ];
  },
  liveRows(state, c) {
    return [
      kv('$J_1$', `${fig(c.j1)} N·s`),
      kv('$J_2$', `${fig(c.j2)} N·s`),
      kv('$\\Delta v$', `${fig(c.dv)} m/s`),
      kv('$v$', `${fig(c.v)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['J₁', `${fig(c.j1)} N·s`],
      ['J₂', `${fig(c.j2)} N·s`],
      ['Δv', `${fig(c.dv)} m/s`],
      ['speed', `${fig(c.v)} m/s`],
    ]);
  },
  coach(state, c) {
    const same = Math.abs(c.j1 - c.j2) <= 0.02 * Math.max(1, Math.abs(c.j1));
    if (same) {
      return {
        title: 'The two shapes share one change in speed',
        body: String.raw`Each area is ${fig(c.j1)} N·s. Together they change the speed by ${fig(c.dv)} m/s.`,
      };
    }
    return {
      title: 'The area sets the change in speed',
      body: String.raw`The first area is ${fig(c.j1)} N·s. The second is ${fig(c.j2)} N·s. The speed changes by ${fig(c.dv)} m/s.`,
    };
  },
});

import {
  distanceByCrossings,
  integrateAbsSpeed,
  integratePieces,
  rk4Pieces,
} from '@flux/subjects/mechanics/path.js';
import { M, makeDot, makeLine, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, showField, slider } from './widgets.js';

const SCENARIOS = [
  {
    id: 'brake',
    name: 'Braking through a stop',
    s0: 0,
    v0: 4,
    pieces: [{ t0: 0, t1: 5, coeff: [-2] }],
    t: 5,
  },
  {
    id: 'two',
    name: 'Two constant accelerations',
    s0: 0,
    v0: 1,
    pieces: [
      { t0: 0, t1: 2, coeff: [2] },
      { t0: 2, t1: 4, coeff: [-4] },
    ],
    t: 3,
  },
  {
    id: 'ramp',
    name: 'Acceleration linear in time',
    s0: 0,
    v0: 2,
    pieces: [{ t0: 0, t1: 4, coeff: [1, 0.5] }],
    t: 2,
  },
];

function clonePieces(pieces) {
  return pieces.map((p) => ({ t0: p.t0, t1: p.t1, coeff: [...p.coeff] }));
}

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.s0 = sc.s0;
  state.v0 = sc.v0;
  state.pieces = clonePieces(sc.pieces);
  state.t = sc.t;
  state.tEnd = sc.pieces[sc.pieces.length - 1].t1;
}

export default defineLab({
  id: 'rectilinear',
  exam: 'u1',
  title: 'Rectilinear',
  hint: 'The plot shows a, v, and s against time, each in its own unit. Move the probe.',
  camera: { pos: new THREE.Vector3(0, 0, 16), target: new THREE.Vector3(0, 0, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = { anim: { playing: false } };
    apply('brake', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('rl-v0', 'v₀ (m/s)', 4, -12, 12, 0.5)}
      ${slider('rl-a1', 'a₁ (m/s²)', -2, -8, 8, 0.5)}
      ${slider('rl-jerk', 'jerk (m/s³)', 0, -3, 3, 0.1)}
      ${slider('rl-switch', 'switch time (s)', 2, 0.5, 8, 0.1)}
      ${slider('rl-a2', 'a₂ (m/s²)', -4, -8, 8, 0.5)}
      ${slider('rl-end', 'end time (s)', 5, 1, 10, 0.1)}
      ${slider('rl-t', 'probe time (s)', 5, 0, 10, 0.1)}
      <p class="tiny">The plot panel draws a, v, and s against time in seconds, each in its own unit. The marker is the probe. Space plays the probe.</p>`;
  },
  bind(api) {
    bindSlider('rl-v0', (s, v) => { s.v0 = v; }, api);
    bindSlider('rl-a1', (s, v) => { s.pieces[0].coeff[0] = v; }, api);
    bindSlider('rl-jerk', (s, v) => {
      s.pieces[0].coeff[1] = v;
    }, api);
    bindSlider('rl-switch', (s, v) => {
      if (s.pieces.length < 2) return;
      s.pieces[0].t1 = v;
      s.pieces[1].t0 = v;
      if (s.pieces[1].t1 < v + 0.2) s.pieces[1].t1 = v + 0.2;
      s.tEnd = s.pieces[1].t1;
    }, api);
    bindSlider('rl-a2', (s, v) => {
      if (s.pieces[1]) s.pieces[1].coeff[0] = v;
    }, api);
    bindSlider('rl-end', (s, v) => {
      const last = s.pieces[s.pieces.length - 1];
      const prev = s.pieces.length > 1 ? s.pieces[0].t1 : 0;
      last.t1 = Math.max(v, prev + 0.2);
      s.tEnd = last.t1;
      if (s.t > s.tEnd) s.t = s.tEnd;
    }, api);
    bindSlider('rl-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    const two = state.pieces.length > 1;
    const jerk = state.pieces[0].coeff.length > 1;
    set('rl-v0', state.v0);
    set('rl-a1', state.pieces[0].coeff[0]);
    set('rl-jerk', state.pieces[0].coeff[1] || 0);
    set('rl-switch', two ? state.pieces[0].t1 : 0);
    set('rl-a2', two ? state.pieces[1].coeff[0] : 0);
    set('rl-end', state.tEnd);
    set('rl-t', state.t);
    showField('rl-jerk', jerk);
    showField('rl-switch', two);
    showField('rl-a2', two);
  },
  init(ctx) {
    const group = new THREE.Group();
    const track = makeLine(M.grey);
    const origin = makeLine(M.white);
    const dot = makeDot(M.yellow, 0.16);
    group.add(track, origin, dot);
    ctx.scene.add(group);
    return { group, track, origin, dot };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const tEnd = Math.max(state.tEnd, state.pieces[state.pieces.length - 1].t1, 1e-3);
    state.tEnd = tEnd;
    const t = Math.min(Math.max(state.t, 0), tEnd);
    const motion = integratePieces(state.pieces, state.s0, state.v0);
    const now = motion(t);
    const rk = rk4Pieces(state.pieces, state.s0, state.v0, t, 48);
    const distance = distanceByCrossings(motion, 0, tEnd);
    const trap = integrateAbsSpeed((u) => motion(u).v, 0, tEnd, 800);
    const n = 80;
    const ts = [];
    const ss = [];
    const vs = [];
    const as = [];
    for (let i = 0; i <= n; i++) {
      const u = (i / n) * tEnd;
      const row = motion(u);
      ts.push(u);
      ss.push(row.s);
      vs.push(row.v);
      as.push(row.a);
    }
    Object.assign(computed, {
      s: now.s,
      v: now.v,
      a: now.a,
      distance,
      displacement: motion(tEnd).s - state.s0,
      ts,
      ss,
      vs,
      as,
      t,
      tEnd,
      gap: Math.max(
        Math.abs(rk.s - now.s) / Math.max(1, Math.abs(now.s)),
        Math.abs(rk.v - now.v) / Math.max(1, Math.abs(now.v)),
        Math.abs(trap - distance) / Math.max(1, Math.abs(distance)),
      ),
    });
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    const samples = computed.ss || [0];
    const span = Math.max(1, ...samples.map((v) => Math.abs(v)), Math.abs(computed.s || 0));
    const x = ((computed.s || 0) / span) * 4.2;
    setLine(h.track, [{ x: -4.8, y: 0 }, { x: 4.8, y: 0 }]);
    setLine(h.origin, [{ x: 0, y: -0.28 }, { x: 0, y: 0.28 }]);
    h.dot.position.set(x, 0, 0);
  },
  plot(state, c) {
    return {
      type: 'series',
      t: c.ts,
      probe: c.t,
      series: [
        { label: 'a', unit: 'm/s²', color: '#f0ac5f', y: c.as },
        { label: 'v', unit: 'm/s', color: '#ece6e2', y: c.vs },
        { label: 's', unit: 'm', color: '#5cd0b3', y: c.ss },
      ],
    };
  },
  tick(dt, state) {
    if (!state.anim?.playing) return false;
    state.t += dt;
    if (state.t > state.tEnd) state.t = 0;
    return true;
  },
  law: () => [String.raw`v=\dfrac{ds}{dt}`, String.raw`a=\dfrac{dv}{dt}`],
  liveRows(state, c) {
    return [
      kv('$s$', `${fig(c.s)} m`),
      kv('$v$', `${fig(c.v)} m/s`),
      kv('$a$', `${fig(c.a)} m/s²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['position', `${fig(c.s)} m`],
      ['velocity', `${fig(c.v)} m/s`],
      ['acceleration', `${fig(c.a)} m/s²`],
      ['distance', `${fig(c.distance)} m`],
    ]);
  },
  coach(state, c) {
    const turned = c.distance - Math.abs(c.displacement) > 0.05;
    return {
      title: turned ? 'Distance and displacement split' : 'The areas are the changes',
      body: turned
        ? String.raw`The probe slows, stops, and comes back. The distance counts every metre of that: $${fig(c.distance)}\ \mathrm{m}$. The displacement only nets the trip out: $${fig(c.displacement)}\ \mathrm{m}$. The gap between them is the part of the path the probe retraced.`
        : 'The velocity changes by the area under the a–t graph. The position changes by the area under the v–t graph. Area below the time axis counts negative: it takes back what the area above it gave. Watch the probe. Each readout grows by exactly the area swept out so far.',
    };
  },
});

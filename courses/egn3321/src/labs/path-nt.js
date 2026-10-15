import { normalTangential, normalTangentialOf } from '@flux/subjects/mechanics/path.js';
import { M, makeArrow, makeDot, makeLine, setArrow, setLine } from '../scene/draw.js';
import { fig } from '../ui/format.js';
import { cells, eq, kv } from '../ui/shared.js';
import { THREE, defineLab } from './define.js';
import { bindSlider, slider } from './widgets.js';

const SCENARIOS = [
  { id: 'parabola', name: 'Parabola y = (c/2) x²', c: 1, x: 2, speed: 3, at: 0 },
  { id: 'turn', name: 'Speeding up through the curve', c: 0.8, x: 1.2, speed: 4, at: 1.5 },
  { id: 'sine', name: 'Sine wave', shape: 'sine', c: 1.2, x: 1, speed: 3, at: 0 },
];

function fOf(state) {
  if (state.shape === 'sine') return (x) => state.c * Math.sin(x);
  return (x) => 0.5 * state.c * x * x;
}

function analytic(state) {
  if (state.shape === 'sine') {
    return normalTangential({
      yp: state.c * Math.cos(state.x),
      ypp: -state.c * Math.sin(state.x),
      speed: state.speed,
      at: state.at,
    });
  }
  return normalTangential({
    yp: state.c * state.x,
    ypp: state.c,
    speed: state.speed,
    at: state.at,
  });
}

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id,
    shape: sc.shape || 'parabola',
    c: sc.c,
    x: sc.x,
    speed: sc.speed,
    at: sc.at,
  });
}

export default defineLab({
  id: 'path-nt',
  exam: 'u1',
  title: 'Path',
  hint: 'The acceleration has a piece that turns the velocity, even when the speed is constant.',
  camera: { pos: new THREE.Vector3(0, 2, 14), target: new THREE.Vector3(0, 2, 0) },
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('parabola', s);
    return s;
  },
  applyScenario: apply,
  cameraFor(state) {
    const y = fOf(state)(0);
    const yEdge = Math.max(Math.abs(fOf(state)(-2.8)), Math.abs(fOf(state)(2.8)), 1);
    const mid = Math.max(0.4, 0.45 * yEdge);
    void y;
    return {
      pos: new THREE.Vector3(0, mid, Math.max(12, yEdge * 3.2)),
      target: new THREE.Vector3(0, mid, 0),
    };
  },
  controls() {
    return `
      ${slider('nt-c', 'curve scale c', 1, 0.2, 1.6, 0.05)}
      ${slider('nt-x', 'x (m)', 2, -2.6, 2.6, 0.05)}
      ${slider('nt-v', 'speed v (m/s)', 3, 0, 8, 0.1)}
      ${slider('nt-at', 'a_t (m/s²)', 0, -4, 4, 0.1)}
      <p class="tiny">White is the velocity. Gold is a_t, along the path. Pink is a_n, toward the centre of curvature.</p>`;
  },
  bind(api) {
    bindSlider('nt-c', (s, v) => { s.c = v; }, api);
    bindSlider('nt-x', (s, v) => { s.x = v; }, api);
    bindSlider('nt-v', (s, v) => { s.speed = v; }, api);
    bindSlider('nt-at', (s, v) => { s.at = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('nt-c', state.c);
    set('nt-x', state.x);
    set('nt-v', state.speed);
    set('nt-at', state.at);
  },
  init(ctx) {
    const group = new THREE.Group();
    const curve = makeLine(M.white);
    const tangent = makeArrow(M.white);
    const normal = makeArrow(M.pink);
    const along = makeArrow(M.gold);
    const dot = makeDot(M.red, 0.12);
    group.add(curve, tangent, normal, along, dot);
    ctx.scene.add(group);
    return { group, curve, tangent, normal, along, dot };
  },
  enter(ctx, handle) {
    handle.group.visible = true;
  },
  exit(ctx, handle) {
    handle.group.visible = false;
  },
  recompute(state, computed) {
    const f = fOf(state);
    const motion = analytic(state);
    const num = normalTangentialOf(f, state.x, state.speed, state.at);
    const rhoScale = Math.max(1, Math.abs(motion.rho));
    const anScale = Math.max(1e-6, Math.abs(motion.an));
    Object.assign(computed, {
      rho: motion.rho,
      at: motion.at,
      an: motion.an,
      magA: motion.magA,
      t: motion.t,
      n: motion.n,
      y: f(state.x),
      gap: Math.max(
        Math.abs(num.rho - motion.rho) / rhoScale,
        Math.abs(num.an - motion.an) / anScale,
        Math.abs(num.at - motion.at) / Math.max(1, Math.abs(motion.at)),
      ),
    });
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const x = -2.8 + (5.6 * i) / 80;
      pts.push({ x, y: f(x) });
    }
    computed.pts = pts;
  },
  syncViews(state, computed, ctx) {
    const h = ctx.handle;
    setLine(h.curve, computed.pts);
    const origin = { x: state.x, y: computed.y };
    h.dot.position.set(origin.x, origin.y, 0);
    setArrow(h.tangent, origin, { x: computed.t.x * state.speed, y: computed.t.y * state.speed });
    setArrow(h.normal, origin, { x: computed.n.x * computed.an, y: computed.n.y * computed.an });
    setArrow(h.along, origin, { x: computed.t.x * computed.at, y: computed.t.y * computed.at });
  },
  law: () => [String.raw`a_t=\dot v`, String.raw`a_n=\dfrac{v^{2}}{\rho}`, String.raw`\rho=\dfrac{(1+y'^{2})^{3/2}}{|y''|}`],
  liveRows(state, c) {
    return [
      kv('$\\rho$', `${fig(c.rho)} m`),
      kv('$a_t$', `${fig(c.at)} m/s²`),
      kv('$a_n$', `${fig(c.an)} m/s²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['radius ρ', `${fig(c.rho)} m`],
      ['a_t', `${fig(c.at)} m/s²`],
      ['a_n', `${fig(c.an)} m/s²`],
      ['|a|', `${fig(c.magA)} m/s²`],
    ]);
  },
  coach(state, c) {
    return {
      title: 'The acceleration is not the tangent',
      body: [
        String.raw`$a_t = ${fig(c.at)}\ \mathrm{m/s^2}$ changes the speed. $a_n = ${fig(c.an)}\ \mathrm{m/s^2}$ turns it.`,
        eq(String.raw`a=\sqrt{a_t^{2}+a_n^{2}}`),
      ],
    };
  },
});

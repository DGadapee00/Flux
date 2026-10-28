import { normalTangential, normalTangentialOf } from '@flux/subjects/mechanics/path.js';
import { fig } from '../ui/format.js';
import { cells, eq, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
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
    anim: { playing: false },
    show: { play: false },
  });
}

/**
 * Normal and tangential components (Hibbeler §12.7). Shows that a particle on a curve accelerates
 * even at constant speed: a_n = v²/ρ points to the centre of curvature, drawn here with its
 * osculating circle, and grows where the path bends tightest. Play runs the particle along the path
 * at the set speed.
 *
 * Recompute: ρ from y′ and y″ in closed form. Check: ρ and a_n from finite differences on the path.
 */

export default defineLab({
  id: 'path-nt',
  exam: 'u1',
  title: 'Path',
  app: false,
  gapLimit: 1e-3,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  sweep: () => ({ key: 'x', lo: -2.6, hi: 2.6 }),
  hint: 'The acceleration has a piece that turns the velocity, even when the speed is constant.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('parabola', s);
    return s;
  },
  applyScenario: apply,
  controls() {
    return `
      ${slider('nt-c', 'curve scale c', 1, 0.2, 1.6, 0.05)}
      ${slider('nt-x', 'x (m)', 2, -2.6, 2.6, 0.05)}
      ${slider('nt-v', 'speed v (m/s)', 3, 0, 8, 0.1)}
      ${slider('nt-at', 'a_t (m/s²)', 0, -4, 4, 0.1)}
      <p class="tiny">White is the velocity. Gold is a_t, along the path. Pink is a_n, toward the centre of curvature; the dashed circle is the circle the path follows for an instant. Play runs the particle along the path at the set speed.</p>`;
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
      if (el && document.activeElement !== el) el.value = String(Math.round(Number(val) * 100) / 100);
    };
    set('nt-c', state.c);
    set('nt-x', state.x);
    set('nt-v', state.speed);
    set('nt-at', state.at);
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    // Along the path at the set speed: dx/dt = v / √(1 + y′²). It wraps back at the far edge.
    const f = fOf(state);
    const h = 1e-4;
    const slope = (f(state.x + h) - f(state.x - h)) / (2 * h);
    let x = state.x + (0.5 * dt * (Number(state.speed) || 0)) / Math.sqrt(1 + slope * slope);
    if (x > 2.6) x = -2.6;
    state.x = x;
    return true;
  },
  compute(state) {
    const f = fOf(state);
    const computed = {};
    const motion = analytic(state);
    const num = normalTangentialOf(f, state.x, state.speed, state.at);
    const rhoScale = Math.max(1, Math.abs(motion.rho));
    const anScale = Math.max(1e-6, Math.abs(motion.an));
    // A straight stretch has ρ infinite; it is held at 10⁶ m, shown as ∞.
    const RHO_MAX = 1e6;
    Object.assign(computed, {
      rho: Number.isFinite(motion.rho) ? Math.sign(motion.rho || 1) * Math.min(Math.abs(motion.rho), RHO_MAX) : RHO_MAX,
      at: motion.at,
      an: motion.an,
      magA: motion.magA,
      t: motion.t,
      n: motion.n,
      y: f(state.x),
      // Compare curvature, 1/ρ, so a straight stretch (ρ infinite) still checks.
      gap: Math.max(
        Math.abs(1 / num.rho - 1 / motion.rho) * Math.min(rhoScale, 1e6),
        Math.abs(num.an - motion.an) / anScale,
        Math.abs(num.at - motion.at) / Math.max(1, Math.abs(motion.at)),
      ),
    });
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const x = -2.8 + (5.6 * i) / 80;
      pts.push({ x, y: f(x) });
    }
    computed.pts = pts.map((p) => [p.x, p.y]);
    computed.series = [];
    for (let i = 0; i <= 104; i++) {
      const x = -2.6 + (5.2 * i) / 104;
      const m = analytic({ ...state, x });
      computed.series.push([x, Math.abs(m.an)]);
    }
    return computed;
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.58);
    const ys = c.pts.map((p) => p[1]);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const S = sceneIn(B, left, { x0: -3, x1: 3, y0: lo - 0.6, y1: hi + 0.8 });
    line(S, c.pts, { color: alpha(C.text, 0.8), width: 2 });
    const P0 = [state.x, c.y];
    // The osculating circle: radius ρ, centred along the normal. Drawn only when it fits the view.
    if (Number.isFinite(c.rho) && Math.abs(c.rho) < 12) {
      // Clipped to the drawing, so a large circle does not spill onto the chart.
      B.ctx.save();
      B.ctx.beginPath();
      B.ctx.rect(left.x0, left.y0, left.x1 - left.x0, left.y1 - left.y0);
      B.ctx.clip();
      const centre = [P0[0] + c.n.x * Math.abs(c.rho), P0[1] + c.n.y * Math.abs(c.rho)];
      circle(S, centre, Math.abs(c.rho), { stroke: alpha(C.pink, 0.45), width: 1, dash: [4, 5] });
      seg(S, P0, centre, { color: alpha(C.pink, 0.35), width: 1, dash: [2, 4] });
      dot(S, centre[0], centre[1], { color: alpha(C.pink, 0.8), r: 3 });
      if (!veiled) label(S, `ρ = ${fig(c.rho)} m`, centre, { color: C.pink, dy: 12 });
      B.ctx.restore();
    }
    const vk = (0.18 * 6 * S.k) / Math.max(Number(state.speed) || 1, 1);
    const ak = (0.18 * 6 * S.k) / Math.max(c.magA, 1);
    vec(S, P0, [c.t.x * state.speed, c.t.y * state.speed], vk, { color: C.text, label: 'v' });
    if (Math.abs(c.at) > 1e-6) vec(S, P0, [c.t.x * c.at, c.t.y * c.at], ak, { color: C.gold, label: 'aₜ' });
    if (Math.abs(c.an) > 1e-6) vec(S, P0, [c.n.x * c.an, c.n.y * c.an], ak, { color: C.pink, label: 'aₙ' });
    dot(S, P0[0], P0[1], { color: C.yellow, r: 6 });
    if (veiled) return;

    // a_n along the whole path at this speed: it peaks where ρ is smallest.
    const top = Math.max(1e-6, ...c.series.map((q) => q[1])) * 1.15;
    const P = chartIn(B, right, { lo: -2.6, hi: 2.6 }, { lo: 0, hi: top });
    axes(P, { xLabel: 'x (m)', yLabel: `aₙ at ${fig(state.speed)} m/s (m/s²)` });
    line(P, c.series, { color: C.pink, width: 2.5 });
    dot(P, state.x, Math.abs(c.an), { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`a_t=\dot v`, String.raw`a_n=\dfrac{v^{2}}{\rho}`, String.raw`\rho=\dfrac{(1+y'^{2})^{3/2}}{|y''|}`],
  liveRows(state, c) {
    return [
      kv('$\\rho$', Math.abs(c.rho) >= 1e6 ? '∞ (straight here)' : `${fig(c.rho)} m`),
      kv('$a_t$', `${fig(c.at)} m/s²`),
      kv('$a_n$', `${fig(c.an)} m/s²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['radius ρ', Math.abs(c.rho) >= 1e6 ? '∞' : `${fig(c.rho)} m`],
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
        'The normal part never speeds the particle up or slows it down. It only bends the velocity toward the centre of curvature.',
        String.raw`That centre sits ${fig(c.rho)} metres away, along the normal. Halve that radius and the same speed needs twice the normal acceleration.`,
        eq(String.raw`a=\sqrt{a_t^{2}+a_n^{2}}`),
      ],
    };
  },
});

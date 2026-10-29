import { sliderCrank } from '@flux/subjects/mechanics/rigid2d.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha as fade, axes, begin, chartIn, circle, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, playing } from './motion.js';
import { bindSlider, slider } from './widgets.js';

const DEG = Math.PI / 180;

/**
 * A slider-crank, the mechanism of every piston engine and pump (Hibbeler §16.4, §16.8). Shows that
 * at a dead centre the slider stops, yet still accelerates hardest, and that its motion is not a
 * pure sine: the rod's angle makes the acceleration larger at the outer dead centre than the inner. Play it: the crank turns,
 * and the chart traces the slider's velocity and acceleration over a turn.
 *
 * Recompute: x = r cos θ + l cos φ, differentiated in closed form. Check: x differentiated numerically.
 */
const SCENARIOS = [
  { id: 'extended', name: 'Extended', r: 0.2, l: 0.8, theta: 0, omega: 10, alpha: 0 },
  { id: 'mid', name: 'Mid stroke', r: 0.2, l: 0.8, theta: 90, omega: 10, alpha: 0 },
  { id: 'folded', name: 'Folded', r: 0.2, l: 0.8, theta: 180, omega: 10, alpha: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.r = sc.r;
  state.l = sc.l;
  state.theta = sc.theta;
  state.omega = sc.omega;
  state.alpha = sc.alpha;
  state.anim = { playing: false };
  state.show = { play: false };
}

function constraint(r, l, theta) {
  if (!(l > 0)) return NaN;
  const s = (r / l) * Math.sin(theta);
  if (Math.abs(s) > 1) return NaN;
  return r * Math.cos(theta) + l * Math.sqrt(1 - s * s);
}

export default defineLab({
  id: 'slider-crank',
  exam: 'u5',
  title: 'Slider-crank',
  app: false,
  gapLimit: 1e-4,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'At a dead centre the slider speed is zero. The acceleration is not, because of the −ω²r term.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('extended', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: 0, hi: 360 }),
  controls() {
    return `
      ${slider('sc-r', 'crank r (m)', 0.2, 0.1, 0.6, 0.01)}
      ${slider('sc-l', 'rod l (m)', 0.8, 0.3, 1.2, 0.01)}
      ${slider('sc-theta', 'crank (deg)', 0, 0, 360, 1)}
      ${slider('sc-omega', 'omega (rad/s)', 10, 0, 20, 0.5)}
      ${slider('sc-alpha', 'alpha (rad/s²)', 0, -20, 20, 0.5)}
      <p class="tiny">The crank is teal, the rod white, the slider gold in its guide. White is the slider's velocity and pink its acceleration; the faint arrow is the crank pin's velocity, rω. Play turns the crank at a twentieth of ω.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; }, api);
    link('sc-r', 'r');
    link('sc-l', 'l');
    link('sc-theta', 'theta');
    link('sc-omega', 'omega');
    link('sc-alpha', 'alpha');
  },
  syncControls(state) {
    for (const [id, key] of [
      ['sc-r', 'r'], ['sc-l', 'l'], ['sc-theta', 'theta'], ['sc-omega', 'omega'], ['sc-alpha', 'alpha'],
    ]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(Math.round(Number(state[key]) * 100) / 100);
    }
  },
  tick(dt, state) {
    if (!playing(state)) return false;
    // A twentieth of real speed, at least a slow turn when ω is zero.
    const w = Math.max(Math.abs(Number(state.omega) || 0), 2);
    state.theta = ((Number(state.theta) || 0) + (w * dt) / 20 / DEG) % 360;
    return true;
  },
  compute(state) {
    const th = (Number(state.theta) || 0) * DEG;
    const r = Number(state.r) || 0;
    const l = Number(state.l) || 0;
    const omega = Number(state.omega) || 0;
    const alpha = Number(state.alpha) || 0;
    const row = sliderCrank({ r, l, theta: th, omega, alpha });
    const pinX = r * Math.cos(th);
    const pinY = r * Math.sin(th);
    const series = Array.from({ length: 145 }, (_, i) => {
      const q = sliderCrank({ r, l, theta: (i * 2.5) * DEG, omega, alpha });
      return [i * 2.5, q.locked ? NaN : q.v, q.locked ? NaN : q.a];
    });
    if (row.locked) {
      return { x: 0, v: 0, a: 0, phi: 0, gap: 0, locked: 1, pinX, pinY, series };
    }
    const h = 1e-5;
    const xAt = (t) => constraint(r, l, th + omega * t + 0.5 * alpha * t * t);
    const x0 = xAt(0);
    const vNum = (xAt(h) - xAt(-h)) / (2 * h);
    const aNum = (xAt(h) - 2 * x0 + xAt(-h)) / (h * h);
    const gap = Number.isFinite(vNum) && Number.isFinite(aNum)
      ? Math.max(
        Math.abs(row.v - vNum) / Math.max(1, Math.abs(row.v)),
        Math.abs(row.a - aNum) / Math.max(1, Math.abs(row.a)),
      )
      : 0;
    return { x: row.x, v: row.v, a: row.a, phi: row.phi, gap, locked: 0, pinX, pinY, series };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.5);
    const r = Number(state.r) || 0;
    const l = Number(state.l) || 0;
    const reach = Math.max(r + l, 0.4);
    const S = sceneIn(B, left, { x0: -r - 0.08, x1: reach + 0.22, y0: -r - 0.12, y1: r + 0.12 });
    // The guide the slider runs in, and the circle the crank pin rides.
    const guideLo = Math.max(l - r, 0) - 0.1;
    poly(S, [[guideLo, -0.06], [reach + 0.15, -0.06], [reach + 0.15, -0.075], [guideLo, -0.075]], { fill: fade(C.text, 0.35), stroke: null });
    poly(S, [[guideLo, 0.06], [reach + 0.15, 0.06], [reach + 0.15, 0.075], [guideLo, 0.075]], { fill: fade(C.text, 0.35), stroke: null });
    circle(S, [0, 0], r, { stroke: fade(C.teal, 0.3), width: 1, dash: [4, 4] });
    seg(S, [0, 0], [c.pinX, c.pinY], { color: C.teal, width: 5 });
    dot(S, 0, 0, { color: C.gold, r: 5 });
    dot(S, c.pinX, c.pinY, { color: C.teal, r: 4 });
    const w = Number(state.omega) || 0;
    if (Math.abs(w) > 1e-9 && r > 0) {
      const vp = [-w * c.pinY, w * c.pinX];
      vec(S, [c.pinX, c.pinY], vp, (0.12 * S.k) / Math.max(Math.abs(w) * r, 1e-9), { color: fade(C.text, 0.4), width: 1.5 });
    }
    if (!c.locked) {
      seg(S, [c.pinX, c.pinY], [c.x, 0], { color: C.text, width: 3.5 });
      poly(S, [[c.x - 0.06, -0.05], [c.x + 0.06, -0.05], [c.x + 0.06, 0.05], [c.x - 0.06, 0.05]], { fill: fade(C.gold, 0.5), stroke: C.gold, width: 1.5 });
      dot(S, c.x, 0, { color: C.text, r: 3 });
      const vMax = Math.max(1e-9, ...c.series.map((q) => (Number.isFinite(q[1]) ? Math.abs(q[1]) : 0)));
      const aMax = Math.max(1e-9, ...c.series.map((q) => (Number.isFinite(q[2]) ? Math.abs(q[2]) : 0)));
      if (Math.abs(c.v) > 1e-6) vec(S, [c.x, 0.1], [c.v, 0], (0.3 * S.k) / vMax, { color: C.text, label: veiled ? 'v' : `${fig(c.v)} m/s` });
      if (Math.abs(c.a) > 1e-6) vec(S, [c.x, -0.1], [c.a, 0], (0.3 * S.k) / aMax, { color: C.pink, label: veiled ? 'a' : `${fig(c.a)} m/s²` });
    } else {
      label(S, 'the rod cannot reach', [reach / 2, 0], { color: C.red });
    }
    if (veiled) return;

    // The slider's velocity and acceleration over a turn, each scaled to its own peak.
    const P = chartIn(B, right, { lo: 0, hi: 360 }, { lo: -1.15, hi: 1.15 });
    axes(P, { xLabel: 'crank angle θ (deg)', yLabel: 'v and a, each over its peak' });
    line(P, [[0, 0], [360, 0]], { color: fade(C.text, 0.35), width: 1 });
    const fin = c.series.filter((q) => Number.isFinite(q[1]));
    const vMax = Math.max(1e-9, ...fin.map((q) => Math.abs(q[1])));
    const aMax = Math.max(1e-9, ...fin.map((q) => Math.abs(q[2])));
    line(P, fin.map((q) => [q[0], q[1] / vMax]), { color: C.text, width: 2.2 });
    line(P, fin.map((q) => [q[0], q[2] / aMax]), { color: C.pink, width: 2.2 });
    const th = (Number(state.theta) || 0) % 360;
    if (!c.locked) {
      dot(P, th, c.v / vMax, { color: C.text, r: 4 });
      dot(P, th, c.a / aMax, { color: C.pink, r: 4 });
    }
    label(P, `v peak ${fig(vMax)} m/s`, [355, 1.08], { color: C.text, align: 'right' });
    label(P, `a peak ${fig(aMax)} m/s²`, [355, -1.08], { color: C.pink, align: 'right' });
  },
  law: () => [String.raw`x=r\cos\theta+\ell\cos\phi`, String.raw`a_B=a_A+\alpha\times r-\omega^2 r`],
  liveRows(state, c) {
    return [
      kv('$x$', `${fig(c.x)} m`),
      kv('$v$', `${fig(c.v)} m/s`),
      kv('$a$', `${fig(c.a)} m/s²`),
      kv('rod angle $\\phi$', `${fig(c.phi / DEG)}°`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['x', `${fig(c.x)} m`],
      ['speed', `${fig(c.v)} m/s`],
      ['accel', `${fig(c.a)} m/s²`],
    ]);
  },
  coach(state, c) {
    if (c.locked > 0) {
      return {
        title: 'The rod cannot reach',
        body: 'At this angle the crank is too long for the rod. The linkage is not assembled.',
      };
    }
    if (Math.abs(c.v) < 1e-6) {
      return {
        title: 'Stopped, and still accelerating',
        body: String.raw`The slider speed is 0. The acceleration is ${fig(c.a)} m/s². The $-\omega^2 r$ term remains at a dead centre. On the chart, the pink curve peaks where the white one crosses zero.`,
      };
    }
    return {
      title: 'Write the position, then differentiate',
      body: String.raw`The slider is at ${fig(c.x)} m. Its velocity is ${fig(c.v)} m/s and its acceleration is ${fig(c.a)} m/s². The curves are not pure sines. The rod's tilt, $\phi$, makes the acceleration largest at the outer dead centre, $r\omega^2(1 + r/\ell)$, and smallest at the inner, $r\omega^2(1 - r/\ell)$.`,
    };
  },
});

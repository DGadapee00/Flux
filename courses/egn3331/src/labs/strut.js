import { lippedChannel, openShearCentre } from '@flux/subjects/mechanics/thinwall.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, dot, hidden, label, line, panes, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that an open channel loaded through its own web still twists: the shear flow in its
 * flanges and lips is a couple, so the load must pass a point behind the back, the shear centre,
 * to bend it cleanly. A strut channel bolted to a wall, slot out, carries its pipe clamps 2.3 in
 * from that point, and an open section has almost no torsional stiffness to resist the torque.
 *
 * Cited: Unistrut P1000, 1-5/8 × 1-5/8 in, 12 gauge (0.105 in), area 0.555 in² and an allowable
 * uniform load of 850 lb on a 48 in span (distributor catalog listings). The lips are modelled as
 * straight returns whose length makes the centreline add up to that area: (0.555/0.105 − 3 ×
 * 1.52)/2 = 0.36 in. E = 29,000 ksi (AISC); ν = 0.3 is assumed. The pipe load and the span are
 * assumed. Recompute: a numerical shear-flow integral round the open wall. Second method: the
 * closed form e = (tb/I)(h²b/4 + h²d/2 − 2d³/3).
 */

const T = 0.105;
const OUT_IN = 1.625;
const H = OUT_IN - T;
const B = OUT_IN - T;
const AREA = 0.555;
const LIP = (AREA / T - H - 2 * B) / 2;
const G = 29e6 / 2.6;
const OUT = 'The lips are straight here; the real ones curl inward, which moves the shear centre a little. The twist uses St. Venant\'s J alone, as if the ends of the channel could warp freely. Bolted ends resist warping, and over a short span that restraint carries much of the torque, so the twist and the twisting stress here are upper bounds. The clamps, the pipes and the wall anchors also stiffen it. The catalog\'s 850 lb at 48 in is for loads through the slot along the symmetry axis, not across it.';

const SCENARIOS = [
  { id: 'wall', name: 'On a wall, pipes clamped at the slot', w: 50, L: 48, x: B, d: LIP },
  { id: 'back', name: 'Loaded through the back', w: 50, L: 48, x: 0, d: LIP },
  { id: 'plain', name: 'A plain channel, no lips', w: 50, L: 48, x: B, d: 0 },
  { id: 'heavy', name: 'Catalog load, 212 lb/ft, across the slot', w: 212.5, L: 48, x: B, d: LIP },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, w: sc.w, L: sc.L, x: sc.x, d: sc.d });
}

const path = (d) => (d > 1e-6
  ? [[B, H / 2 - d], [B, H / 2], [0, H / 2], [0, -H / 2], [B, -H / 2], [B, -H / 2 + d]]
  : [[B, H / 2], [0, H / 2], [0, -H / 2], [B, -H / 2]]);

/** Inch-pound: in, lbf, psi. x is the load line measured from the back toward the slot. */
export function strut(state) {
  const d = Math.max(0, Math.min(Number(state.d) || 0, H / 2 - 0.05));
  const o = openShearCentre(path(d), T, 1, 1200);
  const e = -o.xs;
  const c = lippedChannel(1, B, H, d, T);
  const w = (Number(state.w) || 0) / 12;
  const L = Number(state.L) || 48;
  const arm = (Number(state.x) || 0) + e;
  const m = w * arm;
  const Tsup = (m * L) / 2;
  const phi = (m * L * L) / (8 * G * o.J);
  const V = (w * L) / 2;
  const Qmid = T * ((d * (H - d)) / 2 + (B * H) / 2 + (H * H) / 8);
  const tauV = (V * Qmid) / (o.I * T);
  const tauT = (Tsup * T) / o.J;
  const sigma = ((w * L * L) / 8) * (OUT_IN / 2) / o.I;
  const gap = Math.max(Math.abs(e - c.e) / c.e, Math.abs(o.I - c.I) / c.I, Math.abs(o.J - c.J) / c.J);
  return {
    d, e, arm, m, Tsup, phi, phiDeg: (phi * 180) / Math.PI, tauV, tauT, sigma, I: o.I, J: o.J, w, L, V, flow: o.flow, gap,
  };
}

function member(B0, rect, state, c, veiled) {
  const S = sceneIn(B0, rect, { x0: -2.3, x1: 2.3, y0: -1.5, y1: 1.5 }, 12);
  // The wall behind the back.
  seg(S, [-0.12, -1.3], [-0.12, 1.3], { color: C.muted, width: 6 });
  for (let y = -1.2; y <= 1.21; y += 0.3) seg(S, [-0.15, y], [-0.4, y - 0.2], { color: alpha(C.muted, 0.6), width: 1 });
  const p = path(c.d);
  for (let i = 0; i + 1 < p.length; i++) seg(S, p[i], p[i + 1], { color: C.text, width: 4 });
  // Shear flow, sampled along the wall: arrows along the path, scaled by |q|.
  const qmax = Math.max(...c.flow.map((f) => Math.abs(f.q)), 1e-12);
  const every = S.k < 70 ? 3 : 2;
  c.flow.forEach((f, i) => {
    if (i % every) return;
    // Drawn just inside the wall, longer where it is stronger, in the sense that carries the
    // downward load down the web.
    const nx = B / 2 - f.x;
    const ny = -f.y;
    const nl = Math.hypot(nx, ny) || 1;
    const at = [f.x + (0.14 * nx) / nl, f.y + (0.14 * ny) / nl];
    const len = S.k * (0.1 + 0.3 * (Math.abs(f.q) / qmax));
    const ang = Math.atan2(f.uy, f.ux) + (f.q > 0 ? Math.PI : 0);
    arrow(S, at, ang, len, { color: C.teal, width: 2, head: Math.min(6, 0.12 * S.k) });
  });
  // The shear centre and the load line.
  dot(S, -c.e, 0, { color: C.yellow, r: 5 });
  seg(S, [Number(state.x) || 0, 1.35], [Number(state.x) || 0, 0.15], { color: C.pink, width: 1, dash: [3, 3] });
  arrow(S, [Number(state.x) || 0, 0], -Math.PI / 2, 26, { color: C.pink });
  if (!veiled) {
    label(S, 'S', [-c.e, 0], { color: C.yellow, dx: -10, dy: -10 });
    label(S, `e ${fig(c.e)} in`, [-c.e, 0], { color: C.yellow, dx: -8, dy: 16, align: 'right' });
    label(S, `arm ${fig(c.arm)} in`, [Number(state.x) || 0, -1.3], { color: C.pink });
  }
}

export default defineLab({
  id: 'strut',
  exam: 'u7',
  title: 'Strut channel',
  app: true,
  hint: 'The flange and lip flows form a couple. Only a load through the shear centre, behind the back, bends the channel without twisting it.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('wall', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x', lo: -1.2, hi: 1.6 }),
  controls() {
    return `
      ${slider('st-x', 'load line from the back (in)', 1.52, -1.2, 1.6, 0.02)}
      ${slider('st-w', 'pipe load (lb/ft)', 50, 10, 250, 5)}
      ${slider('st-l', 'span between anchors (in)', 48, 12, 96, 6)}
      ${slider('st-d', 'lip length (in)', 0.36, 0, 0.6, 0.01)}
      <p class="tiny">Cited: Unistrut P1000, 1-5/8 × 1-5/8 in, 0.105 in wall, 0.555 in², 850 lb allowable uniform load at 48 in (catalog listings). Lip length derived from the area. E = 29,000 ksi (AISC); ν = 0.3, the pipe load and span are assumed.</p>`;
  },
  bind(api) {
    bindSlider('st-x', (s, v) => { s.x = v; }, api);
    bindSlider('st-w', (s, v) => { s.w = v; }, api);
    bindSlider('st-l', (s, v) => { s.L = v; }, api);
    bindSlider('st-d', (s, v) => { s.d = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('st-x', state.x);
    set('st-w', state.w);
    set('st-l', state.L);
    set('st-d', state.d);
  },
  compute(state) {
    return strut(state);
  },
  draw(canvas, state, c) {
    const B0 = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B0, 0.5);
    member(B0, D, state, c, veiled);
    if (veiled) return;
    const lo = strut({ ...state, x: -1.2 }).phiDeg;
    const hi = strut({ ...state, x: 1.6 }).phiDeg;
    const span = Math.max(Math.abs(lo), Math.abs(hi), 1);
    const P = chartIn(B0, R, { lo: -1.2, hi: 1.6 }, { lo: -span * 1.1, hi: span * 1.1 });
    axes(P, { xLabel: 'load line from the back (in)', yLabel: 'midspan twist, upper bound (°)' });
    line(P, [[-1.2, lo], [1.6, hi]], { color: C.gold, width: 3 });
    line(P, [[-1.2, 0], [1.6, 0]], { color: alpha(C.text, 0.4), width: 1 });
    dot(P, -c.e, 0, { color: C.yellow, r: 5 });
    dot(P, Number(state.x) || 0, c.phiDeg, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`e = \frac{t\,b}{I}\left(\frac{h^2b}{4}+\frac{h^2d}{2}-\frac{2d^3}{3}\right)`, String.raw`\tau = \frac{T\,t}{J},\quad J=\sum\frac{L\,t^3}{3}`],
  liveRows(state, c) {
    return [
      kv('shear centre behind the back', `${fig(c.e)} in`),
      kv('load arm about it', `${fig(c.arm)} in`),
      kv('torque at each anchor', `${fig(c.Tsup)} lbf·in`),
      kv('shear from bending, mid-web', `${fig(c.tauV)} psi`),
      kv('shear from twist (St. Venant)', `${fig(c.tauT)} psi`),
      kv('bending stress', `${fig(c.sigma)} psi`),
      kv('midspan twist, upper bound', `${fig(c.phiDeg)}°`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['e', `${fig(c.e)} in`],
      ['arm', `${fig(c.arm)} in`],
      ['twist shear', `${fig(c.tauT / 1000)} ksi`],
      ['twist', `${fig(c.phiDeg)}°`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: Math.abs(c.arm) < 0.05 ? 'Through the shear centre: no twist' : 'An open channel twists',
    body: Math.abs(c.arm) < 0.05
      ? String.raw`The load passes ${fig(c.e)} in behind the back, where the flange-and-lip couple is cancelled. The channel only bends.`
      : String.raw`The flow in the flanges and lips makes a couple, so the bending-only load line is ${fig(c.e)} in behind the back. This load is ${fig(c.arm)} in from it, a torque of ${fig(c.m * 12)} lbf·in per foot. The open wall has J = ${fig(c.J)} in⁴, so each anchor's ${fig(c.Tsup)} lbf·in drives ${fig(c.tauT / 1000)} ksi of twisting shear, against ${fig(c.tauV)} psi from bending.`,
  })),
});

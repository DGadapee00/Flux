import { G } from '@flux/subjects/mechanics/constants.js';
import { barPin, platePin } from '@flux/subjects/mechanics/inertia.js';
import { pinnedAt, swing } from '@flux/subjects/mechanics/pinned.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha as fade, axes, begin, chartIn, dot, hidden, label, line, poly, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * A body swinging on a pin (Hibbeler §17.4): a slender bar pinned at one end, or a square plate
 * pinned at a corner. Shows that the pin does not simply hold the weight: released level, the bar's
 * pin carries a quarter of it, and swinging through the bottom, two and a half times it. The free-body
 * diagram on the left equals the kinetic diagram on the right: m a_t, m a_n and I_G α.
 *
 * Recompute: moments about the pin, then ΣF = m a_G, at any pose (subjects/mechanics/pinned.js).
 * Check: barPin and platePin's own closed forms at the release, and energy along the swing.
 */
const SCENARIOS = [
  { id: 'bar', name: 'Slender bar', mode: 'bar', mass: 4, length: 2, theta: 90, omega: 0 },
  { id: 'hanging', name: 'Hanging bar', mode: 'bar', mass: 4, length: 2, theta: 0, omega: 0 },
  { id: 'plate', name: 'Square plate', mode: 'plate', mass: 2, side: 0.4, omega: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  state.scenarioId = sc.id;
  state.mode = sc.mode;
  state.mass = sc.mass ?? state.mass ?? 4;
  state.length = sc.length ?? state.length ?? 2;
  state.theta = sc.theta ?? state.theta ?? 90;
  state.omega = sc.omega ?? state.omega ?? 0;
  state.side = sc.side ?? state.side ?? 0.4;
  state.t = 0;
  state.anim = { playing: false };
  state.show = { play: false };
}

const T_END = 6;
const rel = (a, b) => Math.abs(a - b) / Math.max(1e-9, Math.abs(a), Math.abs(b));

/** The body as the swing sees it: mass, I about the pin, G's offset at release, and its outline. */
function body(state) {
  const m = Number(state.mass) || 0;
  if (state.mode === 'plate') {
    const s = Number(state.side) || 0.4;
    const ref = platePin({ mass: m, width: s, height: s, omega: 0, g: G });
    return { m, IO: ref.IO, IG: ref.IG, r0: [s / 2, s / 2], omega0: 0, outline: [[0, 0], [s, 0], [s, s], [0, s]], span: s * 1.42, ref };
  }
  const L = Number(state.length) || 2;
  const th = ((Number(state.theta) || 0) * Math.PI) / 180;
  const w = Number(state.omega) || 0;
  const ref = barPin({ mass: m, length: L, thetaDeg: Number(state.theta) || 0, omega: w, g: G });
  const tip = [L * Math.sin(th), -L * Math.cos(th)];
  return { m, IO: ref.IO, IG: ref.IG, r0: [tip[0] / 2, tip[1] / 2], omega0: w, outline: [[0, 0], tip], span: L, ref };
}

const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/** A curved arrow for a couple, I_G α, centred on `at`, counterclockwise when `sign` > 0. */
function spin(S, at, px, sign, color, text) {
  const { ctx } = S;
  const cx = S.X(at[0]);
  const cy = S.Y(at[1]);
  const a0 = -0.25 * Math.PI;
  const a1 = 1.15 * Math.PI;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, px, -a1, -a0);
  ctx.stroke();
  ctx.setLineDash([]);
  // Screen y runs down, so a counterclockwise couple's head sits at the arc's start.
  const end = sign > 0 ? -a1 : -a0;
  const hx = cx + px * Math.cos(end);
  const hy = cy + px * Math.sin(end);
  const dir = sign > 0 ? -1 : 1;
  const tx = -Math.sin(end) * dir;
  const ty = Math.cos(end) * dir;
  ctx.beginPath();
  ctx.moveTo(hx + tx * 8, hy + ty * 8);
  ctx.lineTo(hx - ty * 4.5, hy + tx * 4.5);
  ctx.lineTo(hx + ty * 4.5, hy - tx * 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  if (text) label(S, text, at, { color, dy: -px - 9 });
}

export default defineLab({
  id: 'pendulum',
  exam: 'u6',
  title: 'Pendulum',
  app: false,
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'A horizontal bar, released from rest, loads the pin with a quarter of its weight. Play it and watch the pin force climb as it swings.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('bar', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'theta', lo: 0, hi: 180 }),
  controls() {
    return `
      ${slider('pd-mass', 'mass (kg)', 4, 1, 10, 0.5)}
      ${slider('pd-length', 'length (m)', 2, 0.4, 3, 0.1)}
      ${slider('pd-theta', 'released at, from vertical (deg)', 90, 0, 180, 1)}
      ${slider('pd-omega', 'spin at release (rad/s)', 0, 0, 4, 0.1)}
      ${slider('pd-side', 'side (m)', 0.4, 0.2, 1.2, 0.05)}
      ${slider('pd-t', 'time since release (s)', 0, 0, 6, 0.01)}
      <p class="tiny">Left, the free-body diagram: grey the weight, teal the pin force, one scale. Right, the kinetic diagram: purple m a_t, m a_n and the couple I_G α, drawn as a curved arrow about G. The two are equal.</p>`;
  },
  bind(api) {
    const link = (id, key) => bindSlider(id, (s, val) => { s[key] = val; s.t = key === 't' ? val : 0; }, api);
    link('pd-mass', 'mass');
    link('pd-length', 'length');
    link('pd-theta', 'theta');
    link('pd-omega', 'omega');
    link('pd-side', 'side');
    link('pd-t', 't');
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('pd-mass', state.mass);
    set('pd-length', state.length);
    set('pd-theta', state.theta);
    set('pd-omega', state.omega);
    set('pd-side', state.side);
    set('pd-t', Number((state.t || 0).toFixed(2)));
    const bar = state.mode === 'bar';
    showField('pd-length', bar);
    showField('pd-theta', bar);
    showField('pd-omega', bar);
    showField('pd-side', !bar);
  },
  tick(dt, state) {
    return advance(state, dt, { lo: 0, hi: T_END, rate: 1 });
  },
  compute(state) {
    const b = body(state);
    const run = swing({ mass: b.m, IO: b.IO, r0: b.r0, omega0: b.omega0, g: G, tEnd: T_END });
    const t = Number(state.t) || 0;
    const now = run.at(t);
    const p = pinnedAt({ mass: b.m, IO: b.IO, r: now.r, omega: now.omega, g: G });
    // Second method: the closed forms at the release, and energy conserved along the swing.
    const start = pinnedAt({ mass: b.m, IO: b.IO, r: b.r0, omega: b.omega0, g: G });
    const E0 = 0.5 * b.IO * b.omega0 ** 2 + b.m * G * b.r0[1];
    const E = 0.5 * b.IO * now.omega ** 2 + b.m * G * now.r[1];
    const scaleE = Math.max(1e-9, b.m * G * b.span);
    const W = Math.max(1e-9, b.m * G);
    const gap = Math.max(Math.abs(start.Ox - b.ref.Ox) / W, Math.abs(start.Oy - b.ref.Oy) / W, rel(Math.abs(start.alpha), Math.abs(b.ref.alpha)), Math.abs(E - E0) / scaleE);
    const series = [];
    for (let i = 0; i <= 240; i++) {
      const ti = (T_END * i) / 240;
      const q = run.at(ti);
      series.push([ti, pinnedAt({ mass: b.m, IO: b.IO, r: q.r, omega: q.omega, g: G }).pin / (b.m * G)]);
    }
    const rr = Math.hypot(...now.r);
    return {
      alpha: Math.abs(p.alpha),
      alphaSigned: p.alpha,
      Ox: p.Ox,
      Oy: p.Oy,
      pin: p.pin,
      weight: p.weight,
      ratio: p.pin / Math.max(1e-9, p.weight),
      at: p.at,
      an: p.an,
      IG: b.IG,
      IO: b.IO,
      omegaNow: now.omega,
      phi: now.phi,
      r: now.r,
      rr,
      outline: b.outline.map((q) => rot(q, now.phi)),
      span: b.span,
      thetaNow: (Math.atan2(now.r[0], -now.r[1]) * 180) / Math.PI,
      series,
      t,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [scene, right] = veiled ? [B.free, null] : split(B.free, 0.6);
    // Two diagrams side by side: free body, then kinetic.
    const mid = (scene.x0 + scene.x1) / 2;
    const fbd = { ...scene, x1: mid };
    const kd = { ...scene, x0: mid };
    const R = c.span * 1.08;
    const box = { x0: -R, x1: R, y0: -R, y1: R * 0.7 };
    const bodyAt = (S) => {
      if (c.outline.length === 2) seg(S, c.outline[0], c.outline[1], { color: C.blue, width: 6 });
      else poly(S, c.outline, { fill: fade(C.blue, 0.3), stroke: C.blue, width: 2 });
      dot(S, 0, 0, { color: C.gold, r: 5 });
      dot(S, c.r[0], c.r[1], { color: C.text, r: 3 });
    };
    // Free-body diagram: the weight at G, the pin force at O, one scale.
    const S1 = sceneIn(B, fbd, box);
    bodyAt(S1);
    const kF = (0.45 * c.span * S1.k) / Math.max(c.weight, c.pin, 1e-9);
    vec(S1, c.r, [0, -c.weight], kF, { color: C.dim, label: 'mg' });
    if (c.pin > 1e-6) vec(S1, [0, 0], [c.Ox, c.Oy], kF, { color: C.teal, label: veiled ? 'O' : `O ${fig(c.pin)} N` });
    label(S1, 'free body', [0, box.y1], { color: C.muted, dy: 10 });
    // Kinetic diagram: m a_t along the path, m a_n toward the pin, and I_G α about G.
    const S2 = sceneIn(B, kd, box);
    bodyAt(S2);
    const kK = (0.45 * c.span * S2.k) / Math.max(c.weight, c.pin, 1e-9);
    const rr = Math.max(c.rr, 1e-9);
    const tHat = [-c.r[1] / rr, c.r[0] / rr];
    const nHat = [-c.r[0] / rr, -c.r[1] / rr];
    const mat = Number(state.mass) * c.at;
    const man = Number(state.mass) * c.an;
    if (Math.abs(mat) > 1e-6) vec(S2, c.r, [tHat[0] * mat, tHat[1] * mat], kK, { color: C.purple, dash: [5, 4], width: 2, label: 'm aₜ' });
    if (Math.abs(man) > 1e-6) vec(S2, c.r, [nHat[0] * man, nHat[1] * man], kK, { color: C.purple, dash: [5, 4], width: 2, label: 'm aₙ' });
    if (Math.abs(c.alphaSigned) > 1e-6) spin(S2, c.r, Math.max(12, 0.13 * c.span * S2.k), Math.sign(c.alphaSigned), C.purple, 'I α');
    label(S2, 'kinetic', [0, box.y1], { color: C.muted, dy: 10 });
    B.ctx.save();
    B.ctx.fillStyle = C.text;
    B.ctx.font = '600 20px system-ui, sans-serif';
    B.ctx.textAlign = 'center';
    B.ctx.textBaseline = 'middle';
    B.ctx.fillText('=', mid, (scene.y0 + scene.y1) / 2);
    B.ctx.restore();
    if (veiled) return;

    // The pin force over the swing, as a share of the weight.
    const top = Math.max(1.2, ...c.series.map((q) => q[1])) * 1.08;
    const P = chartIn(B, right, { lo: 0, hi: T_END }, { lo: 0, hi: top });
    axes(P, { xLabel: 'time since release (s)', yLabel: 'pin force / weight' });
    line(P, [[0, 1], [T_END, 1]], { color: fade(C.text, 0.4), width: 1, dash: [4, 4] });
    line(P, c.series, { color: C.teal, width: 2.5 });
    dot(P, c.t, c.ratio, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\Sigma M_O=I_O\alpha`, String.raw`\vec O + m\vec g = m\vec a_G,\quad a_t = r\alpha,\ a_n = r\omega^2`],
  liveRows(state, c) {
    const rows = [
      kv('pin force $O_x$, $O_y$', `${fig(c.Ox)} N, ${fig(c.Oy)} N`),
      kv('pin force / weight', fig(c.ratio)),
      kv('α, ω now', `${fig(c.alpha)} rad/s², ${fig(c.omegaNow)} rad/s`),
      kv('$m a_t$, $m a_n$', `${fig(Number(state.mass) * c.at)} N, ${fig(Number(state.mass) * c.an)} N`),
      kv('$I_G\\alpha$', `${fig(c.IG * c.alpha)} N·m`),
    ];
    if (state.mode === 'bar') rows.push(kv('angle from vertical now', `${fig(c.thetaNow)}°`));
    return rows.join('');
  },
  readout(state, c) {
    if (state.mode === 'plate') {
      return cells([
        ['Ox N', fig(c.Ox)],
        ['Oy N', fig(c.Oy)],
        ['α', fig(c.alpha)],
      ]);
    }
    return cells([
      ['pin N', fig(c.pin)],
      ['ratio', fig(c.ratio)],
      ['α', fig(c.alpha)],
    ]);
  },
  coach(state, c) {
    if (state.mode === 'plate') {
      return {
        title: 'A corner pin',
        body: `The plate's weight is ${fig(c.weight)} N. The pin holds ${fig(c.Ox)} N horizontally and ${fig(c.Oy)} N vertically. α is ${fig(c.alpha)} rad/s². The kinetic diagram shows why: G must accelerate, so the pin cannot simply hold the weight.`,
      };
    }
    const level = c.t === 0 && Math.abs((Number(state.theta) || 0) - 90) < 0.5 && Math.abs(Number(state.omega) || 0) < 1e-9;
    if (level) {
      return {
        title: 'A quarter of the weight',
        body: `The pin holds ${fig(c.pin)} N. The weight is ${fig(c.weight)} N. At this release the ratio is ${fig(c.ratio)}: the bar's centre starts to fall at $a_t = 3g/4$, so only a quarter of the weight is held. α is ${fig(c.alpha)} rad/s². Play it to watch the pin force climb as the bar swings down.`,
      };
    }
    if (c.t === 0 && (Number(state.theta) || 0) < 0.5 && Math.abs(Number(state.omega) || 0) < 1e-9) {
      return {
        title: 'Hanging, the pin holds the weight',
        body: `The bar is at rest below the pin. The pin force is ${fig(c.pin)} N, the same as the weight. α is 0.`,
      };
    }
    return {
      title: 'The pin force follows the pose',
      body: `At ${fig(c.thetaNow)}° from vertical and ω = ${fig(c.omegaNow)} rad/s, the pin holds ${fig(c.pin)} N, ${fig(c.ratio)} times the weight. The normal part of $a_G$, $r\\omega^2$, pulls the pin force up as the bar speeds through the bottom.`,
    };
  },
});

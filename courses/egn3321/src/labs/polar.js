import { polarComponents, polarNumeric, straightPass } from '@flux/subjects/mechanics/polar.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, dot, hidden, label, line, note, sceneIn, seg, split, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance, stopped } from './motion.js';
import { bindSlider, showField, slider } from './widgets.js';

/**
 * Shows that the radial acceleration is not r̈. In polar components a_r = r̈ − rθ̇² and
 * a_θ = rθ̈ + 2ṙθ̇ (Hibbeler §12.8). A collar sliding out at a steady rate along a steadily turning
 * arm has r̈ = 0 and θ̈ = 0, yet it accelerates inward at rθ̇² and sideways at 2ṙθ̇. A car driving
 * straight past a radar at a steady speed has no acceleration at all, yet r̈ and θ̈ are not zero.
 *
 * Recompute: the polar components from r(t), θ(t) in closed form. Check: x = r cos θ and
 * y = r sin θ differentiated numerically and projected on e_r and e_θ (polarNumeric).
 */
const SCENARIOS = [
  { id: 'arm', name: 'Collar sliding out along a turning arm', kind: 'arm', r0: 0.4, u: 0.3, ad: 0, w: 2, al: 0, t: 0.5 },
  { id: 'cam', name: 'Cam follower, r = R₀ + e cos θ', kind: 'cam', R0: 0.3, e: 0.08, w: 3, t: 0.3 },
  { id: 'radar', name: 'A car driving past a radar', kind: 'radar', d: 40, u: 25, x0: -100, t: 0 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  for (const k of ['r0', 'u', 'ad', 'w', 'al', 'R0', 'e', 'd', 'x0', 'tEnd']) delete state[k];
  Object.assign(state, stopped(), { scenarioId: scId, ...rest });
}

/**
 * How long one run lasts. A problem may set `tEnd` to reach its instant; on the arm the run stops
 * before the collar reaches the pivot.
 */
export function runTime(s) {
  if (s.kind === 'cam') return (2 * Math.PI) / Math.max(0.2, Math.abs(s.w));
  if (s.kind === 'radar') return s.tEnd ?? (2 * Math.abs(s.x0)) / Math.max(1, Math.abs(s.u));
  const T = s.tEnd ?? 1.6;
  for (let i = 1; i <= 200; i++) {
    const t = (T * i) / 200;
    // Stop where an inward-moving collar would reach the pivot; one that starts there moves out.
    if (s.r0 + s.u * t + 0.5 * (s.ad || 0) * t * t < 0.05 && s.u + (s.ad || 0) * t < 0) return (T * (i - 1)) / 200 || T / 200;
  }
  return T;
}

/** r, θ and their first two derivatives at time t, in closed form. */
export function motionAt(s, t) {
  if (s.kind === 'cam') {
    const th = s.w * t;
    return {
      r: s.R0 + s.e * Math.cos(th),
      rd: -s.e * s.w * Math.sin(th),
      rdd: -s.e * s.w * s.w * Math.cos(th),
      th,
      thd: s.w,
      thdd: 0,
    };
  }
  if (s.kind === 'radar') return straightPass({ d: s.d, u: s.u, x0: s.x0, t });
  const ad = s.ad || 0;
  return { r: s.r0 + s.u * t + 0.5 * ad * t * t, rd: s.u + ad * t, rdd: ad, th: s.w * t + 0.5 * s.al * t * t, thd: s.w + s.al * t, thdd: s.al };
}

export function polarAt(s, t) {
  const m = motionAt(s, t);
  const c = polarComponents(m);
  return { ...m, ...c, rthd2: m.r * m.thd * m.thd, cor: 2 * m.rd * m.thd, rthdd: m.r * m.thdd };
}

const tidy = (x) => (Math.abs(x) < 1e-9 ? 0 : x);

export default defineLab({
  id: 'polar',
  exam: 'u1',
  title: 'Polar',
  app: false,
  gapLimit: 1e-4,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'The radial acceleration is r̈ − rθ̇², not r̈. Press Play, or Space, to run the motion.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('arm', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => ({ key: 't', lo: 0, hi: runTime(state) }),
  controls() {
    return `
      ${slider('po-r0', 'start radius r₀ (m)', 0.4, 0.1, 1, 0.05)}
      ${slider('po-u', 'sliding rate ṙ (m/s)', 0.3, -0.5, 0.8, 0.05)}
      ${slider('po-ad', 'collar acceleration r̈ (m/s²)', 0, -1, 1, 0.05)}
      ${slider('po-w', 'turning rate θ̇ (rad/s)', 2, 0, 6, 0.1)}
      ${slider('po-al', 'angular acceleration θ̈ (rad/s²)', 0, -2, 2, 0.1)}
      ${slider('po-R0', 'base radius R₀ (m)', 0.3, 0.15, 0.5, 0.01)}
      ${slider('po-e', 'eccentricity e (m)', 0.08, 0, 0.14, 0.01)}
      ${slider('po-d', 'radar to road d (m)', 40, 10, 80, 1)}
      ${slider('po-v', 'car speed (m/s)', 25, 5, 40, 1)}
      ${slider('po-t', 'time t (s)', 0.5, 0, 1, 0.01)}
      <p class="tiny">White is the velocity, purple the acceleration, split into its parts along e_r and e_θ (dashed). Yellow is the origin the angles are measured from.</p>`;
  },
  bind(api) {
    bindSlider('po-r0', (s, v) => { s.r0 = v; }, api);
    bindSlider('po-u', (s, v) => { s.u = v; }, api);
    bindSlider('po-ad', (s, v) => { s.ad = v; }, api);
    bindSlider('po-w', (s, v) => { s.w = v; }, api);
    bindSlider('po-al', (s, v) => { s.al = v; }, api);
    bindSlider('po-R0', (s, v) => { s.R0 = v; }, api);
    bindSlider('po-e', (s, v) => { s.e = v; }, api);
    bindSlider('po-d', (s, v) => { s.d = v; }, api);
    bindSlider('po-v', (s, v) => { s.u = v; }, api);
    bindSlider('po-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const k = state.kind;
    const shown = { 'po-r0': k === 'arm', 'po-u': k === 'arm', 'po-w': k !== 'radar', 'po-al': k === 'arm', 'po-ad': k === 'arm', 'po-R0': k === 'cam', 'po-e': k === 'cam', 'po-d': k === 'radar', 'po-v': k === 'radar' };
    for (const [id, on] of Object.entries(shown)) showField(id, on);
    const set = (id, val, max) => {
      const el = document.getElementById(id);
      if (!el || val == null) return;
      if (max != null) el.max = String(Number(max.toFixed(2)));
      if (document.activeElement !== el) el.value = String(val);
    };
    set('po-r0', state.r0);
    set('po-u', k === 'arm' ? state.u : null);
    set('po-w', state.w);
    set('po-al', state.al);
    set('po-ad', state.ad);
    set('po-R0', state.R0);
    set('po-e', state.e);
    set('po-d', state.d);
    set('po-v', k === 'radar' ? state.u : null);
    set('po-t', Number(Math.min(state.t, runTime(state)).toFixed(2)), runTime(state));
  },
  tick(dt, state) {
    return advance(state, dt, { hi: runTime(state), rate: state.kind === 'radar' ? 2 : 0.5 });
  },
  compute(state) {
    const T = runTime(state);
    const t = Math.min(Math.max(state.t ?? 0, 0), T);
    const now = polarAt(state, t);
    const num = polarNumeric((s) => motionAt(state, s).r, (s) => motionAt(state, s).th, t, state.kind === 'radar' ? 1e-3 : 1e-4);
    const scaleV = Math.max(1e-3, now.v);
    const scaleA = Math.max(1e-3, now.a, Math.abs(now.rdd), now.rthd2);
    const gap = Math.max(
      Math.abs(num.vr - now.vr) / scaleV,
      Math.abs(num.vth - now.vth) / scaleV,
      Math.abs(num.ar - now.ar) / scaleA,
      Math.abs(num.ath - now.ath) / scaleA,
    );
    const n = 160;
    const series = Array.from({ length: n + 1 }, (_, i) => {
      const ti = (T * i) / n;
      const p = polarAt(state, ti);
      return { t: ti, x: p.r * Math.cos(p.th), y: p.r * Math.sin(p.th), ar: p.ar, rdd: p.rdd };
    });
    return {
      T,
      t,
      r: now.r,
      th: now.th,
      rd: now.rd,
      rdd: tidy(now.rdd),
      thd: now.thd,
      thdd: tidy(now.thdd),
      vr: tidy(now.vr),
      vth: tidy(now.vth),
      ar: tidy(now.ar),
      ath: tidy(now.ath),
      v: now.v,
      a: tidy(now.a),
      rthd2: now.rthd2,
      cor: tidy(now.cor),
      x: now.r * Math.cos(now.th),
      y: now.r * Math.sin(now.th),
      numAr: Math.abs(num.ar) < 1e-6 * scaleA ? 0 : num.ar,
      numAth: Math.abs(num.ath) < 1e-6 * scaleA ? 0 : num.ath,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    // While the numbers are hidden the chart, which would give r̈ away, is left out.
    const veiled = hidden();
    const [left, right] = veiled ? [B.free, null] : split(B.free, 0.58);
    const xs = c.series.map((p) => p.x).concat(0);
    const ys = c.series.map((p) => p.y).concat(0);
    const pad = 0.12 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const S = sceneIn(B, left, { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad });

    // The path over the whole run, the origin, and the radial line to the particle.
    line(S, c.series.map((p) => [p.x, p.y]), { color: alpha(C.text, 0.35), width: 1.5 });
    const er = [Math.cos(c.th), Math.sin(c.th)];
    const eth = [-Math.sin(c.th), Math.cos(c.th)];
    const at = [c.x, c.y];
    if (state.kind === 'arm') {
      const L = Math.max(...c.series.map((p) => Math.hypot(p.x, p.y))) * 1.08;
      seg(S, [0, 0], [L * er[0], L * er[1]], { color: C.text, width: 4 });
      const hw = 0.035 * L;
      const corner = (a, b) => [c.x + a * er[0] + b * eth[0], c.y + a * er[1] + b * eth[1]];
      seg(S, corner(-hw, -hw), corner(hw, -hw), { color: C.text, width: 2 });
      seg(S, corner(hw, -hw), corner(hw, hw), { color: C.text, width: 2 });
      seg(S, corner(hw, hw), corner(-hw, hw), { color: C.text, width: 2 });
      seg(S, corner(-hw, hw), corner(-hw, -hw), { color: C.text, width: 2 });
    } else {
      seg(S, [0, 0], at, { color: alpha(C.text, 0.5), width: 1.2, dash: [5, 4] });
    }
    if (state.kind === 'radar') label(S, 'road', [Math.min(...xs.slice(0, -1)), state.d], { dy: -12, align: 'left', color: C.dim });
    dot(S, 0, 0, { color: C.yellow, r: 5 });
    label(S, 'O', [0, 0], { dx: -10, dy: 10, color: C.yellow });

    // Unit vectors, then v and a and the two parts of a.
    const kU = Math.min(18, 0.1 * (S.box.y1 - S.box.y0)) / S.k;
    // On a phone the unit vectors would crowd v and a, so they show only where there is room.
    if (S.box.y1 - S.box.y0 > 200) {
      vec(S, at, [er[0] * kU, er[1] * kU], S.k, { color: C.dim, width: 1.5, label: 'e_r' });
      vec(S, at, [eth[0] * kU, eth[1] * kU], S.k, { color: C.dim, width: 1.5, label: 'e_θ' });
    }
    const vMax = Math.max(...c.series.map((_, i) => polarAt(state, c.series[i].t).v), 1e-6);
    const aMax = Math.max(...c.series.map((p) => Math.max(Math.abs(p.ar), Math.abs(p.rdd))), Math.abs(c.ath), c.a, 1e-6);
    const reach = Math.min(90, 0.24 * Math.min(S.box.x1 - S.box.x0, S.box.y1 - S.box.y0));
    const kv = reach / vMax;
    const ka = reach / aMax;
    vec(S, at, [c.vr * er[0] + c.vth * eth[0], c.vr * er[1] + c.vth * eth[1]], kv, { color: C.text, label: 'v' });
    vec(S, at, [c.ar * er[0], c.ar * er[1]], ka, { color: C.purple, dash: [5, 4], width: 2 });
    vec(S, at, [c.ath * eth[0], c.ath * eth[1]], ka, { color: C.purple, dash: [5, 4], width: 2 });
    vec(S, at, [c.ar * er[0] + c.ath * eth[0], c.ar * er[1] + c.ath * eth[1]], ka, { color: C.purple, label: 'a' });
    dot(S, c.x, c.y, { color: C.text, r: 4 });

    if (veiled) return;
    // r̈ against a_r over the run: they part wherever θ̇ is not zero.
    const vals = c.series.flatMap((p) => [p.ar, p.rdd]);
    const lo = Math.min(0, ...vals);
    const hi = Math.max(0, ...vals);
    const span = hi - lo || 1;
    const P = chartIn(B, right, { lo: 0, hi: c.T }, { lo: lo - 0.1 * span, hi: hi + 0.15 * span });
    axes(P, { xLabel: 't (s)', yLabel: 'm/s²' });
    line(P, c.series.map((p) => [p.t, p.rdd]), { color: C.gold, width: 2, dash: [6, 4] });
    line(P, c.series.map((p) => [p.t, p.ar]), { color: C.purple, width: 2.5 });
    note(P, 'r̈', c.series[8].t, c.series[8].rdd, { color: C.gold });
    note(P, 'a_r = r̈ − rθ̇²', c.series[Math.round(c.series.length * 0.55)].t, c.series[Math.round(c.series.length * 0.55)].ar, { color: C.purple, dy: 14 });
    dot(P, c.t, c.ar, { color: C.purple, r: 4 });
    dot(P, c.t, c.rdd, { color: C.gold, r: 4 });
  },
  law: () => [String.raw`a_r=\ddot r-r\dot\theta^{2}`, String.raw`a_\theta=r\ddot\theta+2\dot r\dot\theta`],
  liveRows(state, c) {
    return [
      kv('$r$, $\\dot r$, $\\ddot r$', `${fig(c.r)} m, ${fig(c.rd)} m/s, ${fig(c.rdd)} m/s²`),
      kv('$\\dot\\theta$, $\\ddot\\theta$', `${fig(c.thd)} rad/s, ${fig(c.thdd)} rad/s²`),
      kv('$v_r = \\dot r$, $v_\\theta = r\\dot\\theta$', `${fig(c.vr)}, ${fig(c.vth)} m/s`),
      kv('$a_r = \\ddot r - r\\dot\\theta^2$', `${fig(c.ar)} m/s²`),
      kv('$a_\\theta = r\\ddot\\theta + 2\\dot r\\dot\\theta$', `${fig(c.ath)} m/s²`),
      kv('$a_r$, $a_\\theta$ from $x(t)$, $y(t)$ numerically', `${fig(tidy(c.numAr))}, ${fig(tidy(c.numAth))} m/s²`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['v_r', `${fig(c.vr)} m/s`],
      ['v_θ', `${fig(c.vth)} m/s`],
      ['a_r', `${fig(c.ar)} m/s²`],
      ['a_θ', `${fig(c.ath)} m/s²`],
    ]);
  },
  coach(state, c) {
    if (state.kind === 'radar') {
      return {
        title: 'No acceleration, yet r̈ is not zero',
        body: [
          String.raw`The car drives straight at a steady $${fig(c.v)}$ m/s, so its acceleration is zero. Its distance from the radar still speeds up and slows down: $\ddot r = ${fig(c.rdd)}$ m/s².`,
          String.raw`In $a_r = \ddot r - r\dot\theta^2$ the two terms cancel: $r\dot\theta^2 = ${fig(c.rthd2)}$ m/s². A radar that reads $\ddot r$ and calls it acceleration is wrong by exactly the turning term.`,
        ],
      };
    }
    if (state.kind === 'cam') {
      return {
        title: 'a_r is not r̈',
        body: [
          String.raw`The follower's $\ddot r = ${fig(c.rdd)}$ m/s², but its radial acceleration is $a_r = ${fig(c.ar)}$ m/s². The difference, $r\dot\theta^2 = ${fig(c.rthd2)}$ m/s², is the inward pull any point turning at $\dot\theta$ needs.`,
          String.raw`The sideways part is all Coriolis-like here: $\ddot\theta = 0$, so $a_\theta = 2\dot r\dot\theta = ${fig(c.ath)}$ m/s².`,
        ],
      };
    }
    return {
      title: c.cor >= 0 ? 'Sliding out, it still accelerates sideways' : 'Sliding in, the sideways part reverses',
      body: [
        c.rdd === 0
          ? String.raw`The collar slides at a steady $\dot r = ${fig(c.rd)}$ m/s, so $\ddot r = 0$. The arm turns at $${fig(c.thd)}$ rad/s.`
          : String.raw`The collar slides at $\dot r = ${fig(c.rd)}$ m/s and speeds up along the arm at $\ddot r = ${fig(c.rdd)}$ m/s². The arm turns at $${fig(c.thd)}$ rad/s.`,
        String.raw`Its radial acceleration is $a_r = \ddot r - r\dot\theta^2 = ${fig(c.ar)}$ m/s², and $2\dot r\dot\theta = ${fig(c.cor)}$ m/s² of its sideways $a_\theta = ${fig(c.ath)}$ m/s² comes from sliding along a turning arm. The arm must push the collar sideways to give it that.`,
      ],
    };
  },
  predictions: [
    {
      id: 'po-double-w',
      scenario: 'arm',
      ask: 'Turn the arm twice as fast, $\\dot\\theta$ from 2 to 4 rad/s, at the same radius and sliding rate.',
      apply(s) { s.w *= 2; },
      watch: [
        { id: 'ar', label: 'the radial acceleration $a_r$', get: (c) => c.ar },
        { id: 'ath', label: 'the sideways acceleration $a_\\theta$', get: (c) => c.ath },
      ],
      mode: 'factor',
      expect: { ar: 4, ath: 2 },
      why: 'With $\\ddot r = 0$ and $\\ddot\\theta = 0$, $a_r = -r\\dot\\theta^2$ goes with the square of the rate, and $a_\\theta = 2\\dot r\\dot\\theta$ with the rate itself. At $r$ = 0.55 m, $a_r$ goes from −2.2 to −8.8 m/s², and $a_\\theta$ from 1.2 to 2.4 m/s².',
    },
    {
      id: 'po-closest',
      scenario: 'radar',
      ask: 'Move the clock from the start to $t$ = 4 s, when the car is closest to the radar.',
      apply(s) { s.t = 4; },
      watch: [
        { id: 'a', label: 'the car’s acceleration', get: (c) => Math.round(c.a * 1e9) / 1e9 },
        { id: 'rdd', label: '$\\ddot r$, how fast the range rate changes', get: (c) => c.rdd },
      ],
      mode: 'dir',
      expect: { a: 'same', rdd: 'bigger' },
      why: 'The car drives straight at a steady speed, so its acceleration is zero everywhere. $\\ddot r = u^2 d^2/r^3$ peaks where $r$ is least: 625/40 = 15.6 m/s² at the closest point, against 0.80 m/s² at the start. The $r\\dot\\theta^2$ term cancels it exactly.',
    },
    {
      id: 'po-reverse',
      scenario: 'arm',
      ask: 'Make the collar slide inward at 0.3 m/s instead of outward. The arm keeps turning the same way.',
      apply(s) { s.u = -s.u; },
      watch: [{ id: 'ath', label: 'the sideways acceleration still points the way the arm turns', get: (c) => c.ath > 0, mode: 'bool' }],
      mode: 'bool',
      expect: { ath: false },
      why: '$a_\\theta = 2\\dot r\\dot\\theta$ takes the sign of $\\dot r$. Sliding in, the collar carries more sideways speed than the arm has at its new radius, so the arm must hold it back: $a_\\theta$ = −1.2 m/s², against the turn.',
    },
  ],
});

import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, sceneIn } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';

const RPM = (2 * Math.PI) / 60;

/**
 * Application: spinning up a turbopump rotor (Hibbeler §17.4). An impeller disk on a thin shaft
 * turns about a fixed axis. A starter turbine gives a steady torque M; the bearings take a steady
 * friction torque M_f, and the pump's own load grows as ω² (it is M_r at the rated speed). Then
 * I α = M − M_f − kω², with k = M_r/ω_r².
 */
const BASE = { md: 0.2, R: 0.03, ms: 0.08, rs: 0.005, M: 0.5, Mf: 0.02, Mr: 0.3, rpm: 40000 };
const SCENARIOS = [
  { id: 'pump', name: 'Small turbopump, 40,000 rpm', ...BASE },
  { id: 'heavy', name: 'Twice the impeller mass', ...BASE, md: 0.4 },
  { id: 'weak', name: 'A weak starter', ...BASE, M: 0.35 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, ...rest } = sc;
  Object.assign(state, { scenarioId: sc.id, ...rest });
  delete state.id;
}

/** I of the impeller disk and the shaft, both solid cylinders about their axis. */
export function rotorInertia(md, R, ms, rs) {
  return 0.5 * md * R * R + 0.5 * ms * rs * rs;
}

/**
 * The spin-up in closed form. With A = M − M_f, separate dω/(A − kω²) = dt/I:
 * ω(t) = ω∞ tanh(t/τ), with ω∞ = √(A/k) and τ = I/√(Ak). The rated speed is reached only when
 * ω∞ > ω_r, which is A > M_r: the starter must beat the friction and the pump at rated speed.
 * With no pump load (M_r = 0) the speed rises linearly, t = Iω_r/A.
 */
export function spinup({ I, M, Mf, Mr, rpm }) {
  const wr = rpm * RPM;
  const A = M - Mf;
  const k = Mr / (wr * wr);
  const alpha0 = A / I;
  if (A <= 0) return { wr, A, k, alpha0, wInf: 0, tau: Infinity, reaches: false, tRated: Infinity, wAt: () => 0 };
  if (k === 0) return { wr, A, k, alpha0, wInf: Infinity, tau: Infinity, reaches: true, tRated: (I * wr) / A, wAt: (t) => (A * t) / I };
  const wInf = Math.sqrt(A / k);
  const tau = I / Math.sqrt(A * k);
  const reaches = wInf > wr;
  const tRated = reaches ? tau * Math.atanh(wr / wInf) : Infinity;
  return { wr, A, k, alpha0, wInf, tau, reaches, tRated, wAt: (t) => wInf * Math.tanh(t / tau) };
}

/**
 * Second method: step I dω/dt = A − kω² forward by RK4, nothing in closed form, and find where ω
 * crosses the rated speed (a cubic through the last step's ends and slopes).
 */
export function spinupByStepping({ I, M, Mf, Mr, rpm }) {
  const wr = rpm * RPM;
  const A = M - Mf;
  const k = Mr / (wr * wr);
  const f = (w) => (A - k * w * w) / I;
  const dt = (I * wr) / A / 4000;
  let w = 0;
  let t = 0;
  for (let i = 0; i < 2e6; i++) {
    const k1 = f(w);
    const k2 = f(w + 0.5 * dt * k1);
    const k3 = f(w + 0.5 * dt * k2);
    const k4 = f(w + dt * k3);
    const w1 = w + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (w1 >= wr) {
      // Hermite: solve for the fraction s of the step where the cubic reaches ω_r, by bisection.
      const m0 = dt * f(w);
      const m1 = dt * f(w1);
      const H = (s) => (2 * s ** 3 - 3 * s ** 2 + 1) * w + (s ** 3 - 2 * s ** 2 + s) * m0 + (-2 * s ** 3 + 3 * s ** 2) * w1 + (s ** 3 - s ** 2) * m1;
      let lo = 0;
      let hi = 1;
      for (let j = 0; j < 60; j++) {
        const mid = 0.5 * (lo + hi);
        if (H(mid) < wr) lo = mid;
        else hi = mid;
      }
      return t + 0.5 * (lo + hi) * dt;
    }
    w = w1;
    t += dt;
  }
  return Infinity;
}

export default defineLab({
  id: 'spinup',
  exam: 'u6',
  title: 'Turbopump spin-up',
  hint: 'Change the impeller, the starter or the pump load. Inertia sets how fast; the load sets how far.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pump', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'md', lo: 0.05, hi: 1 }),
  controls() {
    return `
      ${slider('sp-md', 'impeller mass (kg)', 0.2, 0.05, 1, 0.01)}
      ${slider('sp-R', 'impeller radius (mm)', 30, 15, 60, 1)}
      ${slider('sp-M', 'starter torque M (N·m)', 0.5, 0.1, 1.5, 0.01)}
      ${slider('sp-Mr', 'pump torque at rated speed M_r (N·m)', 0.3, 0, 1, 0.01)}
      <p class="tiny">Shaft 0.08 kg, 5 mm radius. Bearing friction 0.02 N·m. The pump torque grows as ω².</p>`;
  },
  bind(api) {
    bindSlider('sp-md', (s, v) => { s.md = v; }, api);
    bindSlider('sp-R', (s, v) => { s.R = v / 1000; }, api);
    bindSlider('sp-M', (s, v) => { s.M = v; }, api);
    bindSlider('sp-Mr', (s, v) => { s.Mr = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('sp-md', state.md);
    set('sp-R', Math.round(state.R * 1000));
    set('sp-M', state.M);
    set('sp-Mr', state.Mr);
  },
  compute(state) {
    const I = rotorInertia(state.md, state.R, state.ms, state.rs);
    const sp = spinup({ I, ...state });
    const tNum = sp.reaches ? spinupByStepping({ I, ...state }) : 0;
    const { wAt, ...rest } = sp;
    return {
      I,
      ...rest,
      // Unreachable: report zero time and say so, rather than an infinite number.
      tRated: sp.reaches ? sp.tRated : 0,
      tNum,
      wInf: Number.isFinite(sp.wInf) ? sp.wInf : 0,
      wInfRpm: Number.isFinite(sp.wInf) ? sp.wInf / RPM : 0,
      tau: Number.isFinite(sp.tau) ? sp.tau : 0,
      KE: 0.5 * I * sp.wr * sp.wr,
      tLinear: (I * sp.wr) / Math.max(sp.A, 1e-12),
      gap: sp.reaches ? Math.abs(tNum - sp.tRated) / sp.tRated : 0,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const side = W > 1.3 * H;
    const narrow = W < 560;
    const left = side ? { ...B.free, x1: B.free.x0 + Math.max(narrow ? 120 : 150, (narrow ? 0.3 : 0.32) * W) } : { ...B.free, y1: B.free.y0 + 0.36 * H };
    const right = side ? { ...B.free, x0: left.x1 } : { ...B.free, y0: left.y1 };

    // The rotor, face on, to scale: impeller disk, shaft, and the starter torque.
    const S = sceneIn(B, left, { x0: -0.07, x1: 0.07, y0: -0.07, y1: 0.07 }, 22);
    const { ctx } = S;
    const r = state.R * S.k;
    ctx.save();
    ctx.fillStyle = alpha(C.teal, 0.18);
    ctx.strokeStyle = C.teal;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(S.X(0), S.Y(0), r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.text;
    ctx.beginPath();
    ctx.arc(S.X(0), S.Y(0), Math.max(2, state.rs * S.k), 0, 2 * Math.PI);
    ctx.fill();
    // Torque: a curved arrow round the disk.
    const ra = r + 10;
    ctx.strokeStyle = C.pink;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(S.X(0), S.Y(0), ra, -0.25 * Math.PI, -1.25 * Math.PI, true);
    ctx.stroke();
    ctx.restore();
    const end = -1.25 * Math.PI;
    arrow(S, [(ra / S.k) * Math.cos(-end), (ra / S.k) * Math.sin(-end)], -end + Math.PI / 2, 4, { color: C.pink, width: 2.5, head: 8 });
    label(S, `M = ${fig(state.M)} N·m`, [0, -0.06], { color: C.pink });
    label(S, `I = ${fig(c.I)} kg·m²`, [0, 0.062], { color: C.teal });

    // ω against t, in rpm. The dashed tangent is the spin-up with no load: slope α₀.
    const tEnd = c.reaches ? Math.max(1.6 * c.tRated, 2.5 * c.tau) : 3 * c.tLinear;
    const top = Math.max(state.rpm, c.wInfRpm) * 1.15;
    const P = plotIn(B, right, { lo: 0, hi: tEnd }, { lo: 0, hi: top / 1000 });
    axes(P, { xLabel: 't (s)', yLabel: 'ω (1000 rpm)' });
    const sp = spinup({ I: c.I, ...state });
    const pts = [];
    for (let i = 0; i <= 200; i++) {
      const t = (tEnd * i) / 200;
      pts.push([t, sp.wAt(t) / RPM / 1000]);
    }
    line(P, [[0, 0], [Math.min(tEnd, (top * RPM) / c.alpha0), Math.min(top, (c.alpha0 * tEnd) / RPM) / 1000]], { color: alpha(C.gold, 0.7), width: 1.5, dash: [5, 4] });
    if (!narrow) note(P, 'no load: slope α₀', tEnd * 0.05, Math.min(top, (c.alpha0 * tEnd * 0.3) / RPM) / 1000, { color: C.gold });
    line(P, [[0, state.rpm / 1000], [tEnd, state.rpm / 1000]], { color: alpha(C.text, 0.45), width: 1, dash: [3, 4] });
    note(P, narrow ? 'rated' : `rated ${fig(state.rpm)} rpm`, tEnd * 0.98, state.rpm / 1000, { color: C.muted, align: 'right', dy: c.wInfRpm > state.rpm ? 14 : -6 });
    if (c.wInf > 0) {
      line(P, [[0, c.wInfRpm / 1000], [tEnd, c.wInfRpm / 1000]], { color: alpha(C.teal, 0.6), width: 1, dash: [6, 4] });
      note(P, narrow ? 'ω∞' : `ω∞ ${fig(c.wInfRpm)} rpm`, tEnd * 0.98, c.wInfRpm / 1000, { color: C.teal, align: 'right', dy: c.wInfRpm > state.rpm ? -6 : 14 });
    }
    line(P, pts, { color: C.text, width: 2 });
    if (c.reaches) {
      dot(P, c.tRated, state.rpm / 1000, { color: C.yellow, r: 5 });
      note(P, `${fig(c.tRated)} s`, c.tRated, state.rpm / 1000, { color: C.yellow, dy: 16 });
    } else {
      note(P, 'never reaches rated speed', tEnd * 0.5, (c.wInfRpm / 1000) * 0.5, { color: C.red, align: 'center', dx: 0 });
    }
  },
  law: () => [String.raw`I\alpha = M - M_f - k\omega^2`, String.raw`\omega(t)=\omega_\infty\tanh(t/\tau),\ \ \omega_\infty=\sqrt{(M-M_f)/k}`],
  liveRows(state, c) {
    return [
      kv('$I = \\tfrac12 m_d R^2 + \\tfrac12 m_s r_s^2$', `${fig(c.I)} kg·m²`),
      kv('$\\alpha_0 = (M - M_f)/I$', `${fig(c.alpha0)} rad/s²`),
      kv('free-run $\\omega_\\infty$', `${fig(c.wInfRpm)} rpm`),
      kv('time to rated, closed form', c.reaches ? `${fig(c.tRated)} s` : 'never'),
      kv('time to rated, RK4 steps', c.reaches ? `${fig(c.tNum)} s` : 'never'),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['I', `${fig(c.I)} kg·m²`],
      ['α₀', `${fig(c.alpha0)} rad/s²`],
      ['ω∞', `${fig(c.wInfRpm)} rpm`],
      ['t rated', c.reaches ? `${fig(c.tRated)} s` : 'never'],
    ]);
  },
  coach(state, c) {
    if (!c.reaches) {
      return {
        title: 'The starter cannot reach rated speed',
        body: String.raw`At rated speed the pump and the bearings take $${fig(state.Mr + state.Mf)}$ N·m, but the starter gives only $${fig(state.M)}$ N·m. The rotor levels off at $${fig(c.wInfRpm)}$ rpm.`,
      };
    }
    return {
      title: 'Inertia sets how fast, the load sets how far',
      body: String.raw`From rest, $\alpha_0 = ${fig(c.alpha0)}$ rad/s². At that rate the rotor would reach rated speed in $${fig(c.tLinear)}$ s. The pump load slows the climb, and it takes $${fig(c.tRated)}$ s.`,
    };
  },
  predictions: [
    {
      id: 'sp-inertia',
      scenario: 'pump',
      ask: 'Double the impeller mass, from 0.2 kg to 0.4 kg. Same starter, same pump.',
      apply(s) { s.md = 0.4; },
      watch: [
        { id: 'alpha0', label: 'the angular acceleration at the start', get: (c) => c.alpha0 },
        { id: 'wInf', label: 'the free-run speed', get: (c) => c.wInf },
        { id: 'tRated', label: 'the time to rated speed', get: (c) => c.tRated },
      ],
      mode: 'dir',
      expect: { alpha0: 'smaller', wInf: 'same', tRated: 'bigger' },
      why: 'The moments do not depend on the mass, so $\\omega_\\infty$ stays at 50,600 rpm, where the torques balance. $I$ grows from $9.10$ to $18.1 \\times 10^{-6}$ kg·m², so $\\alpha_0$ falls from 5,270 to 2,650 rad/s², and the time to 40,000 rpm grows from 1.08 s to 2.14 s.',
    },
    {
      id: 'sp-load',
      scenario: 'pump',
      ask: 'Raise the pump torque at rated speed from 0.3 N·m to 0.45 N·m. Same rotor, same starter.',
      apply(s) { s.Mr = 0.45; },
      watch: [
        { id: 'alpha0', label: 'the angular acceleration at the start', get: (c) => c.alpha0 },
        { id: 'wInf', label: 'the free-run speed', get: (c) => c.wInf },
        { id: 'tRated', label: 'the time to rated speed', get: (c) => c.tRated },
      ],
      mode: 'dir',
      expect: { alpha0: 'same', wInf: 'smaller', tRated: 'bigger' },
      why: 'At rest the pump takes no torque, so $\\alpha_0$ stays 5,270 rad/s². The load grows as $\\omega^2$, so the torques now balance lower: $\\omega_\\infty$ falls from 50,600 to 41,300 rpm, just above rated. The last part of the climb is slow, and the time grows from 1.08 s to 1.69 s.',
    },
  ],
});

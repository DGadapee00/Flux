import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { J_SAT, T_RUN, pointing } from '@flux/subjects/mechanics/pointing.js';

/**
 * Pointing: one axis of a satellite held on target by a reaction wheel under P, PD or PID control,
 * against a steady disturbance torque.
 *
 * Shows that a bigger gain is not always better. P alone rings and grows; a derivative term damps it;
 * an integral term removes the offset d/K_p that PD leaves. But the wheel answers with a lag τ, and
 * past K_p = K_d/τ the swing grows again. The closed-loop poles are the roots of 1 + C(s)G(s); the
 * response built from them is checked against RK4 on the loop's equations
 * (packages/subjects/src/mechanics/pointing.js).
 */
const SCENARIOS = [
  { id: 'p', name: 'P only: rings and grows', Kp: 10, Kd: 0, Ki: 0, tau: 0.5, dmN: 10 },
  { id: 'pd', name: 'PD: settles with an offset', Kp: 10, Kd: 20, Ki: 0, tau: 0.5, dmN: 10 },
  { id: 'pid', name: 'PID: the offset goes', Kp: 10, Kd: 20, Ki: 2, tau: 0.5, dmN: 10 },
  { id: 'greedy', name: 'PD with K_p past K_d/τ', Kp: 50, Kd: 20, Ki: 0, tau: 0.5, dmN: 10 },
];
const DEG = 180 / Math.PI;

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, Kp: sc.Kp, Kd: sc.Kd, Ki: sc.Ki, tau: sc.tau, dmN: sc.dmN });
}

export default defineLab({
  id: 'pointing',
  exam: 'u3',
  title: 'Pointing',
  hint: 'Start with P alone and watch it ring and grow. Add K_d and it settles, off target. Add K_i and the offset goes. Then push K_p past K_d/τ.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('pd', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Kp', lo: 0.5, hi: 60 }),
  controls() {
    return `
      ${slider('pt-kp', 'K_p, proportional (N·m/rad)', 10, 0.5, 60, 0.5)}
      ${slider('pt-kd', 'K_d, derivative (N·m·s/rad)', 20, 0, 60, 0.5)}
      ${slider('pt-ki', 'K_i, integral (N·m/(rad·s))', 0, 0, 5, 0.1)}
      ${slider('pt-tau', 'Wheel lag τ (s)', 0.5, 0.1, 3, 0.05)}
      ${slider('pt-d', 'Disturbance torque (mN·m)', 10, 1, 20, 0.5)}
      <p class="tiny">One axis, J = ${J_SAT} kg·m², starting on target with the disturbance switched on at t = 0. Poles: the roots of 1 + C(s)G(s) = 0, with G = 1/(Js²(τs + 1)).</p>`;
  },
  bind(api) {
    for (const [id, key] of [['pt-kp', 'Kp'], ['pt-kd', 'Kd'], ['pt-ki', 'Ki'], ['pt-tau', 'tau'], ['pt-d', 'dmN']]) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['pt-kp', 'Kp'], ['pt-kd', 'Kd'], ['pt-ki', 'Ki'], ['pt-tau', 'tau'], ['pt-d', 'dmN']]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const r = pointing({ Kp: state.Kp, Kd: state.Kd, Ki: state.Ki, tau: state.tau, d: state.dmN / 1000 });
    return { ...r, offsetDeg: r.offset == null ? null : r.offset * DEG, limit: state.Ki === 0 ? state.Kd / state.tau : null };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const wide = W > 1.5 * (B.free.y1 - B.free.y0) && W > 560;
    const both = wide || B.free.y1 - B.free.y0 > 420;
    const [top, bottom] = both ? split(B.free, wide ? 0.6 : 0.55) : [B.free, null];
    // The pointing error against time, in degrees.
    const pts = c.sim.map(([t, th]) => [t, th * DEG]);
    const span = 1.15 * Math.max(...pts.map(([, v]) => Math.abs(v)), 1e-9);
    const P = plotIn(B, top, { lo: 0, hi: T_RUN }, { lo: -span, hi: span });
    axes(P, { xLabel: 't (s)', yLabel: 'pointing error (°)', yFmt: (v) => (Math.abs(v) < 1e-3 * span ? '0' : fig(v)) });
    seg(P, [0, 0], [T_RUN, 0], { color: alpha(C.text, 0.3), width: 1 });
    if (c.offsetDeg && c.stable) {
      seg(P, [0, c.offsetDeg], [T_RUN, c.offsetDeg], { color: C.teal, width: 1, dash: [5, 4] });
      label(P, `offset d/K_p = ${fig(c.offsetDeg)}°`, [T_RUN, c.offsetDeg], { color: C.teal, align: 'right', dy: c.offsetDeg > 0 ? -10 : 12 });
    }
    line(P, pts, { color: c.stable ? C.gold : C.red, width: 2.5 });
    label(P, c.stable ? `settles in about ${fig(c.settle)} s` : 'unstable: the swing grows', c.stable ? [T_RUN, -span] : [T_RUN, span], { color: c.stable ? C.green : C.red, align: 'right', dy: -12 });
    if (!bottom) return;
    // The poles in the complex plane, with the unstable half shaded.
    const re = c.poles.map((p) => p[0]);
    const im = c.poles.map((p) => Math.abs(p[1]));
    const x0 = Math.min(-0.5, 1.2 * Math.min(...re));
    const x1 = Math.max(0.4, 1.4 * Math.max(...re));
    const y1 = Math.max(0.5, 1.3 * Math.max(...im));
    const Q = plotIn(B, bottom, { lo: x0, hi: x1 }, { lo: -y1, hi: y1 });
    const tick = (v) => (Math.abs(v) < 1e-9 ? '0' : fig(v));
    axes(Q, { xLabel: 'Re s (1/s)', yLabel: 'Im s (rad/s)', xFmt: tick, yFmt: tick });
    poly(Q, [[0, -y1], [x1, -y1], [x1, y1], [0, y1]], { fill: alpha(C.red, 0.1), stroke: null });
    seg(Q, [0, -y1], [0, y1], { color: alpha(C.red, 0.6), width: 1 });
    label(Q, 'unstable', [x1, y1], { color: C.red, align: 'right', dx: -4, dy: 12 });
    const kx = (x1 - x0) * 0.02;
    const ky = y1 * 0.06;
    for (const [a, b] of c.poles) {
      const col = Math.hypot(a, b) < 1e-9 ? C.teal : a < 0 ? C.gold : C.red;
      seg(Q, [a - kx, b - ky], [a + kx, b + ky], { color: col, width: 2.5 });
      seg(Q, [a - kx, b + ky], [a + kx, b - ky], { color: col, width: 2.5 });
    }
  },
  law: () => [
    String.raw`J\ddot\theta = T + d, \qquad \tau\dot T = u - T`,
    String.raw`u = -\left(K_p\theta + K_d\dot\theta + K_i\!\int\!\theta\,dt\right)`,
    String.raw`1 + C(s)G(s) = 0:`,
    String.raw`J\tau s^4 + Js^3 + K_ds^2 + K_ps + K_i = 0`,
  ],
  liveRows(state, c) {
    const live = c.poles.filter((p) => Math.hypot(...p) > 1e-9);
    return [
      kv('Closed-loop poles', live.map(([a, b]) => (Math.abs(b) < 1e-9 ? fig(a) : `${fig(a)} ${b >= 0 ? '+' : '−'} ${fig(Math.abs(b))}i`)).join(', ')),
      kv('Slowest pole’s real part', `${fig(c.slowest)} 1/s`),
      kv('Settling, 4/|Re p|', c.stable ? `${fig(c.settle)} s` : 'never'),
      kv('Steady offset', !c.stable ? 'never settles' : c.offset == null ? 'none' : c.offset === 0 ? '0 (integral action)' : `${fig(c.offsetDeg)}°`),
      kv('PD stability limit K_d/τ', c.limit == null ? 'see the poles' : `${fig(c.limit)} N·m/rad`),
      kv('Poles against RK4', c.gap.toExponential(1)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['state', c.stable ? 'stable' : 'unstable'],
      ['settles', c.stable ? `${fig(c.settle)} s` : 'never'],
      ['offset', c.offset == null || !c.stable ? '–' : `${fig(c.offsetDeg)}°`],
      ['slowest Re p', fig(c.slowest)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> One axis, a perfect sensor and a wheel with no torque or speed limit. Real wheels saturate, so a big disturbance held for long enough needs the thrusters to unload the wheel's momentum.`;
    if (state.Kd === 0 && state.Ki === 0) {
      return { title: 'P alone never settles', body: `With no derivative term nothing damps the swing: the s term of the characteristic equation is missing, and the wheel's lag pushes a pair of poles into the right half plane. Raising K_p only makes it ring faster. ${leavesOut}` };
    }
    if (!c.stable) {
      return { title: 'Too much gain for the wheel', body: `The wheel answers ${fig(state.tau)} s late, and with K_p = ${fig(state.Kp)} it pushes back before the derivative term can damp the swing. A pair of poles has crossed into the right half plane${c.limit ? `: for PD the limit is K_p < K_d/τ = ${fig(c.limit)}` : ''}. ${leavesOut}` };
    }
    if (state.Ki === 0) {
      return { title: 'Settled, but off target', body: `The derivative term damps the swing, and the loop settles in about ${fig(c.settle)} s. But to push back a steady ${fig(state.dmN)} mN·m the wheel needs a steady error, d/K_p = ${fig(c.offsetDeg)}°. Doubling K_p halves it, up to the limit K_d/τ = ${fig(c.limit)}. ${leavesOut}` };
    }
    return { title: 'The integral removes the offset', body: `The integral term keeps adding torque while any error remains, so the error ends at zero, in about ${fig(c.settle)} s. The price is a slow pole near the origin: K_i too large and the loop rings. ${leavesOut}` };
  },
  app: false,
});

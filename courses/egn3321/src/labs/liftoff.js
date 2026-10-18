import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';

const G = 9.81;

/**
 * Application: a rocket leaving the pad (Hibbeler §13.4). Constant thrust T, mass falling at a
 * steady rate as propellant burns, gravity, no drag. While T < mg the pad holds the rocket; it
 * lifts when enough propellant has burned. Upward a = T/m − g, so the acceleration climbs as the
 * mass drops.
 *
 * State: lift-off mass m0, thrust-to-weight tw at ignition, burn time tb, and the share of m0 that
 * is propellant, pf. Then T = tw m0 g and ṁ = pf m0 / tb.
 */
const SCENARIOS = [
  { id: 'student', name: 'Student rocket, T/W = 2', m0: 20, tw: 2, tb: 5, pf: 0.2 },
  { id: 'heavy', name: 'Heavy lifter, T/W = 1.2', m0: 1000, tw: 1.2, tb: 60, pf: 0.24 },
  { id: 'sits', name: 'Under-powered: T/W = 0.9 at ignition', m0: 50, tw: 0.9, tb: 20, pf: 0.4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, m0: sc.m0, tw: sc.tw, tb: sc.tb, pf: sc.pf, t: null });
}

/**
 * The burn in closed form. With exhaust speed ve = T/ṁ, after lift-off at mass ms and time ts:
 *   v = ve ln(ms/m) − g (t − ts),
 *   s = ve [(t − ts) − (m/ṁ) ln(ms/m)] − ½ g (t − ts)².
 */
export function burn(m0, tw, tb, pf) {
  const T = tw * m0 * G;
  const mdot = (pf * m0) / tb;
  const mBo = m0 - mdot * tb;
  const ve = T / mdot;
  const a0 = T / m0 - G;
  const aBo = T / mBo - G;
  const lifts = T / G > mBo;
  const ms = Math.min(m0, T / G);
  const ts = lifts ? (m0 - ms) / mdot : tb;
  const at = (t) => {
    if (!lifts || t < ts) return { s: 0, v: 0, acc: 0, m: m0 - mdot * t };
    const m = m0 - mdot * t;
    const u = t - ts;
    return {
      m,
      v: ve * Math.log(ms / m) - G * u,
      s: ve * (u - (m / mdot) * Math.log(ms / m)) - 0.5 * G * u * u,
      acc: T / m - G,
    };
  };
  const bo = at(tb);
  return { T, mdot, mBo, ve, a0, aBo, lifts, ts, vBo: bo.v, hBo: bo.s, at };
}

/** Second method: step a = T/m − g forward with RK4, holding on the pad while T < mg. */
function stepped(m0, tw, tb, pf) {
  const T = tw * m0 * G;
  const mdot = (pf * m0) / tb;
  const acc = (t, v) => {
    const a = T / (m0 - mdot * t) - G;
    return v <= 0 && a <= 0 ? 0 : a;
  };
  const n = 4000;
  const h = tb / n;
  let v = 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const t = i * h;
    const k1v = acc(t, v);
    const k2v = acc(t + h / 2, v + (h / 2) * k1v);
    const k3v = acc(t + h / 2, v + (h / 2) * k2v);
    const k4v = acc(t + h, v + h * k3v);
    const k1s = v;
    const k2s = v + (h / 2) * k1v;
    const k3s = v + (h / 2) * k2v;
    const k4s = v + h * k3v;
    v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    s += (h / 6) * (k1s + 2 * k2s + 2 * k3s + k4s);
    v = Math.max(v, 0);
  }
  return { vBo: v, hBo: s };
}

export default defineLab({
  id: 'liftoff',
  exam: 'u2',
  title: 'Liftoff',
  hint: 'Thrust is fixed; the mass falls. Below T/W = 1 the pad holds the rocket until enough propellant has burned.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('student', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'tw', lo: 0.6, hi: 5 }),
  controls() {
    return `
      ${slider('lo-tw', 'thrust-to-weight at ignition', 2, 0.6, 5, 0.05)}
      ${slider('lo-pf', 'propellant share of the mass', 0.2, 0.05, 0.6, 0.01)}
      ${slider('lo-t', 'time t (s)', 0, 0, 1, 0.01)}
      <p class="tiny">Constant thrust, propellant burned at a steady rate, no drag.</p>`;
  },
  bind(api) {
    bindSlider('lo-tw', (s, v) => { s.tw = v; }, api);
    bindSlider('lo-pf', (s, v) => { s.pf = v; }, api);
    bindSlider('lo-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const set = (id, val, max) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(Number(max.toFixed(2)));
      if (document.activeElement !== el) el.value = String(val);
    };
    set('lo-tw', state.tw);
    set('lo-pf', state.pf);
    set('lo-t', Number((state.t ?? state.tb).toFixed(2)), state.tb);
  },
  compute(state) {
    const { m0, tw, tb, pf } = state;
    const b = burn(m0, tw, tb, pf);
    const t = Math.min(Math.max(state.t ?? tb, 0), tb);
    const now = b.at(t);
    const num = stepped(m0, tw, tb, pf);
    const gap = b.lifts
      ? Math.max(Math.abs(num.vBo - b.vBo) / Math.max(1, b.vBo), Math.abs(num.hBo - b.hBo) / Math.max(1, b.hBo))
      : Math.max(num.vBo, num.hBo);
    return {
      m0, tw, tb, pf,
      T: b.T,
      mdot: b.mdot,
      mBo: b.mBo,
      ve: b.ve,
      a0: b.a0,
      aBo: b.aBo,
      lifts: b.lifts,
      tLift: b.lifts ? b.ts : tb,
      vBo: b.vBo,
      hBo: b.hBo,
      t,
      s: now.s,
      v: now.v,
      acc: now.acc,
      m: now.m,
      vNum: num.vBo,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const xm = B.free.x0 + Math.max(120, 0.28 * W);
    const left = { ...B.free, x1: xm };
    const right = { ...B.free, x0: xm };

    // The pad and the rocket at time t, height to scale; thrust and weight drawn to the same scale.
    const H = Math.max(c.hBo, 1) * 1.15;
    const S = plotIn(B, left, { lo: -1, hi: 1 }, { lo: -0.06 * H, hi: H }, { left: 8, right: 8, top: 26, bottom: 40 });
    const { ctx } = S;
    seg(S, [-0.9, 0], [0.9, 0], { color: C.dim, width: 2 });
    if (c.lifts) {
      seg(S, [-0.9, c.hBo], [0.9, c.hBo], { color: alpha(C.gold, 0.7), width: 1, dash: [4, 4] });
      label(S, 'burnout', [-0.95, c.hBo], { dy: 11, align: 'left', color: C.gold });
      label(S, `${fig(c.hBo)} m`, [-0.95, c.hBo], { dy: 25, align: 'left', color: C.gold });
    } else {
      label(S, 'never lifts', [0, 0.5 * H], { color: C.red });
    }
    const px = S.X(0.05);
    const py = S.Y(c.s);
    ctx.save();
    ctx.fillStyle = alpha(C.text, 0.9);
    ctx.beginPath();
    ctx.moveTo(px - 6, py);
    ctx.lineTo(px + 6, py);
    ctx.lineTo(px + 6, py - 22);
    ctx.lineTo(px, py - 32);
    ctx.lineTo(px - 6, py - 22);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // A free-body at the base: thrust up, weight down, to one scale.
    const weight = c.m * G;
    const scale = 40 / Math.max(c.T, weight);
    const lt = c.T * scale;
    const lw = weight * scale;
    arrow(S, [0.6, c.s], -Math.PI / 2, lt, { color: C.pink, width: 2.5, head: 7 });
    arrow(S, [0.6, c.s], Math.PI / 2, lw, { color: C.pink, width: 2.5, head: 7 });
    label(S, 'T', [0.6, c.s], { dx: 10, dy: -lt + 4, align: 'left', color: C.pink });
    label(S, 'mg', [0.6, c.s], { dx: 10, dy: lw - 4, align: 'left', color: C.pink });

    // a(t) over the burn: the area under it, after lift-off, is the burnout speed.
    const amax = Math.max(c.aBo, 1);
    const amin = Math.min(c.a0, 0) - 0.08 * amax;
    const P = plotIn(B, right, { lo: 0, hi: c.tb }, { lo: amin, hi: amax * 1.2 });
    axes(P, { xLabel: 't (s)', yLabel: 'a (m/s²)' });
    const raw = [];
    for (let i = 0; i <= 200; i++) {
      const t = (c.tb * i) / 200;
      raw.push([t, c.T / (c.m0 - c.mdot * t) - G]);
    }
    if (c.lifts) {
      const area = [[c.tLift, 0], ...raw.filter(([t]) => t >= c.tLift), [c.tb, 0]];
      poly(P, area, { fill: alpha(C.teal, 0.2), stroke: null });
    }
    line(P, [[0, 0], [c.tb, 0]], { color: alpha(C.text, 0.3), width: 1 });
    line(P, raw, { color: C.text, width: 2 });
    if (c.lifts && c.tLift > 0) {
      line(P, [[c.tLift, amin], [c.tLift, amax * 1.2]], { color: alpha(C.gold, 0.6), width: 1, dash: [4, 4] });
      note(P, 'lift-off', c.tLift, amax * 1.12, { color: C.gold });
    }
    if (c.lifts) note(P, `area = ${fig(c.vBo)} m/s`, c.tb * 0.5, amax * 0.25, { color: C.teal, align: 'center', dx: 0, dy: 0 });
    dot(P, c.t, c.T / c.m - G, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`a = \frac{T}{m} - g,\quad m = m_0 - \dot m\,t`, String.raw`v_{bo} = \frac{T}{\dot m}\ln\frac{m_s}{m_{bo}} - g\,(t_b - t_s)`],
  liveRows(state, c) {
    return [
      kv('$T = (T/W)\\,m_0 g$', `${fig(c.T)} N`),
      kv('$a_0 = T/m_0 - g$', `${fig(c.a0)} m/s²`),
      kv('$a_{bo} = T/m_{bo} - g$', `${fig(c.aBo)} m/s²`),
      kv('lift-off time', c.lifts ? `${fig(c.tLift)} s` : 'never'),
      kv('$v_{bo}$, by RK4 steps', `${fig(c.vNum)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['T/W', fig(c.tw)],
      ['a at ignition', `${fig(c.a0)} m/s²`],
      ['burnout v', `${fig(c.vBo)} m/s`],
      ['burnout h', `${fig(c.hBo)} m`],
    ]);
  },
  coach(state, c) {
    if (!c.lifts) {
      return {
        title: 'Thrust never beats weight',
        body: String.raw`Even at burnout the rocket weighs $${fig(c.mBo * G)}$ N, more than the $${fig(c.T)}$ N thrust. It burns its propellant on the pad.`,
      };
    }
    if (c.a0 < 0) {
      return {
        title: 'The pad holds it at first',
        body: String.raw`At ignition $T/W = ${fig(c.tw)}$, less than 1. The rocket lifts at $t = ${fig(c.tLift)}$ s, when its weight has fallen to the thrust.`,
      };
    }
    return {
      title: 'The acceleration grows as the mass falls',
      body: String.raw`Thrust is constant, but $m$ drops from $${fig(c.m0)}$ to $${fig(c.mBo)}$ kg. $a$ rises from $${fig(c.a0)}$ to $${fig(c.aBo)}$ m/s².`,
    };
  },
  predictions: [
    {
      id: 'lo-double',
      scenario: 'student',
      ask: 'Double the thrust, from T/W = 2 to T/W = 4, with the same mass and propellant.',
      apply(s) { s.tw = 4; },
      watch: [
        { id: 'a0', label: 'the acceleration at ignition', get: (c) => c.a0 },
        { id: 'mBo', label: 'the mass at burnout', get: (c) => c.mBo },
      ],
      mode: 'factor',
      factors: [4, 3, 2, 1, 0.5],
      expect: { a0: 3, mBo: 1 },
      why: 'The net acceleration is $T/m - g$, not $T/m$. At T/W = 2 it is $2g - g = 9.81$ m/s². At T/W = 4 it is $4g - g = 29.4$ m/s²: three times as much. The propellant burned does not change, so the burnout mass stays 16 kg.',
    },
    {
      id: 'lo-under',
      scenario: 'student',
      ask: 'Cut the thrust to 0.9 of the weight at ignition.',
      apply(s) { s.tw = 0.9; },
      watch: [
        { id: 'tLift', label: 'the time it leaves the pad', get: (c) => c.tLift },
        { id: 'vBo', label: 'the burnout speed', get: (c) => c.vBo },
      ],
      mode: 'dir',
      expect: { tLift: 'bigger', vBo: 'smaller' },
      why: 'The thrust is now 176.6 N, less than the 196.2 N weight. The rocket waits until its mass has fallen to 18 kg, at 2.5 s. It then has only 2.5 s of burn left and reaches 1.47 m/s, against 60.4 m/s at T/W = 2.',
    },
  ],
});

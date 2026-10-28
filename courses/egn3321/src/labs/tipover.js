import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider, leavesOut } from './widgets.js';

const G = 9.81;
const DEG = Math.PI / 180;

/**
 * A tall machine tipping about one footpad (Hibbeler §18.4, §18.5). A bump sets it turning about the
 * outer pad O at ω₀. Only the weight does work: the pad's
 * force acts at a point that does not move. It tips over when its kinetic energy can lift the mass
 * centre to the top of its arc, straight above O.
 *
 * h is the height of G above the pads, b the pad's horizontal distance from G, k_G the radius of
 * gyration about G. Then r = √(b² + h²), I_O = m(k_G² + r²), and the rise to the balance point is
 * Δh = r − h.
 */
const SCENARIOS = [
  { id: 'squat', name: 'Squat machine', m: 600, h: 1.5, b: 2, kG: 1.5, w0: 1 },
  { id: 'tall', name: 'Tall cabinet, narrow base', m: 1200, h: 4, b: 1.5, kG: 2.5, w0: 0.5 },
  { id: 'wide', name: 'Tall cabinet, wide base', m: 1200, h: 4, b: 3, kG: 2.5, w0: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, m: sc.m, h: sc.h, b: sc.b, kG: sc.kG, w0: sc.w0 });
}

/**
 * Closed form, by T₁ + V₁ = T₂ + V₂. The tilt θ is measured from upright; G sits
 * r cos(φ₀ − θ) above O, with φ₀ = atan(b/h) the tilt at which G is over the pad.
 */
export function tip({ m = 1, h, b, kG, w0 }) {
  const r = Math.hypot(b, h);
  const phi0 = Math.atan2(b, h);
  const IOm = kG * kG + r * r;
  const dh = r - h;
  const omegaC = Math.sqrt((2 * G * dh) / IOm);
  const tips = w0 > omegaC;
  const T0 = 0.5 * m * IOm * w0 * w0;
  const barrier = m * G * dh;
  let thetaMax = phi0;
  let wTop = 0;
  if (tips) wTop = Math.sqrt(w0 * w0 - omegaC * omegaC);
  else thetaMax = phi0 - Math.acos(Math.min(1, h / r + (IOm * w0 * w0) / (2 * G * r)));
  return { r, phi0, IO: m * IOm, IOm, dh, omegaC, tips, T0, barrier, thetaMax, wTop, margin: w0 / omegaC };
}

/**
 * Second method: step θ'' = −g r sin(φ₀ − θ) / (k_G² + r²), the moment of the weight about O over
 * I_O, by RK4 from θ = 0 at ω₀. Stop where ω reaches zero (it rocks back) or θ reaches φ₀ (it goes
 * over), interpolating inside the last step.
 */
export function tipNumeric({ h, b, kG, w0 }) {
  const r = Math.hypot(b, h);
  const phi0 = Math.atan2(b, h);
  const IOm = kG * kG + r * r;
  const acc = (th) => (-G * r * Math.sin(phi0 - th)) / IOm;
  const dt = 1e-3;
  let th = 0;
  let w = w0;
  for (let n = 0; n < 400000; n++) {
    const k1t = w;
    const k1w = acc(th);
    const k2t = w + 0.5 * dt * k1w;
    const k2w = acc(th + 0.5 * dt * k1t);
    const k3t = w + 0.5 * dt * k2w;
    const k3w = acc(th + 0.5 * dt * k2t);
    const k4t = w + dt * k3w;
    const k4w = acc(th + dt * k3t);
    const th1 = th + (dt / 6) * (k1t + 2 * k2t + 2 * k3t + k4t);
    const w1 = w + (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    if (th1 >= phi0) {
      const u = (phi0 - th) / (th1 - th);
      return { tips: true, thetaMax: phi0, wTop: w + u * (w1 - w) };
    }
    if (w1 <= 0) {
      // Quadratic through the turning point: θ(t) is near a parabola with θ'' = acc there.
      const a = acc(th);
      return { tips: false, thetaMax: th + (a < 0 ? (w * w) / (-2 * a) : 0), wTop: 0 };
    }
    th = th1;
    w = w1;
  }
  return { tips: false, thetaMax: th, wTop: 0 };
}

/** The smallest ω₀ that tips it, found by bisection on the time-stepped motion alone. */
export function omegaCNumeric(geom) {
  let lo = 0;
  let hi = 1;
  while (tipNumeric({ ...geom, w0: hi }).tips === false) hi *= 2;
  for (let i = 0; i < 48; i++) {
    const mid = 0.5 * (lo + hi);
    if (tipNumeric({ ...geom, w0: mid }).tips) hi = mid;
    else lo = mid;
  }
  return 0.5 * (lo + hi);
}

/** What the real device has that the model ignores (D30). */
const OUT = String.raw`The model starts with the machine already turning about the pad. What starts it is an impact, which needs angular momentum, not energy. It also assumes the pad does not slide, the ground is level, and the feet are rigid. A foot that crushes lowers $G$ as the machine tilts and helps. A slope tilts the machine before the bump arrives and shrinks the climb.`;

export default defineLab({
  id: 'tipover',
  exam: 'u7',
  title: 'Tip-over',
  app: false,
  hint: 'Rock the machine on one pad. It goes over only if its kinetic energy lifts G above the pad.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('squat', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'w0', lo: 0.1, hi: 2.5 }),
  controls() {
    return `
      ${slider('tp-w0', 'rock ω₀ about the pad (rad/s)', 1, 0.1, 2.5, 0.01)}
      ${slider('tp-b', 'pad offset b (m)', 2, 0.5, 4, 0.1)}
      ${slider('tp-h', 'height of G, h (m)', 1.5, 0.5, 5, 0.1)}
      ${slider('tp-kG', 'radius of gyration k_G (m)', 1.5, 0.3, 3, 0.1)}
      ${slider('tp-m', 'mass m (kg)', 600, 100, 3000, 50)}
      <p class="tiny">The machine turns about the outer pad O. The pad force does no work; only the weight does.</p>`;
  },
  bind(api) {
    bindSlider('tp-w0', (s, v) => { s.w0 = v; }, api);
    bindSlider('tp-b', (s, v) => { s.b = v; }, api);
    bindSlider('tp-h', (s, v) => { s.h = v; }, api);
    bindSlider('tp-kG', (s, v) => { s.kG = v; }, api);
    bindSlider('tp-m', (s, v) => { s.m = v; }, api);
  },
  syncControls(state) {
    for (const [id, key] of [['tp-w0', 'w0'], ['tp-b', 'b'], ['tp-h', 'h'], ['tp-kG', 'kG'], ['tp-m', 'm']]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(state[key]);
    }
  },
  compute(state) {
    const f = tip(state);
    const n = tipNumeric(state);
    const gap = f.tips === n.tips
      ? (f.tips ? Math.abs(f.wTop - n.wTop) / state.w0 : Math.abs(f.thetaMax - n.thetaMax) / f.phi0)
      : Math.abs(state.w0 - f.omegaC) / f.omegaC;
    return {
      ...f,
      w0: state.w0,
      m: state.m,
      phi0Deg: f.phi0 / DEG,
      thetaMaxDeg: f.thetaMax / DEG,
      thetaMaxNum: n.thetaMax / DEG,
      wTopNum: n.wTop,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.2 * H;
    const left = wide ? { ...B.free, x1: B.free.x0 + W * 0.5 } : { ...B.free, y1: B.free.y0 + H * 0.55 };
    const right = wide ? { ...B.free, x0: B.free.x0 + W * 0.5 } : { ...B.free, y0: B.free.y0 + H * 0.55 };

    // The machine, tilted to its largest angle about the pad O at (0, 0). G starts at (−b, h).
    const { b, h } = state;
    const th = c.tips ? c.phi0 : c.thetaMax;
    const S = sceneIn(B, left, { x0: -2.2 * b - 0.3, x1: Math.max(0.6, 0.9 * c.r), y0: -0.3, y1: Math.max(c.r, h * 1.6) + 0.3 }, 20);
    // Rotate about O by −θ (the machine leans outward, to +x).
    const rot = ([x, y]) => [x * Math.cos(th) + y * Math.sin(th), -x * Math.sin(th) + y * Math.cos(th)];
    seg(S, [-2.4 * b, 0], [Math.max(0.6, c.r), 0], { color: C.dim, width: 2 });
    const bw = Math.min(0.55 * b, 0.45 * h + 0.3);
    const body = [[-b - bw, 0.45 * h], [-b + bw, 0.45 * h], [-b + bw, 1.55 * h], [-b - bw, 1.55 * h]].map(rot);
    poly(S, body, { fill: alpha(C.text, 0.12), stroke: alpha(C.text, 0.8), width: 1.5 });
    for (const pad of [[0, 0], [-2 * b, 0]]) seg(S, rot([-b + Math.sign(pad[0] + b) * bw * 0.8, 0.5 * h]), rot(pad), { color: alpha(C.text, 0.8), width: 2 });
    const Gp = rot([-b, h]);
    seg(S, [0, 0], [0, c.r * 1.05], { color: alpha(C.gold, 0.6), width: 1, dash: [4, 4] });
    seg(S, [0, 0], Gp, { color: alpha(C.teal, 0.8), width: 1.5 });
    label(S, 'O', [0, 0], { dy: 12, color: C.muted });
    label(S, `r = ${fig(c.r)} m`, [Gp[0] / 2, Gp[1] / 2], { dx: -14, color: C.teal, align: 'right' });
    const ctx = S.ctx;
    ctx.save();
    ctx.strokeStyle = alpha(C.teal, 0.35);
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = -c.phi0 + (i / 40) * (c.phi0 + 0.35);
      const p = [-c.r * Math.sin(-a), c.r * Math.cos(-a)];
      const X = S.X(p[0]);
      const Y = S.Y(p[1]);
      if (i) ctx.lineTo(X, Y);
      else ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.restore();
    dot(S, Gp[0], Gp[1], { color: C.yellow, r: 5 });
    label(S, 'G', Gp, { dx: -10, dy: -8, color: C.yellow });
    if (c.tips) arrow(S, Gp, 0, 26, { color: C.red, width: 2.5, head: 7 });
    label(S, c.tips ? 'goes over' : `rocks to ${fig(c.thetaMaxDeg)}°, falls back`, [-b, -0.15], { color: c.tips ? C.red : C.teal, base: 'top' });

    // The energy barrier: the rise of G against the tilt, and the kinetic energy it starts with.
    const top = c.phi0 + 0.35;
    const V = (t) => G * (c.r * Math.cos(c.phi0 - t) - h);
    const ke = c.T0 / state.m;
    const pts = [];
    for (let i = 0; i <= 120; i++) {
      const t = (top * i) / 120;
      pts.push([t / DEG, V(t)]);
    }
    // Per kilogram, so the mass slider moves neither curve: both sides of T + V scale with m.
    const P2 = plotIn(B, right, { lo: 0, hi: top / DEG }, { lo: 0, hi: Math.max(G * c.dh, ke) * 1.2 });
    axes(P2, { xLabel: 'tilt θ (deg)', yLabel: 'energy per kg (J/kg)' });
    line(P2, pts, { color: C.teal, width: 2 });
    line(P2, [[0, ke], [top / DEG, ke]], { color: C.gold, width: 1.5, dash: [5, 4] });
    note(P2, `T₀/m = ${fig(ke)}`, 0, ke, { color: C.gold });
    note(P2, `barrier g·Δh = ${fig(G * c.dh)}`, c.phi0 / DEG, G * c.dh, { color: C.teal, align: 'center', dx: 0, dy: -8 });
    line(P2, [[c.phi0 / DEG, 0], [c.phi0 / DEG, G * c.dh]], { color: alpha(C.teal, 0.5), width: 1, dash: [3, 3] });
    if (!c.tips) dot(P2, c.thetaMaxDeg, V(c.thetaMax), { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`\omega_c=\sqrt{\dfrac{2g\,(r-h)}{k_G^2+r^2}},\quad r=\sqrt{b^2+h^2}`],
  liveRows(state, c) {
    return [
      kv('$r = \\sqrt{b^2+h^2}$', `${fig(c.r)} m`),
      kv('$\\Delta h = r - h$', `${fig(c.dh)} m`),
      kv('$I_O = m(k_G^2 + r^2)$', `${fig(c.IO)} kg·m²`),
      kv('$\\omega_c$', `${fig(c.omegaC)} rad/s`),
      c.tips
        ? kv('ω over the pad, closed form · stepped', `${fig(c.wTop)} · ${fig(c.wTopNum)} rad/s`)
        : kv('largest tilt, closed form · stepped', `${fig(c.thetaMaxDeg)}° · ${fig(c.thetaMaxNum)}°`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['ω_c', `${fig(c.omegaC)} rad/s`],
      ['ω₀/ω_c', fig(c.margin)],
      ['Δh', `${fig(c.dh)} m`],
      [c.tips ? 'result' : 'max tilt', c.tips ? 'tips' : `${fig(c.thetaMaxDeg)}°`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (c.tips) {
      return {
        title: 'It goes over',
        body: String.raw`It starts with $${fig(c.T0)}$ J. Lifting G by $${fig(c.dh)}$ m takes only $${fig(c.barrier)}$ J. Widen the stance or lower G to raise $\omega_c$ above $${fig(state.w0)}$ rad/s.`,
      };
    }
    return {
      title: 'It rocks back',
      body: String.raw`It needs $${fig(c.barrier)}$ J to reach the balance point and has $${fig(c.T0)}$ J. It stops at $${fig(c.thetaMaxDeg)}°$ of tilt, short of $${fig(c.phi0Deg)}°$.`,
    };
  }),
  predictions: [
    {
      id: 'tp-legs',
      scenario: 'tall',
      ask: 'The tall cabinet tips at 0.5 rad/s. Double the pad offset, from 1.5 m to 3 m.',
      apply(s) { s.b = 3; },
      watch: [
        { id: 'omegaC', label: 'the tip-over speed $\\omega_c$', get: (c) => c.omegaC },
        { id: 'tips', label: 'does it still tip?', get: (c) => c.tips, mode: 'bool' },
      ],
      mode: 'dir',
      expect: { omegaC: 'bigger', tips: false },
      why: 'With $b = 3$ m, $r = 5$ m and G must rise $\\Delta h = 1$ m instead of 0.272 m. $I_O$ grows too, from $24.5m$ to $31.25m$, but less. $\\omega_c$ rises from 0.467 to 0.792 rad/s, and 0.5 rad/s now rocks back.',
    },
    {
      id: 'tp-mass',
      scenario: 'squat',
      ask: 'Load the machine from 600 kg to 1,200 kg, with G and $k_G$ where they were.',
      apply(s) { s.m = 1200; },
      watch: [
        { id: 'omegaC', label: 'the tip-over speed $\\omega_c$', get: (c) => c.omegaC },
        { id: 'barrier', label: 'the energy needed to tip it', get: (c) => c.barrier },
      ],
      mode: 'dir',
      expect: { omegaC: 'same', barrier: 'bigger' },
      why: 'The barrier $mg\\,\\Delta h$ doubles, from 5,890 J to 11,800 J. So does the kinetic energy $\\tfrac12 I_O\\omega^2$ at any $\\omega$, because $I_O = m(k_G^2 + r^2)$. The mass cancels: $\\omega_c$ stays 1.52 rad/s.',
    },
    {
      id: 'tp-cg',
      scenario: 'squat',
      ask: 'Raise the machine’s mass centre from 1.5 m to 3 m above the pads.',
      apply(s) { s.h = 3; },
      watch: [
        { id: 'dh', label: 'the rise $\\Delta h$ of G', get: (c) => c.dh },
        { id: 'omegaC', label: 'the tip-over speed $\\omega_c$', get: (c) => c.omegaC },
      ],
      mode: 'dir',
      expect: { dh: 'smaller', omegaC: 'smaller' },
      why: 'Now $r = \\sqrt{4 + 9} = 3.61$ m, so G rises only $3.61 - 3 = 0.606$ m, not 1 m. $I_O$ grows from $8.5m$ to $15.25m$. Both cut $\\omega_c$, from 1.52 to 0.883 rad/s.',
    },
  ],
});

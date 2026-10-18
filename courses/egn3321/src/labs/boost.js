import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';

const G = 9.81;

/**
 * Application: a sounding rocket's boost and coast (Hibbeler §12.2, §12.3). The motor gives a
 * constant net upward acceleration `a` for `tb` seconds; then the rocket coasts under gravity alone
 * to apogee and falls back. No drag, so these are upper bounds on a real flight.
 */
const SCENARIOS = [
  { id: 'student', name: 'Student rocket, short hard burn', a: 49, tb: 2.5 },
  { id: 'long', name: 'Long gentle burn', a: 20, tb: 6 },
  { id: 'hop', name: 'Hop-test vehicle', a: 3, tb: 4 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, a: sc.a, tb: sc.tb, t: null });
}

/** The flight in closed form: burnout, apogee, and the time back on the ground. */
export function flight(a, tb) {
  const vBo = a * tb;
  const hBo = 0.5 * a * tb * tb;
  const coast = (vBo * vBo) / (2 * G);
  const apogee = hBo + coast;
  const tApogee = tb + vBo / G;
  const tGround = tApogee + Math.sqrt((2 * apogee) / G);
  return { vBo, hBo, coast, apogee, tApogee, tGround };
}

/** Altitude, speed and acceleration at time t, piece by piece. */
export function stateAt(a, tb, t) {
  if (t <= tb) return { s: 0.5 * a * t * t, v: a * t, acc: a };
  const f = flight(a, tb);
  const u = t - tb;
  const s = f.hBo + f.vBo * u - 0.5 * G * u * u;
  return s <= 0 && t > f.tApogee ? { s: 0, v: 0, acc: 0 } : { s, v: f.vBo - G * u, acc: -G };
}

/**
 * Second method, the lab's own lesson: integrate a(t) for v(t), then take the area under v(t) up to
 * the instant v changes sign. Both by the trapezoid rule on a fine grid, nothing in closed form.
 */
function areaUnderV(a, tb) {
  const acc = (t) => (t < tb ? a : -G);
  const n = 20000;
  const tEnd = 2 * (tb + (a * tb) / G);
  const dt = tEnd / n;
  let v = 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    // Split the step that holds burnout, so the jump in a(t) is integrated exactly.
    const pieces = t < tb && t + dt > tb ? [[t, tb], [tb, t + dt]] : [[t, t + dt]];
    for (const [t0, t1] of pieces) {
      const h = t1 - t0;
      const a0 = acc(t0 + 1e-12);
      const v1 = v + a0 * h;
      if (t0 >= tb && v1 < 0) return s + (v * v) / (2 * G);
      s += 0.5 * (v + v1) * h;
      v = v1;
    }
  }
  return s;
}

export default defineLab({
  id: 'boost',
  exam: 'u1',
  title: 'Boost and coast',
  hint: 'Change the burn. Burnout speed sets the coast; the area under v–t is the altitude.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('student', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'tb', lo: 0.5, hi: 10 }),
  controls() {
    return `
      ${slider('bo-a', 'net acceleration a (m/s²)', 49, 1, 80, 1)}
      ${slider('bo-tb', 'burn time t_b (s)', 2.5, 0.5, 10, 0.1)}
      ${slider('bo-t', 'time t (s)', 0, 0, 1, 0.01)}
      <p class="tiny">a is the net upward acceleration during the burn: thrust less weight, over mass. No drag.</p>`;
  },
  bind(api) {
    bindSlider('bo-a', (s, v) => { s.a = v; }, api);
    bindSlider('bo-tb', (s, v) => { s.tb = v; }, api);
    bindSlider('bo-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const f = flight(state.a, state.tb);
    const set = (id, val, max) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(Number(max.toFixed(2)));
      if (document.activeElement !== el) el.value = String(val);
    };
    set('bo-a', state.a);
    set('bo-tb', state.tb);
    set('bo-t', Number((state.t ?? f.tApogee).toFixed(2)), f.tGround);
  },
  compute(state) {
    const { a, tb } = state;
    const f = flight(a, tb);
    const t = Math.min(Math.max(state.t ?? f.tApogee, 0), f.tGround);
    const now = stateAt(a, tb, t);
    const apogeeNum = areaUnderV(a, tb);
    return {
      a,
      tb,
      ...f,
      t,
      s: now.s,
      v: now.v,
      acc: now.acc,
      coastShare: f.coast / f.apogee,
      apogeeNum,
      gap: Math.abs(apogeeNum - f.apogee) / f.apogee,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    // The column is tall and narrow, so it always sits beside the chart.
    const W = B.free.x1 - B.free.x0;
    const xm = B.free.x0 + Math.max(120, 0.28 * W);
    const left = { ...B.free, x1: xm };
    const right = { ...B.free, x0: xm };

    // The flight as a column: pad, burnout, apogee, and the rocket at time t. Height only, to scale.
    const H = c.apogee * 1.1;
    const S = plotIn(B, left, { lo: -1, hi: 1 }, { lo: -0.04 * H, hi: H }, { left: 8, right: 8, top: 26, bottom: 40 });
    const { ctx } = S;
    seg(S, [-0.8, 0], [0.8, 0], { color: C.dim, width: 2 });
    for (const [y, name, col] of [[c.hBo, 'burnout', C.gold], [c.apogee, 'apogee', C.teal]]) {
      seg(S, [-0.9, y], [0.4, y], { color: alpha(col, 0.7), width: 1, dash: [4, 4] });
      label(S, `${name} ${fig(y)} m`, [-0.9, y], { dy: -9, align: 'left', color: col });
    }
    const px = S.X(0.65);
    const py = S.Y(c.s);
    ctx.save();
    ctx.fillStyle = alpha(C.text, 0.9);
    ctx.beginPath();
    ctx.moveTo(px - 5, py);
    ctx.lineTo(px + 5, py);
    ctx.lineTo(px + 5, py - 18);
    ctx.lineTo(px, py - 26);
    ctx.lineTo(px - 5, py - 18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (c.t < c.tb) arrow(S, [0.65, c.s], -Math.PI / 2, 20, { color: C.red, width: 2.5, head: 7 });

    // v against t: the area under it is the altitude gained.
    const vmax = c.vBo;
    const vmin = Math.min(0, -Math.sqrt(2 * G * c.apogee));
    const P = plotIn(B, right, { lo: 0, hi: c.tGround }, { lo: vmin * 1.08, hi: vmax * 1.15 });
    axes(P, { xLabel: 't (s)', yLabel: 'v (m/s)' });
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t = (c.tGround * i) / 240;
      pts.push([t, stateAt(c.a, c.tb, t).v]);
    }
    pts[pts.length - 1] = [c.tGround, -Math.sqrt(2 * G * c.apogee)];
    // The area between v(t) and v = 0, up to apogee: the height climbed.
    const up = [[0, 0], ...pts.filter(([t]) => t <= c.tApogee), [c.tb, c.vBo], [c.tApogee, 0]].sort((p, q) => p[0] - q[0]);
    poly(P, up, { fill: alpha(C.teal, 0.2), stroke: null });
    line(P, [[0, 0], [c.tGround, 0]], { color: alpha(C.text, 0.3), width: 1 });
    line(P, pts, { color: C.text, width: 2 });
    line(P, [[c.tb, vmin * 1.08], [c.tb, vmax * 1.15]], { color: alpha(C.gold, 0.6), width: 1, dash: [4, 4] });
    note(P, 'burnout', c.tb, vmax * 1.1, { color: C.gold });
    note(P, `area = ${fig(c.apogee)} m`, c.tApogee * 0.55, vmax * 0.12, { color: C.teal, align: 'center', dx: 0, dy: 0 });
    dot(P, c.t, c.v, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`v_{bo}=a\,t_b,\quad h_{bo}=\tfrac12 a t_b^2`, String.raw`h_{\max}=h_{bo}+\frac{v_{bo}^2}{2g}`],
  liveRows(state, c) {
    return [
      kv('$v_{bo} = a\\,t_b$', `${fig(c.vBo)} m/s`),
      kv('$h_{bo} = \\tfrac12 a t_b^2$', `${fig(c.hBo)} m`),
      kv('coast $v_{bo}^2/2g$', `${fig(c.coast)} m`),
      kv('apogee, area under $v(t)$ by trapezoids', `${fig(c.apogeeNum)} m`),
      kv(`at $t = ${fig(c.t)}$ s`, `${fig(c.s)} m, ${fig(c.v)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['burnout v', `${fig(c.vBo)} m/s`],
      ['burnout h', `${fig(c.hBo)} m`],
      ['apogee', `${fig(c.apogee)} m`],
      ['t apogee', `${fig(c.tApogee)} s`],
    ]);
  },
  coach(state, c) {
    if (c.coastShare > 0.5) {
      return {
        title: 'Most of the height comes after burnout',
        body: String.raw`The motor is out at $${fig(c.hBo)}$ m, but the rocket is moving at $${fig(c.vBo)}$ m/s. It coasts another $${fig(c.coast)}$ m: ${Math.round(c.coastShare * 100)}% of the apogee.`,
      };
    }
    return {
      title: 'A gentle burn',
      body: String.raw`With $a = ${fig(c.a)}$ m/s², most of the climb happens under power. The coast adds only $${fig(c.coast)}$ m.`,
    };
  },
  predictions: [
    {
      id: 'bo-burn',
      scenario: 'student',
      ask: 'Double the burn time, from 2.5 s to 5 s, with the same acceleration.',
      apply(s) { s.tb = 5; },
      watch: [
        { id: 'vBo', label: 'the burnout speed', get: (c) => c.vBo },
        { id: 'apogee', label: 'the apogee', get: (c) => c.apogee },
      ],
      mode: 'factor',
      expect: { vBo: 2, apogee: 4 },
      why: 'Burnout speed is $a\\,t_b$: twice as long, twice as fast, 245 m/s. Both parts of the apogee grow as $t_b^2$: the burn height and the coast height. 918 m becomes 3,670 m.',
    },
    {
      id: 'bo-same-speed',
      scenario: 'student',
      ask: 'Reach the same burnout speed, 122.5 m/s, with a gentler burn: 20 m/s² for 6.125 s.',
      apply(s) {
        s.a = 20;
        s.tb = 6.125;
      },
      watch: [
        { id: 'coast', label: 'the height gained while coasting', get: (c) => c.coast },
        { id: 'apogee', label: 'the apogee', get: (c) => c.apogee },
      ],
      mode: 'dir',
      expect: { coast: 'same', apogee: 'bigger' },
      why: 'The coast depends only on the burnout speed: $v_{bo}^2/2g = 765$ m either way. The gentle burn reaches burnout higher, 375 m instead of 153 m, so the apogee rises from 918 m to 1,140 m.',
    },
  ],
});

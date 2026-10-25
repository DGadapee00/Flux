import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, dot, label, line, note, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Application: a train between two stations (Hibbeler §12.2, §12.3). It accelerates at a
 * constant `a1` for `t1` seconds, then brakes at a steady `a2` until it stops at the next
 * station. No cruise and no running resistance, so the distance is set by the two phases alone.
 */
const SCENARIOS = [
  { id: 'metro', name: 'Metro train, brisk start', a1: 1.1, t1: 20, a2: 0.8 },
  { id: 'gentle', name: 'Same top speed, gentler start', a1: 0.55, t1: 40, a2: 0.8 },
  { id: 'yard', name: 'A short yard hop', a1: 0.5, t1: 10, a2: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, a1: sc.a1, t1: sc.t1, a2: sc.a2, t: null });
}

/** The trip in closed form: top speed, the two distances, and the two times. */
export function trip(a1, t1, a2) {
  const vTop = a1 * t1;
  const s1 = 0.5 * a1 * t1 * t1;
  const sBrake = (vTop * vTop) / (2 * a2);
  const total = s1 + sBrake;
  const tBrake = vTop / a2;
  const tTotal = t1 + tBrake;
  return { vTop, s1, sBrake, total, tBrake, tTotal };
}

/** Position, speed and acceleration at time t, piece by piece. */
export function stateAt(a1, t1, a2, t) {
  if (t <= t1) return { s: 0.5 * a1 * t * t, v: a1 * t, acc: a1 };
  const f = trip(a1, t1, a2);
  const u = t - t1;
  if (u >= f.tBrake) return { s: f.total, v: 0, acc: 0 };
  return { s: f.s1 + f.vTop * u - 0.5 * a2 * u * u, v: f.vTop - a2 * u, acc: -a2 };
}

/**
 * Second method, the lab's own lesson: integrate a(t) for v(t), then take the area under v(t) up
 * to the instant v reaches zero. Both by the trapezoid rule on a fine grid, nothing in closed form.
 */
function distanceNumeric(a1, t1, a2) {
  const acc = (t) => (t < t1 ? a1 : -a2);
  const n = 20000;
  const tEnd = 2 * (t1 + (a1 * t1) / a2);
  const dt = tEnd / n;
  let v = 0;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const t = i * dt;
    // Split the step that holds the start of braking, so the jump in a(t) is integrated exactly.
    const pieces = t < t1 && t + dt > t1 ? [[t, t1], [t1, t + dt]] : [[t, t + dt]];
    for (const [p0, p1] of pieces) {
      const h = p1 - p0;
      const a0 = acc(p0 + 1e-12);
      const v1 = v + a0 * h;
      if (p0 >= t1 && v1 < 0) return s + (v * v) / (2 * a2);
      s += 0.5 * (v + v1) * h;
      v = v1;
    }
  }
  return s;
}

/** What the real train has that the model ignores (D30). */
const OUT = String.raw`Constant acceleration is the big simplification. Drivers and control systems limit jerk, the rate of change of acceleration, so each piece ramps in and out. Tractive effort falls as the speed rises, and rolling and air resistance grow. A grade stretches the run under power and shortens the braking run. The area rule still holds for any $v(t)$: the distance is the area under it, whatever its shape.`;

export default defineLab({
  id: 'train',
  exam: 'u1',
  title: 'Train',
  hint: 'Change the start. The top speed sets the braking distance; the area under v–t is the distance.',
  gapLimit: 1e-4,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('metro', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 't1', lo: 2, hi: 60 }),
  controls() {
    return `
      ${slider('tr-a1', 'acceleration a₁ (m/s²)', 1.1, 0.2, 2, 0.05)}
      ${slider('tr-t1', 'time under power t₁ (s)', 20, 2, 60, 0.5)}
      ${slider('tr-a2', 'braking rate a₂ (m/s²)', 0.8, 0.2, 1.6, 0.05)}
      ${slider('tr-t', 'time t (s)', 0, 0, 1, 0.01)}
      <p class="tiny">a₁ is the acceleration out of the station: tractive force over mass, on the flat. Then the train brakes at a steady a₂ to a full stop.</p>`;
  },
  bind(api) {
    bindSlider('tr-a1', (s, v) => { s.a1 = v; }, api);
    bindSlider('tr-t1', (s, v) => { s.t1 = v; }, api);
    bindSlider('tr-a2', (s, v) => { s.a2 = v; }, api);
    bindSlider('tr-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const f = trip(state.a1, state.t1, state.a2);
    const set = (id, val, max) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (max != null) el.max = String(Number(max.toFixed(2)));
      if (document.activeElement !== el) el.value = String(val);
    };
    set('tr-a1', state.a1);
    set('tr-t1', state.t1);
    set('tr-a2', state.a2);
    set('tr-t', Number((state.t ?? f.tTotal).toFixed(2)), f.tTotal);
  },
  compute(state) {
    const { a1, t1, a2 } = state;
    const f = trip(a1, t1, a2);
    const t = Math.min(Math.max(state.t ?? f.tTotal, 0), f.tTotal);
    const now = stateAt(a1, t1, a2, t);
    const totalNum = distanceNumeric(a1, t1, a2);
    return {
      a1,
      t1,
      a2,
      ...f,
      t,
      s: now.s,
      v: now.v,
      acc: now.acc,
      brakeShare: f.sBrake / f.total,
      totalNum,
      gap: Math.abs(totalNum - f.total) / f.total,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    // The trip runs sideways, so the track takes a band across the top and the chart sits below.
    const Hpx = B.free.y1 - B.free.y0;
    const ym = B.free.y0 + Math.max(96, 0.3 * Hpx);
    const top = { ...B.free, y1: ym };
    const bottom = { ...B.free, y0: ym };

    // The trip as a track: two stations, the point where braking starts, and the train at time t.
    const D = c.total;
    const S = plotIn(B, top, { lo: -0.04 * D, hi: 1.05 * D }, { lo: -1.5, hi: 2 }, { left: 10, right: 10, top: 12, bottom: 24 });
    const { ctx } = S;
    seg(S, [0, 0], [D, 0], { color: C.dim, width: 2 });
    for (const x of [0, D]) seg(S, [x, -0.3], [x, 0.3], { color: C.dim, width: 2 });
    seg(S, [c.s1, 0], [c.s1, 1], { color: alpha(C.gold, 0.6), width: 1, dash: [4, 4] });
    label(S, '0 m', [0, -0.5], { dy: 15, align: 'left', color: C.dim });
    label(S, `${fig(c.s1)} m`, [c.s1, -0.5], { dy: 15, align: 'center', color: C.gold });
    label(S, `${fig(D)} m`, [D, -0.5], { dy: 15, align: 'right', color: C.teal });
    const px = S.X(c.s);
    const py = S.Y(0);
    ctx.save();
    ctx.fillStyle = alpha(C.text, 0.9);
    ctx.beginPath();
    ctx.moveTo(px - 17, py - 3);
    ctx.lineTo(px + 17, py - 3);
    ctx.lineTo(px + 17, py - 15);
    ctx.lineTo(px + 9, py - 21);
    ctx.lineTo(px - 11, py - 21);
    ctx.lineTo(px - 17, py - 15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px - 10, py - 1.5, 2.4, 0, Math.PI * 2);
    ctx.arc(px + 10, py - 1.5, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (c.t < c.t1) arrow(S, [c.s, 1.35], 0, 22, { color: C.gold, width: 2.5, head: 7 });
    else if (c.t < c.tTotal) arrow(S, [c.s, 1.35], Math.PI, 22, { color: C.red, width: 2.5, head: 7 });

    // v against t: the area under it is the distance between the stations.
    const P = plotIn(B, bottom, { lo: 0, hi: c.tTotal }, { lo: 0, hi: c.vTop * 1.15 });
    axes(P, { xLabel: 't (s)', yLabel: 'v (m/s)' });
    const pts = [];
    for (let i = 0; i <= 240; i++) {
      const t = (c.tTotal * i) / 240;
      pts.push([t, stateAt(c.a1, c.t1, c.a2, t).v]);
    }
    poly(P, [[0, 0], ...pts, [c.tTotal, 0]], { fill: alpha(C.teal, 0.2), stroke: null });
    line(P, pts, { color: C.text, width: 2 });
    line(P, [[c.t1, 0], [c.t1, c.vTop * 1.15]], { color: alpha(C.gold, 0.6), width: 1, dash: [4, 4] });
    note(P, 'braking', c.t1, c.vTop * 1.1, { color: C.gold });
    note(P, `area = ${fig(c.total)} m`, c.tTotal * 0.5, c.vTop * 0.14, { color: C.teal, align: 'center', dx: 0, dy: 0 });
    dot(P, c.t, c.v, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`v_{top}=a_1\,t_1,\quad s_1=\tfrac12 a_1 t_1^2`, String.raw`s=s_1+\frac{v_{top}^2}{2a_2}`],
  liveRows(state, c) {
    return [
      kv('$v_{top} = a_1\\,t_1$', `${fig(c.vTop)} m/s`),
      kv('$s_1 = \\tfrac12 a_1 t_1^2$', `${fig(c.s1)} m`),
      kv('braking $v_{top}^2/2a_2$', `${fig(c.sBrake)} m`),
      kv('distance, area under $v(t)$ by trapezoids', `${fig(c.totalNum)} m`),
      kv(`at $t = ${fig(c.t)}$ s`, `${fig(c.s)} m, ${fig(c.v)} m/s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['top speed', `${fig(c.vTop)} m/s`],
      ['under power', `${fig(c.s1)} m`],
      ['braking', `${fig(c.sBrake)} m`],
      ['stations apart', `${fig(c.total)} m`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => {
    if (c.brakeShare > 0.5) {
      return {
        title: 'Most of the trip is spent braking',
        body: String.raw`The train reaches its top speed, $${fig(c.vTop)}$ m/s, after only $${fig(c.s1)}$ m. Braking takes another $${fig(c.sBrake)}$ m: ${Math.round(c.brakeShare * 100)}% of the distance between the stations.`,
      };
    }
    return {
      title: 'A gentle start',
      body: String.raw`With $a_1 = ${fig(c.a1)}$ m/s², most of the distance goes on getting up to speed. The braking adds only $${fig(c.sBrake)}$ m.`,
    };
  }),
  predictions: [
    {
      id: 'tr-double',
      scenario: 'metro',
      ask: 'Double the time under power, from 20 s to 40 s, with the same acceleration.',
      apply(s) { s.t1 = 40; },
      watch: [
        { id: 'vTop', label: 'the top speed', get: (c) => c.vTop },
        { id: 'total', label: 'the distance between the stations', get: (c) => c.total },
      ],
      mode: 'factor',
      expect: { vTop: 2, total: 4 },
      why: 'The top speed is $a_1\\,t_1$: twice as long, twice as fast, 44 m/s. Both parts of the distance grow as $t_1^2$: the run under power and the braking run. 522.5 m becomes 2,090 m.',
    },
    {
      id: 'tr-same-speed',
      scenario: 'metro',
      ask: 'Reach the same top speed, 22 m/s, with a gentler start: 0.55 m/s² for 40 s.',
      apply(s) {
        s.a1 = 0.55;
        s.t1 = 40;
      },
      watch: [
        { id: 'sBrake', label: 'the braking distance', get: (c) => c.sBrake },
        { id: 'total', label: 'the distance between the stations', get: (c) => c.total },
      ],
      mode: 'dir',
      expect: { sBrake: 'same', total: 'bigger' },
      why: 'The braking distance depends only on the top speed: $v_{top}^2/2a_2 = 302.5$ m either way. The gentle start reaches that speed farther along, 440 m instead of 220 m, so the stations end up 742.5 m apart instead of 522.5 m.',
    },
  ],
});

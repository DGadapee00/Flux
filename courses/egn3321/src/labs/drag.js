import { quadraticFall, rk4Line } from '@flux/subjects/mechanics/drag.js';
import { G } from '@flux/subjects/mechanics/constants.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, note, sceneIn, seg, vec } from './diagram.js';
import { defineLab } from './define2d.js';
import { PLAY, advance, stopped } from './motion.js';
import { bindSlider, slider } from './widgets.js';

/**
 * Shows that, against air, a heavier body of the same shape falls faster. Drag grows as v²,
 * F = ½ρC A v² = k v², so the fall levels off at the terminal speed v_t = √(mg/k): four stacked
 * coffee filters fall twice as fast as one. Early in the fall, before drag matters, every body still
 * falls together at g (Hibbeler §13.4; 8.01SC lessons 14.1–14.3).
 *
 * Recompute: the closed form v = v_t tanh(gt/v_t) and y = (v_t²/g) ln cosh(gt/v_t).
 * Check: RK4 on m dv/dt = mg − kv². Air at sea level is 1.225 kg/m³ (ISO 2533 standard atmosphere).
 */
const RHO = 1.225;
const SCENARIOS = [
  { id: 'filters', name: 'Coffee filters, nested', m: 0.001, CA: 0.0132, tMax: 2.5, t: 1.2, unit: 'g', mMin: 0.001, mMax: 0.006, mStep: 0.001, caMin: 0.004, caMax: 0.04, caStep: 0.001 },
  { id: 'skydiver', name: 'A skydiver, belly down', m: 80, CA: 0.5, tMax: 20, t: 5, unit: 'kg', mMin: 40, mMax: 140, mStep: 5, caMin: 0.1, caMax: 1.5, caStep: 0.05 },
  { id: 'ball', name: 'A baseball dropped from a tower', m: 0.145, CA: 0.0015, tMax: 8, t: 1, unit: 'kg', mMin: 0.05, mMax: 1.2, mStep: 0.005, caMin: 0.0005, caMax: 0.005, caStep: 0.0001 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  const { name, id: scId, ...rest } = sc;
  void name;
  Object.assign(state, stopped(), { scenarioId: scId, ...rest });
}

const kOf = (s) => 0.5 * RHO * s.CA;
const range = (s) => SCENARIOS.find((x) => x.id === s.scenarioId) || SCENARIOS[0];

export function fallAt(s, t) {
  return quadraticFall({ m: s.m, k: kOf(s), t });
}

export default defineLab({
  id: 'drag',
  exam: 'u2',
  title: 'Drag',
  app: false,
  gapLimit: 1e-6,
  keys: { ' ': 'sweep' },
  toggles: [PLAY],
  hint: 'Drag grows as v². The fall levels off at √(mg/k): a heavier body of the same shape falls faster.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('filters', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => ({ key: 't', lo: 0, hi: state.tMax }),
  controls() {
    return `
      ${slider('dr-m', 'mass m (kg)', 0.001, 0.001, 0.006, 0.001)}
      ${slider('dr-ca', 'drag area C·A (m²)', 0.0132, 0.004, 0.04, 0.001)}
      ${slider('dr-t', 'time t (s)', 1.2, 0, 2.5, 0.01)}
      <p class="tiny">Grey is the weight, pink the drag, white the velocity. The faint outline falls with no air at all.</p>`;
  },
  bind(api) {
    bindSlider('dr-m', (s, v) => { s.m = v; }, api);
    bindSlider('dr-ca', (s, v) => { s.CA = v; }, api);
    bindSlider('dr-t', (s, v) => { s.t = v; }, api);
  },
  syncControls(state) {
    const r = range(state);
    const set = (id, val, lo, hi, step) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.min = String(lo);
      el.max = String(hi);
      el.step = String(step);
      if (document.activeElement !== el) el.value = String(val);
    };
    set('dr-m', state.m, r.mMin, Math.max(r.mMax, state.m), r.mStep);
    set('dr-ca', state.CA, r.caMin, Math.max(r.caMax, state.CA), r.caStep);
    set('dr-t', state.t, 0, state.tMax, 0.01);
  },
  tick(dt, state) {
    return advance(state, dt, { hi: state.tMax, rate: state.tMax / 6 });
  },
  compute(state) {
    const k = kOf(state);
    const t = Math.min(Math.max(state.t ?? 0, 0), state.tMax);
    const q = fallAt(state, t);
    const rk = rk4Line((v) => G - (k * v * v) / state.m, { t1: t, steps: 1500 });
    const gap = t < 1e-9 ? 0 : Math.max(Math.abs(rk.v - q.v) / q.vt, Math.abs(rk.y - q.y) / Math.max(q.y, 1e-9));
    const t95 = (q.vt / G) * Math.atanh(0.95);
    const t90 = (q.vt / G) * Math.atanh(0.9);
    const n = 120;
    const series = Array.from({ length: n + 1 }, (_, i) => {
      const ti = (state.tMax * i) / n;
      const p = fallAt(state, ti);
      return { t: ti, v: p.v, y: p.y };
    });
    return {
      k,
      t,
      v: q.v,
      y: q.y,
      a: Math.abs(q.a) < 1e-6 * G ? 0 : q.a,
      vt: q.vt,
      share: q.v / q.vt,
      drag: k * q.v * q.v,
      W: state.m * G,
      vFree: G * t,
      yFree: 0.5 * G * t * t,
      t95,
      t90,
      CA: state.CA,
      m: state.m,
      series,
      gap,
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    // The fall is a tall column, so it takes a strip on the left and the chart the rest.
    const W = B.free.x1 - B.free.x0;
    const xm = B.free.x0 + Math.max(110, Math.min(0.3 * W, 220));
    const left = veiled ? B.free : { ...B.free, x1: xm };
    const right = veiled ? null : { ...B.free, x0: xm };
    const yEnd = c.series[c.series.length - 1].y;
    const S = sceneIn(B, left, { x0: -1, x1: 1, y0: -1.12 * yEnd, y1: 0.3 * yEnd });
    // A height scale on the left, then the body and its no-air twin.
    // Offsets in pixels: the column is narrow, and the height scale sets the drawing's scale.
    const px = (p) => p / S.k;
    const xBar = px(-44);
    const xBody = px(-8);
    const xGhost = px(30);
    seg(S, [xBar, 0], [xBar, -yEnd], { color: alpha(C.text, 0.3), width: 1 });
    seg(S, [xBar - px(5), -yEnd], [xBar + px(5), -yEnd], { color: alpha(C.text, 0.3), width: 1 });
    label(S, `${fig(yEnd)} m down`, [xBar, -yEnd], { dy: 12, align: 'left', color: C.dim });
    const r = px(11);
    if (c.yFree <= 1.06 * yEnd) circle(S, [xGhost, -c.yFree], r, { stroke: alpha(C.text, 0.35), width: 1, dash: [3, 3] });
    else label(S, 'no air ↓', [xGhost, -yEnd], { dy: -10, color: C.dim });
    circle(S, [xBody, -c.y], r, { stroke: C.text, fill: alpha(C.text, 0.15), width: 1.5 });
    const kF = 34 / Math.max(c.W, 1e-12);
    vec(S, [xBody, -c.y - r], [0, -c.W], kF, { color: C.dim, label: 'W' });
    vec(S, [xBody, -c.y + r], [0, c.drag], kF, { color: C.pink, label: 'drag' });
    vec(S, [xBody + r + px(6), -c.y], [0, -c.v], 34 / Math.max(c.vt, 1e-9), { color: C.text, label: 'v' });
    if (veiled) return;

    // v against t, beside the terminal speed and the no-air line g t.
    const P = chartIn(B, right, { lo: 0, hi: state.tMax }, { lo: 0, hi: 1.25 * c.vt });
    axes(P, { xLabel: 't (s)', yLabel: 'v (m/s)' });
    line(P, [[0, c.vt], [state.tMax, c.vt]], { color: C.gold, width: 1.5, dash: [6, 4] });
    note(P, `v_t = ${fig(c.vt)} m/s`, state.tMax * 0.55, c.vt, { color: C.gold, dy: -6 });
    line(P, [[0, 0], [Math.min(state.tMax, (1.25 * c.vt) / G), Math.min(1.25 * c.vt, G * state.tMax)]], { color: alpha(C.text, 0.35), width: 1.5, dash: [3, 3] });
    note(P, 'no air: v = gt', Math.min(state.tMax, (1.2 * c.vt) / G), Math.min(1.2 * c.vt, G * state.tMax), { color: C.dim, dx: 6, dy: 4 });
    line(P, c.series.map((p) => [p.t, p.v]), { color: C.text, width: 2.5 });
    dot(P, c.t, c.v, { color: C.yellow, r: 5 });
  },
  law: () => [String.raw`m\dot v = mg - kv^2,\quad k=\tfrac12\rho C A`, String.raw`v_t=\sqrt{mg/k},\quad v=v_t\tanh\dfrac{gt}{v_t}`],
  liveRows(state, c) {
    return [
      kv('$k = \\tfrac12 \\rho C A$', `${fig(c.k)} kg/m`),
      kv('$v_t = \\sqrt{mg/k}$', `${fig(c.vt)} m/s`),
      kv(`$v$, $y$ at $t = ${fig(c.t)}$ s`, `${fig(c.v)} m/s, ${fig(c.y)} m`),
      kv('$a = g(1 - v^2/v_t^2)$', `${fig(c.a)} m/s²`),
      kv('with no air', `${fig(c.vFree)} m/s, ${fig(c.yFree)} m`),
      kv('time to 95% of $v_t$', `${fig(c.t95)} s`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['v', `${fig(c.v)} m/s`],
      ['terminal', `${fig(c.vt)} m/s`],
      ['a', `${fig(c.a)} m/s²`],
      ['fallen', `${fig(c.y)} m`],
    ]);
  },
  coach(state, c) {
    if (c.share < 0.3) {
      return {
        title: 'Early on, drag hardly matters',
        body: [
          String.raw`At ${fig(c.v)} m/s the drag is only $${fig((100 * c.drag) / c.W)}$% of the weight, so the body falls almost at $g$: $a = ${fig(c.a)}$ m/s². A heavier body of the same shape would be beside it.`,
          String.raw`The terminal speed, $${fig(c.vt)}$ m/s, is still far off.`,
        ],
      };
    }
    return {
      title: c.share > 0.95 ? 'At terminal speed: drag equals weight' : 'Drag grows until it matches the weight',
      body: [
        String.raw`Drag is $kv^2 = ${fig(c.drag)}$ N against a weight of $${fig(c.W)}$ N, so $a = g(1 - v^2/v_t^2) = ${fig(c.a)}$ m/s².`,
        String.raw`$v_t = \sqrt{mg/k} = ${fig(c.vt)}$ m/s. The mass is under the root: four times the mass with the same shape doubles $v_t$.`,
      ],
    };
  },
  predictions: [
    {
      id: 'dr-stack',
      scenario: 'filters',
      ask: 'Nest four coffee filters together: four times the mass, the same shape.',
      apply(s) { s.m *= 4; },
      watch: [{ id: 'vt', label: 'the terminal speed', get: (c) => c.vt }],
      mode: 'factor',
      expect: { vt: 2 },
      why: 'At terminal speed $kv_t^2 = mg$, so $v_t = \\sqrt{mg/k}$. The same shape keeps $k$; four times the mass doubles $v_t$, from 1.10 to 2.20 m/s.',
    },
    {
      id: 'dr-time',
      scenario: 'skydiver',
      ask: 'Move the clock from 5 s after the jump to 10 s.',
      apply(s) { s.t = 10; },
      watch: [
        { id: 'v', label: 'the speed', get: (c) => c.v },
        { id: 'a', label: 'the acceleration', get: (c) => c.a },
      ],
      mode: 'dir',
      expect: { v: 'bigger', a: 'smaller' },
      why: 'The speed rises from 37.9 to 48.6 m/s, so drag rises as $v^2$ and the net force falls. The acceleration drops from 4.32 to 0.781 m/s². It is $g$ only at the instant of the jump.',
    },
    {
      id: 'dr-steel',
      scenario: 'ball',
      ask: 'Swap the baseball for a steel ball of the same size, eight times as heavy. Look 1 s into the drop.',
      apply(s) { s.m *= 8; },
      tol: 0.03,
      watch: [
        { id: 'v', label: 'the speed 1 s into the drop', get: (c) => c.v },
        { id: 'vt', label: 'the terminal speed', get: (c) => c.vt },
      ],
      mode: 'dir',
      expect: { v: 'same', vt: 'bigger' },
      why: 'One second in, drag is still small next to the weight, so both balls have fallen at nearly $g$: 9.61 and 9.78 m/s. Only near terminal speed do they part: $v_t$ grows by $\\sqrt 8$, from 39.3 to 111 m/s.',
    },
  ],
});

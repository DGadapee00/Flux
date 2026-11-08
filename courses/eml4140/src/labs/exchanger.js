import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { INLET, exchangerChecked, exchangerClosed } from '@flux/subjects/heat/exchanger.js';

/**
* Exchanger: a double-pipe heat exchanger with hot water in at 90 °C and cold at 20 °C, run in
 * counterflow or parallel flow, with sliders for the hot stream's capacity rate and the conductance
 * UA, both temperature profiles drawn.
 *
 * Shows that in counterflow the cold stream can leave hotter than the hot stream leaves: with equal
 * streams and NTU = 2 it leaves at 66.7 °C against the hot stream's 43.3 °C, and passes 46.7 kW. The
 * same exchanger in parallel flow passes 34.4 kW. ε-NTU is checked against LMTD and against a
 * Runge–Kutta march of both streams (packages/subjects/src/heat/exchanger.js).
 */
const SCENARIOS = [
  {
    id: 'counter',
    name: 'Counterflow, equal streams, NTU = 2',
    flow: 'counter',
    Ch: 1000,
    UA: 2000
  },
  {
    id: 'parallel',
    name: 'The same in parallel flow',
    flow: 'parallel',
    Ch: 1000,
    UA: 2000
  },
  {
    id: 'small',
    name: 'A small exchanger, UA = 500 W/K',
    flow: 'counter',
    Ch: 2000,
    UA: 500
  },
  {
    id: 'big',
    name: 'A big one, UA = 5000 W/K',
    flow: 'counter',
    Ch: 1000,
    UA: 5000
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, flow: sc.flow, Ch: sc.Ch, UA: sc.UA });
}

const KEYS = [['hx-ch', 'Ch'], ['hx-ua', 'UA']];

const C_C = 1000;
const kwt = (q) => `${fig(q / 1000)} kW`;

function profile(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 1 }, { lo: 10, hi: 100 });
  axes(P, { xLabel: 'position along the exchanger (share of its area)', yLabel: 'temperature (°C)' });
  line(P, c.prof.map((p) => [p[0], p[1]]), { color: C.red, width: 3 });
  line(P, c.prof.map((p) => [p[0], p[2]]), { color: C.blue, width: 3 });
  const counter = state.flow !== 'parallel';
  label(P, `hot in ${INLET.Th} °C`, [0, INLET.Th], { color: C.red, align: 'left', dx: 4, dy: -10 });
  label(P, `out ${fig(c.Tho)} °C`, [1, c.Tho], { color: C.red, align: 'right', dy: -10 });
  label(P, counter ? `cold out ${fig(c.Tco)} °C` : `cold in ${INLET.Tc} °C`, [0, counter ? c.Tco : INLET.Tc], { color: C.blue, align: 'left', dx: 4, dy: 14 });
  label(P, counter ? `in ${INLET.Tc} °C` : `out ${fig(c.Tco)} °C`, [1, counter ? INLET.Tc : c.Tco], { color: C.blue, align: 'right', dy: 14 });
}

function effPlot(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 6 }, { lo: 0, hi: 1.05 });
  axes(P, { xLabel: 'NTU = UA/C_min', yLabel: 'effectiveness ε' });
  const at = (flow, ntu) => exchangerClosed({ flow, Ch: state.Ch, Cc: C_C, UA: ntu * c.Cmin }).eps;
  const ns = Array.from({ length: 121 }, (_, i) => 0.01 + (5.99 * i) / 120);
  line(P, ns.map((n) => [n, at('counter', n)]), { color: C.gold, width: 2.5 });
  line(P, ns.map((n) => [n, at('parallel', n)]), { color: C.muted, width: 2, dash: [5, 4] });
  label(P, 'counterflow', [6, at('counter', 6)], { color: C.gold, align: 'right', dy: -10 });
  label(P, 'parallel', [6, at('parallel', 6)], { color: C.muted, align: 'right', dy: 14 });
  dot(P, Math.min(6, c.NTU), c.eps, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'exchanger',
  exam: 'u4',
  title: 'Exchanger',
  hint: 'In counterflow, raise UA until the cold stream leaves hotter than the hot stream. Then switch to parallel flow and watch the outlets meet but never cross.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('counter', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'UA', lo: 100, hi: 6000 }),
  controls() {
    return `
      <label class="field"><span>Arrangement</span><select id="hx-flow">${[['counter', 'Counterflow'], ['parallel', 'Parallel flow']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('hx-ch', "Hot stream’s capacity rate C_h (W/K)", 1000, 300, 3000, 50)}
      ${slider('hx-ua', "Conductance UA (W/K)", 2000, 100, 6000, 50)}
      <p class="tiny">Hot water in at 90 °C, cold water in at 20 °C with C_c = 1000 W/K (about 0.24 kg/s). Left: both temperatures along the exchanger; the cold stream runs left in counterflow. Right: effectiveness against NTU for both arrangements at this C_r.</p>`;
  },
  bind(api) {
    document.getElementById('hx-flow')?.addEventListener('change', (e) => {
      api.slice().flow = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('hx-flow');
      if (el) el.value = String(state.flow);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return exchangerChecked({ flow: state.flow, Ch: state.Ch, Cc: C_C, UA: state.UA });
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      profile(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    profile(B, a, state, c);
    effPlot(B, b, state, c);
  },
  law: () => [String.raw`q = \varepsilon\,C_\text{min}(T_{h,i} - T_{c,i}), \qquad \text{NTU} = \frac{UA}{C_\text{min}}`, String.raw`\varepsilon_\text{counter} = \frac{1 - e^{-\text{NTU}(1 - C_r)}}{1 - C_re^{-\text{NTU}(1 - C_r)}}`, String.raw`q = UA\,\Delta T_\text{lm}`],
  liveRows(state, c) {
    return [
      kv('NTU and C_r', `${fig(c.NTU)}, ${fig(c.Cr)}`),
      kv('Effectiveness', fig(c.eps)),
      kv('Duty', kwt(c.q)),
      kv('Hot out, cold out', `${fig(c.Tho)} °C, ${fig(c.Tco)} °C`),
      kv('Log-mean difference', `${fig(c.lmtd)} K`),
      kv('ε-NTU against LMTD and the march', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['duty', kwt(c.q)], ['ε', fig(c.eps)], ['cold out', `${fig(c.Tco)} °C`], ['hot out', `${fig(c.Tho)} °C`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> U changes along a real exchanger as the fluids’ properties change, fouling adds a resistance that grows in service, and shell-and-tube units fall between the two ideal arrangements.`;
    if (c.cross) return { title: 'The cold stream leaves hotter than the hot one', body: `In counterflow the cold stream leaves past the hot inlet, so it can end up at ${fig(c.Tco)} °C while the hot stream leaves at ${fig(c.Tho)} °C. The duty is ${kwt(c.q)}, ε = ${fig(c.eps)}. ${leavesOut}` };
    if (state.flow === 'parallel') return { title: 'Parallel flow: the outlets close on each other', body: `Both streams enter at the same end, so the difference that drives the heat shrinks as they go: the outlets, ${fig(c.Tho)} °C and ${fig(c.Tco)} °C, can approach each other but never cross. ε = ${fig(c.eps)}; counterflow would give ${fig(exchangerClosed({ flow: 'counter', Ch: state.Ch, Cc: C_C, UA: state.UA }).eps)}. ${leavesOut}` };
    return { title: 'Counterflow, still short of crossing', body: `NTU = ${fig(c.NTU)} passes ${kwt(c.q)} at ε = ${fig(c.eps)}. More area would let the cold stream leave hotter than the hot one does. ${leavesOut}` };
  },
  app: false,
});

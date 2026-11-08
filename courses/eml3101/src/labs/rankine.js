import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { dome, rankineChecked, rankineClosed, rankinePath } from '@flux/subjects/thermo/rankine.js';

/**
* Rankine: an ideal steam plant on a T–s diagram, with sliders for boiler pressure and turbine inlet
 * temperature and a choice of reheat.
 *
 * Shows that a higher boiler pressure is not free: at 500 °C, going from 6 to 15 MPa raises the
 * efficiency from 38% to 41%, but the turbine exhaust goes from 83% to 76% dry, and droplets erode the
 * last blades. Reheat dries it again, to 86%, and adds efficiency as well. Properties are IAPWS-IF97;
 * the energy balance is checked by taking the heat rejected as T_sat·Δs
 * (packages/subjects/src/thermo/rankine.js).
 */
const SCENARIOS = [
  { id: 'base', name: '6 MPa, 500 °C', pb: 6, TC: 500, reheat: 'no' },
  { id: 'high', name: '15 MPa, 500 °C', pb: 15, TC: 500, reheat: 'no' },
  { id: 'reheat', name: '15 MPa, 500 °C, with reheat', pb: 15, TC: 500, reheat: 'yes' },
  { id: 'hot', name: '10 MPa, 600 °C', pb: 10, TC: 600, reheat: 'no' },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, pb: sc.pb, TC: sc.TC, reheat: sc.reheat });
}

const KEYS = [['rk-p', 'pb'], ['rk-t', 'TC']];

function ts(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 9 }, { lo: 270, hi: 900 });
  axes(P, { xLabel: 'entropy s (kJ/(kg·K))', yLabel: 'temperature (K)' });
  line(P, dome(), { color: alpha(C.muted, 0.8), width: 1.5 });
  line(P, rankinePath(state), { color: C.gold, width: 2.5 });
  dot(P, c.s4 / 1000, c.Tc, { color: C.blue, r: 6, ring: C.text });
  label(P, `exhaust ${fig(100 * c.x4)}% dry`, [c.s4 / 1000, c.Tc], { color: C.blue, align: 'right', dx: -8, dy: 16 });
  dot(P, c.s3 / 1000, c.T3, { color: C.red, r: 5 });
}

function trend(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 6, hi: 16 }, { lo: 0.3, hi: 1 });
  axes(P, { xLabel: 'boiler pressure (MPa)', yLabel: 'share', yFmt: (v) => `${Math.round(v * 100)}%` });
  const ps = Array.from({ length: 21 }, (_, i) => 6 + i / 2);
  const rows = ps.map((pb) => [pb, rankineClosed({ ...state, pb })]);
  line(P, rows.map(([pb, r]) => [pb, r.eta]), { color: C.gold, width: 2.5 });
  line(P, rows.map(([pb, r]) => [pb, r.x4]), { color: C.blue, width: 2.5 });
  label(P, 'efficiency', [6, rows[0][1].eta], { color: C.gold, align: 'left', dx: 4, dy: -12 });
  label(P, 'exhaust dryness', [6, rows[0][1].x4], { color: C.blue, align: 'left', dx: 4, dy: -12 });
  dot(P, state.pb, c.eta, { color: C.pink, r: 6, ring: C.text });
  dot(P, state.pb, c.x4, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'rankine',
  exam: 'u3',
  title: 'Rankine',
  hint: 'Raise the boiler pressure and watch the exhaust get wetter. Then add reheat.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('base', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'pb', lo: 6, hi: 16 }),
  controls() {
    return `
      <label class="field"><span>Reheat</span><select id="rk-r">${[['no', 'No reheat'], ['yes', 'Reheat at a quarter of boiler pressure']].map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('rk-p', "Boiler pressure (MPa)", 6, 6, 16, 0.5)}
      ${slider('rk-t', "Turbine inlet temperature (°C)", 500, 400, 600, 5)}
      <p class="tiny">Ideal pump and turbine; condenser at 10 kPa (45.8 °C). With reheat the steam is expanded to a quarter of boiler pressure and heated back to the inlet temperature. Left: the cycle on T–s with the saturation dome. Right: efficiency and exhaust dryness against boiler pressure.</p>`;
  },
  bind(api) {
    document.getElementById('rk-r')?.addEventListener('change', (e) => {
      api.slice().reheat = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('rk-r');
      if (el) el.value = String(state.reheat);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return rankineChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      ts(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    ts(B, a, state, c);
    trend(B, b, state, c);
  },
  law: () => [String.raw`\eta = \frac{(h_3 - h_4) - (h_2 - h_1)}{h_3 - h_2}`, String.raw`w_\text{pump} \approx v_1\,(p_2 - p_1)`, String.raw`q_\text{out} = T_\text{sat}(s_4 - s_1)`],
  liveRows(state, c) {
    return [
      kv('Efficiency', `${fig(100 * c.eta)}%`),
      kv('Turbine and pump work', `${fig(c.wt / 1000)}, ${fig(c.wp / 1000)} kJ/kg`),
      kv('Pump work, v₁Δp', `${fig(c.wpApprox / 1000)} kJ/kg`),
      kv('Heat in', `${fig(c.qin / 1000)} kJ/kg`),
      kv('Exhaust dryness', `${fig(100 * c.x4)}%`),
      kv('Enthalpy balance against T·Δs', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['efficiency', `${fig(100 * c.eta)}%`], ['exhaust', `${fig(100 * c.x4)}% dry`], ['boiler', `${fig(state.pb)} MPa`], ['reheat', state.reheat]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real turbines are about 85–90% as good as isentropic, which raises the exhaust’s dryness but lowers the work; feedwater heaters, which preheat the water with bled steam, add several points of efficiency.`;
    if (c.x4 < 0.88) return { title: 'Efficient, but wet', body: `At ${fig(state.pb)} MPa the cycle makes ${fig(100 * c.eta)}%, but the steam leaves the turbine only ${fig(100 * c.x4)}% dry. Below about 88% the droplets erode the last stage’s blades. ${state.reheat === 'yes' ? 'Even with reheat: raise the inlet temperature.' : 'Reheat would dry it.'} ${leavesOut}` };
    return { title: 'A dry enough exhaust', body: `The exhaust is ${fig(100 * c.x4)}% dry and the cycle makes ${fig(100 * c.eta)}%. The pump takes only ${fig(c.wp / 1000)} kJ/kg of the turbine’s ${fig(c.wt / 1000)}: pumping a liquid costs little. ${leavesOut}` };
  },
  app: false,
});

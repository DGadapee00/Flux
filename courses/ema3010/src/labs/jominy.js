import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { BAR, STEELS, hardness, jominyChecked, rateAt } from '@flux/subjects/matsci/jominy.js';

/**
* End quench: a steel bar at 850 °C with one end sprayed with water, with a choice of steel and a
 * slider for the distance from the quenched end, the hardness along the bar and the cooling curve
 * drawn.
 *
 * Shows that quenching does not harden a part equally: the cooling rate at 700 °C falls as 1/x², from
 * 1700 K/s at 1.5 mm to 39 K/s at 10 mm. Plain 1045 steel turns to martensite only near the end; 4340,
 * whose alloying slows the change to pearlite, hardens all the way along. The erf solution is checked
 * by a Crank–Nicolson solution of the bar (packages/subjects/src/matsci/jominy.js).
 */
const SCENARIOS = [
  { id: 'end', name: '1045 steel, 5 mm from the end', steel: 's1045', xmm: 5 },
  { id: 'deep', name: '1045 steel, 15 mm in', steel: 's1045', xmm: 15 },
  { id: 'alloy', name: '4340 steel, 15 mm in', steel: 's4340', xmm: 15 },
  { id: 'middle', name: '4140 steel, 25 mm in', steel: 's4140', xmm: 25 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, steel: sc.steel, xmm: sc.xmm });
}

const KEYS = [['jm-x', 'xmm']];

function curve(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0, hi: 50 }, { lo: 10, hi: 65 });
  axes(P, { xLabel: 'distance from the quenched end (mm)', yLabel: 'hardness (HRC)' });
  for (const [id, s] of Object.entries(STEELS)) {
    const mine = id === state.steel;
    const pts = Array.from({ length: 98 }, (_, i) => {
      const x = 1.5 + i * 0.5;
      return [x, hardness(id, rateAt(x / 1000).rate).H];
    });
    line(P, pts, { color: mine ? C.gold : alpha(C.muted, 0.7), width: mine ? 2.5 : 1.5, dash: mine ? null : [5, 4] });
    const xm = Math.min(45, Math.sqrt((rateAt(0.001).rate) / s.rc));
    label(P, s.name.split(' ')[0], [xm, (s.Hm + s.Hp) / 2], { color: mine ? C.gold : C.muted, align: 'left', dx: 8, dy: -4 });
  }
  dot(P, state.xmm, c.H, { color: C.pink, r: 6, ring: C.text });
}

function cooling(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0.01, hi: 1000, log: true }, { lo: 0, hi: 900 });
  axes(P, { xLabel: 'time after the spray starts (s)', yLabel: 'temperature (°C)' });
  seg(P, [0.01, BAR.Tn], [1000, BAR.Tn], { color: alpha(C.red, 0.7), width: 1.5, dash: [5, 4] });
  label(P, '700 °C: austenite starts to change', [1000, BAR.Tn], { color: C.red, align: 'right', dy: -10 });
  const pts = Array.from({ length: 201 }, (_, i) => {
    const t = 0.01 * 1e5 ** (i / 200);
    return [t, c.T(t)];
  });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, c.t, BAR.Tn, { color: C.pink, r: 6, ring: C.text });
  label(P, `${fig(c.rate)} K/s`, [c.t, BAR.Tn], { color: C.text, align: 'right', dx: -10, dy: 16 });
}

export default defineLab({
  id: 'jominy',
  exam: 'u3',
  title: 'End quench',
  hint: 'Walk along the 1045 bar and watch the hardness fall off within 10 mm. Then switch to 4340.',
  gapLimit: 2e-3,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('end', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'xmm', lo: 1.5, hi: 50 }),
  controls() {
    return `
      <label class="field"><span>Steel</span><select id="jm-s">${Object.entries(STEELS).map(([id, s]) => [id, s.name]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('jm-x', "Distance from the quenched end (mm)", 3, 1.5, 50, 0.5)}
      <p class="tiny">The bar starts as austenite at 850 °C; its end is held at 20 °C; α = 6 × 10⁻⁶ m²/s. Martensite forms where the bar passes 700 °C faster than the steel’s critical rate (model values). Left: hardness along the bar for each steel. Right: the temperature at this point against time.</p>`;
  },
  bind(api) {
    document.getElementById('jm-s')?.addEventListener('change', (e) => {
      api.slice().steel = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('jm-s');
      if (el) el.value = String(state.steel);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return jominyChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      curve(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    curve(B, a, state, c);
    cooling(B, b, state, c);
  },
  law: () => [String.raw`T = T_q + (T_i - T_q)\,\mathrm{erf}\frac{x}{2\sqrt{\alpha t}}`, String.raw`\left.\frac{dT}{dt}\right|_{700\,^\circ\text{C}} = \frac{(T_i - T_q)\,u\,e^{-u^2}}{\sqrt\pi\,t}, \qquad t = \frac{x^2}{4\alpha u^2}`],
  liveRows(state, c) {
    return [
      kv('Time to reach 700 °C', `${fig(c.t)} s`),
      kv('Cooling rate there', `${fig(c.rate)} K/s`),
      kv('Steel’s critical rate', `${STEELS[state.steel].rc} K/s`),
      kv('Martensite, hardness', `${fig(100 * c.f)}%, ${fig(c.H)} HRC`),
      kv('erf solution against Crank–Nicolson', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['hardness', `${fig(c.H)} HRC`], ['rate', `${fig(c.rate)} K/s`], ['martensite', `${fig(100 * c.f)}%`], ['at', `${fig(state.xmm)} mm`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A real spray removes heat at a finite rate, so the end is not held exactly at 20 °C; the steel’s conductivity changes as it cools and transforms; and the change from austenite releases heat. Each steel’s hardenability is measured, not computed.`;
    const s = STEELS[state.steel];
    if (c.f > 0.9) return { title: 'Fast enough: martensite', body: `At ${fig(state.xmm)} mm the bar passes 700 °C at ${fig(c.rate)} K/s, faster than ${s.name}’s critical ${s.rc} K/s. The austenite has no time to make pearlite and shears into martensite: ${fig(c.H)} HRC. ${leavesOut}` };
    if (c.f < 0.1) return { title: 'Too slow: pearlite', body: `At ${fig(state.xmm)} mm the bar cools at only ${fig(c.rate)} K/s, below the critical ${s.rc} K/s. Carbon has time to diffuse out into cementite plates: pearlite at ${fig(c.H)} HRC. A part this thick in this steel is not hardened in its core. ${leavesOut}` };
    return { title: 'In between', body: `At ${fig(state.xmm)} mm the rate, ${fig(c.rate)} K/s, is near the critical ${s.rc} K/s: part martensite, part pearlite, ${fig(c.H)} HRC. Alloying moves this point deeper into the bar. ${leavesOut}` };
  },
  app: false,
});

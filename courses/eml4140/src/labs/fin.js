import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { FIN, MATERIALS, finChecked, finClosed } from '@flux/subjects/heat/fins.js';

/**
* Fin: a 5 mm pin fin from a 100 °C wall into 25 °C fluid, with sliders for its length and the
 * heat transfer coefficient and a choice of material, the temperature along it drawn.
 *
 * Shows that a longer fin does not always shed more heat: an aluminium fin gives 1.39 W at 50 mm and
 * 2.84 W at 200 mm, but past mL ≈ 2 the far end is already near the fluid and adds almost nothing.
 * And a fin can make things worse: nylon in water-like flow sheds less than the bare wall it covers.
 * The closed form is checked against a finite-difference solution (packages/subjects/src/heat/fins.js).
 */
const SCENARIOS = [
  {
    'id': 'alu',
    'name': 'Aluminium, 50 mm, in air',
    'mat': 'aluminium',
    'h': 25,
    'Lmm': 50
  },
  {
    'id': 'long',
    'name': 'Aluminium, 200 mm',
    'mat': 'aluminium',
    'h': 25,
    'Lmm': 200
  },
  {
    'id': 'steel',
    'name': 'Stainless steel, 50 mm',
    'mat': 'steel',
    'h': 25,
    'Lmm': 50
  },
  {
    'id': 'nylon',
    'name': 'Nylon, 50 mm, in strong flow',
    'mat': 'plastic',
    'h': 500,
    'Lmm': 50
  }
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mat: sc.mat, h: sc.h, Lmm: sc.Lmm });
}

const KEYS = [['fn-l', 'Lmm'], ['fn-h', 'h']];

const watts = (q) => `${fig(q)} W`;

function profile(B, rect, state, c) {
  const L = state.Lmm;
  const P = plotIn(B, rect, { lo: 0, hi: L }, { lo: FIN.Tinf - 5, hi: FIN.Tb + 8 });
  axes(P, { xLabel: 'distance along the fin (mm)', yLabel: 'temperature (°C)' });
  seg(P, [0, FIN.Tinf], [L, FIN.Tinf], { color: alpha(C.blue, 0.6), width: 1, dash: [5, 4] });
  label(P, `fluid ${FIN.Tinf} °C`, [L, FIN.Tinf], { color: C.blue, align: 'right', dy: -10 });
  const pts = Array.from({ length: 121 }, (_, i) => [(L * i) / 120, FIN.Tinf + c.theta((c.L * i) / 120)]);
  line(P, pts, { color: C.gold, width: 3 });
  label(P, `tip ${fig(c.tipT)} °C`, [L, c.tipT], { color: C.gold, align: 'right', dy: -12 });
}

function heat(B, rect, state, c) {
  const k = MATERIALS[state.mat].k;
  const pts = Array.from({ length: 121 }, (_, i) => {
    const L = 5 + (195 * i) / 120;
    return [L, finClosed({ k, h: state.h, L: L / 1000 }).q];
  });
  const hi = Math.max(c.qMax, c.bare) * 1.25;
  const P = plotIn(B, rect, { lo: 0, hi: 200 }, { lo: 0, hi });
  axes(P, { xLabel: 'fin length (mm)', yLabel: 'heat shed (W)' });
  seg(P, [0, c.qMax], [200, c.qMax], { color: alpha(C.green, 0.8), width: 1.5, dash: [6, 4] });
  label(P, 'infinitely long', [200, c.qMax], { color: C.green, align: 'right', dy: -10 });
  seg(P, [0, c.bare], [200, c.bare], { color: alpha(C.red, 0.8), width: 1.5, dash: [3, 3] });
  label(P, 'bare wall', [200, c.bare], { color: C.red, align: 'right', dy: 12 });
  line(P, pts, { color: C.gold, width: 2.5 });
  dot(P, state.Lmm, c.q, { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'fin',
  exam: 'u1',
  title: 'Fin',
  hint: 'Lengthen the aluminium fin and watch the heat level off past mL ≈ 2. Then try nylon in strong flow: the fin sheds less than the bare wall.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('alu', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'Lmm', lo: 5, hi: 200 }),
  controls() {
    return `
      <label class="field"><span>Material</span><select id="fn-mat">${Object.entries(MATERIALS).map(([id, m]) => [id, `${m.name}, k = ${m.k} W/(m·K)`]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('fn-l', "Length (mm)", 50, 5, 200, 1)}
      ${slider('fn-h', "Heat transfer coefficient h (W/(m²·K))", 25, 5, 500, 1)}
      <p class="tiny">A pin 5 mm across from a wall at 100 °C into fluid at 25 °C; its tip convects too. Left: temperature along the fin. Right: heat it sheds against length, with the long-fin limit and what the bare wall under it would shed.</p>`;
  },
  bind(api) {
    document.getElementById('fn-mat')?.addEventListener('change', (e) => {
      api.slice().mat = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('fn-mat');
      if (el) el.value = String(state.mat);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return finChecked(state);
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
    heat(B, b, state, c);
  },
  law: () => [String.raw`\theta'' = m^2\theta, \qquad m = \sqrt{\frac{hP}{kA_c}}`, String.raw`q = \sqrt{hPkA_c}\,\theta_b\,\frac{\sinh mL + (h/mk)\cosh mL}{\cosh mL + (h/mk)\sinh mL}`, String.raw`\varepsilon = \frac{q}{hA_c\theta_b}`],
  liveRows(state, c) {
    return [
      kv('m and mL', `${fig(c.m)} 1/m, ${fig(c.mL)}`),
      kv('Heat shed, and the long-fin limit', `${watts(c.q)}, ${watts(c.qMax)}`),
      kv('Bare wall, and effectiveness', `${watts(c.bare)}, ${fig(c.eff)}`),
      kv('Fin efficiency', `${fig(100 * c.eta)}%`),
      kv('Tip temperature', `${fig(c.tipT)} °C`),
      kv('Closed form against finite differences', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['heat', watts(c.q)], ['mL', fig(c.mL)], ['effectiveness', fig(c.eff)], ['tip', `${fig(c.tipT)} °C`]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> h is not the same all along a real fin, and closely packed fins shade each other and choke the flow between them.`;
    if (c.eff < 1) return { title: 'The fin makes it worse', body: `Nylon conducts so poorly that, in this strong flow, the fin sheds ${watts(c.q)}, less than the ${watts(c.bare)} the bare wall under it would. Its effectiveness is ${fig(c.eff)}: a fin pays only when kP/(hA_c) is well above 1. ${leavesOut}` };
    if (c.mL > 2) return { title: 'Past mL ≈ 2, length buys little', body: `At mL = ${fig(c.mL)} the tip is at ${fig(c.tipT)} °C, close to the fluid: the far end hardly sheds anything. The fin gives ${watts(c.q)}, ${fig(100 * c.q / c.qMax)}% of what an infinitely long one would. ${leavesOut}` };
    return { title: 'A short fin, nearly all hot', body: `At mL = ${fig(c.mL)} the whole fin stays near the wall’s temperature (efficiency ${fig(100 * c.eta)}%), so making it longer still adds heat: it sheds ${watts(c.q)} now, and could reach ${watts(c.qMax)}. ${leavesOut}` };
  },
  app: false,
});

import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { LIQUIDS, riseChecked, riseClosed } from '@flux/subjects/mechanics/capillary.js';

/**
* Capillary: glass tubes dipped in a liquid, with a slider for the tube's radius and a choice of
 * liquid, the columns drawn beside the rise against radius.
 *
 * Shows that a wider tube does not draw liquid higher: the rise goes as 1/r, 30 mm in a 0.5 mm tube
 * of water and 149 mm in a 0.1 mm one. Mercury, which does not wet glass, sinks instead, 11 mm below
 * the outside level in the 0.5 mm tube. Jurin's force balance is checked by minimising the column's
 * energy (packages/subjects/src/mechanics/capillary.js).
 */
const SCENARIOS = [
  { id: 'water', name: 'Water, 0.5 mm tube', liquid: 'water', rmm: 0.5 },
  { id: 'thin', name: 'Water, 0.1 mm tube', liquid: 'water', rmm: 0.1 },
  { id: 'mercury', name: 'Mercury, 0.5 mm tube', liquid: 'mercury', rmm: 0.5 },
  { id: 'ethanol', name: 'Ethanol, 1 mm tube', liquid: 'ethanol', rmm: 1 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, liquid: sc.liquid, rmm: sc.rmm });
}

const KEYS = [['cp-r', 'rmm']];

function tubes(B, rect, state, c) {
  const radii = [2, 1, 0.5, state.rmm];
  const hs = radii.map((r) => riseClosed({ liquid: state.liquid, rmm: r }).hmm);
  const top = Math.max(10, ...hs) * 1.2;
  const bot = Math.min(-10, ...hs) * 1.25;
  const P = plotIn(B, rect, { lo: 0.4, hi: 4.6 }, { lo: bot, hi: top });
  axes(P, { xLabel: 'tube radius', yLabel: 'height above the outside level (mm)', xFmt: (v) => (Math.abs(v - Math.round(v)) < 1e-6 && v >= 1 && v <= 4 ? `${fig(radii[Math.round(v) - 1])} mm` : '') });
  poly(P, [[0.4, bot], [4.6, bot], [4.6, 0], [0.4, 0]], { fill: alpha(C.blue, 0.15), stroke: null });
  seg(P, [0.4, 0], [4.6, 0], { color: alpha(C.blue, 0.8), width: 1.5 });
  radii.forEach((r, i) => {
    const x = i + 1;
    const w = 0.12;
    const mine = i === 3;
    poly(P, [[x - w, Math.min(0, hs[i])], [x + w, Math.min(0, hs[i])], [x + w, Math.max(0, hs[i])], [x - w, Math.max(0, hs[i])]], { fill: alpha(mine ? C.gold : C.blue, 0.6), stroke: null });
    seg(P, [x - w, bot], [x - w, top * 0.95], { color: C.text, width: 1.2 });
    seg(P, [x + w, bot], [x + w, top * 0.95], { color: C.text, width: 1.2 });
    label(P, `${fig(hs[i])} mm`, [x, hs[i]], { color: mine ? C.gold : C.text, dy: hs[i] >= 0 ? -10 : 14 });
  });
}

function curve(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 0.05, hi: 2 }, { lo: -60, hi: 320 });
  axes(P, { xLabel: 'tube radius (mm)', yLabel: 'rise (mm)' });
  seg(P, [0.05, 0], [2, 0], { color: alpha(C.text, 0.4), width: 1 });
  const rs = Array.from({ length: 200 }, (_, i) => 0.05 + (1.95 * i) / 199);
  const col = { water: C.blue, ethanol: C.green, mercury: C.red };
  for (const id of Object.keys(LIQUIDS)) {
    const pts = rs.map((r) => [r, Math.max(-60, Math.min(320, riseClosed({ liquid: id, rmm: r }).hmm))]);
    line(P, pts, { color: col[id], width: id === state.liquid ? 2.5 : 1.5, dash: id === state.liquid ? null : [5, 4] });
    const at = { water: 15, ethanol: 50, mercury: 150 }[id];
    label(P, LIQUIDS[id].name.split(' ')[0], pts[at], { color: col[id], align: 'left', dx: 6, dy: id === 'mercury' ? 14 : -10 });
  }
  dot(P, state.rmm, Math.max(-60, Math.min(320, c.hmm)), { color: C.pink, r: 6, ring: C.text });
}

export default defineLab({
  id: 'capillary',
  exam: 'u1',
  title: 'Capillary',
  hint: 'Halve the tube’s radius and watch the water climb twice as high. Then try mercury.',
  gapLimit: 1e-7,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('water', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'rmm', lo: 0.05, hi: 2 }),
  controls() {
    return `
      <label class="field"><span>Liquid</span><select id="cp-l">${Object.entries(LIQUIDS).map(([id, l]) => [id, `${l.name}: σ = ${l.sigma} N/m, θ = ${l.theta}°`]).map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></label>
      ${slider('cp-r', "Tube radius (mm)", 0.5, 0.05, 2, 0.01)}
      <p class="tiny">Clean glass tubes at room temperature. Left: three reference tubes and yours (gold), the outside level at zero, widths not to scale. Right: rise against radius for each liquid; mercury’s depression is drawn below zero.</p>`;
  },
  bind(api) {
    document.getElementById('cp-l')?.addEventListener('change', (e) => {
      api.slice().liquid = e.target.value;
      api.bump();
    });
    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {
    {
      const el = document.getElementById('cp-l');
      if (el) el.value = String(state.liquid);
    }
    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return riseChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      tubes(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    tubes(B, a, state, c);
    curve(B, b, state, c);
  },
  law: () => [String.raw`h = \frac{2\sigma\cos\theta}{\rho g r}`, String.raw`\Delta p = \sigma\left(\frac{1}{R_1} + \frac{1}{R_2}\right) = \frac{2\sigma}{R}\ \text{(sphere)}`],
  liveRows(state, c) {
    return [
      kv('Rise', `${fig(c.hmm)} mm`),
      kv('cos θ', fig(c.cos)),
      kv('Pressure jump across the meniscus', `${fig(c.dp)} Pa`),
      kv('Force balance against energy minimum', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['rise', `${fig(c.hmm)} mm`], ['radius', `${fig(state.rmm)} mm`], ['Δp', `${fig(c.dp)} Pa`], ['wets glass', c.cos > 0 ? 'yes' : 'no']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> The meniscus’s own volume, which matters in wide tubes; a dirty or greasy tube, which raises θ and cuts the rise; and temperature, which lowers σ.`;
    if (c.cos < 0) return { title: 'It does not wet glass: it sinks', body: `Mercury meets glass at 140°, so surface tension pulls the column down: it sits ${fig(-c.hmm)} mm below the outside level in a ${fig(state.rmm)} mm tube. ${leavesOut}` };
    return { title: 'Narrower tubes, higher columns', body: `The wall pulls with 2πrσ cos θ while the column weighs ρgπr²h, so h = 2σ cos θ/(ρgr) = ${fig(c.hmm)} mm here. Halve the radius and the rise doubles. ${leavesOut}` };
  },
  app: false,
});

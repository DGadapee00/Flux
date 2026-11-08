import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { AIRC, cyclesChecked, cyclesClosed } from '@flux/subjects/thermo/otto.js';

/**
* Otto and Diesel: the two air-standard engine cycles side by side, with sliders for the compression
 * ratio and the Diesel cutoff ratio, on a p–v diagram and against compression ratio.
 *
 * Shows that the Diesel cycle is not the more efficient at the same compression ratio: at r = 10 the
 * Otto cycle gives 60% and the Diesel, with cutoff 2, 53%. The Diesel wins because it can run at
 * r = 18, where it gives 63%, while a petrol engine near 10 would knock. The closed forms are checked
 * by integrating ∮p dv (packages/subjects/src/thermo/otto.js).
 */
const SCENARIOS = [
  { id: 'same', name: 'Both at r = 10, cutoff 2', r: 10, rc: 2 },
  { id: 'diesel18', name: 'Both at r = 18', r: 18, rc: 2 },
  { id: 'longcut', name: 'r = 18, cutoff 3', r: 18, rc: 3 },
  { id: 'low', name: 'r = 6', r: 6, rc: 2 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, r: sc.r, rc: sc.rc });
}

const KEYS = [['oc-r', 'r'], ['oc-c', 'rc']];

function pv(B, rect, state, c) {
  const { k, p1 } = AIRC;
  const P = plotIn(B, rect, { lo: 0, hi: c.v1 * 1.08 }, { lo: 50, hi: Math.max(c.p3o, c.p2) * 1.5, log: true });
  axes(P, { xLabel: 'specific volume (m³/kg)', yLabel: 'pressure (kPa)' });
  const ad = (pa, va, vb) => Array.from({ length: 61 }, (_, i) => {
    const v = va + ((vb - va) * i) / 60;
    return [v, pa * (va / v) ** k];
  });
  const comp = ad(p1, c.v1, c.v2);
  const otto = [...comp, [c.v2, c.p3o], ...ad(c.p3o, c.v2, c.v1), [c.v1, p1]];
  const diesel = [...comp, [c.v3d, c.p2], ...ad(c.p2, c.v3d, c.v1), [c.v1, p1]];
  line(P, otto, { color: C.gold, width: 2.5 });
  line(P, diesel, { color: C.blue, width: 2.5, dash: [6, 4] });
  label(P, 'Otto: heat at constant volume', [c.v2, c.p3o], { color: C.gold, align: 'left', dx: 8 });
  label(P, 'Diesel: at constant pressure', [c.v3d, c.p2], { color: C.blue, align: 'left', dx: 8, dy: 20 });
}

function eff(B, rect, state, c) {
  const P = plotIn(B, rect, { lo: 4, hi: 24 }, { lo: 0.3, hi: 0.8 });
  axes(P, { xLabel: 'compression ratio r', yLabel: 'efficiency', yFmt: (v) => `${Math.round(v * 100)}%` });
  const rs = Array.from({ length: 81 }, (_, i) => 4 + i / 4);
  line(P, rs.map((r) => [r, cyclesClosed({ r, rc: state.rc }).etaO]), { color: C.gold, width: 2.5 });
  line(P, rs.map((r) => [r, cyclesClosed({ r, rc: state.rc }).etaD]), { color: C.blue, width: 2.5, dash: [6, 4] });
  dot(P, state.r, c.etaO, { color: C.gold, r: 6, ring: C.text });
  dot(P, state.r, c.etaD, { color: C.blue, r: 6, ring: C.text });
  label(P, 'Otto', [24, cyclesClosed({ r: 24, rc: state.rc }).etaO], { color: C.gold, align: 'right', dy: -10 });
  label(P, 'Diesel', [24, cyclesClosed({ r: 24, rc: state.rc }).etaD], { color: C.blue, align: 'right', dy: 14 });
}

export default defineLab({
  id: 'cycles',
  exam: 'u3',
  title: 'Otto and Diesel',
  hint: 'At r = 10, compare the two efficiencies. Then put the Diesel at r = 18 and compare it with the Otto at 10.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('same', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'r', lo: 4, hi: 24 }),
  controls() {
    return `
      ${slider('oc-r', "Compression ratio r", 10, 4, 24, 0.5)}
      ${slider('oc-c', "Diesel cutoff ratio r_c", 2, 1.2, 3.5, 0.05)}
      <p class="tiny">Cold-air standard, k = 1.4, starting at 300 K and 100 kPa. Both cycles take in the same heat per kilogram. Left: p against v, pressure on a log scale. Right: efficiency against compression ratio; petrol engines run near r = 10, diesels near 18.</p>`;
  },
  bind(api) {

    for (const [id, key] of KEYS) bindSlider(id, (s, v) => { s[key] = v; }, api);
  },
  syncControls(state) {

    for (const [id, key] of KEYS) {
      const e = document.getElementById(id);
      if (e && document.activeElement !== e) e.value = String(state[key]);
    }
  },
  compute(state) {
    return cyclesChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      eff(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    pv(B, a, state, c);
    eff(B, b, state, c);
  },
  law: () => [String.raw`\eta_\text{Otto} = 1 - \frac{1}{r^{\,k-1}}`, String.raw`\eta_\text{Diesel} = 1 - \frac{1}{r^{\,k-1}}\,\frac{r_c^{\,k} - 1}{k\,(r_c - 1)}`],
  liveRows(state, c) {
    return [
      kv('Otto efficiency', `${fig(100 * c.etaO)}%`),
      kv('Diesel efficiency', `${fig(100 * c.etaD)}%`),
      kv('Heat in per kilogram', `${fig(c.qin)} kJ`),
      kv('Peak temperature, Otto and Diesel', `${fig(c.T3o)} K, ${fig(c.T3d)} K`),
      kv('Closed forms against ∮p dv', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['Otto', `${fig(100 * c.etaO)}%`], ['Diesel', `${fig(100 * c.etaD)}%`], ['r', fig(state.r)], ['cutoff', fig(state.rc)]]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Real engines lose heat to the cylinder walls, burn over a finite time, pump air in and out, and their gas has a k that falls as it heats: real efficiencies are well below these.`;
    return { title: 'Same r: Otto wins. Higher r: Diesel wins', body: `At r = ${fig(state.r)} the Otto cycle gives ${fig(100 * c.etaO)}% and the Diesel ${fig(100 * c.etaD)}%: adding heat at constant pressure, as the piston moves, wastes some expansion. But a diesel compresses air alone and can run at r = 18 (${fig(100 * cyclesClosed({ r: 18, rc: state.rc }).etaD)}%), where a petrol engine’s fuel–air mixture would knock. ${leavesOut}` };
  },
  app: false,
});

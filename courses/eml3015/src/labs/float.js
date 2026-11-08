import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, dot, label, line, plotIn, poly, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { BARGE, floatChecked, rightingArm } from '@flux/subjects/mechanics/floating.js';

/**
* Floating: a box barge with sliders for its width and the height of its centre of gravity, heeled
 * to 15° with G, B and the metacentre M drawn, beside its righting arm against heel.
 *
 * Shows that a body does not need G below B to float upright: a 4 m barge with G 1.5 m above the keel,
 * far above B at 0.25 m, has its metacentre at 2.9 m and GM = 1.4 m, very stable. Narrow it to 3 m and
 * raise G a little and it capsizes. The metacentric height is checked by tilting the section, finding
 * the new waterline, and reading the righting arm (packages/subjects/src/mechanics/floating.js).
 */
const SCENARIOS = [
  { id: 'wide', name: 'Wide barge, G well above B', b: 4, KG: 1.5 },
  { id: 'tall', name: '3 m wide, G at 1.6 m', b: 3, KG: 1.6 },
  { id: 'narrow', name: 'Narrow, G at 1 m', b: 1.5, KG: 1 },
  { id: 'ballast', name: 'Narrow, ballasted to 0.5 m', b: 1.5, KG: 0.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, b: sc.b, KG: sc.KG });
}

const KEYS = [['fl-b', 'b'], ['fl-g', 'KG']];

function square(r) {
  const s = Math.min(r.x1 - r.x0, r.y1 - r.y0);
  const cx = (r.x0 + r.x1) / 2;
  const cy = (r.y0 + r.y1) / 2;
  return { ...r, x0: cx - s / 2, x1: cx + s / 2, y0: cy - s / 2, y1: cy + s / 2 };
}

function section(B, rect, state, c) {
  const phi = (15 * Math.PI) / 180;
  const r = rightingArm(state, phi);
  const P = plotIn(B, square(rect), { lo: -3, hi: 3 }, { lo: -1.5, hi: 4.5 });
  axes(P, { xLabel: 'm', yLabel: 'm' });
  poly(P, [[-3, -1.5], [3, -1.5], [3, r.wl], [-3, r.wl]], { fill: alpha(C.blue, 0.12), stroke: null });
  seg(P, [-3, r.wl], [3, r.wl], { color: alpha(C.blue, 0.8), width: 1.5 });
  line(P, [...r.sec, r.sec[0]], { color: C.text, width: 2 });
  poly(P, r.sub, { fill: alpha(C.blue, 0.35), stroke: null });
  const M = [-c.KM * Math.sin(phi), c.KM * Math.cos(phi)];
  seg(P, [0, 0], [-4.4 * Math.sin(phi), 4.4 * Math.cos(phi)], { color: alpha(C.muted, 0.7), width: 1, dash: [4, 4] });
  seg(P, r.B, [r.B[0], 4.4], { color: alpha(C.blue, 0.7), width: 1, dash: [3, 3] });
  dot(P, ...r.G, { color: C.red, r: 6 });
  dot(P, ...r.B, { color: C.blue, r: 6 });
  dot(P, ...M, { color: C.gold, r: 6, ring: C.text });
  label(P, 'G', r.G, { color: C.red, align: 'left', dx: 8 });
  label(P, 'B', r.B, { color: C.blue, align: 'left', dx: 8 });
  label(P, 'M', M, { color: C.gold, align: 'right', dx: -8 });
}

function arm(B, rect, state, c) {
  const angs = Array.from({ length: 61 }, (_, i) => i);
  const pts = angs.map((a) => [a, a === 0 ? 0 : rightingArm(state, (a * Math.PI) / 180).GZ]);
  const lo = Math.min(-0.3, ...pts.map((p) => p[1])) * 1.1;
  const hi = Math.max(0.3, ...pts.map((p) => p[1])) * 1.15;
  const P = plotIn(B, rect, { lo: 0, hi: 60 }, { lo, hi });
  axes(P, { xLabel: 'heel angle (degrees)', yLabel: 'righting arm GZ (m)' });
  seg(P, [0, 0], [60, 0], { color: alpha(C.text, 0.4), width: 1 });
  line(P, pts, { color: c.stable ? C.green : C.red, width: 2.5 });
  const t = Math.min(30, 57.3 * Math.abs(hi / (c.GM || 1)));
  seg(P, [0, 0], [t, (c.GM * t) / 57.3], { color: alpha(C.gold, 0.8), width: 1.5, dash: [5, 4] });
  label(P, `slope GM = ${fig(c.GM)} m`, [t, (c.GM * t) / 57.3], { color: C.gold, align: 'left', dx: 6 });
}

export default defineLab({
  id: 'float',
  exam: 'u2',
  title: 'Floating',
  hint: 'Raise G on the wide barge until GM changes sign. Then narrow the barge.',
  gapLimit: 1e-8,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('wide', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'KG', lo: 0.3, hi: 2.4 }),
  controls() {
    return `
      ${slider('fl-b', "Width b (m)", 4, 1, 4, 0.05)}
      ${slider('fl-g', "Centre of gravity above the keel, KG (m)", 1.5, 0.3, 2.4, 0.05)}
      <p class="tiny">A box 6 m long and 2.5 m deep with a mass of 12 t, in fresh water. Left: its cross-section heeled 15°, with the submerged part shaded, G (red), the shifted centre of buoyancy B (blue) and the metacentre M (gold). Right: the righting arm GZ against heel; its slope at zero is GM.</p>`;
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
    return floatChecked(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      section(B, B.free, state, c);
      return;
    }
    const a = wide ? { ...B.free, x1: B.free.x0 + 0.55 * W } : { ...B.free, y1: B.free.y0 + 0.55 * H };
    const b = wide ? { ...B.free, x0: a.x1 } : { ...B.free, y0: a.y1 };
    section(B, a, state, c);
    arm(B, b, state, c);
  },
  law: () => [String.raw`\overline{BM} = \frac{I_\text{wp}}{V_\text{sub}} = \frac{b^2}{12\,d}`, String.raw`\overline{GM} = \overline{KB} + \overline{BM} - \overline{KG} > 0\ \text{(stable)}`],
  liveRows(state, c) {
    return [
      kv('Draft', `${fig(c.d)} m`),
      kv('KB, BM, KM', `${fig(c.KB)}, ${fig(c.BM)}, ${fig(c.KM)} m`),
      kv('KG', `${fig(state.KG)} m`),
      kv('GM', `${fig(c.GM)} m, ${c.stable ? 'stable' : 'unstable'}`),
      kv('Formula against the tilted section', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([['GM', `${fig(c.GM)} m`], ['KM', `${fig(c.KM)} m`], ['KG', `${fig(state.KG)} m`], ['upright', c.stable ? 'stable' : 'capsizes']]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Liquid sloshing inside a hull shifts G as it heels, the free-surface effect, which lowers the effective GM; and at large angles the deck edge goes under and the righting arm falls.`;
    if (!c.stable) return { title: 'M below G: it capsizes', body: `The metacentre is ${fig(c.KM)} m above the keel, below G at ${fig(state.KG)} m: GM = ${fig(c.GM)} m. Heeled, the buoyancy acts on the wrong side of G and turns it further. Widen the barge or lower the weight. ${leavesOut}` };
    if (state.KG > c.KB) return { title: 'G above B, and still stable', body: `G sits ${fig(state.KG - c.KB)} m above B, but heeling swings B toward the low side so far that the metacentre is at ${fig(c.KM)} m: GM = ${fig(c.GM)} m. That is how every ship floats. ${leavesOut}` };
    return { title: 'Stable, with G below B', body: `G is below B, so the barge rights itself whatever its width: GM = ${fig(c.GM)} m. ${leavesOut}` };
  },
  app: false,
});

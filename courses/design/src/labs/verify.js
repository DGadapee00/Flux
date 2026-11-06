import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, sceneIn, seg, split } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { AL6061, bracketClosed, bracketNumeric } from '@flux/subjects/design/verify.js';

/**
 * Verification: a 6061-T6 aluminium bracket arm checked for strength and stiffness, by analysis and by
 * a test on its real mount.
 *
 * Shows that a margin on paper holds only as far as its assumptions do. The analysis takes the root
 * as rigid; a test measures the mount's own give, which can turn a stiffness margin negative while the
 * analysis still passes. Tip deflection is checked by integrating the curvature twice, and the load
 * that first yields the root by bisection (packages/subjects/src/design/verify.js).
 */
const L = 100;
const B_ = 20;
const LIMIT = 1; // mm, allowed tip deflection

const SCENARIOS = [
  { id: 'block', name: 'Bolted to a stiff block', P: 100, h: 8, logk: 8, FS: 1.5 },
  { id: 'sheet', name: 'Bolted to thin sheet', P: 100, h: 8, logk: 6.2, FS: 1.5 },
  { id: 'thin', name: 'A thinner arm', P: 100, h: 4, logk: 8, FS: 1.5 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, P: sc.P, h: sc.h, logk: sc.logk, FS: sc.FS });
}

const spec = (s) => ({ P: s.P, L, b: B_, h: s.h, FS: s.FS, limit: LIMIT, ktheta: 10 ** s.logk });
const ms = (v) => `${v >= 0 ? '+' : ''}${fig(v)}`;

export default defineLab({
  id: 'verify',
  exam: 'u3',
  title: 'Verification',
  hint: 'Move the bracket from a stiff block to thin sheet: the analysis does not change, but the test does. Every margin rests on an assumption.',
  gapLimit: 1e-6,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('block', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'P', lo: 25, hi: 250 }),
  controls() {
    return `
      ${slider('ve-P', 'tip load P (N)', 100, 25, 250, 5)}
      ${slider('ve-h', 'arm thickness h (mm)', 8, 3, 10, 0.1)}
      ${slider('ve-k', 'mount stiffness, log₁₀ kθ (N·mm/rad)', 8, 4.5, 9, 0.1)}
      ${slider('ve-F', 'factor of safety on strength', 1.5, 1, 2.5, 0.05)}
      <p class="tiny">Arm 100 mm long and 20 mm wide, 6061-T6 aluminium: E = 68 GPa, minimum yield 241 MPa. Tip deflection must stay under 1 mm.</p>`;
  },
  bind(api) {
    bindSlider('ve-P', (s, v) => { s.P = v; }, api);
    bindSlider('ve-h', (s, v) => { s.h = v; }, api);
    bindSlider('ve-k', (s, v) => { s.logk = v; }, api);
    bindSlider('ve-F', (s, v) => { s.FS = v; }, api);
  },
  syncControls(state) {
    for (const [id, val] of [['ve-P', state.P], ['ve-h', state.h], ['ve-k', state.logk], ['ve-F', state.FS]]) {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    }
  },
  compute(state) {
    const p = spec(state);
    const a = bracketClosed(p);
    const n = bracketNumeric(p);
    const gap = Math.max(Math.abs(n.tip - a.tipTest) / a.tipTest, Math.abs(n.pYield - a.pYield) / a.pYield);
    return { ...a, ktheta: p.ktheta, gap, hidden: a.msDeflAnalysis >= 0 && a.msDeflTest < 0 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const [top, bottom] = split(B.free, 0.5);
    const scale = 12 / Math.max(LIMIT, c.tipTest); // exaggerate deflection for the drawing
    const S = sceneIn(B, top, { x0: -18, x1: L + 12, y0: -24, y1: 14 }, 12);
    poly(S, [[-14, -16], [0, -16], [0, 12], [-14, 12]], { fill: alpha(C.muted, 0.3), stroke: C.muted });
    label(S, `mount, kθ = 10^${fig(state.logk)}`, [-7, 12], { color: C.muted, dy: -8 });
    const shape = (withRoot) => Array.from({ length: 41 }, (_, i) => {
      const x = (i / 40) * L;
      const bend = (state.P * x * x * (3 * L - x)) / (6 * AL6061.E * c.I);
      const root = withRoot ? ((state.P * L) / c.ktheta) * x : 0;
      return [x, -scale * (bend + root)];
    });
    line(S, [[0, 0], [L, 0]], { color: alpha(C.text, 0.25), width: 1, dash: [3, 3] });
    line(S, shape(false), { color: C.teal, width: 2, dash: [6, 4] });
    line(S, shape(true), { color: C.gold, width: 3 });
    seg(S, [L - 4, -scale * LIMIT], [L + 4, -scale * LIMIT], { color: C.red, width: 2 });
    label(S, '1 mm limit', [L + 4, -scale * LIMIT], { color: C.red, align: 'left', dx: 4 });
    label(S, 'analysis', [L * 0.55, -scale * c.tipRigid * 0.45], { color: C.teal, dy: -10 });
    label(S, 'test', [L * 0.55, -scale * c.tipTest * 0.45], { color: C.gold, dy: 14 });
    // Margins.
    const bars = [['strength', c.msStrength], ['stiffness, analysis', c.msDeflAnalysis], ['stiffness, test', c.msDeflTest]];
    const lo = Math.min(-0.5, ...bars.map(([, v]) => v)) * 1.15;
    const hi = Math.max(0.5, ...bars.map(([, v]) => v)) * 1.15;
    const P = plotIn(B, bottom, { lo: 0, hi: 3 }, { lo, hi }, { left: 52, right: 14, top: 18, bottom: 30 });
    axes(P, { yLabel: 'margin of safety', xFmt: () => '' });
    seg(P, [0, 0], [3, 0], { color: alpha(C.text, 0.7), width: 1.5 });
    bars.forEach(([name, v], i) => {
      const col = v >= 0 ? C.teal : C.red;
      poly(P, [[i + 0.2, 0], [i + 0.8, 0], [i + 0.8, v], [i + 0.2, v]], { fill: alpha(col, 0.55), stroke: col });
      label(P, name, [i + 0.5, lo], { color: C.muted, dy: 12 });
      label(P, ms(v), [i + 0.5, v], { color: col, dy: v >= 0 ? -9 : 11, bold: true });
    });
  },
  law: () => [String.raw`\sigma = \frac{6PL}{bh^2},\quad \delta = \frac{PL^3}{3EI} + \frac{PL^2}{k_\theta}`, String.raw`\text{MS} = \frac{\text{allowable}}{\text{FS} \times \text{applied}} - 1`],
  liveRows(state, c) {
    return [
      kv('root stress', `${fig(c.stress)} MPa`),
      kv('tip deflection, analysis', `${fig(c.tipRigid)} mm`),
      kv('tip deflection, test', `${fig(c.tipTest)} mm`),
      kv('load that first yields the root', `${fig(c.pYield)} N`),
      kv('closed form against integration', `${fig(c.gap * 100)}%`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['strength MS', ms(c.msStrength)],
      ['stiffness MS, analysis', ms(c.msDeflAnalysis)],
      ['stiffness MS, test', ms(c.msDeflTest)],
      ['verdict', c.msStrength >= 0 && c.msDeflTest >= 0 ? 'passes' : 'fails'],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> A static load at the tip and a uniform arm. Real brackets see vibration, so fatigue, and stress concentrates at the root's corner and bolt holes.`;
    let title = 'Analysis and test agree';
    let body = String.raw`On a stiff mount the arm deflects ${fig(c.tipTest)} mm, as the analysis predicts. Strength margin ${ms(c.msStrength)}, stiffness margin ${ms(c.msDeflTest)}.`;
    if (c.hidden) {
      title = 'The paper margin hid a failure';
      body = String.raw`The analysis assumes a rigid root and gives ${fig(c.tipRigid)} mm, a margin of ${ms(c.msDeflAnalysis)}. The test on this mount shows ${fig(c.tipTest)} mm: the mount turns, and the margin is ${ms(c.msDeflTest)}. Only a test, or an analysis of the mount itself, would catch it.`;
    } else if (c.msStrength < 0) {
      title = 'Not strong enough';
      body = String.raw`The root stress is ${fig(c.stress)} MPa against a minimum yield of 241 MPa with a factor of ${fig(state.FS)}: margin ${ms(c.msStrength)}. Thickening the arm helps as h²: stress falls as the square of the thickness.`;
    }
    return { title, body: `${body} ${leavesOut}` };
  },
  app: false,
});

import { M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import { holeInStrip, kirsch, ktEllipse, ktStrip, ktTip } from '@flux/subjects/mechanics/deformation.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, arrow, axes, begin, chartIn, circle, dot, hidden, label, line, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, showField, slider } from './widgets.js';

/**
 * Shows that the peak stress at an opening is set by how sharp it is across the load, not by its
 * size: a 2 in crack in a skin panel concentrates the stress dozens of times, and a 0.098 in hole
 * drilled at each tip, the mechanic's stop-drill, cuts that to a few. A round hole in a wide plate
 * is always 3, at any size. A bolt hole in a narrow bar is less than 3 on the net section.
 *
 * Cited: number 40 and number 30 drills are 0.098 in and 0.1285 in (the number-drill series);
 * stop-drilling a crack tip with one of them is standard sheet-metal repair practice. A 3/4 in
 * bolt takes a 13/16 in standard hole (AISC Specification, Table J3.3). The skin stress, the
 * crack length, the sharp-crack tip radius and the bar's load are assumed. Recompute: Inglis's
 * 1 + 2√(a/ρ), Kirsch for the round hole, Heywood's fit on a strip. Second method: the ellipse
 * form 1 + 2a/b with b = √(aρ), and Kirsch evaluated at the edge.
 */

const IN = M_PER_IN;
const KSI = 1000 * PA_PER_PSI;
const KIP = 1000 * N_PER_LBF;
const SHARP = 0.001 * IN;
const DRILL40 = 0.098 * IN;
const DRILL30 = 0.1285 * IN;
const OUT = 'The plate is elastic and thin, and the crack is an ellipse in the limit. A real crack tip is ragged, and the visible end is not the true tip, which is why the drill goes a little past it. Aluminium yields in a small zone at a sharp tip, so the elastic peak overstates the stress but correctly ranks the danger. A stop hole slows a fatigue crack; it does not repair it, and the panel still needs a patch.';

const SCENARIOS = [
  { id: 'crack', name: 'A 2 in crack in a skin panel', mode: 'crack', S: 10 * KSI, a: 1 * IN, rho: SHARP },
  { id: 'drill40', name: 'Stop-drilled with a #40 drill', mode: 'crack', S: 10 * KSI, a: 1 * IN, rho: DRILL40 / 2 },
  { id: 'hole', name: 'A round hole in a wide skin', mode: 'hole', S: 10 * KSI, a: 0.25 * IN, rho: 0.25 * IN },
  { id: 'bolt', name: 'A bolt hole in a flat bar', mode: 'bolt', S: 10 * KSI, a: (13 / 32) * IN, rho: (13 / 32) * IN, P: 5 * KIP },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, mode: sc.mode, S: sc.S, a: sc.a, rho: sc.rho, P: sc.P ?? 10 * KIP, bar: null });
}

/** The flat bar: 2 in by 1/4 in A36, a 13/16 in standard hole for a 3/4 in bolt. */
const BAR = { w: 2 * IN, t: 0.25 * IN, d: (13 / 16) * IN };

/** The bar in use: the cited one, unless a problem has set its own as state.bar. */
const barOf = (state) => state.bar || BAR;

export function peakAt(state) {
  if (state.mode === 'bolt') {
    const b = barOf(state);
    const h = holeInStrip(state.P, b.w, b.d, b.t);
    const second = ktStrip(b.d, b.w) * (state.P / ((b.w - b.d) * b.t));
    return { Kt: h.Kt, nominal: h.net, peak: h.peak, gap: Math.abs(second - h.peak) / h.peak, gross: h.gross };
  }
  const a = Math.max(state.a, 1e-6);
  const rho = Math.min(Math.max(state.rho, 1e-7), a);
  const Kt = ktTip(a, rho);
  // Second method: the same ellipse written with its half-width b = √(aρ); for a circle, Kirsch at the edge.
  const second = state.mode === 'hole' ? kirsch(1, a, a, 90).st : ktEllipse(a, Math.sqrt(a * rho));
  return { Kt, nominal: state.S, peak: Kt * state.S, gap: Math.abs(second - Kt) / Kt, gross: state.S };
}

function member(B, rect, state, c, veiled) {
  if (state.mode === 'bolt') {
    const S = sceneIn(B, rect, { x0: -2.6, x1: 2.6, y0: -1.6, y1: 1.6 }, 14);
    const bar = barOf(state);
    const w = bar.w / IN;
    poly(S, [[-1.8, -w / 2], [1.8, -w / 2], [1.8, w / 2], [-1.8, w / 2]], { fill: alpha(C.text, 0.1), stroke: C.text, width: 1.5 });
    circle(S, [0, 0], bar.d / IN / 2, { stroke: C.text, width: 1.5 });
    arrow(S, [1.8, 0], 0, 24, { color: C.pink });
    arrow(S, [-1.8, 0], Math.PI, 24, { color: C.pink });
    if (!veiled) {
      dot(S, 0, bar.d / IN / 2, { color: C.gold, r: 5 });
      label(S, `peak ${fig(c.peak / KSI)} ksi`, [0, w / 2], { color: C.gold, dy: -12 });
      label(S, state.bar ? `${fig(bar.w * 1000)} × ${fig(bar.t * 1000)} mm bar, ${fig(bar.d * 1000)} mm hole` : '2 in × 1/4 in bar, 13/16 in hole', [0, -w / 2], { color: C.dim, dy: 16 });
    }
    return;
  }
  const a = state.a / IN;
  const span = Math.max(1.6, 1.6 * a);
  const S = sceneIn(B, rect, { x0: -span, x1: span, y0: -0.75 * span, y1: 0.75 * span }, 14);
  poly(S, [[-span, -0.6 * span], [span, -0.6 * span], [span, 0.6 * span], [-span, 0.6 * span]], { fill: alpha(C.text, 0.08), stroke: C.muted });
  if (state.mode === 'hole') {
    circle(S, [0, 0], a, { stroke: C.text, width: 1.5 });
  } else {
    seg(S, [-a, 0], [a, 0], { color: C.text, width: 2 });
    const r = state.rho / IN;
    if (r > 0.01) for (const x of [-a, a]) circle(S, [x, 0], r, { stroke: C.text, width: 1.5 });
  }
  // The far-field load, up and down.
  for (const x of [-0.6 * span, 0, 0.6 * span]) {
    arrow(S, [x, 0.6 * span], Math.PI / 2, 22, { color: C.pink, width: 2 });
    arrow(S, [x, -0.6 * span], -Math.PI / 2, 22, { color: C.pink, width: 2 });
  }
  if (!veiled) {
    dot(S, a, 0, { color: C.gold, r: 5 });
    label(S, `${fig(c.peak / KSI)} ksi`, [a, 0], { color: C.gold, dx: 10, dy: -12, align: 'left' });
    label(S, `far field ${fig(state.S / KSI)} ksi`, [0, 0.6 * span], { color: C.pink, dy: -28 });
  }
}

export default defineLab({
  id: 'crack',
  exam: 'u3',
  title: 'Stop-drilled crack',
  app: true,
  hint: 'The peak is Kt times the nominal stress. Kt = 1 + 2√(a/ρ): a sharp crack is huge, a drilled tip is small, a round hole is 3.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('crack', s);
    return s;
  },
  applyScenario: apply,
  sweep: (state) => (state.mode === 'bolt'
    ? { key: 'P', lo: 1 * KIP, hi: 20 * KIP }
    : { key: 'S', lo: 2 * KSI, hi: 20 * KSI }),
  controls() {
    return `
      ${slider('ck-s', 'far-field stress (ksi)', 10, 2, 20, 0.5)}
      ${slider('ck-a', 'crack half-length or hole radius (in)', 1, 0.1, 2, 0.05)}
      ${slider('ck-r', 'tip radius (in)', 0.049, 0.001, 0.25, 0.001)}
      ${slider('ck-p', 'bar load (kip)', 5, 1, 20, 0.5)}
      <p class="tiny">Cited: #40 drill 0.098 in, #30 drill 0.1285 in; 13/16 in standard hole for a 3/4 in bolt (AISC Table J3.3). The skin stress, the crack, the sharp tip radius (0.001 in) and the bar load are assumed.</p>`;
  },
  bind(api) {
    bindSlider('ck-s', (s, v) => { s.S = v * KSI; }, api);
    bindSlider('ck-a', (s, v) => { s.a = v * IN; if (s.mode === 'hole') s.rho = s.a; }, api);
    bindSlider('ck-r', (s, v) => { if (s.mode === 'crack') s.rho = v * IN; }, api);
    bindSlider('ck-p', (s, v) => { s.P = v * KIP; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('ck-s', state.S / KSI);
    set('ck-a', state.a / IN);
    set('ck-r', state.rho / IN);
    set('ck-p', state.P / KIP);
    showField('ck-s', state.mode !== 'bolt');
    showField('ck-a', state.mode !== 'bolt');
    showField('ck-r', state.mode === 'crack');
    showField('ck-p', state.mode === 'bolt');
  },
  compute(state) {
    const r = peakAt(state);
    return { ...r, a: state.a, rho: state.rho, aIn: state.a / IN, rhoIn: state.rho / IN };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.46);
    member(B, D, state, c, veiled);
    if (veiled) return;
    if (state.mode === 'bolt') {
      const P = chartIn(B, R, { lo: 0.05, hi: 0.6 }, { lo: 2, hi: 3.05 });
      axes(P, { xLabel: 'hole diameter / bar width', yLabel: 'Kt on the net section' });
      const pts = [];
      for (let i = 0; i <= 50; i++) {
        const r = 0.05 + (0.55 * i) / 50;
        pts.push([r, ktStrip(r, 1)]);
      }
      line(P, pts, { color: C.gold, width: 3 });
      dot(P, barOf(state).d / barOf(state).w, c.Kt, { color: C.gold, r: 5 });
      return;
    }
    // Kt against the tip radius, for this crack length, on a log-like scale of ρ/a.
    const a = state.a;
    const P = chartIn(B, R, { lo: -3, hi: 0 }, { lo: 0, hi: Math.max(70, c.Kt * 1.1) });
    axes(P, { xLabel: 'log₁₀(tip radius / half-length)', yLabel: 'Kt' });
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const x = -3 + (3 * i) / 60;
      pts.push([x, ktTip(1, 10 ** x)]);
    }
    line(P, pts, { color: C.gold, width: 3 });
    line(P, [[-3, 3], [0, 3]], { color: C.teal, width: 1.5, dash: [6, 4] });
    // The two stop-drill sizes, for comparison.
    for (const r of [DRILL40 / 2, DRILL30 / 2]) {
      const x = Math.log10(Math.min(r / a, 1));
      if (x >= -3) dot(P, x, ktTip(a, r), { color: C.teal, r: 4 });
    }
    dot(P, Math.max(-3, Math.log10(Math.min(state.rho / a, 1))), c.Kt, { color: C.gold, r: 6 });
  },
  law: () => [String.raw`K_t = 1 + 2\sqrt{a/\rho}`],
  liveRows(state, c) {
    return [
      kv('Kt', fig(c.Kt)),
      kv('nominal', `${fig(c.nominal / KSI)} ksi`),
      kv('peak', `${fig(c.peak / KSI)} ksi`),
      state.mode === 'bolt' ? kv('gross stress', `${fig(c.gross / KSI)} ksi`) : kv('tip radius', `${fig(c.rhoIn)} in`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['Kt', fig(c.Kt)],
      ['peak', `${fig(c.peak / KSI)} ksi`],
      ['nominal', `${fig(c.nominal / KSI)} ksi`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: state.mode === 'bolt' ? 'A bolt hole in a flat bar' : state.mode === 'hole' ? 'A round hole: always 3' : 'Sharpness sets the peak',
    body: state.mode === 'bolt'
      ? String.raw`The hole takes ${fig((100 * barOf(state).d) / barOf(state).w)}% of the width. On the net section the stress is ${fig(c.nominal / KSI)} ksi and Kt is ${fig(c.Kt)}, so the edge of the hole sees ${fig(c.peak / KSI)} ksi.`
      : state.mode === 'hole'
        ? String.raw`A round hole of any size in a wide plate triples the stress at its edge: ${fig(c.peak / KSI)} ksi from ${fig(state.S / KSI)} ksi. Size only sets how far the raised stress reaches.`
        : String.raw`A crack ${fig((2 * state.a) / IN)} in long with a tip radius of ${fig(c.rhoIn)} in has Kt = ${fig(c.Kt)}: the tip sees ${fig(c.peak / KSI)} ksi. A #40 drill at each tip makes the radius 0.049 in and Kt ${fig(ktTip(state.a, DRILL40 / 2))}.`,
  })),
});

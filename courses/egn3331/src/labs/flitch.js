import { compositeRects } from '@flux/subjects/mechanics/bending.js';
import { JOIST_B_IN, JOIST_DEAD_PSF, JOIST_E_PSI, JOIST_FB_PSI, JOIST_H_IN, JOIST_LIVE_PSF } from '../data/joist.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, chartIn, circle, dot, hidden, label, line, panes, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows that in a beam of two materials bolted to bend together, the stiff one takes the moment:
 * a 3/8 in steel plate between two 2×10s carries about seven tenths of it, and the wood stress
 * falls from 2,750 psi to under 800. Both share one curvature, so stress jumps by n = Es/Ew at the
 * glue line, about 21 here, while the strain runs straight through.
 *
 * Cited: two No. 2 Southern Pine 2×10s, dressed 1.5 × 9.25 in, E = 1,400,000 psi, Fb 920 psi
 * (src/data/joist.js); 40 psf live and 10 psf dead floor load (the same table). The plate is
 * ASTM A36, E = 29,000 ksi (AISC), 36 ksi yield. The span, the floor width the beam carries and
 * the plate thickness are assumed. Recompute: the transformed section. Second method: Σ EiIi about
 * the shared axis, the moment shared as EiIi/ΣEI, and the sag by a unit-load integral.
 */

const EW = JOIST_E_PSI;
const ES = 29e6;
const SY = 36e3;
const H = JOIST_H_IN;
const PSF = JOIST_LIVE_PSF + JOIST_DEAD_PSF;
const OUT = 'The bolts are rigid and the parts never slip, so one curvature fits all three. Real bolts sit in oversize holes and the wood crushes a little around them, so the plate picks up its share only after some slip. Wood creeps under a long load; the steel does not, so the plate\'s share grows over the years. The 920 psi Fb is the table\'s value for joists side by side; a lone beam gets 800 psi. Bearing at the ends, the bolt spacing and lateral bracing are separate checks.';

const SCENARIOS = [
  { id: 'flitch', name: '3/8 in plate between two 2×10s', L: 14, trib: 8, tp: 0.375 },
  { id: 'wood', name: 'The two 2×10s alone', L: 14, trib: 8, tp: 0 },
  { id: 'thick', name: '1/2 in plate', L: 14, trib: 8, tp: 0.5 },
  { id: 'long', name: '16 ft span, 3/8 in plate', L: 16, trib: 8, tp: 0.375 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, L: sc.L, trib: sc.trib, tp: sc.tp });
}

/** Inch-pound throughout: psi, in, lbf. */
export function flitchBeam(state) {
  const tp = Math.max(Number(state.tp) || 0, 0);
  const Lin = (Number(state.L) || 14) * 12;
  const wPlf = (Number(state.trib) || 0) * PSF;
  const w = wPlf / 12;
  const wLive = ((Number(state.trib) || 0) * JOIST_LIVE_PSF) / 12;
  const M = (w * Lin * Lin) / 8;
  const rects = [{ b: 2 * JOIST_B_IN, h: H, E: EW, y0: 0 }];
  if (tp > 0) rects.push({ b: tp, h: H, E: ES, y0: 0 });
  const sec = compositeRects(rects, EW);
  const wood = Math.abs(sec.stress(M, 0, H));
  const steel = tp > 0 ? Math.abs(sec.stress(M, 1, H)) : 0;
  const share = tp > 0 ? sec.parts[1].share : 0;
  const EI = sec.EI;
  const sag = (5 * wLive * Lin ** 4) / (384 * EI);
  // Second method: Σ EI by hand, each part's stress from the shared curvature M/ΣEI.
  const EIw = (EW * 2 * JOIST_B_IN * H ** 3) / 12;
  const EIs = (ES * tp * H ** 3) / 12;
  const k = M / (EIw + EIs);
  const wood2 = EW * k * (H / 2);
  const steel2 = ES * k * (H / 2);
  // The live-load sag by the unit-load method: ∫ M m / EI dx, Simpson's rule.
  const n = 200;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const x = (Lin * i) / n;
    const Mx = (wLive * x * (Lin - x)) / 2;
    const m = x <= Lin / 2 ? x / 2 : (Lin - x) / 2;
    sum += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Mx * m;
  }
  const sag2 = (sum * (Lin / n)) / 3 / (EIw + EIs);
  const gap = Math.max(
    Math.abs(wood2 - wood) / Math.max(wood, 1),
    tp > 0 ? Math.abs(steel2 - steel) / steel : 0,
    tp > 0 ? Math.abs(EIs / (EIw + EIs) - share) : 0,
    Math.abs(sag2 - sag) / Math.max(sag, 1e-12),
    Math.abs(EI - (EIw + EIs)) / EI,
  );
  return {
    M, Mft: M / 12, wPlf, wood, steel, share, sag, limit: Lin / 360, n: ES / EW, EI, tp, gap,
    woodRatio: wood / JOIST_FB_PSI, steelRatio: steel / SY,
  };
}

function member(B, rect, state, c, veiled) {
  const tp = c.tp;
  const W = 2 * JOIST_B_IN + tp;
  const S = sceneIn(B, rect, { x0: -W / 2 - 0.6, x1: W / 2 + 5.8, y0: -1.6, y1: H + 1.4 }, 12);
  const boards = [[-W / 2, -W / 2 + JOIST_B_IN], [W / 2 - JOIST_B_IN, W / 2]];
  for (const [a, b] of boards) poly(S, [[a, 0], [b, 0], [b, H], [a, H]], { fill: alpha(C.gold, 0.18), stroke: C.gold });
  if (tp > 0) poly(S, [[-tp / 2, 0], [tp / 2, 0], [tp / 2, H], [-tp / 2, H]], { fill: alpha(C.teal, 0.45), stroke: C.teal });
  // The through-bolt.
  seg(S, [-W / 2 - 0.35, H / 2], [W / 2 + 0.35, H / 2], { color: C.muted, width: 2 });
  circle(S, [-W / 2 - 0.35, H / 2], 0.15, { stroke: C.muted, fill: C.muted });
  circle(S, [W / 2 + 0.35, H / 2], 0.15, { stroke: C.muted, fill: C.muted });
  // Stress across the depth, one scale for both: wood beside steel.
  const big = Math.max(c.wood, c.steel, 1);
  const k = 1.15 / big;
  const x0w = W / 2 + 1.75;
  const x0s = W / 2 + 4.4;
  const prof = (x0, s, color) => {
    poly(S, [[x0, H / 2], [x0 + k * s, H], [x0, H], [x0, 0], [x0 - k * s, 0]], { fill: alpha(color, 0.25), stroke: color });
    seg(S, [x0, -0.2], [x0, H + 0.2], { color: alpha(C.text, 0.4), width: 1 });
  };
  prof(x0w, c.wood, C.gold);
  if (tp > 0) prof(x0s, c.steel, C.teal);
  if (!veiled) {
    label(S, `${fig(c.wood)} psi`, [x0w, H], { color: C.gold, dy: -12 });
    if (tp > 0) label(S, `${fig(c.steel / 1000)} ksi`, [x0s, 0], { color: C.teal, dy: 14 });
    label(S, tp > 0 ? `${fig(tp)} in plate` : 'no plate', [0, 0], { color: C.dim, dy: 14 });
  }
}

export default defineLab({
  id: 'flitch',
  exam: 'u6',
  title: 'Flitch beam',
  app: true,
  hint: 'Bolted parts share one curvature, so each takes moment in proportion to its EI. Stress jumps by n = Es/Ew where wood meets steel.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('flitch', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'tp', lo: 0, hi: 0.75 }),
  controls() {
    return `
      ${slider('fl-t', 'plate thickness (in)', 0.375, 0, 0.75, 0.0625)}
      ${slider('fl-l', 'span (ft)', 14, 8, 20, 0.5)}
      ${slider('fl-w', 'floor width carried (ft)', 8, 2, 14, 0.5)}
      <p class="tiny">Cited: No. 2 Southern Pine 2×10, 1.5 × 9.25 in, E = 1,400,000 psi, Fb 920 psi (AWC, 2013 values); floor 40 psf live + 10 psf dead. A36 plate, E = 29,000 ksi, 36 ksi yield. Span, floor width and plate are assumed.</p>`;
  },
  bind(api) {
    bindSlider('fl-t', (s, v) => { s.tp = v; }, api);
    bindSlider('fl-l', (s, v) => { s.L = v; }, api);
    bindSlider('fl-w', (s, v) => { s.trib = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('fl-t', state.tp);
    set('fl-l', state.L);
    set('fl-w', state.trib);
  },
  compute(state) {
    return flitchBeam(state);
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.5);
    member(B, D, state, c, veiled);
    if (veiled) return;
    const top = Math.max(flitchBeam({ ...state, tp: 0 }).wood * 1.1, JOIST_FB_PSI * 1.3);
    const P = chartIn(B, R, { lo: 0, hi: 0.75 }, { lo: 0, hi: top });
    axes(P, { xLabel: 'plate thickness (in)', yLabel: 'wood bending stress (psi)' });
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = (0.75 * i) / 48;
      pts.push([t, flitchBeam({ ...state, tp: t }).wood]);
    }
    line(P, pts, { color: C.gold, width: 3 });
    line(P, [[0, JOIST_FB_PSI], [0.75, JOIST_FB_PSI]], { color: C.yellow, width: 1.5, dash: [6, 4] });
    dot(P, c.tp, c.wood, { color: C.gold, r: 5 });
  },
  law: () => [
    String.raw`\sigma_i = \frac{E_i\,M\,y}{\sum E_jI_j}`,
    String.raw`n=\frac{E_s}{E_w}=${fig(ES / EW)}`,
  ],
  liveRows(state, c) {
    return [
      kv('moment at midspan', `${fig(c.Mft)} lbf·ft`),
      kv('wood stress', `${fig(c.wood)} psi (${fig(100 * c.woodRatio)}% of 920)`),
      c.tp > 0 ? kv('plate stress', `${fig(c.steel / 1000)} ksi (${fig(100 * c.steelRatio)}% of yield)`) : '',
      c.tp > 0 ? kv('plate\'s share of the moment', `${fig(100 * c.share)}%`) : '',
      kv('live-load sag', `${fig(c.sag)} in (limit ${fig(c.limit)})`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['wood', `${fig(c.wood)} psi`],
      ['plate', c.tp > 0 ? `${fig(c.steel / 1000)} ksi` : 'none'],
      ['plate share', `${fig(100 * c.share)}%`],
      ['sag', `${fig(c.sag)} in`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: c.tp > 0 ? 'The plate takes the moment' : 'Two 2×10s are not enough',
    body: c.tp > 0
      ? String.raw`The ${fig(c.tp)} in plate is a small part of the section but ${fig(c.n)} times stiffer than pine, so it carries ${fig(100 * c.share)}% of the ${fig(c.Mft)} lbf·ft. The wood works at ${fig(c.wood)} psi and the steel at ${fig(c.steel / 1000)} ksi, at the same strain. The live load sags it ${fig(c.sag)} in, against an L/360 limit of ${fig(c.limit)} in.`
      : String.raw`Alone, the two boards carry ${fig(c.Mft)} lbf·ft at ${fig(c.wood)} psi, ${fig(c.woodRatio)} times their 920 psi Fb, and sag ${fig(c.sag)} in under live load against ${fig(c.limit)} in allowed. A steel plate bolted between them fixes both.`,
  })),
});

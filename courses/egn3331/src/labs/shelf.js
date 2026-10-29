import { beamSketch } from './elements.js';
import { M_PER_IN, N_PER_LBF } from '@flux/subjects/convert.js';
import { deflectionGap, integrateSimple, proppedGap } from '@flux/subjects/mechanics/elastic.js';
import {
  SHELF_B_IN, SHELF_H_IN, SHELF_LOAD_PLF, SHELF_SPAN_IN,
  shelfBraced, shelfBracedInches, shelfOpen, shelfOpenInches,
} from '../data/shelf.js';
import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { alpha, axes, begin, C, chartIn, dot, hidden, label, line, panes, plotIn, poly, sceneIn } from './diagram.js';
import { defineLab } from './define.js';
import { bindSlider, leavesOut, slider } from './widgets.js';

/**
 * Shows why a long pine shelf gets a bracket in the middle. The open span
 * sags several inches. The bracket makes each half a propped cantilever.
 *
 * Second method: the same deflection in inch-pounds, and, with the bracket,
 * finite differences on the half-span.
 */

const OUT = 'The board is a PS 20 dressed 1 by 12, 0.75 in by 11.25 in, not the nominal 1 by 12. E is 1.24 million psi for clear eastern white pine at 12 percent moisture, and that bending modulus already includes shear. The 72 in span and the 40 lb/ft of books are a chosen example, not a rated shelf. Grade, knots, creep, and the flexibility of the brackets are outside this EI. Turning the board on edge is a different second moment, not a different species.';

const SCENARIOS = [
  { id: 'open', name: '72 in, no center bracket', spanIn: SHELF_SPAN_IN, plf: SHELF_LOAD_PLF, bIn: SHELF_B_IN, hIn: SHELF_H_IN, brace: false },
  { id: 'short', name: '48 in span', spanIn: 48, plf: SHELF_LOAD_PLF, bIn: SHELF_B_IN, hIn: SHELF_H_IN, brace: false },
  { id: 'braced', name: 'Center bracket', spanIn: SHELF_SPAN_IN, plf: SHELF_LOAD_PLF, bIn: SHELF_B_IN, hIn: SHELF_H_IN, brace: true },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, {
    scenarioId: sc.id, spanIn: sc.spanIn, plf: sc.plf, bIn: sc.bIn, hIn: sc.hIn, brace: sc.brace,
  });
}

function curveOf(state) {
  const spanIn = Math.max(state.spanIn, 12);
  const plf = Math.max(state.plf, 1);
  const bIn = Math.max(state.bIn, 0.2);
  const hIn = Math.max(state.hIn, 0.2);
  if (state.brace) {
    const braced = shelfBraced(spanIn, plf, bIn, hIn);
    return {
      drop: braced.drop,
      Rend: braced.Rend,
      Rmid: braced.Rmid,
      xMax: braced.L / 2 - braced.half.xMax,
      L: braced.L,
      w: braced.w,
      EI: braced.EI,
      brace: true,
      yAt: (x) => {
        const local = x <= braced.L / 2 ? braced.L / 2 - x : x - braced.L / 2;
        return braced.half.at(local).y;
      },
    };
  }
  const beam = shelfOpen(spanIn, plf, bIn, hIn);
  return {
    drop: beam.drop,
    Rend: (beam.w * beam.L) / 2,
    Rmid: 0,
    xMax: beam.L / 2,
    L: beam.L,
    moment: beam.moment,
    EI: beam.EI,
    at: beam.at,
    brace: false,
    yAt: (x) => beam.at(x).y,
  };
}

function gapOf(state, beam) {
  const spanIn = Math.max(state.spanIn, 12);
  const plf = Math.max(state.plf, 1);
  const bIn = Math.max(state.bIn, 0.2);
  const hIn = Math.max(state.hIn, 0.2);
  if (beam.brace) {
    const inches = shelfBracedInches(spanIn, plf, bIn, hIn);
    const conv = Math.abs(beam.drop / M_PER_IN - inches) / Math.max(inches, 1e-12);
    return Math.max(conv, proppedGap(beam.w, beam.L / 2, beam.EI, 200).gap);
  }
  const inches = shelfOpenInches(spanIn, plf, bIn, hIn);
  const conv = Math.abs(beam.drop / M_PER_IN - inches) / Math.max(inches, 1e-12);
  const curve = integrateSimple(beam.moment, beam.L, beam.EI, 2000);
  return Math.max(conv, deflectionGap(beam.at, curve));
}

/** The beam on its supports, bent so its largest drop is an eighth of the span, and its loads. */

function member(B, rect, state, c, veiled) {
  const beam = curveOf(state);
  const L = beam.L;
  let low = 1e-12;
  for (let i = 0; i <= 40; i++) low = Math.max(low, Math.abs(beam.yAt((L * i) / 40)));
  const k = (0.12 * L) / low;
  const S = sceneIn(B, rect, { x0: -0.06 * L, x1: 1.06 * L, y0: -0.3 * L, y1: 0.2 * L }, 8);
  // A row of books, then the board bending on its brackets.
  for (let i = 0; i < 18; i++) {
    const x0 = (L * (i + 0.1)) / 18;
    const hgt = 0.08 * L * (0.8 + 0.25 * Math.sin(i * 2.1));
    const y = k * beam.yAt(x0 + L / 36);
    poly(S, [[x0, y + 0.01 * L], [x0 + L / 22, y + 0.01 * L], [x0 + L / 22, y + 0.01 * L + hgt], [x0, y + 0.01 * L + hgt]], { fill: alpha([C.gold, C.teal, C.pink][i % 3], 0.25), stroke: null });
  }
  beamSketch(S, L, {
    yAt: (x) => k * beam.yAt(x),
    supports: beam.brace ? [['pin', 0], ['roller', L / 2], ['roller', L]] : [['pin', 0], ['roller', L]],
  });
  if (!veiled) label(S, `sag ${fig(c.drop / M_PER_IN)} in · drawn ×${fig(k)}`, [L / 2, -0.22 * L], { color: C.dim });
}

export default defineLab({
  id: 'shelf',
  exam: 'u8',
  title: 'Pine shelf',
  hint: 'A flat 1×12 over 6 ft sags inches under a row of books. A bracket at midspan brings that sag down by holding the center.',
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('open', s);
    return s;
  },
  applyScenario: apply,
  sweep(state) {
    return { key: 'plf', lo: 10, hi: 80 };
  },
  controls() {
    return `
      ${slider('sf-span', 'span (in)', 72, 24, 96, 1)}
      ${slider('sf-load', 'books (lb/ft)', 40, 10, 80, 1)}
      <p class="tiny">The board lies flat: 0.75 in thick and 11.25 in wide. E is 1.24 million psi. A center bracket is the third scenario.</p>`;
  },
  bind(api) {
    bindSlider('sf-span', (s, v) => { s.spanIn = v; }, api);
    bindSlider('sf-load', (s, v) => { s.plf = v; }, api);
  },
  syncControls(state) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    set('sf-span', state.spanIn);
    set('sf-load', state.plf);
  },
  compute(state) {
    const beam = curveOf(state);
    return {
      drop: beam.drop,
      Rend: beam.Rend,
      Rmid: beam.Rmid,
      xMax: beam.xMax,
      L: beam.L,
      gap: gapOf(state, beam),
    };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const veiled = hidden();
    const [D, R] = panes(B, 0.42, { long: true });
    member(B, D, state, c, veiled);
    if (veiled) return;
    const beam = curveOf(state);
    const pts = [];
    let yLo = 0;
    let yHi = 0;
    const span = beam.L / M_PER_IN;
    for (let i = 0; i <= 40; i++) {
      const x = (beam.L * i) / 40;
      const y = beam.yAt(x) / M_PER_IN;
      pts.push([x / M_PER_IN, y]);
      yLo = Math.min(yLo, y);
      yHi = Math.max(yHi, y);
    }
    const pad = Math.max(yHi - yLo, 0.05) * 0.12;
    const P = chartIn(B, R, { lo: 0, hi: span }, { lo: yLo - pad, hi: yHi + pad });
    axes(P, { xLabel: 'x (in)', yLabel: 'deflection (in)' });
    line(P, pts, { color: C.gold, width: 3 });
    const xMark = beam.xMax / M_PER_IN;
    line(P, [[xMark, yLo - pad], [xMark, yHi + pad]], { color: C.teal, width: 2, dash: [5, 4] });
    if (state.brace) {
      const mid = span / 2;
      line(P, [[mid, yLo - pad], [mid, yHi + pad]], { color: C.pink, width: 2, dash: [2, 3] });
    }
    dot(P, xMark, beam.yAt(beam.xMax) / M_PER_IN, { color: C.gold, r: 5 });
  },
  law: () => [String.raw`\delta=\frac{5wL^4}{384EI}`],
  liveRows(state, c) {
    return [
      kv('midspan or peak sag', `${fig(c.drop / M_PER_IN)} in`),
      kv('end reaction', `${fig(c.Rend / N_PER_LBF)} lbf`),
      kv('center reaction', `${fig(c.Rmid / N_PER_LBF)} lbf`),
      kv('span', `${fig(state.spanIn)} in`),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['sag', `${fig(c.drop / M_PER_IN)} in`],
      ['end', `${fig(c.Rend / N_PER_LBF)} lbf`],
      ['center', `${fig(c.Rmid / N_PER_LBF)} lbf`],
      ['span', `${fig(state.spanIn)} in`],
    ]);
  },
  coach: leavesOut(OUT, (state, c) => ({
    title: state.brace ? 'The center bracket holds the middle' : 'The flat board sags at midspan',
    body: state.brace
      ? `The largest sag is ${fig(c.drop / M_PER_IN)} in. Each end carries ${fig(c.Rend / N_PER_LBF)} lbf and the center carries ${fig(c.Rmid / N_PER_LBF)} lbf. The pink line is the bracket.`
      : `Midspan drops ${fig(c.drop / M_PER_IN)} in under ${fig(state.plf)} lb/ft. Each end carries ${fig(c.Rend / N_PER_LBF)} lbf. The center carries nothing until a bracket is added.`,
  })),
});

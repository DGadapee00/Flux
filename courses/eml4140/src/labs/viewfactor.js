import { fig } from '../ui/format.js';
import { cells, kv } from '../ui/shared.js';
import { C, alpha, axes, begin, label, line, plotIn, poly, sceneIn, seg } from './diagram.js';
import { defineLab } from './define2d.js';
import { bindSlider, slider } from './widgets.js';
import { W1, viewFactors } from '@flux/subjects/heat/viewfactor.js';

/**
 * View factor: two long strips, one on the floor and one above it that you move, resize and tilt,
 * with rays fired from the floor strip and counted.
 *
 * Shows that the fraction is not mutual: a narrow strip above a wide one sends 70% of its radiation
 * to it, but receives only 14% of the wide one's. The areas times the fractions agree,
 * w₁F₁₂ = w₂F₂₁. The closed form is Hottel's crossed strings; the second method integrates the
 * defining double integral by quadrature; the rays show the count (packages/subjects/src/heat/viewfactor.js).
 */
const SCENARIOS = [
  { id: 'equal', name: 'Two equal strips facing each other', w2: 1, x2: 0, h: 1, tiltDeg: 0 },
  { id: 'small', name: 'A narrow strip over a wide one', w2: 0.2, x2: 0, h: 0.5, tiltDeg: 0 },
  { id: 'wide', name: 'A wide strip close above', w2: 2, x2: 0, h: 0.5, tiltDeg: 0 },
  { id: 'offset', name: 'Off to one side, turned towards the floor strip', w2: 1, x2: 1.5, h: 1, tiltDeg: -30 },
];

function apply(id, state) {
  const sc = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  Object.assign(state, { scenarioId: sc.id, w2: sc.w2, x2: sc.x2, h: sc.h, tiltDeg: sc.tiltDeg });
}

const KEYS = [['vf-w', 'w2'], ['vf-x', 'x2'], ['vf-h', 'h'], ['vf-t', 'tiltDeg']];
const pct = (x) => `${fig(100 * x)}%`;

/** The strips, the strings stretched between their ends, and a few of the rays. */
function scene(B, rect, c) {
  const { a, b, c: p2, d } = c.g;
  const xs = [a[0], b[0], p2[0], d[0]];
  const ys = [0, p2[1], d[1]];
  const pad = 0.35;
  const box = { x0: Math.min(...xs, -1.2) - pad, x1: Math.max(...xs, 1.2) + pad, y0: -0.3, y1: Math.max(...ys) + 0.35 };
  const S = sceneIn(B, rect, box, 14);
  // Rays: hits in gold, misses faint, each cut at the strip or at the edge of the view.
  const toEdge = (r) => {
    const tx = r.u[0] > 0 ? (box.x1 - r.p[0]) / r.u[0] : r.u[0] < 0 ? (box.x0 - r.p[0]) / r.u[0] : Infinity;
    const t = Math.min(tx, (box.y1 - r.p[1]) / r.u[1]);
    return [r.p[0] + t * r.u[0], r.p[1] + t * r.u[1]];
  };
  for (const r of c.mc.drawn) {
    const end = r.q || toEdge(r);
    line(S, [r.p, end], { color: r.q ? alpha(C.gold, 0.75) : alpha(C.muted, 0.22), width: r.q ? 1.4 : 1 });
  }
  // Hottel's strings: crossed in pink, uncrossed in blue.
  for (const [p, q] of [[a, d], [b, p2]]) line(S, [p, q], { color: alpha(C.pink, 0.8), width: 1.3, dash: [5, 4] });
  for (const [p, q] of [[a, p2], [b, d]]) line(S, [p, q], { color: alpha(C.blue, 0.8), width: 1.3, dash: [5, 4] });
  line(S, [a, b], { color: C.teal, width: 5 });
  line(S, [p2, d], { color: C.gold, width: 5 });
  label(S, `1: w₁ = ${fig(W1)}`, [0, 0], { color: C.teal, dy: 14 });
  // Strip 2's label on its back, the side away from the rays.
  const n2 = c.g.n2;
  const back = [(p2[0] + d[0]) / 2 - 0.2 * n2[0], (p2[1] + d[1]) / 2 - 0.2 * n2[1]];
  label(S, `2: w₂ = ${fig(c.w2)}`, back, { color: C.gold });
}

/** The two fractions, then the two products that reciprocity says agree. */
function bars(B, rect, c) {
  const vals = [c.F12, c.F21, c.A1F12, c.A2F21];
  const hi = Math.max(1, ...vals) * 1.12;
  const P = plotIn(B, rect, { lo: -0.6, hi: 3.6 }, { lo: 0, hi }, { left: 48, right: 14, top: 26, bottom: 34 });
  axes(P, { yLabel: 'fraction, or width × fraction', xFmt: () => '' });
  const names = ['F₁₂', 'F₂₁', 'w₁F₁₂', 'w₂F₂₁'];
  const colors = [C.teal, C.gold, C.green, C.green];
  vals.forEach((v, k) => {
    poly(P, [[k - 0.3, 0], [k + 0.3, 0], [k + 0.3, v], [k - 0.3, v]], { fill: alpha(colors[k], 0.75), stroke: null });
    label(P, fig(v), [k, v], { color: C.text, dy: -9 });
    label(P, names[k], [k, 0], { color: C.muted, dy: 12 });
  });
  seg(P, [1.5, 0], [1.5, hi], { color: alpha(C.text, 0.25), width: 1, dash: [3, 3] });
}

export default defineLab({
  id: 'viewfactor',
  exam: 'u2',
  title: 'View factor',
  hint: 'Shrink strip 2 and watch the two fractions part: the narrow strip sends most of its radiation to the wide one, which sends little back. The green bars stay equal.',
  gapLimit: 1e-5,
  scenarios: SCENARIOS,
  defaultState() {
    const s = {};
    apply('equal', s);
    return s;
  },
  applyScenario: apply,
  sweep: () => ({ key: 'x2', lo: -2, hi: 2 }),
  controls() {
    return `
      ${slider('vf-w', 'Width of strip 2, w₂ (strip 1 is 1)', 1, 0.2, 3, 0.05)}
      ${slider('vf-x', 'Strip 2 sideways, x₂', 0, -2, 2, 0.05)}
      ${slider('vf-h', 'Strip 2 height, h', 1, 0.3, 3, 0.05)}
      ${slider('vf-t', 'Tilt of strip 2 (°, + lifts its right end)', 0, -60, 60, 1)}
      <p class="tiny">Both strips run far into the page. Strip 1 faces up, strip 2 faces down. Dashed strings, Hottel’s method: pink crossed, blue uncrossed. Gold rays: the first 60 of 20 000 fired from strip 1 that land on strip 2; faint rays miss. The tilt stops where either strip would start to hide behind the other.</p>`;
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
    const r = viewFactors(state);
    return { ...r, w2: state.w2, ratio: r.F21 / r.F12 };
  },
  draw(canvas, state, c) {
    const B = begin(canvas);
    const W = B.free.x1 - B.free.x0;
    const H = B.free.y1 - B.free.y0;
    const wide = W > 1.5 * H && W > 560;
    const both = wide || H > 420;
    if (!both) {
      scene(B, B.free, c);
      return;
    }
    const left = wide ? { ...B.free, x1: B.free.x0 + 0.6 * W } : { ...B.free, y1: B.free.y0 + 0.58 * H };
    const right = wide ? { ...B.free, x0: left.x1 } : { ...B.free, y0: left.y1 };
    scene(B, left, c);
    bars(B, right, c);
  },
  law: () => [String.raw`F_{12} = \frac{(\text{crossed}) - (\text{uncrossed})}{2w_1}`, String.raw`w_1F_{12} = w_2F_{21}, \qquad \sum_j F_{1j} = 1`],
  liveRows(state, c) {
    return [
      kv('Crossed strings, uncrossed', `${fig(c.crossed)}, ${fig(c.uncrossed)}`),
      kv('F₁₂ and F₂₁, crossed strings', `${fig(c.F12)}, ${fig(c.F21)}`),
      kv('F₁₂, double integral', fig(c.F12q)),
      kv('w₁F₁₂ and w₂F₂₁', `${fig(c.A1F12)}, ${fig(c.A2F21)}`),
      kv('F₁₂ from rays', `${c.mc.hits} of ${c.mc.N}: ${fig(c.mc.F12)}`),
      kv('From strip 1, lost to the room', pct(c.F1rest)),
      kv('Tilt used', c.clamped ? `${fig(c.tilt)}°, held so both stay in view` : `${fig(c.tilt)}°`),
      kv('Strings against the integral', c.gap.toExponential(0)),
    ].join('');
  },
  readout(state, c) {
    return cells([
      ['F₁₂', fig(c.F12)],
      ['F₂₁', fig(c.F21)],
      ['w₁F₁₂ = w₂F₂₁', fig(c.A1F12)],
      ['rays', fig(c.mc.F12)],
    ]);
  },
  coach(state, c) {
    const leavesOut = String.raw`<b>What the course model leaves out.</b> Strips that run for ever into the page. Real plates are finite, and their view factors come from tables or a full double integral over both areas. Anything between the surfaces that blocks part of the view needs the integral too.`;
    if (Math.abs(c.ratio - 1) < 0.02) {
      return { title: 'Equal widths, equal fractions', body: `With the same width, each strip sends the other the same share: ${pct(c.F12)}. The rest, ${pct(c.F1rest)}, escapes to the room. Narrow strip 2 and the fractions part. ${leavesOut}` };
    }
    if (c.w2 < W1) {
      return { title: 'The narrow strip sees more of the wide one', body: `Strip 2 sends ${pct(c.F21)} of its radiation to strip 1, but strip 1 sends only ${pct(c.F12)} to it: ${fig(c.ratio)} times less, the ratio of the widths. The products agree, w₁F₁₂ = w₂F₂₁ = ${fig(c.A1F12)}, as reciprocity says. ${leavesOut}` };
    }
    return { title: 'The wide strip catches most of the narrow one', body: `Strip 1 sends ${pct(c.F12)} of its radiation to the wider strip 2, which sends only ${pct(c.F21)} back: the fractions differ by the width ratio, ${fig(c.w2 / W1)}. w₁F₁₂ = w₂F₂₁ = ${fig(c.A1F12)}. ${leavesOut}` };
  },
  app: false,
});

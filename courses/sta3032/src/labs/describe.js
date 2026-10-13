/**
 * Describing data (Ch 1). One data set three ways: a histogram (bin width and start on sliders),
 * a dot plot, and the teacher's box plot (TI-84 quartiles, 1.5·IQR fences, outliers as dots).
 * The largest value is on a slider of its own; drag it out and watch what moves.
 *
 * What it corrects: that the mean and the median respond alike to an extreme value (the median
 * does not move), that s and the IQR do (s balloons, the IQR stays), that skew is where the mean
 * sits against the median, and that a histogram's shape is partly the bin width's doing.
 */
import { defineLab } from './define.js';
import { setup, area, axes, bars, vline, dot, label, segment, histogram, C, alpha } from '../plot/plot.js';
import { boxPlot, mean, sd } from '../stats/describe.js';

/** Data sets; the last (largest) value of each is the one on the slider. */
const SETS = {
  scores: {
    label: 'Quiz scores (roughly symmetric)',
    unit: 'points',
    data: [52, 58, 61, 63, 65, 66, 68, 69, 70, 71, 72, 72, 74, 75, 77, 78, 80, 83, 86, 90],
    box: [40, 160],
    width: 5,
  },
  commute: {
    label: 'Commute times (skewed right)',
    unit: 'minutes',
    data: [6, 8, 9, 10, 11, 12, 12, 13, 14, 15, 16, 18, 20, 22, 25, 28, 33, 40, 48, 60],
    box: [0, 120],
    width: 5,
  },
  claims: {
    label: 'Collision claims, dollars (Notes Ex 1.13)',
    unit: 'dollars',
    data: [180, 189, 370, 618, 735, 802, 1185, 1414, 1657, 1953, 2332, 2336, 3461, 4668, 6751, 9908, 10034, 21147],
    box: [0, 26000],
    width: 2500,
  },
  calls: {
    label: 'Phone call lengths (Notes Ex 1.7)',
    unit: 'minutes',
    data: [1, 1, 2, 3, 3, 3, 4, 4, 5, 6, 7, 48],
    box: [0, 60],
    width: 5,
  },
  bolts: {
    label: 'Bolt lengths (one bad reading)',
    unit: 'mm',
    data: [49.2, 49.5, 49.6, 49.8, 49.9, 49.9, 50.0, 50.0, 50.1, 50.1, 50.2, 50.3, 50.4, 50.5, 50.7, 53.8],
    box: [48.5, 56],
    width: 0.25,
  },
};

const dataOf = (s) => {
  const D = SETS[s.set];
  const xs = D.data.slice(0, -1);
  xs.push(s.top);
  return xs;
};
const secondLargest = (s) => SETS[s.set].data[SETS[s.set].data.length - 2];

/** A data set's own starting values for the controls that depend on it. */
const fresh = (k) => ({ top: SETS[k].data[SETS[k].data.length - 1], width: SETS[k].width, start: SETS[k].box[0] });

const r2 = (x) => String(Number(x.toFixed(2)));

export default defineLab({
  id: 'describe',
  title: 'Describing data',
  ch: ['1'],
  blurb: 'Histogram, dot plot and box plot of one data set. Drag the largest value out and see which summaries move: mean or median, s or IQR.',
  height: 0.95,
  params: [
    { id: 'set', label: 'Data', type: 'choice', options: Object.entries(SETS).map(([k, d]) => [k, d.label]), value: 'scores', select: true, reset: (k) => fresh(k) },
    { id: 'top', label: 'The largest value', type: 'range', min: secondLargest, max: (s) => SETS[s.set].box[1], step: (s) => (SETS[s.set].width < 1 ? 0.1 : 1), value: 90 },
    { id: 'width', label: 'Bin width', type: 'range', min: (s) => SETS[s.set].width / 5, max: (s) => SETS[s.set].width * 4, step: (s) => SETS[s.set].width / 5, value: 5 },
    { id: 'start', label: 'First bin starts at', type: 'range', min: (s) => SETS[s.set].box[0], max: (s) => SETS[s.set].box[0] + SETS[s.set].width * 4, step: (s) => SETS[s.set].width / 5, value: 40 },
  ],
  scenarios: Object.keys(SETS).map((k) => ({ id: k, label: SETS[k].label, state: { set: k, ...fresh(k) } })),

  compute(s) {
    const xs = dataOf(s);
    const B = boxPlot(xs);
    return { xs, B, mean: mean(xs), median: B.median, sd: sd(xs), iqr: B.iqr, n: xs.length };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const [lo, hi] = SETS[s.set].box;
    // Histogram, top half.
    const nb = Math.max(1, Math.ceil((hi - s.start) / s.width));
    const counts = histogram(r.xs, s.start, s.start + nb * s.width, nb);
    const H = area(w, Math.round(h * 0.5), { x: [lo, hi], y: [0, Math.max(3, ...counts) * 1.15], left: 30, bottom: 22 });
    axes(ctx, H, { yLabel: 'count', yCount: 3, xTicks: false });
    bars(ctx, H, Array.from(counts, (c, i) => [s.start + i * s.width, s.start + (i + 1) * s.width, c]), { fill: alpha(C.blue, 0.5), stroke: alpha(C.blue, 0.9) });
    vline(ctx, H, r.mean, { color: C.gold, dash: null, width: 2, label: 'x̄', align: 'center' });
    vline(ctx, H, r.median, { color: C.teal, dash: [4, 3], width: 2 });

    // Dot plot, stacked.
    const D = area(w, Math.round(h * 0.72), { x: [lo, hi], y: [0, 6], left: 30, top: Math.round(h * 0.5) + 6, bottom: 4 });
    const seen = new Map();
    for (const x of r.xs) {
      const k = Math.round((x - lo) / ((hi - lo) / 90));
      const j = seen.get(k) || 0;
      seen.set(k, j + 1);
      dot(ctx, D, x, 0.6 + j * 1.1, { color: x === s.top ? C.yellow : alpha(C.text, 0.75), r: 3 });
    }

    // Box plot, bottom, on the shared axis.
    const Bx = area(w, h, { x: [lo, hi], y: [0, 1], left: 30, top: Math.round(h * 0.74) });
    axes(ctx, Bx, { xLabel: SETS[s.set].unit, yTicks: false });
    const b = r.B;
    const yM = 0.5;
    const half = 0.22;
    ctx.strokeStyle = C.text;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = alpha(C.teal, 0.2);
    ctx.fillRect(Bx.x(b.q1), Bx.y(yM + half), Bx.x(b.q3) - Bx.x(b.q1), Bx.y(yM - half) - Bx.y(yM + half));
    ctx.strokeRect(Bx.x(b.q1), Bx.y(yM + half), Bx.x(b.q3) - Bx.x(b.q1), Bx.y(yM - half) - Bx.y(yM + half));
    segment(ctx, Bx, b.median, yM - half, b.median, yM + half, { color: C.teal, width: 2.5 });
    segment(ctx, Bx, b.whiskerLow, yM, b.q1, yM, { color: C.text });
    segment(ctx, Bx, b.q3, yM, b.whiskerHigh, yM, { color: C.text });
    segment(ctx, Bx, b.whiskerLow, yM - 0.1, b.whiskerLow, yM + 0.1, { color: C.text });
    segment(ctx, Bx, b.whiskerHigh, yM - 0.1, b.whiskerHigh, yM + 0.1, { color: C.text });
    for (const f of [b.lowerFence, b.upperFence]) if (f > lo && f < hi) segment(ctx, Bx, f, yM - 0.35, f, yM + 0.35, { color: alpha(C.red, 0.6), dash: [3, 3], width: 1 });
    for (const o of b.outliers) dot(ctx, Bx, o, yM, { color: C.red, r: 4 });
    if (b.upperFence < hi) label(ctx, 'fence', Bx.x(b.upperFence) + 3, Bx.y(yM + 0.35), { color: alpha(C.red, 0.8), baseline: 'top' });
    return { H };
  },

  readout(s, r) {
    return [
      [String.raw`Mean $\bar{x}$`, `$${r2(r.mean)}$`],
      ['Median', `$${r2(r.median)}$`],
      ['$s$', `$${r2(r.sd)}$`],
      ['IQR', `$${r2(r.iqr)}$`],
    ];
  },

  explain(s, r) {
    const b = r.B;
    const out = [
      String.raw`$n = ${r.n}$. Five-number summary (TI-84 quartiles: the medians of the lower and upper halves): $${r2(b.min)},\ ${r2(b.q1)},\ ${r2(b.median)},\ ${r2(b.q3)},\ ${r2(b.max)}$.`,
      String.raw`Fences: $Q_1 - 1.5\,\text{IQR} = ${r2(b.lowerFence)}$ and $Q_3 + 1.5\,\text{IQR} = ${r2(b.upperFence)}$. ${b.outliers.length ? `Outside them, so drawn as ${b.outliers.length === 1 ? 'an outlier' : 'outliers'}: ${b.outliers.map(r2).join(', ')}. The whisker stops at the last value inside.` : 'Nothing lies outside them, so the whiskers run to the min and max.'}`,
    ];
    const gap = r.mean - r.median;
    out.push(Math.abs(gap) < 0.05 * r.sd ? String.raw`The mean (gold line) and the median (teal) nearly agree: the data are roughly symmetric.` : gap > 0 ? String.raw`The mean (gold) sits above the median (teal) by ${r2(gap)}: the long right tail pulls the mean toward it. The median only counts how many values lie on each side, so it does not care how far out the largest one is.` : String.raw`The mean (gold) sits below the median (teal): a long left tail.`);
    out.push('Move the bin width and start: the same data can look smooth, jagged, or even two-humped. The dot plot and the box plot do not depend on those choices.');
    return out;
  },

  predictions: [
    {
      id: 'median',
      setup: { set: 'scores', top: 90, width: 5, start: 40 },
      change: { top: 150 },
      prompt: 'The top quiz score is 90. Suppose it had been recorded as 150 instead. The MEDIAN…',
      options: [['up', 'goes up'], ['same', 'stays the same'], ['down', 'goes down']],
      outcome: (b, a) => (a.median > b.median + 1e-9 ? 'up' : a.median < b.median - 1e-9 ? 'down' : 'same'),
      expect: 'same',
      why: 'The median is the middle of the sorted list; the largest value is still the largest, so the middle does not change (71.5). The mean, which adds up every value, rises by 60/20 = 3.',
    },
    {
      id: 'iqr',
      setup: { set: 'scores', top: 90, width: 5, start: 40 },
      change: { top: 150 },
      prompt: 'Same change: 90 becomes 150. Which spread changes more?',
      options: [['s', 's grows, the IQR stays the same'], ['iqr', 'the IQR grows, s stays the same'], ['both', 'both grow about equally']],
      outcome: (b, a) => (a.sd > b.sd * 1.2 && Math.abs(a.iqr - b.iqr) < 1e-9 ? 's' : a.iqr > b.iqr + 1e-9 && Math.abs(a.sd - b.sd) < 0.01 ? 'iqr' : 'both'),
      expect: 's',
      why: 's squares each distance from the mean, so one far value inflates it (9.42 to 19.64). The IQR only looks at the middle half of the data, which has not moved. That is why skewed data or data with outliers are summarized by the median and IQR.',
    },
    {
      id: 'skew',
      setup: { set: 'scores', top: 90, width: 5, start: 40 },
      change: { set: 'commute', top: 60, width: 5, start: 0 },
      prompt: 'Commute times: most people take 10 to 20 minutes, a few take 40 to 60. The mean is…',
      options: [['above', 'above the median'], ['equal', 'about equal to the median'], ['below', 'below the median']],
      outcome: (b, a) => (a.mean > a.median + 0.05 * a.sd ? 'above' : a.mean < a.median - 0.05 * a.sd ? 'below' : 'equal'),
      expect: 'above',
      why: 'Skewed right: the long commutes pull the mean (21) above the median (15.5). The mean chases the tail; the median stays with the bulk of the data.',
    },
  ],
});

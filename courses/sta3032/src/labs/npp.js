/**
 * Normal probability plot (Ch 8, checking the t procedures' assumption). A sample from a chosen
 * population, plotted the notes' way: z_i = Φ⁻¹((i − 0.5)/n) across, the sorted data up, with the
 * line x̄ + s·z the points would follow if the population were normal.
 *
 * What it corrects: that "normal" data give a perfectly straight plot (small normal samples
 * wiggle), and how to read a bend: a curve for skew, an S for heavy tails, one stray point for an
 * outlier.
 */
import { defineLab } from './define.js';
import { setup, area, axes, dot, segment, label, C, alpha } from '../plot/plot.js';
import * as D from '../stats/dist.js';

const POPS = {
  normal: { label: 'Normal', draw: (r) => r.normal(50, 10) },
  skewed: { label: 'Skewed right', draw: (r) => 30 + r.exponential(10) },
  heavy: { label: 'Heavy tails (t, 2 df)', draw: (r) => 50 + 5 * r.t(2) },
  uniform: { label: 'Uniform (light tails)', draw: (r) => r.uniform(30, 70) },
};

/**
 * Shape of a sorted sample, in the terms a plot's bend shows. `skew` compares the upper and lower
 * reaches from the median (0 when symmetric, positive for a long right tail); `tails` is the 5–95%
 * spread over the IQR, divided by a normal's (1 for normal, above for heavy tails, below for light).
 */
function shape(y) {
  const q = (p) => {
    const h = (y.length - 1) * p;
    const k = Math.floor(h);
    return y[k] + (h - k) * ((y[Math.min(k + 1, y.length - 1)] ?? y[k]) - y[k]);
  };
  const [q05, q25, q50, q75, q95] = [q(0.05), q(0.25), q(0.5), q(0.75), q(0.95)];
  return { skew: (q95 - q50 - (q50 - q05)) / (q95 - q05), tails: (q95 - q05) / (q75 - q25) / (2 * 1.6449 / (2 * 0.6745)) };
}

export default defineLab({
  id: 'npp',
  title: 'Normal probability plot',
  ch: ['6', '8'],
  blurb: 'Is it normal enough for t? Read the plot: straight, curved for skew, an S for heavy tails, and how much a normal sample wiggles anyway.',
  height: 0.85,
  params: [
    { id: 'pop', label: 'Population', type: 'choice', options: Object.entries(POPS).map(([k, p]) => [k, p.label]), value: 'normal', select: true },
    { id: 'n', label: '$n$', type: 'range', min: 5, max: 200, step: 1, value: 20 },
    { id: 'outlier', label: 'Add one outlier', type: 'toggle', value: false },
  ],
  // Seed 3's first sample is a typical one; seed 1 happens to open on a 3σ value.
  initial: { seed: 3 },
  actions: [{ id: 'resample', label: 'New sample', run: (s) => ({ ...s, seed: s.seed + 1 }) }],
  scenarios: [
    { id: 'small', label: 'Normal, n = 8: straight enough?', state: { pop: 'normal', n: 8 } },
    { id: 'skew', label: 'Skewed, n = 40', state: { pop: 'skewed', n: 40 } },
    { id: 'heavy', label: 'Heavy tails, n = 60', state: { pop: 'heavy', n: 60 } },
  ],

  compute(s, rng) {
    const xs = [];
    for (let i = 0; i < s.n; i++) xs.push(POPS[s.pop].draw(rng));
    if (s.outlier) xs[xs.length - 1] = Math.max(...xs) + 4 * 10;
    const y = xs.slice().sort((a, b) => a - b);
    const n = y.length;
    const z = y.map((_, i) => D.normInv((i + 1 - 0.5) / n));
    const m = y.reduce((t, v) => t + v, 0) / n;
    const sd = Math.sqrt(y.reduce((t, v) => t + (v - m) ** 2, 0) / (n - 1));
    // Correlation of the plot's points: 1 for a perfectly straight plot.
    const zm = z.reduce((t, v) => t + v, 0) / n;
    let szy = 0;
    let szz = 0;
    for (let i = 0; i < n; i++) {
      szy += (z[i] - zm) * (y[i] - m);
      szz += (z[i] - zm) ** 2;
    }
    const r = szy / Math.sqrt(szz * sd * sd * (n - 1));
    return { y, z, m, sd, r, n, ...shape(y) };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const zlim = Math.max(2.2, Math.abs(r.z[0]) + 0.2);
    const lo = Math.min(r.y[0], r.m - zlim * r.sd);
    const hi = Math.max(r.y[r.n - 1], r.m + zlim * r.sd);
    const pad = (hi - lo) * 0.06;
    const A = area(w, h, { x: [-zlim, zlim], y: [lo - pad, hi + pad], left: 40 });
    axes(ctx, A, { xLabel: 'normal score z', yLabel: 'data (sorted)' });
    segment(ctx, A, -zlim, r.m - zlim * r.sd, zlim, r.m + zlim * r.sd, { color: C.gold, width: 1.8, dash: [6, 4] });
    for (let i = 0; i < r.n; i++) dot(ctx, A, r.z[i], r.y[i], { color: alpha(C.blue, 0.85), r: r.n > 100 ? 2.5 : 3.5 });
    label(ctx, 'x̄ + s·z', A.x1 - 4, A.y(r.m + (zlim - 0.6) * r.sd) + 16, { color: C.gold, align: 'right' });
    return { A };
  },

  readout(s, r) {
    return [
      ['$n$', `$${r.n}$`],
      ['Straightness $r$', `$${r.r.toFixed(4)}$`],
      [String.raw`$\bar{x}$, $s$`, `$${r.m.toFixed(1)},\ ${r.sd.toFixed(1)}$`],
    ];
  },

  explain(s, r) {
    const out = [
      String.raw`Each point is one observation: the $i$th smallest value, plotted against $z_i = \Phi^{-1}\!\big(\tfrac{i - 0.5}{n}\big)$, where the $i$th smallest of $n$ draws from a normal would sit. If the population is normal, the points follow the dashed line $\bar{x} + s\,z$.`,
    ];
    // A shape is only claimed when it is well beyond what a normal sample of this size shows.
    const k = r.n >= 100 ? 1 : r.n >= 40 ? 1.6 : 2.5;
    if (r.skew > 0.3 * k) out.push('The plot bends upward at both ends (a curve, opening up): the upper tail is stretched and the lower one squeezed, which is skew to the right.');
    else if (r.skew < -0.3 * k) out.push('The plot bends the other way: a long LEFT tail.');
    else if (r.tails > 1 + 0.25 * k) out.push('The ends flare away from the line, low end below it and high end above: an S. The tails are heavier than a normal’s: extreme values come too often.');
    else if (r.n >= 60 && r.tails < 0.85) out.push('The ends curl back toward the middle: lighter tails than a normal (a uniform does this).');
    else out.push('The points stay close to the line. For a small n, some wiggle is normal: press New sample a few times with a normal population to see how much.');
    out.push('For a t procedure with a small sample, a roughly straight plot is the check the notes ask for; with n ≥ 30 the CLT covers moderate departures.');
    return out;
  },

  predictions: [
    {
      id: 'skew',
      setup: { pop: 'normal', n: 100, outlier: false },
      change: { pop: 'skewed' },
      prompt: 'With 100 values from a normal population the points hug the line. Switch to a right-skewed population. The plot…',
      options: [['straight', 'stays about straight'], ['curve', 'curves upward at the ends'], ['s', 'makes an S']],
      outcome: (b, a) => (a.skew > 0.3 ? 'curve' : a.tails > 1.2 ? 's' : 'straight'),
      expect: 'curve',
      why: 'In a right-skewed sample the largest values are further out than a normal would put them, and the smallest are bunched together: both ends of the plot sit above the line, and it bends upward like a smile.',
    },
    {
      id: 'heavy',
      setup: { pop: 'normal', n: 200, outlier: false },
      change: { pop: 'heavy' },
      prompt: 'Now a symmetric population with heavy tails (t with 2 df). The plot…',
      options: [['straight', 'stays about straight'], ['curve', 'curves upward at both ends'], ['s', 'makes an S: low end dips, high end rises']],
      outcome: (b, a) => (a.skew > 0.3 ? 'curve' : a.tails > 1.2 ? 's' : 'straight'),
      expect: 's',
      why: 'Heavy tails put extreme values on BOTH sides further out than a normal would: the smallest values fall below the line, the largest rise above it. Symmetric, so no curve, but an S.',
    },
    {
      id: 'wiggle',
      setup: { pop: 'normal', n: 8, outlier: false },
      change: { n: 150 },
      prompt: 'Eight values from a truly normal population rarely line up perfectly. Take 150 values from the same population. The straightness r…',
      options: [['up', 'gets closer to 1'], ['same', 'stays about the same'], ['down', 'drops']],
      outcome: (b, a) => (a.r > b.r + 0.002 ? 'up' : a.r < b.r - 0.002 ? 'down' : 'same'),
      expect: 'up',
      why: 'Small normal samples wiggle around the line by chance; with more data the sorted values settle onto the normal quantiles. So judge a small sample’s plot gently: only a clear curve or S counts against normality.',
    },
  ],
});

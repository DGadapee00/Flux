/**
 * Confidence-interval coverage (Ch 8). A hundred samples from N(50, 10²), a hundred intervals:
 * green ones caught μ, red ones missed. Under them, the long-run rate over thousands more.
 *
 * What it corrects: "95% confident" is a statement about the METHOD (95% of intervals built this
 * way catch μ), not about one interval; more confidence costs width; a bigger n buys narrower
 * intervals at the same coverage; and z with s in place of σ undercovers when n is small, which
 * is what t is for.
 */
import { defineLab } from './define.js';
import { setup, area, axes, vline, C, alpha } from '../plot/plot.js';
import * as D from '../stats/dist.js';

const MU = 50;
const SIGMA = 10;
const METHODS = [
  ['z', 'z, σ known'],
  ['t', 't, with s'],
  ['zs', 'z, with s'],
];

/** The critical value the method uses. */
const critFor = (method, conf, n) => (method === 't' ? D.tCrit((1 - conf) / 2, n - 1) : D.zCrit((1 - conf) / 2));

/** `count` intervals from one seeded stream; returns [lo, hi, xbar] triples. */
function intervals(rng, method, conf, n, count) {
  const crit = critFor(method, conf, n);
  const out = new Array(count);
  for (let k = 0; k < count; k++) {
    let sum = 0;
    let sq = 0;
    for (let i = 0; i < n; i++) {
      const x = rng.normal(MU, SIGMA);
      sum += x;
      sq += x * x;
    }
    const xbar = sum / n;
    const s = n > 1 ? Math.sqrt(Math.max(0, (sq - n * xbar * xbar) / (n - 1))) : 0;
    const e = (crit * (method === 'z' ? SIGMA : s)) / Math.sqrt(n);
    out[k] = [xbar - e, xbar + e, xbar];
  }
  return out;
}

const pct = (x) => `${(100 * x).toFixed(1)}\\%`;

export default defineLab({
  id: 'ci',
  title: 'Confidence interval coverage',
  ch: ['8'],
  blurb: 'A hundred intervals at once. Which catch μ, what the confidence level really promises, and why small samples need t.',
  height: 1.05,
  params: [
    { id: 'method', label: 'Interval', type: 'choice', options: METHODS, value: 'z' },
    { id: 'conf', label: 'Confidence level', type: 'range', min: 0.5, max: 0.99, step: 0.01, value: 0.95 },
    { id: 'n', label: '$n$ (each sample)', type: 'range', min: 2, max: 60, step: 1, value: 10 },
    { id: 'count', label: 'Intervals shown', type: 'choice', options: [[20, '20'], [50, '50'], [100, '100']], value: 100 },
  ],
  // `runs` sets of 100 more intervals make the long-run rate.
  initial: { runs: 50 },
  actions: [{ id: 'resample', label: 'New intervals', run: (s) => ({ ...s, seed: s.seed + 1 }) }],
  scenarios: [
    { id: 'z95', label: '95% z intervals, n = 10', state: { method: 'z', conf: 0.95, n: 10 } },
    { id: 'z80', label: '80%: one in five misses', state: { method: 'z', conf: 0.8, n: 10 } },
    { id: 'small-zs', label: 'n = 4, z with s: too many misses', state: { method: 'zs', conf: 0.95, n: 4 } },
    { id: 'small-t', label: 'n = 4, t with s: fixed', state: { method: 't', conf: 0.95, n: 4 } },
  ],

  compute(s, rng) {
    const shown = intervals(rng, s.method, s.conf, s.n, s.count);
    const caught = shown.filter(([lo, hi]) => lo <= MU && MU <= hi).length;
    let longHits = 0;
    let longN = 0;
    let widths = 0;
    for (let r = 0; r < s.runs; r++) {
      for (const [lo, hi] of intervals(rng, s.method, s.conf, s.n, 100)) {
        longN++;
        widths += hi - lo;
        if (lo <= MU && MU <= hi) longHits++;
      }
    }
    return { shown, caught, rate: caught / s.count, longRate: longHits / longN, longN, meanWidth: widths / longN, crit: critFor(s.method, s.conf, s.n) };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const A = area(w, h, { x: [MU - 22, MU + 22], y: [0, r.shown.length + 1], left: 14, right: 14, top: 30 });
    axes(ctx, A, { yTicks: false, xLabel: 'x' });
    ctx.save();
    ctx.beginPath();
    ctx.rect(A.x0, A.y0 - 2, A.x1 - A.x0, A.y1 - A.y0 + 4);
    ctx.clip();
    const lw = Math.max(1.2, Math.min(3, ((A.y1 - A.y0) / r.shown.length) * 0.55));
    r.shown.forEach(([lo, hi, xbar], i) => {
      const hit = lo <= MU && MU <= hi;
      const y = A.y(i + 1);
      const col = hit ? C.green : C.red;
      ctx.strokeStyle = hit ? alpha(C.green, 0.75) : col;
      ctx.lineWidth = hit ? lw : lw + 0.6;
      ctx.beginPath();
      ctx.moveTo(A.x(lo), y);
      ctx.lineTo(A.x(hi), y);
      ctx.stroke();
      ctx.fillStyle = C.gold;
      ctx.fillRect(A.x(xbar) - 1, y - lw, 2, lw * 2);
    });
    ctx.restore();
    vline(ctx, A, MU, { color: C.blue, dash: null, width: 1.5, label: 'μ = 50' });
    return { A };
  },

  readout(s, r) {
    return [
      ['Caught $\\mu$', `$${r.caught}/${s.count}$`],
      [`Long run (${r.longN.toLocaleString('en-US')})`, `$${pct(r.longRate)}$`],
      ['Average width', `$${r.meanWidth.toFixed(2)}$`],
    ];
  },

  explain(s, r) {
    const conf = Math.round(s.conf * 100);
    const crit = s.method === 't' ? String.raw`t_{${((1 - s.conf) / 2).toFixed(3).replace(/0+$/, '')}, ${s.n - 1}}` : String.raw`z_{${((1 - s.conf) / 2).toFixed(3).replace(/0+$/, '')}}`;
    const form = s.method === 'z' ? String.raw`\bar{x} \pm z_{\alpha/2}\,\dfrac{\sigma}{\sqrt{n}}` : s.method === 't' ? String.raw`\bar{x} \pm t_{\alpha/2,\,n-1}\,\dfrac{s}{\sqrt{n}}` : String.raw`\bar{x} \pm z_{\alpha/2}\,\dfrac{s}{\sqrt{n}}`;
    const out = [
      String.raw`Each line is one sample's interval $${form}$, with $${crit} = ${r.crit.toFixed(3)}$; the gold tick is its $\bar{x}$. Green lines caught $\mu = 50$; red ones missed.`,
      String.raw`"${conf}% confident" describes the method: in the long run ${conf}% of such intervals catch $\mu$ (here ${(100 * r.longRate).toFixed(1)}% of ${r.longN.toLocaleString('en-US')}). Any one interval either caught $\mu$ or did not; press New intervals and the count of greens moves around ${conf}.`,
    ];
    if (s.method === 'zs') out.push(String.raw`This one is wrong on purpose: it uses $s$ but the z critical value. $s$ varies from sample to sample, so the intervals need the wider $t$ value; with $n = ${s.n}$ the long-run rate falls short of ${conf}%. Switch to t and it comes back.`);
    else out.push('A higher confidence level means wider intervals; a bigger n means narrower ones at the same confidence.');
    return out;
  },

  predictions: [
    {
      id: 'wider',
      setup: { method: 'z', conf: 0.9, n: 10 },
      change: { conf: 0.99 },
      prompt: 'These are 90% intervals. Raise the confidence level to 99%. The intervals get…',
      options: [['wider', 'wider'], ['same', 'no different in width'], ['narrower', 'narrower']],
      outcome: (b, a) => (a.meanWidth > b.meanWidth * 1.02 ? 'wider' : a.meanWidth < b.meanWidth * 0.98 ? 'narrower' : 'same'),
      expect: 'wider',
      why: 'To catch μ more often, each interval must reach further: z goes from 1.645 to 2.576, so every interval is about 57% wider. Confidence is paid for in width.',
    },
    {
      id: 'n-coverage',
      setup: { method: 'z', conf: 0.95, n: 10 },
      change: { n: 40 },
      prompt: 'Keep 95% but take n = 40 instead of 10. The long-run share of intervals that catch μ…',
      options: [['up', 'goes up'], ['same', 'stays about 95%'], ['down', 'goes down']],
      outcome: (b, a) => (a.longRate > b.longRate + 0.015 ? 'up' : a.longRate < b.longRate - 0.015 ? 'down' : 'same'),
      expect: 'same',
      why: 'The coverage is set by the confidence level, not by n. What n changes is the width: σ/√n halves, so the intervals are half as wide and still catch μ 95% of the time.',
    },
    {
      id: 'z-with-s',
      setup: { method: 't', conf: 0.95, n: 5 },
      change: { method: 'zs' },
      prompt: 'With n = 5 and σ unknown, these are 95% t intervals. Keep s but use z = 1.96 instead of t = 2.776. The long-run coverage…',
      options: [['same', 'stays about 95%'], ['down', 'drops well below 95%'], ['up', 'goes up']],
      outcome: (b, a) => (a.longRate < b.longRate - 0.03 ? 'down' : a.longRate > b.longRate + 0.015 ? 'up' : 'same'),
      expect: 'down',
      why: 'With only 5 values, s is often well below σ, and z does not allow for that. The intervals come out too short and catch μ only about 88% of the time. The t critical value is exactly the widening that restores 95%.',
    },
  ],
});

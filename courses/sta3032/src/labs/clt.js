/**
 * Sampling distributions and the central limit theorem (Ch 7).
 *
 * Three views:
 *   x̄      draw thousands of samples of size n from a population (normal, uniform, skewed or
 *           two-humped) and histogram their means against N(μ, σ/√n);
 *   p̂      the same for a sample proportion, against N(p, √(pq/n));
 *   approx  a binomial's exact bars against its normal approximation, with and without the
 *           continuity correction.
 *
 * What it corrects: that a bigger n makes the DATA normal (it makes x̄ normal; the population
 * never changes), that more samples narrow the sampling distribution (only n does), and that the
 * ±0.5 is fussiness (for small n it is most of the error).
 */
import { defineLab } from './define.js';
import { setup, area, axes, bars, curve, shade, vline, dot, label, histogram, C, alpha } from '../plot/plot.js';
import * as D from '../stats/dist.js';

/** Populations: density for the picture, a sampler, and μ, σ. */
const POPS = {
  normal: { label: 'Normal', lo: 0, hi: 100, mu: 50, sigma: 10, pdf: (x) => D.normPdf(x, 50, 10), draw: (r) => r.normal(50, 10) },
  uniform: { label: 'Uniform', lo: 0, hi: 100, mu: 50, sigma: 60 / Math.sqrt(12), pdf: (x) => D.unifPdf(x, 20, 80), draw: (r) => 20 + 60 * r.uniform() },
  skewed: { label: 'Skewed', lo: 0, hi: 100, mu: 20, sigma: 20, pdf: (x) => D.expPdf(x, 20), draw: (r) => r.exponential(20) },
  bimodal: {
    label: 'Two humps',
    lo: 0,
    hi: 100,
    mu: 50,
    sigma: Math.sqrt(36 + 400),
    pdf: (x) => 0.5 * D.normPdf(x, 30, 6) + 0.5 * D.normPdf(x, 70, 6),
    draw: (r) => r.normal(r.uniform() < 0.5 ? 30 : 70, 6),
  },
};

/** Sample skewness, so a prediction about shape can be scored by a number. */
function skewness(xs, m, s) {
  let k = 0;
  for (let i = 0; i < xs.length; i++) k += ((xs[i] - m) / s) ** 3;
  return k / xs.length;
}

function stats(xs) {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += xs[i];
  const m = s / xs.length;
  let v = 0;
  for (let i = 0; i < xs.length; i++) v += (xs[i] - m) ** 2;
  const sd = Math.sqrt(v / (xs.length - 1));
  return { m, sd, skew: skewness(xs, m, sd) };
}

const fmt = (x, d = 4) => String(Number(x.toFixed(d)));

export default defineLab({
  id: 'clt',
  title: 'Sampling distributions (CLT)',
  ch: ['6', '7'],
  blurb: String.raw`Thousands of samples at once: watch $\bar{x}$ and $\hat{p}$ settle into normal curves with spread $\sigma/\sqrt{n}$, and see what the continuity correction buys.`,
  height: 0.8,
  params: [
    { id: 'mode', label: 'Statistic', type: 'choice', options: [['xbar', String.raw`$\bar{x}$`], ['phat', String.raw`$\hat{p}$`], ['binom', 'Normal approx.']], value: 'xbar' },
    { id: 'pop', label: 'Population', type: 'choice', options: Object.entries(POPS).map(([k, p]) => [k, p.label]), value: 'skewed', show: (s) => s.mode === 'xbar' },
    { id: 'n', label: '$n$ (sample size)', type: 'range', min: 1, max: (s) => (s.mode === 'xbar' ? 100 : 200), step: 1, value: 4 },
    { id: 'pp', label: '$p$', type: 'range', min: 0.01, max: 0.99, step: 0.01, value: 0.3, show: (s) => s.mode !== 'xbar' },
    { id: 'reps', label: 'Number of samples', type: 'choice', options: [[100, '100'], [1000, '1,000'], [5000, '5,000']], value: 1000, show: (s) => s.mode !== 'binom' },
    { id: 'a', label: '$a$', type: 'range', min: 0, max: (s) => s.n, step: 1, value: 1, show: (s) => s.mode === 'binom' },
    { id: 'b', label: '$b$', type: 'range', min: 0, max: (s) => s.n, step: 1, value: 3, show: (s) => s.mode === 'binom' },
    { id: 'cc', label: 'Continuity correction (±0.5)', type: 'toggle', value: true, show: (s) => s.mode === 'binom' },
  ],
  initial: { n: 4 },
  actions: [{ id: 'resample', label: 'New samples', run: (s) => ({ ...s, seed: s.seed + 1 }), show: (s) => s.mode !== 'binom' }],
  scenarios: [
    { id: 'skew-small', label: 'Skewed population, n = 2', state: { mode: 'xbar', pop: 'skewed', n: 2, reps: 5000 } },
    { id: 'skew-40', label: 'Skewed population, n = 40', state: { mode: 'xbar', pop: 'skewed', n: 40, reps: 5000 } },
    { id: 'humps', label: 'Two humps, n = 5', state: { mode: 'xbar', pop: 'bimodal', n: 5, reps: 5000 } },
    { id: 'phat-small', label: 'p̂ with n = 20, p = 0.1 (np(1−p) < 10)', state: { mode: 'phat', n: 20, pp: 0.1, reps: 5000 } },
    { id: 'phat-ok', label: 'p̂ with n = 150, p = 0.3', state: { mode: 'phat', n: 150, pp: 0.3, reps: 5000 } },
    { id: 'approx', label: 'Bin(100, 0.4): P(35 ≤ X ≤ 45)', state: { mode: 'binom', n: 100, pp: 0.4, a: 35, b: 45, cc: true } },
    { id: 'morals', label: 'Notes Ex 7.8: p̂ with n = 60, p = 0.76', state: { mode: 'phat', n: 60, pp: 0.76, reps: 5000 } },
    { id: 'approx-small', label: 'Bin(15, 0.4): P(X ≤ 5), the correction matters', state: { mode: 'binom', n: 15, pp: 0.4, a: 0, b: 5, cc: true } },
  ],

  compute(s, rng) {
    if (s.mode === 'binom') {
      const n = s.n;
      const p = s.pp;
      const mu = n * p;
      const sd = Math.sqrt(n * p * (1 - p));
      const a = Math.min(s.a, s.b);
      const b = Math.max(s.a, s.b);
      const exact = D.binomCdf(b, n, p) - (a > 0 ? D.binomCdf(a - 1, n, p) : 0);
      const approxCC = D.normCdf((b + 0.5 - mu) / sd) - D.normCdf((a - 0.5 - mu) / sd);
      const approxRaw = D.normCdf((b - mu) / sd) - D.normCdf((a - mu) / sd);
      return { mode: 'binom', n, p, mu, sd, a, b, exact, approxCC, approxRaw, npq: n * p * (1 - p) };
    }
    const reps = s.reps;
    const n = s.n;
    const out = new Float64Array(reps);
    let last = null;
    if (s.mode === 'phat') {
      const p = s.pp;
      for (let i = 0; i < reps; i++) out[i] = rng.binomial(n, p) / n;
      const st = stats(out);
      const se = Math.sqrt((p * (1 - p)) / n);
      return { mode: 'phat', n, p, reps, sims: out, mu: p, se, simMean: st.m, simSd: st.sd, simSkew: st.skew, npq: n * p * (1 - p) };
    }
    const P = POPS[s.pop];
    for (let i = 0; i < reps; i++) {
      let t = 0;
      const keep = i === reps - 1 ? [] : null;
      for (let j = 0; j < n; j++) {
        const x = P.draw(rng);
        t += x;
        if (keep) keep.push(x);
      }
      out[i] = t / n;
      if (keep) last = keep;
    }
    const st = stats(out);
    return { mode: 'xbar', n, reps, P, sims: out, last, lastMean: out[reps - 1], mu: P.mu, sigma: P.sigma, se: P.sigma / Math.sqrt(n), simMean: st.m, simSd: st.sd, simSkew: st.skew };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    if (r.mode === 'binom') {
      const lo = Math.max(0, Math.floor(r.mu - 4.5 * r.sd));
      const hi = Math.min(r.n, Math.ceil(r.mu + 4.5 * r.sd));
      let top = D.normPdf(0) / r.sd;
      for (let x = lo; x <= hi; x++) top = Math.max(top, D.binomPmf(x, r.n, r.p));
      const A = area(w, h, { x: [lo - 0.8, hi + 0.8], y: [0, top * 1.15], left: 46 });
      axes(ctx, A, { xLabel: 'x', yLabel: 'P(X = x)', xCount: Math.min(10, hi - lo + 1), xFmt: (v) => (Number.isInteger(v) ? String(v) : '') });
      const f = (x) => D.normPdf(x, r.mu, r.sd);
      const [ea, eb] = s.cc ? [r.a - 0.5, r.b + 0.5] : [r.a, r.b];
      shade(ctx, A, f, ea, eb, alpha(C.teal, 0.28));
      const list = [];
      for (let x = lo; x <= hi; x++) {
        const inside = x >= r.a && x <= r.b;
        list.push([x - 0.5, x + 0.5, D.binomPmf(x, r.n, r.p), inside ? alpha(C.gold, 0.55) : alpha(C.blue, 0.35)]);
      }
      bars(ctx, A, list, { stroke: alpha(C.bg, 0.9) });
      curve(ctx, A, f, lo - 0.8, hi + 0.8, { color: C.teal, width: 2 });
      vline(ctx, A, ea, { color: C.teal, dash: [3, 3], width: 1 });
      vline(ctx, A, eb, { color: C.teal, dash: [3, 3], width: 1 });
      return { A };
    }

    if (r.mode === 'phat') {
      const lo = Math.max(0, r.p - 4.5 * r.se);
      const hi = Math.min(1, r.p + 4.5 * r.se);
      const span = hi - lo;
      // One bin per possible value of p̂ when they are few enough to see; else 40 bins.
      const step = span * r.n <= 60 ? 1 / r.n : span / 40;
      const b0 = r.n * step === 1 ? -0.5 / r.n : lo;
      const nb = Math.ceil((hi - b0) / step);
      const counts = histogram(r.sims, b0, b0 + nb * step, nb);
      const dens = Array.from(counts, (c) => c / (r.reps * step));
      const top = Math.max(D.normPdf(0) / r.se, ...dens);
      const A = area(w, h, { x: [b0, b0 + nb * step], y: [0, top * 1.12], left: 46 });
      axes(ctx, A, { xLabel: 'p̂', yLabel: 'density' });
      bars(ctx, A, dens.map((d, i) => [b0 + i * step, b0 + (i + 1) * step, d]), { fill: alpha(C.teal, 0.5), gap: 1 });
      curve(ctx, A, (x) => D.normPdf(x, r.p, r.se), b0, b0 + nb * step, { color: C.gold, width: 2 });
      vline(ctx, A, r.p, { color: C.text, label: 'p', dash: [3, 4], width: 1 });
      return { A };
    }

    // x̄: the population on top (its own vertical scale), the sampling distribution below.
    const { P } = r;
    const split = Math.round(h * 0.34);
    let pmax = 0;
    for (let i = 0; i <= 200; i++) pmax = Math.max(pmax, P.pdf(P.lo + ((P.hi - P.lo) * i) / 200));
    const T = area(w, split, { x: [P.lo, P.hi], y: [0, pmax * 1.25], left: 46, bottom: 18 });
    axes(ctx, T, { yTicks: false, xTicks: false });
    shade(ctx, T, P.pdf, P.lo, P.hi, alpha(C.blue, 0.18));
    curve(ctx, T, P.pdf, P.lo, P.hi, { color: C.blue, width: 1.8 });
    label(ctx, 'population', T.x1, T.y0 + 2, { color: C.blue, baseline: 'top', align: 'right' });
    // The last sample, as dots on the population's axis, and its mean.
    if (r.last && r.last.length <= 100) {
      for (let i = 0; i < r.last.length; i++) dot(ctx, T, Math.max(P.lo, Math.min(P.hi, r.last[i])), pmax * 0.08 + ((i * 7) % 5) * pmax * 0.05, { color: alpha(C.gold, 0.8), r: 2.5 });
    }
    vline(ctx, T, P.mu, { color: C.text, dash: [3, 4], width: 1, label: 'μ' });

    const nb = 50;
    const step = (P.hi - P.lo) / nb;
    const counts = histogram(r.sims, P.lo, P.hi, nb);
    const dens = Array.from(counts, (c) => c / (r.reps * step));
    const peak = Math.max(D.normPdf(0) / r.se, ...dens);
    const A = area(w, h, { x: [P.lo, P.hi], y: [0, peak * 1.12], left: 46, top: split + 10 });
    axes(ctx, A, { xLabel: 'x̄', yLabel: '' });
    label(ctx, `means of ${r.reps.toLocaleString('en-US')} samples, n = ${r.n}`, A.x1, A.y0 - 14, { color: C.teal, baseline: 'top', align: 'right' });
    bars(ctx, A, dens.map((d, i) => [P.lo + i * step, P.lo + (i + 1) * step, d]), { fill: alpha(C.teal, 0.5), gap: 1 });
    curve(ctx, A, (x) => D.normPdf(x, r.mu, r.se), P.lo, P.hi, { color: C.gold, width: 2 });
    vline(ctx, A, r.lastMean, { color: C.gold, dash: null, width: 2 });
    return { A };
  },

  readout(s, r) {
    if (r.mode === 'binom') {
      return [
        [String.raw`Exact $P(${r.a} \le X \le ${r.b})$`, `$${r.exact.toFixed(4)}$`],
        [s.cc ? 'Normal, with ±0.5' : 'Normal, no correction', `$${(s.cc ? r.approxCC : r.approxRaw).toFixed(4)}$`],
        ['$np(1-p)$', `$${fmt(r.npq, 2)}$${r.npq >= 10 ? '' : ' (< 10)'}`],
      ];
    }
    if (r.mode === 'phat') {
      return [
        [String.raw`SD of the $\hat{p}$'s`, `$${r.simSd.toFixed(4)}$`],
        [String.raw`$\sqrt{p(1-p)/n}$`, `$${r.se.toFixed(4)}$`],
        ['$np(1-p)$', `$${fmt(r.npq, 2)}$`],
      ];
    }
    return [
      [String.raw`SD of the $\bar{x}$'s`, `$${r.simSd.toFixed(2)}$`],
      [String.raw`$\sigma/\sqrt{n}$`, `$${r.se.toFixed(2)}$`],
      [String.raw`Mean of the $\bar{x}$'s`, `$${r.simMean.toFixed(2)}$`],
    ];
  },

  explain(s, r) {
    if (r.mode === 'binom') {
      const out = [
        String.raw`$X \sim \text{Bin}(${r.n}, ${r.p})$ has $\mu = np = ${fmt(r.mu, 3)}$ and $\sigma = \sqrt{np(1-p)} = ${fmt(r.sd, 4)}$. The bars are exact; the teal curve is $N(\mu, \sigma^2)$.`,
        String.raw`Each bar stands on an interval of width 1: the bar for $x$ covers $x - 0.5$ to $x + 0.5$. So the area that matches $P(${r.a} \le X \le ${r.b})$ runs from $${r.a} - 0.5$ to $${r.b} + 0.5$. Without the correction you cut half of each end bar off. Switch it off to see the difference: here it is ${Math.abs(r.approxRaw - r.exact).toFixed(4)} without, ${Math.abs(r.approxCC - r.exact).toFixed(4)} with.`,
      ];
      out.push(r.npq >= 10 ? String.raw`$np(1-p) = ${fmt(r.npq, 2)} \ge 10$, so the notes allow the approximation.` : String.raw`$np(1-p) = ${fmt(r.npq, 2)} < 10$: the notes' condition fails, and the bars are visibly lopsided against the curve. Use the binomial itself.`);
      return out;
    }
    if (r.mode === 'phat') {
      return [
        String.raw`Each sample of $n = ${r.n}$ gives one $\hat{p} = X/n$. The histogram is ${r.reps.toLocaleString('en-US')} of them; the gold curve is $N\big(p, \tfrac{p(1-p)}{n}\big)$.`,
        r.npq >= 10
          ? String.raw`With $np(1-p) = ${fmt(r.npq, 2)} \ge 10$, the normal curve fits: this is what licenses a z test or interval for a proportion.`
          : String.raw`With $np(1-p) = ${fmt(r.npq, 2)} < 10$, $\hat{p}$ can only take a few values and piles up against ${r.p < 0.5 ? '0' : '1'}: the normal curve is a poor fit, and a z procedure would be off.`,
      ];
    }
    return [
      String.raw`Top: the population, with $\mu = ${fmt(r.mu, 2)}$, $\sigma = ${fmt(r.sigma, 2)}$; the gold dots are the last sample. Bottom: the means of ${r.reps.toLocaleString('en-US')} samples of size $n = ${r.n}$, against $N(\mu, \sigma^2/n)$ in gold.`,
      String.raw`The means center on $\mu$ and spread as $\sigma/\sqrt{n} = ${fmt(r.se, 2)}$. Their shape turns normal as $n$ grows even though the population keeps its shape: that is the central limit theorem. The notes use $n \ge 30$ as the rule of thumb; a normal population needs no rule at all.`,
    ];
  },

  predictions: [
    {
      id: 'sd-n4',
      setup: { mode: 'xbar', pop: 'skewed', n: 4, reps: 5000 },
      change: { n: 16 },
      prompt: 'The means of samples of size n = 4 from a skewed population have some spread. Make the samples four times as big, n = 16. The spread (SD) of the sample means becomes…',
      options: [['quarter', 'a quarter as big'], ['half', 'half as big'], ['same', 'about the same']],
      outcome: (b, a) => {
        const k = a.simSd / b.simSd;
        return k < 0.35 ? 'quarter' : k < 0.65 ? 'half' : 'same';
      },
      expect: 'half',
      why: 'The SD of x̄ is σ/√n. Four times the sample size divides it by √4 = 2. To halve the spread you need four times the data; that square root is why precision is expensive.',
    },
    {
      id: 'shape',
      setup: { mode: 'xbar', pop: 'skewed', n: 2, reps: 5000 },
      change: { n: 40 },
      prompt: 'With n = 2 from a skewed population, the sample means are skewed too. Take n = 40. The histogram of sample means…',
      options: [['skewed', 'stays skewed like the population'], ['normal', 'looks close to normal'], ['more', 'gets more skewed']],
      outcome: (b, a) => (a.simSkew < 0.6 && a.simSkew < b.simSkew ? 'normal' : a.simSkew > b.simSkew ? 'more' : 'skewed'),
      expect: 'normal',
      why: 'Averaging washes out the long tail: the skewness of x̄ falls like 1/√n (here from about 1.4 to about 0.3). The population above has not changed at all; only the distribution of the MEAN has become normal.',
    },
    {
      id: 'reps',
      setup: { mode: 'xbar', pop: 'normal', n: 10, reps: 100 },
      change: { reps: 5000 },
      prompt: 'Now keep n = 10 but draw 5,000 samples instead of 100. The spread of the sample means…',
      options: [['down', 'shrinks a lot'], ['same', 'stays about the same'], ['up', 'grows']],
      outcome: (b, a) => {
        const k = a.simSd / b.simSd;
        return k < 0.75 ? 'down' : k > 1.33 ? 'up' : 'same';
      },
      expect: 'same',
      why: 'The number of samples only fills in the histogram: it gets smoother, but its spread is still σ/√n = 10/√10 = 3.16. Only the size of EACH sample, n, narrows the sampling distribution.',
    },
    {
      id: 'cc-small',
      setup: { mode: 'binom', n: 15, pp: 0.4, a: 0, b: 5, cc: true },
      change: { cc: false },
      prompt: 'For Bin(15, 0.4), the normal approximation with the continuity correction gives P(X ≤ 5) close to the exact 0.4032. Drop the correction. The approximation…',
      options: [['close', 'is still about as close'], ['worse', 'gets much worse'], ['better', 'gets better']],
      outcome: (b, a) => {
        const e0 = Math.abs(b.approxCC - b.exact);
        const e1 = Math.abs(a.approxRaw - a.exact);
        return e1 > 3 * e0 && e1 > 0.03 ? 'worse' : e1 < e0 ? 'better' : 'close';
      },
      expect: 'worse',
      why: 'Without ±0.5, the area stops at 5 and misses the right half of the bar for X = 5: about 0.10 of probability. The correction matters most when σ is small, because each bar is then a big share of the whole.',
    },
  ],
});

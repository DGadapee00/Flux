/**
 * Distributions (Ch 3, 5, 6; t, χ² and F for Ch 8–9). Pick a distribution, move its parameters,
 * and shade an event: its probability, mean and standard deviation update as you go.
 *
 * What it is for: the shapes that surprise people. A binomial's most likely value becomes LESS
 * likely as n grows; a normal keeps 68% within one σ whatever σ is; a Poisson's spread grows as
 * √μ; t has heavier tails than z until df is large; a geometric's most likely value is always 1.
 */
import { defineLab } from './define.js';
import { setup, area, axes, bars, curve, shade, vline, C, alpha } from '../plot/plot.js';
import * as D from '../stats/dist.js';

const DISTS = [
  ['binom', 'Binomial'],
  ['geom', 'Geometric'],
  ['pois', 'Poisson'],
  ['hyper', 'Hypergeometric'],
  ['unif', 'Uniform'],
  ['norm', 'Normal'],
  ['exp', 'Exponential'],
  ['t', 't'],
  ['chi2', 'Chi-squared'],
  ['f', 'F'],
];
const DISCRETE = new Set(['binom', 'geom', 'pois', 'hyper']);

/** Everything about the chosen distribution: support, pmf/pdf, cdf, mean, sd, plot range. */
export function model(s) {
  switch (s.dist) {
    case 'binom':
      return { disc: true, lo: 0, hi: s.n, pmf: (x) => D.binomPmf(x, s.n, s.p), cdf: (x) => D.binomCdf(x, s.n, s.p), mean: s.n * s.p, sd: Math.sqrt(s.n * s.p * (1 - s.p)), name: String.raw`\text{Bin}(${s.n}, ${s.p})` };
    case 'geom': {
      const hi = Math.max(5, Math.min(80, Math.ceil(Math.log(0.002) / Math.log(1 - s.p))));
      return { disc: true, lo: 1, hi, pmf: (x) => D.geomPmf(x, s.p), cdf: (x) => D.geomCdf(x, s.p), mean: 1 / s.p, sd: Math.sqrt(1 - s.p) / s.p, name: String.raw`\text{Geom}(${s.p})` };
    }
    case 'pois': {
      let hi = Math.ceil(s.lam);
      while (D.poisCdf(hi, s.lam) < 0.9995) hi++;
      return { disc: true, lo: 0, hi: Math.max(hi, 5), pmf: (x) => D.poisPmf(x, s.lam), cdf: (x) => D.poisCdf(x, s.lam), mean: s.lam, sd: Math.sqrt(s.lam), name: String.raw`\text{Poisson}(${s.lam})` };
    }
    case 'hyper': {
      // hN items, hK of them successes, a sample of hn drawn without replacement.
      const N = s.hN;
      const K = Math.min(s.hK, N);
      const n = Math.min(s.hn, N);
      const q = K / N;
      return {
        disc: true,
        lo: Math.max(0, n - (N - K)),
        hi: Math.min(n, K),
        pmf: (x) => D.hyperPmf(x, N, n, K),
        cdf: (x) => D.hyperCdf(x, N, n, K),
        mean: n * q,
        sd: Math.sqrt(N > 1 ? n * q * (1 - q) * ((N - n) / (N - 1)) : 0),
        name: String.raw`h(x;\ ${N}, ${n}, ${K})`,
      };
    }
    case 'exp':
      return { disc: false, lo: 0, hi: Math.max(1, 7 * s.beta), pdf: (x) => D.expPdf(x, s.beta), cdf: (x) => D.expCdf(x, s.beta), mean: s.beta, sd: s.beta, name: String.raw`\text{Exp}(\beta = ${s.beta})` };
    case 'unif': {
      const A = Math.min(s.ua, s.ub - 0.5);
      const B = Math.max(s.ub, A + 0.5);
      const pad = (B - A) * 0.2;
      return { disc: false, lo: A - pad, hi: B + pad, pdf: (x) => D.unifPdf(x, A, B), cdf: (x) => D.unifCdf(x, A, B), mean: (A + B) / 2, sd: (B - A) / Math.sqrt(12), name: String.raw`U(${A}, ${B})` };
    }
    case 'norm':
      return { disc: false, lo: s.m - 4 * s.sd, hi: s.m + 4 * s.sd, pdf: (x) => D.normPdf(x, s.m, s.sd), cdf: (x) => D.normCdf(x, s.m, s.sd), mean: s.m, sd: s.sd, name: String.raw`N(${s.m}, ${s.sd}^2)` };
    case 't':
      return { disc: false, lo: -5, hi: 5, pdf: (x) => D.tPdf(x, s.df), cdf: (x) => D.tCdf(x, s.df), mean: s.df > 1 ? 0 : NaN, sd: s.df > 2 ? Math.sqrt(s.df / (s.df - 2)) : Infinity, name: String.raw`t_{${s.df}}` };
    case 'chi2':
      return { disc: false, lo: 0, hi: Math.max(8, D.chi2Crit(0.001, s.k)), pdf: (x) => D.chi2Pdf(x, s.k), cdf: (x) => D.chi2Cdf(x, s.k), mean: s.k, sd: Math.sqrt(2 * s.k), name: String.raw`\chi^2_{${s.k}}` };
    default: {
      const hi = Math.min(12, Math.max(4, D.fCrit(0.01, s.d1, s.d2)));
      const m = s.d2 > 2 ? s.d2 / (s.d2 - 2) : NaN;
      const v = s.d2 > 4 ? (2 * s.d2 ** 2 * (s.d1 + s.d2 - 2)) / (s.d1 * (s.d2 - 2) ** 2 * (s.d2 - 4)) : NaN;
      return { disc: false, lo: 0, hi, pdf: (x) => D.fPdf(x, s.d1, s.d2), cdf: (x) => D.fCdf(x, s.d1, s.d2), mean: m, sd: Math.sqrt(v), name: String.raw`F_{${s.d1},\,${s.d2}}` };
    }
  }
}

/** The event's bounds, clamped into the plotted range. */
function bounds(s, M) {
  const clampX = (x) => Math.max(M.lo, Math.min(M.hi, x));
  const a = clampX(s.a);
  const b = clampX(Math.max(s.a, s.b));
  return M.disc ? [Math.round(a), Math.round(b)] : [a, b];
}

/** P(event) and its TeX. */
function eventProb(s, M) {
  const [a, b] = bounds(s, M);
  if (M.disc) {
    if (s.ev === 'le') return { p: M.cdf(a), tex: String.raw`P(X \le ${a})`, in: (x) => x <= a };
    if (s.ev === 'ge') return { p: 1 - M.cdf(a - 1), tex: String.raw`P(X \ge ${a})`, in: (x) => x >= a };
    if (s.ev === 'eq') return { p: M.pmf(a), tex: `P(X = ${a})`, in: (x) => x === a };
    return { p: M.cdf(b) - M.cdf(a - 1), tex: String.raw`P(${a} \le X \le ${b})`, in: (x) => x >= a && x <= b };
  }
  const f = (x) => Number(x.toPrecision(4));
  if (s.ev === 'le') return { p: M.cdf(a), tex: String.raw`P(X \le ${f(a)})`, lo: -Infinity, hi: a };
  if (s.ev === 'ge') return { p: 1 - M.cdf(a), tex: String.raw`P(X \ge ${f(a)})`, lo: a, hi: Infinity };
  if (s.ev === 'eq') return { p: 0, tex: `P(X = ${f(a)})`, lo: a, hi: a };
  return { p: M.cdf(b) - M.cdf(a), tex: String.raw`P(${f(a)} \le X \le ${f(b)})`, lo: a, hi: b };
}

/** The most likely value of a discrete distribution (the smallest one, on a tie). */
function mode(M) {
  let best = M.lo;
  for (let x = M.lo; x <= M.hi; x++) if (M.pmf(x) > M.pmf(best) + 1e-12) best = x;
  return best;
}

const cont = (s) => !DISCRETE.has(s.dist);
/**
 * The step for a and b: a power of ten, about a two-hundredth of the plotted range. The slider runs
 * between multiples of it, so a round value (35 inches, 0.52) is one the slider can hold exactly.
 */
const stepOf = (s) => {
  if (!cont(s)) return 1;
  const M = model(s);
  return 10 ** Math.floor(Math.log10((M.hi - M.lo) / 200));
};
const edge = (s, i) => {
  const M = model(s);
  const st = stepOf(s);
  return Number((i ? Math.ceil(M.hi / st) * st : Math.floor(M.lo / st) * st).toFixed(6));
};
const span = (s) => {
  const M = model(s);
  return [M.lo, M.hi];
};

export default defineLab({
  id: 'dist',
  title: 'Distributions',
  ch: ['3', '5', '6', '8', '9'],
  blurb: 'Every distribution in the course, with its parameters on sliders and any event shaded.',
  params: [
    { id: 'dist', label: 'Distribution', type: 'choice', options: DISTS, value: 'binom', select: true },
    { id: 'n', label: '$n$', type: 'range', min: 1, max: 60, step: 1, value: 10, show: (s) => s.dist === 'binom' },
    { id: 'p', label: '$p$', type: 'range', min: 0.01, max: 0.99, step: 0.01, value: 0.3, show: (s) => s.dist === 'binom' || s.dist === 'geom' },
    { id: 'lam', label: String.raw`$\mu = \lambda t$`, type: 'range', min: 0.1, max: 30, step: 0.1, value: 4, show: (s) => s.dist === 'pois' },
    { id: 'hN', label: '$N$ (items in all)', type: 'range', min: 2, max: 60, step: 1, value: 20, show: (s) => s.dist === 'hyper' },
    { id: 'hK', label: '$k$ (successes among them)', type: 'range', min: 0, max: (s) => s.hN, step: 1, value: 4, show: (s) => s.dist === 'hyper' },
    { id: 'hn', label: '$n$ (sample, no replacement)', type: 'range', min: 1, max: (s) => s.hN, step: 1, value: 5, show: (s) => s.dist === 'hyper' },
    { id: 'beta', label: String.raw`$\beta$ (mean)`, type: 'range', min: 0.1, max: 20, step: 0.1, value: 2, show: (s) => s.dist === 'exp' },
    { id: 'ua', label: '$A$', type: 'range', min: -10, max: 20, step: 0.5, value: 0, show: (s) => s.dist === 'unif' },
    { id: 'ub', label: '$B$', type: 'range', min: -9, max: 30, step: 0.5, value: 4, show: (s) => s.dist === 'unif' },
    { id: 'm', label: String.raw`$\mu$`, type: 'range', min: -50, max: 200, step: 0.5, value: 0, show: (s) => s.dist === 'norm' },
    { id: 'sd', label: String.raw`$\sigma$`, type: 'range', min: 0.5, max: 50, step: 0.5, value: 1, show: (s) => s.dist === 'norm' },
    { id: 'df', label: String.raw`$\nu$ (df)`, type: 'range', min: 1, max: 60, step: 1, value: 5, show: (s) => s.dist === 't' },
    { id: 'k', label: String.raw`$\nu$ (df)`, type: 'range', min: 1, max: 40, step: 1, value: 4, show: (s) => s.dist === 'chi2' },
    { id: 'd1', label: String.raw`$\nu_1$`, type: 'range', min: 1, max: 40, step: 1, value: 3, show: (s) => s.dist === 'f' },
    { id: 'd2', label: String.raw`$\nu_2$`, type: 'range', min: 1, max: 40, step: 1, value: 10, show: (s) => s.dist === 'f' },
    { id: 'ev', label: 'Event', type: 'choice', options: [['le', '≤ a'], ['ge', '≥ a'], ['between', 'a to b'], ['eq', '= a']], value: 'le' },
    { id: 'a', label: '$a$', type: 'range', min: (s) => edge(s, 0), max: (s) => edge(s, 1), step: stepOf, value: 3 },
    { id: 'b', label: '$b$', type: 'range', min: (s) => edge(s, 0), max: (s) => edge(s, 1), step: stepOf, value: 5, show: (s) => s.ev === 'between' },
    { id: 'zref', label: 'Show the standard normal for comparison', type: 'toggle', value: true, show: (s) => s.dist === 't' },
  ],
  scenarios: [
    { id: 'recover', label: 'Binomial: patients recovering (n = 15, p = 0.4)', state: { dist: 'binom', n: 15, p: 0.4, ev: 'ge', a: 10, b: 12 } },
    { id: 'defect', label: 'Geometric: first defective (p = 0.2)', state: { dist: 'geom', p: 0.2, ev: 'le', a: 5, b: 8 } },
    { id: 'tankers', label: 'Poisson: tankers per day (μ = 10)', state: { dist: 'pois', lam: 10, ev: 'ge', a: 16, b: 20 } },
    { id: 'cedar', label: 'Uniform: cedar growth (6 to 11 in.)', state: { dist: 'unif', ua: 6, ub: 11, ev: 'between', a: 9, b: 10 } },
    { id: 'heights', label: 'Normal: heights of girls (38.72, 3.17)', state: { dist: 'norm', m: 38.72, sd: 3.17, ev: 'le', a: 35, b: 40 } },
    { id: 'tz', label: 't with 3 df against z', state: { dist: 't', df: 3, zref: true, ev: 'ge', a: 2, b: 3 } },
    { id: 'f', label: 'F(3, 10): the upper 5% point', state: { dist: 'f', d1: 3, d2: 10, ev: 'ge', a: 3.71, b: 5 } },
    // The worked examples in the notes, one scenario each ("Show this in the lab").
    { id: 'bin4', label: 'Notes Ex 3.3: cars with airbags, Bin(4, 0.5)', state: { dist: 'binom', n: 4, p: 0.5, ev: 'le', a: 2, b: 3 } },
    { id: 'favor', label: 'Notes Ex 5.3: at most 6 of 15 in favor, Bin(15, 0.65)', state: { dist: 'binom', n: 15, p: 0.65, ev: 'le', a: 6, b: 10 } },
    { id: 'wireless', label: 'Notes Ex 5.4: 5 to 7 of 20 households, Bin(20, 0.41)', state: { dist: 'binom', n: 20, p: 0.41, ev: 'between', a: 5, b: 7 } },
    { id: 'items', label: 'Notes Ex 5.6: first defective within 5 items, p = 0.01', state: { dist: 'geom', p: 0.01, ev: 'le', a: 5, b: 8 } },
    { id: 'deaths', label: 'Notes Ex 5.8: at least one death, μ = 1.5', state: { dist: 'pois', lam: 1.5, ev: 'ge', a: 1, b: 3 } },
    { id: 'lot', label: 'Hypergeometric: 2 defectives in a sample of 5 from 20 (4 bad)', state: { dist: 'hyper', hN: 20, hK: 4, hn: 5, ev: 'eq', a: 2, b: 3 } },
    { id: 'z052', label: 'Notes Ex 6.2: P(Z < 0.52)', state: { dist: 'norm', m: 0, sd: 1, ev: 'le', a: 0.52, b: 1 } },
    { id: 'run', label: 'Notes Ex 6.4: a 10-km time between 55 and 70 minutes', state: { dist: 'norm', m: 61, sd: 9, ev: 'between', a: 55, b: 70 } },
    { id: 'chi9', label: 'Chi-squared, 9 df: a sample variance over twice σ² (n = 10)', state: { dist: 'chi2', k: 9, ev: 'ge', a: 18, b: 20 } },
    { id: 'wait', label: 'Exponential: a wait over 1 minute, β = 0.5', state: { dist: 'exp', beta: 0.5, ev: 'ge', a: 1, b: 2 } },
  ],
  compute(s) {
    const M = model(s);
    const E = eventProb(s, M);
    const out = { M, E, mean: M.mean, sd: M.sd };
    if (M.disc) out.mode = mode(M);
    if (s.dist === 't') out.tailT = 1 - D.tCdf(2, s.df);
    if (M.disc) out.pMode = M.pmf(out.mode);
    return out;
  },
  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const { M, E } = r;
    if (M.disc) {
      let top = 0;
      for (let x = M.lo; x <= M.hi; x++) top = Math.max(top, M.pmf(x));
      const A = area(w, h, { x: [M.lo - 0.6, M.hi + 0.6], y: [0, top * 1.12], left: 46 });
      axes(ctx, A, { xLabel: 'x', yLabel: 'f(x)', xCount: Math.min(10, M.hi - M.lo + 1), xFmt: (v) => (Number.isInteger(v) ? String(v) : '') });
      const width = Math.min(0.8, Math.max(0.3, 30 / (M.hi - M.lo + 1)));
      const list = [];
      for (let x = M.lo; x <= M.hi; x++) list.push([x - width / 2, x + width / 2, M.pmf(x), E.in(x) ? alpha(C.gold, 0.9) : alpha(C.blue, 0.5)]);
      bars(ctx, A, list);
      vline(ctx, A, M.mean, { color: C.text, label: 'μ', dash: [3, 4], width: 1 });
      return { A };
    }
    let top = 0;
    const n = 300;
    for (let i = 0; i <= n; i++) {
      const v = M.pdf(M.lo + ((M.hi - M.lo) * i) / n);
      if (Number.isFinite(v)) top = Math.max(top, v);
    }
    if (s.dist === 't' && s.zref) top = Math.max(top, D.normPdf(0));
    top = Math.min(top, s.dist === 'chi2' || s.dist === 'f' ? Math.max(1.2, top) : top);
    const A = area(w, h, { x: [M.lo, M.hi], y: [0, top * 1.12], left: 46 });
    axes(ctx, A, { xLabel: 'x', yLabel: 'f(x)' });
    if (E.hi > E.lo) shade(ctx, A, M.pdf, E.lo, E.hi, alpha(C.gold, 0.55));
    if (s.dist === 't' && s.zref) curve(ctx, A, (x) => D.normPdf(x), M.lo, M.hi, { color: C.blue, width: 1.5, dash: [5, 4] });
    curve(ctx, A, M.pdf, M.lo, M.hi, { color: C.teal, width: 2.2 });
    if (s.ev === 'eq') vline(ctx, A, E.lo, { color: C.gold, dash: null, width: 2, label: 'a' });
    if (Number.isFinite(M.mean)) vline(ctx, A, M.mean, { color: C.text, label: 'μ', dash: [3, 4], width: 1 });
    return { A };
  },
  readout(s, r) {
    const f = (x) => (Number.isFinite(x) ? String(Number(x.toPrecision(5))) : '—');
    return [
      [`$${r.E.tex}$`, `$${r.E.p.toFixed(4)}$`],
      [String.raw`$\mu$`, `$${f(r.mean)}$`],
      [String.raw`$\sigma$`, `$${Number.isFinite(r.sd) ? f(r.sd) : r.sd === Infinity ? '\\infty' : '—'}$`],
    ];
  },
  explain(s, r) {
    const out = [String.raw`$X \sim ${r.M.name}$.`];
    if (r.M.disc) out.push('Each bar is P(X = x); the gold bars make up the event, and their heights add to the probability shown.');
    else out.push('The probability of the event is the gold area under the density curve. For a continuous variable, P(X = a) = 0: a single value has no width.');
    if (s.dist === 'binom') out.push(String.raw`$\mu = np$, $\sigma = \sqrt{np(1-p)}$. With $p = 0.5$ the bars are symmetric; otherwise they lean away from the nearer end, less so as $n$ grows.`);
    if (s.dist === 'hyper') out.push(String.raw`Drawing without replacement changes the chance of a success from draw to draw, so this is not a binomial. $\mu = n\frac{k}{N}$, the same as the binomial with $p = k/N$, but the variance carries the extra factor $\frac{N - n}{N - 1}$: a smaller spread, because each draw tells you something about what is left.`);
    if (s.dist === 'exp') out.push(String.raw`The exponential is the waiting time between events of a Poisson process: with $\lambda$ events per unit of time, the wait has $\beta = 1/\lambda$. $\mu = \sigma = \beta$, and $P(X > x) = e^{-x/\beta}$. It forgets: having waited $t$ already, the chance of waiting $x$ more is still $e^{-x/\beta}$.`);
    if (s.dist === 'geom') out.push(String.raw`$\mu = 1/p$. Whatever $p$ is, the most likely trial for the first success is the first one: every later trial needs failures first.`);
    if (s.dist === 'pois') out.push(String.raw`For a Poisson, $\sigma^2 = \mu$: the spread grows like $\sqrt{\mu}$, and the shape looks more and more normal as $\mu$ grows.`);
    if (s.dist === 'norm') out.push(String.raw`About 68% of the area lies within one $\sigma$ of $\mu$, 95% within two, whatever $\mu$ and $\sigma$ are: standardizing, $z = (x-\mu)/\sigma$, turns every normal into the same curve.`);
    if (s.dist === 't') out.push(String.raw`The t curve (teal) has heavier tails than z (dashed). As $\nu$ grows it closes in on z; that is why the last row of Table A.4 is the z value.`);
    if (s.dist === 'chi2') out.push(String.raw`$\chi^2_\nu$ is skewed right, with mean $\nu$; it spreads and becomes more symmetric as $\nu$ grows.`);
    if (s.dist === 'f') out.push(String.raw`$F_{\nu_1,\nu_2}$ is skewed right and never negative, centered near 1. Swapping $\nu_1$ and $\nu_2$ flips it: $f_{1-\alpha}(\nu_1,\nu_2) = 1/f_\alpha(\nu_2,\nu_1)$.`);
    return out;
  },
  predictions: [
    {
      id: 'normal-68',
      setup: { dist: 'norm', m: 100, sd: 15, ev: 'between', a: 85, b: 115 },
      change: { sd: 30, a: 70, b: 130 },
      prompt: 'X is normal with μ = 100, σ = 15, and the shaded event is “within one σ of μ” (85 to 115). Double σ to 30 and keep the event “within one σ” (70 to 130). The probability…',
      options: [['up', 'goes up'], ['same', 'stays the same'], ['down', 'goes down']],
      outcome: (b, a) => (Math.abs(a.E.p - b.E.p) < 1e-6 ? 'same' : a.E.p > b.E.p ? 'up' : 'down'),
      expect: 'same',
      why: 'Standardizing turns “within one σ” into P(−1 < Z < 1) = 0.6827 for every normal. A bigger σ spreads the curve out, but the one-σ band widens with it.',
    },
    {
      id: 'binom-mode',
      setup: { dist: 'binom', n: 10, p: 0.5, ev: 'eq', a: 5, b: 5 },
      change: { n: 40, a: 20, b: 20 },
      prompt: 'X ~ Bin(10, 0.5), and the shaded event is X = 5, its most likely value. Now take n = 40 and shade X = 20, again the most likely value. P(most likely value)…',
      options: [['up', 'goes up'], ['same', 'stays the same'], ['down', 'goes down']],
      outcome: (b, a) => (a.E.p > b.E.p + 1e-6 ? 'up' : a.E.p < b.E.p - 1e-6 ? 'down' : 'same'),
      expect: 'down',
      why: 'With more trials there are more possible values, and the probability spreads over them: σ = √(np(1−p)) grows from 1.58 to 3.16. The center is still the most likely value, but it is less likely (0.246 → 0.125).',
    },
    {
      id: 'poisson-sd',
      setup: { dist: 'pois', lam: 2, ev: 'le', a: 2, b: 4 },
      change: { lam: 8, a: 8 },
      prompt: 'A Poisson with μ = 2 has standard deviation about 1.41. Raise μ to 8 (four times as big). The standard deviation becomes…',
      options: [['x4', 'four times as big'], ['x2', 'twice as big'], ['same', 'the same']],
      outcome: (b, a) => {
        const k = a.sd / b.sd;
        return Math.abs(k - 4) < 0.05 ? 'x4' : Math.abs(k - 2) < 0.05 ? 'x2' : 'same';
      },
      expect: 'x2',
      why: 'For a Poisson the VARIANCE equals μ, so σ = √μ. Four times the mean is twice the spread.',
    },
    {
      id: 't-tails',
      setup: { dist: 't', df: 3, zref: true, ev: 'ge', a: 2, b: 3 },
      change: { df: 30 },
      prompt: 'For t with 3 degrees of freedom, P(T ≥ 2) is shaded. Raise ν to 30. P(T ≥ 2)…',
      options: [['up', 'goes up'], ['same', 'stays the same'], ['down', 'goes down']],
      outcome: (b, a) => (a.E.p > b.E.p + 1e-6 ? 'up' : a.E.p < b.E.p - 1e-6 ? 'down' : 'same'),
      expect: 'down',
      why: 'With few degrees of freedom, s is a shaky estimate of σ, and t has heavy tails to allow for it (0.070 beyond 2 at ν = 3). With ν = 30 the curve is close to z, and the tail shrinks to 0.027 (z gives 0.023).',
    },
    {
      id: 'geom-mode',
      setup: { dist: 'geom', p: 0.3, ev: 'eq', a: 1, b: 1 },
      change: { p: 0.05 },
      prompt: 'X is the trial of the first success, with p = 0.3; its most likely value is X = 1. Lower p to 0.05, so success is rare. The most likely value of X…',
      options: [['same', 'is still 1'], ['up', 'moves to about 1/p = 20'], ['mid', 'moves somewhere in between']],
      outcome: (b, a) => (a.mode === 1 ? 'same' : a.mode >= 15 ? 'up' : 'mid'),
      expect: 'same',
      why: 'P(X = x) = p(1 − p)^(x−1) shrinks with every extra trial, because each later trial needs another failure first. The mean moves out to 1/p = 20, but the single most likely trial is always the first.',
    },
  ],
});

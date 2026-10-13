/**
 * Paired vs independent (Ch 9). The same subjects measured twice, before and after a treatment.
 * Each subject has their own level (the spread between subjects) plus a little measurement noise;
 * the treatment adds δ. The data are analyzed both ways: the paired t test on the differences, and
 * (wrongly) the two-sample t test as if the columns were independent.
 *
 * What it corrects: that pairing is a formality. Differencing cancels each subject's own level, so
 * the paired test sees only the noise; the two-sample test has to see the effect through all of
 * the between-subject spread.
 */
import { defineLab } from './define.js';
import { setup, area, axes, dot, segment, label, C, alpha } from '../plot/plot.js';
import { pairedTest, welchTest, mean, sd } from '../stats/infer.js';

const NOISE = 2;
const BASE = 50;

const pf = (p) => (p < 0.0001 ? '< 0.0001' : p.toFixed(4));

export default defineLab({
  id: 'paired',
  title: 'Paired vs independent',
  ch: ['9'],
  blurb: 'The same subjects before and after. Analyze the data paired and as two independent samples, and see why pairing can find an effect the other test misses.',
  height: 0.85,
  params: [
    { id: 'n', label: '$n$ (subjects)', type: 'range', min: 4, max: 40, step: 1, value: 10 },
    { id: 'effect', label: String.raw`Treatment effect $\delta$`, type: 'range', min: 0, max: 8, step: 0.1, value: 3 },
    { id: 'between', label: 'Spread between subjects', type: 'range', min: 0, max: 20, step: 0.5, value: 8 },
  ],
  actions: [{ id: 'resample', label: 'New subjects', run: (s) => ({ ...s, seed: s.seed + 1 }) }],
  scenarios: [
    { id: 'diet', label: 'Very different subjects, a small effect', state: { n: 10, effect: 2, between: 12 } },
    { id: 'alike', label: 'Subjects all alike: pairing adds little', state: { n: 10, effect: 2, between: 0 } },
    { id: 'none', label: 'No effect at all', state: { n: 10, effect: 0, between: 8 } },
  ],

  compute(s, rng) {
    const before = [];
    const after = [];
    for (let i = 0; i < s.n; i++) {
      // The same draws in the same order whatever the spread, so moving a slider rescales them.
      const u = rng.normal();
      const e1 = rng.normal();
      const e2 = rng.normal();
      before.push(BASE + s.between * u + NOISE * e1);
      after.push(BASE + s.between * u + s.effect + NOISE * e2);
    }
    const P = pairedTest({ xs: after, ys: before, side: 'two' });
    const W = welchTest({ x1: mean(after), x2: mean(before), s1: sd(after), s2: sd(before), n1: s.n, n2: s.n, side: 'two' });
    return { before, after, P, W };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const all = [...r.before, ...r.after];
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const pad = Math.max(2, (hi - lo) * 0.1);
    const split = Math.round(w * 0.58);
    // Left: each subject's before and after, joined.
    const A = area(split, h, { x: [0, 1], y: [lo - pad, hi + pad], left: 36, right: 10 });
    axes(ctx, A, { xTicks: [0.12, 0.88], xFmt: (v) => (v < 0.5 ? 'before' : 'after'), yCount: 5 });
    for (let i = 0; i < r.before.length; i++) {
      const up = r.after[i] > r.before[i];
      segment(ctx, A, 0.12, r.before[i], 0.88, r.after[i], { color: alpha(up ? C.green : C.red, 0.55), width: 1.4 });
      dot(ctx, A, 0.12, r.before[i], { color: C.blue, r: 3 });
      dot(ctx, A, 0.88, r.after[i], { color: C.pink, r: 3 });
    }
    // Right: the differences, which is all the paired test sees.
    const d = r.P.d;
    const dl = Math.min(-1, ...d);
    const dh = Math.max(1, ...d);
    const dp = (dh - dl) * 0.12;
    const B = area(w, h, { x: [0, 1], y: [dl - dp, dh + dp], left: split + 34, right: 10 });
    axes(ctx, B, { xTicks: false, yCount: 5 });
    segment(ctx, B, 0, 0, 1, 0, { color: alpha(C.text, 0.4), width: 1, dash: [4, 4] });
    d.forEach((v, i) => dot(ctx, B, 0.3 + ((i * 0.37) % 0.4), v, { color: C.gold, r: 3 }));
    segment(ctx, B, 0.15, r.P.dbar, 0.85, r.P.dbar, { color: C.gold, width: 2 });
    label(ctx, 'd = after − before', B.x0, 12, { color: C.gold });
    return { A, B };
  },

  readout(s, r) {
    return [
      [String.raw`Paired: $t$, $p$`, `$${r.P.t.toFixed(2)}$, $${pf(r.P.p)}$`],
      [String.raw`Two-sample: $t$, $p$`, `$${r.W.t.toFixed(2)}$, $${pf(r.W.p)}$`],
    ];
  },

  explain(s, r) {
    return [
      String.raw`Left: each subject before (blue) and after (pink). Right: their differences $d_i$, with mean $\bar{d} = ${r.P.dbar.toFixed(2)}$ and $s_d = ${r.P.sd.toFixed(2)}$.`,
      String.raw`Paired: $t = \dfrac{\bar{d}}{s_d/\sqrt{n}} = ${r.P.t.toFixed(2)}$ on $${r.P.df}$ df, $p = ${pf(r.P.p)}$. The subjects' own levels cancel in each $d_i$, so only the measurement noise is left in $s_d$.`,
      String.raw`As if independent: $t = \dfrac{\bar{x}_{\text{after}} - \bar{x}_{\text{before}}}{\sqrt{s_1^2/n + s_2^2/n}} = ${r.W.t.toFixed(2)}$, $p = ${pf(r.W.p)}$. Same difference in means, but $s_1$ and $s_2$ include all the spread between subjects. That test is also simply the wrong one here: the two columns are not independent.`,
    ];
  },

  predictions: [
    {
      id: 'between',
      setup: { n: 10, effect: 2, between: 2 },
      change: { between: 15 },
      prompt: 'The subjects become much more different from each other (spread 2 → 15), same effect, same noise. Which p-value grows?',
      options: [['paired', 'the paired test’s'], ['indep', 'the two-sample test’s'], ['both', 'both, about equally']],
      outcome: (b, a) => {
        const dp = a.P.p - b.P.p;
        const dw = a.W.p - b.W.p;
        return Math.abs(dp) < 1e-9 && dw > 0.05 ? 'indep' : dp > 0.05 && Math.abs(dw) < 0.05 ? 'paired' : 'both';
      },
      expect: 'indep',
      why: 'Each difference d = after − before cancels the subject’s own level, so the paired test does not change at all. The two-sample test compares the column means against the columns’ spread, which is now mostly subject-to-subject variation, and the effect drowns in it.',
    },
    {
      id: 'alike',
      setup: { n: 10, effect: 2, between: 12 },
      change: { between: 0 },
      prompt: 'Now make the subjects all alike (spread 0). The two-sample t statistic…',
      options: [['closer', 'comes close to the paired t'], ['same', 'stays where it was'], ['lower', 'drops']],
      outcome: (b, a) => (Math.abs(a.W.t - a.P.t) < 0.35 * Math.abs(a.P.t) && Math.abs(a.W.t) > Math.abs(b.W.t) ? 'closer' : Math.abs(a.W.t) < Math.abs(b.W.t) ? 'lower' : 'same'),
      expect: 'closer',
      why: 'With no differences between subjects there is nothing for pairing to cancel: both tests see only the noise, and their t values are close. Pairing pays off exactly when subjects differ a lot from each other.',
    },
  ],
});

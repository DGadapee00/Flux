/**
 * Errors and power (Ch 8). The sampling distribution of x̄ under H₀ (blue) and under a particular
 * alternative (pink), with the rejection region cut by α. Red is the Type I error (α), purple the
 * Type II error (β), and the pink area on the rejection side is the power, 1 − β.
 *
 * Standardized: σ = 1 and μ₀ = 0, so the effect is (μ₁ − μ₀)/σ, in σ's. The test is the z test,
 * and the power is computed exactly; a simulation of real samples and real tests checks it.
 *
 * What it corrects: that n changes α (it does not; it changes β), that a smaller α is free (it
 * costs power), and that a two-sided test is as powerful as a one-sided one in the right direction.
 */
import { defineLab } from './define.js';
import { setup, area, axes, curve, shade, vline, label, C, alpha } from '../plot/plot.js';
import * as D from '../stats/dist.js';

const TAILS = [
  ['left', String.raw`$H_1\!: \mu < \mu_0$`],
  ['two', String.raw`$\mu \ne \mu_0$`],
  ['right', String.raw`$\mu > \mu_0$`],
];

/** μ₁ in σ units: the effect points the way H₁ does (right for a two-sided test). */
const mu1For = (s) => (s.tail === 'left' ? -s.effect : s.effect);

/** Rejection region in x̄ units: [[lo, hi], …]. */
function region(tail, alpha, se) {
  if (tail === 'right') return [[D.zCrit(alpha) * se, Infinity]];
  if (tail === 'left') return [[-Infinity, -D.zCrit(alpha) * se]];
  const c = D.zCrit(alpha / 2) * se;
  return [[-Infinity, -c], [c, Infinity]];
}

/** P(x̄ in the rejection region) when x̄ ~ N(m, se). */
const rejectProb = (reg, m, se) => reg.reduce((t, [lo, hi]) => t + D.normCdf(hi, m, se) - D.normCdf(lo, m, se), 0);

const fmt = (x) => x.toFixed(4);

export default defineLab({
  id: 'power',
  title: 'Errors and power',
  ch: ['8'],
  blurb: 'H₀ and H₁ side by side. Move α, n and the effect, and watch the Type I and Type II errors and the power trade off.',
  height: 0.7,
  params: [
    { id: 'tail', label: 'Alternative', type: 'choice', options: TAILS, value: 'right' },
    { id: 'alpha', label: String.raw`$\alpha$`, type: 'choice', options: [[0.01, '0.01'], [0.05, '0.05'], [0.1, '0.10']], value: 0.05 },
    { id: 'n', label: '$n$', type: 'range', min: 1, max: 100, step: 1, value: 16 },
    { id: 'effect', label: String.raw`Effect $|\mu_1 - \mu_0|/\sigma$`, type: 'range', min: 0, max: 1.5, step: 0.05, value: 0.5 },
  ],
  initial: { sims: 2000 },
  scenarios: [
    { id: 'text', label: 'n = 16, effect 0.5σ, α = .05 (power 0.64)', state: { tail: 'right', alpha: 0.05, n: 16, effect: 0.5 } },
    { id: 'tiny', label: 'A tiny effect needs a huge n', state: { tail: 'right', alpha: 0.05, n: 100, effect: 0.1 } },
    { id: 'null', label: 'No effect: power equals α', state: { tail: 'two', alpha: 0.05, n: 25, effect: 0 } },
  ],

  compute(s, rng) {
    const se = 1 / Math.sqrt(s.n);
    const reg = region(s.tail, s.alpha, se);
    const m1 = mu1For(s);
    const power = rejectProb(reg, m1, se);
    // Real samples of size n, and the z test on each, under H₀ and under H₁.
    const zc = s.tail === 'two' ? D.zCrit(s.alpha / 2) : D.zCrit(s.alpha);
    const rejects = (z) => (s.tail === 'right' ? z > zc : s.tail === 'left' ? z < -zc : Math.abs(z) > zc);
    let r0 = 0;
    let r1 = 0;
    for (let k = 0; k < s.sims; k++) {
      let a = 0;
      let b = 0;
      for (let i = 0; i < s.n; i++) {
        a += rng.normal();
        b += rng.normal(m1);
      }
      if (rejects(a / s.n / se)) r0++;
      if (rejects(b / s.n / se)) r1++;
    }
    return { se, reg, m1, power, beta: 1 - power, simPower: r1 / s.sims, simAlpha: r0 / s.sims, crit: reg.map(([lo, hi]) => (Number.isFinite(hi) ? hi : lo)) };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const lo = Math.min(0, r.m1) - 4 * r.se;
    const hi = Math.max(0, r.m1) + 4 * r.se;
    const peak = D.normPdf(0) / r.se;
    const A = area(w, h, { x: [lo, hi], y: [0, peak * 1.18], left: 14, right: 14, top: 22 });
    axes(ctx, A, { yTicks: false, xLabel: 'x̄ (in σ)' });
    const f0 = (x) => D.normPdf(x, 0, r.se);
    const f1 = (x) => D.normPdf(x, r.m1, r.se);
    // β: the H₁ curve over the region where H₀ is kept.
    const keep = s.tail === 'right' ? [[-Infinity, r.reg[0][0]]] : s.tail === 'left' ? [[r.reg[0][1], Infinity]] : [[r.reg[0][1], r.reg[1][0]]];
    for (const [a, b] of r.reg) shade(ctx, A, f1, a, b, alpha(C.pink, 0.38));
    for (const [a, b] of keep) shade(ctx, A, f1, a, b, alpha(C.purple, 0.55));
    for (const [a, b] of r.reg) shade(ctx, A, f0, a, b, alpha(C.red, 0.7));
    curve(ctx, A, f0, lo, hi, { color: C.blue, width: 2 });
    if (s.effect > 0) curve(ctx, A, f1, lo, hi, { color: C.pink, width: 2 });
    for (const c of r.crit) vline(ctx, A, c, { color: C.text, dash: [4, 4], width: 1 });
    ctx.font = "italic 12px Inter, system-ui, sans-serif";
    label(ctx, 'H₀', A.x(0), A.y(peak) - 4, { color: C.blue, align: 'center' });
    if (s.effect > 0) label(ctx, 'H₁', A.x(r.m1), A.y(peak) - 4, { color: C.pink, align: 'center' });
    return { A };
  },

  readout(s, r) {
    return [
      [String.raw`Type I, $\alpha$`, `$${s.alpha.toFixed(2)}$`],
      [String.raw`Type II, $\beta$`, `$${fmt(r.beta)}$`],
      [String.raw`Power, $1-\beta$`, `$${fmt(r.power)}$`],
    ];
  },

  explain(s, r) {
    const z = s.tail === 'two' ? String.raw`z_{\alpha/2} = ${D.zCrit(s.alpha / 2).toFixed(3)}` : String.raw`z_{\alpha} = ${D.zCrit(s.alpha).toFixed(3)}`;
    const out = [
      String.raw`Blue: $\bar{X}$ if $H_0$ is true, $N(\mu_0, \sigma^2/n)$. Pink: $\bar{X}$ if the true mean is $\mu_1 = \mu_0 ${s.tail === 'left' ? '-' : '+'} ${s.effect}\sigma$. The dashed line${r.crit.length > 1 ? 's are' : ' is'} the cutoff, $${z}$ standard errors from $\mu_0$.`,
      String.raw`Red is the Type I error, rejecting a true $H_0$: its area is $\alpha$ by construction. Purple is the Type II error, keeping $H_0$ when $\mu = \mu_1$: $\beta = ${fmt(r.beta)}$. The pink area beyond the cutoff is the power, $1 - \beta = ${fmt(r.power)}$.`,
      String.raw`Check: ${s.sims.toLocaleString('en-US')} simulated samples with $\mu = \mu_1$ were rejected ${(100 * r.simPower).toFixed(1)}% of the time.`,
    ];
    if (s.effect === 0) out.push(String.raw`With no effect the two curves are the same, and the power is just $\alpha$: a test "detects" a nonexistent difference exactly as often as it makes a Type I error.`);
    return out;
  },

  predictions: [
    {
      id: 'alpha-down',
      setup: { tail: 'right', alpha: 0.05, n: 16, effect: 0.5 },
      change: { alpha: 0.01 },
      prompt: 'Make the test stricter: α from 0.05 to 0.01. The power (the chance of detecting the effect)…',
      options: [['up', 'goes up'], ['same', 'stays the same'], ['down', 'goes down']],
      outcome: (b, a) => (a.power > b.power + 1e-4 ? 'up' : a.power < b.power - 1e-4 ? 'down' : 'same'),
      expect: 'down',
      why: 'A smaller α moves the cutoff further out, so more of the H₁ curve falls on the keep-H₀ side: β grows from 0.36 to 0.63. Fewer false alarms are paid for with more misses.',
    },
    {
      id: 'n-alpha',
      setup: { tail: 'right', alpha: 0.05, n: 16, effect: 0.5 },
      change: { n: 64 },
      prompt: 'Quadruple the sample size, n = 16 → 64. The Type I error rate α…',
      options: [['down', 'goes down'], ['same', 'stays at 0.05'], ['up', 'goes up']],
      outcome: (b, a) => (Math.abs(a.simAlpha - b.simAlpha) < 0.02 && Math.abs(a.power - b.power) > 0.1 ? 'same' : a.simAlpha < b.simAlpha ? 'down' : 'up'),
      expect: 'same',
      why: 'α is chosen, not estimated: the cutoff moves in with σ/√n so that the red area stays exactly 0.05. What n buys is power: both curves narrow, they overlap less, and β falls from 0.36 to 0.009.',
    },
    {
      id: 'two-sided',
      setup: { tail: 'right', alpha: 0.05, n: 16, effect: 0.5 },
      change: { tail: 'two' },
      prompt: 'The true mean is above μ₀. Switch from the one-sided H₁: μ > μ₀ to the two-sided μ ≠ μ₀, same α. The power…',
      options: [['up', 'goes up'], ['same', 'stays the same'], ['down', 'goes down']],
      outcome: (b, a) => (a.power > b.power + 1e-4 ? 'up' : a.power < b.power - 1e-4 ? 'down' : 'same'),
      expect: 'down',
      why: 'The two-sided test splits α between both tails, so the upper cutoff moves from 1.645 to 1.96 standard errors: power drops from 0.64 to 0.52. It pays for guarding a direction the effect is not in.',
    },
  ],
});

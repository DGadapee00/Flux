/**
 * Which test? (Ch 8–10). The questions that pick a procedure, as controls, and the whole decision
 * tree drawn beside them with the current path lit. Tap a test in the tree to jump to it.
 *
 * Each ending gives the test statistic and its distribution, the interval that goes with it, the
 * assumptions to check, and the TI-84 menu, in the notes' notation and conventions.
 */
import { defineLab } from './define.js';
import { setup, C, alpha } from '../plot/plot.js';

/** The endings, in the order the tree draws them. `set` is the path of answers that reaches each. */
const LEAVES = [
  {
    id: 'z1',
    name: 'Z-Test',
    short: 'Z-Test (σ known)',
    set: { target: 'mean', samples: 'one', sigma: 'known' },
    dist: 'Standard normal',
    formula: String.raw`z = \dfrac{\bar{x} - \mu_0}{\sigma/\sqrt{n}}`,
    ci: String.raw`\bar{x} \pm z_{\alpha/2}\,\dfrac{\sigma}{\sqrt{n}}`,
    assume: ['A random sample.', String.raw`$\sigma$ known.`, String.raw`The population is normal, or $n \ge 30$ (CLT).`],
    ti: 'STAT ▸ TESTS ▸ 1: Z-Test',
    tiCI: 'STAT ▸ TESTS ▸ 7: ZInterval',
  },
  {
    id: 't1',
    name: 'T-Test',
    short: 'T-Test (σ unknown)',
    set: { target: 'mean', samples: 'one', sigma: 'unknown' },
    dist: String.raw`$t$, $\nu = n - 1$`,
    formula: String.raw`t = \dfrac{\bar{x} - \mu_0}{s/\sqrt{n}}`,
    ci: String.raw`\bar{x} \pm t_{\alpha/2,\,n-1}\,\dfrac{s}{\sqrt{n}}`,
    assume: ['A random sample.', String.raw`$\sigma$ unknown, estimated by $s$.`, String.raw`The population is roughly normal (check a normal probability plot), or $n$ is large.`],
    ti: 'STAT ▸ TESTS ▸ 2: T-Test',
    tiCI: 'STAT ▸ TESTS ▸ 8: TInterval',
  },
  {
    id: 'paired',
    name: 'Paired t test',
    short: 'Paired: T-Test on d',
    set: { target: 'mean', samples: 'two', design: 'paired' },
    dist: String.raw`$t$, $\nu = n - 1$ (pairs)`,
    formula: String.raw`t = \dfrac{\bar{d} - d_0}{s_d/\sqrt{n}}`,
    ci: String.raw`\bar{d} \pm t_{\alpha/2,\,n-1}\,\dfrac{s_d}{\sqrt{n}}`,
    assume: [String.raw`Each observation in one sample is matched to one in the other (the same subject twice, twins, before and after).`, String.raw`The differences $d_i = x_{1i} - x_{2i}$ are roughly normal.`],
    ti: 'L3 = L1 − L2, then STAT ▸ TESTS ▸ 2: T-Test on L3',
    tiCI: 'L3 = L1 − L2, then STAT ▸ TESTS ▸ 8: TInterval on L3',
  },
  {
    id: 'z2',
    name: 'Two-sample z test',
    short: '2-SampZTest (σ’s known)',
    set: { target: 'mean', samples: 'two', design: 'indep', sigma: 'known' },
    dist: 'Standard normal',
    formula: String.raw`z = \dfrac{(\bar{x}_1 - \bar{x}_2) - d_0}{\sqrt{\sigma_1^2/n_1 + \sigma_2^2/n_2}}`,
    ci: String.raw`(\bar{x}_1 - \bar{x}_2) \pm z_{\alpha/2}\sqrt{\dfrac{\sigma_1^2}{n_1} + \dfrac{\sigma_2^2}{n_2}}`,
    assume: ['Two independent random samples.', String.raw`$\sigma_1$ and $\sigma_2$ known.`, 'Both populations normal, or both samples large.'],
    ti: 'STAT ▸ TESTS ▸ 3: 2-SampZTest',
    tiCI: 'STAT ▸ TESTS ▸ 9: 2-SampZInt',
  },
  {
    id: 'pooled',
    name: 'Pooled two-sample t test',
    short: '2-SampTTest, pooled',
    set: { target: 'mean', samples: 'two', design: 'indep', sigma: 'unknown', eqvar: 'yes' },
    dist: String.raw`$t$, $\nu = n_1 + n_2 - 2$`,
    formula: String.raw`t = \dfrac{(\bar{x}_1 - \bar{x}_2) - d_0}{s_p\sqrt{1/n_1 + 1/n_2}}, \quad s_p^2 = \dfrac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}`,
    ci: String.raw`(\bar{x}_1 - \bar{x}_2) \pm t_{\alpha/2,\,n_1+n_2-2}\; s_p\sqrt{\dfrac{1}{n_1} + \dfrac{1}{n_2}}`,
    assume: ['Two independent random samples from roughly normal populations.', String.raw`$\sigma_1 = \sigma_2$ (unknown). Check with the F test, or the rule of thumb that the larger $s$ is under twice the smaller.`],
    ti: 'STAT ▸ TESTS ▸ 4: 2-SampTTest, Pooled: Yes',
    tiCI: 'STAT ▸ TESTS ▸ 0: 2-SampTInt, Pooled: Yes',
  },
  {
    id: 'welch',
    name: 'Two-sample t test (unequal variances)',
    short: '2-SampTTest (Welch)',
    set: { target: 'mean', samples: 'two', design: 'indep', sigma: 'unknown', eqvar: 'no' },
    dist: String.raw`$t$, Welch's $\nu$`,
    formula: String.raw`t = \dfrac{(\bar{x}_1 - \bar{x}_2) - d_0}{\sqrt{s_1^2/n_1 + s_2^2/n_2}}, \quad \nu = \dfrac{(s_1^2/n_1 + s_2^2/n_2)^2}{\frac{(s_1^2/n_1)^2}{n_1 - 1} + \frac{(s_2^2/n_2)^2}{n_2 - 1}}`,
    ci: String.raw`(\bar{x}_1 - \bar{x}_2) \pm t_{\alpha/2,\,\nu}\sqrt{\dfrac{s_1^2}{n_1} + \dfrac{s_2^2}{n_2}}`,
    assume: ['Two independent random samples from roughly normal populations.', String.raw`$\sigma_1 \ne \sigma_2$, or no reason to assume they are equal. The calculator uses the fractional $\nu$; with the table, round $\nu$ down.`],
    ti: 'STAT ▸ TESTS ▸ 4: 2-SampTTest, Pooled: No',
    tiCI: 'STAT ▸ TESTS ▸ 0: 2-SampTInt, Pooled: No',
  },
  {
    id: 'prop1',
    name: 'One-proportion z test',
    short: '1-PropZTest',
    set: { target: 'prop', samples: 'one' },
    dist: 'Standard normal (approx.)',
    formula: String.raw`z = \dfrac{\hat{p} - p_0}{\sqrt{p_0 q_0/n}}`,
    ci: String.raw`\hat{p} \pm z_{\alpha/2}\sqrt{\dfrac{\hat{p}\hat{q}}{n}}`,
    assume: ['A random sample of independent trials.', String.raw`For the test, $np_0q_0 \ge 10$; for the interval, $n\hat{p}\hat{q} \ge 10$.`],
    ti: 'STAT ▸ TESTS ▸ 5: 1-PropZTest',
    tiCI: 'STAT ▸ TESTS ▸ A: 1-PropZInt',
  },
  {
    id: 'prop2',
    name: 'Two-proportion z test',
    short: '2-PropZTest',
    set: { target: 'prop', samples: 'two' },
    dist: 'Standard normal (approx.)',
    formula: String.raw`z = \dfrac{\hat{p}_1 - \hat{p}_2}{\sqrt{\hat{p}\hat{q}\,(1/n_1 + 1/n_2)}}, \quad \hat{p} = \dfrac{x_1 + x_2}{n_1 + n_2}`,
    ci: String.raw`(\hat{p}_1 - \hat{p}_2) \pm z_{\alpha/2}\sqrt{\dfrac{\hat{p}_1\hat{q}_1}{n_1} + \dfrac{\hat{p}_2\hat{q}_2}{n_2}}`,
    assume: ['Two independent random samples.', 'Enough successes and failures in each sample for the normal approximation.', String.raw`The test pools the samples ($\hat{p}$) because $H_0$ says $p_1 = p_2$; the interval does not.`],
    ti: 'STAT ▸ TESTS ▸ 6: 2-PropZTest',
    tiCI: 'STAT ▸ TESTS ▸ B: 2-PropZInt',
  },
  {
    id: 'chi2',
    name: 'Chi-squared test for a variance (not in this course’s notes)',
    short: 'χ² test for σ²',
    set: { target: 'var', samples: 'one' },
    dist: String.raw`$\chi^2$, $\nu = n - 1$`,
    formula: String.raw`\chi^2 = \dfrac{(n - 1)s^2}{\sigma_0^2}`,
    ci: String.raw`\dfrac{(n-1)s^2}{\chi^2_{\alpha/2}} < \sigma^2 < \dfrac{(n-1)s^2}{\chi^2_{1-\alpha/2}}`,
    assume: ['A random sample from a NORMAL population. This test is not robust: skewed data give wrong answers at any n.'],
    ti: 'No built-in test: compute χ², then DISTR ▸ χ²cdf(',
    tiCI: 'No built-in interval: use Table A.5 or DISTR ▸ invχ² (on newer models)',
  },
  {
    id: 'f',
    name: 'F test for two variances',
    short: '2-SampFTest',
    set: { target: 'var', samples: 'two' },
    dist: String.raw`$F$, $\nu_1 = n_1 - 1$, $\nu_2 = n_2 - 1$`,
    formula: String.raw`f = \dfrac{s_1^2}{s_2^2}`,
    ci: String.raw`\dfrac{s_1^2}{s_2^2}\,\dfrac{1}{f_{\alpha/2}(\nu_1, \nu_2)} < \dfrac{\sigma_1^2}{\sigma_2^2} < \dfrac{s_1^2}{s_2^2}\, f_{\alpha/2}(\nu_2, \nu_1)`,
    assume: ['Two independent random samples from NORMAL populations; like the χ² test, not robust.', String.raw`Table A.6 only has $\alpha = 0.05$ and $0.01$, so table intervals are 90% or 98%.`],
    ti: 'STAT ▸ TESTS ▸ E: 2-SampFTest',
    tiCI: 'No built-in interval: use Table A.6 (with the reciprocal rule for the lower point)',
  },
  {
    id: 'slope',
    name: 't test for the slope',
    short: 'LinRegTTest',
    set: { target: 'slope' },
    dist: String.raw`$t$, $\nu = n - 2$`,
    formula: String.raw`t = \dfrac{b - \beta_{1,0}}{s/\sqrt{S_{xx}}}, \quad s^2 = \dfrac{SSE}{n - 2}`,
    ci: String.raw`b \pm t_{\alpha/2,\,n-2}\,\dfrac{s}{\sqrt{S_{xx}}}`,
    assume: ['The mean of Y is a straight-line function of x.', 'Errors independent, normal, with the same variance at every x (check the residual plot).'],
    ti: 'STAT ▸ TESTS ▸ F: LinRegTTest',
    tiCI: 'STAT ▸ TESTS ▸ G: LinRegTInt (TI-84 Plus CE; older models: compute from b and s_b)',
  },
];

/** The ending the answers lead to. */
function leafFor(s) {
  if (s.target === 'slope') return LEAVES[10];
  if (s.target === 'prop') return s.samples === 'one' ? LEAVES[6] : LEAVES[7];
  if (s.target === 'var') return s.samples === 'one' ? LEAVES[8] : LEAVES[9];
  if (s.samples === 'one') return s.sigma === 'known' ? LEAVES[0] : LEAVES[1];
  if (s.design === 'paired') return LEAVES[2];
  if (s.sigma === 'known') return LEAVES[3];
  return s.eqvar === 'yes' ? LEAVES[4] : LEAVES[5];
}

/** The tree: nodes with children; leaves are indices into LEAVES. */
const TREE = {
  label: '',
  kids: [
    { label: 'μ', kids: [{ label: '1', kids: [0, 1] }, { label: '2', kids: [2, { label: 'ind', kids: [3, 4, 5] }] }] },
    { label: 'p', kids: [{ label: '1', kids: [6] }, { label: '2', kids: [7] }] },
    { label: 'σ²', kids: [{ label: '1', kids: [8] }, { label: '2', kids: [9] }] },
    { label: 'β₁', kids: [10] },
  ],
};

/** Does node `n` lie on the path to leaf index `li`? */
const contains = (n, li) => (typeof n === 'number' ? n === li : n.kids.some((k) => contains(k, li)));

export default defineLab({
  id: 'tests',
  title: 'Which test?',
  ch: ['8', '9', '10'],
  blurb: 'Answer the questions (or tap the tree) to reach the right test or interval, with its formula, assumptions and TI-84 menu.',
  height: 0.9,
  params: [
    { id: 'goal', label: 'I want', type: 'choice', options: [['test', 'A hypothesis test'], ['ci', 'A confidence interval']], value: 'test' },
    { id: 'target', label: 'About', type: 'choice', options: [['mean', 'A mean μ'], ['prop', 'A proportion p'], ['var', 'A variance σ²'], ['slope', 'A regression slope β₁']], value: 'mean', select: true },
    { id: 'samples', label: 'Samples', type: 'choice', options: [['one', 'One'], ['two', 'Two']], value: 'one', show: (s) => s.target !== 'slope' },
    { id: 'design', label: 'The two samples are', type: 'choice', options: [['indep', 'Independent'], ['paired', 'Paired']], value: 'indep', show: (s) => s.target === 'mean' && s.samples === 'two' },
    { id: 'sigma', label: 'Population σ', type: 'choice', options: [['known', 'Known'], ['unknown', 'Unknown (use s)']], value: 'unknown', show: (s) => s.target === 'mean' && (s.samples === 'one' || s.design === 'indep') },
    { id: 'eqvar', label: 'Equal variances?', type: 'choice', options: [['yes', 'Assume σ₁ = σ₂'], ['no', 'Don’t assume']], value: 'no', show: (s) => s.target === 'mean' && s.samples === 'two' && s.design === 'indep' && s.sigma === 'unknown' },
  ],
  scenarios: [
    { id: 'paired', label: 'Same subjects before and after', state: { target: 'mean', samples: 'two', design: 'paired' } },
    { id: 'poll', label: 'Is a coin fair?', state: { target: 'prop', samples: 'one' } },
    { id: 'machines', label: 'Two machines, is one more variable?', state: { target: 'var', samples: 'two' } },
  ],
  leaves: () => LEAVES,
  leafFor,

  compute(s) {
    return { leaf: leafFor(s), index: LEAVES.indexOf(leafFor(s)) };
  },

  draw(canvas, s, r) {
    const { ctx, w, h } = setup(canvas);
    const textW = Math.min(190, w * 0.5);
    const top = 14;
    const rowH = (h - top - 10) / LEAVES.length;
    const cols = 5;
    const colX = (d) => 12 + ((w - textW - 24) * d) / (cols - 1);
    const leafY = (i) => top + rowH * (i + 0.5);
    const hits = [];
    ctx.font = "11px Inter, system-ui, sans-serif";

    // Lay out: every node's y is the middle of its leaves.
    function place(n, d) {
      if (typeof n === 'number') return { y: leafY(n), x: colX(cols - 1), leaf: n };
      const kids = n.kids.map((k) => place(k, d + 1));
      return { y: (kids[0].y + kids[kids.length - 1].y) / 2, x: colX(d), kids, n };
    }
    const root = place(TREE, 0);

    function paint(p) {
      if (p.leaf != null) return;
      for (const k of p.kids) {
        const on = contains(k.leaf != null ? k.leaf : k.n, r.index);
        ctx.strokeStyle = on ? C.gold : alpha(C.text, 0.18);
        ctx.lineWidth = on ? 2.4 : 1.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        const mx = (p.x + k.x) / 2;
        ctx.bezierCurveTo(mx, p.y, mx, k.y, k.x, k.y);
        ctx.stroke();
        paint(k);
      }
      if (p.n.label) {
        const on = contains(p.n, r.index);
        ctx.fillStyle = on ? C.gold : '#17191d';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = on ? C.gold : alpha(C.text, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = on ? '#111' : C.muted;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.n.label === 'ind' ? '⫫' : p.n.label, p.x, p.y + 0.5);
      } else {
        ctx.fillStyle = C.gold;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    paint(root);

    LEAVES.forEach((L, i) => {
      const on = i === r.index;
      const y = leafY(i);
      const x = colX(cols - 1);
      if (on) {
        ctx.fillStyle = alpha(C.yellow, 0.14);
        ctx.fillRect(x - 6, y - rowH / 2 + 1, w - x, rowH - 2);
      }
      ctx.fillStyle = on ? C.yellow : C.gold;
      ctx.beginPath();
      ctx.arc(x, y, on ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${on ? '600 ' : ''}11.5px Inter, system-ui, sans-serif`;
      ctx.fillStyle = on ? C.yellow : C.muted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(L.short, x + 9, y);
      hits.push({ y0: y - rowH / 2, y1: y + rowH / 2, i });
    });
    return { hits, x0: colX(cols - 1) - 12 };
  },

  // Tapping a test in the tree sets the answers that lead to it.
  tap(view, s, x, y) {
    if (x < view.x0) return null;
    const hit = view.hits.find((t) => y >= t.y0 && y < t.y1);
    if (!hit) return null;
    return { ...s, ...LEAVES[hit.i].set };
  },

  readout(s, r) {
    return [
      [s.goal === 'ci' ? 'Interval' : 'Test', r.leaf.name],
      ['Distribution', r.leaf.dist],
    ];
  },

  explain(s, r) {
    const L = r.leaf;
    return [
      s.goal === 'ci' ? `$$${L.ci}$$` : `$$${L.formula}$$`,
      `Assumptions: ${L.assume.join(' ')}`,
      `TI-84: ${s.goal === 'ci' ? L.tiCI : L.ti}`,
      s.goal === 'ci' ? `The matching test: $${L.formula}$` : `The matching interval: $${L.ci}$`,
    ];
  },
});

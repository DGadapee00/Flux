/** Chapter 7 · Fundamental sampling distributions. */
import { problem, kase, range, choice, num, prob, mc, tn, fx, pn, zLook } from '../kit.js';
import { normCdf, normSf, binomCdf } from '../../stats/dist.js';
import { zTable } from '../../stats/tables.js';

const C7 = { ch: '7' };

/** P(X < c), P(X > c) for a normal, exact and by Table A.3 after rounding z. */
function normalP(side, c, mu, sd) {
  const z = (c - mu) / sd;
  const exact = side === 'left' ? normCdf(z) : normSf(z);
  const t = zTable(z).value;
  return { z, exact, table: side === 'left' ? t : 1 - t };
}

const LT = choice(['left', 'less than'], ['right', 'greater than']);

export default [
  problem({
    ...C7, id: 'c7.linear-normal', title: 'A linear function of normal variables', kind: 'numeric', level: 2, topics: ['linear-combination', 'normal'], src: 'Notes Ex 7.1',
    vars: { a0: range(-5, 10, 1), a1: range(-3, 3, 1, { exclude: [0] }), a2: range(-3, 3, 1, { exclude: [0] }), m1: range(-5, 10, 1), v1: range(1, 16, 1), m2: range(-5, 10, 1), v2: range(1, 16, 1), side: LT, k: range(-1.8, 1.8, 0.1) },
    derive: ($) => {
      const mu = $.a0 + $.a1 * $.m1 + $.a2 * $.m2;
      const v = $.a1 ** 2 * $.v1 + $.a2 ** 2 * $.v2;
      const c = Math.round(mu + $.k * Math.sqrt(v));
      return { mu, v, sd: Math.sqrt(v), c, ...normalP($.side, c, mu, Math.sqrt(v)) };
    },
    valid: ($) => Math.abs($.z) > 0.05,
    text: (T, $) => {
      const term = (a, x, first) => `${a < 0 ? (first ? '-' : ' - ') : first ? '' : ' + '}${Math.abs(a) === 1 ? '' : Math.abs(a)}${x}`;
      const y = `${$.a0 ? $.a0 : ''}${term($.a1, 'X_1', !$.a0)}${term($.a2, 'X_2', false)}`;
      return String.raw`$X_1$ and $X_2$ are independent normal random variables: $X_1$ has mean ${$.m1} and variance ${$.v1}, $X_2$ has mean ${$.m2} and variance ${$.v2}. Let $Y = ${y}$. Find the mean and variance of Y, and $P(Y ${$.side === 'left' ? '<' : '>'} ${$.c})$.`;
    },
    parts: [
      num('mu', ($) => $.mu, { label: '$E(Y)$', tol: 0, abs: 1e-9 }),
      num('v', ($) => $.v, { label: String.raw`$\sigma_Y^2$`, tol: 0, abs: 1e-9, traps: [[($) => $.a1 * $.a1 * $.v1 - $.a2 * $.a2 * $.v2, 'Variances of independent variables add, even when the variable is subtracted.'], [($) => $.a1 * $.v1 + $.a2 * $.v2, 'The coefficients are squared in the variance.']] }),
      prob('p', ($) => $.exact, { alt: ($) => [$.table], label: ($T, $) => String.raw`$P(Y ${$.side === 'left' ? '<' : '>'} ${$.c})$`, traps: [[($) => 1 - $.exact, 'That is the other tail.']] }),
    ],
    hints: [String.raw`A linear function of independent normal variables is normal, with $E(a_0 + a_1X_1 + a_2X_2) = a_0 + a_1\mu_1 + a_2\mu_2$.`, String.raw`$\sigma^2_Y = a_1^2\sigma_1^2 + a_2^2\sigma_2^2$; the constant adds nothing.`, String.raw`Then standardize: $z = (c - \mu_Y)/\sigma_Y$.`],
    steps: ($) => [
      String.raw`$E(Y) = ${$.a0} + ${pn($.a1)}${pn($.m1)} + ${pn($.a2)}${pn($.m2)} = ${$.mu}$`,
      String.raw`$\sigma_Y^2 = ${pn($.a1)}^2(${$.v1}) + ${pn($.a2)}^2(${$.v2}) = ${$.v}$, so $Y \sim N(${$.mu},\ ${$.v})$ and $\sigma_Y = ${tn($.sd, 4)}$`,
      String.raw`$z = \dfrac{${$.c} - ${pn($.mu)}}{${tn($.sd, 4)}} = ${fx($.z, 4)}$`,
      zLook($.z).line,
      String.raw`$P(Y ${$.side === 'left' ? '<' : '>'} ${$.c}) = ${fx($.table, 4)}$ (exact $${fx($.exact, 4)}$)`,
    ],
    twin: { part: 'p', draw: (r, $) => { const y = $.a0 + $.a1 * r.normal($.m1, Math.sqrt($.v1)) + $.a2 * r.normal($.m2, Math.sqrt($.v2)); return $.side === 'left' ? y < $.c : y > $.c; } },
    cases: [kase('Notes Ex 7.1', { a0: 3, a1: -1, a2: 2, m1: 1, v1: 4, m2: -2, v2: 9, side: 'right', k: 10 / Math.sqrt(40) }, { mu: -2, v: 40, p: 0.0569 })],
  }),

  problem({
    ...C7, id: 'c7.xbar-mean-sd', title: 'Mean and standard deviation of x̄', kind: 'numeric', topics: ['sampling-distribution', 'xbar'], src: 'Notes Ex 7.2',
    vars: { mu: range(10, 500, 5), sigma: range(2, 60, 1), n: choice([4, '4'], [9, '9'], [16, '16'], [25, '25'], [36, '36'], [49, '49'], [64, '64'], [100, '100'], [30, '30'], [50, '50']) },
    derive: ($) => ({ se: $.sigma / Math.sqrt($.n), v: ($.sigma * $.sigma) / $.n }),
    text: (T, $) => `A population has mean ${$.mu} and standard deviation ${$.sigma}. Random samples of size ${$.n} are drawn. Find the mean, variance and standard deviation of the sample mean X̄.`,
    parts: [
      num('m', ($) => $.mu, { label: String.raw`$\mu_{\bar X}$`, tol: 0, abs: 1e-9 }),
      num('v', ($) => $.v, { label: String.raw`$\sigma^2_{\bar X}$`, traps: [[($) => $.sigma / $.n, String.raw`Divide the VARIANCE by n: $\sigma^2/n$. (Or the standard deviation by $\sqrt n$.)`]] }),
      num('se', ($) => $.se, { label: String.raw`$\sigma_{\bar X}$`, traps: [[($) => $.sigma / $.n, String.raw`That divides by n. The standard deviation of $\bar X$ is $\sigma/\sqrt{n}$.`]] }),
    ],
    hints: [String.raw`$E(\bar X) = \mu$: averaging does not move the center.`, String.raw`$\operatorname{Var}(\bar X) = \sigma^2/n$, so $\sigma_{\bar X} = \sigma/\sqrt{n}$.`],
    steps: ($) => [
      String.raw`$\mu_{\bar X} = \mu = ${$.mu}$`,
      String.raw`$$\sigma^2_{\bar X} = \dfrac{\sigma^2}{n} = \dfrac{${$.sigma}^2}{${$.n}} = ${tn($.v, 6)}, \qquad \sigma_{\bar X} = \dfrac{\sigma}{\sqrt n} = \dfrac{${$.sigma}}{\sqrt{${$.n}}} = ${tn($.se, 4)}$$`,
      String.raw`Why: $\bar X = \frac1n(X_1 + \cdots + X_n)$, so $E(\bar X) = \frac1n(n\mu) = \mu$ and $\operatorname{Var}(\bar X) = \frac{1}{n^2}(n\sigma^2) = \sigma^2/n$.`,
    ],
    twin: { part: 'v', n: 20000, draw: (r, $) => { let s = 0; for (let i = 0; i < $.n; i++) s += r.normal($.mu, $.sigma); return (s / $.n - $.mu) ** 2; } },
    cases: [],
  }),

  problem({
    ...C7, id: 'c7.xbar-prob', title: 'Probabilities for x̄', kind: 'numeric', level: 2, topics: ['sampling-distribution', 'xbar', 'normal'], src: 'Notes Ex 7.4–7.5',
    vars: {
      ctx: choice(['fill', 'fill'], ['gain', 'gain'], ['battery', 'battery']),
      n: range(4, 60, 1),
      side: LT,
      k: range(-2.4, 2.4, 0.1),
    },
    derive: ($) => {
      const c = { fill: { mu: 12.1, sigma: 0.5, dp: 2, what: 'fill volume of soda cans', unit: 'fluid ounces', normal: true }, gain: { mu: 30, sigma: 12.9, dp: 1, what: 'weight gain during pregnancy', unit: 'pounds', normal: false }, battery: { mu: 3.4, sigma: 0.6, dp: 2, what: 'life of a car battery', unit: 'years', normal: true } }[$.ctx];
      const se = c.sigma / Math.sqrt($.n);
      const x = Number((c.mu + $.k * se).toFixed(c.dp));
      return { c, se, x, ...normalP($.side, x, c.mu, se) };
    },
    valid: ($) => ($.c.normal || $.n >= 30) && Math.abs($.z) > 0.05,
    text: (T, $) =>
      `The ${$.c.what} has mean ${$.c.mu} ${$.c.unit} and standard deviation ${$.c.sigma} ${$.c.unit}${$.c.normal ? ', and is normally distributed' : '; its distribution is skewed right'}. A random sample of ${$.n} is taken. What is the probability that the sample mean is ${$.side === 'left' ? 'less' : 'greater'} than ${$.x} ${$.c.unit}?`,
    parts: [
      num('se', ($) => $.se, { label: String.raw`$\sigma_{\bar X}$` }),
      prob('p', ($) => $.exact, { alt: ($) => [$.table], label: ($T, $) => String.raw`$P(\bar X ${$.side === 'left' ? '<' : '>'} ${$.x})$`, traps: [[($) => ($.side === 'left' ? normCdf(($.x - $.c.mu) / $.c.sigma) : normSf(($.x - $.c.mu) / $.c.sigma)), String.raw`That uses $\sigma$ for one value. For the mean of n values, use $\sigma/\sqrt{n}$.`]] }),
    ],
    hints: [String.raw`$\bar X \sim N(\mu, \sigma^2/n)$: exactly when the population is normal, approximately (CLT) when $n \ge 30$.`, String.raw`$z = \dfrac{\bar x - \mu}{\sigma/\sqrt{n}}$`],
    steps: ($) => [
      $.c.normal ? String.raw`The population is normal, so $\bar X$ is normal for any n.` : String.raw`The population is skewed, but $n = ${$.n} \ge 30$, so by the Central Limit Theorem $\bar X$ is approximately normal.`,
      String.raw`$\sigma_{\bar X} = \dfrac{${$.c.sigma}}{\sqrt{${$.n}}} = ${tn($.se, 4)}$`,
      String.raw`$$z = \dfrac{${$.x} - ${$.c.mu}}{${tn($.se, 4)}} = ${fx($.z, 4)}$$`,
      zLook($.z).line,
      String.raw`$P(\bar X ${$.side === 'left' ? '<' : '>'} ${$.x}) = ${fx($.table, 4)}$ (exact, TI-84 normalcdf: $${fx($.exact, 4)}$)`,
    ],
    // Checks the formula (a normal population); how good the CLT is for a skewed one is the lab's job.
    twin: { part: 'p', n: 20000, draw: (r, $) => { let s = 0; for (let i = 0; i < $.n; i++) s += r.normal($.c.mu, $.c.sigma); const m = s / $.n; return $.side === 'left' ? m < $.x : m > $.x; } },
    cases: [
      kase('Notes Ex 7.4', { ctx: 'fill', n: 10, side: 'left', k: (12 - 12.1) / (0.5 / Math.sqrt(10)) }, { se: 0.1581, p: 0.2635 }),
      kase('Notes Ex 7.5(b)', { ctx: 'gain', n: 35, side: 'right', k: (36.2 - 30) / (12.9 / Math.sqrt(35)) }, { se: 2.1805, p: 0.0022 }),
    ],
  }),

  problem({
    ...C7, id: 'c7.clt-when', title: 'When is x̄ approximately normal?', kind: 'conceptual', topics: ['clt', 'sampling-distribution'], src: 'Notes Ex 7.5',
    vars: { pop: choice(['normal', 'normally distributed'], ['skewed', 'skewed right'], ['unknown', 'of unknown shape']), n: choice([5, '5'], [10, '10'], [15, '15'], [25, '25'], [35, '35'], [40, '40'], [60, '60'], [100, '100']) },
    derive: ($) => ({ key: $.pop === 'normal' ? 'exact' : $.n >= 30 ? 'clt' : 'no' }),
    text: (T, $) => `A population is ${T.pop}, with a known mean and standard deviation. A random sample of ${$.n} is taken. Can you use a normal model to find probabilities about the sample mean X̄?`,
    parts: [
      mc('k', [
        ['exact', 'Yes: X̄ is exactly normal because the population is normal', ''],
        ['clt', 'Yes: by the Central Limit Theorem, since n ≥ 30', ''],
        ['no', 'No: the population is not known to be normal and n < 30', ''],
      ], ($) => $.key),
    ],
    hints: ['If the population is normal, X̄ is normal for every n.', 'Otherwise the Central Limit Theorem makes X̄ approximately normal once n is large; the notes use n ≥ 30.'],
    steps: ($) => [
      { exact: 'A linear function of normal variables is normal, and X̄ is one. So X̄ is exactly normal, whatever n is.', clt: `The population is not normal, but n = ${$.n} ≥ 30, so the Central Limit Theorem says X̄ is approximately normal with mean μ and standard deviation σ/√n.`, no: `The population is not normal and n = ${$.n} < 30, so neither reason applies. A normal model for X̄ is not justified (as in Ex 7.5(a), with n = 10).` }[$.key],
    ],
    cases: [kase('Notes Ex 7.5(a)', { pop: 'skewed', n: 10 }, { k: 'no' }), kase('Notes Ex 7.5(b)', { pop: 'skewed', n: 35 }, { k: 'clt' })],
  }),

  problem({
    ...C7, id: 'c7.normal-approx-binomial', title: 'Normal approximation to the binomial', kind: 'numeric', level: 2, topics: ['normal-approximation', 'binomial', 'continuity-correction'], src: 'Notes Ex 7.6',
    vars: {
      ctx: choice(['bulbs', 'bulbs'], ['survey', 'survey'], ['flights', 'flights']),
      n: choice([100, '100'], [200, '200'], [300, '300'], [500, '500'], [1000, '1000']),
      p: range(0.1, 0.95, 0.01),
      qt: choice(['le', 'at most'], ['lt', 'fewer than'], ['ge', 'at least'], ['gt', 'more than']),
      k: range(-2, 2, 0.1),
    },
    derive: ($) => {
      const mu = $.n * $.p;
      const v = mu * (1 - $.p);
      const sd = Math.sqrt(v);
      const r = Math.round(mu + $.k * sd);
      // Continuity correction: P(X ≤ r) ≈ P(Y < r + 0.5), P(X ≥ r) ≈ P(Y > r − 0.5).
      const cut = { le: r + 0.5, lt: r - 0.5, ge: r - 0.5, gt: r + 0.5 }[$.qt];
      const left = $.qt === 'le' || $.qt === 'lt';
      const z = (cut - mu) / sd;
      const exact = left ? normCdf(z) : normSf(z);
      const t = zTable(z).value;
      const binom = { le: binomCdf(r, $.n, $.p), lt: binomCdf(r - 1, $.n, $.p), ge: 1 - binomCdf(r - 1, $.n, $.p), gt: 1 - binomCdf(r, $.n, $.p) }[$.qt];
      const noCc = left ? normCdf((r - mu) / sd) : normSf((r - mu) / sd);
      return { mu, v, sd, r, cut, left, z, exact, table: left ? t : 1 - t, binom, noCc };
    },
    valid: ($) => $.v >= 10 && $.exact > 0.01 && $.exact < 0.99 && Math.abs($.noCc - $.exact) > 0.004,
    text: (T, $) =>
      ({
        bulbs: `An LED bulb works (does not burn out) with probability ${$.p}, independently of the others. A string has ${$.n} bulbs. Let X be the number that work.`,
        survey: `In a large city, ${Math.round($.p * 100)}% of adults own a bicycle. ${$.n} adults are chosen at random. Let X be the number who own one.`,
        flights: `An airline's flights arrive on time with probability ${$.p}, independently. Consider the next ${$.n} flights. Let X be the number on time.`,
      })[$.ctx] + ` Use the normal approximation to find the probability that X is ${{ le: 'at most', lt: 'fewer than', ge: 'at least', gt: 'more than' }[$.qt]} ${$.r}.`,
    parts: [
      num('v', ($) => $.v, { label: String.raw`Check: $np(1-p)$` }),
      prob('p', ($) => $.exact, {
        alt: ($) => [$.table],
        label: ($T, $) => String.raw`$P(X ${{ le: '\\le', lt: '<', ge: '\\ge', gt: '>' }[$.qt]} ${$.r})$`,
        traps: [
          [($) => $.noCc, 'That skips the continuity correction. X is a count, so stretch each value half a unit: use r ± 0.5.'],
          [($) => $.binom, 'That is the exact binomial probability (binomcdf). The question asks for the normal approximation, with the continuity correction.'],
          [($) => 1 - $.exact, 'That is the other tail.'],
        ],
      }),
    ],
    hints: [String.raw`X is binomial. The notes' condition for the normal approximation: $np(1-p) \ge 10$.`, String.raw`Use $\mu = np$ and $\sigma = \sqrt{np(1-p)}$.`, 'Continuity correction: at most r → below r + 0.5; fewer than r → below r − 0.5; at least r → above r − 0.5; more than r → above r + 0.5.'],
    steps: ($) => [
      String.raw`$np(1-p) = ${$.n}(${$.p})(${fx(1 - $.p, 2)}) = ${tn($.v, 6)} \ge 10$, so the normal approximation applies.`,
      String.raw`$\mu = np = ${tn($.mu, 6)}$, $\sigma = \sqrt{${tn($.v, 6)}} = ${tn($.sd, 4)}$`,
      String.raw`Continuity correction: $P(X ${{ le: '\\le', lt: '<', ge: '\\ge', gt: '>' }[$.qt]} ${$.r}) \approx P(Y ${$.left ? '<' : '>'} ${$.cut})$`,
      String.raw`$$z = \dfrac{${$.cut} - ${tn($.mu, 6)}}{${tn($.sd, 4)}} = ${fx($.z, 4)}$$`,
      zLook($.z).line,
      String.raw`$P \approx ${fx($.table, 4)}$ (exact normal: $${fx($.exact, 4)}$; the true binomial value is $${fx($.binom, 4)}$)`,
    ],
    cases: [kase('Notes Ex 7.6, more than 950 work', { ctx: 'bulbs', n: 1000, p: 0.95, qt: 'gt', k: 0 }, { v: 47.5, p: 0.4711 })],
  }),

  problem({
    ...C7, id: 'c7.phat', title: 'The sampling distribution of p̂', kind: 'numeric', level: 2, topics: ['sampling-distribution', 'proportion'], src: 'Notes Ex 7.7–7.8',
    vars: { p: range(0.1, 0.9, 0.01), n: range(40, 400, 10), side: choice(['le', 'at most'], ['ge', 'at least']), k: range(-2, 2, 0.1) },
    derive: ($) => {
      const se = Math.sqrt(($.p * (1 - $.p)) / $.n);
      const c = Math.round(($.p + $.k * se) * 100) / 100;
      return { se, c, check: $.n * $.p * (1 - $.p), ...normalP($.side === 'le' ? 'left' : 'right', c, $.p, se) };
    },
    valid: ($) => $.check >= 10 && Math.abs($.z) > 0.05 && $.c > 0 && $.c < 1,
    text: (T, $) => `A Gallup study found that ${Math.round($.p * 100)}% of Americans believe the state of moral values in the United States is getting worse. A simple random sample of ${$.n} Americans is taken. Describe the sampling distribution of the sample proportion p̂, and find the probability that ${$.side === 'le' ? 'at most' : 'at least'} ${Math.round($.c * 100)}% of the sample hold this belief.`,
    parts: [
      num('m', ($) => $.p, { label: String.raw`$\mu_{\hat p}$`, tol: 0, abs: 1e-9 }),
      num('se', ($) => $.se, { label: String.raw`$\sigma_{\hat p}$`, traps: [[($) => ($.p * (1 - $.p)) / $.n, String.raw`That is the variance. Take the square root: $\sqrt{p(1-p)/n}$.`]] }),
      prob('pr', ($) => $.exact, { alt: ($) => [$.table], label: ($T, $) => String.raw`$P(\hat p ${$.side === 'le' ? '\\le' : '\\ge'} ${$.c})$` }),
    ],
    hints: [String.raw`If $np(1-p) \ge 10$, $\hat p$ is approximately $N\!\left(p, \dfrac{p(1-p)}{n}\right)$.`, String.raw`$z = \dfrac{\hat p - p}{\sqrt{p(1-p)/n}}$`],
    steps: ($) => [
      String.raw`$np(1-p) = ${$.n}(${$.p})(${fx(1 - $.p, 2)}) = ${tn($.check, 5)} \ge 10$, so $\hat p$ is approximately normal.`,
      String.raw`$$\mu_{\hat p} = p = ${$.p}, \qquad \sigma_{\hat p} = \sqrt{\dfrac{${$.p}(${fx(1 - $.p, 2)})}{${$.n}}} = ${tn($.se, 4)}$$`,
      String.raw`$$z = \dfrac{${$.c} - ${$.p}}{${tn($.se, 4)}} = ${fx($.z, 4)}$$`,
      zLook($.z).line,
      String.raw`$P(\hat p ${$.side === 'le' ? '\\le' : '\\ge'} ${$.c}) = ${fx($.table, 4)}$ (exact $${fx($.exact, 4)}$)`,
    ],
    cases: [kase('Notes Ex 7.8', { p: 0.76, n: 60, side: 'le', k: (0.7 - 0.76) / Math.sqrt((0.76 * 0.24) / 60) }, { m: 0.76, se: 0.0551, pr: 0.1383 })],
  }),

  problem({
    ...C7, id: 'c7.point-estimate', title: 'A point estimate of p', kind: 'numeric', topics: ['proportion', 'point-estimate'], src: 'Notes Ex 7.7, 8.13',
    vars: { n: range(200, 2000, 1), f: range(0.1, 0.9, 0.001) },
    derive: ($) => {
      const x = Math.round($.n * $.f);
      return { x, phat: x / $.n };
    },
    text: (T, $) => `In a Gallup poll, a simple random sample of ${$.n.toLocaleString('en-US')} American adults were asked whether the federal income tax they pay is fair. ${$.x.toLocaleString('en-US')} said yes. Give a point estimate of the proportion of all American adults who believe their tax is fair.`,
    parts: [num('phat', ($) => $.phat, { label: String.raw`$\hat p$`, tol: 0, abs: 0.0006 })],
    hints: [String.raw`$\hat p = x/n$, the proportion in the sample.`],
    steps: ($) => [String.raw`$$\hat p = \dfrac{x}{n} = \dfrac{${$.x}}{${$.n}} = ${fx($.phat, 4)}$$`, 'The sample proportion is the point estimate of the population proportion p.'],
    cases: [kase('Notes Ex 7.7', { n: 1016, f: 558 / 1016 }, { phat: 0.5492 })],
  }),
];

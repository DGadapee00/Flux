/** Chapter 4 · Mathematical expectation. */
import { problem, kase, range, choice, data, num, prob, tn, fx, pn } from '../kit.js';

const C4 = { ch: '4' };

function pmfOf(rand, k) {
  for (;;) {
    const cuts = Array.from({ length: k }, () => 1 + Math.floor(rand() * 19)).sort((a, b) => a - b);
    const parts = [cuts[0], ...cuts.slice(1).map((c, i) => c - cuts[i]), 20 - cuts[k - 1]];
    if (parts.every((p) => p >= 1)) return parts.map((p) => p / 20);
  }
}

/** 3x²/D written the way a person would: x²/(D/3) when D is a multiple of 3. */
const dens = (D) => (D % 3 === 0 ? String.raw`\dfrac{x^2}{${D / 3}}` : String.raw`\dfrac{3x^2}{${D}}`);

const pmfTable = (xs, ps) =>
  `<table class="results" style="max-width:420px"><tbody><tr><th>x</th>${xs.map((x) => `<td>${x}</td>`).join('')}</tr><tr><th>f(x)</th>${ps.map((p) => `<td>${fx(p, 2)}</td>`).join('')}</tr></tbody></table>`;

export default [
  problem({
    ...C4, id: 'c4.mean-variance-pmf', title: 'Mean and variance from a distribution', kind: 'numeric', topics: ['expectation', 'variance'], src: 'Walpole §4.1–4.2',
    vars: { ctx: choice(['net', 'net'], ['defect', 'defect']), k: range(3, 4, 1), shift: range(0, 2, 1), ps: data((r, v) => pmfOf(r, v.k)) },
    derive: ($) => {
      const xs = $.ps.map((_, i) => i + $.shift);
      const mu = xs.reduce((a, x, i) => a + x * $.ps[i], 0);
      const ex2 = xs.reduce((a, x, i) => a + x * x * $.ps[i], 0);
      const v = ex2 - mu * mu;
      return { xs, mu, ex2, v, sd: Math.sqrt(v) };
    },
    valid: ($) => $.v > 0.01,
    text: (T, $) => `${$.ctx === 'net' ? 'X is the number of interruptions per day in a large computer network' : 'X is the number of defective parts in a daily sample'}, with the probability distribution below. Find the mean, variance and standard deviation of X.`,
    figure: ($) => pmfTable($.xs, $.ps),
    parts: [
      num('mu', ($) => $.mu, { label: String.raw`$\mu = E(X)$` }),
      num('v', ($) => $.v, { label: String.raw`$\sigma^2$`, traps: [[($) => $.ex2, String.raw`That is $E(X^2)$. Subtract $\mu^2$.`]] }),
      num('sd', ($) => $.sd, { label: String.raw`$\sigma$` }),
    ],
    hints: [String.raw`$\mu = \sum x f(x)$`, String.raw`$\sigma^2 = E(X^2) - \mu^2$, with $E(X^2) = \sum x^2 f(x)$.`],
    steps: ($) => [
      String.raw`$$\mu = ${$.xs.map((x, i) => `${x}(${fx($.ps[i], 2)})`).join(' + ')} = ${tn($.mu, 6)}$$`,
      String.raw`$$E(X^2) = ${$.xs.map((x, i) => `${x}^2(${fx($.ps[i], 2)})`).join(' + ')} = ${tn($.ex2, 6)}$$`,
      String.raw`$$\sigma^2 = ${tn($.ex2, 6)} - ${pn($.mu, 6)}^2 = ${tn($.v, 6)}, \qquad \sigma = ${tn($.sd, 4)}$$`,
      String.raw`Same answer from the definition: $\sigma^2 = \sum (x - \mu)^2 f(x)$.`,
      'On the TI-84: x values in L1, probabilities in L2, then 1-Var Stats with List L1 and FreqList L2. It shows μ as x̄ and σ as σx.',
    ],
    cases: [kase('Notes Ex 4.1, 4.6', { ctx: 'net', k: 5, shift: 0, ps: [0.35, 0.25, 0.2, 0.1, 0.05, 0.05] }, { mu: 1.4, v: 2.04, sd: 1.428 })],
  }),

  problem({
    ...C4, id: 'c4.expected-g', title: 'Expected value of g(X)', kind: 'numeric', topics: ['expectation', 'linear-combination'], src: 'Notes Ex 4.4',
    vars: { k: range(3, 5, 1), a: range(1, 5, 1), b: range(0, 5, 1), ps: data((r, v) => pmfOf(r, v.k)) },
    derive: ($) => {
      const xs = $.ps.map((_, i) => i);
      const mu = xs.reduce((a, x, i) => a + x * $.ps[i], 0);
      return { xs, mu, eg: $.a * mu + $.b, gs: xs.map((x) => $.a * x + $.b) };
    },
    text: (T, $) => String.raw`X is the number of interruptions per day in a large computer network, with the distribution below. The cost of the interruptions, in thousands of dollars, is $g(X) = ${$.a === 1 ? '' : $.a}X${$.b ? ` + ${$.b}` : ''}$. Find the expected daily cost.`,
    figure: ($) => pmfTable($.xs, $.ps),
    parts: [num('eg', ($) => $.eg, { label: String.raw`$E[g(X)]$`, unit: 'thousand dollars', traps: [[($) => $.mu, String.raw`That is $E(X)$, the expected number of interruptions, not the expected cost.`], [($) => $.a * $.mu, 'The constant is part of the cost too: E(aX + b) = aE(X) + b.']] })],
    hints: [String.raw`$E[g(X)] = \sum g(x)\,f(x)$: apply g to each value, keep the probabilities.`, String.raw`For a linear g, the shortcut $E(aX + b) = aE(X) + b$ gives the same answer.`],
    steps: ($) => [
      String.raw`$$E[g(X)] = ${$.gs.map((g, i) => `${g}(${fx($.ps[i], 2)})`).join(' + ')} = ${tn($.eg, 6)}$$`,
      String.raw`Shortcut: $E(X) = ${tn($.mu, 6)}$, so $E(${$.a}X + ${$.b}) = ${$.a}(${tn($.mu, 6)}) + ${$.b} = ${tn($.eg, 6)}$ thousand dollars.`,
      'On the TI-84: put g(x) in L3 (L3 = 2*L1 + 1, say) and run 1-Var Stats with List L3, FreqList L2.',
    ],
    cases: [kase('Notes Ex 4.4', { k: 5, a: 2, b: 1, ps: [0.35, 0.25, 0.2, 0.1, 0.05, 0.05] }, { eg: 3.8 })],
  }),

  problem({
    ...C4, id: 'c4.commission', title: 'Expected commission from independent deals', kind: 'numeric', level: 2, topics: ['expectation', 'independence'], src: 'Notes Ex 4.2',
    vars: { p1: range(0.3, 0.9, 0.05), c1: range(500, 3000, 250), p2: range(0.2, 0.8, 0.05), c2: range(500, 3000, 250) },
    derive: ($) => {
      const q1 = 1 - $.p1;
      const q2 = 1 - $.p2;
      return { q1, q2, p0: q1 * q2, pa: $.p1 * q2, pb: q1 * $.p2, pab: $.p1 * $.p2, e: $.p1 * $.c1 + $.p2 * $.c2 };
    },
    valid: ($) => $.c1 !== $.c2,
    text: (T, $) => `A salesperson has two appointments today. At the first, the chance of making the deal is ${tn($.p1 * 100)}%, for a commission of ${$.c1} dollars. At the second, the chance is ${tn($.p2 * 100)}%, for ${$.c2} dollars. The results are independent. Find the probability that he earns nothing, and his expected commission.`,
    parts: [
      prob('p0', ($) => $.p0, { label: 'P(no commission)' }),
      num('e', ($) => $.e, { label: 'Expected commission', unit: 'dollars', tol: 0, abs: 0.5, traps: [[($) => $.c1 + $.c2, 'That is the most he can earn. The expected value weights each outcome by its probability.']] }),
    ],
    hints: ['List the four outcomes: neither deal, only the first, only the second, both. Each has a commission and, by independence, a probability found by multiplying.', String.raw`$E(X) = \sum x f(x)$ over those four outcomes.`],
    steps: ($) => [
      String.raw`$x$: $0$, $${$.c1}$, $${$.c2}$, $${$.c1 + $.c2}$ with $f(x)$: $(${fx($.q1, 2)})(${fx($.q2, 2)}) = ${fx($.p0, 4)}$, $(${fx($.p1, 2)})(${fx($.q2, 2)}) = ${fx($.pa, 4)}$, $(${fx($.q1, 2)})(${fx($.p2, 2)}) = ${fx($.pb, 4)}$, $(${fx($.p1, 2)})(${fx($.p2, 2)}) = ${fx($.pab, 4)}$`,
      String.raw`$$E(X) = 0(${fx($.p0, 4)}) + ${$.c1}(${fx($.pa, 4)}) + ${$.c2}(${fx($.pb, 4)}) + ${$.c1 + $.c2}(${fx($.pab, 4)}) = ${tn($.e, 6)}$$`,
      String.raw`Check: the same as $${$.c1}(${fx($.p1, 2)}) + ${$.c2}(${fx($.p2, 2)})$, the expected commission from each appointment added.`,
    ],
    cases: [kase('Notes Ex 4.2', { p1: 0.7, c1: 1000, p2: 0.4, c2: 1500 }, { p0: 0.18, e: 1300 })],
  }),

  problem({
    ...C4, id: 'c4.linear-transform', title: 'Mean and variance of aX + b', kind: 'numeric', topics: ['expectation', 'variance', 'linear-combination'], src: 'Walpole §4.3',
    vars: { mu: range(2, 40, 1), sd: range(1, 8, 0.5), a: range(-4, 6, 1, { exclude: [0, 1] }), b: range(-20, 30, 5) },
    derive: ($) => ({ ey: $.a * $.mu + $.b, vy: $.a * $.a * $.sd * $.sd, sy: Math.abs($.a) * $.sd }),
    text: (T, $) => String.raw`A random variable X has mean ${$.mu} and standard deviation ${$.sd}. Let $Y = ${$.a}X ${$.b < 0 ? '-' : '+'} ${Math.abs($.b)}$. Find the mean, variance and standard deviation of Y.`,
    parts: [
      num('ey', ($) => $.ey, { label: '$E(Y)$' }),
      num('vy', ($) => $.vy, { label: String.raw`$\sigma_Y^2$`, traps: [[($) => $.a * $.sd * $.sd, String.raw`The multiplier is squared: $\sigma^2_{aX+b} = a^2\sigma^2$.`], [($) => $.a * $.a * $.sd * $.sd + $.b, 'Adding a constant shifts every value by the same amount; it does not change the spread.']] }),
      num('sy', ($) => $.sy, { label: String.raw`$\sigma_Y$`, traps: [[($) => $.a * $.sd, 'A standard deviation is never negative: it is |a|σ.']] }),
    ],
    hints: [String.raw`$E(aX + b) = aE(X) + b$`, String.raw`$\sigma^2_{aX+b} = a^2\sigma_X^2$: the constant b drops out.`],
    steps: ($) => [
      String.raw`$E(Y) = ${$.a}(${$.mu}) ${$.b < 0 ? '-' : '+'} ${Math.abs($.b)} = ${$.ey}$`,
      String.raw`$\sigma_Y^2 = ${pn($.a)}^2(${$.sd})^2 = ${tn($.vy, 6)}$`,
      String.raw`$\sigma_Y = |${$.a}|(${$.sd}) = ${tn($.sy, 6)}$`,
    ],
    cases: [],
  }),

  problem({
    ...C4, id: 'c4.linear-combination', title: 'Mean and variance of aX + bY', kind: 'numeric', level: 2, topics: ['linear-combination', 'variance', 'independence'], src: 'Walpole §4.3',
    vars: { mx: range(-5, 20, 1), vx: range(1, 16, 1), my: range(-5, 20, 1), vy: range(1, 16, 1), a: range(1, 4, 1), b: range(-4, 4, 1, { exclude: [0] }), c: range(-10, 10, 1) },
    derive: ($) => ({ m: $.a * $.mx + $.b * $.my + $.c, v: $.a * $.a * $.vx + $.b * $.b * $.vy }),
    text: (T, $) => String.raw`X and Y are the amounts of two kinds of impurity in a batch of a chemical product. They are independent, with $E(X) = ${$.mx}$, $\sigma_X^2 = ${$.vx}$, $E(Y) = ${$.my}$ and $\sigma_Y^2 = ${$.vy}$. Let $Z = ${$.a === 1 ? '' : $.a}X ${$.b < 0 ? '-' : '+'} ${Math.abs($.b) === 1 ? '' : Math.abs($.b)}Y${$.c ? ` ${$.c < 0 ? '-' : '+'} ${Math.abs($.c)}` : ''}$. Find the mean and variance of Z.`,
    parts: [
      num('m', ($) => $.m, { label: '$E(Z)$' }),
      num('v', ($) => $.v, { label: String.raw`$\sigma_Z^2$`, traps: [[($) => $.a * $.a * $.vx - $.b * $.b * $.vy, String.raw`Variances never subtract. For independent X and Y, $\sigma^2_{aX - bY} = a^2\sigma_X^2 + b^2\sigma_Y^2$.`], [($) => $.a * $.vx + $.b * $.vy, 'The coefficients are squared in a variance.']] }),
    ],
    hints: [String.raw`$E(aX + bY) = a\mu_X + b\mu_Y$`, String.raw`For independent X and Y: $\sigma^2_{aX+bY} = a^2\sigma_X^2 + b^2\sigma_Y^2$. The sign of b disappears when it is squared.`],
    steps: ($) => [
      String.raw`$E(Z) = ${$.a}${pn($.mx)} + ${pn($.b)}${pn($.my)}${$.c ? ` + ${pn($.c)}` : ''} = ${$.m}$`,
      String.raw`$\sigma_Z^2 = ${$.a}^2(${$.vx}) + ${pn($.b)}^2(${$.vy}) = ${$.v}$${$.c ? ' (the constant adds nothing to the variance)' : ''}`,
      $.b < 0 ? 'Subtracting Y still adds its variance: the difference is spread out by both variables.' : 'Both variables add their spread.',
    ],
    twin: { part: 'v', n: 60000, draw: (r, $) => { const z = $.a * r.normal($.mx, Math.sqrt($.vx)) + $.b * r.normal($.my, Math.sqrt($.vy)) + $.c; return (z - $.m) ** 2; } },
    cases: [
      kase('Notes Ex 4.8', { mx: -1, vx: 2, my: 2, vy: 3, a: 3, b: -2, c: 5 }, { m: -2, v: 30 }, { note: 'The notes also show the wrong route, Var(3X) − Var(2Y) = 6: variances of independent variables always add.' }),
      kase('Review 1, Q3', { mx: 1, vx: 1, my: -3, vy: 4, a: 2, b: -1, c: -5 }, { m: 0, v: 8 }),
    ],
  }),

  problem({
    ...C4, id: 'c4.pdf-mean', title: 'Mean and variance from a density', kind: 'numeric', level: 2, topics: ['expectation', 'variance', 'pdf'], src: 'Walpole §4.1–4.2',
    vars: { k: range(1, 4, 1), s: range(0, 2, 1) },
    derive: ($) => {
      const m0 = ($.k + 1) / ($.k + 2);
      const e20 = ($.k + 1) / ($.k + 3);
      const v = e20 - m0 * m0;
      const mu = $.s + m0;
      return { m0, mu, v, ex2: v + mu * mu, u: $.s ? `(x - ${$.s})` : 'x' };
    },
    text: (T, $) =>
      $.s
        ? String.raw`The weekly demand X for a drinking-water product, in thousands of liters, has density $f(x) = ${$.k + 1}${$.u}${$.k > 1 ? `^{${$.k}}` : ''}$ for $${$.s} < x < ${$.s + 1}$, and 0 elsewhere. Find the mean and variance of X.`
        : String.raw`X has density $f(x) = ${$.k + 1}x${$.k > 1 ? `^{${$.k}}` : ''}$ for $0 < x < 1$, and 0 elsewhere. Find $E(X)$ and $\sigma^2$.`,
    parts: [num('mu', ($) => $.mu, { label: '$E(X)$' }), num('v', ($) => $.v, { label: String.raw`$\sigma^2$`, traps: [[($) => $.ex2, String.raw`That is $E(X^2)$. Subtract $\mu^2$.`]] })],
    hints: [String.raw`$E(X) = \int x f(x)\,dx$`, String.raw`$\sigma^2 = E(X^2) - \mu^2$, with $E(X^2) = \int x^2 f(x)\,dx$.`],
    steps: ($) => [
      String.raw`$$E(X) = \int_{${$.s}}^{${$.s + 1}} x\cdot ${$.k + 1}${$.u}^{${$.k}}\,dx = ${tn($.mu)}$$`,
      String.raw`$$E(X^2) = \int_{${$.s}}^{${$.s + 1}} x^2 \cdot ${$.k + 1}${$.u}^{${$.k}}\,dx = ${tn($.ex2)}$$`,
      String.raw`$$\sigma^2 = E(X^2) - \mu^2 = ${tn($.ex2)} - (${tn($.mu)})^2 = ${tn($.v)}$$`,
      'On the TI-84, MATH → 9:fnInt( evaluates each integral.',
    ],
    twin: { part: 'mu', draw: (r, $) => $.s + r.next() ** (1 / ($.k + 1)) },
    cases: [kase('Walpole §4.1', { k: 1, s: 0 }, { mu: 2 / 3, v: 1 / 18 }), kase('Notes Ex 4.7', { k: 1, s: 1 }, { mu: 5 / 3, v: 1 / 18 })],
  }),

  problem({
    ...C4, id: 'c4.expected-life', title: 'Expected life from a density with a long tail', kind: 'numeric', level: 2, topics: ['expectation', 'pdf'], src: 'Notes Ex 4.3',
    vars: { m: choice([50, '50'], [100, '100'], [200, '200'], [250, '250'], [400, '400']), a: range(1.2, 4, 0.1) },
    derive: ($) => {
      const x = Math.round($.a * $.m);
      return { c: 2 * $.m * $.m, x, mu: 2 * $.m, tail: ($.m / x) ** 2 };
    },
    text: (T, $) => String.raw`X is the life, in hours, of a certain electronic device, with density $f(x) = \dfrac{${$.c.toLocaleString('en-US').replace(/,/g, '{,}')}}{x^3}$ for $x > ${$.m}$, and 0 elsewhere. Find the expected life, and the probability that a device lasts more than ${$.x} hours.`,
    parts: [
      num('mu', ($) => $.mu, { label: '$E(X)$', unit: 'hours' }),
      prob('tail', ($) => $.tail, { label: ($T, $) => String.raw`$P(X > ${$.x})$` }),
    ],
    hints: [String.raw`$E(X) = \int x f(x)\,dx$ over the whole range where $f(x) > 0$, here up to $\infty$.`, String.raw`$\int x \cdot \dfrac{c}{x^3}\,dx = \int c\,x^{-2}\,dx = -\dfrac{c}{x}$.`],
    steps: ($) => [
      String.raw`$$E(X) = \int_{${$.m}}^{\infty} x\cdot\dfrac{${$.c}}{x^3}\,dx = \int_{${$.m}}^{\infty} ${$.c}\,x^{-2}\,dx = \left[-\dfrac{${$.c}}{x}\right]_{${$.m}}^{\infty} = 0 + \dfrac{${$.c}}{${$.m}} = ${$.mu}$$`,
      String.raw`$$P(X > ${$.x}) = \int_{${$.x}}^{\infty} \dfrac{${$.c}}{x^3}\,dx = \left[-\dfrac{${$.c / 2}}{x^2}\right]_{${$.x}}^{\infty} = \dfrac{${$.c / 2}}{${$.x}^2} = ${fx($.tail, 4)}$$`,
    ],
    twin: { part: 'tail', draw: (r, $) => $.m / Math.sqrt(r.next()) > $.x },
    cases: [kase('Notes Ex 4.3', { m: 100, a: 2 }, { mu: 200, tail: 0.25 })],
  }),

  problem({
    ...C4, id: 'c4.expected-g-continuous', title: 'E[g(X)] for a continuous X', kind: 'numeric', level: 2, topics: ['expectation', 'pdf', 'linear-combination'], src: 'Notes Ex 4.5',
    vars: { a: range(0, 2, 1), b: range(1, 3, 1), c: range(2, 6, 1), d: range(-5, 5, 1) },
    derive: ($) => {
      const D = $.a ** 3 + $.b ** 3;
      const mu = (3 * ($.b ** 4 - $.a ** 4)) / (4 * D);
      return { D, mu, eg: $.c * mu + $.d };
    },
    text: (T, $) => String.raw`X has density $f(x) = ${dens($.D)}$ for $${-$.a} < x < ${$.b}$, and 0 elsewhere. Find the expected value of $g(X) = ${$.c}X ${$.d < 0 ? '-' : '+'} ${Math.abs($.d)}$.`,
    parts: [num('eg', ($) => $.eg, { label: String.raw`$E[g(X)]$`, traps: [[($) => $.mu, String.raw`That is $E(X)$. Apply g: $E(cX + d) = cE(X) + d$.`]] })],
    hints: [String.raw`$E[g(X)] = \int g(x) f(x)\,dx$.`, String.raw`For a linear g, find $E(X)$ first and use $E(cX + d) = cE(X) + d$.`],
    steps: ($) => [
      String.raw`$$E(X) = \int_{${-$.a}}^{${$.b}} x\cdot ${dens($.D)}\,dx = \dfrac{3x^4}{4(${$.D})}\Big|_{${-$.a}}^{${$.b}} = ${tn($.mu)}$$`,
      String.raw`$$E(${$.c}X ${$.d < 0 ? '-' : '+'} ${Math.abs($.d)}) = ${$.c}(${tn($.mu)}) ${$.d < 0 ? '-' : '+'} ${Math.abs($.d)} = ${tn($.eg)}$$`,
      String.raw`Or directly: $\displaystyle\int_{${-$.a}}^{${$.b}} (${$.c}x ${$.d < 0 ? '-' : '+'} ${Math.abs($.d)})\,${dens($.D)}\,dx$ gives the same.`,
    ],
    cases: [kase('Notes Ex 4.5', { a: 1, b: 2, c: 4, d: 3 }, { eg: 8 })],
  }),

  problem({
    ...C4, id: 'c4.expected-value', title: 'Expected profit', kind: 'numeric', topics: ['expectation'], src: 'Walpole §4.1',
    vars: { prem: range(100, 900, 50), pay: range(5000, 50000, 1000), p: range(0.001, 0.03, 0.001) },
    derive: ($) => ({ e: $.prem - $.p * $.pay }),
    text: (T, $) => `An insurance company sells a one-year policy for ${$.prem} dollars. If the insured event happens (probability ${$.p}), the company pays ${$.pay.toLocaleString('en-US')} dollars. What is the company's expected profit on one policy?`,
    parts: [num('e', ($) => $.e, { label: 'Expected profit', unit: 'dollars', tol: 0, abs: 0.5, traps: [[($) => -$.p * $.pay, 'That leaves out the premium, which the company keeps either way.'], [($) => $.prem - $.pay, 'That is the profit if the event happens. Weight each outcome by its probability.']] })],
    hints: [String.raw`$E(X) = \sum x f(x)$ over the outcomes.`, `Profit is the premium if nothing happens, and the premium minus the payout if it does.`],
    steps: ($) => [
      String.raw`Profit $X$: $${$.prem}$ with probability $${fx(1 - $.p, 3)}$, and $${$.prem} - ${$.pay} = ${$.prem - $.pay}$ with probability $${$.p}$.`,
      String.raw`$$E(X) = ${$.prem}(${fx(1 - $.p, 3)}) + (${$.prem - $.pay})(${$.p}) = ${$.prem} - ${$.p}(${$.pay}) = ${tn($.e, 6)}$$`,
    ],
    cases: [],
  }),
];

/** Chapter 5 · Some discrete probability distributions: binomial, geometric, Poisson. */
import { problem, kase, range, choice, num, prob, mc, tn, fx, binomTable, poisTable } from '../kit.js';
import { binomPmf, binomCdf, geomPmf, geomCdf, poisPmf, poisCdf, choose } from '../../stats/dist.js';
import { BINOM_PS, POIS_MUS } from '../../stats/tables.js';

const C5 = { ch: '5' };

/**
 * Binomial settings: what a trial is and what counts as a success. A setting quoted from a source
 * (the Red Cross, Gallup, CTIA) names it only at the source's own figure; other versions say
 * "suppose", so no made-up percentage is ever pinned on a real organization. `pmax` keeps a
 * setting's success rate believable (no run where 70% of the items are defective).
 */
const BIN_CTX = [
  { value: 'defect', pmax: 0.3, text: (n, p) => `In a production run, ${pct(p)} of the items are defective. A random sample of ${n} items is inspected. Let X be the number of defective items in the sample.` },
  { value: 'recover', text: (n, p) => `The probability that a patient recovers from a rare blood disease is ${p}. ${cap(words(n))} people are known to have contracted the disease. Let X be the number who recover.` },
  { value: 'throws', text: (n, p) => `A basketball player makes ${pct(p)} of her free throws. She shoots ${n} free throws, independently. Let X be the number she makes.` },
  { value: 'survey', text: (n, p) => `In a large city, ${pct(p)} of adults support a new transit tax. ${cap(words(n))} adults are chosen at random. Let X be the number who support it.` },
  {
    value: 'blood',
    text: (n, p) =>
      near(p, 0.15)
        ? `According to the American Red Cross, 15% of people in the United States have blood type O-negative. A simple random sample of ${n} people is taken. Let X be the number with type O-negative.`
        : `Suppose ${pct(p)} of the people in a large population have blood type O-negative. A simple random sample of ${n} people is taken. Let X be the number with type O-negative.`,
  },
  {
    value: 'favor',
    text: (n, p) =>
      near(p, 0.65)
        ? `According to the Gallup Organization, 65% of adult Americans are in favor of the death penalty for individuals convicted of murder. In a random sample of ${n} adult Americans, let X be the number in favor.`
        : `Suppose ${pct(p)} of the adults in a state are in favor of the death penalty for individuals convicted of murder. In a random sample of ${n} adults from the state, let X be the number in favor.`,
  },
  {
    value: 'wireless',
    text: (n, p) =>
      near(p, 0.41)
        ? `According to CTIA, 41% of all U.S. households are wireless-only (no landline). In a random sample of ${n} households, let X be the number that are wireless-only.`
        : `Suppose ${pct(p)} of the households in a region are wireless-only (no landline). In a random sample of ${n} households, let X be the number that are wireless-only.`,
  },
];
const near = (a, b) => Math.abs(a - b) < 1e-9;
/** Generated versions only: the setting's success rate stays believable. */
const binOk = ($) => $.p <= (BIN_CTX.find((c) => c.value === $.ctx).pmax ?? 1);
const BIN = choice(...BIN_CTX.map((c) => [c.value, c.value]));
const binText = ($) => BIN_CTX.find((c) => c.value === $.ctx).text($.n, $.p);

const pct = (p) => `${Number((p * 100).toFixed(2))}%`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const words = (n) => WORDS[n] ?? String(n);

/** B(r; n, p) for the table-lookup line. */
const Bt = (r, n, p) => String.raw`\textstyle\sum_{x=0}^{${r}} b(x; ${n}, ${p})`;

/**
 * A probability question about a count X, turned into cumulative sums the way the table needs
 * them: P(X ≥ r) = 1 − P(X ≤ r − 1), P(a ≤ X ≤ b) = P(X ≤ b) − P(X ≤ a − 1), and so on.
 * Returns the TeX of the question and of the rewrite, and the cumulative terms with their signs.
 */
function cumulative(q, r, b) {
  switch (q) {
    case 'le':
      return { ask: String.raw`P(X \le ${r})`, terms: [[1, r]], one: false };
    case 'lt':
      return { ask: String.raw`P(X < ${r})`, terms: [[1, r - 1]], one: false, rewrite: String.raw`P(X \le ${r - 1})` };
    case 'ge':
      return { ask: String.raw`P(X \ge ${r})`, terms: [[-1, r - 1]], one: true, rewrite: String.raw`1 - P(X \le ${r - 1})` };
    case 'gt':
      return { ask: String.raw`P(X > ${r})`, terms: [[-1, r]], one: true, rewrite: String.raw`1 - P(X \le ${r})` };
    default:
      return { ask: String.raw`P(${r} \le X \le ${b})`, terms: [[1, b], [-1, r - 1]], one: false, rewrite: String.raw`P(X \le ${b}) - P(X \le ${r - 1})` };
  }
}
const QTYPE = choice(['le', 'at most'], ['lt', 'fewer than'], ['ge', 'at least'], ['gt', 'more than'], ['between', 'between']);
/** The verb phrase for a count k: "1 is defective" but "2 are defective". noun: [plural, singular]. */
const said = (k, noun) => (Array.isArray(noun) ? noun[k === 1 ? 1 : 0] : noun);
const phrase = (q, r, b, noun) =>
  ({ le: `at most ${r} ${said(r, noun)}`, lt: `fewer than ${r} ${said(r, noun)}`, ge: `at least ${r} ${said(r, noun)}`, gt: `more than ${r} ${said(r, noun)}`, between: `from ${r} to ${b} ${said(2, noun)}, inclusive` })[q];
const NOUN = {
  defect: ['are defective', 'is defective'],
  recover: ['recover', 'recovers'],
  throws: ['are made', 'is made'],
  survey: ['support it', 'supports it'],
  blood: ['have type O-negative', 'has type O-negative'],
  favor: ['favor the death penalty', 'favors the death penalty'],
  wireless: ['are wireless-only', 'is wireless-only'],
};

/** Evaluate a cumulative rewrite with a cdf. */
const evalCum = (c, cdf) => (c.one ? 1 : 0) + c.terms.reduce((a, [s, r]) => a + s * (r < 0 ? 0 : cdf(r)), 0);

export default [
  // ----------------------------------------------------------------- binomial
  problem({
    ...C5, id: 'c5.binom-pmf', title: 'Binomial: exactly x successes', kind: 'numeric', topics: ['binomial'], src: 'Walpole §5.2',
    vars: { ctx: BIN, n: range(5, 20, 1), p: range(0.05, 0.95, 0.05), x: range(0, 20, 1) },
    derive: ($) => ({ q: 1 - $.p, ans: binomPmf($.x, $.n, $.p), C: choose($.n, $.x) }),
    valid: ($) => $.x <= $.n && $.ans > 0.005,
    sampleValid: binOk,
    text: (T, $) => `${binText($)} Find the probability that exactly ${$.x} ${said($.x, NOUN[$.ctx])}.`,
    parts: [
      prob('p', ($) => $.ans, {
        label: ($T, $) => String.raw`$P(X = ${$.x})$`,
        alt: ($) => {
          const hi = binomTable($.x, $.n, $.p);
          const lo = $.x > 0 ? binomTable($.x - 1, $.n, $.p) : 0;
          return hi == null || lo == null ? [] : [hi - lo];
        },
        traps: [[($) => binomCdf($.x, $.n, $.p), String.raw`That is $P(X \le x)$, the cumulative sum. "Exactly" asks for one term, $b(x; n, p)$.`]],
      }),
    ],
    hints: [String.raw`$X$ is binomial: a fixed number $n$ of independent trials, each a success with the same probability $p$.`, String.raw`$b(x; n, p) = \dbinom{n}{x} p^x q^{n-x}$, with $q = 1 - p$.`],
    steps: ($) => {
      const out = [
        String.raw`$X$ is binomial with $n = ${$.n}$ and $p = ${$.p}$, so $q = ${fx($.q, 2)}$.`,
        String.raw`$$P(X = ${$.x}) = \binom{${$.n}}{${$.x}}(${$.p})^{${$.x}}(${fx($.q, 2)})^{${$.n - $.x}} = ${$.C}\,(${$.p})^{${$.x}}(${fx($.q, 2)})^{${$.n - $.x}} = ${fx($.ans, 4)}$$`,
      ];
      const hi = binomTable($.x, $.n, $.p);
      if (hi != null) {
        const lo = $.x > 0 ? binomTable($.x - 1, $.n, $.p) : 0;
        out.push(String.raw`With Table A.1: $P(X = ${$.x}) = P(X \le ${$.x}) - P(X \le ${$.x - 1}) = ${fx(hi, 4)} - ${fx(lo, 4)} = ${fx(hi - lo, 4)}$`);
      }
      out.push(`On the TI-84: 2nd VARS (DISTR) → binompdf(${$.n}, ${$.p}, ${$.x}).`);
      return out;
    },
    twin: { part: 'p', draw: (r, $) => r.binomial($.n, $.p) === $.x },
    cases: [
      kase('Notes Ex 5.2', { ctx: 'blood', n: 4, p: 0.15, x: 1 }, { p: 0.368 }),
      kase('Notes Ex 5.3(a)', { ctx: 'favor', n: 15, p: 0.65, x: 10 }, { p: 0.212 }),
      kase('Notes Ex 5.4(a)', { ctx: 'wireless', n: 20, p: 0.41, x: 5 }, { p: 0.0656 }),
      kase('Walpole §5.2', { ctx: 'recover', n: 15, p: 0.4, x: 5 }, { p: 0.1859 }),
    ],
  }),

  problem({
    ...C5, id: 'c5.binom-table', title: 'Binomial with Table A.1', kind: 'numeric', level: 2, topics: ['binomial', 'binomial-table'], src: 'Walpole §5.2',
    vars: { ctx: BIN, n: range(5, 20, 1), p: choice(...BINOM_PS.map((p) => [p, String(p)])), qt: QTYPE, r: range(1, 19, 1), w: range(1, 6, 1) },
    derive: ($) => {
      const b = $.r + $.w;
      const c = cumulative($.qt, $.r, b);
      return { b, c, ans: evalCum(c, (k) => binomCdf(k, $.n, $.p)), table: evalCum(c, (k) => binomTable(k, $.n, $.p)) };
    },
    valid: ($) => $.r >= 1 && $.r < $.n && ($.qt !== 'between' || $.b <= $.n) && $.ans > 0.001 && $.ans < 0.999,
    sampleValid: binOk,
    text: (T, $) => `${binText($)} Use Table A.1 to find the probability that ${phrase($.qt, $.r, $.b, NOUN[$.ctx])}.`,
    parts: [
      prob('p', ($) => $.ans, {
        label: ($T, $) => `$${$.c.ask}$`,
        alt: ($) => [$.table],
        traps: [
          [($) => 1 - $.ans, 'That is the complement. Check which values of X the question includes.'],
          [($) => ($.qt === 'ge' ? 1 - binomCdf($.r, $.n, $.p) : $.qt === 'le' ? binomCdf($.r - 1, $.n, $.p) : $.qt === 'lt' ? binomCdf($.r, $.n, $.p) : $.qt === 'gt' ? 1 - binomCdf($.r - 1, $.n, $.p) : binomCdf($.b, $.n, $.p) - binomCdf($.r, $.n, $.p)), 'Off by one value of X: check whether the boundary value itself is included (at least / more than, at most / fewer than).'],
        ],
      }),
    ],
    hints: ['Table A.1 gives cumulative sums, P(X ≤ r). Rewrite the question in that form first.', String.raw`$P(X \ge r) = 1 - P(X \le r - 1)$ and $P(a \le X \le b) = P(X \le b) - P(X \le a - 1)$.`, 'Read the table at your n, in the column for p.'],
    steps: ($) => {
      const out = [String.raw`$X$ is binomial with $n = ${$.n}$, $p = ${$.p}$.`];
      out.push($.c.rewrite ? String.raw`$${$.c.ask} = ${$.c.rewrite}$` : String.raw`$${$.c.ask}$ is a cumulative sum already.`);
      for (const [, r] of $.c.terms) if (r >= 0) out.push(String.raw`Table A.1, $n = ${$.n}$, $p = ${$.p}$, $r = ${r}$: $${Bt(r, $.n, $.p)} = ${fx(binomTable(r, $.n, $.p), 4)}$`);
      const vals = $.c.terms.map(([s, r]) => [s, r < 0 ? 0 : binomTable(r, $.n, $.p)]);
      const expr = ($.c.one ? '1' : '') + vals.map(([s, v], i) => `${s < 0 ? ' - ' : i || $.c.one ? ' + ' : ''}${fx(v, 4)}`).join('');
      out.push(String.raw`$$${$.c.ask} = ${expr} = ${fx($.table, 4)}$$`);
      out.push(`On the TI-84, binomcdf(${$.n}, ${$.p}, r) gives P(X ≤ r).`);
      return out;
    },
    twin: {
      part: 'p',
      draw: (r, $) => {
        const x = r.binomial($.n, $.p);
        return { le: x <= $.r, lt: x < $.r, ge: x >= $.r, gt: x > $.r, between: x >= $.r && x <= $.b }[$.qt];
      },
    },
    cases: [
      kase('Walpole §5.2', { ctx: 'recover', n: 15, p: 0.4, qt: 'ge', r: 10, w: 1 }, { p: 0.0338 }),
      kase('Walpole §5.2', { ctx: 'recover', n: 15, p: 0.4, qt: 'between', r: 3, w: 5 }, { p: 0.8779 }),
    ],
  }),

  problem({
    ...C5, id: 'c5.binom-mean-var', title: 'Binomial mean and variance', kind: 'numeric', topics: ['binomial', 'expectation'], src: 'Walpole §5.2',
    vars: { ctx: BIN, n: range(10, 400, 5), p: range(0.05, 0.95, 0.05) },
    derive: ($) => ({ mu: $.n * $.p, v: $.n * $.p * (1 - $.p), sd: Math.sqrt($.n * $.p * (1 - $.p)) }),
    sampleValid: binOk,
    text: (T, $) => `${binText($)} Find the mean, variance and standard deviation of X.`,
    parts: [
      num('mu', ($) => $.mu, { label: String.raw`$\mu$` }),
      num('v', ($) => $.v, { label: String.raw`$\sigma^2$` }),
      num('sd', ($) => $.sd, { label: String.raw`$\sigma$` }),
    ],
    hints: [String.raw`For a binomial, $\mu = np$ and $\sigma^2 = npq$.`, String.raw`$\sigma = \sqrt{npq}$.`],
    steps: ($) => [
      String.raw`$\mu = np = ${$.n}(${$.p}) = ${tn($.mu, 6)}$`,
      String.raw`$\sigma^2 = npq = ${$.n}(${$.p})(${fx(1 - $.p, 2)}) = ${tn($.v, 6)}$`,
      String.raw`$\sigma = \sqrt{${tn($.v, 6)}} = ${tn($.sd, 4)}$`,
    ],
    cases: [kase('Notes Ex 5.5', { ctx: 'wireless', n: 20, p: 0.41 }, { mu: 8.2, v: 4.838, sd: 2.2 }), kase('Walpole §5.2', { ctx: 'recover', n: 15, p: 0.4 }, { mu: 6, v: 3.6, sd: 1.897 })],
  }),

  problem({
    ...C5, id: 'c5.binom-cdf', title: 'Binomial: at most, at least, between (TI-84)', kind: 'numeric', level: 2, topics: ['binomial', 'binomial-cdf'], src: 'Notes Ex 5.3–5.4',
    vars: { ctx: BIN, n: range(5, 30, 1), p: range(0.05, 0.95, 0.01), qt: QTYPE, r: range(1, 29, 1), w: range(1, 6, 1) },
    derive: ($) => {
      const b = $.r + $.w;
      const c = cumulative($.qt, $.r, b);
      return { b, c, ans: evalCum(c, (k) => binomCdf(k, $.n, $.p)) };
    },
    valid: ($) => $.r >= 1 && $.r < $.n && ($.qt !== 'between' || $.b <= $.n) && $.ans > 0.001 && $.ans < 0.999,
    sampleValid: binOk,
    text: (T, $) => `${binText($)} Find the probability that ${phrase($.qt, $.r, $.b, NOUN[$.ctx])}.`,
    parts: [
      prob('p', ($) => $.ans, {
        label: ($T, $) => `$${$.c.ask}$`,
        traps: [
          [($) => 1 - $.ans, 'That is the complement. Check which values of X the question includes.'],
          [($) => ($.qt === 'ge' ? 1 - binomCdf($.r, $.n, $.p) : $.qt === 'le' ? binomCdf($.r - 1, $.n, $.p) : $.qt === 'lt' ? binomCdf($.r, $.n, $.p) : $.qt === 'gt' ? 1 - binomCdf($.r - 1, $.n, $.p) : binomCdf($.b, $.n, $.p) - binomCdf($.r, $.n, $.p)), 'Off by one value of X: check whether the boundary value itself is included (at least / more than, at most / fewer than).'],
        ],
      }),
    ],
    hints: ['binomcdf(n, p, r) gives P(X ≤ r). Rewrite the question in terms of “≤” first.', String.raw`Fewer than r means $X \le r - 1$. At least r is the complement of $X \le r - 1$.`, String.raw`Between a and b, inclusive: $P(X \le b) - P(X \le a - 1)$.`],
    steps: ($) => {
      const out = [String.raw`$X$ is binomial with $n = ${$.n}$, $p = ${$.p}$.`];
      out.push($.c.rewrite ? String.raw`$${$.c.ask} = ${$.c.rewrite}$` : String.raw`$${$.c.ask}$ is a cumulative sum already.`);
      const vals = $.c.terms.map(([sg, r]) => [sg, r < 0 ? 0 : binomCdf(r, $.n, $.p), r]);
      for (const [, v, r] of vals) if (r >= 0) out.push(`binomcdf(${$.n}, ${$.p}, ${r}) = ${fx(v, 4)}`);
      const expr = ($.c.one ? '1' : '') + vals.map(([sg, v], i) => `${sg < 0 ? ' - ' : i || $.c.one ? ' + ' : ''}${fx(v, 4)}`).join('');
      out.push(String.raw`$$${$.c.ask} = ${expr} = ${fx($.ans, 4)}$$`);
      return out;
    },
    twin: {
      part: 'p',
      draw: (r, $) => {
        const x = r.binomial($.n, $.p);
        return { le: x <= $.r, lt: x < $.r, ge: x >= $.r, gt: x > $.r, between: x >= $.r && x <= $.b }[$.qt];
      },
    },
    cases: [
      kase('Notes Ex 5.3(b)', { ctx: 'favor', n: 15, p: 0.65, qt: 'le', r: 6, w: 1 }, { p: 0.042 }),
      kase('Notes Ex 5.4(b)', { ctx: 'wireless', n: 20, p: 0.41, qt: 'lt', r: 3, w: 1 }, { p: 0.0028 }),
      kase('Notes Ex 5.4(c)', { ctx: 'wireless', n: 20, p: 0.41, qt: 'le', r: 3, w: 1 }, { p: 0.0128 }),
      kase('Notes Ex 5.4(d)', { ctx: 'wireless', n: 20, p: 0.41, qt: 'ge', r: 3, w: 1 }, { p: 0.9972 }),
      kase('Notes Ex 5.4(e)', { ctx: 'wireless', n: 20, p: 0.41, qt: 'between', r: 5, w: 2 }, { p: 0.3381 }),
    ],
  }),

  problem({
    ...C5, id: 'c5.is-binomial', title: 'Is it binomial?', kind: 'conceptual', topics: ['binomial'], src: 'Notes Ex 5.1',
    vars: {
      s: choice(
        ['a', 'Flip a coin 5 times. X = the number of heads.'],
        ['b', 'Throw a die 10 times. X = the number of times you get a 5 or a 6.'],
        ['c', 'A couple decides to keep having children until their first girl is born. X = the total number of children.'],
        ['d', 'While adjusting the scope of a rifle, a shooter fires 10 test shots. X = the number of shots that hit the bull’s-eye.'],
        ['e', 'A black box holds 8 blue, 6 red and 3 white balls. 4 balls are picked from the box. X = the number of red balls.'],
        ['f', 'Peter forgot his email password. He tries passwords he commonly uses, but the account locks after 4 wrong tries. X = the number of times he tries.'],
        ['g', 'Twelve randomly chosen voters are asked whether they support a proposal that 55% of all voters support. X = the number who say yes.'],
        ['h', 'Cards are dealt one at a time from a shuffled deck until the first ace appears. X = the number of cards dealt.'],
      ),
    },
    derive: ($) => ({ key: { a: 'yes', b: 'yes', g: 'yes', c: 'n', h: 'n', f: 'n', d: 'indep', e: 'indep' }[$.s] }),
    text: (T) => T.s,
    parts: [
      mc('b', [
        ['yes', 'Binomial'],
        ['n', 'Not binomial: the number of trials is not fixed in advance'],
        ['indep', 'Not binomial: the trials are not independent (the chance of success changes)'],
      ], ($) => $.key, { label: 'Does X follow a binomial distribution?' }),
    ],
    hints: ['Check each condition: a fixed number n of trials; two outcomes per trial; the same chance p on every trial; independent trials.', 'If you stop when something happens, n is not fixed.', 'Drawing without replacement, or changing the setup between trials, changes p from trial to trial.'],
    steps: ($) =>
      [
        {
          a: 'Each flip is a trial with two outcomes (head is a success, p = 0.5), n = 5 is fixed, and flips are independent. X is binomial with n = 5, p = 0.5.',
          b: 'Each throw is a trial: 5 or 6 is a success (p = 1/3), n = 10 is fixed, and throws are independent. X is binomial with n = 10, p = 1/3.',
          c: 'The couple stops at the first girl, so the number of trials is not fixed. X is not binomial (it is geometric).',
          d: 'The scope is being adjusted between shots, so the chance of a bull’s-eye changes and the shots are not independent trials with a common p. X is not binomial.',
          e: 'The balls are picked without replacement, so each draw changes the chance that the next is red. The trials are not independent. X is not binomial.',
          f: 'There is no fixed number of trials (he stops when a password works or the account locks), and no fixed success probability from try to try. X is not binomial.',
          g: 'Twelve independent responses, each yes (p = 0.55) or no: X is binomial with n = 12, p = 0.55. (Sampling a few people from a large population is treated as independent.)',
          h: 'Dealing stops at the first ace, so n is not fixed (and the draws are without replacement too). X is not binomial.',
        }[$.s],
      ],
    cases: [kase('Notes Ex 5.1(b)', { s: 'b' }, { b: 'yes' }), kase('Notes Ex 5.1(c)', { s: 'c' }, { b: 'n' }), kase('Notes Ex 5.1(e)', { s: 'e' }, { b: 'indep' })],
  }),

  // ----------------------------------------------------------------- geometric
  problem({
    ...C5, id: 'c5.geometric', title: 'Geometric: the first success', kind: 'numeric', topics: ['geometric'], src: 'Notes Ex 5.6–5.7',
    vars: {
      ctx: choice(['defect', 'defect'], ['call', 'call'], ['sale', 'sale']),
      p: range(0.01, 0.4, 0.01),
      x: range(2, 12, 1),
    },
    derive: ($) => ({ q: 1 - $.p, eq: geomPmf($.x, $.p), le: geomCdf($.x, $.p), mu: 1 / $.p, sd: Math.sqrt(1 - $.p) / $.p }),
    valid: ($) => $.eq > 0.002,
    text: (T, $) =>
      ({
        defect: `In a manufacturing process, ${pct($.p)} of items are defective. Items are inspected one at a time. Let X be the number of the item on which the first defective is found.`,
        call: `A caller gets through to a busy office on ${pct($.p)} of attempts, independently. Let X be the attempt on which the caller first gets through.`,
        sale: `A salesperson makes a sale on ${pct($.p)} of calls, independently. Let X be the call on which the first sale is made.`,
      })[$.ctx],
    parts: [
      prob('eq', ($) => $.eq, { label: ($T, $) => String.raw`$P(X = ${$.x})$`, traps: [[($) => Math.pow(1 - $.p, $.x) * $.p, String.raw`That uses $q^{x}$. Before the first success on trial $x$ there are $x - 1$ failures: $q^{x-1}$.`]] }),
      prob('le', ($) => $.le, { label: ($T, $) => String.raw`$P(X \le ${$.x})$` }),
      num('mu', ($) => $.mu, { label: String.raw`$\mu = E(X)$` }),
      num('sd', ($) => $.sd, { label: String.raw`$\sigma$`, traps: [[($) => (1 - $.p) / ($.p * $.p), String.raw`That is $\sigma^2$. Take its square root.`]] }),
    ],
    hints: [String.raw`The geometric distribution counts trials up to and including the first success: $g(x; p) = p\,q^{x-1}$, $x = 1, 2, \ldots$`, String.raw`$P(X \le x) = 1 - q^x$: the first success comes within $x$ trials unless all $x$ fail.`, String.raw`$\mu = 1/p$ and $\sigma^2 = \dfrac{1-p}{p^2}$.`],
    steps: ($) => [
      String.raw`$$P(X = ${$.x}) = p\,q^{x-1} = (${$.p})(${fx($.q, 2)})^{${$.x - 1}} = ${fx($.eq, 4)}$$`,
      String.raw`$$P(X \le ${$.x}) = 1 - q^{${$.x}} = 1 - (${fx($.q, 2)})^{${$.x}} = ${fx($.le, 4)}$$`,
      String.raw`$\mu = \dfrac{1}{p} = \dfrac{1}{${$.p}} = ${tn($.mu, 4)}$`,
      String.raw`$\sigma^2 = \dfrac{1 - p}{p^2} = \dfrac{${fx($.q, 2)}}{(${$.p})^2} = ${tn($.sd ** 2, 6)}, \qquad \sigma = ${tn($.sd, 4)}$`,
      `On the TI-84: geometpdf(${$.p}, ${$.x}) and geometcdf(${$.p}, ${$.x}).`,
    ],
    twin: { part: 'eq', draw: (r, $) => r.geometric($.p) === $.x },
    cases: [kase('Notes Ex 5.6–5.7', { ctx: 'defect', p: 0.01, x: 5 }, { eq: 0.0096, le: 0.049, mu: 100, sd: 99.5 })],
  }),

  // ----------------------------------------------------------------- Poisson
  problem({
    ...C5, id: 'c5.poisson-rate', title: 'Poisson: rate times interval', kind: 'numeric', topics: ['poisson'], src: 'Walpole §5.5',
    vars: {
      ctx: choice(['particles', 'particles'], ['calls', 'calls'], ['flaws', 'flaws'], ['deaths', 'deaths']),
      lam: range(0.5, 6, 0.5),
      t: choice([1, '1'], [2, '2'], [3, '3'], [0.5, '0.5']),
      x: range(0, 12, 1),
    },
    derive: ($) => {
      const mu = $.lam * $.t;
      return { mu, eq: poisPmf($.x, mu), atLeastOne: 1 - Math.exp(-mu) };
    },
    valid: ($) => $.eq > 0.005 && $.mu <= 18,
    text: (T, $) =>
      ({
        particles: `On average, ${$.lam} radioactive particles pass through a counter per millisecond. Consider an interval of ${$.t} millisecond${$.t === 1 ? '' : 's'}.`,
        calls: `A help desk receives calls at an average rate of ${$.lam} per minute. Consider a period of ${$.t} minute${$.t === 1 ? '' : 's'}.`,
        flaws: `Flaws in a fabric occur at an average rate of ${$.lam} per square meter. Consider a piece of ${$.t} square meter${$.t === 1 ? '' : 's'}.`,
        deaths: `Traffic fatalities occur at a rate of ${$.lam} deaths per 100 million miles, following a Poisson distribution. Consider ${tn($.t * 100)} million miles.`,
      })[$.ctx] + ` Let X be the number of ${{ particles: 'particles', calls: 'calls', flaws: 'flaws', deaths: 'deaths' }[$.ctx]} in it.`,
    parts: [
      num('mu', ($) => $.mu, { label: String.raw`$\mu = \lambda t$` }),
      prob('eq', ($) => $.eq, { label: ($T, $) => String.raw`$P(X = ${$.x})$` }),
      prob('one', ($) => $.atLeastOne, { label: String.raw`$P(X \ge 1)$`, traps: [[($) => $.eq, 'That is the other part’s answer.'], [($) => Math.exp(-$.mu), String.raw`That is $P(X = 0)$. At least one is its complement.`]] }),
    ],
    hints: [String.raw`Scale the rate to the interval: $\mu = \lambda t$.`, String.raw`$p(x; \mu) = \dfrac{e^{-\mu}\mu^x}{x!}$`, String.raw`$P(X \ge 1) = 1 - P(X = 0) = 1 - e^{-\mu}$`],
    steps: ($) => [
      String.raw`$\mu = \lambda t = ${$.lam} \times ${$.t} = ${tn($.mu, 6)}$`,
      String.raw`$$P(X = ${$.x}) = \dfrac{e^{-${tn($.mu, 6)}}\,(${tn($.mu, 6)})^{${$.x}}}{${$.x}!} = ${fx($.eq, 4)}$$`,
      String.raw`$$P(X \ge 1) = 1 - P(X = 0) = 1 - e^{-${tn($.mu, 6)}} = ${fx($.atLeastOne, 4)}$$`,
      `On the TI-84: poissonpdf(${tn($.mu, 6)}, ${$.x}); poissoncdf(μ, r) gives P(X ≤ r).`,
    ],
    twin: { part: 'eq', draw: (r, $) => r.poisson($.mu) === $.x },
    cases: [kase('Notes Ex 5.8(e)', { ctx: 'deaths', lam: 1.5, t: 2, x: 2 }, { mu: 3, eq: 0.224, one: 0.9502 }), kase('Walpole §5.5', { ctx: 'particles', lam: 4, t: 1, x: 6 }, { mu: 4, eq: 0.1042, one: 0.9817 })],
  }),

  problem({
    ...C5, id: 'c5.poisson-basics', title: 'Poisson: none, at least one, more than one', kind: 'numeric', topics: ['poisson', 'complement'], src: 'Notes Ex 5.8',
    vars: { ctx: choice(['deaths', 'deaths'], ['typos', 'typos'], ['arrivals', 'arrivals']), lam: range(0.5, 5, 0.25) },
    derive: ($) => ({ p0: Math.exp(-$.lam), one: 1 - Math.exp(-$.lam), gt1: 1 - poisCdf(1, $.lam), p1: poisPmf(1, $.lam), sd: Math.sqrt($.lam) }),
    text: (T, $) =>
      ({
        deaths: `Traffic fatalities occur at a rate of ${$.lam} deaths per 100 million miles, following a Poisson distribution. Let X be the number of deaths in 100 million miles.`,
        typos: `A typist makes an average of ${$.lam} errors per page, following a Poisson distribution. Let X be the number of errors on a page.`,
        arrivals: `Customers arrive at a small shop at an average rate of ${$.lam} per 10 minutes, following a Poisson distribution. Let X be the number who arrive in a 10-minute period.`,
      })[$.ctx] + ' Find P(X = 0), P(X ≥ 1), P(X > 1), and the standard deviation of X.',
    parts: [
      prob('p0', ($) => $.p0, { label: '$P(X = 0)$' }),
      prob('one', ($) => $.one, { label: String.raw`$P(X \ge 1)$` }),
      prob('gt1', ($) => $.gt1, { label: '$P(X > 1)$', traps: [[($) => $.one, String.raw`That is $P(X \ge 1)$. More than one leaves out $X = 1$ too: $1 - P(X \le 1)$.`]] }),
      num('sd', ($) => $.sd, { label: String.raw`$\sigma$`, traps: [[($) => $.lam, String.raw`That is the variance. For a Poisson, $\sigma^2 = \lambda$, so $\sigma = \sqrt{\lambda}$.`]] }),
    ],
    hints: [String.raw`$P(X = x) = \dfrac{e^{-\lambda}\lambda^x}{x!}$, so $P(X = 0) = e^{-\lambda}$.`, 'At least one is the complement of none. More than one is the complement of “at most one”.', String.raw`For a Poisson, $\mu = \sigma^2 = \lambda$.`],
    steps: ($) => [
      String.raw`$$P(X = 0) = \dfrac{e^{-${$.lam}}(${$.lam})^0}{0!} = ${fx($.p0, 4)}$$`,
      String.raw`$P(X \ge 1) = 1 - P(X = 0) = 1 - ${fx($.p0, 4)} = ${fx($.one, 4)}$`,
      String.raw`$P(X > 1) = 1 - P(X \le 1) = 1 - (${fx($.p0, 4)} + ${fx($.p1, 4)}) = ${fx($.gt1, 4)}$ (TI-84: 1 − poissoncdf(${$.lam}, 1))`,
      String.raw`$\mu = \sigma^2 = ${$.lam}$, so $\sigma = \sqrt{${$.lam}} = ${tn($.sd, 4)}$`,
    ],
    twin: { part: 'gt1', draw: (r, $) => r.poisson($.lam) > 1 },
    cases: [
      kase('Notes Ex 5.8(a)–(d)', { ctx: 'deaths', lam: 1.5 }, { p0: 0.2231, one: 0.7769, gt1: 0.442, sd: 1.225 }, {
        key: 'P(X ≥ 1) = 0.7669',
        note: 'The notes write 1 − 0.2231 = 0.7669; the subtraction gives 0.7769.',
      }),
    ],
  }),

  problem({
    ...C5, id: 'c5.poisson-table', title: 'Poisson with Table A.2', kind: 'numeric', level: 2, topics: ['poisson', 'poisson-table'], src: 'Walpole §5.5',
    vars: {
      ctx: choice(['tankers', 'tankers'], ['accidents', 'accidents'], ['emails', 'emails']),
      mu: choice(...POIS_MUS.filter((m) => m >= 1).map((m) => [m, String(m)])),
      qt: QTYPE,
      r: range(1, 25, 1),
      w: range(1, 5, 1),
    },
    derive: ($) => {
      const b = $.r + $.w;
      const c = cumulative($.qt, $.r, b);
      return { b, c, ans: evalCum(c, (k) => poisCdf(k, $.mu)), table: evalCum(c, (k) => poisTable(k, $.mu)) };
    },
    valid: ($) => $.ans > 0.002 && $.ans < 0.998 && $.r <= 3 * $.mu + 3,
    text: (T, $) =>
      ({
        tankers: `An average of ${$.mu} oil tankers arrive at a port each day. Use Table A.2 to find the probability that on a given day ${phrase($.qt, $.r, $.b, ['tankers arrive', 'tanker arrives'])}.`,
        accidents: `An intersection averages ${$.mu} accidents per month. Use Table A.2 to find the probability that next month ${phrase($.qt, $.r, $.b, ['accidents occur', 'accident occurs'])}.`,
        emails: `An inbox receives an average of ${$.mu} emails per hour. Use Table A.2 to find the probability that in the next hour ${phrase($.qt, $.r, $.b, ['emails arrive', 'email arrives'])}.`,
      })[$.ctx],
    parts: [prob('p', ($) => $.ans, { label: ($T, $) => `$${$.c.ask}$`, alt: ($) => [$.table], traps: [[($) => 1 - $.ans, 'That is the complement. Check which values of X the question includes.']] })],
    hints: ['Table A.2 gives cumulative sums, P(X ≤ r). Rewrite the question in that form.', String.raw`$P(X > r) = 1 - P(X \le r)$, and $P(X \ge r) = 1 - P(X \le r - 1)$.`],
    steps: ($) => {
      const out = [String.raw`$X$ is Poisson with $\mu = ${$.mu}$.`];
      out.push($.c.rewrite ? String.raw`$${$.c.ask} = ${$.c.rewrite}$` : String.raw`$${$.c.ask}$ is a cumulative sum already.`);
      for (const [, r] of $.c.terms) if (r >= 0) out.push(String.raw`Table A.2, $\mu = ${$.mu}$, $r = ${r}$: $\textstyle\sum_{x=0}^{${r}} p(x; ${$.mu}) = ${fx(poisTable(r, $.mu), 4)}$`);
      const vals = $.c.terms.map(([s, r]) => [s, r < 0 ? 0 : poisTable(r, $.mu)]);
      const expr = ($.c.one ? '1' : '') + vals.map(([s, v], i) => `${s < 0 ? ' - ' : i || $.c.one ? ' + ' : ''}${fx(v, 4)}`).join('');
      out.push(String.raw`$$${$.c.ask} = ${expr} = ${fx($.table, 4)}$$`);
      return out;
    },
    twin: {
      part: 'p',
      draw: (r, $) => {
        const x = r.poisson($.mu);
        return { le: x <= $.r, lt: x < $.r, ge: x >= $.r, gt: x > $.r, between: x >= $.r && x <= $.b }[$.qt];
      },
    },
    cases: [kase('Walpole §5.5', { ctx: 'tankers', mu: 10, qt: 'gt', r: 15, w: 1 }, { p: 0.0487 })],
  }),

  // ----------------------------------------------------------------- which one?
  problem({
    ...C5, id: 'c5.which-distribution', title: 'Which distribution?', kind: 'conceptual', topics: ['binomial', 'geometric', 'poisson'], src: 'Notes Ch 5',
    vars: {
      s: choice(
        ['b1', 'A quiz has 10 multiple-choice questions with 4 options each. A student guesses on every one. X = the number answered correctly.'],
        ['b2', 'Of the voters in a large city, 38% favor a candidate. 25 voters are selected at random. X = the number who favor the candidate.'],
        ['b3', 'A die is rolled 12 times. X = the number of sixes.'],
        ['g1', 'A die is rolled until the first six appears. X = the number of rolls.'],
        ['g2', 'Parts are tested one at a time until the first defective one is found; 2% are defective. X = the number of parts tested.'],
        ['g3', 'A free-throw shooter who makes 70% of her shots shoots until she misses. X = the shot on which she first misses.'],
        ['p1', 'A switchboard receives an average of 3 calls per minute. X = the number of calls in a given minute.'],
        ['p2', 'Typos occur at an average rate of 1.5 per page. X = the number of typos on a given page.'],
        ['p3', 'On average, 4 cars arrive at a toll booth each minute. X = the number of cars arriving in a 2-minute period.'],
      ),
    },
    derive: ($) => ({ kind: { b: 'binom', g: 'geom', p: 'pois' }[$.s[0]] }),
    text: (T) => T.s,
    parts: [
      mc('d', [
        ['binom', 'Binomial', 'Binomial needs a fixed number of trials, set before you start, and counts the successes among them.'],
        ['geom', 'Geometric', 'Geometric counts the trials up to the first success; the number of trials is not fixed in advance.'],
        ['pois', 'Poisson', 'Poisson counts events in an interval of time or space at a known average rate, with no fixed number of trials.'],
      ], ($) => $.kind, { label: 'Which distribution does X have?' }),
    ],
    hints: ['Is the number of trials fixed in advance? Then binomial.', 'Do you stop at the first success? Then geometric.', 'Is it a count of events over time or space at an average rate? Then Poisson.'],
    steps: ($) => [
      {
        binom: 'A fixed number of independent trials, each with the same probability of success, and X counts the successes: binomial.',
        geom: 'Independent trials with the same probability of success, repeated until the first success, and X is the trial on which it happens: geometric.',
        pois: 'X counts events in a fixed interval, and we know the average rate per interval: Poisson (with μ = rate × length of the interval).',
      }[$.kind],
    ],
    cases: [kase('Notes Ch 5', { s: 'p3' }, { d: 'pois' })],
  }),
];

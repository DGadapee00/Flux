/**
 * Unit 15 bank: cost. Original problems, with staged hints and named traps (../coaching/u15.js).
 * Numeric templates are checked by a second route (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));

/** The cost of unit n (USD k); `how` names the traps. */
export function unitCost($, how = 'right') {
  const T1 = Number($.T1);
  const S = Number($.S) / 100;
  const n = Number($.n);
  const b = Math.log2(S);
  if (how === 'perUnit') return T1 * S ** (n - 1);
  if (how === 'cumAvg') return T1 * (n ** (b + 1) - (n - 1) ** (b + 1));
  return T1 * n ** b;
}

/** Present value (USD k) of a yearly cost; `how` names the traps. */
export function presentValue($, how = 'right') {
  const A = Number($.A);
  const r = Number($.r) / 100;
  const N = Number($.N);
  if (how === 'noDiscount') return A * N;
  if (how === 'lastYear') return (A * N) / (1 + r) ** N;
  return (A * (1 - (1 + r) ** -N)) / r;
}

/** Inverse-variance combination (USD M); `how` names the traps. */
export function combined($, how = 'right') {
  const c1 = Number($.c1);
  const s1 = Number($.s1);
  const c2 = Number($.c2);
  const s2 = Number($.s2);
  if (how === 'mean') return (c1 + c2) / 2;
  if (how === 'invSigma') return (c1 / s1 + c2 / s2) / (1 / s1 + 1 / s2);
  return (c1 / s1 ** 2 + c2 / s2 ** 2) / (1 / s1 ** 2 + 1 / s2 ** 2);
}

const METHOD = {
  early: { text: 'At the mission concept review the team compares three architectures. Which estimating method suits?', answer: 'parametric' },
  late: { text: 'After the critical design review every part and task is defined. Which estimating method gives the most accurate estimate?', answer: 'bottomup' },
  similar: { text: 'The team has the actual cost of a near-identical craft it built two years ago. Which method fits first?', answer: 'analogy' },
};

const RESERVE = {
  add: { text: 'Each of six independent elements is given its own 70% reserve, and the six are added. Compared with the reserve the whole project needs at 70%, this is:', answer: 'more' },
  driver: { text: 'One element is at TRL 3; the rest are at TRL 7. Where does most of the project’s cost spread come from?', answer: 'immature' },
  median: { text: 'A project is funded at exactly the sum of its point estimates. Roughly how often will it overrun?', answer: 'half' },
};

export default [
  problem({
    id: 'u15.1.unit',
    title: 'The cost of a later unit',
    exam: 'u15',
    ch: '15',
    lab: 'learning',
    src: 'Flux, written for the Learning curve lab',
    topics: ['learning'],
    principles: ['learning'],
    vars: {
      T1: choice(['800', 'USD 800k'], ['1000', 'USD 1M'], ['1500', 'USD 1.5M']),
      S: choice(['85', '85%'], ['90', '90%'], ['95', '95%']),
      n: choice(['4', '4th'], ['8', '8th'], ['16', '16th'], ['32', '32nd']),
    },
    variety: ['first unit', 'slope', 'which unit'],
    text: (T) => `The first unit of a satellite costs ${T.T1} to build. On a ${T.S} learning curve (unit form), what does the ${T.n} unit cost, in thousands of dollars?`,
    parts: [num('c', ($) => unitCost($), 'USD k', { label: 'T_n' })],
    level: 2,
    hints: ['Each doubling of the quantity multiplies the unit cost by the slope.', 'T_n = T₁ n^b with b = log₂ S.'],
    steps: ($) => [String.raw`$b = \log_2 ${Number($.S) / 100} = ${fmt(Math.log2(Number($.S) / 100))}$`, String.raw`$T_{${$.n}} = ${$.T1} \times ${$.n}^{${fmt(Math.log2(Number($.S) / 100))}} = ${fmt(unitCost($))}$`],
    second: ($) => {
      // Double from the first unit, multiplying by the slope each time.
      let c = Number($.T1);
      for (let n = 1; n < Number($.n); n *= 2) c *= Number($.S) / 100;
      return { c };
    },
    cases: [kase('USD 1M, 90%, the 8th', { T1: '1000', S: '90', n: '8' }, { c: 729 })],
  }),

  problem({
    id: 'u15.2.pv',
    title: 'Operations in today’s money',
    exam: 'u15',
    ch: '15',
    src: 'Flux, after MIT 16.851 Lecture 15',
    topics: ['lifecycle'],
    principles: ['lifecycle'],
    vars: {
      A: choice(['300', 'USD 300k'], ['400', 'USD 400k'], ['600', 'USD 600k']),
      N: choice(['3', '3 years'], ['5', '5 years'], ['8', '8 years']),
      r: choice(['3', '3%'], ['5', '5%'], ['8', '8%']),
    },
    variety: ['yearly cost', 'years', 'rate'],
    text: (T) => `Operating a satellite costs ${T.A} at the end of each year for ${T.N}. At a discount rate of ${T.r}, what is that worth today, in thousands of dollars?`,
    parts: [num('p', ($) => presentValue($), 'USD k', { label: 'P' })],
    level: 2,
    hints: ['A payment F in year t is worth F(1 + r)^{−t} today.', 'Add the yearly payments, each discounted by its own year.'],
    steps: ($) => [String.raw`$P = \sum_{t=1}^{${$.N}} \frac{${$.A}}{(1 + ${Number($.r) / 100})^t} = ${fmt(presentValue($))}$`],
    second: ($) => {
      let p = 0;
      for (let t = 1; t <= Number($.N); t++) p += Number($.A) / (1 + Number($.r) / 100) ** t;
      return { p };
    },
    cases: [kase('USD 400k for 5 years at 5%', { A: '400', N: '5', r: '5' }, { p: 1731.8 })],
  }),

  problem({
    id: 'u15.3.combine',
    title: 'Combining two estimates',
    exam: 'u15',
    ch: '15',
    src: 'Flux, after MIT 16.851 Lecture 15',
    topics: ['estimate'],
    principles: ['estimate'],
    vars: {
      c1: choice(['2.0', 'USD 2.0M'], ['1.8', 'USD 1.8M']),
      s1: choice(['0.6', 'USD 0.6M'], ['0.8', 'USD 0.8M']),
      c2: choice(['2.6', 'USD 2.6M'], ['2.9', 'USD 2.9M']),
      s2: choice(['0.3', 'USD 0.3M'], ['0.4', 'USD 0.4M']),
    },
    variety: ['estimates', 'errors'],
    text: (T) => `Two independent cost relationships estimate a bus at ${T.c1} with a standard error of ${T.s1}, and at ${T.c2} with ${T.s2}. Weighting each by the inverse of its variance, what is the combined estimate, in millions of dollars?`,
    parts: [num('c', ($) => combined($), 'USD M', { label: 'ĉ' })],
    level: 2,
    hints: ['The weight of each estimate is 1/σ².', 'ĉ = (c₁/σ₁² + c₂/σ₂²)/(1/σ₁² + 1/σ₂²).'],
    steps: ($) => [String.raw`$\hat c = \frac{${$.c1}/${$.s1}^2 + ${$.c2}/${$.s2}^2}{1/${$.s1}^2 + 1/${$.s2}^2} = ${fmt(combined($))}$`],
    second: ($) => {
      // The weight w on the first estimate that makes the combination's variance least, by bisection
      // on the variance's slope, w² s₁² + (1 − w)² s₂².
      const s1 = Number($.s1) ** 2;
      const s2 = Number($.s2) ** 2;
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 80; i++) {
        const w = (lo + hi) / 2;
        if (2 * w * s1 - 2 * (1 - w) * s2 < 0) lo = w;
        else hi = w;
      }
      const w = (lo + hi) / 2;
      return { c: w * Number($.c1) + (1 - w) * Number($.c2) };
    },
    cases: [kase('2.0 ± 0.6 and 2.6 ± 0.4', { c1: '2.0', s1: '0.6', c2: '2.6', s2: '0.4' }, { c: 2.415 })],
  }),

  problem({
    id: 'u15.4.method',
    title: 'Which estimating method?',
    exam: 'u15',
    ch: '15',
    kind: 'conceptual',
    src: 'Flux, after MIT 16.851 Lecture 15',
    topics: ['estimate'],
    principles: ['estimate'],
    vars: { q: choice(['early', 'early'], ['late', 'late'], ['similar', 'similar']) },
    variety: ['which phase'],
    text: (T, $) => METHOD[$.q].text,
    parts: [
      pick('a', 'method', [
        ['parametric', 'Parametric: cost estimating relationships', 'Quick to vary with mass, power or aperture: the tool for early trades.'],
        ['bottomup', 'Bottom-up: price every task and part', 'Most accurate, and only possible once the design is mature.'],
        ['analogy', 'Analogy: scale a similar system’s actual cost', 'A close match with known cost is the best start.'],
        ['guess', 'The team’s judgement alone', 'An estimate needs a basis a reviewer can check.'],
      ], ($) => METHOD[$.q].answer),
    ],
    level: 1,
    hints: ['How much of the design is defined?', 'Is there a close past system with a known cost?'],
    steps: ($) => [{ parametric: 'Parametric.', bottomup: 'Bottom-up.', analogy: 'Analogy.' }[METHOD[$.q].answer]],
    second: ($) => ({ a: { early: 'parametric', late: 'bottomup', similar: 'analogy' }[$.q] }),
    cases: [kase('concept trades', { q: 'early' }, { a: 'parametric' })],
  }),

  problem({
    id: 'u15.5.reserve',
    title: 'Reserves and confidence',
    exam: 'u15',
    ch: '15',
    kind: 'conceptual',
    lab: 'reserve',
    src: 'Flux, written for the Cost confidence lab',
    topics: ['confidence'],
    principles: ['confidence'],
    vars: { q: choice(['add', 'add'], ['driver', 'driver'], ['median', 'median']) },
    variety: ['which question'],
    text: (T, $) => RESERVE[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['more', 'More than the project needs', 'Independent overruns rarely all happen together: variances add, not spreads.'],
        ['immature', 'The TRL 3 element', 'Its spread is three times the mature elements’, and spreads add as squares.'],
        ['half', 'About half the time', 'Costs are skewed high, so the sum of estimates sits near the median.'],
        ['never', 'Never, if every estimate is careful', 'Every estimate is uncertain; the budget sets the confidence.'],
      ], ($) => RESERVE[$.q].answer),
    ],
    level: 2,
    hints: ['How do independent uncertainties combine?', 'Where is the median of a skewed distribution?'],
    steps: ($) => [{ more: 'More.', immature: 'The immature element.', half: 'About half the time.' }[RESERVE[$.q].answer]],
    second: ($) => ({ a: { add: 'more', driver: 'immature', median: 'half' }[$.q] }),
    cases: [kase('added reserves', { q: 'add' }, { a: 'more' })],
  }),
];

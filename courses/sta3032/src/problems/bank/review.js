/**
 * Review-sheet problems: one template for each multi-part question of the class's midterm review
 * sheet (Review 1), asked the same way: one setup, three to eleven parts, in the sheet's wording.
 * The first worked case of each is the sheet's own question; later attempts use new numbers and
 * settings. Each template sits in the chapter its last part needs. The sheet's Q3 is
 * c4.linear-combination (bank/ch4.js), which already asks it the same way; the review set
 * (src/problems/sets.js) lists all eight in the sheet's order.
 */
import { problem, kase, range, choice, data, num, prob, tn, fx, pn, roundTo, zLook, binomTable, poisTable } from '../kit.js';
import { binomPmf, binomCdf, poisPmf, poisCdf, normCdf, normInv } from '../../stats/dist.js';
import { zTable, zForArea } from '../../stats/tables.js';
import { mean, sd, boxPlot } from '../../stats/describe.js';
import { quartileTraps } from './ch1.js';

const SRC = (q) => `Review 1, Q${q}`;

/** A standard normal from a uniform generator (Box–Muller). */
function gauss(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** k + 1 probabilities in steps of 0.05, each at least 0.05, summing to 1. */
function pmfOf(rand, k) {
  for (;;) {
    const cuts = Array.from({ length: k }, () => 1 + Math.floor(rand() * 19)).sort((a, b) => a - b);
    const parts = [cuts[0], ...cuts.slice(1).map((c, i) => c - cuts[i]), 20 - cuts[k - 1]];
    if (parts.every((p) => p >= 1)) return parts.map((p) => p / 20);
  }
}

const pct = (p) => `${Number((p * 100).toFixed(2))}%`;
/** The verb phrase for a count k: "1 is on time" but "2 are on time". noun: [plural, singular]. */
const said = (k, noun) => noun[k === 1 ? 1 : 0];
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

/** "at least 13", "no more than 3": a count event in words, and which values it holds. */
const WORD = { le: 'no more than', lt: 'fewer than', ge: 'at least', gt: 'more than' };
const TEX = { le: String.raw`\le`, lt: '<', ge: String.raw`\ge`, gt: '>' };
const holds = (qt, x, r) => ({ le: x <= r, lt: x < r, ge: x >= r, gt: x > r })[qt];
/** The same event with its boundary value moved in or out: the off-by-one mistake. */
const SHIFTED = { le: 'lt', lt: 'le', ge: 'gt', gt: 'ge' };
const QT = choice(['le', 'no more than'], ['lt', 'fewer than'], ['ge', 'at least'], ['gt', 'more than']);

/** A cumulative rewrite of P(X qt r) in terms of P(X ≤ ·), as the calculator and the tables need. */
function cumRewrite(qt, r) {
  return {
    le: { tex: String.raw`P(X \le ${r})`, terms: [[1, r]], one: false },
    lt: { tex: String.raw`P(X \le ${r - 1})`, terms: [[1, r - 1]], one: false },
    ge: { tex: String.raw`1 - P(X \le ${r - 1})`, terms: [[-1, r - 1]], one: true },
    gt: { tex: String.raw`1 - P(X \le ${r})`, terms: [[-1, r]], one: true },
  }[qt];
}
const evalCum = (c, cdf) => (c.one ? 1 : 0) + c.terms.reduce((a, [s, r]) => a + s * (r < 0 ? 0 : cdf(r)), 0);
/** The same sum read from a printed table, or [] when the table does not print every term. */
function tableCum(c, look) {
  const vals = c.terms.map(([, r]) => (r < 0 ? 0 : look(r)));
  if (vals.some((v) => v == null || !Number.isFinite(v))) return [];
  return [(c.one ? 1 : 0) + c.terms.reduce((a, [sg], i) => a + sg * vals[i], 0)];
}

// ---------------------------------------------------------------------------------- settings

/** Q1: counts per day, roughly normal, with the sheet's wording. */
const SUMMARY = {
  cars: { text: (n) => `Below is a random sample of the number of cars rented at a rental car facility on ${n} days:`, mu: 55, sd: 18, lo: 3 },
  calls: { text: (n) => `Below is a random sample of the number of calls to a technical-support line on ${n} days:`, mu: 70, sd: 20, lo: 5 },
  orders: { text: (n) => `Below is a random sample of the number of orders a small warehouse shipped on ${n} days:`, mu: 120, sd: 30, lo: 10 },
  patients: { text: (n) => `Below is a random sample of the number of patients seen at a walk-in clinic on ${n} days:`, mu: 40, sd: 10, lo: 2 },
};

const plural = (j, one, many) => `${j} ${j === 1 ? one : many}`;

/** Q2: a count with a short distribution, an event in words, and a cost per unit. */
const PMF_CTX = {
  license: {
    x0: 1,
    fee: 25,
    costLabel: 'Expected cost per driver',
    text: ($) =>
      `Individuals applying for a driver’s license are given up to ${$.k + 1} attempts to pass the test. The probability distribution below shows the number of attempts, X, required by individuals who passed. (a) Find P(X = ${$.xm}). (b) What is the probability that a randomly selected individual who obtained a license required ${WORD[$.qt]} ${plural($.j, 'attempt', 'attempts')}? (c) What is the expected number of attempts to pass the test? (d) If each attempt costs ${$.c} dollars${$.fee ? `, plus a one-time license fee of ${$.d} dollars` : ''}, what is the expected cost per driver to obtain a license?`,
  },
  printer: {
    x0: 0,
    fee: 40,
    costLabel: 'Expected monthly cost',
    text: ($) =>
      `X is the number of service calls an office printer needs in a month, with the probability distribution below. (a) Find P(X = ${$.xm}). (b) What is the probability that in a given month the printer needs ${WORD[$.qt]} ${plural($.j, 'service call', 'service calls')}? (c) What is the expected number of service calls in a month? (d) Each service call costs ${$.c} dollars${$.fee ? `, on top of a ${$.d}-dollar monthly maintenance fee` : ''}. What is the expected monthly cost?`,
  },
  chips: {
    x0: 0,
    fee: 15,
    costLabel: 'Expected cost per box',
    text: ($) =>
      `X is the number of defective chips in a box of components, with the probability distribution below. (a) Find P(X = ${$.xm}). (b) What is the probability that a randomly selected box has ${WORD[$.qt]} ${plural($.j, 'defective chip', 'defective chips')}? (c) What is the expected number of defective chips in a box? (d) Each defective chip costs ${$.c} dollars to replace${$.fee ? `, and inspecting a box costs ${$.d} dollars` : ''}. What is the expected cost per box?`,
  },
};

/** Q4: binomial settings, each with the success probabilities that make sense for it. */
const BIN3 = {
  ontime: { p: [0.5, 0.95], noun: ['are on time', 'is on time'], text: (n, p) => `According to an airline company, ${pct(p)} of its flights from Jacksonville to Atlanta are on time. Consider a random sample of ${n} flights.` },
  throws: { p: [0.4, 0.95], noun: ['are made', 'is made'], text: (n, p) => `A basketball player makes ${pct(p)} of her free throws. She shoots ${n} free throws, independently.` },
  pass: { p: [0.4, 0.9], noun: ['pass', 'passes'], text: (n, p) => `${pct(p)} of the people who take a certification exam pass it. Consider ${n} randomly chosen test takers.` },
  survey: { p: [0.1, 0.9], noun: ['support it', 'supports it'], text: (n, p) => `In a large city, ${pct(p)} of adults support a new transit tax. ${n} adults are chosen at random.` },
  defect: { p: [0.02, 0.3], noun: ['are defective', 'is defective'], text: (n, p) => `In a production run, ${pct(p)} of the items are defective. A random sample of ${n} items is inspected.` },
};

/** Q5: a Poisson rate, the base period, and a longer one. */
const POIS_CTX = {
  service: {
    setup: (lam) => `The number of customers arriving per hour at an automobile service facility is assumed to follow a Poisson distribution with mean λ = ${lam}.`,
    noun: ['customers arrive', 'customer arrives'],
    one: 'in an hour',
    period: (t) => `in a ${t}-hour period`,
  },
  calls: {
    setup: (lam) => `Calls reach a help desk at an average rate of ${lam} per 10 minutes, following a Poisson distribution.`,
    noun: ['calls arrive', 'call arrives'],
    one: 'in a 10-minute period',
    period: (t) => `in a ${10 * t}-minute period`,
  },
  flaws: {
    setup: (lam) => `Flaws in a roll of fabric occur at an average rate of ${lam} per square meter, following a Poisson distribution.`,
    noun: ['flaws occur', 'flaw occurs'],
    one: 'in one square meter',
    period: (t) => `in a piece of ${t} square meters`,
  },
};

/** Q6: three density shapes. g is the shape, G its antiderivative, H the antiderivative of y·g. */
const DENSITY = {
  pow: ($) => ({
    tex: `k${'y'}^{${$.m}}`.replace('^{1}', ''),
    g: (y) => y ** $.m,
    G: (y) => y ** ($.m + 1) / ($.m + 1),
    H: (y) => y ** ($.m + 2) / ($.m + 2),
    Gtex: String.raw`\dfrac{y^{${$.m + 1}}}{${$.m + 1}}`,
    Htex: String.raw`\dfrac{y^{${$.m + 2}}}{${$.m + 2}}`,
    kTex: String.raw`\dfrac{${$.m + 1}}{${$.b ** ($.m + 1)}}`,
  }),
  lin: ($) => ({
    tex: `k(y + ${$.c})`,
    g: (y) => y + $.c,
    G: (y) => (y * y) / 2 + $.c * y,
    H: (y) => (y * y * y) / 3 + ($.c * y * y) / 2,
    Gtex: String.raw`\dfrac{y^2}{2} + ${$.c}y`,
    Htex: String.raw`\dfrac{y^3}{3} + \dfrac{${$.c}y^2}{2}`,
    kTex: String.raw`\dfrac{2}{${$.b * $.b + 2 * $.c * $.b}}`,
  }),
  hump: ($) => ({
    tex: `ky(${$.b} - y)`,
    g: (y) => y * ($.b - y),
    G: (y) => ($.b * y * y) / 2 - (y * y * y) / 3,
    H: (y) => ($.b * y ** 3) / 3 - y ** 4 / 4,
    Gtex: String.raw`\dfrac{${$.b}y^2}{2} - \dfrac{y^3}{3}`,
    Htex: String.raw`\dfrac{${$.b}y^3}{3} - \dfrac{y^4}{4}`,
    kTex: String.raw`\dfrac{6}{${$.b ** 3}}`,
  }),
};

/** Q7: an arrival uniform over a window that starts on the hour. */
const WAIT = {
  friend: {
    hour: 17,
    it: 'your friend',
    meanLabel: 'Expected wait',
    setup: (a, b) => `You have an appointment with a friend at ${a}, but your friend is always late. Suppose their arrival time is uniformly distributed between ${a} and ${b}.`,
    waited: (w) => `You have already waited ${w} minutes and your friend has not shown up.`,
    mean: (a) => `You arrived on time at ${a}. What is your expected wait time, in minutes?`,
  },
  bus: {
    hour: 7,
    it: 'the bus',
    meanLabel: 'Expected wait',
    setup: (a, b) => `A shuttle bus reaches a stop at a time uniformly distributed between ${a} and ${b}.`,
    waited: (w) => `You got to the stop at the start of that window and have waited ${w} minutes with no bus.`,
    mean: (a) => `If you get to the stop at ${a}, what is your expected wait, in minutes?`,
  },
  package: {
    hour: 13,
    it: 'the package',
    meanLabel: 'Expected delivery time, after the window opens',
    setup: (a, b) => `A courier promises a delivery between ${a} and ${b}; the delivery time is uniformly distributed over that window.`,
    waited: (w, at) => `It is now ${at} and the package has not arrived.`,
    mean: (a) => `What is the expected delivery time, in minutes after ${a}?`,
  },
};

/** "5:10 PM": a clock time `minutes` after `hour` o'clock (24-hour). */
function clock(hour, minutes) {
  const t = hour * 60 + minutes;
  const h = Math.floor(t / 60) % 24;
  const m = t % 60;
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

const cap = (s) => s[0].toUpperCase() + s.slice(1);

/** Q8: manufactured items with a normal measurement, and what a small or large one is called. */
const SPEC = {
  tile: { intro: 'A manufacturer makes mosaic tiles for bathrooms and showers.', measure: 'diagonal dimension', item: 'tile', items: 'tiles', unit: 'inches', mu: 1.5, sigma: 0.03, dp: 2, small: 'undersized', large: 'oversized', smallNP: 'undersized tiles', largeNP: 'oversized tiles' },
  bolt: { intro: 'A plant makes bolts for an assembly line.', measure: 'length', item: 'bolt', items: 'bolts', unit: 'mm', mu: 50, sigma: 0.4, dp: 1, small: 'too short', large: 'too long', smallNP: 'bolts that are too short', largeNP: 'bolts that are too long' },
  bottle: { intro: 'A bottling line fills water bottles.', measure: 'fill volume', item: 'bottle', items: 'bottles', unit: 'mL', mu: 500, sigma: 3.5, dp: 0, small: 'underfilled', large: 'overfilled', smallNP: 'underfilled bottles', largeNP: 'overfilled bottles' },
  rod: { intro: 'A mill cuts steel rods.', measure: 'diameter', item: 'rod', items: 'rods', unit: 'mm', mu: 12, sigma: 0.05, dp: 2, small: 'undersized', large: 'oversized', smallNP: 'undersized rods', largeNP: 'oversized rods' },
  cereal: { intro: 'A packing line fills boxes of cereal.', measure: 'weight', item: 'box', items: 'boxes', unit: 'ounces', mu: 16, sigma: 0.2, dp: 1, small: 'underweight', large: 'overweight', smallNP: 'underweight boxes', largeNP: 'overweight boxes' },
};

export default [
  // ------------------------------------------------------------------------------- Q1
  problem({
    ch: '1', id: 'c1.summarize', title: 'Summarize a data set, start to finish', kind: 'numeric', level: 2, topics: ['mean', 'standard-deviation', 'quartiles', 'iqr', 'outliers', 'box-plot'], src: SRC(1),
    vars: {
      ctx: choice(['cars', 'cars rented'], ['calls', 'support calls'], ['orders', 'orders shipped'], ['patients', 'patients seen']),
      n: range(15, 22, 1),
      far: choice([1, 'a high outlier'], [-1, 'a low outlier'], [0, 'no outlier']),
      xs: data((r, v) => {
        const c = SUMMARY[v.ctx];
        const xs = Array.from({ length: v.n }, () => Math.max(c.lo, Math.round(c.mu + c.sd * gauss(r))));
        if (v.far) {
          const b = boxPlot(xs);
          const out = v.far > 0 ? Math.ceil(b.upperFence + (0.2 + 0.8 * r()) * b.iqr) : Math.floor(b.lowerFence - (0.2 + 0.8 * r()) * b.iqr);
          if (out >= 0) xs[Math.floor(r() * v.n)] = out;
        }
        return xs;
      }),
    },
    derive: ($) => {
      const b = boxPlot($.xs);
      const xbar = mean($.xs);
      const ss = $.xs.reduce((a, x) => a + (x - xbar) ** 2, 0);
      return { b, xbar, ss, s: sd($.xs), total: sum($.xs) };
    },
    // No value sits on a fence (whether it counts as an outlier would be a matter of convention).
    valid: ($) => $.b.iqr > 0 && $.xs.every((x) => Math.abs(x - $.b.lowerFence) > 0.3 && Math.abs(x - $.b.upperFence) > 0.3),
    text: (T, $) =>
      `${SUMMARY[$.ctx].text($.n)} ${$.xs.join(', ')}. (a) Find the sample mean. (b) Find the sample standard deviation. (c) Find $Q_1$, $Q_3$ and the interquartile range (IQR). (d) Find the lower fence and the upper fence for outliers, and identify any outliers. (e) Draw a box plot: give the median and where each whisker ends.`,
    parts: [
      num('xbar', ($) => $.xbar, { label: String.raw`(a) Sample mean $\bar{x}$`, tol: 0.002 }),
      num('s', ($) => $.s, { label: '(b) Sample standard deviation $s$', tol: 0.003, traps: [[($) => Math.sqrt($.ss / $.n), String.raw`That divides by $n$ (the TI's σx, the population formula). A sample's $s$ divides by $n - 1$: the TI's Sx.`]] }),
      num('q1', ($) => $.b.q1, { label: '(c) $Q_1$', tol: 0, abs: 1e-9, traps: quartileTraps(0.25) }),
      num('q3', ($) => $.b.q3, { label: '(c) $Q_3$', tol: 0, abs: 1e-9, traps: quartileTraps(0.75) }),
      num('iqr', ($) => $.b.iqr, { label: '(c) IQR', tol: 0, abs: 1e-9 }),
      num('lf', ($) => $.b.lowerFence, { label: '(d) Lower fence', tol: 0, abs: 1e-9, traps: [[($) => $.b.q1 - $.b.iqr, String.raw`The fence is $1.5 \times \text{IQR}$ below $Q_1$, not one IQR.`]] }),
      num('uf', ($) => $.b.upperFence, { label: '(d) Upper fence', tol: 0, abs: 1e-9, traps: [[($) => $.b.q3 + $.b.iqr, String.raw`The fence is $1.5 \times \text{IQR}$ above $Q_3$, not one IQR.`]] }),
      num('k', ($) => $.b.outliers.length, { label: '(d) How many outliers are there?', tol: 0, abs: 0 }),
      num('med', ($) => $.b.median, { label: '(e) Box plot: the median (the line inside the box)', tol: 0, abs: 1e-9, traps: [[($) => $.xbar, 'That is the mean. A box plot marks the median.']] }),
      num('wlo', ($) => $.b.whiskerLow, {
        label: '(e) Box plot: the left whisker ends at',
        tol: 0,
        abs: 1e-9,
        traps: [
          [($) => $.b.lowerFence, 'That is the fence. A whisker ends at a data value: the smallest one inside the fences.'],
          [($) => ($.b.outliers.includes($.b.min) ? $.b.min : NaN), 'That value is an outlier: it gets its own mark (*), and the whisker stops at the smallest value inside the fences.'],
        ],
      }),
      num('whi', ($) => $.b.whiskerHigh, {
        label: '(e) Box plot: the right whisker ends at',
        tol: 0,
        abs: 1e-9,
        traps: [
          [($) => $.b.upperFence, 'That is the fence. A whisker ends at a data value: the largest one inside the fences.'],
          [($) => ($.b.outliers.includes($.b.max) ? $.b.max : NaN), 'That value is an outlier: it gets its own mark (*), and the whisker stops at the largest value inside the fences.'],
        ],
      }),
    ],
    hints: [
      'Sort the data first: the median, quartiles and box plot all come from the sorted list.',
      'TI-84: STAT ▸ CALC ▸ 1-Var Stats gives x̄, Sx (the sample s), Q1, Med and Q3 (the TI-84 rule, the one the notes use).',
      String.raw`Fences: $Q_1 - 1.5 \times \text{IQR}$ and $Q_3 + 1.5 \times \text{IQR}$. A value outside them is an outlier.`,
      'Box plot: the box runs from Q1 to Q3 with a line at the median; each whisker runs to the most extreme value still inside the fences; outliers get their own mark.',
    ],
    steps: ($) => {
      const b = $.b;
      const n = $.n;
      return [
        String.raw`Sorted: $${b.sorted.join(String.raw`,\ `)}$`,
        String.raw`(a) $\bar{x} = \dfrac{\sum x_i}{n} = \dfrac{${$.total}}{${n}} = ${tn($.xbar, 6)}$`,
        String.raw`(b) $\sum (x_i - \bar{x})^2 = ${tn($.ss, 7)}$, so $s = \sqrt{\dfrac{${tn($.ss, 7)}}{${n - 1}}} = ${tn($.s, 5)}$ (TI-84: Sx)`,
        n % 2
          ? String.raw`Median: $n = ${n}$ is odd, so it is the value in position ${(n + 1) / 2}: $\tilde{x} = ${b.median}$. It belongs to neither half.`
          : String.raw`Median: $n = ${n}$ is even, so it is the mean of positions ${n / 2} and ${n / 2 + 1}: $\tilde{x} = ${tn(b.median, 6)}$.`,
        String.raw`(c) Lower half: $${b.lower.join(String.raw`,\ `)}$, so $Q_1 = ${tn(b.q1, 6)}$. Upper half: $${b.upper.join(String.raw`,\ `)}$, so $Q_3 = ${tn(b.q3, 6)}$. $\text{IQR} = ${tn(b.q3, 6)} - ${tn(b.q1, 6)} = ${tn(b.iqr, 6)}$`,
        String.raw`(d) Lower fence $= ${tn(b.q1, 6)} - 1.5(${tn(b.iqr, 6)}) = ${tn(b.lowerFence, 6)}$; upper fence $= ${tn(b.q3, 6)} + 1.5(${tn(b.iqr, 6)}) = ${tn(b.upperFence, 6)}$`,
        b.outliers.length ? `Outlier${b.outliers.length > 1 ? 's' : ''}: ${b.outliers.join(', ')} (outside the fences).` : 'Every value lies inside the fences: no outliers.',
        `(e) Box plot: a box from ${tn(b.q1, 6)} to ${tn(b.q3, 6)} with a line at the median, ${tn(b.median, 6)}; the left whisker runs to ${b.whiskerLow} and the right whisker to ${b.whiskerHigh}${b.outliers.length ? `; ${b.outliers.join(' and ')} marked separately with *` : ''}.`,
      ];
    },
    cases: [
      kase(SRC(1), { ctx: 'cars', n: 20, far: 1, xs: [62, 98, 87, 21, 41, 85, 59, 34, 42, 20, 56, 57, 17, 49, 55, 39, 59, 68, 56, 39] }, { xbar: 52.2, s: 21.83, q1: 39, q3: 60.5, iqr: 21.5, lf: 6.75, uf: 92.75, k: 1, med: 55.5, wlo: 17, whi: 87 }),
    ],
  }),

  // ------------------------------------------------------------------------------- Q2
  problem({
    ch: '4', id: 'c4.pmf-missing', title: 'A distribution with a missing value: probability, mean, cost', kind: 'numeric', level: 2, topics: ['pmf', 'expectation', 'linear-combination'], src: SRC(2),
    vars: {
      ctx: choice(['license', 'driving test attempts'], ['printer', 'printer service calls'], ['chips', 'defective chips']),
      k: range(3, 4, 1),
      m: range(0, 4, 1),
      qt: QT,
      j: range(1, 4, 1),
      c: range(10, 60, 5),
      fee: choice([0, 'no fee'], [1, 'a fixed fee']),
      ps: data((r, v) => pmfOf(r, v.k)),
    },
    derive: ($) => {
      const C = PMF_CTX[$.ctx];
      const xs = $.ps.map((_, i) => C.x0 + i);
      const ev = xs.reduce((a, x, i) => a + (holds($.qt, x, $.j) ? $.ps[i] : 0), 0);
      const off = xs.reduce((a, x, i) => a + (holds(SHIFTED[$.qt], x, $.j) ? $.ps[i] : 0), 0);
      const mu = xs.reduce((a, x, i) => a + x * $.ps[i], 0);
      const d = $.fee ? C.fee : 0;
      return { C, xs, xm: xs[$.m], missing: $.ps[$.m], ev, off, mu, d, cost: $.c * mu + d };
    },
    valid: ($) => $.m <= $.k && $.ev > 0.04 && $.ev < 0.96 && $.j >= $.xs[0] && $.j <= $.xs[$.k] && Math.abs($.off - $.ev) > 0.01,
    text: (T, $) => $.C.text($),
    figure: ($) =>
      `<table class="results" style="max-width:420px;table-layout:fixed"><tbody><tr><th>x</th>${$.xs.map((x) => `<td>${x}</td>`).join('')}</tr><tr><th>P(x)</th>${$.ps.map((p, i) => `<td>${i === $.m ? '?' : fx(p, 2)}</td>`).join('')}</tr></tbody></table>`,
    parts: [
      prob('missing', ($) => $.missing, { label: ($T, $) => `(a) $P(X = ${$.xm})$` }),
      prob('ev', ($) => $.ev, {
        label: ($T, $) => `(b) $P(X ${TEX[$.qt]} ${$.j})$`,
        traps: [
          [($) => $.off, 'Off by one value: check whether the boundary value itself is included. “More than 1” leaves 1 out; “at least 1” keeps it.'],
          [($) => 1 - $.ev, 'That is the complement. Check which values of X the question includes.'],
        ],
      }),
      num('mu', ($) => $.mu, { label: '(c) $E(X)$', traps: [[($) => sum($.xs) / $.xs.length, String.raw`That is the plain average of the x values. Each value has to be weighted by its probability: $\sum x\,P(x)$.`]] }),
      num('cost', ($) => $.cost, {
        label: ($T, $) => `(d) ${$.C.costLabel}`,
        unit: 'dollars',
        traps: [
          [($) => ($.d ? $.c * $.mu : NaN), 'The fixed fee is part of the cost too: E(aX + b) = aE(X) + b.'],
          [($) => $.mu, 'That is E(X), the expected count. The question asks for the expected cost.'],
        ],
      }),
    ],
    hints: [
      String.raw`The probabilities add to 1, so the missing one is $1 - $ (the others).`,
      'Write out which values of X the event includes before adding: “more than 1” is 2, 3, 4, …',
      String.raw`$E(X) = \sum x\,P(x)$.`,
      String.raw`The cost is a linear function of X: $E(aX + b) = aE(X) + b$.`,
    ],
    steps: ($) => {
      const others = $.ps.filter((_, i) => i !== $.m);
      const inEv = $.xs.filter((x) => holds($.qt, x, $.j));
      return [
        String.raw`(a) $P(X = ${$.xm}) = 1 - (${others.map((p) => fx(p, 2)).join(' + ')}) = 1 - ${fx(sum(others), 2)} = ${fx($.missing, 2)}$`,
        String.raw`(b) $X ${TEX[$.qt]} ${$.j}$ means $X = ${inEv.join(', ')}$: $P = ${inEv.map((x) => fx($.ps[$.xs.indexOf(x)], 2)).join(' + ')} = ${fx($.ev, 2)}$`,
        String.raw`(c) $E(X) = ${$.xs.map((x, i) => `${x}(${fx($.ps[i], 2)})`).join(' + ')} = ${tn($.mu, 6)}$`,
        $.d
          ? String.raw`(d) The cost is $${$.c}X + ${$.d}$ dollars, so $E(${$.c}X + ${$.d}) = ${$.c}E(X) + ${$.d} = ${$.c}(${tn($.mu, 6)}) + ${$.d} = ${tn($.cost, 6)}$ dollars.`
          : String.raw`(d) The cost is $${$.c}X$ dollars, so $E(${$.c}X) = ${$.c}E(X) = ${$.c}(${tn($.mu, 6)}) = ${tn($.cost, 6)}$ dollars.`,
        'On the TI-84: x values in L1, probabilities in L2, 1-Var Stats with FreqList L2 gives E(X) as x̄.',
      ];
    },
    cases: [kase(SRC(2), { ctx: 'license', k: 3, m: 1, qt: 'gt', j: 1, c: 30, fee: 0, ps: [0.25, 0.3, 0.15, 0.3] }, { missing: 0.3, ev: 0.75, mu: 2.5, cost: 75 })],
  }),

  // ------------------------------------------------------------------------------- Q4
  problem({
    ch: '5', id: 'c5.binom-three', title: 'Binomial: exactly, at least, between', kind: 'numeric', level: 2, topics: ['binomial', 'binomial-cdf'], src: SRC(4),
    vars: {
      ctx: choice(['ontime', 'on-time flights'], ['throws', 'free throws'], ['pass', 'certification exam'], ['survey', 'survey'], ['defect', 'defective items']),
      n: range(10, 25, 1),
      p: range(0.02, 0.95, 0.01),
      x: range(0, 25, 1),
      qt: QT,
      r: range(1, 24, 1),
      a: range(1, 24, 1),
      w: range(2, 5, 1),
    },
    derive: ($) => {
      const C = BIN3[$.ctx];
      const b = $.a + $.w;
      const cdf = (k) => (k < 0 ? 0 : binomCdf(k, $.n, $.p));
      const c = cumRewrite($.qt, $.r);
      return { C, b, eq: binomPmf($.x, $.n, $.p), one: evalCum(c, cdf), off: evalCum(cumRewrite(SHIFTED[$.qt], $.r), cdf), btw: cdf(b) - cdf($.a - 1), cr: c };
    },
    valid: ($) =>
      $.p >= $.C.p[0] && $.p <= $.C.p[1] && $.x <= $.n && $.r < $.n && $.b <= $.n && $.eq > 0.01 && $.one > 0.01 && $.one < 0.99 && $.btw > 0.02 && $.btw < 0.98,
    text: (T, $) => `${$.C.text($.n, $.p)} What is the probability that (a) exactly ${$.x} ${said($.x, $.C.noun)}? (b) ${WORD[$.qt]} ${$.r} ${said($.r, $.C.noun)}? (c) between ${$.a} and ${$.b} (inclusive) ${said(2, $.C.noun)}?`,
    parts: [
      prob('eq', ($) => $.eq, {
        label: ($T, $) => `(a) $P(X = ${$.x})$`,
        alt: ($) => {
          const hi = binomTable($.x, $.n, $.p);
          const lo = $.x > 0 ? binomTable($.x - 1, $.n, $.p) : 0;
          return hi == null || lo == null ? [] : [hi - lo];
        },
        traps: [[($) => binomCdf($.x, $.n, $.p), String.raw`That is $P(X \le x)$ (binomcdf). “Exactly” is one term: binompdf.`]],
      }),
      prob('one', ($) => $.one, {
        label: ($T, $) => `(b) $P(X ${TEX[$.qt]} ${$.r})$`,
        alt: ($) => tableCum($.cr, (k) => binomTable(k, $.n, $.p)),
        traps: [
          [($) => $.off, 'Off by one value of X: check whether the boundary value itself is included (at least / more than, at most / fewer than).'],
          [($) => 1 - $.one, 'That is the complement. Check which values of X the question includes.'],
        ],
      }),
      prob('btw', ($) => $.btw, {
        label: ($T, $) => String.raw`(c) $P(${$.a} \le X \le ${$.b})$`,
        alt: ($) => {
          const hi = binomTable($.b, $.n, $.p);
          const lo = $.a > 0 ? binomTable($.a - 1, $.n, $.p) : 0;
          return hi == null || lo == null ? [] : [hi - lo];
        },
        traps: [[($) => binomCdf($.b, $.n, $.p) - binomCdf($.a, $.n, $.p), String.raw`That leaves out $X = ${'a'}$. “Inclusive” keeps both ends: $P(X \le b) - P(X \le a - 1)$.`]],
      }),
    ],
    hints: [
      String.raw`$X$ is binomial: $n$ independent trials with the same success probability $p$.`,
      'Exactly: binompdf(n, p, x). Everything else: rewrite as P(X ≤ something) and use binomcdf.',
      String.raw`At least $r$: $1 - P(X \le r - 1)$. Between $a$ and $b$ inclusive: $P(X \le b) - P(X \le a - 1)$.`,
    ],
    steps: ($) => {
      const out = [String.raw`$X$ is binomial with $n = ${$.n}$ and $p = ${$.p}$.`];
      out.push(String.raw`(a) $P(X = ${$.x}) = \binom{${$.n}}{${$.x}}(${$.p})^{${$.x}}(${fx(1 - $.p, 2)})^{${$.n - $.x}} = ${fx($.eq, 4)}$ (binompdf(${$.n}, ${$.p}, ${$.x}))`);
      const terms = $.cr.terms.map(([, k]) => `binomcdf(${$.n}, ${$.p}, ${k}) = ${fx(binomCdf(k, $.n, $.p), 4)}`).join('; ');
      out.push(String.raw`(b) $P(X ${TEX[$.qt]} ${$.r}) = ${$.cr.tex}$, with ${terms}: $${fx($.one, 4)}$`);
      out.push(
        String.raw`(c) $P(${$.a} \le X \le ${$.b}) = P(X \le ${$.b}) - P(X \le ${$.a - 1}) = ${fx(binomCdf($.b, $.n, $.p), 4)} - ${fx($.a > 0 ? binomCdf($.a - 1, $.n, $.p) : 0, 4)} = ${fx($.btw, 4)}$`,
      );
      return out;
    },
    twin: { part: 'btw', draw: (r, $) => { const x = r.binomial($.n, $.p); return x >= $.a && x <= $.b; } },
    cases: [kase(SRC(4), { ctx: 'ontime', n: 20, p: 0.71, x: 15, qt: 'ge', r: 13, a: 15, w: 3 }, { eq: 0.1868, one: 0.8018, btw: 0.4456 })],
  }),

  // ------------------------------------------------------------------------------- Q5
  problem({
    ch: '5', id: 'c5.poisson-period', title: 'Poisson: one period, then a longer one', kind: 'numeric', level: 2, topics: ['poisson', 'poisson-cdf'], src: SRC(5),
    vars: {
      ctx: choice(['service', 'customers per hour'], ['calls', 'calls per 10 minutes'], ['flaws', 'flaws per square meter']),
      lam: range(1, 9, 0.5),
      x: range(0, 12, 1),
      qt1: QT,
      r: range(1, 14, 1),
      t: choice([2, '2'], [3, '3']),
      qt2: QT,
      s: range(1, 30, 1),
    },
    derive: ($) => {
      const C = POIS_CTX[$.ctx];
      const mu2 = $.lam * $.t;
      const c1 = cumRewrite($.qt1, $.r);
      const c2 = cumRewrite($.qt2, $.s);
      return {
        C,
        mu2,
        c1,
        c2,
        eq: poisPmf($.x, $.lam),
        cum: evalCum(c1, (k) => (k < 0 ? 0 : poisCdf(k, $.lam))),
        per: evalCum(c2, (k) => (k < 0 ? 0 : poisCdf(k, mu2))),
        unscaled: evalCum(c2, (k) => (k < 0 ? 0 : poisCdf(k, $.lam))),
        cumT: tableCum(c1, (k) => poisTable(k, $.lam)),
        perT: tableCum(c2, (k) => poisTable(k, mu2)),
      };
    },
    valid: ($) => $.eq > 0.01 && $.cum > 0.01 && $.cum < 0.99 && $.per > 0.01 && $.per < 0.99 && Math.abs($.per - $.unscaled) > 0.05,
    text: (T, $) =>
      `${$.C.setup($.lam)} (a) Compute the probability that exactly ${$.x} ${said($.x, $.C.noun)} ${$.C.one}. (b) Compute the probability that ${WORD[$.qt1]} ${$.r} ${said($.r, $.C.noun)} ${$.C.one}. (c) Compute the probability that ${WORD[$.qt2]} ${$.s} ${said($.s, $.C.noun)} ${$.C.period($.t)}.`,
    parts: [
      prob('eq', ($) => $.eq, { label: ($T, $) => `(a) $P(X = ${$.x})$` }),
      prob('cum', ($) => $.cum, {
        label: ($T, $) => `(b) $P(X ${TEX[$.qt1]} ${$.r})$`,
        alt: ($) => $.cumT,
        traps: [
          [($) => evalCum(cumRewrite(SHIFTED[$.qt1], $.r), (k) => (k < 0 ? 0 : poisCdf(k, $.lam))), 'Off by one value: check whether the boundary value itself is included.'],
          [($) => poisPmf($.r, $.lam), String.raw`That is only $P(X = r)$. “No more than” adds up $X = 0, 1, \ldots, r$: poissoncdf.`],
        ],
      }),
      num('mu2', ($) => $.mu2, { label: ($T, $) => `(c) The mean number ${$.C.period($.t)}` }),
      prob('per', ($) => $.per, {
        label: ($T, $) => `(c) $P(Y ${TEX[$.qt2]} ${$.s})$, with $Y$ the number ${$.C.period($.t)}`,
        alt: ($) => $.perT,
        traps: [
          [($) => $.unscaled, String.raw`That uses the one-period mean. Scale the rate to the longer period first: $\mu = \lambda t$.`],
          [($) => evalCum(cumRewrite(SHIFTED[$.qt2], $.s), (k) => (k < 0 ? 0 : poisCdf(k, $.mu2))), 'Off by one value: check whether the boundary value itself is included.'],
        ],
      }),
    ],
    hints: [
      String.raw`$P(X = x) = \dfrac{e^{-\lambda}\lambda^x}{x!}$: poissonpdf(λ, x).`,
      'No more than r: poissoncdf(λ, r). More than r: 1 − poissoncdf(λ, r).',
      String.raw`A longer period has a proportionally larger mean: $\mu = \lambda t$. Use it in place of $\lambda$.`,
    ],
    steps: ($) => [
      String.raw`(a) $P(X = ${$.x}) = \dfrac{e^{-${$.lam}}(${$.lam})^{${$.x}}}{${$.x}!} = ${fx($.eq, 4)}$ (poissonpdf(${$.lam}, ${$.x}))`,
      String.raw`(b) $P(X ${TEX[$.qt1]} ${$.r}) = ${$.c1.tex} = ${fx($.cum, 4)}$ (${$.c1.terms.map(([, k]) => `poissoncdf(${$.lam}, ${k})`).join(', ')})`,
      String.raw`(c) ${$.C.period($.t)[0].toUpperCase() + $.C.period($.t).slice(1)} the mean is $\mu = \lambda t = ${$.lam} \times ${$.t} = ${tn($.mu2, 6)}$.`,
      String.raw`$P(Y ${TEX[$.qt2]} ${$.s}) = ${$.c2.tex.replace(/X/g, 'Y')} = ${fx($.per, 4)}$ (${$.c2.terms.map(([, k]) => `poissoncdf(${tn($.mu2, 6)}, ${k})`).join(', ')})`,
      'Table A.2 gives the same cumulative sums, P(X ≤ r), for the means it prints.',
    ],
    twin: { part: 'per', draw: (r, $) => holds($.qt2, r.poisson($.mu2), $.s) },
    cases: [kase(SRC(5), { ctx: 'service', lam: 7, x: 3, qt1: 'le', r: 3, t: 2, qt2: 'gt', s: 10 }, { eq: 0.0521, cum: 0.0818, mu2: 14, per: 0.8243 })],
  }),

  // ------------------------------------------------------------------------------- Q6
  problem({
    ch: '4', id: 'c4.density-k', title: 'A density with an unknown constant: k, a probability, the mean', kind: 'numeric', level: 2, topics: ['pdf', 'expectation'], src: SRC(6),
    vars: {
      form: choice(['pow', 'k y^m'], ['lin', 'k(y + c)'], ['hump', 'k y(b − y)']),
      m: range(1, 3, 1),
      c: range(1, 3, 1),
      b: range(1, 4, 1),
      i: range(0, 3, 1),
      j: range(1, 4, 1),
    },
    derive: ($) => {
      const D = DENSITY[$.form]($);
      const a1 = ($.b * $.i) / 4;
      const a2 = ($.b * $.j) / 4;
      const k = 1 / D.G($.b);
      return { D, a1, a2, k, p: k * (D.G(a2) - D.G(a1)), mu: k * D.H($.b), area: D.G($.b), f: (y) => (y < 0 || y > $.b ? 0 : k * D.g(y)) };
    },
    valid: ($) => $.i < $.j && !($.i === 0 && $.j === 4) && $.p > 0.02 && $.p < 0.98,
    text: (T, $) =>
      String.raw`Suppose the function $$f(y) = \begin{cases} ${$.D.tex} & \text{if } 0 \le y \le ${$.b} \\ 0 & \text{otherwise} \end{cases}$$ is the probability density function of a continuous random variable $Y$. (a) Find the value of $k$. (b) Find $P(${tn($.a1)} \le Y \le ${tn($.a2)})$. (c) Find $E(Y)$.`,
    parts: [
      num('k', ($) => $.k, { label: '(a) $k$', tol: 0.002, traps: [[($) => $.area, String.raw`That is the area under the curve without $k$. Set $k$ times it equal to 1: $k$ is its reciprocal.`]] }),
      prob('p', ($) => $.p, {
        label: ($T, $) => String.raw`(b) $P(${tn($.a1)} \le Y \le ${tn($.a2)})$`,
        traps: [[($) => $.f($.a2) - $.f($.a1), 'That subtracts heights of the density. A probability is an area: integrate f from one end to the other.']],
      }),
      num('mu', ($) => $.mu, {
        label: '(c) $E(Y)$',
        traps: [
          [($) => ($.form === 'hump' ? NaN : $.b / 2), String.raw`That is the middle of the interval. The mean is $\int y\,f(y)\,dy$, pulled toward where the density is larger.`],
        ],
      }),
    ],
    hints: [String.raw`The total area under a density is 1: $\int_0^{b} f(y)\,dy = 1$. Solve that for $k$.`, String.raw`$P(a \le Y \le c) = \int_a^c f(y)\,dy$.`, String.raw`$E(Y) = \int y\,f(y)\,dy$ over the whole range of $Y$.`],
    steps: ($) => [
      String.raw`(a) $$\int_0^{${$.b}} ${$.D.tex}\,dy = k\left[${$.D.Gtex}\right]_0^{${$.b}} = ${tn($.area, 6)}\,k = 1 \;\Rightarrow\; k = ${$.D.kTex} = ${tn($.k, 5)}$$`,
      String.raw`(b) $$P(${tn($.a1)} \le Y \le ${tn($.a2)}) = k\left[${$.D.Gtex}\right]_{${tn($.a1)}}^{${tn($.a2)}} = ${tn($.k, 5)}\,(${tn($.D.G($.a2), 6)} - ${tn($.D.G($.a1), 6)}) = ${fx($.p, 4)}$$`,
      String.raw`(c) $$E(Y) = \int_0^{${$.b}} y \cdot ${$.D.tex}\,dy = k\left[${$.D.Htex}\right]_0^{${$.b}} = ${tn($.k, 5)} \times ${tn($.D.H($.b), 6)} = ${tn($.mu, 5)}$$`,
      `On the TI-84: MATH ▸ 9:fnInt( checks each integral (use X for y).`,
    ],
    twin: {
      part: 'p',
      draw: (r, $) => {
        const top = Math.max(...[0, 0.25, 0.5, 0.75, 1].map((u) => $.f(u * $.b))) * 1.05;
        for (;;) {
          const y = r.uniform(0, $.b);
          if (r.uniform(0, top) < $.f(y)) return y >= $.a1 && y <= $.a2;
        }
      },
    },
    cases: [kase(SRC(6), { form: 'pow', m: 2, c: 1, b: 2, i: 2, j: 4 }, { k: 0.375, p: 0.875, mu: 1.5 })],
  }),

  // ------------------------------------------------------------------------------- Q7
  problem({
    ch: '6', id: 'c6.uniform-wait', title: 'Uniform waiting time: before, after waiting, on average', kind: 'numeric', level: 2, topics: ['uniform', 'conditional'], src: SRC(7),
    vars: {
      ctx: choice(['friend', 'a late friend'], ['bus', 'a shuttle bus'], ['package', 'a delivery']),
      len: choice([20, '20'], [30, '30'], [40, '40'], [45, '45'], [60, '60']),
      side: choice(['before', 'before'], ['after', 'after']),
      t1: range(5, 55, 5),
      w: range(2, 40, 1),
      v: range(2, 20, 1),
    },
    derive: ($) => {
      const C = WAIT[$.ctx];
      return { C, pa: $.side === 'before' ? $.t1 / $.len : ($.len - $.t1) / $.len, pc: $.v / ($.len - $.w), mean: $.len / 2 };
    },
    valid: ($) => $.t1 < $.len && $.w + $.v < $.len && $.w >= 3,
    text: (T, $) => {
      const C = $.C;
      const at = (m) => clock(C.hour, m);
      return `${C.setup(at(0), at($.len))} (a) Find the probability ${C.it} arrives ${$.side} ${at($.t1)}. (b) ${C.waited($.w, at($.w))} What is the probability ${C.it} arrives within the next ${$.v} minutes? (c) ${C.mean(at(0))}`;
    },
    parts: [
      prob('pa', ($) => $.pa, { label: ($T, $) => `(a) Arrives ${$.side} ${clock($.C.hour, $.t1)}`, traps: [[($) => 1 - $.pa, 'That is the other side. Before is the part of the window from its start; after is the part up to its end.']] }),
      prob('pc', ($) => $.pc, {
        label: ($T, $) => `(b) Within the next ${$.v} minutes, given none in the first ${$.w}`,
        traps: [[($) => $.v / $.len, String.raw`That ignores what you already know. Given no arrival in the first ${'w'} minutes, the arrival is uniform over the minutes that are left: divide by $(B - A) - w$.`]],
      }),
      num('mean', ($) => $.mean, { label: ($T, $) => `(c) ${$.C.meanLabel}`, unit: 'minutes' }),
    ],
    hints: [
      String.raw`Measure time in minutes from the start of the window: $X$ is uniform on $[0, L]$, so $P(X < t) = t/L$.`,
      String.raw`Given $X > w$, $X$ is uniform on $[w, L]$: $P(X \le w + v \mid X > w) = \dfrac{v}{L - w}$.`,
      String.raw`A uniform on $[A, B]$ has mean $\dfrac{A + B}{2}$.`,
    ],
    steps: ($) => {
      const at = (m) => clock($.C.hour, m);
      return [
        String.raw`Let $X$ be the arrival time in minutes after ${at(0)}: uniform on $[0, ${$.len}]$, with $f(x) = 1/${$.len}$.`,
        $.side === 'before' ? String.raw`(a) $P(X < ${$.t1}) = \dfrac{${$.t1}}{${$.len}} = ${fx($.pa, 4)}$` : String.raw`(a) $P(X > ${$.t1}) = \dfrac{${$.len} - ${$.t1}}{${$.len}} = ${fx($.pa, 4)}$`,
        String.raw`(b) $$P(X \le ${$.w + $.v} \mid X > ${$.w}) = \dfrac{P(${$.w} < X \le ${$.w + $.v})}{P(X > ${$.w})} = \dfrac{${$.v}/${$.len}}{${$.len - $.w}/${$.len}} = \dfrac{${$.v}}{${$.len - $.w}} = ${fx($.pc, 4)}$$`,
        String.raw`Knowing ${$.w} minutes have gone by shrinks the window to the ${$.len - $.w} minutes that are left, and the arrival is still uniform over them.`,
        String.raw`(c) $E(X) = \dfrac{0 + ${$.len}}{2} = ${tn($.mean, 6)}$ minutes.`,
      ];
    },
    twin: {
      part: 'pc',
      draw: (r, $) => {
        for (;;) {
          const x = r.uniform(0, $.len);
          if (x > $.w) return x <= $.w + $.v;
        }
      },
    },
    cases: [kase(SRC(7), { ctx: 'friend', len: 30, side: 'before', t1: 10, w: 12, v: 6 }, { pa: 1 / 3, pc: 1 / 3, mean: 15 })],
  }),

  // ------------------------------------------------------------------------------- Q8
  problem({
    ch: '6', id: 'c6.normal-spec', title: 'Normal: out of specification, and a cutoff', kind: 'numeric', level: 2, topics: ['normal', 'standardize', 'inverse', 'z-table'], src: SRC(8),
    vars: {
      ctx: choice(['tile', 'tile diagonal'], ['bolt', 'bolt length'], ['bottle', 'bottle fill'], ['rod', 'rod diameter'], ['cereal', 'cereal box weight']),
      sa: choice(['under', 'below the lower limit'], ['over', 'above the upper limit']),
      k: range(0.3, 2.5, 0.05),
      pc: choice([1, '1'], [2, '2'], [2.5, '2.5'], [5, '5'], [10, '10'], [15, '15'], [20, '20']),
    },
    derive: ($) => {
      const C = SPEC[$.ctx];
      // Part (b) defines the other kind of bad item: a cutoff in the tail opposite (a)'s.
      const sb = $.sa === 'under' ? 'top' : 'bottom';
      const L = roundTo(C.mu + ($.sa === 'under' ? -1 : 1) * $.k * C.sigma, C.dp);
      const z = (L - C.mu) / C.sigma;
      const pa = $.sa === 'under' ? normCdf(z) : 1 - normCdf(z);
      const ta = $.sa === 'under' ? zTable(z).value : 1 - zTable(z).value;
      const leftArea = sb === 'top' ? 1 - $.pc / 100 : $.pc / 100;
      const zt = zForArea(leftArea);
      return { C, sb, L, z, pa, ta, leftArea, zt, x: C.mu + C.sigma * normInv(leftArea), xt: zt.values.map((v) => C.mu + C.sigma * v) };
    },
    valid: ($) => Math.abs($.z) >= 0.25 && $.pa > 0.003,
    text: (T, $) => {
      const C = $.C;
      const u = C.unit;
      return `${C.intro} When the process is operating to specifications, the ${C.measure} of a ${C.item} is normally distributed with a mean of ${C.mu} ${u} and a standard deviation of ${C.sigma} ${u}. Let X be the ${C.measure} of a ${C.item}. (a) ${cap(C.items)} with a ${C.measure} ${$.sa === 'under' ? 'less' : 'more'} than ${fx($.L, C.dp)} ${u} are ${$.sa === 'under' ? C.small : C.large}. What is the probability a randomly selected ${C.item} is ${$.sa === 'under' ? C.small : C.large}? (b) The ${C.items} with the ${$.sb === 'top' ? 'largest' : 'smallest'} ${$.pc}% of ${C.measure}s are ${$.sb === 'top' ? C.large : C.small}. Find the ${C.measure} that separates the ${$.sb === 'top' ? C.largeNP : C.smallNP} from the others.`;
    },
    parts: [
      prob('pa', ($) => $.pa, { alt: ($) => [$.ta], label: ($T, $) => `(a) $P(X ${$.sa === 'under' ? '<' : '>'} ${fx($.L, $.C.dp)})$`, traps: [[($) => 1 - $.pa, 'That is the other tail. Draw the curve and shade the side the question asks about.']] }),
      num('x', ($) => $.x, {
        alt: ($) => $.xt,
        tol: 0,
        abs: ($) => 0.006 * $.C.sigma + 0.5 * 10 ** -$.C.dp,
        label: ($T, $) => `(b) The cutoff ${$.C.measure}, in ${$.C.unit}`,
        traps: [
          [($) => 2 * $.C.mu - $.x, ($) => `Wrong side of the mean: the ${$.sb === 'top' ? 'largest' : 'smallest'} ${$.pc}% sit in the ${$.sb === 'top' ? 'upper' : 'lower'} tail, so the cutoff is ${$.sb === 'top' ? 'above' : 'below'} the mean.`],
        ],
      }),
    ],
    hints: [
      String.raw`Standardize: $z = \dfrac{x - \mu}{\sigma}$, round to two decimals, and read Table A.3 (the area to the left).`,
      'The largest p% are above the cutoff, so the area to its left is 1 − p. The smallest p% are below it.',
      String.raw`Find that area in the body of Table A.3, read $z$, then $x = \mu + z\sigma$ (or invNorm(area, μ, σ)).`,
    ],
    steps: ($) => {
      const C = $.C;
      const a = zLook($.z);
      const lim = fx($.L, C.dp);
      return [
        String.raw`(a) $z = \dfrac{${lim} - ${C.mu}}{${C.sigma}} = ${fx($.z, 4)} \approx ${fx(a.z, 2)}$`,
        a.line,
        $.sa === 'under' ? String.raw`$P(X < ${lim}) = ${fx(a.table, 4)}$ (exact, normalcdf: ${fx($.pa, 4)})` : String.raw`$P(X > ${lim}) = 1 - ${fx(a.table, 4)} = ${fx(1 - a.table, 4)}$ (exact, normalcdf: ${fx($.pa, 4)})`,
        $.sb === 'top'
          ? String.raw`(b) The largest ${$.pc}% lie above the cutoff, so the area to its left is $1 - ${$.pc / 100} = ${fx($.leftArea, 4)}$.`
          : String.raw`(b) The smallest ${$.pc}% lie below the cutoff, so the area to its left is $${fx($.leftArea, 4)}$.`,
        $.zt.tie ? String.raw`Table A.3: $${fx($.leftArea, 4)}$ is halfway between entries, so $z = ${$.zt.z}$` : String.raw`Table A.3: the area closest to $${fx($.leftArea, 4)}$ is at $z = ${fx($.zt.z, 2)}$`,
        String.raw`$$x = \mu + z\sigma = ${C.mu} + (${$.zt.z})(${C.sigma}) = ${tn(C.mu + $.zt.z * C.sigma, 6)}\ \text{${C.unit}}$$`,
        `Exact (TI-84 invNorm(${fx($.leftArea, 4)}, ${C.mu}, ${C.sigma})): ${tn($.x, 6)} ${C.unit}.`,
      ];
    },
    twin: { part: 'pa', draw: (r, $) => { const x = r.normal($.C.mu, $.C.sigma); return $.sa === 'under' ? x < $.L : x > $.L; } },
    cases: [kase(SRC(8), { ctx: 'tile', sa: 'under', k: 1 / 3, pc: 10 }, { pa: 0.3707, x: 1.5384 })],
  }),
];

/** Chapter 1 · Introduction to statistics and data analysis. */
import { problem, kase, range, choice, data, num, mc, tn, fx } from '../kit.js';
import { mean, median, sd, sorted, fiveNumber, boxPlot, range as spread, frequencyTable, modes } from '../../stats/describe.js';
import { createRng } from '../../stats/rng.js';

/**
 * Quartiles by the other rules a student may have met: interpolating between order statistics
 * (spreadsheets, many calculators' "percentile") and, for odd n, keeping the median in each half.
 */
function otherQuartiles(xs, p) {
  const s = sorted(xs);
  const n = s.length;
  const h = (n - 1) * p;
  const lo = Math.floor(h);
  const interp = s[lo] + (h - lo) * ((s[lo + 1] ?? s[lo]) - s[lo]);
  const half = n % 2 ? (p < 0.5 ? s.slice(0, (n + 1) / 2) : s.slice((n - 1) / 2)) : null;
  return { interp, inclusive: half ? median(half) : null };
}
export const quartileTraps = (p) => [
  [($) => otherQuartiles($.xs, p).interp, 'That is a quartile by interpolating between values (the spreadsheet rule). The notes use the TI-84 rule: the median of the lower (or upper) half.'],
  [($) => otherQuartiles($.xs, p).inclusive ?? NaN, 'That half included the median. With an odd n, the TI-84 rule leaves the median out of both halves.'],
];

const C1 = { ch: '1' };

/** Measurements to draw a sample of: what, its unit, a typical value, spread, and decimals kept. */
const CONTEXTS = [
  { value: 'weight', label: 'stem weights of oak seedlings, in grams', mu: 0.45, sd: 0.1, dp: 2, lo: 0.1 },
  { value: 'battery', label: 'lifetimes of car batteries, in years', mu: 3.4, sd: 0.6, dp: 1, lo: 1 },
  { value: 'score', label: 'exam scores', mu: 74, sd: 11, dp: 0, lo: 30, hi: 100 },
  { value: 'commute', label: 'commute times, in minutes', mu: 24, sd: 8, dp: 0, lo: 5 },
  { value: 'fill', label: 'fill volumes of soda bottles, in mL', mu: 500, sd: 4, dp: 1, lo: 480 },
];
const CTX = choice(...CONTEXTS.map((c) => [c.value, c.label]));
const ctxOf = (v) => CONTEXTS.find((c) => c.value === v);

/** A standard normal from a uniform generator (Box–Muller). */
function gauss(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/** n values from the context, rounded to its decimals and kept in its range. */
function sampleOf(rand, ctxId, n) {
  const c = ctxOf(ctxId);
  const out = [];
  while (out.length < n) {
    const x = Number((c.mu + c.sd * gauss(rand)).toFixed(c.dp));
    if (x >= c.lo && (c.hi == null || x <= c.hi)) out.push(x);
  }
  return out;
}

const list = (xs, dp) => xs.map((x) => (dp == null ? String(x) : x.toFixed(dp))).join(', ');
const dpOf = ($) => ctxOf($.ctx)?.dp ?? 2;

/** "$0.28,\ 0.32,\ …$" for a sorted list in a step, with the given positions boxed. */
function sortedTex(xs, dp, mark = []) {
  return xs.map((x, i) => (mark.includes(i) ? String.raw`\boxed{${x.toFixed(dp)}}` : x.toFixed(dp))).join(String.raw`,\ `);
}

/** The median's step: which position(s), and the value. */
function medianStep(s, dp, name = String.raw`\tilde{x}`) {
  const n = s.length;
  if (n % 2) {
    const k = (n + 1) / 2;
    return String.raw`$n = ${n}$ is odd, so ${name.startsWith('Q') ? `$${name}$` : 'the median'} is the value in position $\tfrac{n+1}{2} = ${k}$: $${name} = ${s[k - 1].toFixed(dp)}$`;
  }
  const k = n / 2;
  return String.raw`$n = ${n}$ is even, so ${name.startsWith('Q') ? `$${name}$` : 'the median'} is the mean of positions $\tfrac{n}{2} = ${k}$ and $\tfrac{n}{2}+1 = ${k + 1}$: $${name} = \dfrac{${s[k - 1].toFixed(dp)} + ${s[k].toFixed(dp)}}{2} = ${tn((s[k - 1] + s[k]) / 2, 6)}$`;
}

const NO_NITROGEN = [0.32, 0.53, 0.28, 0.37, 0.47, 0.43, 0.36, 0.42, 0.38, 0.43];
const NITROGEN = [0.26, 0.43, 0.47, 0.49, 0.52, 0.75, 0.79, 0.86, 0.62, 0.46];
const CLAIMS = [6751, 9908, 3461, 2336, 21147, 2332, 189, 1185, 370, 1414, 4668, 1953, 10034, 735, 802, 618, 180, 1657];
const BATTERIES = [2.2, 4.1, 3.5, 4.5, 3.2, 3.7, 3.0, 2.6, 3.4, 1.6, 3.1, 3.3, 3.8, 3.1, 4.7, 3.7, 2.5, 4.3, 3.4, 3.6, 2.9, 3.3, 3.9, 3.1, 3.3, 3.1, 3.7, 4.4, 3.2, 4.1, 1.9, 3.4, 4.7, 3.8, 3.2, 2.6, 3.9, 3.0, 4.2, 3.5];

export default [
  // ----------------------------------------------------------- types of data, parameters
  problem({
    ...C1, id: 'c1.data-type', title: 'Types of data', kind: 'conceptual', topics: ['data-types'], src: 'Notes §1.3',
    vars: {
      item: choice(
        ['cars', 'the number of cars in a parking lot'],
        ['height', 'the height of a student'],
        ['eyes', 'eye color'],
        ['zip', 'a zip code'],
        ['time', 'the time taken to finish an exam'],
        ['defects', 'the number of defective bolts in a box'],
        ['cartype', 'type of car (sedan, SUV, truck)'],
        ['temp', 'the temperature at noon'],
        ['students', 'the number of students in a class'],
        ['ssn', 'a Social Security number'],
        ['weight', 'the weight of a newborn'],
        ['calls', 'the number of calls to a help desk in an hour'],
      ),
    },
    derive: ($) => ({ kind: { cars: 'd', height: 'c', eyes: 'q', zip: 'q', time: 'c', defects: 'd', cartype: 'q', temp: 'c', students: 'd', ssn: 'q', weight: 'c', calls: 'd' }[$.item] }),
    text: (T) => `What type of data is ${T.item}?`,
    parts: [
      mc('type', [
        ['q', 'Qualitative (categorical)', 'Qualitative data are labels. This one is a number you can do arithmetic with.'],
        ['d', 'Quantitative, discrete', ''],
        ['c', 'Quantitative, continuous', ''],
      ], ($) => $.kind),
    ],
    hints: ['Would an average of this make sense? If not, it is a label, even when it is written with digits.', 'Discrete data are counts (whole numbers only). Continuous data are measurements that can take any value in a range.'],
    steps: ($, T) => [
      {
        q: `${T.item[0].toUpperCase() + T.item.slice(1)} is a label. Its digits (if any) name something; they are not an amount, so it is qualitative. The notes give zip codes and Social Security numbers as examples.`,
        d: `${T.item[0].toUpperCase() + T.item.slice(1)} is a count, so it takes whole-number values only: quantitative and discrete.`,
        c: `${T.item[0].toUpperCase() + T.item.slice(1)} is a measurement that can take any value in a range: quantitative and continuous.`,
      }[$.kind],
    ],
    cases: [kase('Notes §1.3', { item: 'zip' }, { type: 'q' })],
  }),

  problem({
    ...C1, id: 'c1.parameter-statistic', title: 'Parameter or statistic?', kind: 'conceptual', topics: ['parameter-statistic'], src: 'Notes Ex 1.2–1.3',
    vars: {
      s: choice(
        ['p1', '48.2% of all students on your campus own a car.'],
        ['s1', 'A sample of 100 students is obtained, and 46% of them own a car.'],
        ['p2', 'The average tensile strength of all 50,000 steel rods produced this month is 612 MPa.'],
        ['s2', 'The engineer tests 100 rods selected at random from this month’s batch; their average tensile strength is 608 MPa.'],
        ['p3', 'According to the census, the mean household size in the county is 2.6 people.'],
        ['s3', 'In a poll of 1,200 likely voters, 53% favor the measure.'],
        ['p4', 'Of all 214 employees at a company, 31% work remotely.'],
        ['s4', 'The mean commute time of 40 randomly chosen employees is 27 minutes.'],
      ),
    },
    derive: ($) => ({ kind: $.s[0] }),
    text: (T) => `“${T.s}” Is the number in this statement a parameter or a statistic?`,
    parts: [
      mc('which', [
        ['p', 'A parameter: it describes a whole population'],
        ['s', 'A statistic: it describes a sample'],
      ], ($) => $.kind),
    ],
    hints: ['A parameter summarizes a population. A statistic summarizes a sample.', 'Does the number come from every member of the group, or from some of them?'],
    steps: ($) => [$.kind === 'p' ? 'The number summarizes every member of the group (the population), so it is a parameter.' : 'The number summarizes only the members that were sampled, so it is a statistic. It estimates the population’s parameter.'],
    cases: [kase('Notes Ex 1.2', { s: 'p1' }, { which: 'p' }), kase('Notes Ex 1.3', { s: 's1' }, { which: 's' })],
  }),

  // ----------------------------------------------------------- center
  problem({
    ...C1, id: 'c1.mean-median', title: 'Mean and median', kind: 'numeric', topics: ['mean', 'median'], src: 'Notes Ex 1.6',
    vars: { ctx: CTX, n: range(7, 12, 1), xs: data((r, v) => sampleOf(r, v.ctx, v.n)) },
    derive: ($) => ({ xbar: mean($.xs), med: median($.xs), sum: $.xs.reduce((a, b) => a + b, 0), s: sorted($.xs) }),
    text: (T, $) => `A sample of ${$.n} ${ctxOf($.ctx).label}: ${list($.xs, dpOf($))}. Find the sample mean and the sample median.`,
    parts: [
      num('xbar', ($) => $.xbar, { label: String.raw`$\bar{x}$`, tol: 0.003 }),
      num('med', ($) => $.med, { label: String.raw`$\tilde{x}$`, tol: 0, abs: 1e-9 }),
    ],
    hints: [String.raw`$\bar{x} = \dfrac{x_1 + x_2 + \cdots + x_n}{n}$`, 'For the median, sort the data first. With an even number of values, average the two in the middle.'],
    steps: ($) => {
      const dp = dpOf($);
      return [
        String.raw`$$\bar{x} = \dfrac{\sum x_i}{n} = \dfrac{${tn($.sum, 8)}}{${$.n}} = ${tn($.xbar, 6)}$$`,
        String.raw`Sorted: $${sortedTex($.s, dp, $.n % 2 ? [($.n - 1) / 2] : [$.n / 2 - 1, $.n / 2])}$`,
        medianStep($.s, dp),
        'On the TI-84: STAT → 1:Edit, enter the data in L1, then STAT → CALC → 1:1-Var Stats. It lists x̄ and, further down, Med.',
      ];
    },
    cases: [kase('Notes Ex 1.6 (no nitrogen)', { ctx: 'weight', n: 10, xs: NO_NITROGEN }, { xbar: 0.399, med: 0.4 })],
  }),

  problem({
    ...C1, id: 'c1.which-center', title: 'Mean or median?', kind: 'conceptual', topics: ['mean', 'median', 'skew', 'resistant'], src: 'Notes Ex 1.7',
    vars: {
      mean_: range(4, 60, 0.25),
      kind: choice(['right', 'skewed right'], ['left', 'skewed left'], ['sym', 'symmetric']),
      // Skewed versions put the median a clear 25–60% away from the mean; symmetric ones within 2%.
      f: range(0.25, 0.6, 0.05),
      tiny: range(-0.02, 0.02, 0.01),
    },
    derive: ($) => {
      const raw = $.kind === 'sym' ? $.mean_ * (1 + $.tiny) : $.kind === 'right' ? $.mean_ * (1 - $.f) : $.mean_ * (1 + $.f);
      const med = Math.round(raw * 4) / 4;
      return { med, shape: $.kind, center: $.kind === 'sym' ? 'mean' : 'median' };
    },
    valid: ($) => $.med >= 1 && ($.kind === 'sym' ? Math.abs($.mean_ - $.med) <= 0.02 * $.mean_ + 1e-9 : Math.abs($.mean_ - $.med) >= 0.2 * $.mean_),
    text: (T, $) => `A sample of cell phone call lengths (in minutes) has mean ${fx($.mean_, 2)} and median ${fx($.med, 2)}.`,
    parts: [
      mc('shape', [
        ['right', 'Skewed right', 'When the data skew right, the long right tail pulls the mean well above the median.'],
        ['left', 'Skewed left', 'When the data skew left, the long left tail pulls the mean well below the median.'],
        ['sym', 'Roughly symmetric', 'In a symmetric data set the mean and the median are about equal. These are far apart.'],
      ], ($) => $.shape, { label: 'The shape of the data is most likely…' }),
      mc('center', [
        ['median', 'The median', 'For symmetric data the notes use the mean: it uses every value, and no tail drags it.'],
        ['mean', 'The mean', 'The mean is not resistant: the values in the long tail drag it away from the typical value.'],
      ], ($) => $.center, { label: 'Which better describes a typical call?' }),
    ],
    hints: ['Compare the mean with the median: about equal means roughly symmetric; far apart means a long tail on the side of the mean.', 'A measure is resistant if extreme values do not change it much.'],
    steps: ($) => [
      $.shape === 'sym'
        ? String.raw`The mean ($${fx($.mean_, 2)}$) and the median ($${fx($.med, 2)}$) are about equal, so the data are roughly symmetric.`
        : $.shape === 'right'
          ? String.raw`The mean ($${fx($.mean_, 2)}$) is well above the median ($${fx($.med, 2)}$): a few very long values pull the mean up. That is a right skew.`
          : String.raw`The mean ($${fx($.mean_, 2)}$) is well below the median ($${fx($.med, 2)}$): a few very small values pull the mean down. That is a left skew.`,
      $.shape === 'sym' ? 'For symmetric data, use the mean: it uses every value, and nothing pulls it off center.' : 'For skewed data, use the median to describe the center. It is resistant; the mean is not.',
    ],
    cases: [kase('Notes Ex 1.7', { mean_: 7.25, kind: 'right', f: 1 - 3.5 / 7.25, tiny: 0 }, { shape: 'right', center: 'median' })],
  }),

  problem({
    ...C1, id: 'c1.mode', title: 'The mode', kind: 'conceptual', topics: ['mode'], src: 'Notes Ex 1.8–1.9',
    vars: {
      style: choice(['one', 'one'], ['none', 'none'], ['two', 'two']),
      xs: data((r, v) => {
        const base = [];
        const pool = [0, 1, 2, 3, 4, 5, 6];
        const shuffle = (a) => a.sort(() => r() - 0.5);
        if (v.style === 'none') return shuffle([...pool]).slice(0, 5 + Math.floor(r() * 3));
        const top = pool[Math.floor(r() * pool.length)];
        const second = pool.filter((x) => x !== top)[Math.floor(r() * 6)];
        const k = 3 + Math.floor(r() * 2);
        for (let i = 0; i < k; i++) base.push(top);
        for (let i = 0; i < (v.style === 'two' ? k : 1); i++) base.push(second);
        for (const x of pool) if (x !== top && x !== second && r() < 0.5) base.push(x);
        return shuffle(base);
      }),
    },
    derive: ($) => {
      const m = modes($.xs);
      return { m, key: m.length === 0 ? 'none' : m.slice().sort((a, b) => a - b).join(',') };
    },
    text: (T) => `The number of defective parts found in each of several inspection lots: ${T.xs}. What is the mode?`,
    parts: [
      mc('mode', ($) => {
        const opts = [...new Set($.xs)].sort((a, b) => a - b).map((x) => [String(x), String(x)]);
        if ($.m.length > 1) opts.push([$.key, `Two modes: ${$.m.slice().sort((a, b) => a - b).join(' and ')}`]);
        opts.push(['none', 'There is no mode']);
        return opts;
      }, ($) => $.key),
    ],
    hints: ['The mode is the value that occurs most often.', 'If every value occurs the same number of times, there is no mode. If two values tie for most frequent, the data are bimodal.'],
    steps: ($) => [
      $.m.length === 0
        ? 'Every value occurs equally often, so there is no mode.'
        : $.m.length === 1
          ? `${$.m[0]} occurs ${$.xs.filter((x) => x === $.m[0]).length} times, more than any other value, so the mode is ${$.m[0]}.`
          : `${$.m.join(' and ')} each occur ${$.xs.filter((x) => x === $.m[0]).length} times, more than any other value: the data are bimodal.`,
    ],
    cases: [kase('Notes Ex 1.8 (O-ring failures)', { style: 'one', xs: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 3] }, { mode: '0' })],
  }),

  // ----------------------------------------------------------- spread
  problem({
    ...C1, id: 'c1.range-sd', title: 'Range and standard deviation', kind: 'numeric', topics: ['range', 'standard-deviation'], src: 'Notes Ex 1.11',
    vars: { ctx: CTX, n: range(6, 10, 1), xs: data((r, v) => sampleOf(r, v.ctx, v.n)) },
    derive: ($) => {
      const xbar = mean($.xs);
      const ss = $.xs.reduce((a, x) => a + (x - xbar) ** 2, 0);
      return { xbar, ss, R: spread($.xs), s: sd($.xs), s2: ss / ($.n - 1), mx: Math.max(...$.xs), mn: Math.min(...$.xs) };
    },
    valid: ($) => $.s > 0,
    text: (T, $) => `A sample of ${$.n} ${ctxOf($.ctx).label}: ${list($.xs, dpOf($))}. Find the range and the sample standard deviation.`,
    parts: [
      num('R', ($) => $.R, { label: 'Range $R$', tol: 0, abs: 1e-9 }),
      num('s', ($) => $.s, { label: 'Standard deviation $s$', tol: 0.005, traps: [[($) => Math.sqrt($.ss / $.n), String.raw`That divides by $n$: it is the population formula ($\sigma$, TI's σx). A sample's $s$ divides by $n - 1$ (TI's Sx).`]] }),
    ],
    hints: ['Range = largest value − smallest value.', String.raw`$s = \sqrt{\dfrac{\sum (x_i - \bar{x})^2}{n - 1}}$. Divide by $n - 1$, not $n$, for a sample.`],
    steps: ($) => {
      const dp = dpOf($);
      return [
        String.raw`$R = ${$.mx.toFixed(dp)} - ${$.mn.toFixed(dp)} = ${tn($.R, 6)}$`,
        String.raw`$\bar{x} = ${tn($.xbar, 6)}$`,
        String.raw`$$\sum (x_i - \bar{x})^2 = ${$.xs.map((x) => `(${x.toFixed(dp)} - ${tn($.xbar, 5)})^2`).slice(0, 3).join(' + ')} + \cdots = ${tn($.ss, 6)}$$`,
        String.raw`$$s = \sqrt{\dfrac{${tn($.ss, 6)}}{${$.n} - 1}} = \sqrt{${tn($.s2, 6)}} = ${tn($.s, 4)}$$`,
        'On the TI-84, 1-Var Stats gives s as Sx. (σx is the population version, dividing by n.)',
      ];
    },
    cases: [kase('Notes Ex 1.11 (nitrogen)', { ctx: 'weight', n: 10, xs: NITROGEN }, { R: 0.6, s: 0.187 })],
  }),

  problem({
    ...C1, id: 'c1.resistant', title: 'Resistant measures', kind: 'conceptual', topics: ['resistant'], src: 'Notes §1.5–1.7',
    vars: {
      m: choice(['mean', 'mean'], ['median', 'median'], ['range', 'range'], ['sd', 'standard deviation'], ['iqr', 'interquartile range (IQR)'], ['var', 'variance']),
    },
    derive: ($) => ({ yes: ['median', 'iqr'].includes($.m) ? 1 : 0 }),
    text: (T) => `True or false: the ${T.m} is resistant to extreme values.`,
    parts: [mc('tf', [[1, 'True'], [0, 'False']], ($) => $.yes)],
    hints: ['A measure is resistant if one very large or very small value cannot move it much.', 'Which measures use every value’s size, and which use only positions in the sorted data?'],
    steps: ($) => [
      $.yes
        ? `True. The ${$.m === 'iqr' ? 'IQR' : 'median'} depends only on the values in the middle of the sorted data, so an extreme value barely moves it.`
        : `False. The ${{ mean: 'mean', range: 'range', sd: 'standard deviation', var: 'variance' }[$.m]} uses the size of ${$.m === 'range' ? 'the largest and smallest values' : 'every value'}, so one extreme value can change it a lot.`,
      'Resistant: median and IQR. Not resistant: mean, range, standard deviation and variance.',
    ],
    cases: [kase('Notes §1.7', { m: 'iqr' }, { tf: 1 })],
  }),

  // ----------------------------------------------------------- quartiles and box plots
  problem({
    ...C1, id: 'c1.quartiles', title: 'Quartiles and the IQR', kind: 'numeric', topics: ['quartiles', 'iqr'], src: 'Notes Ex 1.13',
    vars: {
      n: range(9, 16, 1),
      xs: data((r, v) => Array.from({ length: v.n }, () => 10 + Math.floor(r() * 90))),
    },
    derive: ($) => ({ f: fiveNumber($.xs) }),
    text: (T, $) => `Find the first quartile, the third quartile and the interquartile range of these ${$.n} values: ${list($.xs)}.`,
    parts: [
      num('q1', ($) => $.f.q1, { label: '$Q_1$', tol: 0, abs: 1e-9, traps: quartileTraps(0.25) }),
      num('q3', ($) => $.f.q3, { label: '$Q_3$', tol: 0, abs: 1e-9, traps: quartileTraps(0.75) }),
      num('iqr', ($) => $.f.q3 - $.f.q1, { label: 'IQR', tol: 0, abs: 1e-9 }),
    ],
    hints: ['Sort the data and find the median first.', 'Q1 is the median of the lower half and Q3 the median of the upper half. When n is odd, the median itself belongs to neither half (this is what the TI-84 does).', '$\\text{IQR} = Q_3 - Q_1$'],
    steps: ($) => {
      const { f, n } = { f: $.f, n: $.n };
      const s = f.sorted;
      const mark = n % 2 ? [(n - 1) / 2] : [];
      return [
        String.raw`Sorted: $${s.map((x, i) => (mark.includes(i) ? String.raw`\boxed{${x}}` : x)).join(String.raw`,\ `)}$`,
        n % 2
          ? `n = ${n} is odd, so the median (${f.median}, position ${(n + 1) / 2}) is left out of both halves. Each half has ${f.lower.length} values.`
          : `n = ${n} is even, so each half has ${n / 2} values.`,
        String.raw`Lower half: $${f.lower.join(String.raw`,\ `)}$, so $Q_1 = ${f.q1}$`,
        String.raw`Upper half: $${f.upper.join(String.raw`,\ `)}$, so $Q_3 = ${f.q3}$`,
        String.raw`$\text{IQR} = Q_3 - Q_1 = ${f.q3} - ${f.q1} = ${tn(f.q3 - f.q1, 8)}$`,
      ];
    },
    cases: [kase('Notes Ex 1.13 (collision claims)', { n: 18, xs: CLAIMS }, { q1: 735, q3: 4668, iqr: 3933 })],
  }),

  problem({
    ...C1, id: 'c1.outliers', title: 'Fences and outliers', kind: 'numeric', level: 2, topics: ['outliers', 'box-plot', 'iqr'], src: 'Notes Ex 1.14',
    vars: {
      // The notes' own case is collision claims in dollars; generated versions are waiting times.
      ctx: choice(['wait', 'drive-through waiting times'], ['claims', 'collision claims']),
      n: range(10, 14, 1),
      far: choice([1, 'high'], [-1, 'low'], [0, 'none']),
      xs: data((r, v) => {
        const xs = Array.from({ length: v.n }, () => 40 + Math.floor(r() * 40));
        if (v.far) xs[Math.floor(r() * v.n)] = v.far > 0 ? 130 + Math.floor(r() * 40) : 1 + Math.floor(r() * 5);
        return xs;
      }),
    },
    derive: ($) => ({ b: boxPlot($.xs) }),
    valid: ($) => $.b.iqr > 0 && $.b.outliers.every((x) => Math.abs(x - ($.b.upperFence + $.b.lowerFence) / 2) > 1),
    sampleValid: ($) => $.ctx === 'wait',
    text: (T, $) =>
      $.ctx === 'claims'
        ? `Collision claims paid by an insurance company, in dollars: ${list($.xs)}. Use the 1.5 × IQR rule to check for outliers.`
        : `Waiting times (in seconds) at a drive-through: ${list($.xs)}. Use the 1.5 × IQR rule to check for outliers.`,
    parts: [
      num('lf', ($) => $.b.lowerFence, { label: 'Lower fence', tol: 0, abs: 1e-9 }),
      num('uf', ($) => $.b.upperFence, { label: 'Upper fence', tol: 0, abs: 1e-9 }),
      num('k', ($) => $.b.outliers.length, { label: 'How many outliers are there?', tol: 0, abs: 0 }),
    ],
    hints: ['Find Q1 and Q3 (medians of the lower and upper halves) and the IQR.', 'Lower fence = Q1 − 1.5 × IQR. Upper fence = Q3 + 1.5 × IQR.', 'An outlier is a value below the lower fence or above the upper fence.'],
    steps: ($) => {
      const b = $.b;
      return [
        String.raw`Sorted: $${b.sorted.join(String.raw`,\ `)}$`,
        String.raw`$Q_1 = ${b.q1}$, $Q_3 = ${b.q3}$, $\text{IQR} = ${b.q3} - ${b.q1} = ${tn(b.iqr, 8)}$`,
        String.raw`Lower fence $= Q_1 - 1.5 \times \text{IQR} = ${b.q1} - 1.5 \times ${tn(b.iqr, 8)} = ${tn(b.lowerFence, 8)}$`,
        String.raw`Upper fence $= Q_3 + 1.5 \times \text{IQR} = ${b.q3} + 1.5 \times ${tn(b.iqr, 8)} = ${tn(b.upperFence, 8)}$`,
        b.outliers.length ? `Outlier${b.outliers.length > 1 ? 's' : ''}: ${b.outliers.join(', ')}. In a box plot the whiskers stop at ${b.whiskerLow} and ${b.whiskerHigh}, and each outlier is marked with *.` : `Every value lies between the fences, so there are no outliers. The whiskers run to ${b.whiskerLow} and ${b.whiskerHigh}.`,
      ];
    },
    cases: [kase('Notes Ex 1.14 (collision claims)', { ctx: 'claims', n: 18, far: 1, xs: CLAIMS }, { lf: -5164.5, uf: 10567.5, k: 1 })],
  }),

  // ----------------------------------------------------------- frequency distributions
  problem({
    ...C1, id: 'c1.frequency', title: 'Frequency and relative frequency', kind: 'numeric', topics: ['frequency-distribution', 'histogram'], src: 'Notes Ex 1.5',
    vars: {
      k: range(1, 5, 1),
      xs: data((r) => {
        const g = createRng(Math.floor(r() * 2 ** 31));
        return Array.from({ length: 30 + Math.floor(r() * 11) }, () => Math.min(4.9, Math.max(1.5, Number(g.normal(3.3, 0.65).toFixed(1)))));
      }),
    },
    derive: ($) => {
      const rows = frequencyTable($.xs, { start: 1.5, width: 0.5, classes: 7 });
      return { rows, row: rows[$.k], n: $.xs.length };
    },
    valid: ($) => $.row.f > 0,
    text: (T, $) => `The lives of ${$.n} car batteries, recorded to the nearest tenth of a year: ${list($.xs, 1)}. The frequency distribution uses the classes 1.5–1.9, 2.0–2.4, …, 4.5–4.9.`,
    parts: [
      num('f', ($) => $.row.f, { label: (T, $) => `Frequency of the class ${fx($.row.lo, 1)}–${fx($.row.hi, 1)}`, tol: 0, abs: 0 }),
      num('rel', ($) => $.row.rel, { label: 'Its relative frequency', tol: 0, abs: 0.005 }),
      num('mid', ($) => $.row.mid, { label: 'Its class midpoint', tol: 0, abs: 0.001 }),
    ],
    hints: ['Count the values from the class’s lower limit to its upper limit, both included.', 'Relative frequency = frequency ÷ total number of observations.', 'Midpoint = (lower limit + upper limit) ÷ 2.'],
    steps: ($) => [
      `Values in ${fx($.row.lo, 1)}–${fx($.row.hi, 1)}: ${$.row.f}.`,
      String.raw`Relative frequency $= \dfrac{${$.row.f}}{${$.n}} = ${tn($.row.rel, 4)}$`,
      String.raw`Midpoint $= \dfrac{${fx($.row.lo, 1)} + ${fx($.row.hi, 1)}}{2} = ${fx($.row.mid, 2)}$`,
    ],
    cases: [kase('Notes Ex 1.5 (car batteries)', { k: 3, xs: BATTERIES }, { f: 15, rel: 0.375, mid: 3.2 })],
  }),
];

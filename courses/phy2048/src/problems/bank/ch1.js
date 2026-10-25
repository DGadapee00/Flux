/** Ch 1 · Units and measurement. OpenStax University Physics Vol. 1, §§1.2–1.7. */
import { convert, toSI } from '@flux/subjects/convert.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u1', ch: '1' };

/** Metric prefixes from kilo to exa, as the power of ten each stands for. */
const PREFIXES = [['k', 3], ['M', 6], ['G', 9], ['T', 12], ['P', 15], ['E', 18]];

/**
 * Equations to test for dimensional consistency. Dimensions are exponent pairs [L, T]. A sum is
 * consistent when every term has one dimension; a function is consistent when its argument and its
 * value are dimensionless.
 */
const DIM = { s: [1, 0], v: [1, -1], a: [1, -2], t: [0, 1] };
const times = (...names) => names.reduce(([l, t], n) => [l + DIM[n][0], t + DIM[n][1]], [0, 0]);
const same = (x, y) => x[0] === y[0] && x[1] === y[1];
const EQUATIONS = {
  1: {
    text: String.raw`s = vt + \tfrac12 at^2`,
    terms: [['s'], ['v', 't'], ['a', 't', 't']],
    ok: true,
    why: 'Each term has the dimension of length: v t is L, and a t² is L as well.',
  },
  2: {
    text: String.raw`s = vt^2 + \tfrac12 at`,
    terms: [['s'], ['v', 't', 't'], ['a', 't']],
    ok: false,
    why: 'The first term on the right is v t² = L T and the second is a t = L T⁻¹. They differ from each other and from the length on the left.',
  },
  3: {
    text: String.raw`v = \sin\!\left(at^2/s\right)`,
    fn: { value: ['v'], arg: ['a', 't', 't'], over: ['s'] },
    ok: false,
    why: 'The argument a t²/s is dimensionless, which is allowed inside a sine. But then the sine is dimensionless, and v is L T⁻¹.',
  },
  4: {
    text: String.raw`v^2 = v_0^2 + 2as`,
    terms: [['v', 'v'], ['v', 'v'], ['a', 's']],
    ok: true,
    why: 'Every term has the dimension L² T⁻²: v² and v₀² obviously, and a s is L T⁻² times L.',
  },
};

/** The same verdict from the dimensions themselves, for the second check. */
function consistent(eq) {
  if (eq.fn) {
    const arg = times(...eq.fn.arg);
    const over = times(...eq.fn.over);
    return arg[0] === over[0] && arg[1] === over[1] && same(times(...eq.fn.value), [0, 0]);
  }
  const dims = eq.terms.map((t) => times(...t));
  return dims.every((d) => same(d, dims[0]));
}


/**
 * Arithmetic to round: each row gives the exact result, the rule that applies and the digits that
 * rule keeps. `sf` counts significant figures for a product; `dp` counts decimal places for a sum.
 */
const SUMS = {
  1: { kind: 'mul', exact: 0.062 * 8.5, sf: 2, dp: 1 },
  2: { kind: 'mul', exact: 4.07 * 0.85, sf: 2, dp: 2 },
  3: { kind: 'mul', exact: 12.4 * 3.1, sf: 2, dp: 1 },
  4: { kind: 'add', exact: 125.4 + 0.62, sf: 2, dp: 1 },
  5: { kind: 'add', exact: 56.78 + 0.9, sf: 1, dp: 1 },
  6: { kind: 'add', exact: 120.0 - 0.46, sf: 2, dp: 1 },
};

/** The result written with the digits its rule keeps. */
function round(x, row) {
  return row.kind === 'mul' ? String(Number(x.toPrecision(row.sf))) : x.toFixed(row.dp);
}

/** Drop options whose label repeats one already listed, so the right answer is never offered twice. */
function dedupe(options) {
  const seen = new Set();
  return options.filter(([value]) => (seen.has(value) ? false : seen.add(value)));
}

export default [
  problem({
    ...U,
    id: 'ch1.convert',
    src: 'OpenStax University Physics Vol. 1 §1.3',
    title: 'Converting a speed to metric',
    topics: ['units', 'conversion'],
    level: 1,
    variety: ['unknown'],
    vars: {
      d: range(5, 40, 5, 'mi'),
      t: range(10, 60, 5, 'min'),
    },
    derive: ($) => ({
      v: toSI($.d, 'mi') / ($.t * 60),
      dkm: convert($.d, 'mi', 'km'),
    }),
    // Through feet, the way the exact definition goes: 1 mi = 5280 ft, 1 ft = 0.3048 m.
    second: ($) => ({
      v: ($.d * 5280 * 0.3048) / ($.t * 60),
      dkm: ($.d * 5280 * 0.3048) / 1000,
    }),
    text: (T) => `The drive from the university to home is ${T.d} mi and usually takes ${T.t} min. Find the average speed in meters per second, and the distance in kilometers. Take 1 mi = 5280 ft and 1 ft = 0.3048 m.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'average speed in m/s' }),
      num('dkm', ($) => $.dkm, 'km', { label: 'distance in km' }),
    ],
    hints: [
      'Average speed is distance over time. Convert each with a factor that cancels the unit you do not want.',
    ],
    steps: ($) => [
      String.raw`$d = ${$.d}\ \mathrm{mi}\times 1609.344\ \mathrm{m/mi} = ${texNum($.dkm * 1000)}\ \mathrm{m}$`,
      String.raw`$v = d/t = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §1.3, "Converting Nonmetric Units to Metric": 10 mi in 20 min', { d: 10, t: 20 }, { v: 13.4112, dkm: 16.09344 }, {
        note: 'The book uses 1609 m per mile and keeps two significant figures, so it prints 13 m/s. With the exact 1609.344 m the speed is 13.41 m/s.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch1.prefix',
    src: 'OpenStax University Physics Vol. 1 §1.2',
    title: 'Choosing a metric prefix',
    kind: 'conceptual',
    level: 2,
    topics: ['units', 'prefixes'],
    variety: ['unknown', 'representation'],
    vars: {
      c: range(1.2, 9.8, 0.1, ''),
      e: range(10, 16, 1, ''),
    },
    derive: ($) => ({ prefix: [...PREFIXES].reverse().find(([, power]) => power <= $.e + 3)[0] }),
    // By the power of ten: the largest multiple of three that does not pass the mass in grams.
    second: ($) => ({ prefix: PREFIXES.find(([, power]) => power === Math.floor(($.e + 3) / 3) * 3)[0] }),
    text: (T) => String.raw`A mass is $${T.c}\times 10^{${T.e}}\ \mathrm{kg}$. Restate it with a metric prefix so that the number in front is bigger than 1 and smaller than 1000. A prefix may not be stacked on another, so the kilo in the kilogram has to go first. Which prefix do you use?`,
    parts: [
      mc('prefix', ($) => {
        const right = [...PREFIXES].reverse().find(([, power]) => power <= $.e + 3)[0];
        return PREFIXES.map(([sym, power]) => {
          const val = $.c * 10 ** ($.e + 3 - power);
          const shown = Number(val.toPrecision(3)).toLocaleString('en-US', { maximumFractionDigits: 6 });
          return [
            sym,
            `${sym}- (10^${power})`,
            sym === right ? `Right: with ${sym}- the number is ${shown} ${sym}g, between 1 and 1000.` : `With ${sym}- the number would be ${shown} ${sym}g, which is ${val >= 1000 ? 'too big' : 'less than 1'}. Convert to grams first, then pick the prefix that leaves a number between 1 and 1000.`,
          ];
        });
      }, ($) => $.prefix, { label: 'the prefix' }),
    ],
    hints: [
      'Rewrite the mass in grams first. A prefix cannot sit on top of kilo.',
      'The prefixes go in steps of 10³: kilo 10³, mega 10⁶, giga 10⁹, tera 10¹², peta 10¹⁵, exa 10¹⁸. Choose the one that leaves a number between 1 and 1000.',
    ],
    steps: ($) => {
      const d = [...PREFIXES].reverse().find(([, power]) => power <= $.e + 3);
      return [
        String.raw`$${$.c}\times10^{${$.e}}\ \mathrm{kg} = ${$.c}\times10^{${$.e + 3}}\ \mathrm{g}$`,
        String.raw`$= ${texNum($.c * 10 ** ($.e + 3 - d[1]))}\ \mathrm{${d[0]}g}$`,
      ];
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §1.2, "Using Metric Prefixes": 1.93 × 10¹³ kg', { c: 1.93, e: 13 }, { prefix: 'P' }, {
        note: 'The book restates it as 19.3 Pg, which is 1.93 × 10¹⁶ g.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch1.uncertainty',
    src: 'OpenStax University Physics Vol. 1 §1.6',
    title: 'Percent uncertainty from repeated weighings',
    topics: ['uncertainty', 'significant-figures'],
    level: 1,
    variety: ['representation'],
    vars: {
      w1: range(2.1, 2.6, 0.1, 'kg'),
      w2: range(2.1, 2.6, 0.1, 'kg'),
      w3: range(2.1, 2.6, 0.1, 'kg'),
      w4: range(2.1, 2.6, 0.1, 'kg'),
    },
    derive: ($) => {
      const all = [$.w1, $.w2, $.w3, $.w4];
      const avg = all.reduce((s, x) => s + x, 0) / 4;
      const delta = (Math.max(...all) - Math.min(...all)) / 2;
      return { avg, delta, pct: (delta / avg) * 100 };
    },
    second: ($) => {
      const sorted = [$.w1, $.w2, $.w3, $.w4].sort((a, b) => a - b);
      const avg = (sorted[0] + sorted[1] + sorted[2] + sorted[3]) / 4;
      const delta = (sorted[3] - sorted[0]) / 2;
      return { avg, delta, pct: 100 * delta / avg };
    },
    valid: ($) => $.delta > 0.01,
    text: (T) => `A shop sells bags of apples. Four bags are weighed on four weeks and read ${T.w1} kg, ${T.w2} kg, ${T.w3} kg and ${T.w4} kg. Take the average as the best value, and half the range as its uncertainty. Find the average, the uncertainty, and the percent uncertainty.`,
    parts: [
      num('avg', ($) => $.avg, 'kg', { label: 'average mass' }),
      num('delta', ($) => $.delta, 'kg', { label: 'uncertainty, half the range' }),
      num('pct', ($) => $.pct, '', { label: 'percent uncertainty (%)', abs: 0.1 }),
    ],
    hints: [
      'The percent uncertainty compares the uncertainty with the value: δA divided by A, times 100.',
    ],
    steps: ($) => [
      String.raw`$A = ${texNum($.avg)}\ \mathrm{kg}$, $\delta A = (\max-\min)/2 = ${texNum($.delta)}\ \mathrm{kg}$`,
      String.raw`$\delta A/A\times 100\% = ${texNum($.pct)}\%$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §1.6, "A Bag of Apples": 4.8, 5.3, 4.9, 5.4 (the book weighs in lb)', { w1: 4.8, w2: 5.3, w3: 4.9, w4: 5.4 }, { avg: 5.1, delta: 0.3, pct: 5.88235 }, {
        note: 'The book prints 5.9 %, rounded to 6 %.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch1.dimensions',
    src: 'OpenStax University Physics Vol. 1 §1.4',
    title: 'Is the equation dimensionally consistent?',
    kind: 'conceptual',
    level: 1,
    topics: ['units', 'dimensional-analysis'],
    variety: ['configuration', 'representation'],
    vars: {
      eq: choice([1, EQUATIONS[1].text], [2, EQUATIONS[2].text], [3, EQUATIONS[3].text], [4, EQUATIONS[4].text]),
    },
    derive: ($) => ({ ok: EQUATIONS[$.eq].ok ? 'yes' : 'no' }),
    second: ($) => ({ ans: consistent(EQUATIONS[$.eq]) ? 'yes' : 'no' }),
    text: (T) => String.raw`The quantities have dimensions $[s] = \mathrm{L}$, $[v] = \mathrm{L\,T^{-1}}$, $[a] = \mathrm{L\,T^{-2}}$ and $[t] = \mathrm{T}$. Is this equation dimensionally consistent? $${T.eq}$`,
    parts: [
      mc('ans', ($) => {
        const eq = EQUATIONS[$.eq];
        return [
          ['yes', 'Yes, it is consistent', eq.ok ? `Right: ${eq.why}` : `Look again: ${eq.why}`],
          ['no', 'No, it is not', eq.ok ? `It is consistent: ${eq.why}` : `Right: ${eq.why}`],
        ];
      }, ($) => $.ok, { label: 'dimensional consistency' }),
    ],
    hints: [
      'Every term added together must have the same dimension, and so must the two sides of an equals sign. Write each term in L and T.',
      'The argument of a sine, an exponential or a logarithm must be dimensionless, and so is the function’s value.',
    ],
    steps: ($) => [String.raw`${EQUATIONS[$.eq].why}`],
    cases: [
      kase('OpenStax University Physics Vol. 1 §1.4, "Checking Equations for Dimensional Consistency" (a)', { eq: 1 }, { ans: 'yes' }),
      kase('OpenStax University Physics Vol. 1 §1.4, "Checking Equations for Dimensional Consistency" (b)', { eq: 2 }, { ans: 'no' }),
      kase('OpenStax University Physics Vol. 1 §1.4, "Checking Equations for Dimensional Consistency" (c)', { eq: 3 }, { ans: 'no' }),
    ],
  }),

  problem({
    ...U,
    id: 'ch1.fermi',
    src: 'OpenStax University Physics Vol. 1 §1.5',
    title: 'Estimating the mass of the oceans',
    topics: ['estimation', 'units'],
    level: 2,
    variety: ['unknown'],
    vars: {
      d: range(10, 14, 1, 'Mm', 1e6),
      D: range(2, 5, 1, 'km', 1e3),
    },
    derive: ($) => {
      // Ocean surface ≈ the surface of the planet, a sphere of diameter d: A = π d². Mass = ρ A D.
      const M = 1000 * Math.PI * $.d * $.d * $.D;
      return { M, n: Math.log10(M) };
    },
    second: ($) => {
      // The sphere's area from the radius, 4π r², then the same product.
      const r = $.d / 2;
      const M = 1000 * (4 * Math.PI * r * r) * $.D;
      return { M, n: Math.log10(M) };
    },
    text: (T) => `Estimate the mass of Earth’s oceans. Treat Earth as a sphere of diameter ${T.d} Mm, cover all of its surface with water an average ${T.D} km deep, and use a density of 1000 kg/m³. Find the mass, and the power of ten it is closest to.`,
    parts: [
      num('M', ($) => $.M, 'kg', { label: 'mass of the oceans', tol: 0.03 }),
      num('n', ($) => $.n, '', { label: 'order of magnitude, the n in 10ⁿ kg', abs: 0.5 }),
    ],
    hints: [
      'Mass is density times volume. The volume is the surface area times the average depth.',
      String.raw`The surface area of a sphere of diameter $d$ is $\pi d^2$.`,
    ],
    steps: ($) => [
      String.raw`$A = \pi d^2 = ${texNum(Math.PI * $.d * $.d)}\ \mathrm{m^2}$, $V = AD = ${texNum(Math.PI * $.d * $.d * $.D)}\ \mathrm{m^3}$`,
      String.raw`$M = \rho V = ${texNum($.M)}\ \mathrm{kg}$, about $10^{${Math.round($.n)}}\ \mathrm{kg}$`,
    ],
    cases: [
      kase('OpenStax University Physics Vol. 1 §1.5, "Mass of Earth’s Oceans": d = 10 Mm, D = 3 km', { d: 10, D: 3 }, { M: 9.42478e20, n: 20.9743 }, {
        note: 'The book rounds π to 3 and prints 9 × 10²⁰ kg, then says the order of magnitude is 10²¹ kg. The unrounded product is 9.42 × 10²⁰ kg.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch1.sigfigs',
    src: 'OpenStax University Physics Vol. 1 §1.6',
    title: 'How many digits to keep',
    kind: 'conceptual',
    level: 1,
    topics: ['significant-figures'],
    variety: ['configuration'],
    vars: {
      sum: choice(
        [1, '0.0620 m × 8.5 m'],
        [2, '4.07 m × 0.85 m'],
        [3, '12.4 m × 3.1 m'],
        [4, '125.4 m + 0.62 m'],
        [5, '56.78 m + 0.9 m'],
        [6, '120.0 m − 0.46 m'],
      ),
    },
    derive: ($) => {
      const row = SUMS[$.sum];
      return { right: round(row.exact, row) };
    },
    second: ($) => ({ ans: round(SUMS[$.sum].exact, SUMS[$.sum]) }),
    text: (T) => `A calculator shows the result of ${T.sum}. Which answer is written with the right number of digits?`,
    parts: [
      mc('ans', ($) => {
        const row = SUMS[$.sum];
        const good = round(row.exact, row);
        const ugly = String(Number(row.exact.toFixed(4)));
        const other = row.kind === 'mul' ? row.exact.toFixed(row.dp) : String(Number(row.exact.toPrecision(row.sf)));
        const more = row.kind === 'mul' ? String(Number(row.exact.toPrecision(row.sf + 1))) : row.exact.toFixed(row.dp + 1);
        const rule = row.kind === 'mul'
          ? 'A product keeps as many significant figures as the factor with the fewest. The decimal places of the factors do not decide it.'
          : 'A sum keeps as many decimal places as the term with the fewest. The significant figures of the terms do not decide it.';
        return dedupe([
          [good, good, `Right: ${rule}`],
          [ugly, ugly, 'That copies the calculator. The inputs are known to fewer digits than that, and the result cannot be more precise than they are.'],
          [other, other, `That applies the wrong rule. ${rule}`],
          [more, more, `That keeps one digit too many: ${rule}`],
        ]);
      }, ($) => $.right, { label: 'the result' }),
    ],
    hints: [
      'A product and a quotient keep the fewest significant figures. A sum and a difference keep the fewest decimal places.',
      'Work out which rule applies, find the limiting number, and round the calculator’s result to that.',
    ],
    steps: ($) => {
      const row = SUMS[$.sum];
      return [
        String.raw`The calculator gives $${Number(row.exact.toFixed(4))}$.`,
        row.kind === 'mul'
          ? String.raw`A product keeps ${row.sf} significant figures, so the result is $${round(row.exact, row)}$.`
          : String.raw`A sum keeps ${row.dp} decimal place${row.dp === 1 ? '' : 's'}, so the result is $${round(row.exact, row)}$.`,
      ];
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §1.6, "Significant Figures": a product keeps the fewest significant figures', { sum: 3 }, { ans: '38' }),
      kase('OpenStax University Physics Vol. 1 §1.6, "Significant Figures": a sum keeps the fewest decimal places', { sum: 4 }, { ans: '126.0' }),
    ],
  }),
];

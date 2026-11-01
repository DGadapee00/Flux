import { simpson } from '@flux/subjects/math/quadrature.js';
import { numericFamily, formulaFamily, conceptFamily, cf, fr, frTex, sum } from './rework-kit.js';
const E = (p) => `MIT OCW 18.01SC, Fall 2010, ${p}`,
  F = 'Final Exam Solutions, problem 14',
  exam = 'c6';
/** a+ar+ar²+⋯ with its first three terms written out. */
const geo = (a, r) => {
  const t = (k) => {
    const v = a * r ** k,
      txt = fr(Math.abs(v));
    return `${k ? (v < 0 ? '−' : '+') : ''}${txt}`;
  };
  return {
    ask: `Find ${t(0)}${t(1)}${t(2)}${r < 0 ? t(3) : ''}+⋯.`.replace('+⋯', r < 0 ? '+⋯' : '+⋯'),
    answer: a / (1 - r),
    second: () => {
      let s = 0;
      for (let n = 0; n < 200; n++) s += a * r ** n;
      return s;
    },
    reason: `The first term is ${a} and the common ratio ${fr(r)}. Since |r|<1 the remainder vanishes: ${a}/(1−(${fr(r)}))=${fr(a / (1 - r))}.`,
    traps: [
      r < 0 ? [a / (1 + r), 'That discards the alternating signs and sums a different series.'] : [a, 'That is the first term, not the infinite total.'],
      [r < 0 ? a + a * r : a * r, r < 0 ? 'That retains only the first pair and omits every later pair.' : 'That is the second term, not the sum.'],
    ],
  };
};
/** ∫₀^c of sin(x²), cos(x²) or e^(−x²) by its integrand series: two terms, three terms, or the bound from the next. */
const seriesForm = (fn, c, what) => {
  const terms = {
    sin: [[1, 2], [-1 / 6, 6], [1 / 120, 10], [-1 / 5040, 14]],
    cos: [[1, 0], [-1 / 2, 4], [1 / 24, 8], [-1 / 720, 12]],
    exp: [[1, 0], [-1, 2], [1 / 2, 4], [-1 / 6, 6]],
  }[fn];
  const name = { sin: 'sin(x²)', cos: 'cos(x²)', exp: 'e^(−x²)' }[fn],
    I = ([k, p]) => (k * c ** (p + 1)) / (p + 1),
    raw = ([k, p]) => k * c ** p,
    two = I(terms[0]) + I(terms[1]),
    three = two + I(terms[2]),
    upper = c === 1 ? '1' : `(${fr(c)})`;
  if (what === 'bound')
    return {
      ask: `For the two-term approximation to ∫₀^${upper} ${name} dx, give the alternating bound from the first omitted integral contribution.`,
      answer: Math.abs(I(terms[2])),
      second: () => Math.abs(simpson((x) => terms[2][0] * x ** terms[2][1], 0, c)),
      reason: `The next integrand term is ${fr(terms[2][0])}x^${terms[2][1]}. Its integral, ${Math.abs(I(terms[2])).toPrecision(3)}, bounds the alternating tail.`,
      traps: [
        [Math.abs(raw(terms[2])), 'That is the omitted term before integrating its power over the interval.'],
        [Math.abs(I(terms[1])), 'That is the magnitude of the last retained integral term, not the first omitted one.'],
      ],
    };
  if (what === 'three')
    return {
      ask: `Use the first three nonzero ${fn === 'exp' ? 'exponential' : fn === 'sin' ? 'sine' : 'cosine'}-series terms to approximate ∫₀^${upper} ${name} dx.`,
      answer: three,
      second: () => simpson((x) => terms.slice(0, 3).reduce((u, [k, p]) => u + k * x ** p, 0), 0, c),
      reason: `The added integrand term is ${fr(terms[2][0])}x^${terms[2][1]}, whose integral is ${I(terms[2]).toPrecision(3)}.`,
      traps: [
        [two + raw(terms[2]), `The new power needs division by ${terms[2][1] + 1} when integrated.`],
        [two - I(terms[2]), 'The third nonzero term has the opposite sign to the second.'],
      ],
    };
  return {
    ask: `Use the first two nonzero ${fn === 'exp' ? 'exponential' : fn === 'sin' ? 'sine' : 'cosine'}-series terms to approximate ∫₀^${upper} ${name} dx.`,
    answer: two,
    second: () => simpson((x) => terms.slice(0, 2).reduce((u, [k, p]) => u + k * x ** p, 0), 0, c),
    reason: `Substitute x² into the series, then integrate ${fr(terms[0][0])}x^${terms[0][1]}${terms[1][0] < 0 ? '' : '+'}${fr(terms[1][0])}x^${terms[1][1]} term by term.`,
    traps: [
      [I(terms[0]), 'That keeps only the first nonzero term.'],
      [raw(terms[0]) + raw(terms[1]), 'The substituted powers still need integration over the interval.'],
    ],
  };
};
const num = (id, ch, title, topics, forms, hints, level = 2, tol = 0.005) =>
  numericFamily({ id: 'c6.' + id, exam, ch, title, topics, forms, hints, level, tol });
const B = [
  num(
    'limits',
    '4',
    'Transform the indeterminate form first',
    ["l'hôpital"],
    {
      power: {
        source: E('Session 90, limit of x^(1/x)'),
        params: { k: [1, 2, 3, 5] },
        make: ({ k }) => ({
          ask: `Find lim x^(${k}/x) as x→+∞.`,
          answer: 1,
          second: () => Math.exp((k * Math.log(1e12)) / 1e12),
          reason: `Take logarithms. The exponent ${k}ln x/x has derivative ratio ${k}/x, tending to zero. Exponentiate that limit: e⁰=1.`,
          traps: [
            [0, 'That is the limit of the logarithm, not of the original power.'],
            [Math.E ** k, 'The exponent tends to zero, not to the constant in front.'],
          ],
        }),
      },
      compound: {
        params: { a: [1, 2, 3, -1], b: [1, 2, 3] },
        make: ({ a, b }) => ({
          ask: `Find lim (1${a < 0 ? '−' : '+'}${Math.abs(a)}/x)^(${b === 1 ? '' : b}x) as x→+∞.`,
          answer: Math.exp(a * b),
          second: () => Math.exp(b * 1e7 * Math.log1p(a / 1e7)),
          reason: `The form is 1^∞. The logarithm ${b}x·ln(1+${a}/x) is a 0·∞ form; rewrite it as a quotient and apply L'Hôpital to get ${a * b}. The limit is e^${a * b}.`,
          traps: [
            [1, 'A base tending to one does not settle a power whose exponent grows without bound.'],
            [Math.exp(a), `The exponent ${b}x scales the logarithm's limit by ${b}.`],
          ],
        }),
      },
      growth: {
        source: E('Session 88(b), Limits at Infinity'),
        params: { n: [1, 2, 3], k: [1, 2, 0.5] },
        make: ({ n, k }) => ({
          ask: `Find lim x${['', '', '²', '³'][n]}/e^(${k === 1 ? '' : fr(k)}x) as x→+∞.`,
          answer: 0,
          second: () => 300 ** n * Math.exp(-k * 300),
          reason: `The quotient has the ∞/∞ form. ${n === 1 ? 'One' : n === 2 ? 'Two' : 'Three'} rounds of L'Hôpital leave a constant over a growing exponential, which tends to zero.`,
          traps: [
            [1, 'Equal-looking infinities need not have equal growth rates.'],
            [n / k, 'One round of the rule does not finish: the ratio still depends on x and tends to zero.'],
          ],
        }),
      },
      zero: {
        params: { a: [1, 2, 3, 5], b: [1, 2, 3, 4] },
        make: ({ a, b }) => ({
          ask: `Find lim (e^(${a === 1 ? '' : a}x)−1)/(${b === 1 ? '' : b}x) as x→0.`,
          answer: a / b,
          second: () => Math.expm1(a * 1e-7) / (b * 1e-7),
          reason: `Both parts vanish at zero: a 0/0 form. Differentiate each: ${a}e^(${a}x)/${b} tends to ${fr(a / b)}.`,
          traps: [
            [0, 'Substituting zero gives 0/0, an indeterminate form, not the value zero.'],
            [b / a, 'The derivative ratio is top over bottom, not bottom over top.'],
          ],
        }),
      },
    },
    [
      'Confirm the limiting form before using a derivative rule.',
      'A variable exponent needs a logarithm; a quotient requires separate numerator and denominator derivatives.',
    ],
  ),
  num(
    'improper',
    'v2.3',
    'Take a limit at every bad endpoint',
    ['improper'],
    {
      tail: {
        source: E('Session 91, Integrating 1/(5x+2)² from 1 to infinity'),
        params: { a: [5, 1, 2, 3, 4], b: [2, 1, 3, 0] },
        make: ({ a, b }) => ({
          ask: `Evaluate ∫₁^∞ dx/(${a === 1 ? 'x' : `${a}x`}${b ? `+${b}` : ''})².`,
          answer: 1 / (a * (a + b)),
          second: () => simpson((u) => 1 / (a + b * u) ** 2, 0, 1),
          reason: `At cutoff c the integral is 1/(${a}·${a + b})−1/[${a}(${a}c+${b})]. The second route sets u=1/x on the whole integral.`,
          traps: [
            [1 / (a + b), `The substitution needs dx=du/${a}.`],
            [a === 1 && b === 0 ? 2 : 1 / (a * a), `That is the comparison integral of 1/(${a * a}x²), not the exact shifted integrand.`],
          ],
        }),
      },
      nearzero: {
        params: { p: [0.5, 1 / 3, 2 / 3, 0.25, 0.75], c: [1, 4, 8] },
        make: ({ p, c }) => {
          const q = 1 - p;
          return {
            ask: `Evaluate ∫₀^${c} x^(−${fr(p)}) dx as an improper integral.`,
            answer: c ** q / q,
            // Second route: x=u^(1/q) makes the integrand the constant 1/q on [0, c^q].
            second: () => simpson(() => 1 / q, 0, c ** q),
            reason: `Integrate from a>0: x^${fr(q)}/${fr(q)}. As a decreases to zero, a^${fr(q)} vanishes because ${fr(q)}>0. The substitution x=u^${fr(1 / q)} gives the same value with a constant integrand.`,
            traps: [
              [c, 'That replaces the varying height by one throughout the interval.'],
              [c ** q * q, `The power rule divides by the new exponent ${fr(q)}; it does not multiply by it.`],
            ],
          };
        },
      },
      exponential: {
        params: { k: [1, 2, 3, 0.5], m: [0, 1] },
        make: ({ k, m }) => ({
          ask: `Evaluate ∫₀^∞ ${m ? 'x' : ''}e^(−${k === 1 ? '' : fr(k)}x) dx.`,
          answer: m ? 1 / (k * k) : 1 / k,
          second: () => simpson((x) => x ** m * Math.exp(-k * x), 0, 60 / k),
          reason: m ? `By parts up to cutoff c: [−x e^(−${fr(k)}x)/${fr(k)}] plus the integral of e^(−${fr(k)}x)/${fr(k)}. The boundary term vanishes as c grows, leaving 1/${fr(k * k)}.` : `Up to cutoff c the integral is (1−e^(−${fr(k)}c))/${fr(k)}, which tends to 1/${fr(k)}.`,
          traps: [
            [m ? 1 / k : k, m ? 'The parts step divides by the rate a second time.' : 'Integrating e^(−kx) divides by k; it does not multiply.'],
            [0, 'The integrand is positive throughout, so the area cannot be zero.'],
          ],
        }),
      },
    },
    [
      'Replace each improper endpoint by a finite cutoff first.',
      'Transform the differential and both limits together.',
    ],
    3,
  ),
  num(
    'geometric',
    'v2.5',
    'A finite sum before an infinite one',
    ['series'],
    {
      positive: {
        source: E('Session 94, Summing the Geometric Series, part (c)'),
        params: { a: [1, 2, 3, 5], r: [0.5, 1 / 3, 0.25, 2 / 3, 0.75, 0.2] },
        make: ({ a, r }) => geo(a, r),
      },
      alternating: {
        params: { a: [1, 2, 3, 4], r: [-0.5, -1 / 3, -0.25, -2 / 3, -0.75, -0.2] },
        make: ({ a, r }) => geo(a, r),
      },
    },
    [
      'Keep the sign of the common ratio.',
      'Identify the finite-sum remainder before taking an infinite limit.',
    ],
    1,
  ),
  num(
    'ratio',
    'v2.5',
    'Cancel factorials before the limit',
    ['series'],
    {
      factorial: {
        source: E('Session 95(b), Using the Ratio Test'),
        params: { c: [1, 2, 3, 4, 5, 8] },
        make: ({ c }) => ({
          ask: `For aₙ=${c === 1 ? '' : `${c}ⁿ`}(n!)²/(2n)!, find lim |aₙ₊₁/aₙ|.`,
          answer: c / 4,
          second: () => (c * 10000001) / (2 * 20000001),
          reason: `The ratio simplifies to ${c === 1 ? '' : `${c}·`}(n+1)/[2(2n+1)], tending to ${fr(c / 4)}.${c > 4 ? ' That exceeds one, so the series diverges.' : c === 4 ? ' The test is inconclusive at exactly one.' : ''}`,
          traps: [
            [c / 2, 'The doubled factorial contributes two new factors, not one.'],
            [c, 'Retain both new denominator factors when canceling the old factorials.'],
          ],
        }),
      },
      exponential: {
        source: E('Session 95(c), absolute-ratio form'),
        params: { a: [3, 2, 5, 10] },
        make: ({ a }) => ({
          ask: `For aₙ=(−${a})ⁿ/n!, find lim |aₙ₊₁/aₙ|.`,
          answer: 0,
          second: () => a / (1e10 + 1),
          reason: `The absolute ratio is ${a}/(n+1), tending to zero. The resulting series converges absolutely.`,
          traps: [
            [a, 'The new factorial factor n+1 is missing.'],
            [-a, 'The requested absolute ratio is nonnegative; its denominator also grows.'],
          ],
        }),
      },
      power: {
        params: { a: [0.5, 2, 3, 1 / 3], p: [1, 2, 3] },
        make: ({ a, p }) => ({
          ask: `For aₙ=${frTex(a).replace(/\\tfrac\{(\d+)\}\{(\d+)\}/, '($1/$2)')}ⁿ/n${['', '', '²', '³'][p]}, find lim |aₙ₊₁/aₙ|.`,
          answer: a,
          second: () => a * (1e7 / (1e7 + 1)) ** p,
          reason: `The ratio is ${fr(a)}·(n/(n+1))^${p}. The power factor tends to one, so the limit is ${fr(a)}.`,
          traps: [
            [0, 'The polynomial factor only tends to one; it does not kill the geometric ratio.'],
            [a ** p, 'The exponent on n belongs to the polynomial factor, not to the ratio.'],
          ],
        }),
      },
    },
    [
      'Expand only the newly added factorial factors.',
      'For signed terms, apply the ratio test to their magnitudes.',
    ],
    3,
  ),
  formulaFamily({
    id: 'c6.polynomial',
    exam,
    ch: 'v2.6',
    title: 'An order is a degree, not a term count',
    topics: ['taylor', 'symbolic'],
    hints: [
      'Find the derivative pattern at the centre.',
      'Retain all powers up to the requested degree, including zero coefficients.',
    ],
    forms: {
      log: {
        source: E(F + '(a,c)'),
        params: { a: [1, 2, 3, 0.5], d: [2, 3] },
        make: ({ a, d }) => ({
          ask: `Give the degree-${d === 2 ? 'two' : 'three'} Maclaurin polynomial for ln(1+${a === 1 ? '' : fr(a)}x).`,
          key: sum(...Array.from({ length: d }, (_, j) => [((j % 2 ? -1 : 1) * a ** (j + 1)) / (j + 1), `x^${j + 1}`])),
          get: (x) => Array.from({ length: d }, (_, j) => ((j % 2 ? -1 : 1) * (a * x) ** (j + 1)) / (j + 1)).reduce((u, v) => u + v, 0),
          second: (x) => simpson((t) => Array.from({ length: d }, (_, j) => a * (-a * t) ** j).reduce((u, v) => u + v, 0), 0, x),
          reason: `Integrate the first ${d} terms of the derivative’s geometric series, ${fr(a)}(1−${fr(a)}x+⋯).`,
          alt: sum(...Array.from({ length: d }, (_, j) => [((j % 2 ? -1 : 1) * a ** (j + 1)) / (j + 1), `x^${j + 1}`]).reverse()),
          wrong: sum(...Array.from({ length: d }, (_, j) => [a ** (j + 1) / (j + 1), `x^${j + 1}`])),
          sample: [-0.4 / a, 0.4 / a],
        }),
      },
      atan: {
        source: E('Session 100, Operations on Power Series, question 1, first two nonzero terms'),
        params: { a: [5, 1, 2, 3, 4] },
        make: ({ a }) => ({
          ask: `Give the degree-three Maclaurin polynomial for arctan(${a === 1 ? '' : a}x).`,
          key: sum([a, 'x'], [-(a ** 3) / 3, 'x^3']),
          get: (x) => a * x - (a ** 3 * x ** 3) / 3,
          second: (x) => simpson((t) => a * (1 - a * a * t * t), 0, x),
          reason: `Expand ${a}/(1+${a * a}x²), then integrate ${a}−${a ** 3}x². The value at zero fixes the constant.`,
          alt: `${a}*x*(1-${a * a}*x^2/3)`,
          wrong: sum([a, 'x'], [-(a ** 2) / 3, 'x^3']),
        }),
      },
      exp: {
        params: { a: [1, 2, 3, -1, -2] },
        make: ({ a }) => ({
          ask: `Give the degree-three Maclaurin polynomial for e^(${a === 1 ? '' : a === -1 ? '−' : a}x).`,
          key: sum([1, ''], [a, 'x'], [(a * a) / 2, 'x^2'], [a ** 3 / 6, 'x^3']),
          get: (x) => 1 + a * x + (a * a * x * x) / 2 + (a ** 3 * x ** 3) / 6,
          second: (x) => 1 + simpson((t) => a * (1 + a * t + (a * a * t * t) / 2), 0, x),
          reason: `Every derivative brings down ${a}, so the coefficient of xᵏ is ${a}ᵏ/k!.`,
          alt: sum([a ** 3 / 6, 'x^3'], [(a * a) / 2, 'x^2'], [a, 'x'], [1, '']),
          wrong: sum([1, ''], [a, 'x'], [a * a, 'x^2'], [a ** 3, 'x^3']),
        }),
      },
      cos: {
        params: { a: [1, 2, 3, 0.5, 4] },
        make: ({ a }) => ({
          ask: `Give the degree-four Maclaurin polynomial for cos(${a === 1 ? '' : fr(a)}x).`,
          key: sum([1, ''], [-(a * a) / 2, 'x^2'], [a ** 4 / 24, 'x^4']),
          get: (x) => 1 - (a * a * x * x) / 2 + (a ** 4 * x ** 4) / 24,
          second: (x) => 1 + simpson((t) => -(a * a) * t + (a ** 4 * t ** 3) / 6, 0, x),
          reason: 'Cosine is even, so only even powers appear. Replace x by the scaled argument in 1−x²/2+x⁴/24.',
          alt: sum([a ** 4 / 24, 'x^4'], [-(a * a) / 2, 'x^2'], [1, '']),
          wrong: sum([1, ''], [-(a * a), 'x^2'], [a ** 4, 'x^4']),
        }),
      },
    },
  }),
  num(
    'integrate-series',
    'v2.6',
    'A non-elementary integral from a series',
    ['taylor'],
    {
      two: {
        source: E('Session 100, Operations on Power Series, question 2, two-term approximation'),
        params: { fn: ['sin', 'cos', 'exp'], c: [1, 0.5, 0.8, 0.6] },
        make: ({ fn, c }) => seriesForm(fn, c, 'two'),
      },
      three: {
        params: { fn: ['sin', 'cos', 'exp'], c: [1, 0.5, 0.8, 0.6] },
        make: ({ fn, c }) => seriesForm(fn, c, 'three'),
      },
      bound: {
        params: { fn: ['sin', 'cos', 'exp'], c: [1, 0.5, 0.8, 0.6] },
        make: ({ fn, c }) => seriesForm(fn, c, 'bound'),
      },
    },
    [
      'Change the powers before integrating term by term.',
      'Integrate each monomial, then control the first omitted contribution.',
    ],
    3,
    1e-5,
  ),
  num(
    'radius',
    'v2.6',
    'Find a radius before testing endpoints',
    ['series'],
    {
      standard: {
        source: E('Session 97, Finding the Radius of Convergence'),
        params: { a: [1, 2, 3, 0.5, 5], p: [1, 2] },
        make: ({ a, p }) => ({
          ask: `Find the radius of convergence of ∑ₙ₌₁^∞ xⁿ/(${a === 1 ? '' : `${fr(a).replace(/^(\d+)\/(\d+)$/, '($1/$2)')}ⁿ·`}n${p === 2 ? '²' : ''}).`,
          answer: a,
          second: () => a * ((1e7 + 1) / 1e7) ** p,
          reason: `The ratio limit is |x|/${fr(a)}; the power of n tends to one. The strict condition is |x|<${fr(a)}.`,
          traps: [
            [0, 'The term limit alone does not determine a power-series radius.'],
            [2 * a, 'That is the width between the two boundary points, not the radius.'],
          ],
        }),
      },
      nonlinear: {
        params: { c: [2, 1, -1, 3], b: [3, 2, 5, 4] },
        make: ({ c, b }) => ({
          ask: `Find the radius of convergence about x=${c < 0 ? `−${-c}` : c} of ∑ₙ₌₁^∞ [(x${c < 0 ? '+' : '−'}${Math.abs(c)})²/${b}]ⁿ/n.`,
          answer: Math.sqrt(b),
          second: () => Math.sqrt((b * (1e7 + 1)) / 1e7),
          reason: `The ratio limit is |x${c < 0 ? '+' : '−'}${Math.abs(c)}|²/${b}. Solving its strict inequality gives distance less than √${b} from the centre.`,
          traps: [
            [Math.abs(c) === Math.sqrt(b) ? b + 1 : Math.abs(c), 'That is the centre, not the radius.'],
            [b, 'That drops the square on the displacement when solving the radius inequality.'],
          ],
        }),
      },
    },
    [
      'Apply the ratio or root test to the complete variable-dependent term.',
      'Solve the strict inequality for distance from the centre; test endpoints separately.',
    ],
  ),
  formulaFamily({
    id: 'c6.sum',
    exam,
    ch: 'v2.6',
    title: 'Operate inside the open convergence interval',
    topics: ['taylor', 'series'],
    hints: [
      'Start from a known geometric or logarithmic series.',
      'The operation is justified inside the radius; endpoints need their own tests.',
    ],
    forms: {
      logarithm: {
        source: E(F + '(a)'),
        params: { a: [1, 2, 3, 0.5], sg: [1, -1] },
        make: ({ a, sg }) => ({
          ask: sg > 0 ? `For |x|<${fr(1 / a)}, sum ∑ₙ₌₁^∞ (−1)^(n+1)${a === 1 ? 'x' : `(${fr(a)}x)`}ⁿ/n.` : `For |x|<${fr(1 / a)}, sum ∑ₙ₌₁^∞ ${a === 1 ? 'x' : `(${fr(a)}x)`}ⁿ/n.`,
          key: sg > 0 ? `ln(1+${fr(a)}*x)` : `-ln(1-${fr(a)}*x)`,
          get: (x) => (sg > 0 ? Math.log1p(a * x) : -Math.log1p(-a * x)),
          second: (x) => simpson((t) => a / (1 + sg * a * t), 0, x) * (sg > 0 ? 1 : 1),
          reason: sg > 0 ? `Integrate ${fr(a)}(1−${fr(a)}x+⋯) from zero. The initial value fixes the integration constant.` : `Integrate ${fr(a)}(1+${fr(a)}x+⋯) from zero: the result is −ln(1−${fr(a)}x).`,
          alt: sg > 0 ? `ln(${fr(a)}*x+1)` : `ln(1/(1-${fr(a)}*x))`,
          wrong: sg > 0 ? `1/(1+${fr(a)}*x)` : `ln(1-${fr(a)}*x)`,
          at: 0.3 / a,
          sample: [-0.8 / a, 0.8 / a],
        }),
      },
      differentiated: {
        params: { a: [1, 2, 3, 0.5], kind: ['d', 'g'] },
        make: ({ a, kind }) => ({
          ask: kind === 'd' ? `For |x|<${fr(1 / a)}, sum ∑ₙ₌₁^∞ n·${a === 1 ? '' : `${fr(a).replace(/^(\d+)\/(\d+)$/, '($1/$2)')}ⁿ`}x^(n−1).` : `For |x|<${fr(1 / a)}, sum ∑ₙ₌₀^∞ ${a === 1 ? 'x' : `(${fr(a)}x)`}ⁿ.`,
          key: kind === 'd' ? `${fr(a)}/(1-${fr(a)}*x)^2` : `1/(1-${fr(a)}*x)`,
          get: (x) => (kind === 'd' ? a / (1 - a * x) ** 2 : 1 / (1 - a * x)),
          second: (x) => {
            let s = 0;
            for (let n = 0; n <= 400; n++) s += kind === 'd' ? (n ? n * a ** n * x ** (n - 1) : 0) : (a * x) ** n;
            return s;
          },
          reason: kind === 'd' ? `Differentiate the geometric series ∑(${fr(a)}x)ⁿ=1/(1−${fr(a)}x) within its open radius.` : `A geometric series with ratio ${fr(a)}x sums to 1/(1−ratio) while |ratio|<1.`,
          alt: kind === 'd' ? `${fr(a)}*(1-${fr(a)}*x)^(-2)` : `(1-${fr(a)}*x)^(-1)`,
          wrong: kind === 'd' ? `1/(1-${fr(a)}*x)` : `1/(1+${fr(a)}*x)`,
          at: 0.3 / a,
          sample: [-0.8 / a, 0.8 / a],
        }),
      },
    },
  }),
  num(
    'remainder',
    'v2.6',
    'A bound is not the actual error',
    ['taylor'],
    {
      symmetric: {
        source: E(F + '(d)'),
        params: { h: [0.5, 0.25, 1 / 3], d: [2, 1, 3] },
        make: ({ h, d }) => {
          const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1)),
            M = fact(d) / (1 - h) ** (d + 1),
            bound = (M * h ** (d + 1)) / fact(d + 1);
          return {
            ask: `For ln(1+x), use degree ${d} and M=${fr(M)} bounding |f^(${d + 1})| on [−${fr(h)},${fr(h)}]. What Taylor bound follows at x=${fr(h)}?`,
            answer: bound,
            second: () => (M * Math.abs(h) ** (d + 1)) / fact(d + 1),
            reason: `Use M|x|^${d + 1}/${d + 1}!. Here M is the largest |f^(${d + 1})|=${fact(d)}/(1+x)^${d + 1} on the interval, reached at its left end.`,
            traps: [
              [M * h ** (d + 1), `The factorial denominator ${d + 1}! is missing.`],
              [(M * h ** d) / fact(d), 'That uses the last retained degree, not the next one.'],
            ],
          };
        },
      },
      sine: {
        params: { fn: ['sin', 'cos'], x: [0.5, 1, 1 / 3, 0.2], k: [3, 2] },
        make: ({ fn, x, k }) => {
          const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1)),
            s = fn === 'sin',
            deg = s ? 2 * k + 1 : 2 * k,
            last = s ? 2 * k - 1 : 2 * k - 2,
            kept = Array.from({ length: k }, (_, j) => (s ? 2 * j + 1 : 2 * j))
              .map((n, j) => `${j ? (j % 2 ? '−' : '+') : ''}${n === 0 ? '1' : n === 1 ? 'x' : `x^${n}/${n}!`}`)
              .join('');
          return {
            ask: `For ${fn}(${fr(x)}), use ${kept}. Give the alternating-series bound from the first omitted term.`,
            answer: x ** deg / fact(deg),
            second: () => {
              let f = 1;
              for (let n = 1; n <= deg; n++) f *= n;
              return x ** deg / f;
            },
            reason: `Term magnitudes decrease at x=${fr(x)}. The first omitted nonzero degree is ${deg}.`,
            traps: [
              [x ** deg, 'The factorial in the omitted coefficient is missing.'],
              [x ** last / fact(last), 'That is the last retained term, not the first omitted term.'],
            ],
          };
        },
      },
    },
    [
      'Choose a remainder theorem and check its hypotheses.',
      'An interval-wide derivative bound and a next-term alternating bound are different methods.',
    ],
    3,
  ),
];
function conceptual(id, ch, title, topics, forms) {
  return conceptFamily({
    id: 'c6.' + id,
    exam,
    ch,
    title,
    topics,
    forms,
    hints: [
      'State the precise convergence or remainder theorem first.',
      'Distinguish a necessary condition, a sufficient condition and an inconclusive equality case.',
    ],
  });
}
B.push(
  conceptual('hypotheses', '4', 'The form is part of the theorem', ["l'hôpital"], {
    ordinary: {
      ask: 'Can L’Hôpital replace (x+1)/(x+2) by 1/1 as x→0?',
      source: 'OpenStax Calculus Volume 1, §4.8, hypotheses of L’Hôpital’s rule',
      options: [
        [
          'No; substitution gives 1/2 and the indeterminate form is absent.',
          'The rule is conditional. Differentiating an ordinary quotient limit can change its value.',
        ],
        [
          'Yes; every quotient can be differentiated top and bottom.',
          'First establish the required zero/zero or infinite/infinite form.',
        ],
        [
          'The quotient rule is required.',
          'Continuity already determines this limit without differentiation.',
        ],
      ],
    },
    power: {
      ask: 'What is the valid first step for x^(1/x) as x→∞?',
      source: E('Session 90, logarithmic transformation'),
      options: [
        [
          'Take a logarithm to get ln x/x.',
          'The original power has an indeterminate form; the quotient rule applies after transformation.',
        ],
        [
          'Differentiate base and exponent separately.',
          'There is no L’Hôpital rule that replaces a variable power this way.',
        ],
        [
          'Declare infinity raised to zero equal to one.',
          'This is an indeterminate form whose growth rates need analysis.',
        ],
      ],
    },
  }),
  conceptual('singular', 'v2.3', 'Cancellation is not ordinary convergence', ['improper'], {
    pole: {
      ask: 'Does the ordinary improper integral ∫₋₁¹ dx/x equal zero by symmetry?',
      source: 'OpenStax Calculus Volume 2, §3.7, separate one-sided improper integrals',
      options: [
        [
          'No; both one-sided integrals diverge. Zero is a symmetric principal value.',
          'Ordinary convergence requires each side to exist finitely before adding them.',
        ],
        [
          'Yes; opposite infinities always cancel.',
          'A difference of divergent quantities does not define the ordinary integral.',
        ],
        [
          'It equals two, the interval width.',
          'Width does not determine an unbounded signed integrand’s integral.',
        ],
      ],
    },
    comparison: {
      ask: 'Can 1/x² prove convergence of ∫₁^∞ dx/(5x+2)² by limit comparison?',
      source: E('Session 92, Confirming an Integral Converges; finite positive comparison ratio'),
      options: [
        [
          'Yes; the ratio tends to 1/25, a finite positive constant.',
          'A positive constant multiple has the same convergence behavior.',
        ],
        [
          'No; the ratio must equal one.',
          'For a convergence verdict, any finite strictly positive ratio suffices.',
        ],
        [
          'Yes; every function tending to zero is integrable.',
          'The function 1/x is a counterexample to that claim.',
        ],
      ],
    },
  }),
  conceptual('termlimit', 'v2.5', 'A necessary condition is not sufficient', ['series'], {
    harmonic: {
      ask: 'The terms 1/n tend to zero. Does ∑1/n converge?',
      source: 'OpenStax Calculus Volume 2, §5.3, harmonic series and integral test',
      options: [
        [
          'No; successive doubled-index blocks each add at least one-half.',
          'Their repeated positive contributions make partial sums unbounded.',
        ],
        ['Yes; zero terms guarantee a finite total.', 'A zero term limit is necessary but not sufficient.'],
        [
          'No; the terms fail to tend to zero.',
          'They do tend to zero; accumulated partial sums cause the divergence.',
        ],
      ],
    },
    conditional: {
      ask: 'How does ∑(−1)^(n+1)/n converge?',
      source: 'OpenStax Calculus Volume 2, §5.5, alternating harmonic series',
      options: [
        [
          'Conditionally; the absolute series is harmonic.',
          'Decreasing magnitudes tending to zero give alternating convergence, while the absolute sum diverges.',
        ],
        ['Absolutely, because terms get small.', 'Removing the signs gives the divergent harmonic series.'],
        [
          'It diverges because all alternating series diverge.',
          'Alternation can enable convergence under the magnitude conditions.',
        ],
      ],
    },
  }),
  conceptual('tests', 'v2.5', 'A test can be inconclusive', ['series'], {
    one: {
      ask: 'The absolute term-ratio limit is one. What does the ratio test establish?',
      source: E('Session 95(a), Using the Ratio Test'),
      options: [
        [
          'No decisive verdict; use another test.',
          'Both ∑1/n and ∑1/n² have ratio limit one but different convergence behavior.',
        ],
        ['Convergence.', 'A strict limit below one is required.'],
        ['Divergence.', 'A strict limit above one is required.'],
      ],
    },
    root: {
      ask: 'Which test is efficient for ∑(n/(2n+1))ⁿ?',
      source: 'OpenStax Calculus Volume 2, §5.6, root-test theorem; original application',
      options: [
        [
          'The root test; the nth root tends to 1/2.',
          'The outer nth power disappears under the root, producing a strict limit below one.',
        ],
        [
          'The term test proves divergence because terms are positive.',
          'Positive terms can form a convergent series.',
        ],
        [
          'The ratio limit must be one because n appears.',
          'The variable’s appearance alone determines no ratio limit.',
        ],
      ],
    },
  }),
  conceptual('endpoints', 'v2.6', 'Endpoints are separate series', ['series'], {
    logarithmic: {
      ask: 'For ∑xⁿ/n with radius one, what happens at the endpoints?',
      source: E('Session 97, radius; added harmonic/alternating endpoint tests'),
      options: [
        [
          'x=−1 converges conditionally; x=1 diverges.',
          'The endpoints become alternating harmonic and harmonic series respectively.',
        ],
        ['Both converge because the radius is one.', 'The radius theorem gives no verdict at equality.'],
        ['Both diverge because the ratio limit is one.', 'At equality the ratio test is inconclusive.'],
      ],
    },
    operation: {
      ask: 'May old endpoint verdicts be reused automatically after differentiating a power series?',
      source: E('Session 100, Operations on Power Series, open-interval hypotheses'),
      options: [
        [
          'No; the radius stays the same, but endpoints need new tests.',
          'Differentiation changes the boundary term sizes.',
        ],
        [
          'Yes; differentiation preserves all endpoint behavior.',
          'Boundary convergence can change after differentiation or integration.',
        ],
        [
          'No termwise operation is ever valid.',
          'The standard theorems justify it inside the open interval.',
        ],
      ],
    },
  }),
  conceptual('equality', 'v2.6', 'A remainder proves Taylor equality', ['taylor'], {
    remainder: {
      ask: 'What proves equality between a function and its Taylor series at x?',
      source: E('Session 98, When Does a Function Equal Its Taylor Series?'),
      options: [
        [
          'The Taylor remainder tends to zero there.',
          'Matching derivatives at the centre alone does not control the remainder elsewhere.',
        ],
        [
          'Having derivatives of all orders is enough.',
          'Smoothness alone does not imply equality to the Taylor series.',
        ],
        [
          'One plotted polynomial looks close.',
          'A finite visual comparison cannot establish an infinite limit.',
        ],
      ],
    },
    bound: {
      ask: 'A Taylor bound is 1/3 while the actual error is about 0.03. Is this inconsistent?',
      source: E(F + '(c,d), symmetric-interval bound'),
      options: [
        [
          'No; the actual error lies below a possibly loose upper bound.',
          'An inequality need not be an equality.',
        ],
        [
          'Yes; a remainder theorem always gives the exact error.',
          'The theorem supplies an inequality or an unknown intermediate-point representation.',
        ],
        [
          'Use the observed error as a universal future bound.',
          'One numerical observation is not a general error guarantee.',
        ],
      ],
    },
  }),
);
export default B;

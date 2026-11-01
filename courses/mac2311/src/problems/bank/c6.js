import { simpson } from '@flux/subjects/math/quadrature.js';
import { numericFamily, formulaFamily, conceptFamily } from './rework-kit.js';
const E = (p) => `MIT OCW 18.01SC, Fall 2010, ${p}`,
  F = 'Final Exam Solutions, problem 14',
  exam = 'c6';
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
        ask: 'Find lim x^(1/x) as x→+∞.',
        answer: 1,
        second: () => Math.exp(0),
        reason:
          'Take logarithms. The exponent ln x/x has derivative ratio 1/x, tending to zero. Exponentiate that limit.',
        source: E('Session 90, limit of x^(1/x)'),
        traps: [
          [0, 'That is the limit of the logarithm, not of the original power.'],
          [Math.E, 'The exponent tends to zero, not one.'],
        ],
      },
      growth: {
        ask: 'Find lim x/eˣ as x→+∞.',
        answer: 0,
        second: () => 750 * Math.exp(-750),
        reason: 'The quotient has the ∞/∞ form. Its derivative ratio is 1/eˣ, tending to zero.',
        source: E('Session 88(b), Limits at Infinity'),
        traps: [
          [1, 'Equal-looking infinities need not have equal growth rates.'],
          [Math.E, 'The derivative ratio still depends on x and tends to zero.'],
        ],
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
        ask: 'Evaluate ∫₁^∞ dx/(5x+2)².',
        answer: 1 / 35,
        second: () => simpson((u) => 1 / (5 + 2 * u) ** 2, 0, 1),
        reason:
          'At cutoff b, the integral is 1/35−1/[5(5b+2)]. The second route sets u=1/x on the whole integral.',
        source: E('Session 91, Integrating 1/(5x+2)² from 1 to infinity'),
        traps: [
          [1 / 7, 'The substitution needs dx=du/5.'],
          [1 / 25, 'That is the comparison integral of 1/(25x²), not the exact shifted integrand.'],
        ],
      },
      nearzero: {
        ask: 'Evaluate ∫₀¹ dx/√x as an improper integral.',
        answer: 2,
        second: () => simpson(() => 2, 0, 1),
        reason:
          'Integrate from a>0, then let a decrease to zero. The independent substitution x=u² makes the integrand two.',
        traps: [
          [1, 'That replaces the varying height by one throughout the interval.'],
          [0.5, 'The power rule divides by the new exponent 1/2.'],
        ],
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
        ask: 'Find 1+1/2+1/4+⋯.',
        answer: 2,
        second: () => {
          let s = 0;
          for (let n = 0; n < 80; n++) s += 2 ** -n;
          return s;
        },
        reason:
          'Subtract r times a finite partial sum before taking its limit. For |r|<1 the remainder vanishes.',
        source: E('Session 94, Summing the Geometric Series, part (c)'),
        traps: [
          [1, 'That is the first term, not the infinite total.'],
          [0.5, 'That is the common ratio, not the sum.'],
        ],
      },
      alternating: {
        ask: 'Find 1−1/2+1/4−1/8+⋯.',
        answer: 2 / 3,
        second: () => {
          let s = 0;
          for (let n = 0; n < 80; n++) s += (-0.5) ** n;
          return s;
        },
        reason: 'The common ratio is −1/2. Thus 1/(1−r)=2/3.',
        traps: [
          [2, 'That discards the alternating signs and sums a different series.'],
          [0.5, 'That retains only the first pair and omits every later pair.'],
        ],
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
        ask: 'For aₙ=(n!)²/(2n)!, find lim |aₙ₊₁/aₙ|.',
        answer: 0.25,
        second: () => 10000001 / (2 * 20000001),
        reason: 'The ratio simplifies to (n+1)/[2(2n+1)], tending to one quarter.',
        source: E('Session 95(b), Using the Ratio Test'),
        traps: [
          [0.5, 'The doubled factorial contributes two new factors, not one.'],
          [1, 'Retain both new denominator factors when canceling the old factorials.'],
        ],
      },
      exponential: {
        ask: 'For aₙ=(−3)ⁿ/n!, find lim |aₙ₊₁/aₙ|.',
        answer: 0,
        second: () => {
          const n = 1e10;
          return 3 / (n + 1);
        },
        reason: 'The absolute ratio is 3/(n+1), tending to zero. The resulting series converges absolutely.',
        source: E('Session 95(c), absolute-ratio form'),
        traps: [
          [3, 'The new factorial factor n+1 is missing.'],
          [-3, 'The requested absolute ratio is nonnegative; its denominator also grows.'],
        ],
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
        ask: 'Give the degree-two Maclaurin polynomial for ln(1+x).',
        key: 'x-x^2/2',
        get: (x) => x - (x * x) / 2,
        second: (x) => simpson((t) => 1 - t, 0, x),
        reason: 'Integrate the first two terms of the derivative’s geometric series, 1−x.',
        source: E(F + '(a,c)'),
        alt: 'x*(1-x/2)',
        wrong: 'x+x^2/2',
      },
      atan: {
        ask: 'Give the degree-three Maclaurin polynomial for arctan(5x).',
        key: '5*x-125*x^3/3',
        get: (x) => 5 * x - (125 * x ** 3) / 3,
        second: (x) => simpson((t) => 5 * (1 - 25 * t * t), 0, x),
        reason: 'Expand 5/(1+25x²), then integrate 5−125x². The value at zero fixes the constant.',
        source: E('Session 100, Operations on Power Series, question 1, first two nonzero terms'),
        alt: '5*x*(1-25*x^2/3)',
        wrong: '5*x-25*x^3/3',
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
        ask: 'Use the first two nonzero sine-series terms to approximate ∫₀¹ sin(x²) dx.',
        answer: 13 / 42,
        second: () => simpson((x) => x * x - x ** 6 / 6, 0, 1),
        reason: 'Substitute x² into the sine series, then integrate x²−x⁶/6. The result is 1/3−1/42.',
        source: E('Session 100, Operations on Power Series, question 2, two-term approximation'),
        traps: [
          [1 / 3, 'That keeps only the first nonzero term.'],
          [1 / 6, 'The substituted powers still need integration over the interval.'],
        ],
      },
      three: {
        ask: 'Use the first three nonzero sine-series terms for the same integral.',
        answer: 13 / 42 + 1 / 1320,
        second: () => simpson((x) => x * x - x ** 6 / 6 + x ** 10 / 120, 0, 1),
        reason: 'The added integrand term is x¹⁰/120, whose integral is 1/1320.',
        traps: [
          [13 / 42 + 1 / 120, 'The new x¹⁰ power needs division by eleven when integrated.'],
          [13 / 42 - 1 / 1320, 'The third nonzero sine term is positive, not negative.'],
        ],
      },
      bound: {
        ask: 'For the two-term approximation to ∫₀¹ sin(x²) dx, give the alternating bound from the first omitted integral contribution.',
        answer: 1 / 1320,
        second: () => simpson((x) => x ** 10 / 120, 0, 1),
        reason: 'The next integrand term is x¹⁰/120. Its integral is 1/1320 and bounds the alternating tail.',
        traps: [
          [1 / 120, 'That is the omitted coefficient before integrating its power over [0,1].'],
          [1 / 42, 'That is the magnitude of the last retained integral term, not the first omitted one.'],
        ],
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
        ask: 'Find the radius of convergence of ∑ₙ₌₁^∞ xⁿ/n.',
        answer: 1,
        second: () => {
          const n = 1e7;
          return (n + 1) / n;
        },
        reason: 'The ratio limit is |x|, so the strict convergence condition is |x|<1.',
        source: E('Session 97, Finding the Radius of Convergence'),
        traps: [
          [0, 'The term limit alone does not determine a power-series radius.'],
          [2, 'That is the width between the two boundary points, not the radius.'],
        ],
      },
      nonlinear: {
        ask: 'Find the radius of convergence about x=2 of ∑ₙ₌₁^∞ [(x−2)²/3]ⁿ/n.',
        answer: Math.sqrt(3),
        second: () => {
          const n = 1e7;
          return Math.sqrt((3 * (n + 1)) / n);
        },
        reason:
          'The ratio limit is |x−2|²/3. Solving its strict inequality gives distance less than √3 from the centre.',
        traps: [
          [2, 'That is the centre, not the radius.'],
          [3, 'That drops the square on x−2 when solving the radius inequality.'],
        ],
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
        ask: 'For |x|<1, sum ∑ₙ₌₁^∞ (−1)^(n+1)xⁿ/n.',
        key: 'ln(1+x)',
        get: Math.log1p,
        second: (x) => simpson((t) => 1 / (1 + t), 0, x),
        reason: 'Integrate 1−x+x²−⋯ from zero. The initial value fixes the integration constant.',
        source: E(F + '(a)'),
        alt: 'ln(x+1)',
        wrong: '1/(1+x)',
      },
      differentiated: {
        ask: 'For |x|<1, sum ∑ₙ₌₁^∞ n x^(n−1).',
        key: '1/(1-x)^2',
        get: (x) => 1 / (1 - x) ** 2,
        second: (x) => {
          let s = 0;
          for (let n = 1; n <= 250; n++) s += n * x ** (n - 1);
          return s;
        },
        reason: 'Differentiate the geometric power series within its open radius.',
        alt: '(1-x)^(-2)',
        wrong: '1/(1-x)',
        at: 0.3,
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
        ask: 'For ln(1+x), use degree two and M=16 bounding |f‴| on [−1/2,1/2]. What Taylor bound follows at x=1/2?',
        answer: 1 / 3,
        second: () => (16 * 0.5 ** 3) / (3 * 2),
        reason: 'Use M|x|³/3!. This symmetric interval intentionally gives a loose bound.',
        source: E(F + '(d)'),
        traps: [
          [2, 'The factorial denominator 3! is missing.'],
          [0.375, 'That is the polynomial approximation, not an error bound.'],
        ],
      },
      sine: {
        ask: 'For sin(1/2), use x−x³/3!+x⁵/5!. Give the alternating-series bound from the first omitted term.',
        answer: 0.5 ** 7 / 5040,
        second: () => {
          let f = 1;
          for (let n = 1; n <= 7; n++) f *= n;
          return 0.5 ** 7 / f;
        },
        reason: 'Term magnitudes decrease at x=1/2. The first omitted nonzero degree is seven.',
        traps: [
          [0.5 ** 7, 'The factorial in the omitted sine coefficient is missing.'],
          [0.5 ** 5 / 120, 'That is the last retained term, not the first omitted term.'],
        ],
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

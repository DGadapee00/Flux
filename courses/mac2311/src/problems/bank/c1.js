import { problem, kase, range } from '../kit.js';
import { numeric, choose, citation, symbolicFamily, conceptFamily } from './rework-kit.js';
const S = (p) => citation(1, p);
const algebra = [
  'Identify the operation joining the functions before differentiating.',
  'Write the derivative of each component separately, then assemble the rule.',
  'Keep the original domain restrictions while simplifying.',
];
const chain = [
  'A composition changes through both the outer and inner functions.',
  'Name the inner function and compute its derivative.',
  'Evaluate the outer derivative at that inner function, then multiply.',
];
const prod = [
  problem({
    id: 'c1.tangent-origin',
    lab: 'secant',
    exam: 'c1',
    ch: '3',
    title: 'Two tangents through a point outside the curve',
    kind: 'numeric',
    topics: ['derivatives'],
    level: 3,
    minVersions: 4,
    variety: ['configuration', 'solution branch'],
    vars: { shape: choose(['shifted', 'centered']), branch: choose([-1, 1]) },
    derive: ($) => {
      const h = $.shape === 'shifted' ? 1 : 0,
        c = $.shape === 'shifted' ? 1 : 4,
        a = $.branch * Math.sqrt(h * h + c);
      return { h, c, a, m: 2 * (a - h) };
    },
    text: (T, $) =>
      String.raw`The curve is $y=(x-${$.h})^2+${$.c}$. Find the ${$.branch > 0 ? 'positive' : 'negative'} contact coordinate $a$ of a tangent passing through the origin, then its slope. The origin is not a contact point.`,
    parts: [
      numeric('a', ($) => $.a, 'contact coordinate a', [
        [
          ($) => $.h,
          'That is the vertex. A horizontal tangent at the vertex does not pass through the origin.',
        ],
        [($) => -$.a, 'This is the other tangent. Check the requested branch.'],
      ]),
      numeric('m', ($) => $.m, 'tangent slope', [
        [($) => $.m / 2, 'The power rule contributes a factor of two when differentiating the square.'],
        [($) => $.a, 'The contact coordinate and the slope have different roles.'],
      ]),
    ],
    hints: [
      'A tangent must both touch the curve and have the curve’s derivative there.',
      'Its line through the origin is y=mx. At contact a, require f(a)=ma and m=f′(a).',
      'Eliminate m, solve for the contact coordinate, then keep the requested sign.',
    ],
    steps: ($) => [
      String.raw`$f(a)=af'(a)$ gives $(a-${$.h})^2+${$.c}=2a(a-${$.h})$.`,
      String.raw`The linear terms cancel: $a^2=${$.h ** 2 + $.c}$. Choose the requested branch, then use $m=2(a-${$.h})$.`,
    ],
    second: ($) => {
      let lo = 0,
        hi = 10;
      for (let i = 0; i < 70; i++) {
        const z = (lo + hi) / 2,
          x = $.branch * z,
          res = (x - $.h) ** 2 + $.c - x * 2 * (x - $.h);
        if (res > 0) lo = z;
        else hi = z;
      }
      const a = ($.branch * (lo + hi)) / 2;
      return { a, m: ((a + 1e-5 - $.h) ** 2 - (a - 1e-5 - $.h) ** 2) / 2e-5 };
    },
    sim: {
      scenario: 'tangent1',
      setup(s, $) {
        s.graphId = $.shape === 'shifted' ? 'tangent1' : 'tangent2';
        s.a = -3;
        s.b = 3;
        s.x0 = $.a;
        s.h = 0.05;
      },
      read: (c, s) => ({ a: s.x0, m: c.fp }),
    },
    cases: [
      kase(
        S('1C-5, positive contact'),
        { shape: 'shifted', branch: 1 },
        { a: Math.sqrt(2), m: 2 * (Math.sqrt(2) - 1) },
      ),
      kase(
        S('1C-5, negative contact'),
        { shape: 'shifted', branch: -1 },
        { a: -Math.sqrt(2), m: -2 * (Math.sqrt(2) + 1) },
      ),
    ],
  }),

  symbolicFamily({
    id: 'c1.chain',
    exam: 'c1',
    ch: '3',
    title: 'Composition, rather than a larger exponent',
    topics: ['derivatives', 'symbolic'],
    hints: chain,
    forms: {
      square: {
        tex: '(x^2+2)^2',
        key: '4*x*(x^2+2)',
        alt: '4*x^3+8*x',
        wrong: '2*(x^2+2)',
        fn: (x) => (x * x + 2) ** 2,
        df: (x) => 4 * x * (x * x + 2),
        source: S('1F-1(a)'),
        reason: 'Differentiate the outer square, then multiply by the inner derivative 2x.',
      },
      power: {
        tex: '(x^2+2)^{100}',
        key: '200*x*(x^2+2)^99',
        alt: '2*x*100*(x^2+2)^99',
        wrong: '100*(x^2+2)^99',
        fn: (x) => (x * x + 2) ** 100,
        df: (x) => 200 * x * (x * x + 2) ** 99,
        source: S('1F-1(b)'),
        reason: 'The exponent changes the outer derivative. The inner derivative remains 2x.',
      },
    },
  }),
  symbolicFamily({
    id: 'c1.product',
    exam: 'c1',
    ch: '3',
    title: 'Products and their expanded checks',
    topics: ['derivatives', 'symbolic'],
    hints: algebra,
    forms: {
      polynomials: {
        tex: '(x^3+x)(x^5+x^2)',
        key: '(3*x^2+1)*(x^5+x^2)+(x^3+x)*(5*x^4+2*x)',
        alt: '8*x^7+6*x^5+5*x^4+3*x^2',
        wrong: '(3*x^2+1)*(5*x^4+2*x)',
        fn: (x) => (x ** 3 + x) * (x ** 5 + x * x),
        df: (x) => 8 * x ** 7 + 6 * x ** 5 + 5 * x ** 4 + 3 * x * x,
        source: S('1E-1(d)'),
        reason:
          'One term differentiates the first factor; the other differentiates the second. Expanding first gives four powers.',
      },
      exponential: {
        tex: 'xe^x',
        key: '(x+1)*exp(x)',
        alt: 'x*exp(x)+exp(x)',
        wrong: 'exp(x)',
        fn: (x) => x * Math.exp(x),
        df: (x) => (x + 1) * Math.exp(x),
        source: S('1I-1(a)'),
        reason: 'Both the linear factor and the exponential change. Add the two product-rule terms.',
      },
    },
  }),
  symbolicFamily({
    id: 'c1.exp-log',
    exam: 'c1',
    ch: '3',
    title: 'An inverse changes its slope',
    topics: ['derivatives', 'symbolic'],
    hints: algebra,
    forms: {
      reciprocal: {
        tex: String.raw`1/\ln x`,
        key: '-1/(x*ln(x)^2)',
        alt: '-ln(x)^(-2)/x',
        wrong: '1/(x*ln(x)^2)',
        domain: 'x>0, x≠1',
        at: 2,
        fn: (x) => 1 / Math.log(x),
        df: (x) => -1 / (x * Math.log(x) ** 2),
        source: S('1I-1(l)'),
        reason:
          'Use the reciprocal rule on ln x, then its derivative 1/x. Squaring the denominator does not remove the minus sign.',
      },
      logarithm: {
        tex: String.raw`\ln(1/x)`,
        key: '-1/x',
        alt: '(-1)*x^(-1)',
        wrong: '1/x',
        domain: 'x>0',
        fn: (x) => Math.log(1 / x),
        df: (x) => -1 / x,
        source: S('1I-1(k)'),
        reason: 'On x>0, ln(1/x)=−ln x. Differentiate that equivalent form.',
      },
      variablePower: {
        tex: 'x^x',
        key: 'x^x*(1+ln(x))',
        alt: 'x^x+x^x*ln(x)',
        wrong: 'x*x^(x-1)',
        domain: 'x>0',
        fn: (x) => x ** x,
        df: (x) => x ** x * (1 + Math.log(x)),
        source: S('1I-1(h)'),
        reason: 'Set y=x^x and take logarithms. Differentiating ln y=x ln x gives y′/y=ln x+1.',
      },
    },
  }),
  symbolicFamily({
    id: 'c1.trig-chain',
    exam: 'c1',
    ch: '3',
    title: 'Radians and nested trigonometry',
    topics: ['derivatives', 'symbolic'],
    hints: chain,
    forms: {
      square: {
        tex: String.raw`\sin(5x^2)`,
        key: '10*x*cos(5*x^2)',
        alt: 'cos(5*x^2)*2*x*5',
        wrong: 'cos(5*x^2)',
        fn: (x) => Math.sin(5 * x * x),
        df: (x) => 10 * x * Math.cos(5 * x * x),
        source: S('1J-1(a)'),
        reason: 'The derivative of the sine is cosine at the same argument. The inner derivative is 10x.',
      },
      sineSquare: {
        tex: String.raw`\sin^2(3x)`,
        key: '6*sin(3*x)*cos(3*x)',
        alt: '3*sin(6*x)',
        wrong: '2*sin(3*x)*cos(3*x)',
        fn: (x) => Math.sin(3 * x) ** 2,
        df: (x) => 6 * Math.sin(3 * x) * Math.cos(3 * x),
        source: S('1J-1(b)'),
        reason:
          'First differentiate the square, then the sine, then the linear argument. The double-angle identity gives an independent rewrite.',
      },
    },
  }),
  symbolicFamily({
    id: 'c1.geometry',
    exam: 'c1',
    ch: '3',
    title: 'Differentiate area or volume',
    topics: ['derivatives', 'symbolic'],
    hints: [
      'A derivative compares nearby geometric measurements.',
      'Expand the finite change before cancelling its nonzero increment.',
      'Only terms that retain no increment survive the limit.',
    ],
    forms: {
      disk: {
        tex: String.raw`\pi x^2`,
        key: '2*pi*x',
        alt: 'pi*(x+x)',
        wrong: 'pi*x',
        domain: 'x>0',
        fn: (x) => Math.PI * x * x,
        df: (x) => 2 * Math.PI * x,
        source: S('1C-1(a)'),
        reason: 'The area increment is π(2xh+h²). Divide by h, then let h tend to zero.',
      },
      sphere: {
        tex: String.raw`4\pi x^3/3`,
        key: '4*pi*x^2',
        alt: '(4*pi/3)*3*x^2',
        wrong: '4*pi*x^3',
        domain: 'x>0',
        fn: (x) => (4 * Math.PI * x ** 3) / 3,
        df: (x) => 4 * Math.PI * x * x,
        source: S('1C-1(b)'),
        reason: 'The cubic expansion leaves 4πx² after dividing the volume change by h and taking the limit.',
      },
    },
  }),
  symbolicFamily({
    id: 'c1.implicit-root',
    exam: 'c1',
    ch: '3',
    title: 'Differentiate an inverse through its constraint',
    topics: ['derivatives', 'symbolic'],
    hints: [
      'Differentiate the constraint before solving for the derivative.',
      'A power of y needs the chain-rule factor y′.',
      'Substitute the chosen branch only after isolating y′.',
    ],
    forms: {
      square: {
        tex: 'x^{1/2}',
        key: '1/(2*sqrt(x))',
        alt: '0.5*x^(-0.5)',
        wrong: '2*sqrt(x)',
        domain: 'x>0',
        fn: (x) => Math.sqrt(x),
        df: (x) => 1 / (2 * Math.sqrt(x)),
        source: S('1F-3, n=2'),
        reason: 'From y²=x obtain 2yy′=1, so y′=1/(2y). The positive branch gives y=√x.',
      },
      cube: {
        tex: 'x^{1/3}',
        key: '1/(3*x^(2/3))',
        alt: '(1/3)*x^(-2/3)',
        wrong: '3*x^(2/3)',
        domain: 'x>0',
        fn: (x) => Math.cbrt(x),
        df: (x) => 1 / (3 * x ** (2 / 3)),
        source: S('1F-3, n=3'),
        reason:
          'From y³=x obtain 3y²y′=1. The inverse derivative is the reciprocal of the original slope at the matching point.',
      },
    },
  }),
  problem({
    id: 'c1.falling',
    lab: 'secant',
    exam: 'c1',
    ch: '3',
    title: 'Signed velocity versus a time average',
    kind: 'numeric',
    topics: ['derivatives'],
    level: 1,
    minVersions: 4,
    variety: ['unknown', 'representation'],
    vars: { mode: choose(['average', 'instant']), end: choose([2, 5]) },
    derive: ($) => ({ answer: $.mode === 'average' ? -16 * (2 * ($.end - 2) + 2) : -32 * $.end }),
    text: (T, $) =>
      `A height record is h(t)=400−16t² ft for 0≤t≤5 s. ${$.mode === 'average' ? `Find the average vertical velocity during the two seconds ending at t=${$.end} s.` : `Find the instantaneous vertical velocity at t=${$.end} s.`} Upward is positive.`,
    parts: [
      numeric(
        'v',
        ($) => $.answer,
        'vertical velocity',
        [
          [($) => -$.answer, 'This is speed. The signed velocity is negative while the object falls.'],
          [
            ($) => ($.mode === 'average' ? -32 * $.end : -16 * (2 * ($.end - 2) + 2)),
            'An interval average and an endpoint derivative are different quantities.',
          ],
        ],
        'ft/s',
      ),
    ],
    hints: [
      'Decide whether the question asks for a secant or a tangent slope.',
      'For an average, subtract the endpoint heights and divide by elapsed time. For an instant, differentiate the height law.',
    ],
    steps: ($) => [
      $.mode === 'average'
        ? `Δh/Δt=[h(${$.end})−h(${$.end - 2})]/2.`
        : 'Differentiate the height law: v(t)=−32t.',
      `The signed velocity is ${$.answer} ft/s.`,
    ],
    second: ($) => {
      const h = (t) => 400 - 16 * t * t,
        d = 1e-5;
      return {
        v: $.mode === 'average' ? (h($.end) - h($.end - 2)) / 2 : (h($.end + d) - h($.end - d)) / (2 * d),
      };
    },
    sim: {
      scenario: 'fall',
      setup(s, $) {
        s.graphId = 'fall';
        s.x0 = $.mode === 'average' ? $.end - 2 : $.end;
        s.h = $.mode === 'average' ? 2 : 0.05;
      },
      read: (c, s) => ({ v: s.h === 2 ? c.msec : c.fp }),
    },
    cases: [
      kase(S('1B-1(a)'), { mode: 'average', end: 2 }, { v: -32 }),
      kase(S('1B-1(b)'), { mode: 'average', end: 5 }, { v: -128 }),
      kase(S('1B-1(c)'), { mode: 'instant', end: 5 }, { v: -160 }),
    ],
  }),
  problem({
    id: 'c1.secants',
    lab: 'secant',
    exam: 'c1',
    ch: '3',
    title: 'A secant can miss a tangent in either direction',
    kind: 'numeric',
    topics: ['derivatives'],
    level: 2,
    minVersions: 8,
    variety: ['sampling direction', 'unknown'],
    vars: { point: choose([-0.75, 0, 0.75]), h: choose([-0.5, -0.25, 0.25, 0.5]) },
    derive: ($) => ({ q: 1.5 * $.point ** 2 + 1.5 * $.point * $.h + 0.5 * $.h ** 2 - 1 }),
    text: (T, $) => `For f(x)=0.5x³−x, find the secant slope from x=${$.point} to x=${$.point + $.h}.`,
    parts: [
      numeric('q', ($) => $.q, 'secant slope', [
        [($) => 1.5 * $.point ** 2 - 1, 'That is the tangent slope. This question uses a nonzero interval.'],
        [($) => $.q * $.h, 'You found the change in height. Divide it by the signed change in x.'],
      ]),
    ],
    hints: [
      'A secant uses both function values and a signed interval.',
      'Expand f(a+h)−f(a) and divide every surviving term by h.',
    ],
    steps: ($) => [
      'Expanding the cubic difference gives 1.5a²+1.5ah+0.5h²−1.',
      `Substitute the point and interval: ${$.q}. Shrinking h makes the last two terms disappear.`,
    ],
    second: ($) => {
      const f = (x) => 0.5 * x ** 3 - x;
      return { q: (f($.point + $.h) - f($.point)) / $.h };
    },
    sim: {
      scenario: 'mathlet',
      setup(s, $) {
        s.graphId = 'mathlet';
        s.x0 = $.point;
        s.h = $.h;
      },
      read: (c) => ({ q: c.msec }),
    },
    cases: [
      kase(
        'MIT OCW 18.01SC, Fall 2010, Secants and Tangents, solution 1(a)',
        { point: -0.75, h: -0.5 },
        { q: 0.53 },
      ),
      kase(
        'MIT OCW 18.01SC, Fall 2010, Secants and Tangents, solution 2(a)',
        { point: 0, h: 0.5 },
        { q: -0.875 },
        { note: 'The source rounds this to −0.88; the fixture retains the exact quotient.' },
      ),
    ],
  }),
];
const concepts = [
  conceptFamily({
    id: 'c1.continuity',
    exam: 'c1',
    ch: '2',
    title: 'Which implication is justified?',
    topics: ['continuity', 'derivatives'],
    hints: [
      'Separate the hypotheses from the conclusion.',
      'A corner is a useful counterexample to an overly strong claim.',
    ],
    forms: {
      forward: {
        ask: 'A real function has a finite derivative at a point. What follows?',
        source: S('1D-9'),
        options: [
          [
            'It is continuous there.',
            'The increment equals h times a quotient with a finite limit, so it tends to zero.',
          ],
          [
            'It has a continuous derivative nearby.',
            'A derivative at one point gives no continuity of the derivative.',
          ],
          ['It has a local extremum.', 'A finite slope can be positive or negative.'],
        ],
      },
      reverse: {
        ask: 'The graph of |x| has no gap at zero. Which statement is justified?',
        source: S('1D-8, continuity/slope distinction; original absolute-value transfer'),
        options: [
          [
            'Continuity holds, but a derivative need not exist.',
            'The left and right quotient limits can disagree at a continuous corner.',
          ],
          ['It must have derivative zero.', 'A sharp minimum need not have a derivative.'],
          [
            'It is discontinuous because its slope changes sign.',
            'A discontinuity is a gap in values, not a change in slope.',
          ],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c1.constant',
    exam: 'c1',
    ch: '3',
    title: 'A complicated constant is still constant',
    topics: ['derivatives'],
    hints: [
      'Ask which symbol is allowed to change.',
      'Compare two nearby outputs before invoking a differentiation rule.',
    ],
    forms: {
      e: {
        ask: 'Differentiate the constant e²+1 with respect to x. Which reasoning is valid?',
        source: S('1E-1(b)'),
        options: [
          ['The derivative is zero because no x varies.', 'The difference between any two outputs is zero.'],
          [
            'The derivative is 2e.',
            'The power rule is with respect to the changing variable, not the constant e.',
          ],
          ['The derivative is e².', 'An exponential needs a varying exponent.'],
        ],
      },
      pi: {
        ask: 'Differentiate the fixed number sin(π/6) with respect to x.',
        source: S('1E-1(b), constant-rule transfer'),
        options: [
          [
            'Zero: its value never changes with x.',
            'A trigonometric expression can represent a fixed number.',
          ],
          ['cos(π/6).', 'The argument is constant, so its chain-rule derivative is zero.'],
          [
            'No derivative exists because there is no x.',
            'Constant functions are differentiable everywhere.',
          ],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c1.parity',
    exam: 'c1',
    ch: '3',
    title: 'Reflect a derivative, then check its sign',
    topics: ['derivatives', 'symbolic'],
    hints: [
      'Start from the function’s symmetry equation.',
      'Differentiate both sides, including the inner derivative of −x.',
    ],
    forms: {
      even: {
        ask: 'A differentiable function is even. What symmetry does its derivative have?',
        source: S('1F-6(a)'),
        options: [
          ['Odd.', 'Differentiating f(−x)=f(x) gives −f′(−x)=f′(x).'],
          ['Even.', 'That drops the inner derivative of −x.'],
          ['No symmetry follows.', 'The symmetry equation supplies a derivative identity.'],
        ],
      },
      odd: {
        ask: 'A differentiable function is odd. What symmetry does its derivative have?',
        source: S('1F-6(b)'),
        options: [
          ['Even.', 'Differentiating f(−x)=−f(x) cancels both minus signs.'],
          ['Odd.', 'The chain-rule sign changes the parity.'],
          ['Its derivative must be zero.', 'The derivative of x is a nonzero even function.'],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c1.epsilon',
    exam: 'c1',
    ch: '2',
    title: 'What a limit proof must promise',
    topics: ['limits', 'epsilon-delta'],
    hints: [
      'Track which tolerance is chosen first.',
      'A guarantee must apply to every allowed input in the window.',
    ],
    forms: {
      quantifiers: {
        ask: 'In an ε–δ proof, what can δ depend on?',
        source: 'OpenStax Calculus Volume 1, §2.5, Definition of a limit',
        options: [
          [
            'The requested ε and the fixed approach point.',
            'The input window is chosen after the output tolerance.',
          ],
          [
            'The particular x later tested.',
            'A separate window for each tested point gives no uniform promise.',
          ],
          ['Only the function value at the point.', 'Limits ignore the value at that one point.'],
        ],
      },
      small: {
        ask: 'A proof finds one valid δ. Must it be the largest valid window?',
        source: 'OpenStax Calculus Volume 1, §2.5, Definition of a limit',
        options: [
          [
            'No. Any positive window meeting the guarantee works.',
            'A smaller positive window still restricts inputs to safe ones.',
          ],
          ['Yes, otherwise the limit is not proved.', 'The definition asks for existence, not optimization.'],
          ['A window of zero is always sufficient.', 'The definition explicitly requires δ>0.'],
        ],
      },
    },
  }),
];
export default [...prod, ...concepts];

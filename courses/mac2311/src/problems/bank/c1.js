import { problem, kase, range } from '../kit.js';
import { numeric, choose, citation, symbolicFamily, conceptFamily, cf, shift } from './rework-kit.js';
const S = (p) => citation(1, p);
/** x^{m/n} through its constraint y^n = x^m. */
const root = (n, m) => ({
  tex: `x^{${m}/${n}}`,
  key: `(${m}/${n})*x^(${m}/${n}-1)`,
  alt: `${m}*x^((${m}-${n})/${n})/${n}`,
  wrong: `x^(${m}/${n}-1)`,
  domain: 'x>0',
  fn: (x) => x ** (m / n),
  df: (x) => (m / n) * x ** (m / n - 1),
  reason: `From $y^{${n}}=x^{${m}}$ obtain $${n}y^{${n - 1}}y'=${m}x^{${m - 1}}$. Solve for $y'$, then substitute $y=x^{${m}/${n}}$.`,
});
/** A measure k·x^p of a figure of size x: the derivative is the rate the measure grows. */
const measure = (p, g) => ({
  ...g,
  domain: 'x>0',
  fn: (x) => g.k * x ** p,
  df: (x) => p * g.k * x ** (p - 1),
  reason: `f is the ${p === 2 ? 'area' : 'volume'} of ${g.what}. Expand the change ${p === 2 ? 'k[(x+h)^2−x^2]' : 'k[(x+h)^3−x^3]'}, divide by h, and let h tend to zero: only ${p}kx^${p - 1} survives.`,
});
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
    minVersions: 24,
    variety: ['configuration', 'solution branch', 'coefficients'],
    vars: { h: choose([1, 0, 2, -1, -2]), c: choose([1, 4, 2, 3, 5, 9]), branch: choose([-1, 1]) },
    derive: ($) => {
      const a = $.branch * Math.sqrt($.h * $.h + $.c);
      return { a, m: 2 * (a - $.h) };
    },
    text: (T, $) =>
      String.raw`The curve is $y=${shift($.h)}^2+${$.c}$. Find the ${$.branch > 0 ? 'positive' : 'negative'} contact coordinate $a$ of a tangent passing through the origin, then its slope. The origin is not a contact point.`,
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
      String.raw`$f(a)=af'(a)$ gives $${shift($.h, 'a')}^2+${$.c}=2a${$.h ? shift($.h, 'a') : '\cdot a'}$.`,
      String.raw`The linear terms cancel: $a^2=${$.h ** 2 + $.c}$. Choose the requested branch, then use $m=2${shift($.h, 'a')}$.`,
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
        s.graphId = `parabola:${$.h}:${$.c}`;
        s.a = -Math.ceil(Math.abs($.a) + 1);
        s.b = Math.ceil(Math.abs($.a) + 1);
        s.x0 = $.a;
        s.h = 0.05;
      },
      read: (c, s) => ({ a: s.x0, m: c.fp }),
    },
    cases: [
      kase(
        S('1C-5, positive contact'),
        { h: 1, c: 1, branch: 1 },
        { a: Math.sqrt(2), m: 2 * (Math.sqrt(2) - 1) },
      ),
      kase(
        S('1C-5, negative contact'),
        { h: 1, c: 1, branch: -1 },
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
        source: S('1F-1(a)'),
        params: { a: [2, 1, 3, 4, 5, 7], n: [2, 3, 4, 5] },
        make: ({ a, n }) => ({
          tex: `(x^2+${a})^{${n}}`,
          key: n === 2 ? `${2 * n}*x*(x^2+${a})` : `${2 * n}*x*(x^2+${a})^${n - 1}`,
          alt: n === 2 ? `4*x^3+${4 * a}*x` : `2*x*${n}*(x^2+${a})^${n - 1}`,
          wrong: `${n}*(x^2+${a})^${n - 1}`,
          fn: (x) => (x * x + a) ** n,
          df: (x) => 2 * n * x * (x * x + a) ** (n - 1),
          reason: `Differentiate the outer power, ${n}(x^2+${a})^${n - 1}, then multiply by the inner derivative 2x.`,
        }),
      },
      power: {
        source: S('1F-1(b)'),
        params: { a: [2, 1, 3, 5], n: [100, 50, 20, 30, 40, 60] },
        make: ({ a, n }) => ({
          tex: `(x^2+${a})^{${n}}`,
          key: `${2 * n}*x*(x^2+${a})^${n - 1}`,
          alt: `2*x*${n}*(x^2+${a})^${n - 1}`,
          wrong: `${n}*(x^2+${a})^${n - 1}`,
          at: 0.3,
          fn: (x) => (x * x + a) ** n,
          df: (x) => 2 * n * x * (x * x + a) ** (n - 1),
          reason: `A large exponent changes only the outer derivative, ${n}(x^2+${a})^${n - 1}. The inner derivative remains 2x.`,
        }),
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
        source: S('1E-1(d)'),
        params: { a: [3, 2, 4], b: [5, 3, 4, 6], c: [1, 2] },
        make: ({ a, b, c }) => ({
          tex: `(x^{${a}}+${cf(c)}x)(x^{${b}}+x^2)`,
          key: `(${a}*x^${a - 1}+${c})*(x^${b}+x^2)+(x^${a}+${c}*x)*(${b}*x^${b - 1}+2*x)`,
          alt: `${a + b}*x^${a + b - 1}+${a + 2}*x^${a + 1}+${c * (b + 1)}*x^${b}+${3 * c}*x^2`,
          wrong: `(${a}*x^${a - 1}+${c})*(${b}*x^${b - 1}+2*x)`,
          fn: (x) => (x ** a + c * x) * (x ** b + x * x),
          df: (x) => (a + b) * x ** (a + b - 1) + (a + 2) * x ** (a + 1) + c * (b + 1) * x ** b + 3 * c * x * x,
          reason: 'One term differentiates the first factor; the other differentiates the second. Expanding first gives four powers to check against.',
        }),
      },
      exponential: {
        source: S('1I-1(a)'),
        params: { m: [1, 2, 3, 4], k: [1, 2, 3, -1, -2, -3] },
        make: ({ m, k }) => ({
          tex: `${m === 1 ? 'x' : `x^{${m}}`}e^{${cf(k)}x}`,
          key: `(${m}*x^${m - 1}+${k}*x^${m})*exp(${k}*x)`,
          alt: `${m}*x^${m - 1}*exp(${k}*x)+${k}*x^${m}*exp(${k}*x)`,
          wrong: `${m}*x^${m - 1}*${k}*exp(${k}*x)`,
          fn: (x) => x ** m * Math.exp(k * x),
          df: (x) => (m * x ** (m - 1) + k * x ** m) * Math.exp(k * x),
          reason: `Both factors change. The power gives ${m}x^${m - 1}e^{${k}x}; the exponential gives its own factor ${k}. Add the two product-rule terms.`,
        }),
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
        source: S('1I-1(l)'),
        params: { k: [1, 2, 3, 4], a: [1, 2, 3, 5, 10] },
        make: ({ k, a }) => ({
          tex: `${k}/\\ln ${a === 1 ? 'x' : `(${a}x)`}`,
          key: `-${k}/(x*ln(${a}*x)^2)`,
          alt: `-${k}*ln(${a}*x)^(-2)/x`,
          wrong: `${k}/(x*ln(${a}*x)^2)`,
          domain: `x>0, x≠${a === 1 ? '1' : `1/${a}`}`,
          at: 2,
          fn: (x) => k / Math.log(a * x),
          df: (x) => -k / (x * Math.log(a * x) ** 2),
          reason: `Use the reciprocal rule on ln(${a}x), whose derivative is 1/x whatever the constant ${a}. Squaring the denominator does not remove the minus sign.`,
        }),
      },
      logarithm: {
        source: S('1I-1(k)'),
        params: { c: [1, 2, 3, 5], n: [1, 2, 3] },
        make: ({ c, n }) => ({
          tex: `\\ln(${c}/x${n === 1 ? '' : `^{${n}}`})`,
          key: `-${n}/x`,
          alt: `(-${n})*x^(-1)`,
          wrong: `${n}/x`,
          domain: 'x>0',
          fn: (x) => Math.log(c / x ** n),
          df: (x) => -n / x,
          reason: `On x>0, ln(${c}/x^${n})=ln ${c}−${n} ln x. The constant term has derivative zero.`,
        }),
      },
      variablePower: {
        source: S('1I-1(h)'),
        params: { k: [1, 2, 3, 4] },
        make: ({ k }) => ({
          tex: `x^{${cf(k)}x}`,
          key: `x^(${k}*x)*(${k}*ln(x)+${k})`,
          alt: `${k}*x^(${k}*x)+${k}*x^(${k}*x)*ln(x)`,
          wrong: `${k}*x*x^(${k}*x-1)`,
          domain: 'x>0',
          fn: (x) => x ** (k * x),
          df: (x) => x ** (k * x) * (k * Math.log(x) + k),
          reason: `Set y=x^{${k}x} and take logarithms. Differentiating ln y=${k}x ln x gives y′/y=${k} ln x+${k}.`,
        }),
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
        source: S('1J-1(a)'),
        params: { a: [5, 2, 3, 4, 6, 7], n: [2, 3], fn: ['sin', 'cos'] },
        make: ({ a, n, fn }) => {
          const s = fn === 'sin';
          return {
            tex: `\\${fn}(${a}x^{${n}})`,
            key: `${s ? '' : '-'}${a * n}*x^${n - 1}*${s ? 'cos' : 'sin'}(${a}*x^${n})`,
            alt: `${s ? '' : '-'}${s ? 'cos' : 'sin'}(${a}*x^${n})*${n}*x^${n - 1}*${a}`,
            wrong: `${s ? '' : '-'}${s ? 'cos' : 'sin'}(${a}*x^${n})`,
            fn: (x) => Math[fn](a * x ** n),
            df: (x) => (s ? 1 : -1) * a * n * x ** (n - 1) * (s ? Math.cos : Math.sin)(a * x ** n),
            reason: `The derivative of ${fn} is ${s ? 'cosine' : 'minus sine'} at the same argument. The inner derivative is ${a * n}x^${n - 1}.`,
          };
        },
      },
      sineSquare: {
        source: S('1J-1(b)'),
        params: { b: [3, 2, 4, 5, 6, 7], p: [2, 3], fn: ['sin', 'cos'] },
        make: ({ b, p, fn }) => {
          const s = fn === 'sin',
            other = s ? 'cos' : 'sin';
          return {
            tex: `\\${fn}^{${p}}(${b}x)`,
            key: `${s ? '' : '-'}${p * b}*${fn}(${b}*x)^${p - 1}*${other}(${b}*x)`,
            alt: p === 2 && s ? `${b}*sin(${2 * b}*x)` : `${s ? '' : '-'}${other}(${b}*x)*${p}*${b}*${fn}(${b}*x)^${p - 1}`,
            wrong: `${s ? '' : '-'}${p}*${fn}(${b}*x)^${p - 1}*${other}(${b}*x)`,
            fn: (x) => Math[fn](b * x) ** p,
            df: (x) => (s ? 1 : -1) * p * b * Math[fn](b * x) ** (p - 1) * Math[other](b * x),
            reason: `First differentiate the power, then the ${fn}, then the linear argument ${b}x. Each layer contributes a factor.`,
          };
        },
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
        source: S('1C-1(a)'),
        params: { shape: ['disk', 'square', 'semicircle', 'triangle', 'sector', 'hexagon'] },
        make: ({ shape }) =>
          measure(2, {
            disk: { tex: '\\pi x^2', key: '2*pi*x', alt: 'pi*(x+x)', wrong: 'pi*x', k: Math.PI, what: 'a disk of radius x' },
            square: { tex: 'x^2', key: '2*x', alt: 'x+x', wrong: 'x', k: 1, what: 'a square of side x' },
            semicircle: { tex: '\\pi x^2/2', key: 'pi*x', alt: '2*pi*x/2', wrong: 'pi*x/2', k: Math.PI / 2, what: 'a half disk of radius x' },
            triangle: { tex: '\\sqrt{3}x^2/4', key: 'sqrt(3)*x/2', alt: '2*sqrt(3)*x/4', wrong: 'sqrt(3)*x/4', k: Math.sqrt(3) / 4, what: 'an equilateral triangle of side x' },
            sector: { tex: '\\pi x^2/6', key: 'pi*x/3', alt: '2*pi*x/6', wrong: 'pi*x/6', k: Math.PI / 6, what: 'a 60° sector of radius x' },
            hexagon: { tex: '3\\sqrt{3}x^2/2', key: '3*sqrt(3)*x', alt: '6*sqrt(3)*x/2', wrong: '3*sqrt(3)*x/2', k: (3 * Math.sqrt(3)) / 2, what: 'a regular hexagon of side x' },
          }[shape]),
      },
      sphere: {
        source: S('1C-1(b)'),
        params: { solid: ['sphere', 'cube', 'cylinder', 'cone', 'hemisphere'] },
        make: ({ solid }) =>
          measure(3, {
            sphere: { tex: '4\\pi x^3/3', key: '4*pi*x^2', alt: '(4*pi/3)*3*x^2', wrong: '4*pi*x^3', k: (4 * Math.PI) / 3, what: 'a ball of radius x' },
            cube: { tex: 'x^3', key: '3*x^2', alt: 'x^2+x^2+x^2', wrong: 'x^2', k: 1, what: 'a cube of side x' },
            cylinder: { tex: '2\\pi x^3', key: '6*pi*x^2', alt: '2*pi*3*x^2', wrong: '2*pi*x^2', k: 2 * Math.PI, what: 'a cylinder of radius x and height 2x' },
            cone: { tex: '\\pi x^3/3', key: 'pi*x^2', alt: '(pi/3)*3*x^2', wrong: 'pi*x^3', k: Math.PI / 3, what: 'a cone of radius x and height x' },
            hemisphere: { tex: '2\\pi x^3/3', key: '2*pi*x^2', alt: '(2*pi/3)*3*x^2', wrong: '2*pi*x^3/3', k: (2 * Math.PI) / 3, what: 'a half ball of radius x' },
          }[solid]),
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
        source: S('1F-3, n=2'),
        params: { m: [1, 3, 5, 7, 9] },
        make: ({ m }) => root(2, m),
      },
      cube: {
        source: S('1F-3, n=3'),
        params: { m: [1, 2, 4, 5, 7, 8] },
        make: ({ m }) => root(3, m),
      },
      fourth: { params: { m: [1, 3, 5, 7] }, make: ({ m }) => root(4, m) },
      fifth: { params: { m: [1, 2, 3, 4, 6] }, make: ({ m }) => root(5, m) },
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
    minVersions: 24,
    variety: ['unknown', 'representation', 'coefficients'],
    vars: { mode: choose(['average', 'instant']), end: choose([2, 5, 3, 4]), drop: choose([400, 576, 784]) },
    derive: ($) => ({ answer: $.mode === 'average' ? -16 * (2 * ($.end - 2) + 2) : -32 * $.end }),
    text: (T, $) =>
      `A height record is h(t)=${$.drop}−16t² ft for 0≤t≤${Math.sqrt($.drop / 16)} s. ${$.mode === 'average' ? `Find the average vertical velocity during the two seconds ending at t=${$.end} s.` : `Find the instantaneous vertical velocity at t=${$.end} s.`} Upward is positive.`,
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
      const h = (t) => $.drop - 16 * t * t,
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
      kase(S('1B-1(a)'), { mode: 'average', end: 2, drop: 400 }, { v: -32 }),
      kase(S('1B-1(b)'), { mode: 'average', end: 5, drop: 400 }, { v: -128 }),
      kase(S('1B-1(c)'), { mode: 'instant', end: 5, drop: 400 }, { v: -160 }),
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

import { problem, kase } from '../kit.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { cylinderDesign } from '@flux/subjects/math/containers.js';
import { choose, citation, numeric, formulaFamily, numericFamily, conceptFamily, cf, fr, frTex, pw, sum, shiftExpr } from './rework-kit.js';
const S = (p) => citation(2, p),
  E = (p) => `MIT OCW 18.01SC, Fall 2010, ${p}`;
const approx = [
  'An approximation is fixed by values and derivatives at its center.',
  'Write the constant and linear terms first. A quadratic also uses half the second derivative.',
  'Use displacement from the center, not the input itself, in every nonconstant term.',
];
const root = (fn, lo, hi) => {
  for (let n = 0; n < 80; n++) {
    const mid = (lo + hi) / 2;
    if (fn(mid) > 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};
const B = [
  formulaFamily({
    id: 'c2.linear',
    exam: 'c2',
    ch: '4',
    title: 'Local models for different function families',
    topics: ['linear approximation'],
    hints: approx,
    forms: {
      root: {
        source: S('2A-1, a=4, b=1'),
        params: { a: [2, 1, 3, 4, 5, 10], b: [1, 2, 3, 4] },
        make: ({ a, b }) => ({
          ask: String.raw`Find the linear approximation to $\sqrt{${a * a}+${cf(b)}x}$ at $x=0$.`,
          key: sum([a, ''], [b / (2 * a), 'x']),
          alt: `(${2 * a * a}+${b}*x)/${2 * a}`,
          wrong: sum([a, ''], [b / a, 'x']),
          get: (x) => a + (b * x) / (2 * a),
          second: (x) => a + ((Math.sqrt(a * a + b * 1e-5) - Math.sqrt(a * a - b * 1e-5)) / 2e-5) * x,
          reason: `The value at zero is ${a}. The derivative there is ${fr(b)}/(2·${a}) = ${fr(b / (2 * a))}. Multiply that slope by the displacement x.`,
        }),
      },
      reciprocal: {
        source: S('2A-2, a=2, b=1'),
        params: { a: [2, 1, 3, 4, 5, 10], b: [1, 2, 3, -1] },
        make: ({ a, b }) => ({
          ask: String.raw`Find the linear approximation to $1/(${a}${b < 0 ? '-' : '+'}${cf(Math.abs(b))}x)$ at $x=0$.`,
          key: sum([1 / a, ''], [-b / (a * a), 'x']),
          alt: `(${a}-${b}*x)/${a * a}`,
          wrong: sum([1 / a, ''], [b / (a * a), 'x']),
          get: (x) => 1 / a - (b * x) / (a * a),
          second: (x) => 1 / a + ((1 / (a + b * 1e-5) - 1 / (a - b * 1e-5)) / 2e-5) * x,
          reason: `The value at zero is ${fr(1 / a)}. The derivative of 1/(${a}+${b}x) is −${b}/(${a}+${b}x)², so at zero the slope is ${fr(-b / (a * a))}.`,
        }),
      },
    },
  }),
  formulaFamily({
    id: 'c2.quadratic',
    exam: 'c2',
    ch: '4',
    title: 'Curvature changes the tangent estimate',
    topics: ['linear approximation'],
    hints: approx,
    forms: {
      shifted: {
        source: S('2A-8'),
        params: { c: [0.5, 0, -1, 2, -0.5, 3] },
        make: ({ c }) => {
          const u = 1 - c,
            f0 = 1 / u,
            f1 = 1 / u ** 2,
            f2 = 1 / u ** 3,
            centre = shiftExpr(c);
          return {
            ask: String.raw`Find the quadratic approximation to $1/(1-x)$ centered at $x=${frTex(c)}$.`,
            key: sum([f0, ''], [f1, centre], [f2, `${centre}^2`]),
            alt: sum([f2, 'x^2'], [f1 - 2 * c * f2, 'x'], [f0 - c * f1 + c * c * f2, '']),
            wrong: sum([f0, ''], [f1, 'x'], [f2, 'x^2']),
            get: (x) => f0 + f1 * (x - c) + f2 * (x - c) ** 2,
            second: (x) => {
              const f = (t) => 1 / (1 - t),
                h = 1e-4,
                d = x - c;
              return f(c) + ((f(c + h) - f(c - h)) / (2 * h)) * d + ((f(c + h) - 2 * f(c) + f(c - h)) / (2 * h * h)) * d * d;
            },
            at: c + 0.1,
            reason: `At the center, f=${fr(f0)}, f′=${fr(f1)} and f″=${fr(2 * f2)}. The quadratic coefficient is f″/2=${fr(f2)}, and every term uses the displacement ${centre.replace(/[()]/g, '')}.`,
          };
        },
      },
      binomial: {
        source: S('2A-10, r=3'),
        params: { r: [3, 2, 4, 5, -1, -2, 0.5, -0.5], b: [1, 2, 3] },
        make: ({ r, b }) => {
          const c1 = r * b,
            c2 = (r * (r - 1) * b * b) / 2;
          return {
            ask: String.raw`Find the quadratic approximation to $(1+${cf(b)}x)^{${fr(r)}}$ centered at zero.`,
            key: sum([1, ''], [c1, 'x'], [c2, 'x^2']),
            alt: sum([c2, 'x^2'], [c1, 'x'], [1, '']),
            wrong: sum([1, ''], [c1, 'x'], [2 * c2, 'x^2']),
            get: (x) => 1 + c1 * x + c2 * x * x,
            second: (x) => {
              const f = (t) => (1 + b * t) ** r,
                h = 1e-4;
              return 1 + ((f(h) - f(-h)) / (2 * h)) * x + ((f(h) - 2 + f(-h)) / (2 * h * h)) * x * x;
            },
            at: 0.05,
            reason: `f(0)=1, f′(0)=${fr(r)}·${b}=${fr(c1)} and f″(0)=${fr(r)}(${fr(r - 1)})·${b * b}. Half of f″(0) is ${fr(c2)}.`,
          };
        },
      },
      exponential: {
        params: { k: [1, 2, 3, -1, -2, -3] },
        make: ({ k }) => ({
          ask: String.raw`Find the quadratic approximation to $e^{${cf(k)}x}$ centered at zero.`,
          key: sum([1, ''], [k, 'x'], [(k * k) / 2, 'x^2']),
          alt: sum([(k * k) / 2, 'x^2'], [k, 'x'], [1, '']),
          wrong: sum([1, ''], [k, 'x'], [k * k, 'x^2']),
          get: (x) => 1 + k * x + ((k * k) / 2) * x * x,
          second: (x) => {
            const f = (t) => Math.exp(k * t),
              h = 1e-4;
            return 1 + ((f(h) - f(-h)) / (2 * h)) * x + ((f(h) - 2 + f(-h)) / (2 * h * h)) * x * x;
          },
          at: 0.05,
          reason: `Each derivative brings down a factor ${k}: f(0)=1, f′(0)=${k}, f″(0)=${k * k}. The quadratic coefficient is half of ${k * k}.`,
        }),
      },
    },
  }),
  numericFamily({
    id: 'c2.mvt',
    level: 1,
    exam: 'c2',
    ch: '4',
    title: 'Find where a tangent matches a secant',
    topics: ['mean value theorem'],
    hints: [
      'Verify continuity on the closed interval and differentiability inside it.',
      'Compute the secant slope, then solve f′(c)=that slope.',
      'Retain only roots strictly inside the interval and on the requested branch.',
    ],
    forms: {
      square: {
        source: S('2G-1(a)'),
        params: { iv: [[0, 1], [1, 5], [0, 3], [-1, 2], [2, 4], [1, 4]], p: [1, 2, 3, -1] },
        make: ({ iv: [a, b], p }) => {
          const f = (x) => p * x * x,
            slope = (f(b) - f(a)) / (b - a);
          return {
            ask: `For f(x)=${cf(p)}x² on [${a},${b}], find the Mean Value Theorem point c.`,
            answer: (a + b) / 2,
            second: () => (Math.abs(p) > 0 ? root((x) => Math.sign(p) * (2 * p * x - slope), a, b) : 0),
            reason: `The secant slope is ${fr(slope)}. Solve ${2 * p}c=${fr(slope)}: for any parabola the point is the midpoint.`,
            traps: [
              [slope, 'That is the secant slope. The question asks for its contact coordinate.'],
              [a, 'An endpoint is not an interior Mean Value Theorem point.'],
            ],
          };
        },
      },
      logarithm: {
        source: S('2G-1(b)'),
        params: { iv: [[1, 2], [1, 3], [1, 4], [2, 3], [2, 5], [1, 5], [3, 6], [1, 10]] },
        make: ({ iv: [a, b] }) => {
          const slope = Math.log(b / a) / (b - a);
          return {
            ask: `For f(x)=ln x on [${a},${b}], find the Mean Value Theorem point c.`,
            answer: 1 / slope,
            second: () => root((x) => slope - 1 / x, a, b),
            reason: `The secant slope is ln(${b}/${a})/${b - a}. Solve 1/c equal to it, and check ${a}<c<${b}.`,
            traps: [
              [slope, 'That is the secant slope. Invert it to solve 1/c=slope.'],
              [(a + b) / 2, 'The theorem does not require the interval midpoint; that holds only for parabolas.'],
            ],
          };
        },
      },
      cubic: {
        source: S('2G-1(c), positive root'),
        params: { iv: [[-2, 2], [-1, 2], [0, 2], [0, 3], [-1, 3], [1, 3]], k: [-1, 1, 2, -3] },
        make: ({ iv: [a, b], k }) => {
          const c = Math.sqrt((a * a + a * b + b * b) / 3),
            slope = a * a + a * b + b * b + k;
          return {
            ask: `For f(x)=x³${k < 0 ? '−' : '+'}${Math.abs(k) === 1 ? '' : Math.abs(k)}x on [${a},${b}], find the positive Mean Value Theorem point c.`,
            answer: c,
            second: () => root((x) => 3 * x * x + k - slope, Math.max(a, 0), b),
            reason: `The secant slope is ${slope}. Thus 3c²${k < 0 ? '−' : '+'}${Math.abs(k)}=${slope}, so c²=${fr((a * a + a * b + b * b) / 3)}. The term in x cancels, and the positive root lies inside the interval.`,
            traps: [
              [-c, 'That is the negative branch. Read the sign requested for c.'],
              [Math.sqrt(Math.abs(slope)), 'The derivative is 3c² plus the constant; solve 3c²+k equal to the slope.'],
            ],
          };
        },
      },
    },
  }),
  numericFamily({
    id: 'c2.newton-failure',
    exam: 'c2',
    ch: '4',
    title: 'Newton iteration can fail without reaching a root',
    topics: ["newton's method"],
    level: 3,
    hints: [
      'Write the iteration map before thinking about convergence.',
      'A zero derivative makes the update not defined. A two-cycle satisfies N(x)=−x for this odd function.',
      'Solve the appropriate equation and choose the positive nonzero starting value.',
    ],
    forms: {
      stationary: {
        source: S('2F-5(a)'),
        params: { a: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15] },
        make: ({ a }) => ({
          ask: `For f(x)=${cf(a)}x−x³, find the positive starting value where the first Newton update divides by zero.`,
          answer: Math.sqrt(a / 3),
          second: () => root((x) => 3 * x * x - a, 0, Math.sqrt(a) + 1),
          reason: `The derivative ${a}−3x² vanishes at x=√(${a}/3), where f is not zero.`,
          traps: [
            [Math.sqrt(a / 5), 'That produces a two-cycle, rather than division by zero.'],
            [Math.sqrt(a), 'This is already a root. Its nonzero derivative makes the update valid.'],
          ],
        }),
      },
      cycle: {
        source: S('2F-5(b)'),
        params: { a: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15] },
        make: ({ a }) => ({
          ask: `For f(x)=${cf(a)}x−x³, find the positive nonzero starting value whose Newton iterates alternate between x and −x.`,
          answer: Math.sqrt(a / 5),
          second: () => root((x) => 5 * x * x - a, 0.01, Math.sqrt(a / 3)),
          reason: `The map is N(x)=−2x³/(${a}−3x²). Set N(x)=−x, cancel the nonzero x and solve 5x²=${a}. Neither point is a root.`,
          traps: [
            [Math.sqrt(a / 3), 'That makes the map not defined. A cycle requires both updates to exist.'],
            [0, 'Zero is a fixed root, not a nonzero two-cycle.'],
          ],
        }),
      },
    },
  }),
  problem({
    id: 'c2.can-optimum',
    exam: 'c2',
    ch: '4',
    lab: 'can',
    title: 'The lid changes the optimal proportions',
    kind: 'numeric',
    level: 3,
    topics: ['optimization'],
    variety: ['boundary configuration', 'unknown'],
    minVersions: 12,
    vars: { k: choose([1, 2]), V: choose([330, 355, 473, 250, 500, 750]) },
    derive: ($) => ({ r: Math.cbrt($.V / ($.k * Math.PI)) }),
    text: (T, $) =>
      `An ideal cylindrical container holds ${$.V} cm³. Its wall and ${$.k === 1 ? 'one flat bottom' : 'two flat ends'} use equal-thickness sheet. Find the height/radius ratio that minimizes sheet area.`,
    parts: [
      numeric('ratio', ($) => $.k, 'optimal h/r', [
        [
          ($) => ($.k === 1 ? 2 : 1),
          'Count the circular ends. An open cup and a capped can have different optima.',
        ],
        [($) => $.k / 2, 'The stationary equation gives h=kr. Do not divide this ratio by two again.'],
      ]),
    ],
    hints: [
      'Eliminate height with the fixed-volume constraint.',
      'The area has a wall term decreasing with radius and an end term increasing with radius.',
      'Differentiate the one-variable area and substitute the stationary relation back into the volume equation.',
    ],
    steps: ($) => [
      'A(r)=2V/r+kπr². Setting its derivative to zero gives V=kπr³.',
      'The volume constraint then gives h=kr. The positive second derivative and growth at both ends prove a global minimum.',
    ],
    second: ($) => {
      let lo = 0.1,
        hi = 10;
      for (let n = 0; n < 80; n++) {
        const a = lo + (hi - lo) / 3,
          b = hi - (hi - lo) / 3;
        if (cylinderDesign($.V, a, $.k).area < cylinderDesign($.V, b, $.k).area) hi = b;
        else lo = a;
      }
      const r = (lo + hi) / 2;
      return { ratio: cylinderDesign($.V, r, $.k).h / r };
    },
    sim: {
      scenario: 'closed',
      setup(s, $) {
        s.V = $.V;
        s.k = $.k;
        s.r = $.r;
      },
      read: (c, s) => ({ ratio: c.h / s.r }),
    },
    cases: [
      kase(
        S(
          '2C-5, h=r at the open-cylinder optimum; same stationary proportions under the inverse area/volume problem',
        ),
        { k: 1, V: 330 },
        { ratio: 1 },
      ),
    ],
  }),
  formulaFamily({
    id: 'c2.antiderivative',
    exam: 'c2',
    ch: '5',
    title: 'Recover a function and fix its constant',
    topics: ['antiderivatives', 'symbolic'],
    hints: [
      'Reverse the derivative rule term by term.',
      'Expand a polynomial product when no inner derivative is present.',
      'Use the initial value to fix the additive constant.',
    ],
    forms: {
      expanded: {
        source: citation(1, '1E-2(c), with C=0'),
        params: { m: [3, 1, 2, 4], c: [1, 2, 3, -1, -2, 4] },
        make: ({ m, c }) => ({
          ask: String.raw`Find $F(x)$ with $F'(x)=(${pw('x', m)}${c < 0 ? '-' : '+'}${Math.abs(c)})^2$ and $F(0)=0$.`,
          key: sum([1 / (2 * m + 1), `x^${2 * m + 1}`], [(2 * c) / (m + 1), `x^${m + 1}`], [c * c, 'x']),
          alt: `(x^${2 * m + 1})/${2 * m + 1}+${2 * c}*x^${m + 1}/${m + 1}+${c * c}*x`,
          wrong: `(x^${m}+${c})^3/3`,
          get: (x) => x ** (2 * m + 1) / (2 * m + 1) + ((2 * c) / (m + 1)) * x ** (m + 1) + c * c * x,
          second: (x) => simpson((t) => (t ** m + c) ** 2, 0, x),
          reason: `Expand the square: x^${2 * m}+${2 * c}x^${m}+${c * c}. Integrate each term. The initial condition makes C zero.`,
        }),
      },
      sum: {
        source: citation(1, '1E-2(a), a=2, b=3, C=0'),
        params: { a: [2, 4, 6, 3, 1], b: [3, 1, -2, 5], F0: [0, 1, -3] },
        make: ({ a, b, F0 }) => ({
          ask: String.raw`Find $F(x)$ with $F'(x)=${cf(a)}x${b < 0 ? '-' : '+'}${Math.abs(b)}$ and $F(0)=${F0}$.`,
          key: sum([a / 2, 'x^2'], [b, 'x'], [F0, '']),
          alt: `${F0}+${b}*x+${a}*x^2/2`,
          wrong: sum([a, 'x^2'], [b, 'x'], [F0, '']),
          get: (x) => (a / 2) * x * x + b * x + F0,
          second: (x) => F0 + simpson((t) => a * t + b, 0, x),
          reason: `The antiderivative of ${a}x is ${fr(a / 2)}x², not ${a}x². The starting value fixes C=${F0}.`,
        }),
      },
    },
  }),
  formulaFamily({
    id: 'c2.growth',
    exam: 'c2',
    ch: '5',
    title: 'An equation for a rate determines a family',
    topics: ['antiderivatives', 'differential equations'],
    hints: [
      'Separate the dependent and independent variables where the dependent factor is nonzero.',
      'Integrate both sides, then use the starting value.',
      'Check lost equilibrium solutions before accepting the family.',
    ],
    forms: {
      exponential: {
        source: E('Session 40, Exponential Growth and Inhibited Growth, solution (a), a=3, r=2'),
        params: { A: [3, 1, 2, 5, 10], r: [2, 1, 3, -1, -2, -3] },
        make: ({ A, r }) => ({
          ask: String.raw`Solve $y'=${cf(r)}y$ with $y(0)=${A}$. Write $y(x)$.`,
          key: `${A}*exp(${r}*x)`,
          alt: `exp(${r}*x)*${A}`,
          wrong: `${A}+${r}*x`,
          get: (x) => A * Math.exp(r * x),
          second: (x) => {
            let y = A;
            const h = x / 10000;
            for (let i = 0; i < 10000; i++) y *= 1 + r * h + (r * r * h * h) / 2;
            return y;
          },
          reason: `Separation gives ln|y|=${r}x+C. The initial value picks y=${A}e^(${r}x).`,
        }),
      },
      inhibited: {
        source: E('Session 40, Exponential Growth and Inhibited Growth, solution (b), s=r=a=1'),
        params: { y0: [0.5, 0.25, 0.2, 0.75, 0.1, 0.8], k: [1, 2, 3, 4] },
        make: ({ y0, k }) => {
          const B = (1 - y0) / y0;
          return {
            ask: String.raw`Solve $y'=${cf(k)}y(1-y)$ with $y(0)=${frTex(y0)}$. Write $y(x)$.`,
            key: `1/(1+(${fr(B)})*exp(-${k}*x))`,
            alt: `exp(${k}*x)/(exp(${k}*x)+(${fr(B)}))`,
            wrong: `(${fr(y0)})*exp(${k}*x)`,
            get: (x) => 1 / (1 + B * Math.exp(-k * x)),
            second: (x) => {
              let y = y0;
              const h = x / 10000;
              for (let i = 0; i < 10000; i++) {
                const mid = y + 0.5 * h * k * y * (1 - y);
                y += h * k * mid * (1 - mid);
              }
              return y;
            },
            reason: `Partial fractions give ln|y/(1−y)|=${k}x+C. At x=0, y/(1−y)=${fr(y0 / (1 - y0))}. Solving gives y=1/(1+(${fr(B)})e^(−${k}x)).`,
          };
        },
      },
    },
  }),
];
const C = [
  conceptFamily({
    id: 'c2.extrema',
    exam: 'c2',
    ch: '4',
    title: 'A critical point is a candidate',
    topics: ['extrema', 'optimization'],
    hints: [
      'Separate a necessary condition from a sufficient one.',
      'Compare the behavior on both sides, or compare every closed-interval candidate.',
    ],
    forms: {
      flat: {
        ask: 'At x=0, f(x)=x³ has derivative zero. What follows?',
        source: S('2B-1, stationary-point reasoning; original cubic transfer'),
        options: [
          ['It need not have an extremum.', 'The derivative is positive on both sides of zero.'],
          ['It must have a minimum.', 'A zero derivative does not determine a sign change.'],
          ['It must have a maximum.', 'The function keeps increasing through the stationary point.'],
        ],
      },
      endpoint: {
        ask: 'A continuous function is optimized on a closed interval. Which candidates must be compared?',
        source: 'OpenStax Calculus Volume 1, §4.3, Closed Interval Method',
        options: [
          [
            'Interior critical points and both endpoints.',
            'An absolute extremum can occur at a boundary with nonzero slope.',
          ],
          [
            'Only zeros of the derivative.',
            'That misses endpoints and points where a derivative does not exist.',
          ],
          ['Only the midpoint and endpoints.', 'An interior extremum need not lie at the midpoint.'],
        ],
      },
      endpoint: {
        ask: "A function is continuous on [a,b] and its derivative exists and is nonzero everywhere inside. Where is its maximum?",
        options: [
          ["At an endpoint.", "With no interior critical point, the extreme values must sit at a or b."],
          ["Nowhere, since there is no critical point.", "The extreme value theorem guarantees a maximum on a closed interval."],
          ["At the midpoint.", "Nothing singles out the midpoint."],
        ],
      },
      corner: {
        ask: "For f(x)=|x−2| on [0,5], which point must be checked although f′ does not exist there?",
        options: [
          ["x=2, the corner.", "Critical points include points without a derivative. The minimum is there."],
          ["None: only zeros of f′ count.", "A corner can hold an extreme value."],
          ["Only x=5.", "The endpoints are checked too, but the corner holds the minimum."],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c2.inflection',
    exam: 'c2',
    ch: '4',
    title: 'A zero second derivative needs a sign test',
    topics: ['curve sketching'],
    hints: [
      'An inflection concerns a change in concavity.',
      'Test the sign of the second derivative on both sides.',
    ],
    forms: {
      quartic: {
        ask: 'For f(x)=x⁴, f″(0)=0. Is zero an inflection point?',
        source: S('2B-2, inflection sign test; original quartic transfer'),
        options: [
          ['No. Concavity stays upward on both sides.', 'The second derivative 12x² never becomes negative.'],
          [
            'Yes, because the second derivative vanishes.',
            'A zero is only a candidate; concavity must change.',
          ],
          [
            'Yes, because it is a minimum.',
            'A minimum concerns the first derivative, not a concavity change.',
          ],
        ],
      },
      cubic: {
        ask: 'For f(x)=x³, what makes zero an inflection point?',
        source: S('2B-2(a)'),
        options: [
          [
            'Its second derivative changes sign there.',
            'The second derivative 6x is negative on the left and positive on the right.',
          ],
          ['Its first derivative changes sign there.', 'The first derivative 3x² does not change sign.'],
          ['Its value happens to be zero.', 'Vertical translation would not change concavity.'],
        ],
      },
      undefined: {
        ask: "For f(x)=x^(1/3), f″(0) does not exist. Is zero an inflection point?",
        options: [
          ["Yes: the concavity changes sign across zero.", "f″ is positive for x<0 and negative for x>0. The sign change is what matters."],
          ["No: f″(0) would have to be zero.", "Inflection needs a change of concavity, not a zero of f″."],
          ["No: the tangent there is vertical.", "A vertical tangent does not prevent a change of concavity."],
        ],
      },
      change: {
        ask: "The second derivative changes from negative to positive at c. What is c?",
        options: [
          ["An inflection point.", "The graph turns from concave down to concave up."],
          ["A local minimum.", "That needs f′ to change sign, not f″."],
          ["A critical point.", "f′(c) need not be zero there."],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c2.mvt-hypotheses',
    exam: 'c2',
    ch: '4',
    title: 'The theorem needs its hypotheses',
    topics: ['mean value theorem'],
    hints: [
      'List continuity and differentiability requirements separately.',
      'Check an interior point where the graph has a corner or a gap.',
    ],
    forms: {
      corner: {
        ask: 'Does the Mean Value Theorem guarantee a zero slope for |x| on [−1,1]?',
        source: 'OpenStax Calculus Volume 1, §4.4, Mean Value Theorem hypotheses',
        options: [
          [
            'No. Differentiability fails at the interior corner.',
            'Equal endpoint values do not repair the missing interior derivative.',
          ],
          [
            'Yes, because the endpoints have equal values.',
            'Rolle’s theorem still requires differentiability throughout the interior.',
          ],
          [
            'No, because |x| is discontinuous at zero.',
            'The function is continuous; its one-sided slopes disagree.',
          ],
        ],
      },
      existence: {
        ask: 'If the Mean Value Theorem applies, does it identify exactly one matching tangent?',
        source: S('2G-1(c)'),
        options: [
          [
            'No. It guarantees at least one, and several may exist.',
            'The cubic example on [−2,2] has two matching interior slopes.',
          ],
          [
            'Yes, uniqueness is part of the theorem.',
            'Existence is the conclusion; uniqueness needs additional information.',
          ],
          ['The matching point must be the midpoint.', 'The theorem does not prescribe a location.'],
        ],
      },
      pole: {
        ask: "Does the Mean Value Theorem apply to f(x)=1/x on [−1,1]?",
        options: [
          ["No: f is not continuous on [−1,1].", "The interval contains the pole at zero."],
          ["Yes: f is differentiable wherever it is defined.", "The theorem needs continuity on the whole closed interval."],
          ["Yes, with c=0.", "f is not even defined at zero."],
        ],
      },
      rolle: {
        ask: "A differentiable f has f(0)=f(3)=5. What must happen somewhere in (0,3)?",
        options: [
          ["f′(c)=0 for some c.", "Rolle's theorem: equal end values force a horizontal tangent."],
          ["f(c)=0 for some c.", "Equal end values give a zero slope, not a zero value."],
          ["f is constant.", "One horizontal tangent does not make f constant."],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c2.related-constraint',
    exam: 'c2',
    ch: '3',
    title: 'Differentiate before freezing a moving quantity',
    topics: ['related rates'],
    hints: [
      'Distinguish a quantity fixed throughout motion from a value true at one instant.',
      'Apply the chain rule to every quantity that depends on time.',
    ],
    forms: {
      constantVolume: {
        ask: 'A constraint r²h=C holds as r and h vary with time. Which rate equation is correct?',
        source: citation(1, '1F-8(a), constant-volume constraint'),
        options: [
          [
            String.raw`$2rh\,r'+r^2h'=0$.`,
            'Both changing factors contribute; the constant has derivative zero.',
          ],
          [String.raw`$2r\,r'+h'=0$.`, 'The missing h and r² factors change the constraint.'],
          [String.raw`$r^2h'=0$.`, 'That freezes a radius that the question says is changing.'],
        ],
      },
      instant: {
        ask: 'For x²+y²=25, a student substitutes x=3 and y=4 before differentiating in time. What goes wrong?',
        source: 'OpenStax Calculus Volume 1, §4.1, Related Rates method',
        options: [
          [
            'The time dependence disappears before the rates are found.',
            'Differentiate the full identity first; only then insert instantaneous positions.',
          ],
          [
            'Nothing: positions always stay constant.',
            'The equation fixes the sum of squares, not each coordinate.',
          ],
          [
            'The chain rule can be omitted because the length is fixed.',
            'A fixed total still relates changing coordinates.',
          ],
        ],
      },
      ladder: {
        ask: "A 10 ft ladder slides with x²+y²=100. When x=6, which equation links the rates?",
        options: [
          ["2x·dx/dt+2y·dy/dt=0.", "Differentiate the constraint in time, then substitute x=6 and y=8."],
          ["dx/dt+dy/dt=0.", "The squares carry the factors x and y into the rates."],
          ["2x+2y=0.", "That differentiates with respect to x, not time."],
        ],
      },
      cone: {
        ask: "Water in a cone has V=πr²h/3 with r=h/2 at every depth. What comes first?",
        options: [
          ["Replace r by h/2, then differentiate V in time.", "With one variable left, the chain rule ties dV/dt to dh/dt."],
          ["Put in the current depth, then differentiate.", "A frozen depth has no rate."],
          ["Differentiate h only and hold r fixed.", "r changes with the water level."],
        ],
      },
    },
  }),
];
export default [...B, ...C];

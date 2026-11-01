import { problem, kase } from '../kit.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { cylinderDesign } from '@flux/subjects/math/containers.js';
import { choose, citation, numeric, formulaFamily, numericFamily, conceptFamily } from './rework-kit.js';
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
        ask: String.raw`Find the linear approximation to $\sqrt{4+x}$ at $x=0$.`,
        key: '2+x/4',
        alt: '(8+x)/4',
        wrong: '2+x/2',
        get: (x) => 2 + x / 4,
        second: (x) => 2 + ((Math.sqrt(4 + 1e-5) - Math.sqrt(4 - 1e-5)) / 2e-5) * x,
        source: S('2A-1, a=4, b=1'),
        reason:
          'The value at zero is 2 and the derivative there is 1/4. Multiply that slope by the displacement x.',
      },
      reciprocal: {
        ask: String.raw`Find the linear approximation to $1/(2+x)$ at $x=0$.`,
        key: '1/2-x/4',
        alt: '(2-x)/4',
        wrong: '1/2+x/4',
        get: (x) => 0.5 - x / 4,
        second: (x) => 0.5 + ((1 / (2 + 1e-5) - 1 / (2 - 1e-5)) / 2e-5) * x,
        source: S('2A-2, a=2, b=1'),
        reason: 'The reciprocal is decreasing. Its derivative at zero is −1/4, not +1/4.',
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
        ask: String.raw`Find the quadratic approximation to $1/(1-x)$ centered at $x=1/2$.`,
        key: '2+4*(x-0.5)+8*(x-0.5)^2',
        alt: '8*x^2-4*x+2',
        wrong: '2+4*x+8*x^2',
        get: (x) => 2 + 4 * (x - 0.5) + 8 * (x - 0.5) ** 2,
        second: (x) => {
          const f = (t) => 1 / (1 - t),
            h = 1e-4,
            d = x - 0.5;
          return (
            f(0.5) +
            ((f(0.5 + h) - f(0.5 - h)) / (2 * h)) * d +
            ((f(0.5 + h) - 2 * f(0.5) + f(0.5 - h)) / (2 * h * h)) * d * d
          );
        },
        source: S('2A-8'),
        reason: 'At the center, f=2, f′=4 and f″=16. The quadratic coefficient is f″/2=8.',
      },
      binomial: {
        ask: String.raw`Find the quadratic approximation to $(1+x)^3$ centered at zero.`,
        key: '1+3*x+3*x^2',
        alt: '3*x*(1+x)+1',
        wrong: '1+3*x+6*x^2',
        get: (x) => 1 + 3 * x + 3 * x * x,
        second: (x) => (1 + x) ** 3 - x ** 3,
        source: S('2A-10, r=3'),
        reason:
          'The binomial expansion is 1+3x+3x²+x³. Discard terms of degree above two, not the factor 1/2 in the Taylor coefficient.',
      },
    },
  }),
  numericFamily({
    id: 'c2.mvt',
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
        ask: 'For f(x)=x² on [0,1], find the Mean Value Theorem point c.',
        answer: 0.5,
        second: () => root((x) => 2 * x - 1, 0, 1),
        source: S('2G-1(a)'),
        reason: 'The secant slope is one. Solve 2c=1.',
        traps: [
          [1, 'That is the secant slope. The question asks for its contact coordinate.'],
          [0, 'An endpoint is not an interior Mean Value Theorem point.'],
        ],
      },
      logarithm: {
        ask: 'For f(x)=ln x on [1,2], find the Mean Value Theorem point c.',
        answer: 1 / Math.log(2),
        second: () => root((x) => Math.log(2) - 1 / x, 1, 2),
        source: S('2G-1(b)'),
        reason: 'The secant slope is ln 2. Solve 1/c=ln 2 and check 1<c<2.',
        traps: [
          [Math.log(2), 'That is the secant slope. Invert it to solve 1/c=ln 2.'],
          [1.5, 'The theorem does not require the interval midpoint.'],
        ],
      },
      cubic: {
        ask: 'For f(x)=x³−x on [−2,2], find the positive Mean Value Theorem point c.',
        answer: 2 / Math.sqrt(3),
        second: () => root((x) => 3 * x * x - 4, 0, 2),
        source: S('2G-1(c), positive root'),
        reason:
          'The secant slope is three. Thus 3c²−1=3. Two interior roots exist; the question selects the positive one.',
        traps: [
          [-2 / Math.sqrt(3), 'That is the negative branch. Read the sign requested for c.'],
          [Math.sqrt(3), 'The derivative equation is 3c²=4, not c²=3.'],
        ],
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
        ask: 'For f(x)=x−x³, find the positive starting value where the first Newton update divides by zero.',
        answer: 1 / Math.sqrt(3),
        second: () => root((x) => 3 * x * x - 1, 0, 1),
        source: S('2F-5(a)'),
        reason: 'The derivative 1−3x² vanishes at the requested starting value, while f is not zero.',
        traps: [
          [1 / Math.sqrt(5), 'That produces a two-cycle, rather than division by zero.'],
          [1, 'This is already a root. Its nonzero derivative makes the update valid.'],
        ],
      },
      cycle: {
        ask: 'For f(x)=x−x³, find the positive nonzero starting value whose Newton iterates alternate between x and −x.',
        answer: 1 / Math.sqrt(5),
        second: () => root((x) => 5 * x * x - 1, 0.1, 0.55),
        source: S('2F-5(b)'),
        reason:
          'The map is N(x)=−2x³/(1−3x²). Set N(x)=−x, cancel the nonzero x and solve 5x²=1. Neither point is a root.',
        traps: [
          [1 / Math.sqrt(3), 'That makes the map not defined. A cycle requires both updates to exist.'],
          [0, 'Zero is a fixed root, not a nonzero two-cycle.'],
        ],
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
    minVersions: 2,
    vars: { k: choose([1, 2]) },
    derive: ($) => ({ V: 330, r: Math.cbrt(330 / ($.k * Math.PI)) }),
    text: (T, $) =>
      `An ideal cylindrical container holds 330 cm³. Its wall and ${$.k === 1 ? 'one flat bottom' : 'two flat ends'} use equal-thickness sheet. Find the height/radius ratio that minimizes sheet area.`,
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
        if (cylinderDesign(330, a, $.k).area < cylinderDesign(330, b, $.k).area) hi = b;
        else lo = a;
      }
      const r = (lo + hi) / 2;
      return { ratio: cylinderDesign(330, r, $.k).h / r };
    },
    sim: {
      scenario: 'closed',
      setup(s, $) {
        s.V = 330;
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
        { k: 1 },
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
        ask: String.raw`Find $F(x)$ with $F'(x)=(x^3+1)^2$ and $F(0)=0$.`,
        key: 'x^7/7+x^4/2+x',
        alt: '(2*x^7+7*x^4+14*x)/14',
        wrong: '(x^3+1)^3/3',
        get: (x) => x ** 7 / 7 + x ** 4 / 2 + x,
        second: (x) => simpson((t) => (t ** 3 + 1) ** 2, 0, x),
        source: citation(1, '1E-2(c), with C=0'),
        reason: 'Expand (x³+1)²=x⁶+2x³+1. Integrate each term. The initial condition makes C zero.',
      },
      sum: {
        ask: String.raw`Find $F(x)$ with $F'(x)=2x+3$ and $F(0)=0$.`,
        key: 'x^2+3*x',
        alt: 'x*(x+3)',
        wrong: '2*x^2+3*x',
        get: (x) => x * x + 3 * x,
        second: (x) => simpson((t) => 2 * t + 3, 0, x),
        source: citation(1, '1E-2(a), a=2, b=3, C=0'),
        reason: 'The antiderivative of 2x is x², not 2x². Fix C from the stated starting value.',
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
        ask: String.raw`Solve $y'=2y$ with $y(0)=3$. Write $y(x)$.`,
        key: '3*exp(2*x)',
        alt: 'exp(2*x)*3',
        wrong: '3+2*x',
        get: (x) => 3 * Math.exp(2 * x),
        second: (x) => {
          let y = 3;
          const h = x / 10000;
          for (let i = 0; i < 10000; i++) y *= 1 + 2 * h + 2 * h * h;
          return y;
        },
        source: E('Session 40, Exponential Growth and Inhibited Growth, solution (a), a=3, r=2'),
        reason: 'Separation gives ln|y|=2x+C. The initial value picks y=3e^(2x).',
      },
      inhibited: {
        ask: String.raw`Solve $y'=y(1-y)$ with $y(0)=1/2$. Write $y(x)$.`,
        key: '1/(1+exp(-x))',
        alt: 'exp(x)/(1+exp(x))',
        wrong: 'exp(x)/2',
        get: (x) => 1 / (1 + Math.exp(-x)),
        second: (x) => {
          let y = 0.5;
          const h = x / 10000;
          for (let i = 0; i < 10000; i++) {
            const mid = y + 0.5 * h * y * (1 - y);
            y += h * mid * (1 - mid);
          }
          return y;
        },
        source: E('Session 40, Exponential Growth and Inhibited Growth, solution (b), s=r=a=1'),
        reason:
          'Partial fractions give ln|y/(1−y)|=x+C. The initial value makes C zero. Solving gives y=1/(1+e^(−x)).',
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
    },
  }),
];
export default [...B, ...C];

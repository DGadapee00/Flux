import { problem, kase, sym } from '../kit.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { riemann1d } from '@flux/subjects/math/riemann.js';
import { spheroid } from '@flux/subjects/math/spheroid.js';
import { choose, citation, numeric, numericFamily, formulaFamily, conceptFamily } from './rework-kit.js';
const S = (p) => citation(3, p),
  E = (p) => `MIT OCW 18.01SC, Fall 2010, ${p}`;
const B = [
  numericFamily({
    id: 'c3.riemann',
    exam: 'c3',
    ch: '5',
    lab: 'riemann',
    title: 'The endpoint and the shape both matter',
    topics: ['integration'],
    hints: [
      'A Riemann sum multiplies each sample height by the width of its strip.',
      'List the actual sample coordinates before adding their heights.',
      'For a curve that changes direction, a left sum need not be a lower sum.',
    ],
    forms: {
      cubeRight: {
        ask: 'Use four equal subintervals and right endpoints to approximate the integral of x³ on [0,1].',
        answer: 25 / 64,
        second: () => riemann1d((x) => x ** 3, 0, 1, { n: 4, sample: 'right' }).sum,
        graphId: 'cube',
        a: 0,
        b: 1,
        n: 4,
        sample: 'right',
        reason: 'Add the four right-end heights 1/64, 8/64, 27/64 and 64/64, then multiply by 1/4.',
        source: S('3B-3(a), corrected arithmetic; see ERRATA.md'),
        note: 'The printed 15/128 contradicts the displayed sum. Direct addition gives 25/64.',
        traps: [
          [25 / 16, 'That is the sum of the heights. Multiply by the subinterval width 1/4.'],
          [9 / 64, 'That uses left endpoints rather than the requested right endpoints.'],
        ],
      },
      cubeLeft: {
        ask: 'Use four equal subintervals and left endpoints to approximate the integral of x³ on [0,1].',
        answer: 9 / 64,
        second: () => riemann1d((x) => x ** 3, 0, 1, { n: 4, sample: 'left' }).sum,
        graphId: 'cube',
        a: 0,
        b: 1,
        n: 4,
        sample: 'left',
        reason: 'Add the four left-end heights 0, 1/64, 8/64 and 27/64, then multiply by 1/4.',
        source: S('3B-3(a), corrected arithmetic; see ERRATA.md'),
        note: 'The printed 7/128 contradicts the displayed sum. Direct addition gives 9/64.',
        traps: [
          [
            9 / 16,
            'The strip width is missing. Summing heights alone does not give the integral approximation.',
          ],
          [25 / 64, 'That is the right-endpoint sum.'],
        ],
      },
      squareLeft: {
        ask: 'Use four equal subintervals and left endpoints for x² on [−1,3].',
        answer: 6,
        second: () => riemann1d((x) => x * x, -1, 3, { n: 4, sample: 'left' }).sum,
        graphId: 'quad',
        a: -1,
        b: 3,
        n: 4,
        sample: 'left',
        reason:
          'The samples are −1, zero, one and two, with unit strip width. Their squared heights sum to six.',
        source: S('3B-3(b), left sum'),
        traps: [
          [
            5,
            'That is the lower sum. The curve decreases and then increases, so the left sum is not the lower sum.',
          ],
          [14, 'That uses right endpoints rather than left endpoints.'],
        ],
      },
    },
    sim: {
      scenario: 'quad',
      setup(s, $) {
        Object.assign(s, { graphId: $.v.graphId, a: $.v.a, b: $.v.b, n: $.v.n, sample: $.v.sample });
      },
      read: (c) => ({ answer: c.sum }),
    },
  }),
  numericFamily({
    id: 'c3.definite',
    level: 1,
    exam: 'c3',
    ch: '5',
    title: 'Evaluate first, then subtract both endpoints',
    topics: ['definite integral'],
    hints: [
      'Find an antiderivative on the full interval before using the Fundamental Theorem.',
      'Substitution can remove a shifted root or a compound denominator.',
      'Evaluate the antiderivative at both endpoints with the correct orientation.',
    ],
    forms: {
      shiftedRoot: {
        ask: String.raw`Evaluate $\int_3^6 (x-2)^{-1/2}\,dx$.`,
        answer: 2,
        second: () => simpson((x) => 1 / Math.sqrt(x - 2), 3, 6),
        source: S('3C-1'),
        reason: 'An antiderivative is 2√(x−2). Subtract its values at 6 and 3.',
        traps: [
          [4, 'That is the upper-end antiderivative value alone.'],
          [-2, 'The upper and lower endpoints were subtracted in reverse order.'],
        ],
      },
      rational: {
        ask: String.raw`Evaluate $\int_1^2 x/(1+x^2)\,dx$.`,
        answer: 0.5 * Math.log(2.5),
        second: () => simpson((x) => x / (1 + x * x), 1, 2),
        source: S('3C-3(a)'),
        reason: 'Set u=1+x². The missing factor two in du requires one half outside the logarithm.',
        traps: [
          [Math.log(2.5), 'The substitution needs the factor 1/2 because du=2x dx.'],
          [
            0.5 * Math.log(10),
            'Endpoint evaluation subtracts logarithms. Adding them multiplies the endpoint arguments instead.',
          ],
        ],
      },
    },
  }),
  formulaFamily({
    id: 'c3.ftc',
    exam: 'c3',
    ch: '5',
    title: 'An accumulation derivative includes a moving boundary',
    topics: ['fundamental theorem', 'symbolic'],
    hints: [
      'First regard the upper endpoint as the independent variable.',
      'Differentiate the accumulated integral using its endpoint integrand.',
      'If the endpoint is itself a function, multiply by its derivative.',
    ],
    forms: {
      root: {
        ask: String.raw`Let $F(x)=\int_0^x(1+t^2)^{-1/2}\,dt$. Find $F'(x)$.`,
        key: '1/sqrt(1+x^2)',
        alt: '(1+x^2)^(-0.5)',
        wrong: '1/(1+x^2)',
        get: (x) => 1 / Math.sqrt(1 + x * x),
        second: (x) => {
          const F = (z) => simpson((t) => 1 / Math.sqrt(1 + t * t), 0, z),
            h = 1e-5;
          return (F(x + h) - F(x - h)) / (2 * h);
        },
        source: S('3D-1(a), a=1'),
        reason:
          'For a continuous integrand, an extra interval contributes approximately its endpoint height times its width.',
      },
      composite: {
        ask: String.raw`Let $G(x)=\int_0^{x^2}\sin(t^3)\,dt$. Find $G'(x)$.`,
        key: '2*x*sin(x^6)',
        alt: 'sin((x^2)^3)*2*x',
        wrong: 'sin(x^6)',
        get: (x) => 2 * x * Math.sin(x ** 6),
        second: (x) => {
          const G = (z) => simpson((t) => Math.sin(t ** 3), 0, z * z),
            h = 1e-5;
          return (G(x + h) - G(x - h)) / (2 * h);
        },
        reason:
          'The endpoint integrand is sin((x²)³). Its interval endpoint moves at rate 2x. This is an original composite-boundary variant.',
      },
    },
  }),
  problem({
    id: 'c3.reconstruct',
    exam: 'c3',
    ch: '5',
    title: 'Recover an unknown integrand from its accumulation',
    kind: 'numeric',
    level: 3,
    topics: ['fundamental theorem'],
    minVersions: 2,
    vars: { point: choose([1, 2]) },
    derive: ($) => ({
      answer: Math.sin(Math.PI * $.point) / (2 * $.point) + (Math.PI * Math.cos(Math.PI * $.point)) / 2,
    }),
    text: (T, $) =>
      String.raw`A continuous $f$ satisfies $\int_0^{x^2}f(t)\,dt=x\sin(\pi x)$ for $x>0$. Find $f(${$.point ** 2})$.`,
    parts: [
      numeric('value', ($) => $.answer, 'integrand value', [
        [
          ($) => 2 * $.point * $.answer,
          'That differentiates the right side but omits division by the moving endpoint rate 2x.',
        ],
        [($) => -$.answer, 'Check the cosine at this integer multiple of π before assigning its sign.'],
      ]),
    ],
    hints: [
      'Differentiate the identity using the Fundamental Theorem and the chain rule.',
      'The right side needs the product rule, while the integral needs the derivative of its upper boundary.',
      'Solve for f(x²) before substituting the requested point.',
    ],
    steps: ($) => [
      String.raw`$2x f(x^2)=\sin(\pi x)+\pi x\cos(\pi x)$.`,
      String.raw`At $x=${$.point}$, the sine term vanishes. Divide by $2x$.`,
    ],
    second: ($) => {
      const H = (x) => x * Math.sin(Math.PI * x),
        h = 1e-6;
      return { value: (H($.point + h) - H($.point - h)) / (2 * h) / (2 * $.point) };
    },
    cases: [kase(E('Exam 3, solution 3(b)'), { point: 2 }, { value: Math.PI / 2 })],
  }),
  formulaFamily({
    id: 'c3.substitution',
    exam: 'c3',
    ch: '5',
    title: 'A substitution changes the differential too',
    topics: ['substitution', 'symbolic'],
    hints: [
      'Find an inner function whose derivative matches the remaining factor.',
      'Express both the differential and the integrand using that one variable.',
      'After integrating, restore the original variable and check the starting value.',
    ],
    forms: {
      sine: {
        ask: String.raw`Find $F$ with $F'(x)=\sin(5x)$ and $F(0)=-1/5$.`,
        key: '-cos(5*x)/5',
        alt: '-0.2*cos(5*x)',
        wrong: '-5*cos(5*x)',
        get: (x) => -Math.cos(5 * x) / 5,
        second: (x) => -0.2 + simpson((t) => Math.sin(5 * t), 0, x),
        source: S('3A-3(a), C=0'),
        reason: 'Set u=5x, so dx=du/5. The factor one fifth remains outside the antiderivative.',
      },
      compound: {
        ask: String.raw`Find $F$ with $F'(x)=2xe^{x^2}$ and $F(0)=1$.`,
        key: 'exp(x^2)',
        alt: 'e^(x*x)',
        wrong: 'exp(x^2)/(2*x)',
        get: (x) => Math.exp(x * x),
        second: (x) => 1 + simpson((t) => 2 * t * Math.exp(t * t), 0, x),
        reason:
          'Set u=x². The factor 2x dx is exactly du; no extra variable may remain in the substituted integral. This is an original exponential variant.',
      },
    },
  }),
  numericFamily({
    id: 'c3.area',
    exam: 'c3',
    ch: 'v2.2',
    lab: 'riemann',
    title: 'Area uses the width of each strip',
    topics: ['area'],
    hints: [
      'Choose one integration variable and keep every strip dimension in it.',
      'The strip width must be nonnegative between the intersections.',
      'Integrate that width over the interval, rather than subtracting unrelated endpoint heights.',
    ],
    forms: {
      horizontal: {
        ask: String.raw`A planar region has horizontal strip width $6y-2y^2$ for $0\le y\le3$. Find its area.`,
        answer: 9,
        second: () => simpson((y) => 6 * y - 2 * y * y, 0, 3),
        source: E('Exam 3, solution 1, horizontal-strip width'),
        reason:
          'The width is the right boundary minus the left boundary. Its integral is [3y²−2y³/3] from zero to three. The lab plots strip width against the integration variable.',
        graphId: 'strip',
        a: 0,
        b: 3,
        traps: [
          [18, 'That omits the quadratic part of the strip width when integrating.'],
          [-9, 'Reverse the boundary order to obtain a nonnegative strip width.'],
        ],
      },
      symmetric: {
        ask: String.raw`Find the area under $1-x^2$ and above zero on $[-1,1]$.`,
        answer: 4 / 3,
        second: () => simpson((x) => 1 - x * x, -1, 1),
        source: S('3C-6(b), a=1'),
        reason:
          'Use symmetry, or evaluate x−x³/3 at both endpoints. The positive width gives geometric area.',
        graphId: 'cap',
        a: -1,
        b: 1,
        traps: [
          [2 / 3, 'That is one half of the symmetric region.'],
          [-4 / 3, 'The graph lies above zero here, so its geometric area cannot be negative.'],
        ],
      },
    },
    sim: {
      scenario: 'quad',
      setup(s, $) {
        Object.assign(s, { graphId: $.v.graphId, a: $.v.a, b: $.v.b, n: 8, sample: 'mid' });
      },
      read: (c) => ({ answer: c.exact }),
    },
  }),
  numericFamily({
    id: 'c3.volume',
    exam: 'c3',
    ch: 'v2.2',
    lab: 'spheroid',
    title: 'Choose the radius perpendicular to the rotation axis',
    topics: ['volumes'],
    hints: [
      'A cross-section perpendicular to the axis is a circular disk.',
      'Solve the ellipse equation for the squared disk radius.',
      'Integrate disk area through the full axial extent, including both halves.',
    ],
    forms: {
      oblate: {
        ask: String.raw`Rotate $x^2+4y^2\le4$ about the y-axis. Find the volume.`,
        answer: (16 * Math.PI) / 3,
        second: () => simpson((t) => 16 * Math.PI * Math.sin(t) * Math.cos(t) ** 2, 0, Math.PI / 2),
        source: E('Session 58, Volume of a Spheroid, solution'),
        reason: 'At height y, disk radius squared is 4−4y². Integrate π(4−4y²) from −1 to one.',
        a: 2,
        c: 1,
        traps: [
          [(8 * Math.PI) / 3, 'That counts only one axial half.'],
          [8 * Math.PI, 'That uses the containing cylinder instead of the changing cross-section.'],
        ],
      },
      prolate: {
        ask: String.raw`Rotate $x^2+y^2/4\le1$ about the y-axis. Find the volume.`,
        answer: (8 * Math.PI) / 3,
        second: () => simpson((y) => Math.PI * (1 - (y * y) / 4), -2, 2),
        reason:
          'The disk area is π(1−y²/4), and the axis now runs from −2 to two. This is an original axis-configuration variant.',
        a: 1,
        c: 2,
        traps: [
          [
            (16 * Math.PI) / 3,
            'That interchanges the equatorial and axial radii; only the equatorial radius is squared.',
          ],
          [(4 * Math.PI) / 3, 'That omits one half of the axial interval.'],
        ],
      },
    },
    sim: {
      scenario: 'oblate',
      setup(s, $) {
        s.a = $.v.a;
        s.c = $.v.c;
        s.n = 8;
      },
      read: (c) => ({ answer: c.volume }),
    },
  }),
  numericFamily({
    id: 'c3.average',
    exam: 'c3',
    ch: 'v2.2',
    title: 'A time average weights the whole interval',
    topics: ['average value'],
    hints: [
      'An average value is the integral divided by interval length.',
      'Distinguish the area under the curve from the height of a rectangle with that area.',
      'Compare the result with the minimum and maximum values as a reasonableness check.',
    ],
    forms: {
      bank: {
        ask: 'A balance is A(t)=100 exp(0.05t) for 0≤t≤1 year. Find its average value over that year.',
        answer: (100 * Math.expm1(0.05)) / 0.05,
        printed: 102.5,
        second: () => simpson((t) => 100 * Math.exp(0.05 * t), 0, 1),
        source: E('Session 60, Average Bank Balance, solution (b)'),
        note: 'The source rounds the average to 102.5; the computation retains the unrounded value.',
        reason: 'The average is 100(e^0.05−1)/0.05, about 102.54219 currency units.',
        traps: [
          [100 * Math.exp(0.05), 'That is the final value, not the time average.'],
          [100, 'That is the initial value and ignores the growing balance.'],
        ],
      },
      parabola: {
        ask: 'Find the average value of x² on [0,3].',
        answer: 3,
        second: () => simpson((x) => x * x, 0, 3) / 3,
        reason:
          'The integral is nine and the interval length is three. This is an original polynomial variant.',
        traps: [
          [9, 'That is the integral. Divide it by the interval length to obtain an average height.'],
          [4.5, 'Averaging endpoint values works for a line, not an arbitrary curve.'],
        ],
      },
    },
  }),
  formulaFamily({
    id: 'c3.probability',
    exam: 'c3',
    ch: '5',
    title: 'Respect the support of a probability density',
    topics: ['probability', 'definite integral', 'symbolic'],
    hints: [
      'A probability is the integral of a density over the event interval.',
      'Split the interval wherever the density formula changes.',
      'Use the exponential antiderivative only on the nonnegative part of the support.',
    ],
    forms: {
      positive: {
        ask: String.raw`A waiting time has density $e^{-t}$ for $t\ge0$, and zero elsewhere. For $x>1$, express $P(1<X<x)$ in x.`,
        key: 'exp(-1)-exp(-x)',
        alt: '1/e-1/exp(x)',
        wrong: 'exp(-x)-exp(-1)',
        at: 2,
        get: (x) => Math.exp(-1) - Math.exp(-x),
        second: (x) => simpson((t) => Math.exp(-t), 1, x),
        source: E('Session 55, Probability Function, solution (a), λ=a=1'),
        reason:
          'Integrate e^(−t) from one to x. The antiderivative is −e^(−t), so endpoint subtraction gives a positive probability.',
      },
      crossing: {
        ask: String.raw`Use the same density. For $x>0$, express $P(-1<X<x)$ in x.`,
        key: '1-exp(-x)',
        alt: '(exp(x)-1)/exp(x)',
        wrong: 'exp(1)-exp(-x)',
        get: (x) => -Math.expm1(-x),
        second: (x) => simpson((t) => Math.exp(-t), 0, x),
        source: E('Session 55, Probability Function, solution (b), λ=1'),
        reason: 'The density vanishes from −1 to zero. Only the integral from zero to x contributes.',
      },
    },
  }),
  numericFamily({
    id: 'c3.quadrature',
    exam: 'c3',
    ch: 'v2.3',
    lab: 'numint',
    title: 'Change the interpolation rule, not the integral',
    topics: ['numerical integration'],
    hints: [
      'Identify which interpolation rule the question specifies.',
      'Both formulas use uniform spacing, but their endpoint and interior weights differ.',
      'For Simpson’s rule, verify that the number of subintervals is even.',
    ],
    forms: {
      simpson: {
        ask: String.raw`Use four equal subintervals and Simpson's rule for $\int_0^\pi\sin x\,dx$.`,
        answer: (Math.PI * (2 + 4 * Math.sqrt(2))) / 12,
        printed: 2.005,
        second: () => {
          let sum = 0;
          for (let i = 0; i <= 4; i++)
            sum += (i === 0 || i === 4 ? 1 : i % 2 ? 4 : 2) * Math.sin((i * Math.PI) / 4);
          return (Math.PI / 12) * sum;
        },
        source: S('3G-1(b), Simpson rule'),
        note: 'The source rounds to 2.005.',
        reason: 'The heights are 0, √2/2, 1, √2/2 and zero. Apply weights 1,4,2,4,1 and multiply by π/12.',
        method: 'simp',
        traps: [
          [(Math.PI * (1 + Math.sqrt(2))) / 4, 'That applies trapezoidal weights, not Simpson weights.'],
          [(2 + 4 * Math.sqrt(2)) / 3, 'That drops the subinterval width π/4.'],
        ],
      },
      trapezoid: {
        ask: String.raw`Use four equal subintervals and the trapezoidal rule for $\int_0^\pi\sin x\,dx$.`,
        answer: (Math.PI * (1 + Math.sqrt(2))) / 4,
        printed: 1.896,
        second: () => {
          let sum = 0;
          for (let i = 0; i < 4; i++)
            sum += ((Math.sin((i * Math.PI) / 4) + Math.sin(((i + 1) * Math.PI) / 4)) * Math.PI) / 8;
          return sum;
        },
        source: S('3G-1(b), trapezoidal rule'),
        note: 'The source rounds to 1.896.',
        reason: 'Use half weight at the two endpoints and full weight at the interior samples.',
        method: 'trap',
        traps: [
          [
            (Math.PI * (2 + 4 * Math.sqrt(2))) / 12,
            'That applies Simpson weights instead of trapezoidal weights.',
          ],
          [1 + Math.sqrt(2), 'That adds heights without multiplying by the subinterval width.'],
        ],
      },
    },
    sim: {
      scenario: 'coarse',
      setup(s) {
        s.n = 4;
      },
      read: (c, s, $) => ({ answer: c[$.v.method] }),
    },
  }),
];
B.push(
  numericFamily({
    id: 'c3.work',
    exam: 'c3',
    ch: 'v2.2',
    lab: 'riemann',
    title: 'Work depends on the force whose work is asked for',
    topics: ['work'],
    hints: [
      'Identify the force and its direction relative to displacement.',
      'For a variable force, integrate its signed component over displacement.',
      'A restoring force and the slow external stretching force have opposite signs.',
    ],
    forms: {
      external: {
        ask: 'A spring needs a force magnitude of 10 N at 0.2 m extension. Assume Hooke’s law. Find the work done by a slow external force in stretching it from equilibrium to 0.5 m.',
        answer: 6.25,
        second: () => simpson((x) => 50 * x, 0, 0.5),
        source:
          'OpenStax Calculus Volume 2, §2.5, Example 2.25, The Work Required to Stretch or Compress a Spring',
        reason:
          'The constant is k=10/0.2=50 N/m. Integrating 50x from zero to 0.5 gives 6.25 J. The lab plots the normalized external force F/k=x; multiply its integral by k.',
        multiplier: 50,
        traps: [
          [12.5, 'That applies the final force over the whole interval. The spring force rises from zero.'],
          [-6.25, 'That is the work done by the restoring spring, not the external force.'],
        ],
      },
      restoring: {
        ask: 'Use the same Hooke-law spring: force magnitude 10 N at 0.2 m extension. Find the work done by the spring itself while it is stretched from equilibrium to 0.5 m.',
        answer: -6.25,
        second: () => simpson((x) => -50 * x, 0, 0.5),
        reason:
          'The restoring force is −50x while displacement is positive. Its work is negative. The lab plots normalized external-force magnitude; change the sign for the spring’s work. This is an original force-agency variant.',
        multiplier: -50,
        traps: [
          [
            6.25,
            'That is the external stretching work. The spring’s restoring force opposes the displacement.',
          ],
          [-12.5, 'That uses the final restoring force as if it acted throughout the interval.'],
        ],
      },
    },
    sim: {
      scenario: 'line',
      setup(s) {
        s.graphId = 'normalizedForce';
        s.a = 0;
        s.b = 0.5;
        s.n = 8;
        s.sample = 'mid';
      },
      read: (c, s, $) => ({ answer: c.exact * $.v.multiplier }),
    },
  }),
);

B.push(
  numericFamily({
    id: 'c3.weighted',
    exam: 'c3',
    ch: 'v2.2',
    lab: 'riemann',
    title: 'A weighted mean divides a moment by total weight',
    topics: ['centres of mass', 'average value'],
    hints: [
      'A weighted mean is a first moment divided by total weight.',
      'Integrate coordinate times density for the numerator, and density alone for the denominator.',
      'Check whether symmetry already determines a coordinate.',
    ],
    forms: {
      horizontal: {
        ask: String.raw`On $[-1,3]$, weights have density $w(x)=4-(x-1)^2$. Find the weighted mean coordinate.`,
        answer: 1,
        second: () => simpson((x) => x * (4 - (x - 1) ** 2), -1, 3) / simpson((x) => 4 - (x - 1) ** 2, -1, 3),
        source: E('Session 61, Weighted Average, x-coordinate calculation'),
        reason:
          'The weight profile is symmetric about one. Its first moment and total weight are both 32/3, so their ratio is one. The lab plots that weight profile.',
        graphId: 'weightParabola',
        a: -1,
        b: 3,
        traps: [
          [0, 'That forgets the horizontal shift: the symmetry axis is x=1.'],
          [32 / 3, 'That is the first moment before division by total weight.'],
        ],
      },
      vertical: {
        ask: String.raw`On $[0,4]$, weights have density $w(y)=2\sqrt y$. Find the weighted mean coordinate.`,
        answer: 12 / 5,
        second: () => simpson((y) => 2 * y * Math.sqrt(y), 0, 4) / simpson((y) => 2 * Math.sqrt(y), 0, 4),
        source: E('Session 61, Weighted Average, y-coordinate calculation'),
        reason:
          'The total weight is 32/3. Its first moment is 128/5, so the ratio is 12/5. The lab plots the weight density against its coordinate.',
        graphId: 'weightRoot',
        a: 0,
        b: 4,
        traps: [
          [2, 'That is an unweighted interval midpoint. More weight lies toward the larger coordinate.'],
          [128 / 5, 'That is the first moment. Divide it by total weight before calling it a mean.'],
        ],
      },
    },
    sim: {
      scenario: 'quad',
      setup(s, $) {
        Object.assign(s, { graphId: $.v.graphId, a: $.v.a, b: $.v.b, n: 8, sample: 'mid' });
      },
      read: (c, s) => ({ answer: simpson((x) => x * c.g.f(x), s.a, s.b) / c.simp }),
    },
  }),
);

const C = [
  conceptFamily({
    id: 'c3.signed',
    exam: 'c3',
    ch: '5',
    title: 'Cancellation is part of a signed integral',
    topics: ['definite integral', 'area'],
    hints: [
      'A signed integral records orientation relative to the axis.',
      'Geometric area replaces a negative contribution by its magnitude.',
    ],
    forms: {
      odd: {
        ask: 'An odd continuous function is integrated on [−a,a]. Which statement is justified?',
        source: 'OpenStax Calculus Volume 1, §5.2, Symmetry of Integrals',
        options: [
          [
            'Its signed integral is zero; geometric area may be positive.',
            'Paired values cancel, while absolute values add.',
          ],
          [
            'The graph must have zero geometric area.',
            'Zero net area does not mean no positive or negative area.',
          ],
          ['Each half-interval integral must vanish.', 'The halves can be nonzero and opposite.'],
        ],
      },
      reverse: {
        ask: 'Reverse the bounds of a definite integral. What changes?',
        source: 'OpenStax Calculus Volume 1, §5.2, Properties of the Definite Integral',
        options: [
          [
            'The signed integral changes sign.',
            'Reversing the direction reverses every signed interval contribution.',
          ],
          [
            'The integral stays positive because it is area.',
            'A definite integral is signed; it is not automatically geometric area.',
          ],
          ['The absolute value doubles.', 'No region is added by reversing orientation.'],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c3.ftc-sign',
    exam: 'c3',
    ch: '5',
    title: 'An accumulation’s sign and slope answer different questions',
    topics: ['fundamental theorem'],
    hints: [
      'The accumulated integral is a running total.',
      'Its derivative reads the current integrand, not the total already accumulated.',
    ],
    forms: {
      increasing: {
        ask: 'An accumulation integral is negative at x, but its integrand is positive there. What follows locally?',
        source: S('3D-3, accumulation-graph reasoning; original sign transfer'),
        options: [
          [
            'The accumulation is increasing, although its value is negative.',
            'Its slope is the positive endpoint integrand.',
          ],
          [
            'It is decreasing because its value is negative.',
            'Value and rate of change can have different signs.',
          ],
          [
            'It must be positive because its slope is positive.',
            'A positive slope does not instantly erase a negative running total.',
          ],
        ],
      },
      maximum: {
        ask: 'A continuous integrand changes from positive to negative at c. What happens to its accumulation?',
        source: S('3D-3, accumulation-graph reasoning'),
        options: [
          ['It has a local maximum at c.', 'The accumulation slope changes from positive to negative.'],
          ['It has a local minimum.', 'That would require the opposite slope change.'],
          ['It must cross zero.', 'The accumulated total depends on the whole preceding interval.'],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c3.slices',
    exam: 'c3',
    ch: 'v2.2',
    title: 'A radius and a disk area are different quantities',
    topics: ['volumes'],
    hints: [
      'A small volume is cross-sectional area times thickness.',
      'Express the radius in the variable that labels your slices.',
    ],
    forms: {
      disk: {
        ask: 'A disk slice has radius √x and thickness dx. What is its volume element?',
        source: 'OpenStax Calculus Volume 2, §2.2, Disk Method',
        options: [
          [String.raw`$\pi x\,dx$.`, 'The area is π times the radius squared, then multiplied by thickness.'],
          [String.raw`$\pi\sqrt{x}\,dx$.`, 'That uses radius rather than squared radius in the disk area.'],
          [String.raw`$2\pi\sqrt{x}\,dx$.`, 'That is circumference times thickness; it is not disk volume.'],
        ],
      },
      washer: {
        ask: 'A washer has outer radius R and inner radius r. Which area belongs in its volume integral?',
        source: 'OpenStax Calculus Volume 2, §2.2, Washer Method',
        options: [
          [String.raw`$\pi(R^2-r^2)$.`, 'Subtract the two disk areas.'],
          [String.raw`$\pi(R-r)^2$.`, 'The square of the wall thickness is not the annular area.'],
          [String.raw`$2\pi(R-r)$.`, 'That has units of length rather than area.'],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c3.density',
    exam: 'c3',
    ch: '5',
    title: 'Probability uses area, not density height',
    topics: ['probability'],
    hints: [
      'A density is not a probability by itself.',
      'Integrate over the event and respect the density’s support.',
    ],
    forms: {
      height: {
        ask: 'A continuous probability density exceeds one at some points. Is that automatically invalid?',
        source: E('Session 55, Probability Function, normalization; original density-height transfer'),
        options: [
          [
            'No. Nonnegative area over the full support must be one.',
            'A narrow density can be tall while its total integral remains one.',
          ],
          [
            'Yes. Every density value is a probability.',
            'Only an area over an interval gives a probability.',
          ],
          ['Yes. Density must always be constant.', 'Many valid distributions have varying density.'],
        ],
      },
      point: {
        ask: 'For a continuous density, what probability belongs to one exact point?',
        source: E('Session 55, Probability Function, integral definition'),
        options: [
          [
            'Zero. A point has zero interval width.',
            'A finite density value integrated over a zero-width interval contributes zero.',
          ],
          [
            'The density height at the point.',
            'Height lacks the interval-width factor required for a probability.',
          ],
          [
            'One, because that point is in the support.',
            'Membership in the support does not make an outcome certain.',
          ],
        ],
      },
    },
  }),
  conceptFamily({
    id: 'c3.numerical-error',
    exam: 'c3',
    ch: 'v2.3',
    title: 'Accuracy claims need a shape or smoothness condition',
    topics: ['numerical integration'],
    hints: [
      'Identify what the interpolation rule draws between samples.',
      'Compare the interpolant with the function, or use a derivative bound.',
    ],
    forms: {
      trapezoid: {
        ask: 'A function is concave downward throughout a positive integration interval. How does the trapezoidal rule compare with its integral?',
        source: S('3G-5'),
        options: [
          [
            'It underestimates. The chords lie below the curve.',
            'Integrating a lower interpolant gives a lower estimate.',
          ],
          [
            'It always overestimates because trapezoids are wider.',
            'The panel widths are the same; the chord height determines the sign.',
          ],
          ['Concavity gives no information.', 'A continuous concave graph lies above each of its chords.'],
        ],
      },
      smoothness: {
        ask: 'Can Simpson’s rule be assumed exact for every smooth function?',
        source: S('3G-1, comparison of rules'),
        options: [
          [
            'No. It is exact for cubics, and higher derivatives control general error.',
            'Smoothness alone does not make the fourth-derivative error vanish.',
          ],
          [
            'Yes. It uses curves rather than lines.',
            'A quadratic interpolant does not match every smooth curve.',
          ],
          ['Yes, if the endpoint values are zero.', 'Interior behavior still controls the integral.'],
        ],
      },
    },
  }),
];
export default [...B, ...C];

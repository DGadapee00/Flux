import { simpson } from '@flux/subjects/math/quadrature.js';
import { numericFamily, formulaFamily, symbolicFamily, conceptFamily, citation } from './rework-kit.js';
const S = (p) => citation(4, p),
  E = (p) => `MIT OCW 18.01SC, Fall 2010, ${p}`,
  exam = 'c5',
  ch = 'v2.7';
const num = (id, title, topics, forms, hints, level = 2) =>
  numericFamily({ id: 'c5.' + id, exam, ch, title, topics, forms, hints, level });
const form = (id, title, topics, forms, hints) =>
  formulaFamily({ id: 'c5.' + id, exam, ch, title, topics, forms, hints, variable: 't' });
const B = [
  num(
    'coordinates',
    'A quadrant before an angle',
    ['polar'],
    {
      radius: {
        ask: 'The Cartesian point is (1,√3). Find its nonnegative polar radius.',
        answer: 2,
        second: () => Math.sqrt(1 + 3),
        reason: 'The distance is √(1²+(√3)²)=2. The first-quadrant angle is π/3.',
        source: S('4H-1(c), reverse conversion'),
        traps: [
          [4, 'That is the squared radius. Take the nonnegative square root.'],
          [Math.PI / 3, 'That is the angle, not the requested distance from the origin.'],
        ],
      },
      angle: {
        ask: 'The point is (−2,−2). Give its polar angle in [0,2π), in radians.',
        answer: (5 * Math.PI) / 4,
        second: () => Math.atan2(-2, -2) + 2 * Math.PI,
        reason:
          'Both coordinates are negative, so choose the third quadrant. The reference angle π/4 becomes 5π/4.',
        source: S('4H-1(h)'),
        traps: [
          [Math.PI / 4, 'The quotient y/x loses the quadrant. Both coordinates are negative.'],
          [
            (-3 * Math.PI) / 4,
            'That is equivalent geometrically, but outside the requested interval. Add one full turn.',
          ],
        ],
      },
    },
    [
      'Use radius as distance and angle as direction.',
      'A one-argument arctangent loses the sign information needed to choose a quadrant.',
    ],
  ),
  num(
    'elimination',
    'Elimination keeps a locus but loses timing',
    ['parametric'],
    {
      hyperbola: {
        ask: 'For x=t+1/t and y=t−1/t, t≠0, compute the invariant x²−y².',
        answer: 4,
        second: () => {
          const t = 1.7,
            x = t + 1 / t,
            y = t - 1 / t;
          return x * x - y * y;
        },
        reason:
          'The t² and t⁻² terms cancel after subtracting the two expansions. The cross terms add to four.',
        source: S('4E-2'),
        traps: [
          [0, 'The cross terms have opposite signs before subtraction; they do not cancel.'],
          [2, 'Each square contributes a cross term of magnitude two. Subtraction adds both.'],
        ],
      },
      circle: {
        ask: 'For x=1+sin t and y=4+cos t, compute (x−1)²+(y−4)².',
        answer: 1,
        second: () => Math.sin(0.7) ** 2 + Math.cos(0.7) ** 2,
        reason: 'Subtract the fixed centre before applying sin²t+cos²t=1.',
        source: S('4E-3'),
        traps: [
          [
            17,
            'That is the squared distance of the centre from the origin, not the circle’s squared radius.',
          ],
          [2, 'Sin²t and cos²t add to one, not one each.'],
        ],
      },
    },
    [
      'Use an identity after removing translations or reciprocal terms.',
      'Eliminating t does not record its allowed interval or the direction of travel.',
    ],
  ),
  symbolicFamily({
    id: 'c5.tangent',
    exam,
    ch,
    title: 'A slope from an implicit circle',
    topics: ['parametric'],
    forms: {
      upper: {
        tex: String.raw`\sqrt{16-x^2}`,
        fn: (x) => Math.sqrt(16 - x * x),
        df: (x) => -x / Math.sqrt(16 - x * x),
        key: '-x/sqrt(16-x^2)',
        alt: '-x*(16-x^2)^(-1/2)',
        wrong: 'x/sqrt(16-x^2)',
        domain: '−4<x<4',
        reason: 'Differentiate x²+y²=16: 2x+2yy′=0. On the upper branch y is positive.',
        source: S('4E-7, upper branch, a=4 parameter substitution'),
      },
      lower: {
        tex: String.raw`-\sqrt{16-x^2}`,
        fn: (x) => -Math.sqrt(16 - x * x),
        df: (x) => x / Math.sqrt(16 - x * x),
        key: 'x/sqrt(16-x^2)',
        alt: 'x*(16-x^2)^(-1/2)',
        wrong: '-x/sqrt(16-x^2)',
        domain: '−4<x<4',
        reason: 'The implicit slope is still −x/y. On the lower branch y is negative, reversing its sign.',
        source: S('4E-7, lower branch, a=4 parameter substitution'),
      },
    },
    hints: [
      'Implicit differentiation can verify a parametric tangent without dividing two trig derivatives.',
      'Substitute the correct signed branch for y only after solving for y′.',
    ],
  }),
  form(
    'speed',
    'Speed is the norm of two derivatives',
    ['parametric'],
    {
      spiral: {
        ask: String.raw`For $P(t)=(t\cos t,t\sin t)$, give the speed as a formula in t.`,
        key: 'sqrt(1+t^2)',
        get: (t) => Math.hypot(1, t),
        second: (t) => Math.hypot(Math.cos(t) - t * Math.sin(t), Math.sin(t) + t * Math.cos(t)),
        reason: 'Square both product-rule derivatives. Their mixed terms cancel, leaving 1+t².',
        source: E('Session 80, Parametric Equations of a Spiral, part (b), speed integrand'),
        alt: '(1+t^2)^(1/2)',
        wrong: '1+t',
      },
      circle: {
        ask: String.raw`For $P(t)=(2\cos t,2\sin t)$, give the speed with respect to t.`,
        key: '2',
        get: () => 2,
        second: (t) => Math.hypot(-2 * Math.sin(t), 2 * Math.cos(t)),
        reason: 'The two squared derivatives sum to four. The speed is their nonnegative square root.',
        source: S('4I-7, circle arclength element, a=2 parameter substitution'),
        alt: 'sqrt(4)',
        wrong: '4',
      },
    },
    [
      'The distance formula uses both coordinate derivatives.',
      'Expand the two squares before simplifying; slope is a ratio, while speed is a norm.',
    ],
  ),
  form(
    'radius',
    'Recognize a translated circle',
    ['polar'],
    {
      horizontal: {
        ask: String.raw`A circle satisfies $(x-1)^2+y^2=1$. Give its polar radius r as a formula in angle t, on the branch with r≥0.`,
        key: '2*cos(t)',
        get: (t) => 2 * Math.cos(t),
        second: (t) => {
          const r = 2 * Math.cos(t),
            x = r * Math.cos(t),
            y = r * Math.sin(t);
          if (Math.abs((x - 1) ** 2 + y * y - 1) > 1e-8) throw Error('Circle residual');
          return r;
        },
        reason: 'Expand and use x²+y²=r² and x=r cos t. The origin is included by continuity.',
        source: S('4H-2(a), a=1 parameter substitution'),
        alt: 'cos(t)*2',
        wrong: 'cos(t)',
      },
      vertical: {
        ask: String.raw`A circle satisfies $x^2+(y-1)^2=1$. Give r as a formula in angle t on its nonnegative-radius branch.`,
        key: '2*sin(t)',
        get: (t) => 2 * Math.sin(t),
        second: (t) => {
          const r = 2 * Math.sin(t),
            x = r * Math.cos(t),
            y = r * Math.sin(t);
          if (Math.abs(x * x + (y - 1) ** 2 - 1) > 1e-8) throw Error('Circle residual');
          return r;
        },
        reason: 'Expanding gives r²=2r sin t. For nonzero r divide once; retain the origin as well.',
        source: S('4H-2(b), a=1 parameter substitution'),
        alt: 'sin(t)*2',
        wrong: '2*cos(t)',
      },
    },
    [
      'Convert the Cartesian equation using r²=x²+y².',
      'Maximum distance from the polar origin is not the geometric radius of a translated circle.',
    ],
  ),
  form(
    'length',
    'A changing radius also moves the point',
    ['polar'],
    {
      line: {
        ask: String.raw`For r(t)=sec t on −π/2<t<π/2, give ds/dt as a formula in t.`,
        key: '1/cos(t)^2',
        get: (t) => 1 / Math.cos(t) ** 2,
        second: (t) => {
          const h = 1e-6,
            r = (u) => 1 / Math.cos(u),
            x = (u) => r(u) * Math.cos(u),
            y = (u) => r(u) * Math.sin(u);
          return Math.hypot((x(t + h) - x(t - h)) / (2 * h), (y(t + h) - y(t - h)) / (2 * h));
        },
        reason: 'The Cartesian curve is x=1, y=tan t. Its speed is sec²t, agreeing with √(r²+r′²).',
        source: S('4I-1(a)'),
        alt: 'cos(t)^(-2)',
        wrong: '1/cos(t)',
      },
      shifted: {
        ask: String.raw`For r(t)=2cos t traced once on −π/2<t<π/2, give ds/dt.`,
        key: '2',
        get: () => 2,
        second: (t) => Math.hypot(2 * Math.cos(t), -2 * Math.sin(t)),
        reason:
          'The squared radial and angular contributions are 4cos²t and 4sin²t. The speed is constant two.',
        source: S('4I-1(b), a=1 parameter substitution'),
        alt: 'sqrt(4)',
        wrong: '2*cos(t)',
      },
    },
    [
      'Differentiate x=r cos t and y=r sin t.',
      'The mixed terms cancel when the squared derivatives are added.',
    ],
  ),
  num(
    'area',
    'Choose one pass before integrating sectors',
    ['polar'],
    {
      lemniscate: {
        ask: 'For r²=sin(2θ), find the area of the right-hand loop traced from θ=0 to π/2.',
        answer: 0.5,
        second: () => simpson((t) => Math.sin(2 * t) / 2, 0, Math.PI / 2),
        reason: 'The endpoints are consecutive zeros of r. Integrate r²/2 over that one loop.',
        source: S('4I-4, a=1 parameter substitution'),
        traps: [
          [1, 'That omits the one-half in each sector area.'],
          [Math.PI / 4, 'That replaces the varying r² by its maximum throughout the interval.'],
        ],
      },
      spiral: {
        ask: String.raw`For r=e^{3θ}, find the accumulated sector area from θ=0 to π.`,
        answer: Math.expm1(6 * Math.PI) / 12,
        second: () => simpson((t) => Math.exp(6 * t) / 2, 0, Math.PI, 1e-3),
        reason: 'Squaring the radius doubles the exponent. Integrating e^(6θ)/2 contributes a factor 1/12.',
        source: S('4I-3'),
        traps: [
          [
            Math.expm1(3 * Math.PI) / 3,
            'That integrates r rather than r²/2. Area needs both the square and the half.',
          ],
          [Math.expm1(6 * Math.PI) / 6, 'The sector factor one-half is missing.'],
        ],
      },
    },
    [
      'A thin sector has area r² dθ/2.',
      'Choose the interval that traces the requested piece once before evaluating any primitive.',
    ],
  ),
  num(
    'weighted',
    'Uniform angle and uniform arc length differ',
    ['polar', 'parametric'],
    {
      angle: {
        ask: 'For the cardioid r=1−cosθ, find the mean distance to the x axis when θ is uniform on [0,2π].',
        answer: 2 / Math.PI,
        second: () => simpson((t) => (1 - Math.cos(t)) * Math.sin(t), 0, Math.PI) / Math.PI,
        reason: 'Use symmetry about the x axis. Divide the integral of r sinθ over the upper half by π.',
        source: S('4I-6(a), a=1 parameter substitution'),
        traps: [
          [0.8, 'That is the average for uniform arc length, a different weighting.'],
          [0, 'The signed y average is zero, but distance to the axis is |y|.'],
        ],
      },
      arc: {
        ask: 'On the same cardioid, find the mean distance to the x axis for a point uniform by arc length.',
        answer: 0.8,
        second: () => simpson((t) => (1 - Math.cos(t)) * Math.sin(t) * 2 * Math.sin(t / 2), 0, Math.PI) / 4,
        reason: 'The upper half has length four. Weight y by ds=2sin(θ/2)dθ before dividing by that length.',
        source: S('4I-6(b), a=1 parameter substitution'),
        traps: [
          [2 / Math.PI, 'That weights equal angles equally instead of equal arc lengths.'],
          [0, 'Opposite signed heights cancel; distances from the axis do not.'],
        ],
      },
    },
    [
      'An average must specify what is sampled uniformly.',
      'For uniform arc length, use ∫distance ds divided by ∫ds, not an unweighted angle integral.',
    ],
    3,
  ),
];
const C = {
  orientation: {
    title: 'A shape does not encode a clock',
    topics: ['parametric'],
    forms: {
      reverse: {
        ask: 'Replacing t by −t in (cos t,sin t) changes what?',
        source: S('4I-7, circle parameterization interpretation'),
        options: [
          [
            'The orientation reverses; the locus remains the same circle.',
            'Cosine is even and sine is odd, so the same points are visited in the opposite order.',
          ],
          ['The geometric radius doubles.', 'Changing direction does not change distance from the origin.'],
          ['The speed becomes negative.', 'Velocity reverses; speed is a nonnegative magnitude.'],
        ],
      },
      subset: {
        ask: 'Why is y=x an incomplete description of x=cos²t, y=cos²t?',
        source: 'OpenStax Calculus Volume 2, §7.1, eliminating a parameter and parameter restrictions',
        options: [
          [
            'The parametrization covers only 0≤x≤1 and can retrace it.',
            'The eliminated line omits both the restricted range and the timing.',
          ],
          ['It covers every real x once.', 'Cos²t is bounded and periodic.'],
          [
            'No Cartesian relation can hold for a parametric curve.',
            'A relation can hold while discarding useful information.',
          ],
        ],
      },
    },
  },
  tangents: {
    title: 'A zero denominator needs interpretation',
    topics: ['parametric'],
    forms: {
      vertical: {
        ask: 'At t=0 on (cos t,sin t), x′=0 and y′=1. What follows?',
        source: S('4E-7, circle tangent interpretation'),
        options: [
          [
            'The tangent is vertical and speed is one.',
            'The velocity vector is nonzero even though dy/dx is not finite.',
          ],
          ['The point is stationary.', 'Zero horizontal velocity does not imply zero vertical velocity.'],
          [
            'The speed is infinite.',
            'Only the slope ratio has a zero denominator; the velocity norm is finite.',
          ],
        ],
      },
      cusp: {
        ask: 'At a cycloid cusp both coordinate derivatives vanish. Can their ratio decide the tangent directly?',
        source: 'OpenStax Calculus Volume 2, §7.2, parametric differentiation and singular points',
        options: [
          [
            'No; examine nearby directions or a limit.',
            'The ratio is 0/0 and contains no tangent information by itself.',
          ],
          [
            'Yes; its slope must be zero.',
            'A zero numerator does not determine a ratio with zero denominator.',
          ],
          [
            'Yes; every such point has no tangent.',
            'Some singular parameterizations have well-defined limiting tangents.',
          ],
        ],
      },
    },
  },
  signedradius: {
    title: 'Polar coordinates are not unique',
    topics: ['polar'],
    forms: {
      negative: {
        ask: 'Which point has the same Cartesian coordinates as (r,θ)=(−2,π/3)?',
        source: S('4H-1(c), signed-radius representation of the opposite point'),
        options: [
          ['(2,4π/3).', 'A negative radius points half a turn away; add π when changing its sign.'],
          ['(2,π/3).', 'That removes the sign without reversing the direction.'],
          ['(−2,4π/3).', 'That reverses the direction a second time and reaches the opposite point.'],
        ],
      },
      pole: {
        ask: 'Why can solving r₁(θ)=r₂(θ) miss a common origin?',
        source: 'OpenStax Calculus Volume 2, §7.3, intersections of polar curves',
        options: [
          [
            'Each curve can reach r=0 at a different angle.',
            'All angles represent the same origin when r is zero.',
          ],
          ['The origin cannot belong to a polar curve.', 'Every zero of r traces the origin.'],
          [
            'Two polar curves must share the same angle at every intersection.',
            'A point can have several polar coordinate representations.',
          ],
        ],
      },
    },
  },
  measure: {
    title: 'A sector integral counts visits',
    topics: ['polar'],
    forms: {
      duplicate: {
        ask: 'For r=1, why does ½∫₀⁴πr²dθ equal 2π rather than the disk’s area π?',
        source: S('4I-7, single-pass circle interpretation'),
        options: [
          [
            'The interval covers each sector twice.',
            'Accumulated area counts traversal multiplicity; the geometric union is one disk.',
          ],
          ['The disk radius becomes √2.', 'The radius stays fixed; only the traversal interval changes.'],
          [
            'Polar area always needs another half.',
            'The formula is correct once the interval describes one pass.',
          ],
        ],
      },
      slant: {
        ask: 'When r changes with θ, why is ∫|r|dθ generally not the curve length?',
        source: S('4I-1(a), radial-motion interpretation'),
        options: [
          ['It omits radial motion dr/dθ.', 'The full length element is √(r²+r′²)dθ.'],
          [
            'Because area and length are identical in polar coordinates.',
            'Area uses r²/2, while length measures displacement.',
          ],
          [
            'A radius derivative always cancels the radius itself.',
            'Their squared contributions add after the mixed terms cancel.',
          ],
        ],
      },
    },
  },
  conics: {
    title: 'Eccentricity is a distance ratio',
    topics: ['conics', 'polar'],
    forms: {
      classify: {
        ask: 'For r=2/(1+e cosθ), how does e=1 differ from 0<e<1?',
        source: S('4H-3(d), conic classification'),
        options: [
          [
            'e=1 is a parabola; 0<e<1 is an ellipse on the appropriate branch.',
            'The focus-to-directrix distance ratio controls the conic type.',
          ],
          ['e=1 is a circle.', 'A circle is the zero-eccentricity limiting case.'],
          ['Both cases must be hyperbolas.', 'Hyperbolic branches require e>1.'],
        ],
      },
      ratio: {
        ask: 'For an ellipse with eccentricity e=1/2, is the minor/major semiaxis ratio 1/2?',
        source: 'OpenStax Calculus Volume 2, §7.5, ellipse relation c²=a²−b² and eccentricity c/a',
        options: [
          ['No; b/a=√(1−e²)=√3/2.', 'Eccentricity is c/a, not b/a.'],
          ['Yes; e always equals b/a.', 'That confuses the focal distance with a semiaxis.'],
          ['No; b/a=2.', 'With a defined as the major semiaxis, b/a cannot exceed one.'],
        ],
      },
    },
  },
};
for (const [id, v] of Object.entries(C))
  B.push(
    conceptFamily({
      id: 'c5.' + id,
      exam,
      ch,
      title: v.title,
      topics: v.topics,
      forms: v.forms,
      hints: [
        'Separate geometric position from the rule that traverses it.',
        'Check the coordinate derivatives, parameter interval or sampling measure before choosing.',
      ],
    }),
  );
export default B;

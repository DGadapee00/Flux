import { simpson } from '@flux/subjects/math/quadrature.js';
import { numericFamily, formulaFamily, symbolicFamily, conceptFamily, citation, cf, fr, frTex, sum } from './rework-kit.js';
const S = (p) => citation(4, p),
  E = (p) => `MIT OCW 18.01SC, Fall 2010, ${p}`,
  exam = 'c5',
  ch = 'v2.7';
/** The circle through the origin with centre a units along an axis: r = 2a cos t, 2a sin t or −2a cos t. */
const circleR = (a, axis, side) => {
  const onX = axis === 'x',
    c = 2 * a * side,
    fn = onX ? 'cos' : 'sin',
    shiftTex = side > 0 ? `-${frTex(a)}` : `+${frTex(a)}`;
  return {
    ask: onX
      ? String.raw`A circle satisfies $(x${shiftTex})^2+y^2=${frTex(a * a)}$. Give its polar radius r as a formula in angle t, on the branch with r≥0.`
      : String.raw`A circle satisfies $x^2+(y${shiftTex})^2=${frTex(a * a)}$. Give r as a formula in angle t on its nonnegative-radius branch.`,
    key: `${fr(c)}*${fn}(t)`,
    get: (t) => c * Math[fn](t),
    second: (t) => {
      const r = c * Math[fn](t),
        x = r * Math.cos(t),
        y = r * Math.sin(t),
        res = onX ? (x - side * a) ** 2 + y * y - a * a : x * x + (y - side * a) ** 2 - a * a;
      if (Math.abs(res) > 1e-8) throw Error('Circle residual');
      return r;
    },
    reason: `Expand: r²=${fr(c)}r ${fn} t. For nonzero r divide once; the origin is included by continuity.${side < 0 ? ' This circle lies left of the origin, so r≥0 needs cos t≤0.' : ''}`,
    alt: `${fn}(t)*${fr(c)}`,
    wrong: `${fr(a)}*${fn}(t)`,
  };
};
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
        source: S('4H-1(c), reverse conversion'),
        params: {
          pt: [
            ['1,√3', 1, Math.sqrt(3)],
            ['3,4', 3, 4],
            ['−5,12', -5, 12],
            ['√3,1', Math.sqrt(3), 1],
            ['−1,−√3', -1, -Math.sqrt(3)],
            ['6,−8', 6, -8],
            ['−2,2√3', -2, 2 * Math.sqrt(3)],
            ['−8,−6', -8, -6],
            ['1,1', 1, 1],
            ['2,−2', 2, -2],
          ],
        },
        make: ({ pt: [txt, x, y] }) => ({
          ask: `The Cartesian point is (${txt}). Find its nonnegative polar radius.`,
          answer: Math.hypot(x, y),
          second: () => Math.sqrt(x * x + y * y),
          reason: `The distance is √(x²+y²)=√${fr(x * x + y * y)}. Signs matter for the angle, not the radius.`,
          traps: [
            [x * x + y * y, 'That is the squared radius. Take the nonnegative square root.'],
            [(Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI), 'That is the angle, not the requested distance from the origin.'],
          ],
        }),
      },
      angle: {
        source: S('4H-1(h)'),
        params: {
          pt: [
            ['−2,−2', -2, -2],
            ['−1,√3', -1, Math.sqrt(3)],
            ['1,−1', 1, -1],
            ['−√3,−1', -Math.sqrt(3), -1],
            ['−2,2', -2, 2],
            ['√3,−1', Math.sqrt(3), -1],
            ['−3,−3√3', -3, -3 * Math.sqrt(3)],
            ['4,−4√3', 4, -4 * Math.sqrt(3)],
          ],
        },
        make: ({ pt: [txt, x, y] }) => {
          const th = (Math.atan2(y, x) + 2 * Math.PI) % (2 * Math.PI);
          return {
            ask: `The point is (${txt}). Give its polar angle in [0,2π), in radians.`,
            answer: th,
            second: () => {
              const ref = Math.atan(Math.abs(y / x));
              return x > 0 ? (y >= 0 ? ref : 2 * Math.PI - ref) : y >= 0 ? Math.PI - ref : Math.PI + ref;
            },
            reason: `The signs of x and y fix the quadrant first. The reference angle is atan|y/x|=${fr(Math.atan(Math.abs(y / x)) / Math.PI)}π.`,
            traps: [
              [Math.atan(y / x), 'The quotient y/x loses the quadrant. Check the signs of both coordinates.'],
              [Math.atan2(y, x) < 0 ? Math.atan2(y, x) : th - 2 * Math.PI, 'That is the same direction, but outside the requested interval. Add or remove one full turn.'],
            ],
          };
        },
      },
    },
    [
      'Use radius as distance and angle as direction.',
      'A one-argument arctangent loses the sign information needed to choose a quadrant.',
    ],
    1,
  ),
  num(
    'elimination',
    'Elimination keeps a locus but loses timing',
    ['parametric'],
    {
      hyperbola: {
        source: S('4E-2'),
        params: { a: [1, 2, 3], b: [1, 2, 3, 5] },
        make: ({ a, b }) => ({
          ask: `For x=${cf(a)}t+${b}/t and y=${cf(a)}t−${b}/t, t≠0, compute the invariant x²−y².`,
          answer: 4 * a * b,
          second: () => {
            const t = 1.7,
              x = a * t + b / t,
              y = a * t - b / t;
            return x * x - y * y;
          },
          reason: `The t² and t⁻² terms cancel after subtracting the two expansions. The cross terms, ±${2 * a * b}, add to ${4 * a * b}.`,
          traps: [
            [0, 'The cross terms have opposite signs before subtraction; they do not cancel.'],
            [2 * a * b, 'Each square contributes a cross term. Subtraction adds both of them.'],
          ],
        }),
      },
      circle: {
        source: S('4E-3'),
        params: { h: [1, 2, -1, 3], k: [4, -2, 0, 1], R: [1, 2, 3] },
        make: ({ h, k, R }) => {
          const off = (v, c) => `${v}${c < 0 ? '+' : '−'}${Math.abs(c)}`;
          return {
            ask: `For x=${h}+${R === 1 ? '' : R}sin t and y=${k ? `${k}+` : ''}${R === 1 ? '' : R}cos t, compute (${off('x', h)})²+${k ? `(${off('y', k)})` : 'y'}².`,
            answer: R * R,
            second: () => (R * Math.sin(0.7)) ** 2 + (R * Math.cos(0.7)) ** 2,
            reason: `Subtract the fixed centre before applying sin²t+cos²t=1. What remains is ${R * R}(sin²t+cos²t).`,
            traps: [
              [h * h + k * k || 2 * R * R + 1, 'That is the squared distance of the centre from the origin, not the circle’s squared radius.'],
              [2 * R * R, 'Sin²t and cos²t add to one, not one each.'],
            ],
          };
        },
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
        source: S('4E-7, upper branch, a=4 parameter substitution'),
        params: { a: [4, 1, 2, 3, 5, 6] },
        make: ({ a }) => ({
          tex: String.raw`\sqrt{${a * a}-x^2}`,
          fn: (x) => Math.sqrt(a * a - x * x),
          df: (x) => -x / Math.sqrt(a * a - x * x),
          key: `-x/sqrt(${a * a}-x^2)`,
          alt: `-x*(${a * a}-x^2)^(-1/2)`,
          wrong: `x/sqrt(${a * a}-x^2)`,
          domain: `−${a}<x<${a}`,
          at: 0.3 * a,
          sample: [-0.9 * a, 0.9 * a],
          reason: `Differentiate x²+y²=${a * a}: 2x+2yy′=0. On the upper branch y is positive.`,
        }),
      },
      lower: {
        source: S('4E-7, lower branch, a=4 parameter substitution'),
        params: { a: [4, 1, 2, 3, 5, 6] },
        make: ({ a }) => ({
          tex: String.raw`-\sqrt{${a * a}-x^2}`,
          fn: (x) => -Math.sqrt(a * a - x * x),
          df: (x) => x / Math.sqrt(a * a - x * x),
          key: `x/sqrt(${a * a}-x^2)`,
          alt: `x*(${a * a}-x^2)^(-1/2)`,
          wrong: `-x/sqrt(${a * a}-x^2)`,
          domain: `−${a}<x<${a}`,
          at: 0.3 * a,
          sample: [-0.9 * a, 0.9 * a],
          reason: 'The implicit slope is still −x/y. On the lower branch y is negative, reversing its sign.',
        }),
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
        source: E('Session 80, Parametric Equations of a Spiral, part (b), speed integrand'),
        params: { a: [1, 2, 3], k: [1, 2, 3] },
        make: ({ a, k }) => ({
          ask: String.raw`For $P(t)=(${cf(a)}t\cos ${k === 1 ? 't' : `${k}t`},${cf(a)}t\sin ${k === 1 ? 't' : `${k}t`})$, give the speed as a formula in t.`,
          key: `${a}*sqrt(1+${k * k}*t^2)`,
          get: (t) => a * Math.hypot(1, k * t),
          second: (t) => a * Math.hypot(Math.cos(k * t) - k * t * Math.sin(k * t), Math.sin(k * t) + k * t * Math.cos(k * t)),
          reason: `Square both product-rule derivatives. Their mixed terms cancel, leaving ${a * a}(1+${k * k}t²).`,
          alt: `sqrt(${a * a}+${a * a * k * k}*t^2)`,
          wrong: `${a}*(1+${k}*t)`,
        }),
      },
      circle: {
        source: S('4I-7, circle arclength element, a=2 parameter substitution'),
        params: { R: [2, 1, 3, 5], w: [1, 2, 3, 4] },
        make: ({ R, w }) => ({
          ask: String.raw`For $P(t)=(${cf(R)}\cos ${w === 1 ? 't' : `${w}t`},${cf(R)}\sin ${w === 1 ? 't' : `${w}t`})$, give the speed with respect to t.`,
          key: `${R * w}`,
          get: () => R * w,
          second: (t) => Math.hypot(-R * w * Math.sin(w * t), R * w * Math.cos(w * t)),
          reason: `The two squared derivatives sum to ${R * R * w * w}. The speed is their nonnegative square root, the radius times the angular rate.`,
          alt: `sqrt(${R * R * w * w})`,
          wrong: `${R * R * w * w}`,
        }),
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
        source: S('4H-2(a), a=1 parameter substitution'),
        params: { a: [1, 2, 3, 0.5, 2.5, 4] },
        make: ({ a }) => circleR(a, 'x', 1),
      },
      vertical: {
        source: S('4H-2(b), a=1 parameter substitution'),
        params: { a: [1, 2, 3, 0.5, 2.5, 4] },
        make: ({ a }) => circleR(a, 'y', 1),
      },
      left: {
        params: { a: [1, 2, 3, 0.5, 2.5, 4] },
        make: ({ a }) => circleR(a, 'x', -1),
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
        source: S('4I-1(a)'),
        params: { c: [1, 2, 3, 0.5, 4] },
        make: ({ c }) => ({
          ask: String.raw`For r(t)=${c === 1 ? '' : fr(c)}${c === 0.5 ? '·' : ''}sec t on −π/2<t<π/2, give ds/dt as a formula in t.`,
          key: `${fr(c)}/cos(t)^2`,
          get: (t) => c / Math.cos(t) ** 2,
          second: (t) => {
            const h = 1e-6,
              r = (u) => c / Math.cos(u),
              x = (u) => r(u) * Math.cos(u),
              y = (u) => r(u) * Math.sin(u);
            return Math.hypot((x(t + h) - x(t - h)) / (2 * h), (y(t + h) - y(t - h)) / (2 * h));
          },
          sample: [-1.2, 1.2],
          reason: `The Cartesian curve is the line x=${fr(c)}, y=${fr(c)}tan t. Its speed is ${fr(c)}sec²t, agreeing with √(r²+r′²).`,
          alt: `${fr(c)}*cos(t)^(-2)`,
          wrong: `${fr(c)}/cos(t)`,
        }),
      },
      csc: {
        params: { c: [1, 2, 3, 0.5, 4] },
        make: ({ c }) => ({
          ask: String.raw`For r(t)=${c === 1 ? '' : fr(c)}${c === 0.5 ? '·' : ''}csc t on 0<t<π, give ds/dt as a formula in t.`,
          key: `${fr(c)}/sin(t)^2`,
          get: (t) => c / Math.sin(t) ** 2,
          second: (t) => {
            const h = 1e-6,
              r = (u) => c / Math.sin(u),
              x = (u) => r(u) * Math.cos(u),
              y = (u) => r(u) * Math.sin(u);
            return Math.hypot((x(t + h) - x(t - h)) / (2 * h), (y(t + h) - y(t - h)) / (2 * h));
          },
          at: 1,
          reason: `The Cartesian curve is the line y=${fr(c)}, x=${fr(c)}cot t. Its speed is ${fr(c)}csc²t.`,
          alt: `${fr(c)}*sin(t)^(-2)`,
          wrong: `${fr(c)}/sin(t)`,
        }),
      },
      shifted: {
        source: S('4I-1(b), a=1 parameter substitution'),
        params: { a: [1, 2, 3, 0.5, 2.5], fn: ['cos', 'sin'] },
        make: ({ a, fn }) => ({
          ask: String.raw`For r(t)=${a === 0.5 ? '' : fr(2 * a)}${fn} t traced once on ${fn === 'cos' ? '−π/2<t<π/2' : '0<t<π'}, give ds/dt.`,
          key: `${fr(2 * a)}`,
          get: () => 2 * a,
          second: (t) => Math.hypot(2 * a * Math.cos(t), 2 * a * Math.sin(t)),
          reason: `The squared radial and angular contributions are ${fr(4 * a * a)}cos²t and ${fr(4 * a * a)}sin²t. The speed is the constant ${fr(2 * a)}.`,
          alt: `sqrt(${fr(4 * a * a)})`,
          wrong: `${fr(2 * a)}*${fn}(t)`,
        }),
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
        source: S('4I-4, a=1 parameter substitution'),
        params: { q: [1, 4, 9, 2, 16], fn: ['sin', 'cos'] },
        make: ({ q, fn }) => {
          const s = fn === 'sin',
            lo = s ? 0 : -Math.PI / 4,
            hi = s ? Math.PI / 2 : Math.PI / 4;
          return {
            ask: `For r²=${q === 1 ? '' : q}${fn}(2θ), find the area of the loop traced from θ=${s ? '0' : '−π/4'} to ${s ? 'π/2' : 'π/4'}.`,
            answer: q / 2,
            second: () => simpson((t) => (q * Math[fn](2 * t)) / 2, lo, hi),
            reason: `The endpoints are consecutive zeros of r. Integrate r²/2=${fr(q / 2)}${fn}(2θ) over that one loop.`,
            traps: [
              [q, 'That omits the one-half in each sector area.'],
              [(q * Math.PI) / 4, 'That replaces the varying r² by its maximum throughout the interval.'],
            ],
          };
        },
      },
      spiral: {
        source: S('4I-3'),
        params: {
          kb: [
            [3, Math.PI, 'π'],
            [1, Math.PI, 'π'],
            [2, Math.PI / 2, 'π/2'],
            [0.5, 2 * Math.PI, '2π'],
            [1, Math.PI / 2, 'π/2'],
            [3, Math.PI / 2, 'π/2'],
            [0.5, Math.PI, 'π'],
            [2, Math.PI / 4, 'π/4'],
            [1, 2 * Math.PI, '2π'],
          ],
        },
        make: ({ kb: [k, b, bTex] }) => ({
          ask: String.raw`For $r=e^{${k === 0.5 ? '\\theta/2' : `${cf(k)}\\theta`}}$, find the accumulated sector area from θ=0 to ${bTex}.`,
          answer: Math.expm1(2 * k * b) / (4 * k),
          second: () => simpson((t) => Math.exp(2 * k * t) / 2, 0, b, 1e-3),
          reason: `Squaring the radius doubles the exponent. Integrating e^(${fr(2 * k)}θ)/2 contributes a factor 1/${fr(4 * k)}.`,
          traps: [
            [Math.expm1(k * b) / k, 'That integrates r rather than r²/2. Area needs both the square and the half.'],
            [Math.expm1(2 * k * b) / (2 * k), 'The sector factor one-half is missing.'],
          ],
        }),
      },
      rose: {
        params: { n: [2, 3, 4, 5] },
        make: ({ n }) => ({
          ask: `For the rose r=cos(${n}θ), find the area of the petal traced from θ=−π/${2 * n} to π/${2 * n}.`,
          answer: Math.PI / (4 * n),
          second: () => simpson((t) => Math.cos(n * t) ** 2 / 2, -Math.PI / (2 * n), Math.PI / (2 * n)),
          reason: `One petal runs between consecutive zeros of cos(${n}θ). Lower cos² with the half-angle form: the area is π/${4 * n}.`,
          traps: [
            [Math.PI / (2 * n), 'That omits the one-half in each sector area.'],
            [Math.PI / n, 'That is the angular width of the petal, not its area.'],
          ],
        }),
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
        source: S('4I-6(a), a=1 parameter substitution'),
        params: { a: [1, 2, 3, 4], sg: [-1, 1] },
        make: ({ a, sg }) => ({
          ask: `For the cardioid r=${cf(a)}(1${sg < 0 ? '−' : '+'}cosθ), find the mean distance to the x axis when θ is uniform on [0,2π].`,
          answer: (2 * a) / Math.PI,
          second: () => simpson((t) => a * (1 + sg * Math.cos(t)) * Math.sin(t), 0, Math.PI) / Math.PI,
          reason: 'Use symmetry about the x axis. Divide the integral of r sinθ over the upper half by π.',
          traps: [
            [0.8 * a, 'That is the average for uniform arc length, a different weighting.'],
            [0, 'The signed y average is zero, but distance to the axis is |y|.'],
          ],
        }),
      },
      arc: {
        source: S('4I-6(b), a=1 parameter substitution'),
        params: { a: [1, 2, 3, 4], sg: [-1, 1] },
        make: ({ a, sg }) => ({
          ask: `On the cardioid r=${cf(a)}(1${sg < 0 ? '−' : '+'}cosθ), find the mean distance to the x axis for a point uniform by arc length.`,
          answer: 0.8 * a,
          second: () => {
            const ds = (t) => a * Math.hypot(1 + sg * Math.cos(t), sg * Math.sin(t));
            return simpson((t) => a * (1 + sg * Math.cos(t)) * Math.sin(t) * ds(t), 0, Math.PI) / simpson(ds, 0, Math.PI);
          },
          reason: `The upper half has length ${4 * a}. Weight y by ds before dividing by that length.`,
          traps: [
            [(2 * a) / Math.PI, 'That weights equal angles equally instead of equal arc lengths.'],
            [0, 'Opposite signed heights cancel; distances from the axis do not.'],
          ],
        }),
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

import { problem, kase, sym } from '../kit.js';
import { simpson } from '@flux/subjects/math/quadrature.js';
import { riemann1d } from '@flux/subjects/math/riemann.js';
import { spheroid } from '@flux/subjects/math/spheroid.js';
import { choose, citation, numeric, numericFamily, formulaFamily, conceptFamily, cf, fr, frTex, pw, sum } from './rework-kit.js';
const S = (p) => citation(3, p),
  E = (p) => `MIT OCW 18.01SC, Fall 2010, ${p}`;
/** Riemann sum of g on [a,b] with n strips at left, right or mid samples, by an explicit loop. */
const strips = (g, a, b, n, sample) => {
  const w = (b - a) / n,
    off = sample === 'left' ? 0 : sample === 'right' ? 1 : 0.5;
  let total = 0;
  for (let i = 0; i < n; i++) total += g(a + (i + off) * w);
  return total * w;
};
/** An interval end as TeX-friendly text. */
const end = (x) => (x < 0 ? `−${Math.abs(x)}` : String(x));
/** sin on [0,π] by the trapezoidal rule and Simpson's rule, n strips. */
const trapSine = (n) => {
  let t = 0;
  for (let i = 1; i < n; i++) t += Math.sin((i * Math.PI) / n);
  return (Math.PI / n) * t;
};
const simpsonSine = (n) => {
  let t = 0;
  for (let i = 1; i < n; i++) t += (i % 2 ? 4 : 2) * Math.sin((i * Math.PI) / n);
  return (Math.PI / (3 * n)) * t;
};
/** The exponential density λe^{−λt} in TeX. */
const density = (lam) => (lam === 1 ? 'e^{-t}' : `${frTex(lam)}e^{-${lam === 0.5 ? 't/2' : `${lam}t`}}`);
/** x shifted by m in TeX, for a weight profile. */
const shiftTexFn = (m) => (m > 0 ? `(x-${m})` : `(x+${-m})`);
/** The ellipse x²/a²+y²/c² ≤ 1 turned about the y axis: a spheroid of volume 4πa²c/3. */
const spheroidForm = (a, c) => ({
  ask: String.raw`Rotate $${a === 1 ? 'x^2' : `\\dfrac{x^2}{${a * a}}`}+${c === 1 ? 'y^2' : `\\dfrac{y^2}{${c * c}}`}\le1$ about the y-axis. Find the volume.`,
  answer: (4 * Math.PI * a * a * c) / 3,
  second: () => simpson((y) => Math.PI * a * a * (1 - (y * y) / (c * c)), -c, c),
  reason: `At height y the disk radius squared is ${a * a}(1−y²/${c * c}). Integrate π times that from −${c} to ${c}.`,
  a,
  c,
  traps: [
    [(2 * Math.PI * a * a * c) / 3, 'That counts only one axial half.'],
    [(4 * Math.PI * c * c * a) / 3, 'That interchanges the equatorial and axial radii; only the equatorial radius is squared.'],
  ],
});
/** Work on a Hooke spring that needs F newtons at d metres, stretched from 0 to L: sign +1 external, −1 the spring's own. */
const springForm = (F, d, L, sign) => {
  const k = F / d;
  return {
    ask:
      sign > 0
        ? `A spring needs a force magnitude of ${F} N at ${d} m extension. Assume Hooke’s law. Find the work done by a slow external force in stretching it from equilibrium to ${L} m.`
        : `A Hooke-law spring needs a force magnitude of ${F} N at ${d} m extension. Find the work done by the spring itself while it is stretched from equilibrium to ${L} m.`,
    answer: (sign * k * L * L) / 2,
    second: () => simpson((x) => sign * k * x, 0, L),
    reason: `The constant is k=${F}/${d}=${fr(k)} N/m. Integrating ${sign > 0 ? '' : '−'}${fr(k)}x from 0 to ${L} gives ${fr((sign * k * L * L) / 2)} J.${sign < 0 ? ' The restoring force opposes the displacement, so its work is negative.' : ''}`,
    multiplier: sign * k,
    L,
    traps: [
      [sign * k * L * L, 'That applies the final force over the whole interval. The spring force rises from zero.'],
      [(-sign * k * L * L) / 2, sign > 0 ? 'That is the work done by the restoring spring, not the external force.' : 'That is the external stretching work. The restoring force opposes the displacement.'],
    ],
  };
};
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
        source: S('3B-3(a), corrected arithmetic; see ERRATA.md'),
        params: { n: [4, 2, 3, 5, 6, 8], b: [1, 2] },
        make: ({ n, b }) => ({
          ask: `Use ${n} equal subintervals and right endpoints to approximate the integral of x³ on [0,${b}].`,
          answer: (b ** 4 * ((n * (n + 1)) / 2) ** 2) / n ** 4,
          second: () => riemann1d((x) => x ** 3, 0, b, { n, sample: 'right' }).sum,
          graphId: 'cube',
          a: 0,
          b,
          n,
          sample: 'right',
          note: n === 4 && b === 1 ? 'The printed 15/128 contradicts the displayed sum. Direct addition gives 25/64.' : undefined,
          reason: `The strips are ${fr(b / n)} wide. The right ends are ${fr(b / n)}, ${fr((2 * b) / n)}, …, ${b}. Add their cubes, then multiply by the width: Σi³=(n(n+1)/2)² does the adding.`,
          traps: [
            [(b ** 3 * ((n * (n + 1)) / 2) ** 2) / n ** 3, 'That is the sum of the heights. Multiply by the subinterval width.'],
            [(b ** 4 * ((n * (n - 1)) / 2) ** 2) / n ** 4, 'That uses left endpoints rather than the requested right endpoints.'],
          ],
        }),
      },
      cubeLeft: {
        source: S('3B-3(a), corrected arithmetic; see ERRATA.md'),
        params: { n: [4, 2, 3, 5, 6, 8], b: [1, 2] },
        make: ({ n, b }) => ({
          ask: `Use ${n} equal subintervals and left endpoints to approximate the integral of x³ on [0,${b}].`,
          answer: (b ** 4 * ((n * (n - 1)) / 2) ** 2) / n ** 4,
          second: () => riemann1d((x) => x ** 3, 0, b, { n, sample: 'left' }).sum,
          graphId: 'cube',
          a: 0,
          b,
          n,
          sample: 'left',
          note: n === 4 && b === 1 ? 'The printed 7/128 contradicts the displayed sum. Direct addition gives 9/64.' : undefined,
          reason: `The left ends are 0, ${fr(b / n)}, …, ${fr(((n - 1) * b) / n)}. Add their cubes, then multiply by the width ${fr(b / n)}.`,
          traps: [
            [(b ** 3 * ((n * (n - 1)) / 2) ** 2) / n ** 3, 'The strip width is missing. Summing heights alone does not give the integral approximation.'],
            [(b ** 4 * ((n * (n + 1)) / 2) ** 2) / n ** 4, 'That is the right-endpoint sum.'],
          ],
        }),
      },
      squareLeft: {
        source: S('3B-3(b), left sum'),
        params: { iv: [[-1, 3], [-2, 2], [-1, 1], [-3, 1], [-2, 4], [-1, 2]], n: [4, 2, 6, 8] },
        make: ({ iv: [a, b], n }) => ({
          ask: `Use ${n} equal subintervals and left endpoints for x² on [${end(a)},${b}].`,
          answer: strips((x) => x * x, a, b, n, 'left'),
          second: () => riemann1d((x) => x * x, a, b, { n, sample: 'left' }).sum,
          graphId: 'quad',
          a,
          b,
          n,
          sample: 'left',
          reason: `The width is ${fr((b - a) / n)} and the samples start at ${end(a)}. The curve falls and then rises, so the left sum is neither the upper nor the lower sum.`,
          traps: [
            [strips((x) => x * x, a, b, n, 'right'), 'That uses right endpoints rather than left endpoints.'],
            [strips((x) => x * x, a, b, n, 'left') / ((b - a) / n), 'That adds the heights without the strip width.'],
          ],
        }),
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
        source: S('3C-1'),
        params: { c: [2, 1, 0, 3, -1], u: [[1, 4], [1, 9], [4, 9], [1, 16], [4, 16]] },
        make: ({ c, u: [u1, u2] }) => ({
          ask: String.raw`Evaluate $\int_{${c + u1}}^{${c + u2}} ${c === 0 ? 'x' : `(x${c < 0 ? '+' : '-'}${Math.abs(c)})`}^{-1/2}\,dx$.`,
          answer: 2 * (Math.sqrt(u2) - Math.sqrt(u1)),
          second: () => simpson((x) => 1 / Math.sqrt(x - c), c + u1, c + u2),
          reason: `An antiderivative is 2√(x${c < 0 ? '+' : '−'}${Math.abs(c)}). Subtract its values: 2√${u2}−2√${u1}.`,
          traps: [
            [2 * Math.sqrt(u2), 'That is the upper-end antiderivative value alone.'],
            [-2 * (Math.sqrt(u2) - Math.sqrt(u1)), 'The upper and lower endpoints were subtracted in reverse order.'],
          ],
        }),
      },
      rational: {
        source: S('3C-3(a)'),
        params: { k: [1, 2, 3, 4], iv: [[1, 2], [0, 1], [0, 2], [1, 3], [2, 3], [0, 3]] },
        make: ({ k, iv: [a, b] }) => ({
          ask: String.raw`Evaluate $\int_${a}^${b} x/(${k}+x^2)\,dx$.`,
          answer: 0.5 * Math.log((k + b * b) / (k + a * a)),
          second: () => simpson((x) => x / (k + x * x), a, b),
          reason: `Set u=${k}+x². The missing factor two in du=2x dx leaves one half outside the logarithm: ½ ln(${k + b * b}/${k + a * a}).`,
          traps: [
            [Math.log((k + b * b) / (k + a * a)), 'The substitution needs the factor 1/2 because du=2x dx.'],
            [0.5 * Math.log((k + b * b) * (k + a * a)), 'Endpoint evaluation subtracts logarithms. Adding them multiplies the endpoint arguments instead.'],
          ],
        }),
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
        source: S('3D-1(a), a=1'),
        params: { p: [-0.5, 0.5, -1, 1.5], a: [1, 2, 3, 4, 5, 9] },
        make: ({ p, a }) => ({
          ask: String.raw`Let $F(x)=\int_0^x(${a}+t^2)^{${fr(p)}}\,dt$. Find $F'(x)$.`,
          key: `(${a}+x^2)^(${fr(p)})`,
          alt: `(x^2+${a})^(${fr(p)})`,
          wrong: `(${a}+x^2)^(${fr(p + 1)})/(${fr(p + 1)})`,
          get: (x) => (a + x * x) ** p,
          second: (x) => {
            const F = (z) => simpson((t) => (a + t * t) ** p, 0, z),
              h = 1e-5;
            return (F(x + h) - F(x - h)) / (2 * h);
          },
          reason: 'For a continuous integrand, an extra sliver of interval adds about its endpoint height times its width. So F′ is the integrand at the upper end. Nothing needs integrating.',
        }),
      },
      composite: {
        params: {
          g: [
            ['\\sin(t^3)', 'sin(U^3)', (u) => Math.sin(u ** 3)],
            ['\\cos(t^2)', 'cos(U^2)', (u) => Math.cos(u * u)],
            ['e^{-t^2}', 'exp(-(U)^2)', (u) => Math.exp(-u * u)],
            ['\\sqrt{1+t^4}', 'sqrt(1+(U)^4)', (u) => Math.sqrt(1 + u ** 4)],
          ],
          up: [
            ['x^2', 'x^2', '2*x', (x) => x * x, (x) => 2 * x],
            ['x^3', 'x^3', '3*x^2', (x) => x ** 3, (x) => 3 * x * x],
            ['2x', '2*x', '2', (x) => 2 * x, () => 2],
            ['\\sin x', 'sin(x)', 'cos(x)', Math.sin, Math.cos],
          ],
        },
        make: ({ g: [gTex, gExpr, gFn], up: [uTex, uExpr, duExpr, uFn, duFn] }) => ({
          ask: String.raw`Let $G(x)=\int_0^{${uTex}}${gTex}\,dt$. Find $G'(x)$.`,
          key: `${duExpr}*${gExpr.replace(/U/g, `(${uExpr})`)}`,
          alt: `${gExpr.replace(/U/g, `(${uExpr})`)}*${duExpr}`,
          wrong: gExpr.replace(/U/g, `(${uExpr})`),
          at: 0.6,
          get: (x) => duFn(x) * gFn(uFn(x)),
          second: (x) => {
            const G = (z) => simpson((t) => gFn(t), 0, uFn(z)),
              h = 1e-5;
            return (G(x + h) - G(x - h)) / (2 * h);
          },
          reason: `The integrand at the moving end is ${gTex.replace(/t/g, `(${uTex})`)}. The end itself moves at rate ${duExpr.replace('*', '')}, so multiply by it.`,
        }),
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
    minVersions: 12,
    vars: { point: choose([1, 2, 3, 0.5, 1.5, 2.5]), rhs: choose(['sin', 'cos']) },
    derive: ($) => {
      const x = $.point,
        s = $.rhs === 'sin',
        d = s ? Math.sin(Math.PI * x) + Math.PI * x * Math.cos(Math.PI * x) : Math.cos(Math.PI * x) - Math.PI * x * Math.sin(Math.PI * x);
      return { answer: d / (2 * x) };
    },
    text: (T, $) =>
      String.raw`A continuous $f$ satisfies $\int_0^{x^2}f(t)\,dt=x${'\\' + $.rhs}(\pi x)$ for $x>0$. Find $f(${frTex($.point ** 2)})$.`,
    parts: [
      numeric('value', ($) => $.answer, 'integrand value', [
        [
          ($) => 2 * $.point * $.answer,
          'That differentiates the right side but omits division by the moving endpoint rate 2x.',
        ],
        [($) => -$.answer, 'Check the sign of each trigonometric value at this multiple of π.'],
      ]),
    ],
    hints: [
      'Differentiate the identity using the Fundamental Theorem and the chain rule.',
      'The right side needs the product rule, while the integral needs the derivative of its upper boundary.',
      'Solve for f(x²) before substituting the requested point.',
    ],
    steps: ($) => [
      $.rhs === 'sin'
        ? String.raw`$2x f(x^2)=\sin(\pi x)+\pi x\cos(\pi x)$.`
        : String.raw`$2x f(x^2)=\cos(\pi x)-\pi x\sin(\pi x)$.`,
      String.raw`Substitute $x=${frTex($.point)}$, so $x^2=${frTex($.point ** 2)}$, then divide by $2x=${frTex(2 * $.point)}$.`,
    ],
    second: ($) => {
      const H = (x) => x * Math[$.rhs](Math.PI * x),
        h = 1e-6;
      return { value: (H($.point + h) - H($.point - h)) / (2 * h) / (2 * $.point) };
    },
    cases: [kase(E('Exam 3, solution 3(b)'), { point: 2, rhs: 'sin' }, { value: Math.PI / 2 })],
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
        source: S('3A-3(a), C=0'),
        params: { k: [5, 2, 3, 4, 6, 7], fn: ['sin', 'cos'] },
        make: ({ k, fn }) => {
          const s = fn === 'sin';
          return {
            ask: String.raw`Find $F$ with $F'(x)=${'\\' + fn}(${k}x)$ and $F(0)=${s ? `-${frTex(1 / k)}` : '0'}$.`,
            key: s ? `-cos(${k}*x)/${k}` : `sin(${k}*x)/${k}`,
            alt: s ? `-(${fr(1 / k)})*cos(${k}*x)` : `(${fr(1 / k)})*sin(${k}*x)`,
            wrong: s ? `-${k}*cos(${k}*x)` : `${k}*sin(${k}*x)`,
            get: (x) => (s ? -Math.cos(k * x) : Math.sin(k * x)) / k,
            second: (x) => (s ? -1 / k : 0) + simpson((t) => Math[fn](k * t), 0, x),
            reason: `Set u=${k}x, so dx=du/${k}. The factor 1/${k} stays outside the antiderivative, and the starting value makes C zero.`,
          };
        },
      },
      compound: {
        params: { m: [2, 3], c: [2, 1, 3, 4, 6] },
        make: ({ m, c }) => ({
          ask: String.raw`Find $F$ with $F'(x)=${cf(c)}${pw('x', m - 1)}e^{x^{${m}}}$ and $F(0)=${frTex(c / m)}$.`,
          key: `(${fr(c / m)})*exp(x^${m})`,
          alt: `${c}*exp(x^${m})/${m}`,
          wrong: `${c}*exp(x^${m})`,
          get: (x) => (c / m) * Math.exp(x ** m),
          second: (x) => c / m + simpson((t) => c * t ** (m - 1) * Math.exp(t ** m), 0, x),
          reason: `Set u=x^${m}, so du=${m}${pw('x', m - 1).replace(/[{}]/g, '')} dx. The integrand is ${fr(c / m)} times du·e^u, and the starting value makes C zero.`,
        }),
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
        source: E('Exam 3, solution 1, horizontal-strip width'),
        params: { b: [3, 2, 4, 5, 6], k: [2, 1, 3] },
        make: ({ b, k }) => ({
          ask: String.raw`A planar region has horizontal strip width $${sum([k * b, 'y'], [-k, 'y^2']).replace(/\*/g, '')}$ for $0\le y\le${b}$. Find its area.`,
          answer: (k * b ** 3) / 6,
          second: () => simpson((y) => k * (b * y - y * y), 0, b),
          reason: `The width is the right boundary minus the left one. Its integral is [${fr((k * b) / 2)}y²−${fr(k / 3)}y³] from 0 to ${b}.`,
          graphId: `poly:0,${k * b},${-k}`,
          a: 0,
          b,
          traps: [
            [(k * b ** 3) / 2, 'That integrates only the linear part of the width and drops the y² term.'],
            [-(k * b ** 3) / 6, 'Reverse the boundary order to obtain a nonnegative strip width.'],
          ],
        }),
      },
      symmetric: {
        source: S('3C-6(b), a=1'),
        params: { c: [1, 2, 3], a: [1, 2, 3, 4] },
        make: ({ c, a }) => ({
          ask: String.raw`Find the area under $${a === 1 ? '' : `${a}(`}${c * c}-x^2${a === 1 ? '' : ')'}$ and above zero on $[-${c},${c}]$.`,
          answer: (4 * a * c ** 3) / 3,
          second: () => simpson((x) => a * (c * c - x * x), -c, c),
          reason: `Evaluate ${a === 1 ? '' : `${a}(`}${c * c}x−x³/3${a === 1 ? '' : ')'} at ±${c}, or use symmetry and double the right half. The positive width gives geometric area.`,
          graphId: `poly:${a * c * c},0,${-a}`,
          a: -c,
          b: c,
          traps: [
            [(2 * a * c ** 3) / 3, 'That is one half of the symmetric region.'],
            [-(4 * a * c ** 3) / 3, 'The graph lies above zero here, so its geometric area cannot be negative.'],
          ],
        }),
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
        source: E('Session 58, Volume of a Spheroid, solution'),
        params: { ac: [[2, 1], [3, 1], [3, 2], [4, 1], [4, 3], [5, 2], [5, 4], [6, 5]] },
        make: ({ ac: [a, c] }) => spheroidForm(a, c),
      },
      prolate: {
        params: { ac: [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [4, 5], [5, 6]] },
        make: ({ ac: [a, c] }) => spheroidForm(a, c),
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
        source: E('Session 60, Average Bank Balance, solution (b)'),
        params: { P: [100, 500, 1000, 2500], r: [0.05, 0.03, 0.04, 0.06], T: [1, 2, 5] },
        make: ({ P, r, T }) => ({
          ask: `A balance is A(t)=${P} exp(${r}t) for 0≤t≤${T} year${T === 1 ? '' : 's'}. Find its average value over that time.`,
          answer: (P * Math.expm1(r * T)) / (r * T),
          printed: P === 100 && r === 0.05 && T === 1 ? 102.5 : undefined,
          note: P === 100 && r === 0.05 && T === 1 ? 'The source rounds the average to 102.5; the computation retains the unrounded value.' : undefined,
          second: () => simpson((t) => P * Math.exp(r * t), 0, T) / T,
          reason: `The average is the integral divided by ${T}: ${P}(e^${fr(r * T)}−1)/${fr(r * T)}.`,
          traps: [
            [P * Math.exp(r * T), 'That is the final value, not the time average.'],
            [P, 'That is the initial value and ignores the growing balance.'],
          ],
        }),
      },
      parabola: {
        params: { n: [2, 1, 3, 4], b: [3, 1, 2, 4, 6, 10] },
        make: ({ n, b }) => ({
          ask: `Find the average value of ${n === 1 ? 'x' : `x${['', '', '²', '³', '⁴'][n]}`} on [0,${b}].`,
          answer: b ** n / (n + 1),
          second: () => simpson((x) => x ** n, 0, b) / b,
          reason: `The integral is ${fr(b ** (n + 1) / (n + 1))} and the interval length is ${b}. Their ratio is the average height.`,
          traps: [
            [b ** (n + 1) / (n + 1), 'That is the integral. Divide it by the interval length to obtain an average height.'],
            [b ** n / 2, 'Averaging endpoint values works for a line, not an arbitrary curve.'],
          ],
        }),
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
        source: E('Session 55, Probability Function, solution (a), λ=a=1'),
        params: { lam: [1, 2, 3, 0.5], a: [1, 2, 3] },
        make: ({ lam, a }) => ({
          ask: String.raw`A waiting time has density $${density(lam)}$ for $t\ge0$, and zero elsewhere. For $x>${a}$, express $P(${a}<X<x)$ in x.`,
          key: `exp(-${fr(lam * a)})-exp(-(${fr(lam)})*x)`,
          alt: `exp(-(${fr(lam)})*x)*(exp((${fr(lam)})*(x-${a}))-1)`,
          wrong: `exp(-(${fr(lam)})*x)-exp(-${fr(lam * a)})`,
          at: a + 1,
          get: (x) => Math.exp(-lam * a) - Math.exp(-lam * x),
          second: (x) => simpson((t) => lam * Math.exp(-lam * t), a, x),
          reason: `Integrate the density from ${a} to x. The antiderivative is −e^(−${fr(lam)}t), so endpoint subtraction gives a positive probability.`,
        }),
      },
      crossing: {
        source: E('Session 55, Probability Function, solution (b), λ=1'),
        params: { lam: [1, 2, 3, 0.5], c: [1, 2, 5] },
        make: ({ lam, c }) => ({
          ask: String.raw`A waiting time has density $${density(lam)}$ for $t\ge0$, and zero elsewhere. For $x>0$, express $P(-${c}<X<x)$ in x.`,
          key: `1-exp(-(${fr(lam)})*x)`,
          alt: `(exp((${fr(lam)})*x)-1)/exp((${fr(lam)})*x)`,
          wrong: `exp(${fr(lam * c)})-exp(-(${fr(lam)})*x)`,
          get: (x) => -Math.expm1(-lam * x),
          second: (x) => simpson((t) => lam * Math.exp(-lam * t), 0, x),
          reason: `The density vanishes from −${c} to zero. Only the integral from zero to x contributes.`,
        }),
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
        source: S('3G-1(b), Simpson rule'),
        params: { n: [4, 2, 6, 8, 10, 12] },
        make: ({ n }) => ({
          ask: String.raw`Use ${n} equal subintervals and Simpson's rule for $\int_0^\pi\sin x\,dx$.`,
          answer: simpsonSine(n),
          printed: n === 4 ? 2.005 : undefined,
          note: n === 4 ? 'The source rounds to 2.005.' : undefined,
          second: () => (4 * trapSine(n) - trapSine(n / 2)) / 3,
          reason: `The width is π/${n}. Weight the heights 1, 4, 2, 4, …, 4, 1 and multiply by π/${3 * n}.`,
          method: 'simp',
          n,
          traps: [
            [trapSine(n), 'That applies trapezoidal weights, not Simpson weights.'],
            [(simpsonSine(n) * n) / Math.PI, 'That drops the subinterval width.'],
          ],
        }),
      },
      trapezoid: {
        source: S('3G-1(b), trapezoidal rule'),
        params: { n: [4, 2, 6, 8, 10, 12] },
        make: ({ n }) => ({
          ask: String.raw`Use ${n} equal subintervals and the trapezoidal rule for $\int_0^\pi\sin x\,dx$.`,
          answer: trapSine(n),
          printed: n === 4 ? 1.896 : undefined,
          note: n === 4 ? 'The source rounds to 1.896.' : undefined,
          second: () => (strips(Math.sin, 0, Math.PI, n, 'left') + strips(Math.sin, 0, Math.PI, n, 'right')) / 2,
          reason: 'Use half weight at the two endpoints and full weight at the interior samples. Here the endpoints of sin x are zero.',
          method: 'trap',
          n,
          traps: [
            [n % 2 ? strips(Math.sin, 0, Math.PI, n, 'mid') : simpsonSine(n), n % 2 ? 'That is the midpoint rule, not the trapezoidal rule.' : 'That applies Simpson weights instead of trapezoidal weights.'],
            [(trapSine(n) * n) / Math.PI, 'That adds heights without multiplying by the subinterval width.'],
          ],
        }),
      },
    },
    sim: {
      scenario: 'coarse',
      setup(s, $) {
        s.n = $.v.n;
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
        source: 'OpenStax Calculus Volume 2, §2.5, Example 2.25, The Work Required to Stretch or Compress a Spring',
        params: { spring: [[10, 0.2], [20, 0.1], [15, 0.3], [8, 0.2], [30, 0.5], [12, 0.4]], L: [0.5, 0.3, 0.6, 0.8] },
        make: ({ spring: [F, d], L }) => springForm(F, d, L, 1),
      },
      restoring: {
        params: { spring: [[10, 0.2], [20, 0.1], [15, 0.3], [8, 0.2], [30, 0.5], [12, 0.4]], L: [0.5, 0.3, 0.6, 0.8] },
        make: ({ spring: [F, d], L }) => springForm(F, d, L, -1),
      },
    },
    sim: {
      scenario: 'line',
      setup(s, $) {
        s.graphId = 'normalizedForce';
        s.a = 0;
        s.b = $.v.L;
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
        source: E('Session 61, Weighted Average, x-coordinate calculation'),
        params: { m: [1, 2, -1, 3, -2], A: [4, 1, 9] },
        make: ({ m, A }) => {
          const r = Math.sqrt(A),
            W = (4 * r ** 3) / 3;
          return {
            ask: String.raw`On $[${m - r},${m + r}]$, weights have density $w(x)=${A}-${shiftTexFn(m)}^2$. Find the weighted mean coordinate.`,
            answer: m,
            second: () => simpson((x) => x * (A - (x - m) ** 2), m - r, m + r) / simpson((x) => A - (x - m) ** 2, m - r, m + r),
            reason: `The weight profile is symmetric about ${m}. Its total weight is ${fr(W)} and its first moment ${fr(m * W)}, so their ratio is ${m}.`,
            graphId: `poly:${A - m * m},${2 * m},-1`,
            a: m - r,
            b: m + r,
            traps: [
              [0, 'That forgets the horizontal shift: the symmetry axis is the vertex of the weight.'],
              [m * W, 'That is the first moment before division by total weight.'],
            ],
          };
        },
      },
      vertical: {
        source: E('Session 61, Weighted Average, y-coordinate calculation'),
        params: { p: [0.5, 1, 2, 3], b: [4, 1, 9, 2], c: [2, 3] },
        make: ({ p, b, c }) => ({
          ask: String.raw`On $[0,${b}]$, weights have density $w(y)=${c}${p === 0.5 ? '\\sqrt y' : pw('y', p)}$. Find the weighted mean coordinate.`,
          answer: ((p + 1) / (p + 2)) * b,
          second: () => simpson((y) => c * y ** (p + 1), 0, b) / simpson((y) => c * y ** p, 0, b),
          reason: `Total weight is ${c}·${b}^${fr(p + 1)}/${fr(p + 1)} and the first moment ${c}·${b}^${fr(p + 2)}/${fr(p + 2)}. Their ratio is ${fr((p + 1) / (p + 2))}·${b}; the constant ${c} cancels.`,
          graphId: `pow:${c}:${p}`,
          a: 0,
          b,
          traps: [
            [b / 2, 'That is an unweighted interval midpoint. More weight lies toward the larger coordinate.'],
            [(c * b ** (p + 2)) / (p + 2), 'That is the first moment. Divide it by total weight before calling it a mean.'],
          ],
        }),
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
      adjacent: {
        ask: "If ∫₀² f=5 and ∫₂⁵ f=−3, what is ∫₀⁵ f?",
        options: [
          ["2.", "Integrals over adjacent intervals add, signs included."],
          ["8.", "Adding magnitudes ignores the negative signed area."],
          ["−15.", "Integrals over pieces add; they do not multiply."],
        ],
      },
      even: {
        ask: "An even function has ∫₀^a f=4. What is ∫₋ₐ^a f?",
        options: [
          ["8.", "An even function has equal areas on the two sides."],
          ["0.", "That is the odd-function result."],
          ["4.", "That counts only one side."],
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
      maximum: {
        ask: "F(x)=∫₀^x f(t)dt, and f changes from positive to negative at c. What is F at c?",
        options: [
          ["A local maximum.", "F′=f is positive before c and negative after it."],
          ["A local minimum.", "That needs f to change from negative to positive."],
          ["Zero.", "F(c) is the area so far; it need not vanish."],
        ],
      },
      start: {
        ask: "If F(x)=∫₂^x f(t)dt, what is F(2)?",
        options: [
          ["0.", "An integral over an interval of zero width is zero."],
          ["f(2).", "f(2) is F′(2), the slope, not the value."],
          ["It cannot be known without f.", "The value at the lower limit is always zero."],
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
      shell: {
        ask: "A thin shell at radius x has height h(x) and thickness dx. What is its volume?",
        options: [
          ["2πx·h(x)·dx.", "Unroll it: circumference times height times thickness."],
          ["πx²h(x)dx.", "That is a disk-like volume, not a thin shell."],
          ["2πh(x)dx.", "The circumference needs the radius x."],
        ],
      },
      axis: {
        ask: "A region between f(x)>g(x)≥−1 turns about the line y=−1. What is a washer’s outer radius?",
        options: [
          ["f(x)+1.", "Radius is distance from the axis y=−1."],
          ["f(x).", "That measures from y=0, not from the axis."],
          ["f(x)−1.", "The axis is below zero, so the distance grows by one."],
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
      total: {
        ask: "A density on [0,4] is never negative and has ∫₀⁴ f=2. Is it a valid probability density?",
        options: [
          ["No: the total probability must be one.", "Halving it would make it valid."],
          ["Yes: a density only needs f≥0.", "It also needs total area one."],
          ["Yes, provided f≤1 everywhere.", "Height is not the condition; area is."],
        ],
      },
      median: {
        ask: "For a density on [0,∞), what defines the median m?",
        options: [
          ["∫₀^m f=1/2.", "Half of the probability lies below m."],
          ["f(m)=1/2.", "The density height at m is not a probability."],
          ["m is where f is largest.", "That is the mode."],
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
      midpoint: {
        ask: "For a concave-up function, how does the midpoint rule compare with the integral?",
        options: [
          ["It underestimates.", "Each midpoint rectangle equals the trapezoid under the tangent there, and that tangent lies below the curve."],
          ["It overestimates.", "That is the trapezoidal rule’s behaviour for concave-up functions."],
          ["It is exact.", "Exactness holds for lines, not curves."],
        ],
      },
      halve: {
        ask: "Halving the step in Simpson’s rule for a smooth function divides the error by about what?",
        options: [
          ["16.", "Simpson’s error shrinks like h⁴."],
          ["2.", "That is a first-order method."],
          ["4.", "That is the trapezoidal rule."],
        ],
      },
    },
  }),
];
export default [...B, ...C];

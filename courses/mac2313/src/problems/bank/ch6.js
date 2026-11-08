/**
 * Ch 6, vector calculus: flux across a closed loop and divergence. Original problems, written for
 * the Flux lab. Each one's answer is also read back from the lab, which computes the flux three
 * ways (scripts/problems-check.mjs, sim agreement).
 */
import { problem, range, num, kase } from '../kit.js';
import { tiles } from '@flux/subjects/math/tiles2d.js';
import { FIELDS } from '@flux/subjects/math/flux2d.js';

const SRC = 'Flux, written for the Flux lab';
const TILES = 'Flux, written for the Tiles lab';
const WORK = 'Flux, written for the Work lab';
const BOX = 'Flux, written for the Box lab';

/** Place the Tiles lab's region for an instance. */
function region(slice, field, n, s, a, b) {
  slice.field = field;
  slice.n = n;
  slice.size = s;
  slice.probe = { x: a, y: b, z: 0 };
  return '';
}

/** Place the lab's loop for an instance. */
function loop(slice, shape, size, a, b) {
  slice.shape = shape;
  slice.size = size;
  slice.probe = { x: a, y: b, z: 0 };
  return '';
}

export default [
  problem({
    id: 'ch6.flux.source',
    exam: 'ch6',
    ch: '6',
    lab: 'flux2d',
    src: SRC,
    title: 'Flux of a source out of a circle',
    kind: 'numeric',
    level: 1,
    topics: ['flux'],
    vars: { R: range(0.3, 1.4, 0.1), a: range(-1, 1, 0.5), b: range(-1, 1, 0.5) },
    derive: ($) => ({ F: 2 * Math.PI * $.R * $.R }),
    text: (T) => `Let $\\mathbf F=(x,\\,y)$. Find the outward flux of $\\mathbf F$ across the circle of radius $${T.R}$ centred at $(${T.a},\\,${T.b})$.`,
    parts: [num('F', ($) => $.F, '', { label: 'flux', abs: 0.02 })],
    hints: [
      'Flux out of a closed curve equals the area integral of the divergence inside it.',
      'Here $\\nabla\\cdot\\mathbf F = 1 + 1 = 2$ everywhere, so the flux is twice the area.',
    ],
    steps: ($, f) => [`$\\nabla\\cdot\\mathbf F=2$, area $\\pi R^2$, so $\\Phi = 2\\pi R^2 = ${f($.F)}$.`],
    sim: { scenario: 'source', setup: (s, $) => loop(s, 'circle', $.R, $.a, $.b), read: (c) => ({ F: c.along }) },
    cases: [kase('sample', { R: 1, a: 0, b: 0 }, { F: 2 * Math.PI })],
  }),

  problem({
    id: 'ch6.flux.spread',
    exam: 'ch6',
    ch: '6',
    lab: 'flux2d',
    src: SRC,
    title: 'Flux that depends on where the loop sits',
    kind: 'numeric',
    level: 2,
    topics: ['flux', 'divergence'],
    vars: { h: range(0.2, 1, 0.2), a: range(-1.5, 1.5, 0.5), b: range(-1, 1, 0.5) },
    derive: ($) => ({ F: 12 * $.a * $.h * $.h }),
    text: (T) => `Let $\\mathbf F=(x^2,\\,xy)$. Find the outward flux across the square of half-side $${T.h}$ centred at $(${T.a},\\,${T.b})$.`,
    parts: [num('F', ($) => $.F, '', { label: 'flux', abs: 0.02 })],
    hints: [
      'Turn the flux into an area integral of the divergence.',
      'Here $\\nabla\\cdot\\mathbf F = 2x + x = 3x$. Its average over the square is $3$ times the $x$ of the centre.',
      'Multiply that average by the area $4h^2$.',
    ],
    steps: ($, f) => [`$\\nabla\\cdot\\mathbf F=3x$, average $3a$ over the square, area $4h^2$: $\\Phi = 12ah^2 = ${f($.F)}$.`],
    sim: { scenario: 'spread', setup: (s, $) => loop(s, 'square', $.h, $.a, $.b), read: (c) => ({ F: c.along }) },
    cases: [kase('sample', { h: 0.5, a: 1, b: 0 }, { F: 3 })],
  }),

  problem({
    id: 'ch6.flux.swirl',
    exam: 'ch6',
    ch: '6',
    lab: 'flux2d',
    src: SRC,
    title: 'Long arrows, no flux',
    kind: 'numeric',
    level: 1,
    topics: ['flux'],
    vars: { h: range(0.4, 1.2, 0.2), a: range(-1, 1, 0.5), b: range(-1, 1, 0.5) },
    derive: () => ({ F: 0 }),
    text: (T) => `Let $\\mathbf F=(-y,\\,x)$. Find the outward flux across the square of half-side $${T.h}$ centred at $(${T.a},\\,${T.b})$.`,
    parts: [num('F', ($) => $.F, '', { label: 'flux', abs: 0.02 })],
    hints: [
      'Compute the divergence before anything else.',
      'Here $\\partial P/\\partial x + \\partial Q/\\partial y = 0 + 0$. What enters the square on one side leaves on another.',
    ],
    steps: () => ['$\\nabla\\cdot\\mathbf F = 0$, so $\\Phi = 0$ for any loop.'],
    sim: { scenario: 'swirl', setup: (s, $) => loop(s, 'square', $.h, $.a, $.b), read: (c) => ({ F: c.along }) },
    cases: [kase('sample', { h: 1, a: 0, b: 0 }, { F: 0 })],
  }),

  problem({
    id: 'ch6.div.limit',
    exam: 'ch6',
    ch: '6',
    lab: 'flux2d',
    src: SRC,
    title: 'Divergence as flux per area',
    kind: 'numeric',
    level: 3,
    topics: ['divergence'],
    vars: { R: range(0.2, 1, 0.1), a: range(-1.5, 1.5, 0.5) },
    derive: ($) => ({ q: 3 * $.a * $.a + (3 * $.R * $.R) / 4, d: 3 * $.a * $.a }),
    text: (T) => `Let $\\mathbf F=(x^3,\\,0)$ and let $C$ be the circle of radius $${T.R}$ centred at $(${T.a},\\,0)$. Find the outward flux across $C$ divided by the area inside it. Then find $\\nabla\\cdot\\mathbf F$ at the centre.`,
    parts: [
      num('q', ($) => $.q, '', { label: 'flux ÷ area', abs: 0.01 }),
      num('d', ($) => $.d, '', { label: '$\\nabla\\cdot\\mathbf F$ at the centre', abs: 0.01 }),
    ],
    hints: [
      'Flux divided by area is the average of the divergence over the disc.',
      'Here $\\nabla\\cdot\\mathbf F = 3x^2$. Over a disc of radius $R$ about $(a,0)$, the average of $x^2$ is $a^2 + R^2/4$.',
    ],
    steps: ($, f) => [`Average of $3x^2$: $3a^2 + 3R^2/4 = ${f($.q)}$. At the centre, $3a^2 = ${f($.d)}$. As $R\\to 0$ the first closes in on the second.`],
    sim: { scenario: 'shrink', setup: (s, $) => loop(s, 'circle', $.R, $.a, 0), read: (c) => ({ q: c.perArea, d: c.divCentre }) },
    cases: [kase('sample', { R: 0.5, a: 1 }, { q: 3.1875, d: 3 })],
  }),

  problem({
    id: 'ch6.flux.point',
    exam: 'ch6',
    ch: '6',
    lab: 'flux2d',
    src: SRC,
    title: 'A point source: inside or outside',
    kind: 'numeric',
    level: 2,
    topics: ['flux'],
    vars: { R: range(0.4, 1.2, 0.2), a: range(-1.5, 1.5, 0.5), b: range(-1.5, 1.5, 0.5) },
    // Keep the source clear of the circle itself, where the flux jumps.
    valid: ($) => Math.abs(Math.hypot($.a, $.b) - $.R) > 0.15,
    derive: ($) => ({ F: Math.hypot($.a, $.b) < $.R ? 2 * Math.PI : 0 }),
    text: (T) => `Let $\\mathbf F=\\dfrac{(x,\\,y)}{x^2+y^2}$. Find the outward flux across the circle of radius $${T.R}$ centred at $(${T.a},\\,${T.b})$.`,
    parts: [num('F', ($) => $.F, '', { label: 'flux', abs: 0.02 })],
    hints: [
      'Away from the origin this field has zero divergence. Decide first whether the circle holds the origin.',
      'If it does not, the flux is zero. If it does, shrink the loop to a small circle about the origin, where $\\mathbf F\\cdot\\hat n = 1/r$ all the way round.',
    ],
    steps: ($, f) => [Math.hypot($.a, $.b) < $.R ? `The circle holds the origin. On a small circle of radius $r$ the flux is $(1/r)(2\\pi r) = 2\\pi \\approx ${f($.F)}$.` : 'The origin is outside the circle, and $\\nabla\\cdot\\mathbf F = 0$ inside, so the flux is $0$.'],
    sim: { scenario: 'point-in', setup: (s, $) => loop(s, 'circle', $.R, $.a, $.b), read: (c) => ({ F: c.along }) },
    cases: [kase('inside', { R: 1, a: 0.5, b: 0 }, { F: 2 * Math.PI }), kase('outside', { R: 0.4, a: 1, b: 1 }, { F: 0 })],
  }),

  problem({
    id: 'ch6.tiles.sum',
    exam: 'ch6',
    ch: '6',
    lab: 'tiles',
    src: TILES,
    title: 'Adding up four cells',
    kind: 'numeric',
    level: 2,
    topics: ['flux'],
    vars: { s: range(0.5, 1.2, 0.1), a: range(-1, 1, 0.5), b: range(-1, 1, 0.5) },
    derive: ($) => ({ F: 12 * $.a * $.s * $.s }),
    text: (T) => `Let $\\mathbf F=(x^2,\\,xy)$. The square of half-side $${T.s}$ centred at $(${T.a},\\,${T.b})$ is cut into four equal squares, and the outward flux of each small square is found and the four are added. What is the total?`,
    parts: [num('F', ($) => $.F, '', { label: 'sum of the four fluxes', abs: 0.02 })],
    hints: [
      'Every inner side is shared by two small squares, and its flux leaves one and enters the other.',
      'So the four add to the flux out of the big square: $\\iint \\nabla\\cdot\\mathbf F\\,dA$ with $\\nabla\\cdot\\mathbf F = 3x$, whose average over the square is $3a$.',
    ],
    steps: ($, f) => [`The inner sides cancel, leaving the big square: $3a \\times (2s)^2 = 12as^2 = ${f($.F)}$.`],
    sim: { scenario: 'fine', setup: (s, $) => region(s, 'spread', 2, $.s, $.a, $.b), read: (c) => ({ F: c.t.cells }) },
    cases: [kase('sample', { s: 1, a: 0.5, b: 0 }, { F: 6 })],
  }),

  problem({
    id: 'ch6.tiles.midpoint',
    exam: 'ch6',
    ch: '6',
    lab: 'tiles',
    src: TILES,
    title: 'Divergence times area, cell by cell',
    kind: 'numeric',
    level: 3,
    topics: ['flux'],
    vars: { n: range(2, 4, 2), a: range(-1, 1, 0.5), s: range(0.5, 1.2, 0.1) },
    derive: ($) => ({ M: tiles(FIELDS.cubic, { a: $.a, b: 0, s: $.s, n: $.n }).midpoint }),
    text: (T) => `Let $\\mathbf F=(x^3,\\,0)$, so $\\nabla\\cdot\\mathbf F = 3x^2$. The square of half-side $${T.s}$ centred at $(${T.a},\\,0)$ is cut into $${T.n}\\times${T.n}$ cells. Add $(\\nabla\\cdot\\mathbf F)\\,\\Delta A$ over the cells, with the divergence taken at each cell's centre.`,
    parts: [num('M', ($) => $.M, '', { label: 'midpoint sum', abs: 0.02 })],
    hints: [
      'Each cell is $2s/n$ wide, so $\\Delta A = 4s^2/n^2$; the centres in $x$ sit at $a - s + (i + \\tfrac12)\\,2s/n$.',
      'Each column of cells shares one centre $x$, so the sum is $n \\sum_i 3x_i^2 \\cdot 4s^2/n^2$.',
    ],
    steps: ($, f) => [`Adding $3x_i^2\\,\\Delta A$ over all ${$.n * $.n} cells gives $${f($.M)}$. The exact flux is $12s^2(a^2 + s^2/3) = ${f(12 * $.s * $.s * ($.a * $.a + ($.s * $.s) / 3))}$: the sum closes in as the cells shrink.`],
    sim: { scenario: 'cubic', setup: (s, $) => region(s, 'cubic', $.n, $.s, $.a, 0), read: (c) => ({ M: c.t.midpoint }) },
    cases: [kase('sample', { n: 2, a: 0, s: 1 }, { M: 3 })],
  }),

  problem({
    id: 'ch6.work.swirl',
    exam: 'ch6',
    ch: '6',
    lab: 'work',
    src: WORK,
    title: 'Work of a swirl along a segment',
    kind: 'numeric',
    level: 2,
    topics: ['line-integrals'],
    vars: { bx: range(0.4, 2, 0.2), by: range(-1, 1.6, 0.2) },
    derive: ($) => ({ W: -1.2 * $.by + 0.8 * $.bx }),
    text: (T) => `Let $\\mathbf F=(-y,\\,x)$. Find the work $\\int_C \\mathbf F\\cdot d\\mathbf r$ along the straight segment from $(-1.2,\\,-0.8)$ to $(${T.bx},\\,${T.by})$.`,
    parts: [num('W', ($) => $.W, '', { label: 'work', abs: 0.005 })],
    hints: [
      'Parametrise the segment: $\\mathbf r(t)=A+t(B-A)$, $0\\le t\\le 1$.',
      'For this field $\\mathbf F(\\mathbf r)\\cdot\\mathbf r\'$ is constant along a segment: $A_xB_y-A_yB_x$.',
    ],
    steps: ($, f) => [`$W=\\int_0^1 \\big(-y(t)\\,(B_x-A_x)+x(t)\\,(B_y-A_y)\\big)\\,dt = A_xB_y-A_yB_x = ${f($.W)}$.`],
    sim: { scenario: 'swirl', setup: (s, $) => { s.field = 'swirl'; s.probe = { x: $.bx, y: $.by, z: 0 }; return ''; }, read: (c) => ({ W: c.W1 }) },
    cases: [kase('sample', { bx: 1.4, by: 0.6 }, { W: 0.4 })],
  }),

  problem({
    id: 'ch6.box.source',
    exam: 'ch6',
    ch: '6',
    lab: 'box',
    src: BOX,
    title: 'Flux out of a cube',
    kind: 'numeric',
    level: 1,
    topics: ['divergence'],
    vars: { s: range(0.2, 1, 0.1), a: range(-1, 1, 0.5), b: range(-1, 1, 0.5) },
    derive: ($) => ({ F: 3 * (2 * $.s) ** 3 }),
    text: (T) => `Let $\\mathbf F=(x,\\,y,\\,z)$. Find the outward flux of $\\mathbf F$ through the surface of the cube of half-side $${T.s}$ centred at $(${T.a},\\,${T.b},\\,0)$.`,
    parts: [num('F', ($) => $.F, '', { label: 'flux', abs: 0.01 })],
    hints: [
      'By the divergence theorem the flux is $\\iiint \\nabla\\cdot\\mathbf F\\,dV$.',
      'Here $\\nabla\\cdot\\mathbf F=3$ everywhere, so the flux is three times the volume, $(2s)^3$.',
    ],
    steps: ($, f) => [`$\\nabla\\cdot\\mathbf F=3$, volume $(2s)^3$, so $\\Phi=3(2s)^3=${f($.F)}$.`],
    sim: { scenario: 'source', setup: (s, $) => { s.field = 'source'; s.s = $.s; s.cz = 0; s.probe = { x: $.a, y: $.b, z: 0 }; return ''; }, read: (c) => ({ F: c.sum }) },
    cases: [kase('sample', { s: 0.5, a: 0, b: 0 }, { F: 3 })],
  }),
];

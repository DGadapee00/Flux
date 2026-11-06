/**
 * Ch 6, vector calculus: flux across a closed loop and divergence. Original problems, written for
 * the Flux lab. Each one's answer is also read back from the lab, which computes the flux three
 * ways (scripts/problems-check.mjs, sim agreement).
 */
import { problem, range, num, kase } from '../kit.js';

const SRC = 'Flux, written for the Flux lab';

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
];

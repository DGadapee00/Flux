/**
 * Unit 1 bank: matrices and elimination. Original problems, written for the Matrix map and
 * Elimination labs, with staged hints and named traps (../coaching/u1.js), each checked against its
 * lab (`sim`).
 */
import { det2, mul2, rotation } from '@flux/subjects/math/linalg.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const AREA = { unit: 1, two: 4 };
export const A3 = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]];
const R = rotation(90);

export default [
  problem({
    id: 'u1.1.matrix-area',
    title: 'How much area a map gives',
    exam: 'u1',
    ch: '1',
    lab: 'matrix',
    src: 'Flux, written for the Matrix map lab',
    topics: ['matrix'],
    principles: ['columns'],
    vars: { shape: choice(['unit', 'the unit square'], ['two', 'a square of side 2']), a: range(1, 3, 1, ''), b: range(-2, 2, 1, ''), c: range(-2, 2, 1, ''), d: range(1, 3, 1, '') },
    valid: ($) => Math.abs($.a * $.d - $.b * $.c) > 0.5,
    text: (T, $) => String.raw`The map $A = \begin{pmatrix} ${$.a} & ${$.b} \\ ${$.c} & ${$.d} \end{pmatrix}$ is applied to ${T.shape}. What area does the image cover?`,
    parts: [num('area', ($) => Math.abs(det2([[$.a, $.b], [$.c, $.d]])) * AREA[$.shape], '', { label: 'image area' })],
    level: 1,
    hints: ['The unit square maps to the parallelogram on A’s columns, whose area is |det A|.', 'Every area scales by the same factor: multiply the shape’s area by |ad − bc|.'],
    steps: ($) => [String.raw`$\det A = ${$.a}\cdot${$.d} - ${$.b}\cdot${$.c} = ${$.a * $.d - $.b * $.c}$, so the image covers $${Math.abs($.a * $.d - $.b * $.c)} \times ${AREA[$.shape]} = ${Math.abs($.a * $.d - $.b * $.c) * AREA[$.shape]}$.`],
    sim: {
      scenario: 'shear',
      setup(s, $) {
        Object.assign(s, { a: $.a, b: $.b, c: $.c, d: $.d, compose: 'none' });
      },
      read: (c, s, $) => ({ area: Math.abs(c.det) * AREA[$.shape] }),
    },
    cases: [kase('A shear on the unit square', { shape: 'unit', a: 1, b: 1, c: 0, d: 1 }, { area: 1 })],
  }),

  problem({
    id: 'u1.2.product',
    title: 'Turn after a map',
    exam: 'u1',
    ch: '1',
    lab: 'matrix',
    src: 'Flux, written for the Matrix map lab',
    topics: ['matrix'],
    principles: ['no-commute'],
    vars: { order: choice(['after', 'then turned a quarter (RA)'], ['before', 'after a quarter turn (AR)']), a: range(1, 3, 1, ''), b: range(-2, 2, 1, ''), c: range(-2, 2, 1, ''), d: range(1, 3, 1, '') },
    text: (T, $) => String.raw`Let $A = \begin{pmatrix} ${$.a} & ${$.b} \\ ${$.c} & ${$.d} \end{pmatrix}$ and $R = \begin{pmatrix} 0 & -1 \\ 1 & 0 \end{pmatrix}$, a quarter turn. The plane is mapped by A ${T.order}. Where does the point (1, 0) land? Give its x and y.`,
    parts: [
      num('x', ($) => (($.order === 'after' ? mul2(R, [[$.a, $.b], [$.c, $.d]]) : mul2([[$.a, $.b], [$.c, $.d]], R))[0][0]), '', { label: 'x', abs: 1e-6 }),
      num('y', ($) => (($.order === 'after' ? mul2(R, [[$.a, $.b], [$.c, $.d]]) : mul2([[$.a, $.b], [$.c, $.d]], R))[1][0]), '', { label: 'y', abs: 1e-6 }),
    ],
    level: 2,
    hints: ['(1, 0) lands on the first column of the combined matrix.', 'RA means A first, then R; AR means R first, then A. Apply them to (1, 0) in that order.'],
    steps: ($) => [$.order === 'after' ? `A sends (1, 0) to (${$.a}, ${$.c}); the quarter turn sends that to (${-$.c}, ${$.a}).` : `The quarter turn sends (1, 0) to (0, 1); A sends that to its second column, (${$.b}, ${$.d}).`],
    sim: {
      scenario: 'shear-then-turn',
      setup(s, $) {
        Object.assign(s, { a: $.a, b: $.b, c: $.c, d: $.d, compose: $.order });
      },
      read: (c) => ({ x: c.col1[0], y: c.col1[1] }),
    },
    cases: [kase('A shear, then a quarter turn', { order: 'after', a: 1, b: 1, c: 0, d: 1 }, { x: 0, y: 1 })],
  }),

  problem({
    id: 'u1.4.elimination',
    title: 'Eliminate and back-substitute',
    exam: 'u1',
    ch: '1',
    lab: 'elimination',
    src: 'Flux, written for the Elimination lab',
    topics: ['elimination'],
    principles: ['elimination'],
    vars: { order: choice(['plain', 'in the order given'], ['pivot', 'with partial pivoting']) },
    text: (T) => String.raw`Solve $2x + y - z = 8$, $-3x - y + 2z = -11$, $-2x + y + 2z = -3$ by elimination ${T.order}. What multiplier removes x from the second equation in the first step, and what is z?`,
    parts: [
      num('m', ($) => ($.order === 'pivot' ? 2 / -3 : -3 / 2), '', { label: 'first multiplier', abs: 1e-6 }),
      num('z', () => -1, '', { label: 'z', abs: 1e-6 }),
    ],
    level: 2,
    hints: ['The multiplier for a row is its leading entry divided by the pivot. With pivoting, the row with −3 moves to the top first.', 'Finish the triangle, then solve from the bottom: z first.'],
    steps: ($) => [$.order === 'pivot' ? 'Swap rows 1 and 2, so −3 is the pivot. The first multiplier, for the old row 1, is 2/(−3) = −0.667. The triangle gives z = −1.' : 'The pivot is 2, so the multiplier for row 2 is −3/2 = −1.5. The triangle gives z = −1, then y = 3 and x = 2.'],
    sim: {
      scenario: 'three',
      setup(s, $) {
        Object.assign(s, { system: 'three', pivot: $.order === 'pivot', step: 6 });
      },
      read: (c) => ({ m: c.steps.find((st) => st.kind === 'eliminate').f, z: c.x[2] }),
    },
    cases: [kase('In the order given', { order: 'plain' }, { m: -1.5, z: -1 })],
  }),

  problem({
    id: 'u1.5.tiny-pivot',
    title: 'A tiny pivot',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'elimination',
    src: 'Flux, written for the Elimination lab',
    topics: ['elimination'],
    principles: ['pivoting'],
    vars: { how: choice(['keep', 'keeping the rows in order'], ['swap', 'swapping the rows first']) },
    text: (T) => String.raw`In double precision, solve $10^{-17}x_1 + x_2 = 1$, $x_1 + x_2 = 2$ by elimination, ${T.how}. The true solution is very nearly $x_1 = x_2 = 1$. What does the computer get for $x_1$?`,
    parts: [
      pick('x1', 'x₁ comes out', [
        ['right', 'close to 1', 'With the larger entry as pivot, the multiplier is tiny and nothing is lost.'],
        ['wrong', 'far from 1 (it comes out 0)', 'A multiplier of 10¹⁷ swamps the second row, whose own numbers are lost in rounding.'],
      ], ($) => ($.how === 'swap' ? 'right' : 'wrong')),
    ],
    level: 2,
    hints: ['What is the multiplier when the pivot is 10⁻¹⁷?', 'Subtracting 10¹⁷ times one row from another: what is left of 1 and 2 after rounding?'],
    steps: ($) => [$.how === 'swap' ? 'Pivot 1, multiplier 10⁻¹⁷: x₁ comes out 1.' : 'Row 2 becomes 1 − 10¹⁷ and 2 − 10¹⁷, which both round to −10¹⁷: x₂ = 1, then x₁ = (1 − 1)/10⁻¹⁷ = 0.'],
    sim: {
      scenario: 'tiny',
      setup(s, $) {
        Object.assign(s, { system: 'tiny', pivot: $.how === 'swap', step: 2 });
      },
      read: (c) => ({ x1: Math.abs(c.x[0] - 1) < 0.01 ? 'right' : 'wrong' }),
    },
    cases: [kase('Rows kept in order', { how: 'keep' }, { x1: 'wrong' })],
  }),
];

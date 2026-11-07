/**
 * Unit 1 bank: matrices and elimination. Original problems, written for the Matrix map and
 * Elimination labs, with staged hints and named traps (../coaching/u1.js), each checked against its
 * lab (`sim`).
 */
import { det2, inverse2, mul2, rotation } from '@flux/subjects/math/linalg.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const AREA = { unit: 1, two: 4 };
export const A3 = [[2, 1, -1], [-3, -1, 2], [-2, 1, 2]];
const R = rotation(90);
/** Where an inverse entry sits in the matrix, by name. */
export const ENTRY = { tl: [0, 0], tr: [0, 1], bl: [1, 0] };
export const invEntry = ($) => {
  const [i, j] = ENTRY[$.entry];
  return inverse2([[$.a, $.b], [$.c, $.d]])[i][j];
};
/** The nearly dependent system's solution: (1, 1, 1) + (δ/2.5ε)(1.5, 0.5, −2). */
export const NULL_DIR = { x: 1.5, y: 0.5, z: -2 };
/** The projection problem: a₁ = (1, 0, 0), a₂ = (1, 1, 0); `how` names the traps. */
export const projCoef = ($, how = 'right') => {
  const right = { x1: $.bu - $.bv, x2: $.bv };
  const own = { x1: $.bu, x2: ($.bu + $.bv) / 2 };
  const other = { x1: $.bv, x2: $.bu - $.bv };
  return { right, own, other }[how][$.ask];
};
export const nearly = ($) => 1 + ($.delta / (2.5 * $.eps)) * NULL_DIR[$.ask];

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

  problem({
    id: 'u1.6.inverse',
    title: 'An entry of the inverse',
    exam: 'u1',
    ch: '1',
    lab: 'inverse',
    src: 'Flux, written for the Inverse lab',
    topics: ['inverse'],
    principles: ['conditioning'],
    vars: { entry: choice(['tl', 'top-left'], ['tr', 'top-right'], ['bl', 'bottom-left']), a: range(1, 5, 1, ''), b: range(1, 4, 1, ''), c: range(1, 4, 1, ''), d: range(1, 5, 1, '') },
    valid: ($) => Math.abs($.a * $.d - $.b * $.c) >= 2,
    text: (T, $) => String.raw`Find the ${T.entry} entry of $A^{-1}$ for $A = \begin{pmatrix} ${$.a} & ${$.b} \\ ${$.c} & ${$.d} \end{pmatrix}$.`,
    parts: [num('entry', ($) => invEntry($), '', { label: 'entry', abs: 1e-6 })],
    level: 1,
    hints: ['For a 2×2, A⁻¹ = (1/det A)[[d, −b], [−c, a]].', 'Swap the diagonal, negate the off-diagonal, then divide everything by ad − bc.'],
    steps: ($) => [String.raw`$\det A = ${$.a}\cdot${$.d} - ${$.b}\cdot${$.c} = ${$.a * $.d - $.b * $.c}$, so the ${$.entry === 'tl' ? 'top-left entry is d/det A' : $.entry === 'tr' ? 'top-right entry is −b/det A' : 'bottom-left entry is −c/det A'} $= ${Number(invEntry($).toPrecision(4))}$.`],
    sim: {
      scenario: 'shear',
      setup(s, $) {
        Object.assign(s, { a: $.a, b: $.b, c: $.c, d: $.d, s: 1 });
      },
      read: (c, s, $) => ({ entry: c.inv[ENTRY[$.entry][0]][ENTRY[$.entry][1]] }),
    },
    cases: [kase('A = [[3, 1], [4, 2]], top-right', { entry: 'tr', a: 3, b: 1, c: 4, d: 2 }, { entry: -0.5 })],
  }),

  problem({
    id: 'u1.7.condition',
    title: 'Which is nearly singular?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'inverse',
    src: 'Flux, written for the Inverse lab',
    topics: ['inverse'],
    principles: ['conditioning'],
    vars: { small: choice(['tenth', 'P = 0.1 I, with det P = 0.01'], ['hundredth', 'P = 0.01 I, with det P = 0.0001']) },
    text: (T) => String.raw`Two matrices: ${T.small}, and $Q = \begin{pmatrix} 1 & 1 \\ 1 & 1.01 \end{pmatrix}$, with det Q = 0.01. Which is closer to being singular?`,
    parts: [
      pick('which', 'closer to singular', [
        ['P', 'P: its determinant is as small or smaller', 'Scaling the identity shrinks det but maps the circle to a circle: κ = 1, as far from singular as a matrix can be.'],
        ['Q', 'Q: its columns nearly line up', 'Q squashes the circle almost flat: κ ≈ 400. That flatness, not det, measures how close a matrix is to singular.'],
        ['same', 'neither: equal determinants mean equal risk', 'The determinant mixes size with shape. Only κ separates them.'],
      ], () => 'Q'),
    ],
    level: 2,
    hints: ['What does each matrix do to the unit circle?', 'Compare κ = σ₁/σ₂, not det.'],
    steps: () => ['P is a multiple of I: κ = 1, and P⁻¹ = (1/s) I is tame. Q has σ₁ = 2.005 and σ₂ = 0.005, so κ = 402: Q is the one near singular.'],
    sim: {
      scenario: 'nearly',
      setup() {},
      read: (c) => ({ which: c.kappa > 2 ? 'Q' : 'P' }),
    },
    cases: [kase('0.1 I against Q', { small: 'tenth' }, { which: 'Q' })],
  }),

  problem({
    id: 'u1.8.rank',
    title: 'Pivots and free directions',
    exam: 'u1',
    ch: '1',
    lab: 'rank',
    src: 'Flux, written for the Rank lab',
    topics: ['rank'],
    principles: ['rank'],
    vars: { rhs: choice(['same', '3.5'], ['off', '4.5']) },
    text: (T) => String.raw`Solve $x + y + z = 3$, $x - y + 0.5z = 0.5$, $2x + 1.5z = ${T.rhs}$ by elimination. What is the rank of A, how many free directions does the null space have, and how many solutions are there?`,
    parts: [
      num('rank', () => 2, '', { label: 'rank A', abs: 1e-6 }),
      num('nullity', () => 1, '', { label: 'dim N(A)', abs: 1e-6 }),
      pick('solutions', 'the solutions', [
        ['one', 'exactly one', 'That needs three pivots. Row 3’s left side is r₁ + r₂, so elimination leaves only two.'],
        ['line', 'a whole line of them', 'Rank 2 and a consistent right side: xₚ plus any multiple of the null direction.'],
        ['none', 'none', 'Elimination ends at 0 = (b₃ − b₁ − b₂): no solution when that is not zero.'],
      ], ($) => ($.rhs === 'same' ? 'line' : 'none')),
    ],
    level: 2,
    hints: ['Look at row 3’s left side: it is r₁ + r₂.', 'Rank + dim N(A) = 3. Then compare b₃ with b₁ + b₂ = 3.5.'],
    steps: ($) => [`Row 3 − row 1 − row 2 leaves 0 = ${$.rhs === 'same' ? '0' : '1'}: two pivots, so rank 2 and a null space of dimension 3 − 2 = 1. ${$.rhs === 'same' ? 'Consistent: a line of solutions.' : 'Inconsistent: no solution.'}`],
    sim: {
      scenario: 'line',
      setup(s, $) {
        Object.assign(s, { eps: 0, delta: $.rhs === 'same' ? 0 : 1 });
      },
      read: (c) => ({ rank: c.rankA, nullity: c.nullity, solutions: c.kind }),
    },
    cases: [kase('a consistent right side', { rhs: 'same' }, { rank: 2, nullity: 1, solutions: 'line' })],
  }),

  problem({
    id: 'u1.9.nearly',
    title: 'A nearly dependent system',
    exam: 'u1',
    ch: '1',
    lab: 'rank',
    src: 'Flux, written for the Rank lab',
    topics: ['rank'],
    principles: ['rank'],
    vars: { ask: choice(['x', 'x'], ['y', 'y'], ['z', 'z']), eps: range(0.02, 0.5, 0.02, ''), delta: range(0.5, 2, 0.5, '') },
    text: (T, $) => String.raw`Solve $x + y + z = 3$, $x - y + 0.5z = 0.5$, $2x + ${$.eps}y + ${Number((1.5 - $.eps).toFixed(2))}z = ${Number((3.5 + $.delta).toFixed(2))}$. What is ${T.ask}?`,
    parts: [num('v', ($) => nearly($), '', { label: 'value', abs: 1e-4 })],
    level: 3,
    hints: ['The first two planes meet on the line (1, 1, 1) + t(1.5, 0.5, −2). Check that both equations hold on it.', 'Put that line into the third equation and solve for t. Then read off the unknown asked for.'],
    steps: ($) => [String.raw`On the line, the third equation gives $3.5 + 2.5\,(${$.eps})\,t = ${Number((3.5 + $.delta).toFixed(2))}$, so $t = ${Number(($.delta / (2.5 * $.eps)).toPrecision(4))}$ and ${$.ask} $= ${Number(nearly($).toPrecision(4))}$.`],
    sim: {
      scenario: 'nearly',
      setup(s, $) {
        Object.assign(s, { eps: $.eps, delta: $.delta });
      },
      read: (c, s, $) => ({ v: c.x[{ x: 0, y: 1, z: 2 }[$.ask]] }),
    },
    cases: [kase('the lab’s nearly dependent case', { ask: 'x', eps: 0.02, delta: 0.5 }, { v: 16 })],
  }),

  problem({
    id: 'u1.10.eigen',
    title: 'Eigenvalues of a symmetric matrix',
    exam: 'u1',
    ch: '1',
    lab: 'eigen',
    src: 'Flux, written for the Eigen lab',
    topics: ['eigen'],
    principles: ['eigen'],
    vars: { which: choice(['larger', 'larger'], ['smaller', 'smaller']), a: range(1, 4, 1, ''), b: range(1, 3, 1, '') },
    text: (T, $) => String.raw`Find the ${T.which} eigenvalue of $A = \begin{pmatrix} ${$.a} & ${$.b} \\ ${$.b} & ${$.a} \end{pmatrix}$.`,
    parts: [num('lambda', ($) => ($.which === 'larger' ? $.a + $.b : $.a - $.b), '', { label: 'λ', abs: 1e-6 })],
    level: 1,
    hints: ['Solve det(A − λI) = 0: λ² − (tr A)λ + det A = 0.', `Here tr A = 2a and det A = a² − b², so λ = a ± b.`],
    steps: ($) => [String.raw`$\lambda^2 - ${2 * $.a}\lambda + ${$.a * $.a - $.b * $.b} = 0$, so $\lambda = ${$.a} \pm ${$.b}$: the ${$.which} is ${$.which === 'larger' ? $.a + $.b : $.a - $.b}.`],
    sim: {
      scenario: 'symmetric',
      setup(s, $) {
        Object.assign(s, { a: $.a, b: $.b, c: $.b, d: $.a });
      },
      read: (c, s, $) => ({ lambda: $.which === 'larger' ? c.values[0] : c.values[c.values.length - 1] }),
    },
    cases: [kase('the notes’ matrix, larger', { which: 'larger', a: 2, b: 1 }, { lambda: 3 })],
  }),

  problem({
    id: 'u1.11.turn',
    title: 'Does a turn have an eigenvector?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'eigen',
    src: 'Flux, written for the Eigen lab',
    topics: ['eigen'],
    principles: ['eigen'],
    vars: { angle: choice(['ninety', 'a quarter turn, 90°'], ['fortyfive', 'an eighth of a turn, 45°']) },
    text: (T) => `A matrix rotates the plane by ${T.angle} and does nothing else. How many real directions does it only stretch?`,
    parts: [
      pick('n', 'directions it only stretches', [
        ['none', 'none: every vector turns', 'A rotation by anything but 0° or 180° turns every vector; its eigenvalues are a complex pair.'],
        ['one', 'one', 'One direction comes from a repeated eigenvalue, as in a shear. A rotation has none.'],
        ['two', 'two', 'Two real eigenvalues need a positive discriminant; a rotation’s is negative.'],
      ], () => 'none'),
    ],
    level: 1,
    hints: ['Does any vector come out pointing along itself?', 'For a rotation by θ, tr A = 2 cos θ and det A = 1: check the sign of tr² − 4 det.'],
    steps: () => ['tr² − 4 det = 4cos²θ − 4 < 0 for these angles: complex eigenvalues, no real eigenvector.'],
    sim: {
      scenario: 'rotation',
      setup(s, $) {
        const t = $.angle === 'ninety' ? Math.PI / 2 : Math.PI / 4;
        Object.assign(s, { a: Math.cos(t), b: -Math.sin(t), c: Math.sin(t), d: Math.cos(t) });
      },
      read: (c) => ({ n: c.found.length === 0 ? 'none' : c.found.length === 1 ? 'one' : 'two' }),
    },
    cases: [kase('a quarter turn', { angle: 'ninety' }, { n: 'none' })],
  }),


  problem({
    id: 'u1.12.coefficients',
    title: 'Coefficients of a projection',
    exam: 'u1',
    ch: '1',
    lab: 'projection',
    src: 'Flux, written for the Projection lab',
    topics: ['projection'],
    principles: ['projection'],
    vars: { ask: choice(['x1', 'x̂₁, the coefficient of a₁'], ['x2', 'x̂₂, the coefficient of a₂']), bu: range(7, 9, 1), bv: range(1, 3, 1) },
    text: (T) => `Project b = (${T.bu}, ${T.bv}, 1) onto the plane of a₁ = (1, 0, 0) and a₂ = (1, 1, 0), so that p = x̂₁a₁ + x̂₂a₂ is the closest point. What is ${T.ask}?`,
    parts: [num('x', ($) => projCoef($), '', { label: 'x̂' })],
    level: 2,
    hints: ['Write the normal equations AᵀA x̂ = Aᵀb with A = [a₁ a₂].', 'AᵀA = [[1, 1], [1, 2]] and Aᵀb = (b₁, b₁ + b₂). Solve the 2 × 2 system.'],
    steps: ($) => [String.raw`$x̂_1 + x̂_2 = ${$.bu}$ and $x̂_1 + 2x̂_2 = ${$.bu + $.bv}$, so $x̂_2 = ${$.bv}$ and $x̂_1 = ${$.bu - $.bv}$`],
    sim: {
      scenario: 'slant',
      setup(s, $) {
        Object.assign(s, { theta: 45, L: Math.SQRT2, bu: $.bu, bv: $.bv, bw: 1 });
      },
      read: (c, s, $) => ({ x: $.ask === 'x1' ? c.xhat[0] : c.xhat[1] }),
    },
    cases: [kase('x̂₁ for b = (8, 2, 1)', { ask: 'x1', bu: 8, bv: 2 }, { x: 6 })],
  }),

  problem({
    id: 'u1.13.shadows',
    title: 'Do the shadows add?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'projection',
    src: 'Flux, written for the Projection lab',
    topics: ['projection'],
    principles: ['projection'],
    vars: { arrows: choice(['perp', 'perpendicular arrows of lengths 1 and 2'], ['slant', 'arrows 60° apart, of lengths 1 and 1.5'], ['unit', 'unit-length arrows 60° apart']) },
    text: (T) => `A plane is spanned by ${T.arrows}. Does projecting b onto each arrow on its own and adding the two give the projection of b onto the plane?`,
    parts: [
      pick('d', 'the sum of the two projections', [
        ['yes', 'yes: it is the projection', 'Perpendicular arrows do not share any direction, so each shadow is exactly its part of p.'],
        ['no', 'no: it overshoots', 'Slanted arrows share a direction, so each shadow contains part of the other and the sum counts it twice. Unit length does not help.'],
      ], ($) => ($.arrows === 'perp' ? 'yes' : 'no')),
    ],
    level: 1,
    hints: ['When is AᵀA diagonal?', 'Only then do the normal equations split into one equation per column.'],
    steps: ($) => [$.arrows === 'perp' ? 'a₁ · a₂ = 0: AᵀA is diagonal, and each coefficient is b·aᵢ/aᵢ·aᵢ.' : 'a₁ · a₂ ≠ 0: AᵀA is not diagonal, so the coefficients couple.'],
    sim: {
      scenario: 'slant',
      setup(s, $) {
        Object.assign(s, { perp: { theta: 90, L: 2 }, slant: { theta: 60, L: 1.5 }, unit: { theta: 60, L: 1 } }[$.arrows]);
      },
      read: (c) => ({ d: c.naiveRight ? 'yes' : 'no' }),
    },
    cases: [kase('slanted arrows', { arrows: 'slant' }, { d: 'no' })],
  }),
  problem({
    id: 'u1.13.nudge',
    title: 'A small nudge, a large move',
    exam: 'u1',
    ch: '1',
    lab: 'condition',
    src: 'Flux, written for the Condition lab',
    topics: ['conditioning'],
    principles: ['conditioning'],
    vars: { eps: choice(['0.1', '0.1'], ['0.01', '0.01'], ['0.001', '0.001']), delta: range(0.001, 0.01, 0.001, '') },
    text: (T) => `The system x + y = 2, x + (1 + ε)y = 2 has the solution (2, 0). Take ε = ${T.eps} and change the second right-hand side to 2 + ${T.delta}. Find the new y. (x is then 2 − y.)`,
    parts: [num('v', ($) => $.delta / Number($.eps), '', { label: 'y', abs: 1e-6 })],
    level: 2,
    hints: ['Subtract the first equation from the second.', 'εy = δ, so y = δ/ε; then x = 2 − y.'],
    steps: ($) => [String.raw`$\varepsilon y = \delta \Rightarrow y = ${$.delta}/${$.eps} = ${Number(($.delta / Number($.eps)).toPrecision(4))}$, $x = 2 - y = ${Number((2 - $.delta / Number($.eps)).toPrecision(4))}$`],
    sim: {
      scenario: 'ill',
      setup(s, $) {
        Object.assign(s, { leps: Math.log10(Number($.eps)), delta: $.delta });
      },
      read: (c) => ({ v: c.x[1] }),
    },
    cases: [kase('the notes’ lines', { eps: '0.01', delta: 0.01 }, { v: 1 })],
  }),

  problem({
    id: 'u1.14.residual',
    title: 'Is a small residual enough?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'condition',
    src: 'Flux, written for the Condition lab',
    topics: ['conditioning'],
    principles: ['conditioning'],
    vars: { k: choice(['big', 'κ(A) = 10⁶'], ['small', 'κ(A) = 2']) },
    text: (T) => `A solver returns x̂ for Ax = b, and the residual b − Ax̂ is 10⁻⁸ of b in size. The matrix has ${T.k}. What can you say about how close x̂ is to the true x?`,
    parts: [
      pick('close', 'x̂', [
        ['close', 'it is close: within about κ × 10⁻⁸', 'The error is at most κ times the relative residual. With κ = 2 that is tiny.'],
        ['far', 'it could be off by up to about 1%', 'The bound is κ × 10⁻⁸; with κ = 10⁶ that allows a 1% error even though the equations are nearly satisfied.'],
        ['exact', 'it is exact to about 10⁻⁸ whatever A is', 'The residual measures fit, not accuracy. κ converts one into the other.'],
      ], ($) => ($.k === 'big' ? 'far' : 'close')),
    ],
    level: 1,
    hints: ['‖δx‖/‖x‖ ≤ κ ‖r‖/‖b‖.', 'Multiply the relative residual by κ.'],
    steps: ($) => [$.k === 'big' ? 'κ × 10⁻⁸ = 10⁻²: up to 1% off.' : 'κ × 10⁻⁸ = 2 × 10⁻⁸: close.'],
    sim: {
      scenario: 'well',
      setup(s, $) {
        if ($.k === 'big') s.leps = -3;
      },
      read: (c) => ({ close: c.relX / c.relR > 100 ? 'far' : 'close' }),
    },
    cases: [kase('a large κ', { k: 'big' }, { close: 'far' })],
  }),
];

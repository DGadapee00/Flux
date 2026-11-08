/**
 * Unit 1 coaching: traps (the wrong value a named mistake gives) and their fixes, per template.
 * Folded into the bank by src/problems/index.js.
 */
import { AREA, NULL_DIR, projCoef } from '../bank/u1.js';
import { bigEig } from '../bank/u1.js';
import { lsSlope } from '../bank/u1.js';

export default {
  'u1.12.coefficients': {
    traps: {
      x: [
        [($) => projCoef($, 'own'), 'That is the shadow on one arrow alone, b·a/a·a. The arrows are not perpendicular, so solve the normal equations together.'],
        [($) => projCoef($, 'other'), 'That is the other coefficient. x̂₁ multiplies a₁ = (1, 0, 0) and x̂₂ multiplies a₂ = (1, 1, 0).'],
      ],
    },
  },
  'u1.1.matrix-area': {
    traps: {
      area: [
        [($) => Math.abs($.a * $.d + $.b * $.c) * AREA[$.shape], 'The determinant subtracts: ad − bc.'],
        [($) => ($.shape === 'two' ? Math.abs($.a * $.d - $.b * $.c) : Math.abs($.a * $.d)), ($) => ($.shape === 'two' ? 'That is the unit square’s image. A square of side 2 has area 4, so multiply by 4.' : 'Include the off-diagonal product: det A = ad − bc.')],
      ],
    },
  },
  'u1.2.product': {
    traps: {
      x: [
        [($) => ($.order === 'after' ? $.b : -$.c), 'Those are the other order. RA applies A first; AR applies R first.'],
        [($) => $.a, 'That is where A alone sends (1, 0). Apply the quarter turn too.'],
      ],
    },
  },
  'u1.4.elimination': {
    traps: {
      m: [
        [($) => ($.order === 'pivot' ? -3 / 2 : 2 / -3), 'Divide the row’s leading entry by the pivot, not the pivot by it.'],
        [($) => ($.order === 'pivot' ? -2 / 3 * -1 : 3 / 2), 'Mind the sign: the multiplier is the leading entry over the pivot, with both signs.'],
      ],
    },
  },
  'u1.6.inverse': {
    traps: {
      entry: [
        [($) => ({ tl: $.d, tr: -$.b, bl: -$.c }[$.entry]), 'Divide by the determinant, ad − bc.'],
        [($) => ({ tl: $.a, tr: $.b, bl: $.c }[$.entry]) / ($.a * $.d - $.b * $.c), 'Swap the diagonal entries and negate the off-diagonal ones before dividing.'],
      ],
    },
  },
  'u1.8.rank': {
    traps: {
      rank: [[() => 3, 'Three equations need not give three pivots: row 3 is r₁ + r₂ on the left.']],
      nullity: [[() => 0, 'With only two pivots one unknown is free: rank + dim N(A) = 3.']],
    },
  },
  'u1.9.nearly': {
    traps: {
      v: [
        [() => 1, 'That is the solution with no shift. The shift δ moves it along the line, by δ/(2.5ε).'],
        [($) => 1 + ($.delta / 2.5) * NULL_DIR[$.ask], 'The step along the line is δ/(2.5ε): divide by the tilt too.'],
      ],
    },
  },
  'u1.10.eigen': {
    traps: {
      lambda: [
        [($) => $.a, 'The diagonal holds the eigenvalues only for a triangular matrix. Solve λ² − (tr A)λ + det A = 0.'],
        [($) => 2 * $.a, 'That is the trace: the sum of the two eigenvalues, not one of them.'],
      ],
    },
  },
  'u1.13.nudge': {
    traps: {
      v: [
        [($) => $.delta, 'The answer does not move by the size of the nudge: subtracting the equations gives εy = δ, so y = δ/ε.'],
        [($) => $.delta * Number($.eps), 'Divide by ε, not multiply: the smaller ε, the further the crossing moves.'],
      ],
    },
  },
  'u1.15.eigen-sym': {
    traps: {
      l: [
        [($) => bigEig($, 'drop'), 'Keep ((a − c)/2)² under the root: λ = (a + c)/2 + √(((a − c)/2)² + b²).'],
        [($) => bigEig($, 'small'), 'That is the smaller eigenvalue: take the + sign for the larger.'],
      ],
    },
  },
  'u1.17.ls-line': {
    traps: {
      m: [
        [($) => lsSlope($, 'ends'), 'That is the line through the first and last points. Least squares uses all four.'],
        [($) => lsSlope($, 'origin'), 'That forces the line through the origin. Fit the intercept too: centre x and y on their means.'],
      ],
    },
  },
};

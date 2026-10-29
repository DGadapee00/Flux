/**
 * Beam deflection by discontinuity functions, and fixed-end beams by superposition. y is up, sagging
 * M positive, EI y'' = M, as in elastic.js. Pure, SI. macaulay-selftest.js checks each result by
 * integrating the moment numerically and by superposing single-load cases.
 */

/** ⟨x − a⟩ⁿ: zero before a, (x − a)ⁿ after. ⟨x − a⟩⁰ is the unit step. */
export const bracket = (x, a, n) => (x < a ? 0 : n === 0 ? 1 : (x - a) ** n);

/**
 * A simple span (pin at 0, roller at L) with point loads { a, P } down, uniform loads { a, b, w }
 * down, and couples { a, M0 } counterclockwise. One moment expression holds along the whole beam:
 *   M = R_A x − Σ P⟨x−a⟩ − Σ (w/2)(⟨x−a⟩² − ⟨x−b⟩²) − Σ M0⟨x−a⟩⁰
 * Integrate twice, bracket by bracket. y(0) = 0 removes the second constant; y(L) = 0 fixes C1.
 */
export function simpleMacaulay({ L, EI, points = [], udl = [], couples = [] }) {
  const W = udl.reduce((s, u) => s + u.w * (u.b - u.a), 0);
  const P = points.reduce((s, p) => s + p.P, 0);
  const RB = (points.reduce((s, p) => s + p.P * p.a, 0)
    + udl.reduce((s, u) => s + (u.w * (u.b * u.b - u.a * u.a)) / 2, 0)
    - couples.reduce((s, c) => s + c.M0, 0)) / L;
  const RA = P + W - RB;
  const M = (x) => RA * x
    - points.reduce((s, p) => s + p.P * bracket(x, p.a, 1), 0)
    - udl.reduce((s, u) => s + (u.w / 2) * (bracket(x, u.a, 2) - bracket(x, u.b, 2)), 0)
    - couples.reduce((s, c) => s + c.M0 * bracket(x, c.a, 0), 0);
  const EIslope0 = (x) => RA * x * x / 2
    - points.reduce((s, p) => s + (p.P / 2) * bracket(x, p.a, 2), 0)
    - udl.reduce((s, u) => s + (u.w / 6) * (bracket(x, u.a, 3) - bracket(x, u.b, 3)), 0)
    - couples.reduce((s, c) => s + c.M0 * bracket(x, c.a, 1), 0);
  const EIy0 = (x) => RA * x ** 3 / 6
    - points.reduce((s, p) => s + (p.P / 6) * bracket(x, p.a, 3), 0)
    - udl.reduce((s, u) => s + (u.w / 24) * (bracket(x, u.a, 4) - bracket(x, u.b, 4)), 0)
    - couples.reduce((s, c) => s + (c.M0 / 2) * bracket(x, c.a, 2), 0);
  const C1 = -EIy0(L) / L;
  return {
    RA, RB, C1, M,
    y: (x) => (EIy0(x) + C1 * x) / EI,
    slope: (x) => (EIslope0(x) + C1) / EI,
  };
}

/**
 * Both ends fixed, uniform load. Release the end moments: a simple span turns each end by
 * wL³/24EI. Equal hogging end moments M_e turn each end back by M_e L/2EI. Fixed ends do not turn,
 * so M_e = wL²/12. Midspan then carries wL²/8 − wL²/12 = wL²/24, and drops
 * 5wL⁴/384EI − M_e L²/8EI = wL⁴/384EI.
 */
export function fixedUniform(w, L, EI) {
  const Me = (w * L * L) / 12;
  return { Me, Mmid: (w * L * L) / 24, drop: (w * L ** 4) / (384 * EI), simpleDrop: (5 * w * L ** 4) / (384 * EI) };
}

/**
 * Both ends fixed, P at midspan. A simple span turns each end by PL²/16EI; the end moments turn
 * them back by M_e L/2EI, so M_e = PL/8. Midspan carries PL/4 − PL/8 = PL/8 and drops
 * PL³/48EI − M_e L²/8EI = PL³/192EI.
 */
export function fixedPoint(P, L, EI) {
  const Me = (P * L) / 8;
  return { Me, Mmid: (P * L) / 8, drop: (P * L ** 3) / (192 * EI), simpleDrop: (P * L ** 3) / (48 * EI) };
}

/**
 * Both ends fixed, P down at a from the left (b = L − a). Release the ends: a simple span turns
 * them by Pab(L + b)/6LEI and Pab(L + a)/6LEI. End moments M_A, M_B turn them back by
 * (2M_A + M_B)L/6EI and (M_A + 2M_B)L/6EI. Setting both turns to zero gives the hogging end
 * moments M_A = Pab²/L², M_B = Pa²b/L², and the reactions R_A = Pb²(3a + b)/L³. Under the load
 * the moment sags 2Pa²b²/L³. The drop for x ≤ a is Pb²x²(3aL − 3ax − bx)/(6EIL³); the far side
 * by symmetry. Returns drops positive down.
 */
export function fixedPointAt(P, L, a, EI) {
  const b = L - a;
  const MA = (P * a * b * b) / (L * L);
  const MB = (P * a * a * b) / (L * L);
  const RA = (P * b * b * (3 * a + b)) / L ** 3;
  const RB = P - RA;
  const drop = (x) => (x <= a
    ? (P * b * b * x * x * (3 * a * L - 3 * a * x - b * x)) / (6 * EI * L ** 3)
    : (P * a * a * (L - x) ** 2 * (3 * b * L - 3 * b * (L - x) - a * (L - x))) / (6 * EI * L ** 3));
  const M = (x) => -MA + RA * x - (x > a ? P * (x - a) : 0);
  return { MA, MB, RA, RB, Mload: (2 * P * a * a * b * b) / L ** 3, M, drop };
}

/**
 * Conditioning of a 2×2 system, solved by LU with partial pivoting (EGN 3203).
 *
 * The lines x + y = 2 and x + (1 + ε)y = 2 + δ cross at y = δ/ε, x = 2 − δ/ε. With δ = 0 they cross
 * at (2, 0). As ε shrinks the lines turn parallel, and a small nudge δ to the right-hand side moves
 * the crossing by about δ/ε. Yet the old answer (2, 0), put into the nudged system, misses by only
 * δ: a tiny residual, a large error. The condition number κ(A) = ‖A‖‖A⁻¹‖ bounds the amplification,
 *   ‖δx‖/‖x‖ ≤ κ(A) ‖δb‖/‖b‖,
 * and κ grows like 4/ε here. 2-norms throughout: ‖A‖ is the largest singular value.
 *
 * The closed form solves by PA = LU (pivot on the larger entry in the column, then forward and back
 * substitution). The second method is Cramer's rule, with the determinant written out.
 */

/** PA = LU for a 2×2 with partial pivoting. */
export function lu2(A) {
  const swap = Math.abs(A[1][0]) > Math.abs(A[0][0]);
  const P = swap ? [[0, 1], [1, 0]] : [[1, 0], [0, 1]];
  const PA = swap ? [A[1], A[0]] : [A[0], A[1]];
  const l = PA[1][0] / PA[0][0];
  const L = [[1, 0], [l, 1]];
  const U = [[PA[0][0], PA[0][1]], [0, PA[1][1] - l * PA[0][1]]];
  return { P, L, U, swap };
}

export function solveLU(A, b) {
  const { P, L, U } = lu2(A);
  const pb = [P[0][0] * b[0] + P[0][1] * b[1], P[1][0] * b[0] + P[1][1] * b[1]];
  const y0 = pb[0];
  const y1 = pb[1] - L[1][0] * y0;
  const x1 = y1 / U[1][1];
  const x0 = (y0 - U[0][1] * x1) / U[0][0];
  return [x0, x1];
}

export function solveCramer(A, b) {
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  return [(b[0] * A[1][1] - A[0][1] * b[1]) / det, (A[0][0] * b[1] - b[0] * A[1][0]) / det];
}

/** Singular values of a 2×2, from the eigenvalues of AᵀA. */
export function singular2(A) {
  const [[a, b], [c, d]] = A;
  const p = a * a + c * c;
  const q = a * b + c * d;
  const r = b * b + d * d;
  const mean = (p + r) / 2;
  const rad = Math.sqrt(((p - r) / 2) ** 2 + q * q);
  return [Math.sqrt(mean + rad), Math.sqrt(Math.max(mean - rad, 0))];
}

const norm = (v) => Math.hypot(v[0], v[1]);

export function conditioning({ eps, delta }) {
  const A = [[1, 1], [1, 1 + eps]];
  const b0 = [2, 2];
  const b = [2, 2 + delta];
  const x0 = solveLU(A, b0);
  const x = solveLU(A, b);
  const xc = solveCramer(A, b);
  const [s1, s2] = singular2(A);
  const kappa = s1 / s2;
  // The old answer in the nudged system.
  const r = [b[0] - (A[0][0] * x0[0] + A[0][1] * x0[1]), b[1] - (A[1][0] * x0[0] + A[1][1] * x0[1])];
  const relB = norm([0, delta]) / norm(b0);
  const relX = norm([x[0] - x0[0], x[1] - x0[1]]) / norm(x0);
  const relR = norm(r) / norm(b);
  return {
    A, b, x0, x, xc, kappa, s1, s2,
    lu: lu2(A),
    residual: r,
    relB, relX, relR,
    bound: kappa * relB,
    amplification: relX / relB,
    angleDeg: (Math.abs(Math.atan(-1) - Math.atan(-1 / (1 + eps))) * 180) / Math.PI,
    gap: norm([x[0] - xc[0], x[1] - xc[1]]) / Math.max(norm(x), 1e-12),
  };
}

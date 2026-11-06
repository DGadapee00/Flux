/**
 * Joints and mounts: a preloaded bolted joint, and a part held by point contacts. Our own derivations.
 *
 * Bolted joint. The bolt (stiffness k_b) and the clamped members (k_m) act as two springs in parallel
 * between the same two faces. Tightening stretches the bolt and squeezes the members by the preload
 * F_i. An external pull P that separates the faces by δ adds k_b δ to the bolt and takes k_m δ off the
 * members, so while the members stay in contact the bolt sees F_i + C P with C = k_b/(k_b + k_m), and
 * the members F_i − (1 − C) P. They separate at P = F_i/(1 − C); past that the bolt carries all of P.
 * The second method solves the spring network for δ by bisection, with the members unable to pull.
 *
 * Point contacts. A part in the plane has three freedoms, (x, y, θ). A contact at r with inward
 * normal n blocks motion into it: to first order the gap changes by n·d + θ (r × n), so each contact
 * is a row [n_x, n_y, r_x n_y − r_y n_x] of a constraint matrix J. Its rank is the number of freedoms
 * constrained; 3 − rank are free; contacts beyond the rank are redundant and fight each other when a
 * part or a pin is off size. The rank is found by elimination and again by the largest non-zero minor.
 */

/** The joint by the stiffness-share formula. Forces in any one unit (kN in the lab). */
export function boltedJoint({ Fi, P, ratio }) {
  const C = 1 / (1 + ratio);
  const Psep = Fi / (1 - C);
  if (P < Psep) return { C, Psep, Fb: Fi + C * P, Fm: Fi - (1 - C) * P, separated: false };
  return { C, Psep, Fb: P, Fm: 0, separated: true };
}

/** The same joint as a spring network, solved for the faces' separation δ by bisection. kb = 1. */
export function boltedJointNetwork({ Fi, P, ratio }) {
  const kb = 1;
  const km = ratio * kb;
  // Preload: bolt stretched by Fi/kb, members squeezed by Fi/km. δ opens the faces.
  const bolt = (d) => Fi + kb * d;
  const members = (d) => Math.max(0, Fi - km * d);
  const residual = (d) => bolt(d) - members(d) - P;
  let lo = -Fi / kb;
  let hi = (P + Fi) / kb + 1;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (residual(m) > 0) hi = m;
    else lo = m;
  }
  const d = (lo + hi) / 2;
  return { delta: d, Fb: bolt(d), Fm: members(d) };
}

/** Constraint matrix rows for contacts [{ x, y, nx, ny }] about the origin. */
export const constraintRows = (contacts) => contacts.map((c) => [c.nx, c.ny, c.x * c.ny - c.y * c.nx]);

/** Rank by Gaussian elimination with partial pivoting. */
export function rankByElimination(rows, tol = 1e-9) {
  const A = rows.map((r) => [...r]);
  const m = A.length;
  const n = m ? A[0].length : 0;
  let rank = 0;
  for (let col = 0; col < n && rank < m; col++) {
    let p = rank;
    for (let i = rank + 1; i < m; i++) if (Math.abs(A[i][col]) > Math.abs(A[p][col])) p = i;
    if (Math.abs(A[p][col]) < tol) continue;
    [A[rank], A[p]] = [A[p], A[rank]];
    for (let i = rank + 1; i < m; i++) {
      const f = A[i][col] / A[rank][col];
      for (let j = col; j < n; j++) A[i][j] -= f * A[rank][j];
    }
    rank++;
  }
  return rank;
}

const det = (M) => {
  if (M.length === 1) return M[0][0];
  if (M.length === 2) return M[0][0] * M[1][1] - M[0][1] * M[1][0];
  return M[0].reduce((s, a, j) => s + (j % 2 ? -1 : 1) * a * det(M.slice(1).map((r) => r.filter((_, k) => k !== j))), 0);
};
const combos = (n, k, start = 0) => (k === 0 ? [[]] : Array.from({ length: n - start }, (_, i) => start + i).flatMap((i) => combos(n, k - 1, i + 1).map((c) => [i, ...c])));

/** Rank as the size of the largest non-zero minor (every choice of rows and columns). */
export function rankByMinors(rows, tol = 1e-9) {
  const m = rows.length;
  const n = m ? rows[0].length : 0;
  for (let k = Math.min(m, n); k > 0; k--) {
    for (const ri of combos(m, k)) for (const ci of combos(n, k)) {
      if (Math.abs(det(ri.map((i) => ci.map((j) => rows[i][j])))) > tol) return k;
    }
  }
  return 0;
}

/**
 * Seat a part on its contacts when contact `bad` is off by `err` (positive pushes the part away).
 * The part moves by the least-squares motion d = argmin |J d − e|; the misfits J d − e that remain
 * are interferences (negative) or gaps (positive) the part cannot take up without straining.
 * Closed form: the normal equations solved by Cramer's rule on the 3×3 (or smaller) system.
 */
export function seat(contacts, bad, err) {
  const J = constraintRows(contacts);
  const e = contacts.map((_, i) => (i === bad ? err : 0));
  const rank = rankByElimination(J);
  // Use only the constrained directions: solve in the row space via the normal equations with a tiny
  // ridge so a free direction stays put rather than wandering.
  const N = [0, 1, 2].map((a) => [0, 1, 2].map((b) => J.reduce((s, r) => s + r[a] * r[b], 0) + (a === b ? 1e-12 : 0)));
  const rhs = [0, 1, 2].map((a) => J.reduce((s, r, i) => s + r[a] * e[i], 0));
  const D = det(N);
  const d = [0, 1, 2].map((k) => det(N.map((row, i) => row.map((v, j) => (j === k ? rhs[i] : v)))) / D);
  const misfit = J.map((r, i) => r[0] * d[0] + r[1] * d[1] + r[2] * d[2] - e[i]);
  return { d, misfit, rank };
}

/** The same seating by conjugate gradients on the least-squares problem (CGLS), from rest. */
export function seatIterative(contacts, bad, err, steps = 60) {
  const J = constraintRows(contacts);
  const e = contacts.map((_, i) => (i === bad ? err : 0));
  const Jv = (v) => J.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
  const JTv = (v) => [0, 1, 2].map((k) => J.reduce((acc, r, i) => acc + r[k] * v[i], 0));
  const d = [0, 0, 0];
  let r = e.map((x) => x); // residual e − J d
  let s = JTv(r);
  let p = [...s];
  let gamma = s.reduce((a, x) => a + x * x, 0);
  for (let it = 0; it < steps && gamma > 1e-30; it++) {
    const q = Jv(p);
    const alpha = gamma / q.reduce((a, x) => a + x * x, 0);
    for (let k = 0; k < 3; k++) d[k] += alpha * p[k];
    r = r.map((x, i) => x - alpha * q[i]);
    s = JTv(r);
    const g2 = s.reduce((a, x) => a + x * x, 0);
    p = p.map((x, k) => s[k] + (g2 / gamma) * x);
    gamma = g2;
  }
  const misfit = J.map((row, i) => row[0] * d[0] + row[1] * d[1] + row[2] * d[2] - e[i]);
  return { d, misfit };
}

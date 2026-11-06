/**
 * Small linear algebra for the matrix labs. Our own code.
 *
 * Maps: a 2×2 matrix sends the unit square to the parallelogram on its columns, with signed area
 * det A. The product AB applies B first; its columns are A applied to B's columns. The second route
 * for the area is the shoelace formula on the mapped corners, and for the product, mapping B's
 * columns one by one.
 *
 * Elimination: Gaussian elimination recorded one row operation at a time, with or without partial
 * pivoting, then back substitution. The second route is Cramer's rule with cofactor determinants.
 * Every step leaves the solution unchanged, because each row operation is reversible.
 */

export const mul2 = (A, B) => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
export const apply2 = (A, [x, y]) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
export const det2 = (A) => A[0][0] * A[1][1] - A[0][1] * A[1][0];

/** Signed area of a polygon by the shoelace formula. */
export function shoelace(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

/** The product by mapping B's columns through A: column j of AB is A (column j of B). */
export function mulByColumns(A, B) {
  const c0 = apply2(A, [B[0][0], B[1][0]]);
  const c1 = apply2(A, [B[0][1], B[1][1]]);
  return [[c0[0], c1[0]], [c0[1], c1[1]]];
}

export const rotation = (deg) => {
  const t = (deg * Math.PI) / 180;
  return [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];
};
export const shear = (k) => [[1, k], [0, 1]];

/**
 * Gaussian elimination on the augmented matrix [A | b], one operation per recorded step.
 * Each step: { M (the augmented matrix after it), text, kind: 'swap' | 'eliminate' }.
 */
export function eliminate(A, b, { pivot = true } = {}) {
  const n = b.length;
  let M = A.map((row, i) => [...row, b[i]]);
  const steps = [{ M: M.map((r) => [...r]), text: 'the system as given', kind: 'start' }];
  for (let c = 0; c < n - 1; c++) {
    if (pivot) {
      let p = c;
      for (let i = c + 1; i < n; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
      if (p !== c) {
        [M[c], M[p]] = [M[p], M[c]];
        steps.push({ M: M.map((r) => [...r]), text: `swap rows ${c + 1} and ${p + 1}, so the largest entry leads`, kind: 'swap' });
      }
    }
    for (let i = c + 1; i < n; i++) {
      if (M[i][c] === 0) continue;
      const f = M[i][c] / M[c][c];
      M = M.map((r, k) => (k === i ? r.map((v, j) => v - f * M[c][j]) : r));
      steps.push({ M: M.map((r) => [...r]), text: `row ${i + 1} − (${fmtNum(f)}) × row ${c + 1}`, kind: 'eliminate', f });
    }
  }
  return steps;
}

/** Back substitution on an upper-triangular augmented matrix. */
export function backSubstitute(M) {
  const n = M.length;
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

export function detN(A) {
  const n = A.length;
  if (n === 1) return A[0][0];
  if (n === 2) return det2(A);
  return A[0].reduce((s, a, j) => s + (j % 2 ? -1 : 1) * a * detN(A.slice(1).map((r) => r.filter((_, k) => k !== j))), 0);
}

/** Cramer's rule: x_i = det(A with column i replaced by b) / det A. */
export function cramer(A, b) {
  const D = detN(A);
  return A.map((_, i) => detN(A.map((row, r) => row.map((v, j) => (j === i ? b[r] : v)))) / D);
}

/** The solution of the system an elimination step holds: back substitution once it is triangular, else Cramer. */
export function solutionAt(M) {
  const n = M.length;
  const A = M.map((r) => r.slice(0, n));
  const b = M.map((r) => r[n]);
  return cramer(A, b);
}

function fmtNum(v) {
  if (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0)) return v.toExponential(2);
  return String(Number(v.toFixed(4)));
}

/*
 * Inverse and conditioning (the Inverse lab). The 2×2 inverse by the adjugate, checked against
 * Gauss–Jordan elimination. The singular values in closed form, checked by searching the unit circle
 * for the longest and shortest |Au|. The condition number κ = σ₁/σ₂ says how close a matrix is to
 * singular; the determinant does not, because scaling every entry by s scales det by s² and leaves
 * κ alone.
 */

/** Inverse of a 2×2 by the adjugate, (1/det)[[d, −b], [−c, a]]; null when det = 0. */
export function inverse2(A) {
  const D = det2(A);
  if (D === 0) return null;
  return [[A[1][1] / D, -A[0][1] / D], [-A[1][0] / D, A[0][0] / D]];
}

/**
 * Gauss–Jordan elimination with partial pivoting on [A | I]. Returns the inverse (null when a pivot
 * is below tol times the largest entry) and the determinant as the signed product of the pivots.
 */
export function gaussJordan(A, tol = 1e-12) {
  const n = A.length;
  const M = A.map((row, i) => [...row, ...row.map((_, j) => (i === j ? 1 : 0))]);
  const scale = Math.max(...A.flat().map(Math.abs), 1e-300);
  let det = 1;
  let singular = false;
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) <= tol * scale) {
      singular = true;
      det = 0;
      continue;
    }
    if (p !== k) {
      [M[p], M[k]] = [M[k], M[p]];
      det = -det;
    }
    const piv = M[k][k];
    det *= piv;
    for (let j = 0; j < 2 * n; j++) M[k][j] /= piv;
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      const f = M[i][k];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) M[i][j] -= f * M[k][j];
    }
  }
  return { inverse: singular ? null : M.map((r) => r.slice(n)), det };
}

/** Singular values of a 2×2 in closed form: σ₁² + σ₂² = Σ a², σ₁σ₂ = |det A|. */
export function singular2(A) {
  const t = A.flat().reduce((s, v) => s + v * v, 0);
  const d = Math.abs(det2(A));
  const s1 = Math.sqrt((t + Math.sqrt(Math.max(0, t * t - 4 * d * d))) / 2);
  return [s1, s1 > 0 ? d / s1 : 0];
}

/** The longest and shortest |Au| over unit vectors u: scan the half circle, then golden-section search. */
export function stretchRange(A) {
  const len = (th) => Math.hypot(A[0][0] * Math.cos(th) + A[0][1] * Math.sin(th), A[1][0] * Math.cos(th) + A[1][1] * Math.sin(th));
  const refine = (sign) => {
    const N = 720;
    let best = 0;
    for (let i = 1; i < N; i++) if (sign * len((Math.PI * i) / N) > sign * len((Math.PI * best) / N)) best = i;
    let a = (Math.PI * (best - 1)) / N;
    let b = (Math.PI * (best + 1)) / N;
    const g = (Math.sqrt(5) - 1) / 2;
    for (let k = 0; k < 80; k++) {
      const c = b - g * (b - a);
      const d = a + g * (b - a);
      if (sign * len(c) > sign * len(d)) b = d;
      else a = c;
    }
    return len((a + b) / 2);
  };
  return [refine(1), refine(-1)];
}

/*
 * Rank (the Rank lab). The number of pivots elimination finds, checked against the size of the
 * largest non-zero minor. Both use a tolerance relative to the matrix's own scale.
 */

/** Rank by elimination with partial pivoting. */
export function rankByPivots(rows, tol = 1e-10) {
  const M = rows.map((r) => r.slice());
  const m = M.length;
  const n = M[0].length;
  const scale = Math.max(...M.flat().map(Math.abs), 1e-300);
  let r = 0;
  for (let c = 0; c < n && r < m; c++) {
    let p = r;
    for (let i = r + 1; i < m; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
    if (Math.abs(M[p][c]) <= tol * scale) continue;
    [M[p], M[r]] = [M[r], M[p]];
    for (let i = r + 1; i < m; i++) {
      const f = M[i][c] / M[r][c];
      for (let j = c; j < n; j++) M[i][j] -= f * M[r][j];
    }
    r++;
  }
  return r;
}

const choose = (n, k) => (k === 0 ? [[]] : n < k ? [] : [...choose(n - 1, k - 1).map((s) => [...s, n - 1]), ...choose(n - 1, k)]);

/** Rank as the size of the largest minor that is not zero (every choice of k rows and k columns). */
export function rankByMinors(rows, tol = 1e-10) {
  const m = rows.length;
  const n = rows[0].length;
  const scale = Math.max(...rows.flat().map(Math.abs), 1e-300);
  for (let k = Math.min(m, n); k >= 1; k--) {
    for (const R of choose(m, k)) {
      for (const Cs of choose(n, k)) {
        const sub = R.map((i) => Cs.map((j) => rows[i][j]));
        if (Math.abs(detN(sub)) > tol * scale ** k) return k;
      }
    }
  }
  return 0;
}

/** Cross product, for the direction two planes share. */
export const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

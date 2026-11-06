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

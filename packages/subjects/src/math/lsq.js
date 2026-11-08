/**
 * Least squares: polynomials of rising degree fitted to noisy points from a line (EGN 3203).
 *
 * Ten points at x = −1, −7/9, …, 1 come from y = 1 + 0.5x plus fixed noise of size σ. A polynomial of
 * degree d has d + 1 coefficients; with the Vandermonde matrix A (A_ij = x_i^j) the fit minimises
 * ‖Ax − y‖². Householder QR gives it stably: A = QR, then Rx̂ = Qᵀy. As d rises the misses at the
 * points shrink, to zero at d = 9, while the curve swings further from the line between and beyond
 * them: a better fit to the data is not a better model.
 *
 * The second method solves the normal equations AᵀAx̂ = Aᵀy by Cholesky factorisation and compares
 * the fitted values.
 */

export const XS = Array.from({ length: 10 }, (_, i) => -1 + (2 * i) / 9);
/** Fixed noise, scaled by σ: a repeatable draw, mean about zero. */
export const NOISE = [0.62, -0.91, 0.35, 1.18, -0.44, -1.27, 0.83, 0.07, -0.58, 0.21];
export const truth = (x) => 1 + 0.5 * x;
export const data = (sigma) => XS.map((x, i) => truth(x) + sigma * 0.3 * NOISE[i]);

export const vander = (xs, d) => xs.map((x) => Array.from({ length: d + 1 }, (_, j) => x ** j));
export const polyval = (coef, x) => coef.reduceRight((s, c) => s * x + c, 0);

export function qrSolve(A, y) {
  const m = A.length;
  const n = A[0].length;
  const R = A.map((r) => r.slice());
  const b = y.slice();
  for (let k = 0; k < n; k++) {
    let norm = 0;
    for (let i = k; i < m; i++) norm += R[i][k] ** 2;
    norm = Math.sqrt(norm);
    if (norm === 0) continue;
    const alpha = R[k][k] > 0 ? -norm : norm;
    const v = Array(m).fill(0);
    v[k] = R[k][k] - alpha;
    for (let i = k + 1; i < m; i++) v[i] = R[i][k];
    const vv = v.reduce((s, t) => s + t * t, 0);
    if (vv === 0) continue;
    for (let j = k; j < n; j++) {
      let s = 0;
      for (let i = k; i < m; i++) s += v[i] * R[i][j];
      const f = (2 * s) / vv;
      for (let i = k; i < m; i++) R[i][j] -= f * v[i];
    }
    let s = 0;
    for (let i = k; i < m; i++) s += v[i] * b[i];
    const f = (2 * s) / vv;
    for (let i = k; i < m; i++) b[i] -= f * v[i];
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let j = i + 1; j < n; j++) s -= R[i][j] * x[j];
    x[i] = s / R[i][i];
  }
  return x;
}

export function normalSolve(A, y) {
  const n = A[0].length;
  const M = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => A.reduce((s, r) => s + r[i] * r[j], 0)));
  const r = Array.from({ length: n }, (_, i) => A.reduce((s, row, k) => s + row[i] * y[k], 0));
  const L = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = M[i][j];
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
      L[i][j] = i === j ? Math.sqrt(s) : s / L[j][j];
    }
  }
  const z = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let s = r[i];
    for (let k = 0; k < i; k++) s -= L[i][k] * z[k];
    z[i] = s / L[i][i];
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i];
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k];
    x[i] = s / L[i][i];
  }
  return x;
}

const rms = (v) => Math.sqrt(v.reduce((s, t) => s + t * t, 0) / v.length);
const GRID = Array.from({ length: 201 }, (_, i) => -1.1 + (2.2 * i) / 200);

export function fitStats(d, sigma, coef) {
  const ys = data(sigma);
  return {
    miss: rms(XS.map((x, i) => polyval(coef, x) - ys[i])),
    off: rms(GRID.map((x) => polyval(coef, x) - truth(x))),
  };
}

export function fitChecked({ d, sigma }) {
  const ys = data(sigma);
  const A = vander(XS, d);
  const coef = qrSolve(A, ys);
  const coefN = normalSolve(A, ys);
  const st = fitStats(d, sigma, coef);
  const gap = Math.max(...XS.map((x) => Math.abs(polyval(coef, x) - polyval(coefN, x)))) / 2;
  return { coef, ys, ...st, gap, slope: d >= 1 ? coef[1] : 0 };
}

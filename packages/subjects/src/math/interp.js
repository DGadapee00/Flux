/**
 * Polynomial interpolation of Runge's function (EGN 3203).
 *
 * The polynomial of degree n through n + 1 points (x_i, y_i) is unique. In barycentric form,
 *   p(x) = Σ w_i y_i/(x − x_i) / Σ w_i/(x − x_i),   w_i = 1/Π_{j≠i}(x_i − x_j),
 * and the error is f(x) − p(x) = f^{(n+1)}(ξ)/(n + 1)! · Π(x − x_i). For f = 1/(1 + 25x²) on [−1, 1]
 * with equally spaced points, the product Π(x − x_i) is huge near the ends and the derivatives grow
 * fast: the error there grows without bound as n rises. Chebyshev points, x_i = cos(iπ/n), crowd
 * toward the ends, keep the product small, and the error falls.
 *
 * The second method builds Newton's divided differences and evaluates the nested form, and the two
 * polynomials are compared on a fine grid.
 */

export const runge = (x) => 1 / (1 + 25 * x * x);

export function nodes(n, kind) {
  return Array.from({ length: n + 1 }, (_, i) => (kind === 'cheb' ? Math.cos((i * Math.PI) / n) : -1 + (2 * i) / n));
}

export function bary(xs, ys) {
  const w = xs.map((xi, i) => 1 / xs.reduce((p, xj, j) => (j === i ? p : p * (xi - xj)), 1));
  return (x) => {
    let num = 0;
    let den = 0;
    for (let i = 0; i < xs.length; i++) {
      const d = x - xs[i];
      if (d === 0) return ys[i];
      num += (w[i] * ys[i]) / d;
      den += w[i] / d;
    }
    return num / den;
  };
}

export function newton(xs, ys) {
  const n = xs.length;
  const c = ys.slice();
  for (let j = 1; j < n; j++) for (let i = n - 1; i >= j; i--) c[i] = (c[i] - c[i - 1]) / (xs[i] - xs[i - j]);
  return (x) => {
    let s = c[n - 1];
    for (let i = n - 2; i >= 0; i--) s = s * (x - xs[i]) + c[i];
    return s;
  };
}

export const GRID = Array.from({ length: 801 }, (_, i) => -1 + (2 * i) / 800);

export function interpChecked({ n, kind }) {
  const xs = nodes(n, kind);
  const ys = xs.map(runge);
  const p = bary(xs, ys);
  const q = newton(xs, ys);
  let err = 0;
  let at = 0;
  let gap = 0;
  for (const x of GRID) {
    const e = Math.abs(runge(x) - p(x));
    if (e > err) {
      err = e;
      at = x;
    }
    gap = Math.max(gap, Math.abs(p(x) - q(x)));
  }
  return { xs, ys, p, err, at, gap: gap / Math.max(1, err) };
}

export const maxErr = (n, kind) => {
  const xs = nodes(n, kind);
  const p = bary(xs, xs.map(runge));
  return Math.max(...GRID.map((x) => Math.abs(runge(x) - p(x))));
};

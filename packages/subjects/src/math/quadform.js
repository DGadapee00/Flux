/**
 * A symmetric 2×2 matrix and its quadratic form (EGN 3203).
 *
 * For A = [[a, b], [b, c]], q(x) = xᵀAx = ax² + 2bxy + cy². A symmetric matrix has real eigenvalues
 *   λ = (a + c)/2 ± √(((a − c)/2)² + b²)
 * and perpendicular eigenvectors, at angle θ = ½ atan2(2b, a − c) and θ + 90°. In those axes
 * q = λ₁u² + λ₂v², so the level curves are ellipses when both λ are positive (positive definite),
 * hyperbolas when they differ in sign (a saddle). Positive entries do not make A positive definite:
 * [[1, 2], [2, 1]] has eigenvalues 3 and −1.
 *
 * The second method finds the largest and smallest values of the Rayleigh quotient xᵀAx/xᵀx on the
 * unit circle by golden-section search; they are the eigenvalues, reached along the eigenvectors.
 */

export function quadClosed({ a, b, c }) {
  const m = (a + c) / 2;
  const r = Math.hypot((a - c) / 2, b);
  const l1 = m + r;
  const l2 = m - r;
  const theta = 0.5 * Math.atan2(2 * b, a - c);
  const kind = l2 > 1e-12 ? 'positive definite' : l1 < -1e-12 ? 'negative definite' : l1 > 1e-12 && l2 < -1e-12 ? 'indefinite: a saddle' : 'semidefinite';
  return { l1, l2, theta, kind, det: a * c - b * b, trace: a + c };
}

export const rayleigh = ({ a, b, c }, phi) => {
  const x = Math.cos(phi);
  const y = Math.sin(phi);
  return a * x * x + 2 * b * x * y + c * y * y;
};

function golden(f, lo, hi, sign) {
  const g = (Math.sqrt(5) - 1) / 2;
  let x1 = hi - g * (hi - lo);
  let x2 = lo + g * (hi - lo);
  let f1 = sign * f(x1);
  let f2 = sign * f(x2);
  for (let i = 0; i < 100; i++) {
    if (f1 > f2) {
      hi = x2; x2 = x1; f2 = f1; x1 = hi - g * (hi - lo); f1 = sign * f(x1);
    } else {
      lo = x1; x1 = x2; f1 = f2; x2 = lo + g * (hi - lo); f2 = sign * f(x2);
    }
  }
  return (lo + hi) / 2;
}

export function quadNumeric(A) {
  // Coarse scan of [0, π) to bracket the extremes, then golden-section refinement.
  const n = 360;
  let iMax = 0;
  let iMin = 0;
  for (let i = 0; i < n; i++) {
    const v = rayleigh(A, (Math.PI * i) / n);
    if (v > rayleigh(A, (Math.PI * iMax) / n)) iMax = i;
    if (v < rayleigh(A, (Math.PI * iMin) / n)) iMin = i;
  }
  const d = Math.PI / n;
  const pMax = golden((p) => rayleigh(A, p), (Math.PI * iMax) / n - d, (Math.PI * iMax) / n + d, 1);
  const pMin = golden((p) => rayleigh(A, p), (Math.PI * iMin) / n - d, (Math.PI * iMin) / n + d, -1);
  return { l1: rayleigh(A, pMax), l2: rayleigh(A, pMin), pMax, pMin };
}

export function quadChecked(state) {
  const cf = quadClosed(state);
  const nu = quadNumeric(state);
  const scale = Math.max(1, Math.abs(cf.l1), Math.abs(cf.l2));
  return { ...cf, l1Num: nu.l1, l2Num: nu.l2, gap: Math.max(Math.abs(nu.l1 - cf.l1), Math.abs(nu.l2 - cf.l2)) / scale };
}

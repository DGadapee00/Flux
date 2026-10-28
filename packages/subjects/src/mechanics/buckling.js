/**
 * Euler buckling of a straight, elastic, concentric column.
 *
 * The pinned-pinned shape is a half sine, v = sin(πx/L). Then
 * v″ = −(π/L)² v, and EI v″ + P v = 0 gives
 *
 *   P_cr = π² EI / L²
 *
 * Other end conditions use the same formula on the effective length KL.
 * Fixed-free is a quarter sine, the same as a pinned column of length 2L,
 * so K = 2. Fixed-fixed is a half sine in half the length, so K = 1/2.
 * Fixed-pinned solves tan μ = μ. The first root is μ ≈ 4.4934, and
 * K = π/μ ≈ 0.699. A course value of 0.7 is that root, rounded.
 *
 * The pinned check is the smallest eigenvalue of the second-difference
 * matrix for EI v″ + P v = 0, with v = 0 at both ends. Its closed
 * eigenvalue is (4 EI / h²) sin²(π/(2n)), h = L/n. Inverse iteration
 * on that matrix returns the same number. Draw never calls it.
 *
 * A tube in inches uses P = π² E I / (KL)² with E in ksi and I in in⁴,
 * which is already kip. The SI path converts with the exact factors and
 * must agree. g is not in this model.
 */
import { M_PER_IN, N_PER_LBF, PA_PER_PSI } from '../convert.js';

const PI = Math.PI;

/** Second moment of a rectangle, depth `h` perpendicular to the axis. */
export function rectI(b, h) {
  return (b * h ** 3) / 12;
}

/** Area and second moment of a circular tube. `outer` and the wall are diameters' units, the same unit. */
export function tubeSection(outer, wall) {
  const inner = outer - 2 * wall;
  const I = (PI / 64) * (outer ** 4 - inner ** 4);
  const A = (PI / 4) * (outer ** 2 - inner ** 2);
  return { inner, I, A };
}

/** Euler load. K = 1 is pinned-pinned. */
export function eulerLoad(E, I, L, K = 1) {
  const Le = K * L;
  return (PI * PI * E * I) / (Le * Le);
}

/** Radius of gyration √(I/A). */
export function radiusGyration(I, A) {
  return Math.sqrt(I / A);
}

/**
 * First root of tan μ = μ above π, and K = π/μ.
 * The course rounds K to 0.7. This returns the unrounded root.
 */
export function fixedPinnedRoot() {
  let lo = PI + 1e-8;
  let hi = 1.5 * PI - 1e-6;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (Math.tan(mid) > mid) hi = mid;
    else lo = mid;
  }
  const mu = 0.5 * (lo + hi);
  return { mu, K: PI / mu };
}

function solveTri(m, sub, diag, sup, rhs) {
  const cp = new Float64Array(m);
  const dp = new Float64Array(m);
  cp[0] = sup / diag;
  dp[0] = rhs[0] / diag;
  for (let i = 1; i < m; i++) {
    const den = diag - sub * cp[i - 1];
    cp[i] = i === m - 1 ? 0 : sup / den;
    const next = rhs[i] - sub * dp[i - 1];
    dp[i] = next / den;
  }
  const x = new Float64Array(m);
  x[m - 1] = dp[m - 1];
  for (let i = m - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

/**
 * Smallest pinned-pinned finite-difference eigenvalue, in force units.
 * `n` is the number of segments. The ends are not unknowns.
 */
export function pinnedEulerFD(E, I, L, n = 80) {
  const m = n - 1;
  const h = L / n;
  const c = (E * I) / (h * h);
  let y = new Float64Array(m);
  for (let i = 0; i < m; i++) y[i] = 1 + ((i * 17) % 5);
  for (let k = 0; k < 16; k++) {
    y = solveTri(m, -c, 2 * c, -c, y);
    let norm = 0;
    for (let i = 0; i < m; i++) norm += y[i] * y[i];
    norm = Math.sqrt(norm);
    for (let i = 0; i < m; i++) y[i] /= norm;
  }
  let num = 0;
  let den = 0;
  for (let i = 0; i < m; i++) {
    let My = 2 * c * y[i];
    if (i > 0) My -= c * y[i - 1];
    if (i + 1 < m) My -= c * y[i + 1];
    num += y[i] * My;
    den += y[i] * y[i];
  }
  return num / den;
}

/** Closed eigenvalue of the same matrix, (4 EI / h²) sin²(π / (2n)). */
export function pinnedEulerDiscrete(E, I, L, n = 80) {
  const h = L / n;
  return ((4 * E * I) / (h * h)) * Math.sin(PI / (2 * n)) ** 2;
}

/**
 * Rectangle column. `h` is the depth that sets I = b h³/12.
 * `P` is the load the course model uses: Euler, until Euler stress reaches yield.
 */
export function rectColumn(L, b, h, E, sigY, K = 1) {
  const I = rectI(b, h);
  const A = b * h;
  const euler = eulerLoad(E, I, L, K);
  const stress = euler / A;
  const Py = sigY * A;
  const yielded = stress >= sigY;
  const fd = pinnedEulerFD(E, I, K * L);
  const gap = Math.abs(fd - euler) / Math.max(Math.abs(euler), 1e-30);
  return { I, A, euler, stress, Py, yielded, P: Math.min(euler, Py), gap, r: radiusGyration(I, A) };
}

/**
 * Length at which the Euler stress equals yield. Past this, toward shorter
 * columns, the course model stops using Euler.
 */
export function transitionLength(b, h, E, sigY, K = 1) {
  const I = rectI(b, h);
  const A = b * h;
  const r = radiusGyration(I, A);
  return (PI * r * Math.sqrt(E / sigY)) / K;
}

const KIP = 1000 * N_PER_LBF;
const KSI = 1000 * PA_PER_PSI;

/**
 * Circular tube, worked in inches. `eulerKip` never builds pascals.
 * `gap` is that kip load against the SI Euler load.
 */
export function tubeColumn(LIn, outerIn, wallIn, EKsi, FyKsi, K = 1) {
  const { inner, I, A } = tubeSection(outerIn, wallIn);
  const eulerKip = (PI * PI * EKsi * I) / (K * LIn) ** 2;
  const stressKsi = eulerKip / A;
  const Py = FyKsi * A;
  const yielded = stressKsi >= FyKsi;
  const eulerN = eulerLoad(EKsi * KSI, I * M_PER_IN ** 4, LIn * M_PER_IN, K);
  const fromSi = eulerN / KIP;
  const gap = Math.abs(fromSi - eulerKip) / Math.max(Math.abs(eulerKip), 1e-30);
  return { inner, I, A, eulerKip, stressKsi, Py, yielded, P: Math.min(eulerKip, Py), eulerN, gap };
}

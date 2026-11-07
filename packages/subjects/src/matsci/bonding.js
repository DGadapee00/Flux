/**
 * The bond between two atoms as an energy well (EMA 3010 unit 1).
 *
 * Two atoms attract at long range and repel when their electron clouds overlap. A simple model
 * adds a power-law attraction and a steeper power-law repulsion (a Mie potential):
 *
 *   U(r) = −A/rⁿ + B/rᵐ,  m > n.
 *
 * n = 1 is the Coulomb attraction of an ion pair, with A = ke². n = 6, m = 12 is the Lennard-Jones
 * form for the weak forces between closed-shell atoms such as argon.
 *
 * The well is set here by what a student can see: its depth E₀ and bond length r₀. Setting
 * dU/dr = 0 at r₀ and U(r₀) = −E₀ gives
 *
 *   A = E₀ r₀ⁿ m/(m − n),  B = E₀ r₀ᵐ n/(m − n),
 *
 * and the curvature at the bottom, the bond's spring constant, is
 *
 *   k = U″(r₀) = n m E₀ / r₀².
 *
 * So the stiffness carries the shape of the well (n m) as well as its depth: a shallow, narrow well
 * can be stiffer than a deep, wide one. Units: r in ångströms, U in eV, k in eV/Å².
 *
 * The second method (bondNumeric) uses none of these closed forms: the bond length by bisection on
 * the force, the depth by integrating the force from r₀ out to infinity, and the stiffness by a
 * central difference of the force.
 */

/** e²/(4πε₀) in eV·Å: the Coulomb energy of two unit charges 1 Å apart. */
export const KE2 = 14.3996;
/** 1 eV/Å² in N/m. */
export const EV_A2 = 16.0218;

/** The pair potential with depth E0 (eV) at bond length r0 (Å), exponents n < m. */
export function mie({ E0, r0, n, m }) {
  const A = (E0 * r0 ** n * m) / (m - n);
  const B = (E0 * r0 ** m * n) / (m - n);
  const U = (r) => -A / r ** n + B / r ** m;
  // F = −dU/dr: positive pushes the atoms apart, negative pulls them together.
  const F = (r) => -((n * A) / r ** (n + 1) - (m * B) / r ** (m + 1));
  const k = (n * m * E0) / r0 ** 2;
  return { A, B, U, F, k, E0, r0, n, m };
}

/** An ion pair of charges ±e: A = ke², so the depth follows from r0 and m alone. */
export function ionicDepth(r0, m) {
  return (KE2 / r0) * (1 - 1 / m);
}

/**
 * The same three numbers without the closed forms: bisection on F for the bond length, Simpson's
 * rule on F from r₀ to infinity (in u = r₀/r, so the range is finite) for the depth, and a central
 * difference of F for the stiffness.
 */
export function bondNumeric(F, guess) {
  let lo = 0.3 * guess;
  let hi = 4 * guess;
  for (let i = 0; i < 200 && hi - lo > 1e-15 * guess; i++) {
    const mid = 0.5 * (lo + hi);
    if (F(mid) > 0) lo = mid;
    else hi = mid;
  }
  const r0 = 0.5 * (lo + hi);
  // Work to pull the atoms apart = −∫ F dr from r0 to ∞; with r = r0/u, dr = −r0/u² du.
  const N = 4000;
  // At u = 0 (r at infinity) the integrand has a finite limit; take it just inside.
  const g = (u) => {
    const v = Math.max(u, 1e-9);
    return -F(r0 / v) * (r0 / (v * v));
  };
  let s = g(0) + g(1);
  for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * g(i / N);
  const depth = s / (3 * N);
  const h = 1e-4 * r0;
  const k = -(F(r0 + h) - F(r0 - h)) / (2 * h);
  return { r0, depth, k };
}

/** Everything the lab shows for a well and a separation r (Å), with the numeric check's gap. */
export function bond({ E0, r0, n, m, r }) {
  const w = mie({ E0, r0, n, m });
  const num = bondNumeric(w.F, r0);
  const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
  const gap = Math.max(rel(num.r0, r0), rel(num.depth, E0), rel(num.k, w.k));
  const kN = w.k * EV_A2;
  return {
    ...w,
    r,
    Ur: w.U(r),
    Fr: w.F(r),
    kN,
    numeric: num,
    gap,
  };
}

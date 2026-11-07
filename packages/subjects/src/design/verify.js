/**
 * Verifying a cantilever bracket: margins by analysis, and by a test that sees the real mount.
 * Our own derivations.
 *
 * The bracket is a rectangular arm, b wide, h thick and L long, with a load P at its tip. Analysis
 * takes the root as rigid: the root stress is 6PL/(bh²) and the tip deflection PL³/(3EI). A real
 * mount turns a little under the root moment PL, by PL/k_θ, which adds PL²/k_θ at the tip. A test
 * measures that; the analysis cannot. Margins of safety are MS = allowable/(FS × applied) − 1 for
 * strength and limit/deflection − 1 for stiffness.
 *
 * The second method integrates the curvature M/EI along the arm twice by Simpson's rule, starting
 * from the root's rotation, and finds the load that first yields the root by bisection.
 */

/** 6061-T6 aluminium: Young's modulus and minimum yield strength (Wikipedia, 6061 aluminium alloy). */
export const AL6061 = Object.freeze({ E: 68e3, yieldMin: 241, yieldTypical: 270 }); // MPa

/** Closed forms. Lengths in mm, force in N, stress in MPa, kθ in N·mm/rad. */
export function bracketClosed({ P, L, b, h, FS, limit, ktheta, E = AL6061.E, sy = AL6061.yieldMin }) {
  const I = (b * h ** 3) / 12;
  const stress = (6 * P * L) / (b * h * h);
  const tipRigid = (P * L ** 3) / (3 * E * I);
  const tipTest = tipRigid + (Number.isFinite(ktheta) ? (P * L * L) / ktheta : 0);
  return {
    I,
    stress,
    tipRigid,
    tipTest,
    msStrength: sy / (FS * stress) - 1,
    msDeflAnalysis: limit / tipRigid - 1,
    msDeflTest: limit / tipTest - 1,
    pYield: (sy * b * h * h) / (6 * L),
  };
}

/** Second method: tip deflection by integrating curvature twice, and the yield load by bisection. */
export function bracketNumeric({ P, L, b, h, ktheta, E = AL6061.E, sy = AL6061.yieldMin }, n = 400) {
  const I = (b * h ** 3) / 12;
  const m = n % 2 ? n + 1 : n;
  const dx = L / m;
  const kappa = (x) => (P * (L - x)) / (E * I);
  // Slope θ(x) = θ₀ + ∫κ, by Simpson on each pair of steps (exact for this linear κ), then w = ∫θ.
  const theta0 = Number.isFinite(ktheta) ? (P * L) / ktheta : 0;
  const theta = [theta0];
  for (let i = 1; i <= m; i++) {
    const a = (i - 1) * dx;
    theta.push(theta[i - 1] + (dx / 6) * (kappa(a) + 4 * kappa(a + dx / 2) + kappa(a + dx)));
  }
  let w = 0;
  for (let i = 0; i <= m; i++) w += (i === 0 || i === m ? 1 : i % 2 ? 4 : 2) * theta[i];
  const tip = (w * dx) / 3;
  const rootStress = (p) => ((p * L) * (h / 2)) / I;
  let lo = 0;
  let hi = 1;
  while (rootStress(hi) < sy) hi *= 2;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (rootStress(mid) < sy) lo = mid;
    else hi = mid;
  }
  return { tip, pYield: (lo + hi) / 2 };
}

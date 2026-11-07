/**
 * Dimensional analysis and model testing (EML 3015).
 *
 * A ship's drag depends on its speed V, length L, the water's density ρ and viscosity μ, and
 * gravity g, which makes the waves. Five variables in three base dimensions (M, L, T) give
 * 5 − 3 = 2 independent groups besides the drag coefficient: the Reynolds number Re = VL/ν and
 * the Froude number Fr = V/√(gL). A model at scale λ = L_m/L_p behaves like the ship only if both
 * match.
 *
 * Free surface (a ship): waves dominate, so match Fr: V_m = V_p √λ. Then
 *   Re_m/Re_p = λ^{3/2} ν_p/ν_m,
 * and matching Re too needs ν_m = ν_p λ^{3/2}: about a hundred times below water's for λ = 1/25.
 * No liquid is that thin, so ship tanks match Fr and correct for Re.
 * Submerged (a submarine deep down, no waves): match Re alone, V_m = V_p (ν_m/ν_p)/λ.
 *
 * The second method finds the same speed and viscosity by bisection on the groups themselves, and
 * counts the groups as n minus the rank of the dimension matrix.
 */
import { rankByPivots } from '../math/linalg.js';

export const G = 9.81;

/** Exponents of M, L, T for ρ, V, L, μ, g: the dimension matrix (columns are variables). */
export const DIMENSIONS = [
  [1, 0, 0, 1, 0], // M
  [-3, 1, 1, -1, 1], // L
  [0, -1, 0, -1, -2], // T
];

/** Number of independent dimensionless groups, n − rank, by elimination. */
export const groupCount = () => DIMENSIONS[0].length - rankByPivots(DIMENSIONS);

const bisect = (f, lo, hi) => {
  // On a log scale, for positive quantities spanning decades. f increases with x.
  let a = Math.log(lo);
  let b = Math.log(hi);
  for (let i = 0; i < 200; i++) {
    const m = 0.5 * (a + b);
    if (f(Math.exp(m)) > 0) b = m;
    else a = m;
  }
  return Math.exp(0.5 * (a + b));
};

/**
 * mode 'surface' (match Fr) or 'submerged' (match Re). Lp (m), Vp (m/s), lambda = Lm/Lp,
 * nuP and nuM in m²/s.
 */
export function modelTest({ mode = 'surface', Lp, Vp, lambda, nuP, nuM }) {
  const Lm = lambda * Lp;
  const FrP = Vp / Math.sqrt(G * Lp);
  const ReP = (Vp * Lp) / nuP;
  const Vm = mode === 'submerged' ? (Vp * nuM) / (nuP * lambda) : Vp * Math.sqrt(lambda);
  const FrM = Vm / Math.sqrt(G * Lm);
  const ReM = (Vm * Lm) / nuM;
  const nuNeeded = nuP * lambda ** 1.5;
  // Second method: bisection on the groups, and the group count from the dimension matrix.
  const VmNum = mode === 'submerged' ? bisect((v) => (v * Lm) / nuM - ReP, 1e-6, 1e8) : bisect((v) => v / Math.sqrt(G * Lm) - FrP, 1e-6, 1e8);
  const nuNum = bisect((nu) => -(((Vp * Math.sqrt(lambda) * Lm) / nu) - ReP), 1e-14, 1);
  const groups = groupCount();
  const gap = Math.max(Math.abs(VmNum - Vm) / Vm, Math.abs(nuNum - nuNeeded) / nuNeeded, Math.abs(groups - 2));
  return { mode, Lm, Vm, FrP, FrM, ReP, ReM, reRatio: ReM / ReP, frRatio: FrM / FrP, nuNeeded, groups, gap };
}

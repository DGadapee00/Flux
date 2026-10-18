/**
 * One-dimensional isentropic flow of a calorically perfect gas (constant γ), as tabulated in
 * NACA Report 1135 (1953). M is the Mach number. Ratios are static over stagnation, and A/A* is the
 * area over the sonic (throat) area.
 *
 *   T/T₀ = 1 / (1 + (γ−1)/2 · M²)
 *   p/p₀ = (T/T₀)^(γ/(γ−1))        ρ/ρ₀ = (T/T₀)^(1/(γ−1))
 *   A/A* = (1/M) · [(2/(γ+1)) · (1 + (γ−1)/2 · M²)]^((γ+1)/(2(γ−1)))
 *
 * Each A/A* above 1 has two Mach numbers, one subsonic and one supersonic. machFromArea takes the
 * branch.
 */

function check(M, gamma) {
  if (!(gamma > 1)) throw new RangeError(`γ must be above 1; got ${gamma}`);
  if (!(M >= 0)) throw new RangeError(`the Mach number must be zero or more; got ${M}`);
}

export function temperatureRatio(M, gamma = 1.4) {
  check(M, gamma);
  return 1 / (1 + ((gamma - 1) / 2) * M * M);
}

export function pressureRatio(M, gamma = 1.4) {
  return temperatureRatio(M, gamma) ** (gamma / (gamma - 1));
}

export function densityRatio(M, gamma = 1.4) {
  return temperatureRatio(M, gamma) ** (1 / (gamma - 1));
}

export function areaRatio(M, gamma = 1.4) {
  check(M, gamma);
  if (M === 0) return Infinity;
  const e = (gamma + 1) / (2 * (gamma - 1));
  return (1 / M) * ((2 / (gamma + 1)) * (1 + ((gamma - 1) / 2) * M * M)) ** e;
}

/** The Mach number with area ratio A/A* on the given branch: 'subsonic' or 'supersonic'. */
export function machFromArea(ratio, branch, gamma = 1.4) {
  if (!(ratio >= 1)) throw new RangeError(`A/A* is at least 1; got ${ratio}`);
  if (branch !== 'subsonic' && branch !== 'supersonic') throw new TypeError(`branch is 'subsonic' or 'supersonic', not ${branch}`);
  if (ratio === 1) return 1;
  // A/A* falls from ∞ to 1 on (0, 1] and rises from 1 on [1, ∞).
  let lo = branch === 'subsonic' ? 1e-12 : 1;
  let hi = branch === 'subsonic' ? 1 : 2;
  if (branch === 'supersonic') while (areaRatio(hi, gamma) < ratio) hi *= 2;
  for (let i = 0; i < 200 && hi - lo > 1e-14 * hi; i++) {
    const mid = (lo + hi) / 2;
    const above = areaRatio(mid, gamma) > ratio;
    if (branch === 'subsonic' ? above : !above) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Choked mass flux through the throat, kg/(s·m²), from the stagnation state:
 * ṁ/A* = p₀ √(γ/(R T₀)) · (2/(γ+1))^((γ+1)/(2(γ−1))). p₀ in Pa, T₀ in K, R in J/(kg·K).
 */
export function chokedMassFlux(p0, T0, R, gamma = 1.4) {
  return p0 * Math.sqrt(gamma / (R * T0)) * (2 / (gamma + 1)) ** ((gamma + 1) / (2 * (gamma - 1)));
}

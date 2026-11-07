/**
 * A converging–diverging nozzle fed from a reservoir and discharging against a back pressure
 * (EML 3101, compressible flow and normal shocks). Air as a perfect gas, γ = 1.4.
 *
 * The area runs from the inlet A_i down to the throat A_t at x = x_t and out to the exit A_e at x = 1.
 * As the back pressure p_b falls from p₀:
 *   1. Subsonic all the way. The exit Mach number follows from p_b/p₀ by the isentropic relation,
 *      and the flow never reaches Mach 1: A* is smaller than the throat. ṁ rises as p_b falls.
 *   2. Once p_b reaches p₁ (the subsonic isentropic exit pressure with a sonic throat) the throat is
 *      sonic and the flow is choked: ṁ = A_t p₀ √(γ/RT₀) (2/(γ+1))^((γ+1)/(2(γ−1))), whatever p_b does.
 *   3. Between p₁ and p₂ a normal shock stands in the diverging part. It drops the flow to subsonic,
 *      raises the pressure and cuts the stagnation pressure, so the subsonic flow behind it can meet
 *      p_b. Lower p_b and the shock moves downstream, reaching the exit at p_b = p₂.
 *   4. Below p₂ the nozzle runs supersonic to its exit. The jet is over-expanded, matched at the
 *      design pressure, or under-expanded, and adjusts outside the nozzle.
 *
 * Normal shock, from M₁ to M₂:
 *   M₂² = (1 + (γ−1)M₁²/2) / (γM₁² − (γ−1)/2),   p₂/p₁ = 1 + 2γ(M₁² − 1)/(γ+1),
 *   p₀₂/p₀₁ = [((γ+1)M₁²/2)/(1 + (γ−1)M₁²/2)]^(γ/(γ−1)) · [2γM₁²/(γ+1) − (γ−1)/(γ+1)]^(−1/(γ−1)).
 *
 * Second method: the stagnation-pressure ratio across the shock is found again as
 * (p₂/p₁)(p₀₂/p₂)/(p₀₁/p₁) from the static jump and the isentropic ratios on each side; and the mass
 * flow is recomputed as ρVA from the local static state at every station, which must equal the
 * closed form everywhere in the nozzle.
 */
import { areaRatio, machFromArea, pressureRatio, temperatureRatio } from './isentropic.js';

export const GAMMA = 1.4;
export const R_AIR = 287;
export const NOZZLE = { Ai: 2.5, At: 1, Ae: 2, xt: 0.4 };
const g = GAMMA;

/** Nozzle area at x in [0, 1], in units of the throat area: two parabolas meeting at the throat. */
export function area(x, { Ai, At, Ae, xt } = NOZZLE) {
  return x <= xt ? At + (Ai - At) * ((xt - x) / xt) ** 2 : At + (Ae - At) * ((x - xt) / (1 - xt)) ** 2;
}

export function shockMach(M1) {
  return Math.sqrt((1 + ((g - 1) / 2) * M1 * M1) / (g * M1 * M1 - (g - 1) / 2));
}
export const shockPressure = (M1) => 1 + ((2 * g) / (g + 1)) * (M1 * M1 - 1);
export function shockStagnation(M1) {
  const a = (((g + 1) / 2) * M1 * M1) / (1 + ((g - 1) / 2) * M1 * M1);
  const b = ((2 * g) / (g + 1)) * M1 * M1 - (g - 1) / (g + 1);
  return a ** (g / (g - 1)) * b ** (-1 / (g - 1));
}
/** The same ratio by another route: the static jump, then the isentropic ratios each side. */
export const shockStagnationByParts = (M1) => (shockPressure(M1) * pressureRatio(M1, g)) / pressureRatio(shockMach(M1), g);

/** Mach number from p/p₀ on an isentropic path. */
const machFromPressure = (r) => Math.sqrt((2 / (g - 1)) * (r ** (-(g - 1) / g) - 1));

/** The pressures that separate the regimes, as fractions of p₀. */
export function criticalPressures(nz = NOZZLE) {
  const r = nz.Ae / nz.At;
  const Msub = machFromArea(r, 'subsonic', g);
  const Msup = machFromArea(r, 'supersonic', g);
  const pDesign = pressureRatio(Msup, g);
  return { p1: pressureRatio(Msub, g), p2: pDesign * shockPressure(Msup), pDesign, Msub, Msup };
}

/** Exit pressure over p₀ with a normal shock at area ratio As (in throat areas), downstream of the throat. */
function exitPressureWithShock(As, nz) {
  const M1 = machFromArea(As / nz.At, 'supersonic', g);
  const p0ratio = shockStagnation(M1);
  const Astar2 = nz.At / p0ratio; // ρ*a* A* is fixed, so A* grows as p₀ falls
  const Me = machFromArea(nz.Ae / Astar2, 'subsonic', g);
  return { pe: p0ratio * pressureRatio(Me, g), M1, M2: shockMach(M1), p0ratio, Astar2, Me };
}

/** Where along x the diverging area equals A. */
function xForArea(A, nz) {
  return nz.xt + (1 - nz.xt) * Math.sqrt((A - nz.At) / (nz.Ae - nz.At));
}

/** The whole flow for back pressure pb (a fraction of p₀), sampled at n stations. */
export function nozzleFlow({ pb, p0 = 500e3, T0 = 300, At = 10e-4 }, nz = NOZZLE, n = 201) {
  const crit = criticalPressures(nz);
  const xs = Array.from({ length: n }, (_, i) => i / (n - 1));
  let regime;
  let shock = null;
  let Astar = nz.At;
  if (pb >= 1) {
    regime = 'still';
  } else if (pb > crit.p1) {
    regime = 'subsonic';
    const Me = machFromPressure(pb);
    Astar = nz.Ae / areaRatio(Me, g);
  } else if (pb > crit.p2) {
    regime = 'shock';
    // The exit pressure falls as the shock moves downstream: bisect on the shock's area.
    let lo = nz.At * (1 + 1e-9);
    let hi = nz.Ae;
    for (let k = 0; k < 100; k++) {
      const mid = (lo + hi) / 2;
      if (exitPressureWithShock(mid, nz).pe > pb) lo = mid;
      else hi = mid;
    }
    const As = (lo + hi) / 2;
    shock = { As, x: xForArea(As, nz), ...exitPressureWithShock(As, nz) };
  } else {
    regime = Math.abs(pb - crit.pDesign) < 2e-3 ? 'design' : pb > crit.pDesign ? 'over' : 'under';
  }
  const choked = regime !== 'still' && regime !== 'subsonic';
  // Local Mach, p/p₀ (reservoir) and T/T₀ along the nozzle.
  const M = [];
  const p = [];
  const T = [];
  for (const x of xs) {
    const A = area(x, nz);
    let m;
    let p0local = 1;
    if (regime === 'still') m = 0;
    else if (!choked) m = machFromArea(A / Astar, 'subsonic', g);
    else if (x <= nz.xt) m = machFromArea(A / nz.At, 'subsonic', g);
    else if (shock && x > shock.x) {
      m = machFromArea(A / shock.Astar2, 'subsonic', g);
      p0local = shock.p0ratio;
    } else m = machFromArea(A / nz.At, 'supersonic', g);
    M.push(m);
    p.push(p0local * pressureRatio(m, g));
    T.push(temperatureRatio(m, g));
  }
  // Mass flow, closed form.
  const mdotChoked = At * p0 * Math.sqrt(g / (R_AIR * T0)) * (2 / (g + 1)) ** ((g + 1) / (2 * (g - 1)));
  const mdot = regime === 'still' ? 0 : choked ? mdotChoked : mdotChoked * (Astar / nz.At);
  // Second method: ρVA at every station from its own static state.
  let gap = 0;
  const flux = xs.map((x, i) => {
    const Ts = T0 * T[i];
    const ps = p0 * p[i];
    const rho = ps / (R_AIR * Ts);
    const V = M[i] * Math.sqrt(g * R_AIR * Ts);
    return rho * V * area(x, nz) * At;
  });
  if (mdot > 0) gap = Math.max(...flux.map((f) => Math.abs(f - mdot) / mdot));
  if (shock) gap = Math.max(gap, Math.abs(shockStagnation(shock.M1) - shockStagnationByParts(shock.M1)) / shock.p0ratio);
  return {
    xs, M, p, T, regime, choked, shock, crit, mdot, mdotChoked, flux, gap,
    Me: M[n - 1],
    pe: p[n - 1],
    p0loss: shock ? 1 - shock.p0ratio : 0,
  };
}

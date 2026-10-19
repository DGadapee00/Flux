/**
 * Steady-flow control volumes: the mass and energy balances behind nozzles, turbines, compressors,
 * throttles, mixing chambers and heat exchangers. Pure functions in SI base units (kg, m, s, J, K,
 * Pa), no DOM. A state comes from water.js or idealgas.js; this file only balances them.
 *
 * Mass, steady flow:       Σ ṁ_in = Σ ṁ_out, with ṁ = A V / v.
 * Energy, per unit mass of one stream through the device:
 *
 *     q − w = (h₂ − h₁) + (V₂² − V₁²)/2 + g (z₂ − z₁),
 *
 * with q the heat added and w the shaft work done by the fluid (the course's sign convention, as
 * Q − W = ΔU in the closed-system unit). Enthalpy is in J/kg, so a kinetic-energy change is in
 * J/kg too: a drop of 5 kJ/kg in h gives V = √(2 × 5000) = 100 m/s. That factor of 1000 between kJ
 * and J is the usual place to slip.
 */
import { G_STANDARD } from '../convert.js';
import { isentropicT } from './idealgas.js';
import { waterTP } from './water.js';

/** Mass flow rate, kg/s, through area A (m²) at velocity V (m/s) and specific volume v (m³/kg). */
export const massFlow = (A, V, v) => (A * V) / v;

/** Area, m², that passes mass flow rate mdot at velocity V and specific volume v. */
export const flowArea = (mdot, V, v) => (mdot * v) / V;

/** q − w per unit mass, J/kg, from the two states. */
export function steadyEnergy({ h1, h2, V1 = 0, V2 = 0, z1 = 0, z2 = 0, g = G_STANDARD }) {
  return h2 - h1 + (V2 * V2 - V1 * V1) / 2 + g * (z2 - z1);
}

/** Exit enthalpy, J/kg, when the exit velocity is given: h₂ = h₁ + q − w − Δ(V²/2) − gΔz. */
export function exitEnthalpy({ h1, V1 = 0, V2 = 0, q = 0, w = 0, z1 = 0, z2 = 0, g = G_STANDARD }) {
  return h1 + q - w - (V2 * V2 - V1 * V1) / 2 - g * (z2 - z1);
}

/** Exit velocity, m/s, when the exit enthalpy is given. Throws if the balance asks for V₂² < 0. */
export function exitVelocity({ h1, h2, V1 = 0, q = 0, w = 0, z1 = 0, z2 = 0, g = G_STANDARD }) {
  const V2sq = V1 * V1 + 2 * (q - w - (h2 - h1) - g * (z2 - z1));
  if (V2sq < 0) throw new RangeError('flow: the energy balance leaves no kinetic energy; the exit state is not reachable');
  return Math.sqrt(V2sq);
}

/** The state that results from mixing streams [{ m, h }] with no heat or work: ṁ and h of the outlet. */
export function mixing(streams) {
  const m = streams.reduce((a, s) => a + s.m, 0);
  const h = streams.reduce((a, s) => a + s.m * s.h, 0) / m;
  return { m, h };
}

/** Enthalpy rise per kg of the cold stream when the hot stream gives up dhHot (J/kg), no heat loss. */
export function exchangerColdRise(mHot, dhHot, mCold) {
  return (mHot * dhHot) / mCold;
}

/** The temperature T in [lo, hi] where an ideal gas g has specific enthalpy h (bisection). */
export function tFromH(g, h, lo = g.T_low, hi = g.T_high) {
  if (h < g.h(lo) || h > g.h(hi)) throw new RangeError('flow: that enthalpy lies outside the gas data');
  for (let i = 0; i < 200 && hi - lo > 1e-12 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (g.h(mid) < h) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * An ideal adiabatic, reversible nozzle or diffuser for an ideal gas g, from (T1, p1, V1) to
 * pressure p2. The exit temperature comes from s₂ = s₁ (isentropicT), the exit velocity from the
 * energy balance, and the exit area from the mass balance relative to the inlet area.
 */
export function idealGasNozzle(g, { T1, p1, V1, p2 }) {
  const T2 = isentropicT(g, T1, p1, p2);
  const h1 = g.h(T1);
  const h2 = g.h(T2);
  const V2 = exitVelocity({ h1, h2, V1 });
  const v1 = (g.R * T1) / p1;
  const v2 = (g.R * T2) / p2;
  return { T2, h1, h2, V2, v1, v2, areaRatio: (V1 / V2) * (v2 / v1) };
}

/**
 * ∫ v dp from p1 to p2, J/kg, for a specific volume v(p) along a path, by Simpson's rule in ln p
 * (∫ v dp = ∫ p v d ln p). For a reversible adiabatic flow with no work, dh = v dp along the
 * isentrope, so this equals h₂ − h₁: a check of the energy balance that never uses h.
 */
export function integrateVdp(vOfP, p1, p2, n = 400) {
  const f = (lnp) => {
    const p = Math.exp(lnp);
    return p * vOfP(p);
  };
  const a = Math.log(p1);
  const b = Math.log(p2);
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

/** ∫ v dp along the isentrope of the ideal gas g from (T1, p1) to p2. */
export function isentropicVdp(g, { T1, p1, p2 }, n = 400) {
  return integrateVdp((p) => (g.R * isentropicT(g, T1, p1, p)) / p, p1, p2, n);
}

/**
 * The Joule–Thomson coefficient of water at (T, p), K/Pa: (∂T/∂p)_h = (T (∂v/∂T)_p − v)/c_p, by a
 * central difference in T. Positive means a throttle cools the fluid.
 */
export function jouleThomsonWater(T, p) {
  const dT = T * 1e-5;
  const a = waterTP(T - dT, p);
  const b = waterTP(T + dT, p);
  const here = waterTP(T, p);
  const dvdT = (b.v - a.v) / (2 * dT);
  return (T * dvdT - here.v) / here.cp;
}

/**
 * The temperature after throttling water from (T1, p1) to p2, found by integrating the
 * Joule–Thomson coefficient along the isenthalp with RK4: a path from the definition of μ_JT that
 * never uses h, to compare with the state at h₂ = h₁.
 */
export function throttleByJouleThomson(T1, p1, p2, steps = 200) {
  const dp = (p2 - p1) / steps;
  let T = T1;
  let p = p1;
  for (let i = 0; i < steps; i++) {
    const k1 = jouleThomsonWater(T, p);
    const k2 = jouleThomsonWater(T + (dp * k1) / 2, p + dp / 2);
    const k3 = jouleThomsonWater(T + (dp * k2) / 2, p + dp / 2);
    const k4 = jouleThomsonWater(T + dp * k3, p + dp);
    T += (dp * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    p += dp;
  }
  return T;
}

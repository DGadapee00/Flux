/**
 * Water and steam from IF97 regions 1, 2 and 4, in SI base units:
 * T in K, p in Pa, v in m³/kg, u and h in J/kg, s, cp and cv in J/(kg·K), w in m/s.
 *
 * A state in region 3 (near the critical point) or outside the formulation throws a
 * ThermoRangeError. Saturation properties need both phases from regions 1 and 2, so they stop at
 * 623.15 K (16.529 MPa); above that the saturated states are in region 3.
 */
import {
  P_13, P_MAX, P_MIN_SAT, T_13, T_25, T_CRIT, T_MIN, ThermoRangeError, P_CRIT,
  pB23, propsTP, psat, region1Raw, region2Raw, tB23, tsat,
} from './if97.js';

const MPA = 1e6;
const KJ = 1e3;
const fmt = (x) => Number(x.toPrecision(6)).toString();

/** One IF97 result (MPa, kJ) in SI base units. */
function base(raw) {
  return {
    T: raw.T,
    p: raw.p * MPA,
    v: raw.v,
    u: raw.u * KJ,
    h: raw.h * KJ,
    s: raw.s * KJ,
    cp: raw.cp * KJ,
    cv: raw.cv * KJ,
    w: raw.w,
  };
}

function phaseOf(regionNumber, pMPa) {
  if (regionNumber === 1) return 'compressed liquid';
  return pMPa > P_CRIT ? 'supercritical' : 'superheated vapour';
}

/** Single-phase water at temperature T (K) and pressure p (Pa). */
export function waterTP(T, p) {
  const raw = propsTP(T, p / MPA);
  return { region: raw.region, phase: phaseOf(raw.region, p / MPA), ...base(raw) };
}

/** The saturated liquid and vapour at temperature T (K). */
export function satT(T) {
  if (!(T >= T_MIN)) throw new ThermoRangeError(`IF97: T = ${fmt(T)} K is below 273.15 K, outside the formulation.`, 'outside');
  if (T > T_13) {
    throw new ThermoRangeError(
      T <= T_CRIT
        ? `IF97: saturated states above 623.15 K are in region 3, near the critical point, which this library does not cover (T = ${fmt(T)} K).`
        : `IF97: T = ${fmt(T)} K is above the critical temperature, so there is no saturated state.`,
      T <= T_CRIT ? 3 : 'outside',
    );
  }
  const ps = psat(T);
  const f = base(region1Raw(T, ps));
  const g = base(region2Raw(T, ps));
  return {
    T,
    p: ps * MPA,
    vf: f.v,
    vg: g.v,
    uf: f.u,
    ug: g.u,
    ufg: g.u - f.u,
    hf: f.h,
    hg: g.h,
    hfg: g.h - f.h,
    sf: f.s,
    sg: g.s,
    sfg: g.s - f.s,
  };
}

/** The saturated liquid and vapour at pressure p (Pa). */
export function satP(p) {
  const pM = p / MPA;
  if (!(pM >= P_MIN_SAT * (1 - 1e-12))) throw new ThermoRangeError(`IF97: p = ${fmt(p)} Pa is below the triple-point pressure, 611.213 Pa.`, 'outside');
  if (pM > P_13 * (1 + 1e-12)) {
    throw new ThermoRangeError(
      pM <= P_CRIT
        ? `IF97: saturated states above 16.529 MPa are in region 3, near the critical point, which this library does not cover (p = ${fmt(p)} Pa).`
        : `IF97: p = ${fmt(p)} Pa is above the critical pressure, so there is no saturated state.`,
      pM <= P_CRIT ? 3 : 'outside',
    );
  }
  const T = Math.min(T_13, tsat(Math.min(pM, P_13)));
  return { ...satT(T), p };
}

/** A saturated mixture of quality x (0 to 1), from its saturation table row. */
function mixture(sat, x) {
  if (!(x >= 0 && x <= 1)) throw new RangeError(`quality must be from 0 to 1; got x = ${x}`);
  return {
    phase: 'saturated mixture',
    region: 4,
    T: sat.T,
    p: sat.p,
    x,
    v: sat.vf + x * (sat.vg - sat.vf),
    u: sat.uf + x * sat.ufg,
    h: sat.hf + x * sat.hfg,
    s: sat.sf + x * sat.sfg,
  };
}

export const mixT = (T, x) => mixture(satT(T), x);
export const mixP = (p, x) => mixture(satP(p), x);

/** Bisection on an increasing function: the t in [a, b] where f(t) = target. */
function solveUp(f, target, a, b) {
  let lo = a;
  let hi = b;
  for (let i = 0; i < 200 && hi - lo > 1e-13 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

const KEYS = ['h', 's', 'u', 'v'];

/**
 * The state at pressure p (Pa) with one more property fixed: key is 'h', 's', 'u' or 'v', in SI
 * base units. Inside the dome it returns the mixture and its quality. A compressed liquid is not
 * fixed by p and v (water is densest near 4 °C), so that combination throws.
 */
export function waterP(p, key, value) {
  if (!KEYS.includes(key)) throw new TypeError(`waterP fixes h, s, u or v, not ${key}`);
  const pM = p / MPA;
  if (!(pM > 0 && pM <= P_MAX)) throw new ThermoRangeError(`IF97: p = ${fmt(p)} Pa is outside 0 < p ≤ 100 MPa.`, 'outside');
  const scale = key === 'v' ? 1 : KJ;
  const at1 = (T) => region1Raw(T, pM)[key] * scale;
  const at2 = (T) => region2Raw(T, pM)[key] * scale;
  const vapour = (lo) => {
    if (value > at2(T_25)) {
      throw new ThermoRangeError(`IF97: ${key} = ${fmt(value)} at p = ${fmt(p)} Pa is above 1073.15 K, outside regions 1 and 2.`, 'outside');
    }
    return waterTP(solveUp(at2, value, lo, T_25), p);
  };
  const liquid = (hi) => {
    if (key === 'v') throw new ThermoRangeError('A compressed liquid is not fixed by p and v near 4 °C. Give T instead.', 'outside');
    if (value < at1(T_MIN)) {
      throw new ThermoRangeError(`IF97: ${key} = ${fmt(value)} at p = ${fmt(p)} Pa is below 273.15 K, outside the formulation.`, 'outside');
    }
    return waterTP(solveUp(at1, value, T_MIN, hi), p);
  };

  if (pM <= P_13) {
    const sat = satP(p);
    const f = sat[`${key}f`];
    const g = sat[`${key}g`];
    if (value >= f && value <= g) return mixture(sat, (value - f) / (g - f));
    return value < f ? liquid(sat.T) : vapour(sat.T);
  }
  // Above 16.529 MPa there is no dome in regions 1 and 2. Region 3 lies between them.
  if (value <= at1(T_13)) return liquid(T_13);
  const tb = tB23(pM);
  if (value >= at2(tb)) return vapour(tb);
  throw new ThermoRangeError(
    `IF97: ${key} = ${fmt(value)} at p = ${fmt(p)} Pa is in region 3, near the critical point, which this library does not cover.`,
    3,
  );
}

/**
 * The state at temperature T (K) and specific volume v (m³/kg): the rigid-tank case.
 * Inside the dome it returns the mixture and its quality.
 */
export function waterTv(T, v) {
  if (!(T >= T_MIN && T <= T_25)) throw new ThermoRangeError(`IF97: T = ${fmt(T)} K is outside 273.15 K to 1073.15 K.`, 'outside');
  // v falls as p rises at fixed T, so search on −v.
  const solve = (vOf, lo, hi) => solveUp((pM) => -vOf(pM), -v, lo, hi);
  if (T <= T_13) {
    const sat = satT(T);
    if (v >= sat.vf && v <= sat.vg) return mixture(sat, (v - sat.vf) / (sat.vg - sat.vf));
    const ps = sat.p / MPA;
    if (v > sat.vg) return waterTP(T, solve((pM) => region2Raw(T, pM).v, 1e-9, ps) * MPA);
    if (v < region1Raw(T, P_MAX).v) throw new ThermoRangeError(`IF97: v = ${fmt(v)} m³/kg at T = ${fmt(T)} K needs p above 100 MPa.`, 'outside');
    return waterTP(T, solve((pM) => region1Raw(T, pM).v, ps, P_MAX) * MPA);
  }
  const top = Math.min(P_MAX, pB23(Math.min(T, 863.15)));
  if (v < region2Raw(T, top).v) {
    throw new ThermoRangeError(`IF97: v = ${fmt(v)} m³/kg at T = ${fmt(T)} K is in region 3 or above 100 MPa, which this library does not cover.`, 3);
  }
  return waterTP(T, solve((pM) => region2Raw(T, pM).v, 1e-9, top) * MPA);
}

/** Bounds of what this module covers, in SI base units. */
export const WATER_LIMITS = Object.freeze({
  Tmin: T_MIN,
  Tmax: T_25,
  pmax: P_MAX * MPA,
  satTmax: T_13,
  satPmin: P_MIN_SAT * MPA,
  satPmax: P_13 * MPA,
});

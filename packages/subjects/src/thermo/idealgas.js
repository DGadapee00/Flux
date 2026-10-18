/**
 * Ideal gases from the NASA 7-coefficient polynomials (GRI-Mech 3.0, nasa7-data.js), in SI base
 * units: T in K, p in Pa, h in J/kg, s and cp in J/(kg·K). Molar forms end in `Molar` and use
 * J/mol and J/(mol·K).
 *
 * h is the NASA absolute enthalpy: it includes the enthalpy of formation, so h(298.15 K) = ΔfH°.
 * A course that wants sensible enthalpy uses hSensible, h(T) − h(298.15 K).
 * s° is at the standard pressure of 1 bar; s(T, p) subtracts R ln(p / 1 bar).
 *
 * A temperature outside a species' fitted range throws a ThermoRangeError. Two lower limits differ
 * from GRI-Mech's, which starts N₂ and Ar at 300 K:
 *   - Ar: the fit is cp = 5R/2 with no temperature terms, exact for a monatomic gas, so it is used
 *     from 200 K like most species.
 *   - N₂: used from 298.15 K, the reference temperature, 1.85 K below the fit. There its cp is
 *     within 0.2% and its s° within 0.05% of NIST-JANAF. Below that it is not used: at 200 K the
 *     polynomial's cp is 1.1% under JANAF. So air, which contains N₂, starts at 298.15 K.
 *
 * CH₄: GRI-Mech 3.0's fit runs above the JANAF and rigid-rotor harmonic-oscillator values as T
 * rises. cp is within 0.5% up to 500 K, 1% high at 600 K, and 2.5% high at 1000 K. The selftest
 * records this.
 * Methane here is a fuel at feed temperatures, so the fit is kept as the engine repo has it.
 */
import { ThermoRangeError } from './if97.js';
import { NASA7 } from './nasa7-data.js';

/** Molar gas constant, J/(mol·K), exact since the 2019 SI. */
export const R_UNIVERSAL = 8.314462618;
/** Standard-state pressure of the polynomials, Pa. */
export const P_STANDARD = 1e5;
/** Reference temperature for formation enthalpies, K. */
export const T_REF = 298.15;

/** Lower limits that differ from GRI-Mech's; see above. */
const T_LOW_OVERRIDE = { AR: 200, N2: 298.15 };

/**
 * Dry air, by mole fraction: N₂, O₂, Ar and CO₂ from the U.S. Standard Atmosphere (1976), with
 * the trace gases (0.003%) left out and the four scaled to sum to one.
 */
const AIR_RAW = { N2: 0.78084, O2: 0.209476, AR: 0.00934, CO2: 0.000314 };
const AIR_SUM = Object.values(AIR_RAW).reduce((a, b) => a + b, 0);
export const AIR = Object.freeze(Object.fromEntries(Object.entries(AIR_RAW).map(([k, x]) => [k, x / AIR_SUM])));

/** The species with polynomials, and their molar masses in kg/mol. */
export const SPECIES = Object.freeze(Object.keys(NASA7));

function record(name) {
  const r = NASA7[name];
  if (!r) throw new TypeError(`no NASA-7 data for ${name}; have ${SPECIES.join(', ')}`);
  return r;
}

function coeffs(name, T) {
  const r = record(name);
  const lo = T_LOW_OVERRIDE[name] ?? r.T_low;
  if (!(T >= lo && T <= r.T_high)) {
    throw new ThermoRangeError(`NASA-7: ${name} is fitted from ${lo} K to ${r.T_high} K; got T = ${Number(T.toPrecision(6))} K.`, 'outside');
  }
  return T < r.T_mid ? r.low : r.high;
}

/** Dimensionless forms: cp/R, h/(RT), s°/R. */
export function cpR(name, T) {
  const [a1, a2, a3, a4, a5] = coeffs(name, T);
  return a1 + T * (a2 + T * (a3 + T * (a4 + T * a5)));
}
export function hRT(name, T) {
  const [a1, a2, a3, a4, a5, a6] = coeffs(name, T);
  return a1 + T * (a2 / 2 + T * (a3 / 3 + T * (a4 / 4 + (T * a5) / 5))) + a6 / T;
}
export function sR(name, T) {
  const [a1, a2, a3, a4, a5, , a7] = coeffs(name, T);
  return a1 * Math.log(T) + T * (a2 + T * (a3 / 2 + T * (a4 / 3 + (T * a5) / 4))) + a7;
}

/** Molar properties of one species. */
export const cpMolar = (name, T) => R_UNIVERSAL * cpR(name, T);
export const hMolar = (name, T) => R_UNIVERSAL * T * hRT(name, T);
export const s0Molar = (name, T) => R_UNIVERSAL * sR(name, T);

/** Molar mass, kg/mol, of a species or of a mixture given by mole fractions. */
export function molarMass(gas) {
  if (typeof gas === 'string') return record(gas).W;
  return Object.entries(normalize(gas)).reduce((m, [k, x]) => m + x * record(k).W, 0);
}

function normalize(mix) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  if (!(total > 0)) throw new TypeError('a mixture needs positive mole fractions');
  return Object.fromEntries(Object.entries(mix).map(([k, x]) => [k, x / total]));
}

function asMix(gas) {
  if (gas === 'air') return AIR;
  return typeof gas === 'string' ? { [gas]: 1 } : normalize(gas);
}

/**
 * A gas: a species name, 'air', or a mixture { name: moleFraction }. Per-mass properties in SI base
 * units. A mixture is an ideal mixture: cp and h are mole-weighted, and s adds the entropy of
 * mixing, −R Σ xᵢ ln xᵢ, at total pressure p.
 */
export function gas(spec) {
  const mix = asMix(spec);
  const entries = Object.entries(mix);
  for (const [k] of entries) record(k);
  const W = entries.reduce((m, [k, x]) => m + x * record(k).W, 0);
  const R = R_UNIVERSAL / W;
  const mixing = -entries.reduce((a, [, x]) => a + (x > 0 ? x * Math.log(x) : 0), 0);
  const sum = (f, T) => entries.reduce((a, [k, x]) => a + x * f(k, T), 0);
  return Object.freeze({
    mix: Object.freeze({ ...mix }),
    W,
    R,
    cp: (T) => R * sum(cpR, T),
    cv: (T) => R * (sum(cpR, T) - 1),
    gamma: (T) => sum(cpR, T) / (sum(cpR, T) - 1),
    h: (T) => R * T * sum(hRT, T),
    u: (T) => R * T * (sum(hRT, T) - 1),
    hSensible: (T) => R * (T * sum(hRT, T) - T_REF * sum(hRT, T_REF)),
    s0: (T) => R * (sum(sR, T) + mixing),
    s: (T, p) => R * (sum(sR, T) + mixing - Math.log(p / P_STANDARD)),
  });
}

/**
 * The temperature reached by an isentropic change from (T1, p1) to pressure p2, with cp varying
 * with temperature: s°(T2) = s°(T1) + R ln(p2/p1). Solved by bisection inside the fitted range.
 */
export function isentropicT(spec, T1, p1, p2) {
  const g = typeof spec === 'object' && spec.s0 ? spec : gas(spec);
  const target = g.s0(T1) + g.R * Math.log(p2 / p1);
  const names = Object.keys(g.mix);
  let lo = Math.max(...names.map((k) => T_LOW_OVERRIDE[k] ?? record(k).T_low));
  let hi = Math.min(...names.map((k) => record(k).T_high));
  if (target < g.s0(lo) || target > g.s0(hi)) {
    throw new ThermoRangeError(`NASA-7: the isentropic end state falls outside ${lo} K to ${hi} K.`, 'outside');
  }
  for (let i = 0; i < 200 && hi - lo > 1e-12 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (g.s0(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

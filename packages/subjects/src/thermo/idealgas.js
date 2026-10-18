/**
 * Ideal gases, in SI base units: T in K, p in Pa, h in J/kg, s and cp in J/(kg·K). Molar forms end
 * in `Molar` and use J/mol and J/(mol·K).
 *
 * Two sources of polynomials:
 *   - 'N2', 'CO2', 'CH4' and the other bare names are GRI-Mech 3.0's NASA-7 fits (nasa7-data.js),
 *     identical to the engine repo's Sim/data/thermo_nasa7.json, so the two repos agree.
 *   - 'glenn:N2', 'glenn:O2', 'glenn:AR' and 'glenn:CH4' are NASA Glenn's NASA-9 fits
 *     (McBride, Zehe and Gordon, NASA/TP-2002-211556; glenn-data.js), fitted from 200 K.
 * Air uses the Glenn N₂, O₂ and Ar, and GRI's CO₂, so it is good from 200 K to 3500 K.
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
 *     within 0.2% and its s° within 0.05% of NIST-JANAF. Below that, use 'glenn:N2': at 200 K
 *     GRI's polynomial is 1.1% under JANAF in cp.
 *
 * CH₄: GRI-Mech 3.0's fit runs above NIST-JANAF as T rises: cp is within 0.5% up to 500 K, 0.98%
 * high at 600 K, and 2.5% high at 1000 K (selftest.js; test/fixtures/engine/SOURCE.md). It is kept
 * as the engine repo has it. 'glenn:CH4' follows JANAF.
 */
import { ThermoRangeError } from './if97.js';
import { GLENN } from './glenn-data.js';
import { NASA7 } from './nasa7-data.js';

/** Molar gas constant, J/(mol·K), exact since the 2019 SI. */
export const R_UNIVERSAL = 8.314462618;
/** Standard-state pressure of the polynomials, Pa. */
export const P_STANDARD = 1e5;
/** Reference temperature for formation enthalpies, K. */
export const T_REF = 298.15;

/** Lower limits that differ from GRI-Mech's; see above. */
const T_LOW_OVERRIDE = { AR: 200, N2: 298.15 };

function nasa7(name, r) {
  const lo = T_LOW_OVERRIDE[name] ?? r.T_low;
  const pick = (T) => (T < r.T_mid ? r.low : r.high);
  return {
    W: r.W,
    T_low: lo,
    T_high: r.T_high,
    source: 'GRI-Mech 3.0, NASA-7',
    cpR(T) {
      const [a1, a2, a3, a4, a5] = pick(T);
      return a1 + T * (a2 + T * (a3 + T * (a4 + T * a5)));
    },
    hRT(T) {
      const [a1, a2, a3, a4, a5, a6] = pick(T);
      return a1 + T * (a2 / 2 + T * (a3 / 3 + T * (a4 / 4 + (T * a5) / 5))) + a6 / T;
    },
    sR(T) {
      const [a1, a2, a3, a4, a5, , a7] = pick(T);
      return a1 * Math.log(T) + T * (a2 + T * (a3 / 2 + T * (a4 / 3 + (T * a5) / 4))) + a7;
    },
  };
}

function nasa9(r) {
  const ranges = r.ranges;
  const pick = (T) => ranges.find((g, i) => T < g.T_high || i === ranges.length - 1);
  return {
    W: r.W,
    T_low: ranges[0].T_low,
    T_high: ranges[ranges.length - 1].T_high,
    source: 'NASA Glenn, NASA-9 (NASA/TP-2002-211556)',
    cpR(T) {
      const [a1, a2, a3, a4, a5, a6, a7] = pick(T).a;
      return a1 / (T * T) + a2 / T + a3 + T * (a4 + T * (a5 + T * (a6 + T * a7)));
    },
    hRT(T) {
      const { a, b } = pick(T);
      const [a1, a2, a3, a4, a5, a6, a7] = a;
      return -a1 / (T * T) + (a2 * Math.log(T)) / T + a3 + T * (a4 / 2 + T * (a5 / 3 + T * (a6 / 4 + (T * a7) / 5))) + b[0] / T;
    },
    sR(T) {
      const { a, b } = pick(T);
      const [a1, a2, a3, a4, a5, a6, a7] = a;
      return -a1 / (2 * T * T) - a2 / T + a3 * Math.log(T) + T * (a4 + T * (a5 / 2 + T * (a6 / 3 + (T * a7) / 4))) + b[1];
    },
  };
}

const RECORDS = Object.freeze({
  ...Object.fromEntries(Object.entries(NASA7).map(([k, r]) => [k, nasa7(k, r)])),
  ...Object.fromEntries(Object.entries(GLENN).map(([k, r]) => [`glenn:${k}`, nasa9(r)])),
});

/** Every species name accepted: GRI-Mech's, and the NASA Glenn ones prefixed 'glenn:'. */
export const SPECIES = Object.freeze(Object.keys(RECORDS));

/**
 * Dry air, by mole fraction: N₂, O₂, Ar and CO₂ from the U.S. Standard Atmosphere (1976), with
 * the trace gases (0.003%) left out and the four scaled to sum to one. N₂, O₂ and Ar are NASA
 * Glenn's, so air is good from 200 K.
 */
const AIR_RAW = { 'glenn:N2': 0.78084, 'glenn:O2': 0.209476, 'glenn:AR': 0.00934, CO2: 0.000314 };
const AIR_SUM = Object.values(AIR_RAW).reduce((a, b) => a + b, 0);
export const AIR = Object.freeze(Object.fromEntries(Object.entries(AIR_RAW).map(([k, x]) => [k, x / AIR_SUM])));

function record(name) {
  const r = RECORDS[name];
  if (!r) throw new TypeError(`no ideal-gas data for ${name}; have ${SPECIES.join(', ')}`);
  return r;
}

function checked(name, T) {
  const r = record(name);
  if (!(T >= r.T_low && T <= r.T_high)) {
    throw new ThermoRangeError(`ideal gas: ${name} is fitted from ${r.T_low} K to ${r.T_high} K; got T = ${Number(T.toPrecision(6))} K.`, 'outside');
  }
  return r;
}

/** Dimensionless forms: cp/R, h/(RT), s°/R. */
export const cpR = (name, T) => checked(name, T).cpR(T);
export const hRT = (name, T) => checked(name, T).hRT(T);
export const sR = (name, T) => checked(name, T).sR(T);

/** Molar properties of one species. */
export const cpMolar = (name, T) => R_UNIVERSAL * cpR(name, T);
export const hMolar = (name, T) => R_UNIVERSAL * T * hRT(name, T);
export const s0Molar = (name, T) => R_UNIVERSAL * sR(name, T);

/** Where a species' polynomial comes from, and its fitted range. */
export function speciesInfo(name) {
  const r = record(name);
  return { W: r.W, T_low: r.T_low, T_high: r.T_high, source: r.source };
}

function normalize(mix) {
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  if (!(total > 0)) throw new TypeError('a mixture needs positive mole fractions');
  return Object.fromEntries(Object.entries(mix).map(([k, x]) => [k, x / total]));
}

function asMix(spec) {
  if (spec === 'air') return AIR;
  return typeof spec === 'string' ? { [spec]: 1 } : normalize(spec);
}

/** Molar mass, kg/mol, of a species, of 'air', or of a mixture given by mole fractions. */
export function molarMass(spec) {
  return Object.entries(asMix(spec)).reduce((m, [k, x]) => m + x * record(k).W, 0);
}

/**
 * A gas: a species name, 'air', or a mixture { name: moleFraction }. Per-mass properties in SI base
 * units. A mixture is an ideal mixture: cp and h are mole-weighted, and s adds the entropy of
 * mixing, −R Σ xᵢ ln xᵢ, at total pressure p. T_low and T_high are where every component is fitted.
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
    T_low: Math.max(...entries.map(([k]) => record(k).T_low)),
    T_high: Math.min(...entries.map(([k]) => record(k).T_high)),
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
  let lo = g.T_low;
  let hi = g.T_high;
  if (target < g.s0(lo) || target > g.s0(hi)) {
    throw new ThermoRangeError(`ideal gas: the isentropic end state falls outside ${lo} K to ${hi} K.`, 'outside');
  }
  for (let i = 0; i < 200 && hi - lo > 1e-12 * hi; i++) {
    const mid = (lo + hi) / 2;
    if (g.s0(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

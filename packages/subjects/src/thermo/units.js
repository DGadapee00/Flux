/**
 * Thermodynamic units. The library works in SI base units: K, Pa, m³/kg, J/kg, J/(kg·K).
 * Course units (kPa, kJ/kg) and the English units of the texts are built here from the exact
 * definitions in ../convert.js, so 1 Btu/lbm is exactly 2.326 kJ/kg and 1 Btu/(lbm·R) is exactly
 * 4.1868 kJ/(kg·K).
 */
import { J_PER_BTU, KG_PER_LBM, K_PER_R, M_PER_FT, PA_PER_PSI } from '../convert.js';

/** Multiply a value in this unit by the factor to get SI base units. */
export const FACTORS = Object.freeze({
  // temperature (absolute scales only; °C and °F are offsets, see below)
  K: 1,
  R: K_PER_R,
  // pressure
  Pa: 1,
  kPa: 1e3,
  MPa: 1e6,
  bar: 1e5,
  atm: 101325,
  psia: PA_PER_PSI,
  // specific volume
  'm³/kg': 1,
  'ft³/lbm': M_PER_FT ** 3 / KG_PER_LBM,
  // specific energy: u, h
  'J/kg': 1,
  'kJ/kg': 1e3,
  'Btu/lbm': J_PER_BTU / KG_PER_LBM,
  // specific entropy and heat capacity
  'J/(kg·K)': 1,
  'kJ/(kg·K)': 1e3,
  'Btu/(lbm·R)': J_PER_BTU / (KG_PER_LBM * K_PER_R),
});

function factor(unit) {
  const f = FACTORS[unit];
  if (typeof f !== 'number') throw new TypeError(`unknown thermodynamic unit: ${unit}`);
  return f;
}

/** `value` in `unit`, in SI base units. */
export const toBase = (value, unit) => value * factor(unit);

/** An SI base value, in `unit`. */
export const fromBase = (value, unit) => value / factor(unit);

/** Celsius and Fahrenheit, to and from kelvin. */
export const fromC = (c) => c + 273.15;
export const toC = (k) => k - 273.15;
export const fromF = (f) => (f + 459.67) * K_PER_R;
export const toF = (k) => k / K_PER_R - 459.67;

/** The unit each property is shown in, in each system. */
export const SYSTEMS = Object.freeze({
  SI: { T: 'K', p: 'kPa', v: 'm³/kg', u: 'kJ/kg', h: 'kJ/kg', s: 'kJ/(kg·K)', cp: 'kJ/(kg·K)', cv: 'kJ/(kg·K)' },
  English: { T: 'R', p: 'psia', v: 'ft³/lbm', u: 'Btu/lbm', h: 'Btu/lbm', s: 'Btu/(lbm·R)', cp: 'Btu/(lbm·R)', cv: 'Btu/(lbm·R)' },
});

/**
 * A state's properties in one system's units. Keys that are not properties (region, phase, x, w)
 * are copied as they are; w stays in m/s in both systems.
 */
export function inUnits(state, system = 'SI') {
  const units = SYSTEMS[system];
  if (!units) throw new TypeError(`unknown unit system: ${system}`);
  const out = {};
  for (const [k, val] of Object.entries(state)) {
    out[k] = units[k] && typeof val === 'number' ? fromBase(val, units[k]) : val;
  }
  return out;
}

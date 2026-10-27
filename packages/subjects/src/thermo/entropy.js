/**
 * Entropy changes, isentropic efficiency and lost work.
 *
 * For an ideal gas, ds = c_p dT/T − R dp/p, so
 * s(T2, p2) − s(T1, p1) = ∫ c_p dT/T − R ln(p2/p1).
 * The integral is what the NASA polynomial stores as s°(T). The pressure term is exact.
 *
 * An incompressible liquid with u = u(T) and constant v has du = T ds, so Δs = c ln(T2/T1).
 * The pressure does not appear: (∂s/∂p)_T = −(∂v/∂T)_p = 0 when v is constant. Enthalpy still
 * carries the flow work, Δh = c ΔT + v Δp.
 *
 * Heat Q leaving a hot reservoir and entering a cold one generates
 * S_gen = Q/T_L − Q/T_H. The Gouy–Stodola theorem says the work that irreversibility destroys,
 * measured against a reservoir at T0, is T0 S_gen.
 *
 * A turbine or nozzle with isentropic efficiency η converts that fraction of the isentropic
 * enthalpy drop: h2 = h1 − η (h1 − h2s). A compressor uses the reciprocal, because the real
 * machine needs more work than the isentropic one: h2 = h1 + (h2s − h1)/η.
 */
import { ThermoRangeError } from './if97.js';

function simpson(f, a, b, n) {
  const steps = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / steps;
  let sum = f(a) + f(b);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * f(a + i * h);
  return (sum * h) / 3;
}

function asGas(spec) {
  if (!spec || typeof spec.s !== 'function') throw new ThermoRangeError('Entropy needs an ideal-gas model.', 'outside');
  return spec;
}

/** Ideal-gas entropy change, J/(kg·K), from the NASA s°(T) and the pressure logarithm. */
export function idealGasDeltaS(spec, { T1, p1, T2, p2 }) {
  const g = asGas(spec);
  if (!(p1 > 0 && p2 > 0)) throw new ThermoRangeError('Entropy needs positive pressures.', 'outside');
  return g.s(T2, p2) - g.s(T1, p1);
}

/** The same change as ∫ c_p dT/T − R ln(p2/p1). The second method for idealGasDeltaS. */
export function idealGasDeltaSIntegral(spec, { T1, p1, T2, p2 }, n = 400) {
  const g = asGas(spec);
  if (!(p1 > 0 && p2 > 0)) throw new ThermoRangeError('Entropy needs positive pressures.', 'outside');
  const heat = T1 === T2 ? 0 : simpson((T) => g.cp(T) / T, T1, T2, n);
  return heat - g.R * Math.log(p2 / p1);
}

/** Incompressible liquid: Δs = c ln(T2/T1). c is the specific heat, J/(kg·K). */
export function incompressibleDeltaS(c, T1, T2) {
  if (!(c > 0 && T1 > 0 && T2 > 0)) throw new ThermoRangeError('An incompressible Δs needs c > 0 and positive temperatures.', 'outside');
  return c * Math.log(T2 / T1);
}

/** Δu = c (T2 − T1) for that liquid. */
export function incompressibleDeltaU(c, T1, T2) {
  if (!(c > 0)) throw new ThermoRangeError('An incompressible Δu needs c > 0.', 'outside');
  return c * (T2 - T1);
}

/** Δh = c (T2 − T1) + v (p2 − p1). v is m³/kg, pressures are Pa, and the result is J/kg. */
export function incompressibleDeltaH(c, T1, T2, v, p1, p2) {
  if (!(v > 0)) throw new ThermoRangeError('An incompressible Δh needs v > 0.', 'outside');
  return incompressibleDeltaU(c, T1, T2) + v * (p2 - p1);
}

/**
 * Entropy generated when heat Q (positive) leaves a reservoir at T_H and enters one at T_L.
 * Both temperatures are kelvin. The two reservoirs and a steady wall together produce this much.
 */
export function reservoirGeneration(Q, TH, TL) {
  if (!(Q >= 0 && TL > 0 && TH > 0)) throw new ThermoRangeError('Reservoir entropy needs Q ≥ 0 and positive temperatures.', 'outside');
  return Q * (1 / TL - 1 / TH);
}

/** Work made unavailable by entropy generation, against an environment at T0. Gouy–Stodola: T0 S_gen. */
export function lostWork(T0, Sgen) {
  if (!(T0 > 0)) throw new ThermoRangeError('Lost work is measured against a positive environment temperature.', 'outside');
  return T0 * Sgen;
}

function requireDrop(h1, h2s) {
  if (!(h1 > h2s)) throw new ThermoRangeError('An expansion needs the isentropic exit below the inlet enthalpy.', 'outside');
}

function requireEta(eta) {
  if (!(eta > 0 && eta <= 1)) throw new ThermoRangeError('Isentropic efficiency is between 0 and 1.', 'outside');
}

/** Turbine or nozzle: (h1 − h2) / (h1 − h2s). */
export function expansionEfficiency(h1, h2, h2s) {
  requireDrop(h1, h2s);
  return (h1 - h2) / (h1 - h2s);
}

/** h2 = h1 − η (h1 − h2s). */
export function expansionExit(h1, h2s, eta) {
  requireDrop(h1, h2s);
  requireEta(eta);
  return h1 - eta * (h1 - h2s);
}

/** Compressor: (h2s − h1) / (h2 − h1). The real exit is hotter, so the denominator is larger. */
export function compressionEfficiency(h1, h2, h2s) {
  if (!(h2s > h1 && h2 > h1)) throw new ThermoRangeError('A compression needs both exits above the inlet enthalpy.', 'outside');
  return (h2s - h1) / (h2 - h1);
}

/** h2 = h1 + (h2s − h1) / η. */
export function compressionExit(h1, h2s, eta) {
  if (!(h2s > h1)) throw new ThermoRangeError('A compression needs the isentropic exit above the inlet.', 'outside');
  requireEta(eta);
  return h1 + (h2s - h1) / eta;
}

/**
 * Steady-flow entropy generation per kilogram. q is heat into the fluid, J/kg, crossing the
 * boundary at temperature Tb. An adiabatic device has q = 0, so s_gen = s2 − s1.
 */
export function flowGeneration({ s1, s2, q = 0, Tb = null }) {
  if (q === 0) return s2 - s1;
  if (!(Tb > 0)) throw new ThermoRangeError('Heat across the boundary needs the boundary temperature.', 'outside');
  return s2 - s1 - q / Tb;
}

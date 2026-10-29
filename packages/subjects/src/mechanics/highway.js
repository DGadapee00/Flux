/**
 * The horizontal curve of a highway: a car on a superelevated bend (Hibbeler §13.5).
 *
 * The road is banked at slope e (tan θ = e). Side friction f acts along the road surface. With the
 * car about to slide outward, friction points down the bank, and ΣF in the vertical and in the
 * horizontal (toward the centre) give
 *
 *   v² = R g (e + f) / (1 − e f).
 *
 * AASHTO's design policy (A Policy on Geometric Design of Highways and Streets, 2011) drops the
 * small e f term and works in US units: R_min = V² / (15 (e + f)), V in mph, R in feet. Its side
 * friction factor f is a comfort limit, well below what dry tyres can give, and falls with speed:
 * 0.14 at 50 mph, 0.13 at 55, 0.12 at 60, 0.11 at 65, 0.10 at 70.
 *
 * Pure functions. SI unless a name says mph or ft.
 */
import { M_PER_FT } from '../convert.js';
import { G } from './constants.js';

export const MPH = 0.44704;

/** AASHTO's maximum side friction factor for high-speed design, 50 to 70 mph, linear between. */
const FMAX = [
  [50, 0.14],
  [55, 0.13],
  [60, 0.12],
  [65, 0.11],
  [70, 0.1],
];
export function aashtoFmax(Vmph) {
  const v = Math.min(70, Math.max(50, Vmph));
  for (let i = 1; i < FMAX.length; i++) {
    const [v1, f1] = FMAX[i];
    const [v0, f0] = FMAX[i - 1];
    if (v <= v1) return f0 + ((f1 - f0) * (v - v0)) / (v1 - v0);
  }
  return FMAX[FMAX.length - 1][1];
}

/** AASHTO's minimum radius, in feet: R = V² / (15 (e + f)). */
export const minRadiusFt = (Vmph, e, f) => (Vmph * Vmph) / (15 * (e + f));

/** The speed at which a car on radius R (m) needs all of side friction f, exact. */
export function limitSpeed(R, e, f, g = G) {
  const den = 1 - e * f;
  return den > 0 ? Math.sqrt((R * g * (e + f)) / den) : Infinity;
}

/**
 * The side friction a car needs at speed v on radius R (m) and superelevation e, exact.
 * From N cos θ − F sin θ = mg and N sin θ + F cos θ = m v²/R with F = f N:
 * f = (v²/gR − e) / (1 + e v²/gR). Negative means friction must act up the bank.
 */
export function frictionNeed(v, R, e, g = G) {
  const q = (v * v) / (g * R);
  return (q - e) / (1 + e * q);
}

/** AASHTO's simplified radius in metres, and the same in SI form, R = v²/(g(e + f)). */
export function minRadius(Vmph, e, f) {
  const ft = minRadiusFt(Vmph, e, f);
  return { ft, m: ft * M_PER_FT };
}

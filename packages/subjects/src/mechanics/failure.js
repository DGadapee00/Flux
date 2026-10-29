/**
 * The largest shear of all, and the brittle fracture criteria, for plane stress (σz = 0).
 * Pure, SI. failure-selftest.js checks each one a second way.
 */
import { principal2 } from './materials.js';

/**
 * Plane stress has three principals: σ1 and σ2 in the plane and 0 normal to it. Each pair draws a
 * circle; the largest shear anywhere is the biggest radius, half the spread of the three.
 */
export function absMaxShear(sx, sy, txy) {
  const { s1, s2, R } = principal2(sx, sy, txy);
  const hi = Math.max(s1, s2, 0);
  const lo = Math.min(s1, s2, 0);
  return { s1, s2, inPlane: R, abs: (hi - lo) / 2, outOfPlane: (hi - lo) / 2 > R * (1 + 1e-12) };
}

/** The largest and smallest of the three principals (σ3 = 0 for plane stress). */
function extremes(sx, sy, txy) {
  const { s1, s2 } = principal2(sx, sy, txy);
  return { max: Math.max(s1, s2, 0), min: Math.min(s1, s2, 0) };
}

/** Maximum normal stress (Rankine): fracture when the largest tension reaches σut or the largest compression reaches σuc. */
export function maxNormalFS(sx, sy, txy, sut, suc) {
  const { max, min } = extremes(sx, sy, txy);
  const t = max > 0 ? max / sut : 0;
  const c = min < 0 ? -min / suc : 0;
  return 1 / Math.max(t, c, 1e-300);
}

/**
 * Coulomb–Mohr: a stress circle is safe while it stays inside the straight envelope tangent to the
 * uniaxial tension circle and the uniaxial compression circle. A circle tangent to a fixed line has
 * a radius linear in its centre; fitting the two test circles gives σmax/σut − σmin/σuc = 1. When
 * both extremes share a sign the bigger circle touches one test circle, and the rule falls back to
 * the maximum normal stress.
 */
export function coulombMohrFS(sx, sy, txy, sut, suc) {
  const { max, min } = extremes(sx, sy, txy);
  const load = Math.max(max, 0) / sut - Math.min(min, 0) / suc;
  return 1 / Math.max(load, 1e-300);
}

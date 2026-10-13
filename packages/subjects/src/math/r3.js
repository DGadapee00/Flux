/**
 * R³ identities used as dual routes (Merino §4.1).
 * Algebraic u·v vs the polarization identity; ||u×v|| vs the parallelogram
 * area ||u|| ||v − proj_u v||. Cross product is only defined in R³.
 */
import { add, sub, dot, cross, len, lenSq, proj } from './vec.js';

export function polarizeDot(u, v) {
  return 0.5 * (lenSq(add(u, v)) - lenSq(u) - lenSq(v));
}

/** Area of the parallelogram spanned by u and v, without using the cross product. */
export function paraArea(u, v) {
  const lu = len(u);
  if (lu < 1e-15) return 0;
  return lu * len(sub(v, proj(v, u)));
}

export function agreeAbs(a, b, tol = 1e-9) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
}

export { add, sub, dot, cross, len, lenSq, proj };

/**
 * Pressure in fluids that do not shear: on a submerged gate, and in a tank that accelerates or spins
 * as one body. Our own derivations.
 *
 * Gate. A flat rectangular gate of length L along its slope and width b, tilted θ from the horizontal,
 * its top edge at depth d. Measure y along the gate's plane from the free surface. Gauge pressure is
 * ρ g y sin θ, so the resultant is F = ρ g h_c A, acting at y_cp = y_c + I_xc/(y_c A), below the
 * centroid. The second method sums slices along the gate for the force and its moment.
 *
 * Tank. With no relative motion the fluid has no shear, and ∇p = ρ(g − a). For a straight
 * acceleration (a_x forward, a_z up) the isobars are planes tilted by tan θ = a_x/(g + a_z), and the
 * surface rises at the back. For a spin at ω about the axis they are paraboloids, z = ω²r²/(2g_e) + C.
 * The closed forms place the surface by symmetry: it pivots about the middle (linear) or keeps the
 * rest volume with the rim and centre equal and opposite (spin). The second method makes no use of
 * symmetry: it finds the surface constant by bisection so that a numerically integrated volume
 * matches the water poured in.
 */
import { G } from './constants.js';

/** Liquids for the pressure labs (kg/m³). Water at 20 °C, seawater, and a light oil. */
export const LIQUIDS = Object.freeze({
  water: { id: 'water', name: 'Water', rho: 998 },
  seawater: { id: 'seawater', name: 'Seawater', rho: 1025 },
  oil: { id: 'oil', name: 'Light oil', rho: 870 },
  mercury: { id: 'mercury', name: 'Mercury', rho: 13546 },
});

/**
 * Resultant pressure force on a rectangular gate, and where it acts.
 * @param {{ rho: number, d: number, L: number, b: number, theta: number, g?: number }} p
 *   d: depth of the top edge (m); L: length along the slope (m); b: width (m); theta: degrees from horizontal.
 */
export function gateForce({ rho, d, L, b, theta, g = G }) {
  const s = Math.sin((theta * Math.PI) / 180);
  const yTop = d / s;
  const yc = yTop + L / 2;
  const A = b * L;
  const hc = yc * s;
  const F = rho * g * hc * A;
  const Ixc = (b * L ** 3) / 12;
  const ycp = yc + Ixc / (yc * A);
  const offset = ycp - yc;
  // Hinged at the top edge, held shut by a force normal to the gate at the bottom edge.
  const hold = (F * (ycp - yTop)) / L;
  return { F, A, hc, yTop, yc, ycp, offset, hcp: ycp * s, hold, s };
}

/** The same gate by slices: Simpson's rule on the force and its moment about the surface line. */
export function gateForceSlices({ rho, d, L, b, theta, g = G }, n = 400) {
  const s = Math.sin((theta * Math.PI) / 180);
  const yTop = d / s;
  const m = n % 2 ? n + 1 : n;
  const dy = L / m;
  let F = 0;
  let M = 0;
  for (let i = 0; i <= m; i++) {
    const y = yTop + i * dy;
    const w = i === 0 || i === m ? 1 : i % 2 ? 4 : 2;
    const dF = rho * g * y * s * b;
    F += w * dF;
    M += w * dF * y;
  }
  F *= dy / 3;
  M *= dy / 3;
  const ycp = M / F;
  return { F, ycp, hold: (F * (ycp - yTop)) / L };
}

/**
 * Free surface of a tank moving as a rigid body, by the closed form.
 * linear: tank of length len, x from the back wall (0) to the front (len), accelerating toward +x.
 * spin: a round tank of radius len, x is the radius.
 * Returns the surface height at the two ends, the tilt and the bottom gauge pressures.
 */
export function rigidSurface({ mode, len, h0, ax = 0, az = 0, omega = 0, rho, g = G }) {
  const ge = g + az;
  if (mode === 'spin') {
    const rise = (omega * omega * len * len) / (4 * ge);
    const z = (r) => h0 + (omega * omega * (r * r - (len * len) / 2)) / (2 * ge);
    return { ge, z, inner: h0 - rise, outer: h0 + rise, rise, slope: (omega * omega * len) / ge, pInner: rho * ge * (h0 - rise), pOuter: rho * ge * (h0 + rise) };
  }
  const k = ax / ge;
  const rise = (k * len) / 2;
  const z = (x) => h0 + k * (len / 2 - x);
  return { ge, z, inner: h0 + rise, outer: h0 - rise, rise, slope: k, angle: (Math.atan(k) * 180) / Math.PI, pInner: rho * ge * (h0 + rise), pOuter: rho * ge * (h0 - rise) };
}

/**
 * The same surface with no symmetry assumed: the isobar p = 0 of ∇p = ρ(g − a), with its constant found
 * by bisection so that the volume under it, summed by Simpson's rule, equals the rest volume.
 * Returns the surface heights at the two ends.
 */
export function rigidSurfaceByVolume({ mode, len, h0, ax = 0, az = 0, omega = 0, g = G }, n = 200) {
  const ge = g + az;
  // Surface height for a trial constant C (p/ρ at the origin on the floor's level).
  const surf = mode === 'spin' ? (C, r) => (C + (omega * omega * r * r) / 2) / ge : (C, x) => (C - ax * x) / ge;
  const weight = mode === 'spin' ? (r) => 2 * Math.PI * r : () => 1;
  const target = mode === 'spin' ? Math.PI * len * len * h0 : len * h0;
  const m = n % 2 ? n + 1 : n;
  const volume = (C) => {
    let v = 0;
    for (let i = 0; i <= m; i++) {
      const x = (i / m) * len;
      const w = i === 0 || i === m ? 1 : i % 2 ? 4 : 2;
      v += w * weight(x) * surf(C, x);
    }
    return (v * len) / (3 * m);
  };
  let lo = -1e3 * ge * (h0 + 1) - Math.abs(ax) * len * 10 - omega * omega * len * len * 10;
  let hi = -lo;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (volume(mid) < target) lo = mid;
    else hi = mid;
  }
  const C = (lo + hi) / 2;
  return { inner: surf(C, 0), outer: surf(C, len) };
}

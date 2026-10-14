/**
 * Fixed-axis rotation. The vector torque about a point is momentAbout in
 * statics.js (r × F). What is new here is the scalar |τ| = r F sinφ, the mass
 * moments, and rolling without slipping.
 *
 * Angles that cross the boundary are radians inside these functions, except
 * thetaDeg and phiDeg, which are degrees.
 */

import { G } from './constants.js';

const DEG = Math.PI / 180;

/** θ = θ0 + ω0 t + (1/2) α t² and ω = ω0 + α t. Radians. */
export function constAlpha({ theta0 = 0, omega0 = 0, alpha = 0, t }) {
  return {
    theta: theta0 + omega0 * t + 0.5 * alpha * t * t,
    omega: omega0 + alpha * t,
    alpha,
  };
}

/** |τ| = r F sinφ. phiDeg is the angle between the lever arm and the force. */
export function torqueMag(r, force, phiDeg) {
  return r * force * Math.sin(phiDeg * DEG);
}

/** α = τ / I. */
export function angularAcceleration(torque, I) {
  if (!(I > 0)) return NaN;
  return torque / I;
}

export const inertiaPoint = (mass, r) => mass * r * r;
export const inertiaHoop = (mass, R) => mass * R * R;
export const inertiaDisk = (mass, R) => 0.5 * mass * R * R;
export const inertiaSphere = (mass, R) => (2 / 5) * mass * R * R;
export const inertiaRodCenter = (mass, length) => (mass * length * length) / 12;
export const inertiaRodEnd = (mass, length) => (mass * length * length) / 3;

/** I = I_cm + m d². The area form is parallelAxis in sections.js. */
export function parallelAxisMass(iCm, mass, d) {
  return iCm + mass * d * d;
}

/** (1/2) I ω². */
export function rotationalKE(I, omega) {
  return 0.5 * I * omega * omega;
}

/** L = I ω about the same axis. */
export function angularMomentum(I, omega) {
  return I * omega;
}

/**
 * Rolls without slipping down a straight incline. I is about the center.
 * a is the linear acceleration down the plane, α = a / R.
 * From ΣF and Στ: a = g sinθ / (1 + I / (m R²)).
 */
export function rollingIncline({ mass, radius, I, thetaDeg, g = G }) {
  const k = I / (mass * radius * radius);
  const a = (g * Math.sin(thetaDeg * DEG)) / (1 + k);
  return { a, alpha: a / radius, k };
}

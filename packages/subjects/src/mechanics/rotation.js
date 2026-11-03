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
  const th = thetaDeg * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const a = (g * sin) / (1 + k);
  const f = (k / (1 + k)) * mass * g * sin;
  const N = mass * g * cos;
  const muMin = Math.abs(cos) > 1e-12 ? (k / (1 + k)) * Math.tan(th) : Infinity;
  return { a, alpha: radius > 0 ? a / radius : NaN, k, f, N, muMin };
}

/**
 * The same body, sliding, with kinetic friction μ up the plane.
 * a is down the plane. α = f R / I about the center. v and ω are not tied by v = ωR.
 */
export function rollingSlip({ mass, radius, I, thetaDeg, mu, g = G }) {
  const th = thetaDeg * DEG;
  const a = g * (Math.sin(th) - mu * Math.cos(th));
  const f = mu * mass * g * Math.cos(th);
  const alpha = I > 0 && radius > 0 ? (f * radius) / I : NaN;
  return { a, alpha, f };
}

/** Speed after a drop h, rolling from rest without slipping. v = √(2gh / (1 + k)). */
export function rollingSpeed({ mass, radius, I, height, g = G }) {
  const k = I / (mass * radius * radius);
  const v = Math.sqrt((2 * g * height) / (1 + k));
  return { v, omega: radius > 0 ? v / radius : NaN, k };
}

/** Steady precession of a spinning disk whose center is a distance r from the pivot. Ω = mgr / (Iω). */
export function precessionRate({ mass, r, I, omega, g = G }) {
  const L = I * omega;
  if (!(Math.abs(L) > 0)) return { omegaP: NaN, period: NaN, L };
  const omegaP = (mass * g * r) / L;
  return { omegaP, period: (2 * Math.PI) / Math.abs(omegaP), L };
}

/** ω after I changes, with no outside torque about the axis. L = Iω stays fixed. */
export function spinAfter(I1, omega1, I2) {
  if (!(I2 > 0)) return NaN;
  return (I1 * omega1) / I2;
}

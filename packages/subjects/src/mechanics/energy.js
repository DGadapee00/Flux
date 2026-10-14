/**
 * Work and mechanical energy. A speed is a magnitude. A force and a displacement
 * passed together are vectors, and the work is their dot product.
 */

import { dot } from './vectors.js';

/** (1/2) m v². */
export function kineticEnergy(mass, speed) {
  return 0.5 * mass * speed * speed;
}

/** m g h. The zero of height is the caller's. */
export function gravitationalEnergy(mass, g, height) {
  return mass * g * height;
}

/** (1/2) k x², measured from the unstretched length. */
export function springEnergy(k, x) {
  return 0.5 * k * x * x;
}

/** Constant force through a distance. thetaDeg is the angle between them. */
export function work(force, displacement, thetaDeg = 0) {
  return force * displacement * Math.cos((thetaDeg * Math.PI) / 180);
}

/** F · d. */
export function workVector(force, displacement) {
  return dot(force, displacement);
}

/** P = F v for two numbers, or F · v for two vectors. */
export function power(force, velocity) {
  if (typeof force === 'number') return force * velocity;
  return dot(force, velocity);
}

/**
 * Speed from K0 + U0 + Wnc = K + U, with K = (1/2) m v².
 * NaN when the kinetic energy would have to be negative.
 */
export function speedFromEnergy({ mass, k0 = 0, u0 = 0, u = 0, wnc = 0 }) {
  const k = k0 + u0 - u + wnc;
  if (!(mass > 0) || k < -1e-9) return NaN;
  return Math.sqrt(Math.max(0, (2 * k) / mass));
}

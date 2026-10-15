/**
 * Momentum, impulse, and a one-dimensional collision.
 * Velocities along a line are signed numbers. In more than one dimension they
 * are vectors from vectors.js.
 */

import { add, scale, v } from './vectors.js';

/** p = m v. */
export function momentum(mass, velocity) {
  if (typeof velocity === 'number') return mass * velocity;
  return scale(velocity, mass);
}

/** J = F Δt, the impulse of a constant force. */
export function impulse(force, dt) {
  if (typeof force === 'number') return force * dt;
  return scale(force, dt);
}

/**
 * One-dimensional collision. e is the coefficient of restitution:
 * v2 − v1 = e (u1 − u2), and momentum is conserved.
 * e = 1 is elastic. e = 0 is perfectly inelastic.
 */
export function collide1D(m1, m2, u1, u2, e = 1) {
  const total = m1 + m2;
  const v1 = (m1 * u1 + m2 * u2 - m2 * e * (u1 - u2)) / total;
  const v2 = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / total;
  return { v1, v2 };
}

/** Mass-weighted average position. parts are { mass, r }. */
export function centerOfMass(parts) {
  let mass = 0;
  let mr = v(0, 0, 0);
  for (const p of parts) {
    mass += p.mass;
    mr = add(mr, scale(p.r, p.mass));
  }
  return { mass, r: mass > 0 ? scale(mr, 1 / mass) : v(NaN, NaN, NaN) };
}

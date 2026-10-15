/**
 * Momentum, impulse, and a one-dimensional collision.
 * Velocities along a line are signed numbers. In more than one dimension they
 * are vectors from vectors.js.
 */

import { G } from './constants.js';
import { add, cross, scale, v } from './vectors.js';

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

/** Impulse of F = a + b t from t0 to t1. */
export function impulseRamp(a, b, t0, t1) {
  const dt = t1 - t0;
  return a * dt + 0.5 * b * (t1 * t1 - t0 * t0);
}

/** μ = m1 m2 / (m1 + m2). */
export function reducedMass(m1, m2) {
  const total = m1 + m2;
  if (!(total > 0)) return NaN;
  return (m1 * m2) / total;
}

/** Kinetic energy lost in a direct impact: ½ μ (1 − e²) (u1 − u2)². */
export function impactLoss(m1, m2, u1, u2, e) {
  const rel = u1 - u2;
  return 0.5 * reducedMass(m1, m2) * (1 - e * e) * rel * rel;
}

/** Direct impact on the normal components. Tangent components pass through. */
export function collideOblique({ m1, m2, un1, ut1 = 0, un2, ut2 = 0, e = 1 }) {
  const hit = collide1D(m1, m2, un1, un2, e);
  const total = m1 + m2;
  const vcm = total > 0 ? (m1 * un1 + m2 * un2) / total : NaN;
  return { vn1: hit.v1, vt1: ut1, vn2: hit.v2, vt2: ut2, vcm };
}

/**
 * Constant burn rate. mdot > 0 is the mass lost per time.
 * Δv = ve ln(m0/mf) − g tb, with tb = (m0 − mf) / mdot.
 * g = 0 is a coast.
 */
export function rocketDeltaV({ m0, mf, ve, mdot, g = G, v0 = 0 }) {
  if (!(m0 > mf) || !(mf > 0) || !(mdot > 0) || !Number.isFinite(ve) || !Number.isFinite(g)) {
    return { dv: NaN, tb: NaN, speed: NaN, burned: NaN, ratio: NaN };
  }
  const burned = m0 - mf;
  const tb = burned / mdot;
  const ratio = m0 / mf;
  const dv = ve * Math.log(ratio) - g * tb;
  return { dv, tb, speed: v0 + dv, burned, ratio };
}

/** r × (m v) about the caller's origin. */
export function particleAngularMomentum(mass, r, velocity) {
  return cross(r, scale(velocity, mass));
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

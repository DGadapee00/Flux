/**
 * Newton's second law for a particle: inclines, the Atwood machine, and
 * uniform circular motion. Forces and accelerations are vectors from vectors.js.
 * g is positive and points down. Friction here is kinetic, μN, unless the call
 * asks whether a block at rest can hold.
 */

import { G } from './constants.js';
import { centripetalAccel } from './kinematics.js';
import { scale, v } from './vectors.js';

const DEG = Math.PI / 180;

/** Weight (0, −mg, 0) with +y upward. */
export function weight(mass, g = G) {
  return v(0, -mass * g, 0);
}

/** F = ma. */
export function newton(mass, acceleration) {
  return scale(acceleration, mass);
}

/** a = F/m. */
export function acceleration(force, mass) {
  if (!(mass > 0)) return v(NaN, NaN, NaN);
  return scale(force, 1 / mass);
}

/**
 * A block on a straight incline. thetaDeg is the angle of the surface above
 * the horizontal. aDown is the acceleration in the downhill direction, so a
 * positive value speeds the block up as it goes down.
 *
 * motion 'down': kinetic friction points up the plane.
 * motion 'up': kinetic friction points down the plane.
 * motion 'rest': static friction up to μN. holds is whether that is enough.
 */
export function incline({ mass, thetaDeg, mu = 0, g = G, motion = 'down' }) {
  const th = thetaDeg * DEG;
  const N = mass * g * Math.cos(th);
  const down = mass * g * Math.sin(th);
  if (motion === 'rest') {
    const holds = mu * N + 1e-9 >= down;
    return {
      N,
      f: holds ? down : mu * N,
      holds,
      aDown: holds ? 0 : (down - mu * N) / mass,
    };
  }
  const f = mu * N;
  const aDown = motion === 'up' ? (down + f) / mass : (down - f) / mass;
  return { N, f, holds: false, aDown };
}

/**
 * Two masses on a string over a pulley. a is positive when m2 descends.
 * T = 2 m1 m2 g / (m1 + m2).
 */
export function atwood(m1, m2, g = G) {
  const total = m1 + m2;
  return {
    a: ((m2 - m1) * g) / total,
    T: (2 * m1 * m2 * g) / total,
  };
}

/** Magnitude mv²/r. */
export function centripetalForce(mass, speed, radius) {
  return mass * centripetalAccel(speed, radius);
}

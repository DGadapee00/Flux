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

/**
 * Block on an incline, string over a pulley, hanging mass.
 * `a` is positive when the hanging mass descends and the block moves up the plane.
 * `f` is the friction on the block in that same direction (up the plane is positive).
 * From rest, friction is static when it can balance the drive, otherwise kinetic
 * and opposed to the impending motion. A nonzero `v0` (same sign as `a`) makes
 * friction kinetic and opposed to that velocity. `muk` above `mus` is cut down
 * to `mus`, which is the model these problems use.
 */
export function hangingIncline({ block, hang, thetaDeg, muk = 0, mus = 0, g = G, v0 = 0 }) {
  const th = thetaDeg * DEG;
  const kinetic = Math.min(Math.max(muk, 0), Math.max(mus, 0));
  const N = block * g * Math.cos(th);
  const drive = hang * g - block * g * Math.sin(th);
  const mass = block + hang;
  const cap = Math.max(mus, 0) * Math.max(N, 0);
  let regime;
  let f;
  if (!(mass > 0)) return { N, a: NaN, T: NaN, f: NaN, regime: 'invalid', drive, holds: false };
  if (Math.abs(v0) > 1e-9) {
    regime = 'kinetic';
    f = (v0 > 0 ? -1 : 1) * kinetic * Math.max(N, 0);
  } else if (Math.abs(drive) <= cap + 1e-9) {
    regime = 'static';
    f = -drive;
  } else {
    regime = 'kinetic';
    f = (drive > 0 ? -1 : 1) * kinetic * Math.max(N, 0);
  }
  const a = (drive + f) / mass;
  const T = hang * (g - a);
  return { N, a, T, f, regime, drive, holds: regime === 'static' };
}

/**
 * Car on a banked curve. `f` is positive when friction acts down the bank.
 * `vDesign` is the one speed that needs no friction. `vMin` and `vMax` are the
 * band static friction μ can hold; a zero minimum means the car can stop.
 */
export function bankedCurve({ mass, radius, thetaDeg, speed = 0, mu = 0, g = G }) {
  const th = thetaDeg * DEG;
  const sin = Math.sin(th);
  const cos = Math.cos(th);
  const an = radius > 0 ? (speed * speed) / radius : NaN;
  const N = mass * (an * sin + g * cos);
  const f = mass * (an * cos - g * sin);
  const vDesign = radius > 0 && cos > 0 ? Math.sqrt(Math.max(0, radius * g * (sin / cos))) : NaN;
  const vMax = bankSpeed(radius, g, sin, cos, mu, 1);
  const vMin = bankSpeed(radius, g, sin, cos, mu, -1);
  const limit = Math.max(mu, 0) * Math.max(N, 0);
  const holds = Number.isFinite(f) && Math.abs(f) <= limit + 1e-8 * Math.max(1, Math.abs(N));
  let regime = 'holds';
  if (!holds) regime = f > 0 ? 'slides up' : 'slides down';
  return { N, f, holds, vDesign, vMin, vMax, an, regime };
}

/** sign +1 is the upper speed (friction down the bank). sign −1 is the lower speed. */
function bankSpeed(radius, g, sin, cos, mu, sign) {
  if (!(radius > 0)) return NaN;
  const num = sin + sign * mu * cos;
  const den = cos - sign * mu * sin;
  if (den <= 1e-12) return Infinity;
  if (num <= 0) return 0;
  return Math.sqrt(radius * g * (num / den));
}

/**
 * Vehicle in a vertical loop. φ is measured from the bottom. `N` is positive
 * toward the centre. Speed comes from energy, with the bottom as the height zero.
 * `lost` means the vehicle cannot reach that angle.
 */
export function verticalLoop({ mass, radius, speedBottom, phiDeg, g = G }) {
  const phi = phiDeg * DEG;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const drop = radius * (1 - cos);
  const v2 = speedBottom * speedBottom - 2 * g * drop;
  const lost = v2 < -1e-8;
  const speed = lost ? 0 : Math.sqrt(Math.max(0, v2));
  const an = radius > 0 && !lost ? Math.max(0, v2) / radius : 0;
  const N = lost ? 0 : mass * (an + g * cos);
  const at = -g * sin;
  return { N, speed, v2: lost ? 0 : v2, an, at, drop, lost, leaves: !lost && N < 0 };
}

/**
 * Collar on a smooth rod, spring along the rod. `x` is the stretch, positive
 * down the rod from the unstretched point. `a` is the acceleration down the rod.
 * `N` is the force from the rod.
 */
export function springCollar({ mass, k, x, thetaDeg, g = G }) {
  const th = thetaDeg * DEG;
  const spring = k * x;
  const a = g * Math.sin(th) - spring / mass;
  const N = mass * g * Math.cos(th);
  return { a, N, spring };
}

/**
 * What a bathroom scale reads under a person of mass m in an elevator with upward acceleration a.
 * The scale pushes up with N and gravity pulls down with mg, so N − mg = ma and N = m(g + a).
 * The scale reads N: more than the weight while the acceleration points up, less while it points
 * down, and zero in free fall (a = −g). `kg` is what a scale marked in kilograms shows, N/g.
 */
export function apparentWeight({ mass, a, g = G }) {
  const N = mass * (g + a);
  return { N: Math.max(0, N), kg: Math.max(0, N) / g, weight: mass * g, ratio: (g + a) / g };
}

/**
 * A crate on the flat bed of a truck that accelerates at aTruck. If it rides along, static friction
 * supplies all of m·aTruck. That is possible only while m·aTruck ≤ μs·m·g, so the crate slips once
 * aTruck > μs g. Then kinetic friction μk m g gives it μk g, less than the truck's, and it slides
 * back across the bed at aTruck − μk g.
 */
export function crateOnTruck({ mass, aTruck, mus, muk, g = G }) {
  const N = mass * g;
  const need = mass * Math.abs(aTruck);
  const slips = need > mus * N + 1e-9;
  const f = slips ? muk * N : need;
  const aCrate = slips ? Math.sign(aTruck) * muk * g : aTruck;
  return { N, f, slips, aCrate, aRelative: aCrate - aTruck, limit: mus * N };
}

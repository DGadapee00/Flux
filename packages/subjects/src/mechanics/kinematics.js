/**
 * Constant-acceleration kinematics, in one dimension and as a trajectory.
 *
 * Positions and velocities are the {x, y, z} vectors from vectors.js. +y is up.
 * Angles that cross the boundary of a function are degrees. g is a positive
 * number, the downward acceleration, and it defaults to the shared G.
 * Drag is left out: the acceleration is constant.
 */

import { G } from './constants.js';
import { add, mag, scale, sub, v } from './vectors.js';

const DEG = Math.PI / 180;

/** x = x0 + v t. */
export function constVelocity(x0, vel, t) {
  return add(x0, scale(vel, t));
}

/** x = x0 + v0 t + (1/2) a t² and v = v0 + a t, along one line. */
export function constAccel1D({ x0 = 0, v0 = 0, a = 0, t }) {
  return {
    x: x0 + v0 * t + 0.5 * a * t * t,
    v: v0 + a * t,
    a,
  };
}

/** Positive root of v² = v0² + 2 a Δx. NaN when that root is not real. */
export function speedFromDisplacement(v0, a, dx) {
  const v2 = v0 * v0 + 2 * a * dx;
  return v2 < -1e-12 ? NaN : Math.sqrt(Math.max(0, v2));
}

/** t = (v − v0) / a. NaN when a is zero and the speeds differ. */
export function timeAtSpeed(v0, a, vFinal) {
  if (Math.abs(a) < 1e-15) return Math.abs(vFinal - v0) < 1e-12 ? 0 : NaN;
  return (vFinal - v0) / a;
}

/** (r2 − r1) / (t2 − t1). */
export function averageVelocity(r1, r2, t1, t2) {
  const dt = t2 - t1;
  if (Math.abs(dt) < 1e-15) return v(NaN, NaN, NaN);
  return scale(sub(r2, r1), 1 / dt);
}

/** (v2 − v1) / (t2 − t1). */
export function averageAcceleration(v1, v2, t1, t2) {
  const dt = t2 - t1;
  if (Math.abs(dt) < 1e-15) return v(NaN, NaN, NaN);
  return scale(sub(v2, v1), 1 / dt);
}

/**
 * Later positive root of y(t) = yLand for constant vertical acceleration −g.
 * A start on the landing height is kept only when it is the only root.
 */
export function landingTime(vy0, g, y0, yLand) {
  const A = -0.5 * g;
  const B = vy0;
  const C = y0 - yLand;
  if (Math.abs(A) < 1e-15) {
    if (Math.abs(B) < 1e-15) return Math.abs(C) < 1e-9 ? 0 : NaN;
    const t = -C / B;
    return t >= -1e-9 ? Math.max(0, t) : NaN;
  }
  const disc = B * B - 4 * A * C;
  if (disc < -1e-9) return NaN;
  const s = Math.sqrt(Math.max(0, disc));
  const roots = [(-B + s) / (2 * A), (-B - s) / (2 * A)].filter((t) => t > 1e-8);
  if (roots.length) return Math.max(...roots);
  return Math.abs(C) < 1e-8 ? 0 : NaN;
}

/**
 * Flight under gravity (0, −g, 0). `range` is the x distance from the start to
 * the later crossing of y = yLand. `hMax` is the highest y on t ≥ 0.
 */
export function flight({ r0, v0, g = G, yLand = 0 }) {
  const accel = v(0, -g, 0);
  function state(t) {
    const r = add(add(r0, scale(v0, t)), scale(accel, 0.5 * t * t));
    const vel = add(v0, scale(accel, t));
    return {
      r,
      vel,
      x: r.x,
      y: r.y,
      z: r.z,
      vx: vel.x,
      vy: vel.y,
      vz: vel.z,
      speed: mag(vel),
    };
  }
  const tFlight = landingTime(v0.y, g, r0.y, yLand);
  const tApex = Math.abs(g) < 1e-15 ? NaN : v0.y / g;
  const apex = Number.isFinite(tApex) && tApex > 0 ? state(tApex) : state(0);
  const land = Number.isFinite(tFlight) ? state(tFlight) : null;
  return {
    state,
    tFlight,
    tApex,
    hMax: apex.y,
    range: land ? land.x - r0.x : NaN,
    land,
  };
}

/** Level or cliff launch in the vertical plane. thetaDeg is from +x toward +y. */
export function projectile({ v0, thetaDeg, g = G, x0 = 0, y0 = 0, yLand = 0 }) {
  const th = thetaDeg * DEG;
  return flight({
    r0: v(x0, y0, 0),
    v0: v(v0 * Math.cos(th), v0 * Math.sin(th), 0),
    g,
    yLand,
  });
}

/** Centripetal acceleration v²/r. */
export function centripetalAccel(speed, radius) {
  if (!(radius > 0)) return NaN;
  return (speed * speed) / radius;
}

/** Period of uniform circular motion, 2πr/v. */
export function circularPeriod(speed, radius) {
  if (!(speed > 0) || !(radius > 0)) return NaN;
  return (2 * Math.PI * radius) / speed;
}

/** Velocity of A as measured from B: v_A − v_B. */
export function relativeVelocity(vA, vB) {
  return sub(vA, vB);
}

/**
 * Work and mechanical energy. A speed is a magnitude. A force and a displacement
 * passed together are vectors, and the work is their dot product.
 */

import { G } from './constants.js';
import { dot } from './vectors.js';

const DEG = Math.PI / 180;

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

/** Work done by a spring between two stretches. Only the end stretches enter. */
export function springWork(k, start, end) {
  return 0.5 * k * (start * start - end * end);
}

/**
 * One slide of a collar on a straight rod. `x` increases down the rod from the
 * unstretched spring. `thetaDeg` is the rod above the horizontal. `mu` is kinetic
 * friction. The rod's normal is mg cosθ, and friction opposes the displacement
 * over the whole slide, which holds when the collar does not reverse on the way.
 */
export function collarTrip({ mass, k = 0, thetaDeg = 0, x1, x2, v1 = 0, mu = 0, g = G }) {
  if (!(mass > 0) || !Number.isFinite(x1) || !Number.isFinite(x2)) {
    return { spring: NaN, gravity: NaN, friction: NaN, normal: NaN, t1: NaN, t2: NaN, speed: NaN, reaches: false };
  }
  const spring = springWork(k, x1, x2);
  const gravity = mass * g * Math.sin(thetaDeg * DEG) * (x2 - x1);
  const normal = mass * g * Math.cos(thetaDeg * DEG);
  const friction = -Math.abs(mu) * Math.abs(normal) * Math.abs(x2 - x1);
  const t1 = kineticEnergy(mass, v1);
  const t2 = t1 + spring + gravity + friction;
  const reaches = t2 >= -1e-8;
  return {
    spring,
    gravity,
    friction,
    normal,
    t1,
    t2,
    speed: reaches ? Math.sqrt(Math.max(0, (2 * Math.max(0, t2)) / mass)) : 0,
    reaches,
  };
}

/**
 * Several slides, in order. The spring work collapses to the first and last
 * stretch. Friction adds every leg. The trip stops on the first leg that
 * cannot finish.
 */
export function collarPath({ mass, k = 0, thetaDeg = 0, points, v1 = 0, mu = 0, g = G }) {
  const direct = springWork(k, points[0], points[points.length - 1]);
  let speed = v1;
  let spring = 0;
  let gravity = 0;
  let friction = 0;
  let normal = 0;
  let distance = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const leg = collarTrip({ mass, k, thetaDeg, x1: points[i], x2: points[i + 1], v1: speed, mu, g });
    normal = leg.normal;
    if (!leg.reaches) {
      return { spring, gravity, friction, normal, distance, direct, speed: 0, reaches: false, t2: leg.t2 };
    }
    spring += leg.spring;
    gravity += leg.gravity;
    friction += leg.friction;
    distance += Math.abs(points[i + 1] - points[i]);
    speed = leg.speed;
  }
  return { spring, gravity, friction, normal, distance, direct, speed, reaches: true, t2: kineticEnergy(mass, speed) };
}

/**
 * Stretch at which a horizontal spring and kinetic friction stop a mass.
 * The spring is unstretched at x = 0 and the mass arrives with speed `v`.
 */
export function springStop({ mass, k, v, mu = 0, g = G }) {
  if (!(k > 0) || !(mass > 0) || !Number.isFinite(v)) return NaN;
  const B = (2 * Math.abs(mu) * mass * g) / k;
  const C = (mass * v * v) / k;
  return (-B + Math.sqrt(B * B + 4 * C)) / 2;
}

/** Gravity plus a spring anchored at `anchor`, with rest length `rest`. `y` is the height. */
export function pathPotential({ mass, g = G, k = 0, x, y, anchor = [0, 0], rest = 0 }) {
  const stretch = Math.hypot(x - anchor[0], y - anchor[1]) - rest;
  return gravitationalEnergy(mass, g, y) + springEnergy(k, stretch);
}

/** Work of the conservative forces between two positions. The path does not enter. */
export function conservativeWork(spec, a, b) {
  return pathPotential({ ...spec, x: a[0], y: a[1] }) - pathPotential({ ...spec, x: b[0], y: b[1] });
}

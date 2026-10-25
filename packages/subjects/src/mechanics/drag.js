/**
 * Drag: a body moving through a fluid along a straight line, pushed back by a force that grows with
 * its speed. Two models, as in OpenStax University Physics Vol. 1 §6.4:
 *
 *   linear     F = b v          (slow, small bodies; a boat coasting in water)
 *   quadratic  F = k v², k = ½ ρ C A   (people, cars, balls in air)
 *
 * SI throughout. `g` is positive and the fall is measured downward. Pure functions, no DOM.
 */

import { G } from './constants.js';

/** The drag constant k = ½ ρ C A of the quadratic model, in kg/m. */
export const dragConstant = ({ rho, C, A }) => 0.5 * rho * C * A;

/**
 * Terminal speed: the speed at which drag balances the weight, so a = 0.
 * Linear: b v_t = m g, so v_t = m g / b. Quadratic: k v_t² = m g, so v_t = √(m g / k) = √(2 m g / (ρ C A)).
 */
export function terminalSpeed({ m, g = G, b, k }) {
  if (b != null) return (m * g) / b;
  return Math.sqrt((m * g) / k);
}

/**
 * A fall from speed v0 against linear drag. m dv/dt = m g − b v. With τ = m/b and v_t = g τ,
 * separate and integrate: ln[(v_t − v)/(v_t − v0)] = −t/τ, so v = v_t + (v0 − v_t) e^(−t/τ).
 * Integrate again for the distance fallen: y = v_t t + (v0 − v_t) τ (1 − e^(−t/τ)).
 * In one τ from rest the body reaches 1 − 1/e = 63% of v_t.
 */
export function linearFall({ m, b, g = G, v0 = 0, t }) {
  const tau = m / b;
  const vt = g * tau;
  const e = Math.exp(-t / tau);
  return { v: vt + (v0 - vt) * e, y: vt * t + (v0 - vt) * tau * (1 - e), vt, tau, a: (g * tau - (vt + (v0 - vt) * e)) / tau };
}

/**
 * A fall from speed v0 against quadratic drag. m dv/dt = m g − k v², so dv/dt = g (1 − v²/v_t²).
 * Below v_t, v = v_t tanh(g t / v_t + atanh(v0/v_t)): it climbs toward v_t. Above v_t,
 * v = v_t coth(g t / v_t + acoth(v0/v_t)): it slows toward v_t. Integrating v dt gives the distance:
 * y = (v_t²/g) ln[cosh(u)/cosh(u0)] below, and (v_t²/g) ln[sinh(u)/sinh(u0)] above, with u = u0 + g t/v_t.
 */
export function quadraticFall({ m, k, g = G, v0 = 0, t }) {
  const vt = Math.sqrt((m * g) / k);
  const s = (g * t) / vt;
  const r = v0 / vt;
  let v;
  let y;
  if (Math.abs(r - 1) < 1e-12) {
    v = vt;
    y = vt * t;
  } else if (r < 1) {
    const u0 = Math.atanh(r);
    v = vt * Math.tanh(u0 + s);
    y = ((vt * vt) / g) * (logCosh(u0 + s) - logCosh(u0));
  } else {
    const u0 = Math.atanh(1 / r);
    v = vt / Math.tanh(u0 + s);
    y = ((vt * vt) / g) * (logSinh(u0 + s) - logSinh(u0));
  }
  return { v, y, vt, a: g * (1 - (v * v) / (vt * vt)) };
}

/** ln cosh x without overflow for large x. */
function logCosh(x) {
  const a = Math.abs(x);
  return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2;
}

/** ln sinh x for x > 0, without overflow. */
function logSinh(x) {
  return x + Math.log1p(-Math.exp(-2 * x)) - Math.LN2;
}

/**
 * A body coasting against linear drag with no other force, such as a boat whose motor stops.
 * m dv/dt = −b v gives v = v0 e^(−t/τ) and x = v0 τ (1 − e^(−t/τ)); it never passes x_max = v0 τ.
 */
export function linearCoast({ v0, tau, t }) {
  const e = Math.exp(-t / tau);
  return { v: v0 * e, x: v0 * tau * (1 - e), xMax: v0 * tau };
}

/**
 * The top of a vertical launch at v0 against quadratic drag. Going up, drag and weight both point
 * down: m v dv/dy = −(m g + k v²). Separate and integrate from v0 to 0:
 * h = (m / 2k) ln(1 + k v0² / (m g)). With k → 0 this tends to v0²/(2g).
 */
export function quadraticRiseHeight({ m, k, g = G, v0 }) {
  return (m / (2 * k)) * Math.log1p((k * v0 * v0) / (m * g));
}

/**
 * Classical fourth-order Runge–Kutta for a body on a line: dy/dt = v, dv/dt = acc(v, t).
 * Returns the state at t1. A second method for every closed form above.
 */
export function rk4Line(acc, { y0 = 0, v0 = 0, t1, steps = 2000 }) {
  const h = t1 / steps;
  let y = y0;
  let v = v0;
  let t = 0;
  for (let i = 0; i < steps; i += 1) {
    const k1v = acc(v, t);
    const k1y = v;
    const k2v = acc(v + 0.5 * h * k1v, t + 0.5 * h);
    const k2y = v + 0.5 * h * k1v;
    const k3v = acc(v + 0.5 * h * k2v, t + 0.5 * h);
    const k3y = v + 0.5 * h * k2v;
    const k4v = acc(v + h * k3v, t + h);
    const k4y = v + h * k3v;
    v += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    y += (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y);
    t += h;
  }
  return { y, v };
}

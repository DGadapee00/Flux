/**
 * A body stopped by a short force pulse: a headform landing on an anvil through a helmet's liner
 * (Hibbeler §15.1). The contact force F(t) acts for τ seconds; gravity acts throughout.
 *
 * Impulse and momentum, up positive, from −v0 (falling) to +e·v0 (rebound):
 *   ∫F dt − m g τ = m(1 + e) v0.
 * The pulse's shape then sets its peak. For a half-sine, ∫F dt = 2F_pk τ/π; for a square pulse,
 * F_pk τ. The same impulse spread over a longer time, or a flatter shape, means a smaller peak.
 *
 * Pure functions, SI. Down is negative.
 */
import { G } from './constants.js';

/** ∫F dt over the pulse as a multiple of F_pk τ. */
export const SHAPE = { 'half-sine': 2 / Math.PI, square: 1 };

/** F(t) / F_pk, 0 ≤ t ≤ τ. */
export function shapeAt(shape, t, tau) {
  // A grid point a rounding error past τ still belongs to the pulse.
  if (t < 0 || t > tau * (1 + 1e-9)) return 0;
  return shape === 'square' ? 1 : Math.sin((Math.PI * t) / tau);
}

/**
 * The pulse that takes a body of mass m from −v0 to +e·v0 in τ: its impulse, peak force, peak
 * acceleration in g (contact force over weight), and mean force.
 */
export function stopPulse({ m, v0, e = 0, tau, shape = 'half-sine', g = G }) {
  const J = m * (1 + e) * v0 + m * g * tau;
  const Fpk = J / (SHAPE[shape] * tau);
  return { J, Fpk, gPeak: Fpk / (m * g), gMean: J / (tau * m * g), Fmean: J / tau };
}

/** The shortest pulse of a shape that keeps the peak at or under `limitG`. */
export function minDuration({ v0, e = 0, shape = 'half-sine', limitG, g = G }) {
  // F_pk = [m(1+e)v0 + m g τ]/(k τ) ≤ limitG m g  ⇒  τ ≥ (1+e)v0 / (g (k limitG − 1)).
  const k = SHAPE[shape];
  return ((1 + e) * v0) / (g * (k * limitG - 1));
}

/**
 * Speed and position through the pulse in closed form. With A = F_pk/m,
 * half-sine: v = −v0 + (Aτ/π)(1 − cos πt/τ) − g t, x = −v0 t + (Aτ/π)(t − (τ/π) sin πt/τ) − ½ g t²;
 * square:    v = −v0 + (A − g) t,                    x = −v0 t + ½ (A − g) t².
 */
export function motionAt({ m, v0, e = 0, tau, shape = 'half-sine', g = G }, t) {
  const A = stopPulse({ m, v0, e, tau, shape, g }).Fpk / m;
  const s = Math.min(Math.max(t, 0), tau);
  if (shape === 'square') return { v: -v0 + (A - g) * s, x: -v0 * s + 0.5 * (A - g) * s * s };
  const w = Math.PI / tau;
  return {
    v: -v0 + (A / w) * (1 - Math.cos(w * s)) - g * s,
    x: -v0 * s + (A / w) * (s - Math.sin(w * s) / w) - 0.5 * g * s * s,
  };
}

/** The crush: how far the body travels down before it stops, from the closed form. */
export function crushDepth(spec) {
  let lo = 0;
  let hi = spec.tau;
  for (let i = 0; i < 100; i++) {
    const mid = 0.5 * (lo + hi);
    if (motionAt(spec, mid).v < 0) lo = mid;
    else hi = mid;
  }
  const t0 = 0.5 * (lo + hi);
  return { crush: -motionAt(spec, t0).x, tCrush: t0 };
}

/**
 * The second method: RK4 on m a = F(t) − m g, from −v0, with no closed form used.
 * Returns the speed at the end of the pulse and the deepest point reached.
 */
export function stopPulseNumeric({ m, v0, e = 0, tau, shape = 'half-sine', g = G, steps = 4000 }) {
  const { Fpk } = stopPulse({ m, v0, e, tau, shape, g });
  const acc = (t) => (Fpk * shapeAt(shape, t, tau)) / m - g;
  const h = tau / steps;
  let x = 0;
  let v = -v0;
  let xMin = 0;
  for (let i = 0; i < steps; i++) {
    const t = i * h;
    const k1x = v;
    const k1v = acc(t);
    const k2x = v + 0.5 * h * k1v;
    const k2v = acc(t + 0.5 * h);
    const k3x = v + 0.5 * h * k2v;
    const k3v = k2v;
    const k4x = v + h * k3v;
    const k4v = acc(t + h);
    const xNext = x + (h / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    const vNext = v + (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    // The lowest point falls between grid points: where v crosses zero, slowing at about k1v.
    if (v < 0 && vNext >= 0 && k1v > 0) xMin = Math.min(xMin, x - (v * v) / (2 * k1v));
    x = xNext;
    v = vNext;
    if (x < xMin) xMin = x;
  }
  return { vEnd: v, crush: -xMin };
}

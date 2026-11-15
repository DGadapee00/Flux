/**
 * Tracking through a pass: range, range rate and the Doppler shift a ground station sees. Our own
 * model.
 *
 * A craft on a circular orbit of radius a passes straight over a station on a sphere of radius R;
 * Earth's turning is left out. With θ = n t the angle from overhead and n = √(μ/a³), the range is
 *   ρ = √(R² + a² − 2Ra cos θ),   ρ̇ = R a n sin θ / ρ,
 * and the station sees the craft at elevation ε with sin ε = (a cos θ − R)/ρ. The carrier f arrives
 * shifted by −f ρ̇/c one way; a two-way coherent link, which turns the uplink around, doubles it.
 * The shift is largest at the edge of the pass and changes fastest overhead, where
 * dρ̇/dt = R a n²/(a − R). The two-way light time 2ρ/c gives the range (MIT 16.851, Lecture 20).
 *
 * Second method: propagate the craft by fourth-order Runge–Kutta from overhead, and find the range
 * rate as the relative velocity projected on the line of sight.
 */
import { EARTH } from './passes.js';

export const C_LIGHT = 299792.458; // km/s

/** Closed form at angle θ from overhead. */
export function trackAt(theta, { hkm }) {
  const R = EARTH.R;
  const a = R + hkm;
  const n = Math.sqrt(EARTH.mu / a ** 3);
  const rho = Math.sqrt(R * R + a * a - 2 * R * a * Math.cos(theta));
  return { rho, rhoDot: (R * a * n * Math.sin(theta)) / rho, el: Math.asin((a * Math.cos(theta) - R) / rho), n };
}

/** The angle from overhead at which the craft sits at elevation ε (degrees). */
export function edgeAngle({ hkm, eps }) {
  const R = EARTH.R;
  const e = (eps * Math.PI) / 180;
  return Math.acos((R / (R + hkm)) * Math.cos(e)) - e;
}

/** Closed form: the pass's key numbers for a carrier f (MHz). */
export function dopplerClosed({ hkm, eps, fMHz }) {
  const R = EARTH.R;
  const a = R + hkm;
  const lam = edgeAngle({ hkm, eps });
  const edge = trackAt(lam, { hkm });
  const n = edge.n;
  const f = fMHz * 1e6;
  return {
    lam,
    duration: (2 * lam) / n,
    rhoEdge: edge.rho,
    rhoMin: hkm,
    rateEdge: edge.rhoDot,
    shiftEdge: (f * edge.rhoDot) / C_LIGHT, // Hz, one way
    slope: (f * R * a * n * n) / (a - R) / C_LIGHT, // Hz/s at closest approach
    lightEdge: (2 * edge.rho) / C_LIGHT, // s, two way
    lightMin: (2 * hkm) / C_LIGHT,
  };
}

/** The Doppler curve over the pass: [seconds from overhead, kHz shift one way]. */
export function dopplerCurve({ hkm, eps, fMHz }, points = 121) {
  const lam = edgeAngle({ hkm, eps });
  const n = trackAt(0, { hkm }).n;
  const f = fMHz * 1e6;
  return Array.from({ length: points }, (_, i) => {
    const th = -lam + (2 * lam * i) / (points - 1);
    const t = trackAt(th, { hkm });
    return [th / n, (-f * t.rhoDot) / C_LIGHT / 1e3, t.rho];
  });
}

/**
 * Second method: Runge–Kutta from overhead to the pass's edge, with the range rate as the relative
 * velocity on the line of sight, and the slope overhead by a central difference of that rate.
 */
export function dopplerNumeric({ hkm, eps, fMHz }, steps = 4000) {
  const { R, mu } = EARTH;
  const a = R + hkm;
  const n = Math.sqrt(mu / a ** 3);
  const tEdge = edgeAngle({ hkm, eps }) / n;
  const f = fMHz * 1e6;
  const acc = (x, y) => {
    const r3 = Math.hypot(x, y) ** 3;
    return [(-mu * x) / r3, (-mu * y) / r3];
  };
  const rate = (s) => {
    const dx = s[0] - R;
    const dy = s[1];
    return (dx * s[2] + dy * s[3]) / Math.hypot(dx, dy);
  };
  const step = (s, h) => {
    const d = (q) => [q[2], q[3], ...acc(q[0], q[1])];
    const k1 = d(s);
    const k2 = d(s.map((v, i) => v + (h / 2) * k1[i]));
    const k3 = d(s.map((v, i) => v + (h / 2) * k2[i]));
    const k4 = d(s.map((v, i) => v + h * k3[i]));
    return s.map((v, i) => v + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  // Station at (R, 0); the craft overhead at (a, 0), moving along +y.
  const start = [a, 0, 0, Math.sqrt(mu / a)];
  let s = start;
  const h = tEdge / steps;
  for (let i = 0; i < steps; i++) s = step(s, h);
  const rhoEdge = Math.hypot(s[0] - R, s[1]);
  const rateEdge = rate(s);
  const dt = 0.05;
  const ahead = step(start, dt);
  const behind = step(start, -dt);
  const slopeRate = (rate(ahead) - rate(behind)) / (2 * dt);
  return { rhoEdge, rateEdge, shiftEdge: (f * rateEdge) / C_LIGHT, slope: (f * slopeRate) / C_LIGHT };
}

/** Both methods and their relative gap on the range, rate and slope. */
export function dopplerChecked(state) {
  const c = dopplerClosed(state);
  const m = dopplerNumeric(state);
  const gap = Math.max(Math.abs(m.rhoEdge - c.rhoEdge) / c.rhoEdge, Math.abs(m.rateEdge - c.rateEdge) / c.rateEdge, Math.abs(m.slope - c.slope) / c.slope);
  return { ...c, numRate: m.rateEdge, numSlope: m.slope, curve: dopplerCurve(state), gap };
}

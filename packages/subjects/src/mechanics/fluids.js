/**
 * Hydrostatics, buoyancy, continuity, Bernoulli, Torricelli, and a pipe-flow check.
 * SI throughout. `g` is positive and depth is measured downward from the free surface.
 * OpenStax University Physics Vol. 1, chapter 14, supplies the relations. The numbers
 * are computed here. Pure functions, no DOM. EML 3015 can reuse this file.
 */
import { G } from './constants.js';

/** Gauge pressure under a depth h of still fluid: the weight of the column divided by its area. */
export function gaugePressure(rho, h, g = G) {
  return rho * g * h;
}

/** Absolute pressure: the pressure on the free surface plus the gauge pressure. */
export function absolutePressure(p0, rho, h, g = G) {
  return p0 + gaugePressure(rho, h, g);
}

/**
 * Average pressure on a vertical wall, and the force. Pressure grows linearly with depth,
 * so the average is the value at half the depth. The area is depth times width.
 */
export function wallForce(rho, depth, width, g = G) {
  const p = gaugePressure(rho, depth / 2, g);
  const A = depth * width;
  return { p, A, F: p * A };
}

/**
 * The same force as a sum of thin horizontal slices. Midpoint rule. A linear pressure makes
 * each slice exact, so the sum is the closed form up to roundoff.
 */
export function wallForceSlices(rho, depth, width, g = G, n = 8000) {
  const dy = depth / n;
  let F = 0;
  for (let i = 0; i < n; i += 1) {
    const y = (i + 0.5) * dy;
    F += rho * g * y * width * dy;
  }
  return F;
}

/** Column pressure built by stacking slices, each of weight rho g dh times the area, then divided by the area. */
export function columnPressure(rho, h, g = G, n = 4000) {
  const dh = h / n;
  let p = 0;
  for (let i = 0; i < n; i += 1) p += rho * g * dh;
  return p;
}

/** Area of a circle from its diameter. */
export function circleArea(diameter) {
  const r = diameter / 2;
  return Math.PI * r * r;
}

/**
 * Pascal: the pressure is the same throughout a static liquid, so F2/A2 = F1/A1.
 * Diameters may be in any one unit. The ratio is what matters.
 */
export function hydraulicForce(F1, d1, d2) {
  return F1 * (d2 / d1) ** 2;
}

/**
 * Incompressible fluid: the volume pushed in equals the volume pushed out, A1 x1 = A2 x2.
 * The work in equals the work out.
 */
export function hydraulicStroke(F1, d1, d2, x1) {
  const F2 = hydraulicForce(F1, d1, d2);
  const x2 = x1 * (d1 / d2) ** 2;
  return { F2, x2, W: F1 * x1 };
}

/** Two liquids in an open U-tube. The interface balances: rho1 h1 = rho2 h2. */
export function uTubeHeight(rho1, rho2, h2) {
  const h1 = (rho2 / rho1) * h2;
  return { h1, diff: h2 - h1 };
}

/** Weight of the displaced fluid. */
export function buoyantForce(rhoFluid, volume, g = G) {
  return rhoFluid * volume * g;
}

/**
 * Floating: the submerged fraction is the density ratio. Above 1 the object sinks and the
 * displaced volume is the whole object.
 */
export function submergedFraction(rhoObj, rhoFluid) {
  return Math.min(1, rhoObj / rhoFluid);
}

/** Pressure integrated over the top and bottom of a vertical cylinder. Sideways forces cancel. */
export function cylinderBuoyancy(rhoFluid, area, height, submerged, g = G) {
  const draft = submerged * height;
  const bottom = gaugePressure(rhoFluid, draft, g) * area;
  const top = submerged >= 1 ? gaugePressure(rhoFluid, draft - height, g) * area : 0;
  return bottom - top;
}

/** Volume flow Q = A v. */
export function flowSpeed(Q, area) {
  return Q / area;
}

/** Bernoulli's sum, energy per unit volume. */
export function bernoulli(p, rho, v, h, g = G) {
  return p + 0.5 * rho * v * v + rho * g * h;
}

/**
 * Pressure at station 2 from a known station 1. The two stations share the density.
 * A negative result is a gauge pressure below the zero of p1.
 */
export function pressureDownstream({ p1, v1, h1, v2, h2, rho, g = G }) {
  return p1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * g * (h1 - h2);
}

/** Exit speed from a tank, from Bernoulli with equal pressures and a still surface. */
export function torricelli(h, g = G) {
  return Math.sqrt(2 * g * h);
}

/**
 * Water level in a tank with a small hole. The closed form comes from separating
 * dh/dt = -(aHole/aTank) sqrt(2 g h). The check is RK4 of that same rate.
 */
export function tankLevel({ h0, aHole, aTank, g = G, t }) {
  const k = (aHole / aTank) * Math.sqrt(g / 2);
  const root = Math.sqrt(Math.max(h0, 0)) - k * t;
  const h = root > 0 ? root * root : 0;
  const steps = 4000;
  const dt = t / steps;
  let y = h0;
  const rate = (level) => (level <= 0 ? 0 : -(aHole / aTank) * Math.sqrt(2 * g * level));
  for (let i = 0; i < steps; i += 1) {
    const k1 = rate(y);
    const k2 = rate(y + 0.5 * dt * k1);
    const k3 = rate(y + 0.5 * dt * k2);
    const k4 = rate(y + dt * k3);
    y = Math.max(0, y + (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
  }
  return { h, hNum: y };
}

/** Poiseuille volume flow for a laminar pipe. dp is the pressure drop along length L. */
export function poiseuille({ dp, r, eta, L }) {
  return (dp * Math.PI * r ** 4) / (8 * eta * L);
}

/** Reynolds number with the diameter, N_R = 2 ρ v r / η, as the section writes it. */
export function reynolds({ rho, v, r, eta }) {
  return (2 * rho * v * r) / eta;
}

/** Largest mean speed that the section still calls laminar: N_R = 2000. */
export function laminarSpeedLimit({ rho, r, eta, limit = 2000 }) {
  return (limit * eta) / (2 * rho * r);
}

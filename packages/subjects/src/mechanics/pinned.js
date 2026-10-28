/**
 * A rigid body swinging about a fixed pin O in a vertical plane (Hibbeler §17.4), at any pose.
 *
 * Let r be the vector from O to the mass centre G, ω and α the body's angular velocity and
 * acceleration (counterclockwise positive), and I_O its moment about the pin. Moments about O give
 * I_O α = (r × W)_z = −m g r_x. The mass centre moves on a circle: a_G = α k × r − ω² r. Then the pin
 * supplies whatever the weight does not: O = m a_G − W.
 *
 * The body's motion in time comes from the same moment equation, I_O θ̈ = −m g r_x(θ), stepped by RK4.
 * Pure functions, SI, y up.
 */
import { G } from './constants.js';

const rot = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

/** The pin force, α and a_G for G at r from the pin, turning at ω. */
export function pinnedAt({ mass, IO, r, omega = 0, g = G }) {
  const [rx, ry] = r;
  const alpha = (-mass * g * rx) / IO;
  const ax = -alpha * ry - omega * omega * rx;
  const ay = alpha * rx - omega * omega * ry;
  const Ox = mass * ax;
  const Oy = mass * ay + mass * g;
  const rr = Math.hypot(rx, ry) || 1;
  // Tangential and normal parts of a_G: along k × r̂ and toward the pin.
  const at = alpha * rr;
  const an = omega * omega * rr;
  return { alpha, ax, ay, Ox, Oy, pin: Math.hypot(Ox, Oy), at, an, weight: mass * g };
}

/**
 * The swing from a release: G starts at r0, turning at ω0. Returns a sampler of the pose at time t:
 * the rotation φ from the release pose, ω, and r. Stepped by RK4 at `dt`.
 */
export function swing({ mass, IO, r0, omega0 = 0, g = G, tEnd = 6, dt = 1 / 400 }) {
  const acc = (phi) => (-mass * g * rot(r0, phi)[0]) / IO;
  const n = Math.ceil(tEnd / dt);
  const phis = new Float64Array(n + 1);
  const ws = new Float64Array(n + 1);
  let phi = 0;
  let w = omega0;
  phis[0] = phi;
  ws[0] = w;
  for (let i = 1; i <= n; i++) {
    const k1p = w;
    const k1w = acc(phi);
    const k2p = w + 0.5 * dt * k1w;
    const k2w = acc(phi + 0.5 * dt * k1p);
    const k3p = w + 0.5 * dt * k2w;
    const k3w = acc(phi + 0.5 * dt * k2p);
    const k4p = w + dt * k3w;
    const k4w = acc(phi + dt * k3p);
    phi += (dt / 6) * (k1p + 2 * k2p + 2 * k3p + k4p);
    w += (dt / 6) * (k1w + 2 * k2w + 2 * k3w + k4w);
    phis[i] = phi;
    ws[i] = w;
  }
  const at = (t) => {
    const u = Math.min(Math.max(t, 0), tEnd) / dt;
    const i = Math.min(Math.floor(u), n - 1);
    const f = u - i;
    const p = phis[i] + (phis[i + 1] - phis[i]) * f;
    const om = ws[i] + (ws[i + 1] - ws[i]) * f;
    return { phi: p, omega: om, r: rot(r0, p) };
  };
  return { at, tEnd, dt };
}

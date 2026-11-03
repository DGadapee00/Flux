/**
 * Newton's law of gravitation, circular orbits, and escape.
 * GRAV is the gravitational constant. The nearby G in constants.js is g, the
 * surface field 9.81 m/s², and the two are not the same number.
 * Potential energy is zero at infinity.
 */

export const GRAV = 6.6743e-11;

/** Magnitude G m1 m2 / r². */
export function gravityForce(m1, m2, r) {
  return (GRAV * m1 * m2) / (r * r);
}

/** Field G M / r², the acceleration of a test mass. */
export function gravityField(M, r) {
  return (GRAV * M) / (r * r);
}

/** −G m1 m2 / r. */
export function gravityEnergy(m1, m2, r) {
  return (-GRAV * m1 * m2) / r;
}

/** Speed that makes the total energy zero. */
export function escapeSpeed(M, r) {
  return Math.sqrt((2 * GRAV * M) / r);
}

/** Speed of a circular orbit. */
export function circularOrbitSpeed(M, r) {
  return Math.sqrt((GRAV * M) / r);
}

/** Period of a circular orbit. */
export function circularOrbitPeriod(M, r) {
  return 2 * Math.PI * Math.sqrt((r * r * r) / (GRAV * M));
}

/** Mechanical energy of a circular orbit, −G M m / (2 r). */
export function circularOrbitEnergy(m, M, r) {
  return (-GRAV * M * m) / (2 * r);
}

/** Mass of a sphere from the field g at its surface. */
export function massFromSurface(g, radius) {
  return (g * radius * radius) / GRAV;
}

/** Semi-major axis from Kepler's third law, T² = 4π² a³ / (G M). */
export function semiMajorAxis(M, period) {
  return Math.cbrt((GRAV * M * period * period) / (4 * Math.PI * Math.PI));
}

/** Central mass from a period and a semi-major axis. */
export function massFromPeriod(period, a) {
  return (4 * Math.PI * Math.PI * a * a * a) / (GRAV * period * period);
}

/**
 * A tangential launch at distance r. `speed` is the tangential speed.
 * Returns the specific energy, specific angular momentum, eccentricity, and
 * semi-major axis (0 when the path is not bound).
 */
export function conic(M, r, speed) {
  const mu = GRAV * M;
  const specE = 0.5 * speed * speed - mu / r;
  const h = r * speed;
  const e = Math.sqrt(Math.max(0, 1 + (2 * specE * h * h) / (mu * mu)));
  const bound = specE < 0;
  const a = bound ? -mu / (2 * specE) : 0;
  return { specE, h, e, bound, a, mu };
}

/** Solve Kepler’s equation M = E − e sin E. `mean` is in radians. */
export function eccentricFromMean(mean, e) {
  const turn = 2 * Math.PI;
  let M = ((mean % turn) + turn) % turn;
  if (M > Math.PI) M -= turn;
  let E = Math.abs(e) < 0.8 ? M : Math.PI * Math.sign(M || 1);
  for (let i = 0; i < 40; i += 1) {
    const step = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= step;
    if (Math.abs(step) < 1e-14) break;
  }
  return E;
}

/** True anomaly from the eccentric anomaly. Periapsis is zero. */
export function trueFromEccentric(E, e) {
  return Math.atan2(Math.sqrt(1 - e * e) * Math.sin(E), Math.cos(E) - e);
}

/** Eccentric anomaly from the true anomaly. */
export function eccentricFromTrue(nu, e) {
  return 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
}

/** Distance from the focus. Periapsis lies on the positive x-axis. */
export function ellipseRadius(a, e, nu) {
  return (a * (1 - e * e)) / (1 + e * Math.cos(nu));
}

/** Area of any wedge that lasts `frac` of the period. Equal areas make this independent of where it sits. */
export function wedgeArea(a, e, frac) {
  return Math.PI * a * a * Math.sqrt(1 - e * e) * frac;
}

function meanOfTrue(nu, e) {
  const E = eccentricFromTrue(nu, e);
  return E - e * Math.sin(E);
}

function arcBySpeed(a, e, nu0, frac, steps) {
  const M0 = meanOfTrue(nu0, e);
  const dM = (2 * Math.PI * frac) / steps;
  let arc = 0;
  for (let i = 0; i < steps; i += 1) {
    const E = eccentricFromMean(M0 + (i + 0.5) * dM, e);
    const r = ellipseRadius(a, e, trueFromEccentric(E, e));
    arc += Math.sqrt(Math.max(0, (2 / r - 1 / a) * a * a * a)) * dM;
  }
  return arc;
}

function arcByChord(a, e, nu0, frac, steps) {
  const M0 = meanOfTrue(nu0, e);
  const dM = (2 * Math.PI * frac) / steps;
  let arc = 0;
  let prev = null;
  for (let i = 0; i <= steps; i += 1) {
    const E = eccentricFromMean(M0 + i * dM, e);
    const nu = trueFromEccentric(E, e);
    const r = ellipseRadius(a, e, nu);
    const p = [r * Math.cos(nu), r * Math.sin(nu)];
    if (prev) arc += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
    prev = p;
  }
  return arc;
}

function richardson(fn, a, e, nu0, frac) {
  const coarse = fn(a, e, nu0, frac, 480);
  const fine = fn(a, e, nu0, frac, 960);
  return (4 * fine - coarse) / 3;
}

/** Arc length of a time wedge, from the speed along the ellipse. */
export function wedgeArc(a, e, nu0, frac) {
  return richardson(arcBySpeed, a, e, nu0, frac);
}

/** The same arc, from the chord lengths of the path. The two agree, and neither is the other. */
export function wedgeArcChord(a, e, nu0, frac) {
  return richardson(arcByChord, a, e, nu0, frac);
}

/**
 * Area a test mass sweeps about the focus, integrated by RK4.
 * The launch is at true anomaly `nu0` with the ellipse’s own velocity.
 */
export function sweptArea(M, a, e, nu0, frac, steps = 6000) {
  const mu = GRAV * M;
  const r0 = ellipseRadius(a, e, nu0);
  const h = Math.sqrt(Math.max(0, mu * a * (1 - e * e)));
  const vr = (mu / h) * e * Math.sin(nu0);
  const vt = h / r0;
  const c = Math.cos(nu0);
  const s = Math.sin(nu0);
  let x = r0 * c;
  let y = r0 * s;
  let vx = vr * c - vt * s;
  let vy = vr * s + vt * c;
  const period = 2 * Math.PI * Math.sqrt((a * a * a) / mu);
  const dt = (period * frac) / steps;
  let area = 0;
  const acc = (px, py) => {
    const r2 = px * px + py * py;
    const r = Math.sqrt(r2);
    const k = mu / (r2 * r);
    return [-k * px, -k * py];
  };
  for (let i = 0; i < steps; i += 1) {
    const [a1x, a1y] = acc(x, y);
    const k1x = vx;
    const k1y = vy;
    const [a2x, a2y] = acc(x + 0.5 * dt * k1x, y + 0.5 * dt * k1y);
    const k2x = vx + 0.5 * dt * a1x;
    const k2y = vy + 0.5 * dt * a1y;
    const [a3x, a3y] = acc(x + 0.5 * dt * k2x, y + 0.5 * dt * k2y);
    const k3x = vx + 0.5 * dt * a2x;
    const k3y = vy + 0.5 * dt * a2y;
    const [a4x, a4y] = acc(x + dt * k3x, y + dt * k3y);
    const k4x = vx + dt * a3x;
    const k4y = vy + dt * a3y;
    const nx = x + (dt * (k1x + 2 * k2x + 2 * k3x + k4x)) / 6;
    const ny = y + (dt * (k1y + 2 * k2y + 2 * k3y + k4y)) / 6;
    vx += (dt * (a1x + 2 * a2x + 2 * a3x + a4x)) / 6;
    vy += (dt * (a1y + 2 * a2y + 2 * a3y + a4y)) / 6;
    area += 0.5 * (x * ny - y * nx);
    x = nx;
    y = ny;
  }
  return area;
}

/** One RK4 step of a test mass in the field of a fixed central mass. Specific energy and h are the checks. */
export function rk4Central({ M, x, y, vx, vy, dt, steps }) {
  const mu = GRAV * M;
  const acc = (px, py) => {
    const r2 = px * px + py * py;
    const r = Math.sqrt(r2);
    const k = mu / (r2 * r);
    return [-k * px, -k * py];
  };
  let px = x;
  let py = y;
  let ux = vx;
  let uy = vy;
  for (let i = 0; i < steps; i += 1) {
    const [a1x, a1y] = acc(px, py);
    const k1x = ux;
    const k1y = uy;
    const [a2x, a2y] = acc(px + 0.5 * dt * k1x, py + 0.5 * dt * k1y);
    const k2x = ux + 0.5 * dt * a1x;
    const k2y = uy + 0.5 * dt * a1y;
    const [a3x, a3y] = acc(px + 0.5 * dt * k2x, py + 0.5 * dt * k2y);
    const k3x = ux + 0.5 * dt * a2x;
    const k3y = uy + 0.5 * dt * a2y;
    const [a4x, a4y] = acc(px + dt * k3x, py + dt * k3y);
    const k4x = ux + dt * a3x;
    const k4y = uy + dt * a3y;
    px += (dt * (k1x + 2 * k2x + 2 * k3x + k4x)) / 6;
    py += (dt * (k1y + 2 * k2y + 2 * k3y + k4y)) / 6;
    ux += (dt * (a1x + 2 * a2x + 2 * a3x + a4x)) / 6;
    uy += (dt * (a1y + 2 * a2y + 2 * a3y + a4y)) / 6;
  }
  const r = Math.hypot(px, py);
  const v = Math.hypot(ux, uy);
  return {
    x: px, y: py, vx: ux, vy: uy, r, v,
    h: px * uy - py * ux,
    specE: 0.5 * v * v - mu / r,
  };
}

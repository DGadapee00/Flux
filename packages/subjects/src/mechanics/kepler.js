/**
 * Elliptical orbits and Kepler's equation (the satellite's Orbit subsystem).
 *
 * A bound two-body orbit is an ellipse with the planet at one focus, semi-major axis a and
 * eccentricity e. The mean anomaly grows steadily, M = n t with n = √(μ/a³) and t measured from
 * perigee; the eccentric anomaly E solves Kepler's equation
 *   M = E − e sin E,
 * which has no closed-form solution, so it is solved by Newton's method. Then
 *   r = a(1 − e cos E),   tan(ν/2) = √((1 + e)/(1 − e)) tan(E/2),
 * and the speed follows from vis-viva, v² = μ(2/r − 1/a). The period is T = 2π√(a³/μ).
 *
 * The second method integrates the equations of motion, r̈ = −μ r/|r|³, from perigee by RK4 and
 * compares the position.
 */
export const MU_EARTH = 398600.4418; // km³/s²
export const R_EARTH = 6378.137; // km, equatorial

/** E from M and e by Newton's method, started at M (or π for high e). */
export function solveKepler(M, e) {
  let E = e < 0.8 ? M : Math.PI;
  let iterations = 0;
  for (let k = 0; k < 50; k++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    iterations++;
    if (Math.abs(dE) < 1e-15) break;
  }
  return { E, iterations };
}

/** The orbit from perigee and apogee altitudes (km) above a planet of radius R. */
export function orbitFromAltitudes(hp, ha, mu = MU_EARTH, R = R_EARTH) {
  const rp = R + hp;
  const ra = R + ha;
  const a = (rp + ra) / 2;
  const e = (ra - rp) / (ra + rp);
  return { rp, ra, a, e, T: 2 * Math.PI * Math.sqrt(a ** 3 / mu) };
}

/** Where the craft is at time t (s) after perigee: anomalies, radius, speed and position in the plane. */
export function kepler({ a, e, t, mu = MU_EARTH }) {
  const n = Math.sqrt(mu / a ** 3);
  const T = (2 * Math.PI) / n;
  const M = (n * t) % (2 * Math.PI);
  const { E, iterations } = solveKepler(M, e);
  const r = a * (1 - e * Math.cos(E));
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  const v = Math.sqrt(mu * (2 / r - 1 / a));
  return { n, T, M, E, nu: ((nu % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), r, v, x: r * Math.cos(nu), y: r * Math.sin(nu), iterations };
}

/** The same position by RK4 on r̈ = −μr/|r|³ from perigee, in steps of at most T/steps. */
export function integrate({ a, e, t, mu = MU_EARTH }, steps = 20000) {
  const rp = a * (1 - e);
  const vp = Math.sqrt((mu * (1 + e)) / rp);
  const T = 2 * Math.PI * Math.sqrt(a ** 3 / mu);
  const tt = t % T;
  const N = Math.max(1, Math.ceil((steps * tt) / T));
  const h = tt / N;
  let s = [rp, 0, 0, vp];
  const f = ([x, y, vx, vy]) => {
    const r3 = Math.hypot(x, y) ** 3;
    return [vx, vy, (-mu * x) / r3, (-mu * y) / r3];
  };
  for (let i = 0; i < N; i++) {
    const k1 = f(s);
    const k2 = f(s.map((v, j) => v + (h / 2) * k1[j]));
    const k3 = f(s.map((v, j) => v + (h / 2) * k2[j]));
    const k4 = f(s.map((v, j) => v + h * k3[j]));
    s = s.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
  }
  return { x: s[0], y: s[1] };
}

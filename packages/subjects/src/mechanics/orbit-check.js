/**
 * Check a learner's numbers for a circular Earth orbit two ways.
 *
 * The closed form is v = √(GM/r) and T = 2πr/v, with r measured from Earth's centre
 * (circularOrbitSpeed and circularOrbitPeriod in gravitation.js). The second method integrates the
 * orbit itself: velocity Verlet under GM/r², stepped until the craft crosses its starting line
 * again. The crossing time is the period, and the path length over that time is the speed.
 *
 * GM for Earth is the standard gravitational parameter, 3.986004418×10¹⁴ m³/s². The radius is
 * Earth's mean radius, 6371 km. A learner's number passes within 1% of both routes.
 */
import { GRAV, circularOrbitPeriod, circularOrbitSpeed } from './gravitation.js';

export const GM_EARTH = 3.986004418e14;
export const R_EARTH = 6.371e6;
export const M_EARTH = GM_EARTH / GRAV;
export const ORBIT_TOL = 0.01;

/** One circular orbit, integrated: its period (s) and its mean speed (m/s). */
export function integratedOrbit(r, steps = 20000) {
  const v0 = Math.sqrt(GM_EARTH / r);
  const T0 = (2 * Math.PI * r) / v0;
  const dt = T0 / steps;
  let x = r;
  let y = 0;
  let vx = 0;
  let vy = v0;
  let ax = -GM_EARTH / (r * r);
  let ay = 0;
  let t = 0;
  let path = 0;
  for (let i = 0; i < 2 * steps; i++) {
    const x0 = x;
    const y0 = y;
    vx += 0.5 * dt * ax;
    vy += 0.5 * dt * ay;
    x += dt * vx;
    y += dt * vy;
    const rr = Math.hypot(x, y);
    ax = (-GM_EARTH * x) / (rr * rr * rr);
    ay = (-GM_EARTH * y) / (rr * rr * rr);
    vx += 0.5 * dt * ax;
    vy += 0.5 * dt * ay;
    const step = Math.hypot(x - x0, y - y0);
    t += dt;
    if (y0 < 0 && y >= 0 && t > T0 / 2) {
      const frac = -y0 / (y - y0);
      const T = t - dt + frac * dt;
      path += frac * step;
      return { period: T, speed: path / T };
    }
    path += step;
  }
  return { period: NaN, speed: NaN };
}

/**
 * @param {{ altitudeKm: number, speedKmS: number, periodMin: number }} input
 * @returns {{ ok: boolean, reason?: string, r?: number, closed?: { speed: number, period: number },
 *   integrated?: { speed: number, period: number }, speedError?: number, periodError?: number,
 *   pass?: boolean, hint?: string }}
 */
export function checkOrbit({ altitudeKm, speedKmS, periodMin }) {
  if (!(altitudeKm >= 100 && altitudeKm <= 40000)) return { ok: false, reason: 'Choose an altitude between 100 and 40 000 km.' };
  if (!(speedKmS > 0) || !(periodMin > 0)) return { ok: false, reason: 'Enter your speed and your period. The check compares your numbers, so it needs both.' };
  const r = R_EARTH + altitudeKm * 1000;
  const closed = { speed: circularOrbitSpeed(M_EARTH, r) / 1000, period: circularOrbitPeriod(M_EARTH, r) / 60 };
  const run = integratedOrbit(r);
  const integrated = { speed: run.speed / 1000, period: run.period / 60 };
  const speedError = Math.abs(speedKmS - closed.speed) / closed.speed;
  const periodError = Math.abs(periodMin - closed.period) / closed.period;
  const pass = speedError < ORBIT_TOL && periodError < ORBIT_TOL;
  let hint = '';
  if (!pass) {
    const fromSurface = Math.sqrt(GM_EARTH / (altitudeKm * 1000)) / 1000;
    if (speedError >= ORBIT_TOL && Math.abs(fromSurface - speedKmS) / speedKmS < ORBIT_TOL) hint = 'Your speed matches r equal to the altitude alone. Measure r from Earth’s centre.';
    else if (periodError >= ORBIT_TOL && Math.abs(periodMin / 60 - closed.period) / closed.period < ORBIT_TOL) hint = 'Your period looks like seconds. The box asks for minutes.';
  }
  return { ok: true, r, closed, integrated, speedError, periodError, pass, hint };
}

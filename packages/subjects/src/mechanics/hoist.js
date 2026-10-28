/**
 * A traction elevator (Hibbeler §17.4): a car and a counterweight hang from one rope over a drive
 * sheave that turns about a fixed axis. The motor's torque M acts on the sheave.
 *
 * Take the car's acceleration a as positive upward; the counterweight then accelerates at a downward,
 * and the sheave at α = a/r, with no rope slip and an inextensible rope of negligible mass. The car
 * of mass m1 (empty car plus load) and the counterweight of mass m2 give
 *
 *   car:   T1 − m1 g = m1 a,         counterweight:   m2 g − T2 = m2 a,
 *   sheave (moments about its axle, I the sheave and the motor's rotor):   M − (T1 − T2) r = I a / r.
 *
 * So M = r[m1 (g + a) − m2 (g − a)] + I a/r = r (m1 − m2) g + (m1 + m2 + I/r²) a r.
 * The first term holds the out-of-balance load; the second accelerates every mass and the sheave.
 *
 * Elevator makers size the counterweight as the empty car plus 40 to 50% of the rated load, so the
 * motor works least near half load. Pure functions, SI.
 */
import { G } from './constants.js';

/** The counterweight: the empty car plus a share q of the rated load. */
export const counterweight = (mCar, rated, q = 0.45) => mCar + q * rated;

/** The torque and both rope tensions for a car acceleration a (up positive). */
export function hoist({ m1, m2, r, I, a, g = G }) {
  const T1 = m1 * (g + a);
  const T2 = m2 * (g - a);
  const M = (T1 - T2) * r + (I * a) / r;
  return { T1, T2, M, Msteady: r * (m1 - m2) * g, Minertia: (m1 + m2 + I / (r * r)) * a * r, alpha: a / r };
}

/** The car's acceleration under a motor torque M: the same three equations, solved for a. */
export function accelFrom({ m1, m2, r, I, M, g = G }) {
  return (M / r - (m1 - m2) * g) / (m1 + m2 + I / (r * r));
}

/**
 * The second method: the three free-body equations as a linear system in (a, T1, T2), solved by
 * Gaussian elimination, with no closed form used.
 */
export function hoistBySystem({ m1, m2, r, I, M, g = G }) {
  // Rows: car, counterweight, sheave. Columns: a, T1, T2 | right-hand side.
  const A = [
    [m1, -1, 0, -m1 * g],
    [m2, 0, 1, m2 * g],
    [I / r, r, -r, M],
  ];
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let i = c + 1; i < 3; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
    [A[c], A[p]] = [A[p], A[c]];
    for (let i = 0; i < 3; i++) {
      if (i === c) continue;
      const f = A[i][c] / A[c][c];
      for (let j = c; j < 4; j++) A[i][j] -= f * A[c][j];
    }
  }
  return { a: A[0][3] / A[0][0], T1: A[1][3] / A[1][1], T2: A[2][3] / A[2][2] };
}

/**
 * A run: accelerate at a from rest to v, cruise, and brake at a to rest, over a rise of h.
 * Returns the phase times and the position and velocity at time t (car up positive).
 */
export function runProfile({ a, v, h }) {
  const ta = v / a;
  const sa = 0.5 * a * ta * ta;
  // A short run never reaches v: it accelerates for half the rise and brakes for the rest.
  const short = 2 * sa > h;
  const t1 = short ? Math.sqrt(h / a) : ta;
  const vPeak = a * t1;
  const s1 = 0.5 * a * t1 * t1;
  const tc = short ? 0 : (h - 2 * sa) / v;
  const total = 2 * t1 + tc;
  const at = (t) => {
    if (t <= 0) return { y: 0, v: 0, acc: a };
    if (t < t1) return { y: 0.5 * a * t * t, v: a * t, acc: a };
    if (t < t1 + tc) return { y: s1 + vPeak * (t - t1), v: vPeak, acc: 0 };
    if (t < total) {
      const u = t - t1 - tc;
      return { y: s1 + vPeak * tc + vPeak * u - 0.5 * a * u * u, v: vPeak - a * u, acc: -a };
    }
    return { y: h, v: 0, acc: -a };
  };
  return { t1, tc, total, vPeak, at };
}

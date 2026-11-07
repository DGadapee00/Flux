/**
 * Orbit transfers and Δv (the satellite's Orbit subsystem).
 *
 * The vis-viva equation gives the speed at radius r on an orbit of semi-major axis a:
 *   v² = μ(2/r − 1/a).
 * A craft on a circle of radius r₁ that burns forward by Δv at one point stretches its orbit into an
 * ellipse with that point as perigee. A Hohmann transfer picks the burn that puts the apogee on the
 * target circle r₂, then burns again there to round the orbit out:
 *   Δv₁ = √(μ/r₁)(√(2r₂/(r₁ + r₂)) − 1),   Δv₂ = √(μ/r₂)(1 − √(2r₁/(r₁ + r₂))).
 * A forward burn always lengthens the period, so a craft that burns to catch one ahead on the same
 * circle falls further behind after an orbit.
 *
 * The second method integrates the trajectory after the first burn by RK4 out to apogee, and reads
 * the apogee radius and speed off it.
 */
import { MU_EARTH as MU, R_EARTH } from './kepler.js';

const TWO_PI = 2 * Math.PI;

/** The Hohmann transfer between circles of altitude h1 and h2 (km), and a first burn of `frac` of its Δv₁. */
export function transfer({ h1, h2, frac = 1 }) {
  const r1 = R_EARTH + h1;
  const r2 = R_EARTH + h2;
  const v1 = Math.sqrt(MU / r1);
  const v2 = Math.sqrt(MU / r2);
  const aT = (r1 + r2) / 2;
  const dv1 = v1 * (Math.sqrt((2 * r2) / (r1 + r2)) - 1);
  const dv2 = v2 * (1 - Math.sqrt((2 * r1) / (r1 + r2)));
  const tTransfer = Math.PI * Math.sqrt(aT ** 3 / MU);
  // The orbit after a burn of frac·Δv₁ at r₁: vis-viva gives its size, and r₁ is its perigee.
  const vb = v1 + frac * dv1;
  const a = 1 / (2 / r1 - (vb * vb) / MU);
  const bound = a > 0;
  const ra = bound ? 2 * a - r1 : null;
  const e = bound ? (ra - r1) / (ra + r1) : null;
  const T1 = TWO_PI * Math.sqrt(r1 ** 3 / MU);
  const T = bound ? TWO_PI * Math.sqrt(a ** 3 / MU) : null;
  const vApo = bound ? Math.sqrt(MU * (2 / ra - 1 / a)) : null;
  // One new orbit later the craft is back at the burn point, T − T1 later than a twin that stayed on
  // the circle would have been; the twin is that much time, v1(T − T1) of track, ahead.
  const lagTime = bound ? T - T1 : null;
  const lagKm = bound ? v1 * lagTime : null;
  return { r1, r2, v1, v2, aT, dv1, dv2, total: dv1 + dv2, tTransfer, vb, a: bound ? a : null, ra, e, T1, T, vApo, bound, lagTime, lagKm, behind: bound && T > T1 * (1 + 1e-12) };
}

/** RK4 from the burn point to apogee: the apogee radius and the speed there. */
export function integrateToApogee({ r1, vb, T }, steps = 20000) {
  const half = T / 2;
  const h = half / steps;
  let s = [r1, 0, 0, vb];
  const f = ([x, y, vx, vy]) => {
    const r3 = Math.hypot(x, y) ** 3;
    return [vx, vy, (-MU * x) / r3, (-MU * y) / r3];
  };
  for (let i = 0; i < steps; i++) {
    const k1 = f(s);
    const k2 = f(s.map((v, j) => v + (h / 2) * k1[j]));
    const k3 = f(s.map((v, j) => v + (h / 2) * k2[j]));
    const k4 = f(s.map((v, j) => v + h * k3[j]));
    s = s.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
  }
  return { ra: Math.hypot(s[0], s[1]), va: Math.hypot(s[2], s[3]) };
}

/** Both methods and the gap. The numeric Δv₂ is the circular speed at the integrated apogee minus the speed there. */
export function transferChecked(p) {
  const t = transfer(p);
  if (!t.bound) return { ...t, gap: 0 };
  const n = integrateToApogee(t);
  const dv2Num = Math.sqrt(MU / n.ra) - n.va;
  const dv2Closed = Math.sqrt(MU / t.ra) - t.vApo;
  const gap = Math.max(Math.abs(n.ra - t.ra) / t.ra, Math.abs(n.va - t.vApo) / t.vApo, Math.abs(dv2Num - dv2Closed) / Math.max(Math.abs(t.dv2), 1e-6));
  return { ...t, raNum: n.ra, vaNum: n.va, dv2Here: dv2Closed, dv2Num, gap };
}

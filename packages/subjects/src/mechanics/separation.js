/**
 * How fast two craft released together drift apart, and so how soon a tracking radar can tell them
 * apart. Our own model, after NASA's small spacecraft report, chapter 12.
 *
 * A deployer pushes a craft off with a small Δv. Relative to the deployer, on its circular orbit of
 * mean motion n, the craft follows the Clohessy–Wiltshire equations (x radial, y along-track, z
 * across the orbit). From the origin with velocity (ẋ₀, ẏ₀, ż₀):
 *   x = (ẋ₀/n) sin nt + (2ẏ₀/n)(1 − cos nt)
 *   y = (2ẋ₀/n)(cos nt − 1) + (ẏ₀/n)(4 sin nt − 3nt)
 *   z = (ż₀/n) sin nt.
 * Only an along-track push changes the period, so only it drifts away without limit, at 3ẏ₀; a
 * radial push never takes the craft more than 4ẋ₀/n along the track, and a push across the orbit
 * only 1 ż₀/n. Closed form: the first time the separation reaches the radar's resolution, from these
 * formulas. Second method: fly both orbits, two-body, by RK4, and compare the separation at that
 * moment.
 */
import { MU_EARTH, R_EARTH } from './kepler.js';

const MU = MU_EARTH * 1e9;
const DIRS = { along: [0, 1, 0], back: [0, -1, 0], radial: [1, 0, 0], cross: [0, 0, 1] };
export const DIRECTIONS = Object.freeze({ along: 'Along the track', back: 'Back along the track', radial: 'Radially out', cross: 'Across the orbit' });

/** The relative position (m) at time t (s), Clohessy–Wiltshire. */
export function cwPosition({ hkm, dv, dir }, t) {
  const r = (R_EARTH + hkm) * 1e3;
  const n = Math.sqrt(MU / r ** 3);
  const [ex, ey, ez] = DIRS[dir].map((c) => c * dv);
  const s = Math.sin(n * t);
  const c = Math.cos(n * t);
  return [(ex / n) * s + ((2 * ey) / n) * (1 - c), ((2 * ex) / n) * (c - 1) + (ey / n) * (4 * s - 3 * n * t), (ez / n) * s];
}

const norm = (v) => Math.hypot(...v);

/** The first time (s) a separation function reaches D (m) before tmax, by scan and bisection. */
function firstReach(sep, D, tmax, dt) {
  let prev = 0;
  for (let t = dt; t <= tmax; t += dt) {
    if (sep(t) >= D) {
      let lo = prev;
      let hi = t;
      for (let i = 0; i < 60; i++) {
        const mid = (lo + hi) / 2;
        if (sep(mid) >= D) hi = mid;
        else lo = mid;
      }
      return (lo + hi) / 2;
    }
    prev = t;
  }
  return null;
}

/** Closed form: separation history, the time to reach D km, and the bound for a non-drifting push. */
export function separationClosed({ hkm, dv, dir, Dkm, days }) {
  const r = (R_EARTH + hkm) * 1e3;
  const n = Math.sqrt(MU / r ** 3);
  const T = (2 * Math.PI) / n;
  const tmax = days * 86400;
  const sep = (t) => norm(cwPosition({ hkm, dv, dir }, t));
  const tReach = firstReach(sep, Dkm * 1e3, tmax, T / 200);
  const bound = dir === 'radial' ? (4 * dv) / n : dir === 'cross' ? dv / n : null;
  const trace = [];
  for (let i = 0; i <= 400; i++) {
    const t = (tmax * i) / 400;
    trace.push([t / 3600, sep(t) / 1e3]);
  }
  return { n, T, tReach, bound, drift: dir === 'along' || dir === 'back' ? 3 * dv : 0, trace };
}

/**
 * Second method: both orbits flown by RK4 through the window. Returns the first time the separation
 * reaches D, and the separation at a chosen time t* (interpolated within its step).
 */
export function separationFlown({ hkm, dv, dir, Dkm, days }, tStar) {
  const r = (R_EARTH + hkm) * 1e3;
  const v = Math.sqrt(MU / r);
  const n = v / r;
  const T = (2 * Math.PI) / n;
  // Deployer at (r, 0, 0) moving along +y; its local frame there: radial x, along-track y, cross z.
  const [ex, ey, ez] = DIRS[dir].map((c) => c * dv);
  let a = [r, 0, 0, 0, v, 0];
  let b = [r, 0, 0, ex, v + ey, ez];
  const f = ([x, y, z, vx, vy, vz]) => {
    const rr = Math.hypot(x, y, z);
    const g = -MU / rr ** 3;
    return [vx, vy, vz, g * x, g * y, g * z];
  };
  const step = (s, h) => {
    const k1 = f(s);
    const k2 = f(s.map((si, i) => si + (h / 2) * k1[i]));
    const k3 = f(s.map((si, i) => si + (h / 2) * k2[i]));
    const k4 = f(s.map((si, i) => si + h * k3[i]));
    return s.map((si, i) => si + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };
  const h = T / 500;
  const D = Dkm * 1e3;
  const tmax = days * 86400;
  let t = 0;
  let prevSep = 0;
  let tReach = null;
  let atStar = null;
  while (t < tmax) {
    const a2 = step(a, h);
    const b2 = step(b, h);
    const sep = Math.hypot(b2[0] - a2[0], b2[1] - a2[1], b2[2] - a2[2]);
    if (tReach === null && sep >= D) tReach = t + ((D - prevSep) / (sep - prevSep)) * h;
    if (atStar === null && tStar <= t + h) atStar = prevSep + ((tStar - t) / h) * (sep - prevSep);
    prevSep = sep;
    a = a2;
    b = b2;
    t += h;
  }
  return { tReach, atStar };
}

/** Both methods, with the number of ways to match N unidentified objects to their names. */
export function separationChecked(p) {
  const c = separationClosed(p);
  // Compare the two at the closed form's crossing, or at the window's end if it never crosses: the
  // separation there is well conditioned even where a crossing time is not.
  const tStar = c.tReach ?? p.days * 86400 * 0.999;
  const f = separationFlown(p, tStar);
  const closedAt = norm(cwPosition(p, tStar));
  // Relative to the largest separation in the window, so a moment near the swing's zero is fair.
  const peak = Math.max(...c.trace.map((q) => q[1] * 1e3), 1);
  const gap = Math.abs(f.atStar - closedAt) / peak;
  let lg = 0;
  for (let k = 2; k <= p.objects; k++) lg += Math.log10(k);
  return { ...c, flownReach: f.tReach, flownAt: f.atStar, closedAt, gap, log10Matches: lg };
}

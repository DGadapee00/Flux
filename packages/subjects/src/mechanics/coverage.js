/**
 * Ground station coverage: how much of the day a station sees a craft, and how long the craft goes
 * unseen. Our own model.
 *
 * A craft on a circular orbit of inclination i is in view of a station when its sub-satellite point
 * lies within the angle λ = arccos((R/r)cos ε) − ε of the station (passes.js). Over many days the
 * Earth turns under the orbit and the sub-satellite longitude is spread evenly, while its latitude β
 * spends time in proportion to cos β/(π√(sin²i − sin²β)). Spread over the sphere, that is a density
 * 1/(2π²√(sin²i − sin²β)) per steradian.
 *
 * Closed form: the long-run share of time in view is that density integrated over the station's cap.
 * With sin β = sin i sin u the integral becomes (1/2π²)∫ Δℓ(β(u)) du, where Δℓ is the cap's width in
 * longitude at latitude β, evaluated by Simpson's rule.
 * Second method: fly the orbit for many days, in steps of a few seconds, with the Earth turning
 * under it, and count the time in view. The run also gives what the average cannot: the passes a day
 * and the longest wait between contacts.
 */
import { EARTH } from './passes.js';

export const OMEGA_EARTH = 7.2921159e-5; // rad/s
const DEG = Math.PI / 180;

/** The visibility cap's half-angle (rad) for altitude h (km) and elevation mask ε (deg). */
export function capAngle(hkm, eps) {
  const e = eps * DEG;
  return Math.acos((EARTH.R / (EARTH.R + hkm)) * Math.cos(e)) - e;
}

/** The cap's width in longitude at latitude β, for a station at latitude φ and cap half-angle λ. */
function capWidth(beta, phi, lam) {
  const den = Math.cos(phi) * Math.cos(beta);
  const num = Math.cos(lam) - Math.sin(phi) * Math.sin(beta);
  if (Math.abs(den) < 1e-15) return num <= 0 ? 2 * Math.PI : 0;
  const x = num / den;
  if (x <= -1) return 2 * Math.PI;
  if (x >= 1) return 0;
  return 2 * Math.acos(x);
}

/** Closed form: the long-run share of time a station at latitude φ (deg) sees the craft. */
export function shareClosed({ hkm, eps, incl }, latDeg, n = 20000) {
  const lam = capAngle(hkm, eps);
  const phi = latDeg * DEG;
  const si = Math.sin(incl * DEG);
  // u from −π/2 to π/2 covers latitudes −i to i.
  const m = n % 2 ? n + 1 : n;
  const h = Math.PI / m;
  let s = 0;
  for (let k = 0; k <= m; k++) {
    const u = -Math.PI / 2 + k * h;
    const beta = Math.asin(si * Math.sin(u));
    s += (k === 0 || k === m ? 1 : k % 2 ? 4 : 2) * capWidth(beta, phi, lam);
  }
  return ((s * h) / 3) / (2 * Math.PI * Math.PI);
}

/**
 * Second method: fly the orbit. Stations are { lat, lon } in degrees. Returns each station's share,
 * the share in view of any, passes a day and the longest gap in hours.
 */
export function coverageSimulated({ hkm, eps, incl }, stations, days = 20, dt = 10) {
  const track = []; // the first day's ground track, [lon°, lat°], every minute
  const r = EARTH.R + hkm;
  const n = Math.sqrt(EARTH.mu / r ** 3);
  const lam = capAngle(hkm, eps);
  const cosLam = Math.cos(lam);
  const ci = Math.cos(incl * DEG);
  const si = Math.sin(incl * DEG);
  const st = stations.map((s) => ({ sl: Math.sin(s.lat * DEG), cl: Math.cos(s.lat * DEG), lon: s.lon * DEG }));
  const steps = Math.round((days * 86400) / dt);
  const inView = st.map(() => 0);
  let any = 0;
  let passes = 0;
  let wasAny = false;
  let gapStart = 0;
  let longest = 0;
  let firstContact = -1;
  for (let k = 0; k < steps; k++) {
    const t = k * dt;
    const u = n * t;
    // Position in the inertial frame, ascending node on the x axis.
    const x = Math.cos(u);
    const y = Math.sin(u) * ci;
    const z = Math.sin(u) * si;
    const lat = Math.asin(z);
    const lon = Math.atan2(y, x) - OMEGA_EARTH * t;
    if (t < 86400 && k % Math.round(60 / dt) === 0) track.push([((((lon / DEG + 180) % 360) + 360) % 360) - 180, lat / DEG]);
    const sl = Math.sin(lat);
    const cl = Math.cos(lat);
    let seen = false;
    st.forEach((s, j) => {
      const c = s.sl * sl + s.cl * cl * Math.cos(lon - s.lon);
      if (c >= cosLam) {
        inView[j]++;
        seen = true;
      }
    });
    if (seen) {
      any++;
      if (!wasAny) {
        passes++;
        if (firstContact < 0) firstContact = t;
        else longest = Math.max(longest, t - gapStart);
      }
    } else if (wasAny) gapStart = t;
    wasAny = seen;
  }
  return {
    shares: inView.map((v) => v / steps),
    anyShare: any / steps,
    passesPerDay: passes / days,
    longestGapH: longest / 3600,
    track,
  };
}

/** Both methods for a set of stations, with the worst gap between them on each station's share. */
export function coverageChecked(orbit, stations) {
  const closed = stations.map((s) => shareClosed(orbit, s.lat));
  const sim = coverageSimulated(orbit, stations);
  let gap = 0;
  closed.forEach((c, j) => {
    gap = Math.max(gap, Math.abs(sim.shares[j] - c) / Math.max(c, 0.02));
  });
  return { closed, ...sim, gap, minutesPerDay: closed.map((c) => c * 1440) };
}

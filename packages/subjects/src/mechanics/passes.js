/**
 * Eclipse and ground-station passes for a circular orbit (Build a satellite, Orbit).
 *
 * A satellite at altitude h circles at r = R + h with period T = 2π√(r³/μ). With the Sun in the orbit
 * plane and Earth's shadow taken as a cylinder of radius R, the satellite is in shadow over the arc
 * where it is behind Earth: an angle 2 arcsin(R/r), so the eclipse lasts
 *   t_e = T · arcsin(R/r)/π.
 * A ground station sees it above an elevation ε while the Earth-central angle from the station is
 * below λ = arccos((R/r) cos ε) − ε, so an overhead pass lasts t_p = T · λ/π. Higher orbits see a
 * station for longer; the eclipse barely changes in minutes, because a smaller share of a longer
 * orbit is in shadow.
 *
 * The second method integrates the two-body equations with Runge–Kutta from the station's zenith and
 * adds up the time steps spent in shadow and above the elevation mask. Earth's rotation is left out.
 */

export const EARTH = { R: 6371, mu: 398600.4418 };

export function passesClosed({ hkm, eps }) {
  const { R, mu } = EARTH;
  const r = R + hkm;
  const T = 2 * Math.PI * Math.sqrt((r * r * r) / mu);
  const fe = Math.asin(R / r) / Math.PI;
  const e = (eps * Math.PI) / 180;
  const lam = Math.acos((R / r) * Math.cos(e)) - e;
  return { r, T, Tmin: T / 60, fe, te: fe * T, temin: (fe * T) / 60, lam, tp: (lam / Math.PI) * T, tpmin: (lam / Math.PI) * T / 60, v: Math.sqrt(mu / r), rangeKm: 2 * lam * R };
}

/** RK4 on the two-body problem; Sun along −x so the shadow lies along +x; station at (R, 0). */
export function passesNumeric({ hkm, eps }, n = 20000) {
  const { R, mu } = EARTH;
  const c = passesClosed({ hkm, eps });
  const r0 = c.r;
  let s = [r0, 0, 0, c.v];
  const dt = c.T / n;
  const f = ([x, y, vx, vy]) => {
    const d3 = Math.hypot(x, y) ** 3;
    return [vx, vy, (-mu * x) / d3, (-mu * y) / d3];
  };
  const e = (eps * Math.PI) / 180;
  let shade = 0;
  let seen = 0;
  const test = ([x, y]) => {
    const inShade = x > 0 && Math.abs(y) < R;
    const dx = x - R;
    const el = Math.asin(dx / Math.hypot(dx, y));
    return [inShade ? 1 : 0, el >= e ? 1 : 0];
  };
  for (let i = 0; i < n; i++) {
    const a = test(s);
    const k1 = f(s);
    const k2 = f(s.map((v, j) => v + (dt / 2) * k1[j]));
    const k3 = f(s.map((v, j) => v + (dt / 2) * k2[j]));
    const k4 = f(s.map((v, j) => v + dt * k3[j]));
    s = s.map((v, j) => v + (dt / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    const b = test(s);
    shade += ((a[0] + b[0]) / 2) * dt;
    seen += ((a[1] + b[1]) / 2) * dt;
  }
  return { te: shade, tp: seen };
}

export function passesChecked(state) {
  const cf = passesClosed(state);
  const nu = passesNumeric(state);
  return { ...cf, teNum: nu.te, tpNum: nu.tp, gap: Math.max(Math.abs(nu.te - cf.te) / cf.te, Math.abs(nu.tp - cf.tp) / Math.max(cf.tp, 60)) };
}

/**
 * Two flow fields for the differential forms of the equations of motion. Our own derivations.
 *
 * Nozzle. One-dimensional flow through a duct whose area falls linearly, A(x) = A₀(1 − c x/L) with
 * c = 1 − 1/CR, fed at u₀(1 + r t). Then u(x, t) = u₀(1 + r t)/(1 − c x/L), and a particle's
 * acceleration is the material derivative
 *   Du/Dt = ∂u/∂t + u ∂u/∂x = u₀ r/(1 − c x/L) + u² c/(L(1 − c x/L)).
 * Steady flow (r = 0) still accelerates every particle: the second term. The path separates,
 * x − c x²/(2L) = u₀(t + r t²/2), which gives the time to reach any x. The second method tracks the
 * particle with RK4 and differences its speed in time.
 *
 * Bend. Flow round a bend of centre-line radius R and width w, mean speed V. Across curved
 * streamlines Euler's equation gives ∂p/∂r = ρu²/r. For a free vortex (u = K/r, the inviscid flow
 * into a bend) the rise from the inner to the outer wall is ρK²/2 (1/r₁² − 1/r₂²); for a uniform
 * profile (u = V) it is ρV² ln(r₂/r₁). The second method integrates ρu²/r across the channel by
 * Simpson's rule.
 */

/** Speed of the flow at x (m) and time t (s). */
export function nozzleSpeed({ u0, L, CR, ramp = 0 }, x, t = 0) {
  const c = 1 - 1 / CR;
  return (u0 * (1 + ramp * t)) / (1 - (c * x) / L);
}

/**
 * Closed form for a particle that enters (x = 0) at t = 0 and has reached x = xp.
 * Returns its time, speed, and the two parts of its acceleration.
 */
export function nozzleParticle({ u0, L, CR, ramp = 0 }, xp) {
  const c = 1 - 1 / CR;
  const S = xp - (c * xp * xp) / (2 * L);
  const t = ramp > 0 ? (-u0 + Math.sqrt(u0 * u0 + 2 * u0 * ramp * S)) / (u0 * ramp) : S / u0;
  const f = 1 - (c * xp) / L;
  const u = (u0 * (1 + ramp * t)) / f;
  const local = (u0 * ramp) / f;
  const convective = (u * u * c) / (L * f);
  return { t, u, local, convective, accel: local + convective };
}

/** Time for a particle to cross the whole nozzle, by the closed form. */
export const nozzleTransit = (p) => nozzleParticle(p, p.L).t;

/**
 * Second method: RK4 on dx/dt = u(x, t) from the inlet at t = 0, in `steps` steps per crossing.
 * Returns the time and speed where the particle passes xp, its acceleration there by a central
 * difference of its speed, and the positions at `marks` equal time intervals across the crossing.
 */
export function trackParticle(p, xp, { steps = 4000, marks = 0 } = {}) {
  const speed = (x, t) => nozzleSpeed(p, x, t);
  const guess = nozzleParticle(p, p.L).t;
  const dt = guess / steps;
  const rk4 = (x, t, h) => {
    const k1 = speed(x, t);
    const k2 = speed(x + (h / 2) * k1, t + h / 2);
    const k3 = speed(x + (h / 2) * k2, t + h / 2);
    const k4 = speed(x + h * k3, t + h);
    return x + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
  };
  let x = 0;
  let t = 0;
  let tp = NaN;
  for (let i = 0; i < steps * 4 && x < p.L; i++) {
    const nx = rk4(x, t, dt);
    if (Number.isNaN(tp) && nx >= xp) {
      // Inverse interpolation within the step, then one Newton refinement on the path.
      let s = (xp - x) / (nx - x);
      let xs = rk4(x, t, s * dt);
      s -= (xs - xp) / (speed(xs, t + s * dt) * dt);
      xs = rk4(x, t, s * dt);
      tp = t + s * dt;
      x = xs;
      t = tp;
      continue;
    }
    x = nx;
    t += dt;
  }
  if (Number.isNaN(tp)) tp = t;
  // The particle's speed at tp ± h, from its path.
  const h = dt / 4;
  const back = rk4(xp, tp, -h);
  const fwd = rk4(xp, tp, h);
  const accel = (speed(fwd, tp + h) - speed(back, tp - h)) / (2 * h);
  const out = { t: tp, u: speed(xp, tp), accel };
  if (marks > 0) {
    const pts = [];
    const T = nozzleTransit(p);
    let xm = 0;
    let tm = 0;
    const sub = Math.max(1, Math.round(steps / marks));
    const h2 = T / marks / sub;
    for (let k = 0; k <= marks; k++) {
      pts.push(Math.min(xm, p.L));
      for (let j = 0; j < sub; j++) {
        xm = rk4(xm, tm, h2);
        tm += h2;
      }
    }
    out.marks = pts;
  }
  return out;
}

/** Pressure rise across a bend, inner wall to outer, and the wall speeds. profile: 'vortex' or 'uniform'. */
export function bendPressure({ rho, V, R, w, profile }) {
  const r1 = R - w / 2;
  const r2 = R + w / 2;
  if (profile === 'uniform') {
    return { r1, r2, dp: rho * V * V * Math.log(r2 / r1), uIn: V, uOut: V, speed: () => V };
  }
  const K = (V * w) / Math.log(r2 / r1);
  return { r1, r2, K, dp: ((rho * K * K) / 2) * (1 / (r1 * r1) - 1 / (r2 * r2)), uIn: K / r1, uOut: K / r2, speed: (r) => K / r };
}

/** Second method: Simpson's rule on ∂p/∂r = ρu²/r from the inner wall, giving p(r) − p(r₁) at n + 1 radii. */
export function bendPressureSteps(p, n = 200) {
  const { r1, r2, speed } = bendPressure(p);
  const m = n % 2 ? n + 1 : n;
  const dr = (r2 - r1) / m;
  const f = (r) => (p.rho * speed(r) ** 2) / r;
  const out = [0];
  // Simpson's rule on each interval, so the pressure is known at every grid radius.
  let acc = 0;
  for (let i = 0; i < m; i++) {
    const a = r1 + i * dr;
    acc += (dr / 6) * (f(a) + 4 * f(a + dr / 2) + f(a + dr));
    out.push(acc);
  }
  return { r: out.map((_, i) => r1 + i * dr), p: out, dp: acc };
}

/**
 * Polar (cylindrical) components of velocity and acceleration in the plane.
 *
 * Position r = r e_r. The unit vectors turn with θ: de_r/dt = θ̇ e_θ and de_θ/dt = −θ̇ e_r.
 * Differentiate once: v = ṙ e_r + r θ̇ e_θ. Differentiate again and collect:
 *
 *   a_r = r̈ − r θ̇²        (the second term turns the radial line)
 *   a_θ = r θ̈ + 2 ṙ θ̇      (the 2ṙθ̇ term: sliding out along a turning line)
 *
 * Pure functions, SI, no DOM.
 */

/** v and a in polar components from r, θ and their time derivatives. */
export function polarComponents({ r, rd = 0, rdd = 0, thd = 0, thdd = 0 }) {
  const vr = rd;
  const vth = r * thd;
  const ar = rdd - r * thd * thd;
  const ath = r * thdd + 2 * rd * thd;
  return { vr, vth, ar, ath, v: Math.hypot(vr, vth), a: Math.hypot(ar, ath) };
}

/**
 * The second method: from r(t) and θ(t) alone, differentiate x = r cos θ and y = r sin θ
 * numerically (central differences) and project the results on e_r and e_θ at time t.
 */
export function polarNumeric(rOf, thOf, t, h = 1e-4) {
  const x = (s) => rOf(s) * Math.cos(thOf(s));
  const y = (s) => rOf(s) * Math.sin(thOf(s));
  const vx = (x(t + h) - x(t - h)) / (2 * h);
  const vy = (y(t + h) - y(t - h)) / (2 * h);
  const ax = (x(t + h) - 2 * x(t) + x(t - h)) / (h * h);
  const ay = (y(t + h) - 2 * y(t) + y(t - h)) / (h * h);
  const th = thOf(t);
  const c = Math.cos(th);
  const s = Math.sin(th);
  return {
    vr: vx * c + vy * s,
    vth: -vx * s + vy * c,
    ar: ax * c + ay * s,
    ath: -ax * s + ay * c,
    vx,
    vy,
    ax,
    ay,
  };
}

/**
 * A point moving along a straight line at constant velocity, seen from an origin a distance d off
 * the line: x = x0 + u t, y = d. Its acceleration is zero, yet r̈ and θ̈ are not.
 * r = √(x² + d²), ṙ = x u / r, r̈ = u² d² / r³, θ = atan2(d, x), θ̇ = −u d / r², θ̈ = 2 u² d x / r⁴.
 */
export function straightPass({ d, u, x0 = 0, t }) {
  const x = x0 + u * t;
  const r = Math.hypot(x, d);
  return {
    x,
    y: d,
    r,
    th: Math.atan2(d, x),
    rd: (x * u) / r,
    rdd: (u * u * d * d) / r ** 3,
    thd: (-u * d) / (r * r),
    thdd: (2 * u * u * d * x) / r ** 4,
  };
}

/**
 * Polar equations of motion (Hibbeler §13.6): the forces along e_r and e_θ that a path needs.
 * F_r = m a_r and F_θ = m a_θ.
 */
export function polarForces(m, motion) {
  const c = polarComponents(motion);
  return { Fr: m * c.ar, Fth: m * c.ath, ...c };
}

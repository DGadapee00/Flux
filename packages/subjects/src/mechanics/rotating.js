/**
 * Relative motion with rotating axes (Hibbeler §16.8), in the plane.
 *
 * Axes x–y fixed to a body that turns at Ω (counterclockwise positive), with its origin at A. A point
 * B at r (from A, measured in the turning axes) moves relative to them at v_rel and a_rel. Each unit
 * vector of the turning axes changes as di/dt = Ω × i, so differentiating r_B = r_A + r gives
 *
 *   v_B = v_A + Ω × r + v_rel
 *   a_B = a_A + Ω̇ × r + Ω × (Ω × r) + 2 Ω × v_rel + a_rel
 *
 * The term 2Ω × v_rel is the Coriolis acceleration: half from v_rel being turned by the axes, half
 * from Ω × r growing as the point moves out. Pure functions, SI, vectors as [x, y].
 */

const cross = (w, [x, y]) => [-w * y, w * x];
const add = (...vs) => vs.reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
const scale = (k, [x, y]) => [k * x, k * y];

/** The absolute velocity and acceleration of B, term by term. */
export function rotatingAxes({ vA = [0, 0], aA = [0, 0], W, Wd = 0, r, vRel = [0, 0], aRel = [0, 0] }) {
  const tangential = cross(Wd, r);
  const centripetal = scale(-W * W, r);
  const coriolis = scale(2, cross(W, vRel));
  return {
    v: add(vA, cross(W, r), vRel),
    a: add(aA, tangential, centripetal, coriolis, aRel),
    terms: { tangential, centripetal, coriolis, aRel, aA },
  };
}

/**
 * A crank-driven slotted rocker, the quick-return mechanism of a shaper. The rocker pivots at O,
 * the origin. The crank pivots at C = (0, d), has length r < d, turns at ω and α, and its pin P slides
 * in a slot along the rocker. φ is the crank's angle from the x axis.
 *
 * The pin's absolute motion comes from the crank: v_P = ω × CP, a_P = α × CP − ω² CP. On the
 * rocker's axes, with e along the slot and n across it, P is at ρ e with relative velocity v_rel e
 * and relative acceleration a_rel e. Matching the two descriptions:
 *   along n:  v_P·n = ρΩ,                    a_P·n = ρΩ̇ + 2Ωv_rel
 *   along e:  v_P·e = v_rel,                 a_P·e = a_rel − Ω²ρ
 */
export function slottedRocker({ r, d, phi, omega, alpha = 0 }) {
  const CP = [r * Math.cos(phi), r * Math.sin(phi)];
  const P = [CP[0], d + CP[1]];
  const rho = Math.hypot(P[0], P[1]);
  const e = [P[0] / rho, P[1] / rho];
  const n = [-e[1], e[0]];
  const vP = cross(omega, CP);
  const aP = add(cross(alpha, CP), scale(-omega * omega, CP));
  const dot = ([a, b], [c, dd]) => a * c + b * dd;
  const vRel = dot(vP, e);
  const W = dot(vP, n) / rho;
  const coriolis = 2 * W * vRel;
  const Wd = (dot(aP, n) - coriolis) / rho;
  const aRel = dot(aP, e) + W * W * rho;
  return {
    theta: Math.atan2(P[1], P[0]),
    P,
    rho,
    e,
    n,
    vP,
    aP,
    vRel,
    aRel,
    W,
    Wd,
    coriolis,
    // What Ω̇ would come out as with the Coriolis term left out.
    WdWithout: dot(aP, n) / rho,
  };
}

/** The second method: the rocker angle from the geometry alone, differentiated numerically in time. */
export function slottedRockerNumeric({ r, d, phi, omega, alpha = 0 }, h = 1e-4) {
  const ang = (t) => phi + omega * t + 0.5 * alpha * t * t;
  const theta = (t) => Math.atan2(d + r * Math.sin(ang(t)), r * Math.cos(ang(t)));
  const rho = (t) => Math.hypot(r * Math.cos(ang(t)), d + r * Math.sin(ang(t)));
  const unwrap = (a, ref) => a + 2 * Math.PI * Math.round((ref - a) / (2 * Math.PI));
  const t0 = theta(0);
  const tp = unwrap(theta(h), t0);
  const tm = unwrap(theta(-h), t0);
  return {
    W: (tp - tm) / (2 * h),
    Wd: (tp - 2 * t0 + tm) / (h * h),
    vRel: (rho(h) - rho(-h)) / (2 * h),
    aRel: (rho(h) - 2 * rho(0) + rho(-h)) / (h * h),
  };
}

/**
 * Constant-acceleration kinematics, in one dimension and as a trajectory.
 *
 * Positions and velocities are the {x, y, z} vectors from vectors.js. +y is up.
 * Angles that cross the boundary of a function are degrees. g is a positive
 * number, the downward acceleration, and it defaults to the shared G.
 * Drag is left out: the acceleration is constant.
 */

import { G } from './constants.js';
import { add, angle2D, dot, fromAngle2D, mag, scale, sub, v } from './vectors.js';

const DEG = Math.PI / 180;

/** x = x0 + v t. */
export function constVelocity(x0, vel, t) {
  return add(x0, scale(vel, t));
}

/** x = x0 + v0 t + (1/2) a t² and v = v0 + a t, along one line. */
export function constAccel1D({ x0 = 0, v0 = 0, a = 0, t }) {
  return {
    x: x0 + v0 * t + 0.5 * a * t * t,
    v: v0 + a * t,
    a,
  };
}

/**
 * Motion along a line when the acceleration is constant in each piece: `pieces` is a list of
 * { dt, a }. Within a piece v = v_start + a τ and x = x_start + v_start τ + (1/2) a τ², so the
 * knots (the piece boundaries) follow by carrying x and v forward. The velocity is continuous
 * across a knot, and so is the position.
 *
 * `distance` is the path length ∫|v| dt, not the displacement. v is linear in a piece, so it
 * changes sign at most once there, at τ = −v_start / a; the two legs are added as magnitudes.
 * `at(t)` gives { x, v, a } at a time (the last piece's acceleration holds at the end), and
 * `turns` lists the times v crosses zero.
 *
 * @param {{ x0?: number, v0?: number, pieces: { dt: number, a: number }[] }} spec
 */
export function piecewiseMotion({ x0 = 0, v0 = 0, pieces }) {
  const knots = [{ t: 0, x: x0, v: v0 }];
  const turns = [];
  let distance = 0;
  for (const { dt, a } of pieces) {
    const k = knots[knots.length - 1];
    const x1 = k.x + k.v * dt + 0.5 * a * dt * dt;
    const v1 = k.v + a * dt;
    if (a !== 0) {
      const tau = -k.v / a;
      if (tau > 1e-12 && tau < dt - 1e-12) {
        const xTurn = k.x + k.v * tau + 0.5 * a * tau * tau;
        turns.push(k.t + tau);
        distance += Math.abs(xTurn - k.x) + Math.abs(x1 - xTurn);
      } else distance += Math.abs(x1 - k.x);
    } else distance += Math.abs(x1 - k.x);
    knots.push({ t: k.t + dt, x: x1, v: v1 });
  }
  const duration = knots[knots.length - 1].t;
  const at = (t) => {
    const time = Math.min(Math.max(t, 0), duration);
    let i = 0;
    while (i < pieces.length - 1 && time > knots[i + 1].t) i += 1;
    const k = knots[i];
    const a = pieces[i].a;
    const tau = time - k.t;
    return { x: k.x + k.v * tau + 0.5 * a * tau * tau, v: k.v + a * tau, a };
  };
  const end = knots[knots.length - 1];
  return { knots, at, duration, turns, distance, displacement: end.x - x0 };
}

/**
 * Stopping a vehicle: the driver reacts for `tReact` at the old speed, then brakes at a constant
 * deceleration `a` (positive). Reaction distance v0 t_r; braking distance v0²/(2a), from
 * 0 = v0² − 2 a d; braking time v0/a.
 */
export function stoppingDistance({ v0, a, tReact = 0 }) {
  const reaction = v0 * tReact;
  const braking = (v0 * v0) / (2 * a);
  return { reaction, braking, total: reaction + braking, tBrake: v0 / a, tTotal: tReact + v0 / a };
}

/** Positive root of v² = v0² + 2 a Δx. NaN when that root is not real. */
export function speedFromDisplacement(v0, a, dx) {
  const v2 = v0 * v0 + 2 * a * dx;
  return v2 < -1e-12 ? NaN : Math.sqrt(Math.max(0, v2));
}

/** t = (v − v0) / a. NaN when a is zero and the speeds differ. */
export function timeAtSpeed(v0, a, vFinal) {
  if (Math.abs(a) < 1e-15) return Math.abs(vFinal - v0) < 1e-12 ? 0 : NaN;
  return (vFinal - v0) / a;
}

/** (r2 − r1) / (t2 − t1). */
export function averageVelocity(r1, r2, t1, t2) {
  const dt = t2 - t1;
  if (Math.abs(dt) < 1e-15) return v(NaN, NaN, NaN);
  return scale(sub(r2, r1), 1 / dt);
}

/** (v2 − v1) / (t2 − t1). */
export function averageAcceleration(v1, v2, t1, t2) {
  const dt = t2 - t1;
  if (Math.abs(dt) < 1e-15) return v(NaN, NaN, NaN);
  return scale(sub(v2, v1), 1 / dt);
}

/**
 * Later positive root of y(t) = yLand for constant vertical acceleration −g.
 * A start on the landing height is kept only when it is the only root.
 */
export function landingTime(vy0, g, y0, yLand) {
  const A = -0.5 * g;
  const B = vy0;
  const C = y0 - yLand;
  if (Math.abs(A) < 1e-15) {
    if (Math.abs(B) < 1e-15) return Math.abs(C) < 1e-9 ? 0 : NaN;
    const t = -C / B;
    return t >= -1e-9 ? Math.max(0, t) : NaN;
  }
  const disc = B * B - 4 * A * C;
  if (disc < -1e-9) return NaN;
  const s = Math.sqrt(Math.max(0, disc));
  const roots = [(-B + s) / (2 * A), (-B - s) / (2 * A)].filter((t) => t > 1e-8);
  if (roots.length) return Math.max(...roots);
  return Math.abs(C) < 1e-8 ? 0 : NaN;
}

/**
 * Flight under gravity (0, −g, 0). `range` is the x distance from the start to
 * the later crossing of y = yLand. `hMax` is the highest y on t ≥ 0.
 */
export function flight({ r0, v0, g = G, yLand = 0 }) {
  const accel = v(0, -g, 0);
  function state(t) {
    const r = add(add(r0, scale(v0, t)), scale(accel, 0.5 * t * t));
    const vel = add(v0, scale(accel, t));
    return {
      r,
      vel,
      x: r.x,
      y: r.y,
      z: r.z,
      vx: vel.x,
      vy: vel.y,
      vz: vel.z,
      speed: mag(vel),
    };
  }
  const tFlight = landingTime(v0.y, g, r0.y, yLand);
  const tApex = Math.abs(g) < 1e-15 ? NaN : v0.y / g;
  const apex = Number.isFinite(tApex) && tApex > 0 ? state(tApex) : state(0);
  const land = Number.isFinite(tFlight) ? state(tFlight) : null;
  return {
    state,
    tFlight,
    tApex,
    hMax: apex.y,
    range: land ? land.x - r0.x : NaN,
    land,
  };
}

/** Level or cliff launch in the vertical plane. thetaDeg is from +x toward +y. */
export function projectile({ v0, thetaDeg, g = G, x0 = 0, y0 = 0, yLand = 0 }) {
  const th = thetaDeg * DEG;
  return flight({
    r0: v(x0, y0, 0),
    v0: v(v0 * Math.cos(th), v0 * Math.sin(th), 0),
    g,
    yLand,
  });
}

/** Centripetal acceleration v²/r. */
export function centripetalAccel(speed, radius) {
  if (!(radius > 0)) return NaN;
  return (speed * speed) / radius;
}

/** Period of uniform circular motion, 2πr/v. */
export function circularPeriod(speed, radius) {
  if (!(speed > 0) || !(radius > 0)) return NaN;
  return (2 * Math.PI * radius) / speed;
}

/** Velocity of A as measured from B: v_A − v_B. */
export function relativeVelocity(vA, vB) {
  return sub(vA, vB);
}

/**
 * Circular motion at one instant: radius r, speed v, and the rate the speed changes, aT.
 *
 * The velocity stays tangent, so its direction turns at ω = v/r. In a short time dt it turns
 * through ω dt, and the velocity changes by v ω dt pointing at the centre. Dividing by dt gives the
 * centripetal acceleration a_c = vω = v²/r = ω²r. A changing speed adds aT along the tangent. The
 * two parts are perpendicular, so |a| = √(a_c² + aT²). The angle of a from the velocity is
 * atan2(a_c, aT): 90° when the speed is steady, less when speeding up, more when slowing down.
 */
export function circularMotion({ r, v, aT = 0 }) {
  if (!(r > 0)) return null;
  const omega = v / r;
  const ac = (v * v) / r;
  return {
    omega,
    ac,
    aT,
    alpha: aT / r,
    a: Math.hypot(ac, aT),
    angleFromV: Math.atan2(ac, aT) / DEG,
    period: Math.abs(v) > 0 ? (2 * Math.PI * r) / Math.abs(v) : Infinity,
  };
}

/**
 * The heading that keeps a craft's ground track along `trackDeg` in a wind or a current `wind`
 * (the velocity of the air or water over the ground). Angles are degrees counterclockwise from +x.
 *
 * Velocities add: v_ground = v_air + w. Split w along the track (û) and across it (n̂). The ground
 * velocity has no part across the track, so the air velocity must carry −(w·n̂) across. Its part
 * along the track is then √(s² − (w·n̂)²), and the ground speed is that plus w·û. When the cross
 * part of the wind is larger than the airspeed, no heading works and the result is null.
 */
export function headingForTrack({ airspeed, wind, trackDeg }) {
  const u = fromAngle2D(1, trackDeg);
  const n = fromAngle2D(1, trackDeg + 90);
  const across = -dot(wind, n);
  if (Math.abs(across) > airspeed) return null;
  const along = Math.sqrt(airspeed * airspeed - across * across);
  const air = add(scale(u, along), scale(n, across));
  const ground = add(air, wind);
  const headingDeg = angle2D(air);
  let correction = headingDeg - trackDeg;
  correction = ((correction + 540) % 360) - 180;
  return { headingDeg, correctionDeg: correction, groundSpeed: dot(ground, u), air, ground };
}

/**
 * A launch from a point on a straight slope that rises at slopeDeg (negative when it falls away),
 * at thetaDeg above the horizontal.
 *
 * Measure along the slope and across it. Gravity has −g sin φ along and −g cos φ across. The launch
 * has v0 cos(θ−φ) along and v0 sin(θ−φ) across. The motion across is a toss with acceleration
 * −g cos φ, so it is back on the slope at t = 2 v0 sin(θ−φ)/(g cos φ). Along the slope the distance is
 * d = v0 cos(θ−φ) t − ½ g sin φ t², which simplifies to d = 2 v0² cos θ sin(θ−φ)/(g cos² φ).
 * The point is (d cos φ, d sin φ) from the launch. Null when the launch points into the slope.
 */
export function slopeLanding({ v0, thetaDeg, slopeDeg, g = G }) {
  const th = thetaDeg * DEG;
  const ph = slopeDeg * DEG;
  if (!(Math.sin(th - ph) > 0) || !(Math.cos(ph) > 0)) return null;
  const t = (2 * v0 * Math.sin(th - ph)) / (g * Math.cos(ph));
  const d = v0 * Math.cos(th - ph) * t - 0.5 * g * Math.sin(ph) * t * t;
  const vx = v0 * Math.cos(th);
  const vy = v0 * Math.sin(th) - g * t;
  return { t, d, x: d * Math.cos(ph), y: d * Math.sin(ph), vx, vy, speed: Math.hypot(vx, vy) };
}

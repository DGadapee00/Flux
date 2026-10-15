/**
 * Plane-curve kinematics and piecewise rectilinear motion.
 * Positions are {x, y, z}. A graph is y = f(x), with the tangent toward increasing x.
 */
import { d2fdx2, df1, dfdx } from '../math/ndiff.js';
import { add, mag, scale, sub, v } from './vectors.js';

/** ρ = (1 + y′²)^{3/2} / |y″|. Infinity on a straight graph. */
export function radiusOfCurvature(yp, ypp) {
  const den = Math.abs(ypp);
  if (!(den > 0)) return Infinity;
  return (1 + yp * yp) ** 1.5 / den;
}

/**
 * Unit tangent of a graph, and the unit normal toward the concave side.
 * A positive y″ (concave up) points the normal upward.
 */
export function tangentNormal(yp, ypp) {
  const hyp = Math.hypot(1, yp);
  const tx = 1 / hyp;
  const ty = yp / hyp;
  const sign = ypp > 0 ? 1 : ypp < 0 ? -1 : 0;
  return {
    t: v(tx, ty, 0),
    n: v(sign * -ty, sign * tx, 0),
  };
}

/** a_t along the path and a_n = v²/ρ toward the centre of curvature. */
export function normalTangential({ yp, ypp, speed, at = 0 }) {
  const rho = radiusOfCurvature(yp, ypp);
  const an = Number.isFinite(rho) && rho > 0 ? (speed * speed) / rho : 0;
  const frame = tangentNormal(yp, ypp);
  const a = add(scale(frame.t, at), scale(frame.n, an));
  return { rho, at, an, a, magA: mag(a), ...frame };
}

/** Same split, with y′ and y″ from central differences of f(x). */
export function normalTangentialOf(f, x, speed, at = 0) {
  const g = (xx) => f(xx);
  return normalTangential({
    yp: dfdx(g, x, 0),
    ypp: d2fdx2(g, x, 0),
    speed,
    at,
  });
}

function secondDeriv(f, t) {
  const h = 1e-3;
  return (f(t + h) - 2 * f(t) + f(t - h)) / (h * h);
}

/**
 * Differentiate r(t) = (x(t), y(t)) twice, then project onto the unit tangent
 * and the left-pointing normal. This is the check on the graph formulas.
 */
export function projectTimePath(xOfT, yOfT, t) {
  const vx = df1(xOfT, t);
  const vy = df1(yOfT, t);
  const ax = secondDeriv(xOfT, t);
  const ay = secondDeriv(yOfT, t);
  const speed = Math.hypot(vx, vy);
  const tx = speed > 1e-12 ? vx / speed : 1;
  const ty = speed > 1e-12 ? vy / speed : 0;
  const at = ax * tx + ay * ty;
  const nx = -ty;
  const ny = tx;
  const anSigned = ax * nx + ay * ny;
  const side = anSigned < 0 ? -1 : 1;
  return {
    speed,
    at,
    an: Math.abs(anSigned),
    t: v(tx, ty, 0),
    n: v(side * nx, side * ny, 0),
    a: v(ax, ay, 0),
  };
}

function evalPoly(coeff, t) {
  let y = 0;
  let p = 1;
  for (let i = 0; i < coeff.length; i++) {
    y += coeff[i] * p;
    p *= t;
  }
  return y;
}

function antideriv(coeff) {
  const out = [0];
  for (let i = 0; i < coeff.length; i++) out.push(coeff[i] / (i + 1));
  return out;
}

function pieceHolding(pieces, t) {
  for (const piece of pieces) if (t <= piece.t1) return piece;
  return pieces[pieces.length - 1];
}

/** a(t) on abutting polynomial pieces. coeff is [c0, c1, …] for c0 + c1 t + …. */
export function accelAt(pieces, t) {
  return evalPoly(pieceHolding(pieces, t).coeff, t);
}

/**
 * Exact s(t) and v(t) from polynomial a(t) on abutting pieces.
 * s and v are continuous: each piece starts where the previous one ended.
 * Returns state(t) → { s, v, a }.
 */
export function integratePieces(pieces, s0, v0) {
  const built = [];
  let s = s0;
  let v = v0;
  for (const piece of pieces) {
    const { t0, t1, coeff } = piece;
    const A = antideriv(coeff);
    const S = antideriv(A);
    const vStart = v;
    const sStart = s;
    const A0 = evalPoly(A, t0);
    const S0 = evalPoly(S, t0);
    const state = (t) => {
      const vel = vStart + evalPoly(A, t) - A0;
      const pos = sStart + vStart * (t - t0) + (evalPoly(S, t) - S0) - A0 * (t - t0);
      return { s: pos, v: vel, a: evalPoly(coeff, t) };
    };
    built.push({ t0, t1, state });
    const end = state(t1);
    s = end.s;
    v = end.v;
  }
  return function state(t) {
    const piece = pieceHolding(built, t);
    return piece.state(t);
  };
}

/**
 * RK4 on each polynomial piece, then the next piece starts from that end state.
 * A step that crossed the kink would see two different accelerations.
 */
export function rk4Pieces(pieces, s0, v0, t1, stepsPerPiece = 80) {
  let s = s0;
  let vel = v0;
  for (const piece of pieces) {
    const end = Math.min(piece.t1, t1);
    if (end <= piece.t0) break;
    const step = rk4Motion((t) => evalPoly(piece.coeff, t), s, vel, piece.t0, end, stepsPerPiece);
    s = step.s;
    vel = step.v;
    if (piece.t1 >= t1) break;
  }
  return { s, v: vel, a: accelAt(pieces, t1) };
}

/** RK4 on ds/dt = v, dv/dt = a(t), from t0 to t1. */
export function rk4Motion(aOfT, s0, v0, t0, t1, steps = 200) {
  let s = s0;
  let vel = v0;
  const h = (t1 - t0) / steps;
  let t = t0;
  for (let i = 0; i < steps; i++) {
    const a1 = aOfT(t);
    const a2 = aOfT(t + h / 2);
    const a4 = aOfT(t + h);
    const k1s = vel;
    const k1v = a1;
    const k2s = vel + (h / 2) * k1v;
    const k2v = a2;
    const k3s = vel + (h / 2) * k2v;
    const k3v = a2;
    const k4s = vel + h * k3v;
    const k4v = a4;
    s += (h / 6) * (k1s + 2 * k2s + 2 * k3s + k4s);
    vel += (h / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    t += h;
  }
  return { s, v: vel, a: aOfT(t1) };
}

/** Simpson's rule for ∫ |v| dt. `steps` must be even. */
export function integrateAbsSpeed(vOfT, t0, t1, steps = 400) {
  const n = steps % 2 === 0 ? steps : steps + 1;
  const h = (t1 - t0) / n;
  let sum = Math.abs(vOfT(t0)) + Math.abs(vOfT(t1));
  for (let i = 1; i < n; i++) {
    const w = i % 2 === 0 ? 2 : 4;
    sum += w * Math.abs(vOfT(t0 + i * h));
  }
  return (sum * h) / 3;
}

/**
 * Distance as the sum of |Δs| between zeros of v, including the endpoints.
 * Displacement is state(t1).s − state(t0).s and is not this sum once v changes sign.
 */
export function distanceByCrossings(state, t0, t1, samples = 2000) {
  const times = [t0];
  let prevT = t0;
  let prevV = state(t0).v;
  for (let i = 1; i <= samples; i++) {
    const t = t0 + (i / samples) * (t1 - t0);
    const vel = state(t).v;
    if (prevV === 0 || vel === 0 || prevV * vel < 0) {
      let lo = prevT;
      let hi = t;
      for (let k = 0; k < 50; k++) {
        const mid = 0.5 * (lo + hi);
        if (state(lo).v * state(mid).v <= 0) hi = mid;
        else lo = mid;
      }
      const root = 0.5 * (lo + hi);
      if (root - times[times.length - 1] > 1e-9) times.push(root);
    }
    prevT = t;
    prevV = vel;
  }
  if (t1 - times[times.length - 1] > 1e-9) times.push(t1);
  let dist = 0;
  for (let i = 1; i < times.length; i++) dist += Math.abs(state(times[i]).s - state(times[i - 1]).s);
  return dist;
}

/** v_B/A = v_B − v_A, and the same for position and acceleration. */
export function relativeOf(A, B) {
  return { r: sub(B.r, A.r), v: sub(B.v, A.v), a: sub(B.a, A.a) };
}

/** Numerical derivative of r_B(t) − r_A(t). The check on the subtraction. */
export function relativeNumeric(rA, rB, t) {
  const comp = (axis) => (tt) => (rB(tt)[axis] || 0) - (rA(tt)[axis] || 0);
  const rx = comp('x');
  const ry = comp('y');
  const rz = comp('z');
  return {
    r: v(rx(t), ry(t), rz(t)),
    v: v(df1(rx, t), df1(ry, t), df1(rz, t)),
    a: v(secondDeriv(rx, t), secondDeriv(ry, t), secondDeriv(rz, t)),
  };
}

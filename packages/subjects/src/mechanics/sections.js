/**
 * Internal loads, centroids and area moments of inertia · Hibbeler Ch 7, 9, 10.
 */

import { distributedLoad } from './statics.js';

// ---------------------------------------------------------------- Ch 7: internal loads

/**
 * Normal force, shear and bending moment at a cut, from the left-hand segment of a beam.
 *
 * Sign convention (the one the chapter draws): N positive in tension, V positive when the left
 * segment is pushed up, M positive when it sags (compression on top).
 *
 * `loads` are point loads { x, Fx, Fy, M } and `dist` a list of { w, a, b } distributed loads.
 * Fy and w(x) are both signed the same way: positive is UP. A load of 120 lb/ft pressing down on
 * the beam is therefore w: () => -120, not +120. A couple M is counterclockwise-positive, the same
 * as rigidBody2D reports a fixed support's moment, so a reaction can be passed straight through.
 */
export function internalAt(cut, { reactions = [], loads = [], dist = [] }) {
  let N = 0;
  let V = 0;
  let M = 0;
  const take = (x, Fx, Fy, Mo) => {
    if (x > cut + 1e-12) return;
    N -= Fx || 0;
    V += Fy || 0;
    // The internal moment on the left segment's cut face balances the loads' moments about the
    // cut: an upward force to the left sags the beam (+), a counterclockwise couple hogs it (−).
    M += (Fy || 0) * (cut - x) - (Mo || 0);
  };
  for (const r of reactions) take(r.x, r.Fx, r.Fy, r.M);
  for (const p of loads) take(p.x, p.Fx, p.Fy, p.M);
  for (const d of dist) {
    if (d.a >= cut) continue;
    const b = Math.min(d.b, cut);
    const { F, x } = distributedLoad(d.w, d.a, b);
    V += F;
    M += F * (cut - x);
  }
  return { N, V, M };
}

/** Shear and moment sampled across a beam, for drawing the diagrams. */
export function shearMomentDiagram(L, setup, n = 400) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = (L * i) / n;
    // Sample just past each station so a point load lands on the correct side of the jump.
    pts.push({ x, ...internalAt(x + 1e-9, setup) });
  }
  return pts;
}

/**
 * Simply supported beam, downward point load P at distance a from the left.
 * `at(x)` uses the same inclusion rule as internalAt: a force at the cut is on the left segment.
 * Moment is sagging-positive. Shear is positive when the left segment is pushed up.
 */
export function simplePoint(P, L, a) {
  const left = (P * (L - a)) / L;
  const right = P - left;
  const setup = {
    reactions: [{ x: 0, Fy: left }, { x: L, Fy: right }],
    loads: [{ x: a, Fy: -P }],
  };
  const at = (x) => {
    let V = left;
    let M = left * x;
    if (a <= x + 1e-12) {
      V -= P;
      M -= P * (x - a);
    }
    if (L <= x + 1e-12) V += right;
    return { V, M };
  };
  return { L, setup, at, left, right, Mmax: left * a, Vmax: Math.max(left, right), xM: a };
}

/** Simply supported beam, uniform downward load w (force per length). */
export function simpleUniform(w, L) {
  const left = (w * L) / 2;
  const setup = {
    reactions: [{ x: 0, Fy: left }, { x: L, Fy: left }],
    dist: [{ w: () => -w, a: 0, b: L }],
  };
  const at = (x) => {
    const end = Math.min(Math.max(x, 0), L);
    const F = -w * end;
    let V = left + F;
    let M = left * x + F * (x - end / 2);
    if (L <= x + 1e-12) V += left;
    return { V, M };
  };
  return { L, setup, at, left, right: left, Mmax: (w * L * L) / 8, Vmax: left, xM: L / 2 };
}

/** Cantilever fixed at x = 0, downward tip load P. The wall moment is hogging. */
export function cantileverTip(P, L) {
  const setup = {
    reactions: [{ x: 0, Fy: P, M: P * L }],
    loads: [{ x: L, Fy: -P }],
  };
  const at = (x) => {
    let V = P;
    let M = P * x - P * L;
    if (L <= x + 1e-12) V -= P;
    return { V, M };
  };
  return { L, setup, at, left: P, right: 0, Mmax: -P * L, Vmax: P, xM: 0 };
}

/**
 * A statically determinate beam of length L under any mix of loads, solved two ways.
 *
 * `support` is 'simple' (a pin at x = 0 and a roller at `b`, which may sit short of L to leave an
 * overhang) or 'cantilever' (fixed at x = 0, free at L). `points` are downward point loads
 * { x, P }; `udl` is an optional downward uniform load { w, a, b }; `couples` are applied couples
 * { x, M }, counterclockwise-positive.
 *
 * Reactions come from equilibrium. Taking moments about x = 0, counterclockwise-positive, with
 * every load written as an upward force Fy = −P:
 *   simple:     R_b · b + Σ Fy·x + F_w x_w + Σ M = 0,   R_a = −(R_b + Σ Fy + F_w)
 *   cantilever: R_a = −(Σ Fy + F_w),   M_a = −(Σ Fy·x + F_w x_w + Σ M)
 *
 * `graphical(n)` builds V and M the way the diagrams are drawn by hand: V jumps by each point force
 * and falls by the load's area, dV/dx = −w; M rises by the area under V, dM/dx = V, and jumps down
 * by each counterclockwise couple. Across a uniform load V is linear, so the trapezoid on V is
 * exact. internalAt, the method of sections, is the second method.
 */
export function generalBeam({ L, support = 'simple', b = L, points = [], udl = null, couples = [] }) {
  const loads = [
    ...points.map((p) => ({ x: p.x, Fy: -p.P })),
    ...couples.map((c) => ({ x: c.x, M: c.M })),
  ];
  const dist = udl && udl.w && udl.b > udl.a ? [{ w: () => -udl.w, a: udl.a, b: udl.b }] : [];
  const Fw = dist.length ? -udl.w * (udl.b - udl.a) : 0;
  const xw = dist.length ? (udl.a + udl.b) / 2 : 0;
  const sumF = points.reduce((s, p) => s - p.P, 0) + Fw;
  const sumM0 = points.reduce((s, p) => s - p.P * p.x, 0) + Fw * xw + couples.reduce((s, c) => s + c.M, 0);
  let reactions;
  if (support === 'cantilever') {
    reactions = [{ x: 0, Fy: -sumF, M: -sumM0 }];
  } else {
    const Rb = -sumM0 / b;
    reactions = [{ x: 0, Fy: -(Rb + sumF) }, { x: b, Fy: Rb }];
  }
  const setup = { reactions, loads, dist };
  const at = (x) => internalAt(x, setup);

  // Stations: every place the load changes, so each interval has a constant w and no jump inside.
  const breaks = new Set([0, L]);
  for (const f of [...reactions, ...loads]) breaks.add(f.x);
  if (dist.length) {
    breaks.add(udl.a);
    breaks.add(udl.b);
  }
  const marks = [...breaks].filter((x) => x >= 0 && x <= L).sort((p, q) => p - q);
  const wAt = (x) => (dist.length && x > udl.a && x < udl.b ? udl.w : 0);

  /** V and M from the load, by integration, on n points per unit of the span (at least). */
  function graphical(n = 200) {
    const out = [];
    let V = 0;
    let M = 0;
    const jumpAt = (x) => {
      for (const f of reactions) if (Math.abs(f.x - x) < 1e-12) {
        V += f.Fy || 0;
        M -= f.M || 0;
      }
      for (const f of loads) if (Math.abs(f.x - x) < 1e-12) {
        V += f.Fy || 0;
        M -= f.M || 0;
      }
    };
    for (let i = 0; i < marks.length; i++) {
      const x0 = marks[i];
      out.push({ x: x0, V, M, side: 'left' });
      jumpAt(x0);
      out.push({ x: x0, V, M, side: 'right' });
      if (i === marks.length - 1) break;
      const x1 = marks[i + 1];
      const w = wAt((x0 + x1) / 2);
      const steps = Math.max(2, Math.ceil(((x1 - x0) / L) * n));
      const h = (x1 - x0) / steps;
      for (let k = 1; k <= steps; k++) {
        const V1 = V - w * h;
        M += 0.5 * (V + V1) * h;
        V = V1;
        if (k < steps) out.push({ x: x0 + k * h, V, M });
      }
    }
    return out;
  }

  const pts = graphical();
  let Vmax = 0;
  let Mmax = 0;
  let xM = 0;
  for (const p of pts) {
    // Equal and opposite peaks keep the first one met, so a symmetric span reports +V.
    if (Math.abs(p.V) > Math.abs(Vmax) * (1 + 1e-9) + 1e-9) Vmax = p.V;
    if (Math.abs(p.M) > Math.abs(Mmax) * (1 + 1e-9) + 1e-9) {
      Mmax = p.M;
      xM = p.x;
    }
  }
  return { L, support, b, setup, reactions, at, graphical, marks, Vmax, Mmax, xM };
}

/** Largest gap between the graphical diagram and the method of sections, scaled by the peaks. */
export function graphicalGap(beam, n = 200) {
  const sV = Math.max(Math.abs(beam.Vmax), 1);
  const sM = Math.max(Math.abs(beam.Mmax), 1);
  let gap = 0;
  for (const p of beam.graphical(n)) {
    // Each side of a jump is compared with a cut on that side. internalAt counts a force at the
    // cut as on the left segment, so the right side is the station itself.
    const x = p.side === 'left' ? p.x - 1e-11 : p.x;
    if (x < 0 || x > beam.L) continue;
    const s = internalAt(x, beam.setup);
    gap = Math.max(gap, Math.abs(s.V - p.V) / sV, Math.abs(s.M - p.M) / sM);
  }
  return gap;
}

/**
 * Largest gap between a closed-form beam and internalAt, on a uniform grid.
 * The scale is the beam's peak shear and moment. A support station closes to zero,
 * and the distributed-load sum leaves a few nanonewtons there. Dividing by 1 N·m
 * would call that leftover a failure.
 */
export function beamGap(model, n = 40) {
  const scaleV = Math.max(Math.abs(model.Vmax), 1);
  const scaleM = Math.max(Math.abs(model.Mmax), 1);
  let gap = 0;
  for (let i = 0; i <= n; i++) {
    const x = (model.L * i) / n;
    const closed = model.at(x);
    const cut = internalAt(x, model.setup);
    gap = Math.max(
      gap,
      Math.abs(closed.V - cut.V) / scaleV,
      Math.abs(closed.M - cut.M) / scaleM,
    );
  }
  return gap;
}

// ---------------------------------------------------------------- Ch 9: centroids

/**
 * Centroid of a composite shape. Each part is { A, x, y } — area (or length, or volume) and the
 * centroid of that part. A negative A punches a hole, which is how the shaded-area problems work.
 */
export function composite(parts) {
  let A = 0;
  let Ax = 0;
  let Ay = 0;
  for (const p of parts) {
    A += p.A;
    Ax += p.A * p.x;
    Ay += p.A * p.y;
  }
  return { A, x: A === 0 ? NaN : Ax / A, y: A === 0 ? NaN : Ay / A };
}

/** Centroid of the area under y = f(x) between a and b, by integration. */
export function centroidUnderCurve(f, a, b, n = 4000) {
  let A = 0;
  let Ax = 0;
  let Ay = 0;
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * h;
    const y = f(x);
    A += y * h;
    Ax += x * y * h;
    Ay += (y / 2) * y * h;
  }
  return { A, x: Ax / A, y: Ay / A };
}

/** Centroid of a plane curve y = f(x) — the Ch 9 "centroid of the line" problems. */
export function centroidOfLine(f, df, a, b, n = 4000) {
  let L = 0;
  let Lx = 0;
  let Ly = 0;
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * h;
    const ds = Math.sqrt(1 + df(x) ** 2) * h;
    L += ds;
    Lx += x * ds;
    Ly += f(x) * ds;
  }
  return { L, x: Lx / L, y: Ly / L };
}

/** Common shapes, as composite parts. */
export const rect = (w, h, x0 = 0, y0 = 0) => ({ A: w * h, x: x0 + w / 2, y: y0 + h / 2 });
export const tri = (b, h, x0 = 0, y0 = 0) => ({ A: (b * h) / 2, x: x0 + b / 3, y: y0 + h / 3 });
export const circ = (r, x0 = 0, y0 = 0) => ({ A: Math.PI * r * r, x: x0, y: y0 });
export const semi = (r, x0 = 0, y0 = 0) => ({ A: (Math.PI * r * r) / 2, x: x0, y: y0 + (4 * r) / (3 * Math.PI) });
export const quarter = (r, x0 = 0, y0 = 0) => ({ A: (Math.PI * r * r) / 4, x: x0 + (4 * r) / (3 * Math.PI), y: y0 + (4 * r) / (3 * Math.PI) });

/**
 * Pappus–Guldinus: revolve a plane curve or area about an axis.
 * Surface area A = θ·r̄·L, volume V = θ·r̄·A, with θ in radians (2π for a full revolution).
 */
export const pappusArea = (rbar, L, theta = 2 * Math.PI) => theta * rbar * L;
export const pappusVolume = (rbar, A, theta = 2 * Math.PI) => theta * rbar * A;

// ---------------------------------------------------------------- Ch 10: moment of inertia

/** Parallel-axis theorem: I about a parallel axis a distance d away. */
export const parallelAxis = (Ibar, A, d) => Ibar + A * d * d;

/** Centroidal second moments for the usual shapes. */
export const rectI = (w, h) => ({ Ix: (w * h ** 3) / 12, Iy: (h * w ** 3) / 12 });
export const triI = (b, h) => ({ Ix: (b * h ** 3) / 36, Iy: (h * b ** 3) / 36 });
export const circI = (r) => ({ Ix: (Math.PI * r ** 4) / 4, Iy: (Math.PI * r ** 4) / 4 });
export const semiI = (r) => ({ Ix: ((Math.PI / 8) - (8 / (9 * Math.PI))) * r ** 4, Iy: (Math.PI * r ** 4) / 8 });

/**
 * Second moment of a composite area about the x and y axes through the origin.
 * Each part is { A, x, y, Ix, Iy } with Ix, Iy taken about that part's own centroid.
 */
export function compositeI(parts) {
  let Ix = 0;
  let Iy = 0;
  for (const p of parts) {
    Ix += parallelAxis(p.Ix, p.A, p.y);
    Iy += parallelAxis(p.Iy, p.A, p.x);
  }
  return { Ix, Iy };
}

/** I_x of the area under y = f(x) by integration, for checking the composite answers. */
export function IxUnderCurve(f, a, b, n = 4000) {
  let I = 0;
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * h;
    I += (f(x) ** 3 / 3) * h;
  }
  return I;
}

export function IyUnderCurve(f, a, b, n = 4000) {
  let I = 0;
  const h = (b - a) / n;
  for (let i = 0; i < n; i++) {
    const x = a + (i + 0.5) * h;
    I += x * x * f(x) * h;
  }
  return I;
}

/** Radius of gyration, k = √(I/A). */
export const radiusOfGyration = (I, A) => Math.sqrt(I / A);

/**
 * View factors between two long strips (EML 4140, radiation exchange).
 *
 * Strip 1 lies on the floor, width w₁, centred at the origin and facing up. Strip 2, width w₂, is
 * centred at (x₂, h) and tilted by φ, facing down. Both run far into the page, so the problem is
 * two-dimensional and each strip is a segment.
 *
 * Closed form, Hottel's crossed strings: stretch strings between the strips' ends. Then
 *   F₁₂ = [(crossed₁ + crossed₂) − (uncrossed₁ + uncrossed₂)] / (2 w₁),
 * and F₂₁ the same over 2 w₂, so w₁F₁₂ = w₂F₂₁ (reciprocity) by construction.
 *
 * Second method: the defining double integral, in two dimensions
 *   F₁₂ = (1/w₁) ∫∫ cos θ₁ cos θ₂ / (2 r) ds₂ ds₁,
 * by composite Gauss–Legendre quadrature on both strips.
 *
 * The rays: a Lambertian strip in 2D sends a ray at angle θ from its normal with sin θ uniform on
 * (−1, 1). Firing many and counting the hits estimates F₁₂ to within about 1/√N, which the lab shows
 * beside the exact value; it is not the check, being random.
 */

// Gauss–Legendre nodes and weights on [−1, 1], 8 points.
const GL_X = [-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498, 0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
const GL_W = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
export const W1 = 1;

const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

/** The two strips as segments, with unit normals: 1 faces up, 2 faces down towards 1. */
export function strips({ w2, x2, h, tiltDeg }) {
  const phi = (tiltDeg * Math.PI) / 180;
  const a = [-W1 / 2, 0];
  const b = [W1 / 2, 0];
  const t = [Math.cos(phi), Math.sin(phi)];
  const c = [x2 - (w2 / 2) * t[0], h - (w2 / 2) * t[1]]; // left end of strip 2
  const d = [x2 + (w2 / 2) * t[0], h + (w2 / 2) * t[1]];
  return { a, b, c, d, n1: [0, 1], n2: [Math.sin(phi), -Math.cos(phi)], phi };
}

/** Does each strip lie wholly in front of the other? (Then nothing hides part of either.) */
export function fullyVisible(g) {
  const front2 = (p) => (p[0] - (g.c[0] + g.d[0]) / 2) * g.n2[0] + (p[1] - (g.c[1] + g.d[1]) / 2) * g.n2[1];
  return g.c[1] > 1e-9 && g.d[1] > 1e-9 && front2(g.a) > 1e-9 && front2(g.b) > 1e-9;
}

/** The largest tilt no steeper than asked for that keeps both strips in full view of each other. */
export function allowedTilt(state) {
  if (fullyVisible(strips(state))) return state.tiltDeg;
  let lo = 0;
  let hi = state.tiltDeg;
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2;
    if (fullyVisible(strips({ ...state, tiltDeg: mid }))) lo = mid;
    else hi = mid;
  }
  return lo;
}

export function crossedStrings(g, w2) {
  const crossed = dist(g.a, g.d) + dist(g.b, g.c);
  const uncrossed = dist(g.a, g.c) + dist(g.b, g.d);
  const num = crossed - uncrossed;
  return { F12: num / (2 * W1), F21: num / (2 * w2), crossed, uncrossed };
}

export function quadrature(g, w2, panels = 8) {
  const pts = (p, q, L) => {
    const out = [];
    for (let m = 0; m < panels; m++) {
      for (let k = 0; k < GL_X.length; k++) {
        const s = (m + (GL_X[k] + 1) / 2) / panels;
        out.push({ p: [p[0] + s * (q[0] - p[0]), p[1] + s * (q[1] - p[1])], w: (GL_W[k] / 2 / panels) * L });
      }
    }
    return out;
  };
  const P1 = pts(g.a, g.b, W1);
  const P2 = pts(g.c, g.d, w2);
  let sum = 0;
  for (const u of P1) {
    for (const v of P2) {
      const rx = v.p[0] - u.p[0];
      const ry = v.p[1] - u.p[1];
      const r = Math.hypot(rx, ry);
      const c1 = Math.max(0, (rx * g.n1[0] + ry * g.n1[1]) / r);
      const c2 = Math.max(0, -(rx * g.n2[0] + ry * g.n2[1]) / r);
      sum += ((c1 * c2) / (2 * r)) * u.w * v.w;
    }
  }
  return sum / W1;
}

/** A small seeded generator, so the rays are the same every time. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Does the ray from p along u hit the segment from c to d? Returns the hit point or null. */
function hit(p, u, c, d) {
  const ex = d[0] - c[0];
  const ey = d[1] - c[1];
  const den = u[0] * ey - u[1] * ex;
  if (Math.abs(den) < 1e-14) return null;
  const qx = c[0] - p[0];
  const qy = c[1] - p[1];
  const t = (qx * ey - qy * ex) / den;
  const s = (qx * u[1] - qy * u[0]) / den;
  return t > 0 && s >= 0 && s <= 1 ? [p[0] + t * u[0], p[1] + t * u[1]] : null;
}

/** N Lambertian rays from strip 1; the share that lands on strip 2, and the first few for drawing. */
export function rays(g, N = 20000, keep = 60, seed = 7) {
  const rand = rng(seed);
  let hits = 0;
  const drawn = [];
  for (let k = 0; k < N; k++) {
    const p = [g.a[0] + rand() * (g.b[0] - g.a[0]), 0];
    const sn = 2 * rand() - 1;
    const u = [sn, Math.sqrt(1 - sn * sn)];
    const q = hit(p, u, g.c, g.d);
    if (q) hits++;
    if (k < keep) drawn.push({ p, u, q });
  }
  return { F12: hits / N, hits, N, drawn };
}

export function viewFactors(state) {
  const tilt = allowedTilt(state);
  const s = { ...state, tiltDeg: tilt };
  const g = strips(s);
  const cs = crossedStrings(g, state.w2);
  const F12q = quadrature(g, state.w2);
  const mc = rays(g);
  return {
    ...cs,
    g,
    tilt,
    clamped: Math.abs(tilt - state.tiltDeg) > 1e-6,
    F12q,
    F21q: (F12q * W1) / state.w2,
    A1F12: W1 * cs.F12,
    A2F21: state.w2 * cs.F21,
    F1rest: 1 - cs.F12,
    mc,
    gap: Math.abs(F12q - cs.F12) / Math.max(cs.F12, 1e-12),
  };
}

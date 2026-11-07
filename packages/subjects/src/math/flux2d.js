/**
 * Flux of a plane field across a closed loop, three ways.
 *
 * Flux across a curve counts how much of a field F = (P, Q) crosses it, outward positive:
 * Φ = ∮ F · n ds. Divergence is the flux per unit area out of a small loop around a point, and the
 * divergence theorem in the plane says Φ = ∬ div F dA over the region the loop encloses, for a
 * field smooth inside it.
 *
 * - `fluxClosed`: the exact flux. For the polynomial fields here, div F is a quadratic, and its
 *   average over a circle or a square about (a, b) is known: the mean of x is a, the mean of x² is
 *   a² + R²/4 on a circle of radius R and a² + h²/3 on a square of half-side h, the mean of xy is ab.
 *   For the point source, the flux is 2π when the loop encloses the origin and 0 when it does not.
 * - `fluxAlong`: the line integral itself, ∮ F · n ds, summed numerically around the loop.
 * - `fluxInside`: the area integral of the divergence, summed numerically over the region.
 *
 * The first is a closed form, the second and third are independent numerical routes. Where the
 * field is smooth inside the loop, all three agree. The point source breaks the third on purpose:
 * its divergence is zero everywhere but the origin, so the area integral misses what sits there.
 *
 * Our own derivation. Sources: OpenStax Calculus Vol. 3, §6.5 Divergence and curl, and §6.4
 * Green's theorem (its flux form).
 */
import { simpson } from './quadrature.js';

/**
 * Each field: P and Q, its divergence, and the divergence as a quadratic
 * c0 + cx·x + cy·y + cxx·x² + cyy·y² + cxy·xy (null for the point source).
 */
export const FIELDS = {
  source: {
    id: 'source', name: 'Source', tex: 'F=(x,\\,y)',
    P: (x) => x, Q: (x, y) => y, div: () => 2,
    quad: { c0: 2 },
  },
  swirl: {
    id: 'swirl', name: 'Swirl', tex: 'F=(-y,\\,x)',
    P: (x, y) => -y, Q: (x) => x, div: () => 0,
    quad: {},
  },
  shear: {
    id: 'shear', name: 'Shear', tex: 'F=(y,\\,0)',
    P: (x, y) => y, Q: () => 0, div: () => 0,
    quad: {},
  },
  spread: {
    id: 'spread', name: 'Spreading to the right', tex: 'F=(x^2,\\,xy)',
    P: (x) => x * x, Q: (x, y) => x * y, div: (x) => 3 * x,
    quad: { cx: 3 },
  },
  cubic: {
    id: 'cubic', name: 'Cubic flow', tex: 'F=(x^3,\\,0)',
    P: (x) => x * x * x, Q: () => 0, div: (x) => 3 * x * x,
    quad: { cxx: 3 },
  },
  point: {
    id: 'point', name: 'Point source at the origin', tex: 'F=\\dfrac{(x,\\,y)}{x^2+y^2}',
    P: (x, y) => x / (x * x + y * y), Q: (x, y) => y / (x * x + y * y), div: () => 0,
    quad: null,
    singular: { x: 0, y: 0 },
  },
};

export const fieldById = (id) => FIELDS[id] || FIELDS.source;

/** The loop: a circle of radius `size`, or a square of half-side `size`, centred at (a, b). */
export function area(loop) {
  return loop.shape === 'square' ? 4 * loop.size * loop.size : Math.PI * loop.size * loop.size;
}

/** Whether the point (x, y) lies inside the loop, and how far it is from the loop's edge. */
export function inside(loop, x, y) {
  const dx = x - loop.a;
  const dy = y - loop.b;
  if (loop.shape === 'square') {
    const m = Math.max(Math.abs(dx), Math.abs(dy));
    return { inside: m < loop.size, edge: Math.abs(loop.size - m) };
  }
  const r = Math.hypot(dx, dy);
  return { inside: r < loop.size, edge: Math.abs(loop.size - r) };
}

/** Exact flux. */
export function fluxClosed(field, loop) {
  if (field.singular) return inside(loop, field.singular.x, field.singular.y).inside ? 2 * Math.PI : 0;
  const { a, b, size, shape } = loop;
  const m = shape === 'square' ? (size * size) / 3 : (size * size) / 4;
  const q = field.quad;
  const mean = (q.c0 || 0) + (q.cx || 0) * a + (q.cy || 0) * b
    + (q.cxx || 0) * (a * a + m) + (q.cyy || 0) * (b * b + m) + (q.cxy || 0) * a * b;
  return mean * area(loop);
}

/** ∮ F · n ds, summed around the loop. Outward normal; counterclockwise. */
export function fluxAlong(field, loop, n = 720) {
  const { a, b, size: s } = loop;
  if (loop.shape === 'square') {
    // Four edges, each by adaptive Simpson: right (n = +x), top (+y), left (−x), bottom (−y).
    const tol = 1e-10;
    return simpson((y) => field.P(a + s, y), b - s, b + s, tol)
      + simpson((x) => field.Q(x, b + s), a - s, a + s, tol)
      - simpson((y) => field.P(a - s, y), b - s, b + s, tol)
      - simpson((x) => field.Q(x, b - s), a - s, a + s, tol);
  }
  // A circle: the trapezoid rule on a periodic integrand, F · n ds with n = (cos t, sin t), ds = s dt.
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const t = (2 * Math.PI * i) / n;
    const c = Math.cos(t);
    const d = Math.sin(t);
    sum += field.P(a + s * c, b + s * d) * c + field.Q(a + s * c, b + s * d) * d;
  }
  return (sum * s * 2 * Math.PI) / n;
}

/** ∬ div F dA over the region, by a midpoint sum: polar about the centre for a circle, a grid for a square. */
export function fluxInside(field, loop, n = 160) {
  const { a, b, size: s } = loop;
  let sum = 0;
  if (loop.shape === 'square') {
    const h = (2 * s) / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) sum += field.div(a - s + (i + 0.5) * h, b - s + (j + 0.5) * h);
    }
    return sum * h * h;
  }
  const nr = n;
  const nt = 2 * n;
  const dr = s / nr;
  const dt = (2 * Math.PI) / nt;
  for (let i = 0; i < nr; i++) {
    const r = (i + 0.5) * dr;
    for (let j = 0; j < nt; j++) {
      const t = (j + 0.5) * dt;
      sum += field.div(a + r * Math.cos(t), b + r * Math.sin(t)) * r;
    }
  }
  return sum * dr * dt;
}

/** Outward flux density F · n at a point on the loop, and the point, for drawing. `u` runs 0 to 1. */
export function boundaryPoint(field, loop, u) {
  const { a, b, size: s } = loop;
  let x, y, nx, ny;
  if (loop.shape === 'square') {
    const side = Math.min(3, Math.floor(u * 4));
    const f = u * 4 - side;
    const k = -s + 2 * s * f;
    [x, y, nx, ny] = [[a + s, b + k, 1, 0], [a - k, b + s, 0, 1], [a - s, b - k, -1, 0], [a + k, b - s, 0, -1]][side];
  } else {
    const t = 2 * Math.PI * u;
    nx = Math.cos(t);
    ny = Math.sin(t);
    x = a + s * nx;
    y = b + s * ny;
  }
  return { x, y, nx, ny, flow: field.P(x, y) * nx + field.Q(x, y) * ny };
}

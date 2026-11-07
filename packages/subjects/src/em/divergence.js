/**
 * Maxwell's divergence equations, seen two ways (PHY 2049, Ch 53 with Gauss's law from Ch 37).
 *
 * A ball of radius R holds charge at a uniform density ρ. A small test sphere of radius r sits
 * with its centre a distance d from the ball's centre. The flux of E out of the small sphere is
 * found two ways:
 *
 *   1. Gauss's law: Φ = Q_in/ε₀, where Q_in = ρ·V and V is the volume the two spheres share (a
 *      lens, or the whole small sphere, or none of it). This is geometry, with no field in it.
 *   2. A sum of E·n̂ ΔA over the small sphere, tile by tile, with the field the ball makes:
 *      E = ρr/(3ε₀) inside, ρR³/(3ε₀r²) outside.
 *
 * Divided by the small sphere's volume, the flux is ρ/ε₀ wherever the sphere sits wholly inside
 * the ball and 0 wherever it sits wholly outside, though E is not 0 there. Shrink the sphere onto a
 * point and the ratio is ∇·E at that point: ∇·E = ρ/ε₀.
 *
 * For B, a long straight wire along z carries a current I. Its field circles the wire,
 * B = μ₀I/(2πs). The same sum over the small sphere gives 0 wherever the sphere sits: as much flux
 * goes in as comes out. That is ∇·B = 0.
 *
 * Pure functions in SI units. The lens volume is the standard result for two intersecting spheres,
 * worked out here as two spherical caps.
 */
import { EPS0, MU0 } from './constants.js';

/** Field of a uniformly charged ball (centre at the origin) at p = {x, y, z}. */
export function ballField(p, R, rho) {
  const r = Math.hypot(p.x, p.y, p.z);
  const k = r <= R ? rho / (3 * EPS0) : (rho * R ** 3) / (3 * EPS0 * r ** 3);
  return { x: k * p.x, y: k * p.y, z: k * p.z };
}

/** Field of a long straight wire on the z axis carrying I along +z, at p. */
export function wireField(p, I) {
  const s2 = p.x * p.x + p.y * p.y;
  if (s2 < 1e-24) return { x: 0, y: 0, z: 0 };
  const k = (MU0 * I) / (2 * Math.PI * s2);
  return { x: -k * p.y, y: k * p.x, z: 0 };
}

/** A spherical cap of height h cut from a sphere of radius a: πh²(3a − h)/3. */
const cap = (a, h) => (Math.PI * h * h * (3 * a - h)) / 3;

/**
 * The volume shared by a sphere of radius R and one of radius r whose centres are d apart.
 * Where they overlap, the plane of the circle where the surfaces cross sits at x = (d² + R² − r²)/2d
 * from the big centre; the lens is a cap of the big sphere plus a cap of the small one.
 */
export function lensVolume(R, r, d) {
  const ball = (a) => (4 / 3) * Math.PI * a ** 3;
  if (d >= R + r) return 0;
  if (d + r <= R) return ball(r);
  if (d + R <= r) return ball(R);
  const x = (d * d + R * R - r * r) / (2 * d);
  return cap(R, R - x) + cap(r, r - (d - x));
}

/**
 * ∮ F·n̂ dA over a sphere of radius r centred at c, by the midpoint rule on n bands of equal area
 * (equal steps in cos θ) and 2n steps around. Returns the net flux and the outward and inward parts.
 */
export function sphereFlux(field, c, r, n = 120) {
  const m = 2 * n;
  const dA = (2 / n) * ((2 * Math.PI) / m) * r * r;
  let out = 0;
  let inn = 0;
  for (let i = 0; i < n; i++) {
    const u = -1 + (2 * (i + 0.5)) / n;
    const st = Math.sqrt(1 - u * u);
    for (let j = 0; j < m; j++) {
      const ph = (2 * Math.PI * (j + 0.5)) / m;
      const nx = st * Math.cos(ph);
      const ny = st * Math.sin(ph);
      const F = field({ x: c.x + r * nx, y: c.y + r * ny, z: c.z + r * u });
      const f = (F.x * nx + F.y * ny + F.z * u) * dA;
      if (f > 0) out += f;
      else inn -= f;
    }
  }
  return { net: out - inn, out, in: inn };
}

/**
 * The lab's numbers. state: { mode: 'ball' | 'wire', R, rho, I, r, d }; the small sphere's centre is
 * at (d, 0, 0).
 *   closed     Q_in/ε₀ for the ball (0 for the wire): the flux by Gauss's law
 *   numeric    { net, out, in } from the tile sum
 *   volume     the small sphere's volume
 *   perVolume  numeric.net / volume: what ∇·E (or ∇·B) tends to as r shrinks
 *   pointLaw   ρ/ε₀ at the centre if it is inside the ball, else 0 (0 for B)
 *   share      the fraction of the small sphere inside the ball
 *   fieldAtCentre |E| or |B| at the small sphere's centre
 */
export function divergence({ mode = 'ball', R = 1, rho = 1e-6, I = 10, r = 0.3, d = 0.4 }) {
  const c = { x: d, y: 0, z: 0 };
  const volume = (4 / 3) * Math.PI * r ** 3;
  if (mode === 'wire') {
    const f = (p) => wireField(p, I);
    const numeric = sphereFlux(f, c, r);
    const B = f(c);
    return { mode, closed: 0, numeric, volume, perVolume: numeric.net / volume, pointLaw: 0, share: 0, Qin: 0, fieldAtCentre: Math.hypot(B.x, B.y, B.z), through: d < r };
  }
  const f = (p) => ballField(p, R, rho);
  const shared = lensVolume(R, r, d);
  const Qin = rho * shared;
  const numeric = sphereFlux(f, c, r);
  const E = f(c);
  return {
    mode,
    closed: Qin / EPS0,
    numeric,
    volume,
    perVolume: numeric.net / volume,
    pointLaw: d < R ? rho / EPS0 : 0,
    share: shared / volume,
    Qin,
    fieldAtCentre: Math.hypot(E.x, E.y, E.z),
    through: false,
  };
}

/** How far the tile sum is from Gauss's law, relative to the flux that crosses the surface. */
export function divergenceGap(dv) {
  const scale = Math.max(Math.abs(dv.closed), dv.numeric.out, dv.numeric.in, 1e-30);
  return Math.abs(dv.numeric.net - dv.closed) / scale;
}

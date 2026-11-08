/**
 * A slab cooling in a fluid (EML 4140, transient conduction).
 *
 * A plate of half-thickness L starts at T_i and is plunged into fluid at T_∞ with coefficient h. With
 * θ = (T − T_∞)/(T_i − T_∞), Bi = hL/k and Fo = αt/L², the exact solution is a sum of cosines,
 *   θ(x, t) = Σ C_n e^{−ζ_n² Fo} cos(ζ_n x/L),   ζ_n tan ζ_n = Bi,   C_n = 4 sin ζ_n/(2ζ_n + sin 2ζ_n).
 * The Biot number decides the shape: small Bi, and the plate cools as one lump; large Bi, and the
 * surface drops at once to near T_∞ while the centre is still hot, which is what cracks a quenched part.
 *
 * The second method marches the heat equation by Crank–Nicolson finite differences on the half slab,
 * with symmetry at the centre and convection at the surface.
 */

export const MATERIALS = {
  steel: { name: 'Carbon steel', k: 45, alpha: 1.2e-5 },
  glass: { name: 'Glass', k: 1.4, alpha: 6.5e-7 },
  plastic: { name: 'Polycarbonate', k: 0.2, alpha: 1.4e-7 },
};
export const SLAB = { L: 0.02, Ti: 200, Tinf: 20 };

/** The first n roots of ζ tan ζ = Bi, one in each interval ((n−1)π, (n−1)π + π/2). */
export function eigen(Bi, n = 80) {
  const out = [];
  for (let j = 0; j < n; j++) {
    let lo = j * Math.PI + 1e-12;
    let hi = j * Math.PI + Math.PI / 2 - 1e-12;
    for (let k = 0; k < 100; k++) {
      const mid = (lo + hi) / 2;
      if (mid * Math.tan(mid) < Bi) lo = mid;
      else hi = mid;
    }
    out.push((lo + hi) / 2);
  }
  return out;
}

export function seriesTheta(Bi, Fo, xi, roots = eigen(Bi)) {
  let s = 0;
  for (const z of roots) s += ((4 * Math.sin(z)) / (2 * z + Math.sin(2 * z))) * Math.exp(-z * z * Fo) * Math.cos(z * xi);
  return s;
}

/**
 * Crank–Nicolson on ξ ∈ [0, 1]: θ_Fo = θ_ξξ, θ_ξ(0) = 0, θ_ξ(1) = −Bi θ(1). Returns θ at ξ = 0 and 1.
 * The first steps are backward Euler, which damps the jump at the surface that Crank–Nicolson alone
 * would carry as an oscillation. Steps start small and grow, capped where the slowest mode is still
 * resolved. The grid is fine enough to hold the thin cooled skin of an early time.
 */
export function crankNicolson(Bi, Fo, n = Math.min(800, Math.max(100, Math.ceil(10 / Math.sqrt(Fo))))) {
  const dx = 1 / n;
  // Operator L θ_i = θ_{i−1} − 2θ_i + θ_{i+1}, ghosts folded in: θ₋₁ = θ₁, θ_{n+1} = θ_{n−1} − 2dx·Bi·θ_n.
  const A = (i, j) => {
    if (i === 0) return j === 0 ? -2 : j === 1 ? 2 : 0;
    if (i === n) return j === n - 1 ? 2 : j === n ? -2 - 2 * dx * Bi : 0;
    return j === i - 1 || j === i + 1 ? 1 : j === i ? -2 : 0;
  };
  let th = new Float64Array(n + 1).fill(1);
  const step = (dt, w) => {
    // (I − w r A) θ⁺ = (I + (1 − w) r A) θ, r = dt/dx².
    const r = dt / (dx * dx);
    const lo = new Float64Array(n + 1);
    const di = new Float64Array(n + 1);
    const up = new Float64Array(n + 1);
    const d = new Float64Array(n + 1);
    for (let i = 0; i <= n; i++) {
      lo[i] = i > 0 ? -w * r * A(i, i - 1) : 0;
      di[i] = 1 - w * r * A(i, i);
      up[i] = i < n ? -w * r * A(i, i + 1) : 0;
      let L = A(i, i) * th[i];
      if (i > 0) L += A(i, i - 1) * th[i - 1];
      if (i < n) L += A(i, i + 1) * th[i + 1];
      d[i] = th[i] + (1 - w) * r * L;
    }
    for (let i = 1; i <= n; i++) {
      const q = lo[i] / di[i - 1];
      di[i] -= q * up[i - 1];
      d[i] -= q * d[i - 1];
    }
    const next = new Float64Array(n + 1);
    next[n] = d[n] / di[n];
    for (let i = n - 1; i >= 0; i--) next[i] = (d[i] - up[i] * next[i + 1]) / di[i];
    th = next;
  };
  const dtMax = Math.max(Fo / 2000, Math.min(0.002, Fo / 400));
  let dt = Math.min(Fo / 4000, 1e-7);
  let t = 0;
  for (let k = 0; k < 8 && t < Fo; k++) {
    const h = Math.min(dt, Fo - t);
    step(h, 1);
    t += h;
  }
  while (t < Fo - 1e-15) {
    dt = Math.min(dt * 1.05, dtMax);
    const h = Math.min(dt, Fo - t);
    step(h, 0.5);
    t += h;
  }
  return { centre: th[0], surface: th[n] };
}

export function slabChecked({ mat, h, lt }) {
  const m = MATERIALS[mat];
  const t = 10 ** lt;
  const Bi = (h * SLAB.L) / m.k;
  const Fo = (m.alpha * t) / SLAB.L ** 2;
  const roots = eigen(Bi);
  const at = (xi) => seriesTheta(Bi, Fo, xi, roots);
  const centre = at(0);
  const surface = at(1);
  const fd = crankNicolson(Bi, Fo);
  const gap = Math.max(Math.abs(fd.centre - centre), Math.abs(fd.surface - surface));
  const T = (th) => SLAB.Tinf + (SLAB.Ti - SLAB.Tinf) * th;
  return { Bi, Fo, t, at, centre, surface, Tc: T(centre), Ts: T(surface), dT: T(centre) - T(surface), gap, roots, T };
}

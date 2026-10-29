/**
 * Bending beyond one symmetric material: curvature, a moment tilted off a principal axis, and a
 * section of two materials by the transformed section. Pure, SI. bending-selftest.js checks each
 * result by integrating the stress over the real section.
 */
const DEG = Math.PI / 180;

/**
 * Plane sections stay plane, so a fiber y above the neutral axis has strain −y/ρ. Elastic stress
 * −Ey/ρ, integrated for its moment, gives M = EI/ρ: the curvature is M/EI.
 */
export const curvature = (M, E, I) => M / (E * I);

/** The surface stress of a strip of thickness t bent to radius ρ: E (t/2)/ρ. */
export const bentStripStress = (E, t, rho) => (E * t) / (2 * rho);

/**
 * A b × h rectangle (h vertical) carrying a sagging moment M whose vector is turned θ from the
 * horizontal axis z toward y, as when a load tilts θ from the vertical. Components Mz = M cos θ
 * about the strong axis and My = M sin θ about the weak one. Stress at (y, z), y up, z across:
 * σ = −Mz y/Iz + My z/Iy. The neutral axis, where σ = 0, makes tan α = (Iz/Iy) tan θ with z.
 */
export function tiltedRect(b, h, M, thetaDeg) {
  const Iz = (b * h ** 3) / 12;
  const Iy = (h * b ** 3) / 12;
  const Mz = M * Math.cos(thetaDeg * DEG);
  const My = M * Math.sin(thetaDeg * DEG);
  const stress = (y, z) => (-Mz * y) / Iz + (My * z) / Iy;
  const corners = [[h / 2, b / 2], [h / 2, -b / 2], [-h / 2, b / 2], [-h / 2, -b / 2]].map(([y, z]) => stress(y, z));
  const alpha = Math.atan((Iz / Iy) * Math.tan(thetaDeg * DEG)) / DEG;
  return { Iz, Iy, Mz, My, stress, max: Math.max(...corners), min: Math.min(...corners), alpha, upright: (6 * M) / (b * h * h) };
}

/**
 * Layers stacked bottom to top, each { b, h, E }. Transform every layer to the reference modulus by
 * scaling its width by n = E/Eref; the transformed section bends as one material. Its centroid is
 * the neutral axis. The real stress in a layer is n times the transformed stress at that height.
 */
export function compositeSection(layers, Eref) {
  let y0 = 0;
  const parts = layers.map((L) => {
    const n = L.E / Eref;
    const p = { ...L, n, y0, y1: y0 + L.h, A: n * L.b * L.h, yc: y0 + L.h / 2 };
    y0 += L.h;
    return p;
  });
  const A = parts.reduce((s, p) => s + p.A, 0);
  const ybar = parts.reduce((s, p) => s + p.A * p.yc, 0) / A;
  const I = parts.reduce((s, p) => s + (p.n * p.b * p.h ** 3) / 12 + p.A * (p.yc - ybar) ** 2, 0);
  const H = y0;
  /** Real stress at height y from the bottom, under a sagging moment M. */
  const stress = (M, y) => {
    const p = parts.find((q) => y >= q.y0 - 1e-12 && y <= q.y1 + 1e-12) || parts[parts.length - 1];
    return (-p.n * M * (y - ybar)) / I;
  };
  return { parts, A, ybar, I, H, stress, EI: Eref * I };
}

/**
 * Rectangles side by side or overlapping in height, each { b, h, E, y0 } with y0 its bottom: a
 * flitch beam's plate between two boards, or any section bolted to bend as one. All share one
 * curvature, so the transformed-section rule still holds: scale each width by n = E/Eref, find the
 * centroid, and the real stress in a part at height y is −n M (y − ȳ)/I. Each part carries the
 * moment share EiIi/ΣEI about the common axis.
 */
export function compositeRects(rects, Eref) {
  const parts = rects.map((r) => {
    const n = r.E / Eref;
    const y0 = r.y0 ?? 0;
    return { ...r, n, y0, y1: y0 + r.h, A: n * r.b * r.h, yc: y0 + r.h / 2 };
  });
  const A = parts.reduce((s, p) => s + p.A, 0);
  const ybar = parts.reduce((s, p) => s + p.A * p.yc, 0) / A;
  for (const p of parts) p.I = (p.n * p.b * p.h ** 3) / 12 + p.A * (p.yc - ybar) ** 2;
  const I = parts.reduce((s, p) => s + p.I, 0);
  for (const p of parts) p.share = p.I / I;
  /** Real stress in part i at height y, under a sagging moment M. */
  const stress = (M, i, y) => (-parts[i].n * M * (y - ybar)) / I;
  return { parts, A, ybar, I, stress, EI: Eref * I };
}

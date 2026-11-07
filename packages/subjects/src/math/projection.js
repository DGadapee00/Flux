/**
 * Orthogonal projection onto the plane of two vectors: least squares (EGN 3203, Matrices).
 *
 * With columns a₁ and a₂ in A, the point p = A x̂ of their plane closest to b has its error b − p
 * perpendicular to both columns, Aᵀ(b − p) = 0, which is the normal equations AᵀA x̂ = Aᵀb.
 * Projecting b onto each column on its own and adding,
 *   (b·a₁/a₁·a₁) a₁ + (b·a₂/a₂·a₂) a₂,
 * gives p only when a₁ ⊥ a₂: otherwise the two shadows overlap and the sum overshoots.
 *
 * The second method builds an orthonormal pair q₁, q₂ by Gram–Schmidt, projects with them, and reads
 * x̂ back by solving R x̂ = Qᵀb.
 */
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const add = (u, v) => u.map((x, i) => x + v[i]);
const scale = (u, k) => u.map((x) => x * k);
const norm = (u) => Math.sqrt(dot(u, u));

/** a₁ = (1, 0, 0) and a₂ at angle θ (degrees) to it in the z = 0 plane, length L; b = (bu, bv, bw). */
export function projection({ theta, L, bu, bv, bw }) {
  const t = (theta * Math.PI) / 180;
  const a1 = [1, 0, 0];
  const a2 = [L * Math.cos(t), L * Math.sin(t), 0];
  const b = [bu, bv, bw];
  // Normal equations: [a1·a1 a1·a2; a2·a1 a2·a2] x = [a1·b; a2·b].
  const g11 = dot(a1, a1);
  const g12 = dot(a1, a2);
  const g22 = dot(a2, a2);
  const r1 = dot(a1, b);
  const r2 = dot(a2, b);
  const det = g11 * g22 - g12 * g12;
  const xhat = [(r1 * g22 - g12 * r2) / det, (g11 * r2 - g12 * r1) / det];
  const p = add(scale(a1, xhat[0]), scale(a2, xhat[1]));
  const e = add(b, scale(p, -1));
  // Gram–Schmidt: q1 = a1/|a1|, q2 = (a2 − (q1·a2)q1)/|…|; R = [[|a1|, q1·a2], [0, |a2 − …|]].
  const R11 = norm(a1);
  const q1 = scale(a1, 1 / R11);
  const R12 = dot(q1, a2);
  const w = add(a2, scale(q1, -R12));
  const R22 = norm(w);
  const q2 = scale(w, 1 / R22);
  const c1 = dot(q1, b);
  const c2 = dot(q2, b);
  const pGS = add(scale(q1, c1), scale(q2, c2));
  const x2 = c2 / R22;
  const xGS = [(c1 - R12 * x2) / R11, x2];
  // Projecting onto each arrow on its own and adding.
  const naive = add(scale(a1, r1 / g11), scale(a2, r2 / g22));
  const gap = Math.max(norm(add(p, scale(pGS, -1))), Math.abs(xhat[0] - xGS[0]), Math.abs(xhat[1] - xGS[1])) / Math.max(norm(b), 1e-12);
  return { a1, a2, b, xhat, p, e, err: norm(e), eDots: [dot(e, a1), dot(e, a2)], naive, naiveErr: norm(add(naive, scale(p, -1))), naiveDots: [dot(add(b, scale(naive, -1)), a1), dot(add(b, scale(naive, -1)), a2)], cond: (g11 + g22 + Math.sqrt((g11 - g22) ** 2 + 4 * g12 * g12)) / (g11 + g22 - Math.sqrt((g11 - g22) ** 2 + 4 * g12 * g12)), pGS, xGS, gap };
}

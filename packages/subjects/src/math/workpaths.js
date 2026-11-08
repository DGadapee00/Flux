/**
 * Work along two paths, and Green's theorem for the difference (MAC 2313, line integrals).
 *
 * The work of a plane field F = (P, Q) along a path r(t) is W = ∫ F · dr = ∫₀¹ F(r(t)) · r′(t) dt.
 * Two paths join A to B: the straight segment, and a bowed one that bulges sideways by h at its
 * middle, r(t) = A + t(B − A) + 4h t(1 − t) n̂. For a gradient field F = ∇φ both give φ(B) − φ(A).
 * Otherwise they differ, and by Green's theorem the difference is the curl summed over the region
 * between them:
 *   W_bowed − W_straight = −∬ (∂Q/∂x − ∂P/∂y) dA, with dA counted positive for h > 0,
 * since bowing to the left of A→B makes the loop (out along the bow, back along the segment)
 * run clockwise.
 *
 * The line integrals are summed by Simpson's rule in t. The second method sums the curl over the
 * region between the paths, mapped to (t, s) ∈ [0, 1]², again by Simpson's rule.
 */

export const A = { x: -1.2, y: -0.8 };

export const FIELDS = {
  gradient: {
    id: 'gradient', name: 'A gradient: F = ∇φ, φ = ½x² + 0.4xy − 0.3y²', tex: '\\mathbf F=(x+0.4y,\;0.4x-0.6y)',
    P: (x, y) => x + 0.4 * y, Q: (x, y) => 0.4 * x - 0.6 * y, curl: () => 0, phi: (x, y) => 0.5 * x * x + 0.4 * x * y - 0.3 * y * y,
  },
  swirl: {
    id: 'swirl', name: 'A swirl: F = (−y, x)', tex: '\\mathbf F=(-y,\;x)',
    P: (x, y) => -y, Q: (x) => x, curl: () => 2,
  },
  shear: {
    id: 'shear', name: 'A shear: F = (y, 0)', tex: '\\mathbf F=(y,\;0)',
    P: (x, y) => y, Q: () => 0, curl: () => -1,
  },
  mixed: {
    id: 'mixed', name: 'A gradient plus a swirl that grows outward', tex: '\\mathbf F=(x - x^2y,\;y + xy^2)',
    P: (x, y) => x - x * x * y, Q: (x, y) => y + x * y * y, curl: (x, y) => y * y + x * x,
  },
};
export const fieldById = (id) => FIELDS[id] || FIELDS.gradient;

export function pathOf(B, h, bowed) {
  const dx = B.x - A.x;
  const dy = B.y - A.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const k = bowed ? h : 0;
  return {
    r: (t) => ({ x: A.x + t * dx + 4 * k * t * (1 - t) * nx, y: A.y + t * dy + 4 * k * t * (1 - t) * ny }),
    dr: (t) => ({ x: dx + 4 * k * (1 - 2 * t) * nx, y: dy + 4 * k * (1 - 2 * t) * ny }),
    n: { x: nx, y: ny },
    L,
  };
}

export function work(field, path, n = 400) {
  const f = (t) => {
    const p = path.r(t);
    const d = path.dr(t);
    return field.P(p.x, p.y) * d.x + field.Q(p.x, p.y) * d.y;
  };
  const h = 1 / n;
  let s = f(0) + f(1);
  for (let i = 1; i < n; i++) s += f(i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** ∬ curl over the region between the paths, with the sign of h: x(t, s) = straight(t) + s·4h t(1 − t) n̂. */
export function curlBetween(field, B, h, n = 120) {
  const p = pathOf(B, h, false);
  const g = (t, s) => {
    const base = p.r(t);
    const off = 4 * h * t * (1 - t) * s;
    const x = base.x + off * p.n.x;
    const y = base.y + off * p.n.y;
    return field.curl(x, y) * p.L * 4 * h * t * (1 - t);
  };
  const w = (i) => (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
  let sum = 0;
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) sum += w(i) * w(j) * g(i / n, j / n);
  return (sum / (3 * n)) / (3 * n);
}

export function workChecked({ field: fid, bow, probe }) {
  const field = fieldById(fid);
  const B = { x: probe.x, y: probe.y };
  const W1 = work(field, pathOf(B, bow, false));
  const W2 = work(field, pathOf(B, bow, true));
  const green = -curlBetween(field, B, bow);
  const dphi = field.phi ? field.phi(B.x, B.y) - field.phi(A.x, A.y) : null;
  const scale = Math.max(1, Math.abs(W1), Math.abs(W2));
  let gap = Math.abs(W2 - W1 - green) / scale;
  if (dphi !== null) gap = Math.max(gap, Math.abs(W1 - dphi) / scale, Math.abs(W2 - dphi) / scale);
  return { field, B, W1, W2, diff: W2 - W1, green, dphi, gap };
}

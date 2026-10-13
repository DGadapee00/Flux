/**
 * 1D adaptive Simpson and a 2D tensor-product composite Simpson.
 *
 * The 2D integrator takes its integration order as a parameter so Fubini (dx inner vs dy inner)
 * is a real second route, not the same loop run twice.
 */

function compositeSimpson(f, a, b, n) {
  if (n < 2) n = 2;
  if (n % 2) n += 1;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += f(x) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * sum;
}

function simpsonPanel(f, a, b) {
  const m = 0.5 * (a + b);
  return ((b - a) / 6) * (f(a) + 4 * f(m) + f(b));
}

function adaptiveRec(f, a, b, fa, fm, fb, S, tol, depth) {
  const m = 0.5 * (a + b);
  const lm = 0.5 * (a + m);
  const rm = 0.5 * (m + b);
  const flm = f(lm);
  const frm = f(rm);
  const SL = ((m - a) / 6) * (fa + 4 * flm + fm);
  const SR = ((b - m) / 6) * (fm + 4 * frm + fb);
  const err = SL + SR - S;
  if (depth <= 0 || Math.abs(err) < 15 * tol) return SL + SR + err / 15;
  return (
    adaptiveRec(f, a, m, fa, flm, fm, SL, tol / 2, depth - 1) +
    adaptiveRec(f, m, b, fm, frm, fb, SR, tol / 2, depth - 1)
  );
}

export function simpson(f, a, b, tol = 1e-8, maxDepth = 20) {
  const fa = f(a);
  const fb = f(b);
  const m = 0.5 * (a + b);
  const fm = f(m);
  const S = ((b - a) / 6) * (fa + 4 * fm + fb);
  return adaptiveRec(f, a, b, fa, fm, fb, S, tol, maxDepth);
}

/**
 * ∬_R f(x,y) dA on a rectangle.
 *
 * `order: 'xy'` → ∫_{xa}^{xb} ( ∫_{ya}^{yb} f(x,y) dy ) dx
 * `order: 'yx'` → ∫_{ya}^{yb} ( ∫_{xa}^{xb} f(x,y) dx ) dy
 *
 * n is the number of composite-Simpson panels along each axis (forced even).
 */
export function integral2(f, xa, xb, ya, yb, { order = 'xy', n = 64 } = {}) {
  if (order === 'yx') {
    const inner = (y) => compositeSimpson((x) => f(x, y), xa, xb, n);
    return compositeSimpson(inner, ya, yb, n);
  }
  const inner = (x) => compositeSimpson((y) => f(x, y), ya, yb, n);
  return compositeSimpson(inner, xa, xb, n);
}

/**
 * ∫_{θ=t0}^{t1} ∫_{r=r0}^{r1} f(r,θ) r dr dθ — the Jacobian is included here, not by the caller.
 * `jacobian: false` drops the r, which is the mistake the polar lab draws.
 */
export function integralPolar(f, r0, r1, t0, t1, { n = 64, jacobian = true } = {}) {
  const w = jacobian ? (r) => r : () => 1;
  return integral2((r, th) => f(r, th) * w(r), r0, r1, t0, t1, { order: 'xy', n });
}

/**
 * Type I: ∫_{xa}^{xb} ∫_{yLo(x)}^{yHi(x)} f(x,y) dy dx.
 * Type II: ∫_{ya}^{yb} ∫_{xLo(y)}^{xHi(y)} f(x,y) dx dy.
 * Independent loops — Fubini on a non-rectangle is a real second route.
 */
export function integralTypeI(f, xa, xb, yLo, yHi, { n = 64 } = {}) {
  const inner = (x) => {
    const lo = yLo(x);
    const hi = yHi(x);
    if (!(hi > lo)) return 0;
    return compositeSimpson((y) => f(x, y), lo, hi, n);
  };
  return compositeSimpson(inner, xa, xb, n);
}

export function integralTypeII(f, ya, yb, xLo, xHi, { n = 64 } = {}) {
  const inner = (y) => {
    const lo = xLo(y);
    const hi = xHi(y);
    if (!(hi > lo)) return 0;
    return compositeSimpson((x) => f(x, y), lo, hi, n);
  };
  return compositeSimpson(inner, ya, yb, n);
}

/**
 * Triple integral on a box. `order: 'xyz'` is ∫_x ∫_y ∫_z f dz dy dx;
 * `order: 'zyx'` swaps to ∫_z ∫_y ∫_x f dx dy dz — a real Fubini check.
 */
export function integral3(f, xa, xb, ya, yb, za, zb, { order = 'xyz', n = 16 } = {}) {
  if (order === 'zyx') {
    const inner = (z) => {
      const mid = (y) => compositeSimpson((x) => f(x, y, z), xa, xb, n);
      return compositeSimpson(mid, ya, yb, n);
    };
    return compositeSimpson(inner, za, zb, n);
  }
  const inner = (x) => {
    const mid = (y) => compositeSimpson((z) => f(x, y, z), za, zb, n);
    return compositeSimpson(mid, ya, yb, n);
  };
  return compositeSimpson(inner, xa, xb, n);
}

/**
 * ∭ f r dr dθ dz over r∈[0,R], θ∈[0,2π), z∈[z0,z1]. Jacobian r is included here.
 * `jacobian: false` drops the r.
 */
export function integralCyl(f, R, z0, z1, { n = 24, jacobian = true } = {}) {
  const w = jacobian ? (r) => r : () => 1;
  const g = (r, th, z) => f(r * Math.cos(th), r * Math.sin(th), z) * w(r);
  const inner = (z) => {
    const mid = (th) => compositeSimpson((r) => g(r, th, z), 0, R, n);
    return compositeSimpson(mid, 0, 2 * Math.PI, n);
  };
  return compositeSimpson(inner, z0, z1, n);
}

/**
 * The same cylinder in Cartesian: x∈[−R,R], y∈[−√(R²−x²), √(R²−x²)], z∈[z0,z1].
 * No Jacobian r — a real second route against integralCyl.
 */
export function integralCylCart(f, R, z0, z1, { n = 24 } = {}) {
  const inner = (x) => {
    const yLim = Math.sqrt(Math.max(0, R * R - x * x));
    if (yLim <= 0) return 0;
    const mid = (y) => compositeSimpson((z) => f(x, y, z), z0, z1, n);
    return compositeSimpson(mid, -yLim, yLim, n);
  };
  return compositeSimpson(inner, -R, R, n);
}

/**
 * ∭ f ρ² sinφ dρ dφ dθ over ρ∈[0,R], φ∈[0,π], θ∈[0,2π). Jacobian included here.
 * φ is the angle from the positive z-axis.
 * `sinPhi: false` keeps ρ² and drops sinφ — the mistake the spherical lab draws.
 */
export function integralSph(f, R, { n = 24, sinPhi = true } = {}) {
  const g = (rho, phi, th) => {
    const s = Math.sin(phi);
    const c = Math.cos(phi);
    const x = rho * s * Math.cos(th);
    const y = rho * s * Math.sin(th);
    const z = rho * c;
    return f(x, y, z) * rho * rho * (sinPhi ? s : 1);
  };
  const inner = (th) => {
    const mid = (phi) => compositeSimpson((rho) => g(rho, phi, th), 0, R, n);
    return compositeSimpson(mid, 0, Math.PI, n);
  };
  return compositeSimpson(inner, 0, 2 * Math.PI, n);
}

/**
 * The same ball in Cartesian: x²+y²+z² ≤ R², nested type-I style. No ρ² sin φ.
 */
export function integralSphCart(f, R, { n = 24 } = {}) {
  const inner = (x) => {
    const yLim0 = Math.sqrt(Math.max(0, R * R - x * x));
    if (yLim0 <= 0) return 0;
    const mid = (y) => {
      const zLim = Math.sqrt(Math.max(0, R * R - x * x - y * y));
      if (zLim <= 0) return 0;
      return compositeSimpson((z) => f(x, y, z), -zLim, zLim, n);
    };
    return compositeSimpson(mid, -yLim0, yLim0, n);
  };
  return compositeSimpson(inner, -R, R, n);
}

export { compositeSimpson };

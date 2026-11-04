/** Closed forms for the solution methods a first course in differential equations adds to the
 * modes-and-response spine: exact equations, substitutions, compartment and drag models,
 * variation of parameters, Cauchy–Euler equations, higher-order constant-coefficient equations
 * and Laplace transform rules. Each formula is derived in the MAP 2302 notes; the labs and
 * tests check it against RK4 or quadrature. */

/** One real root of g(y)=0 by safeguarded Newton from a starting guess. */
export function newtonRoot(g, dg, y, tol = 1e-13, max = 80) {
  for (let i = 0; i < max; i++) {
    const v = g(y), d = dg(y);
    if (!Number.isFinite(v) || !Number.isFinite(d) || d === 0) break;
    const step = v / d;
    y -= step;
    if (Math.abs(step) <= tol * Math.max(1, Math.abs(y))) return y;
  }
  if (Math.abs(g(y)) < 1e-9) return y;
  throw new RangeError('Newton iteration did not converge');
}

/* ---------- First-order methods ---------- */

/** (2xy+1)dx+(x²+3y²)dy=0 has potential F=x²y+x+y³. F is increasing in y, so F=C has one real y. */
export const exactCubic = {
  M: (x, y) => 2 * x * y + 1,
  N: (x, y) => x * x + 3 * y * y,
  My: (x) => 2 * x,
  Nx: (x) => 2 * x,
  F: (x, y) => x * x * y + x + y ** 3,
  solve(x0, y0, x) {
    const C = this.F(x0, y0);
    return newtonRoot((y) => this.F(x, y) - C, (y) => x * x + 3 * y * y, y0);
  },
};

/** (3xy+y²)dx+(x²+xy)dy=0 is not exact; μ=x makes it exact with F=x³y+x²y²/2.
 * F=C is a quadratic in y; the root on the branch through the initial point is kept. */
export const factorQuadratic = {
  M: (x, y) => 3 * x * y + y * y,
  N: (x, y) => x * x + x * y,
  My: (x, y) => 3 * x + 2 * y,
  Nx: (x, y) => 2 * x + y,
  mu: (x) => x,
  F: (x, y) => x ** 3 * y + (x * x * y * y) / 2,
  solve(x0, y0, x) {
    const C = this.F(x0, y0), sign = Math.sign(y0 + x0) || 1;
    const disc = x ** 6 + 2 * x * x * C;
    if (disc < 0) throw new RangeError('The level curve has left the real plane');
    return (-(x ** 3) + sign * Math.sqrt(disc)) / (x * x);
  },
};

/** y′=(x²+y²)/(xy) is homogeneous. With v=y/x, x v′=1/v, so v²=v₀²+2 ln(x/x₀). */
export const homogeneousRatio = {
  f: (x, y) => (x * x + y * y) / (x * y),
  solve(x0, y0, x) {
    const v0 = y0 / x0, v2 = v0 * v0 + 2 * Math.log(x / x0);
    if (!(v2 > 0)) throw new RangeError('The ratio y/x reached zero');
    return Math.sign(v0) * x * Math.sqrt(v2);
  },
};

/** Bernoulli y′+y/x=xy². With w=1/y, w′−w/x=−x, so w=x(K−x) and K=1/(x₀y₀)+x₀. */
export const bernoulliSquare = {
  f: (x, y) => x * y * y - y / x,
  solve(x0, y0, x) {
    const K = 1 / (x0 * y0) + x0, w = x * (K - x);
    if (w === 0) throw new RangeError('The solution has a pole here');
    return 1 / w;
  },
  pole(x0, y0) {
    return 1 / (x0 * y0) + x0;
  },
};

/** Two tanks in series. Fresh water enters tank 1 at q; tank 1 drains into tank 2 at q;
 * tank 2 drains at q. With k₁=q/V₁, k₂=q/V₂ the solute masses decay and pass downstream. */
export function twoTanks(q, V1, V2, a0, b0, t) {
  const k1 = q / V1, k2 = q / V2, a = a0 * Math.exp(-k1 * t);
  const pass = Math.abs(k1 - k2) < 1e-12 ? k1 * a0 * t * Math.exp(-k1 * t) : (k1 * a0 * (Math.exp(-k1 * t) - Math.exp(-k2 * t))) / (k2 - k1);
  const b = b0 * Math.exp(-k2 * t) + pass;
  const peak = b0 === 0 && Math.abs(k1 - k2) > 1e-12 ? Math.log(k1 / k2) / (k1 - k2) : b0 === 0 ? 1 / k1 : null;
  return { a, b, k1, k2, peak };
}

/** A building: T′=K(M(t)−T)+H with outdoor M=M₀−B cos ωt and constant heating rate H.
 * The steady part is M₀+H/K−B(cos ωt+(ω/K) sin ωt)/(1+(ω/K)²); a decaying exponential matches T(0). */
export function building(K, M0, B, H, w, T0, t) {
  const r = w / K, F = (u) => (Math.cos(w * u) + r * Math.sin(w * u)) / (1 + r * r);
  const base = M0 + H / K, C = T0 - base + B * F(0);
  const T = base - B * F(t) + C * Math.exp(-K * t);
  return { T, mean: base, swing: B / Math.sqrt(1 + r * r), lag: Math.atan(r) / w, outdoor: M0 - B * Math.cos(w * t) };
}

/** Falling with linear drag: m v′=mg−bv. Distance is the integral of velocity. */
export function linearDrag(m, b, g, v0, t) {
  const vt = (m * g) / b, tau = m / b, e = Math.exp(-t / tau);
  return { v: vt + (v0 - vt) * e, x: vt * t + tau * (v0 - vt) * (1 - e), vt, tau };
}

/** Falling with quadratic drag: m v′=mg−cv², 0≤v₀<v_t. Separation gives a tanh with v_t=√(mg/c). */
export function quadraticDrag(m, c, g, v0, t) {
  const vt = Math.sqrt((m * g) / c);
  if (!(v0 >= 0 && v0 < vt)) throw new RangeError('Initial speed must be below terminal speed');
  const a = Math.atanh(v0 / vt), u = (g * t) / vt + a;
  const lncosh = (z) => Math.abs(z) + Math.log1p(Math.exp(-2 * Math.abs(z))) - Math.LN2;
  return { v: vt * Math.tanh(u), x: ((vt * vt) / g) * (lncosh(u) - lncosh(a)), vt };
}

/* ---------- Second-order methods ---------- */

/** y″+y=sec t on |t|<π/2. Variation of parameters gives y_p=cos t ln(cos t)+t sin t,
 * with y_p(0)=y_p′(0)=0, so y=y₀cos t+v₀sin t+y_p. */
export function secantForced(y0, v0, t) {
  if (!(Math.abs(t) < Math.PI / 2)) throw new RangeError('sec t is defined only for |t|<π/2');
  const c = Math.cos(t), s = Math.sin(t), L = Math.log(c);
  const yp = c * L + t * s, vp = -s * L + t * c;
  return { y: y0 * c + v0 * s + yp, v: -y0 * s + v0 * c + vp, u1: L, u2: t, W: 1, yp };
}

/** y″−2y′+y=eᵗ/t on t>0. With y₁=eᵗ, y₂=teᵗ and W=e^(2t): u₁′=−1, u₂′=1/t,
 * so y_p=teᵗ(ln t−1). Constants fit y(t₀), y′(t₀). */
export function repeatedForced(t0, y0, v0, t) {
  const yp = (u) => u * Math.exp(u) * (Math.log(u) - 1);
  const vp = (u) => Math.exp(u) * ((u + 1) * (Math.log(u) - 1) + 1);
  if (!(t0 > 0 && t > 0)) throw new RangeError('The forcing eᵗ/t needs t>0');
  // y_h=(c₁+c₂t)eᵗ, y_h′=(c₁+c₂+c₂t)eᵗ.
  const A = (y0 - yp(t0)) / Math.exp(t0), B = (v0 - vp(t0)) / Math.exp(t0);
  const c2 = B - A, c1 = A - c2 * t0;
  return { y: (c1 + c2 * t) * Math.exp(t) + yp(t), v: (c1 + c2 + c2 * t) * Math.exp(t) + vp(t), yp: yp(t), W: Math.exp(2 * t) };
}

/** y‴+y′=sec t on |t|<π/2, at rest at 0. The kernel 1−cos(t−τ) gives
 * y_p=ln(sec t+tan t)−t cos t+sin t ln(cos t). */
export function thirdOrderSecant(t) {
  if (!(Math.abs(t) < Math.PI / 2)) throw new RangeError('sec t is defined only for |t|<π/2');
  const c = Math.cos(t), s = Math.sin(t);
  const y = Math.log(1 / c + s / c) - t * c + s * Math.log(c);
  const v = 1 / c - c + t * s + c * Math.log(c) - (s * s) / c;
  return { y, v };
}

/** x²y″+axy′+by=0 on x>0 with y(x₀)=y₀, y′(x₀)=v₀. y=xʳ gives r²+(a−1)r+b=0.
 * Distinct, repeated and complex roots give xʳ, xʳ ln x and x^α cos(β ln x), x^α sin(β ln x). */
export function cauchyEuler(a, b, x0, y0, v0, x) {
  const p = a - 1, D = p * p - 4 * b;
  // Work in s=ln(x/x₀): Y″+pY′+bY=0 with Y(0)=y₀, Y′(0)=x₀v₀. Then y′=Y′/x.
  const s = Math.log(x / x0), Y0 = y0, Yp0 = x0 * v0;
  let Y, Yp, kind, roots;
  if (D > 1e-12) {
    const r1 = (-p + Math.sqrt(D)) / 2, r2 = (-p - Math.sqrt(D)) / 2;
    const A = (Yp0 - r2 * Y0) / (r1 - r2), B = (r1 * Y0 - Yp0) / (r1 - r2);
    Y = A * Math.exp(r1 * s) + B * Math.exp(r2 * s);
    Yp = A * r1 * Math.exp(r1 * s) + B * r2 * Math.exp(r2 * s);
    kind = 'distinct'; roots = [r1, r2];
  } else if (D < -1e-12) {
    const al = -p / 2, be = Math.sqrt(-D) / 2, A = Y0, B = (Yp0 - al * Y0) / be, e = Math.exp(al * s);
    Y = e * (A * Math.cos(be * s) + B * Math.sin(be * s));
    Yp = al * Y + e * be * (-A * Math.sin(be * s) + B * Math.cos(be * s));
    kind = 'complex'; roots = [al, be];
  } else {
    const r = -p / 2, A = Y0, B = Yp0 - r * Y0, e = Math.exp(r * s);
    Y = e * (A + B * s);
    Yp = r * Y + e * B;
    kind = 'repeated'; roots = [r, r];
  }
  return { y: Y, v: Yp / x, kind, roots, disc: D };
}

/** x y″−(x+1)y′+y=0 has y₁=eˣ. Reduction of order, y=u eˣ, leaves x u″+(x−1)u′=0, so u′=Cxe^(−x),
 * u=−C(x+1)e^(−x) and y₂=x+1 up to a multiple. The general solution c₁eˣ+c₂(x+1) is fitted at x₀≠0. */
export function reductionExample(x0, y0, v0, x) {
  // Solve c₁e^(x₀)+c₂(x₀+1)=y₀ and c₁e^(x₀)+c₂=v₀.
  const c2 = (y0 - v0) / x0, c1 = (v0 - c2) / Math.exp(x0);
  return { y: c1 * Math.exp(x) + c2 * (x + 1), v: c1 * Math.exp(x) + c2, c1, c2, W: x * Math.exp(x) };
}

/* ---------- Higher order ---------- */

const cx = (re, im = 0) => ({ re, im });
const cmul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cadd = (a, b) => cx(a.re + b.re, a.im + b.im);
const cscale = (a, k) => cx(a.re * k, a.im * k);
const cpow = (a, n) => { let r = cx(1); for (let i = 0; i < n; i++) r = cmul(r, a); return r; };
const cexp = (a) => cx(Math.exp(a.re) * Math.cos(a.im), Math.exp(a.re) * Math.sin(a.im));
const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
const falling = (k, i) => { let r = 1; for (let j = 0; j < i; j++) r *= k - j; return r; };

/** Roots as {re, im, m}: a real root, or a conjugate pair a±ib listed once with b>0. */
export function basisFromRoots(roots) {
  const basis = [];
  for (const r of roots) {
    for (let k = 0; k < r.m; k++) {
      if (r.im) {
        basis.push({ lam: cx(r.re, r.im), k, part: 're' });
        basis.push({ lam: cx(r.re, r.im), k, part: 'im' });
      } else basis.push({ lam: cx(r.re), k, part: 're' });
    }
  }
  return basis;
}

/** j-th derivative of t^k e^(λt), taking the real or imaginary part. */
export function basisDerivative(b, j, t) {
  let sum = cx(0);
  for (let i = 0; i <= Math.min(j, b.k); i++) {
    const coef = choose(j, i) * falling(b.k, i) * (b.k - i === 0 ? 1 : t ** (b.k - i));
    sum = cadd(sum, cscale(cpow(b.lam, j - i), coef));
  }
  const v = cmul(sum, cexp(cscale(b.lam, t)));
  return b.part === 're' ? v.re : v.im;
}

/** Characteristic polynomial coefficients [1, a_{n-1}, …, a_0] from the roots. */
export function polyFromRoots(roots) {
  let p = [cx(1)];
  const factor = (lam) => {
    const q = Array.from({ length: p.length + 1 }, () => cx(0));
    p.forEach((c, i) => { q[i] = cadd(q[i], c); q[i + 1] = cadd(q[i + 1], cscale(cmul(c, lam), -1)); });
    p = q;
  };
  for (const r of roots) for (let k = 0; k < r.m; k++) {
    factor(cx(r.re, r.im || 0));
    if (r.im) factor(cx(r.re, -r.im));
  }
  return p.map((c) => (Math.abs(c.re) < 1e-12 ? 0 : c.re));
}

/** Solve A x = b by Gaussian elimination with partial pivoting. */
export function solveLinear(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) throw new RangeError('Singular system');
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/** Determinant by elimination. */
export function det(A) {
  const n = A.length, M = A.map((r) => [...r]);
  let d = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (M[p][c] === 0) return 0;
    if (p !== c) { [M[c], M[p]] = [M[p], M[c]]; d = -d; }
    d *= M[c][c];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k < n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return d;
}

/** Wronskian matrix of a basis at t: row j holds the j-th derivatives. */
export function wronskian(basis, t) {
  const n = basis.length;
  return det(Array.from({ length: n }, (_, j) => basis.map((b) => basisDerivative(b, j, t))));
}

/** Homogeneous solution with initial data y(0), y′(0), …, y^(n−1)(0) given as `init`.
 * `particular(j, t)` returns the j-th derivative of a particular solution (zero if omitted). */
export function higherOrder(roots, init, t, particular = () => 0) {
  const basis = basisFromRoots(roots), n = basis.length;
  if (init.length !== n) throw new RangeError(`Order ${n} needs ${n} initial values`);
  const A = Array.from({ length: n }, (_, j) => basis.map((b) => basisDerivative(b, j, 0)));
  const rhs = init.map((v, j) => v - particular(j, 0));
  const c = solveLinear(A, rhs);
  const deriv = (j, u) => basis.reduce((s, b, i) => s + c[i] * basisDerivative(b, j, u), 0) + particular(j, u);
  return { y: deriv(0, t), derivs: Array.from({ length: n }, (_, j) => deriv(j, t)), coeffs: c, basis, poly: polyFromRoots(roots) };
}

/* ---------- Laplace transform rules ---------- */

/** Closed-form transforms used by the transform-rules lab. Each is valid for s greater than its abscissa. */
export const transformRules = {
  tsin: { f: (t, p) => t * Math.sin(p.b * t), F: (s, p) => (2 * p.b * s) / (s * s + p.b * p.b) ** 2, abscissa: () => 0 },
  tnexp: {
    f: (t, p) => t ** p.n * Math.exp(p.a * t),
    F: (s, p) => { let f = 1; for (let i = 2; i <= p.n; i++) f *= i; return f / (s - p.a) ** (p.n + 1); },
    abscissa: (p) => p.a,
  },
  shiftcos: { f: (t, p) => Math.exp(p.a * t) * Math.cos(p.b * t), F: (s, p) => (s - p.a) / ((s - p.a) ** 2 + p.b * p.b), abscissa: (p) => p.a },
  delayed: { f: (t, p) => (t >= p.c ? (t - p.c) ** 2 : 0), F: (s, p) => (2 * Math.exp(-p.c * s)) / s ** 3, abscissa: () => 0, breaks: (p) => [p.c] },
  square: {
    f: (t, p) => ((t % p.T) < p.T / 2 ? 1 : 0),
    F: (s, p) => 1 / (s * (1 + Math.exp((-s * p.T) / 2))),
    abscissa: () => 0,
    breaks: (p, end) => Array.from({ length: Math.ceil((2 * end) / p.T) }, (_, i) => ((i + 1) * p.T) / 2),
  },
};

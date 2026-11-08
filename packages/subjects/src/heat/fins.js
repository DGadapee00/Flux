/**
 * A pin fin with a convecting tip (EML 4140, extended surfaces).
 *
 * A rod of diameter D and length L stands out of a wall at T_b into fluid at T_∞ with coefficient h.
 * With θ = T − T_∞, conduction along it and convection off its side give θ″ = m²θ, m = √(4h/kD).
 * With the tip convecting too, the closed form is
 *   θ/θ_b = [cosh m(L − x) + (h/mk) sinh m(L − x)] / [cosh mL + (h/mk) sinh mL],
 *   q = √(hPkA_c) θ_b · [sinh mL + (h/mk) cosh mL] / [cosh mL + (h/mk) sinh mL].
 * The heat levels off at √(hPkA_c) θ_b once mL passes about 2: a longer fin adds metal whose far end
 * is already near T_∞. A fin helps only if its effectiveness q/(hA_cθ_b) exceeds 1, which fails for
 * a poor conductor in a strong flow.
 *
 * The second method solves θ″ = m²θ by finite differences, on at least 2000 cells and 200 per unit
 * of mL, with the convective tip condition, and sums the heat leaving the side and the tip.
 */

export const MATERIALS = {
  copper: { name: 'Copper', k: 400 },
  aluminium: { name: 'Aluminium', k: 200 },
  steel: { name: 'Stainless steel', k: 15 },
  plastic: { name: 'Nylon', k: 0.25 },
};
export const FIN = { D: 0.005, Tb: 100, Tinf: 25 };

export function finClosed({ k, h, L }) {
  const { D, Tb, Tinf } = FIN;
  const P = Math.PI * D;
  const A = (Math.PI * D * D) / 4;
  const m = Math.sqrt((h * P) / (k * A));
  const r = h / (m * k);
  const tb = Tb - Tinf;
  const den = Math.cosh(m * L) + r * Math.sinh(m * L);
  const M = Math.sqrt(h * P * k * A) * tb;
  const q = (M * (Math.sinh(m * L) + r * Math.cosh(m * L))) / den;
  const theta = (x) => (tb * (Math.cosh(m * (L - x)) + r * Math.sinh(m * (L - x)))) / den;
  const bare = h * A * tb;
  return { m, mL: m * L, q, qMax: M, theta, bare, eff: q / bare, eta: q / (h * (P * L + A) * tb), P, A, tb };
}

/** Finite differences: θ″ = m²θ, θ(0) = θ_b, −kθ′(L) = hθ(L). Thomas algorithm. */
export function finNumeric({ k, h, L }, n = 2000) {
  const { D, Tb, Tinf } = FIN;
  const P = Math.PI * D;
  const A = (Math.PI * D * D) / 4;
  const m2 = (h * P) / (k * A);
  const dx = L / n;
  const tb = Tb - Tinf;
  // Unknowns θ₁…θ_n. Interior: θ_{i−1} − (2 + m²dx²)θ_i + θ_{i+1} = 0. Tip (i = n), a half cell:
  // k(θ_{n−1} − θ_n)/dx − hθ_n − hP(dx/2)θ_n/A = 0.
  const a = new Float64Array(n + 1);
  const b = new Float64Array(n + 1);
  const cc = new Float64Array(n + 1);
  const d = new Float64Array(n + 1);
  for (let i = 1; i < n; i++) {
    a[i] = 1;
    b[i] = -(2 + m2 * dx * dx);
    cc[i] = 1;
  }
  d[1] = -tb;
  a[1] = 0;
  a[n] = k / dx;
  b[n] = -(k / dx + h + (h * P * dx) / (2 * A));
  cc[n] = 0;
  for (let i = 2; i <= n; i++) {
    const w = a[i] / b[i - 1];
    b[i] -= w * cc[i - 1];
    d[i] -= w * d[i - 1];
  }
  const th = new Float64Array(n + 1);
  th[0] = tb;
  th[n] = d[n] / b[n];
  for (let i = n - 1; i >= 1; i--) th[i] = (d[i] - cc[i] * th[i + 1]) / b[i];
  // Heat leaving the side (trapezoid) and the tip.
  let side = 0;
  for (let i = 0; i < n; i++) side += ((th[i] + th[i + 1]) / 2) * dx;
  const q = h * P * side + h * A * th[n];
  return { q, tip: th[n] };
}

export function finChecked(state) {
  const p = { k: MATERIALS[state.mat].k, h: state.h, L: state.Lmm / 1000 };
  const cf = finClosed(p);
  // Enough cells that m·dx stays small however steep the fin's profile is.
  const nu = finNumeric(p, Math.max(2000, Math.ceil(200 * cf.mL)));
  return { ...cf, tipT: FIN.Tinf + cf.theta(p.L), qNum: nu.q, gap: Math.abs(nu.q - cf.q) / cf.q, k: p.k, L: p.L };
}

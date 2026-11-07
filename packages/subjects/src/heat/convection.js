/**
 * Forced convection along a flat plate at uniform temperature (EML 4140, Convection).
 *
 * h is the wall conduction divided by the temperature difference, so it follows how thin the thermal
 * layer is. Made dimensionless, Nu_x = h x/k. On a smooth plate the layer is laminar up to
 * Re_x = Ux/ν = 5 × 10⁵ and turbulent after it:
 *   laminar     Nu_x = 0.332 Re_x^(1/2) Pr^(1/3),
 *   turbulent   Nu_x = 0.0296 Re_x^(4/5) Pr^(1/3).
 * So h falls as x^(−1/2), jumps up at transition, then falls as x^(−1/5). Averaged over a plate of
 * length L, with the laminar part first,
 *   N̄u_L = [0.664 Re_c^(1/2) + 0.037 (Re_L^(4/5) − Re_c^(4/5))] Pr^(1/3),
 * which is 0.664 Re_L^(1/2) Pr^(1/3) when the whole plate is laminar.
 *
 * The second method averages the local h by Simpson's rule: the laminar stretch in s = √x, where
 * h √x is smooth, and the turbulent stretch in x.
 */
export const RE_C = 5e5;

/** Fluids near 300 K: conductivity (W/m·K), kinematic viscosity (m²/s), Prandtl number. */
export const FLUIDS = {
  air: { name: 'Air', k: 0.0263, nu: 1.57e-5, Pr: 0.707 },
  water: { name: 'Water', k: 0.613, nu: 8.57e-7, Pr: 5.83 },
  oil: { name: 'Engine oil', k: 0.145, nu: 5.5e-4, Pr: 6400 },
};

/** Local h (W/m²·K) at x along the plate. */
export function localH({ fluid, U }, x) {
  const F = FLUIDS[fluid];
  const Re = (U * x) / F.nu;
  const Nu = Re < RE_C ? 0.332 * Math.sqrt(Re) * F.Pr ** (1 / 3) : 0.0296 * Re ** 0.8 * F.Pr ** (1 / 3);
  return (Nu * F.k) / x;
}

/** The plate: transition point, the local h curve, and the average h both ways. */
export function plateConvection({ fluid, U, L, dT = 40 }) {
  const F = FLUIDS[fluid];
  const ReL = (U * L) / F.nu;
  const xc = (RE_C * F.nu) / U;
  const laminarAll = xc >= L;
  const Pr3 = F.Pr ** (1 / 3);
  const NuBar = laminarAll ? 0.664 * Math.sqrt(ReL) * Pr3 : (0.664 * Math.sqrt(RE_C) + 0.037 * (ReL ** 0.8 - RE_C ** 0.8)) * Pr3;
  const hBar = (NuBar * F.k) / L;

  // Second method: average the local h numerically.
  const p = { fluid, U };
  const xl = Math.min(xc, L);
  const n = 400;
  // Each stretch with its own law, so the jump at xc stays out of both sums.
  const hLam = (x) => (0.332 * Math.sqrt((U * x) / F.nu) * Pr3 * F.k) / x;
  const hTurb = (x) => (0.0296 * ((U * x) / F.nu) ** 0.8 * Pr3 * F.k) / x;
  // Laminar: ∫₀^xl h dx = ∫₀^√xl 2 s h(s²) ds, and s·h(s²) stays finite at s = 0.
  const g = (s) => (s === 0 ? 2 * 0.332 * F.k * Pr3 * Math.sqrt(U / F.nu) : 2 * s * hLam(s * s));
  const lam = simpson(g, 0, Math.sqrt(xl), n);
  const turb = laminarAll ? 0 : simpson(hTurb, xc, L, n);
  const hBarNum = (lam + turb) / L;
  const gap = Math.abs(hBarNum - hBar) / hBar;

  const curve = [];
  for (let i = 1; i <= 300; i++) {
    const x = (i / 300) * L;
    curve.push([x, localH(p, x)]);
  }
  return { ...F, ReL, xc, laminarAll, NuBar, hBar, hBarNum, gap, q: hBar * dT, curve, hL: localH(p, L) };
}

function simpson(f, a, b, n) {
  const m = n % 2 ? n + 1 : n;
  const h = (b - a) / m;
  let s = f(a) + f(b);
  for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
  return (s * h) / 3;
}

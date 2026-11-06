/**
 * Shear flow between a still wall and a plate dragged across a thin layer of fluid (Couette flow),
 * from rest to the steady straight-line profile.
 *
 * Steady: the velocity grows linearly across the gap, u = U y/h, and the stress the fluid puts on
 * the plate is τ = μ U / h. The force on a plate of area A is τA. Density does not enter.
 *
 * From rest: momentum diffuses in from the moving plate as u_t = ν u_yy, with ν = μ/ρ. Separating
 * variables gives
 *   u(y, t)/U = y/h − Σ_{n≥1} (2/(nπ)) (−1)^{n+1} sin(nπ y/h) exp(−n²π² ν t / h²),
 * which is zero everywhere at t = 0 (the series is the sine series of y/h) and tends to y/h. The
 * slowest mode decays on h²/(π²ν), and the largest departure from the straight line falls below 1% of
 * U once (2/π) exp(−π² ν t / h²) < 0.01, so the settling time is t₁ = h²/(π²ν) ln(200/π).
 *
 * The second method marches u_t = ν u_yy with explicit finite differences on the same grid and
 * compares the profile with the series. Our own derivation.
 */

/** Viscosity (Pa·s) and density (kg/m³). Wikipedia, List of viscosities and Density (6 November 2026). */
export const FLUIDS = Object.freeze({
  water: { id: 'water', name: 'Water, 20 °C', mu: 1.0016e-3, rho: 1000 },
  mercury: { id: 'mercury', name: 'Mercury', mu: 1.526e-3, rho: 13546 },
  glycerol: { id: 'glycerol', name: 'Glycerol', mu: 1.412, rho: 1261 },
  oil: { id: 'oil', name: 'Olive oil', mu: 56.2e-3, rho: 920 },
  air: { id: 'air', name: 'Air', mu: 18.46e-6, rho: 1.2 },
});

/** Steady shear stress on the plate (Pa). */
export const couetteStress = (mu, U, h) => (mu * U) / h;

/** Time for the profile to come within 1% of U of the straight line (s). */
export const settlingTime = (nu, h) => ((h * h) / (Math.PI * Math.PI * nu)) * Math.log(200 / Math.PI);

/** u/U at height fraction η = y/h and time t, by the series. */
export function startupProfile(eta, t, nu, h, terms = 400) {
  if (t <= 0) return eta >= 1 ? 1 : 0;
  let u = eta;
  const k = (Math.PI * Math.PI * nu * t) / (h * h);
  for (let n = 1; n <= terms; n++) {
    const decay = Math.exp(-n * n * k);
    if (decay < 1e-16) break;
    u -= (2 / (n * Math.PI)) * (n % 2 ? 1 : -1) * Math.sin(n * Math.PI * eta) * decay;
  }
  return u;
}

/** Stress on the moving plate at time t (Pa), from the series: (μU/h)(1 + 2 Σ exp(−n²π²νt/h²)). */
export function startupStress(mu, rho, U, h, t, terms = 400) {
  const nu = mu / rho;
  const k = (Math.PI * Math.PI * nu * t) / (h * h);
  let s = 1;
  for (let n = 1; n <= terms; n++) {
    const decay = Math.exp(-n * n * k);
    if (decay < 1e-16) break;
    s += 2 * decay;
  }
  return couetteStress(mu, U, h) * s;
}

/**
 * Second method: explicit finite differences for u_t = ν u_yy on N intervals, from rest, to time t.
 * Returns u/U at the N + 1 grid points.
 */
export function marchStartup(t, nu, h, N = 80) {
  const dy = h / N;
  const r = 0.4;
  const steps = Math.max(1, Math.ceil((t * nu) / (r * dy * dy)));
  const dt = t / steps;
  const lam = (nu * dt) / (dy * dy);
  let u = new Float64Array(N + 1);
  let next = new Float64Array(N + 1);
  u[N] = 1;
  for (let s = 0; s < steps; s++) {
    next[0] = 0;
    next[N] = 1;
    for (let i = 1; i < N; i++) next[i] = u[i] + lam * (u[i + 1] - 2 * u[i] + u[i - 1]);
    [u, next] = [next, u];
  }
  return u;
}

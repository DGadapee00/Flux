/**
 * The laminar boundary layer on a flat plate (EML 3015).
 *
 * Far from a plate the stream moves at U; at its surface the fluid sticks. Between them is a thin
 * layer where viscosity matters. Prandtl's boundary-layer equations, with u/U = f′(η) and the
 * similarity variable η = y √(U/νx), reduce to the Blasius equation
 *   f‴ + ½ f f″ = 0,   f(0) = f′(0) = 0,   f′(∞) = 1.
 * Its solution gives the layer's 99% thickness and the wall shear:
 *   δ = 4.91 x/√Re_x,   τ_w = 0.332 ρU²/√Re_x,   C_f(plate, one side) = 1.328/√Re_L,
 * with Re_x = Ux/ν. The layer grows as √x and thins as U grows. It stays laminar to about
 * Re_x = 5 × 10⁵ on a smooth plate.
 *
 * The second method solves the Blasius equation itself by shooting: RK4 from the wall, with f″(0)
 * found by bisection so that f′ reaches 1 far out. The constants 4.91 and 0.332 come out of it.
 */
export const DELTA_K = 4.91;
export const WALL_K = 0.332;
export const RE_TRANSITION = 5e5;

/** Integrate f‴ = −½ f f″ from η = 0 to etaMax with f″(0) = s; returns the samples. */
function march(s, etaMax = 10, steps = 2000) {
  const h = etaMax / steps;
  let y = [0, 0, s];
  const out = [{ eta: 0, f: 0, fp: 0, fpp: s }];
  const F = ([f, fp, fpp]) => [fp, fpp, -0.5 * f * fpp];
  for (let i = 1; i <= steps; i++) {
    const k1 = F(y);
    const k2 = F(y.map((v, j) => v + (h / 2) * k1[j]));
    const k3 = F(y.map((v, j) => v + (h / 2) * k2[j]));
    const k4 = F(y.map((v, j) => v + h * k3[j]));
    y = y.map((v, j) => v + (h / 6) * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]));
    out.push({ eta: i * h, f: y[0], fp: y[1], fpp: y[2] });
  }
  return out;
}

let cached = null;

/** The Blasius solution by shooting: f″(0), η where f′ = 0.99, and the profile f′(η). */
export function blasius() {
  if (cached) return cached;
  let lo = 0.1;
  let hi = 1;
  for (let k = 0; k < 60; k++) {
    const mid = 0.5 * (lo + hi);
    const end = march(mid).at(-1).fp;
    if (end > 1) hi = mid;
    else lo = mid;
  }
  const s = 0.5 * (lo + hi);
  const sol = march(s);
  let eta99 = 0;
  for (let i = 1; i < sol.length; i++) {
    if (sol[i].fp >= 0.99) {
      const a = sol[i - 1];
      const b = sol[i];
      eta99 = a.eta + ((0.99 - a.fp) / (b.fp - a.fp)) * (b.eta - a.eta);
      break;
    }
  }
  cached = { wall: s, eta99, profile: sol.filter((_, i) => i % 10 === 0).map((p) => [p.eta, p.fp]) };
  return cached;
}

/** u/U at η, from the shooting solution. */
export function profileAt(eta) {
  const p = blasius().profile;
  if (eta >= p.at(-1)[0]) return 1;
  for (let i = 1; i < p.length; i++) {
    if (p[i][0] >= eta) {
      const [e0, u0] = p[i - 1];
      const [e1, u1] = p[i];
      return u0 + ((eta - e0) / (e1 - e0)) * (u1 - u0);
    }
  }
  return 1;
}

/** The plate: U (m/s), L (m), ν (m²/s), ρ (kg/m³), width b (m). x where it turns turbulent, if on the plate. */
export function plate({ U, L, nu, rho, b = 1 }) {
  const ReL = (U * L) / nu;
  const delta = (x) => (x > 0 ? (DELTA_K * x) / Math.sqrt((U * x) / nu) : 0);
  const xTr = (RE_TRANSITION * nu) / U;
  const Cf = 1.328 / Math.sqrt(ReL);
  const drag = 0.5 * rho * U * U * L * b * Cf;
  const sol = blasius();
  const gap = Math.max(Math.abs(sol.eta99 - DELTA_K) / DELTA_K, Math.abs(sol.wall - WALL_K) / WALL_K);
  return { ReL, delta, deltaL: delta(L), xTr, laminarAll: xTr >= L, Cf, drag, tauL: (WALL_K * rho * U * U) / Math.sqrt(ReL), eta99: sol.eta99, wall: sol.wall, gap };
}

/**
 * Diffusion and Fick's laws: carburizing a steel surface (EMA 3010, Defects).
 *
 * Carbon atoms hop between interstitial sites in hot iron. The net flux runs down the concentration
 * gradient, J = −D ∂C/∂x (Fick's first law), and conserving carbon gives ∂C/∂t = D ∂²C/∂x² (the
 * second law, the heat equation's form). A surface held at C_s on a deep part that started at C_0
 * fills in as
 *   C(x, t) = C_s − (C_s − C_0) erf(x / 2√(Dt)),
 * so any fixed concentration moves in as √(Dt): twice the time, √2 the depth. D rises steeply with
 * temperature, D = D_0 exp(−Q_d/RT), because each hop has an energy barrier to cross.
 *
 * The second method solves the second law on a grid by Crank–Nicolson, started with implicit Euler
 * steps to damp the jump at the surface, and reads the same depth off it.
 */
import { erfc } from '../em/noise.js';

export const R_GAS = 8.314; // J/(mol·K)
/** Carbon in austenite (FCC iron): a common textbook pair. */
export const CARBON_IN_GAMMA = { D0: 2.3e-5, Qd: 148e3 }; // m²/s, J/mol

export const erf = (x) => 1 - erfc(x);

export const diffusivity = (TC, { D0, Qd } = CARBON_IN_GAMMA) => D0 * Math.exp(-Qd / (R_GAS * (TC + 273.15)));

/** The closed form: profile, and the depth where C falls to Cx. Lengths in m, t in s. */
export function carburize({ TC, hours, C0 = 0.2, Cs = 1.0, Cx = 0.6 }) {
  const D = diffusivity(TC);
  const t = hours * 3600;
  const ell = Math.sqrt(D * t);
  const C = (x) => Cs - (Cs - C0) * erf(x / (2 * ell));
  // erf(z) = (Cs − Cx)/(Cs − C0), solved by bisection.
  const target = (Cs - Cx) / (Cs - C0);
  let lo = 0;
  let hi = 6;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (erf(mid) < target) lo = mid;
    else hi = mid;
  }
  const z = (lo + hi) / 2;
  return { D, t, ell, C, z, depth: 2 * z * ell, C0, Cs, Cx };
}

/** The second method: Crank–Nicolson on 0 ≤ x ≤ 10√(Dt), N cells, M steps. */
export function carburizeNumeric({ TC, hours, C0 = 0.2, Cs = 1.0, Cx = 0.6 }, N = 600, M = 600) {
  const D = diffusivity(TC);
  const t = hours * 3600;
  const Lx = 10 * Math.sqrt(D * t);
  const dx = Lx / N;
  let u = new Float64Array(N + 1).fill(C0);
  u[0] = Cs;
  // Rannacher start: four implicit Euler quarter-steps, then Crank–Nicolson.
  const dt0 = t / M;
  const plan = [...Array(4).fill([dt0 / 4, 1]), ...Array(M - 1).fill([dt0, 0.5])];
  for (const [dt, th] of plan) u = step(u, (D * dt) / (dx * dx), th, Cs, C0);
  const prof = (x) => {
    const i = Math.min(Math.floor(x / dx), N - 1);
    const f = x / dx - i;
    return u[i] + f * (u[i + 1] - u[i]);
  };
  let depth = Lx;
  for (let i = 1; i <= N; i++) {
    if (u[i] <= Cx) {
      depth = (i - 1 + (u[i - 1] - Cx) / (u[i - 1] - u[i])) * dx;
      break;
    }
  }
  return { depth, prof, dx, Lx };
}

/** One θ-step of u_t = D u_xx with u(0) = a, u(L) = b, by the Thomas algorithm. */
function step(u, r, th, a, b) {
  const n = u.length - 1;
  const lower = new Float64Array(n + 1);
  const diag = new Float64Array(n + 1);
  const upper = new Float64Array(n + 1);
  const rhs = new Float64Array(n + 1);
  diag[0] = 1;
  rhs[0] = a;
  diag[n] = 1;
  rhs[n] = b;
  for (let i = 1; i < n; i++) {
    lower[i] = -th * r;
    diag[i] = 1 + 2 * th * r;
    upper[i] = -th * r;
    rhs[i] = u[i] + (1 - th) * r * (u[i - 1] - 2 * u[i] + u[i + 1]);
  }
  for (let i = 1; i <= n; i++) {
    const m = lower[i] / diag[i - 1];
    diag[i] -= m * upper[i - 1];
    rhs[i] -= m * rhs[i - 1];
  }
  const out = new Float64Array(n + 1);
  out[n] = rhs[n] / diag[n];
  for (let i = n - 1; i >= 0; i--) out[i] = (rhs[i] - upper[i] * out[i + 1]) / diag[i];
  return out;
}

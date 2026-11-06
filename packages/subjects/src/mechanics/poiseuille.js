/**
 * Pressure-driven laminar flow (Poiseuille flow): Navier–Stokes in a long straight pipe or slot.
 *
 * Far from the inlet the flow is fully developed: the velocity u points along the duct and does not
 * change along it, so the convective acceleration is zero and the flow is steady. Navier–Stokes
 * along the duct then balances the pressure gradient G = Δp/L against viscous shear:
 *
 *   pipe of radius R:   (μ/r) d/dr (r du/dr) = −G,  u(R) = 0,  u finite at r = 0
 *     → u = G(R² − r²)/(4μ),  Q = πGR⁴/(8μ),  τ_wall = GR/2
 *   slot of gap h:      μ d²u/dy² = −G,  u(0) = u(h) = 0
 *     → u = G y(h − y)/(2μ),  q = Gh³/(12μ) per unit width,  τ_wall = Gh/2
 *
 * The flow rate grows as R⁴ in a pipe: twice the radius carries sixteen times as much. The second
 * method (poiseuilleNumeric) solves the same equation on a grid of finite volumes with a tridiagonal
 * (Thomas) solve and sums the flow rate cell by cell, with none of the closed forms.
 *
 * The model holds while the flow stays laminar: in a pipe, below a Reynolds number of about 2300
 * on the diameter.
 */

/** Closed forms. geom 'pipe' (size = R) or 'slot' (size = h, flow per unit width). SI units. */
export function poiseuille({ geom, size, G, mu }) {
  if (geom === 'slot') {
    const h = size;
    const umax = (G * h * h) / (8 * mu);
    const Q = (G * h ** 3) / (12 * mu);
    return { geom, umax, Q, V: Q / h, tauWall: (G * h) / 2, Dh: 2 * h, profile: (eta) => 4 * eta * (1 - eta) };
  }
  const R = size;
  const umax = (G * R * R) / (4 * mu);
  const Q = (Math.PI * G * R ** 4) / (8 * mu);
  return { geom: 'pipe', umax, Q, V: Q / (Math.PI * R * R), tauWall: (G * R) / 2, Dh: 2 * R, profile: (eta) => 1 - eta * eta };
}

/**
 * The same flow by finite volumes on N cells across the radius (pipe) or the gap (slot). Each cell
 * balances the shear on its faces against the pressure force on it; the wall cell sees the wall at
 * half a cell. Returns the velocity at the cell centres (as η = r/R or y/h), the flow rate and the
 * peak velocity.
 */
export function poiseuilleNumeric({ geom, size, G, mu }, N = 400) {
  const pipe = geom !== 'slot';
  // Pipe: cells on 0 ≤ r ≤ R with the axis a symmetry face. Slot: cells on 0 ≤ y ≤ h, walls at both ends.
  const d = size / N;
  const a = new Float64Array(N);
  const b = new Float64Array(N);
  const c = new Float64Array(N);
  const rhs = new Float64Array(N);
  const centre = (i) => (i + 0.5) * d;
  for (let i = 0; i < N; i++) {
    // Face "areas" per unit length: 2πr for the pipe, 1 for the slot.
    const west = pipe ? i * d : 1; // face at i·d
    const east = pipe ? (i + 1) * d : 1; // face at (i + 1)·d
    const vol = pipe ? centre(i) * d : d;
    let diag = 0;
    if (i > 0 && (!pipe || west > 0)) {
      a[i] = -(mu * west) / d;
      diag += (mu * west) / d;
    } else if (!pipe) {
      diag += (mu * west) / (d / 2); // wall at y = 0, half a cell away
    }
    if (i < N - 1) {
      c[i] = -(mu * east) / d;
      diag += (mu * east) / d;
    } else {
      diag += (mu * east) / (d / 2); // wall at r = R or y = h
    }
    b[i] = diag;
    rhs[i] = G * vol;
  }
  // Thomas algorithm.
  for (let i = 1; i < N; i++) {
    const m = a[i] / b[i - 1];
    b[i] -= m * c[i - 1];
    rhs[i] -= m * rhs[i - 1];
  }
  const u = new Float64Array(N);
  u[N - 1] = rhs[N - 1] / b[N - 1];
  for (let i = N - 2; i >= 0; i--) u[i] = (rhs[i] - c[i] * u[i + 1]) / b[i];
  let Q = 0;
  for (let i = 0; i < N; i++) Q += u[i] * (pipe ? 2 * Math.PI * centre(i) * d : d);
  // The peak, by a parabola through the two cells nearest the axis (pipe) or the middle (slot).
  let umax;
  if (pipe) umax = (9 * u[0] - u[1]) / 8; // u ≈ u0 − k r²: extrapolate from r = d/2 and 3d/2 to r = 0
  else umax = (9 * u[N / 2] - u[N / 2 + 1]) / 8; // N even: the middle sits between two cells
  return { eta: Array.from(u, (_, i) => centre(i) / size), u: Array.from(u), Q, umax };
}

/** Reynolds number on the hydraulic diameter. */
export const reynolds = (rho, V, Dh, mu) => (rho * V * Dh) / mu;

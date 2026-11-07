/**
 * Thermal resistance (EML 4140 unit 1).
 *
 * In steady conduction with no heat made inside, the heat flow through a layer is proportional to
 * the temperature drop across it. Per unit area the ratio is a resistance:
 *   a plane layer         R = L/k            a surface film    R = 1/h
 *   a cylindrical shell   R′ = ln(r₂/r₁)/(2πk) per unit length,   a film on it   R′ = 1/(2πr h)
 * Resistances in series add, so q = ΔT/ΣR, and each layer takes a share of ΔT in proportion to its R.
 *
 * Insulating a pipe adds a shell resistance that grows as ln r₂ and lowers the film resistance as
 * 1/r₂. Their sum is smallest, and the heat loss largest, at the critical radius r₂ = k/h.
 *
 * Second routes: the wall's temperatures by a finite-volume solve of k d²T/dx² = 0 across all the
 * layers, with the films as boundary conditions; the critical radius by golden-section search on the
 * total resistance.
 */
/** A plane wall: layers [{ L (m), k (W/m·K) }], films hIn and hOut, temperatures in and out (°C). */
export function wall({ layers, hIn, hOut, Tin, Tout }) {
  const used = layers.filter((l) => l.L > 0);
  const R = [1 / hIn, ...used.map((l) => l.L / l.k), 1 / hOut];
  const Rtot = R.reduce((s, v) => s + v, 0);
  const q = (Tin - Tout) / Rtot;
  // Temperature at each interface: inside air, inner surface, each layer's far face, outside air.
  const T = [Tin];
  for (const r of R) T.push(T.at(-1) - q * r);
  return { R, Rtot, q, U: 1 / Rtot, T, drops: R.map((r) => q * r), used };
}

/** The same wall by finite volumes: N cells per layer, film conductances at the two faces. */
export function wallNumeric({ layers, hIn, hOut, Tin, Tout }, N = 40) {
  const cells = [];
  for (const l of layers.filter((x) => x.L > 0)) for (let i = 0; i < N; i++) cells.push({ dx: l.L / N, k: l.k });
  const n = cells.length;
  // Conductance between neighbouring cell centres: half-cells in series.
  const g = (i) => 1 / (cells[i].dx / (2 * cells[i].k) + cells[i + 1].dx / (2 * cells[i + 1].k));
  const gIn = 1 / (1 / hIn + cells[0].dx / (2 * cells[0].k));
  const gOut = 1 / (1 / hOut + cells[n - 1].dx / (2 * cells[n - 1].k));
  const M = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i > 0) {
      M[i][i] += g(i - 1);
      M[i][i - 1] -= g(i - 1);
    } else {
      M[i][i] += gIn;
      b[i] += gIn * Tin;
    }
    if (i < n - 1) {
      M[i][i] += g(i);
      M[i][i + 1] -= g(i);
    } else {
      M[i][i] += gOut;
      b[i] += gOut * Tout;
    }
  }
  // The system is tridiagonal: each cell talks only to its neighbours.
  const inv = tridiag(M, b);
  const q = gIn * (Tin - inv[0]);
  return { q, Tcells: inv, x: cells.reduce((acc, c, i) => [...acc, (i ? acc[i - 1] + cells[i - 1].dx / 2 : 0) + c.dx / 2], []) };
}

function tridiag(M, d) {
  const n = d.length;
  const a = M.map((r, i) => (i ? r[i - 1] : 0));
  const bb = M.map((r, i) => r[i]);
  const c = M.map((r, i) => (i < n - 1 ? r[i + 1] : 0));
  const cp = new Array(n);
  const dp = new Array(n);
  cp[0] = c[0] / bb[0];
  dp[0] = d[0] / bb[0];
  for (let i = 1; i < n; i++) {
    const m = bb[i] - a[i] * cp[i - 1];
    cp[i] = c[i] / m;
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
  }
  const x = new Array(n);
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}

/** Heat loss per metre from a pipe of radius r1 (m) insulated to r2 (k), film h, surface ΔT. */
export function pipe({ r1, r2, k, h, dT }) {
  const Rins = r2 > r1 ? Math.log(r2 / r1) / (2 * Math.PI * k) : 0;
  const Rfilm = 1 / (2 * Math.PI * r2 * h);
  const Rtot = Rins + Rfilm;
  return { Rins, Rfilm, Rtot, Q: dT / Rtot, rCrit: k / h, bare: dT * 2 * Math.PI * r1 * h };
}

/** The radius that minimises the total resistance, by golden-section search in ln r over [r1/100, 100 r1]. */
export function criticalBySearch(k, h, around) {
  let a = Math.log(around / 1000);
  let b = Math.log(around * 1000);
  const R = (lr) => {
    const r = Math.exp(lr);
    return Math.log(r) / (2 * Math.PI * k) + 1 / (2 * Math.PI * r * h);
  };
  const phi = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 200; i++) {
    const c = b - phi * (b - a);
    const d = a + phi * (b - a);
    if (R(c) < R(d)) b = d;
    else a = c;
  }
  return Math.exp((a + b) / 2);
}

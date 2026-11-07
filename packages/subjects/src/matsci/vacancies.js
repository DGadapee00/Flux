/**
 * Vacancies as an equilibrium population (EMA 3010 unit 2).
 *
 * Emptying a lattice site costs an energy Q_v. Spreading n vacancies over N sites gains
 * configurational entropy, k ln(N choose n). Per site, with c = n/N,
 *   g(c) = c Q_v + kT [c ln c + (1 − c) ln(1 − c)],
 * whose minimum is at c/(1 − c) = exp(−Q_v/kT), so c* = 1/(1 + e^{Q_v/kT}) ≈ e^{−Q_v/kT}.
 * The free energy is lowest with some vacancies present: a crystal at any temperature above
 * absolute zero holds them in equilibrium.
 *
 * Second routes: the minimum of g found by golden-section search in ln c, and Q_v recovered from
 * the slope of ln c* against 1/T by a least-squares line.
 */
export const KB = 8.617e-5; // eV/K

/** The equilibrium vacancy fraction, exactly and in the usual approximation. */
export const fraction = (Q, T) => 1 / (1 + Math.exp(Q / (KB * T)));
export const fractionApprox = (Q, T) => Math.exp(-Q / (KB * T));

/** Free energy per site, in eV, at vacancy fraction c. */
export const freeEnergy = (c, Q, T) => c * Q + KB * T * (c * Math.log(c) + (1 - c) * Math.log1p(-c));

/** The minimum of g by golden-section search over ln c, between 10⁻⁶⁰ and 0.5. */
export function minimumByHand(Q, T) {
  let a = Math.log(1e-60);
  let b = Math.log(0.5);
  const phi = (Math.sqrt(5) - 1) / 2;
  const g = (lc) => freeEnergy(Math.exp(lc), Q, T);
  for (let k = 0; k < 200; k++) {
    const c = b - phi * (b - a);
    const d = a + phi * (b - a);
    if (g(c) < g(d)) b = d;
    else a = c;
  }
  return Math.exp((a + b) / 2);
}

/** Q_v from a least-squares line through ln c* against 1/T, over the range T1..T2. */
export function arrheniusFit(Q, T1, T2, n = 25) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i++) {
    const T = T1 + ((T2 - T1) * i) / (n - 1);
    xs.push(1 / T);
    ys.push(Math.log(fractionApprox(Q, T)));
  }
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my);
    sxx += (xs[i] - mx) ** 2;
  }
  return -(sxy / sxx) * KB;
}

/** Everything the lab shows at formation energy Q (eV) and temperature T (K); sites per cm³ optional. */
export function vacancies({ Q, T, sites = 8.49e22 }) {
  const c = fraction(Q, T);
  const cMin = minimumByHand(Q, T);
  const Qfit = arrheniusFit(Q, 300, 1400);
  const gap = Math.max(Math.abs(cMin - c) / c, Math.abs(Qfit - Q) / Q);
  return { Q, T, c, approx: fractionApprox(Q, T), perCm3: c * sites, cMin, Qfit, gMin: freeEnergy(c, Q, T), gap };
}

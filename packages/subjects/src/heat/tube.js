/**
 * Water heated in a tube with its wall at one temperature (EML 4140, internal convection).
 *
 * Fully developed flow in a tube of diameter D: laminar (Re_D < 2300) gives Nu_D = 3.66 for a wall
 * at one temperature; turbulent gives Nu_D = 0.023 Re^0.8 Pr^0.4 (Dittus–Boelter, heating). An energy
 * balance on a slice, ṁc_p dT_m = hP(T_s − T_m)dx, makes the bulk temperature close on the wall's
 * exponentially:
 *   (T_s − T_m(x))/(T_s − T_i) = exp(−hPx/ṁc_p).
 * So the fluid does not warm at a steady rate: the first metres do most of the work.
 *
 * The second method marches dT_m/dx by fourth-order Runge–Kutta and sums the heat picked up.
 */

export const TUBE = { D: 0.01, L: 5, Ts: 80, Ti: 20 };
/** Water near 40 °C. */
export const WATER = { cp: 4180, mu: 6.5e-4, k: 0.63, Pr: 4.3 };

export function tubeClosed({ mdot }) {
  const { D, L, Ts, Ti } = TUBE;
  const { cp, mu, k, Pr } = WATER;
  const m = mdot / 1000;
  const Re = (4 * m) / (Math.PI * D * mu);
  const laminar = Re < 2300;
  const Nu = laminar ? 3.66 : 0.023 * Re ** 0.8 * Pr ** 0.4;
  const h = (Nu * k) / D;
  const P = Math.PI * D;
  const a = (h * P) / (m * cp);
  const Tm = (x) => Ts - (Ts - Ti) * Math.exp(-a * x);
  const To = Tm(L);
  const q = m * cp * (To - Ti);
  const dT1 = Ts - Ti;
  const dT2 = Ts - To;
  const lmtd = (dT1 - dT2) / Math.log(dT1 / dT2);
  return { Re, laminar, Nu, h, a, Tm, To, q, lmtd, qLm: h * P * L * lmtd, lenScale: 1 / a, m };
}

export function tubeNumeric({ mdot }, n = 2000) {
  const { L, Ts, Ti } = TUBE;
  const { a } = tubeClosed({ mdot });
  const f = (T) => a * (Ts - T);
  const dx = L / n;
  let T = Ti;
  for (let i = 0; i < n; i++) {
    const k1 = f(T);
    const k2 = f(T + (dx * k1) / 2);
    const k3 = f(T + (dx * k2) / 2);
    const k4 = f(T + dx * k3);
    T += (dx * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
  }
  return { To: T };
}

export function tubeChecked(state) {
  const cf = tubeClosed(state);
  const nu = tubeNumeric(state);
  const qNum = cf.m * WATER.cp * (nu.To - TUBE.Ti);
  return { ...cf, qNum, gap: Math.max(Math.abs(qNum - cf.q) / cf.q, Math.abs(cf.qLm - cf.q) / cf.q) };
}

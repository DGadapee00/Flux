/**
 * The adiabatic flame temperature of methane in air (EML 3101, combustion).
 *
 * CH₄ burns with a theoretical-air fraction λ (1 = stoichiometric, two O₂ per CH₄, each with 3.76
 * N₂). Lean (λ ≥ 1): CH₄ + 2λ(O₂ + 3.76N₂) → CO₂ + 2H₂O + 2(λ − 1)O₂ + 7.52λN₂. Rich, down to 75%
 * air, the hydrogen takes its oxygen first and the carbon makes CO₂ and CO with what is left. With no
 * heat lost, the products' enthalpy equals the reactants' at 25 °C:
 *   Σ_P N_i h̄_i(T_ad) = Σ_R N_i h̄_i(298 K),
 * each h̄ including its enthalpy of formation (NASA polynomials). The flame is hottest near
 * stoichiometric: extra air brings nitrogen and oxygen that soak up heat, and too little leaves fuel
 * energy unreleased in the CO. Dissociation, which lowers the real peak, is left out.
 *
 * The first method solves the balance by Newton's method on the NASA enthalpy. The second builds the
 * products' enthalpy rise from 298 K by integrating c̄_p(T) with Simpson's rule, and bisects.
 */
import { cpMolar, hMolar } from './idealgas.js';

export function products(lam) {
  if (lam >= 1) return { CO2: 1, CO: 0, H2O: 2, O2: 2 * (lam - 1), N2: 7.52 * lam };
  const x = 4 * lam - 3; // CO₂ share of the carbon, from the oxygen left after the water
  return { CO2: x, CO: 1 - x, H2O: 2, O2: 0, N2: 7.52 * lam };
}

const H_REACT = (lam) => hMolar('CH4', 298.15) + 2 * lam * (hMolar('O2', 298.15) + 3.76 * hMolar('N2', 298.15));
const hProd = (P, T) => Object.entries(P).reduce((s, [k, n]) => s + (n ? n * hMolar(k, T) : 0), 0);
const cpProd = (P, T) => Object.entries(P).reduce((s, [k, n]) => s + (n ? n * cpMolar(k, T) : 0), 0);

export function flameClosed({ air }) {
  const lam = air / 100;
  const P = products(lam);
  const target = H_REACT(lam);
  let T = 2000;
  for (let i = 0; i < 60; i++) {
    const f = hProd(P, T) - target;
    const step = f / cpProd(P, T);
    T = Math.min(3400, Math.max(300, T - step));
    if (Math.abs(step) < 1e-9) break;
  }
  const nTot = Object.values(P).reduce((s, n) => s + n, 0);
  const AF = (2 * lam * (32 + 3.76 * 28.013)) / 16.04;
  // Heat released per mole of fuel if the products were cooled back to 25 °C (water as vapour).
  const lhv = target - hProd(P, 298.15);
  return { lam, P, T, nTot, AF, lhv, Tc: T - 273.15 };
}

export function flameNumeric({ air }, n = 400) {
  const lam = air / 100;
  const P = products(lam);
  // Heat available to warm the products from 298 K: H_R − H_P(298).
  const need = H_REACT(lam) - hProd(P, 298.15);
  const rise = (T) => {
    const h = (T - 298.15) / n;
    let s = cpProd(P, 298.15) + cpProd(P, T);
    for (let i = 1; i < n; i++) s += cpProd(P, 298.15 + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
  };
  let lo = 300;
  let hi = 3400;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (rise(m) < need) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
}

export function flameChecked(state) {
  const cf = flameClosed(state);
  const Tn = flameNumeric(state);
  return { ...cf, Tnum: Tn, gap: Math.abs(Tn - cf.T) / cf.T };
}

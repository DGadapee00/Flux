/**
 * Moist air through a cooling coil (EML 3101, psychrometrics).
 *
 * At total pressure p = 101.325 kPa, air whose water vapour has partial pressure p_v has humidity
 * ratio ω = 0.622 p_v/(p − p_v), relative humidity φ = p_v/p_g(T), and enthalpy per kilogram of dry
 * air h = 1.005T + ω(2501 + 1.82T) kJ/kg, T in °C. A coil whose leaving air is at T₂ cools the air at
 * constant ω until it reaches its dew point; below that, water condenses and the air leaves saturated
 * at T₂. So an air conditioner dries air as well as cooling it: the water drips off the coil. The
 * heat removed per kilogram of dry air is q = h₁ − h₂ − (ω₁ − ω₂)h_f(T₂), with h_f = 4.18T₂.
 *
 * Saturation pressure comes from IAPWS-IF97. The second method follows the air's path, cooling at
 * constant ω to the dew point and then down the saturation curve, and sums the sensible heat and the
 * latent heat of each slice of condensate by Simpson's rule.
 */
import { psat } from './if97.js';

export const P_ATM = 101.325;
export const pg = (TC) => psat(TC + 273.15) * 1000; // kPa
export const omega = (pv) => (0.622 * pv) / (P_ATM - pv);
export const hAir = (TC, w) => 1.005 * TC + w * (2501 + 1.82 * TC);
export const dewPoint = (pv) => {
  let lo = -20;
  let hi = 60;
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2;
    if (pg(m) < pv) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

export function coilClosed({ T1, rh, T2 }) {
  const pv1 = (rh / 100) * pg(T1);
  const w1 = omega(pv1);
  const Td = dewPoint(pv1);
  const wet = T2 < Td;
  const w2 = wet ? omega(pg(T2)) : w1;
  const rh2 = wet ? 100 : (100 * (w1 * P_ATM) / (0.622 + w1)) / pg(T2);
  const h1 = hAir(T1, w1);
  const h2 = hAir(T2, w2);
  const water = w1 - w2;
  const q = h1 - h2 - water * 4.18 * T2;
  return { pv1, w1, Td, wet, w2, rh2, h1, h2, water, q, sensible: (1.005 + 1.82 * w1) * (T1 - Math.max(T2, Td)) };
}

export function coilNumeric({ T1, rh, T2 }, n = 400) {
  const c = coilClosed({ T1, rh, T2 });
  const simpson = (f, a, b) => {
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
    return (s * h) / 3;
  };
  // Leg 1: constant ω from T1 down to max(T2, Td): dq = (1.005 + 1.82ω) dT.
  const Tend = c.wet ? c.Td : T2;
  let q = simpson(() => 1.005 + 1.82 * c.w1, Tend, T1);
  if (c.wet) {
    // Leg 2: along saturation from Td to T2. d(h_air) = (1.005 + 1.82ω)dT + (2501 + 1.82T)dω;
    // the condensate dω leaves at T and carries 4.18T dω, and is then cooled to T2 with the drain.
    const w = (T) => omega(pg(T));
    const dw = (T) => (w(T + 1e-4) - w(T - 1e-4)) / 2e-4;
    q += simpson((T) => 1.005 + 1.82 * w(T) + (2501 + 1.82 * T - 4.18 * T) * dw(T), T2, c.Td);
    // Condensate formed above T2 is cooled to T2 before it drains.
    q += simpson((T) => 4.18 * (T - T2) * dw(T), T2, c.Td);
  }
  return q;
}

export function coilChecked(state) {
  const cf = coilClosed(state);
  const qn = coilNumeric(state);
  return { ...cf, qNum: qn, gap: Math.abs(qn - cf.q) / Math.max(1, cf.q) };
}

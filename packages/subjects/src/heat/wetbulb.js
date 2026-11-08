/**
 * A wet surface in moving air: the wet-bulb temperature (EML 4140, convective mass transfer).
 *
 * Water evaporates off a wet wick into air at T_∞ and relative humidity φ. The vapour leaves by
 * convection, ṁ″ = h_m(ρ_v,sat(T_w) − φρ_v,sat(T_∞)), and carries the latent heat h_fg with it. In
 * steady state the air's convection supplies it:
 *   h(T_∞ − T_w) = h_m h_fg [ρ_v,sat(T_w) − φ ρ_v,sat(T_∞)].
 * Heat and mass obey the same equations, so h/h_m = ρc_p Le^{2/3} (Chilton–Colburn), and T_w does
 * not depend on the flow speed. The wick settles below the air temperature, further in dry air.
 *
 * The first method solves the balance for T_w by Newton's method. The second lets a wet bead start
 * at the air temperature and marches its energy balance in time until it stops changing.
 */

export const AIRW = { rho: 1.16, cp: 1007, Le: 0.85, hfg: 2.43e6, Rv: 461.5 };

/** Saturation vapour pressure over water (Pa), Magnus form, T in °C. */
export const psat = (T) => 610.94 * Math.exp((17.625 * T) / (T + 243.04));
export const rhoSat = (T) => psat(T) / (AIRW.Rv * (T + 273.15));

const ratio = () => AIRW.rho * AIRW.cp * AIRW.Le ** (2 / 3);
const balance = (Tw, T, phi) => (T - Tw) - (AIRW.hfg / ratio()) * (rhoSat(Tw) - phi * rhoSat(T));

export function wetClosed({ T, rh }) {
  const phi = rh / 100;
  let Tw = T - 5;
  for (let i = 0; i < 60; i++) {
    const f = balance(Tw, T, phi);
    const e = 1e-6;
    const d = (balance(Tw + e, T, phi) - f) / e;
    const step = f / d;
    Tw -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return { Tw, depression: T - Tw, phi, hOverHm: ratio(), pv: phi * psat(T), dew: dewPoint(phi * psat(T)) };
}

export function dewPoint(pv) {
  const g = Math.log(pv / 610.94);
  return (243.04 * g) / (17.625 - g);
}

/** A 2 mm water bead in air with h = 50 W/(m²·K), marched by RK4 from the air temperature. */
export function wetTransient({ T, rh }, keep = false) {
  const phi = rh / 100;
  const h = 50;
  const hm = h / ratio();
  const r = 0.001;
  const mc = (4 / 3) * Math.PI * r ** 3 * 1000 * 4180;
  const A = 4 * Math.PI * r * r;
  const f = (Tb) => (A * (h * (T - Tb) - hm * AIRW.hfg * (rhoSat(Tb) - phi * rhoSat(T)))) / mc;
  let Tb = T;
  const dt = 0.05;
  const pts = keep ? [[0, Tb]] : null;
  let t = 0;
  for (let i = 0; i < 20000; i++) {
    const k1 = f(Tb);
    const k2 = f(Tb + (dt * k1) / 2);
    const k3 = f(Tb + (dt * k2) / 2);
    const k4 = f(Tb + dt * k3);
    const step = (dt * (k1 + 2 * k2 + 2 * k3 + k4)) / 6;
    Tb += step;
    t += dt;
    if (keep && i % 10 === 9) pts.push([t, Tb]);
    if (!keep && Math.abs(step) < 1e-13) break;
    if (keep && t >= 120) break;
  }
  return { Tb, pts, tau: mc / (A * h) };
}

export function wetChecked(state) {
  const cf = wetClosed(state);
  const tr = wetTransient(state);
  const hist = wetTransient(state, true);
  return { ...cf, Tnum: tr.Tb, gap: Math.abs(tr.Tb - cf.Tw) / Math.max(cf.depression, 0.5), hist: hist.pts, tau: tr.tau };
}

/**
 * A heat pump on a refrigerant modelled on R-134a (EML 3101, vapour compression).
 *
 * The refrigerant evaporates outdoors at 8 K below the outdoor air (state 1, saturated vapour), is
 * compressed to the condensing pressure by a compressor 80% as good as an isentropic one (2),
 * condenses indoors at 35 °C to warm a 21 °C room (3, saturated liquid) and is throttled back,
 * h₄ = h₃. The heat delivered per unit of work is
 *   COP_HP = (h₂ − h₃)/(h₂ − h₁),   against the Carnot limit T_H/(T_H − T_L).
 * As the outdoor air gets colder the lift grows, and the COP falls.
 *
 * The fluid is a simple model fitted to R-134a's boiling points at 1 atm and 10 bar: an ideal-gas
 * vapour with c_p = 0.90 kJ/(kg·K), a liquid with c = 1.40 kJ/(kg·K), and a latent heat that falls
 * linearly with temperature, with Clapeyron's equation giving the saturation pressure. The second
 * method finds the isentropic compressor work as ∫v dp along the isentrope, by Simpson's rule.
 */

export const FL = { R: 0.0815, cpv: 0.9, cl: 1.4, T0: 233.15, hfg0: 242, room: 21, Tcond: 35, approach: 8, etaC: 0.8 };
const dc = FL.cpv - FL.cl;
export const hfg = (T) => FL.hfg0 + dc * (T - FL.T0);
// Clapeyron with an ideal-gas vapour: d ln p/dT = hfg(T)/(R T²).
const a = FL.hfg0 - dc * FL.T0;
export const lnp = (T) => -a / (FL.R * T) + (dc / FL.R) * Math.log(T) + C;
// Fix C so the model boils at −26.07 °C at 101.325 kPa.
const C = Math.log(101.325) + a / (FL.R * 247.08) - (dc / FL.R) * Math.log(247.08);
export const psatR = (T) => Math.exp(lnp(T));
export const hf = (T) => FL.cl * (T - FL.T0);
export const hg = (T) => hf(T) + hfg(T);

export function pumpClosed({ Tout }) {
  const TL = Tout + 273.15;
  const TH = FL.room + 273.15;
  const Te = TL - FL.approach;
  const Tc = FL.Tcond + 273.15;
  const pe = psatR(Te);
  const pc = psatR(Tc);
  const h1 = hg(Te);
  const T2s = Te * (pc / pe) ** (FL.R / FL.cpv);
  const ws = FL.cpv * (T2s - Te);
  const w = ws / FL.etaC;
  const h2 = h1 + w;
  const T2 = Te + w / FL.cpv;
  const h3 = hf(Tc);
  const qH = h2 - h3;
  return { Te, Tc, pe, pc, h1, h2, h3, h4: h3, T2, ws, w, qH, qL: h1 - h3, cop: qH / w, carnot: TH / (TH - TL), lift: Tc - Te };
}

export function pumpNumeric({ Tout }, n = 400) {
  const c = pumpClosed({ Tout });
  // Along the isentrope T = Te (p/pe)^{R/cp}; v = RT/p (kJ/kg per kPa); w = ∫ v dp.
  const v = (p) => (FL.R * c.Te * (p / c.pe) ** (FL.R / FL.cpv)) / p;
  const h = (c.pc - c.pe) / n;
  let s = v(c.pe) + v(c.pc);
  for (let i = 1; i < n; i++) s += v(c.pe + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

export function pumpChecked(state) {
  const cf = pumpClosed(state);
  const wNum = pumpNumeric(state);
  const wReal = wNum / FL.etaC;
  const copNum = (cf.qL + wReal) / wReal;
  return { ...cf, wNum, copNum, gap: Math.abs(copNum - cf.cop) / cf.cop };
}

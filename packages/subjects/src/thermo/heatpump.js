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
 * The fluid is a simple model of R-134a: a latent heat fitted to R-134a's, falling linearly with
 * temperature; a saturation pressure from Clapeyron's equation, with the vapour's compressibility
 * fixed so the model boils where R-134a does at 1 atm and at 35 °C; a liquid with c = 1.40 kJ/(kg·K);
 * and a compressor that treats the vapour as an ideal gas with R-134a's c_p, 0.80 kJ/(kg·K). The second
 * method finds the isentropic compressor work as ∫v dp along the isentrope, by Simpson's rule.
 */

export const FL = { R: 0.0815, cpv: 0.8, cl: 1.4, T0: 233.15, room: 21, Tcond: 35, approach: 8, etaC: 0.8 };
/** Latent heat (kJ/kg), a straight line through R-134a's 198.6 kJ/kg at 0 °C falling 0.82 kJ/kg per K. */
export const hfg = (T) => 198.6 - 0.82 * (T - 273.15);
const a = 198.6 + 0.82 * 273.15;
const b = -0.82;
/** Clapeyron with the vapour's volume ZRT/p: d ln p/dT = hfg/(Z R T²). Z fixed so the model boils at
 * −26.07 °C at 101.325 kPa and at 35 °C at 887 kPa, as R-134a does. */
const lnpRaw = (T, Z) => -a / (Z * FL.R * T) + (b / (Z * FL.R)) * Math.log(T);
const fitZ = () => {
  let lo = 0.5;
  let hi = 1.2;
  for (let i = 0; i < 100; i++) {
    const Z = (lo + hi) / 2;
    const r = lnpRaw(308.15, Z) - lnpRaw(247.08, Z);
    if (r > Math.log(887 / 101.325)) lo = Z;
    else hi = Z;
  }
  return (lo + hi) / 2;
};
export const Z = fitZ();
const C = Math.log(101.325) - lnpRaw(247.08, Z);
export const lnp = (T) => lnpRaw(T, Z) + C;
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

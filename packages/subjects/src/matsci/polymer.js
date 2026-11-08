/**
 * Chain lengths in a polymer, and what they do to its glass transition (EMA 3010, polymers).
 *
 * If a growing chain adds one more repeat unit with probability p, and stops otherwise, the chains
 * follow the most probable (Flory) distribution: a fraction x_i = (1 − p)p^{i−1} of them have i units.
 * With repeat-unit mass m₀,
 *   M̄_n = Σ x_i M_i = m₀/(1 − p),   M̄_w = m₀(1 + p)/(1 − p),   M̄_w/M̄_n = 1 + p.
 * Short chains have more ends, and ends loosen the packing, so the glass transition falls with
 * M̄_n (Flory–Fox): T_g = T_g,∞ − K/M̄_n. Through T_g an amorphous polymer's stiffness drops by about
 * a thousandfold over a few tens of degrees; it has no sharp melting point.
 *
 * The constants are polystyrene's: m₀ = 104 g/mol, T_g,∞ = 100 °C, K = 1.0 × 10⁵ K·g/mol. The second
 * method sums the distribution term by term for M̄_n and M̄_w.
 */

export const PS = { m0: 104, TgInf: 100, K: 1e5, Mc: 35000, Eg: 3e9, Er: 1e6, Eflow: 1e3, w: 5 };

export function chainsClosed({ lx }) {
  const q = 10 ** -lx;
  const p = 1 - q;
  const Mn = PS.m0 / q;
  const Mw = (PS.m0 * (1 + p)) / q;
  const Tg = PS.TgInf - PS.K / Mn;
  return { p, Mn, Mw, PDI: Mw / Mn, DP: Mn / PS.m0, Tg, entangled: Mw > PS.Mc };
}

export function chainsNumeric({ lx }) {
  const q = 10 ** -lx;
  const p = 1 - q;
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  let x = q;
  for (let i = 1; i < 5e7; i++) {
    const M = i * PS.m0;
    s0 += x;
    s1 += x * M;
    s2 += x * M * M;
    if (x < 1e-22 * q && i > 10) break;
    x *= p;
  }
  return { Mn: s1 / s0, Mw: s2 / s1 };
}

/** Young's modulus (Pa) at T °C: glassy, then a rubbery plateau if entangled, or flow if not. */
export function modulus(T, c) {
  const low = c.entangled ? PS.Er : PS.Eflow;
  const f = 1 / (1 + Math.exp(-(T - c.Tg) / PS.w));
  return 10 ** (Math.log10(PS.Eg) + f * (Math.log10(low) - Math.log10(PS.Eg)));
}

export function chainsChecked(state) {
  const cf = chainsClosed(state);
  const nu = chainsNumeric(state);
  return { ...cf, E80: modulus(80, cf), E120: modulus(120, cf), MnNum: nu.Mn, MwNum: nu.Mw, gap: Math.max(Math.abs(nu.Mn - cf.Mn) / cf.Mn, Math.abs(nu.Mw - cf.Mw) / cf.Mw) };
}

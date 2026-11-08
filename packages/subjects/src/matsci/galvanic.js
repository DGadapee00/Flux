/**
 * Two metals in contact in water: galvanic corrosion (EMA 3010).
 *
 * Steel joined to copper in aerated water: iron dissolves on the steel, Fe → Fe²⁺ + 2e⁻, and oxygen
 * is reduced on the copper. Each reaction's current density grows exponentially with its overpotential
 * (Tafel), i_a = i₀,a 10^{(E − E_a)/b_a} and i_c = i₀,c 10^{(E_c − E)/b_c}. The couple settles at the
 * potential where the total currents balance, A_a i_a = A_c i_c, which is linear in E:
 *   E (1/b_a + 1/b_c) = log₁₀(A_c i₀,c / A_a i₀,a) + E_a/b_a + E_c/b_c.
 * A small anode beside a large cathode must carry the whole cathode's current through a small area:
 * its current density, and its corrosion rate, grow as (A_c/A_a)^{b_c/(b_a + b_c)}. Painting the anode
 * alone and leaving a scratch makes that ratio huge.
 *
 * The values are a model of steel and copper in aerated water. The second method finds the balance
 * potential by bisection on the net current.
 */

export const COUPLE = { Ea: -0.44, ba: 0.06, i0a: 1e-3, Ec: 0.8, bc: 0.12, i0c: 2e-11, mmPerYearPerAm2: 1.16 };

export function galvanicClosed({ lr }) {
  const { Ea, ba, i0a, Ec, bc, i0c, mmPerYearPerAm2 } = COUPLE;
  const r = 10 ** lr;
  const E = (Math.log10((r * i0c) / i0a) + Ea / ba + Ec / bc) / (1 / ba + 1 / bc);
  const ia = i0a * 10 ** ((E - Ea) / ba);
  return { r, E, ia, rate: ia * mmPerYearPerAm2, alone: null };
}

export function galvanicNumeric({ lr }) {
  const { Ea, ba, i0a, Ec, bc, i0c } = COUPLE;
  const r = 10 ** lr;
  const net = (E) => Math.log10(i0a * 10 ** ((E - Ea) / ba)) - Math.log10(r * i0c * 10 ** ((Ec - E) / bc));
  let lo = Ea;
  let hi = Ec;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (net(m) < 0) lo = m;
    else hi = m;
  }
  const E = (lo + hi) / 2;
  return { E, ia: i0a * 10 ** ((E - Ea) / ba) };
}

export function galvanicChecked(state) {
  const cf = galvanicClosed(state);
  const nu = galvanicNumeric(state);
  const one = galvanicClosed({ lr: 0 });
  return { ...cf, Enum: nu.E, iaNum: nu.ia, gap: Math.abs(nu.ia - cf.ia) / cf.ia, rateEqual: one.rate };
}

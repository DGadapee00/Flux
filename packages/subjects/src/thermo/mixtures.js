/**
 * A two-gas ideal mixture in a closed vessel (EML 3101, thermochemistry).
 *
 * Masses m_A and m_B of two ideal gases share a vessel of volume V at temperature T. Each gas's
 * amount is N_i = m_i/M_i, so the mole fraction y_i = N_i/N and the mass fraction x_i = m_i/m differ
 * whenever the molar masses do: y_i = x_i M/M_i, with M = m/N the mixture's molar mass. A heavy gas
 * has a larger share of the mass than of the molecules.
 *
 * Dalton's law: each gas fills the whole vessel at T and pushes with its own partial pressure,
 *   p_i = N_i R̄ T / V,   and   p = Σ p_i,   so   p_i = y_i p.
 * The mole fraction, not the mass fraction, gives the partial pressure.
 *
 * Mixture properties are weighted sums: M by mole fraction, M = Σ y_i M_i; the specific heat per
 * kilogram by mass fraction, c_p = Σ x_i c_p,i.
 *
 * The closed form reads p_i = y_i p, M = Σ y_i M_i and c_p = Σ x_i c_p,i. The second method takes
 * each gas alone in the vessel (p_i = N_i R̄ T/V, summed), M = m/N, and the molar route through the
 * library's mixture, c_p = Σ y_i c̄_p,i / M (idealgas.js), and requires all three to agree.
 */
import { R_UNIVERSAL, cpMolar, gas, molarMass } from './idealgas.js';

/** The gases the lab offers beside nitrogen, with the names idealgas.js knows them by. */
export const GASES = {
  CO2: { name: 'Carbon dioxide', formula: 'CO₂', species: 'CO2' },
  AR: { name: 'Argon', formula: 'Ar', species: 'AR' },
  CH4: { name: 'Methane', formula: 'CH₄', species: 'CH4' },
  H2: { name: 'Hydrogen', formula: 'H₂', species: 'H2' },
};
export const A_SPECIES = 'N2';

/** The closed form: fractions, partial pressures and mixture properties. mA, mB in kg, T in K, V in m³. */
export function mixture({ gasB, mA, mB, T, V }) {
  const sB = GASES[gasB].species;
  const MA = molarMass(A_SPECIES);
  const MB = molarMass(sB);
  const NA = mA / MA;
  const NB = mB / MB;
  const N = NA + NB;
  const m = mA + mB;
  const yA = NA / N;
  const yB = NB / N;
  const xA = mA / m;
  const xB = mB / m;
  const p = (N * R_UNIVERSAL * T) / V;
  const M = yA * MA + yB * MB;
  // Specific heats per kilogram of each gas, then weighted by mass.
  const cpA = cpMolar(A_SPECIES, T) / MA;
  const cpB = cpMolar(sB, T) / MB;
  const cp = xA * cpA + xB * cpB;
  return {
    MA, MB, NA, NB, N, m, yA, yB, xA, xB, p,
    pA: yA * p,
    pB: yB * p,
    // The mistake the lab corrects: the mass fraction read as a mole fraction.
    pBmass: xB * p,
    M,
    R: R_UNIVERSAL / M,
    cpA, cpB, cp,
    rho: m / V,
  };
}

/** The second method: each gas alone in the vessel, the molar mass from the totals, c_p by moles. */
export function mixtureByParts({ gasB, mA, mB, T, V }) {
  const sB = GASES[gasB].species;
  const NA = mA / molarMass(A_SPECIES);
  const NB = mB / molarMass(sB);
  const alone = (Ni) => (Ni * R_UNIVERSAL * T) / V;
  const pA = alone(NA);
  const pB = alone(NB);
  const N = NA + NB;
  const mix = gas({ [A_SPECIES]: NA / N, [sB]: NB / N });
  return { pA, pB, p: pA + pB, M: (mA + mB) / N, cp: mix.cp(T) };
}

/** Both, and the largest relative difference between them. */
export function mixtureChecked(state) {
  const a = mixture(state);
  const b = mixtureByParts(state);
  const rel = (u, v) => Math.abs(u - v) / Math.max(Math.abs(u), Math.abs(v), 1e-300);
  const gap = Math.max(rel(a.pA, b.pA), rel(a.pB, b.pB), rel(a.p, b.p), rel(a.M, b.M), rel(a.cp, b.cp));
  return { ...a, parts: b, gap };
}

/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  moles: { name: 'Count molecules, not kilograms', statement: 'A gas’s amount is N = m/M. The mole fraction y = N_i/N and the mass fraction x = m_i/m agree only when the molar masses do: y_i = x_i M/M_i.', cue: 'Masses given, mole fractions or partial pressures wanted.', family: 'Thermodynamics' },
  dalton: { name: 'Each gas fills the vessel', statement: 'In an ideal mixture each gas pushes as if it were alone at the mixture’s T and V: p_i = N_i R̄T/V = y_i p, and the partial pressures add up to p.', cue: 'A partial pressure in a mixture.', family: 'Thermodynamics' },
  weighting: { name: 'Weight by what the property is per', statement: 'A per-mole property averages by mole fraction, M = Σ y_i M_i; a per-kilogram property by mass fraction, c_p = Σ x_i c_p,i and R = R̄/M.', cue: 'A property of the whole mixture.', family: 'Thermodynamics' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};

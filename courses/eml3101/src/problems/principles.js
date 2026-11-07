/**
 * The principles this course's problems turn on. A template names its deciding principle; the
 * practice panel shows it with each solution and groups misses by it.
 */
export const PRINCIPLES = {
  moles: { name: 'Count molecules, not kilograms', statement: 'A gas’s amount is N = m/M. The mole fraction y = N_i/N and the mass fraction x = m_i/m agree only when the molar masses do: y_i = x_i M/M_i.', cue: 'Masses given, mole fractions or partial pressures wanted.', family: 'Thermodynamics' },
  dalton: { name: 'Each gas fills the vessel', statement: 'In an ideal mixture each gas pushes as if it were alone at the mixture’s T and V: p_i = N_i R̄T/V = y_i p, and the partial pressures add up to p.', cue: 'A partial pressure in a mixture.', family: 'Thermodynamics' },
  choke: { name: 'A sonic throat fixes the flow', statement: 'Once the throat reaches Mach 1 the mass flow is A_t p₀ √(γ/RT₀) (2/(γ+1))^((γ+1)/(2(γ−1))), set by the reservoir alone. Lowering the back pressure further changes the flow downstream of the throat, not the mass flow.', cue: 'A nozzle or orifice with a large pressure drop.', family: 'Compressible flow' },
  shock: { name: 'A shock slows the gas', statement: 'Across a normal shock a supersonic flow drops to subsonic, its pressure, temperature and density rise, and its stagnation pressure falls: entropy rises, and the loss grows with the upstream Mach number.', cue: 'A supersonic flow meeting a higher pressure.', family: 'Compressible flow' },
  weighting: { name: 'Weight by what the property is per', statement: 'A per-mole property averages by mole fraction, M = Σ y_i M_i; a per-kilogram property by mass fraction, c_p = Σ x_i c_p,i and R = R̄/M.', cue: 'A property of the whole mixture.', family: 'Thermodynamics' },
};

/** Tags for templates that do not carry their own `principles`. */
export const PRINCIPLE_TAGS = {};

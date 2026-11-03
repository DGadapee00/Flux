export default {
  id: 'gas-mixtures',
  title: 'Ideal-gas mixtures',
  label: ['Gas mixtures'],
  subject: 'thermo',
  courses: ['eml3101'],
  eq: String.raw`p_i = y_i\,p, \qquad y_i = \frac{N_i}{N}, \qquad M = \sum y_i M_i, \qquad h = \sum \frac{m_i}{m}\,h_i(T)`,
  idea: String.raw`In a mixture of ideal gases each molecule behaves as if the others were not there. So each gas fills the whole volume at the mixture temperature and pushes with its own partial pressure, and the partial pressures add up to the total: Dalton's law. A gas's partial pressure is its mole fraction times the total. Mixture properties are weighted sums: by mole fraction for molar mass, by mass fraction for specific enthalpy. Mass and mole fractions differ, so keep track of which one a formula needs.`,
  requires: ['ideal-gas'],
  sources: [
    {
      title: 'Cleynen, Engineering Thermodynamics',
      url: 'https://thermodynamicsbook.com/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Free text that covers the ideal-gas properties mixtures are built from.',
    },
    {
      title: 'Yan, Introduction to Engineering Thermodynamics',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The ideal-gas model and its limits, the ground mixtures stand on.',
    },
  ],
  labs: [],
  candidate: 'Mix nitrogen and carbon dioxide with sliders for the amounts, reading mass and mole fractions together. It corrects the idea that mass and mole fractions are the same thing: a heavy gas has a large mass fraction from a small mole fraction.',
};

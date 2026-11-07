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
      checked: '2026-11-06',
    },
    {
      title: 'Yan, Introduction to Engineering Thermodynamics',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The ideal-gas model and its limits, the ground mixtures stand on.',
    },
  ],
  labs: [
    { course: 'eml3101', lab: 'mixture', notes: ['s1', 's2', 's3'], note: 'Nitrogen and a second gas in one vessel, read by molecules, by mass and by pressure: a kilogram of CO₂ beside a kilogram of N₂ is half the mass but 39% of the molecules, and the partial pressures follow the molecules.' },
  ],
};

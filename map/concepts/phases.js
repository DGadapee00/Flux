export default {
  id: 'phases',
  title: 'Phases and property tables',
  label: ['Phases and', 'property tables'],
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`v = v_f + x\,(v_g - v_f), \qquad x = \frac{m_\text{vapour}}{m}`,
  idea: String.raw`A pure substance can be liquid, vapour or a mix. Under the saturation dome the two coexist at a fixed temperature for each pressure, so pressure and temperature stop being independent. The quality \(x\) says how much has boiled, and any property is a weighted mix of the liquid and vapour values. Raise the pressure and water boils hotter, which is the whole point of a pressure canner.`,
  requires: ['pressure'],
  sources: [
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, §2.3 Phase diagrams and §2.4 Thermodynamic tables',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book: the dome, quality and reading the steam tables.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §1.5 Phase changes',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/1-5-phase-changes',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Phase diagrams and latent heat from the physics side.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'phase', notes: ['s2', 's1', 's3'], note: 'Water’s phase diagram and saturation dome, with states you place.' },
    { course: 'eml3100', lab: 'canner', note: 'A pressure canner: gauge plus atmosphere sets the boiling point, and altitude lowers it.' },
  ],
};

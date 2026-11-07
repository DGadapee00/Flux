export default {
  id: 'ideal-gas',
  title: 'The ideal-gas law',
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`pv = RT, \qquad Z = \frac{pv}{RT}`,
  idea: String.raw`At low pressure or high temperature a gas's molecules are far apart and hardly interact, and pressure, volume and temperature obey \(pv = RT\). Near the saturation dome or at very high pressure they do not. The compressibility factor \(Z\) measures how far a real gas strays: \(Z = 1\) means ideal.`,
  requires: ['pressure'],
  sources: [
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, §3.1 Ideal gas and §3.2 Compressibility factor',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book: when the law holds and how to tell.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §2.1 Molecular model of an ideal gas',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/2-1-molecular-model-of-an-ideal-gas',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Where the law comes from, molecule by molecule.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'phase', notes: ['s5', 's4'], note: 'Where on the phase diagram steam behaves as an ideal gas, and where it does not.' },
  ],
};

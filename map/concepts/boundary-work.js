export default {
  id: 'boundary-work',
  title: 'Boundary work',
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`W_b = \int_{V_1}^{V_2} p\,dV, \qquad pV^n = \text{const}\ \text{(polytropic)}`,
  idea: String.raw`A gas that pushes a piston out does work equal to the area under its path on a \(p\)–\(V\) diagram. The same two end states can be joined by different paths, and each gives a different work. That is why work is not a property. A polytropic path, \(pV^n\) constant, covers constant pressure, constant temperature and adiabatic cases with one exponent.`,
  requires: ['pressure', 'definite-integral'],
  sources: [
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, §4.3 Work',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book: boundary and polytropic work.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §3.4 Thermodynamic processes',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/3-4-thermodynamic-processes',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Isobaric, isothermal and adiabatic paths on one diagram.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'piston', notes: ['s2', 's3'], note: String.raw`A piston path drawn on a \(p\)–\(V\) diagram, with the work as the area under it.` },
  ],
};

export default {
  id: 'entropy',
  title: 'Entropy',
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`ds = \left(\frac{\delta q}{T}\right)_\text{rev}, \qquad s_2 - s_1 = c_p\ln\frac{T_2}{T_1} - R\ln\frac{p_2}{p_1}`,
  idea: String.raw`Entropy is a property, so its change depends only on the end states. Along a reversible path it is heat divided by temperature, so the area under a reversible path on a \(T\)–\(s\) diagram is the heat. For an ideal gas and for a liquid there are formulas; for steam, tables. A real process ends to the right of the reversible one.`,
  requires: ['carnot-limit'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §4.6 Entropy',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/4-6-entropy',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Entropy defined from the Carnot cycle, with ideal-gas changes.',
    },
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, Ch. 6 Entropy and the second law',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book: T–s diagrams and entropy from the tables.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'ts', notes: ['s2', 's1', 's3'], note: 'Reversible isobars on a T–s diagram, where the area under the path is the heat.' },
  ],
};

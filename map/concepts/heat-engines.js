export default {
  id: 'heat-engines',
  title: 'Heat engines and heat pumps',
  label: ['Heat engines', 'and heat pumps'],
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`\eta = \frac{W_\text{net}}{Q_H} = 1 - \frac{Q_L}{Q_H}, \qquad \text{COP}_R = \frac{Q_L}{W}`,
  idea: String.raw`An engine takes heat from something hot, turns part of it into work, and must reject the rest to something cold. A refrigerator or heat pump runs the other way: work moves heat from cold to hot. Efficiency and coefficient of performance are what you get over what you pay.`,
  requires: ['first-law-closed'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §4.2 Heat engines',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/4-2-heat-engines',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Engines as energy-flow diagrams, the picture the lab uses.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §4.3 Refrigerators and heat pumps',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/4-3-refrigerators-and-heat-pumps',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The same diagram reversed, with COP for each use.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'claims', notes: ['s1'], note: 'A claimed engine, refrigerator or heat pump, judged by the first and second laws.' },
    { course: 'eml3100', lab: 'carnot', notes: ['s2'], note: 'Engine and refrigerator limits between two temperatures.' },
  ],
};

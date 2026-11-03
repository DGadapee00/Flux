export default {
  id: 'entropy-generation',
  title: 'Entropy generation',
  label: ['Entropy', 'generation'],
  subject: 'thermo',
  courses: ['eml3100', 'eml3101'],
  eq: String.raw`S_\text{gen} = \Delta S - \sum \frac{Q_k}{T_k} \ge 0, \qquad \dot S_\text{gen} = \dot Q\left(\frac{1}{T_L} - \frac{1}{T_H}\right)`,
  idea: String.raw`Every real process makes entropy, and none destroys it. Heat flowing from warm to cold is the simplest case: the cold side gains more entropy than the warm side loses. The bigger the temperature gap the heat falls through, the more is generated. Zero generation is the reversible ideal.`,
  requires: ['entropy'],
  sources: [
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, Ch. 6 Entropy and the second law',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book: the entropy balance and its generation term.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §4.6 Entropy',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/4-6-entropy',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Heat flow between two bodies as the example of entropy rising.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'wall', notes: ['s6'], note: 'Heat through a wall from a warm room to cold air, and the entropy it makes.' },
  ],
};

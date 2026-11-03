export default {
  id: 'carnot-limit',
  title: 'The second law and the Carnot limit',
  label: ['Second law,', 'Carnot limit'],
  subject: 'thermo',
  courses: ['eml3100', 'eml3101'],
  eq: String.raw`\eta_\text{max} = 1 - \frac{T_L}{T_H}, \qquad \oint \frac{\delta Q}{T} \le 0`,
  idea: String.raw`No engine working between two temperatures beats a reversible one, and every reversible one does exactly as well. Its efficiency depends only on the two temperatures, in kelvin. A claim above the limit is impossible; at the limit, reversible; below it, real. Real air conditioners sit far below theirs.`,
  requires: ['heat-engines'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §4.5 The Carnot cycle',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/4-5-the-carnot-cycle',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The cycle step by step, and why its efficiency is the limit.',
    },
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, Ch. 6 Entropy and the second law',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book: Kelvin–Planck, Clausius and the Carnot principles.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'carnot', notes: ['s3'], note: 'The Carnot limit in kelvin, and what a ratio in Celsius gets wrong.' },
    { course: 'eml3100', lab: 'claims', notes: ['s4'], note: 'Reversible, irreversible or impossible, by the Clausius sum and by the Carnot limit.' },
    { course: 'eml3100', lab: 'ac', notes: ['s6'], note: 'A real air conditioner’s COP far below the Carnot COP between indoors and out.' },
  ],
};

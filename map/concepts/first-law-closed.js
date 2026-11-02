export default {
  id: 'first-law-closed',
  title: 'First law for a closed system',
  label: ['First law', '(closed system)'],
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`\Delta U = Q - W, \qquad \Delta u = c_v\,\Delta T\ \text{(ideal gas)}`,
  idea: String.raw`Heat and work are two ways energy crosses a boundary, and the energy inside changes by what comes in minus what goes out. With heat in and work out both counted positive, \(\Delta U = Q - W\). For an ideal gas the internal energy depends on temperature alone; for steam, read it from the tables.`,
  requires: ['boundary-work', 'phases'],
  sources: [
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, §4.4 The first law for closed systems',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book, with the same sign convention as the lab.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §3.3 First law of thermodynamics',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The law stated as energy bookkeeping, with worked cycles.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'balance', notes: ['s1', 's4'], note: 'Paddle work and heat into air under one sign rule, and a motor driving a pump.' },
    { course: 'eml3100', lab: 'piston', notes: ['s5'], note: 'Steam in a piston: work from the path, heat from the first law and the tables.' },
    { course: 'eml3100', lab: 'kettle', note: 'A covered pot on a coil burner: the heat is m Δh and the time is that heat over the power in.' },
  ],
};

export default {
  id: 'energy-methods',
  title: 'Strain energy and Castigliano',
  label: ['Energy', 'methods'],
  subject: 'materials',
  courses: ['egn3331'],
  eq: String.raw`U = \int\frac{N^2}{2AE}dx + \int\frac{M^2}{2EI}dx, \qquad \delta_i = \frac{\partial U}{\partial P_i}`,
  idea: String.raw`A loaded elastic body stores strain energy, and the deflection at a load is the derivative of that energy with respect to the load. A dummy load finds a deflection where no real load acts; the unit-load method does the same with a table of member forces. Energy also handles impact: a weight dropped onto a rope multiplies the static force by \(1 + \sqrt{1 + 2h/\delta_\text{st}}\).`,
  requires: ['axial-deformation', 'beam-deflection', 'partial-derivatives'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 26: Energy methods',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec24/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Strain energy and Castigliano’s theorem.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 3.11, calendar: Truss deflections and Castigliano’s method (8)',
      url: 'https://ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'Where the course’s reading applies Castigliano to trusses.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3331', lab: 'castigliano', notes: ['s1', 's2', 's3', 's7'], note: 'Deflection as the derivative of strain energy, with a dummy load.' },
    { course: 'egn3331', lab: 'drop', notes: ['s4', 's5'], note: 'A weight dropped onto a crane rope, and the factor it adds.' },
    { course: 'egn3331', lab: 'rooftruss', notes: ['s6'], note: 'A roof truss’s sag by unit loads on a table of member forces.' },
  ],
};

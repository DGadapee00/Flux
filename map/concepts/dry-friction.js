export default {
  id: 'dry-friction',
  title: 'Dry friction and tipping',
  label: ['Dry friction', 'and tipping'],
  subject: 'mechanics',
  courses: ['statics'],
  eq: String.raw`F \le \mu_s N, \qquad T_2 = T_1\,e^{\mu\beta}\ \text{(belt)}`,
  idea: String.raw`Friction is whatever force keeps a contact from slipping, up to \(\mu_s N\). It equals \(\mu N\) only on the verge of slipping or while sliding, so ask first whether the body moves. A tall body pushed high may tip before it slides, and more friction makes tipping more likely. Rope wrapped round a post holds a tension that grows exponentially with the wrap angle.`,
  requires: ['static-equilibrium'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 4: Friction',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec4/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Impending motion, wedges and belts.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §6.2 Friction',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/6-2-friction',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Static against kinetic friction with measured coefficients.',
    },
  ],
  labs: [
    { course: 'statics', lab: 'friction', notes: ['s1'], note: 'A block on an incline, the friction cone, tip or slip, and belt friction on a post.' },
    { course: 'statics', lab: 'bookcase', notes: ['s2'], note: 'A tall bookcase pushed high: more floor friction can make it tip.' },
  ],
};

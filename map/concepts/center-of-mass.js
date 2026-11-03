export default {
  id: 'center-of-mass',
  title: 'Center of mass',
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`\mathbf r_\text{cm} = \frac{\sum m_i\mathbf r_i}{\sum m_i} = \frac1M\int \mathbf r\,dm, \qquad M\mathbf a_\text{cm} = \sum\mathbf F_\text{ext}`,
  idea: String.raw`The centre of mass is the mass-weighted average position. Internal forces cancel in pairs, so it moves as if all the mass were there and only outside forces acted. A shell that bursts in flight keeps its centre of mass on the original parabola.`,
  requires: ['impulse-momentum', 'definite-integral'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §9.6 Center of mass',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/9-6-center-of-mass',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Point masses, then rods and plates by integration.',
    },
    {
      title: 'MIT 8.01SC, 17.1 Definition of the center of mass',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-5-momentum-and-impulse/17-1-definition-of-the-center-of-mass/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'The definition and why internal forces drop out.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'center-of-mass', notes: ['s6'], note: 'The weighted average of masses, and a burst that leaves the centre of mass on its parabola.' },
  ],
};

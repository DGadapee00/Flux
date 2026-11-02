export default {
  id: 'impact',
  title: 'Impact and restitution',
  label: ['Impact'],
  subject: 'mechanics',
  courses: ['egn3321'],
  eq: String.raw`e = \frac{v_{B2} - v_{A2}}{v_{A1} - v_{B1}}`,
  idea: String.raw`In a collision, momentum along the line of impact is shared and conserved. One more equation is needed, and the coefficient of restitution supplies it: how fast they separate over how fast they closed. \(e = 1\) loses no energy; \(e = 0\) makes them move together. In an oblique impact the parts across the line of impact are unchanged.`,
  requires: ['impulse-momentum'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §9.4 Types of collisions',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Elastic and inelastic cases side by side.',
    },
    {
      title: 'MIT 8.01SC, 26.1 Momentum in collisions',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-9-collision-theory/26-1-momentum-in-collisions/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'Collision theory before the worked 1D and 2D cases.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'impact', notes: ['s3', 's4'], note: 'Central and oblique impact, with the energy each one loses.' },
  ],
};

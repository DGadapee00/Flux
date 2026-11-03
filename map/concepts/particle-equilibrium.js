export default {
  id: 'particle-equilibrium',
  title: 'Equilibrium of a particle',
  label: ['Particle', 'equilibrium'],
  subject: 'mechanics',
  courses: ['statics'],
  eq: String.raw`\sum\mathbf F = \mathbf 0 \iff \sum F_x = \sum F_y = \sum F_z = 0`,
  idea: String.raw`A point held by cables, springs and weights is in equilibrium when its forces add to zero: drawn tip to tail, they close into a polygon. Write one equation per direction and solve for the unknown tensions. Spreading a lifting bridle wider makes each leg pull harder, because only the vertical parts hold the load.`,
  requires: ['vectors'],
  sources: [
    {
      title: 'Engineering Statics: Open and Interactive (Baker and Haynes)',
      url: 'https://engineeringstatics.org/',
      kind: 'Free textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'A free statics text with interactive diagrams; its particle-equilibrium chapter fits here.',
    },
    {
      title: 'MIT 2.001, Lecture 2: Forces, moments, equilibrium',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec2/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Equilibrium set up from free-body diagrams, MIT’s way.',
    },
  ],
  labs: [
    { course: 'statics', lab: 'particle', notes: ['s1', 's2'], note: 'A ring on cables and a spring: the force polygon closes when ΣF = 0.' },
    { course: 'statics', lab: 'bridle', notes: ['s3'], note: 'A pallet on a two-leg bridle: shallower legs carry more than half the load each.' },
  ],
};

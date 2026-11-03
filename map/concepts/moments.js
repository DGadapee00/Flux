export default {
  id: 'moments',
  title: 'Moments and couples',
  subject: 'mechanics',
  courses: ['statics'],
  eq: String.raw`\mathbf M_O = \mathbf r\times\mathbf F, \qquad M = Fd_\perp`,
  idea: String.raw`A force turns a body about a point by its size times its perpendicular distance from the point, or in vectors \(\mathbf r\times\mathbf F\). Two equal and opposite forces that do not share a line make a couple, whose moment is the same about every point. Any set of forces can be swapped for one force and one couple that act the same.`,
  requires: ['vectors'],
  sources: [
    {
      title: 'MIT 2.001, Lecture 1: Review of forces and moments',
      url: 'https://ocw.mit.edu/courses/2-001-mechanics-materials-i-fall-2006/resources/lec1/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Moments and couples reviewed before equilibrium.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §10.6 Torque',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/10-6-torque',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The moment as a cross product, with the lever arm drawn.',
    },
  ],
  labs: [
    { course: 'statics', lab: 'moments', notes: ['s3'], note: 'Each moment worked two ways, by components and by perpendicular distance, and a couple about any point.' },
    { course: 'statics', lab: 'shelf', notes: ['s4'], note: 'A wall shelf: the anchor force depends on where the load sits and how far apart the anchors are.' },
  ],
};

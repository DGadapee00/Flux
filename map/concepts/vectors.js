export default {
  id: 'vectors',
  title: 'Vectors, dot and cross products',
  label: ['Vectors, dot', 'and cross'],
  subject: 'calculus',
  courses: ['phy2049'],
  eq: String.raw`\mathbf a\cdot\mathbf b = ab\cos\theta, \qquad |\mathbf a\times\mathbf b| = ab\sin\theta`,
  idea: String.raw`A vector has a size and a direction, and in components it is just three numbers. The dot product measures how much two vectors point the same way, so it is zero when they are perpendicular. The cross product gives a third vector perpendicular to both, with a length set by how far apart they point. Work and flux use the dot product; torque and the magnetic force use the cross product.`,
  requires: [],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §2.4 Products of vectors',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/2-4-products-of-vectors',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Both products from components, with the right-hand rule drawn out.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Coordinate systems, gradients, line and surface integrals',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving01/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'The vector tools the rest of E&M leans on, set up the way 8.02 uses them.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'vectors', notes: ['s1', 's2', 's3', 's4'], note: 'Components, the dot product and the cross product, drawn in 3D.' },
  ],
};

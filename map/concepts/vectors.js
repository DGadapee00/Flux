export default {
  id: 'vectors',
  title: 'Vectors, dot and cross products',
  label: ['Vectors, dot', 'and cross'],
  subject: 'calculus',
  courses: ['phy2049', 'mac2313', 'phy2048', 'statics'],
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
      checked: '2026-11-06',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Coordinate systems, gradients, line and surface integrals',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving01/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'The vector tools the rest of E&M leans on, set up the way 8.02 uses them.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'vectors', notes: ['s1', 's2', 's3', 's4'], note: 'Components, the dot product and the cross product, drawn in 3D.' },
    { course: 'mac2313', lab: 'r3', note: 'Two vectors in space, their sum, and the parallelogram whose area is the cross product.' },
    { course: 'phy2048', lab: 'vectors', notes: ['s4', 's5', 's6', 's1', 's2', 's3'], note: 'Vectors added by components, the dot product as a projection, the cross product as an area.' },
    { course: 'statics', lab: 'vectors', notes: ['s1', 's2'], note: String.raw`Forces in 3D by components and along a line, with \(\cos^2\alpha + \cos^2\beta + \cos^2\gamma = 1\).` },
  ],
};

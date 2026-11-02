export default {
  id: 'gauss-law',
  title: 'Gauss’s law',
  label: ['Gauss’s law'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\oint \mathbf E\cdot d\mathbf A = \frac{q_\text{enc}}{\varepsilon_0}`,
  idea: String.raw`The electric flux out of any closed surface depends only on the charge inside. Charge outside sends in as much flux as it sends out. With enough symmetry you choose a surface where \(E\) is constant and normal, and the integral becomes \(E\) times an area.`,
  requires: ['surface-flux'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §6.1 Electric flux',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/6-1-electric-flux',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Builds flux from a flat surface up, before the law itself.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Gauss’s law',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving03/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'A step-by-step method for choosing the Gaussian surface, then solved cases.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'gauss', notes: 's11', note: 'Spherical, cylindrical and planar symmetry, with the notes on each.' },
  ],
};

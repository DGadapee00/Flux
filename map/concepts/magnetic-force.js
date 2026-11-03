export default {
  id: 'magnetic-force',
  title: 'Magnetic force',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\mathbf F = q\,\mathbf v\times\mathbf B, \qquad \mathbf F = I\,\mathbf L\times\mathbf B, \qquad r = \frac{mv}{qB}`,
  idea: String.raw`A magnetic field pushes only on moving charge, and always sideways to the motion. So it bends a path without changing the speed: a charge moving across a uniform field goes in a circle. A wire carrying current feels the sum of those pushes, and a current loop feels a torque. That torque turns motors; the circle sorts ions in a mass spectrometer and a cyclotron.`,
  requires: ['vectors'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §11.3 Motion of a charged particle in a magnetic field',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/11-3-motion-of-a-charged-particle-in-a-magnetic-field',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Circles and helices, with the radius and period derived.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Force and torque on a current loop',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving06/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'From force on each side to the dipole moment and torque.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'magforce', notes: ['s8', 's9', 's10', 's11', 's16'], note: 'A proton, an electron, a helix, a velocity selector and a wire in B.' },
    { course: 'phy2049', lab: 'cyclotron', note: String.raw`The lap time \(2\pi m/qB\) does not depend on speed, so one frequency keeps kicking the ion.` },
    { course: 'phy2049', lab: 'motor', note: 'A DC motor: the torque on a coil, kept one way by the commutator.' },
  ],
};

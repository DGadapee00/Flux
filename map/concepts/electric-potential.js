export default {
  id: 'electric-potential',
  title: 'Electric potential',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`V = \frac{U}{q_0}, \qquad \Delta V = -\int_a^b \mathbf E\cdot d\mathbf l, \qquad \mathbf E = -\nabla V`,
  idea: String.raw`The electrostatic force is conservative, so a charge has potential energy, and potential is that energy per unit charge. It is a scalar, so the potentials of many charges simply add. The field points down the potential's gradient, at right angles to the equipotentials. A charge that falls through \(\Delta V\) gains kinetic energy \(q\,\Delta V\); that is how an ion thruster makes its beam.`,
  requires: ['electric-field', 'gradient', 'line-integrals'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §7.2 Electric potential and potential difference',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/7-2-electric-potential-and-potential-difference',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Separates potential energy from potential, the distinction most students blur.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §7.4 Determining field from potential',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/7-4-determining-field-from-potential',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The gradient step, with the components written out.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'potential', notes: ['s3', 's1', 's2', 's4', 's5', 's6', 's7'], note: 'Potential as a coloured surface with equipotentials and field lines over it.' },
    { course: 'phy2049', lab: 'thruster', note: String.raw`An ion thruster: ions fall through the grid voltage, \(qV = \tfrac12 mv^2\), and leave as thrust.` },
  ],
};

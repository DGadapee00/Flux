export default {
  id: 'electric-field',
  title: 'Electric field',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\mathbf E = \frac{\mathbf F}{q_0} = \sum_i \frac{1}{4\pi\varepsilon_0}\,\frac{q_i}{r_i^2}\,\hat{\mathbf r}_i`,
  idea: String.raw`The field is the force per unit charge that a small test charge would feel at a point. It belongs to the source charges, whether or not anything is there to feel it. Fields from several charges add as vectors. Field lines start on positive charge, end on negative charge, and crowd together where the field is strong.`,
  requires: ['coulombs-law', 'vector-fields'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §5.4 Electric field',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/5-4-electric-field',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'From force to field, then superposition of point charges.',
    },
    {
      title: 'PhET: Charges and fields',
      url: 'https://phet.colorado.edu/en/simulations/charges-and-fields',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Drop charges and a sensor; good practice reading a field map.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'field', notes: ['s1', 's2', 's3', 's4', 's5'], note: 'The field of point charges as arrows and lines, with a probe you place.' },
  ],
};

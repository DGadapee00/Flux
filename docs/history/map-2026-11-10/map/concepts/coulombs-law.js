export default {
  id: 'coulombs-law',
  title: 'Coulomb’s law',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\mathbf F_{12} = \frac{1}{4\pi\varepsilon_0}\,\frac{q_1 q_2}{r^2}\,\hat{\mathbf r}_{12}`,
  idea: String.raw`Two point charges push or pull along the line between them, with a force that falls as \(1/r^2\). Like signs repel and unlike signs attract. With more than two charges, each pair acts as if the others were not there, and the forces add as vectors. A charge sits in equilibrium where those vectors cancel.`,
  requires: ['electric-charge', 'vectors'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §5.3 Coulomb’s law',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/5-3-coulombs-law',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Superposition worked in components, the step most errors come from.',
      checked: '2026-11-06',
    },
    {
      title: 'PhET: Coulomb’s law',
      url: 'https://phet.colorado.edu/en/simulations/coulombs-law',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Change the charges and the gap and read the force; the inverse square shows quickly.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'force', notes: ['s8', 's9', 's10'], note: String.raw`Select a charge to read \(\mathbf F_\text{net}\), the vector sum of every pair.` },
  ],
};

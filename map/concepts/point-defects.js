export default {
  id: 'point-defects',
  title: 'Point defects and vacancies',
  label: ['Point', 'defects'],
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\frac{n_v}{N} = \exp\!\left(-\frac{Q_v}{k_BT}\right)`,
  idea: String.raw`A real crystal always has empty sites, vacancies, and foreign atoms sitting in sites or squeezed between them. Making a vacancy costs energy but gains disorder, so at any temperature some fraction of sites is empty, and that fraction rises steeply with temperature in the Arrhenius form. Substitutional and interstitial atoms are how alloys are made. Vacancies are what let atoms move, which is the start of diffusion.`,
  requires: ['crystal-structures'],
  sources: [
    {
      title: 'MIT 3.091, Recitation 17: Point defects and Arrhenius-like vacancy activation',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec17/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'The vacancy fraction and its Arrhenius plot, worked.',
    },
    {
      title: 'OpenStax Chemistry 2e, §12.5 Collision theory',
      url: 'https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Where the Arrhenius form comes from, for readers meeting it here first.',
    },
  ],
  labs: [],
  candidate: 'Plot the vacancy fraction against temperature on linear and Arrhenius axes. It corrects the idea that vacancies are flaws a perfect process would remove: they are an equilibrium population.',
};

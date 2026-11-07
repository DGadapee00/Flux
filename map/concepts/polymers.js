export default {
  id: 'polymers',
  title: 'Polymers',
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\text{DP} = \frac{\bar M_n}{m_\text{repeat}}, \qquad \bar M_n = \sum x_i M_i`,
  idea: String.raw`A polymer is a long chain of repeat units, covalent along the chain and held to its neighbours only by weak secondary bonds. Those weak bonds decide its behaviour: below the glass transition the chains are frozen and the plastic is stiff, above it they slide and it turns rubbery. Thermoplastics soften and reflow when heated; thermosets have covalent crosslinks between chains and char instead. Longer chains and more crystalline packing raise strength.`,
  requires: ['atomic-bonding'],
  sources: [
    {
      title: 'MIT 3.091, Recitation 25: Polymers',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec25/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Chain structure, molecular weight and degree of polymerization, worked.',
      checked: '2026-11-06',
    },
    {
      title: 'Glass transition (Wikipedia)',
      url: 'https://en.wikipedia.org/wiki/Glass_transition',
      kind: 'Reference article',
      level: 'Course level',
      why: 'What changes at Tg and why it is a range, not a melting point.',
      checked: '2026-11-06',
    },
  ],
  labs: [],
  candidate: 'Heat a polymer through its glass transition and watch stiffness fall by orders of magnitude over a few degrees. It corrects the idea that plastics melt at one sharp temperature, like metals.',
};

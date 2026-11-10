export default {
  id: 'crystal-structures',
  title: 'Crystal structures and packing',
  label: ['Crystal', 'structures'],
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\text{APF} = \frac{N\,\tfrac43\pi R^3}{V_\text{cell}}, \qquad \rho = \frac{N A}{V_\text{cell} N_A}, \qquad a_\text{FCC} = 2\sqrt2\,R,\ \ a_\text{BCC} = \frac{4R}{\sqrt3}`,
  idea: String.raw`Most metals pack their atoms as spheres in a repeating cell. Where the atoms touch fixes the cell size: along a face diagonal in FCC, along the body diagonal in BCC. Counting the atoms in one cell then gives the packing fraction and the density. FCC and HCP fill 74% of space and BCC only 68%, and the close-packed planes they contain are where slip happens later.`,
  requires: ['atomic-bonding'],
  sources: [
    {
      title: 'OpenStax Chemistry 2e, §10.6 Lattice structures in crystalline solids',
      url: 'https://openstax.org/books/chemistry-2e/pages/10-6-lattice-structures-in-crystalline-solids',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Unit cells, coordination numbers and density from the cell.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 3.091, Recitation 13: Bravais lattices and crystal packing',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec13/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Lattices and packing worked the way the course sets them.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'ema3010', lab: 'crystal', notes: ['s4'], note: 'Hard-sphere atoms in SC, BCC, FCC and HCP cells, grown until they touch: packing fraction and density from the cell, against the measured density. BCC iron leaves 32% of space empty.' },
  ],
};

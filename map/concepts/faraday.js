export default {
  id: 'faraday',
  title: 'Magnetic flux and Faraday’s law',
  label: ['Faraday’s law'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\mathcal E = -\frac{d\Phi_B}{dt}, \qquad \Phi_B = \iint_S \mathbf B\cdot d\mathbf A`,
  idea: String.raw`Magnetic flux through a loop is the same surface integral, applied to \(\mathbf B\). A changing flux drives an emf around the loop. The minus sign says the induced current opposes the change. Through any closed surface, magnetic flux is zero.`,
  requires: ['surface-flux', 'magnetic-force'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §13.1 Faraday’s law',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/13-1-faradays-law',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Covers the three ways to change flux: field, area and angle.',
    },
    {
      title: 'PhET: Faraday’s law',
      url: 'https://phet.colorado.edu/en/simulations/faradays-law',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Move a magnet through a coil and watch the bulb. Good intuition before the math.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'faraday', notes: ['s2', 's1', 's3', 's4', 's8', 's9', 's11'], note: 'Changing flux through a loop and the emf it drives, from a moving magnet to a generator.' },
    { course: 'phy2049', lab: 'flowmeter', notes: ['s12'], note: String.raw`An electromagnetic flow meter: the fluid's ions part across the pipe until \(V = Bdv\).` },
  ],
};

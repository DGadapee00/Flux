export default {
  id: 'current-resistance',
  title: 'Current and resistance',
  label: ['Current and', 'resistance'],
  subject: 'circuits',
  courses: ['phy2049', 'eel3111'],
  eq: String.raw`I = \frac{dq}{dt}, \qquad R = \frac{\rho L}{A}, \qquad V = IR`,
  idea: String.raw`Current is charge per second through a cross-section. Inside a wire the field pushes electrons, collisions slow them, and the result is a small steady drift. Resistance grows with length and shrinks with area, and resistivity rises with temperature for metals. Ohm's law, \(V = IR\), says the current is proportional to the voltage. Many devices do not obey it.`,
  requires: ['electric-potential'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §9.3 Resistivity and resistance',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Geometry and temperature, with tables of resistivities.',
    },
    {
      title: 'PhET: Ohm’s law',
      url: 'https://phet.colorado.edu/en/simulations/ohms-law',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Vary V and R and watch I respond, before any algebra.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'ohm', notes: ['s11', 's12'], note: 'A wire you heat: R rises, I falls, and the drift is drawn.' },
  ],
};

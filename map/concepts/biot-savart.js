export default {
  id: 'biot-savart',
  title: 'Biot–Savart law',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`d\mathbf B = \frac{\mu_0}{4\pi}\,\frac{I\,d\mathbf l\times\hat{\mathbf r}}{r^2}`,
  idea: String.raw`Current makes magnetic field. Each short piece of wire adds a bit of field that circles the wire, falling as \(1/r^2\), and the whole field is the integral over the circuit. It is the same add-up-the-pieces method as a continuous charge, with a cross product in place of a plain direction. Two parallel currents attract because each sits in the other's field.`,
  requires: ['magnetic-force', 'continuous-charge'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §12.1 The Biot–Savart law',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/12-1-the-biot-savart-law',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The law, then a straight segment and a loop worked through.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §12.3 Magnetic force between two parallel currents',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/12-3-magnetic-force-between-two-parallel-currents',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Field from one wire, force on the other, and the old definition of the ampere.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'biot', notes: ['s12', 's15'], note: 'Wires, loops, arcs and solenoids, each with its field at P from the integral.' },
    { course: 'phy2049', lab: 'magforce', notes: ['s13'], note: 'Two parallel wires, each in the field of the other.' },
    { course: 'phy2049', lab: 'railgun', note: 'A railgun: the rails make the field, and the armature carries the current across it.' },
  ],
};

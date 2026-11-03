export default {
  id: 'amperes-law',
  title: 'Ampère’s law',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\oint \mathbf B\cdot d\mathbf l = \mu_0 I_\text{enc}\quad\text{(steady currents)}`,
  idea: String.raw`Go around any closed loop adding up \(\mathbf B\cdot d\mathbf l\), and the total is \(\mu_0\) times the current threading the loop. Current outside adds nothing. Like Gauss's law, it holds for any loop but is only useful with symmetry: pick a loop where \(B\) is constant along it. Then a long wire gives \(B = \mu_0I/2\pi r\), and a long solenoid gives \(B = \mu_0 nI\) inside. This form holds for steady currents. When the electric field changes, Maxwell's displacement term \(\mu_0\varepsilon_0\,d\Phi_E/dt\) joins the current, and that term is what lets an electromagnetic wave travel.`,
  requires: ['biot-savart', 'line-integrals'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §12.5 Ampère’s law',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/12-5-amperes-law',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Inside and outside a thick wire, the case the lab draws.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Ampère’s law',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving05/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'How to choose the Amperian loop, then solved cases.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'ampere', notes: ['s14'], note: String.raw`Loops around one wire, two wires and a thick wire, with \(\mathbf B\cdot d\mathbf l\) per piece.` },
    { course: 'phy2049', lab: 'mri', note: String.raw`An MRI magnet as a long solenoid, \(B = \mu_0 nI\), checked against the sum of its turns.` },
  ],
};

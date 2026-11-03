export default {
  id: 'dislocations',
  title: 'Dislocations and slip',
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\tau_R = \sigma\cos\phi\cos\lambda, \qquad \text{slip when } \tau_R \ge \tau_\text{crss}`,
  idea: String.raw`Sliding a whole plane of atoms at once would need a shear stress near \(G/10\), far above what metals yield at. Instead an extra half-plane, a dislocation, moves through the crystal one row at a time, so only a few bonds break at once. Slip runs on close-packed planes and only the shear stress resolved onto them drives it. That is why yield is a shear event, and why criteria like Tresca and von Mises judge yield by shear.`,
  requires: ['crystal-structures', 'stress-strain', 'stress-on-a-section'],
  sources: [
    {
      title: 'MIT 3.091, Recitation 18: Line defects, mechanics and stress-strain curves, and slip',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec18/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Dislocations tied to the stress-strain curve, in the course’s order.',
    },
    {
      title: 'DoITPoMS, Introduction to dislocations (University of Cambridge)',
      url: 'https://www.doitpoms.ac.uk/tlplib/dislocations/index.php',
      kind: 'Teaching package',
      level: 'Course level',
      why: 'Animations of a dislocation gliding, and why it lowers the yield stress.',
    },
  ],
  labs: [],
  candidate: 'Pull a single crystal and turn its slip plane, reading the resolved shear stress. It corrects the idea that a crystal yields when the tensile stress reaches a limit: the same pull yields it or not depending on angle.',
};

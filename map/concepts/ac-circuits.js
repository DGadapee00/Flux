export default {
  id: 'ac-circuits',
  title: 'AC circuits and resonance',
  label: ['AC circuits and', 'resonance'],
  subject: 'circuits',
  courses: ['phy2049'],
  eq: String.raw`Z = \sqrt{R^2 + \left(\omega L - \frac{1}{\omega C}\right)^2}, \qquad \omega_0 = \frac{1}{\sqrt{LC}}`,
  idea: String.raw`Drive a circuit with a sine wave and each part responds at the same frequency but with its own phase. A resistor's voltage is in step with the current, an inductor's leads it and a capacitor's lags it. Draw them as rotating arrows, phasors, and they add like vectors. At \(\omega_0\) the inductor and capacitor cancel, the impedance drops to \(R\), and the current peaks.`,
  requires: ['rc-circuits', 'inductance'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §15.3 RLC series circuits with AC',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/15-3-rlc-series-circuits-with-ac',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Phasor diagrams built one element at a time.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Driven LRC circuits',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving09/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'Impedance, phase and resonance with checked numbers.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'ac', notes: ['s13', 's14', 's15'], note: 'Series RLC below, at and above resonance, with the phasor diagram beside the circuit.' },
  ],
};

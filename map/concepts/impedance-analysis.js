export default {
  id: 'impedance-analysis',
  title: 'Complex impedance and phasor analysis',
  label: ['Phasors and', 'impedance'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`Z_R = R, \quad Z_L = j\omega L, \quad Z_C = \frac{1}{j\omega C}, \qquad \mathbf V = Z\,\mathbf I, \qquad \sum \mathbf I = 0,\ \ \sum \mathbf V = 0`,
  idea: String.raw`In sinusoidal steady state every voltage and current is a sine at the source frequency, so each is fixed by an amplitude and a phase: one complex number, its phasor. A derivative becomes multiplication by \(j\omega\), so inductors and capacitors act like resistors with complex values. Ohm's law, the series and parallel rules, node analysis and Thévenin then all work unchanged, with complex arithmetic. Kirchhoff's laws hold for the phasors, not for the magnitudes, which is why two voltages of 3 V and 4 V can add to 5 V.`,
  requires: ['ac-circuits', 'nodal-analysis'],
  related: [
    {
      id: 'laplace-transform',
      note: String.raw`Impedance is the transfer function at \(s = j\omega\): \(sL\) and \(1/sC\) become \(j\omega L\) and \(1/j\omega C\).`,
    },
  ],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lectures 18 and 19, sinusoidal steady state, impedance methods',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Where the course turns derivatives into algebra.',
      checked: '2026-11-06',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. II: AC',
      url: 'https://www.allaboutcircuits.com/textbook/alternating-current/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Complex numbers, reactance and impedance, then series-parallel AC networks.',
    },
  ],
  labs: [],
  candidate: 'Rotating phasors for a series RC with the time waveforms they project. It corrects the idea that the voltages around a loop add as magnitudes: 3 V across the resistor and 4 V across the capacitor make 5 V, not 7 V.',
};

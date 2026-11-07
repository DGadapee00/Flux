export default {
  id: 'op-amp',
  title: 'The operational amplifier',
  label: ['Op amp'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`v_+ = v_-, \quad i_\pm = 0; \qquad \frac{v_o}{v_i} = -\frac{R_f}{R_\text{in}}\ \text{(inverting)}, \quad 1 + \frac{R_f}{R_g}\ \text{(non-inverting)}, \qquad \frac{A}{1 + A\beta} \to \frac{1}{\beta}`,
  idea: String.raw`An op amp is a dependent source with an enormous gain \(A\) on the difference between its two inputs. Feed part of the output back to the inverting input and the gain of the whole circuit becomes \(A/(1 + A\beta)\), which is very nearly \(1/\beta\): set by resistors, not by the chip. So the ideal model says the inputs sit at the same voltage and draw no current. Node analysis with those two rules gives inverting, non-inverting, summing and difference amplifiers, integrators and filters. The rules fail when the output reaches a supply rail.`,
  requires: ['dependent-sources'],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lectures 21 to 23, the op-amp abstraction and feedback',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Three lectures from the abstraction to integrators, differentiators and oscillators.',
      checked: '2026-11-06',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. III: Semiconductors',
      url: 'https://www.allaboutcircuits.com/textbook/semiconductors/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Its operational amplifiers chapter covers feedback and the common circuits.',
    },
  ],
  labs: [
    { course: 'eel3111', lab: 'opamp', notes: ['s1', 's2'], note: 'An inverting amplifier with sliders for the resistors, the op amp’s own gain, the supply and the input: a hundredfold drop in A moves the gain about 1%, while doubling R_f doubles it, until the output clips at a rail.' },
  ],
};

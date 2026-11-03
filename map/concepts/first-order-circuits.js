export default {
  id: 'first-order-circuits',
  title: 'First-order circuits and switching',
  label: ['First-order', 'circuits'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`x(t) = x(\infty) + \big[x(0^+) - x(\infty)\big]\,e^{-t/\tau}, \qquad \tau = R_\text{th}C \ \text{ or } \ \frac{L}{R_\text{th}}`,
  idea: String.raw`Any circuit with one capacitor or one inductor, after a switch moves, relaxes exponentially from its start to its final value. Replace the rest of the circuit with its Thévenin equivalent and the time constant is \(R_\text{th}C\) or \(L/R_\text{th}\). A capacitor's voltage and an inductor's current cannot jump, so they carry over the switching instant and fix \(x(0^+)\). In steady DC a capacitor acts as a break and an inductor as a wire, which gives \(x(\infty)\). Opening an inductor's circuit fast forces a large voltage, which is why a relay coil needs a flyback diode.`,
  requires: ['rc-circuits', 'inductance', 'thevenin-norton'],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lectures 13 and 14, first-order circuits',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Capacitors and inductors, step responses and the intuitive method.',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §14.4 RL circuits',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/14-4-rl-circuits',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The RL rise and decay beside the RC case the map already has.',
    },
  ],
  labs: [],
  candidate: 'Switch an RC and an RL circuit that each have several resistors, and mark the time constant. It corrects the idea that \\(\\tau\\) uses the source’s resistor alone: it uses the Thévenin resistance the capacitor or coil sees, which changes when the switch moves.',
};

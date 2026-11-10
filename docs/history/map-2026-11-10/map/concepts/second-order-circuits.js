export default {
  id: 'second-order-circuits',
  title: 'Second-order circuits',
  label: ['Second-order', 'circuits'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`L\ddot q + R\dot q + \frac{q}{C} = 0, \qquad \alpha = \frac{R}{2L}, \quad \omega_0 = \frac{1}{\sqrt{LC}}, \quad \zeta = \frac{\alpha}{\omega_0} = \frac R2\sqrt{\frac CL}\ \text{(series)}`,
  idea: String.raw`A circuit with an inductor and a capacitor stores energy two ways and can pass it back and forth. The loop law gives a second-order equation, and its characteristic roots depend on how the resistance compares with \(\sqrt{L/C}\). Too much resistance and the response creeps back with no overshoot; too little and it rings at nearly \(\omega_0\) inside a decaying envelope. Critical damping, between the two, is where the roots meet. In a parallel RLC the roles flip: a larger resistance means less damping.`,
  requires: ['first-order-circuits'],
  related: [
    {
      id: 'damped-oscillator',
      note: String.raw`A series RLC is a mass on a spring with friction: \(L\) is the mass, \(R\) the damping, \(1/C\) the stiffness.`,
    },
  ],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lectures 16 and 17, second-order systems',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Transients in second-order circuits, with and without damping.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 2, §14.6 RLC series circuits',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/14-6-rlc-series-circuits',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The damped RLC oscillation and its mechanical twin.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eel3111', lab: 'rlc', notes: ['s4'], note: 'Series and parallel RLC circuits stepped with a resistance slider, the regime named: more resistance damps the series circuit but un-damps the parallel one. The closed-form responses are checked by Runge–Kutta.' },
  ],
};

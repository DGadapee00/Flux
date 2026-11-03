export default {
  id: 'pull-resistors',
  title: 'Floating inputs and pull resistors',
  label: ['Pull resistors'],
  subject: 'circuits',
  courses: ['bench'],
  eq: String.raw`V_\text{pin} = V_s - I_\text{leak}\,R_\text{pull}\ \text{(released)}, \qquad I = \frac{V_s}{R_\text{pull}}\ \text{(pressed)}`,
  idea: String.raw`An input pin joined to nothing has no voltage of its own and drifts with stray fields, reading high and low by turns. A pull-up or pull-down resistor gives it a definite level, and a button pulls it the other way. Too large a pull resistor loses to leakage and noise; too small wastes current while the button is held.`,
  requires: ['voltage-divider'],
  sources: [
    {
      title: 'Kuphaldt, Lessons in Electric Circuits',
      url: 'https://www.ibiblio.org/kuphaldt/electricCircuits/',
      kind: 'Free textbook (Design Science License)',
      level: 'Intro',
      why: 'Digital inputs and pull resistors, from the text the course cites.',
    },
    {
      title: 'MIT 6.002, calendar: Digital abstraction',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Why a logic input needs a defined level at all.',
    },
  ],
  labs: [
    { course: 'bench', lab: 'button', notes: ['s5', 's6'], note: 'A button with no pull resistor, a good one, and one too large.' },
  ],
};

export default {
  id: 'superposition',
  title: 'Linearity and superposition',
  label: ['Superposition'],
  subject: 'circuits',
  courses: ['eel3111'],
  eq: String.raw`\mathbf v = G^{-1}\mathbf i_s = \sum_k G^{-1}\mathbf i_{s,k}, \qquad \text{source off: } V \to \text{short}, \ \ I \to \text{open}`,
  idea: String.raw`A circuit of resistors and sources is linear: the node equations are \(G\mathbf v = \mathbf i_s\), and the sources appear only on the right. So the response to several sources is the sum of the responses to each one alone. To leave a source out, set it to zero: a voltage source becomes a wire, a current source a break. Dependent sources stay in. Power is not linear in the sources, so add voltages and currents first, then find the power.`,
  requires: ['nodal-analysis'],
  sources: [
    {
      title: 'MIT 6.002, calendar: Lecture 3, linearity, superposition, Thévenin',
      url: 'https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Superposition and the equivalent circuits share one lecture.',
      checked: '2026-11-06',
    },
    {
      title: 'Kuphaldt, Lessons in Electric Circuits, Vol. I: DC',
      url: 'https://www.allaboutcircuits.com/textbook/direct-current/',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Network theorems, superposition among them, worked step by step.',
    },
  ],
  labs: [
    { course: 'eel3111', lab: 'superpose', notes: ['s1', 's2'], note: 'Two sources feeding one load, switched on one at a time and then together: the currents add, the powers do not, and a reversed source can cancel the load to nothing.' },
  ],
};

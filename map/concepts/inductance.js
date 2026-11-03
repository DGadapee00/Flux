export default {
  id: 'inductance',
  title: 'Inductance and transformers',
  label: ['Inductance and', 'transformers'],
  subject: 'em',
  courses: ['phy2049', 'eel3111'],
  eq: String.raw`\mathcal E = -L\frac{dI}{dt}, \qquad \frac{V_s}{V_p} = \frac{N_s}{N_p}, \qquad U = \tfrac12 LI^2`,
  idea: String.raw`A changing current changes its own flux, so a coil fights changes in its current. That is self-inductance, and the energy it stores lives in the magnetic field. Two coils on one core share their flux, so each turn of either coil sees the same emf. The voltages then go as the turns, which is how a transformer steps voltage up for the grid and down for the home.`,
  requires: ['faraday'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §14.2 Self-inductance and inductors',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/14-2-self-inductance-and-inductors',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Inductance of a solenoid and a toroid, derived from flux.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Mutual inductance and transformers; inductors',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving07/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'Mutual and self inductance in one method, with transformers as the payoff.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'transformer', notes: ['s5', 's6', 's7', 's10'], note: 'Two coils on one core: voltage goes with turns, current the other way.' },
  ],
  candidate: String.raw`An RL circuit beside the RC lab: current rising toward \(\mathcal E/R\) with time constant \(L/R\), and an LC loop trading energy between the capacitor's electric field and the coil's magnetic field.`,
};

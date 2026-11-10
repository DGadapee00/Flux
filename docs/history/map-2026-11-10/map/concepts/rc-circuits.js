export default {
  id: 'rc-circuits',
  title: 'RC circuits',
  subject: 'circuits',
  courses: ['phy2049', 'eel3111'],
  eq: String.raw`V_C(t) = \mathcal E\left(1 - e^{-t/RC}\right), \qquad \tau = RC`,
  idea: String.raw`A capacitor charging through a resistor fills fast at first and slowly at the end, because the current falls as the capacitor's voltage rises. The loop rule gives a first-order differential equation, and its solution is an exponential with time constant \(RC\). After five time constants it is within one percent of full.`,
  requires: ['kirchhoff', 'capacitance'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §10.5 RC circuits',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/10-5-rc-circuits',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Charging and discharging derived from the loop rule.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: RC and RL circuits',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving08/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'Treats RC and RL side by side, which makes the pattern plain.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'rc', notes: ['s7', 's6'], note: String.raw`Charge and discharge, with \(V_C\) and \(I\) plotted against \(t/\tau\).` },
  ],
};

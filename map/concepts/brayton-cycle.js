export default {
  id: 'brayton-cycle',
  title: 'The Brayton cycle',
  subject: 'thermo',
  courses: ['eml3100', 'eml3101'],
  eq: String.raw`\eta_\text{Brayton} = 1 - r_p^{-(k-1)/k}`,
  idea: String.raw`A gas turbine compresses air, burns fuel at constant pressure, expands the hot gas through a turbine and exhausts it. With cold-air assumptions its efficiency depends only on the pressure ratio. It rises as the ratio rises, but stays below the Carnot limit between the coldest and hottest temperatures in the cycle.`,
  requires: ['carnot-limit', 'energy-cv'],
  sources: [
    {
      title: 'Cleynen, Engineering Thermodynamics',
      url: 'https://thermodynamicsbook.com/',
      kind: 'Open textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Gas-turbine cycles with worked examples, past where Yan stops.',
    },
    {
      title: 'MIT 16.050 Thermal Energy, calendar: Gas power and propulsion cycles',
      url: 'https://ocw.mit.edu/courses/16-050-thermal-energy-fall-2002/pages/calendar/',
      kind: 'Lecture notes',
      level: 'Deeper',
      why: 'Brayton and its jet-engine variants, from an aerospace course.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'carnot', notes: ['s5'], note: 'Brayton efficiency against pressure ratio, under the Carnot curve.' },
  ],
};

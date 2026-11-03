export default {
  id: 'isentropic-efficiency',
  title: 'Isentropic efficiency',
  label: ['Isentropic', 'efficiency'],
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`\eta_T = \frac{h_1 - h_2}{h_1 - h_{2s}}, \qquad \eta_C = \frac{h_{2s} - h_1}{h_2 - h_1}`,
  idea: String.raw`Compare a real turbine, compressor or nozzle with an ideal one that runs between the same pressures with no entropy change. The ratio of their enthalpy changes is the isentropic efficiency. A less efficient turbine leaves its steam hotter and makes less work; a less efficient compressor needs more.`,
  requires: ['entropy', 'energy-cv'],
  sources: [
    {
      title: 'Cleynen, Engineering Thermodynamics',
      url: 'https://thermodynamicsbook.com/',
      kind: 'Open textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Isentropic efficiencies of real devices, with worked steam examples.',
    },
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, Ch. 6 Entropy and the second law',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book: the ideal comparison process.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'efficiency', notes: ['s4', 's5'], note: 'A steam turbine, an air compressor and a nozzle, each beside its isentropic twin.' },
  ],
};

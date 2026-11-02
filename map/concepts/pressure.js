export default {
  id: 'pressure',
  title: 'Pressure and manometers',
  label: ['Pressure and', 'manometers'],
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`p_\text{abs} = p_\text{gauge} + p_\text{atm}, \qquad \Delta p = \rho g\,\Delta z`,
  idea: String.raw`Pressure is force per unit area, and in a fluid at rest it grows with depth by \(\rho g\) per metre. Only the vertical drop counts, not the tube's width or slope. A gauge reads pressure above the atmosphere; the thermodynamics always uses absolute pressure, so add the atmosphere back.`,
  requires: [],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §14.2 Measuring pressure',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/14-2-measuring-pressure',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Gauge and absolute pressure, and how a manometer reads a difference.',
    },
    {
      title: 'Yan, Introduction to Engineering Thermodynamics, §1.3 Extensive and intensive properties',
      url: 'https://pressbooks.bccampus.ca/thermo1/',
      kind: 'Open textbook (CC BY-NC-SA)',
      level: 'Course level',
      why: 'The course’s own book; pressure as a property of state.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'manometer', notes: ['s0'], note: String.raw`A manometer reads depth and density: the gauge pressure is the sum of \(\rho g z\).` },
  ],
};

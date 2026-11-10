export default {
  id: 'mass-cv',
  title: 'Mass balance on a control volume',
  label: ['Mass balance', '(control volume)'],
  subject: 'thermo',
  courses: ['eml3100', 'eml3015'],
  eq: String.raw`\frac{dm_\text{cv}}{dt} = \sum \dot m_\text{in} - \sum \dot m_\text{out}, \qquad \dot m = \rho V A`,
  idea: String.raw`Draw a boundary around a device and count what crosses it. The mass flow through an opening is the flux of \(\rho\mathbf v\) through it. That is \(\rho V A\) when the velocity is uniform and normal to the opening. In steady flow, what enters leaves.`,
  requires: ['surface-flux'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §14.5 Fluid dynamics',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/14-5-fluid-dynamics',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The continuity equation ρAV = constant, from first principles.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers, Ch. 2: Analysis of existing flows (1D)',
      url: 'https://fluidmech.ninja/chapter2.pdf',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The mass balance for one inlet and one outlet, with solved problems.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'nozzle', notes: ['s1', 's4'], note: String.raw`Conservation of mass, \(\dot m = AV/v\), sets the area a stream needs.` },
  ],
};

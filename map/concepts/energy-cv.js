export default {
  id: 'energy-cv',
  title: 'Steady-flow energy equation',
  label: ['Steady-flow', 'energy'],
  subject: 'thermo',
  courses: ['eml3100'],
  eq: String.raw`\dot Q - \dot W = \dot m\left[(h_2 - h_1) + \tfrac12\left(V_2^2 - V_1^2\right) + g\,(z_2 - z_1)\right]`,
  idea: 'Energy gets the same boundary bookkeeping as mass. Each kilogram that crosses carries enthalpy, kinetic energy and potential energy. The heat and work crossing the boundary account for the change. Turbines, nozzles and water heaters are all this one equation.',
  requires: ['mass-cv'],
  sources: [
    {
      title: 'Cleynen, Engineering Thermodynamics',
      url: 'https://thermodynamicsbook.com/',
      kind: 'Open textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Open systems with many worked examples and problems with solutions.',
    },
    {
      title: 'MIT 16.050 Thermal Energy, calendar',
      url: 'https://ocw.mit.edu/courses/16-050-thermal-energy-fall-2002/pages/calendar/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The prelude reviews control-volume energy before the second law.',
    },
  ],
  labs: [
    { course: 'eml3100', lab: 'heater', notes: 's2', note: String.raw`A tankless water heater as one control volume: \(\dot Q = \dot m\,(h_\text{out} - h_\text{in})\).` },
  ],
};

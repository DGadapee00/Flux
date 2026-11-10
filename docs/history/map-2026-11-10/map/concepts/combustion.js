export default {
  id: 'combustion',
  title: 'Combustion and flame temperature',
  label: ['Combustion'],
  subject: 'thermo',
  courses: ['eml3101'],
  eq: String.raw`\mathrm{CH_4} + 2\,(\mathrm{O_2} + 3.76\,\mathrm{N_2}) \to \mathrm{CO_2} + 2\,\mathrm{H_2O} + 7.52\,\mathrm{N_2}, \qquad \sum_\text{P} N_i\left(\bar h_f^\circ + \Delta\bar h\right)_i = \sum_\text{R} N_i\left(\bar h_f^\circ + \Delta\bar h\right)_i`,
  idea: String.raw`Burning a fuel rearranges atoms, so the balance starts by counting them: the stoichiometric air is just enough oxygen to burn everything, and the nitrogen comes along. Each compound carries an enthalpy of formation, the energy stored in its bonds, measured from the elements. The first law for a burner says heat out equals the enthalpy of the reactants minus that of the products. With no heat loss, the products heat up until their enthalpy matches the reactants': the adiabatic flame temperature. Excess air dilutes the products, so the flame runs cooler.`,
  requires: ['gas-mixtures', 'energy-cv'],
  sources: [
    {
      title: 'MIT 16.050, calendar: Introduction to thermochemistry',
      url: 'https://ocw.mit.edu/courses/16-050-thermal-energy-fall-2002/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Three lectures on the energy of reactions, from fuel to flame.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Engineering Thermodynamics',
      url: 'https://thermodynamicsbook.com/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Steady-flow energy balances, which the reacting balance extends.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Adiabatic flame temperature',
      url: 'https://en.wikipedia.org/wiki/Adiabatic_flame_temperature',
      kind: 'Reference',
      level: 'Intro',
      why: 'Typical flame temperatures and why they peak near stoichiometric.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3101', lab: 'flame', notes: ['s5'], note: 'Methane burning in air with a slider for the percent of theoretical air: the flame peaks near stoichiometric, and extra air only soaks up heat. Newton on the NASA enthalpies is checked by integrating c_p with Simpson’s rule.' },
  ],
};

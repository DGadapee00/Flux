export default {
  id: 'psychrometrics',
  title: 'Psychrometrics and air conditioning',
  label: ['Psychrometrics'],
  subject: 'thermo',
  courses: ['eml3101'],
  eq: String.raw`\omega = 0.622\,\frac{p_v}{p - p_v}, \qquad \phi = \frac{p_v}{p_g(T)}, \qquad h = c_{p,a}T + \omega\,h_g`,
  idea: String.raw`Moist air is a mixture of dry air and water vapour, and the vapour's partial pressure cannot pass the saturation pressure at the air's temperature. The humidity ratio counts water per kilogram of dry air; the relative humidity compares the vapour pressure with saturation. Cool air without changing its water content and \(\phi\) rises, until it reaches 100% at the dew point; further cooling condenses water out. An air conditioner cools air below its dew point to dry it, then lets it warm. The psychrometric chart draws all of these states on one sheet.`,
  requires: ['gas-mixtures', 'phases'],
  related: [
    {
      id: 'mass-convection',
      note: String.raw`The wet-bulb temperature is the evaporative-cooling balance that the heat and mass analogy predicts.`,
    },
  ],
  sources: [
    {
      title: 'Wikipedia, Psychrometrics',
      url: 'https://en.wikipedia.org/wiki/Psychrometrics',
      kind: 'Reference',
      level: 'Intro',
      why: 'Humidity ratio, relative humidity, dew point and the chart, defined in one place.',
      checked: '2026-11-06',
    },
    {
      title: 'Cleynen, Engineering Thermodynamics',
      url: 'https://thermodynamicsbook.com/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Saturation pressure and phase change, from which the chart is built.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml3101', lab: 'coil', notes: ['s6'], note: 'Moist air through a cooling coil on a psychrometric chart generated from its equations: below the dew point water condenses, so an air conditioner dries as well as cools. The enthalpy balance is checked by summing heat along the air’s path.' },
  ],
};

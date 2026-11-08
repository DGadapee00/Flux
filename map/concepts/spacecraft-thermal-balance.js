export default {
  id: 'spacecraft-thermal-balance',
  title: 'Spacecraft radiation balance',
  label: ['Spacecraft', 'radiation balance'],
  subject: 'heat',
  courses: ['satellite'],
  eq: String.raw`\alpha\, S\, A_p + Q_\text{int} = \varepsilon\,\sigma A\, T^{4}`,
  idea: 'In space a satellite gains heat only from sunlight, Earth and its own electronics, and loses it only by radiating. At steady state the two balance, and the temperature follows from the absorptivity for sunlight and the emissivity in the infrared. A surface that absorbs little sunlight but emits well runs cold. Designers check a hot case in full sun and a cold case in eclipse, and use insulation and radiators to stay within limits.',
  requires: ['thermal-radiation', 'view-factors', 'first-law-closed'],
  sources: [
    {
      title: 'MIT 16.851, Lecture 23: Spacecraft thermal control systems',
      url: 'https://ocw.mit.edu/courses/16-851-satellite-engineering-fall-2003/resources/l23thermalcontro/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Absorptivity, emissivity, albedo, multilayer insulation and radiators for a satellite.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Spacecraft thermal control',
      url: 'https://en.wikipedia.org/wiki/Spacecraft_thermal_control',
      kind: 'Reference',
      level: 'Intro',
      why: 'The thermal environment in orbit and the passive and active ways a satellite stays in range.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'satellite', lab: 'balance', notes: ['s1'], note: 'A satellite’s temperature through an orbit for black, white and polished-metal finishes: α/ε sets it, so polished aluminium runs hottest and white coldest.' },
    { course: 'satellite', lab: 'nodes', notes: ['s3'], note: 'A sunlit face and a radiator joined by a conductive link, with a heater: one temperature hides a hot face and frozen electronics, and the link and heater bring them into range. Newton on the balances is checked by marching both faces in time.' },
  ],
};

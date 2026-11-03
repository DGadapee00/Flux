export default {
  id: 'mass-convection',
  title: 'Convective mass transfer',
  label: ['Convective', 'mass transfer'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`\dot m'' = h_m\,(\rho_{A,s} - \rho_{A,\infty}), \qquad \text{Sh} = \frac{h_m L}{D_{AB}}, \qquad \frac{h}{h_m} = \rho c_p\,\text{Le}^{2/3}`,
  idea: String.raw`A species carried away from a surface by a flow, such as water vapour off a wet wall, obeys the same equations as heat: Fick's law in place of Fourier's, concentration in place of temperature. So the mass-transfer coefficient follows the heat-transfer correlations, with the Sherwood number for Nu and the Schmidt number for Pr. Evaporation takes latent heat with it, so a wet surface in dry air cools below the air temperature until the heat coming in balances the heat the vapour carries off. That balance is how a wet-bulb thermometer and a cooling tower work.`,
  requires: ['diffusion', 'boundary-layer'],
  related: [
    {
      id: 'convection',
      note: String.raw`Chilton–Colburn: mass transfer uses the heat-transfer correlations, with Sh for Nu and Sc for Pr.`,
    },
  ],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Deeper',
      why: 'Chapter 11 sets out mass transfer and the analogy with heat transfer.',
    },
    {
      title: 'MIT 2.51, calendar: Species conservation, analogy to heat transfer, evaporative cooling (sessions 21 and 22)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'The course closes convection with the heat and mass analogy.',
    },
    {
      title: 'Wikipedia, Chilton and Colburn J-factor analogy',
      url: 'https://en.wikipedia.org/wiki/Chilton_and_Colburn_J-factor_analogy',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The analogy among momentum, heat and mass in one line, with its range.',
    },
  ],
  labs: [],
  candidate: 'A wet-bulb thermometer in air with sliders for temperature and humidity. It corrects the idea that a wet surface settles at the air temperature: evaporation holds it below, by an amount the heat and mass analogy predicts.',
};

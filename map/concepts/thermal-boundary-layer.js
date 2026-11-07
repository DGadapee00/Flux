export default {
  id: 'thermal-boundary-layer',
  title: 'Thermal boundary layer',
  label: ['Thermal', 'boundary layer'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`\frac{DT}{Dt} = \alpha\,\nabla^2 T, \qquad \frac{\delta_t}{\delta} \approx \text{Pr}^{-1/3}, \qquad \text{Pr} = \frac{\nu}{\alpha}`,
  idea: String.raw`In a moving fluid, heat is carried along with the flow as well as conducted, so the heat equation gains a material derivative. Near a heated wall the fluid that has been in contact long enough to warm up forms a thin layer. Heat diffuses outward through it while the stream sweeps it along, so it thickens as \(\sqrt x\). The Prandtl number compares how fast momentum diffuses with how fast heat does. In oils, with large Pr, the thermal layer sits deep inside the velocity layer; in liquid metals it is far thicker.`,
  requires: ['heat-equation', 'material-derivative'],
  related: [
    {
      id: 'boundary-layer',
      note: String.raw`The same layer for heat as for momentum: both grow as \(\sqrt x\), and Pr sets their ratio.`,
    },
  ],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 6 builds the thermal layer next to the velocity layer and compares them through Pr.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.51, calendar: Convection, conservation equations, laminar boundary layers (lectures 10 and 11)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'The course opens convection with the energy equation in a moving fluid.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml4140', lab: 'thermal', notes: ['s1', 's2'], note: 'The velocity and thermal layers on a heated plate with a Prandtl slider: five times thicker in mercury, matched at Pr = 1, a thin skin in an oil.' },
  ],
};

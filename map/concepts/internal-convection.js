export default {
  id: 'internal-convection',
  title: 'Convection in pipes',
  label: ['Convection', 'in pipes'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`\frac{T_s - T_m(x)}{T_s - T_{m,i}} = \exp\!\left(-\frac{hPx}{\dot m c_p}\right), \qquad \text{Nu}_D = 3.66\ \text{(laminar)}, \quad 0.023\,\text{Re}_D^{0.8}\text{Pr}^{0.4}\ \text{(turbulent)}`,
  idea: String.raw`Inside a pipe the layers from the wall meet in the middle, and the flow becomes fully developed. In laminar flow \(h\) then stops changing and the Nusselt number is a constant. An energy balance on a slice of the pipe says the bulk temperature approaches a constant wall temperature exponentially along the length. So the average driving difference over the pipe is a logarithmic mean, not an arithmetic one. Turbulent flow mixes the core and raises Nu sharply, and the correlations use the same Reynolds number as the friction factor.`,
  requires: ['convection', 'pipe-flow', 'energy-cv'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 7 covers laminar and turbulent pipe flow, entry lengths and noncircular ducts.',
    },
    {
      title: 'MIT 2.51, calendar: Internal flows, turbulence (sessions 14 to 16)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'The three sessions on internal flow and turbulent transfer.',
    },
  ],
  labs: [],
  candidate: 'March the bulk temperature down a heated tube with a slider for the flow rate. It corrects the idea that the fluid warms at a steady rate along the pipe: it closes on the wall temperature exponentially, so the last metres do little.',
};

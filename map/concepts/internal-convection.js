export default {
  id: 'internal-convection',
  title: 'Convection in pipes',
  label: ['Convection', 'in pipes'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`\frac{T_s - T_m(x)}{T_s - T_{m,i}} = \exp\!\left(-\frac{hPx}{\dot m c_p}\right), \qquad \text{Nu}_D = 3.66\ \text{(laminar, uniform wall temperature)}, \quad 0.023\,\text{Re}_D^{0.8}\text{Pr}^{0.4}\ \text{(turbulent)}`,
  idea: String.raw`Inside a pipe the layers from the wall meet in the middle, and the flow becomes fully developed. In laminar flow \(h\) then stops changing and the Nusselt number is a constant: 3.66 for a wall at one temperature, 4.36 for a wall with uniform heat flux. An energy balance on a slice of the pipe says the bulk temperature approaches a constant wall temperature exponentially along the length. So the average driving difference over the pipe is a logarithmic mean, not an arithmetic one. Turbulent flow mixes the core and raises Nu sharply, and the correlations use the same Reynolds number as the friction factor.`,
  requires: ['convection', 'pipe-flow', 'energy-cv'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 7 covers laminar and turbulent pipe flow, entry lengths and noncircular ducts.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.51, calendar: Internal flows, turbulence (lectures 13 to 15)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'The three lectures on internal flow and turbulent transfer.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml4140', lab: 'tube', notes: ['s5'], note: 'Water heated in a tube with a slider for the flow rate, the bulk temperature drawn along it: it closes on the wall exponentially, and h jumps when the flow turns turbulent. Checked by a Runge–Kutta march and the log-mean difference.' },
  ],
};

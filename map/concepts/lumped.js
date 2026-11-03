export default {
  id: 'lumped',
  title: 'Lumped cooling',
  label: ['Lumped cooling'],
  subject: 'heat',
  courses: ['eml4140', 'map2302'],
  eq: String.raw`\frac{dT}{dt} = -\frac{hA}{\rho c V}\,\left(T - T_\infty\right)`,
  idea: String.raw`When conduction inside a body is fast compared with convection at its surface, the temperature is nearly uniform. The test is a Biot number \(hL/k\) well below 0.1. The heat equation then collapses to one ODE: Newton's law of cooling, an exponential approach to the surroundings.`,
  requires: ['heat-equation'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 1 covers lumped capacity and when it is valid.',
    },
    {
      title: 'MIT 2.51, calendar: Lumped capacity (session 5)',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'Where it sits, between fins and transient conduction.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'coffee', notes: ['s9'], note: 'Newton cooling, solved exactly and checked by numerical integration.' },
  ],
};

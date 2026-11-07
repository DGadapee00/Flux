export default {
  id: 'heat-equation',
  title: 'Heat equation',
  label: ['Heat equation'],
  subject: 'heat',
  courses: ['eml4140'],
  eq: String.raw`\rho c\,\frac{\partial T}{\partial t} = \nabla\cdot\left(k\,\nabla T\right)`,
  idea: String.raw`Balance energy on a tiny volume. The energy stored per second equals the net heat flux in, and the divergence theorem turns that into this equation. With constant \(k\) it is \(\partial T/\partial t = \alpha\,\nabla^2 T\). Steady conduction is \(\nabla^2 T = 0\).`,
  requires: ['fourier', 'divergence-theorem', 'energy-cv'],
  sources: [
    {
      title: 'Lienhard, A Heat Transfer Textbook',
      url: 'https://ahtt.mit.edu',
      kind: 'Free textbook',
      level: 'Course level',
      why: 'Chapter 2 derives this equation and solves the standard cases.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.51, calendar: Conduction, resistances, energy equation',
      url: 'https://ocw.mit.edu/courses/2-51-intermediate-heat-and-mass-transfer-fall-2008/pages/calendar/',
      kind: 'Course outline',
      level: 'Deeper',
      why: 'Shows where the equation sits in a heat transfer course.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'eml4140', lab: 'rod', notes: ['s1', 's2', 's3'], note: 'A rod with its ends held fixed: a starting profile by Fourier series and by finite differences, side by side. Ripples fade first, and time scales as L²/α.' },
  ],
};

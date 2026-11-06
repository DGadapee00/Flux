export default {
  id: 'rocket-equation',
  title: 'The rocket equation',
  label: ['Rocket equation'],
  subject: 'mechanics',
  courses: ['phy2048', 'egn3321', 'satellite'],
  eq: String.raw`\Delta v = v_e \ln\frac{m_0}{m_f}`,
  idea: String.raw`A rocket throws mass out of the back, and the momentum it throws away is the momentum it gains. Each kilogram of propellant must also push the propellant still on board, so the speed gained grows with the logarithm of the mass ratio, not with the mass burned. That is why a rocket is mostly propellant. A mission is planned as a budget of \(\Delta v\), and this equation prices it in propellant.`,
  requires: ['impulse-momentum'],
  sources: [
    {
      title: 'MIT 16.07, Lecture 14: Variable mass systems, the rocket equation',
      url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/resources/mit16_07f09_lec14/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The momentum balance on a body that loses mass, worked through to the rocket equation.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §9.7 Rocket propulsion',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/9-7-rocket-propulsion',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Derives the logarithm from the exhaust speed, with gravity during the burn.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'rocket', notes: ['s7'], note: 'Δv from the logarithm of the mass ratio, less g times the burn, checked by integrating the burn.' },
    { course: 'egn3321', lab: 'rocket', notes: ['s6'], note: String.raw`A rocket’s speed from \(v_e\ln(m_0/m)\), with and without gravity.` },
  ],
};

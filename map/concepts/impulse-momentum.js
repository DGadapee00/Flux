export default {
  id: 'impulse-momentum',
  title: 'Impulse and momentum',
  subject: 'mechanics',
  courses: ['egn3321', 'phy2048'],
  eq: String.raw`m\mathbf v_1 + \int_{t_1}^{t_2}\sum\mathbf F\,dt = m\mathbf v_2`,
  idea: String.raw`Integrate Newton's law over time and the force's impulse equals the change in momentum. It suits short, hard pushes where the force is unknown but its effect is not. When no outside force acts on a system, its total momentum stays put. A rocket is that rule applied to a body that keeps throwing mass away.`,
  requires: ['newtons-second-law'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §9.2 Impulse and collisions',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/9-2-impulse-and-collisions',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Impulse as the area under a force-time curve, with helmets and airbags.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §9.7 Rocket propulsion',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/9-7-rocket-propulsion',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The rocket equation derived from momentum, step by step.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'impulse', notes: ['s1', 's2'], note: 'A force pulse and the momentum it changes.' },
    { course: 'egn3321', lab: 'rocket', notes: ['s6'], note: String.raw`A rocket's speed from \(v_e\ln(m_0/m)\), with and without gravity.` },
    { course: 'egn3321', lab: 'helmet', notes: ['s7'], note: 'A bicycle helmet stretches the stop to keep the peak force down.' },
    { course: 'phy2048', lab: 'impulse', notes: ['s2', 's1'], note: 'Force pulses with the same area give the same change in momentum.' },
    { course: 'phy2048', lab: 'rocket', notes: ['s7'], note: 'A rocket’s Δv from the log of its mass ratio, less g times the burn.' },
    { course: 'phy2048', lab: 'crumple-zone', note: 'A seatbelt against a steering wheel: the same Δp over a longer time.' },
  ],
};

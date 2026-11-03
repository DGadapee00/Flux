export default {
  id: 'stress-strain',
  title: 'Stress, strain and Hooke’s law',
  label: ['Stress and', 'strain'],
  subject: 'materials',
  courses: ['phy2048', 'egn3331'],
  eq: String.raw`\sigma = \frac FA, \qquad \varepsilon = \frac{\Delta L}{L}, \qquad \sigma = E\,\varepsilon`,
  idea: String.raw`Stress is force per area and strain is stretch per length, so they compare bars of any size. Below the yield point a material is elastic: stress is proportional to strain, and the bar springs back. Past yield it flows, and unloading leaves a permanent set.`,
  requires: ['static-equilibrium'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §12.3 Stress, strain, and elastic modulus',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/12-3-stress-strain-and-elastic-modulus',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Tensile, bulk and shear moduli with a table of materials.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §12.4 Elasticity and plasticity',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/12-4-elasticity-and-plasticity',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The stress-strain curve past the elastic limit.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'stress-strain', notes: ['s4', 's5'], note: String.raw`A bar stretched by \(FL/AE\), then past yield, with the permanent set on unloading.` },
    { course: 'egn3331', lab: 'tension-test', notes: ['s1', 's4', 'u2/s5'], note: 'A tension curve: E as the first slope, unloading along E, and the 0.2% offset yield.' },
    { course: 'egn3331', lab: 'brace', notes: ['s2'], note: 'A building brace rod stretched past yield does not spring all the way back.' },
  ],
};

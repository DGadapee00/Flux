export default {
  id: 'refraction',
  title: 'Refraction',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`n_1\sin\theta_1 = n_2\sin\theta_2, \qquad \sin\theta_c = \frac{n_2}{n_1}`,
  idea: String.raw`Light slows down in matter, by a factor \(n\). Crossing into a slower medium at an angle, a ray bends toward the normal, and Snell's law gives by how much. Going the other way it bends away, and past the critical angle it cannot leave at all. That total internal reflection is what keeps light inside an optical fibre.`,
  requires: ['em-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §1.3 Refraction',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/1-3-refraction',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Snell’s law with a table of indices to work from.',
      checked: '2026-11-06',
    },
    {
      title: 'PhET: Bending light',
      url: 'https://phet.colorado.edu/en/simulations/bending-light',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Find the critical angle yourself by turning the laser.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'refraction', note: 'Rays into and out of water, glass and diamond, through to total internal reflection.' },
    { course: 'phy2049', lab: 'fiber', note: 'Total internal reflection guiding light down an optical fiber, with its acceptance cone.' },
  ],
};

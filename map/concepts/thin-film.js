export default {
  id: 'thin-film',
  title: 'Thin-film interference',
  label: ['Thin-film', 'interference'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`2t = m\,\frac{\lambda}{n_\text{film}}\ \text{or}\ \left(m + \tfrac12\right)\frac{\lambda}{n_\text{film}}`,
  idea: String.raw`Light reflects from both faces of a thin film, and the two reflections interfere. The second one travels an extra \(2t\) inside the film, where the wavelength is \(\lambda/n\). A reflection off a higher index also flips the wave by half a wavelength. Count the flips first, then the path. A quarter-wave coating cancels reflection, which is how lenses are coated.`,
  requires: ['interference', 'refraction'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §3.4 Interference in thin films',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/3-4-interference-in-thin-films',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The phase-flip rule stated once and used on every example.',
    },
    {
      title: 'PhET: Wave interference',
      url: 'https://phet.colorado.edu/en/simulations/wave-interference',
      kind: 'Simulation',
      level: 'Intro',
      why: 'See path difference make bright and dark before adding films.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'thinfilm', note: 'A film drawn to scale with the wave: soap, oil and an antireflection coating.' },
  ],
};

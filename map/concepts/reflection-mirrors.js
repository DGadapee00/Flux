export default {
  id: 'reflection-mirrors',
  title: 'Reflection and mirrors',
  label: ['Reflection and', 'mirrors'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\theta_r = \theta_i, \qquad \frac{1}{d_o} + \frac{1}{d_i} = \frac1f, \qquad f = \frac R2`,
  idea: String.raw`When the wavelength is small next to everything it meets, light travels in straight rays. At a surface a ray leaves at the angle it arrived. A curved mirror bends every ray from one object point toward one image point, and the mirror equation finds where. An image is real if the rays really cross there, and virtual if they only seem to come from it.`,
  requires: ['em-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §2.2 Spherical mirrors',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/2-2-spherical-mirrors',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Ray diagrams and the sign rules, for concave and convex mirrors.',
    },
    {
      title: 'PhET: Geometric optics',
      url: 'https://phet.colorado.edu/en/simulations/geometric-optics',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Move the object and watch the principal rays find the image.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'mirrors', notes: ['e6/s20', 'e6/s18', 'e6/s19', 'e6/s21', 'e6/s22'], note: 'Concave and convex mirrors with principal rays, real and virtual images.' },
  ],
};

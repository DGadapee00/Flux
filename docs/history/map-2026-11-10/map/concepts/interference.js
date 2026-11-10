export default {
  id: 'interference',
  title: 'Two-slit interference',
  label: ['Two-slit', 'interference'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`d\sin\theta = m\lambda\ \text{(bright)}, \qquad \Delta y = \frac{\lambda L}{d}`,
  idea: String.raw`Waves from two slits arrive at the screen having travelled different distances. Where the difference is a whole number of wavelengths they add; where it is a half number they cancel. The result is a row of equally spaced bright fringes, and measuring their spacing measures the wavelength.`,
  requires: ['em-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §3.1 Young’s double-slit interference',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/3-1-youngs-double-slit-interference',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Path difference to fringe position, with the small-angle step shown.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Interference',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving11/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'Intensity, not just positions, worked for two and more slits.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'interference', note: String.raw`A double slit: every fringe painted from \(I(\theta)\) for the panel's \(\lambda\), \(d\) and \(L\).` },
  ],
};

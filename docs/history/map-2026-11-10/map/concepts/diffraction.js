export default {
  id: 'diffraction',
  title: 'Diffraction',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`a\sin\theta = m\lambda\ \text{(dark)}, \qquad d\sin\theta = m\lambda\ \text{(grating)}, \qquad \theta_\text{min} = 1.22\,\frac{\lambda}{D}`,
  idea: String.raw`A single slit is many sources side by side. At angles where the slit's halves cancel, the screen goes dark, so a narrower slit spreads light wider. A grating has thousands of slits, which sharpens the bright orders into thin lines that split colours. A round aperture blurs a point into a disk, and that sets the finest detail any lens can resolve.`,
  requires: ['interference'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §4.1 Single-slit diffraction',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/4-1-single-slit-diffraction',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The half-slit pairing argument for the dark fringes.',
      checked: '2026-11-06',
    },
    {
      title: 'Feynman Lectures Vol. I, Ch. 30: Diffraction',
      url: 'https://www.feynmanlectures.caltech.edu/I_30.html',
      kind: 'Free lectures',
      level: 'Deeper',
      why: 'Gratings and resolving power from adding many phasors.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'diffraction', note: 'One slit, a grating and the resolution limit, each pattern painted from the real intensity.' },
  ],
};

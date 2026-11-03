export default {
  id: 'thin-lenses',
  title: 'Thin lenses',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\frac{1}{d_o} + \frac{1}{d_i} = \frac1f, \qquad m = -\frac{d_i}{d_o}`,
  idea: String.raw`A lens refracts at both faces, and a thin one obeys the same equation as a mirror. A converging lens makes a real image of a distant object and a magnified virtual one of a close object. Two lenses in a row make a microscope or a telescope: the first lens's image is the second lens's object.`,
  requires: ['refraction'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §2.4 Thin lenses',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The lensmaker’s equation, ray tracing and sign rules.',
    },
    {
      title: 'OpenStax University Physics Vol. 3, §2.8 Microscopes and telescopes',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/2-8-microscopes-and-telescopes',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Two-lens instruments, the lab’s last two scenarios.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'lenses', note: 'Converging and diverging lenses, then a telescope and a microscope.' },
  ],
};

export default {
  id: 'em-waves',
  title: 'Electromagnetic waves',
  label: ['EM waves'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`c = \frac{1}{\sqrt{\mu_0\varepsilon_0}} = f\lambda, \qquad E = cB`,
  idea: String.raw`A changing magnetic field makes an electric field, and a changing electric field makes a magnetic one. Maxwell's equations allow the pair to sustain each other and travel, with no charge nearby, at \(1/\sqrt{\mu_0\varepsilon_0}\). That number is the speed of light. \(\mathbf E\) and \(\mathbf B\) are perpendicular to each other and to the motion. Radio, light and X-rays differ only in wavelength.`,
  requires: ['maxwell-div', 'amperes-law'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §16.2 Plane electromagnetic waves',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/16-2-plane-electromagnetic-waves',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Shows how the wave equation and c fall out of Maxwell’s equations.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: EM radiation',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving10/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'Reading direction, polarization and amplitude off a wave’s formula.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'emwave', notes: ['s1', 's2', 's3', 's4', 's7', 's8', 's9', 's10'], note: 'E and B travelling together, from FM radio to X-rays.' },
  ],
};

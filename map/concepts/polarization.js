export default {
  id: 'polarization',
  title: 'Polarization',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`I = I_0\cos^2\theta \ \ \text{(Malus)}, \qquad I = \tfrac12 I_0\ \text{(unpolarized in)}`,
  idea: String.raw`The direction of a wave's electric field is its polarization. A polarizer passes the component along its axis, so polarized light loses \(\cos^2\theta\) of its intensity, and unpolarized light loses half. Two crossed polarizers pass nothing, yet a third one between them at 45 degrees lets light through again.`,
  requires: ['em-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §1.7 Polarization',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/1-7-polarization',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Malus’s law, then polarization by reflection and scattering.',
    },
    {
      title: 'Feynman Lectures Vol. I, Ch. 33: Polarization',
      url: 'https://www.feynmanlectures.caltech.edu/I_33.html',
      kind: 'Free lectures',
      level: 'Deeper',
      why: 'Why the sky and reflections come out polarized.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'polar', notes: ['s15', 's16', 's17'], note: 'Chains of polarizers, including the third filter that brings the light back.' },
  ],
};

export default {
  id: 'radiation-pressure',
  title: 'Momentum of light',
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`p = \frac{I}{c}\ \text{(absorbed)}, \qquad p = \frac{2I}{c}\ \text{(reflected)}`,
  idea: String.raw`Light carries momentum as well as energy, \(U/c\) for energy \(U\). A surface that absorbs it feels a pressure \(I/c\); a mirror that sends it back feels twice that. The force is tiny, but in space nothing opposes it, so a large thin sail keeps speeding up.`,
  requires: ['light-intensity'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §16.4 Momentum and radiation pressure',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/16-4-momentum-and-radiation-pressure',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Absorbed and reflected cases, with the solar sail as an example.',
      checked: '2026-11-06',
    },
    {
      title: 'Feynman Lectures Vol. I, Ch. 34: Relativistic effects in radiation',
      url: 'https://www.feynmanlectures.caltech.edu/I_34.html',
      kind: 'Free lectures',
      level: 'Deeper',
      why: 'Light pressure and the Doppler shift from one point of view.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'solarsail', notes: ['s6'], note: String.raw`A solar sail: \(F = 2IA/c\) and the speed it adds in a year.` },
  ],
};

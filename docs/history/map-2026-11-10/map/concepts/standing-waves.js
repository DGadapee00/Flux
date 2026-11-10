export default {
  id: 'standing-waves',
  title: 'Standing waves and resonance',
  label: ['Standing', 'waves'],
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`f_n = \frac{nv}{2L}\ \text{(string, open pipe)}, \qquad f_n = \frac{nv}{4L},\ n\ \text{odd (stopped pipe)}`,
  idea: String.raw`Waves reflecting back and forth between two ends add to a pattern that stays in place, with nodes that never move. Only wavelengths that fit the ends survive, so a string or pipe has a set of resonant frequencies. A pipe closed at one end fits only odd quarter waves, so it has only odd harmonics. Two close frequencies beat at their difference.`,
  requires: ['mechanical-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §16.6 Standing waves and resonance',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/16-6-standing-waves-and-resonance',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Nodes, antinodes and the allowed frequencies of a string.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §17.4 Normal modes of a standing sound wave',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/17-4-normal-modes-of-a-standing-sound-wave',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Open and stopped pipes compared.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'standing-wave', notes: ['s5'], note: 'A string fixed at both ends: modes, nodes and antinodes.' },
    { course: 'phy2048', lab: 'pipe-modes', notes: ['s3', 's1', 's4'], note: 'Stopped and open organ pipes, and two tuning forks beating.' },
  ],
};

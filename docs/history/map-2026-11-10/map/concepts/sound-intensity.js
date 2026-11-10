export default {
  id: 'sound-intensity',
  title: 'Sound intensity and decibels',
  label: ['Sound', 'intensity'],
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`I = \frac{P}{4\pi r^2}, \qquad \beta = 10\log_{10}\frac{I}{I_0}\ \text{dB}`,
  idea: String.raw`Sound spreading from a small source shares its power over a growing sphere, so intensity falls as \(1/r^2\). The ear works on ratios, so loudness is measured in decibels: double the distance and the level drops about 6 dB. Two sources that are not in step add their intensities, not their levels.`,
  requires: ['mechanical-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §17.3 Sound intensity',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/17-3-sound-intensity',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Intensity, the decibel scale and hearing thresholds.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §17.2 Speed of sound',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/17-2-speed-of-sound',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'What sets sound’s speed in air and other media.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'intensity', notes: ['s2'], note: 'A loudspeaker in the open: intensity against distance, and two sources added.' },
  ],
};

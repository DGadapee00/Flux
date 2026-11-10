export default {
  id: 'doppler-light',
  title: 'Doppler shift for light',
  label: ['Doppler shift', 'for light'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`f_\text{obs} \approx f\left(1 \pm \frac{v}{c}\right)\ \ (v \ll c), \qquad \Delta f_\text{echo} = \frac{2fv}{c}`,
  idea: String.raw`A source and observer closing in see a higher frequency, and moving apart a lower one. For light only their relative speed matters. A radar echo is shifted twice: once as the car receives the wave, once as it sends it back. The gun counts the beat between the outgoing and returning waves and reads the speed from it.`,
  requires: ['em-waves', 'doppler-sound'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 3, §5.7 Doppler effect for light',
      url: 'https://openstax.org/books/university-physics-volume-3/pages/5-7-doppler-effect-for-light',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The relativistic formula and its slow-speed limit.',
      checked: '2026-11-06',
    },
    {
      title: 'Feynman Lectures Vol. I, Ch. 34: Relativistic effects in radiation',
      url: 'https://www.feynmanlectures.caltech.edu/I_34.html',
      kind: 'Free lectures',
      level: 'Deeper',
      why: 'Derives the shift from how a moving source’s waves bunch up.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'radargun', notes: ['s5'], note: String.raw`A police radar: the echo returns shifted by \(2fv/c\).` },
  ],
};

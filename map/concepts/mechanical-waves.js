export default {
  id: 'mechanical-waves',
  title: 'Waves on a string',
  label: ['Mechanical', 'waves'],
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`y(x,t) = A\sin(kx - \omega t), \qquad v = \frac\omega k = \sqrt{\frac F\mu}`,
  idea: String.raw`A wave carries a disturbance along while each bit of the medium only moves back and forth. Its speed is set by the medium, tension against mass per length for a string, not by the frequency or amplitude. Frequency is set by the source, and wavelength follows as \(v/f\). The power it carries grows with the square of the amplitude.`,
  requires: ['simple-harmonic-motion'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §16.2 Mathematics of waves',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/16-2-mathematics-of-waves',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Reading speed, wavelength and period off the wave function.',
    },
    {
      title: 'PhET: Wave on a string',
      url: 'https://phet.colorado.edu/en/simulations/wave-on-a-string',
      kind: 'Simulation',
      level: 'Intro',
      why: 'Change tension and damping and watch the speed, not the frequency, change.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'traveling-wave', notes: ['s1', 's2', 's4'], note: String.raw`A wave on a rope moving at \(\sqrt{F/\mu}\) while each point only moves up and down.` },
    { course: 'phy2048', lab: 'guitar-string', notes: ['s3'], note: 'High and low E strings: different mass per length, different tension, the pitch they give.' },
  ],
};

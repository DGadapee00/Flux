export default {
  id: 'simple-harmonic-motion',
  title: 'Simple harmonic motion',
  label: ['Simple harmonic', 'motion'],
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`m\ddot x = -kx \;\Rightarrow\; x = A\cos(\omega t + \phi),\quad \omega = \sqrt{\frac km}`,
  idea: String.raw`A restoring force proportional to displacement gives sinusoidal motion whose period does not depend on the amplitude. Energy swaps between the spring and the motion. A pendulum is harmonic only for small swings, with \(T = 2\pi\sqrt{L/g}\); a swinging rod is a physical pendulum with its own effective length. A tuned mass damper uses a second oscillator to fight the first.`,
  requires: ['newtons-second-law'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §15.1 Simple harmonic motion',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/15-1-simple-harmonic-motion',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The spring-mass system solved and its energy tracked.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §15.4 Pendulums',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Simple, physical and torsional pendulums side by side.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'spring-mass', notes: ['s1', 's2'], note: 'A mass on a spring: the period set by m and k, not by the amplitude.' },
    { course: 'phy2048', lab: 'pendulum', notes: ['s3'], note: 'Simple and physical pendulums, and where the small-angle period breaks down.' },
    { course: 'phy2048', lab: 'skyscraper-damper', notes: ['s5'], note: 'A pendulum damper tuned to a tower’s sway.' },
  ],
};

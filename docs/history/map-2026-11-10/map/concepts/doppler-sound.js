export default {
  id: 'doppler-sound',
  title: 'Doppler effect for sound',
  label: ['Doppler effect', '(sound)'],
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`f' = f\,\frac{v + v_o}{v - v_s}`,
  idea: String.raw`A source moving toward you packs its wavefronts closer, so you hear a higher pitch; moving away, lower. A listener moving through still air meets the fronts more or less often. The two cases are not symmetric, because sound moves through the air. Past the speed of sound the fronts pile into a cone, the shock wave.`,
  requires: ['mechanical-waves'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §17.7 The Doppler effect',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/17-7-the-doppler-effect',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Moving source and moving observer derived separately.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §17.8 Shock waves',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/17-8-shock-waves',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The Mach cone and sonic booms.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'doppler', note: 'A horn and a listener, each moving, then a jet past Mach 1.' },
    { course: 'phy2048', lab: 'train-horn', notes: ['s5'], note: 'A train horn at a crossing: higher coming in, lower going out, by different amounts.' },
  ],
};

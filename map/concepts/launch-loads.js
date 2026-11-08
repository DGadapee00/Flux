export default {
  id: 'launch-loads',
  title: 'Launch loads and structural vibration',
  label: ['Launch loads'],
  subject: 'materials',
  courses: ['satellite'],
  eq: String.raw`f_n = \frac{1}{2\pi}\sqrt{\frac{k}{m}}`,
  idea: 'On the way up, a satellite is shaken by thrust, sound and staging. A structure with a natural frequency near those of the launcher amplifies the shaking, so a design must keep its first natural frequency clear of them. Steady acceleration is checked as a static load; random shaking is described by a power spectral density and proven in a vibration test. Stiffness, not only strength, decides whether a design passes.',
  requires: ['forced-resonance', 'normal-modes', 'stress-on-a-section'],
  sources: [
    {
      title: 'MIT 16.07, Lecture 19: Vibration, normal modes, natural frequencies, instability',
      url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/resources/mit16_07f09_lec19/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Natural frequencies and normal modes of coupled systems, the tools behind a frequency requirement.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Random vibration',
      url: 'https://en.wikipedia.org/wiki/Random_vibration',
      kind: 'Reference',
      level: 'Intro',
      why: 'What random vibration is, how a power spectral density describes it, and how products are tested.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'satellite', lab: 'shake', notes: ['s1'], note: 'A component on a bracket shaken at its base across frequency: ten times the input at resonance, about the input when stiff, less when soft.' },
    { course: 'satellite', lab: 'random', notes: ['s3'], note: 'A bracket under the launcher’s broadband shaking with sliders for f_n, Q and the input: Miles’ equation for the response and a fatigue life from the Rayleigh peaks. Both are checked by integrating the response spectrum and the damage.' },
  ],
};

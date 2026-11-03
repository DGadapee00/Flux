/** Unit 11 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u11',
  title: 'Oscillations',
  chapters: '15',
  file: 'u11-oscillations.html',
  load: () => import('../content/u11-oscillations.html?raw').then((m) => m.default),
  sections: [
    {
      id: 's1', n: 1, title: 'Simple harmonic motion', lab: 'spring-mass', ch: ['15'],
      topics: ['shm'],
      problems: [
        'ch15.ultrasound', 'ch15.block', 'ch15.motion', 'ch15.vertical',
        'ch15.concept-period', 'ch15.concept-phase',
      ],
      home: true,
    },
    {
      id: 's2', n: 2, title: 'Energy in the oscillation', lab: 'spring-mass', ch: ['15'],
      topics: ['shm-energy'],
      problems: ['ch15.energy'],
      home: true,
    },
    {
      id: 's3', n: 3, title: 'Pendulums', lab: 'pendulum', ch: ['15'],
      topics: ['pendulum'],
      problems: ['ch15.pendulum-g', 'ch15.concept-pendulum'],
      home: true,
    },
    {
      id: 's4', n: 4, title: 'Damped and driven motion', lab: 'resonance', ch: ['15'],
      topics: ['damping', 'resonance'],
      problems: ['ch15.damped', 'ch15.driven', 'ch15.concept-resonance'],
      home: true,
    },
    {
      id: 's5', n: 5, title: 'A damper on a tower', lab: 'skyscraper-damper', ch: ['15'],
      topics: ['damper', 'torsion'],
      problems: ['ch15.skyscraper', 'ch15.torsion'],
      home: true,
    },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

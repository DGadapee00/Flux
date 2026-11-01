/** Unit 12 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u12',
  title: 'Waves',
  chapters: '16',
  file: 'u12-waves.html',
  load: () => import('../content/u12-waves.html?raw').then((m) => m.default),
  sections: [
    {
      id: 's1', n: 1, title: 'Traveling waves', lab: 'traveling-wave', ch: ['16'],
      topics: ['wave'],
      problems: ['ch16.rope', 'ch16.snapshot', 'ch16.concept-particle', 'ch16.concept-speed'],
      home: true,
    },
    {
      id: 's2', n: 2, title: 'The wave function', lab: 'traveling-wave', ch: ['16'],
      topics: ['wave-math', 'interference'],
      problems: ['ch16.function', 'ch16.particle', 'ch16.superpose'],
      home: true,
    },
    {
      id: 's3', n: 3, title: 'Speed on a string', lab: 'guitar-string', ch: ['16'],
      topics: ['wave-speed'],
      problems: ['ch16.guitar', 'ch16.pitch'],
      home: true,
    },
    {
      id: 's4', n: 4, title: 'Power of a wave', lab: 'traveling-wave', ch: ['16'],
      topics: ['wave-power'],
      problems: ['ch16.power', 'ch16.concept-power'],
      home: true,
    },
    {
      id: 's5', n: 5, title: 'Standing waves', lab: 'standing-wave', ch: ['16'],
      topics: ['standing'],
      problems: ['ch16.modes', 'ch16.concept-end'],
      home: true,
    },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

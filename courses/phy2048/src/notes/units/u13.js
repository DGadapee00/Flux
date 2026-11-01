/** Unit 13 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u13',
  title: 'Sound',
  chapters: '17',
  file: 'u13-sound.html',
  load: () => import('../content/u13-sound.html?raw').then((m) => m.default),
  sections: [
    {
      id: 's1', n: 1, title: 'Sound and its speed', lab: 'pipe-modes', ch: ['17'],
      topics: ['sound', 'sound-speed'],
      problems: ['ch17.air', 'ch17.concept-medium'],
      home: true,
    },
    {
      id: 's2', n: 2, title: 'Intensity and the decibel', lab: 'intensity', ch: ['17'],
      topics: ['sound-level'],
      problems: ['ch17.level', 'ch17.ratio', 'ch17.distance', 'ch17.pair', 'ch17.concept-add'],
      home: true,
    },
    {
      id: 's3', n: 3, title: 'Pipes', lab: 'pipe-modes', ch: ['17'],
      topics: ['pipe', 'musical'],
      problems: ['ch17.stopped', 'ch17.open', 'ch17.path', 'ch17.concept-pipe'],
      home: true,
    },
    {
      id: 's4', n: 4, title: 'Beats', lab: 'pipe-modes', ch: ['17'],
      topics: ['beats'],
      problems: ['ch17.beats'],
      home: true,
    },
    {
      id: 's5', n: 5, title: 'Doppler and shock waves', lab: 'train-horn', ch: ['17'],
      topics: ['doppler', 'shock'],
      problems: ['ch17.horn', 'ch17.mach', 'ch17.concept-doppler', 'ch17.concept-boom'],
      home: true,
    },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

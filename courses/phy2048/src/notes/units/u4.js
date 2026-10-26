/** Unit 4 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u4',
  title: 'Work, Energy and Power',
  chapters: '7–8',
  file: 'u4-work-energy-power.html',
  load: () => import('../content/u4-work-energy-power.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Work by a constant force', lab: 'work-energy', ch: ['7'], topics: ['work'], problems: ['ch7.work', 'ch7.dot', 'ch7.concept-work'], home: true },
    { id: 's2', n: 2, title: 'Work along a path', lab: 'work-path', ch: ['7'], topics: ['work', 'spring'], problems: ['ch7.graph', 'ch7.path', 'ch7.spring'], home: true },
    { id: 's3', n: 3, title: 'Kinetic energy', lab: null, ch: ['7'], topics: ['kinetic'], problems: ['ch7.frames'] },
    { id: 's4', n: 4, title: 'The work–energy theorem', lab: 'work-energy', ch: ['7'], topics: ['kinetic', 'work'], problems: ['ch7.push', 'ch7.bullet', 'ch7.concept-ke'] },
    { id: 's5', n: 5, title: 'Power', lab: 'automotive-power', ch: ['7'], topics: ['power'], problems: ['ch7.pullup', 'ch7.climb', 'ch7.concept-power'], home: true },
    { id: 's6', n: 6, title: 'Potential energy', lab: null, ch: ['8'], topics: ['potential'], problems: ['ch8.hiker', 'ch8.hanging', 'ch8.fromforce', 'ch8.concept-zero'] },
    { id: 's7', n: 7, title: 'Conservative and non-conservative forces', lab: 'work-path', ch: ['8'], topics: ['conservative'], problems: ['ch8.concept-conservative'] },
    { id: 's8', n: 8, title: 'Conservation of energy', lab: 'track', ch: ['8'], topics: ['conservation', 'energy'], problems: ['ch8.spring', 'ch8.pendulum', 'ch8.panel', 'ch8.loop', 'ch8.springboard', 'ch8.rough', 'ch8.concept-friction'], home: true },
    { id: 's9', n: 9, title: 'Potential-energy diagrams', lab: 'energy-diagram', ch: ['8'], topics: ['energy-diagram'], problems: ['ch8.turning', 'ch8.concept-diagram'], home: true },
    { id: 's10', n: 10, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

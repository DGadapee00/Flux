/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Work and energy',
  chapters: '14',
  file: 'u3-work-energy.html',
  load: () => import('../content/u3-work-energy.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Principle of work and energy', lab: 'collar', ch: ['14'], topics: ['energy'], home: true },
    { id: 's2', n: 2, title: 'Work of a spring', lab: 'collar', ch: ['14'], topics: ['spring'] },
    { id: 's3', n: 3, title: 'Friction on a slide', lab: 'collar', ch: ['14'], topics: ['friction'] },
    { id: 's4', n: 4, title: 'Power and efficiency', lab: null, ch: ['14'], topics: ['power'] },
    { id: 's5', n: 5, title: 'Path independence', lab: 'paths', ch: ['14'], topics: ['path'], home: true },
    { id: 's6', n: 6, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Circuit theorems',
  chapters: '3',
  file: 'u3-theorems.html',
  load: () => import('../content/u3-theorems.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Superposition', lab: 'superpose', ch: ['3'], topics: ['superpose'], home: true },
    { id: 's2', n: 2, title: 'Power does not superpose', lab: 'superpose', ch: ['3'], topics: ['power'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

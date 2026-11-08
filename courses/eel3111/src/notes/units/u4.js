/** Unit 4 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u4',
  title: 'First-order circuits',
  chapters: '4',
  file: 'u4-first-order.html',
  load: () => import('../content/u4-first-order.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The time constant', lab: 'switch', ch: ['4'], topics: ['tau'], home: true },
    { id: 's2', n: 2, title: 'What carries over a switch', lab: 'switch', ch: ['4'], topics: ['continuity'] },
    { id: 's4', n: 3, title: 'Second-order circuits', lab: 'rlc', ch: ['4'], topics: ['rlc'], home: true },
    { id: 's3', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

/** Unit 5 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u5',
  title: 'Operational amplifiers',
  chapters: '5',
  file: 'u5-opamps.html',
  load: () => import('../content/u5-opamps.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The inverting amplifier', lab: 'opamp', ch: ['5'], topics: ['feedback'], home: true },
    { id: 's2', n: 2, title: 'The rails', lab: 'opamp', ch: ['5'], topics: ['rails'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

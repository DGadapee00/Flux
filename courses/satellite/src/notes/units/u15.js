/** Unit 15 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u15',
  title: 'Cost',
  chapters: '15',
  file: 'u15-cost.html',
  load: () => import('../content/u15-cost.html?raw').then((m) => m.default),
  sections: [
    { id: 'estimate', n: 1, title: 'How cost is estimated', lab: null, ch: ['15'], topics: ['estimate'] },
    { id: 'learning', n: 2, title: 'The learning curve', lab: 'learning', ch: ['15'], topics: ['learning'], home: true },
    { id: 'confidence', n: 3, title: 'Confidence and reserves', lab: 'reserve', ch: ['15'], topics: ['confidence'], home: true },
    { id: 'life', n: 4, title: 'Life-cycle cost and the value of money', lab: null, ch: ['15'], topics: ['lifecycle'] },
    { id: 'sheet', n: 5, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 6, title: 'Build it', lab: null, ch: [] },
  ],
};

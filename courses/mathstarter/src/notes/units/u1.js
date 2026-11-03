/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Example unit',
  chapters: '1, 2',
  file: 'u1-example.html',
  load: () => import('../content/u1-example.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The net rate', lab: 'tank', ch: ['1'], topics: ['net-rate'], home: true },
    { id: 's2', n: 2, title: 'Accumulation', lab: 'tank', ch: ['2'], topics: ['accumulation'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

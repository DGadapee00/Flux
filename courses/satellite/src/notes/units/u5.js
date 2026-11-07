/** Unit 5 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u5',
  title: 'Power',
  chapters: '5',
  file: 'u5-power.html',
  load: () => import('../content/u5-power.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Daylight and eclipse', lab: 'power', ch: ['5'], topics: ['power'], home: true },
    { id: 's2', n: 2, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

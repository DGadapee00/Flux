/** Unit 17 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u17',
  title: 'Identification and tracking',
  chapters: '17',
  file: 'u17-tracking.html',
  load: () => import('../content/u17-tracking.html?raw').then((m) => m.default),
  sections: [
    { id: 'catalog', n: 1, title: 'Who tracks what', lab: null, ch: ['17'], topics: ['catalog'] },
    { id: 'confusion', n: 2, title: 'Telling craft apart', lab: 'separation', ch: ['17'], topics: ['confusion'], home: true },
    { id: 'aids', n: 3, title: 'Tracking aids', lab: null, ch: ['17'], topics: ['aids'] },
    { id: 'sheet', n: 4, title: 'Formula sheet', lab: null, ch: [] },
    { id: 'build-it', n: 5, title: 'Build it', lab: null, ch: [] },
  ],
};

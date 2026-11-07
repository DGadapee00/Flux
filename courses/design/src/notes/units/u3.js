/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Choosing a design',
  chapters: '3',
  file: 'u3-choosing.html',
  load: () => import('../content/u3-choosing.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Requirements, then weights', lab: 'decision', ch: ['3'], topics: ['decision'], home: true },
    { id: 's2', n: 2, title: 'How firm is the choice?', lab: 'decision', ch: ['3'], topics: ['decision'] },
    { id: 's3', n: 3, title: 'Dimension the reason', lab: 'intent', ch: ['3'], topics: ['intent'], home: true },
    { id: 's4', n: 4, title: 'A margin rests on its assumptions', lab: 'verify', ch: ['3'], topics: ['verify'], home: true },
    { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

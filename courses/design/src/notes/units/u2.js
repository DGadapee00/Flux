/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Position and process',
  chapters: '2',
  file: 'u2-process.html',
  load: () => import('../content/u2-process.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'A circle, not a box', lab: 'position', ch: ['2'], topics: ['position'], home: true },
    { id: 's2', n: 2, title: 'Cp and Cpk', lab: 'capability', ch: ['2'], topics: ['capability'], home: true },
    { id: 's3', n: 3, title: 'Watching a process drift', lab: 'capability', ch: ['2'], topics: ['capability'] },
    { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

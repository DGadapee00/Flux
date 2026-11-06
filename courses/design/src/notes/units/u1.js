/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Fits and stack-ups',
  chapters: '1',
  file: 'u1-fits.html',
  load: () => import('../content/u1-fits.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Limits decide the fit', lab: 'fits', ch: ['1'], topics: ['fits'], home: true },
    { id: 's2', n: 2, title: 'How often a pair interferes', lab: 'fits', ch: ['1'], topics: ['fits'] },
    { id: 's3', n: 3, title: 'Worst case and RSS', lab: 'stackup', ch: ['1'], topics: ['stackup'], home: true },
    { id: 's4', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

/** Unit 2 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u2',
  title: 'Compressible flow',
  chapters: '2',
  file: 'u2-compressible.html',
  load: () => import('../content/u2-compressible.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Choked flow', lab: 'nozzle', ch: ['2'], topics: ['choke'], home: true },
    { id: 's2', n: 2, title: 'Normal shocks', lab: 'nozzle', ch: ['2'], topics: ['shock'] },
    { id: 's3', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

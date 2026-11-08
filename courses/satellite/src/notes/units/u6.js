/** Unit 6 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u6',
  title: 'Thermal control',
  chapters: '6',
  file: 'u6-thermal.html',
  load: () => import('../content/u6-thermal.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The radiation balance', lab: 'balance', ch: ['6'], topics: ['radiation-balance'], home: true },
    { id: 's3', n: 2, title: 'Two faces and a link', lab: 'nodes', ch: ['6'], topics: ['nodes'], home: true },
    { id: 's2', n: 3, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

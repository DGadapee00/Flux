/** Unit 3 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u3',
  title: 'Phase diagrams',
  chapters: '3',
  file: 'u3-phase-diagrams.html',
  load: () => import('../content/u3-phase-diagrams.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'Reading a binary diagram', lab: 'lever', ch: ['3'], topics: ['tie-line'], home: true },
    { id: 's2', n: 2, title: 'The lever rule', lab: 'lever', ch: ['3'], topics: ['lever'] },
    { id: 's4', n: 3, title: 'Steel: the iron–carbon diagram in practice', lab: 'jominy', ch: ['3'], topics: ['hardenability'], home: true },
    { id: 's3', n: 4, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

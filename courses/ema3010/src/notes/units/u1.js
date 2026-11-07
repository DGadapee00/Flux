/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Bonding and structure',
  chapters: '1',
  file: 'u1-bonding.html',
  load: () => import('../content/u1-bonding.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'The bond-energy curve', lab: 'bond', ch: ['1'], topics: ['bond-energy'], home: true },
    { id: 's2', n: 2, title: 'Force is the slope', lab: 'bond', ch: ['1'], topics: ['bond-force'] },
    { id: 's3', n: 3, title: 'Stiffness is the curvature', lab: 'bond', ch: ['1'], topics: ['bond-stiffness'] },
    { id: 's4', n: 4, title: 'Packing atoms into a cell', lab: 'crystal', ch: ['1'], topics: ['crystal'], home: true },
    { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

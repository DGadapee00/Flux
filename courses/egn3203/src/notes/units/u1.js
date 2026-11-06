/** Unit 1 notes: the file, and its sections with their labs and topics. See ../index.js. */
export default {
  exam: 'u1',
  title: 'Matrices and elimination',
  chapters: '1',
  file: 'u1-matrices.html',
  load: () => import('../content/u1-matrices.html?raw').then((m) => m.default),
  sections: [
    { id: 's1', n: 1, title: 'A matrix is its columns', lab: 'matrix', ch: ['1'], topics: ['matrix'], home: true },
    { id: 's2', n: 2, title: 'Order matters', lab: 'matrix', ch: ['1'], topics: ['matrix'] },
    { id: 's3', n: 3, title: 'Elimination', lab: 'elimination', ch: ['1'], topics: ['elimination'], home: true },
    { id: 's4', n: 4, title: 'Pivoting', lab: 'elimination', ch: ['1'], topics: ['elimination'] },
    { id: 's5', n: 5, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

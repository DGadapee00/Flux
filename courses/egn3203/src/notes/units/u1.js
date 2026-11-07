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
    { id: 's5', n: 5, title: 'Determinant, inverse and conditioning', lab: 'inverse', ch: ['1'], topics: ['inverse'], home: true },
    { id: 's6', n: 6, title: 'Rank and solvability', lab: 'rank', ch: ['1'], topics: ['rank'], home: true },
    { id: 's7', n: 7, title: 'Eigenvalues and eigenvectors', lab: 'eigen', ch: ['1'], topics: ['eigen'], home: true },
    { id: 's8', n: 8, title: 'Formula sheet', lab: null, ch: [] },
  ],
};

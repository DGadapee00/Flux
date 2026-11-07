export default {
  id: 'matrix-maps',
  title: 'Matrices as linear maps',
  label: ['Matrices as', 'linear maps'],
  subject: 'linalg',
  courses: ['egn3203'],
  eq: String.raw`A\mathbf x = x_1\mathbf a_1 + x_2\mathbf a_2 + \cdots + x_n\mathbf a_n, \qquad (AB)\mathbf x = A(B\mathbf x), \qquad (AB)_{ij} = \sum_k a_{ik}b_{kj}`,
  idea: String.raw`A matrix is a machine that takes a vector to a vector and keeps straight lines straight. Its columns say where the unit vectors land, and \(A\mathbf x\) is the same mix of those columns as \(\mathbf x\) is of the unit vectors. Multiplying two matrices chains the maps: \(AB\) does \(B\) first, then \(A\). The row-times-column rule is that chaining written out. Order matters, because turning then stretching is not stretching then turning.`,
  requires: ['vectors'],
  sources: [
    {
      title: 'Margalit and Rabinoff, Interactive Linear Algebra',
      url: 'https://textbooks.math.gatech.edu/ila/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Draws each matrix as a map of the plane before it computes with it.',
    },
    {
      title: 'Hefferon, Linear Algebra',
      url: 'https://hefferon.net/linearalgebra/',
      kind: 'Open textbook',
      level: 'Deeper',
      why: 'Maps between spaces come first, and matrices are how to write them down.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.06SC Linear Algebra, Fall 2011',
      url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/',
      kind: 'Course',
      level: 'Course level',
      why: 'Strang’s full course with lectures, problem sets and solutions.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'matrix', notes: ['s1', 's2'], note: 'A 2×2 matrix moving the unit square and a letter F, with a quarter turn before or after. Two dimensions only.' },
  ],
};

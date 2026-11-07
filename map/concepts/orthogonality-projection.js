export default {
  id: 'orthogonality-projection',
  title: 'Orthogonality and projection',
  label: ['Orthogonality', 'and projection'],
  subject: 'linalg',
  courses: ['egn3203'],
  eq: String.raw`A^{\mathsf T}A\,\hat{\mathbf x} = A^{\mathsf T}\mathbf b, \qquad \mathbf p = A\hat{\mathbf x}, \qquad A^{\mathsf T}(\mathbf b - \mathbf p) = \mathbf 0`,
  idea: String.raw`When \(\mathbf b\) is not in the column space, \(A\mathbf x = \mathbf b\) has no solution, so ask for the closest one. The closest point \(\mathbf p\) in the column space is the one whose error \(\mathbf b - \mathbf p\) is perpendicular to every column. Writing that with dot products gives the normal equations \(A^{\mathsf T}A\hat{\mathbf x} = A^{\mathsf T}\mathbf b\). With orthogonal columns the projection is just a sum of projections onto each one; with slanted columns it is not. This is least squares, the basis of every fitted line and curve.`,
  requires: ['rank-nullspace'],
  related: [
    {
      id: 'fourier-series',
      note: String.raw`Fourier coefficients are projections onto sines and cosines, which are orthogonal functions.`,
    },
  ],
  sources: [
    {
      title: 'Margalit and Rabinoff, Interactive Linear Algebra',
      url: 'https://textbooks.math.gatech.edu/ila/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Its orthogonality chapter goes from projections to least squares.',
    },
    {
      title: 'MIT 18.06SC Linear Algebra, Fall 2011',
      url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/',
      kind: 'Course',
      level: 'Course level',
      why: 'Unit II opens with projections and least squares, then Gram–Schmidt.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'projection', notes: ['s8'], note: 'A point dropped onto the plane of two arrows: the error is square to both, and adding the separate shadows works only when the arrows are perpendicular.' },
  ],
};

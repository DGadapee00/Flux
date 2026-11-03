export default {
  id: 'determinant-inverse',
  title: 'Determinant and inverse',
  label: ['Determinant', 'and inverse'],
  subject: 'linalg',
  courses: ['egn3203'],
  eq: String.raw`\det(AB) = \det A\,\det B, \qquad \begin{bmatrix} a & b\\ c & d\end{bmatrix}^{-1} = \frac{1}{ad - bc}\begin{bmatrix} d & -b\\ -c & a\end{bmatrix}`,
  idea: String.raw`The determinant is the factor by which a matrix scales area in 2D or volume in 3D, with a sign that flips when the map turns space over. If it is zero the map squashes space flat, and no map can undo it. Otherwise the inverse exists and undoes \(A\): \(A^{-1}A = I\). Elimination is how both are found in practice; the cofactor formula is for small cases and proofs. Chaining maps multiplies their scale factors, so \(\det(AB) = \det A\det B\).`,
  requires: ['gaussian-elimination'],
  sources: [
    {
      title: 'Margalit and Rabinoff, Interactive Linear Algebra',
      url: 'https://textbooks.math.gatech.edu/ila/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Defines the determinant as signed volume and builds its rules from that.',
    },
    {
      title: 'Hefferon, Linear Algebra',
      url: 'https://hefferon.net/linearalgebra/',
      kind: 'Open textbook',
      level: 'Deeper',
      why: 'Its determinants chapter, with the geometric meaning and the proofs.',
    },
  ],
  labs: [],
  candidate: 'Edit a 2×2 matrix and watch the image of the unit square, its area and the inverse. It corrects the idea that a small determinant means a matrix is nearly singular: scale every entry by 0.1 and the determinant falls a hundredfold, yet the matrix is no closer to singular.',
};

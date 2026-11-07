export default {
  id: 'symmetric-quadratic',
  title: 'Symmetric matrices and quadratic forms',
  label: ['Symmetric', 'matrices'],
  subject: 'linalg',
  courses: ['egn3203'],
  eq: String.raw`A = A^{\mathsf T} \;\Rightarrow\; A = Q\Lambda Q^{\mathsf T}, \quad Q^{\mathsf T}Q = I, \qquad \mathbf x^{\mathsf T}A\mathbf x > 0\ \ \forall\,\mathbf x \ne \mathbf 0 \iff \text{all } \lambda_i > 0`,
  idea: String.raw`A symmetric matrix has real eigenvalues and perpendicular eigenvectors, so it is a set of stretches along perpendicular axes. The quadratic form \(\mathbf x^{\mathsf T}A\mathbf x\) is then a sum of \(\lambda_i\) times squared coordinates along those axes. If every \(\lambda_i\) is positive the form is a bowl, and the matrix is positive definite. Stiffness matrices, stress tensors and Hessians are symmetric, so strain energy, principal stresses and the second-derivative test all reduce to this one fact.`,
  requires: ['eigenvalues', 'orthogonality-projection'],
  related: [
    {
      id: 'stress-transformation',
      note: String.raw`Principal stresses are the eigenvalues of the symmetric stress matrix; Mohr's circle finds them in 2D.`,
    },
    {
      id: 'normal-modes',
      note: String.raw`Mass and stiffness matrices are symmetric, so the modes have real frequencies and perpendicular shapes.`,
    },
    {
      id: 'extrema',
      note: String.raw`The second-derivative test asks if the Hessian is positive definite; \(D > 0\) with \(f_{xx} > 0\) is that test in 2D.`,
    },
  ],
  sources: [
    {
      title: 'MIT 18.06SC Linear Algebra, Fall 2011',
      url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/',
      kind: 'Course',
      level: 'Course level',
      why: 'Unit III is symmetric and positive definite matrices and where they are used.',
      checked: '2026-11-06',
    },
    {
      title: 'Margalit and Rabinoff, Interactive Linear Algebra',
      url: 'https://textbooks.math.gatech.edu/ila/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Orthogonal bases and diagonalization, which the spectral theorem combines.',
    },
  ],
  labs: [],
  candidate: 'Edit a symmetric 2×2 matrix and draw the level curves of \\(\\mathbf x^{\\mathsf T}A\\mathbf x\\) with its eigenvectors. It corrects the idea that positive entries make a matrix positive definite: \\(\\begin{bmatrix}1&2\\\\2&1\\end{bmatrix}\\) has eigenvalues 3 and \\(-1\\), a saddle.',
};

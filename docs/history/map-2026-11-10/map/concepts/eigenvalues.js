export default {
  id: 'eigenvalues',
  title: 'Eigenvalues and eigenvectors',
  label: ['Eigenvalues'],
  subject: 'linalg',
  courses: ['egn3203'],
  eq: String.raw`A\mathbf v = \lambda\mathbf v, \qquad \det(A - \lambda I) = 0, \qquad \sum_i\lambda_i = \operatorname{tr}A, \quad \prod_i\lambda_i = \det A`,
  idea: String.raw`Most vectors change direction when a matrix acts on them. An eigenvector is one that does not: the matrix only stretches it, by its eigenvalue \(\lambda\). Such a \(\mathbf v\) is in the null space of \(A - \lambda I\), so that matrix must be singular, and its determinant gives a polynomial whose roots are the eigenvalues. In a basis of eigenvectors the matrix acts as separate stretches, so powers and exponentials of it are easy. That is why eigenvalues set the rates in linear differential equations and the frequencies in vibration.`,
  requires: ['determinant-inverse', 'rank-nullspace'],
  related: [
    {
      id: 'damped-oscillator',
      note: String.raw`The roots of \(mr^2 + cr + k = 0\) are the eigenvalues of the oscillator's state matrix.`,
    },
  ],
  sources: [
    {
      title: 'Margalit and Rabinoff, Interactive Linear Algebra',
      url: 'https://textbooks.math.gatech.edu/ila/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Its eigenvalue chapter shows each matrix acting on the plane, with the characteristic polynomial after.',
    },
    {
      title: 'MIT 18.06SC Linear Algebra, Fall 2011',
      url: 'https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/',
      kind: 'Course',
      level: 'Course level',
      why: 'Unit II ends with eigenvalues, diagonalizing and differential equations.',
      checked: '2026-11-06',
    },
    {
      title: 'Lebl, Notes on Diffy Qs, §3.4 Eigenvalue method',
      url: 'https://www.jirka.org/diffyqs/html/eigenmethod_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Uses eigenvalues to solve systems of ODEs, the use this map leads to.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'eigen', notes: ['s7'], note: 'A ring of unit arrows and their images: the directions a matrix only stretches, found from the characteristic polynomial and by scanning the circle. A quarter turn has none.' },
  ],
};

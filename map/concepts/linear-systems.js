export default {
  id: 'linear-systems',
  title: 'Linear systems and phase portraits',
  label: ['Linear systems,', 'portraits'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`\dot{\mathbf x} = A\mathbf x, \qquad \mathbf x(t) = e^{At}\mathbf x_0 = \sum c_i e^{\lambda_i t}\mathbf v_i`,
  idea: String.raw`Any linear equation can be written as a first-order system for a state vector. The eigenvalues of \(A\) set the rates and the eigenvectors the directions, and together they sort the phase portrait: node, saddle, spiral or centre. A repeated eigenvalue may have only one eigenvector, and then the matrix exponential still gives the answer.`,
  requires: ['damped-oscillator'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §3.5 Two-dimensional systems and their vector fields',
      url: 'https://www.jirka.org/diffyqs/html/sec_twodimaut.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Every portrait type, from the eigenvalues.',
    },
    {
      title: 'MIT 18.03SC, Matrix methods: eigenvalues and normal modes',
      url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-iv-first-order-systems/matrix-methods-eigenvalues-and-normal-modes/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Eigenvalue methods with recitations and problems.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'phase-portrait', notes: ['s4', 's1', 's2', 's5'], note: 'Linear phase portraits, including repeated roots with one eigenline or many.' },
  ],
};

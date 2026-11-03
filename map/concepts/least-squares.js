export default {
  id: 'least-squares',
  title: 'Least squares and data fitting',
  label: ['Least squares'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`\min_{\mathbf x}\|A\mathbf x - \mathbf b\|^2, \qquad A^{\mathsf T}A\,\hat{\mathbf x} = A^{\mathsf T}\mathbf b, \qquad A = QR \Rightarrow R\,\hat{\mathbf x} = Q^{\mathsf T}\mathbf b`,
  idea: String.raw`Fitting a model with a few parameters to many measurements gives more equations than unknowns. Least squares picks the parameters that make the sum of squared misses smallest, which is the projection of the data onto the model's column space. Each column is one basis function evaluated at the data, so a polynomial or any linear mix of functions fits the same way. The normal equations are quick, but they lose accuracy when columns are nearly parallel; a QR factorization reaches the same answer without that loss. A model with as many parameters as points fits the data exactly and predicts badly between them.`,
  requires: ['orthogonality-projection', 'floating-point'],
  related: [
    {
      id: 'linear-regression',
      note: String.raw`A regression line is a least-squares solve with two columns: ones and \(x\).`,
    },
  ],
  sources: [
    {
      title: 'MIT 2.086, calendar: Linear algebra 1 and MATLAB backslash (least squares)',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course reaches least squares in its first linear algebra unit.',
    },
    {
      title: 'Yano, Penn, Konidaris and Patera, Math, Numerics, and Programming (for Mechanical Engineers)',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/resources/mit2_086s13_textbook/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Regression and least squares, with QR and the normal equations compared.',
    },
  ],
  labs: [],
  candidate: 'Fit polynomials of rising degree to noisy points from a straight line. It corrects the idea that a better fit to the data is a better model: the misses shrink to zero while the curve swings between the points.',
};

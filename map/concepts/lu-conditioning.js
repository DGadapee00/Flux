export default {
  id: 'lu-conditioning',
  title: 'LU factorization and conditioning',
  label: ['LU and', 'conditioning'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`PA = LU, \qquad \kappa(A) = \|A\|\,\|A^{-1}\|, \qquad \frac{\|\delta\mathbf x\|}{\|\mathbf x\|} \le \kappa(A)\,\frac{\|\delta\mathbf b\|}{\|\mathbf b\|}`,
  idea: String.raw`Elimination, recorded, factors \(A\) into a lower and an upper triangle. Do it once, at a cost of about \(\tfrac23n^3\), and each new right-hand side costs only two triangular solves, about \(2n^2\). Row swaps, partial pivoting, keep the multipliers small so round-off does not grow. Even a perfect algorithm cannot beat the problem's own sensitivity: the condition number \(\kappa\) bounds how much a small change in the data can move the answer. With \(\kappa\) near \(10^{k}\), expect to lose about \(k\) of the 16 digits.`,
  requires: ['determinant-inverse', 'floating-point'],
  sources: [
    {
      title: 'MIT 2.086, calendar: Linear algebra 2, parts 1 to 4',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The four lectures on solving linear systems, sparse ones included.',
    },
    {
      title: 'Wikipedia, Condition number',
      url: 'https://en.wikipedia.org/wiki/Condition_number',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The definition for matrices and the digits-lost rule of thumb.',
    },
  ],
  labs: [],
  candidate: 'Two nearly parallel lines whose crossing you solve for, with a slider that nudges one right-hand side. It corrects the idea that a tiny residual means an accurate answer: the solution can move far while the residual stays near zero.',
};

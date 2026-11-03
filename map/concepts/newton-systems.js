export default {
  id: 'newton-systems',
  title: 'Newton’s method for systems',
  label: ['Newton for', 'systems'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`J(\mathbf x_k)\,\Delta\mathbf x = -\mathbf F(\mathbf x_k), \qquad \mathbf x_{k+1} = \mathbf x_k + \Delta\mathbf x, \qquad J_{ij} = \frac{\partial F_i}{\partial x_j}`,
  idea: String.raw`Several nonlinear equations in several unknowns are solved the way one is: replace them by their linear approximation and solve that. The linear approximation uses the Jacobian, the matrix of partial derivatives, so each step solves a linear system. Near a solution where the Jacobian is not singular the error still squares each step. Each step costs a factorization, so solvers often reuse an old Jacobian for a few steps. The equations cannot be solved one at a time, because each unknown appears in all of them.`,
  requires: ['root-finding', 'lu-conditioning', 'partial-derivatives'],
  sources: [
    {
      title: 'MIT 2.086, calendar: Nonlinear problems and MATLAB fsolve',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Newton in many unknowns, with the recitation on a library solver.',
    },
    {
      title: 'Yano, Penn, Konidaris and Patera, Math, Numerics, and Programming (for Mechanical Engineers)',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/resources/mit2_086s13_textbook/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Newton’s method for systems, with mechanical examples.',
    },
  ],
  labs: [],
  candidate: 'Two curves in the plane whose crossing Newton finds, each step’s tangent planes drawn. It corrects the idea that a system can be solved one equation at a time: fixing one unknown from one equation undoes the other, while Newton moves both together.',
};

export default {
  id: 'ode-stability',
  title: 'Stability and stiffness of ODE solvers',
  label: ['Solver stability', 'and stiffness'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`y' = \lambda y: \quad y_{n+1} = (1 + h\lambda)\,y_n\ \text{(explicit Euler)}, \qquad y_{n+1} = \frac{y_n}{1 - h\lambda}\ \text{(implicit Euler)}, \qquad |1 + h\lambda| \le 1`,
  idea: String.raw`Apply a solver to \(y' = \lambda y\) and each step multiplies the answer by a factor that depends on \(h\lambda\). If that factor's size exceeds one, a decaying solution grows in the numbers. For a system, \(\lambda\) runs over the eigenvalues of the matrix, so the fastest mode sets the step limit. A stiff system has modes decaying at very different rates: the fast one dies out at once but still caps an explicit method's step. Implicit methods solve an equation at each step and stay stable for any step on a decaying mode, so they suit stiff problems.`,
  requires: ['runge-kutta', 'eigenvalues'],
  sources: [
    {
      title: 'MIT 2.086, calendar: Ordinary differential equations and MATLAB eig',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course puts eigenvalues inside its ODE unit, for stability.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Stiff equation',
      url: 'https://en.wikipedia.org/wiki/Stiff_equation',
      kind: 'Reference',
      level: 'Deeper',
      why: 'Stiffness, A-stability and the classic examples.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'stiff', notes: ['s9'], note: 'A two-mode system with rates 1 and 1000 by explicit and implicit Euler: any explicit step over 2 ms blows up, though the fast mode died out long before. The per-mode closed form is checked by marching the coupled system.' },
  ],
};

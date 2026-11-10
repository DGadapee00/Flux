export default {
  id: 'runge-kutta',
  title: 'Runge–Kutta methods',
  label: ['Runge–Kutta'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`\begin{aligned} k_1 &= f(t_n, y_n), & k_2 &= f\big(t_n + \tfrac h2,\, y_n + \tfrac h2 k_1\big),\\ k_3 &= f\big(t_n + \tfrac h2,\, y_n + \tfrac h2 k_2\big), & k_4 &= f(t_n + h,\, y_n + h k_3),\end{aligned} \qquad y_{n+1} = y_n + \tfrac h6\,(k_1 + 2k_2 + 2k_3 + k_4)`,
  idea: String.raw`Euler's method steps along the slope at the start of each step, so its global error is first order in \(h\). Runge–Kutta methods sample the slope at a few points inside the step and take a weighted mean. The weights are chosen so the step matches the Taylor series of the true solution to higher order. The classic four-stage method is fourth order: halve the step and the error falls sixteenfold, for four slope evaluations per step. Adaptive solvers pair two orders and use their difference to choose the next step.`,
  requires: ['euler-method', 'truncation-error'],
  sources: [
    {
      title: 'MIT 2.086, calendar: Ordinary differential equations, parts 1 to 3',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The ODE lectures, with the recitation on MATLAB ode45.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Runge–Kutta methods',
      url: 'https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The classic method, Butcher tableaus and adaptive pairs.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'rk', notes: ['s6'], note: 'Euler, midpoint and RK4 on one equation with the same budget of slope evaluations: with 64, RK4’s 16 steps miss by 10⁻⁶ while Euler’s 64 miss by 4 × 10⁻³, and doubling the budget cuts RK4’s error sixteenfold.' },
  ],
};

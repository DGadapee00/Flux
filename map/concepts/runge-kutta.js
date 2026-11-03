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
    },
    {
      title: 'Wikipedia, Runge–Kutta methods',
      url: 'https://en.wikipedia.org/wiki/Runge%E2%80%93Kutta_methods',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The classic method, Butcher tableaus and adaptive pairs.',
    },
  ],
  labs: [],
  candidate: 'Solve one equation with Euler and with RK4 at the same number of slope evaluations. It corrects the idea that many cheap steps beat a few careful ones: at equal work RK4 is accurate to many more digits.',
};

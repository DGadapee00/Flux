export default {
  id: 'root-finding',
  title: 'Root finding: bisection and Newton',
  label: ['Root finding'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`|e_n| \le \frac{b - a}{2^{\,n+1}}\ \text{(bisection)}, \qquad x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}, \quad e_{n+1} \approx \frac{f''}{2f'}\,e_n^2\ \text{(Newton)}`,
  idea: String.raw`To solve \(f(x) = 0\), bisection keeps an interval where \(f\) changes sign and halves it each step: slow, one binary digit per step, but certain. Newton's method replaces \(f\) by its tangent line at the current guess and jumps to where the tangent crosses zero. Near a simple root the error squares each step, so the correct digits roughly double. Far from the root, or where \(f'\) is near zero, Newton can overshoot, cycle or land on a different root. Practical solvers start safe and finish with Newton.`,
  requires: ['derivative', 'truncation-error'],
  sources: [
    {
      title: 'MIT 2.086, calendar: Nonlinear problems, parts 1 to 3',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course’s unit on nonlinear equations, in one unknown and in many.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Newton’s method',
      url: 'https://en.wikipedia.org/wiki/Newton%27s_method',
      kind: 'Reference',
      level: 'Intro',
      why: 'The tangent-line picture, quadratic convergence and its failure cases.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'roots', notes: ['s4'], note: 'Newton and bisection on cubics: Newton from 0 on x³ − 2x + 2 cycles, from 0.45 on x³ − x it lands on −1, while bisection always closes in.' },
  ],
};

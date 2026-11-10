export default {
  id: 'numerical-differentiation',
  title: 'Numerical differentiation',
  label: ['Numerical', 'differentiation'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`\frac{f(x+h) - f(x)}{h} = f'(x) + \frac h2 f''(x) + \cdots, \qquad \frac{f(x+h) - f(x-h)}{2h} = f'(x) + \frac{h^2}{6}f'''(x) + \cdots`,
  idea: String.raw`The derivative is the limit of a difference quotient, so a computer stops at a small step \(h\). Expand \(f(x \pm h)\) in Taylor series and the error appears: a forward difference is first order, and a central difference cancels the even terms to reach second order for the same work. Shrinking \(h\) cuts that error, but the quotient subtracts nearly equal numbers and divides by a small one, so round-off grows as \(u/h\). The best step balances the two, near \(10^{-8}\) for a forward difference and \(10^{-5}\) for a central one in double precision.`,
  requires: ['derivative', 'truncation-error'],
  sources: [
    {
      title: 'MIT 2.086, calendar: Numerical calculus, part 2',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'Differentiation follows interpolation in the course.',
      checked: '2026-11-06',
    },
    {
      title: 'Yano, Penn, Konidaris and Patera, Math, Numerics, and Programming (for Mechanical Engineers)',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/resources/mit2_086s13_coursetext_pdf/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Forward, backward and central differences with their error orders.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'derivative', notes: ['s8'], note: 'Forward and central differences of sin x with a slider for h, the errors on log axes: they fall, bottom out, then climb as round-off takes over. The reference value is checked by the complex step.' },
  ],
};

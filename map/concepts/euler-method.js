export default {
  id: 'euler-method',
  title: 'Euler’s method',
  subject: 'numerics',
  courses: ['map2302', 'egn3203'],
  eq: String.raw`y_{n+1} = y_n + h\,f(t_n, y_n); \qquad y' = -ky \Rightarrow y_n = (1 - kh)^n y_0`,
  idea: String.raw`Walk along the slope field in short straight steps. Smaller steps follow the true solution more closely, with error proportional to the step. But a step too large for a fast-decaying equation makes the numbers oscillate and grow, even though the exact solution decays: \(|1 - kh|\) must stay below one.`,
  requires: ['first-order-odes'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §1.7 Numerical methods: Euler’s method',
      url: 'https://www.jirka.org/diffyqs/html/numer_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Euler’s method and its error, from the course’s book.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax Calculus Vol. 2, §4.2 Direction fields and numerical methods',
      url: 'https://openstax.org/books/calculus-volume-2/pages/4-2-direction-fields-and-numerical-methods',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Direction fields and Euler steps with worked tables.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'euler', notes: ['s4'], note: 'Euler steps against the exact curve, including a stable equation with unstable steps.' },
  ],
};

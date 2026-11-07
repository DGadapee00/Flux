export default {
  id: 'taylor-series',
  title: 'Taylor and power series',
  label: ['Taylor series'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`f(x) = \sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x-a)^n, \qquad |R_n| \le \frac{M\,|x-a|^{n+1}}{(n+1)!}`,
  idea: String.raw`A smooth function near a point is matched, term by term, by a polynomial built from its derivatives there. More terms match it further out, up to the series' radius of convergence. The remainder bound says how many terms a given accuracy needs. A pendulum's period at large swings is a series correction to the small-angle formula.`,
  requires: ['series', 'derivative'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 2, §6.3 Taylor and Maclaurin series',
      url: 'https://openstax.org/books/calculus-volume-2/pages/6-3-taylor-and-maclaurin-series',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Building the polynomial and bounding its error.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.01SC, Part B: Taylor series',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-5-exploring-the-infinite/part-b-taylor-series/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Power series and Taylor series with checked problems.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'taylor', notes: ['s9', 's8'], note: 'Change the order and centre of a Taylor polynomial and compare its error.' },
    { course: 'mac2311', lab: 'clock', notes: ['s10'], note: 'A pendulum clock: the large-swing period as a series, with a bound on its tail.' },
  ],
};

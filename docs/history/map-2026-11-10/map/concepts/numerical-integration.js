export default {
  id: 'numerical-integration',
  title: 'Numerical integration',
  label: ['Numerical', 'integration'],
  subject: 'numerics',
  courses: ['mac2311', 'egn3203'],
  eq: String.raw`S_n = \frac h3\big[f_0 + 4f_1 + 2f_2 + \cdots + 4f_{n-1} + f_n\big], \qquad |E_S| \le \frac{(b-a)h^4}{180}\max|f^{(4)}|`,
  idea: String.raw`When no antiderivative is at hand, sample the function and add weighted heights. The trapezoid rule joins samples with straight lines; Simpson's rule uses parabolas and, from the same points, shrinks its error sixteen times when the panels halve. The error bounds say how many panels a given accuracy needs.`,
  requires: ['definite-integral'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 2, §3.6 Numerical integration',
      url: 'https://openstax.org/books/calculus-volume-2/pages/3-6-numerical-integration',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Midpoint, trapezoid and Simpson, with their error bounds.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.01SC, Part C: Average value, probability and numerical integration',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-3-the-definite-integral-and-its-applications/part-c-average-value-probability-and-numerical-integration/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Numerical rules beside averages and probability.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'numint', notes: ['s11'], note: 'Add panels and watch Simpson pull ahead of the trapezoid from the same points.' },
  ],
};

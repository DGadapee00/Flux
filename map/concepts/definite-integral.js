export default {
  id: 'definite-integral',
  title: 'The definite integral',
  subject: 'calculus',
  courses: ['mac2311', 'mac2313'],
  eq: String.raw`\int_a^b f(x)\,dx = \lim_{n\to\infty}\sum_{i=1}^n f(x_i^*)\,\Delta x`,
  idea: String.raw`Cut an interval into thin strips, multiply each strip's width by a height of the function, and add. As the strips narrow, the sum settles on one number, the integral. Area is the first reading, but any quantity built up piece by piece is an integral: distance from speed, charge from density, work from force.`,
  requires: [],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §5.2 The definite integral',
      url: 'https://openstax.org/books/calculus-volume-1/pages/5-2-the-definite-integral',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Riemann sums to the limit, with signed area explained.',
    },
    {
      title: 'MIT 18.01SC, Part A: Definition of the definite integral and first fundamental theorem',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-3-the-definite-integral-and-its-applications/part-a-definition-of-the-definite-integral-and-first-fundamental-theorem/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The sum, the limit and the fundamental theorem in one sequence.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'riemann1', note: 'Rectangles under a graph, added one term at a time.' },
  ],
};

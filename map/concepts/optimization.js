export default {
  id: 'optimization',
  title: 'Optimization',
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`f'(x^*) = 0, \qquad f''(x^*) < 0 \Rightarrow \text{local max}`,
  idea: String.raw`A smooth function's highest and lowest points on an interval sit where the derivative is zero, where it does not exist, or at the ends. The second derivative says which way the graph bends. In a real problem the work is the setup: write the quantity in one variable using the constraint, then differentiate. The Mean Value Theorem is the reason a zero slope means a flat spot.`,
  requires: ['derivative'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §4.7 Applied optimization problems',
      url: 'https://openstax.org/books/calculus-volume-1/pages/4-7-applied-optimization-problems',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Boxes, fences and cans, each set up from its constraint.',
    },
    {
      title: 'MIT 18.01SC, Part B: Optimization, related rates and Newton’s method',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-2-applications-of-differentiation/part-b-optimization-related-rates-and-newtons-method/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Optimization problems with full solutions.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'box', notes: ['s6', 's2', 's3', 's4'], note: 'An open box from a sheet: the biggest box is not the biggest cut.' },
    { course: 'mac2311', lab: 'can', note: 'A drink can holding a fixed volume with the least metal, with and without a lid.' },
  ],
};

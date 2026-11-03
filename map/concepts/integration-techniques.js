export default {
  id: 'integration-techniques',
  title: 'Techniques of integration',
  label: ['Integration', 'techniques'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`\int u\,dv = uv - \int v\,du`,
  idea: String.raw`Each technique rewrites an integral into one you know. Parts trades a product for a simpler one; a trigonometric substitution turns a square root into a trig function; partial fractions split a rational function into easy pieces. Different routes can give answers that look different and differ by a constant. The definite integral still needs the two ends subtracted.`,
  requires: ['fundamental-theorem'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 2, §3.1 Integration by parts',
      url: 'https://openstax.org/books/calculus-volume-2/pages/3-1-integration-by-parts',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'How to choose u, with the cases that loop back.',
    },
    {
      title: 'MIT 18.01SC, Part B: Partial fractions, integration by parts, arc length, and surface area',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-4-techniques-of-integration/part-b-partial-fractions-integration-by-parts-arc-length-and-surface-area/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Parts and partial fractions with checked problems.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'technique', notes: ['s1', 's2', 's3', 's4'], note: 'Integrals worked by different methods to the same area, with the endpoint subtraction shown.' },
  ],
};

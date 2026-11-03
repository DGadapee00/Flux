export default {
  id: 'double-integrals',
  title: 'Double integrals',
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\iint_D f\,dA = \int_a^b\!\!\int_{g_1(x)}^{g_2(x)} f(x,y)\,dy\,dx`,
  idea: String.raw`Cut a region into small rectangles, multiply each one's area by the function there, and add: the volume under a surface. In practice, integrate one variable at a time. The inner integral is the area of a slice, and the outer one adds the slices. For a nice region, either order gives the same answer.`,
  requires: ['definite-integral'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §5.2 Double integrals over general regions',
      url: 'https://openstax.org/books/calculus-volume-3/pages/5-2-double-integrals-over-general-regions',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Setting the limits for type I and type II regions, the hard part.',
    },
    {
      title: 'MIT 18.02SC, Part A: Double integrals',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/3.-double-integrals-and-line-integrals-in-the-plane/part-a-double-integrals/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Iterated integrals and switching order, with checked problems.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'riemann', note: 'A double Riemann sum, one box at a time.' },
    { course: 'mac2313', lab: 'iterated', note: 'The inner integral as a filled slice, and the outer one adding them up.' },
  ],
};

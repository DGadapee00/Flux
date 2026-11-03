export default {
  id: 'related-rates',
  title: 'Related rates',
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`x^2 + y^2 = L^2 \;\Rightarrow\; x\,\dot x + y\,\dot y = 0`,
  idea: String.raw`When two quantities are tied by an equation, their rates are tied too. Differentiate the equation with respect to time, then put in the numbers at the moment you care about. Substituting first is the usual mistake, because it freezes what should be changing.`,
  requires: ['implicit-differentiation'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §4.1 Related rates',
      url: 'https://openstax.org/books/calculus-volume-1/pages/4-1-related-rates',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'A step list for setting up the equation before differentiating.',
    },
    {
      title: 'MIT 18.01SC, Part B: Optimization, related rates and Newton’s method',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-2-applications-of-differentiation/part-b-optimization-related-rates-and-newtons-method/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Ladders, cones and shadows with checked answers.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'rates', notes: ['s8'], note: 'A sliding ladder: the top does not move at the base’s speed.' },
  ],
};

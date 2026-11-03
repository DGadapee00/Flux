export default {
  id: 'partial-derivatives',
  title: 'Partial derivatives',
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\frac{\partial f}{\partial x} = \lim_{h\to0}\frac{f(x+h,y) - f(x,y)}{h}`,
  idea: String.raw`Hold every variable but one fixed and differentiate as usual. On a surface \(z = f(x,y)\), \(\partial f/\partial x\) is the slope of the slice where \(y\) is held, and \(\partial f/\partial y\) the slope of the other slice. For smooth functions the mixed partials agree whichever order you take them.`,
  requires: ['derivative'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §4.3 Partial derivatives',
      url: 'https://openstax.org/books/calculus-volume-3/pages/4-3-partial-derivatives',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Slices of a surface, then higher and mixed partials.',
    },
    {
      title: 'MIT 18.02SC, Part A: Functions of two variables, tangent approximation and optimization',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/2.-partial-derivatives/part-a-functions-of-two-variables-tangent-approximation-and-optimization/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Partials, tangent planes and approximation with checked problems.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'partials', note: String.raw`Two slices through a surface: hold \(y\) for one slope, hold \(x\) for the other.` },
    { course: 'mac2313', lab: 'partials3', note: String.raw`Three first partials of \(f(x,y,z)\) at a point you drag.` },
  ],
};

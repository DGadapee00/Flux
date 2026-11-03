export default {
  id: 'extrema',
  title: 'Critical points and extrema',
  label: ['Critical points', 'and extrema'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`\nabla f = \mathbf 0, \qquad D = f_{xx}f_{yy} - f_{xy}^2`,
  idea: String.raw`At a peak, a pit or a saddle of a smooth surface, the tangent plane is flat, so the gradient is zero. The second-derivative test sorts them: \(D > 0\) with \(f_{xx} > 0\) is a minimum, with \(f_{xx} < 0\) a maximum, and \(D < 0\) is a saddle. When \(D = 0\) the test says nothing.`,
  requires: ['gradient'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §4.7 Maxima/minima problems',
      // Unconfirmed: OpenStax drops the slash in "Maxima/Minima", so this page is most likely
      // 4-7-maximaminima-problems. Not changed until npm run map-sources can open both.
      url: 'https://openstax.org/books/calculus-volume-3/pages/4-7-maxima-minima-problems',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The second-derivative test with every case worked.',
    },
    {
      title: 'MIT 18.02SC, Part A: Functions of two variables, tangent approximation and optimization',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/2.-partial-derivatives/part-a-functions-of-two-variables-tangent-approximation-and-optimization/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Optimization problems with full solutions.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'extrema', note: String.raw`Critical points marked on a surface, with \(\nabla f\) and the Hessian test.` },
  ],
};

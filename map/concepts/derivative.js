export default {
  id: 'derivative',
  title: 'The derivative',
  subject: 'calculus',
  courses: ['mac2311', 'mac2313'],
  eq: String.raw`f'(x) = \lim_{h\to0}\frac{f(x+h) - f(x)}{h}`,
  idea: String.raw`The slope of a secant line through two points on a graph becomes the slope of the tangent as the points close in. That limit is the derivative: the instantaneous rate of change. A function can be continuous and still have no derivative at a corner, where the slopes from the two sides disagree.`,
  requires: ['limits'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §3.1 Defining the derivative',
      url: 'https://openstax.org/books/calculus-volume-1/pages/3-1-defining-the-derivative',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Secant to tangent, with the limit computed for several functions.',
    },
    {
      title: 'MIT 18.01SC, Part A: Definition and basic rules',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/1.-differentiation/part-a-definition-and-basic-rules/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Short lectures and checked problems on the definition itself.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'secant', notes: ['s6', 's7', 's8', 's9', 'c2/s1', 'c2/s7'], note: 'Slide two points together: the secant turns into the tangent, on curves and a falling height.' },
    { course: 'mac2313', lab: 'limits', note: String.raw`Slide \(x_0\) and \(h\) and watch the secant turn into the tangent.` },
  ],
};

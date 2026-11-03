export default {
  id: 'polar-coordinates',
  title: 'Polar coordinates',
  subject: 'calculus',
  courses: ['mac2311', 'mac2313'],
  eq: String.raw`x = r\cos\theta,\quad y = r\sin\theta, \qquad r^2 = x^2 + y^2`,
  idea: String.raw`A point can be named by its distance from the origin and its angle, instead of by \(x\) and \(y\). Circles and spirals become simple equations. The unit vectors \(\hat r\) and \(\hat\theta\) change direction from point to point, which matters later when a field is written in them.`,
  requires: [],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §1.3 Polar coordinates',
      url: 'https://openstax.org/books/calculus-volume-3/pages/1-3-polar-coordinates',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Converting both ways and sketching polar curves.',
    },
    {
      title: 'MIT 18.01SC, Part C: Parametric equations and polar coordinates',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-4-techniques-of-integration/part-c-parametric-equations-and-polar-coordinates/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Polar curves and their areas, with checked problems.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'polar', notes: ['s4', 's3', 's5'], note: String.raw`Sweep the angle: polar area grows with \(r^2\), not with \(r\).` },
    { course: 'mac2313', lab: 'polar', note: String.raw`Drag a point and read \(r\), \(\theta\) and the local \(\hat r\), \(\hat\theta\).` },
  ],
};

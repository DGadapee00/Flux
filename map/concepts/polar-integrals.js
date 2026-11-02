export default {
  id: 'polar-integrals',
  title: 'Double integrals in polar',
  label: ['Integrals in', 'polar'],
  subject: 'calculus',
  courses: ['mac2313'],
  eq: String.raw`dA = r\,dr\,d\theta`,
  idea: String.raw`Over a disk or a ring, cut the region along circles and rays instead of a grid. Each piece is nearly a rectangle with sides \(\Delta r\) and \(r\,\Delta\theta\), so its area carries a factor \(r\). Forget the \(r\) and the answer is wrong, because cells far from the centre are bigger.`,
  requires: ['double-integrals', 'polar-coordinates'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 3, §5.3 Double integrals in polar coordinates',
      url: 'https://openstax.org/books/calculus-volume-3/pages/5-3-double-integrals-in-polar-coordinates',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Where the r comes from, then regions between curves.',
    },
    {
      title: 'MIT 18.02SC, Part A: Double integrals',
      url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/pages/3.-double-integrals-and-line-integrals-in-the-plane/part-a-double-integrals/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Includes the polar change of variables in the same unit.',
    },
  ],
  labs: [
    { course: 'mac2313', lab: 'dpolar', note: String.raw`One sector at a time: \(\Delta A = r\,\Delta r\,\Delta\theta\).` },
  ],
};

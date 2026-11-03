export default {
  id: 'series',
  title: 'Sequences and series',
  label: ['Sequences and', 'series'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`\sum_{n=0}^{\infty} r^n = \frac{1}{1-r}\ \ (|r| < 1)`,
  idea: String.raw`An infinite series is the limit of its partial sums. Terms going to zero is needed but not enough: the harmonic series still diverges. Tests compare a series with one whose fate is known, an integral, a geometric series or a smaller or larger series. An alternating series with shrinking terms converges, and its error is less than the first term left out.`,
  requires: ['limits', 'improper-integrals'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 2, §5.2 Infinite series',
      url: 'https://openstax.org/books/calculus-volume-2/pages/5-2-infinite-series',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Partial sums, the geometric series and why the harmonic one diverges.',
    },
    {
      title: 'OpenStax Calculus Vol. 2, §5.3 The divergence and integral tests',
      url: 'https://openstax.org/books/calculus-volume-2/pages/5-3-the-divergence-and-integral-tests',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'The integral test, with the tail estimate that comes with it.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'series', notes: ['s4', 's3', 's5', 's6', 's7'], note: 'Partial sums of four series: which test each one passes.' },
  ],
};

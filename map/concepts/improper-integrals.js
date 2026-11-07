export default {
  id: 'improper-integrals',
  title: 'Improper integrals',
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`\int_1^\infty \frac{dx}{x^p} = \frac{1}{p-1}\ \ (p > 1)`,
  idea: String.raw`An integral over an infinite interval, or across a spike, is a limit: integrate to a finite bound and let it go. If the limit is finite, the integral converges, and the tail past any bound is what remains. Whether \(1/x^p\) converges depends only on \(p\), and that sets the pattern for comparing others.`,
  requires: ['fundamental-theorem', 'limits'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 2, §3.7 Improper integrals',
      url: 'https://openstax.org/books/calculus-volume-2/pages/3-7-improper-integrals',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Both kinds, with the comparison test.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.01SC, Part A: L’Hospital’s rule and improper integrals',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-5-exploring-the-infinite/part-a-lhospitals-rule-and-improper-integrals/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Improper integrals beside the limits they need.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'improper', notes: ['s2'], note: 'Slide the bound: the area approaches its limit and the tail shrinks.' },
  ],
};

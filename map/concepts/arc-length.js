export default {
  id: 'arc-length',
  title: 'Arc length and surface area',
  label: ['Arc length'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`L = \int_a^b \sqrt{1 + f'(x)^2}\,dx`,
  idea: String.raw`A short piece of curve is nearly straight, with length \(\sqrt{dx^2 + dy^2}\). Adding the pieces gives the arc length, which is always at least the chord. Inscribed polygons fall short and close in as the pieces shrink. A surface of revolution adds each piece's circumference times its length.`,
  requires: ['fundamental-theorem'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §6.4 Arc length of a curve and surface area',
      url: 'https://openstax.org/books/calculus-volume-1/pages/6-4-arc-length-of-a-curve-and-surface-area',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The formula from the Pythagorean theorem on one small piece.',
    },
    {
      title: 'MIT 18.01SC, Part B: Partial fractions, integration by parts, arc length, and surface area',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-4-techniques-of-integration/part-b-partial-fractions-integration-by-parts-arc-length-and-surface-area/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'Arc length and surface area with full solutions.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'arc', notes: ['s5'], note: 'Move the end of a curve: its length stays above the chord unless the curve is a line.' },
    { course: 'mac2311', lab: 'bridge', note: 'A suspension cable: doubling the sag does not double the length, and polygons fall short.' },
  ],
};

export default {
  id: 'fundamental-theorem',
  title: 'The fundamental theorem of calculus',
  label: ['Fundamental', 'theorem'],
  subject: 'calculus',
  courses: ['mac2311'],
  eq: String.raw`\frac{d}{dx}\int_a^x f(t)\,dt = f(x), \qquad \int_a^b f(x)\,dx = F(b) - F(a)`,
  idea: String.raw`The area under a curve up to \(x\) grows at the height of the curve there. So integration undoes differentiation, and a definite integral is an antiderivative's change between the ends. A rate integrated over time gives the net change, which is not the same thing as the rate now: a full barrel can stop filling while it still rains.`,
  requires: ['definite-integral', 'derivative'],
  sources: [
    {
      title: 'OpenStax Calculus Vol. 1, §5.3 The fundamental theorem of calculus',
      url: 'https://openstax.org/books/calculus-volume-1/pages/5-3-the-fundamental-theorem-of-calculus',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Both parts, with the accumulation function drawn.',
    },
    {
      title: 'MIT 18.01SC, Part B: Second fundamental theorem, areas, volumes',
      url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/pages/unit-3-the-definite-integral-and-its-applications/part-b-second-fundamental-theorem-areas-volumes/',
      kind: 'Lectures + problems with solutions',
      level: 'Course level',
      why: 'The theorem used, then turned on areas and volumes.',
    },
  ],
  labs: [
    { course: 'mac2311', lab: 'accum', notes: ['s3', 's5', 'c2/s9'], note: 'Slide x and watch the area grow at the height of the curve.' },
    { course: 'mac2311', lab: 'barrel', notes: ['s4'], note: 'A rain barrel: the rate of rain against the water already collected.' },
  ],
};

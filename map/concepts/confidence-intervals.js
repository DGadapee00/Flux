export default {
  id: 'confidence-intervals',
  title: 'Confidence intervals',
  label: ['Confidence', 'intervals'],
  subject: 'stats',
  courses: ['sta3032', 'egn3203'],
  eq: String.raw`\bar x \pm t_{\alpha/2,\,n-1}\,\frac{s}{\sqrt n}`,
  idea: String.raw`A confidence interval is a method that catches the true value a stated share of the time. A 95% interval does not have a 95% chance of holding \(\mu\) once it is drawn; it either does or it does not. Over many samples, 95% of the intervals would. Wider intervals buy more confidence; larger samples buy narrower ones.`,
  requires: ['sampling-distributions'],
  sources: [
    {
      title: 'MIT 18.05, Reading 22: Confidence intervals based on normal data',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_class22-prep_pdf/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'z and t intervals and what the confidence level means.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax Introductory Statistics 2e, §8.1 A single population mean using the normal distribution',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/8-1-a-single-population-mean-using-the-normal-distribution',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Building an interval and choosing a sample size.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'ci', note: 'A hundred intervals from a hundred samples, and the long-run share that catch μ.' },
  ],
};

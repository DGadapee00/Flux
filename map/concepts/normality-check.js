export default {
  id: 'normality-check',
  title: 'Checking normality',
  subject: 'stats',
  courses: ['sta3032'],
  eq: String.raw`\left(\Phi^{-1}\!\left(\tfrac{i - 0.5}{n}\right),\ x_{(i)}\right)\ \text{lies near a line if the data are normal}`,
  idea: String.raw`The t procedures assume roughly normal data. A normal probability plot tests that by eye: sort the data and plot them against where a normal sample of that size would put them. A straight line means normal. Skewed data bend away at one end; heavy tails bend at both. One outlier sits off the line by itself.`,
  requires: ['random-variables', 'descriptive-statistics'],
  sources: [
    {
      title: 'OpenStax Introductory Statistics 2e, §6.1 The standard normal distribution',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/6-1-the-standard-normal-distribution',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'z-scores and the normal quantiles the plot uses.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 18.05, Reading 6b: Central limit theorem and the law of large numbers',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_class06-prep-b_pdf/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'Why so much data comes out close to normal.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'npp', note: 'Samples from normal, skewed, heavy-tailed and uniform populations on a normal plot.' },
  ],
};

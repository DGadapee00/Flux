export default {
  id: 'hypothesis-tests',
  title: 'Hypothesis tests, errors and power',
  label: ['Hypothesis', 'tests'],
  subject: 'stats',
  courses: ['sta3032'],
  eq: String.raw`\alpha = P(\text{reject } H_0 \mid H_0), \qquad \text{power} = 1 - \beta = P(\text{reject } H_0 \mid H_1)`,
  idea: String.raw`A test asks whether the data are surprising if the null hypothesis is true. Rejecting a true null is a Type I error, with probability \(\alpha\); missing a real effect is a Type II error. Power grows with the effect size and the sample size. Which test fits depends on the question: one mean or two, paired or not, known spread or not, a proportion or a mean.`,
  requires: ['sampling-distributions'],
  sources: [
    {
      title: 'MIT 18.05, Reading 17a: Frequentist methods; null hypothesis significance testing',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/resources/mit18_05s14_reading17a/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'Rejection regions, significance and power.',
    },
    {
      title: 'MIT 18.05, Reading 19: NHST III, gallery of tests',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/resources/mit18_05s14_reading19/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'The common tests side by side, which is the choice the lab drills.',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'power', note: 'The null and alternative distributions with α, β and power shaded.' },
    { course: 'sta3032', lab: 'tests', note: 'The questions that pick a test, with the decision tree lit.' },
  ],
};

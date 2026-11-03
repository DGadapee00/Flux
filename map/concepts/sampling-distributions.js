export default {
  id: 'sampling-distributions',
  title: 'Sampling distributions and the central limit theorem',
  label: ['Sampling,', 'CLT'],
  subject: 'stats',
  courses: ['sta3032', 'egn3203'],
  eq: String.raw`\bar X \approx N\!\left(\mu,\ \frac{\sigma^2}{n}\right)\ \text{for large } n`,
  idea: String.raw`A statistic computed from a random sample is itself random, with its own distribution. The mean of \(n\) draws has the population's mean and a spread that shrinks as \(1/\sqrt n\). Whatever the population's shape, that mean's distribution approaches a normal as \(n\) grows. That is why normal tables serve for so many problems.`,
  requires: ['random-variables', 'descriptive-statistics'],
  sources: [
    {
      title: 'MIT 18.05, Reading 6a: Expectation, variance, law of large numbers and central limit theorem',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/resources/mit18_05s14_reading6a/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'The CLT stated carefully, with simulations.',
    },
    {
      title: 'OpenStax Introductory Statistics 2e, §7.1 The central limit theorem for sample means',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/7-1-the-central-limit-theorem-for-sample-means-averages',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The sample mean’s spread, with worked probabilities.',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'clt', note: 'Thousands of sample means from normal, uniform, skewed and two-humped populations.' },
  ],
};

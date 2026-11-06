export default {
  id: 'random-variables',
  title: 'Random variables and distributions',
  label: ['Random', 'variables'],
  subject: 'stats',
  courses: ['sta3032', 'egn3203'],
  eq: String.raw`E[X] = \sum x\,p(x) \ \text{or}\ \int x f(x)\,dx, \qquad \text{Var}(X) = E[X^2] - E[X]^2`,
  idea: String.raw`A random variable puts a number on each outcome, and its distribution says how probability spreads over those numbers. Counting successes gives the binomial; counting rare events, the Poisson; waiting times, the exponential; and measurements that add many small effects, the normal. For a continuous variable a probability is an area under the density, never the height at a point.`,
  requires: ['conditional-probability', 'definite-integral'],
  sources: [
    {
      title: 'MIT 18.05, Reading 5b: Continuous random variables',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2022/resources/mit18_05_s22_class05-prep-b_pdf/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'Densities and the cumulative distribution function, with worked examples.',
      checked: '2026-11-06',
    },
    {
      title: 'OpenStax Introductory Statistics 2e, §4.3 Binomial distribution',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/4-3-binomial-distribution',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'When a count is binomial, with worked tables.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'dist', note: 'Binomial, Poisson, exponential, normal and more: shade an event and read its probability.' },
  ],
};

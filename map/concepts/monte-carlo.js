export default {
  id: 'monte-carlo',
  title: 'Monte Carlo methods',
  label: ['Monte Carlo'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`I = \int_\Omega f\,dV \approx \frac{|\Omega|}{N}\sum_{i=1}^{N} f(\mathbf x_i), \qquad \text{standard error} = \frac{|\Omega|\,\sigma_f}{\sqrt N}`,
  idea: String.raw`Draw random points, evaluate the quantity at each, and average. The sample mean estimates the true mean, and the central limit theorem says its error is about \(\sigma/\sqrt N\). So a tenfold cut in error needs a hundred times the samples. That is slow next to Simpson's rule in one dimension, but the rate does not depend on the dimension, so in many dimensions sampling wins. It also handles uncertain inputs directly: sample them, run the model, and read the spread of the outputs.`,
  requires: ['sampling-distributions'],
  related: [
    {
      id: 'numerical-integration',
      note: String.raw`Both estimate an integral from samples: Simpson's error falls as \(h^4\), Monte Carlo's as \(1/\sqrt N\) in any dimension.`,
    },
  ],
  sources: [
    {
      title: 'MIT 2.086, calendar: Probability and statistics, parts 1 to 5',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course builds sampling and estimation, then uses them to compute.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Monte Carlo integration',
      url: 'https://en.wikipedia.org/wiki/Monte_Carlo_integration',
      kind: 'Reference',
      level: 'Intro',
      why: 'The estimator, its error and why it suits high dimensions.',
      checked: '2026-11-06',
    },
  ],
  labs: [],
  candidate: 'Estimate \\(\\pi\\) by throwing random points at a square around a circle, with a slider for the count. It corrects the idea that ten times the samples gives ten times the accuracy: it gives about three times.',
};

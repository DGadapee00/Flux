export default {
  id: 'linear-regression',
  title: 'Least-squares regression',
  label: ['Regression'],
  subject: 'stats',
  courses: ['sta3032'],
  eq: String.raw`\hat y = a + bx, \qquad b = \frac{\sum (x_i - \bar x)(y_i - \bar y)}{\sum (x_i - \bar x)^2}, \qquad R^2 = 1 - \frac{SS_\text{res}}{SS_\text{tot}}`,
  idea: String.raw`The least-squares line makes the sum of squared vertical misses as small as it can be; setting its partial derivatives to zero gives the slope and intercept. \(R^2\) is the share of the spread in \(y\) the line explains. Not every unusual point matters equally: one far out in \(x\) can swing the line, while one in the middle barely moves it. A curve in the residual plot means a line is the wrong model.`,
  requires: ['descriptive-statistics', 'partial-derivatives'],
  sources: [
    {
      title: 'MIT 18.05, Reading 25: Linear regression',
      url: 'https://ocw.mit.edu/courses/18-05-introduction-to-probability-and-statistics-spring-2014/resources/mit18_05s14_reading25/',
      kind: 'Reading notes',
      level: 'Course level',
      why: 'Least squares derived, with the probabilistic model behind it.',
    },
    {
      title: 'OpenStax Introductory Statistics 2e, §12.3 The regression equation',
      url: 'https://openstax.org/books/introductory-statistics-2e/pages/12-3-the-regression-equation',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Slope, intercept and R² computed by hand.',
    },
  ],
  labs: [
    { course: 'sta3032', lab: 'reg', note: 'Drag points and watch the line, residuals and R²; a point far out in x swings it.' },
  ],
};

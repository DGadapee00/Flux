export default {
  id: 'interpolation',
  title: 'Interpolation',
  label: ['Interpolation'],
  subject: 'numerics',
  courses: ['egn3203'],
  eq: String.raw`p(x) = \sum_{i=0}^{n} y_i\prod_{j\ne i}\frac{x - x_j}{x_i - x_j}, \qquad f(x) - p(x) = \frac{f^{(n+1)}(\xi)}{(n+1)!}\prod_{i=0}^{n}(x - x_i)`,
  idea: String.raw`Interpolation draws a function through known points, to read values in between. Through \(n + 1\) points passes exactly one polynomial of degree \(n\). Its error looks like a Taylor remainder, times a product that is small near the points and large between them. With many equally spaced points that product swells near the ends and the curve swings wildly, Runge's phenomenon. Piecewise curves, such as linear segments or cubic splines, avoid it by keeping each piece low in degree.`,
  requires: ['taylor-series', 'truncation-error'],
  sources: [
    {
      title: 'MIT 2.086, calendar: Numerical calculus, part 1',
      url: 'https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course starts numerical calculus with interpolation.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Runge’s phenomenon',
      url: 'https://en.wikipedia.org/wiki/Runge%27s_phenomenon',
      kind: 'Reference',
      level: 'Intro',
      why: 'The classic example, and why Chebyshev points cure it.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3203', lab: 'interp', notes: ['s7'], note: 'The polynomial through more and more points of Runge’s function, on equal spacing and on Chebyshev points: equal spacing swings ever wider at the ends. The barycentric form is checked against Newton’s divided differences.' },
  ],
};

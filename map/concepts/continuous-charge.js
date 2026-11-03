export default {
  id: 'continuous-charge',
  title: 'Field of a continuous charge',
  label: ['Continuous', 'charge'],
  subject: 'em',
  courses: ['phy2049'],
  eq: String.raw`\mathbf E = \frac{1}{4\pi\varepsilon_0}\int \frac{dq}{r^2}\,\hat{\mathbf r}, \qquad dq = \lambda\,dl,\ \sigma\,dA,\ \rho\,dV`,
  idea: String.raw`Cut a charged rod, ring or disk into tiny pieces \(dq\), treat each as a point charge, and add their fields with an integral. Symmetry first: on an axis, the sideways parts from opposite pieces cancel, so only one component needs integrating. Writing \(dq\) with the right density turns the sum into an ordinary integral.`,
  requires: ['electric-field'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 2, §5.5 Calculating electric fields of charge distributions',
      url: 'https://openstax.org/books/university-physics-volume-2/pages/5-5-calculating-electric-fields-of-charge-distributions',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Line, ring and disk worked through with the symmetry argument shown.',
    },
    {
      title: 'MIT 8.02, Problem-solving guide: Continuous charge distributions',
      url: 'https://ocw.mit.edu/courses/8-02-physics-ii-electricity-and-magnetism-spring-2007/resources/solving02/',
      kind: 'Guide + solved problems',
      level: 'Course level',
      why: 'A fixed recipe for setting up dq and r, then solved cases to check against.',
    },
  ],
  labs: [
    { course: 'phy2049', lab: 'integral', notes: ['s6', 's7', 's8', 's9'], note: 'Plays the Riemann sum along the charge and compares it with the closed form.' },
  ],
};

export default {
  id: 'particle-kinematics',
  title: 'Motion along a line',
  subject: 'mechanics',
  courses: ['egn3321', 'phy2048'],
  eq: String.raw`v = \frac{ds}{dt}, \qquad a = \frac{dv}{dt} = v\frac{dv}{ds}`,
  idea: String.raw`Position, velocity and acceleration are each the derivative of the one before. Going back up takes integrals, so a graph of one gives the next by its slope or its area. When the acceleration depends on position, \(a = v\,dv/ds\) separates the variables. Constant-acceleration formulas are only the special case.`,
  requires: ['derivative', 'definite-integral'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §3.6 Finding velocity and displacement from acceleration',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/3-6-finding-velocity-and-displacement-from-acceleration',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Integrating a varying acceleration, past the constant case.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 8.01SC, 2.3 Worked example: acceleration from position',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-1-kinematics/2-3-worked-example-acceleration-from-position/',
      kind: 'Worked example',
      level: 'Course level',
      why: 'A short video that differentiates a position twice and reads the motion.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'rectilinear', notes: ['s2', 's1', 's3'], note: 'Position, velocity and acceleration graphs, including erratic piecewise motion.' },
    { course: 'egn3321', lab: 'train', notes: ['s8'], note: 'A train between two stations: accelerate, cruise, brake, within comfort limits.' },
    { course: 'phy2048', lab: 'kinematics-graphs', notes: ['s7', 's8', 's10', 's11'], note: 'Position, velocity and acceleration graphs, with the chord turning into the tangent.' },
    { course: 'phy2048', lab: 'stopping-distance', notes: ['s9'], note: 'A car braking on dry and wet roads: distance grows with the square of the speed.' },
  ],
};

export default {
  id: 'curved-path-forces',
  title: 'Force in curved motion',
  label: ['Force in', 'curved motion'],
  subject: 'mechanics',
  courses: ['egn3321', 'phy2048'],
  eq: String.raw`\sum F_n = m\frac{v^2}{\rho}, \qquad v_\text{design} = \sqrt{g\rho\tan\theta}`,
  idea: String.raw`To follow a curve, something must push toward its centre. On a banked road it is part of the normal force, with friction making up any difference, so one speed needs no friction at all. In a vertical loop the needed force changes around the loop, and at the top gravity alone may be enough. Write Newton's law in the same components as the curve.`,
  requires: ['newtons-second-law', 'curvilinear-motion'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §6.3 Centripetal force',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/6-3-centripetal-force',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Banked curves with and without friction, worked in full.',
    },
    {
      title: 'MIT 8.01SC, 11.1 Newton’s second law and circular motion',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-3-circular-motion/11-1-newtons-2nd-law-and-circular-motion/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'The radial equation set up with care about signs.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'curve', notes: ['s6', 's7', 's8', 's9'], note: 'A banked curve and a vertical loop, with the forces that hold each path.' },
    { course: 'egn3321', lab: 'highway', notes: ['s10'], note: 'A highway curve designed to its posted speed, superelevation and friction.' },
    { course: 'phy2048', lab: 'banked-curve', notes: ['s10'], note: 'A banked road: one speed needs no friction, and friction widens it into a band.' },
  ],
};

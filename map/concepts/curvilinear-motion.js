export default {
  id: 'curvilinear-motion',
  title: 'Curvilinear motion',
  subject: 'mechanics',
  courses: ['egn3321'],
  eq: String.raw`\mathbf a = \dot v\,\hat{\mathbf u}_t + \frac{v^2}{\rho}\,\hat{\mathbf u}_n, \qquad \mathbf a = (\ddot r - r\dot\theta^2)\,\hat{\mathbf u}_r + (r\ddot\theta + 2\dot r\dot\theta)\,\hat{\mathbf u}_\theta`,
  idea: String.raw`On a curved path, split the acceleration along and across the path. The tangential part changes the speed; the normal part, \(v^2/\rho\), turns the velocity toward the centre of curvature. For something swinging about a point, polar components are easier, and they carry the extra \(2\dot r\dot\theta\) term. A projectile is the simplest case: constant acceleration in \(x\) and \(y\) separately.`,
  requires: ['particle-kinematics', 'parametric-curves', 'polar-coordinates'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §4.3 Projectile motion',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/4-3-projectile-motion',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Independent x and y motion, worked for range and height.',
    },
    {
      title: 'MIT 8.01SC, 8.1 Polar coordinates',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-3-circular-motion/8-1-polar-coordinates/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'Why the polar unit vectors turn, which is where the extra terms come from.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'path-nt', notes: ['s5', 's4'], note: String.raw`Tangential and normal components on a curved path, with \(\rho\) at each point.` },
    { course: 'egn3321', lab: 'polar', notes: ['s6'], note: 'Radial and transverse components for an arm swinging and extending.' },
  ],
};

export default {
  id: 'relative-motion',
  title: 'Relative motion',
  subject: 'mechanics',
  courses: ['egn3321', 'phy2048'],
  eq: String.raw`\mathbf r_B = \mathbf r_A + \mathbf r_{B/A}, \qquad \mathbf v_B = \mathbf v_A + \mathbf v_{B/A}`,
  idea: String.raw`Motion depends on who is watching. Seen from axes that move with A but do not turn, B's position, velocity and acceleration are A's plus B's relative to A. The rule is plain vector addition, and it is the first step toward rigid bodies, where every point moves relative to another.`,
  requires: ['particle-kinematics', 'vectors'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §4.5 Relative motion in one and two dimensions',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/4-5-relative-motion-in-one-and-two-dimensions',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Boats, planes and wind, solved with vector diagrams.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 8.01SC, 18.1 Relative velocity',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-6-continuous-mass-transfer/18-1-relative-velocity/',
      kind: 'Lecture video',
      level: 'Course level',
      why: 'Relative velocity set up the way the rocket problem then needs it.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'relative', notes: ['s7'], note: 'Two moving bodies and the velocity of one as seen from the other.' },
    { course: 'phy2048', lab: 'relative-motion', notes: ['s8'], note: 'A boat in a current: where it points and where it goes differ.' },
    { course: 'phy2048', lab: 'wind-triangle', notes: ['s9'], note: 'A pilot holding a course in a crosswind, nose into the wind.' },
  ],
};

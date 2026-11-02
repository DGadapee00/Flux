export default {
  id: 'rigid-kinematics',
  title: 'Rigid-body velocity and acceleration',
  label: ['Rigid-body', 'kinematics'],
  subject: 'mechanics',
  courses: ['egn3321'],
  eq: String.raw`\mathbf v_B = \mathbf v_A + \boldsymbol\omega\times\mathbf r_{B/A}, \qquad \mathbf a_B = \mathbf a_A + \boldsymbol\alpha\times\mathbf r_{B/A} - \omega^2\mathbf r_{B/A}\quad\text{(plane motion)}`,
  idea: String.raw`Every point of a rigid body moves relative to every other only by turning. So one point's velocity, plus \(\boldsymbol\omega\) crossed with the arm to another, gives the other's. At any instant some point has zero velocity, the instantaneous centre, and the body is momentarily rotating about it. Linkages and slider-cranks are solved one link at a time this way. The acceleration formula is for plane motion, where \(\boldsymbol\omega\) is perpendicular to the plane. In three dimensions the last term becomes \(\boldsymbol\omega\times(\boldsymbol\omega\times\mathbf r_{B/A})\).`,
  requires: ['relative-motion'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §10.3 Relating angular and translational quantities',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/10-3-relating-angular-and-translational-quantities',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'The link between a point’s speed and the body’s rotation.',
    },
    {
      title: 'MIT 2.003SC, Velocity, acceleration, and rotational motion',
      url: 'https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/pages/velocity-acceleration-and-rotational-motion/',
      kind: 'Lectures + problems with solutions',
      level: 'Deeper',
      why: 'An engineering dynamics course’s full treatment, with recitations.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'slider-crank', notes: ['s2', 's1', 's3', 's5'], note: 'A slider-crank solved for velocity and acceleration, link by link.' },
    { course: 'egn3321', lab: 'ic', notes: ['s4'], note: 'The instantaneous centre of a moving link, found from two velocities.' },
  ],
};

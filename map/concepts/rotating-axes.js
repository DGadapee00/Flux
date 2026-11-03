export default {
  id: 'rotating-axes',
  title: 'Rotating axes and Coriolis',
  label: ['Rotating axes'],
  subject: 'mechanics',
  courses: ['egn3321'],
  eq: String.raw`\mathbf a_B = \mathbf a_A + \dot{\boldsymbol\Omega}\times\mathbf r + \boldsymbol\Omega\times(\boldsymbol\Omega\times\mathbf r) + 2\boldsymbol\Omega\times\mathbf v_\text{rel} + \mathbf a_\text{rel}`,
  idea: String.raw`When a point slides along a body that is itself turning, its acceleration picks up a term no single motion has: \(2\boldsymbol\Omega\times\mathbf v_\text{rel}\), the Coriolis acceleration. It is why a collar sliding out along a spinning rod pushes sideways on it, and why winds curve on a turning Earth.`,
  requires: ['rigid-kinematics'],
  sources: [
    {
      title: 'MIT 8.01SC, 4.4 Non-inertial reference frames',
      url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/pages/week-2-newtons-laws/4-4-non-inertial-reference-frames/',
      kind: 'Lecture video',
      level: 'Intro',
      why: 'What changes when the observer accelerates or turns.',
    },
    {
      title: 'MIT 2.003SC, Velocity, acceleration, and rotational motion',
      url: 'https://ocw.mit.edu/courses/2-003sc-engineering-dynamics-fall-2011/pages/velocity-acceleration-and-rotational-motion/',
      kind: 'Lectures + problems with solutions',
      level: 'Deeper',
      why: 'Derives every term of the rotating-frame acceleration.',
    },
  ],
  labs: [
    { course: 'egn3321', lab: 'coriolis', notes: ['s6'], note: 'A collar sliding along a turning rod, with each acceleration term drawn.' },
  ],
};

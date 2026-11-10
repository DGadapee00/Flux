export default {
  id: 'orbit-transfers',
  title: 'Orbit transfers and Δv',
  label: ['Orbit transfers'],
  subject: 'mechanics',
  courses: ['satellite'],
  eq: String.raw`\begin{gathered}v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right) \\ \Delta v_1 = \sqrt{\frac{\mu}{r_1}}\left(\sqrt{\frac{2r_2}{r_1 + r_2}} - 1\right)\end{gathered}`,
  idea: String.raw`To change orbit, change speed. The vis-viva equation gives the speed anywhere on an orbit from its distance and its size. A Hohmann transfer uses two burns: one stretches a circle into an ellipse that touches the higher orbit, and one at the far end rounds it out. Every manoeuvre is costed in \(\Delta v\), which the rocket equation turns into propellant.`,
  requires: ['kepler-equation', 'energy-conservation', 'rocket-equation'],
  sources: [
    {
      title: 'MIT 16.07, Lecture 17: Orbit transfers and interplanetary trajectories',
      url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/resources/mit16_07f09_lec17/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'The Hohmann transfer derived from orbit energy, with the two burns worked out.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Hohmann transfer orbit',
      url: 'https://en.wikipedia.org/wiki/Hohmann_transfer_orbit',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The vis-viva equation and the delta-v of each burn, with where the transfer is not the cheapest.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'satellite', lab: 'transfer', notes: ['s3'], note: 'A forward burn stretches a circle into an ellipse and lengthens the period, so you fall behind; the Hohmann burn just reaches the target and a second rounds it out.' },
  ],
};

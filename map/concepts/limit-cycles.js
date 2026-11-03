export default {
  id: 'limit-cycles',
  title: 'Limit cycles and nonlinear oscillation',
  label: ['Limit cycles'],
  subject: 'diffeq',
  courses: ['map2302'],
  eq: String.raw`\dot r = r(1 - r^2), \qquad \dot\theta = 1`,
  idea: String.raw`A limit cycle is a lone closed orbit that nearby motions approach or leave. Unlike a centre's family of orbits, it sets one amplitude whatever the start, which is how a clock keeps time with a drive. A pendulum's period grows with its swing, so a large-amplitude clock runs slow. Past two dimensions, motion can become chaotic.`,
  requires: ['linearization'],
  sources: [
    {
      title: 'Lebl, Notes on Diffy Qs, §8.4 Limit cycles',
      url: 'https://www.jirka.org/diffyqs/html/limitcycles_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'Limit cycles and the Poincaré–Bendixson idea.',
    },
    {
      title: 'Lebl, Notes on Diffy Qs, §8.3 Applications of nonlinear systems',
      url: 'https://www.jirka.org/diffyqs/html/nlinapps_section.html',
      kind: 'Free textbook (CC BY-SA)',
      level: 'Course level',
      why: 'The pendulum and its period at large swings.',
    },
  ],
  labs: [
    { course: 'map2302', lab: 'limit-cycle', notes: ['s9'], note: 'Orbits approaching an attracting cycle from inside and outside.' },
    { course: 'map2302', lab: 'clock-pendulum', notes: ['s11', 's10'], note: 'A pendulum clock: amplitude changes the period, and a drive sustains the swing.' },
  ],
};

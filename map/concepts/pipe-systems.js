export default {
  id: 'pipe-systems',
  title: 'Pipe systems and pumps',
  label: ['Pipe systems', 'and pumps'],
  subject: 'fluids',
  courses: ['eml3015'],
  eq: String.raw`h_\text{pump}(Q) = \Delta z + \sum h_L(Q), \qquad \text{parallel: } h_{L,1} = h_{L,2},\ \ Q = Q_1 + Q_2`,
  idea: String.raw`A system of pipes needs a head that rises with flow: the lift plus every loss along the way. A pump delivers a head that falls with flow. The system runs where the two curves cross. Pipes in series carry one flow and add their losses. Pipes in parallel share one head loss and add their flows, so the split settles where the losses match.`,
  requires: ['pipe-flow'],
  related: [
    {
      id: 'kirchhoff',
      note: String.raw`Networks obey the same two rules: flows at a junction add up, and losses around a loop sum to zero.`,
    },
  ],
  sources: [
    {
      title: 'MIT 2.06, calendar: Lecture 12, pipe systems and viscous pumps',
      url: 'https://ocw.mit.edu/courses/2-06-fluid-dynamics-spring-2013/pages/calendar/',
      kind: 'Course outline',
      level: 'Course level',
      why: 'The course’s last topic before the second quiz.',
    },
    {
      title: 'Cleynen, Fluid Dynamics for Engineers',
      url: 'https://fluidmech.ninja/',
      kind: 'Open textbook',
      level: 'Course level',
      why: 'Series and parallel pipes, and pump and system curves.',
    },
  ],
  labs: [],
  candidate: 'Two pipes in parallel feed an upstairs shower while a second tap opens. It corrects the idea that flow splits evenly or by pipe area: it splits so the head losses are equal, and opening the tap starves the shower.',
};

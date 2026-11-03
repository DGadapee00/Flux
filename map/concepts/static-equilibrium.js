export default {
  id: 'static-equilibrium',
  title: 'Static equilibrium',
  subject: 'mechanics',
  courses: ['phy2048'],
  eq: String.raw`\sum\mathbf F = \mathbf 0, \qquad \sum\mathbf M_O = \mathbf 0`,
  idea: String.raw`A body at rest has no net force and no net moment about any point. Take moments about the point where the most unknown forces act and they drop out. A support force that reaches zero is the edge of tipping. A ladder against a smooth wall needs friction at the floor, and how much depends on the angle and where the climber stands.`,
  requires: ['newtons-second-law', 'vectors'],
  sources: [
    {
      title: 'OpenStax University Physics Vol. 1, §12.1 Conditions for static equilibrium',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/12-1-conditions-for-static-equilibrium',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Both conditions, and choosing the pivot.',
    },
    {
      title: 'OpenStax University Physics Vol. 1, §12.2 Examples of static equilibrium',
      url: 'https://openstax.org/books/university-physics-volume-1/pages/12-2-examples-of-static-equilibrium',
      kind: 'Open textbook',
      level: 'Intro',
      why: 'Beams, ladders and hinges worked through.',
    },
  ],
  labs: [
    { course: 'phy2048', lab: 'car-balance', notes: ['s1'], note: 'Where a car’s centre of mass sits between the axles, and the load shift under braking.' },
    { course: 'phy2048', lab: 'beam', notes: ['s2'], note: 'A board on two supports as a person walks along it, to the point of tipping.' },
    { course: 'phy2048', lab: 'ladder', notes: ['s3'], note: 'A ladder on a smooth wall and the floor friction it needs.' },
  ],
};

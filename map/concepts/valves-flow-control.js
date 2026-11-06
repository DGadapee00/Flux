export default {
  id: 'valves-flow-control',
  title: 'Valves and flow control',
  label: ['Valves'],
  subject: 'instruments',
  courses: ['design'],
  eq: String.raw`Q = C_v\sqrt{\frac{\Delta p}{SG}}`,
  idea: 'A valve sets flow by adding a resistance you can change. Its flow coefficient says how much flow passes for a given pressure drop when fully open. How flow changes with opening is the valve’s characteristic, and the rest of the piping changes it: in a long pipe, a valve can do little until it is nearly shut. A control valve adds an actuator and a positioner so a controller can move it.',
  requires: ['pipe-systems'],
  sources: [
    {
      title: 'Wikipedia, Control valve',
      url: 'https://en.wikipedia.org/wiki/Control_valve',
      kind: 'Reference',
      level: 'Intro',
      why: 'Valve bodies, actuators and positioners in a control loop.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Flow coefficient',
      url: 'https://en.wikipedia.org/wiki/Flow_coefficient',
      kind: 'Reference',
      level: 'Intro',
      why: 'The flow coefficient and how flow follows from it and the pressure drop.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'valve', notes: ['s1'], note: 'A linear, equal-percentage or quick-opening valve in a pump and pipe system, with its installed characteristic.' },
  ],
};

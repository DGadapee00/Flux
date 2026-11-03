export default {
  id: 'ceramics-glasses',
  title: 'Ceramics and glasses',
  label: ['Ceramics and', 'glasses'],
  subject: 'matsci',
  courses: ['ema3010'],
  eq: String.raw`\eta = \eta_0\exp\!\left(\frac{Q}{RT}\right)`,
  idea: String.raw`Ceramics are held by ionic and covalent bonds, which are strong and directional, so they melt hot and resist wear but have almost no dislocation motion and break brittle. A glass is a solid with no long-range order: cooled fast enough, a melt stiffens before its atoms can line up. Its viscosity climbs steeply as it cools, and the glass transition is where it stops flowing on any human timescale. Network formers such as silica build the glass; modifiers such as soda break bonds to make it workable.`,
  requires: ['atomic-bonding', 'crystal-structures'],
  sources: [
    {
      title: 'MIT 3.091, Recitation 19: Glasses and cooling curves',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec19/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Volume against temperature for crystal and glass, and the cooling-rate effect.',
    },
    {
      title: 'MIT 3.091, Recitation 20: Glass formers',
      url: 'https://ocw.mit.edu/courses/3-091-introduction-to-solid-state-chemistry-fall-2018/resources/mit3_091f18_rec20/',
      kind: 'Recitation notes',
      level: 'Course level',
      why: 'Network formers and modifiers, and what makes a melt form a glass.',
    },
  ],
  labs: [],
  candidate: 'Cool a melt at different rates and plot its volume against temperature, crystal against glass. It corrects the idea that old window glass is a liquid still flowing.',
};

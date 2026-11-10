export default {
  id: 'bolted-joints',
  title: 'Bolted joints and preload',
  label: ['Bolted joints'],
  subject: 'materials',
  courses: ['design'],
  eq: String.raw`F_b = F_i + C\,P,\qquad C = \frac{k_b}{k_b + k_m}`,
  idea: String.raw`A bolt is tightened to stretch it, and that stretch clamps the parts together: the preload. An external load pulling the joint apart is shared, and most of it goes to unloading the clamped parts, because they are stiffer than the bolt. Only the share \(C\) reaches the bolt, which is why a well-preloaded bolt survives fatigue. The joint fails when the load removes the clamping force or the bolt yields.`,
  requires: ['axial-deformation', 'stress-on-a-section'],
  sources: [
    {
      title: 'MIT 2.72, Lecture 10: Bolted joints',
      url: 'https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/resources/mit2_72s09_lec10/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Preload, joint and bolt stiffness, and tightening torque.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Bolted joint',
      url: 'https://en.wikipedia.org/wiki/Bolted_joint',
      kind: 'Reference',
      level: 'Intro',
      why: 'How preload works, how torque sets it, and how joints fail.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'bolted', notes: ['s1', 's2'], note: 'Bolt and clamp forces as a preloaded joint is pulled apart, for steel plates and a gasket.' },
  ],
};

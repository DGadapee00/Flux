export default {
  id: 'design-for-manufacture',
  title: 'Design for manufacture and assembly',
  label: ['Design for', 'manufacture'],
  subject: 'design',
  courses: ['design'],
  eq: String.raw`C \approx C_\text{material} + C_\text{setup} + t_p\, r`,
  idea: 'A part that is easy to draw can be hard to make. Each process has things it does cheaply and things it cannot do: a mill needs a tool to reach every surface, and tight tolerances and fine finishes cost machining time. Designing for manufacture means choosing features the process makes well, with tolerances no tighter than function needs, and fewer parts that assemble one way only.',
  requires: ['design-process', 'tolerances-fits'],
  sources: [
    {
      title: 'MIT 2.008, Lecture 7: Machining in practice',
      url: 'https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/resources/mit2_008_s25_lec07_pdf/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'How cutting choices set power, finish and cost in a real machining job.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Design for manufacturability',
      url: 'https://en.wikipedia.org/wiki/Design_for_manufacturability',
      kind: 'Reference',
      level: 'Intro',
      why: 'Guidelines by process, and how tolerances and part count drive cost.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'allocate', notes: ['s4'], note: 'Three parts sharing a stack’s tolerance at least cost, by RSS or worst case. It covers tolerance cost, not process choice or assembly.' },
  ],
};

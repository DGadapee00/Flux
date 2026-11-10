export default {
  id: 'tolerance-stackup',
  title: 'Tolerance stack-up: worst case and statistical',
  label: ['Tolerance', 'stack-up'],
  subject: 'design',
  courses: ['design'],
  eq: String.raw`\begin{gathered}T_\text{worst} = \sum_i T_i \\ T_\text{RSS} = \sqrt{\textstyle\sum_i T_i^{2}}\end{gathered}`,
  idea: 'When parts stack end to end, their variations add. The worst case adds every tolerance at its limit, which is safe but often demands tight, costly parts. If each part varies independently, extreme values rarely line up, and the spread of the sum grows as the root of the sum of squares. That statistical stack lets parts be looser, at the price of a small, known share of assemblies out of range.',
  requires: ['tolerances-fits', 'random-variables'],
  sources: [
    {
      title: 'Wikipedia, Tolerance analysis',
      url: 'https://en.wikipedia.org/wiki/Tolerance_analysis',
      kind: 'Reference',
      level: 'Course level',
      why: 'Worst-case and root-sum-square stack-ups, and when each is used.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.008, Lecture 11a: Notes on variation and quality',
      url: 'https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/resources/mit2_008_s25_lec11a_pdf/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Treating a process as a normal distribution, and z-scores for how far a part sits from the mean.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'stackup', notes: ['s3'], note: 'Two to eight parts in a stack: the worst case against the exact spread of real stacks, for normal and flat part spreads.' },
  ],
};

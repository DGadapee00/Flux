export default {
  id: 'process-variation',
  title: 'Variation, capability and process control',
  label: ['Process', 'capability'],
  subject: 'design',
  courses: ['design'],
  eq: String.raw`C_p = \frac{\text{USL} - \text{LSL}}{6\sigma}`,
  idea: String.raw`Every process scatters. If the scatter is roughly normal, its spread \(\sigma\) set against the tolerance band says how many parts will fall outside: that is capability. A process can be precise but off target, or on target but loose. A control chart plots samples over time and flags when the process has shifted. A capable process leaves room between its spread and the limits, which gives the chart time to catch a shift before bad parts are made.`,
  requires: ['descriptive-statistics', 'sampling-distributions', 'tolerances-fits'],
  sources: [
    {
      title: 'MIT 2.008, Lecture 11: Variation and quality',
      url: 'https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/resources/mit2_008_s25_lec11_pdf/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Defining, measuring and controlling quality in manufacturing.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.008, Lecture 12: Statistical process control',
      url: 'https://ocw.mit.edu/courses/2-008-design-and-manufacturing-ii-spring-2025/resources/mit2_008_s25_lec12_pdf/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Process capability, control charts, and accuracy against precision.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'capability', notes: ['s2', 's3'], note: 'Cp, Cpk and parts out of limits for a lathe, and an x̄ chart catching tool wear.' },
  ],
};

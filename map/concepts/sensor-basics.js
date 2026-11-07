export default {
  id: 'sensor-basics',
  title: 'Sensors: from a quantity to a signal',
  label: ['Sensors'],
  subject: 'instruments',
  courses: ['design'],
  eq: String.raw`\begin{gathered}V_\text{out} = S\,x + V_0 \\ \text{resolution} = \frac{V_\text{ref}}{2^{n}\,S}\end{gathered}`,
  idea: String.raw`A sensor turns a physical quantity into an electrical one. Its sensitivity \(S\) says how much output each unit of input gives, its range says where that holds, and its offset where it starts. Behind it, a converter turns the voltage into counts, so the smallest change you can see is one count divided by the sensitivity. Calibration against known inputs ties the counts back to the quantity.`,
  requires: ['voltage-divider', 'measuring-circuits'],
  sources: [
    {
      title: 'Wikipedia, Sensor',
      url: 'https://en.wikipedia.org/wiki/Sensor',
      kind: 'Reference',
      level: 'Intro',
      why: 'Sensitivity, resolution and error, and the main kinds of sensor.',
      checked: '2026-11-06',
    },
    {
      title: 'MIT 2.007, Lecture 14: Microcomputers, programming, electronics and sensors',
      url: 'https://ocw.mit.edu/courses/2-007-design-and-manufacturing-i-spring-2009/resources/mit2_007s09_lec14/',
      kind: 'Lecture notes',
      level: 'Course level',
      why: 'Sensors read by a microcontroller in a design project.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'bench', lab: 'nightlight', notes: ['s4'], note: 'A light sensor in a divider, read by a 10-bit converter, with the fixed resistor chosen for sensitivity.' },
    { course: 'bench', lab: 'divider', notes: ['s3'], note: 'Sensors that change resistance, turned into a voltage by a divider.' },
  ],
};

export default {
  id: 'design-verification',
  title: 'Testing a design: verification and margins',
  label: ['Verification', 'and margins'],
  subject: 'design',
  courses: ['design'],
  eq: String.raw`\text{MS} = \frac{\text{allowable}}{\text{FS} \times \text{applied}} - 1`,
  idea: 'Every requirement needs a way to show it is met: by test, analysis, inspection or demonstration. A factor of safety covers what the analysis does not know, and the margin of safety says how much room is left after it. Tests are planned before the design is finished, so the design leaves room to measure. A test that cannot fail checks nothing.',
  requires: ['design-process', 'failure-theories'],
  sources: [
    {
      title: 'Wikipedia, Verification and validation',
      url: 'https://en.wikipedia.org/wiki/Verification_and_validation',
      kind: 'Reference',
      level: 'Course level',
      why: 'Verification against requirements and validation against the need, with the methods used.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Factor of safety',
      url: 'https://en.wikipedia.org/wiki/Factor_of_safety',
      kind: 'Reference',
      level: 'Intro',
      why: 'Design factor and margin of safety, and how they differ.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'dome', lab: 'proof', notes: ['proof'], note: 'The tank dome course: checked numbers tied to shop decisions and verification evidence.' },
    { course: 'design', lab: 'verify', notes: ['s4'], note: 'A bracket arm’s strength and stiffness margins by analysis and by a test on its real mount.' },
  ],
};

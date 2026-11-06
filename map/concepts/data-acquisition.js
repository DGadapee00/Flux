export default {
  id: 'data-acquisition',
  title: 'Signal conditioning and data acquisition',
  label: ['Data acquisition'],
  subject: 'instruments',
  courses: ['design'],
  eq: String.raw`f_s > 2 f_\text{max},\qquad \Delta V = \frac{V_\text{ref}}{2^{n}}`,
  idea: 'Between a sensor and a number sits a chain: amplify the signal to fill the converter’s range, filter what you do not want, then sample it. Sampling faster than twice the highest frequency present keeps the signal; slower, and fast changes fold into false slow ones, which is aliasing. An anti-aliasing filter before the converter removes what the sampling cannot keep. The converter’s bits set the smallest step.',
  requires: ['op-amp', 'filters', 'sensor-basics'],
  sources: [
    {
      title: 'Wikipedia, Data acquisition',
      url: 'https://en.wikipedia.org/wiki/Data_acquisition',
      kind: 'Reference',
      level: 'Intro',
      why: 'The chain from sensor through signal conditioning to the converter.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Nyquist–Shannon sampling theorem',
      url: 'https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem',
      kind: 'Reference',
      level: 'Deeper',
      why: 'The sampling rate a signal needs, and aliasing when it is too low.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'sampling', notes: ['s3'], note: 'A tone sampled at a chosen rate, with the false frequency the samples show and their spectrum. It covers aliasing, not filtering or quantization.' },
  ],
};

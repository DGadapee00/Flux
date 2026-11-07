export default {
  id: 'tolerances-fits',
  title: 'Tolerances, limits and fits',
  label: ['Tolerances', 'and fits'],
  subject: 'design',
  courses: ['design'],
  eq: String.raw`\begin{gathered}c_{\min} = D_{\min} - d_{\max} \\ c_{\max} = D_{\max} - d_{\min}\end{gathered}`,
  idea: 'No part is made exactly to size, so every dimension carries a tolerance: the band it may fall in. A fit pairs a hole and a shaft. If the smallest hole is bigger than the largest shaft, they always slide: a clearance fit. If the largest hole is smaller than the smallest shaft, they always press: an interference fit. In between, a transition fit can go either way. Standard grades set the band from the size and how precise the process is.',
  requires: ['design-process'],
  sources: [
    {
      title: 'Wikipedia, Engineering fit',
      url: 'https://en.wikipedia.org/wiki/Engineering_fit',
      kind: 'Reference',
      level: 'Course level',
      why: 'Clearance, transition and interference fits, and the hole-basis system.',
      checked: '2026-11-06',
    },
    {
      title: 'Wikipedia, Engineering tolerance',
      url: 'https://en.wikipedia.org/wiki/Engineering_tolerance',
      kind: 'Reference',
      level: 'Course level',
      why: 'What a tolerance is, limits of size and the international tolerance grades.',
      checked: '2026-11-06',
    },
  ],
  labs: [
    { course: 'design', lab: 'fits', notes: ['s1', 's2'], note: 'Hole and shaft bands for standard 50 mm fits, the tightest and loosest pair, and how often a transition fit interferes.' },
  ],
};

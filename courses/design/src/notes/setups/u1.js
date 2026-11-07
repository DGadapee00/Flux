/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'H8/f7 at 50 mm', lab: 'fits', scenario: 'close-running', read: (c) => ({ cMin: [c.cMin, 25], cMax: [c.cMax, 89] }) }],
  s2: [{ tag: 'H7/k6 with Cp = 1', lab: 'fits', scenario: 'transition', read: (c) => ({ p: [c.chance * 100, 30.7] }) }],
  s3: [
    {
      tag: 'five parts at ±0.1 mm',
      lab: 'stackup',
      scenario: 'five-normal',
      read: (c) => ({ worst: [c.worst, 0.5], rss: [c.rss, 0.224], ppm: [c.exactOutside * 1e6, 57] }),
    },
  ],
};

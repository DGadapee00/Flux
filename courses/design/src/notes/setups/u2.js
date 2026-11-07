/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    {
      tag: 'a drill with σ = 0.05 mm',
      lab: 'position',
      scenario: 'loose',
      read: (c) => ({ box: [c.box * 100, 91.1], circle: [c.circle * 100, 98.2] }),
    },
  ],
  s2: [{ tag: 'pins 15 μm high', lab: 'capability', scenario: 'off-centre', read: (c) => ({ cp: [c.cp, 1.33], cpk: [c.cpk, 0.667], ppm: [c.ppm, 22750] }) }],
  s3: [{ tag: 'tool wear on a capable process', lab: 'capability', scenario: 'wear', read: (c) => ({ cp: [c.cp, 1.67], flag: [c.flag, 9], out: [c.firstOut, 13] }) }],
  s4: [{ tag: 'the cheapest split at ±0.10 mm', lab: 'allocate', scenario: 'rss', read: (c) => ({ pin: [c.best[2] * 1000, 79.6], spacer: [c.best[0] * 1000, 32.3], best: [c.costBest, 20.95], equal: [c.costEqual, 21.93] }) }],
};

/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
const gate3 = (s) => Object.assign(s, { fluid: 'water', d: 3, L: 2, b: 1, theta: 90 });

export default {
  s1: [{ tag: 'a gate 3 m down', lab: 'gate', scenario: 'surface', setup: gate3, read: (c) => ({ F: [c.F / 1000, 78.3] }) }],
  s2: [{ tag: "where the gate's force acts", lab: 'gate', scenario: 'surface', setup: gate3, read: (c) => ({ ycp: [c.ycp, 4.08], hold: [c.hold / 1000, 42.4] }) }],
  s3: [
    {
      tag: 'water in a truck',
      lab: 'rigid-tank',
      scenario: 'truck',
      setup(s) {
        Object.assign(s, { mode: 'linear', fluid: 'water', ax: 3, az: 0 });
      },
      read: (c) => ({ angle: [c.angle, 17.0], rise: [c.rise * 100, 15.3], p: [c.pInner / 1000, 5.9] }),
    },
  ],
  s4: [
    {
      tag: 'water spun at 6 rad/s',
      lab: 'rigid-tank',
      scenario: 'spin',
      setup(s) {
        Object.assign(s, { mode: 'spin', fluid: 'water', omega: 6, az: 0 });
      },
      read: (c) => ({ drop: [c.rise * 100, 8.26], p: [c.pOuter / 1000, 5.21] }),
    },
  ],
};

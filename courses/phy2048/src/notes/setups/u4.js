/** Unit 4 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    { tag: 'a crate pushed up a ramp', lab: 'work-energy', scenario: 'push', read: (c) => ({ WF: [c.WF, 900], Wg: [c.Wg, -255.5], Wf: [c.Wf, -434.7], Wnet: [c.Wnet, 209.7] }) },
  ],
  s2: [
    { tag: 'gravity on three paths', lab: 'work-path', scenario: 'gravity', read: (c) => ({ Wstraight: [c.Wstraight, -68.67], Wcorner: [c.Wcorner, -68.67], Warc: [c.Warc, -68.67] }) },
    { tag: 'friction on the same paths', lab: 'work-path', scenario: 'friction', read: (c) => ({ Wstraight: [c.Wstraight, -43.45], Warc: [c.Warc, -68.26] }) },
  ],
  s4: [
    { tag: 'the crate at the top', lab: 'work-energy', scenario: 'push', read: (c) => ({ vf: [c.vf, 2.896] }) },
    { tag: 'a shove and a stop', lab: 'work-energy', scenario: 'shove', read: (c) => ({ K0: [c.K0, 16.0], D: [c.D, 1.539] }) },
  ],
  s5: [
    { tag: 'a car on a hill', lab: 'automotive-power', scenario: 'book', read: (c) => ({ climb: [c.climb, 43700], total: [c.total, 58200], theta: [c.theta, 8.53] }) },
    { tag: 'drag on the highway', lab: 'automotive-power', scenario: 'highway', read: (c) => ({ Fd: [c.Fd, 327], drag: [c.drag, 9080] }) },
  ],
  s7: [
    { tag: 'a swirl round a closed path', lab: 'work-path', scenario: 'swirl', read: (c) => ({ Warc: [c.Warc, 217.8], Wstraight: [c.Wstraight, 3.75] }) },
  ],
  s8: [
    { tag: 'a cart over two hills', lab: 'track', scenario: 'hills', read: (c) => ({ v: [c.v, 6.34] }) },
    { tag: 'rolling resistance', lab: 'track', scenario: 'rough', read: (c) => ({ Eth: [c.Eth, 2205], U: [c.U, 11770], v: [c.v, 5.40] }) },
    { tag: 'a loop of radius 2 m', lab: 'track', scenario: 'loop', read: (c) => ({ Ntop: [c.Ntop, 3924] }) },
  ],
  s9: [
    { tag: 'a double well', lab: 'energy-diagram', scenario: 'well', read: (c) => ({ a: [c.a, 0.383], b: [c.b, 0.924] }) },
    { tag: 'a quartic well', lab: 'energy-diagram', scenario: 'quartic', read: (c) => ({ b: [c.b, 1], Fb: [c.Fb, -8] }) },
  ],
};

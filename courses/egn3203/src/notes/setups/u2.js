/** Unit 2 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s6: [
    { tag: 'a budget of 64', lab: 'rk', scenario: 'budget', read: (c) => ({ Euler: [c.euler.error, 4.22e-3], midpoint: [c.midpoint.error, 1.69e-3], RK4: [c.rk4.error, 1.03e-6] }) },
    { tag: 'y′ = y cos t with 256', lab: 'rk', scenario: 'growth', read: (c) => ({ 'y(4)': [c.exactT, 0.469], Euler: [c.euler.error, 2.2e-3], RK4: [c.rk4.error, 2.75e-8] }) },
  ],
  s4: [{ tag: 'Newton from −2', lab: 'roots', scenario: 'good', read: (c) => ({ x1: [c.newton.xs[1], -1.8], x2: [c.newton.xs[2], -1.76995], root: [c.nwRoot, -1.76929] }) }],
  s3: [{ tag: 'the forward difference at h = 0.1', lab: 'truncation', scenario: 'tenth', read: (c) => ({ estimate: [c.methods.forward.value, 0.4974], error: [c.methods.forward.error, 0.0429], 'leading term': [c.methods.forward.predicted, 0.0421] }) }],
  s2: [{ tag: 'one minus cosine at 10⁻⁸', lab: 'roundoff', scenario: 'cosine', setup: (s) => { s.lx = -8; }, read: (c) => ({ rewritten: [c.stable, 0.5], 'as written + 0.5': [c.direct + 0.5, 0.5] }) }],
};

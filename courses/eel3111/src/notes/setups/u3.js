/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'two sources', lab: 'superpose', scenario: 'aid', read: (c) => ({ I_L1: [c.one.I, 0.75], I_L2: [c.two.I, 0.469], I_L: [c.both.I, 1.219] }) }],
  s2: [
    { tag: 'powers that do not add', lab: 'superpose', scenario: 'aid', read: (c) => ({ P_1: [c.one.P, 2.25], P_2: [c.two.P, 0.879], 'sum': [c.powerSum, 3.13], P_L: [c.both.P, 5.94] }) },
    { tag: 'currents that cancel', lab: 'superpose', scenario: 'cancel', read: (c) => ({ I_L2: [c.two.I, -0.75], P_2: [c.two.P, 2.25], 'sum': [c.powerSum, 4.5], P_L: [c.both.P, 0] }) },
  ],
  s3: [{ tag: 'the network from its load', lab: 'thevenin', scenario: 'match', read: (c) => ({ R_th: [c.Rth, 1.82], I_N: [c.IN, 3.9], V_th: [c.Vth, 7.09], 'bench R_th': [c.Rbench, 1.82] }) }],
  s4: [{ tag: 'a matched load', lab: 'thevenin', scenario: 'match', read: (c) => ({ P_max: [c.Pmax, 6.91], 'heats R_th': [c.Pin, 6.91], 'real sources': [c.Psrc, 38.4] }) }],
};

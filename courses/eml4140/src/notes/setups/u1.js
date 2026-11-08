/** Unit 1 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
const HALF = Math.log(2) / Math.PI ** 2;

export default {
  s1: [{ tag: 'a copper rod cools to half', lab: 'rod', scenario: 'copper', setup: (s) => { s.Fo = HALF; }, read: (c) => ({ t: [c.t, 6.0], 'middle (°C)': [c.midC, 60] }) }],
  s2: [{ tag: 'the ripple and the hump', lab: 'rod', scenario: 'wiggle', setup: (s) => { s.Fo = 0.02; }, read: (c) => ({ hump: [c.humpShare, 0.821], 'middle (°C)': [c.midC, 85.9] }) }],
  s4: [{ tag: 'a house wall', lab: 'resistance', scenario: 'house', read: (c) => ({ q: [c.q, 9.49], 'drop across wool': [c.insDrop, 21.4] }) }],
  s5: [{ tag: 'insulating a thin wire', lab: 'resistance', scenario: 'wire', read: (c) => ({ 'Q (W/m)': [c.Q, 11.4], bare: [c.bare, 6.28], 'r_crit (mm)': [c.rCrit * 1000, 10] }) }],
  s3: [{ tag: 'a tent on 80 cells', lab: 'rod', scenario: 'tent', setup: (s) => { s.Fo = 0.01; }, read: (c) => ({ 'grid middle': [c.fd[40], 0.774], 'series middle': [c.mid, 0.774] }) }],
  s7: [
    { tag: 'an aluminium pin', lab: 'fin', scenario: 'alu', read: (c) => ({ m: [c.m, 10], 'q (W)': [c.q, 1.39] }) },
  ],
  s8: [
    { tag: 'steel and polycarbonate', lab: 'quench', scenario: 'steel', read: (c) => ({ Bi: [c.Bi, 0.222], 'centre (°C)': [c.Tc, 173], 'surface (°C)': [c.Ts, 157.5] }) },
  ],
  s9: [
    { tag: 'steel and wood', lab: 'touch', scenario: 'steel', read: (c) => ({ 'e steel': [c.e2, 12700], 'T_c (°C)': [c.Tc, 21.2] }) },
  ],
  s10: [
    { tag: 'halving Δx', lab: 'grid', scenario: 'refined', read: (c) => ({ Fo: [c.Fo, 0.528], G: [c.Gfine, -1.11], steps: [c.done, 268] }) },
  ],
};

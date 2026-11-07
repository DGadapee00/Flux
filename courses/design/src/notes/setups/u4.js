/** Unit 4 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [{ tag: 'a steel joint pulled with 10 kN', lab: 'bolted', scenario: 'steel', read: (c) => ({ C: [c.C, 0.25], Fb: [c.Fb, 22.5], Fm: [c.Fm, 12.5] }) }],
  s2: [{ tag: 'how hard it can be pulled', lab: 'bolted', scenario: 'steel', read: (c) => ({ Psep: [c.Psep, 26.7] }) }],
  s3: [{ tag: 'one pin 50 μm off', lab: 'mount', scenario: 'exact', read: (c) => ({ shift: [c.shiftUm, 50] }) }],
};

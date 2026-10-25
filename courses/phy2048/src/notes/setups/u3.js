/** Unit 3 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    { tag: 'riding at a steady speed', lab: 'elevator-scale', scenario: 'cruise', read: (c) => ({ N: [c.N, 735.8], a: [c.a, 0] }) },
  ],
  s5: [
    { tag: 'the normal force on a slope', lab: 'incline', scenario: 'snowboard', read: (c) => ({ N: [c.N, 573.5], W: [c.W, 588.6] }) },
  ],
  s7: [
    { tag: 'a block on a table and a hanging block', lab: 'atwood', scenario: 'table', read: (c) => ({ a: [c.a, 3.68], T: [c.T, 18.4] }) },
    { tag: 'an Atwood machine', lab: 'atwood', scenario: 'atwood', read: (c) => ({ a: [c.a, 3.27], T: [c.T, 26.2] }) },
  ],
  s8: [
    { tag: 'a scale in a rising elevator', lab: 'elevator-scale', scenario: 'start', read: (c) => ({ N: [c.N, 825.8], kg: [c.kg, 84.2] }) },
    { tag: 'slowing on the way down', lab: 'elevator-scale', scenario: 'arrive', read: (c) => ({ N: [c.N, 825.8], a: [c.a, 1.2] }) },
  ],
  s9: [
    { tag: 'a snowboarder and a skier', lab: 'incline', scenario: 'snowboard', read: (c) => ({ a: [c.a, 0.295] }) },
    { tag: 'a box that will not stay put', lab: 'incline', scenario: 'rest', read: (c) => ({ tan: [c.tan, 0.466] }) },
  ],
  s10: [
    { tag: 'a car on a flat curve', lab: 'banked-curve', scenario: 'flat', read: (c) => ({ Fc: [c.Fc, 1125], muNeeded: [c.muNeeded, 0.127] }) },
    { tag: 'a steeply banked curve', lab: 'banked-curve', scenario: 'banked', read: (c) => ({ vDesign: [c.vDesign, 24.3] }) },
  ],
  s11: [
    { tag: 'a skydiver, spread-eagle', lab: 'skydiver', scenario: 'spread', read: (c) => ({ vt1: [c.vt1, 44.4] }) },
    { tag: 'head first', lab: 'skydiver', scenario: 'headfirst', read: (c) => ({ vt1: [c.vt1, 98.2] }) },
    { tag: 'a bead sinking in oil', lab: 'drag', scenario: 'oil', read: (c) => ({ vt: [c.vt, 0.981], vTau: [c.vTau, 0.620] }) },
  ],
};

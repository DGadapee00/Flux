/** Unit 1 worked examples the lab can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    {
      tag: 'a tank with a drain',
      lab: 'tank',
      scenario: 'fill',
      setup(s) {
        s.V0 = 0;
        s.Vcap = 0.3;
        s.qin = 0.0005;
        s.qout = 0.0001;
      },
      read: (c) => ({ T: [c.T, 750] }),
    },
  ],
};

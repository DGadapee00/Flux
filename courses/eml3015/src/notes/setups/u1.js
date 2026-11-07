/** Unit 1 worked examples the lab can show. `tag` matches the text after "Worked example · ". */
export default {
  s1: [
    {
      tag: 'water under a plate',
      lab: 'viscosity',
      scenario: 'water',
      setup(s) {
        s.fluid = 'water';
        s.U = 0.5;
        s.h = 2;
      },
      read: (c) => ({ tau: [c.tau, 0.2504], F: [c.force, 0.02504] }),
    },
  ],
  s2: [
    {
      tag: 'water settles',
      lab: 'viscosity',
      scenario: 'water',
      setup(s) {
        s.fluid = 'water';
        s.h = 2;
      },
      read: (c) => ({ t1: [c.t1, 1.68] }),
    },
  ],
};

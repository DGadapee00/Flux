/** Unit 5 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
export default {
  s2: [
    {
      tag: 'a driver stopped by a seatbelt',
      lab: 'impulse',
      scenario: 'belt',
      read: (c) => ({ J: [c.J, -2367], vf: [c.vf, 0], Favg: [c.Favg, -946.8] }),
    },
    {
      tag: 'the same change as a triangle',
      lab: 'impulse',
      scenario: 'tent',
      read: (c) => ({ J: [c.J, -8], vf: [c.vf, 0], Favg: [c.Favg, -16] }),
    },
    {
      tag: 'a stop against the steering wheel',
      lab: 'crumple-zone',
      scenario: 'wheel',
      read: (c) => ({ F: [c.F, -11830], d: [c.d, 2.7] }),
    },
  ],
  s3: [
    {
      tag: 'two carts that stick',
      lab: 'collide',
      scenario: 'stick',
      setup: (s) => { Object.assign(s, { m1: 0.5, m2: 0.675, u1: 1.33, u2: 0.75, e: 0 }); },
      read: (c) => ({ v1: [c.v1, 0.9968], v2: [c.v2, 0.9968], lost: [c.lost, 0.04831] }),
    },
    {
      tag: 'equal pucks that exchange',
      lab: 'collide',
      scenario: 'exchange',
      setup: (s) => { Object.assign(s, { m1: 0.015, m2: 0.015, u1: 2.5, u2: 0, e: 1 }); },
      read: (c) => ({ v1: [c.v1, 0], v2: [c.v2, 2.5] }),
    },
  ],
  s4: [
    {
      tag: 'a lighter puck into a heavier one',
      lab: 'collide',
      scenario: 'heavy',
      setup: (s) => { Object.assign(s, { m1: 0.012, m2: 0.015, u1: 2.5, u2: 0, e: 1 }); },
      read: (c) => ({ v1: [c.v1, -0.2778], v2: [c.v2, 2.222], K: [c.K, 0.0375] }),
    },
    {
      tag: 'a skid after a crash',
      lab: 'crash-reconstruction',
      scenario: 'book',
      read: (c) => ({ vT: [c.vT, 11.03], vC: [c.vC, 27.57] }),
    },
  ],
  s5: [
    {
      tag: 'two vehicles that stick at a crossing',
      lab: 'collide-2d',
      scenario: 'traffic',
      read: (c) => ({ speed: [c.speed, 9.249], angle: [c.angle, 59.01] }),
    },
    {
      tag: 'equal discs that glance',
      lab: 'collide-2d',
      scenario: 'equal',
      read: (c) => ({ angle: [c.angle, 90] }),
    },
  ],
  s6: [
    {
      tag: 'a light mass and a heavy one',
      lab: 'center-of-mass',
      scenario: 'unequal',
      read: (c) => ({ x: [c.x, 3], y: [c.y, 0.75] }),
    },
    {
      tag: 'a rod with a mass at one end',
      lab: 'center-of-mass',
      scenario: 'rod',
      read: (c) => ({ x: [c.x, 1.25], y: [c.y, 0] }),
    },
    {
      tag: 'a shell that bursts',
      lab: 'center-of-mass',
      scenario: 'burst',
      read: (c) => ({ x: [c.x, 6.171], y: [c.y, 0.2908] }),
    },
    {
      tag: 'the Earth-Moon system',
      lab: 'center-of-mass',
      scenario: 'unequal',
      setup: (s) => {
        Object.assign(s, { kind: 'points', m1: 5.97e24, x1: 0, y1: 0, m2: 7.36e22, x2: 3.82e8, y2: 0 });
      },
      read: (c) => ({ x: [c.x, 4.652e6], y: [c.y, 0] }),
    },
  ],
  s7: [
    {
      tag: 'a coasting thruster',
      lab: 'rocket',
      scenario: 'coast',
      read: (c) => ({ dv: [c.dv, 89.17], thrust: [c.thrust, 50000], a0: [c.a0, 2.5] }),
    },
  ],
};

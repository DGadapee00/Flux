/** Work and energy (id u3, Unit 4) worked examples the labs can show. See ../setups.js. */
export default {
  s1: [
    {
      tag: 'released from a stretch',
      lab: 'collar',
      scenario: 'smooth',
      setup(s) {
        s.mass = 2;
        s.k = 80;
        s.theta = 30;
        s.mu = 0;
        s.x1 = 0.5;
        s.x2 = 0;
        s.v1 = 0;
      },
      read: (c) => ({ speed: [c.speed, 2.2572106680591424], spring: [c.spring, 10] }),
    },
    {
      tag: 'halfway up',
      lab: 'collar',
      scenario: 'smooth',
      setup(s) {
        s.mass = 2;
        s.k = 80;
        s.theta = 30;
        s.mu = 0;
        s.x1 = 0.5;
        s.x2 = 0.25;
        s.v1 = 0;
      },
      read: (c) => ({ speed: [c.speed, 2.25], spring: [c.spring, 7.5], gravity: [c.gravity, -2.45] }),
    },
  ],
  s2: [
    {
      tag: 'out and back',
      lab: 'collar',
      scenario: 'return',
      setup(s) {
        s.mass = 2;
        s.k = 50;
        s.theta = 25;
        s.mu = 0.2;
        s.x1 = 0.2;
        s.x2 = 0.2;
        s.xFar = 0.6;
        s.v1 = 4;
      },
      read: (c) => ({ spring: [c.spring, 0], direct: [c.direct, 0], speed: [c.speed, 3.6269709944986532] }),
    },
  ],
  s3: [
    {
      tag: 'a rough slide',
      lab: 'collar',
      scenario: 'rough',
      setup(s) {
        s.mass = 2;
        s.k = 80;
        s.theta = 30;
        s.mu = 0.2;
        s.x1 = 0.5;
        s.x2 = 0;
        s.v1 = 0;
      },
      read: (c) => ({ speed: [c.speed, 1.8427854345460113], friction: [c.friction, -1.699141842225069] }),
    },
  ],
  s5: [
    {
      tag: 'three paths',
      lab: 'paths',
      scenario: 'smooth',
      setup(s) {
        s.mass = 1.2;
        s.k = 20;
        s.mu = 0;
        s.rise = 0.35;
        s.ax = 0.2;
        s.ay = 1;
        s.bx = 1.4;
        s.by = 0.4;
      },
      read: (c) => ({ workLine: [c.workLine, -3.7367999999999997], potential: [c.potential, -3.7367999999999952] }),
    },
    {
      tag: 'friction on the arch',
      lab: 'paths',
      scenario: 'rough',
      setup(s) {
        s.mass = 1.2;
        s.k = 20;
        s.mu = 0.25;
        s.rise = 0.35;
        s.ax = 0.2;
        s.ay = 1;
        s.bx = 1.4;
        s.by = 0.4;
      },
      read: (c) => ({ workLine: [c.workLine, -7.685248834669128], workArch: [c.workArch, -8.203987604003883] }),
    },
  ],
  s6: [
    { tag: 'a hop-test vehicle', lab: 'landing', scenario: 'hopper', read: (c) => ({ need: [c.need, 0.25], a: [c.a, 18], t: [c.tStop, 0.167] }) },
    { tag: 'a lunar touchdown', lab: 'landing', scenario: 'lunar', read: (c) => ({ need: [c.need, 0.2], a: [c.a, 10] }) },
    { tag: 'a hard landing', lab: 'landing', scenario: 'hard', read: (c) => ({ need: [c.need, 0.5625], hit: [c.vHit, 3.07] }) },
  ],
};

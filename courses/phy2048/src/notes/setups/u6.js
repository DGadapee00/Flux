/** Unit 6 worked examples the labs can show. `tag` matches the text after "Worked example · ". */
const brakeT = 220 / 300;
const flyT = Math.sqrt((32 * Math.PI) / 0.4);

export default {
  s2: [
    {
      tag: 'a fishing reel spun up from rest',
      lab: 'rotor',
      scenario: 'reel',
      read: (c) => ({ omega: [c.omega, 220], theta: [c.theta, 220], revs: [c.revs, 35.01] }),
    },
    {
      tag: 'a reel brought to a stop',
      lab: 'rotor',
      scenario: 'disk',
      setup: (s) => {
        Object.assign(s, { shape: 'disk', m: 2, R: 0.2, F: -60, phi: 90, w0: 220, t: brakeT, rider: 0, riderAt: 0 });
      },
      read: (c) => ({ tStop: [c.tStop, 0.7333], omega: [c.omega, 0] }),
    },
  ],
  s3: [
    {
      tag: 'a centrifuge one second from rest',
      lab: 'rotor',
      scenario: 'centrifuge',
      read: (c) => ({ at: [c.at, -6.981], ac: [c.ac, 243.7], a: [c.a, 243.8] }),
    },
  ],
  s4: [
    {
      tag: 'the blades of a rescue helicopter',
      lab: 'helicopter-rotor',
      scenario: 'book',
      read: (c) => ({ I: [c.I, 1067], Krot: [c.Krot, 5.264e5], Ktrans: [c.Ktrans, 2.000e5], ratio: [c.ratio, 0.380] }),
    },
  ],
  s5: [
    {
      tag: 'a rod about its end',
      lab: 'inertia',
      scenario: 'end',
      setup: (s) => { Object.assign(s, { shape: 'rod', axis: 'end', m: 2, L: 0.5 }); },
      read: (c) => ({ Icm: [c.Icm, 0.04167], Iend: [c.Iend, 0.1667] }),
    },
    {
      tag: 'a rod with a sphere on the end',
      lab: 'inertia',
      scenario: 'far',
      read: (c) => ({ Ifar: [c.Ifar, 0.6727], Inear: [c.Inear, 0.2227] }),
    },
  ],
  s6: [
    {
      tag: 'a force perpendicular to its lever arm',
      lab: 'rotor',
      scenario: 'disk',
      setup: (s) => { Object.assign(s, { shape: 'disk', m: 2, R: 4, F: 40, phi: 90, w0: 0, t: 1, rider: 0, riderAt: 0 }); },
      read: (c) => ({ tau: [c.tau, 160] }),
    },
    {
      tag: 'a force at 53 degrees',
      lab: 'rotor',
      scenario: 'disk',
      setup: (s) => { Object.assign(s, { shape: 'disk', m: 2, R: 5, F: 30, phi: 53, w0: 0, t: 1, rider: 0, riderAt: 0 }); },
      read: (c) => ({ tau: [c.tau, 119.8] }),
    },
  ],
  s7: [
    {
      tag: 'two masses on a disk pulley',
      lab: 'massive-pulley',
      scenario: 'disk',
      read: (c) => ({ a: [c.a, 3.924], T1: [c.T1, 13.73], T2: [c.T2, 17.66] }),
    },
    {
      tag: 'a child on a merry-go-round',
      lab: 'rotor',
      scenario: 'child',
      read: (c) => ({ alphaBare: [c.alphaBare, 6.667], alpha: [c.alpha, 4.444] }),
    },
  ],
  s8: [
    {
      tag: 'a rope pulled through one metre',
      lab: 'rotor',
      scenario: 'disk',
      setup: (s) => { Object.assign(s, { shape: 'disk', m: 0.5, R: 0.1, F: 50, phi: 90, w0: 0, t: 0.1, rider: 0, riderAt: 0 }); },
      read: (c) => ({ omega: [c.omega, 200], W: [c.W, 50] }),
    },
    {
      tag: 'a flywheel spun from rest',
      lab: 'rotor',
      scenario: 'disk',
      setup: (s) => { Object.assign(s, { shape: 'disk', m: 60, R: 1, F: 12, phi: 90, w0: 0, t: flyT, rider: 0, riderAt: 0 }); },
      read: (c) => ({ omega: [c.omega, 6.341], W: [c.W, 603.2] }),
    },
  ],
};

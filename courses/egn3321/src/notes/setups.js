/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */

export const SETUPS = {
  u1: {
    s2: [
      {
        tag: 'a reversal',
        lab: 'rectilinear',
        scenario: 'brake',
        setup(s) {
          s.s0 = 0;
          s.v0 = 4;
          s.pieces = [{ t0: 0, t1: 5, coeff: [-2] }];
          s.t = 5;
          s.tEnd = 5;
        },
        read: (c) => ({ s: [c.s, -5], v: [c.v, -6], distance: [c.distance, 13] }),
      },
    ],
    s3: [
      {
        tag: 'three steps',
        lab: 'rectilinear',
        scenario: 'two',
        setup(s) {
          s.s0 = 0;
          s.v0 = 0;
          s.pieces = [
            { t0: 0, t1: 3, coeff: [2] },
            { t0: 3, t1: 5, coeff: [-1] },
            { t0: 5, t1: 6, coeff: [0] },
          ];
          s.t = 6;
          s.tEnd = 6;
        },
        read: (c) => ({ s: [c.s, 23], v: [c.v, 4] }),
      },
    ],
    s5: [
      {
        tag: 'a parabola',
        lab: 'path-nt',
        scenario: 'parabola',
        setup(s) {
          s.shape = 'parabola';
          s.c = 1;
          s.x = 2;
          s.speed = 3;
          s.at = 0;
        },
        read: (c) => ({ rho: [c.rho, 11.18], an: [c.an, 0.805] }),
      },
    ],
    s6: [
      {
        tag: 'two velocities',
        lab: 'relative',
        scenario: 'cross',
        setup(s) {
          s.vax = 3;
          s.vay = 1;
          s.vbx = 1;
          s.vby = 4;
          s.aax = 0;
          s.aay = 0;
          s.abx = 0;
          s.aby = 0;
        },
        read: (c) => ({ vx: [c.vx, -2], vy: [c.vy, 3], speed: [c.speed, 3.61] }),
      },
    ],
  },
  u2: {
    s1: [
      {
        tag: 'a heavier side',
        lab: 'fma',
        scenario: 'atwood',
        setup(s) {
          s.m1 = 2;
          s.m2 = 4;
          s.v0 = 0;
          s.t = 0;
        },
        read: (c) => ({ a: [c.a, 3.27], T: [c.T, 26.16] }),
      },
    ],
    s2: [
      {
        tag: 'a block that slides',
        lab: 'fma',
        scenario: 'incline',
        setup(s) {
          s.block = 3;
          s.theta = 30;
          s.mus = 0.2;
          s.muk = 0.15;
          s.v0 = 0;
          s.t = 0;
        },
        read: (c) => ({ a: [c.a, 3.6306436183311974], N: [c.N, 25.48712763337603] }),
      },
    ],
    s3: [
      {
        tag: 'a hanging tow',
        lab: 'fma',
        scenario: 'tow',
        setup(s) {
          s.block = 4;
          s.hang = 6;
          s.theta = 30;
          s.mus = 0.3;
          s.muk = 0.2;
          s.v0 = 0;
          s.t = 0;
        },
        read: (c) => ({ a: [c.a, 3.2443432631099727], T: [c.T, 39.39394042134017] }),
      },
    ],
    s4: [
      {
        tag: 'no friction',
        lab: 'curve',
        scenario: 'bank',
        setup(s) {
          s.mass = 1200;
          s.radius = 40;
          s.theta = 20;
          s.mu = 0;
        },
        read: (c) => ({ v: [c.vDesign, 11.950812521584371] }),
      },
    ],
    s5: [
      {
        tag: 'the top of the loop',
        lab: 'curve',
        scenario: 'loop',
        setup(s) {
          s.mass = 0.5;
          s.radius = 0.4;
          s.vb = 5;
          s.phi = 180;
        },
        read: (c) => ({ N: [c.N, 6.724999999999997], speed: [c.speed, 3.0502458917274193] }),
      },
    ],
  },
  u3: {
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
  },
  u4: {
    s1: [
      {
        tag: 'equal areas',
        lab: 'impulse',
        scenario: 'pair',
        setup(s) {
          s.mass = 2;
          s.v0 = 0;
          s.f1 = 100;
          s.s1 = 0;
          s.t1 = 0.4;
          s.f2 = 40;
          s.t2 = 1;
        },
        read: (c) => ({ j1: [c.j1, 40], j2: [c.j2, 40], dv: [c.dv, 40], v: [c.v, 40] }),
      },
      {
        tag: 'a short pulse',
        lab: 'impulse',
        scenario: 'short',
        setup(s) {
          s.mass = 2;
          s.v0 = 0;
          s.f1 = 400;
          s.s1 = 0;
          s.t1 = 0.1;
          s.f2 = 20;
          s.t2 = 1;
        },
        read: (c) => ({ j1: [c.j1, 40], j2: [c.j2, 20], dv: [c.dv, 30], v: [c.v, 30] }),
      },
    ],
    s3: [
      {
        tag: 'a direct collision',
        lab: 'impact',
        scenario: 'central',
        setup(s) {
          s.m1 = 1;
          s.m2 = 1;
          s.u1 = 4;
          s.u2 = 0;
          s.e = 0.5;
          s.theta = 0;
        },
        read: (c) => ({ vn1: [c.vn1, 1], vn2: [c.vn2, 3], loss: [c.loss, 3] }),
      },
      {
        tag: 'they stick',
        lab: 'impact',
        scenario: 'stick',
        setup(s) {
          s.m1 = 1;
          s.m2 = 3;
          s.u1 = 8;
          s.u2 = 0;
          s.e = 0;
          s.theta = 0;
        },
        read: (c) => ({ vn1: [c.vn1, 2], vn2: [c.vn2, 2], loss: [c.loss, 24] }),
      },
    ],
    s4: [
      {
        tag: 'the tangent is unchanged',
        lab: 'impact',
        scenario: 'oblique',
        setup(s) {
          s.m1 = 2;
          s.m2 = 2;
          s.u1 = 4;
          s.u2 = 0;
          s.e = 1;
          s.theta = 30;
        },
        read: (c) => ({
          vt1: [c.vt1, 2],
          vn1: [c.vn1, 0],
          vn2: [c.vn2, 4 * Math.cos(30 * Math.PI / 180)],
          loss: [c.loss, 0],
        }),
      },
    ],
    s6: [
      {
        tag: 'a coasting burn',
        lab: 'rocket',
        scenario: 'coast',
        setup(s) {
          s.m0 = 200;
          s.mf = 80;
          s.ve = 1500;
          s.mdot = 40;
          s.g = 0;
        },
        read: (c) => ({
          dv: [c.dv, 1500 * Math.log(2.5)],
          burned: [c.burned, 120],
          ratio: [c.ratio, 2.5],
        }),
      },
      {
        tag: 'the same mass burned',
        lab: 'rocket',
        scenario: 'heavy',
        setup(s) {
          s.m0 = 400;
          s.mf = 280;
          s.ve = 1500;
          s.mdot = 40;
          s.g = 0;
        },
        read: (c) => ({
          dv: [c.dv, 1500 * Math.log(400 / 280)],
          burned: [c.burned, 120],
          ratio: [c.ratio, 400 / 280],
        }),
      },
      {
        tag: 'gravity during the burn',
        lab: 'rocket',
        scenario: 'gravity',
        setup(s) {
          s.m0 = 200;
          s.mf = 80;
          s.ve = 1500;
          s.mdot = 40;
          s.g = 9.81;
        },
        read: (c) => ({ dv: [c.dv, 1500 * Math.log(2.5) - 9.81 * 3] }),
      },
    ],
  },
};

/** An example's tag as the notes write it, without "Worked example · ". */
export function exampleTag(tagText) {
  return tagText.replace(/^\s*Worked examples?\s*(·\s*)?/, '').trim();
}

/** Index of each tag's setup, or −1 when that example has no lab setup. */
export function matchExamples(exam, sectionId, tags) {
  const list = setupsFor(exam, sectionId);
  let untagged = -1;
  return tags.map((raw) => {
    const tag = exampleTag(raw);
    if (!tag) untagged++;
    return list.findIndex((ex) => (tag ? ex.tag === tag : ex.tag == null && ex.n === untagged));
  });
}

export function setupsFor(exam, sectionId) {
  return SETUPS[exam]?.[sectionId] || [];
}

/** Reset the slice to the example's scenario, then write its numbers. */
export function applyExample(lab, slice, ex) {
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  const id = ex.scenario ?? list[0]?.id;
  if (id != null && lab.applyScenario) lab.applyScenario(id, slice);
  ex.setup?.(slice);
  slice.dirty = true;
}

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

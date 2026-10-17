/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */

export const SETUPS = {
  u1: {
    s2: [
      {
        tag: 'a jump',
        lab: 'limits',
        scenario: 'jump',
        setup(s) {
          s.a = 1;
          s.leftValue = 2;
          s.rightValue = 4;
        },
        read: (c) => ({ left: [c.left, 2], right: [c.right, 4], exists: [c.exists ? 1 : 0, 0] }),
      },
      {
        tag: 'a sign change',
        lab: 'limits',
        scenario: 'sign',
        setup(s) {
          s.a = 0;
        },
        read: (c) => ({ left: [c.left, -1], right: [c.right, 1] }),
      },
    ],
    s3: [
      {
        tag: 'a hole at 3',
        lab: 'limits',
        scenario: 'hole',
        setup(s) {
          s.a = 3;
        },
        read: (c) => ({ limit: [c.limit, 6] }),
      },
    ],
    s4: [
      {
        tag: 'a removable hole',
        lab: 'limits',
        scenario: 'hole',
        setup(s) {
          s.a = 2;
        },
        read: (c) => ({ limit: [c.limit, 4] }),
      },
    ],
    s5: [
      {
        tag: 'a delta for 3x',
        lab: 'limits',
        scenario: 'line',
        setup(s) {
          s.a = 1;
          s.m = 3;
          s.eps = 0.3;
        },
        read: (c) => ({ limit: [c.limit, 3], delta: [c.delta, 0.1] }),
      },
    ],
  },
  u2: {
    s1: [
      {
        tag: 'a shrinking secant',
        lab: 'secant',
        scenario: 'quad',
        setup(s) {
          s.x0 = 1;
          s.h = 0.4;
        },
        read: (c) => ({ msec: [c.msec, 2.4], fp: [c.fp, 2] }),
      },
      {
        tag: 'a corner',
        lab: 'secant',
        scenario: 'abs',
        setup(s) {
          s.x0 = 0;
          s.h = 0.4;
        },
        read: (c) => ({ left: [c.left, -1], right: [c.right, 1] }),
      },
    ],
    s2: [
      {
        tag: 'secant on a cubic',
        lab: 'secant',
        scenario: 'cube',
        setup(s) {
          s.x0 = 1;
          s.h = 0.4;
        },
        read: (c) => ({ msec: [c.msec, 4.36], fp: [c.fp, 3] }),
      },
    ],
    s4: [
      {
        tag: 'the slope of sine at π/3',
        lab: 'secant',
        scenario: 'sine',
        setup(s) {
          s.x0 = Math.PI / 3;
          s.h = 0.4;
        },
        read: (c) => ({ msec: [c.msec, 0.316], fp: [c.fp, 0.5] }),
      },
    ],
    s6: [
      {
        tag: 'the ladder at 6 ft',
        lab: 'rates',
        scenario: 'mid',
        setup(s) {
          s.x = 6;
          s.v = 2;
        },
        read: (c) => ({ y: [c.y, 8], dy: [c.dy, -1.5] }),
      },
      {
        tag: 'the ladder at 2 ft',
        lab: 'rates',
        scenario: 'steep',
        setup(s) {
          s.x = 2;
          s.v = 2;
        },
        read: (c) => ({ y: [c.y, 9.8], dy: [c.dy, -0.408] }),
      },
    ],
  },
};

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

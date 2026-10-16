/**
 * Worked examples the limits lab can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */

export const SETUPS = {
  u1: {
    s2: [
      {
        tag: 'a hole at 2',
        lab: 'limits',
        scenario: 'hole',
        setup(s) {
          s.kind = 'hole';
          s.a = 2;
          s.h = 0.4;
        },
        read: (c) => ({ left: [c.left, 4], right: [c.right, 4], limit: [c.limit, 4] }),
      },
      {
        tag: 'sides that disagree',
        lab: 'limits',
        scenario: 'jump',
        setup(s) {
          s.kind = 'jump';
          s.a = 0;
          s.leftValue = 0;
          s.rightValue = 1;
          s.h = 0.4;
        },
        read: (c) => ({ left: [c.left, 0], right: [c.right, 1] }),
      },
    ],
    s5: [
      {
        tag: 'a line of slope 2',
        lab: 'limits',
        scenario: 'line',
        setup(s) {
          s.kind = 'line';
          s.a = 0;
          s.m = 2;
          s.eps = 0.5;
          s.h = 0.2;
        },
        read: (c) => ({ delta: [c.delta, 0.25], limit: [c.limit, 0] }),
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

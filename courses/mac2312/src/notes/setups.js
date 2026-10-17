/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */

export const SETUPS = {
  u1: {
    s2: [
      {
        tag: 'disks under a root',
        lab: 'solids',
        scenario: 'disks',
        setup(s) {
          s.b = 4;
        },
        read: (c) => ({ disk: [c.disk, 8 * Math.PI], overPi: [c.overPi, 8] }),
      },
    ],
    s3: [
      {
        tag: 'the same solid by shells',
        lab: 'solids',
        scenario: 'both',
        setup(s) {
          s.b = 4;
        },
        read: (c) => ({ shell: [c.shell, 8 * Math.PI], disk: [c.disk, 8 * Math.PI] }),
      },
    ],
    s4: [
      {
        tag: 'a parabola to x = 1',
        lab: 'arc',
        scenario: 'parabola',
        setup(s) {
          s.b = 1;
        },
        read: (c) => ({ length: [c.length, 1.479], chord: [c.chord, 1.414] }),
      },
      {
        tag: 'a parabola to x = 2',
        lab: 'arc',
        scenario: 'parabola',
        setup(s) {
          s.b = 2;
        },
        read: (c) => ({ length: [c.length, 4.647], chord: [c.chord, 4.472] }),
      },
      {
        tag: 'a line, by both routes',
        lab: 'arc',
        scenario: 'line',
        setup(s) {
          s.b = 1;
        },
        read: (c) => ({ length: [c.length, Math.SQRT2], chord: [c.chord, Math.SQRT2] }),
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

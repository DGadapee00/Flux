/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */
import { R_WATER, fromC, mixP, toC, waterTP } from '@flux/subjects/thermo';

const onIsobar = (p, tC) => (s) => {
  s.p = p;
  s.h = waterTP(fromC(tC), p).h;
};

export const SETUPS = {
  u1: {
    s1: [
      {
        tag: 'which phase',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(500e3, 120),
        read: (c) => ({ T: [toC(c.T), 120], h: [c.h / 1e3, 504.0] }),
      },
    ],
    s2: [
      {
        tag: 'a tank with two phases',
        lab: 'phase',
        scenario: 'tank',
        setup(s) {
          s.T = fromC(151);
          s.v = 0.05;
        },
        read: (c) => ({ x: [c.x, 0.1281], p: [c.p / 1e3, 489.0] }),
      },
      {
        tag: 'two rigid tanks',
        lab: 'phase',
        scenario: 'tank',
        setup(s) {
          s.T = fromC(140);
        },
        read: (c) => ({ x: [c.x, 0.667], p: [c.p / 1e3, 361.5] }),
      },
      {
        tag: 'halfway through boiling',
        lab: 'phase',
        scenario: 'boil',
        setup(s) {
          s.p = 100e3;
          s.h = mixP(100e3, 0.5).h;
        },
        read: (c) => ({ v: [c.v, 0.8475], h: [c.h / 1e3, 1546] }),
      },
    ],
    s3: [
      {
        tag: 'interpolating twice',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(0.9e6, 275),
        read: (c) => ({ v: [c.v, 0.2736], h: [c.h / 1e3, 3001] }),
      },
      {
        tag: 'the liquid shortcut',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(500e3, 120),
        read: (c) => ({ h: [c.h / 1e3, 504.0], v: [c.v, 0.0010602] }),
      },
    ],
    s5: [
      {
        tag: 'steam at 3 MPa',
        lab: 'phase',
        scenario: 'boil',
        setup: onIsobar(3e6, 300),
        read: (c) => ({ v: [c.v, 0.08118], Z: [(c.p * c.v) / (R_WATER * 1e3 * c.T), 0.9206] }),
      },
    ],
  },
  u2: {
    s2: [
      {
        tag: 'expansion at constant pressure',
        lab: 'piston',
        scenario: 'isobaric',
        read: (c) => ({ W: [c.W / 1e3, 10.0], Q: [c.Q / 1e3, 35.64], T2: [toC(c.T2), 327.1] }),
      },
      {
        tag: 'expansion at constant temperature',
        lab: 'piston',
        scenario: 'isothermal',
        read: (c) => ({ W: [c.W / 1e3, 8.789], Q: [c.Q / 1e3, 8.789] }),
      },
    ],
    s3: [
      {
        tag: 'a polytropic expansion',
        lab: 'piston',
        scenario: 'polytropic',
        read: (c) => ({ p2: [c.p2 / 1e3, 164.9], W: [c.W / 1e3, 11.34], T2: [toC(c.T2), 122.8], Q: [c.Q / 1e3, 2.534] }),
      },
    ],
    s5: [
      {
        tag: 'boiling in a piston–cylinder',
        lab: 'piston',
        scenario: 'steam',
        read: (c) => ({ W: [c.W / 1e3, 21.04], Q: [c.Q / 1e3, 237.4], x2: [c.x2, 0.4252], T2: [toC(c.T2), 151.8] }),
      },
      {
        tag: 'past the dome',
        lab: 'piston',
        scenario: 'steam',
        setup(s) {
          s.m = 1;
          s.x1 = 0.4;
          s.V2 = 0.4986;
        },
        read: (c) => ({ W: [c.W / 1e3, 174.0], Q: [c.Q / 1e3, 1530] }),
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

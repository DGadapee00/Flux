/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */
import { M_PER_IN } from '@flux/subjects/convert.js';
const ROD = (Math.PI * 0.02 ** 2) / 4;

export const SETUPS = {
  u1: {
    s2: [
      {
        tag: 'a rod in tension',
        lab: 'cut',
        scenario: 'square',
        setup(s) {
          s.P = 20e3;
          s.A = ROD;
        },
        read: (c) => ({ sigma: [c.sigma / 1e6, 63.66] }),
      },
    ],
    s3: [
      {
        tag: 'the 30° cut',
        lab: 'cut',
        scenario: 'tension',
        read: (c) => ({ sigma: [c.sigma / 1e6, 75.0], tau: [c.tau / 1e6, 43.3], area: [c.areaCut * 1e6, 230.9] }),
      },
    ],
    s4: [
      {
        tag: "the lab's truss",
        lab: 'truss-stress',
        scenario: 'even',
        read: (c) => ({ BC: [c.stresses.BC / 1e6, 83.33], FD: [c.stresses.FD / 1e6, -117.9], section: [c.section.BC / 1e3, 33.33] }),
      },
      {
        tag: 'a thin web',
        lab: 'truss-stress',
        scenario: 'thin-web',
        read: (c) => ({ CF: [c.stresses.CF / 1e6, 133.3], Fmax: [c.Fmax / 1e3, 47.14] }),
      },
    ],
    s5: [
      {
        tag: 'from one plane to two',
        lab: 'pins',
        scenario: 'single',
        read: (c) => ({ tau: [c.tau / 1e6, 88.42], bearing: [c.bearBar / 1e6, 69.44] }),
      },
      {
        tag: 'a thin bar',
        lab: 'pins',
        scenario: 'thin',
        read: (c) => ({ P: [c.Pallow / 1e3, 12.0], bearing: [c.bearBar / 1e6, 166.7] }),
      },
    ],
    s6: [
      {
        tag: 'the 1/2 in shackle',
        lab: 'shackle',
        scenario: 'wll',
        read: (c) => ({ tau: [c.tauKsi, 7.06] }),
      },
      {
        tag: 'the proof load',
        lab: 'shackle',
        scenario: 'proof',
        read: (c) => ({ tau: [c.tauKsi, 14.12] }),
      },
    ],
    s7: [
      {
        tag: 'sizing the chords',
        lab: 'truss-stress',
        scenario: 'even',
        read: (c) => ({ A: [c.AcNeed * 1e6, 377.1] }),
      },
    ],
  },
  u2: {
    s1: [
      {
        tag: 'a measured stretch',
        lab: 'tension-test',
        scenario: 'steel',
        setup(s) {
          s.material = 'steel';
          s.eps = 0.001;
          s.unload = 0;
        },
        read: (c) => ({ eps: [c.eps * 1e3, 1] }),
      },
    ],
    s2: [
      {
        tag: 'on the elastic line',
        lab: 'tension-test',
        scenario: 'steel',
        setup(s) {
          s.material = 'steel';
          s.eps = 0.0005;
          s.unload = 0;
        },
        read: (c) => ({ stress: [c.stress / 1e6, 100] }),
      },
      {
        tag: 'the brace at 8 kip',
        lab: 'brace',
        scenario: 'service',
        read: (c) => ({ delta: [c.delta / M_PER_IN, 0.0749] }),
      },
    ],
    s3: [
      {
        tag: 'steel at one millistrain',
        lab: 'poisson',
        scenario: 'steel',
        read: (c) => ({ lat: [c.lateral * 1e6, -300], vol: [c.linear * 1e6, 400] }),
      },
    ],
    s4: [
      {
        tag: 'the offset yield',
        lab: 'tension-test',
        scenario: 'alum',
        setup(s) {
          s.material = 'alum';
          s.eps = 276e6 / 68.9e9 + 0.002;
          s.unload = 0;
        },
        read: (c) => ({ stress: [c.stress / 1e6, 276] }),
      },
      {
        tag: 'energy up to yield',
        lab: 'tension-test',
        scenario: 'steel',
        setup(s) {
          s.material = 'steel';
          s.eps = 250e6 / 200e9;
          s.unload = 0;
        },
        read: (c) => ({ energy: [c.energy / 1e3, 156.3] }),
      },
      {
        tag: 'unloading from 10 millistrain',
        lab: 'tension-test',
        scenario: 'yielded',
        setup(s) {
          s.material = 'steel';
          s.eps = 0.01;
          s.unload = 0;
        },
        read: (c) => ({ set: [c.set * 1e6, 8310], stress: [c.stress / 1e6, 338] }),
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

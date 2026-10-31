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
  u2: {
    s5: [
      {
        tag: 'four panels on sine',
        lab: 'numint',
        scenario: 'coarse',
        setup(s) {
          s.n = 4;
        },
        read: (c) => ({ trap: [c.trap, 1.8961], simp: [c.simp, 2.00456], trapErr: [c.trapErr, 0.1039], simpErr: [c.simpErr, 0.00456] }),
      },
      {
        tag: 'doubling the panels',
        lab: 'numint',
        scenario: 'mid',
        setup(s) {
          s.n = 8;
        },
        read: (c) => ({ trapErr: [c.trapErr, 0.0258], simpErr: [c.simpErr, 0.000269] }),
      },
    ],
    s6: [
      {
        tag: 'the tail of 1 over x squared',
        lab: 'improper',
        scenario: 'mid',
        setup(s) {
          s.b = 4;
        },
        read: (c) => ({ area: [c.area, 0.75], tail: [c.tail, 0.25] }),
      },
    ],
  },
  u3: {
    s2: [
      {
        tag: 'eight halvings',
        lab: 'series',
        scenario: 'geom',
        setup(s) {
          s.n = 8;
        },
        read: (c) => ({ sn: [c.sn, 1.9921875], limit: [c.limit, 2] }),
      },
    ],
    s3: [
      {
        tag: 'the harmonic series',
        lab: 'series',
        scenario: 'harm',
        setup(s) {
          s.n = 8;
        },
        read: (c) => ({ sn: [c.sn, 2.718] }),
      },
    ],
    s5: [
      {
        tag: 'eight alternating terms',
        lab: 'series',
        scenario: 'alt',
        setup(s) {
          s.n = 8;
        },
        read: (c) => ({ sn: [c.sn, 0.6345], limit: [c.limit, 0.6931] }),
      },
    ],
    s7: [
      {
        tag: 'the tangent line to sine',
        lab: 'taylor',
        scenario: 'line',
        setup(s) {
          s.n = 1;
          s.a = 0;
          s.x = 0.5;
        },
        read: (c) => ({ poly: [c.poly, 0.5], f: [c.f, 0.47943], err: [c.err, 0.0206] }),
      },
      {
        tag: 'order five',
        lab: 'taylor',
        scenario: 'fifth',
        setup(s) {
          s.n = 5;
          s.a = 0;
          s.x = 0.5;
        },
        read: (c) => ({ poly: [c.poly, 0.479427], err: [c.err, 1.54e-6] }),
      },
      {
        tag: 'a centre at π/2',
        lab: 'taylor',
        scenario: 'shift',
        setup(s) {
          s.n = 2;
          s.a = Math.PI / 2;
          s.x = Math.PI / 2 + 0.4;
        },
        read: (c) => ({ poly: [c.poly, 0.92], f: [c.f, 0.92106] }),
      },
    ],
  },
  u4: {
    s1: [
      {
        tag: 'a point on the unit circle',
        lab: 'parametric',
        scenario: 'circle',
        setup(s) {
          s.k = 1;
        },
        read: (c) => ({ x: [c.x, 0.7071], y: [c.y, 0.7071] }),
      },
    ],
    s2: [
      {
        tag: 'the slope at π/4',
        lab: 'parametric',
        scenario: 'circle',
        setup(s) {
          s.k = 1;
        },
        read: (c) => ({ slope: [c.slope, -1], speed: [c.speed, 1] }),
      },
      {
        tag: 'a parabola traced to t = 1',
        lab: 'parametric',
        scenario: 'para',
        setup(s) {
          s.k = 4;
        },
        read: (c) => ({ length: [c.length, 1.479], slope: [c.slope, 2], speed: [c.speed, 2.236] }),
      },
    ],
    s4: [
      {
        tag: 'the unit disk',
        lab: 'polar',
        scenario: 'disk',
        setup(s) {
          s.k = 4;
        },
        read: (c) => ({ area: [c.area, Math.PI], naive: [c.naive, 2 * Math.PI] }),
      },
      {
        tag: 'the cardioid',
        lab: 'polar',
        scenario: 'card',
        setup(s) {
          s.k = 4;
        },
        read: (c) => ({ area: [c.area, 4.712], naive: [c.naive, 6.283] }),
      },
      {
        tag: 'the shifted circle',
        lab: 'polar',
        scenario: 'shift',
        setup(s) {
          s.k = 4;
        },
        read: (c) => ({ area: [c.area, Math.PI], naive: [c.naive, 4] }),
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

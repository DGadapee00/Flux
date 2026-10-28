/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */
import { M_PER_IN, PA_PER_PSI } from '@flux/subjects/convert.js';
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
  u3: {
    s1: [
      {
        tag: 'a uniform bar at 20 kN',
        lab: 'axial',
        scenario: 'uniform',
        read: (c) => ({ delta: [c.delta * 1e3, 0.7] }),
      },
    ],
    s2: [
      {
        tag: 'the stepped bar',
        lab: 'axial',
        scenario: 'step',
        read: (c) => ({ delta: [c.delta * 1e3, 0.613], Nmax: [c.Nmax / 1e3, 32] }),
      },
      {
        tag: 'the tapered bar',
        lab: 'axial',
        scenario: 'taper',
        read: (c) => ({ delta: [c.delta * 1e3, 0.1432] }),
      },
    ],
    s3: [
      {
        tag: 'the load near the left wall',
        lab: 'indeterminate',
        scenario: 'left',
        read: (c) => ({ left: [c.left / 1e3, 16], right: [c.right / 1e3, 4] }),
      },
      {
        tag: 'the load at midspan',
        lab: 'indeterminate',
        scenario: 'mid',
        read: (c) => ({ left: [c.left / 1e3, 10], right: [c.right / 1e3, 10] }),
      },
    ],
    s4: [
      {
        tag: 'a held rail at +30 °C',
        lab: 'rail',
        scenario: 'summer',
        read: (c) => ({ stress: [c.stress / 1e6, -70.2], free: [c.free * 1e3, 7.02] }),
      },
      {
        tag: 'the same rail in ksi',
        lab: 'rail',
        scenario: 'summer',
        setup(s) {
          s.gap = 0;
          s.L = 20;
          s.dT = 50 / 1.8;
        },
        read: (c) => ({ stress: [c.stress / (1000 * PA_PER_PSI), -9.43] }),
      },
    ],
    s5: [
      {
        tag: 'the gap still open',
        lab: 'rail',
        scenario: 'joint',
        read: (c) => ({ stress: [c.stress / 1e6, 0], free: [c.free * 1e3, 4.68] }),
      },
      {
        tag: 'past the closing temperature',
        lab: 'rail',
        scenario: 'joint',
        setup(s) {
          s.dT = 40;
        },
        read: (c) => ({ stress: [c.stress / 1e6, -33.6], closeAt: [c.closeAt, 25.6] }),
      },
    ],
  },
  u4: {
    s1: [
      {
        tag: 'a closed cylinder at 2 MPa',
        lab: 'vessel',
        scenario: 'cylinder',
        read: (c) => ({ hoop: [c.hoop / 1e6, 80], axial: [c.axial / 1e6, 40] }),
      },
      {
        tag: 'the thinner cylinder',
        lab: 'vessel',
        scenario: 'thin',
        read: (c) => ({ hoop: [c.hoop / 1e6, 200], axial: [c.axial / 1e6, 100] }),
      },
    ],
    s2: [
      {
        tag: 'the sphere at the same pressure',
        lab: 'vessel',
        scenario: 'sphere',
        read: (c) => ({ hoop: [c.hoop / 1e6, 40] }),
      },
    ],
    s3: [
      {
        tag: 'service pressure on the minimum wall',
        lab: 'tank',
        scenario: 'service',
        read: (c) => ({ hoop: [c.hoop / (1000 * PA_PER_PSI), 18.53], axial: [c.axial / (1000 * PA_PER_PSI), 9.26] }),
      },
    ],
    s4: [
      {
        tag: 'uniaxial tension at 100 MPa',
        lab: 'strain3',
        scenario: 'uni',
        read: (c) => ({ ex: [c.ex * 1e3, 0.5], ey: [c.ey * 1e3, -0.15] }),
      },
      {
        tag: 'equal biaxial tension',
        lab: 'strain3',
        scenario: 'bi',
        read: (c) => ({ ex: [c.ex * 1e3, 0.35] }),
      },
      {
        tag: 'hydrostatic tension',
        lab: 'strain3',
        scenario: 'hydro',
        read: (c) => ({ ex: [c.ex * 1e3, 0.2], vol: [c.vol * 1e6, 600] }),
      },
    ],
    s5: [
      {
        tag: 'the gauge that reads 0.35 millistrain',
        lab: 'strain3',
        scenario: 'uni',
        setup(s) {
          s.sx = 100e6;
          s.sy = 100e6;
          s.sz = 0;
          s.nu = 0.3;
        },
        read: (c) => ({ sy: [c.sy / 1e6, 100], ex: [c.ex * 1e3, 0.35] }),
      },
    ],
  },
  u5: {
    s1: [
      {
        tag: 'turned to 45°',
        lab: 'mohr',
        scenario: 'general',
        setup(s) { s.theta = 45; },
        read: (c) => ({ sx: [c.sx / 1e6, 80], txy: [c.txy / 1e6, -30] }),
      },
    ],
    s2: [
      {
        tag: 'the principal stresses',
        lab: 'mohr',
        scenario: 'general',
        read: (c) => ({ s1: [c.s1 / 1e6, 92.4], s2: [c.s2 / 1e6, 7.57], thetaP: [c.thetaP, 22.5] }),
      },
    ],
    s3: [
      {
        tag: 'the circle radius',
        lab: 'mohr',
        scenario: 'general',
        read: (c) => ({ R: [c.R / 1e6, 42.4] }),
      },
    ],
    s4: [
      {
        tag: 'axial, bending and torque',
        lab: 'combined',
        scenario: 'both',
        read: (c) => ({ sx: [c.sx / 1e6, 71.6], txy: [c.txy / 1e6, 23.9], vm: [c.vm / 1e6, 82.7] }),
      },
    ],
    s5: [
      {
        tag: '600 lbf on each',
        lab: 'hitch',
        scenario: 'plan',
        read: (c) => ({
          tension: [c.tension / (1000 * PA_PER_PSI), 5.35],
          compression: [c.compression / (1000 * PA_PER_PSI), -6.88],
        }),
      },
      {
        tag: 'tongue load only',
        lab: 'hitch',
        scenario: 'straight',
        read: (c) => ({ axial: [c.axial / (1000 * PA_PER_PSI), -0.764] }),
      },
    ],
    s6: [
      {
        tag: 'torque alone',
        lab: 'combined',
        scenario: 'torque',
        read: (c) => ({ tresca: [c.tresca / 1e6, 63.7], vm: [c.vm / 1e6, 55.1] }),
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

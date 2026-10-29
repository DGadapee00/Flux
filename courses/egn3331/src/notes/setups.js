/**
 * Worked examples the labs can show. `tag` matches the notes after "Worked example · ".
 * `read` pairs a lab value with the number printed in the notes. notes-check allows 2%.
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
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
    s4: [
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
    s6: [
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
    s7: [
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
        tag: 'the 30° plane from the circle',
        lab: 'mohr',
        scenario: 'general',
        setup(s) { s.theta = 30; },
        read: (c) => ({ sx: [c.sx / 1e6, 91.0], txy: [c.txy / 1e6, -11.0] }),
      },
    ],
    s3: [
      {
        tag: 'the principal stresses',
        lab: 'mohr',
        scenario: 'general',
        read: (c) => ({ s1: [c.s1 / 1e6, 92.4], s2: [c.s2 / 1e6, 7.57], thetaP: [c.thetaP, 22.5] }),
      },
    ],
    s4: [
      {
        tag: 'the circle radius',
        lab: 'mohr',
        scenario: 'general',
        read: (c) => ({ R: [c.R / 1e6, 42.4] }),
      },
    ],
    s5: [
      {
        tag: 'a pressurised cylinder',
        lab: 'mohr',
        scenario: 'general',
        setup(s) {
          s.sx = 80e6;
          s.sy = 40e6;
          s.txy = 0;
        },
        read: (c) => ({ R: [c.R / 1e6, 20], tauAbs: [c.tauAbs / 1e6, 40] }),
      },
      {
        tag: "the lab's element and pure shear",
        lab: 'mohr',
        scenario: 'general',
        read: (c) => ({ R: [c.R / 1e6, 42.4], tauAbs: [c.tauAbs / 1e6, 46.2] }),
      },
    ],
    s6: [
      {
        tag: 'axial, bending and torque',
        lab: 'combined',
        scenario: 'both',
        read: (c) => ({ sx: [c.sx / 1e6, 71.6], txy: [c.txy / 1e6, 23.9], vm: [c.vm / 1e6, 82.7] }),
      },
    ],
    s7: [
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
    s8: [
      {
        tag: 'torque alone',
        lab: 'combined',
        scenario: 'torque',
        read: (c) => ({ tresca: [c.tresca / 1e6, 63.7], vm: [c.vm / 1e6, 55.1] }),
      },
    ],
    s9: [
      {
        tag: 'mixed tension and compression',
        lab: 'mohr',
        scenario: 'general',
        setup(s) {
          s.sx = 50e6;
          s.sy = -100e6;
          s.txy = 0;
        },
        read: (c) => ({ s1: [c.s1 / 1e6, 50], s2: [c.s2 / 1e6, -100] }),
      },
    ],
  },
  u6: {
    s1: [
      {
        tag: 'the midspan load',
        lab: 'diagrams',
        scenario: 'point',
        read: (c) => ({ Vmax: [c.Vmax / 1000, 5], Mmax: [c.Mmax / 1000, 10] }),
      },
      {
        tag: 'the load moved off centre',
        lab: 'diagrams',
        scenario: 'point',
        setup(s) {
          s.a = 1;
          s.x = 1;
        },
        read: (c) => ({ left: [c.left / 1000, 7.5], right: [c.right / 1000, 2.5], Mmax: [c.Mmax / 1000, 7.5] }),
      },
    ],
    s2: [
      {
        tag: 'the uniform load',
        lab: 'diagrams',
        scenario: 'uniform',
        read: (c) => ({ Mmax: [c.Mmax / 1000, 10], V: [c.V / 1000, 0], Vmax: [c.Vmax / 1000, 10] }),
      },
      {
        tag: 'the tip load',
        lab: 'diagrams',
        scenario: 'cantilever',
        read: (c) => ({ Mmax: [c.Mmax / 1000, -16], Vmax: [c.Vmax / 1000, 8] }),
      },
    ],
    s3: [
      {
        tag: 'an overhang',
        lab: 'diagrams',
        scenario: 'overhang',
        setup(s) {
          s.x = 1.375;
        },
        read: (c) => ({ left: [c.left / 1000, 5.5], right: [c.right / 1000, 15.5], M: [c.M / 1000, 3.78], Mhog: [c.Mhog / 1000, 10] }),
      },
      {
        tag: 'a couple on the span',
        lab: 'diagrams',
        scenario: 'couple',
        read: (c) => ({ left: [c.left / 1000, 1.5], right: [c.right / 1000, -1.5], Mhog: [c.Mhog / 1000, 4.5] }),
      },
    ],
    s4: [
      {
        tag: "the lab's rectangle, curved",
        lab: 'flexure',
        scenario: 'rect',
        read: (c) => ({ bot: [c.bot / 1e6, 46.9] }),
      },
    ],
    s5: [
      {
        tag: 'the 40 by 80 mm rectangle',
        lab: 'flexure',
        scenario: 'rect',
        read: (c) => ({ top: [c.top / 1e6, -46.9], bot: [c.bot / 1e6, 46.9] }),
      },
      {
        tag: 'twice the depth',
        lab: 'flexure',
        scenario: 'deep',
        read: (c) => ({ top: [c.top / 1e6, -11.72], bot: [c.bot / 1e6, 11.72] }),
      },
    ],
    s6: [
      {
        tag: 'the tee at 2 kN·m',
        lab: 'flexure',
        scenario: 'tee',
        read: (c) => ({ top: [c.top / 1e6, -20.5], bot: [c.bot / 1e6, 52.5], yBar: [c.yBar * 1000, 80.5] }),
      },
    ],
    s7: [
      {
        tag: 'the table span',
        lab: 'joist',
        scenario: 'table',
        read: (c) => ({
          stress: [c.stress / PA_PER_PSI, 916],
          moment: [c.moment / N_PER_LBF / M_PER_FT, 1633],
        }),
      },
      {
        tag: 'a 10 ft span',
        lab: 'joist',
        scenario: 'short',
        read: (c) => ({
          stress: [c.stress / PA_PER_PSI, 467],
          moment: [c.moment / N_PER_LBF / M_PER_FT, 833],
        }),
      },
      {
        tag: 'the nominal rectangle',
        lab: 'joist',
        scenario: 'nominal',
        read: (c) => ({ stress: [c.stress / PA_PER_PSI, 588] }),
      },
    ],
  },
  u7: {
    s1: [
      {
        tag: 'the 40 by 80 mm rectangle',
        lab: 'shear',
        scenario: 'rect',
        read: (c) => ({ tmax: [c.tmax / 1e6, 4.69] }),
      },
    ],
    s2: [
      {
        tag: '20 mm up',
        lab: 'shear',
        scenario: 'high',
        read: (c) => ({ tau: [c.tau / 1e6, 3.52] }),
      },
    ],
    s3: [
      {
        tag: 'the web at 20 kN',
        lab: 'shear',
        scenario: 'eye',
        read: (c) => ({ tau: [c.tau / 1e6, 20.8], webShare: [c.webShare * 100, 94.6] }),
      },
    ],
    s4: [
      {
        tag: 'three boards',
        lab: 'nails',
        scenario: 'pair',
        read: (c) => ({ q: [c.q / 1000, 118.5], spacing: [c.spacing * 1000, 20.3] }),
      },
    ],
    s5: [
      {
        tag: 'the 18 ft header',
        lab: 'header',
        scenario: 'design',
        read: (c) => ({
          V: [c.V / N_PER_LBF, 3270],
          q: [(c.q * M_PER_IN) / N_PER_LBF, 105.6],
          nail: [c.nail / N_PER_LBF, 39.6],
        }),
      },
      {
        tag: 'a 12 ft opening',
        lab: 'header',
        scenario: 'short',
        read: (c) => ({ nail: [c.nail / N_PER_LBF, 26.4] }),
      },
    ],
  },
  u8: {
    s1: [
      {
        tag: 'the tip load',
        lab: 'curve',
        scenario: 'cantilever',
        read: (c) => ({ drop: [c.drop * 1000, 15.62], slope: [-c.slopeTip, 0.01172] }),
      },
    ],
    s2: [
      {
        tag: 'the uniform load',
        lab: 'curve',
        scenario: 'uniform',
        read: (c) => ({ drop: [c.drop * 1000, 48.8] }),
      },
    ],
    s3: [
      {
        tag: 'quarter span',
        lab: 'curve',
        scenario: 'offset',
        read: (c) => ({ xMax: [c.xMax, 1.764], drop: [c.drop * 1000, 27.3] }),
      },
      {
        tag: 'under the load',
        lab: 'curve',
        scenario: 'offset',
        read: (c) => ({ under: [c.under * 1000, 22] }),
      },
    ],
    s6: [
      {
        tag: 'the prop',
        lab: 'propped',
        scenario: 'held',
        read: (c) => ({
          R: [c.R / 1000, 4.5],
          M: [c.Mwall / 1000, -4.5],
          drop: [c.drop * 1000, 5.14],
          xMax: [c.xMax, 1.735],
        }),
      },
      {
        tag: 'twice the span',
        lab: 'propped',
        scenario: 'long',
        read: (c) => ({ R: [c.R / 1000, 9], M: [c.Mwall / 1000, -18] }),
      },
      {
        tag: 'the prop removed',
        lab: 'propped',
        scenario: 'free',
        read: (c) => ({ drop: [c.drop * 1000, 118.7], M: [c.Mwall / 1000, -18], R: [c.R / 1000, 0] }),
      },
    ],
    s8: [
      {
        tag: 'the 72 in span',
        lab: 'shelf',
        scenario: 'open',
        read: (c) => ({ sag: [c.drop / M_PER_IN, 2.38] }),
      },
      {
        tag: 'a 48 in span',
        lab: 'shelf',
        scenario: 'short',
        read: (c) => ({ sag: [c.drop / M_PER_IN, 0.47] }),
      },
      {
        tag: 'the center bracket',
        lab: 'shelf',
        scenario: 'braced',
        read: (c) => ({
          sag: [c.drop / M_PER_IN, 0.0618],
          end: [c.Rend / N_PER_LBF, 45],
          center: [c.Rmid / N_PER_LBF, 150],
        }),
      },
    ],
  },
  u9: {
    s1: [
      {
        tag: 'the 40 mm shaft',
        lab: 'torsion',
        scenario: 'solid',
        read: (c) => ({
          tau: [c.tauMax / 1e6, 39.8],
          phi: [(c.phi * 180) / Math.PI, 1.824],
        }),
      },
    ],
    s2: [
      {
        tag: 'the 30 mm bore',
        lab: 'torsion',
        scenario: 'hollow',
        read: (c) => ({
          tau: [c.tauMax / 1e6, 58.2],
          inner: [c.tauIn / 1e6, 43.7],
          phi: [(c.phi * 180) / Math.PI, 2.67],
          strength: [c.strength, 0.684],
          area: [c.areaFrac, 0.438],
        }),
      },
      {
        tag: 'the 5 mm wall',
        lab: 'torsion',
        scenario: 'tube',
        read: (c) => ({
          tau: [c.tauMax / 1e6, 34.5],
          inner: [c.tauIn / 1e6, 27.6],
          strength: [c.strength, 0.59],
          area: [c.areaFrac, 0.36],
        }),
      },
    ],
    s3: [
      {
        tag: '20 kW at 1800 rpm',
        lab: 'twist',
        scenario: 'power',
        read: (c) => ({
          T: [c.T, 106.1],
          tau: [c.tau / 1e6, 20],
          phi: [(c.phi * 180) / Math.PI, 0.815],
        }),
      },
      {
        tag: 'the 2 to 1 gears',
        lab: 'twist',
        scenario: 'gear',
        read: (c) => ({
          fast: [c.T, 53.1],
          slow: [c.T2, 106.1],
          tauFast: [c.tau / 1e6, 10.01],
          tauSlow: [c.tau2 / 1e6, 20],
        }),
      },
    ],
    s4: [
      {
        tag: 'two diameters',
        lab: 'twist',
        scenario: 'step',
        read: (c) => ({
          phi: [(c.phi * 180) / Math.PI, 4.16],
          right: [(c.phi2 * 180) / Math.PI, 3.19],
          left: [c.tau2 / 1e6, 31.8],
          thin: [c.tau / 1e6, 130.4],
        }),
      },
      {
        tag: 'the two walls',
        lab: 'twist',
        scenario: 'fixed',
        read: (c) => ({
          left: [c.Tleft, 400],
          right: [c.Tright, 200],
          phi: [(c.phi * 180) / Math.PI, 0.608],
        }),
      },
    ],
    s5: [
      {
        tag: 'the nameplate stub',
        lab: 'motor',
        scenario: 'stub',
        read: (c) => ({
          tau: [c.tau / (1000 * PA_PER_PSI), 0.644],
          phi: [(c.phi * 180) / Math.PI, 0.01618],
        }),
      },
      {
        tag: '36 in of the same shaft',
        lab: 'motor',
        scenario: 'long',
        read: (c) => ({
          phi: [(c.phi * 180) / Math.PI, 0.212],
          tau: [c.tau / (1000 * PA_PER_PSI), 0.644],
        }),
      },
      {
        tag: 'a 0.75 in diameter',
        lab: 'motor',
        scenario: 'slender',
        read: (c) => ({
          tau: [c.tau / (1000 * PA_PER_PSI), 2.17],
          phi: [(c.phi * 180) / Math.PI, 0.0819],
        }),
      },
    ],
  },
  u10: {
    s1: [
      {
        tag: 'the 40 kN bar',
        lab: 'castigliano',
        scenario: 'bar',
        read: (c) => ({ U: [c.U, 15], delta: [c.delta * 1e3, 0.75] }),
      },
    ],
    s2: [
      {
        tag: 'the 40 by 80 mm cantilever',
        lab: 'castigliano',
        scenario: 'tip',
        read: (c) => ({ delta: [c.delta * 1e3, 6.25], U: [c.U, 2.5] }),
      },
      {
        tag: 'the 40 mm shaft',
        lab: 'castigliano',
        scenario: 'shaft',
        read: (c) => ({ U: [c.U, 7.96], phi: [(c.phi * 180) / Math.PI, 1.824] }),
      },
    ],
    s3: [
      {
        tag: 'midspan',
        lab: 'castigliano',
        scenario: 'station',
        read: (c) => ({ delta: [c.delta * 1e3, 1.953] }),
      },
      {
        tag: 'the two bars',
        lab: 'castigliano',
        scenario: 'truss',
        read: (c) => ({ F: [c.F / 1e3, 8.25], delta: [c.delta * 1e3, 3.5] }),
      },
    ],
    s4: [
      {
        tag: 'the 16 mm rod',
        lab: 'drop',
        scenario: 'rod',
        read: (c) => ({ sigma: [c.stress / 1e6, 62.6], n: [c.n, 8.39] }),
      },
      {
        tag: 'released from contact',
        lab: 'drop',
        scenario: 'sudden',
        read: (c) => ({
          n: [c.n, 2],
          sigma: [c.stress / (1000 * PA_PER_PSI), 6.78],
        }),
      },
    ],
    s5: [
      {
        tag: 'the 1 in drop',
        lab: 'drop',
        scenario: 'catch',
        read: (c) => ({
          n: [c.n, 5.58],
          force: [c.force / N_PER_LBF, 2230],
          sigma: [c.stress / (1000 * PA_PER_PSI), 18.92],
        }),
      },
      {
        tag: '60 ft of rope',
        lab: 'drop',
        scenario: 'long',
        read: (c) => ({
          force: [c.force / N_PER_LBF, 1726],
          n: [c.n, 4.32],
        }),
      },
    ],
    s7: [
      {
        tag: 'the cantilever at midspan',
        lab: 'castigliano',
        scenario: 'station',
        read: (c) => ({ delta: [c.delta * 1000, 1.953] }),
      },
    ],
  },
  u11: {
    s1: [
      {
        tag: 'the 2 m column',
        lab: 'buckling',
        scenario: 'weak',
        read: (c) => ({
          P: [c.euler / 1e3, 19.74],
          stress: [c.stress / 1e6, 16.45],
          Py: [c.Py / 1e3, 300],
          I: [c.I, 4e-8],
        }),
      },
      {
        tag: 'the flagpole end',
        lab: 'buckling',
        scenario: 'free',
        read: (c) => ({
          P: [c.euler / 1e3, 4.93],
          stress: [c.stress / 1e6, 4.11],
        }),
      },
    ],
    s2: [
      {
        tag: 'the strong axis',
        lab: 'buckling',
        scenario: 'strong',
        read: (c) => ({
          P: [c.euler / 1e3, 177.7],
          stress: [c.stress / 1e6, 148],
        }),
      },
      {
        tag: 'the short column',
        lab: 'buckling',
        scenario: 'short',
        read: (c) => ({
          P: [c.euler / 1e3, 877],
          stress: [c.stress / 1e6, 731],
          Py: [c.Py / 1e3, 300],
        }),
      },
    ],
    s3: [
      {
        tag: 'the 124 in column',
        lab: 'column',
        scenario: 'elastic',
        read: (c) => ({
          P: [c.eulerKip, 19.75],
          stress: [c.stressKsi, 19.44],
          asd: [c.asd, 8.7],
        }),
      },
      {
        tag: 'the 76 in column',
        lab: 'column',
        scenario: 'yield',
        read: (c) => ({
          P: [c.eulerKip, 52.6],
          stress: [c.stressKsi, 51.7],
          Py: [c.Py, 42.7],
          asd: [c.asd, 13.5],
        }),
      },
    ],
    s4: [
      {
        tag: 'the 2 m bar, 5 mm off centre',
        lab: 'buckling',
        scenario: 'weak',
        read: (c) => ({ P: [c.euler / 1e3, 19.7] }),
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

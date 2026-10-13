/**
 * Worked examples in the notes that a lab can show. Each gets a "Show this in the lab" button that
 * loads the example's own numbers into the lab, the way a practice problem loads its setup.
 *
 * SETUPS[exam][section] lists the section's examples that have a setup:
 *   tag     the example's tag after "Worked example · " (e.g. 'series'), or
 *   n       for an untagged "Worked example", which one in the section (0-based, untagged only)
 *   lab     the lab it opens
 *   scenario  the lab scenario it starts from (the lab's first when omitted)
 *   setup(s)  sets the lab's state slice, in SI units, after the scenario has reset it
 *   note    optional: said beside the button when the lab's picture differs from the example's
 *   read(c, s)  { name: [lab value, value in the notes] }: scripts/notes-check.mjs loads the setup
 *           into the real lab, runs it headless, and fails if a pair differs by more than 2%.
 *
 * Every setup has a read(), so the lab never shows a number the notes contradict.
 */
import { charge, layout } from '../problems/kit.js';
import { applyScenario as applyDataScenario } from '../data/scenarios.js';

const vals = (s, values) => {
  s.values = { ...values };
};
const K = 8.99e9;
const EPS0 = 8.85e-12;
const DEG = 180 / Math.PI;
const Emag = (c) => Math.hypot(c.probeE.x, c.probeE.y, c.probeE.z);
const Fmag = (c) => Math.hypot(c.selectedForce.x, c.selectedForce.y, c.selectedForce.z);
const angle = (x, y) => ((Math.atan2(y, x) * DEG) + 360) % 360;

/** The vectors lab draws arrows about 1.2 units long: scale the example's vector to fit, and remember by how much. */
function arrows(s, a, b = { x: 1, y: 0, z: 0 }) {
  const k = 1.2 / Math.max(...[a, b].flatMap((v) => [Math.abs(v.x), Math.abs(v.y), Math.abs(v.z || 0)]));
  s.a = { x: a.x * k, y: a.y * k, z: (a.z || 0) * k };
  s.b = { x: b.x * k, y: b.y * k, z: (b.z || 0) * k };
  s._k = k;
}

export const SETUPS = {
  e1: {
    s1: [
      {
        tag: 'angle below the \\(-x\\) axis',
        lab: 'vectors',
        scenario: 'axes',
        setup: (s) => arrows(s, { x: 12 * Math.cos(200 / DEG), y: 12 * Math.sin(200 / DEG) }),
        note: 'The lab measures α the short way round, 160°. cos 160° = cos 200°, so the components agree.',
        read: (c, s) => ({ C: [c.vec.ma / s._k, 12], beta: [c.vec.beta * DEG, 110], Cx: [(c.vec.ma / s._k) * Math.cos(c.vec.alpha), -11.3] }),
      },
      {
        tag: 'a 3D force',
        lab: 'vectors',
        scenario: 'axes',
        setup: (s) => arrows(s, { x: 40, y: 20, z: -60 }),
        read: (c, s) => ({ F: [c.vec.ma / s._k, 74.8], alpha: [c.vec.alpha * DEG, 57.7], beta: [c.vec.beta * DEG, 74.5] }),
      },
    ],
    s3: [
      {
        tag: 'angle between two vectors',
        lab: 'vectors',
        scenario: 'axes',
        setup: (s) => arrows(s, { x: 5, y: 2 }, { x: 1, y: -3 }),
        read: (c, s) => ({ dot: [c.vec.adb / s._k ** 2, -1], phi: [c.vec.phi * DEG, 93.4] }),
      },
    ],
    s8: [
      {
        tag: 'Mike and Cathy',
        lab: 'force',
        scenario: 'pair-attract',
        setup: (s) => layout(s, { charges: [charge(-2, -0.5, 0), charge(0.5, 0.5, 0)], select: 1 }),
        note: "Cathy's ball is selected. Select Mike's to see the equal and opposite force.",
        read: (c) => ({ F: [Fmag(c), 9.0e9], dir: [Math.sign(c.selectedForce.x), -1] }),
      },
    ],
    s9: [
      {
        tag: 'three charges in a line',
        lab: 'force',
        scenario: 'three',
        setup: (s) => layout(s, { charges: [charge(-2e-6, 0, 0), charge(-4e-6, 0.1, 0), charge(6e-6, 0.3, 0)], select: 1 }),
        note: 'Ball 2 is selected. Select ball 1 for the second half.',
        read: (c) => ({ F: [c.selectedForce.x, 12.6] }),
      },
      {
        tag: 'three charges in a plane',
        lab: 'force',
        scenario: 'three',
        setup: (s) => layout(s, { charges: [charge(-2e-6, 0, 0), charge(-4e-6, 0, -0.1), charge(6e-6, 0.2, -0.1)], select: 0 }),
        read: (c) => ({ F: [Fmag(c), 6.5], angle: [angle(c.selectedForce.x, c.selectedForce.y), 73] }),
      },
      {
        tag: 'Problem-solving video 1 · charges on a line',
        lab: 'force',
        scenario: 'three',
        setup: (s) => layout(s, { charges: [charge(5e-6, -0.35, 0), charge(-1e-6, 0.15, 0), charge(-5e-6, 0.35, 0)], select: 0 }),
        note: 'Charge 1 is selected. Select charges 2 and 3 for the other two forces.',
        read: (c) => ({ F: [c.selectedForce.x, 0.639] }),
      },
      {
        tag: 'Problem-solving video 2 · charges on a rectangle',
        lab: 'force',
        scenario: 'three',
        setup: (s) => layout(s, { charges: [charge(10e-6, -0.25, 0.2), charge(5e-6, 0.25, 0.2), charge(-15e-6, 0.25, -0.2)], select: 0 }),
        read: (c) => ({ F: [Fmag(c), 2.2], alpha: [Math.acos(c.selectedForce.x / Fmag(c)) * DEG, 69] }),
      },
    ],
    s10: [
      {
        n: 0,
        lab: 'force',
        scenario: 'three',
        setup: (s) => layout(s, { charges: [charge(9e-6, 0, 0), charge(1e-6, 0.3, 0), charge(4e-6, 0.5, 0)], select: 1 }),
        note: 'A +1 µC test charge sits at the balance point.',
        read: (c) => ({ 'net force, as a fraction of one push': [Fmag(c) / ((K * 9e-6 * 1e-6) / 0.09), 0] }),
      },
    ],
  },
  e2: {
    s2: [
      {
        tag: 'two charges on a line',
        lab: 'field',
        scenario: 'two-plus',
        setup: (s) => layout(s, { charges: [charge(-2e-6, -0.1, 0), charge(6e-6, 0.2, 0)], probe: { x: 0, y: 0 }, probeTag: 'A' }),
        read: (c) => ({ Ex: [c.probeE.x, -3.15e6] }),
      },
      {
        tag: 'two charges in a plane',
        lab: 'field',
        scenario: 'two-plus',
        setup: (s) => layout(s, { charges: [charge(-4e-6, 0, -0.1), charge(6e-6, 0.2, -0.1)], probe: { x: 0, y: 0 }, probeTag: 'A' }),
        read: (c) => ({ E: [Emag(c), 3.27e6], angle: [angle(c.probeE.x, c.probeE.y), 253] }),
      },
      {
        tag: 'Problem-solving video · field beside two charges',
        lab: 'field',
        scenario: 'two-plus',
        setup: (s) => layout(s, { charges: [charge(5e-9, -0.1, 0), charge(-15e-9, 0.5, 0)], probe: { x: -0.5, y: 0 } }),
        read: (c) => ({ Ex: [c.probeE.x, -146] }),
      },
      {
        tag: 'Problem-solving video · field at a corner',
        lab: 'field',
        scenario: 'two-plus',
        setup: (s) => layout(s, { charges: [charge(2e-9, -0.25, 0.15), charge(30e-9, 0.25, 0.15), charge(-5e-9, 0.25, -0.15)], probe: { x: -0.25, y: -0.15 } }),
        read: (c) => ({ E: [Emag(c), 788], alpha: [Math.acos(c.probeE.x / Emag(c)) * DEG, 129] }),
      },
    ],
    s3: [
      {
        tag: 'midpoints',
        lab: 'field',
        scenario: 'two-plus',
        setup: (s) => layout(s, { charges: [charge(1e-6, -0.2, 0), charge(1e-6, 0.2, 0)], probe: { x: 0, y: 0 } }),
        note: 'Two equal positive charges. Change one to negative for the second case.',
        read: (c) => ({ 'E at the midpoint, as a fraction of kq/(d/2)²': [Emag(c) / ((K * 1e-6) / 0.04), 0] }),
      },
    ],
    s5: [
      {
        n: 0,
        lab: 'field',
        scenario: 'dipole',
        setup: (s) => layout(s, { charges: [charge(3e-9, 0, 0.001), charge(-3e-9, 0, -0.001)], probe: { x: 0.05, y: 0 } }),
        read: (c) => ({ E: [Emag(c), 432], Ey: [c.probeE.y, -432] }),
      },
    ],
    s7: [
      {
        n: 0,
        lab: 'integral',
        scenario: 'rod',
        setup: (s) => Object.assign(s.integral, { kind: 'rod', L: 0.3, lambda: 4e-6, d: 0.1, x0: 0, quantity: 'E' }),
        read: (c) => ({ Ey: [c.integral.analytic.E.y, 6.0e5] }),
      },
    ],
    s8: [
      {
        n: 0,
        lab: 'integral',
        scenario: 'ring',
        setup: (s) => Object.assign(s.integral, { kind: 'ring', Q: 2e-9, a: 0.05, y: 0.1, span: 2 * Math.PI, quantity: 'E' }),
        read: (c) => ({ Ez: [c.integral.analytic.mag, 1.29e3] }),
      },
      {
        n: 1,
        lab: 'integral',
        scenario: 'disk',
        setup: (s) => Object.assign(s.integral, { kind: 'disk', Q: 5e-6 * Math.PI * 0.1 ** 2, R: 0.1, y: 0.02, quantity: 'E' }),
        read: (c) => ({ Ez: [c.integral.analytic.mag, 2.27e5] }),
      },
    ],
    s9: [
      {
        n: 0,
        lab: 'integral',
        scenario: 'half-ring',
        setup: (s) => Object.assign(s.integral, { kind: 'ring', Q: 4e-9, a: 0.05, y: 0, span: Math.PI, quantity: 'E' }),
        read: (c) => ({ E: [c.integral.analytic.mag, 9.2e3] }),
      },
    ],
    s11: [
      {
        tag: 'charge from field',
        lab: 'gauss',
        scenario: 'center',
        setup: (s) => {
          s.charges = [charge(8.9e-9, 0, 0)];
          s.selectedId = s.charges[0].id;
          s.surface = { type: 'sphere', R: 0.4, L: 0.55, tilt: 0, origin: { x: 0, y: 0, z: 0 } };
        },
        note: 'The sphere is the Gaussian surface at 0.4 m; the charge inside is the 8.9 nC it finds.',
        read: (c) => ({ 'Φ·ε₀': [c.gauss.Phi * EPS0, 8.9e-9], 'E on the sphere': [(c.gauss.Phi / (4 * Math.PI * 0.16)), 500] }),
      },
    ],
    s13: [
      {
        tag: 'same charge, two spheres',
        lab: 'conductors',
        scenario: 'uniform',
        setup: (s) => Object.assign(s, { R: 0.02, Q: 5e-9, probe: { x: 0.0201, y: 0, z: 0 } }),
        note: 'Shows the 2 cm sphere. Set R to 20 cm for the other.',
        read: (c) => ({ sigma: [c.sigma, 9.95e-7], E: [c.cond.mag, 1.12e5] }),
      },
    ],
  },
  e3: {
    s2: [
      {
        tag: 'two charges',
        lab: 'potential',
        scenario: 'v-plus',
        setup: (s) => {
          layout(s, { charges: [charge(3e-9, 0, 0)], probe: { x: 0.1, y: 0 }, pathA: { x: 0.15, y: 0 } });
          s.qTest = 5e-9;
        },
        note: 'q sits at B. The path runs from A to B.',
        read: (c) => ({ U_B: [c.PE, 1.35e-6], 'work by the field, A → B': [c.Wfield, -4.5e-7] }),
      },
      {
        tag: 'three charges',
        lab: 'potential',
        scenario: 'v-plus',
        setup: (s) => {
          // q₁ and q₃ 25 cm apart on the x-axis; q₂ where it is 17 cm from q₁ and 20 cm from q₃.
          const x = (0.17 ** 2 - 0.2 ** 2 + 0.25 ** 2) / (2 * 0.25);
          layout(s, { charges: [charge(3.1e-6, 0, 0), charge(2.5e-6, x, Math.sqrt(0.17 ** 2 - x ** 2))], probe: { x: 0.25, y: 0 }, probeTag: 'q₃' });
          s.qTest = 2e-6;
        },
        note: "q₃ is the test charge. The lab gives its share, 0.448 J. Add pair 1–2's 0.410 J for the total.",
        read: (c) => ({ 'U of q₃ with q₁ and q₂': [c.PE, 0.448] }),
      },
    ],
    s3: [
      {
        tag: 'parallel plates',
        lab: 'potential',
        scenario: 'v-plates',
        setup: (s) => {
          layout(s, { charges: [], probe: { x: -0.075, y: 0 }, pathA: { x: -0.1, y: 0 } });
          s.extraE = { x: 2000, y: 0, z: 0 };
          s.qTest = 10e-6;
        },
        note: 'A is the + plate, B is 2.5 cm along the field, and V = 0 on the − plate.',
        read: (c) => ({ V_A: [c.VA, 200], V_B: [c.V, 150], U_B: [c.PE, 1.5e-3] }),
      },
      {
        tag: 'work against a field',
        lab: 'potential',
        scenario: 'v-plates',
        setup: (s) => {
          layout(s, { charges: [], probe: { x: -0.25, y: 0 }, pathA: { x: 0.25, y: 0 } });
          s.extraE = { x: 400, y: 0, z: 0 };
          s.qTest = 2e-6;
        },
        read: (c) => ({ dV: [c.V - c.VA, 200], 'your work = −(field work)': [-c.Wfield, 4.0e-4] }),
      },
    ],
    s4: [
      {
        tag: 'four arrangements',
        lab: 'potential',
        scenario: 'v-ch39b',
        setup: (s) => layout(s, { charges: [charge(2e-6, -1, 0), charge(-1e-6, 0, 2)], probe: { x: 0, y: 0 } }),
        note: 'Shows case (b). Drag the charges to the other distances for (a), (c) and (d).',
        read: (c) => ({ V: [c.V, 13500] }),
      },
      {
        tag: 'ring on its axis',
        lab: 'integral',
        scenario: 'ring',
        setup: (s) => Object.assign(s.integral, { kind: 'ring', Q: 2.5e-6, a: 0.32, y: 0.38, span: 2 * Math.PI, quantity: 'V' }),
        note: 'Q = 2.5 µC, R = 32 cm, P 38 cm along the axis.',
        read: (c) => ({ V: [c.integral.analytic.V, (K * 2.5e-6) / Math.hypot(0.32, 0.38)] }),
      },
      {
        tag: 'line segment',
        lab: 'integral',
        scenario: 'rod',
        setup: (s) => Object.assign(s.integral, { kind: 'rod', L: 0.8, lambda: 2e-6, d: 0.35, x0: 0, quantity: 'V' }),
        note: 'L = 80 cm, λ = 2 µC/m, P 35 cm above the center.',
        read: (c) => ({ V: [c.integral.analytic.V, 2 * K * 2e-6 * Math.log((0.4 + Math.hypot(0.4, 0.35)) / 0.35)] }),
      },
    ],
    s5: [
      {
        tag: 'ring field from its potential',
        lab: 'integral',
        scenario: 'ring',
        setup: (s) => Object.assign(s.integral, { kind: 'ring', Q: 2.5e-6, a: 0.32, y: 0.38, span: 2 * Math.PI, quantity: 'E' }),
        note: 'Q = 2.5 µC, R = 32 cm, P 38 cm along the axis.',
        read: (c) => ({ E: [c.integral.analytic.mag, (K * 2.5e-6 * 0.38) / Math.hypot(0.32, 0.38) ** 3] }),
      },
    ],
    s7: [
      {
        tag: 'Application · ion thruster',
        lab: 'thruster',
        scenario: 'nstar',
        read: (c) => ({ v: [c.th.v, 4.02e4], mdot: [c.th.mdot, 2.4e-6], T: [c.th.T, 0.096], P: [c.th.P, 1940] }),
      },
    ],
    s8: [
      {
        tag: 'plate capacitor',
        lab: 'capacitor',
        scenario: 'cap-hw',
        setup: (s) => {
          s.cap = { A: 1.5, d: 0.002, V: 12, Q0: 8e-8, mode: 'battery', dielectric: 'vacuum', inserted: true, fill: 1 };
        },
        read: (c) => ({ C: [c.cap.C, 6.64e-9], Q: [c.cap.Q, 7.97e-8], E: [c.cap.E, 6000] }),
      },
    ],
    s9: [
      {
        tag: 'defibrillator',
        lab: 'capacitor',
        scenario: 'cap-defib',
        read: (c) => ({ U: [c.cap.U, 375] }),
      },
      {
        tag: 'a thundercloud as a capacitor',
        lab: 'capacitor',
        scenario: 'cap-hw',
        setup: (s) => {
          s.cap = { A: 8e7, d: 1000, V: 3e9, Q0: 2000, mode: 'battery', dielectric: 'vacuum', inserted: true, fill: 1 };
        },
        read: (c) => ({ C: [c.cap.C, 7.1e-7], U: [c.cap.U, 3.2e12] }),
      },
    ],
    s10: [
      {
        tag: 'adding nylon',
        lab: 'capacitor',
        scenario: 'cap-nylon',
        setup: (s) => {
          s.cap = { A: 1.5, d: 0.002, V: 12, Q0: 7.97e-8, mode: 'battery', dielectric: 'nylon', inserted: true, fill: 1 };
        },
        note: 'Nylon with κ = 3.4, the table value, not the κ = 410 the original notes used.',
        read: (c) => ({ C: [c.cap.C, 22.6e-9], Q: [c.cap.Q, 2.71e-7], E: [c.cap.E, 6000] }),
      },
    ],
    s11: [
      {
        tag: 'drift speed',
        lab: 'ohm',
        scenario: 'ohm-cu100',
        // 2 m of 1 mm² copper is 0.0344 Ω, so 0.0344 V drives the example's 1.0 A.
        setup: (s) => {
          s.ohm = { material: 'copper', L: 2, A: 1e-6, V: 0.0344, T: 20 };
        },
        read: (c) => ({ I: [c.ohm.I, 1.0], vd: [c.ohm.vd, 7.4e-5] }),
      },
    ],
    s12: [
      {
        tag: 'headlights',
        lab: 'ohm',
        scenario: 'ohm-headlight',
        read: (c) => ({ R: [c.ohm.R, 8], I: [c.ohm.I, 1.5] }),
      },
      {
        tag: 'a long copper wire',
        lab: 'ohm',
        scenario: 'ohm-cu100',
        read: (c) => ({ R: [c.ohm.R, 0.52], I: [c.ohm.I, 17] }),
      },
      {
        tag: 'nichrome heater',
        lab: 'ohm',
        scenario: 'ohm-nichrome',
        note: 'At 20 °C. Raise T to 1000 °C to watch the current fall.',
        read: (c) => ({ R: [c.ohm.R, 50], I: [c.ohm.I, 2.4] }),
      },
    ],
    s13: [
      {
        n: 0,
        lab: 'power',
        scenario: 'pwr-60',
        note: 'Loads the 60 W bulb. The 100 W bulb and the heater are in the lab’s Scenario menu.',
        read: (c) => ({ P: [c.power.P, 60], I: [c.power.I, 0.5] }),
      },
      {
        tag: 'Application · power lines',
        lab: 'powerline',
        scenario: 'hv',
        note: 'At 345 kV. Pick 34.5 kV to see the line fail.',
        read: (c) => ({ R: [c.pl.R, 14.1], I: [c.pl.I, 290], loss: [c.pl.loss, 1.18e6], 'drop (V)': [c.pl.drop, 4.1e3] }),
      },
    ],
  },
  e4: {
    s2: [
      {
        tag: 'series',
        lab: 'circuits',
        scenario: 'series',
        setup: (s) => vals(s, { E1: 24, R1: 10, R2: 15, R3: 20 }),
        read: (c) => ({ I: [c.circ.sol.I.R1, 0.533], V3: [c.circ.sol.I.R3 * 20, 10.67] }),
      },
      {
        tag: 'parallel',
        lab: 'circuits',
        scenario: 'parallel',
        setup: (s) => vals(s, { E1: 24, R1: 10, R2: 15, R3: 20 }),
        read: (c) => ({ I: [c.circ.sol.I.E1, 5.2], I1: [c.circ.sol.I.R1, 2.4], I2: [c.circ.sol.I.R2, 1.6], I3: [c.circ.sol.I.R3, 1.2] }),
      },
    ],
    s3: [
      {
        tag: 'four resistors',
        lab: 'circuits',
        scenario: 'notes-110',
        read: (c) => ({ I: [c.circ.sol.I.E1, 0.1], I180: [c.circ.sol.I.R2, 0.0722], I470: [c.circ.sol.I.R3, 0.0277] }),
      },
      {
        tag: 'Problem-solving video · five resistors',
        lab: 'circuits',
        scenario: 'notes-video5',
        read: (c) => ({ I: [c.circ.sol.I.E1, 4.5], I1: [c.circ.sol.I.R1, 2.5], I5: [c.circ.sol.I.R5, 1.0] }),
      },
    ],
    s4: [
      {
        tag: 'single loop with two sources',
        lab: 'circuits',
        scenario: 'notes-oppose',
        read: (c) => ({ I: [c.circ.sol.I.R1, 0.9] }),
      },
      {
        tag: 'two loops',
        lab: 'circuits',
        scenario: 'notes-kirchhoff',
        note: 'Arrows as in the lecture figure: a negative current runs against its arrow.',
        read: (c) => ({ I1: [c.circ.sol.I.R1, -0.075], I3: [c.circ.sol.I.R2, 0.1] }),
      },
      {
        tag: 'Problem-solving video · a battery alone in the middle',
        lab: 'circuits',
        scenario: 'threebranch',
        setup: (s) => vals(s, { E1: 100, E2: 200, E3: 50, R1: 100, R2: 200, R3: 50, R4: 200 }),
        note: 'A negative current runs against its arrow in the lab. The sizes match the notes.',
        read: (c) => ({ I1: [Math.abs(c.circ.sol.I.R1), 0.333], I3: [Math.abs(c.circ.sol.I.R2), 0.6], I2: [Math.abs(c.circ.sol.I.E2), 0.933] }),
      },
    ],
    s5: [
      {
        tag: 'finding r',
        lab: 'circuits',
        scenario: 'internal',
        setup: (s) => vals(s, { E1: 9, r: 2.86, R: 10 }),
        read: (c) => ({ I: [c.circ.sol.I.R, 0.7], Vterm: [c.circ.sol.V.tl - c.circ.sol.V.bl, 7.0] }),
      },
      {
        tag: 'mismatched batteries in parallel',
        lab: 'circuits',
        scenario: 'notes-twobat',
        read: (c) => ({ V: [c.circ.sol.V.mt - c.circ.sol.V.mb, 34.8], Iload: [c.circ.sol.I.R, 0.348], I50: [c.circ.sol.I.r1, 15.2], I20: [c.circ.sol.I.r2, -14.8] }),
      },
    ],
    s7: [
      {
        tag: 'charging',
        lab: 'rc',
        scenario: 'charge',
        setup: (s) => Object.assign(s, { mode: 'charge', net: 'one', E: 12, R: 20e3, C1: 100e-6, t: 2, closed: true }),
        note: 'At t = 2 s. Drag the time to 20 s for the second row.',
        read: (c) => ({ tau: [c.rc.tau, 2.0], q: [c.rc.q, 0.759e-3], I: [c.rc.I, 0.221e-3], VC: [c.rc.VC, 7.59] }),
      },
      {
        tag: 'discharging',
        lab: 'rc',
        scenario: 'discharge',
        setup: (s) => Object.assign(s, { mode: 'discharge', net: 'one', V0: 12, R: 20e3, C1: 100e-6, t: 2, closed: true }),
        note: 'At t = 2 s.',
        read: (c) => ({ q: [c.rc.q, 0.441e-3] }),
      },
      {
        tag: 'Lab 6 data',
        lab: 'rc',
        scenario: 'slow',
        setup: (s) => Object.assign(s, { mode: 'charge', net: 'one', E: 24, R: 4e5, C1: 5e-5, t: 20, closed: true, graph: 'ln' }),
        note: 'At t = 20 s, on the ln graph. Drag the time to 10 s and 40 s for the other readings.',
        read: (c) => ({ tau: [c.rc.tau, 20], VC: [c.rc.VC, 15.17], ln: [-c.rc.n, -1.0], 't½': [c.rc.tau * Math.LN2, 13.9] }),
      },
    ],
    s9: [
      {
        tag: 'proton vs. electron',
        lab: 'magforce',
        scenario: 'proton',
        setup: (s) => Object.assign(s, { kind: 'particle', particle: 'proton', v: 3e6, B: 1, pitch: 0 }),
        note: 'The proton. Switch to the electron to compare.',
        read: (c) => ({ r: [c.mf.run.rA, 0.0313], T: [c.mf.run.T, 65.6e-9] }),
      },
      {
        tag: 'mass spectrometer',
        lab: 'cyclotron',
        scenario: 'spectrometer',
        note: 'Carbon-12 is picked out. Pick zinc to see the 18 mm orbit.',
        read: (c) => ({ r: [c.cy.r, 0.0079] }),
      },
      {
        tag: 'Application · cyclotron',
        lab: 'cyclotron',
        scenario: 'tabletop',
        read: (c) => ({ f: [c.cy.f, 19.8e6], v: [c.cy.vmax, 1.74e7], 'K (MeV)': [c.cy.KmaxMeV, 1.59], laps: [c.cy.turns, 200] }),
      },
    ],
    s10: [
      {
        n: 0,
        lab: 'magforce',
        scenario: 'wire',
        setup: (s) => Object.assign(s, { kind: 'wire', I: 2, L: 1, B: 2e-3, theta: 45 }),
        note: 'At 45°. Turn the wire to 90° and 0° for the other two cases.',
        read: (c) => ({ F: [c.mf.Fmag, 2.83e-3] }),
      },
    ],
    s11: [
      {
        tag: 'Application · motor',
        lab: 'motor',
        scenario: 'course',
        read: (c) => ({ F: [c.mo.sideForce, 10], 'τ max': [c.mo.tauMax, 1.0], 'τ avg': [c.mo.tauAvg, 0.637], ω: [c.mo.omega, 188.5], P: [c.mo.P, 120] }),
      },
    ],
    s12: [
      {
        tag: 'single wire',
        lab: 'biot',
        scenario: 'wire',
        setup: (s) => Object.assign(s, { kind: 'wire', I: 2, probe: { x: 0.01, y: 0, z: 0 } }),
        note: 'The probe is 1 cm from the wire.',
        read: (c) => ({ B: [c.biot.an.ideal, 4.0e-5] }),
      },
      {
        tag: 'coil',
        lab: 'biot',
        scenario: 'loop',
        setup: (s) => Object.assign(s, { kind: 'loop', I: 2, R: 0.01, nTurns: 1, probe: { x: 0, y: 0, z: 0 } }),
        note: 'The lab draws one turn: 1.26×10⁻⁴ T. Ten turns give ten times that.',
        read: (c) => ({ 'B of 10 turns': [c.biot.an.exact * 10, 1.26e-3] }),
      },
    ],
    s13: [
      {
        n: 0,
        lab: 'magforce',
        scenario: 'parallel',
        setup: (s) => Object.assign(s, { kind: 'parallel', I1: 1, I2: 2, d: 0.01 }),
        note: 'The lab gives force per meter, 4.0×10⁻⁵ N/m. On 2 m that is 8.0×10⁻⁵ N.',
        read: (c) => ({ 'F on 2 m': [Math.abs(c.mf.an) * 2, 8.0e-5], B1: [c.mf.B1, 2.0e-5] }),
      },
      {
        tag: 'Application · railgun',
        lab: 'railgun',
        scenario: 'course',
        read: (c) => ({ F: [c.rg.F, 4.39e5], v: [c.rg.v, 1620], K: [c.rg.KE, 2.64e6], t: [c.rg.t, 7.4e-3], 'rails apart (N/m)': [c.rg.railRepelPerM, 2e6] }),
      },
    ],
    s14: [
      {
        tag: 'enclosed current',
        lab: 'ampere',
        scenario: 'two',
        setup: (s) => {
          s.wires = [
            { I: 2, x: -0.12, z: 0, a: 0 },
            { I: 3, x: 0.14, z: 0.04, a: 0 },
          ];
          s.r = 0.36;
          s.cx = 0;
          s.cz = 0;
        },
        note: 'Both currents the same way. Reverse the 2 A wire for the second case.',
        read: (c) => ({ circulation: [c.amp.circ, 6.28e-6] }),
      },
      {
        tag: 'solenoid',
        lab: 'mri',
        scenario: 'course',
        note: 'The same solenoid law as an MRI magnet, at 2 A.',
        read: (c, s) => ({ B: [s.B, 0.025], N: [c.mri.N, 1000] }),
      },
      {
        tag: 'Application · MRI',
        lab: 'mri',
        scenario: 'clinical',
        read: (c) => ({ n: [c.mri.n, 2984], N: [c.mri.N, 5370], 'wire (m)': [c.mri.wire, 16.9e3], 'copper R': [c.mri.Rcu, 72.6], 'copper P': [c.mri.Pcu, 11.6e6], f: [c.mri.fLarmor, 63.9e6], 'B at the center': [c.mri.Bcenter, 1.31], 'B at the end': [c.mri.Bend, 0.72] }),
      },
    ],
  },
  e5: {
    s5: [
      {
        tag: '120 V to 6 V',
        lab: 'transformer',
        scenario: 'notes',
        read: (c) => ({ Vs: [c.tf.Vs, 6.0], Is: [c.tf.Is, 0.5], Ip: [c.tf.Ip, 0.025], P: [c.tf.P, 3.0], 'seen from the source': [c.tf.Zin, 4800] }),
      },
    ],
    s10: [
      {
        tag: 'Application · transformer',
        lab: 'transformer',
        scenario: 'pole',
        note: 'Drawn as 3000 and 100 turns: the 30:1 ratio is what counts.',
        read: (c, s) => ({ ratio: [s.Np / s.Ns, 30], Vs: [c.tf.Vs, 240], Is: [c.tf.Is, 100], Ip: [c.tf.Ip, 3.33], 'seen from the line': [c.tf.Zin, 2160] }),
      },
    ],
    s12: [
      {
        tag: 'Application · magnetic flow meter',
        lab: 'flowmeter',
        scenario: 'main',
        read: (c) => ({ V: [c.fm.V, 2.0e-3], Q: [c.fm.Lps, 15.7] }),
      },
    ],
    s13: [
      {
        tag: 'capacitor alone',
        lab: 'ac',
        scenario: 'rc',
        setup: (s) => Object.assign(s, { R: 0.1, C: 2e-6, f: 120, Vrms: 12 }),
        note: 'At 120 Hz. Set f to 1200 Hz, then C to 20 μF, for the other rows. The lab keeps 0.1 Ω of wire in series, which changes the current by under 0.01%.',
        read: (c) => ({ XC: [c.ac.XC, 663], I: [c.ac.Irms, 0.0181] }),
      },
      {
        tag: 'inductor alone',
        lab: 'ac',
        scenario: 'rl',
        setup: (s) => Object.assign(s, { R: 0.1, L: 2e-3, f: 120, Vrms: 12 }),
        note: 'At 120 Hz. Set f to 1200 Hz, then L to 20 mH, for the other rows. The lab keeps 0.1 Ω of wire in series, which lowers the current by 0.2%.',
        read: (c) => ({ XL: [c.ac.XL, 1.51], I: [c.ac.Irms, 7.96] }),
      },
    ],
    s14: [
      {
        tag: 'series RLC at 1000 Hz',
        lab: 'ac',
        scenario: 'rlc',
        setup: (s) => Object.assign(s, { R: 50, L: 4e-3, C: 2e-6, f: 1000, Vrms: 100 }),
        read: (c) => ({ XC: [c.ac.XC, 79.6], XL: [c.ac.XL, 25.1], Z: [c.ac.Z, 73.9], I: [c.ac.Irms, 1.35], VR: [c.ac.VR, 67.6], VL: [c.ac.VL, 34.0], VC: [c.ac.VC, 107.7], 'φ (deg)': [(c.ac.phi * 180) / Math.PI, -47.4], P: [c.ac.Pavg, 91.5] }),
      },
    ],
    s15: [
      {
        tag: 'series RLC at resonance',
        lab: 'ac',
        scenario: 'res',
        setup: (s) => Object.assign(s, { R: 50, L: 4e-3, C: 2e-6, f: 1 / (2 * Math.PI * Math.sqrt(4e-3 * 2e-6)), Vrms: 100 }),
        read: (c) => ({ f0: [c.ac.f0, 1779], I: [c.ac.Irms, 2.0], 'X at f₀': [c.ac.XL, 44.7], VL: [c.ac.VL, 89], VC: [c.ac.VC, 89], VR: [c.ac.VR, 100] }),
      },
      {
        tag: 'Application · radio tuner',
        lab: 'ac',
        scenario: 'res',
        setup: (s) => Object.assign(s, { R: 10, L: 240e-6, C: 362e-12, f: 540e3, Vrms: 10 }),
        note: 'Tuned to 540 kHz. Drag C down to 36.5 pF to tune to 1700 kHz. The 10 V source stands in for a station’s microvolt signal: only the frequency matters here.',
        read: (c) => ({ f0: [c.ac.f0, 540e3] }),
      },
      {
        tag: 'amplifier and speaker',
        lab: 'transformer',
        scenario: 'audio',
        note: 'The lab winds 316 and 10 turns, the 31.6:1 match, so the speaker looks like 7.99 kΩ. A 32:1 winding gives the 8192 Ω in the notes.',
        read: (c, s) => ({ ratio: [s.Np / s.Ns, 31.6], 'seen from the amplifier': [c.tf.Zin, 8000] }),
      },
    ],
  },
};

/** An example's tag as the notes write it, without "Worked example · ": '' for an untagged one. */
export function exampleTag(tagText) {
  return tagText.replace(/^\s*Worked examples?\s*(·\s*)?/, '').trim();
}

/**
 * Pair a section's worked examples with its setups. `tags` are the examples' tag texts in order;
 * returns, for each, the index into setupsFor(exam, section) of its setup, or -1.
 */
export function matchExamples(exam, sectionId, tags) {
  const list = setupsFor(exam, sectionId);
  let untagged = -1;
  return tags.map((raw) => {
    const tag = exampleTag(raw);
    if (!tag) untagged++;
    return list.findIndex((ex) => (tag ? ex.tag === tag : ex.tag == null && ex.n === untagged));
  });
}

/** The setups for one section, or []. */
export function setupsFor(exam, sectionId) {
  return SETUPS[exam]?.[sectionId] || [];
}

/**
 * Reset `slice` to the example's scenario and load its numbers. Mirrors applyProblem (simbridge.js),
 * so the Node check and the browser load the same thing. The answers stay on screen: this is a
 * worked example, not a question.
 */
export function applyExample(lab, slice, ex) {
  const list = typeof lab.scenarios === 'function' ? lab.scenarios() : lab.scenarios || [];
  const id = ex.scenario ?? list[0]?.id;
  const base = lab.defaultState?.().view;
  if (base) slice.view = { ...base };
  if (id != null) {
    if (lab.applyScenario) lab.applyScenario(id, slice);
    else applyDataScenario(lab.id, id, slice);
  }
  slice.answerScreen = false;
  delete slice.problemId;
  ex.setup?.(slice);
  slice.custom = true;
  slice.dirty = true;
}

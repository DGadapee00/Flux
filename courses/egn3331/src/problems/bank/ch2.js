/**
 * Strain and material behaviour. Normal strain, Hooke's law, Poisson's ratio, the shear modulus,
 * permanent set, an A36 brace in US customary units, and conceptual questions on unloading,
 * incompressible response, creep and fatigue. Each numeric answer is computed again a second way.
 */
import { M_PER_FT, M_PER_IN, N_PER_LBF, PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  axialStress, bilinear, circleArea, hookeStrain, lateralStrain, normalStrain, permanentSet,
  shearModulus, uniaxialVolumeStrain,
} from '@flux/subjects/mechanics/materials.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const MM = 1e-3;
const KN = 1e3;
const MPA = 1e6;
const GPA = 1e9;
const UE = 1e-6;
const KIP = 1000 * N_PER_LBF;
const E_STEEL = 200e9;
const SY_STEEL = 250e6;
const ET_STEEL = 10e9;
const E_A36 = 29000 * 1000 * PA_PER_PSI;
const D_BRACE = 0.75 * M_PER_IN;

const ch2 = [
  problem({
    id: 'u2.2.normal-strain',
    title: 'Normal strain from a measured stretch',
    exam: 'u2',
    ch: '2',
    lab: 'tension-test',
    src: cite('strain'),
    topics: ['strain'],
    variety: ['unknown'],
    level: 1,
    vars: {
      L: range(100, 400, 10, 'mm', MM),
      delta: range(0.1, 1.2, 0.05, 'mm', MM),
    },
    valid: ($) => {
      const e = normalStrain($.delta, $.L);
      return e >= 0.0004 && e <= 0.008;
    },
    text: (T) => String.raw`A bar of original length $${T.L}$ mm stretches $${T.delta}$ mm under tension. Find the engineering normal strain, in millistrain.`,
    parts: [
      num('eps', ($) => normalStrain($.delta, $.L), 'millistrain', {
        scale: 1e-3,
        label: 'normal strain',
        traps: [
          [($) => normalStrain($.delta, $.L) * 100 * 1e-3, 'That is the strain written as a percent, not in millistrain.'],
          [($) => normalStrain($.delta, $.L) * 1e-3, 'That is the strain as a decimal. The question asks for millistrain.'],
        ],
      }),
    ],
    hints: [
      'Engineering normal strain is the change of length divided by the original length.',
      'A strain of 0.001 is 1 millistrain. Percent is 100 times the decimal strain.',
    ],
    steps: ($, sig) => [
      String.raw`$\varepsilon = \Delta L/L_0 = ${sig($.delta / MM)}\ \mathrm{mm} / ${sig($.L / MM)}\ \mathrm{mm} = ${sig(normalStrain($.delta, $.L))}$.`,
      String.raw`In millistrain that is ${sig(normalStrain($.delta, $.L) / 1e-3)}.`,
    ],
    second: ($) => ({ eps: ($.delta / MM) / ($.L / MM) / 1e-3 }),
    sim: {
      scenario: 'steel',
      setup(s, $) {
        s.material = 'steel';
        s.unload = 0;
        s.eps = normalStrain($.delta, $.L);
      },
      read: (c) => ({ eps: c.eps }),
    },
    cases: [kase(cite('strain'), { L: 200, delta: 0.2 }, { eps: 1 })],
  }),

  problem({
    id: 'u2.2.hooke',
    title: 'Stress and strain in a round bar',
    exam: 'u2',
    ch: '2',
    lab: 'tension-test',
    src: cite('hooke'),
    topics: ['hooke'],
    variety: ['unknown'],
    level: 1,
    vars: {
      P: range(5, 40, 1, 'kN', KN),
      d: range(16, 40, 1, 'mm', MM),
    },
    valid: ($) => axialStress($.P, circleArea($.d)) < 200e6,
    text: (T) => String.raw`A round bar of diameter $${T.d}$ mm carries $${T.P}$ kN in tension. The modulus is 200 GPa. Find the axial stress and the axial strain.`,
    parts: [
      num('stress', ($) => axialStress($.P, circleArea($.d)), 'MPa', {
        scale: MPA,
        label: 'axial stress',
        traps: [
          [($) => $.P / ($.d * $.d), 'That uses $d^2$ as the area and leaves out $\\pi/4$.'],
          [($) => $.P / (Math.PI * $.d * $.d), 'That uses $\\pi d^2$ and leaves out the 4.'],
        ],
      }),
      num('strain', ($) => hookeStrain(axialStress($.P, circleArea($.d)), E_STEEL), 'millistrain', {
        scale: 1e-3,
        label: 'axial strain',
        traps: [
          [($) => axialStress($.P, circleArea($.d)) / E_STEEL * 100 * 1e-3, 'That is the strain in percent, not millistrain.'],
          [($) => axialStress($.P, circleArea($.d)) / (E_STEEL / 1000), 'That treats the modulus as if it were in MPa.'],
        ],
      }),
    ],
    hints: [
      'Hooke\'s law in one dimension is stress equals modulus times strain. Find the stress from the load and the area first.',
      String.raw`The area of a round bar is $\pi d^2/4$. Strain in millistrain is $1000\,\sigma/E$.`,
    ],
    steps: ($, sig) => {
      const A = circleArea($.d);
      const stress = axialStress($.P, A);
      return [
        String.raw`$A = \pi d^2/4 = ${sig(A / 1e-6)}\ \mathrm{mm^2}$.`,
        String.raw`$\sigma = P/A = ${sig(stress / MPA)}$ MPa.`,
        String.raw`$\varepsilon = \sigma/E = ${sig(stress / MPA)} / ${sig(E_STEEL / GPA)} = ${sig(hookeStrain(stress, E_STEEL) / 1e-3)}$ millistrain.`,
      ];
    },
    // Newtons and square millimetres: 1 N/mm² is 1 MPa. Millistrain is that stress divided by E in GPa.
    second: ($) => {
      const dmm = $.d / MM;
      const Amm = (Math.PI * dmm * dmm) / 4;
      const stress = $.P / Amm;
      return { stress, strain: stress / (E_STEEL / GPA) };
    },
    sim: {
      scenario: 'steel',
      setup(s, $) {
        s.material = 'steel';
        s.unload = 0;
        s.eps = hookeStrain(axialStress($.P, circleArea($.d)), E_STEEL);
      },
      read: (c) => ({ stress: c.stress, strain: c.eps }),
    },
    cases: [kase(cite('hooke'), { P: 20, d: 20 }, { stress: 63.661977236758126, strain: 0.31830988618379064 })],
  }),

  problem({
    id: 'u2.3.poisson',
    title: 'Lateral strain and volume change',
    exam: 'u2',
    ch: '3',
    lab: 'poisson',
    src: cite('poisson'),
    topics: ['poisson'],
    variety: ['unknown'],
    level: 2,
    vars: {
      eps: range(0.5, 2, 0.1, 'millistrain', 1e-3),
      nu: range(0.25, 0.35, 0.01, '', 1),
    },
    text: (T) => String.raw`A bar is stretched to an axial strain of $${T.eps}$ millistrain. Poisson's ratio is $${T.nu}$. Find the lateral strain and the linear volume strain.`,
    parts: [
      num('lat', ($) => lateralStrain($.nu, $.eps), 'µε', {
        scale: UE,
        label: 'lateral strain',
        traps: [
          [($) => $.nu * $.eps, 'The lateral strain is negative in tension. The minus sign from Poisson\'s ratio was dropped.'],
          [($) => -$.eps / $.nu, 'That divides by $\\nu$ instead of multiplying.'],
        ],
      }),
      num('vol', ($) => uniaxialVolumeStrain($.eps, $.nu), 'µε', {
        scale: UE,
        label: 'volume strain',
        traps: [
          [($) => $.eps * (1 - $.nu), 'The linear volume change is $\\varepsilon(1-2\\nu)$, with a 2.'],
          [($) => $.eps * (1 + 2 * $.nu), 'The side strains are contractions, so they subtract.'],
        ],
      }),
    ],
    hints: [
      'Poisson\'s ratio turns axial strain into lateral strain, with a minus sign in tension.',
      String.raw`Add the three edge strains. Two of them are $-\nu\varepsilon$, so the volume strain is $\varepsilon(1-2\nu)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$\varepsilon_{lat} = -\nu\varepsilon = -${sig($.nu)}\times ${sig($.eps / 1e-3)}\ \mathrm{millistrain} = ${sig(lateralStrain($.nu, $.eps) / UE)}\ \mu\varepsilon$.`,
      String.raw`$\Delta V/V \approx \varepsilon(1-2\nu) = ${sig(uniaxialVolumeStrain($.eps, $.nu) / UE)}\ \mu\varepsilon$.`,
    ],
    second: ($) => ({
      lat: (-$.nu * $.eps) / UE,
      vol: ($.eps - 2 * $.nu * $.eps) / UE,
    }),
    sim: {
      scenario: 'steel',
      setup(s, $) {
        s.eps = $.eps;
        s.nu = $.nu;
      },
      read: (c) => ({ lat: c.lateral, vol: c.linear }),
    },
    cases: [kase(cite('poisson'), { eps: 1, nu: 0.3 }, { lat: -300, vol: 400 })],
  }),

  problem({
    id: 'u2.3.shear-modulus',
    title: 'Shear modulus from E and Poisson',
    exam: 'u2',
    ch: '3',
    lab: 'poisson',
    src: cite('poisson'),
    topics: ['poisson'],
    variety: ['representation'],
    level: 2,
    vars: {
      E: range(70, 210, 10, 'GPa', GPA),
      nu: range(0.25, 0.35, 0.01, '', 1),
    },
    text: (T) => String.raw`An isotropic material has modulus $${T.E}$ GPa and Poisson's ratio $${T.nu}$. Find the shear modulus $G$.`,
    parts: [
      num('G', ($) => shearModulus($.E, $.nu), 'GPa', {
        scale: GPA,
        label: 'shear modulus',
        traps: [
          [($) => $.E / (2 * (1 - $.nu)), 'The denominator is $2(1+\\nu)$, not $2(1-\\nu)$.'],
          [($) => $.E / (1 + $.nu), 'The 2 in the denominator was left out.'],
        ],
      }),
    ],
    hints: [
      'For an isotropic linear material the shear modulus is fixed once E and Poisson\'s ratio are known.',
      String.raw`For an isotropic solid only two of $E$, $G$ and $\nu$ are independent. The link between them has $1+\nu$ in it.`,
    ],
    steps: ($, sig) => [
      String.raw`An isotropic material has only two independent constants, so $G = E/2(1+\nu)$.`,
      String.raw`$2(1+\nu) = 2(1 + ${sig($.nu)}) = ${sig(2 * (1 + $.nu))}$.`,
      String.raw`$G = ${sig($.E / GPA)}/${sig(2 * (1 + $.nu))} = ${sig(shearModulus($.E, $.nu) / GPA)}$ GPa.`,
    ],
    second: ($) => ({ G: ($.E / GPA) / (2 * (1 + $.nu)) }),
    sim: {
      scenario: 'steel',
      setup(s, $) { s.nu = $.nu; },
      read: (c, state, $) => ({ G: shearModulus($.E, c.nu) }),
    },
    cases: [kase(cite('poisson'), { E: 200, nu: 0.3 }, { G: 76.92307692307692 })],
  }),

  problem({
    id: 'u2.3.permanent-set',
    title: 'Permanent set after unloading',
    exam: 'u2',
    ch: '3',
    lab: 'tension-test',
    src: cite('stress-strain-curve'),
    topics: ['stress-strain-curve', 'yield'],
    variety: ['unknown'],
    level: 3,
    vars: {
      eps: range(4, 15, 0.2, 'millistrain', 1e-3),
    },
    text: (T) => String.raw`A mild steel is pulled to a strain of $${T.eps}$ millistrain and then unloaded. Take $E = 200$ GPa, a sharp yield at 250 MPa, and a tangent modulus of 10 GPa after yield. Find the permanent set.`,
    parts: [
      num('set', ($) => {
        const b = bilinear($.eps, E_STEEL, SY_STEEL, ET_STEEL);
        return permanentSet($.eps, b.stress, E_STEEL);
      }, 'µε', {
        scale: UE,
        label: 'permanent set',
        traps: [
          [($) => $.eps, 'That is the total strain. Unloading recovers $\\sigma/E$.'],
          [($) => $.eps - SY_STEEL / E_STEEL, 'That subtracts only the strain at yield. The stress at unloading is above 250 MPa, so the recovered strain is larger.'],
        ],
      }),
    ],
    hints: [
      'Unload along the original modulus, not along the tangent modulus.',
      'Find the stress on the bilinear curve at the peak strain. The permanent set is that strain minus stress over E.',
    ],
    steps: ($, sig) => {
      const b = bilinear($.eps, E_STEEL, SY_STEEL, ET_STEEL);
      const set = permanentSet($.eps, b.stress, E_STEEL);
      return [
        String.raw`Yield strain $= \sigma_Y/E = ${sig((SY_STEEL / E_STEEL) / 1e-3)}$ millistrain, so this point is past yield.`,
        String.raw`$\sigma = 250 + 10( ${sig($.eps / 1e-3)} - 1.25 ) = ${sig(b.stress / MPA)}$ MPa.`,
        String.raw`$\varepsilon_p = \varepsilon - \sigma/E = ${sig(set / UE)}\ \mu\varepsilon$.`,
      ];
    },
    second: ($) => {
      const ey = SY_STEEL / E_STEEL;
      const stress = SY_STEEL + ET_STEEL * ($.eps - ey);
      return { set: ($.eps - stress / E_STEEL) / UE };
    },
    sim: {
      scenario: 'yielded',
      setup(s, $) {
        s.material = 'steel';
        s.unload = 0;
        s.eps = $.eps;
      },
      read: (c) => ({ set: c.set }),
    },
    cases: [kase(cite('stress-strain-curve'), { eps: 10 }, { set: 8312.5 })],
  }),

  problem({
    id: 'u2.2.brace-english',
    title: 'Elongation of an A36 brace rod',
    exam: 'u2',
    ch: '2',
    lab: 'brace',
    src: cite('hooke'),
    topics: ['hooke', 'english'],
    variety: ['configuration'],
    level: 2,
    vars: {
      P: range(2, 12, 0.5, 'kip', KIP),
      L: range(6, 18, 0.5, 'ft', M_PER_FT),
    },
    text: (T) => String.raw`An ASTM A36 brace rod is 3/4 in in diameter and $${T.L}$ ft long. It carries $${T.P}$ kip in tension, below yield. Take $E = 29{,}000$ ksi, the AISC value for structural steel. Find the elongation.`,
    parts: [
      num('delta', ($) => ($.P * $.L) / (circleArea(D_BRACE) * E_A36), 'in', {
        scale: M_PER_IN,
        label: 'elongation',
        traps: [
          [($) => {
            const kip = $.P / KIP;
            const feet = $.L / M_PER_FT;
            const A = (Math.PI * 0.75 * 0.75) / 4;
            return (kip * feet) / (A * 29000) * M_PER_IN;
          }, 'The length was left in feet. $AE$ is in kip and inches, so the length has to be in inches.'],
          [($) => {
            const kip = $.P / KIP;
            const inches = $.L / M_PER_IN;
            return (kip * inches) / (0.75 * 29000) * M_PER_IN;
          }, 'The diameter was used as the area. The area is $\\pi d^2/4$.'],
        ],
      }),
    ],
    hints: [
      'Below yield the elongation is PL/AE. Stay in kip and inches, or convert everything to one system.',
      'The area is pi d squared over 4, and 1 ft is 12 in. E is 29,000 ksi.',
    ],
    steps: ($, sig) => {
      const A = (Math.PI * 0.75 * 0.75) / 4;
      const inches = $.L / M_PER_IN;
      const kip = $.P / KIP;
      return [
        String.raw`$A = \pi(0.75)^2/4 = ${sig(A)}\ \mathrm{in^2}$.`,
        String.raw`$\delta = PL/AE = (${sig(kip)})(${sig(inches)}) / (${sig(A)}\times 29000) = ${sig(kip * inches / (A * 29000))}$ in.`,
      ];
    },
    second: ($) => {
      const A = (Math.PI * 0.75 * 0.75) / 4;
      return { delta: ($.P / KIP) * ($.L / M_PER_IN) / (A * 29000) };
    },
    sim: {
      scenario: 'service',
      setup(s, $) {
        s.P = $.P;
        s.L = $.L;
      },
      read: (c) => ({ delta: c.delta }),
    },
    cases: [kase(cite('hooke'), { P: 8, L: 10 }, { delta: 0.07493087895452911 })],
  }),

  problem({
    id: 'u2.2.unload',
    title: 'What unloading leaves behind',
    exam: 'u2',
    ch: '2',
    lab: 'tension-test',
    src: cite('stress-strain-curve'),
    kind: 'conceptual',
    topics: ['stress-strain-curve'],
    variety: ['configuration'],
    level: 2,
    vars: {
      eps: range(0.2, 8, 0.1, 'millistrain', 1e-3),
    },
    text: (T) => String.raw`A mild steel bar is pulled to $${T.eps}$ millistrain and then unloaded. Yield is at 1.25 millistrain. What happens to the length?`,
    parts: [
      mc('which', [
        ['origin', 'It returns to its original length.', 'Unloading follows E. From below yield that line runs back to the origin.'],
        ['set', 'It keeps a permanent set.', 'Past yield the unload line is parallel to E and meets zero stress at a strain above zero.'],
        ['stays', 'The stress stays at the yield stress after the load is gone.', 'A removed load means zero stress. Yield is a stress reached while the load was on.'],
        ['grows', 'The bar keeps getting longer after the load is gone.', 'With the load gone there is no force left to stretch it further.'],
      ], ($) => ($.eps > SY_STEEL / E_STEEL ? 'set' : 'origin')),
    ],
    hints: [
      'Unloading follows the elastic modulus, whether or not the bar has yielded.',
      'A permanent set is the strain left at zero stress. It appears only if the peak point was past yield.',
    ],
    steps: ($) => [
      $.eps > SY_STEEL / E_STEEL
        ? 'The peak is past 1.25 millistrain, so the unload line misses the origin. A permanent set remains.'
        : 'The peak is under 1.25 millistrain, so the unload line is the loading line. The length returns.',
    ],
    second: ($) => ({ which: $.eps > SY_STEEL / E_STEEL ? 'set' : 'origin' }),
    sim: {
      scenario: 'steel',
      setup(s, $) {
        s.material = 'steel';
        s.eps = $.eps;
        s.unload = 1;
      },
      read: (c) => ({ which: c.set > 1e-5 ? 'set' : 'origin' }),
    },
    cases: [
      kase(cite('stress-strain-curve'), { eps: 10 }, { which: 'set' }),
      kase(cite('stress-strain-curve'), { eps: 0.5 }, { which: 'origin' }),
    ],
  }),

  problem({
    id: 'u2.3.incompressible',
    title: 'When the volume does not change',
    exam: 'u2',
    ch: '3',
    lab: 'poisson',
    src: cite('poisson'),
    kind: 'conceptual',
    topics: ['poisson'],
    variety: ['representation'],
    level: 1,
    vars: {
      eps: range(0.4, 3, 0.1, 'millistrain', 1e-3),
      nu: choice([0, '0'], [0.3, '0.30'], [0.5, '0.50']),
    },
    text: (T) => String.raw`In the small-strain model, a bar is stretched to $${T.eps}$ millistrain. Poisson's ratio is ${T.nu}. What does the linear volume strain do?`,
    parts: [
      mc('vol', [
        ['zero', 'It is zero.', 'The linear volume strain is ε(1−2ν). That factor is zero only at ν = 1/2.'],
        ['grows', 'The volume increases.', 'For ν below 1/2 the factor (1−2ν) is positive, so tension increases the volume.'],
        ['shrinks', 'The volume decreases.', 'Tension decreases the volume only if ν is above 1/2, which this model does not use for ordinary solids.'],
        ['same', 'It equals the axial strain.', 'That would be ν = 0, when the sides do not move and the volume strain is just ε.'],
      ], ($) => ($.nu === 0.5 ? 'zero' : $.nu === 0 ? 'same' : 'grows')),
    ],
    hints: [
      'The linear volume strain under uniaxial stress is the axial strain times (1 − 2ν).',
      'Set that factor to zero and see which value of ν does it. Then read the sign for the other values.',
    ],
    steps: ($) => [
      String.raw`$\Delta V/V \approx \varepsilon(1-2\nu)$ with $\nu = ${$.nu}$.`,
      $.nu === 0.5 ? 'The factor (1−2ν) is zero, so the linear volume change vanishes.'
        : $.nu === 0 ? 'With ν = 0 the volume strain equals the axial strain.'
          : 'ν = 0.30 makes (1−2ν) positive, so the volume grows in tension.',
    ],
    second: ($) => ({ vol: $.nu === 0.5 ? 'zero' : $.nu === 0 ? 'same' : 'grows' }),
    sim: {
      scenario: 'steel',
      setup(s, $) {
        s.nu = $.nu;
        s.eps = 0.001;
      },
      read: (c) => ({ vol: Math.abs(c.linear) < 1e-9 ? 'zero' : Math.abs(c.linear - c.eps) < 1e-9 ? 'same' : 'grows' }),
    },
    cases: [
      kase(cite('poisson'), { eps: 1, nu: 0.5 }, { vol: 'zero' }),
      kase(cite('poisson'), { eps: 1, nu: 0.3 }, { vol: 'grows' }),
    ],
  }),

  problem({
    id: 'u2.3.fatigue',
    title: 'Reading an endurance limit, and creep',
    exam: 'u2',
    ch: '3',
    lab: null,
    src: cite('fatigue'),
    kind: 'conceptual',
    topics: ['fatigue', 'creep'],
    variety: ['configuration'],
    level: 2,
    vars: {
      limit: range(140, 260, 5, 'MPa', MPA),
      side: choice(['below', '40 MPa under that limit'], ['above', '40 MPa over that limit']),
    },
    text: (T, $, sig) => {
      const amp = $.side === 'above' ? $.limit + 40e6 : $.limit - 40e6;
      return String.raw`A steel's fully reversed endurance limit is stated as $${T.limit}$ MPa. The stress amplitude in service is $${sig(amp / MPA)}$ MPa, which is ${T.side}. Separately, a steel bolt at room temperature is held at 60% of yield. What does this course's model say?`;
    },
    parts: [
      mc('life', [
        ['runs', 'It can run for a very large number of cycles without a fatigue failure.', 'Below the stated endurance limit the S–N model does not predict a finite life.'],
        ['fails', 'A fatigue crack is expected if the cycles go on long enough.', 'Above the endurance limit the S–N curve assigns a finite life.'],
        ['yields', 'It yields on the first half-cycle.', 'Both amplitudes are under a typical mild-steel yield. The question is about repeated stress, not the first peak.'],
        ['creeps', 'The failure would be creep, not fatigue.', 'Creep is time at temperature under a steady load. This part is a fully reversed cycle.'],
      ], ($) => ($.side === 'above' ? 'fails' : 'runs')),
      mc('creep', [
        ['holds', 'The bolt keeps its length. Creep is left out at room temperature.', 'The course model treats steel at room temperature as elastic, or elastic-plastic, with no creep strain.'],
        ['grows', 'The bolt creeps longer at a steady rate.', 'That is the high-temperature behaviour. It is not the room-temperature model.'],
        ['shrinks', 'The bolt creeps shorter because the load is below yield.', 'Creep does not reverse sign just because the stress is under yield.'],
        ['relaxes', 'The stress falls to zero while the length is held.', 'Relaxation needs a fixed length and a creeping material. This bolt is free to hold its load, and the model includes no creep.'],
      ], 'holds'),
    ],
    hints: [
      'An endurance limit is a stress amplitude below which the stated S–N model predicts no fatigue failure.',
      'Creep in this course is a high-temperature, long-time strain. Room-temperature steel under a steady load is not given a creep rate.',
    ],
    steps: ($) => [
      $.side === 'above'
        ? '220 MPa is above the stated 180 MPa endurance limit, so the model expects a finite fatigue life.'
        : '120 MPa is below the stated 180 MPa endurance limit, so the model expects the steel to run.',
      'At room temperature the model gives the bolt no creep strain. The length stays where the elastic (or plastic) response put it.',
    ],
    second: ($) => ({ life: $.side === 'above' ? 'fails' : 'runs', creep: 'holds' }),
    cases: [
      kase(cite('fatigue'), { limit: 180, side: 'below' }, { life: 'runs', creep: 'holds' }),
      kase(cite('creep'), { limit: 180, side: 'above' }, { life: 'fails', creep: 'holds' }),
    ],
  }),
  problem({
    id: 'u2.2.rigid-bar',
    title: 'A rigid bar hung on a wire',
    exam: 'u2',
    ch: '2',
    lab: 'brace',
    src: cite('hooke'),
    topics: ['hooke'],
    variety: ['configuration'],
    level: 3,
    vars: {
      P: range(2, 10, 0.5, 'kN', KN),
      a: range(0.5, 1.2, 0.1, 'm', 1),
      b: range(1.5, 2.5, 0.25, 'm', 1),
      L: range(1, 2.5, 0.25, 'm', 1),
      dw: range(8, 14, 1, 'mm', MM),
    },
    derive: ($) => {
      const A = circleArea($.dw);
      const T = ($.P * $.b) / $.a;
      const stretch = (T * $.L) / (A * E_STEEL);
      return { A, T, sigma: T / A, stretch, drop: stretch * ($.b / $.a) };
    },
    valid: ($) => $.sigma < 200 * MPA,
    text: (T) => String.raw`A rigid horizontal bar is pinned to a wall at A. A vertical steel wire ($E = 200$ GPa), $${T.L}$ m long and $${T.dw}$ mm in diameter, holds it up at C, $${T.a}$ m from A. A load of $${T.P}$ kN hangs at the bar's end B, $${T.b}$ m from A. Find the stress in the wire, its stretch, and how far B drops.`,
    parts: [
      num('sigma', ($) => $.sigma, 'MPa', {
        scale: MPA,
        label: 'wire stress',
        traps: [
          [($) => $.P / $.A, 'That gives the wire the load itself. The bar is a lever: moments about A set the wire force.'],
        ],
      }),
      num('stretch', ($) => $.stretch, 'mm', { scale: MM, label: 'wire stretch' }),
      num('drop', ($) => $.drop, 'mm', {
        scale: MM,
        label: 'drop at B',
        traps: [
          [($) => $.stretch, 'That is the wire\'s stretch, at C. The bar turns about A, so B, farther out, drops more.'],
        ],
      }),
    ],
    hints: [
      'Three facts: equilibrium of the bar about its pin, Hooke\'s law for the wire, and the geometry of a rigid bar turning about A.',
      'The bar turns through one small angle. Every point drops in proportion to its distance from A.',
    ],
    steps: ($, sig) => [
      String.raw`Moments about A: $T a = P b$, so $T = ${sig($.T / KN)}$ kN and $\sigma = T/A = ${sig($.sigma / MPA)}$ MPa.`,
      String.raw`The wire stretches $\sigma L/E = ${sig($.stretch / MM)}$ mm, so C drops that much.`,
      String.raw`The bar turns about A: B drops $(b/a)$ times as much, $${sig($.drop / MM)}$ mm.`,
    ],
    second: ($) => {
      // Energy: the load's work, P δ_B / 2, equals the wire's stored T²L/(2AE).
      const A = circleArea($.dw);
      const T = ($.P * $.b) / $.a;
      const U = (T * T * $.L) / (2 * A * E_STEEL);
      return { sigma: T / A / MPA, stretch: (T * $.L) / (A * E_STEEL) / MM, drop: (2 * U) / $.P / MM };
    },
    cases: [kase(cite('hooke'), { P: 5, a: 0.8, b: 2, L: 1.5, dw: 10 }, { sigma: 159.15494309189535, stretch: 1.1936620731892151, drop: 2.983155182973038 })],
  }),

  problem({
    id: 'u2.3.squeeze',
    title: 'Pulling a rod thin enough to pass',
    exam: 'u2',
    ch: '3',
    lab: 'poisson',
    src: cite('poisson'),
    topics: ['poisson'],
    variety: ['unknown'],
    level: 3,
    vars: {
      mat: choice(['steel', 'steel (E = 200 GPa, ν = 0.30)'], ['al', 'aluminium (E = 70 GPa, ν = 0.33)']),
      d: range(10, 30, 2, 'mm', MM),
      shrink: range(2, 8, 0.5, 'µm', 1e-6),
      L: range(0.5, 2, 0.25, 'm', 1),
    },
    derive: ($) => {
      const [E, nu] = $.mat === 'steel' ? [200e9, 0.3] : [70e9, 0.33];
      const A = circleArea($.d);
      const P = ($.shrink * Math.PI * $.d * E) / (4 * nu);
      return { E, nu, A, P, sigma: P / A, stretch: (P * $.L) / (A * E) };
    },
    valid: ($) => $.sigma < ($.mat === 'steel' ? 220e6 : 200e6) && $.sigma > 30e6,
    text: (T) => String.raw`A round ${T.mat} rod, $${T.d}$ mm in diameter and $${T.L}$ m long, must be pulled until its diameter shrinks by $${T.shrink}\ \mu$m. What axial tension does that take, what is the axial stress, and how much does the rod lengthen?`,
    parts: [
      num('P', ($) => $.P, 'kN', {
        scale: KN,
        label: 'tension',
        traps: [
          [($) => ($.shrink / $.d) * $.E * $.A, 'That treats the diameter change as the axial strain. The axial strain is the lateral one divided by $\\nu$.'],
          [($) => ($.shrink / ($.d / 2) / $.nu) * $.E * $.A, 'That divides the change in diameter by the radius. Strain is the change over the original diameter.'],
        ],
      }),
      num('sigma', ($) => $.sigma, 'MPa', { scale: MPA, label: 'axial stress' }),
      num('stretch', ($) => $.stretch, 'mm', { scale: MM, label: 'lengthening' }),
    ],
    hints: [
      'Turn the diameter change into a lateral strain. Poisson\'s ratio links it to the axial strain that a tension produces.',
      String.raw`$\varepsilon_{\text{lat}} = -\Delta d/d$ and $\varepsilon_{\text{lat}} = -\nu\varepsilon_{\text{ax}}$. Hooke's law then gives the stress, and the area gives the force.`,
    ],
    steps: ($, sig) => [
      String.raw`Lateral strain: $\Delta d/d = ${sig(($.shrink / $.d) / 1e-6)}\times 10^{-6}$. Axial strain: that over $\nu$, $${sig(($.shrink / $.d / $.nu) / 1e-6)}\times 10^{-6}$.`,
      String.raw`$\sigma = E\varepsilon = ${sig($.sigma / MPA)}$ MPa, and $P = \sigma A = ${sig($.P / KN)}$ kN.`,
      String.raw`Lengthening: $\varepsilon L = ${sig($.stretch / MM)}$ mm.`,
    ],
    second: ($) => {
      // Forward check: this tension, through Hooke and Poisson, shrinks the diameter by exactly the target.
      const P = ($.shrink * Math.PI * $.d * $.E) / (4 * $.nu);
      const A = circleArea($.d);
      const epsAx = hookeStrain(P / A, $.E);
      return { P: P / KN, sigma: (P / A) / MPA, stretch: (epsAx * $.L) / MM };
    },
    cases: [kase(cite('poisson'), { mat: 'steel', d: 20, shrink: 6, L: 1 }, { P: 62.83185307179587, sigma: 200, stretch: 1 })],
  }),

];

export default ch2;

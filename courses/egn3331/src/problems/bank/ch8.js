/**
 * Thin-walled pressure vessels and generalized Hooke's law.
 * Cylinder, sphere, a 20 lb propane tank in ksi, an allowable pressure,
 * three-dimensional strain, and the transverse stress hidden in a measured strain.
 */
import { M_PER_IN, PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  hooke3, hoopFromSplit, sphereFromCap, thinCylinder, thinSphere,
} from '@flux/subjects/mechanics/materials.js';
import { TANK_OD_IN, TANK_R, TANK_T } from '../../data/tank.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

const MPA = 1e6;
const MM = 1e-3;
const KSI = 1000 * PA_PER_PSI;
const E = 200e9;
const RI_IN = 12.2 / 2 - 0.078;
const T_IN = 0.078;

const rel = (a, b) => Math.abs(a - b) > 0.05 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

const ch8 = [
  problem({
    id: 'u4.8.cylinder',
    title: 'Hoop and longitudinal stress',
    exam: 'u4',
    ch: '8',
    lab: 'vessel',
    src: cite('pressure-vessels'),
    topics: ['pressure-vessels'],
    variety: ['unknown'],
    level: 1,
    vars: {
      p: range(0.5, 4, 0.1, 'MPa', MPA),
      r: range(80, 300, 10, 'mm', MM),
      t: range(2, 12, 0.5, 'mm', MM),
    },
    valid: ($) => $.r / $.t >= 10 && thinCylinder($.p, $.r, $.t).hoop < 400e6,
    text: (T) => String.raw`A closed thin-walled cylinder has an inside radius of $${T.r}$ mm and a wall of $${T.t}$ mm. The internal pressure is $${T.p}$ MPa. Find the hoop stress and the longitudinal stress.`,
    parts: [
      num('hoop', ($) => thinCylinder($.p, $.r, $.t).hoop, 'MPa', {
        scale: MPA,
        label: 'hoop stress',
        traps: [
          [($) => thinCylinder($.p, $.r, $.t).axial, 'That is the longitudinal stress, $pr/(2t)$.'],
          [($) => ($.p * 2 * $.r) / $.t, 'The diameter was used in place of the inside radius.'],
        ],
      }),
      num('axial', ($) => thinCylinder($.p, $.r, $.t).axial, 'MPa', {
        scale: MPA,
        label: 'longitudinal stress',
        traps: [
          [($) => thinCylinder($.p, $.r, $.t).hoop, 'That is the hoop stress. The longitudinal stress is half of it.'],
          [($) => ($.p * 2 * $.r) / $.t, 'The diameter was put into the hoop formula $pr/t$. Longitudinal stress is $pr/(2t)$ with the radius.'],
        ],
      }),
    ],
    hints: [
      'Split the cylinder along its length. The pressure on the projected diameter is carried by two walls, and that stress is the hoop stress.',
      String.raw`Hoop stress is $pr/t$. The stress along a closed cylinder is half of that.`,
    ],
    steps: ($, sig) => {
      const s = thinCylinder($.p, $.r, $.t);
      return [
        String.raw`$\sigma_h = pr/t = ${sig(s.hoop / MPA)}$ MPa.`,
        String.raw`$\sigma_l = pr/(2t) = ${sig(s.axial / MPA)}$ MPa.`,
      ];
    },
    second: ($) => {
      const hoop = hoopFromSplit($.p, $.r, $.t) / MPA;
      return { hoop, axial: hoop / 2 };
    },
    sim: {
      scenario: 'cylinder',
      setup(s, $) {
        s.kind = 'cylinder';
        s.p = $.p;
        s.r = $.r;
        s.t = $.t;
      },
      read: (c) => ({ hoop: c.hoop, axial: c.axial }),
    },
    cases: [kase(cite('pressure-vessels'), { p: 2, r: 200, t: 5 }, { hoop: 80, axial: 40 })],
  }),

  problem({
    id: 'u4.8.sphere',
    title: 'Membrane stress in a sphere',
    exam: 'u4',
    ch: '8',
    lab: 'vessel',
    src: cite('pressure-vessels'),
    topics: ['sphere'],
    variety: ['configuration'],
    level: 2,
    vars: {
      p: range(0.5, 4, 0.1, 'MPa', MPA),
      r: range(80, 300, 10, 'mm', MM),
      t: range(2, 12, 0.5, 'mm', MM),
    },
    valid: ($) => $.r / $.t >= 10 && thinSphere($.p, $.r, $.t).hoop < 400e6,
    text: (T) => String.raw`A thin-walled sphere has an inside radius of $${T.r}$ mm and a wall of $${T.t}$ mm. The internal pressure is $${T.p}$ MPa. Find the membrane stress.`,
    parts: [
      num('hoop', ($) => thinSphere($.p, $.r, $.t).hoop, 'MPa', {
        scale: MPA,
        label: 'membrane stress',
        traps: [
          [($) => thinCylinder($.p, $.r, $.t).hoop, 'That is the cylinder hoop stress, $pr/t$. A sphere is $pr/(2t)$.'],
          [($) => ($.p * 2 * $.r) / $.t, 'The diameter was used, and the factor of 2 in the sphere formula was left out.'],
        ],
      }),
    ],
    hints: [
      'Cut the sphere into a hemisphere. The pressure on the flat circle is carried by the wall around the rim.',
      String.raw`The balance is $\pi r^{2} p = \sigma (2\pi r t)$, so $\sigma = pr/(2t)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$\sigma = pr/(2t) = ${sig(thinSphere($.p, $.r, $.t).hoop / MPA)}$ MPa.`,
    ],
    second: ($) => ({ hoop: sphereFromCap($.p, $.r, $.t) / MPA }),
    sim: {
      scenario: 'sphere',
      setup(s, $) {
        s.kind = 'sphere';
        s.p = $.p;
        s.r = $.r;
        s.t = $.t;
      },
      read: (c) => ({ hoop: c.hoop }),
    },
    cases: [kase(cite('pressure-vessels'), { p: 2, r: 200, t: 5 }, { hoop: 40 })],
  }),

  problem({
    id: 'u4.8.allow',
    title: 'Pressure allowed by the hoop stress',
    exam: 'u4',
    ch: '8',
    lab: 'vessel',
    src: cite('pressure-vessels'),
    topics: ['pressure-vessels'],
    variety: ['unknown'],
    level: 2,
    vars: {
      sig: range(40, 200, 5, 'MPa', MPA),
      r: range(80, 250, 10, 'mm', MM),
      t: range(3, 12, 0.5, 'mm', MM),
    },
    valid: ($) => $.r / $.t >= 10,
    text: (T) => String.raw`A closed thin cylinder has an inside radius of $${T.r}$ mm and a wall of $${T.t}$ mm. The hoop stress must stay at or below $${T.sig}$ MPa. Find the largest internal pressure.`,
    parts: [
      num('p', ($) => ($.sig * $.t) / $.r, 'MPa', {
        scale: MPA,
        label: 'pressure',
        traps: [
          [($) => (2 * $.sig * $.t) / $.r, 'That inverts the longitudinal formula. The hoop stress reaches the limit first, and hoop stress is $pr/t$.'],
          [($) => ($.sig * $.r) / $.t, 'The radius and the thickness were swapped. Pressure is stress times $t/r$.'],
        ],
      }),
    ],
    hints: [
      'The hoop stress reaches an allowable before the longitudinal stress does. Solve $pr/t$ for the pressure.',
      String.raw`The largest pressure is $\sigma t/r$.`,
    ],
    steps: ($, sig) => [
      String.raw`$p = \sigma t/r = ${sig(($.sig * $.t) / ($.r * MPA))}$ MPa.`,
    ],
    second: ($) => ({ p: ($.sig / MPA) * ($.t / MM) / ($.r / MM) }),
    sim: {
      scenario: 'cylinder',
      setup(s, $) {
        s.kind = 'cylinder';
        s.r = $.r;
        s.t = $.t;
        s.p = ($.sig * $.t) / $.r;
      },
      read: (c) => ({ p: c.p }),
    },
    cases: [kase(cite('pressure-vessels'), { sig: 80, r: 200, t: 5 }, { p: 2 })],
  }),

  problem({
    id: 'u4.8.tank-english',
    title: 'A 20 lb propane cylinder',
    exam: 'u4',
    ch: '8',
    lab: 'tank',
    src: cite('pressure-vessels'),
    topics: ['pressure-vessels', 'english'],
    variety: ['representation'],
    level: 2,
    vars: {
      p: range(20, 240, 4, 'psi', PA_PER_PSI),
    },
    text: (T) => String.raw`A Manchester Tank model 10504 propane cylinder is 12.2 in in outside diameter and is marked DOT-4BA240. 49 CFR 178.51 requires a wall of at least 0.078 in when the outside diameter exceeds 6 in. Use that minimum as the wall, and the inside radius. The pressure is $${T.p}$ psi. Find the hoop stress and the longitudinal stress in ksi.`,
    parts: [
      num('hoop', ($) => thinCylinder($.p, TANK_R, TANK_T).hoop, 'ksi', {
        scale: KSI,
        label: 'hoop stress',
        traps: [
          [($) => thinCylinder($.p, TANK_R, TANK_T).axial, 'That is the longitudinal stress. The hoop stress is twice as large.'],
          [($) => ($.p * TANK_OD_IN * M_PER_IN) / TANK_T, 'The outside diameter was used as the radius in $pr/t$. The inside radius is half the outside diameter, minus the wall.'],
        ],
      }),
      num('axial', ($) => thinCylinder($.p, TANK_R, TANK_T).axial, 'ksi', {
        scale: KSI,
        label: 'longitudinal stress',
        traps: [
          [($) => thinCylinder($.p, TANK_R, TANK_T).hoop, 'That is the hoop stress. Along the cylinder the stress is half.'],
          [($) => thinCylinder($.p, TANK_R, TANK_T).axial * 1000, 'That number is the stress in psi. Divide by 1000 to report ksi.'],
        ],
      }),
    ],
    hints: [
      'Treat the shell as a closed thin cylinder. The inside radius is half the outside diameter, minus the wall.',
      String.raw`With pressure in psi and radius and thickness in inches, $pr/t$ is the hoop stress in psi. Divide by 1000 for ksi. The longitudinal stress is half.`,
    ],
    steps: ($, sig) => {
      const s = thinCylinder($.p, TANK_R, TANK_T);
      return [
        String.raw`Inside radius $= 6.1 - 0.078 = ${sig(RI_IN)}$ in.`,
        String.raw`$\sigma_h = pr/t = ${sig(s.hoop / KSI)}$ ksi. $\sigma_l = ${sig(s.axial / KSI)}$ ksi.`,
      ];
    },
    second: ($) => {
      const psi = $.p / PA_PER_PSI;
      const hoop = (psi * RI_IN) / T_IN / 1000;
      return { hoop, axial: hoop / 2 };
    },
    sim: {
      scenario: 'service',
      setup(s, $) { s.p = $.p; },
      read: (c) => ({ hoop: c.hoop, axial: c.axial }),
    },
    cases: [kase(cite('pressure-vessels'), { p: 240 }, { hoop: 18.52923076923077, axial: 9.264615384615385 })],
  }),

  problem({
    id: 'u4.10.hooke',
    title: 'Strain with a transverse stress',
    exam: 'u4',
    ch: '10',
    lab: 'strain3',
    src: cite('poisson'),
    topics: ['poisson'],
    variety: ['representation'],
    level: 2,
    vars: {
      sx: range(40, 160, 5, 'MPa', MPA),
      sy: range(20, 140, 5, 'MPa', MPA),
    },
    valid: ($) => Math.abs($.sy) >= 0.25 * Math.abs($.sx),
    text: (T) => String.raw`A steel with $E = 200$ GPa and $\nu = 0.30$ carries $\sigma_x = ${T.sx}$ MPa and $\sigma_y = ${T.sy}$ MPa. $\sigma_z = 0$. Find the normal strains $\varepsilon_x$ and $\varepsilon_y$.`,
    parts: [
      num('ex', ($) => hooke3($.sx, $.sy, 0, E, 0.3).ex, 'millistrain', {
        scale: 1e-3,
        label: 'strain along x',
        traps: [
          [($) => $.sx / E, 'That is $\\sigma_x/E$. The transverse stress was left out.'],
          [($) => ($.sx + 0.3 * $.sy) / E, 'Poisson subtracts the transverse stress. The sign was added instead.'],
        ],
      }),
      num('ey', ($) => hooke3($.sx, $.sy, 0, E, 0.3).ey, 'millistrain', {
        scale: 1e-3,
        label: 'strain along y',
        traps: [
          [($) => -0.3 * $.sx / E, 'That is the side strain of a uniaxial stress. $\\sigma_y$ has its own term.'],
          [($) => ($.sy + 0.3 * $.sx) / E, 'The Poisson term from $\\sigma_x$ was added. It subtracts.'],
        ],
      }),
    ],
    hints: [
      'Each normal strain feels its own stress directly and the other normal stresses through Poisson\'s ratio.',
      String.raw`$\varepsilon_x = [\sigma_x - \nu(\sigma_y + \sigma_z)]/E$. Swap the labels for $\varepsilon_y$.`,
    ],
    steps: ($, sig) => {
      const h = hooke3($.sx, $.sy, 0, E, 0.3);
      return [
        String.raw`$\varepsilon_x = [${sig($.sx / MPA)} - 0.30(${sig($.sy / MPA)})]/200 = ${sig(h.ex / 1e-3)}$ millistrain.`,
        String.raw`$\varepsilon_y = [${sig($.sy / MPA)} - 0.30(${sig($.sx / MPA)})]/200 = ${sig(h.ey / 1e-3)}$ millistrain.`,
      ];
    },
    second: ($) => {
      const ex = ($.sx / MPA - 0.3 * $.sy / MPA) / 200;
      const ey = ($.sy / MPA - 0.3 * $.sx / MPA) / 200;
      return { ex, ey };
    },
    sim: {
      scenario: 'uni',
      setup(s, $) {
        s.sx = $.sx;
        s.sy = $.sy;
        s.sz = 0;
        s.nu = 0.3;
      },
      read: (c) => ({ ex: c.ex, ey: c.ey }),
    },
    cases: [kase(cite('poisson'), { sx: 100, sy: 100 }, { ex: 0.35, ey: 0.35 })],
  }),

  problem({
    id: 'u4.10.hidden',
    title: 'The transverse stress in a measured strain',
    exam: 'u4',
    ch: '10',
    lab: 'strain3',
    src: cite('poisson'),
    topics: ['hidden'],
    variety: ['unknown'],
    level: 3,
    vars: {
      sx: range(40, 160, 5, 'MPa', MPA),
      ex: range(0.1, 0.7, 0.02, 'millistrain', 1e-3),
      nu: range(0.25, 0.35, 0.01, '', 1),
    },
    valid: ($) => {
      const sy = ($.sx - $.ex * E) / $.nu;
      const forgot = $.sx - $.ex * E;
      return Math.abs(sy) <= 180e6 && Math.abs(sy) >= 8e6 && rel(sy, forgot) && rel(sy, 0);
    },
    text: (T) => String.raw`A steel with $E = 200$ GPa and $\nu = ${T.nu}$ carries $\sigma_x = ${T.sx}$ MPa and $\sigma_z = 0$. A gauge reads $\varepsilon_x = ${T.ex}$ millistrain. Find $\sigma_y$.`,
    parts: [
      num('sy', ($) => ($.sx - $.ex * E) / $.nu, 'MPa', {
        scale: MPA,
        label: 'transverse stress',
        traps: [
          [($) => $.sx - $.ex * E, 'That is $\\sigma_x - E\\varepsilon_x$. Poisson\'s ratio still has to divide it.'],
          [() => 0, 'That would be the answer if the strain were $\\sigma_x/E$. The gauge does not match that strain, so a transverse stress is present.'],
        ],
      }),
    ],
    hints: [
      'Write the generalized Hooke law for εx and solve it for the unknown transverse stress. σz is zero.',
      String.raw`$\sigma_y = (\sigma_x - E\varepsilon_x)/\nu$.`,
    ],
    steps: ($, sig) => {
      const sy = ($.sx - $.ex * E) / $.nu;
      return [
        String.raw`$E\varepsilon_x = ${sig(($.ex * E) / MPA)}$ MPa.`,
        String.raw`$\sigma_y = (\sigma_x - E\varepsilon_x)/\nu = ${sig(sy / MPA)}$ MPa.`,
      ];
    },
    second: ($) => ({ sy: ($.sx / MPA - ($.ex / 1e-3) * (E / 1e9)) / $.nu }),
    sim: {
      scenario: 'uni',
      setup(s, $) {
        s.sx = $.sx;
        s.sz = 0;
        s.nu = $.nu;
        s.sy = ($.sx - $.ex * E) / $.nu;
      },
      read: (c) => ({ sy: c.sy }),
    },
    cases: [kase(cite('poisson'), { sx: 100, ex: 0.35, nu: 0.3 }, { sy: 100 })],
  }),

  problem({
    id: 'u4.8.which',
    title: 'Which membrane stress is larger',
    exam: 'u4',
    ch: '8',
    lab: 'vessel',
    src: cite('pressure-vessels'),
    kind: 'conceptual',
    topics: ['pressure-vessels'],
    variety: ['configuration'],
    level: 1,
    vars: {
      shape: choice(['cylinder', 'a closed cylinder'], ['sphere', 'a sphere']),
      p: range(0.5, 4, 0.1, 'MPa', MPA),
    },
    text: (T) => String.raw`A thin-walled vessel is ${T.shape}. The internal pressure is $${T.p}$ MPa. Which membrane stress is larger?`,
    parts: [
      mc('which', [
        ['hoop', 'The hoop stress.', 'In a closed cylinder the hoop stress is twice the longitudinal stress.'],
        ['long', 'The longitudinal stress.', 'The longitudinal stress is the smaller one in a closed cylinder, and it equals the hoop stress in a sphere.'],
        ['equal', 'They are equal.', 'A sphere has one membrane stress. A closed cylinder does not.'],
        ['zero', 'Both are zero, because the wall is thin.', 'Thin means the stress is nearly uniform through the wall. It does not mean the stress is zero.'],
      ], ($) => ($.shape === 'sphere' ? 'equal' : 'hoop')),
    ],
    hints: [
      'Compare pr/t with pr/(2t). A sphere has only the second of those.',
      'A closed cylinder splits along its length because that direction carries the larger stress.',
    ],
    steps: ($) => [
      $.shape === 'sphere'
        ? 'A sphere carries pr/(2t) in every membrane direction, so the two stresses match.'
        : 'A closed cylinder carries pr/t around the wall and pr/(2t) along it. The hoop stress is larger.',
    ],
    second: ($) => ({ which: $.shape === 'sphere' ? 'equal' : 'hoop' }),
    sim: {
      scenario: 'cylinder',
      setup(s, $) {
        s.kind = $.shape;
        s.p = $.p;
        s.r = 0.2;
        s.t = 0.005;
      },
      read: (c) => {
        if (Math.abs(c.hoop - c.axial) / Math.max(c.hoop, 1) < 0.01) return { which: 'equal' };
        return { which: c.hoop > c.axial ? 'hoop' : 'long' };
      },
    },
    cases: [
      kase(cite('pressure-vessels'), { shape: 'cylinder', p: 2 }, { which: 'hoop' }),
      kase(cite('pressure-vessels'), { shape: 'sphere', p: 2 }, { which: 'equal' }),
    ],
  }),

  problem({
    id: 'u4.10.transverse',
    title: 'What a transverse stress does to εx',
    exam: 'u4',
    ch: '10',
    lab: 'strain3',
    src: cite('poisson'),
    kind: 'conceptual',
    topics: ['poisson'],
    variety: ['configuration'],
    level: 1,
    vars: {
      add: choice(
        ['tension', 'an equal transverse tension is added'],
        ['compression', 'an equal transverse compression is added'],
        ['none', 'no transverse stress is added'],
      ),
      sx: range(40, 180, 5, 'MPa', MPA),
    },
    text: (T) => String.raw`A bar with $\nu = 0.30$ is under uniaxial tension $\sigma_x = ${T.sx}$ MPa. Then ${T.add}. What happens to $\varepsilon_x$, compared with $\sigma_x/E$?`,
    parts: [
      mc('effect', [
        ['smaller', 'εx becomes smaller than σx/E.', 'A transverse tension is subtracted, through ν, from the axial strain.'],
        ['bigger', 'εx becomes larger than σx/E.', 'A transverse compression makes the Poisson term add to the axial stretch.'],
        ['same', 'εx stays equal to σx/E.', 'That is true only while the other normal stresses are zero.'],
        ['flips', 'εx changes sign.', 'The axial stress is still tension, and ν times a comparable transverse stress does not overcome it.'],
      ], ($) => ($.add === 'tension' ? 'smaller' : $.add === 'compression' ? 'bigger' : 'same')),
    ],
    hints: [
      'In the generalized law the transverse stress appears with a minus sign in front of ν.',
      'A positive σy reduces εx. A negative σy increases it. Zero leaves εx at σx/E.',
    ],
    steps: ($) => [
      $.add === 'tension'
        ? 'Equal transverse tension makes εx = (1 − ν)σx/E, which is smaller than σx/E.'
        : $.add === 'compression'
          ? 'Equal transverse compression makes εx = (1 + ν)σx/E, which is larger than σx/E.'
          : 'With no transverse stress, εx is σx/E.',
    ],
    second: ($) => ({ effect: $.add === 'tension' ? 'smaller' : $.add === 'compression' ? 'bigger' : 'same' }),
    sim: {
      scenario: 'uni',
      setup(s, $) {
        s.sx = $.sx;
        s.sz = 0;
        s.nu = 0.3;
        s.sy = $.add === 'tension' ? $.sx : $.add === 'compression' ? -$.sx : 0;
      },
      read: (c) => {
        const uni = c.sx / E;
        if (Math.abs(c.ex - uni) <= 0.01 * Math.abs(uni)) return { effect: 'same' };
        return { effect: c.ex < uni ? 'smaller' : 'bigger' };
      },
    },
    cases: [
      kase(cite('poisson'), { add: 'tension', sx: 100 }, { effect: 'smaller' }),
      kase(cite('poisson'), { add: 'compression', sx: 100 }, { effect: 'bigger' }),
      kase(cite('poisson'), { add: 'none', sx: 100 }, { effect: 'same' }),
    ],
  }),

  problem({
    id: 'u4.8.scale',
    title: 'What halves the hoop stress',
    exam: 'u4',
    ch: '8',
    lab: 'vessel',
    src: cite('pressure-vessels'),
    kind: 'conceptual',
    topics: ['pressure-vessels'],
    variety: ['representation'],
    level: 2,
    vars: {
      change: choice(
        ['wall', 'the thickness is doubled'],
        ['pressure', 'the pressure is doubled'],
        ['radius', 'the inside radius is doubled'],
        ['both', 'the pressure and the thickness are both doubled'],
      ),
      p: range(0.5, 3, 0.1, 'MPa', MPA),
    },
    text: (T) => String.raw`A closed thin cylinder is at $${T.p}$ MPa. Then ${T.change}. What happens to the hoop stress?`,
    parts: [
      mc('effect', [
        ['halves', 'The hoop stress is cut in half.', 'Hoop stress is pr/t, so doubling the thickness halves it, and doubling pressure and thickness together leaves it unchanged.'],
        ['doubles', 'The hoop stress doubles.', 'Pressure and radius are both in the numerator.'],
        ['same', 'The hoop stress is unchanged.', 'The pressure and the thickness have to change by the same factor for pr/t to stay put.'],
        ['zero', 'The hoop stress drops to zero.', 'None of these changes removes the pressure or the radius.'],
      ], ($) => ($.change === 'wall' ? 'halves' : $.change === 'both' ? 'same' : 'doubles')),
    ],
    hints: [
      'Write pr/t and see which symbol changed, and whether it sits on the top or the bottom.',
      'Doubling the top doubles the stress. Doubling the bottom halves it. Doubling both cancels.',
    ],
    steps: ($) => [
      $.change === 'wall'
        ? 'Thickness is in the denominator, so doubling it halves the hoop stress.'
        : $.change === 'both'
          ? 'Pressure and thickness both double, so pr/t is unchanged.'
          : 'That quantity is in the numerator of pr/t, so the hoop stress doubles.',
    ],
    second: ($) => ({ effect: $.change === 'wall' ? 'halves' : $.change === 'both' ? 'same' : 'doubles' }),
    sim: {
      scenario: 'cylinder',
      setup(s, $) {
        s.kind = 'cylinder';
        s.p = $.p;
        s.r = 0.2;
        s.t = 0.005;
        if ($.change === 'wall') s.t *= 2;
        if ($.change === 'pressure') s.p *= 2;
        if ($.change === 'radius') s.r *= 2;
        if ($.change === 'both') { s.p *= 2; s.t *= 2; }
      },
      read: (c, state, $) => {
        const base = thinCylinder($.p, 0.2, 0.005).hoop;
        const ratio = c.hoop / base;
        if (Math.abs(ratio - 1) < 0.02) return { effect: 'same' };
        if (Math.abs(ratio - 0.5) < 0.02) return { effect: 'halves' };
        return { effect: 'doubles' };
      },
    },
    cases: [
      kase(cite('pressure-vessels'), { change: 'wall', p: 2 }, { effect: 'halves' }),
      kase(cite('pressure-vessels'), { change: 'pressure', p: 2 }, { effect: 'doubles' }),
      kase(cite('pressure-vessels'), { change: 'both', p: 2 }, { effect: 'same' }),
    ],
  }),
];

export default ch8;

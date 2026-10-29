/**
 * Torsion of circular shafts: stress and angle, a hollow section, power,
 * a stepped shaft, fixed ends, a motor shaft in English units, the diameter set by stress and by
 * twist together, a rectangular tube by Bredt, a rectangular bar, a slit tube, and a shoulder's Kt.
 */
import { PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  fixedFixedTorsion, polarJ, roundShaft, seriesTwist, solidDiameterForShear,
  solidDiameterRequired, torqueFromHorsepower, torqueFromPower,
} from '@flux/subjects/mechanics/torsion.js';
import { bredt, openThin, rectTorsion, rectTorsionDouble } from '@flux/subjects/mechanics/noncircular.js';
import { HP_WATT, MOTOR_D_IN, MOTOR_L_IN, motorInches, motorShaft } from '../../data/motor.js';
import { choice, cite, kase, mc, num, problem, range, sym } from '../kit.js';

const G = 75e9;
const E_STEEL = 200e9;
const MPA = 1e6;
const KSI = 1000 * PA_PER_PSI;
const DEG = Math.PI / 180;
const MM = 1e-3;

const rel = (a, b) => Math.abs(a - b) > 0.05 * Math.max(Math.abs(a), Math.abs(b), 1e-9);

function stepShaft($) {
  return seriesTwist([
    { d: $.d1, L: $.L1 },
    { d: $.d2, L: $.L2 },
  ], G, $.T);
}

function searchDiameter($) {
  const T = torqueFromPower($.P, $.rpm).T;
  let lo = 1e-3;
  let hi = 1;
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    const J = (Math.PI / 32) * mid ** 4;
    const tau = (T * (mid / 2)) / J;
    const phi = (T * $.L) / (G * J);
    if (tau <= $.tau && phi <= $.ang) hi = mid;
    else lo = mid;
  }
  return ((lo + hi) / 2) * 1000;
}

const ch5 = [
  problem({
    id: 'u9.5.solid',
    title: 'Solid shaft, stress and angle',
    exam: 'u9',
    ch: '5',
    lab: 'torsion',
    src: cite('torsion'),
    topics: ['torsion', 'solid'],
    variety: ['representation'],
    level: 1,
    vars: {
      T: range(200, 800, 50, 'N·m'),
      d: range(25, 60, 5, 'mm', MM),
      L: range(0.4, 2, 0.2, 'm'),
    },
    text: (T) => String.raw`A solid steel shaft, ${T.d} mm in diameter and ${T.L} m long, carries ${T.T} N·m. G is 75 GPa. Find the shear stress at the outside and the angle of twist in degrees. Then write the outside stress as a formula in $T$ and $d$.`,
    parts: [
      num('tau', ($) => roundShaft($.T, $.L, G, $.d, 0).tauMax, 'MPa', {
        scale: MPA,
        label: 'outer shear stress',
        traps: [
          [($) => (32 * $.T) / (Math.PI * $.d ** 3), 'J was taken as the second moment I. For a circle, J = 2I, so that stress is twice the torsion stress.'],
          [($) => (16 * $.T) / (Math.PI * $.d ** 2), 'One power of the diameter was dropped. The stress is 16T over πd³, not πd².'],
        ],
      }),
      num('phi', ($) => roundShaft($.T, $.L, G, $.d, 0).phi, 'deg', {
        scale: DEG,
        label: 'angle of twist',
        traps: [
          [($) => (2 * $.T * $.L) / (G * polarJ($.d / 2, 0)), 'The angle used I in place of J, so it is twice TL/GJ.'],
          [($) => ($.T * $.L) / (E_STEEL * polarJ($.d / 2, 0)), 'E was used in place of G. The angle of twist is TL/GJ.'],
        ],
      }),
      sym('tsym', '16*T/(pi*d^3)', { T: 'N*m', d: 'm' }, ($) => (16 * $.T) / (Math.PI * $.d ** 3), { unit: 'Pa', label: 'outside stress, as a formula' }),
    ],
    hints: [
      'Shear stress at a radius is torque times that radius over the polar moment. The angle is torque times length over G J.',
      String.raw`The stress is largest where $\rho$ is largest, at the outside. For the angle use the polar moment of the solid circle and $G$, not $E$.`,
    ],
    steps: ($, sig) => {
      const shaft = roundShaft($.T, $.L, G, $.d, 0);
      const J = polarJ($.d / 2, 0);
      return [
        String.raw`$J = \pi d^4/32 = ${sig(J / 1e-12 / 1e3)}\times 10^3$ mm⁴.`,
        String.raw`At the outside, $\rho = d/2$: $\tau = T\rho/J = ${sig(shaft.tauMax / MPA)}$ MPa.`,
        String.raw`$\phi = TL/GJ = ${sig(shaft.phi)}$ rad $= ${sig((shaft.phi * 180) / Math.PI)}$°.`,
      ];
    },
    second: ($) => {
      const J = (Math.PI * $.d ** 4) / 32;
      return {
        tau: (16 * $.T) / (Math.PI * $.d ** 3) / MPA,
        phi: (($.T * $.L) / (G * J)) / DEG,
      };
    },
    sim: {
      scenario: 'solid',
      setup(s, $) {
        s.scenarioId = 'solid';
        s.T = $.T;
        s.d = $.d;
        s.di = 0;
        s.L = $.L;
        s.G = G;
        s.rho = $.d / 2;
      },
      read: (c) => ({ tau: c.tauMax, phi: c.phi }),
    },
    cases: [kase(cite('torsion'), { T: 500, d: 40, L: 1.2 }, { tau: 39.78873577297384, phi: 1.82378130556208 })],
  }),

  problem({
    id: 'u9.5.hollow',
    title: 'Hollow shaft',
    exam: 'u9',
    ch: '5',
    lab: 'torsion',
    src: cite('torsion'),
    topics: ['torsion', 'hollow'],
    variety: ['configuration'],
    level: 2,
    vars: {
      T: range(200, 800, 100, 'N·m'),
      d: range(40, 80, 5, 'mm', MM),
      di: range(20, 60, 5, 'mm', MM),
    },
    valid: ($) => {
      const k = $.di / $.d;
      if (!(k >= 0.55 && k <= 0.8)) return false;
      const tube = roundShaft($.T, 1, G, $.d, $.di);
      const solid = roundShaft($.T, 1, G, $.d, 0);
      const wall = (16 * $.T) / (Math.PI * ($.d - $.di) ** 3);
      return rel(tube.tauMax, solid.tauMax) && rel(tube.tauMax, wall) && rel(tube.tauIn, tube.tauMax);
    },
    text: (T) => String.raw`A tube of outside diameter ${T.d} mm and inside diameter ${T.di} mm carries ${T.T} N·m. Find the shear stress at the outside and at the bore.`,
    parts: [
      num('tau', ($) => roundShaft($.T, 1, G, $.d, $.di).tauMax, 'MPa', {
        scale: MPA,
        label: 'outer shear stress',
        traps: [
          [($) => roundShaft($.T, 1, G, $.d, 0).tauMax, 'The bore was ignored, so this is the solid shaft of the outside diameter.'],
          [($) => (16 * $.T) / (Math.PI * ($.d - $.di) ** 3), 'The wall thickness was used as if it were the diameter of a solid shaft.'],
        ],
      }),
      num('inner', ($) => roundShaft($.T, 1, G, $.d, $.di).tauIn, 'MPa', {
        scale: MPA,
        label: 'shear stress at the bore',
        traps: [
          [() => 0, 'The bore is material, not the axis. Stress there is not zero.'],
          [($) => roundShaft($.T, 1, G, $.d, $.di).tauMax, 'That is the outside stress. Stress grows with radius, so the bore is lower.'],
        ],
      }),
    ],
    hints: [
      'Stress is still linear in the radius. The polar moment of a tube is the solid moment of the outside minus the solid moment of the bore.',
      String.raw`A tube's polar moment is the outer circle's less the bore's. The bore stress uses $\rho$ at the bore, on the same straight line through the centre.`,
    ],
    steps: ($, sig) => {
      const shaft = roundShaft($.T, 1, G, $.d, $.di);
      const J = polarJ($.d / 2, $.di / 2);
      return [
        String.raw`$J = \pi(d_o^4 - d_i^4)/32 = ${sig(J / 1e-12 / 1e3)}\times 10^3$ mm⁴.`,
        String.raw`Outside, $\rho = ${sig($.d / 2 / MM)}$ mm: $\tau = T\rho/J = ${sig(shaft.tauMax / MPA)}$ MPa.`,
        String.raw`Bore, $\rho = ${sig($.di / 2 / MM)}$ mm: $\tau = ${sig(shaft.tauIn / MPA)}$ MPa, the outside stress times $d_i/d_o$.`,
      ];
    },
    second: ($) => {
      const J = (Math.PI / 32) * ($.d ** 4 - $.di ** 4);
      const outer = ($.T * ($.d / 2)) / J / MPA;
      return { tau: outer, inner: outer * ($.di / $.d) };
    },
    sim: {
      scenario: 'hollow',
      setup(s, $) {
        s.scenarioId = 'hollow';
        s.T = $.T;
        s.d = $.d;
        s.di = $.di;
        s.L = 1.2;
        s.G = G;
        s.rho = $.d / 2;
      },
      read: (c) => ({ tau: c.tauMax, inner: c.tauIn }),
    },
    cases: [kase(cite('torsion'), { T: 500, d: 40, di: 30 }, { tau: 58.20523633075028, inner: 43.653927248062715 })],
  }),

  problem({
    id: 'u9.5.power',
    title: 'Power and shaft stress',
    exam: 'u9',
    ch: '5',
    lab: 'twist',
    src: cite('torsion'),
    topics: ['torsion', 'power'],
    variety: ['representation'],
    level: 2,
    vars: {
      P: range(5, 40, 5, 'kW', 1000),
      rpm: range(600, 3000, 300, 'rpm'),
      d: range(20, 50, 5, 'mm', MM),
      L: range(0.4, 1.6, 0.2, 'm'),
    },
    text: (T) => String.raw`A solid shaft ${T.d} mm in diameter and ${T.L} m long transmits ${T.P} kW at ${T.rpm} rpm. G is 75 GPa. Find the torque and the outer shear stress.`,
    parts: [
      num('T', ($) => torqueFromPower($.P, $.rpm).T, 'N·m', {
        label: 'torque',
        traps: [
          [($) => $.P / ($.rpm / 60), 'The speed was used as revolutions per second, without the 2π that makes it radians per second.'],
          [($) => $.P * $.rpm * DEG * 60, 'Power was multiplied by the speed. Torque is power divided by ω.'],
        ],
      }),
      num('tau', ($) => {
        const T = torqueFromPower($.P, $.rpm).T;
        return roundShaft(T, $.L, G, $.d, 0).tauMax;
      }, 'MPa', {
        scale: MPA,
        label: 'outer shear stress',
        traps: [
          [($) => {
            const T = $.P / ($.rpm / 60);
            return roundShaft(T, $.L, G, $.d, 0).tauMax;
          }, 'The torque missed the factor 2π, and the stress was built on that torque.'],
          [($) => {
            const T = torqueFromPower($.P, $.rpm).T;
            return (T * $.d) / polarJ($.d / 2, 0);
          }, 'The diameter was used as the radius. The outside is at d/2.'],
        ],
      }),
    ],
    hints: [
      'Torque is power divided by the angular speed in radians per second. A revolution is one full turn.',
      String.raw`Power is torque times angular speed. Turn the speed into radians per second before you divide.`,
    ],
    steps: ($, sig) => {
      const T = torqueFromPower($.P, $.rpm).T;
      const tau = roundShaft(T, $.L, G, $.d, 0).tauMax;
      return [
        String.raw`$\omega = 2\pi n/60 = ${sig((2 * Math.PI * $.rpm) / 60)}$ rad/s.`,
        String.raw`$T = P/\omega = ${sig(T)}$ N·m.`,
        String.raw`$\tau = 16T/\pi d^3 = ${sig(tau / MPA)}$ MPa.`,
      ];
    },
    second: ($) => {
      const hp = $.P / HP_WATT;
      const T = torqueFromHorsepower(hp, $.rpm).T;
      return { T, tau: (16 * T) / (Math.PI * $.d ** 3) / MPA };
    },
    sim: {
      scenario: 'power',
      setup(s, $) {
        s.scenarioId = 'power';
        s.P = $.P;
        s.rpm = $.rpm;
        s.d = $.d;
        s.L = $.L;
        s.G = G;
      },
      read: (c) => ({ T: c.T, tau: c.tau }),
    },
    cases: [kase(cite('torsion'), { P: 20, rpm: 1800, d: 30, L: 0.8 }, { T: 106.1032953945969, tau: 20.01406096638771 })],
  }),

  problem({
    id: 'u9.5.step',
    title: 'Stepped shaft',
    exam: 'u9',
    ch: '5',
    lab: 'twist',
    src: cite('torsion'),
    topics: ['torsion', 'stepped'],
    variety: ['configuration'],
    level: 2,
    vars: {
      T: range(150, 600, 50, 'N·m'),
      d1: range(30, 60, 5, 'mm', MM),
      L1: range(0.3, 1.2, 0.1, 'm'),
      d2: range(20, 40, 5, 'mm', MM),
      L2: range(0.2, 0.8, 0.1, 'm'),
    },
    valid: ($) => {
      const series = stepShaft($);
      const thick = ($.T * ($.L1 + $.L2)) / (G * polarJ($.d1 / 2, 0));
      const thin = ($.T * ($.L1 + $.L2)) / (G * polarJ($.d2 / 2, 0));
      return rel(series.parts[0].phi, series.parts[1].phi)
        && rel(series.phi, thick)
        && rel(series.phi, thin);
    },
    text: (T) => String.raw`One torque of ${T.T} N·m runs through two solid segments in series. The left one is ${T.d1} mm by ${T.L1} m. The right one is ${T.d2} mm by ${T.L2} m. G is 75 GPa. Through what angle, in degrees, does the whole shaft twist?`,
    parts: [
      num('phi', ($) => stepShaft($).phi, 'deg', {
        scale: DEG,
        label: 'total angle',
        traps: [
          [($) => ($.T * ($.L1 + $.L2)) / (G * polarJ($.d1 / 2, 0)), 'Both segments were given the left diameter. The right segment has its own J.'],
          [($) => ($.T * ($.L1 + $.L2)) / (G * polarJ($.d2 / 2, 0)), 'Both segments were given the right diameter. The angles use each segment\'s own J.'],
        ],
      }),
    ],
    hints: [
      'Each segment twists by its own torque times length over G J. The angles add.',
      'Each segment twists on its own, with its own polar moment. The angles add.',
    ],
    steps: ($, sig) => {
      const J1 = polarJ($.d1 / 2, 0);
      const J2 = polarJ($.d2 / 2, 0);
      const p1 = ($.T * $.L1) / (G * J1);
      const p2 = ($.T * $.L2) / (G * J2);
      return [
        String.raw`Both segments carry the same $T$. Segment 1: $J_1 = ${sig(J1 / 1e-12 / 1e3)}\times 10^3$ mm⁴, $\phi_1 = TL_1/GJ_1 = ${sig(p1 / DEG)}$°.`,
        String.raw`Segment 2: $J_2 = ${sig(J2 / 1e-12 / 1e3)}\times 10^3$ mm⁴, $\phi_2 = ${sig(p2 / DEG)}$°.`,
        String.raw`The angles add: $\phi = ${sig((stepShaft($).phi * 180) / Math.PI)}$°.`,
      ];
    },
    second: ($) => ({
      phi: (
        ($.T * $.L1) / (G * polarJ($.d1 / 2, 0))
        + ($.T * $.L2) / (G * polarJ($.d2 / 2, 0))
      ) / DEG,
    }),
    sim: {
      scenario: 'step',
      setup(s, $) {
        s.scenarioId = 'step';
        s.T = $.T;
        s.d1 = $.d1;
        s.L1 = $.L1;
        s.d2 = $.d2;
        s.L2 = $.L2;
        s.G = G;
      },
      read: (c) => ({ phi: c.phi }),
    },
    cases: [kase(cite('torsion'), { T: 400, d1: 40, L1: 0.8, d2: 25, L2: 0.4 }, { phi: 4.159972206734882 })],
  }),

  problem({
    id: 'u9.5.fixed',
    title: 'Shaft fixed at both ends',
    exam: 'u9',
    ch: '5',
    lab: 'twist',
    src: cite('torsion'),
    topics: ['torsion', 'fixed'],
    variety: ['configuration'],
    level: 2,
    vars: {
      T: range(200, 900, 50, 'N·m'),
      L: range(1, 2.4, 0.2, 'm'),
      a: range(0.2, 0.4, 0.05),
      d: range(30, 50, 5, 'mm', MM),
    },
    text: (T) => String.raw`A solid shaft ${T.d} mm in diameter and ${T.L} m long is fixed at both ends. A torque of ${T.T} N·m is applied at a fraction ${T.a} of the length from the left wall. G is 75 GPa. Find the torque carried by the left wall, and the rotation at the applied torque, in degrees.`,
    parts: [
      num('Tleft', ($) => fixedFixedTorsion($.T, $.L, $.a * $.L, G, polarJ($.d / 2, 0)).Tleft, 'N·m', {
        label: 'left-wall torque',
        traps: [
          [($) => $.T / 2, 'The torque was split in half. The two sides are equal only when the load is at midspan.'],
          [($) => $.T * $.a, 'That is the share of the longer side. The shorter side, here the left, carries more.'],
        ],
      }),
      num('phi', ($) => fixedFixedTorsion($.T, $.L, $.a * $.L, G, polarJ($.d / 2, 0)).phi, 'deg', {
        scale: DEG,
        label: 'rotation at the torque',
        traps: [
          [($) => ($.T * $.L) / (G * polarJ($.d / 2, 0)), 'The whole torque was run through the whole length. Each side carries only its own reaction, through its own length.'],
          [($) => {
            const ends = fixedFixedTorsion($.T, $.L, $.a * $.L, G, polarJ($.d / 2, 0));
            return (ends.Tleft * $.L) / (G * polarJ($.d / 2, 0));
          }, 'The left reaction was twisted through the whole length. Its length is only the distance out to the torque.'],
        ],
      }),
    ],
    hints: [
      'The two walls share one rotation at the load. The shorter segment is the stiffer spring, so it carries more of the torque.',
      String.raw`The section where the torque acts turns by one angle, seen from either wall. Write that angle from each side and use equilibrium of the two wall torques.`,
    ],
    steps: ($, sig) => {
      const ends = fixedFixedTorsion($.T, $.L, $.a * $.L, G, polarJ($.d / 2, 0));
      return [
        String.raw`Each side is a spring $GJ/\text{length}$: $k_L = ${sig(ends.kL)}$ and $k_R = ${sig(ends.kR)}$ N·m/rad.`,
        String.raw`Both turn through one angle: $\phi = T/(k_L + k_R) = ${sig(ends.phi)}$ rad $= ${sig((ends.phi * 180) / Math.PI)}$°.`,
        String.raw`$T_L = k_L\phi = ${sig(ends.Tleft)}$ N·m, the short side's larger share.`,
      ];
    },
    second: ($) => {
      const Tleft = $.T * (1 - $.a);
      const phi = (Tleft * $.a * $.L) / (G * polarJ($.d / 2, 0));
      return { Tleft, phi: phi / DEG };
    },
    sim: {
      scenario: 'fixed',
      setup(s, $) {
        s.scenarioId = 'fixed';
        s.T = $.T;
        s.L = $.L;
        s.a = $.a * $.L;
        s.d = $.d;
        s.G = G;
      },
      read: (c) => ({ Tleft: c.Tleft, phi: c.phi }),
    },
    cases: [kase(cite('torsion'), { T: 600, L: 1.5, a: 1 / 3, d: 40 }, { Tleft: 400, phi: 0.6079271018540268 })],
  }),

  problem({
    id: 'u9.5.motor',
    title: 'Motor shaft in ksi',
    exam: 'u9',
    ch: '5',
    lab: 'motor',
    src: cite('torsion'),
    topics: ['torsion', 'english'],
    variety: ['units'],
    level: 2,
    vars: {
      hp: range(2, 12, 1, 'hp', HP_WATT),
      rpm: range(900, 3600, 150, 'rpm'),
    },
    text: (T) => String.raw`A Baldor EM3615T-5 is a ${T.hp} hp motor in this version of the problem, running at ${T.rpm} rpm. The catalog shaft is 1.125 in in diameter, and the NEMA 184T usable extension is 2.75 in. Take E as 29000 ksi and Poisson's ratio as 0.30. Find the shear stress in ksi and the angle of twist of that extension in degrees.`,
    parts: [
      num('tau', ($) => motorShaft($.hp / HP_WATT, $.rpm).tauMax, 'ksi', {
        scale: KSI,
        label: 'shear stress',
        traps: [
          [($) => 2 * motorShaft($.hp / HP_WATT, $.rpm).tauMax, 'The diameter was used as the radius, which doubles Tc/J.'],
          [($) => motorShaft(($.hp / HP_WATT) * (1000 / HP_WATT), $.rpm).tauMax, 'The horsepower number was read as kilowatts. One horsepower is 745.7 W, not 1000 W.'],
        ],
      }),
      num('phi', ($) => motorShaft($.hp / HP_WATT, $.rpm).phi, 'deg', {
        scale: DEG,
        label: 'angle of twist',
        traps: [
          [($) => 2 * motorShaft($.hp / HP_WATT, $.rpm).phi, 'J was taken as I. The angle doubles when the polar moment is halved.'],
          [($) => motorShaft($.hp / HP_WATT, $.rpm).phi / (2 * (1 + 0.3)), 'E was used in place of G. G is E over 2(1+ν), so that angle is too small by 2.6.'],
        ],
      }),
    ],
    hints: [
      'Torque is horsepower over the angular speed. Shear stress is torque times radius over the polar moment, and the angle is torque times length over G J.',
      String.raw`Work the torque as $550\,\mathrm{hp}/\omega$ in ft·lbf, with $\omega$ in radians per second, then convert. $G = 29000/(2\times 1.3)$ ksi.`,
    ],
    steps: ($, sig) => {
      const inch = motorInches($.hp / HP_WATT, $.rpm);
      return [
        String.raw`$T = 63{,}025\,\mathrm{hp}/n = ${sig(inch.TLbfIn)}$ lb·in.`,
        String.raw`On the 1.125 in shaft, $\tau = 16T/\pi d^3 = ${sig(inch.tauKsi)}$ ksi.`,
        String.raw`Over 2.75 in with $G = 29{,}000/2.6$ ksi, $\phi = TL/GJ = ${sig(inch.phiDeg)}$°.`,
      ];
    },
    second: ($) => {
      const inch = motorInches($.hp / HP_WATT, $.rpm, MOTOR_D_IN, MOTOR_L_IN);
      return { tau: inch.tauKsi, phi: inch.phiDeg };
    },
    sim: {
      scenario: 'stub',
      setup(s, $) {
        s.scenarioId = 'stub';
        s.hp = $.hp / HP_WATT;
        s.rpm = $.rpm;
        s.dIn = MOTOR_D_IN;
        s.lIn = MOTOR_L_IN;
      },
      read: (c) => ({ tau: c.tau, phi: c.phi }),
    },
    cases: [kase(cite('torsion'), { hp: 5, rpm: 1750 }, { tau: 0.6441096649296891, phi: 0.01617588182130306 })],
  }),

  problem({
    id: 'u9.5.size',
    title: 'Diameter from stress and twist',
    exam: 'u9',
    ch: '5',
    lab: 'torsion',
    src: cite('torsion'),
    topics: ['torsion', 'power'],
    variety: ['goal'],
    level: 3,
    vars: {
      P: range(5, 30, 5, 'kW', 1000),
      rpm: range(900, 1800, 300, 'rpm'),
      L: range(0.8, 2, 0.2, 'm'),
      tau: range(60, 140, 20, 'MPa', MPA),
      ang: range(0.3, 1.2, 0.15, 'deg', DEG),
    },
    valid: ($) => {
      const T = torqueFromPower($.P, $.rpm).T;
      const need = solidDiameterRequired(T, $.L, G, $.tau, $.ang);
      const dI = need.dShear * 2 ** (1 / 3);
      const smaller = Math.min(need.dShear, need.dTwist);
      return need.d > 0.012 && need.d < 0.2
        && Math.abs(need.dShear - need.dTwist) / need.d > 0.08
        && Math.abs(smaller - need.d) / need.d > 0.08
        && Math.abs(dI - need.d) / need.d > 0.08;
    },
    text: (T) => String.raw`A solid shaft ${T.L} m long transmits ${T.P} kW at ${T.rpm} rpm. G is 75 GPa. The shear stress may not pass ${T.tau} MPa, and the angle may not pass ${T.ang}°. What diameter, in millimeters, satisfies both limits?`,
    parts: [
      num('d', ($) => {
        const T = torqueFromPower($.P, $.rpm).T;
        return solidDiameterRequired(T, $.L, G, $.tau, $.ang).d;
      }, 'mm', {
        scale: MM,
        label: 'required diameter',
        traps: [
          [($) => {
            const T = torqueFromPower($.P, $.rpm).T;
            const need = solidDiameterRequired(T, $.L, G, $.tau, $.ang);
            return Math.min(need.dShear, need.dTwist);
          }, 'That diameter meets only the looser limit. The shaft has to meet both, so the larger diameter governs.'],
          [($) => solidDiameterForShear(torqueFromPower($.P, $.rpm).T, $.tau) * 2 ** (1 / 3), 'The stress diameter used J = I. A circular shaft has J = 2I, and the stress formula is 16T over πd³.'],
        ],
      }),
    ],
    hints: [
      'The allowable stress sets one diameter and the allowable angle sets another. The shaft has to meet the larger of the two.',
      'Each limit sets its own diameter. Solve the stress limit and the twist limit for the diameter separately, then keep the one that satisfies both.',
    ],
    steps: ($, sig) => {
      const T = torqueFromPower($.P, $.rpm).T;
      const need = solidDiameterRequired(T, $.L, G, $.tau, $.ang);
      return [
        String.raw`$\omega = 2\pi n/60 = ${sig((2 * Math.PI * $.rpm) / 60)}$ rad/s, so $T = P/\omega = ${sig(T)}$ N·m.`,
        String.raw`Stress: $d = (16T/\pi\tau)^{1/3} = ${sig(need.dShear * 1000)}$ mm.`,
        String.raw`Twist: $d = (32TL/\pi G\phi)^{1/4} = ${sig(need.dTwist * 1000)}$ mm. The shaft needs the larger, $${sig(need.d * 1000)}$ mm.`,
      ];
    },
    second: ($) => ({ d: searchDiameter($) }),
    sim: {
      scenario: 'solid',
      setup(s, $) {
        s.scenarioId = 'solid';
        s.T = torqueFromPower($.P, $.rpm).T;
        s.L = $.L;
        s.G = G;
        s.d = 0.04;
        s.di = 0;
        s.tauAllow = $.tau;
        s.phiAllow = $.ang;
      },
      read: (c) => ({ d: c.dNeed }),
    },
    cases: [kase(cite('torsion'), { P: 15, rpm: 1200, L: 1.2, tau: 80, ang: 1.5 }, { d: 29.360146222401543 })],
  }),

  problem({
    id: 'u9.5.scale',
    title: 'What changes the shear stress',
    exam: 'u9',
    ch: '5',
    lab: 'torsion',
    src: cite('torsion'),
    topics: ['torsion', 'solid'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 1,
    vars: {
      change: choice(['diameter', 'the diameter'], ['torque', 'the torque']),
      T: range(200, 800, 50, 'N·m'),
      d: range(25, 50, 5, 'mm', MM),
    },
    text: (T) => String.raw`A solid shaft of diameter ${T.d} mm carries ${T.T} N·m. Double ${T.change}. What happens to the shear stress at the outside?`,
    parts: [
      mc('which', [
        ['eighth', 'It falls to one eighth.', 'J grows with the diameter to the fourth and the radius only with the first power, so stress follows 1/d³. Doubling the diameter divides the stress by 8.'],
        ['double', 'It doubles.', 'Stress is linear in the torque. Doubling the torque doubles the stress. Diameter is the change that cubes.'],
        ['half', 'It falls to one half.', 'Halving would be a doubled area, or a doubled J with the radius held still. Neither is what doubling the diameter does.'],
        ['same', 'It does not change.', 'Both the torque and the diameter are in τ = Tρ/J. Neither leaves the stress where it was.'],
      ], ($) => ($.change === 'diameter' ? 'eighth' : 'double')),
    ],
    hints: [
      'Shear stress of a solid shaft follows the torque and the inverse cube of the diameter.',
      'A factor of two in the torque stays a factor of two. A factor of two in the diameter becomes eight in the denominator.',
    ],
    steps: ($) => [
      $.change === 'diameter'
        ? 'Doubling the diameter multiplies J by 16 and the radius by 2, so the stress falls to one eighth.'
        : 'The stress is linear in T, so doubling the torque doubles it.',
    ],
    second: ($) => ({ which: $.change === 'diameter' ? 'eighth' : 'double' }),
    sim: {
      scenario: 'solid',
      setup(s, $) {
        s.scenarioId = 'solid';
        s.T = $.change === 'torque' ? $.T * 2 : $.T;
        s.d = $.change === 'diameter' ? $.d * 2 : $.d;
        s.di = 0;
        s.L = 1.2;
        s.G = G;
        s.rho = s.d / 2;
      },
      read: (c, _state, $) => {
        const base = roundShaft($.T, 1.2, G, $.d, 0).tauMax;
        const ratio = c.tauMax / base;
        let which = 'same';
        if (Math.abs(ratio - 0.125) < 0.01) which = 'eighth';
        else if (Math.abs(ratio - 2) < 0.02) which = 'double';
        else if (Math.abs(ratio - 0.5) < 0.02) which = 'half';
        return { which };
      },
    },
    cases: [kase(cite('torsion'), { change: 'diameter', T: 500, d: 40 }, { which: 'eighth' })],
  }),

  problem({
    id: 'u9.5.side',
    title: 'Which wall carries more',
    exam: 'u9',
    ch: '5',
    lab: 'twist',
    src: cite('torsion'),
    topics: ['torsion', 'fixed'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 2,
    vars: {
      place: choice(
        ['left', 'closer to the left wall'],
        ['mid', 'at midspan'],
        ['right', 'closer to the right wall'],
      ),
      T: range(200, 800, 50, 'N·m'),
      L: range(1, 2.4, 0.2, 'm'),
    },
    text: (T) => String.raw`A uniform shaft ${T.L} m long is fixed at both ends. A torque of ${T.T} N·m is applied ${T.place}. Which wall carries the larger torque?`,
    parts: [
      mc('which', [
        ['left', 'The left wall.', 'The left segment is the shorter one, so it is the stiffer spring and it carries more of the torque.'],
        ['equal', 'The two walls carry the same torque.', 'Equal lengths mean equal stiffness. That happens when the torque is at midspan.'],
        ['right', 'The right wall.', 'The right segment is the shorter one, so it is the stiffer spring and it carries more of the torque.'],
      ], ($) => ($.place === 'left' ? 'left' : $.place === 'right' ? 'right' : 'equal')),
    ],
    hints: [
      'Between two fixed ends the reactions are springs in parallel. Stiffness is G J over the segment length.',
      'The shorter side has the larger stiffness, so it takes the larger share. At midspan the two lengths match.',
    ],
    steps: ($) => [
      $.place === 'mid'
        ? 'The two segments are the same length, so the walls split the torque equally.'
        : `The ${$.place} segment is shorter, so that wall carries more.`,
    ],
    second: ($) => ({ which: $.place === 'left' ? 'left' : $.place === 'right' ? 'right' : 'equal' }),
    sim: {
      scenario: 'fixed',
      setup(s, $) {
        s.scenarioId = 'fixed';
        s.T = $.T;
        s.L = $.L;
        s.a = $.place === 'left' ? 0.27 * $.L : $.place === 'right' ? 0.73 * $.L : 0.5 * $.L;
        s.d = 0.04;
        s.G = G;
      },
      read: (c) => {
        const diff = c.Tleft - c.Tright;
        if (Math.abs(diff) < 0.02 * Math.max(Math.abs(c.Tleft + c.Tright), 1)) return { which: 'equal' };
        return { which: diff > 0 ? 'left' : 'right' };
      },
    },
    cases: [kase(cite('torsion'), { place: 'left', T: 400, L: 1.5 }, { which: 'left' })],
  }),

  problem({
    id: 'u9.5.fast',
    title: 'Speed or power',
    exam: 'u9',
    ch: '5',
    lab: 'twist',
    src: cite('torsion'),
    topics: ['torsion', 'power'],
    variety: ['configuration'],
    kind: 'conceptual',
    level: 2,
    vars: {
      change: choice(['speed', 'the speed'], ['power', 'the power']),
      P: range(5, 30, 5, 'kW', 1000),
      rpm: range(600, 3000, 300, 'rpm'),
    },
    text: (T) => String.raw`A shaft transmits ${T.P} kW at ${T.rpm} rpm. Double ${T.change} and hold the other one fixed. What happens to the torque?`,
    parts: [
      mc('which', [
        ['half', 'The torque halves.', 'Power is torque times angular speed. Twice the speed, at the same power, is half the torque.'],
        ['double', 'The torque doubles.', 'Power is torque times angular speed. Twice the power, at the same speed, is twice the torque.'],
        ['same', 'The torque stays the same.', 'The torque is the ratio of power to speed. Changing either one moves it.'],
      ], ($) => ($.change === 'speed' ? 'half' : 'double')),
    ],
    hints: [
      'Power is torque times angular speed. Hold one of those and the other has to follow.',
      'Doubling the speed at constant power halves the torque. Doubling the power at constant speed doubles it.',
    ],
    steps: ($) => [
      $.change === 'speed'
        ? 'T = P/ω, so twice the speed halves the torque.'
        : 'T = P/ω, so twice the power doubles the torque.',
    ],
    second: ($) => ({ which: $.change === 'speed' ? 'half' : 'double' }),
    sim: {
      scenario: 'power',
      setup(s, $) {
        s.scenarioId = 'power';
        s.P = $.change === 'power' ? $.P * 2 : $.P;
        s.rpm = $.change === 'speed' ? $.rpm * 2 : $.rpm;
        s.d = 0.03;
        s.L = 0.8;
        s.G = G;
      },
      read: (c, _state, $) => {
        const base = torqueFromPower($.P, $.rpm).T;
        const ratio = c.T / base;
        if (Math.abs(ratio - 0.5) < 0.02) return { which: 'half' };
        if (Math.abs(ratio - 2) < 0.02) return { which: 'double' };
        return { which: 'same' };
      },
    },
    cases: [kase(cite('torsion'), { change: 'speed', P: 20, rpm: 1800 }, { which: 'half' })],
  }),
  problem({
    id: 'u9.5.box-tube',
    title: 'Torsion of a rectangular tube',
    exam: 'u9',
    ch: '5',
    lab: null,
    src: cite('closed-tube'),
    topics: ['closed-tube'],
    variety: ['configuration'],
    level: 3,
    vars: {
      a: range(60, 160, 10, 'mm', MM),
      b: range(40, 100, 10, 'mm', MM),
      t1: range(3, 8, 1, 'mm', MM),
      t2: range(3, 8, 1, 'mm', MM),
      T: range(1, 8, 0.5, 'kN·m', 1000),
    },
    derive: ($) => {
      const walls = [{ len: $.a, t: $.t2 }, { len: $.b, t: $.t1 }, { len: $.a, t: $.t2 }, { len: $.b, t: $.t1 }];
      const r = bredt($.T, $.a * $.b, walls, G);
      return { tau: r.tauMax, rate: r.rate / DEG, q: r.q };
    },
    valid: ($) => $.a > $.b && $.tau < 150 * MPA && $.tau > 20 * MPA && $.t1 !== $.t2,
    text: (T) => String.raw`A steel tube ($G = 75$ GPa) measures $${T.a}$ mm by $${T.b}$ mm on its wall's centreline. Its two long walls are $${T.t2}$ mm thick and its two short walls $${T.t1}$ mm thick. It carries a torque of $${T.T}$ kN·m. Find the shear flow, the largest shear stress, and the angle of twist per metre.`,
    parts: [
      num('q', ($) => $.q, 'N/mm', {
        scale: 1000,
        label: 'shear flow',
        traps: [
          [($) => $.T / (2 * ($.a + Math.max($.t1, $.t2)) * ($.b + Math.max($.t1, $.t2))), 'That uses the outside area. $A_m$ is the area inside the wall\'s centreline.'],
        ],
      }),
      num('tau', ($) => $.tau, 'MPa', {
        scale: MPA,
        label: 'largest stress',
        traps: [
          [($) => $.q / Math.max($.t1, $.t2), 'That divides by the thicker wall. The same flow on the thinnest wall gives the largest stress.'],
        ],
      }),
      num('rate', ($) => $.rate, '°/m', {
        label: 'twist per metre',
        traps: [
          [($) => ($.T * (2 * $.a) / $.t2) / (4 * ($.a * $.b) ** 2 * G) / DEG, 'Only the long walls went into $\\oint ds/t$. The short walls add to it too.'],
        ],
      }),
    ],
    hints: [
      'Along the shaft, a small block of wall balances only if the shear flow $q = \\tau t$ is the same all the way round.',
      String.raw`$T = 2A_m q$ with $A_m$ inside the centreline. $\tau = q/t$, largest where $t$ is smallest. $d\phi/dx = T\oint(ds/t)/(4A_m^2G)$.`,
    ],
    steps: ($, sig) => [
      String.raw`$A_m = ${sig($.a / MM)}\times ${sig($.b / MM)} = ${sig(($.a * $.b) / 1e-6)}$ mm², so $q = T/2A_m = ${sig($.q / 1000)}$ N/mm.`,
      String.raw`The thinnest wall is $${sig(Math.min($.t1, $.t2) / MM)}$ mm: $\tau = ${sig($.tau / MPA)}$ MPa.`,
      String.raw`$\oint ds/t = 2(${sig($.a / MM)}/${sig($.t2 / MM)} + ${sig($.b / MM)}/${sig($.t1 / MM)}) = ${sig(2 * ($.a / $.t2 + $.b / $.t1))}$, so $d\phi/dx = ${sig($.rate)}$°/m.`,
    ],
    second: ($) => {
      // The twist rate from energy: T θ/2 equals Σ q² L/(2 G t) round the wall.
      const q = $.T / (2 * $.a * $.b);
      const U = 2 * ((q * q * $.a) / (2 * G * $.t2) + (q * q * $.b) / (2 * G * $.t1));
      return { q: q / 1000, tau: q / Math.min($.t1, $.t2) / MPA, rate: (2 * U) / $.T / DEG };
    },
    cases: [kase(cite('closed-tube'), { a: 100, b: 50, t1: 6, t2: 4, T: 3 }, { q: 300, tau: 75, rate: 1.5278874536821951 })],
  }),

  problem({
    id: 'u9.5.rect-bar',
    title: 'A rectangular bar in torsion',
    exam: 'u9',
    ch: '5',
    lab: null,
    src: cite('noncircular'),
    topics: ['noncircular'],
    variety: ['representation'],
    level: 2,
    vars: {
      ratio: choice(['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']),
      t: range(10, 30, 2, 'mm', MM),
      T: range(50, 600, 25, 'N·m', 1),
      L: range(0.5, 2, 0.25, 'm', 1),
    },
    derive: ($) => {
      const b = Number($.ratio) * $.t;
      const r = rectTorsion($.T, b, $.t, G);
      return { bb: b, alpha: r.alpha, beta: r.beta, tau: r.tauMax, phi: (r.rate * $.L) / DEG };
    },
    valid: ($) => $.tau < 150 * MPA && $.tau > 15 * MPA,
    text: (T, $) => String.raw`A steel bar ($G = 75$ GPa) of solid rectangular section, $${Math.round($.bb / MM)}$ mm by $${T.t}$ mm and $${T.L}$ m long, carries a torque of $${T.T}$ N·m. For this aspect ratio $\alpha = ${$.alpha.toFixed(3)}$ and $\beta = ${$.beta.toFixed(3)}$. Find the largest shear stress and the angle of twist.`,
    parts: [
      num('tau', ($) => $.tau, 'MPa', {
        scale: MPA,
        label: 'largest stress',
        traps: [
          [($) => ($.T * Math.hypot($.bb, $.t) / 2) / (($.bb * $.t * ($.bb ** 2 + $.t ** 2)) / 12), 'That is $Tc/J$ with the rectangle\'s polar moment. A rectangle warps, so that formula does not hold.'],
          [($) => $.T / ($.alpha * $.t * $.bb ** 2), 'The short side is squared, not the long one.'],
        ],
      }),
      num('phi', ($) => $.phi, '°', {
        label: 'angle of twist',
        traps: [
          [($) => ($.T * $.L) / ($.beta * $.t * $.bb ** 3 * G) / DEG, 'The short side is cubed, not the long one.'],
        ],
      }),
    ],
    hints: [
      'A rectangle warps as it twists, so $T\\rho/J$ does not apply. Use the coefficients for its aspect ratio.',
      String.raw`$\tau_{\max} = T/(\alpha bt^2)$ and $\phi = TL/(\beta bt^3G)$, with $b$ the long side and $t$ the short side.`,
    ],
    steps: ($, sig) => [
      String.raw`$b = ${sig($.bb / MM)}$ mm, $t = ${sig($.t / MM)}$ mm.`,
      String.raw`$\tau_{\max} = T/(\alpha bt^2) = ${sig($.tau / MPA)}$ MPa, at the middle of the long faces.`,
      String.raw`$\phi = TL/(\beta bt^3G) = ${sig($.phi)}$°.`,
    ],
    second: ($) => {
      // The double sine series of the stress function, a second route to α and β.
      const c = rectTorsionDouble($.bb, $.t);
      return { tau: $.T / (c.alpha * $.bb * $.t ** 2) / MPA, phi: (($.T * $.L) / (c.beta * $.bb * $.t ** 3 * G)) / DEG };
    },
    cases: [kase(cite('noncircular'), { ratio: '2', t: 20, T: 200, L: 1 }, { tau: 50.838149863484, phi: 2.087901555072853 })],
  }),

  problem({
    id: 'u9.5.slit',
    title: 'A tube slit along its length',
    exam: 'u9',
    ch: '5',
    lab: null,
    src: cite('noncircular'),
    topics: ['noncircular', 'closed-tube'],
    variety: ['configuration'],
    level: 2,
    vars: {
      d: range(30, 80, 5, 'mm', MM),
      t: range(1.5, 4, 0.5, 'mm', MM),
      T: range(5, 40, 5, 'N·m', 1),
    },
    derive: ($) => {
      const r = $.d / 2;
      const closed = bredt($.T, Math.PI * r * r, [{ len: Math.PI * $.d, t: $.t }], G);
      const open = openThin($.T, [{ len: Math.PI * $.d, t: $.t }], G);
      return { closedTau: closed.tauMax, openTau: open.tauMax, stiff: closed.J / open.J };
    },
    valid: ($) => $.openTau < 250 * MPA && $.d / $.t >= 12,
    text: (T) => String.raw`A steel tube has a mean diameter of $${T.d}$ mm and a $${T.t}$ mm wall. It carries $${T.T}$ N·m. Find the shear stress in the closed tube, then the largest shear stress after the tube is slit along its whole length, and the factor by which the slit cuts the torsional stiffness.`,
    parts: [
      num('closedTau', ($) => $.closedTau, 'MPa', { scale: MPA, label: 'closed' }),
      num('openTau', ($) => $.openTau, 'MPa', {
        scale: MPA,
        label: 'slit',
        traps: [
          [($) => $.closedTau, 'The slit stops the flow from going round. The open strip has $J = \\pi d t^3/3$.'],
        ],
      }),
      num('stiff', ($) => $.stiff, '', {
        label: 'stiffness factor',
        traps: [
          [($) => (3 * $.d) / 2 / $.t, 'That is the stress ratio $3r/t$. The stiffness ratio is $3(r/t)^2$.'],
        ],
      }),
    ],
    hints: [
      'Closed, the wall carries one flow round the loop. Slit, it is a thin strip of length $\\pi d$ that twists on its own.',
      String.raw`Closed: $\tau = T/(2tA_m)$ and $J = 4A_m^2 t/(\pi d)$. Open: $J = \pi d t^3/3$ and $\tau = Tt/J$.`,
    ],
    steps: ($, sig) => [
      String.raw`Closed: $A_m = \pi d^2/4$, so $\tau = ${sig($.closedTau / MPA)}$ MPa.`,
      String.raw`Slit: $J = \pi d t^3/3$, so $\tau = Tt/J = ${sig($.openTau / MPA)}$ MPa.`,
      String.raw`The stiffness falls by $3(r/t)^2 = ${sig($.stiff)}$.`,
    ],
    second: ($) => {
      const r = $.d / 2;
      return {
        closedTau: $.T / (2 * Math.PI * r * r * $.t) / MPA,
        openTau: (3 * $.T) / (2 * Math.PI * r * $.t * $.t) / MPA,
        stiff: 3 * (r / $.t) ** 2,
      };
    },
    cases: [kase(cite('noncircular'), { d: 50, t: 2, T: 20 }, { closedTau: 2.5464790894703255, openTau: 95.49296585513721, stiff: 468.75 })],
  }),

  problem({
    id: 'u9.5.shoulder',
    title: 'The peak stress at a shaft shoulder',
    exam: 'u9',
    ch: '5',
    lab: 'torsion',
    src: cite('shaft-kt'),
    topics: ['shaft-kt'],
    variety: ['unknown'],
    level: 1,
    vars: {
      d: range(20, 50, 2, 'mm', MM),
      step: range(1.1, 1.5, 0.1, '', 1),
      Kt: range(1.2, 2, 0.1, '', 1),
      T: range(50, 600, 25, 'N·m', 1),
    },
    derive: ($) => {
      const nom = (16 * $.T) / (Math.PI * $.d ** 3);
      return { D: $.d * $.step, nom, peak: $.Kt * nom };
    },
    valid: ($) => $.peak < 200 * MPA && $.peak > 15 * MPA,
    text: (T, $) => String.raw`A shaft steps from $${Math.round($.D / MM)}$ mm down to $${T.d}$ mm at a filleted shoulder, and carries $${T.T}$ N·m. A chart gives $K_t = ${T.Kt}$ for this step and fillet, on the nominal stress of the smaller diameter. Find the peak shear stress at the fillet.`,
    parts: [
      num('peak', ($) => $.peak, 'MPa', {
        scale: MPA,
        label: 'peak',
        traps: [
          [($) => $.nom, 'That is the nominal stress. The fillet multiplies it by $K_t$.'],
          [($) => $.Kt * (16 * $.T) / (Math.PI * $.D ** 3), 'That takes the nominal stress on the larger diameter. $K_t$ is defined on the smaller one.'],
        ],
      }),
    ],
    hints: [
      'A stress-concentration factor multiplies the nominal stress it was defined on.',
      String.raw`Nominal: $16T/(\pi d^3)$ on the smaller diameter. Then multiply by $K_t$.`,
    ],
    steps: ($, sig) => [
      String.raw`Nominal on $d$: $16T/\pi d^3 = ${sig($.nom / MPA)}$ MPa.`,
      String.raw`Peak: $K_t\times ${sig($.nom / MPA)} = ${sig($.peak / MPA)}$ MPa.`,
    ],
    second: ($) => ({ peak: ($.Kt * $.T * ($.d / 2)) / polarJ($.d / 2, 0) / MPA }),
    sim: {
      scenario: 'solid',
      setup(s, $) {
        s.T = $.T;
        s.d = $.d;
        s.di = 0;
      },
      read: (c, state, $) => ({ peak: $.Kt * c.tauMax }),
    },
    cases: [kase(cite('shaft-kt'), { d: 30, step: 1.2, Kt: 1.6, T: 200 }, { peak: 60.36098582848079 })],
  }),
  problem({
    id: 'u9.5.fixed-step',
    title: 'A two-diameter shaft held at both ends',
    exam: 'u9',
    ch: '5',
    lab: 'twist',
    src: cite('torsion'),
    topics: ['torsion', 'fixed', 'stepped'],
    variety: ['configuration'],
    level: 3,
    vars: {
      T: range(200, 1200, 50, 'N·m', 1),
      d1: range(30, 60, 5, 'mm', MM),
      d2: range(20, 45, 5, 'mm', MM),
      a: range(0.4, 1.2, 0.1, 'm', 1),
      b: range(0.4, 1.2, 0.1, 'm', 1),
    },
    derive: ($) => {
      const k1 = (G * polarJ($.d1 / 2, 0)) / $.a;
      const k2 = (G * polarJ($.d2 / 2, 0)) / $.b;
      const TL = ($.T * k1) / (k1 + k2);
      const TR = $.T - TL;
      const t1 = (16 * TL) / (Math.PI * $.d1 ** 3);
      const t2 = (16 * TR) / (Math.PI * $.d2 ** 3);
      return { k1, k2, TL, TR, phi: TL / k1 / DEG, tmax: Math.max(t1, t2) };
    },
    valid: ($) => $.d1 > $.d2 && $.tmax < 150 * MPA && rel($.TL, ($.T * $.b) / ($.a + $.b)),
    text: (T) => String.raw`A steel shaft ($G = 75$ GPa) is fixed to walls at both ends. From the left wall it is $${T.d1}$ mm in diameter for $${T.a}$ m, then $${T.d2}$ mm for $${T.b}$ m to the right wall. A torque of $${T.T}$ N·m is applied at the step. Find the torque each wall carries, the rotation of the step, and the largest shear stress in the shaft.`,
    parts: [
      num('TL', ($) => $.TL, 'N·m', {
        label: 'left wall',
        traps: [
          [($) => ($.T * $.b) / ($.a + $.b), 'That splits the torque by length alone, as if both pieces had one diameter. Each piece is a spring $GJ/L$.'],
          [($) => $.T / 2, 'An even split needs equal stiffnesses.'],
        ],
      }),
      num('TR', ($) => $.TR, 'N·m', { label: 'right wall' }),
      num('phi', ($) => $.phi, '°', { abs: 1e-3, label: 'rotation of the step' }),
      num('tmax', ($) => $.tmax, 'MPa', {
        scale: MPA,
        label: 'largest shear stress',
        traps: [
          [($) => Math.min((16 * $.TL) / (Math.PI * $.d1 ** 3), (16 * $.TR) / (Math.PI * $.d2 ** 3)), 'That is the less-stressed piece. Check both: the thin piece carries less torque on a smaller diameter.'],
        ],
      }),
    ],
    hints: [
      'One equilibrium equation, two wall torques. The step turns by a single angle, seen from either wall.',
      String.raw`Each piece is a torsional spring $k = GJ/L$. Equal angles mean the torques divide in proportion to the two $k$ values.`,
    ],
    steps: ($, sig) => [
      String.raw`$k_1 = GJ_1/a = ${sig($.k1)}$ and $k_2 = GJ_2/b = ${sig($.k2)}$ N·m/rad.`,
      String.raw`$T_L = Tk_1/(k_1 + k_2) = ${sig($.TL)}$ N·m and $T_R = ${sig($.TR)}$ N·m. The step turns $T_L/k_1 = ${sig($.phi)}$°.`,
      String.raw`Stresses: $16T/\pi d^3$ in each piece; the larger is $${sig($.tmax / MPA)}$ MPa.`,
    ],
    second: ($) => {
      // Release the right wall: the free twist T a/GJ1 must be undone by T_R through both pieces in series.
      const J1 = polarJ($.d1 / 2, 0);
      const J2 = polarJ($.d2 / 2, 0);
      const free = ($.T * $.a) / (G * J1);
      const flex = $.a / (G * J1) + $.b / (G * J2);
      const TR = free / flex;
      const TL = $.T - TR;
      return {
        TL, TR,
        phi: (TR * $.b) / (G * J2) / DEG,
        tmax: Math.max((16 * TL) / (Math.PI * $.d1 ** 3), (16 * TR) / (Math.PI * $.d2 ** 3)) / MPA,
      };
    },
    cases: [kase(cite('torsion'), { T: 600, d1: 40, d2: 30, a: 0.6, b: 0.9 }, { TL: 495.48387096774195, TR: 104.51612903225805, phi: 0.9036542210785016, tmax: 39.42935364341149 })],
  }),

];

export default ch5;

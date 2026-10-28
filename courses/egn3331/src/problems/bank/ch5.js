/**
 * Torsion of circular shafts: stress and angle, a hollow section, power,
 * a stepped shaft, fixed ends, a motor shaft in English units, and the
 * diameter set by stress and by twist together.
 */
import { PA_PER_PSI } from '@flux/subjects/convert.js';
import {
  fixedFixedTorsion, polarJ, roundShaft, seriesTwist, solidDiameterForShear,
  solidDiameterRequired, torqueFromHorsepower, torqueFromPower,
} from '@flux/subjects/mechanics/torsion.js';
import { HP_WATT, MOTOR_D_IN, MOTOR_L_IN, motorInches, motorShaft } from '../../data/motor.js';
import { choice, cite, kase, mc, num, problem, range } from '../kit.js';

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
    text: (T) => String.raw`A solid steel shaft, ${T.d} mm in diameter and ${T.L} m long, carries ${T.T} N·m. G is 75 GPa. Find the shear stress at the outside and the angle of twist in degrees.`,
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
    ],
    hints: [
      'Shear stress at a radius is torque times that radius over the polar moment. The angle is torque times length over G J.',
      String.raw`For a solid circle, $\tau = 16T/(\pi d^3)$ and $\phi = TL/(GJ)$ with $J = \pi d^4/32$.`,
    ],
    steps: ($, sig) => {
      const shaft = roundShaft($.T, $.L, G, $.d, 0);
      return [
        String.raw`Outer stress ${sig(shaft.tauMax / MPA)} MPa.`,
        String.raw`Angle ${sig((shaft.phi * 180) / Math.PI)}°.`,
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
      String.raw`$\tau = T\rho/J$ with $J = \pi(d_o^4 - d_i^4)/32$. At the bore, $\rho$ is the inside radius.`,
    ],
    steps: ($, sig) => {
      const shaft = roundShaft($.T, 1, G, $.d, $.di);
      return [
        String.raw`Outside ${sig(shaft.tauMax / MPA)} MPa.`,
        String.raw`Bore ${sig(shaft.tauIn / MPA)} MPa.`,
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
      String.raw`$\omega = 2\pi n/60$ and $T = P/\omega$. Then $\tau = 16T/(\pi d^3)$.`,
    ],
    steps: ($, sig) => {
      const T = torqueFromPower($.P, $.rpm).T;
      const tau = roundShaft(T, $.L, G, $.d, 0).tauMax;
      return [
        String.raw`Torque ${sig(T)} N·m.`,
        String.raw`Outer stress ${sig(tau / MPA)} MPa.`,
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
      String.raw`$\phi = T L_1/(G J_1) + T L_2/(G J_2)$, with $J = \pi d^4/32$ for each solid segment.`,
    ],
    steps: ($, sig) => [String.raw`Total angle ${sig((stepShaft($).phi * 180) / Math.PI)}°.`],
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
      String.raw`The left reaction is $T(L-a)/L$. The rotation is that reaction times $a$, over $GJ$.`,
    ],
    steps: ($, sig) => {
      const ends = fixedFixedTorsion($.T, $.L, $.a * $.L, G, polarJ($.d / 2, 0));
      return [
        String.raw`Left reaction ${sig(ends.Tleft)} N·m.`,
        String.raw`Rotation ${sig((ends.phi * 180) / Math.PI)}°.`,
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
        String.raw`Shear stress ${sig(inch.tauKsi)} ksi.`,
        String.raw`Angle ${sig(inch.phiDeg)}°.`,
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
      String.raw`From $\tau = 16T/(\pi d^3)$, and from $J = TL/(G\phi)$ with $J = \pi d^4/32$. Take the larger d.`,
    ],
    steps: ($, sig) => {
      const T = torqueFromPower($.P, $.rpm).T;
      const need = solidDiameterRequired(T, $.L, G, $.tau, $.ang);
      return [String.raw`Required diameter ${sig(need.d * 1000)} mm. Stress alone wants ${sig(need.dShear * 1000)} mm. Twist alone wants ${sig(need.dTwist * 1000)} mm.`];
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
];

export default ch5;

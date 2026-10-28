/**
 * Unit 7 coaching: for each template, numeric `traps` (the wrong value a known mistake produces,
 * and what the mistake was), `why` for each wrong option of a choice part, and hints that continue a
 * template's own ladder. Folded into the bank by src/problems/index.js.
 *
 * Values inside `$` are SI. A trap returns a value in SI, like the part's own `get`.
 */
import { ROLL_K } from '@flux/subjects/mechanics/rigid-energy.js';

const G = 9.81;
const G_FT = 32.2;
const DEG = Math.PI / 180;

const kOf = (shape) => ROLL_K[shape];
/** (k_G / R)² for `u7.18.wheel-hill`: a given radius of gyration, a uniform disk (1/2), or a hoop (1). */
const wheelK2 = ($) => ($.body === 'wheel' ? ($.kG / $.R) ** 2 : $.body === 'disk' ? 0.5 : 1);
const sinT = ($) => Math.sin($.theta * DEG);

/** The race's three speeds, each with the same two slips. */
function raceTraps(k) {
  return [
    [($) => Math.sqrt(2 * G * $.s * sinT($)), 'That is a block sliding without friction. A rolling body also spins: divide by 1 + k.'],
    [
      ($) => ($.given === 'height' ? Math.sqrt((2 * G * $.s * sinT($) ** 2) / (1 + k)) : Math.sqrt((2 * G * $.s) / (1 + k))),
      ($) => ($.given === 'height'
        ? 'The height dropped is already given. Do not multiply it by sin θ again.'
        : 'The slope length is not the height dropped. Multiply it by sin θ.'),
    ],
  ];
}

/** Gravity's share and the spring's share of the rod-in-slots energy. */
function slotEnergy($) {
  const drop = (th) => ($.m * G * $.L / 2) * Math.sin(th * DEG);
  const spring = (th) => 0.5 * $.k * ($.L * Math.cos(th * DEG) - $.L) ** 2;
  return { gravity: drop($.theta1) - drop($.theta2), spring: spring($.theta1) - spring($.theta2) };
}

export default {
  'u7.18.ke': {
    traps: {
      trans: [[($) => $.m * $.v * $.v, 'Kinetic energy is one half m v squared. The ½ is missing.']],
      rot: [[($) => 0.5 * kOf($.shape) * $.m * $.R * $.R * $.v * $.v, 'Rolling sets ω = v/R. That used ω = v, so the radius did not cancel.']],
      total: [[($) => 0.5 * $.m * $.v * $.v, 'That is the translation alone. A rolling body also spins: add ½ I_G ω².']],
    },
  },
  'u7.18.race': {
    traps: {
      sphere: raceTraps(2 / 5),
      disk: raceTraps(1 / 2),
      hoop: raceTraps(1),
    },
  },
  'u7.18.race-ft': {
    traps: {
      v: [
        [($) => Math.sqrt(G_FT * $.s), 'That is a block sliding without friction. A rolling body also spins: divide by 1 + k.'],
        [($) => Math.sqrt((G * $.s) / (1 + kOf($.shape))), 'The lengths are in feet. Use g = 32.2 ft/s², not 9.81 m/s².'],
      ],
    },
  },
  'u7.18.bar': {
    traps: {
      omega: [[($) => {
        const drop = ($.L / 2) * ($.at === 'bottom' ? 1 : 0.5);
        return Math.sqrt(2 * G * drop) / ($.L / 2);
      }, 'That treats the bar as a point mass at G, with I = m(L/2)². A bar about its end has I_O = mL²/3.']],
      vG: [[($) => {
        const drop = ($.L / 2) * ($.at === 'bottom' ? 1 : 0.5);
        return Math.sqrt(2 * G * drop);
      }, 'That is the speed of a body dropped the same height. Part of the energy turns the bar: use ½ I_O ω², then v_G = ωL/2.']],
    },
  },
  'u7.18.couple': {
    traps: {
      work: [
        [($) => ($.rest === 'start' ? -1 : 1) * $.kappa * (Math.PI / 2), 'The work of a torsional spring is ½κθ², not κθ. The moment grows with the twist.'],
        [($) => ($.rest === 'start' ? 1 : -1) * 0.5 * $.kappa * (Math.PI / 2) ** 2, ($) => ($.rest === 'start'
          ? 'Wrong sign. The bar winds the spring up as it falls, so the spring takes energy: its work is negative.'
          : 'Wrong sign. The spring unwinds toward its rest angle as the bar falls, so it gives energy: its work is positive.')],
      ],
      omega: [[($) => Math.sqrt((3 * G) / $.L), 'That is the bar with no spring. Add the spring’s work, with its sign, to the drop of the centre.']],
    },
  },
  'u7.18.slots': {
    traps: {
      omega: [[($) => Math.sqrt(((3 * G) / $.L) * (Math.cos($.theta2 * DEG) - Math.cos($.theta1 * DEG))), 'The angles are from the floor. The centre’s height is (L/2) sin θ, not (L/2) cos θ.']],
      vG: [[($) => Math.sqrt(G * $.L * (Math.sin($.theta1 * DEG) - Math.sin($.theta2 * DEG))), 'That is the speed of a body falling the same height. The rod also turns: find ω from ½ I_IC ω², then v_G = ωL/2.']],
    },
  },
  'u7.18.spring': {
    traps: {
      omega: [[($) => {
        const e = slotEnergy($);
        return Math.sqrt((2 * (e.gravity + e.spring)) / $.m) / ($.L / 2);
      }, 'That puts all the energy into ½ m v_G². The rod also turns: T = ½ I_IC ω² with I_IC = mL²/3.']],
      T: [[($) => slotEnergy($).gravity, 'That is gravity’s work alone. The compressed spring also releases energy as the rod falls.']],
    },
  },

  'u7.18.wheel-hill': {
    traps: {
      T: [
        [($) => ($.m * G * $.h) / 2, 'Kinetic energy at the bottom equals the work of gravity, m g h, with nothing lost to slipping. The ½ belongs to ½mv², not to the work.'],
        [($) => $.m * $.h, 'Work is force times distance: the weight m g, not the mass, times the drop.'],
      ],
      v: [
        [($) => Math.sqrt(2 * G * $.h), 'That treats the wheel as a block sliding down. A rolling wheel spends part of m g h on spin, so it is slower.'],
        [($) => Math.sqrt(2 * G * $.h * (1 + wheelK2($))), 'The spin term is in the denominator: ½mv²(1 + k²/R²) = mgh, so v² = 2gh/(1 + k²/R²).'],
      ],
      share: [
        [() => 100, 'Part of the energy is spin: ½ m k²ω². Translation is less than the whole.'],
        [($) => (100 * $.R * $.R) / ($.R * $.R + 2 * wheelK2($) * $.R * $.R), 'The spin term is ½ I_G ω² once, with I_G = m k². It was counted twice.'],
      ],
    },
  },
  'u7.18.roll-sym': {
    traps: {
      v: [
        [($) => Math.sqrt(2 * G * $.h), 'That is a block sliding without friction. A rolling body also spins: divide by 1 + k.'],
        [($) => Math.sqrt((2 * G * $.h) / (1 + 2 * { hoop: 1, disk: 0.5, sphere: 0.4, shell: 2 / 3 }[$.shape])), 'The spin term is ½I_Gω² once, with I_G = kmR². It was counted twice.'],
      ],
    },
  },
};

/**
 * Unit 16 bank: mechanisms and deployables. Original problems, with staged hints and named traps
 * (../coaching/u16.js). Numeric templates are checked by a second route or by the Spring hinge lab
 * (`sim`).
 */
import { choice, kase, num, problem } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));
const FS = { analysis: 3.0, qual: 2.5, accept: 2.0 };
const SOURCE = { analysis: 'by analysis', qual: 'from a qualification test', accept: 'from an acceptance test at the environmental extremes' };

/** Torque margin; `how` names the traps. */
export function margin($, how = 'right') {
  const avail = Number($.avail);
  const res = Number($.f) + Number($.h);
  if (how === 'noFactor') return avail / res - 1;
  if (how === 'noMinus') return avail / (FS[$.src] * res);
  return avail / (FS[$.src] * res) - 1;
}

/** Energy into the latch (mJ) for a spring of k mN·m/rad; `how` names the traps. */
export function latchEnergy($, how = 'right') {
  const k = Number($.k) / 1000;
  const D = Math.PI / 180;
  const th0 = (90 + Number($.pre)) * D;
  const thd = 90 * D;
  const Tr = Number($.Tr) / 1000;
  if (how === 'noFriction') return k * (th0 * thd - thd * thd / 2) * 1000;
  if (how === 'endTorque') return (k * (th0 - thd) * thd - Tr * thd) * 1000;
  return (k * (th0 * thd - thd * thd / 2) - Tr * thd) * 1000;
}

const KIND = {
  stow: { text: 'A boom must be held against the side for launch and let go once, on command, with no power after that.', answer: 'release' },
  track: { text: 'A solar array must turn to follow the Sun through every orbit for five years.', answer: 'drive' },
  open: { text: 'A folded panel must swing open once and stay open, with no power.', answer: 'hinge' },
};

const REL = {
  springs: { text: 'A hinge has two springs in parallel, and its margin is tested with one spring removed. What factors does NASA-STD-5017B allow for that case?', answer: 'one' },
  verify: { text: 'How must a mechanism’s torque margin finally be verified?', answer: 'test' },
  vacuum: { text: 'Two clean, bare aluminium surfaces press together in a hinge. What can happen in vacuum?', answer: 'weld' },
};

export default [
  problem({
    id: 'u16.1.tm',
    title: 'A torque margin',
    exam: 'u16',
    ch: '16',
    lab: 'hinge',
    src: 'Flux, after NASA-STD-5017B Equation 4-1',
    topics: ['torquemargin'],
    principles: ['torquemargin'],
    vars: {
      avail: choice(['12', '12 mN·m'], ['16', '16 mN·m'], ['24', '24 mN·m']),
      f: choice(['1.5', '1.5 mN·m'], ['2', '2 mN·m']),
      h: choice(['0.5', '0.5 mN·m'], ['1', '1 mN·m']),
      src: choice(['analysis', 'by analysis'], ['qual', 'from a qualification test'], ['accept', 'from an acceptance test']),
    },
    variety: ['spring', 'resistance', 'evidence'],
    text: (T, $) => `A spring hinge gives at least ${T.avail} at the end of its travel. Hinge friction of ${T.f} and harness torque of ${T.h} resist it, both variable torques known ${SOURCE[$.src]}. What is the torque margin by NASA-STD-5017B?`,
    parts: [num('m', ($) => margin($), '', { label: 'TM' })],
    level: 2,
    hints: ['TM = T_avail/(FS_v ΣT_v) − 1.', 'FS_v is 3.0 by analysis, 2.5 from qualification, 2.0 from acceptance at the extremes.'],
    steps: ($) => [String.raw`$\text{TM} = \frac{${$.avail}}{${FS[$.src]}\,(${$.f} + ${$.h})} - 1 = ${fmt(margin($))}$`],
    second: ($) => {
      // The spare torque over the factored resistance.
      const need = FS[$.src] * (Number($.f) + Number($.h));
      return { m: (Number($.avail) - need) / need };
    },
    cases: [kase('16 against 3 by analysis', { avail: '16', f: '2', h: '1', src: 'analysis' }, { m: 0.7778 })],
  }),

  problem({
    id: 'u16.2.latch',
    title: 'The blow on the latch',
    exam: 'u16',
    ch: '16',
    lab: 'hinge',
    src: 'Flux, written for the Spring hinge lab',
    topics: ['latch'],
    principles: ['latch'],
    vars: {
      k: choice(['10', '10 mN·m per radian'], ['20', '20 mN·m per radian']),
      pre: choice(['60', '60°'], ['90', '90°'], ['150', '150°']),
      Tr: choice(['2', '2 mN·m'], ['3', '3 mN·m']),
    },
    variety: ['stiffness', 'preload', 'friction'],
    text: (T) => `A torsion spring of ${T.k}, wound ${T.pre} past the deployed position, swings a panel open through 90°. A steady ${T.Tr} of friction and harness torque resists it. How much energy reaches the latch, in mJ?`,
    parts: [num('e', ($) => latchEnergy($), 'mJ', { label: 'E' })],
    level: 3,
    hints: ['The energy is the spring’s work less the friction’s.', 'The spring’s work is ∫ k(θ₀ − θ) dθ from 0 to θ_d = k(θ₀θ_d − θ_d²/2).', 'Friction takes T_r θ_d. Work in radians.'],
    steps: ($) => [String.raw`$E = k\left(\theta_0\theta_d - \tfrac12\theta_d^2\right) - T_r\theta_d = ${fmt(latchEnergy($))}\ \text{mJ}$`],
    sim: { scenario: 'panel', setup(s, $) { Object.assign(s, { k: Number($.k), preload: Number($.pre), thetaD: 90, friction: Number($.Tr), harness: 0, I: 4 }); }, read: (c) => ({ e: c.energyMJ }) },
    cases: [kase('10, 90°, 3 mN·m', { k: '10', pre: '90', Tr: '3' }, { e: 32.3 })],
  }),

  problem({
    id: 'u16.3.kind',
    title: 'Which mechanism?',
    exam: 'u16',
    ch: '16',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 6.3',
    topics: ['mechanisms'],
    principles: ['mechanisms'],
    vars: { q: choice(['stow', 'stow'], ['track', 'track'], ['open', 'open']) },
    variety: ['which job'],
    text: (T, $) => `${KIND[$.q].text} What kind of mechanism does it need?`,
    parts: [
      pick('a', 'mechanism', [
        ['release', 'A release device: a burn wire, pin puller or release nut', 'Holds the part for launch and lets go once on command.'],
        ['drive', 'A motorized drive, such as a solar array drive', 'Keeps moving for the life of the mission, under control.'],
        ['hinge', 'A spring hinge with a latch', 'Stored spring energy opens it once with no power; the latch holds it.'],
        ['wheel', 'A reaction wheel', 'It turns the whole craft, not one part.'],
      ], ($) => KIND[$.q].answer),
    ],
    level: 1,
    hints: ['Does it move once or keep moving?', 'Does it need power to move?'],
    steps: ($) => [{ release: 'A release device.', drive: 'A motorized drive.', hinge: 'A spring hinge and latch.' }[KIND[$.q].answer]],
    second: ($) => ({ a: { stow: 'release', track: 'drive', open: 'hinge' }[$.q] }),
    cases: [kase('the array drive', { q: 'track' }, { a: 'drive' })],
  }),

  problem({
    id: 'u16.4.reliable',
    title: 'Making it work once',
    exam: 'u16',
    ch: '16',
    kind: 'conceptual',
    src: 'Flux, after NASA-STD-5017B and NASA’s small spacecraft report, 6.3.4',
    topics: ['mechreliability'],
    principles: ['mechreliability'],
    vars: { q: choice(['springs', 'springs'], ['verify', 'verify'], ['vacuum', 'vacuum']) },
    variety: ['which question'],
    text: (T, $) => REL[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['one', 'Factors of 1.0, for that one-spring-out case only', 'The test with a spring removed is the evidence; redundancy carries the margin.'],
        ['test', 'By test, at the worst-case conditions', 'Analysis factors are for early sizing; the standard requires test.'],
        ['weld', 'They can stick, or cold weld', 'Without air and oxide films clean metals can bond; choose coatings and lubricants for vacuum.'],
        ['nothing', 'Nothing changes from the ground', 'Vacuum, cold and storage change friction; that is why margin is needed.'],
      ], ($) => REL[$.q].answer),
    ],
    level: 1,
    hints: ['What does the standard ask as final evidence?', 'What does vacuum do to clean surfaces?'],
    steps: ($) => [{ one: 'Factors of 1.0.', test: 'By test.', weld: 'They can cold weld.' }[REL[$.q].answer]],
    second: ($) => ({ a: { springs: 'one', verify: 'test', vacuum: 'weld' }[$.q] }),
    cases: [kase('verification', { q: 'verify' }, { a: 'test' })],
  }),
];

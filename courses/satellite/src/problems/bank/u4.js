/**
 * Unit 4 bank: structure. Original problems, written for the Shake lab, with staged hints and named
 * traps (../coaching/u4.js), each checked against the lab (`sim`).
 */
import { transmissibility } from '@flux/subjects/mechanics/basevib.js';
import { choice, kase, num, problem, range } from '../kit.js';
import { vibClosed } from '@flux/subjects/mechanics/randomvib.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The mounts by name: natural frequency (Hz); damping ζ = 0.05; input 2 g. */
export const MOUNT = { stiff: 120, soft: 20 };
export const ZETA = 0.05;
export const A_IN = 2;
export const outG = ($, invert = false) => {
  const r = invert ? MOUNT[$.mount] / $.f : $.f / MOUNT[$.mount];
  return A_IN * transmissibility(r, ZETA);
};

/** Miles' rms response (g); `how` reproduces the traps. */
export const milesG = ($, how = 'right') => {
  const v = Number($.fn) * Number($.Q) * Number($.W);
  if (how === 'nopi') return Math.sqrt(v);
  if (how === 'nosqrt') return (Math.PI / 2) * v;
  return Math.sqrt((Math.PI / 2) * v);
};

export default [
  problem({
    id: 'u4.1.output',
    title: 'What the component feels',
    exam: 'u4',
    ch: '4',
    lab: 'shake',
    src: 'Flux, written for the Shake lab',
    topics: ['vibration'],
    principles: ['transmissibility'],
    vars: { mount: choice(['stiff', 'a stiff bracket with f_n = 120 Hz'], ['soft', 'a soft mount with f_n = 20 Hz']), f: range(10, 60, 10, 'Hz') },
    text: (T) => `A component sits on ${T.mount} and damping ratio ζ = 0.05. The launcher shakes the base at ${T.f} Hz with a 2 g acceleration amplitude. What acceleration amplitude does the component see, in g?`,
    parts: [num('a', ($) => outG($), 'g', { label: 'a' })],
    level: 2,
    hints: ['r = f/f_n.', 'Multiply the 2 g input by T = √[(1 + (2ζr)²)/((1 − r²)² + (2ζr)²)].'],
    steps: ($) => {
      const r = $.f / MOUNT[$.mount];
      return [String.raw`$r = ${$.f}/${MOUNT[$.mount]} = ${Number(r.toPrecision(3))}$, $T = ${Number(transmissibility(r, ZETA).toPrecision(4))}$, so $a = 2T = ${Number(outG($).toPrecision(3))}$ g`];
    },
    sim: {
      scenario: 'stiff',
      setup(s, $) {
        Object.assign(s, { lfn: Math.log10(MOUNT[$.mount]), zeta: ZETA, lf: Math.log10($.f), Ain: A_IN });
      },
      read: (c) => ({ a: c.out }),
    },
    cases: [kase('soft mount at 20 Hz', { mount: 'soft', f: 20 }, { a: 20.1 })],
  }),

  problem({
    id: 'u4.2.isolated',
    title: 'Helping an isolated mount',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'shake',
    src: 'Flux, written for the Shake lab',
    topics: ['vibration'],
    principles: ['transmissibility'],
    vars: { change: choice(['stiffer', 'the mount is stiffened until its natural frequency is 40 Hz'], ['softer', 'the mount is softened until its natural frequency is 10 Hz'], ['damper', 'the mount’s damping is raised from 5% to 20%']) },
    text: (T) => `A camera on a soft mount, f_n = 15 Hz and 5% damping, is shaken at 40 Hz and sees less than the input. What happens to its acceleration if ${T.change}?`,
    parts: [
      pick('d', 'its acceleration', [
        ['more', 'it grows', 'Moving f_n toward the shaking frequency, or adding damping above r = √2, lets more of the shaking through.'],
        ['less', 'it shrinks', 'Pushing f_n further below the shaking frequency isolates better.'],
      ], ($) => ($.change === 'softer' ? 'less' : 'more')),
    ],
    level: 2,
    hints: ['Find r = f/f_n before and after.', 'Above r = √2, damping adds to the numerator of T more than it helps.'],
    steps: ($) => [{ stiffer: 'r falls to 1: resonance, ×10.', softer: 'r rises to 4: ×0.07.', damper: 'At r = 2.67, ζ = 0.2 gives ×0.24 against ×0.17.' }[$.change]],
    sim: {
      scenario: 'soft',
      read: (c, s, $) => {
        const fn = { stiffer: 40, softer: 10, damper: 15 }[$.change];
        const z = $.change === 'damper' ? 0.2 : s.zeta;
        return { d: transmissibility(c.f / fn, z) > c.T ? 'more' : 'less' };
      },
    },
    cases: [kase('a stiffer mount', { change: 'stiffer' }, { d: 'more' })],
  }),
  problem({
    id: 'u4.3.miles',
    title: 'Miles’ equation',
    exam: 'u4',
    ch: '4',
    lab: 'random',
    src: 'Flux, written for the Random vibration lab',
    topics: ['random-vibration'],
    principles: ['random-vibration'],
    vars: { fn: choice(['80', '80 Hz'], ['150', '150 Hz'], ['250', '250 Hz']), Q: choice(['10', '10'], ['20', '20']), W: choice(['0.02', '0.02 g²/Hz'], ['0.05', '0.05 g²/Hz']) },
    text: (T) => `A bracket with natural frequency ${T.fn} and amplification Q = ${T.Q} sits on a flat random input of ${T.W}. By Miles’ equation, what is its rms acceleration, in g?`,
    parts: [num('g', ($) => milesG($), 'g', { label: 'g_rms' })],
    level: 1,
    hints: ['The response is concentrated near f_n.', 'g_rms = √((π/2) f_n Q W).'],
    steps: ($) => [String.raw`$g_\text{rms} = \sqrt{\tfrac{\pi}{2}(${$.fn})(${$.Q})(${$.W})} = ${Number(milesG($).toPrecision(3))}$ g`],
    sim: { scenario: 'bracket', setup(s, $) { Object.assign(s, { fn: Number($.fn), Q: Number($.Q), W: Number($.W) }); }, read: (c) => ({ g: c.miles }) },
    cases: [kase('150 Hz, Q 10, 0.05', { fn: '150', Q: '10', W: '0.05' }, { g: 10.85 })],
  }),

  problem({
    id: 'u4.4.stiffer',
    title: 'A stiffer bracket',
    exam: 'u4',
    ch: '4',
    kind: 'conceptual',
    lab: 'random',
    src: 'Flux, written for the Random vibration lab',
    topics: ['random-vibration'],
    principles: ['random-vibration'],
    vars: { fn: choice(['200', 'from 100 Hz to 200 Hz'], ['400', 'from 100 Hz to 400 Hz']) },
    text: (T) => `A bracket on a flat random input is stiffened, its natural frequency going ${T.fn}, with the same Q. What happens to its rms response?`,
    parts: [
      pick('a', 'the rms response', [
        ['up', 'it rises', 'Under a flat input g_rms ∝ √f_n: a stiffer bracket collects more of the spectrum.'],
        ['down', 'it falls, as stiffer is stronger', 'Stiffness helps against a single low-frequency load, not against a flat spectrum.'],
      ], () => 'up'),
    ],
    level: 2,
    hints: ['Look at Miles’ equation.', 'What does f_n multiply?'],
    steps: () => ['g_rms = √((π/2) f_n Q W) rises with f_n.'],
    sim: { scenario: 'bracket', setup(s, $) { s.fn = Number($.fn); }, read: (c) => ({ a: c.grms > vibClosed({ fn: 100, Q: 10, W: 0.04 }).grms ? 'up' : 'down' }) },
    cases: [kase('to 200 Hz', { fn: '200' }, { a: 'up' })],
  }),
];

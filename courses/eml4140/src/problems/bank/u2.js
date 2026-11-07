/**
 * Unit 2 bank: radiation. Original problems, written for the Radiation lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { WIEN } from '@flux/subjects/heat/radiation.js';
import { choice, kase, num, problem, range } from '../kit.js';
import { crossedStrings, strips } from '@flux/subjects/heat/viewfactor.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The emitters by name, at their temperatures in kelvin. */
export const EMITTER = { sun: 5778, filament: 2800, skin: 305 };
/** Two long strips centred one above the other: strip 1 of width 1 on the floor, strip 2 of width w2 at height h. */
export const strings = ($) => crossedStrings(strips({ w2: Number($.w2), x2: 0, h: $.h, tiltDeg: 0 }), Number($.w2));

export default [
  problem({
    id: 'u2.1.wien',
    title: 'Where is the peak?',
    exam: 'u2',
    ch: '2',
    lab: 'radiation',
    src: 'Flux, written for the Radiation lab',
    topics: ['blackbody'],
    principles: ['planck'],
    vars: { body: choice(['sun', 'the Sun’s surface, 5778 K'], ['filament', 'a lamp filament at 2800 K'], ['skin', 'human skin at 305 K']) },
    text: (T) => `Treating it as a black body, at what wavelength does ${T.body} emit most strongly, in µm?`,
    parts: [num('lam', ($) => WIEN / EMITTER[$.body], 'µm', { label: 'λ_max' })],
    level: 1,
    hints: ['Wien’s law: λ_max T is a constant.', 'λ_max = 2898 µm·K / T, with T in kelvin.'],
    steps: ($) => [String.raw`$\lambda_\text{max} = \dfrac{2898}{${EMITTER[$.body]}} = ${Number((WIEN / EMITTER[$.body]).toPrecision(3))}$ µm`],
    sim: {
      scenario: 'sun',
      setup(s, $) {
        Object.assign(s, { surface: 'black', lT: Math.log10(EMITTER[$.body]) });
      },
      read: (c) => ({ lam: c.peak }),
    },
    cases: [kase('the Sun', { body: 'sun' }, { lam: 0.5015 })],
  }),

  problem({
    id: 'u2.2.white',
    title: 'Is white paint a good emitter?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'radiation',
    src: 'Flux, written for the Radiation lab',
    topics: ['surfaces'],
    principles: ['planck'],
    vars: { band: choice(['sun', 'sunlight, mostly below 3 µm'], ['glow', 'its own room-temperature glow, near 10 µm']) },
    text: (T) => `White paint on a satellite. How does it do with ${T.band}?`,
    parts: [
      pick('how', 'white paint', [
        ['poor', 'poorly: it absorbs or emits only a small fraction', 'In the visible and near infrared, white paint reflects most of what falls on it: α is about 0.2.'],
        ['well', 'well: it absorbs or emits most of a black body’s share', 'In the far infrared, white paint is nearly black: ε is about 0.9.'],
      ], ($) => ($.band === 'sun' ? 'poor' : 'well')),
    ],
    level: 1,
    hints: ['Emissivity depends on wavelength.', 'Sunlight peaks near 0.5 µm; a room-temperature surface near 10 µm.'],
    steps: ($) => [$.band === 'sun' ? 'Below 3 µm white paint reflects most light: it absorbs sunlight poorly.' : 'Near 10 µm white paint is nearly black: it emits its own heat well.'],
    sim: {
      scenario: 'white',
      setup(s) {
        Object.assign(s, { surface: 'white', lT: Math.log10(300) });
      },
      read: (c, s, $) => ({ how: $.band === 'sun' ? (c.alphaSolar < 0.5 ? 'poor' : 'well') : c.eps > 0.5 ? 'well' : 'poor' }),
    },
    cases: [kase('in sunlight', { band: 'sun' }, { how: 'poor' })],
  }),
  problem({
    id: 'u2.3.strings',
    title: 'Crossed strings',
    exam: 'u2',
    ch: '2',
    lab: 'viewfactor',
    src: 'Flux, written for the View factor lab',
    topics: ['viewfactor'],
    principles: ['viewfactor'],
    vars: { ask: choice(['F12', 'F₁₂, the share of strip 1’s radiation that reaches strip 2'], ['F21', 'F₂₁, the share of strip 2’s radiation that reaches strip 1']), w2: choice(['0.5', '0.5 m'], ['2', '2 m']), h: range(0.5, 2, 0.25, 'm') },
    text: (T) => `A long strip 1 m wide lies on the floor facing up. A second long strip, ${T.w2} wide, is centred ${T.h} directly above it, facing down. Find ${T.ask}.`,
    parts: [num('F', ($) => strings($)[$.ask], '', { label: 'F', abs: 1e-6 })],
    level: 2,
    hints: ['Stretch four strings between the strips’ ends: two crossing, two not.', 'F₁₂ = (crossed − uncrossed)/(2w₁); F₂₁ divides by 2w₂ instead.'],
    steps: ($) => {
      const r = strings($);
      const w = $.ask === 'F12' ? 1 : Number($.w2);
      return [String.raw`crossed $= ${Number(r.crossed.toPrecision(4))}$ m, uncrossed $= ${Number(r.uncrossed.toPrecision(4))}$ m`, String.raw`$F = (${Number(r.crossed.toPrecision(4))} - ${Number(r.uncrossed.toPrecision(4))})/(2\times ${w}) = ${Number(r[$.ask].toPrecision(3))}$`];
    },
    sim: {
      scenario: 'equal',
      setup(s, $) {
        Object.assign(s, { w2: Number($.w2), x2: 0, h: $.h, tiltDeg: 0 });
      },
      read: (c, s, $) => ({ F: $.ask === 'F12' ? c.F12q : c.F21q }),
    },
    cases: [kase('a 2 m strip 1 m up, its F₁₂', { ask: 'F12', w2: '2', h: 1 }, { F: 0.685 })],
  }),

  problem({
    id: 'u2.4.reciprocity',
    title: 'Which sees more?',
    exam: 'u2',
    ch: '2',
    kind: 'conceptual',
    lab: 'viewfactor',
    src: 'Flux, written for the View factor lab',
    topics: ['viewfactor'],
    principles: ['viewfactor'],
    vars: { setup: choice(['sensor', 'a thumbnail-sized sensor facing a large furnace wall'], ['ceiling', 'a large ceiling panel above a small desk'], ['equal', 'two equal plates facing each other']) },
    text: (T) => `Consider ${T.setup}. Call the first surface named 1 and the second 2. How does F₁₂, the share of 1’s radiation reaching 2, compare with F₂₁?`,
    parts: [
      pick('cmp', 'F₁₂ against F₂₁', [
        ['bigger', 'F₁₂ is larger', 'From a small surface, a large one fills much of the view: the small one sends it a large share.'],
        ['smaller', 'F₁₂ is smaller', 'From a large surface, a small one is a speck: it catches a small share. A₁F₁₂ = A₂F₂₁.'],
        ['equal', 'they are equal', 'Only for equal areas: A₁F₁₂ = A₂F₂₁, so the fractions differ by the area ratio.'],
      ], ($) => ({ sensor: 'bigger', ceiling: 'smaller', equal: 'equal' })[$.setup]),
    ],
    level: 1,
    hints: ['A₁F₁₂ = A₂F₂₁.', 'The smaller surface has the larger fraction.'],
    steps: ($) => [({ sensor: 'The sensor is the smaller area, so its fraction is larger: F₁₂ > F₂₁.', ceiling: 'The ceiling is the larger area, so its fraction is smaller: F₁₂ < F₂₁.', equal: 'Equal areas: A₁F₁₂ = A₂F₂₁ gives F₁₂ = F₂₁.' })[$.setup]],
    sim: {
      scenario: 'equal',
      setup(s, $) {
        // Strip 1 is the lab's floor strip, width 1. A small first surface means a wide strip 2.
        s.w2 = ({ sensor: 3, ceiling: 0.2, equal: 1 })[$.setup];
      },
      read: (c) => ({ cmp: Math.abs(c.F12 - c.F21) < 1e-9 ? 'equal' : c.F12 > c.F21 ? 'bigger' : 'smaller' }),
    },
    cases: [kase('the sensor', { setup: 'sensor' }, { cmp: 'bigger' })],
  }),
];

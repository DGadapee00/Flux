/**
 * Unit 2 bank: radiation. Original problems, written for the Radiation lab, with staged hints and
 * named traps (../coaching/u2.js), each checked against the lab (`sim`).
 */
import { WIEN } from '@flux/subjects/heat/radiation.js';
import { choice, kase, num, problem } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
/** The emitters by name, at their temperatures in kelvin. */
export const EMITTER = { sun: 5778, filament: 2800, skin: 305 };

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
];

/**
 * Unit 11 bank: optical payloads and laser links. Original problems, with staged hints and named
 * traps (../coaching/u11.js). Imaging and link problems are checked against the Imager and Laser
 * link labs (`sim`); the conceptual ones against a second rule (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { imagerClosed } from '@flux/subjects/em/imaging.js';
import { laserClosed } from '@flux/subjects/em/lasercom.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));

const cam = ($, over = {}) => ({ hkm: Number($.h ?? 500), Dcm: Number($.D ?? 9), fmm: Number($.f ?? 580), pum: Number($.p ?? 5.5), lamnm: 550, N: 4096, bits: 12, ...over });

/** Ground sample distance in m; `how` names the traps. */
export function gsdFor($, how = 'right') {
  const c = cam($);
  if (how === 'aperture') return (c.hkm * 1e3 * c.pum * 1e-6) / (c.Dcm / 100);
  if (how === 'mm') return (c.hkm * 1e3 * c.pum * 1e-6) / c.fmm;
  return imagerClosed(c).gsd;
}

/** Diffraction blur on the ground in m; `how` names the traps. */
export function blurFor($, how = 'right') {
  const c = cam($);
  const plain = (c.hkm * 1e3 * c.lamnm * 1e-9) / (c.Dcm / 100);
  if (how === 'noFactor') return plain;
  if (how === 'diameter') return 2 * 1.2197 * plain;
  return imagerClosed(c).spot;
}

const link = ($, over = {}) => ({ lamnm: 1550, Dtmm: Number($.Dt ?? 10), PW: Number($.P ?? 1), dkm: Number($.d ?? 1000), Drcm: Number($.Dr ?? 40), epsur: 0, rateMbps: 200, ...over });

/** Beam divergence in µrad; `how` names the traps. */
export function divergenceFor($, how = 'right') {
  const lam = 1550e-9;
  const Dt = Number($.Dt) / 1000;
  if (how === 'diameter') return (lam / (Math.PI * Dt)) * 1e6;
  if (how === 'noPi') return (lam / (Dt / 2)) * 1e6;
  return laserClosed(link($)).theta * 1e6;
}

/** Received power in dBm on target; `how` names the traps. */
export function receivedDBm($, how = 'right') {
  if (how === 'radius') return laserClosed(link($, { Drcm: 2 * Number($.Dr) })).dBm;
  if (how === 'dBW') return laserClosed(link($)).dBm - 30;
  return laserClosed(link($)).dBm;
}

const SAYS = {
  licence: { text: 'needs a frequency licence for its downlink at present', answer: 'rf' },
  clouds: { text: 'loses its link when clouds cover the ground station', answer: 'laser' },
  intercept: { text: 'is harder for others to intercept or jam, because its beam is so narrow', answer: 'laser' },
};

export default [
  problem({
    id: 'u11.1.gsd',
    title: 'Ground per pixel',
    exam: 'u11',
    ch: '11',
    lab: 'imager',
    src: 'Flux, written for the Imager lab',
    topics: ['imaging'],
    principles: ['imaging'],
    vars: { h: choice(['400', '400 km'], ['500', '500 km'], ['600', '600 km']), f: choice(['580', '580 mm'], ['1000', '1000 mm'], ['1500', '1500 mm']) },
    variety: ['altitude and focal length'],
    text: (T) => `A camera in orbit at ${T.h} looks straight down through a telescope of ${T.f} focal length and 9 cm aperture onto 5.5 µm pixels. How much ground does one pixel cover, in m?`,
    parts: [num('g', ($) => gsdFor($), 'm', { label: 'GSD' })],
    level: 1,
    hints: ['A pixel sees the angle p/f.', 'GSD = h p/f, all in metres.'],
    steps: ($) => [String.raw`$\text{GSD} = (${Number($.h) * 1000})(5.5\times10^{-6})/${Number($.f) / 1000} = ${fmt(gsdFor($))}$ m`],
    sim: { scenario: 'cube', setup(s, $) { Object.assign(s, { hkm: Number($.h), fmm: Number($.f), Dcm: 9, pum: 5.5, band: 'green' }); }, read: (c) => ({ g: c.gsd }) },
    cases: [kase('500 km, 580 mm', { h: '500', f: '580' }, { g: 4.741 })],
  }),

  problem({
    id: 'u11.2.blur',
    title: 'The diffraction blur',
    exam: 'u11',
    ch: '11',
    lab: 'imager',
    src: 'Flux, written for the Imager lab',
    topics: ['imaging'],
    principles: ['imaging'],
    vars: { h: choice(['400', '400 km'], ['500', '500 km'], ['600', '600 km']), D: choice(['6', '6 cm'], ['9', '9 cm'], ['18', '18 cm']) },
    variety: ['altitude and aperture'],
    text: (T) => `A telescope with a ${T.D} aperture looks straight down from ${T.h} at 550 nm. By the Rayleigh criterion, how far apart on the ground must two points be to be resolved, in m?`,
    parts: [num('b', ($) => blurFor($), 'm', { label: 'blur' })],
    level: 2,
    hints: ['The Rayleigh angle is 1.22 λ/D.', 'On the ground the blur is h times that angle.'],
    steps: ($) => [String.raw`$\theta = 1.22 \times 550\times10^{-9}/${Number($.D) / 100} = ${fmt((1.2197 * 550e-9) / (Number($.D) / 100))}$ rad`, String.raw`$h\theta = ${fmt(blurFor($))}$ m`],
    sim: { scenario: 'cube', setup(s, $) { Object.assign(s, { hkm: Number($.h), Dcm: Number($.D), band: 'green' }); }, read: (c) => ({ b: c.spot }) },
    cases: [kase('9 cm at 500 km', { h: '500', D: '9' }, { b: 3.727 })],
  }),

  problem({
    id: 'u11.3.limit',
    title: 'Pixels or optics?',
    exam: 'u11',
    ch: '11',
    kind: 'conceptual',
    lab: 'imager',
    src: 'Flux, written for the Imager lab',
    topics: ['imaging'],
    principles: ['imaging'],
    vars: { f: choice(['580', '580 mm'], ['1500', '1500 mm']), p: choice(['5.5', '5.5 µm'], ['2.75', '2.75 µm']) },
    variety: ['focal length and pixel'],
    text: (T) => `A 9 cm telescope at 500 km images at 550 nm with a ${T.f} focal length and ${T.p} pixels. Which sets the finest detail it shows?`,
    parts: [
      pick('l', 'the limit', [
        ['pixels', 'the pixels', 'Each pixel covers more ground than the blur, so finer pixels would show more.'],
        ['optics', 'the optics', 'The aperture’s blur is coarser than a pixel, so finer pixels add nothing.'],
      ], ($) => imagerClosed(cam({ h: 500, D: 9, f: $.f, p: $.p })).limit),
    ],
    level: 2,
    hints: ['Find the GSD, h p/f, and the blur, 1.22 λ h/D.', 'The coarser of the two sets the detail.'],
    steps: ($) => {
      const c = imagerClosed(cam({ h: 500, D: 9, f: $.f, p: $.p }));
      return [`GSD ${fmt(c.gsd)} m against a ${fmt(c.spot)} m blur: the ${c.limit}.`];
    },
    second: ($) => {
      const Q = (550e-9 * (Number($.f) / 1000)) / (0.09 * Number($.p) * 1e-6);
      return { l: Q > 1 / 1.2197 ? 'optics' : 'pixels' };
    },
    cases: [kase('580 mm, 5.5 µm', { f: '580', p: '5.5' }, { l: 'pixels' })],
  }),

  problem({
    id: 'u11.4.divergence',
    title: 'How fast the beam spreads',
    exam: 'u11',
    ch: '11',
    lab: 'laser',
    src: 'Flux, written for the Laser link lab',
    topics: ['lasercom'],
    principles: ['lasercom'],
    vars: { Dt: choice(['2', '2 mm'], ['5', '5 mm'], ['10', '10 mm'], ['20', '20 mm']) },
    variety: ['transmit aperture'],
    text: (T) => `A laser terminal sends at 1550 nm from a ${T.Dt} aperture; take the beam's waist radius as half the aperture. What is the beam's divergence half-angle, in µrad?`,
    parts: [num('t', ($) => divergenceFor($), 'µrad', { label: 'θ' })],
    level: 1,
    hints: ['For a Gaussian beam θ = λ/(π w₀).', 'w₀ is the radius: half the aperture.'],
    steps: ($) => [String.raw`$\theta = 1.55\times10^{-6}/(\pi \times ${Number($.Dt) / 2000}) = ${fmt(divergenceFor($))}\ \mu$rad`],
    sim: { scenario: 'cube', setup(s, $) { Object.assign(s, { Dtmm: Number($.Dt), wave: 'nm1550' }); }, read: (c) => ({ t: c.theta * 1e6 }) },
    cases: [kase('10 mm', { Dt: '10' }, { t: 98.68 })],
  }),

  problem({
    id: 'u11.5.received',
    title: 'Power on the telescope',
    exam: 'u11',
    ch: '11',
    lab: 'laser',
    src: 'Flux, written for the Laser link lab',
    topics: ['lasercom'],
    principles: ['lasercom'],
    vars: { d: choice(['600', '600 km'], ['1000', '1000 km'], ['1500', '1500 km']), Dr: choice(['30', '30 cm'], ['40', '40 cm'], ['60', '60 cm']) },
    variety: ['range and telescope'],
    text: (T) => `A 10 mm terminal sends 1 W at 1550 nm, waist radius 5 mm, pointed true at a ground telescope of ${T.Dr} diameter ${T.d} away. How much power does the telescope catch, in dBm?`,
    parts: [num('p', ($) => receivedDBm($), 'dBm', { label: 'P_r', abs: 0.05 })],
    level: 3,
    hints: ['θ = λ/(π w₀), and the beam radius at the ground is w = θ d.', 'P_r = P_t(1 − e^(−2r²/w²)) with r the telescope’s radius; then 10 log₁₀(P_r/1 mW).'],
    steps: ($) => {
      const c = laserClosed(link($));
      return [String.raw`$w = ${fmt(c.w)}$ m, share $= ${c.share.toExponential(3).replace('e', '\\times10^{') + '}'}$`, String.raw`$P_r = ${fmt(c.dBm)}$ dBm`];
    },
    sim: { scenario: 'cube', setup(s, $) { Object.assign(s, { dkm: Number($.d), Drcm: Number($.Dr), Dtmm: 10, PW: 1, epsur: 0, wave: 'nm1550' }); }, read: (c) => ({ p: c.dBm }) },
    cases: [kase('40 cm at 1000 km', { d: '1000', Dr: '40' }, { p: -20.85 })],
  }),

  problem({
    id: 'u11.6.narrow',
    title: 'Narrow or wide?',
    exam: 'u11',
    ch: '11',
    kind: 'conceptual',
    lab: 'laser',
    src: 'Flux, written for the Laser link lab',
    topics: ['lasercom'],
    principles: ['lasercom'],
    vars: { eps: choice(['5', '5 µrad, with a fine-steering mirror'], ['349', '349 µrad, by turning the whole craft']) },
    variety: ['pointing error'],
    text: (T) => `A terminal can send through a 10 mm or a 1 mm aperture at 1550 nm to a ground telescope 1000 km away. Its pointing error is ${T.eps}. Which aperture puts more power on the telescope?`,
    parts: [
      pick('a', 'aperture', [
        ['narrow', 'the 10 mm, narrow beam', 'Pointed well, the narrow beam concentrates its power a hundredfold.'],
        ['wide', 'the 1 mm, wide beam', 'Pointed poorly, only the wide beam still covers the telescope.'],
      ], ($) => ($.eps === '5' ? 'narrow' : 'wide')),
    ],
    level: 2,
    hints: ['The 10 mm beam spreads 99 µrad; the 1 mm beam 987 µrad.', 'Compare each beam’s width with the pointing error.'],
    steps: ($) => [$.eps === '5' ? '5 µrad is small against 99 µrad: the narrow beam wins.' : '349 µrad is three and a half narrow-beam radii: only the wide beam reaches.'],
    second: ($) => {
      const e = Number($.eps);
      const n = laserClosed(link({ Dt: 10 }, { epsur: e })).Pr;
      const w = laserClosed(link({ Dt: 1 }, { epsur: e })).Pr;
      return { a: n > w ? 'narrow' : 'wide' };
    },
    cases: [kase('body pointing', { eps: '349' }, { a: 'wide' })],
  }),

  problem({
    id: 'u11.7.which',
    title: 'Laser or radio?',
    exam: 'u11',
    ch: '11',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 9.3',
    topics: ['laserops'],
    principles: ['laserops'],
    vars: { q: choice(['licence', 'licence'], ['clouds', 'clouds'], ['intercept', 'intercept']) },
    variety: ['which property'],
    text: (T, $) => `Which kind of downlink ${SAYS[$.q].text}?`,
    parts: [
      pick('k', 'downlink', [
        ['laser', 'a laser downlink', 'Optical: a narrow beam, stopped by clouds, not licensed at present.'],
        ['rf', 'a radio downlink', 'Radio: a wide beam, through most weather, licensed by the FCC or NTIA.'],
      ], ($) => SAYS[$.q].answer),
    ],
    level: 1,
    hints: ['Think of the beam’s width and the wavelength.', 'Clouds absorb light; licences cover radio spectrum.'],
    steps: ($) => [`It is ${SAYS[$.q].answer === 'laser' ? 'the laser' : 'the radio'} downlink.`],
    second: ($) => ({ k: { licence: 'rf', clouds: 'laser', intercept: 'laser' }[$.q] }),
    cases: [kase('clouds', { q: 'clouds' }, { k: 'laser' })],
  }),
];

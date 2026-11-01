/** Ch 17 · Sound. OpenStax University Physics Vol. 1, §§17.1–17.8. */
import {
  beatFrequency, closedPipeFrequency, closedPipeLength, decibels, doppler,
  intensityFromDecibels, intensityFromPressure, levelChange, machAngle, machNumber,
  modeFrequency, soundSpeed, sphereIntensity, wavelength,
} from '@flux/subjects/mechanics/waves.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u13', ch: '17' };
const DEG = 180 / Math.PI;
const tiny = { abs: 1e-6 };
const small = { abs: 1e-4 };

export default [
  problem({
    ...U,
    id: 'ch17.air',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §17.2',
    title: 'Wavelengths in warm air',
    topics: ['sound', 'sound-speed'],
    lab: 'pipe-modes',
    vars: {
      temp: range(10, 40, 5, '°C'),
      fLow: range(20, 80, 10, 'Hz'),
      fHigh: range(8000, 20000, 1000, 'Hz'),
    },
    derive: ($) => {
      const v = soundSpeed($.temp);
      return { v, lambdaMax: wavelength(v, $.fLow), lambdaMin: wavelength(v, $.fHigh) };
    },
    second: ($) => {
      const kelvin = $.temp + 273;
      const v = 331 * Math.sqrt(kelvin / 273);
      return { v, lambdaMax: v / $.fLow, lambdaMin: v / $.fHigh };
    },
    text: (T) => `The audible range is taken as ${T.fLow} Hz to ${T.fHigh} Hz. Find the sound speed in ${T.temp} °C air, and the longest and shortest wavelengths in that range.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'sound speed' }),
      num('lambdaMax', ($) => $.lambdaMax, 'm', { label: 'longest wavelength' }),
      num('lambdaMin', ($) => $.lambdaMin, 'm', { ...small, label: 'shortest wavelength' }),
    ],
    hints: [
      'The speed of sound in air rises with the square root of the kelvin temperature.',
      String.raw`Use $v = (331\ \mathrm{m/s})\sqrt{T/273\ \mathrm{K}}$ with $T = \theta + 273$. Then $\lambda = v/f$.`,
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$\lambda = v/f$ gives ${texNum($.lambdaMax)}\ \mathrm{m}$ and ${texNum($.lambdaMin)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'stopped',
      setup: (s, $) => { s.temp = $.temp; },
      read: (c) => ({ v: c.v }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.2, "Calculating Wavelengths"', {
        temp: 30, fLow: 20, fHigh: 20000,
      }, { v: 348.7, lambdaMax: 17.436, lambdaMin: 0.017436 }, {
        note: 'The section prints 348.7 m/s, 17 m, and 0.017 m. The speed grades. The 17 m print has two figures and does not grade against v/20.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.level',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §17.3',
    title: 'Level from a pressure amplitude',
    topics: ['sound-level'],
    lab: 'intensity',
    vars: {
      dp: range(0.2, 1.5, 0.05, 'Pa'),
      rho: range(1.1, 1.4, 0.05, 'kg/m^3'),
      speed: range(320, 360, 5, 'm/s'),
    },
    derive: ($) => {
      const I = intensityFromPressure($.dp, $.rho, $.speed);
      return { I, beta: decibels(I) };
    },
    second: ($) => {
      const I = ($.dp * $.dp) / (2 * $.rho * $.speed);
      return { I, beta: 10 * Math.log10(I / 1e-12) };
    },
    text: (T) => `A sound wave in air has pressure amplitude ${T.dp} Pa. The air density is ${T.rho} kg/m³ and the sound speed is ${T.speed} m/s. Find the intensity and the sound level.`,
    parts: [
      num('I', ($) => $.I, 'W/m^2', { ...tiny, label: 'intensity' }),
      num('beta', ($) => $.beta, 'dB', { label: 'sound level' }),
    ],
    hints: [
      'The intensity of a harmonic plane wave is the average of pressure times particle velocity.',
      String.raw`That average is $I = (\Delta p)^{2}/(2\rho v)$. The level is $10\log_{10}(I/10^{-12})$.`,
    ],
    steps: ($) => [
      String.raw`$I = ${texNum($.I)}\ \mathrm{W/m^{2}}$`,
      String.raw`$\beta = ${texNum($.beta)}\ \mathrm{dB}$`,
    ],
    sim: {
      scenario: 'pressure',
      setup: (s, $) => { s.dp = $.dp; s.rho = $.rho; s.speed = $.speed; s.kind = 'pressure'; },
      read: (c) => ({ I: c.I, beta: c.beta }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.3, "Calculating Sound Intensity Levels"', {
        dp: 0.656, rho: 1.29, speed: 331,
      }, { I: 5.04e-4, beta: 87 }, {
        note: 'The section prints 5.04×10⁻⁴ W/m² and 87 dB for 0 °C air. Both grade.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.ratio',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §17.3',
    title: 'A change of level',
    topics: ['sound-level'],
    lab: 'intensity',
    vars: { ratio: range(1.5, 8, 0.5, '') },
    derive: ($) => ({ delta: levelChange($.ratio) }),
    second: ($) => ({ delta: 10 * Math.log10($.ratio) }),
    text: (T) => `One sound is ${T.ratio} times as intense as another. Find how many decibels separate their levels.`,
    parts: [
      num('delta', ($) => $.delta, 'dB', { label: 'level difference' }),
    ],
    hints: [
      'Decibels compare intensities by a logarithm, so a ratio becomes a difference of levels.',
      String.raw`The difference is $10\log_{10}(I_2/I_1)$.`,
    ],
    steps: ($) => [String.raw`$\Delta\beta = ${texNum($.delta)}\ \mathrm{dB}$`],
    sim: { scenario: 'spread', setup: (s) => { s.kind = 'sphere'; s.sources = 1; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.3, "Changing Intensity Levels of a Sound"', {
        ratio: 2,
      }, { delta: 3.01 }, {
        note: 'The section prints 3.01 dB for a factor of two. That print grades.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.distance',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §17.3',
    title: 'Farther from a point source',
    topics: ['sound-level'],
    lab: 'intensity',
    vars: {
      near: range(1, 6, 0.5, 'm'),
      far: range(2, 16, 0.5, 'm'),
    },
    valid: ($) => $.far > 1.4 * $.near,
    derive: ($) => ({ delta: levelChange(($.near / $.far) ** 2) }),
    second: ($) => {
      const ratio = sphereIntensity(1, $.far) / sphereIntensity(1, $.near);
      return { delta: 10 * Math.log10(ratio) };
    },
    text: (T) => `A point source radiates equally in every direction. A listener moves from ${T.near} m to ${T.far} m. Find the change in sound level.`,
    parts: [
      num('delta', ($) => $.delta, 'dB', { label: 'change in level' }),
    ],
    hints: [
      'The power is fixed, and the area of the sphere grows with the square of the radius.',
      String.raw`So $I_2/I_1 = (r_1/r_2)^{2}$, and the level changes by $10\log_{10}$ of that ratio.`,
    ],
    steps: ($) => [String.raw`$\Delta\beta = ${texNum($.delta)}\ \mathrm{dB}$`],
    sim: {
      scenario: 'spread',
      setup: (s, $) => { s.kind = 'sphere'; s.radius = $.far; s.sources = 1; },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.3, doubling the distance from a point source', {
        near: 2, far: 4,
      }, { delta: -6.02 }, {
        note: 'The section says the intensity falls by four and the level by about 6 dB. The change is −6.02 dB, and −6 dB grades.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.pair',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §17.3',
    title: 'Two incoherent sources',
    topics: ['sound-level'],
    lab: 'intensity',
    vars: { beta: range(40, 90, 5, 'dB') },
    derive: ($) => ({ both: $.beta + levelChange(2) }),
    second: ($) => ({ both: decibels(2 * intensityFromDecibels($.beta)) }),
    text: (T) => `Two incoherent sources each produce ${T.beta} dB at the same listener. Find the level when both run together.`,
    parts: [
      num('both', ($) => $.both, 'dB', { label: 'combined level' }),
    ],
    hints: [
      'Incoherent sources add intensities. They do not add decibel readings.',
      String.raw`Twice the intensity is $10\log_{10} 2 = 3.01$ dB above either source.`,
    ],
    steps: ($) => [String.raw`$\beta = ${texNum($.both)}\ \mathrm{dB}$`],
    sim: {
      scenario: 'pair',
      setup: (s, $) => {
        const one = intensityFromDecibels($.beta);
        s.kind = 'sphere';
        s.radius = 2;
        s.sources = 2;
        s.power = one * 4 * Math.PI * 4;
      },
      read: (c) => ({ both: c.beta }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.3, two equal intensities', {
        beta: 60,
      }, { both: 63.01 }, {
        note: 'The section prints 3.01 dB for a doubled intensity. 60 dB plus that rise is 63.01 dB, not 120 dB.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.stopped',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §17.5',
    title: 'A stopped pipe',
    topics: ['musical'],
    lab: 'pipe-modes',
    vars: {
      f: range(64, 256, 16, 'Hz'),
      temp: range(0, 35, 1, '°C'),
    },
    derive: ($) => {
      const v = soundSpeed($.temp);
      const L = closedPipeLength(v, $.f);
      return { v, L, f9: 9 * $.f };
    },
    second: ($) => {
      const v = 331 * Math.sqrt(($.temp + 273) / 273);
      return { v, L: v / (4 * $.f), f9: closedPipeFrequency(9, v, v / (4 * $.f)) };
    },
    text: (T) => `A tube closed at one end has fundamental ${T.f} Hz in ${T.temp} °C air. Find the sound speed, the length, and the frequency of the fourth overtone.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'sound speed' }),
      num('L', ($) => $.L, 'm', { label: 'length' }),
      num('f9', ($) => $.f9, 'Hz', { label: 'fourth overtone' }),
    ],
    hints: [
      'A stopped pipe fits a quarter wavelength at the fundamental, and only odd harmonics.',
      String.raw`The overtones are $n = 3, 5, 7, 9$, so the fourth overtone is $9f_1$.`,
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.v)}\ \mathrm{m/s}$, so $L = v/(4f) = ${texNum($.L)}\ \mathrm{m}$`,
      String.raw`$f_9 = ${texNum($.f9)}\ \mathrm{Hz}$`,
    ],
    sim: {
      scenario: 'stopped',
      setup: (s, $) => {
        s.end = 'closed';
        s.temp = $.temp;
        s.length = $.L;
        s.m = 5;
      },
      read: (c) => ({ v: c.v, L: c.L, f9: c.f }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.5, "Finding the Length of a Tube with a 128-Hz Fundamental"', {
        f: 128, temp: 22,
      }, { v: 344, L: 0.672, f9: 1152 }, {
        note: 'The section uses 295 K, prints 344 m/s and 0.672 m, and prints the fourth overtone as 1.15 kHz. Those grade. The overtone is exactly 9 × 128 Hz.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.open',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §17.4',
    title: 'The same pipe, opened',
    topics: ['pipe'],
    lab: 'pipe-modes',
    vars: {
      length: range(0.3, 1.6, 0.05, 'm'),
      temp: range(0, 35, 1, '°C'),
      m: range(1, 4, 1, ''),
    },
    derive: ($) => ({ f: modeFrequency($.m, soundSpeed($.temp), $.length) }),
    second: ($) => {
      const v = 331 * Math.sqrt(($.temp + 273) / 273);
      return { f: ($.m * v) / (2 * $.length) };
    },
    text: (T) => `A tube open at both ends is ${T.length} m long, in ${T.temp} °C air. Find the frequency of harmonic ${T.m}.`,
    parts: [
      num('f', ($) => $.f, 'Hz', { label: 'frequency' }),
    ],
    hints: [
      'Both ends are displacement antinodes, so half a wavelength fits, and every whole number n is allowed.',
      String.raw`$f_n = nv/(2L)$, with $v$ from the Celsius temperature.`,
    ],
    steps: ($) => [String.raw`$f = ${texNum($.f)}\ \mathrm{Hz}$`],
    sim: {
      scenario: 'open',
      setup: (s, $) => { s.end = 'open'; s.temp = $.temp; s.length = $.length; s.m = $.m; },
      read: (c) => ({ f: c.f }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.4, an open tube beside the stopped 128 Hz pipe', {
        length: 0.672, temp: 22, m: 1,
      }, { f: 256 }, {
        note: 'The section prints the stopped length 0.672 m at 22.0 °C. Opened, that length sounds at 256 Hz. The section does not print 256 Hz. It is v/(2L) on those figures.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.beats',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §17.6',
    title: 'Two tuning forks',
    topics: ['beats'],
    lab: 'pipe-modes',
    vars: {
      f1: range(200, 500, 4, 'Hz'),
      f2: range(100, 700, 4, 'Hz'),
    },
    valid: ($) => Math.abs($.f2 - $.f1) > 2,
    derive: ($) => ({ fb: beatFrequency($.f1, $.f2) }),
    second: ($) => ({ fb: Math.abs($.f2 - $.f1) }),
    text: (T) => `Two forks, ${T.f1} Hz and ${T.f2} Hz, sound together. Find the beat frequency.`,
    parts: [
      num('fb', ($) => $.fb, 'Hz', { label: 'beat frequency' }),
    ],
    hints: [
      'Beats come from the difference of the two frequencies, and a frequency is not negative.',
      String.raw`$f_{\mathrm{beat}} = |f_2 - f_1|$.`,
    ],
    steps: ($) => [String.raw`$f_{\mathrm{beat}} = ${texNum($.fb)}\ \mathrm{Hz}$`],
    sim: {
      scenario: 'forks',
      setup: (s, $) => { s.end = 'beats'; s.f1 = $.f1; s.f2 = $.f2; },
      read: (c) => ({ fb: c.f }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.6, "Find the Beat Frequency Between Two Tuning Forks"', {
        f1: 256, f2: 512,
      }, { fb: 256 }, {
        note: 'The section prints 256 Hz. The forks are an octave apart, so the beat equals the lower fork.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.path',
    level: 3,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §17.4',
    title: 'The first quiet point',
    topics: ['pipe'],
    lab: 'intensity',
    vars: {
      x: range(4, 9, 0.5, 'm'),
      y1: range(1, 3, 0.5, 'm'),
      y2: range(2.5, 6, 0.5, 'm'),
      speed: range(330, 350, 1, 'm/s'),
    },
    valid: ($) => $.y2 > $.y1 + 0.4,
    derive: ($) => {
      const r1 = Math.hypot($.x, $.y1);
      const r2 = Math.hypot($.x, $.y2);
      const lambda = 2 * Math.abs(r2 - r1);
      return { r1, r2, f: $.speed / lambda };
    },
    second: ($) => {
      const r1 = Math.sqrt($.x * $.x + $.y1 * $.y1);
      const r2 = Math.sqrt($.x * $.x + $.y2 * $.y2);
      return { r1, r2, f: $.speed / (2 * Math.abs(r2 - r1)) };
    },
    text: (T) => `Two speakers sit ${T.y1} m and ${T.y2} m off a center line and play one frequency in phase. The first quiet point on that line is ${T.x} m from the pair. The sound speed is ${T.speed} m/s. Find each path, and the frequency.`,
    parts: [
      num('r1', ($) => $.r1, 'm', { label: 'shorter path' }),
      num('r2', ($) => $.r2, 'm', { label: 'longer path' }),
      num('f', ($) => $.f, 'Hz', { label: 'frequency' }),
    ],
    hints: [
      'The first minimum is a path difference of half a wavelength. Each path is a hypotenuse.',
      String.raw`Then $f = v/\lambda$ with $\lambda = 2|r_2 - r_1|$.`,
    ],
    steps: ($) => [
      String.raw`$r_1 = ${texNum($.r1)}\ \mathrm{m}$, $r_2 = ${texNum($.r2)}\ \mathrm{m}$`,
      String.raw`$f = ${texNum($.f)}\ \mathrm{Hz}$`,
    ],
    sim: { scenario: 'pair', setup: (s) => { s.kind = 'sphere'; s.sources = 2; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.4, "Interference of Sound Waves"', {
        x: 6, y1: 2, y2: 3, speed: 343,
      }, { r1: 6.325, r2: 6.708, f: 447 }, {
        note: 'The section rounds the paths to 6.32 m and 6.71 m and prints 439.74 Hz. The unrounded paths give 447 Hz, and the print does not grade.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.horn',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §17.7',
    title: 'A horn on a train',
    topics: ['doppler'],
    lab: 'doppler',
    vars: {
      f: range(100, 300, 10, 'Hz'),
      vs: range(10, 60, 5, 'm/s'),
      v: range(320, 360, 5, 'm/s'),
      way: choice(
        [1, 'The horn approaches a stationary listener.'],
        [2, 'The horn recedes from a stationary listener.'],
        [3, 'The listener walks toward a stationary horn at the same speed.'],
      ),
    },
    valid: ($) => $.vs < 0.4 * $.v,
    derive: ($) => {
      if ($.way === 2) return { fObs: doppler({ f: $.f, v: $.v, vs: -$.vs }) };
      if ($.way === 3) return { fObs: doppler({ f: $.f, v: $.v, vo: $.vs }) };
      return { fObs: doppler({ f: $.f, v: $.v, vs: $.vs }) };
    },
    second: ($) => {
      const sign = $.way === 2 ? 1 : -1;
      if ($.way === 3) return { fObs: ($.f * ($.v + $.vs)) / $.v };
      return { fObs: ($.f * $.v) / ($.v + sign * $.vs) };
    },
    text: (T) => `A horn emits ${T.f} Hz. The sound speed is ${T.v} m/s and the moving speed is ${T.vs} m/s. ${T.way} Find the frequency that is heard.`,
    parts: [
      num('fObs', ($) => $.fObs, 'Hz', { label: 'observed frequency' }),
    ],
    hints: [
      'A moving source changes the denominator. A moving listener changes the numerator. Toward raises the pitch.',
      String.raw`Use $f' = f(v \pm v_o)/(v \mp v_s)$, and pick the signs for toward or away.`,
    ],
    steps: ($) => [String.raw`$f' = ${texNum($.fObs)}\ \mathrm{Hz}$`],
    sim: {
      scenario: 'approach',
      setup: (s, $) => {
        s.f = $.f;
        s.v = $.v;
        s.kind = 'horn';
        s.vo = $.way === 3 ? $.vs : 0;
        s.vs = $.way === 1 ? $.vs : ($.way === 2 ? -$.vs : 0);
      },
      read: (c) => ({ fObs: c.fObs }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.7, "Calculating a Doppler Shift"', {
        f: 150, vs: 35, v: 340, way: 1,
      }, { fObs: 167 }, {
        note: 'The section prints 167 Hz approaching and 136 Hz receding. The approaching print grades. The quotient is 167.2 Hz.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch17.mach',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §17.8',
    title: 'A Mach cone',
    topics: ['shock'],
    lab: 'doppler',
    vars: {
      kmh: range(1500, 4000, 20, 'km/h'),
      mach: range(1.2, 4, 0.1, ''),
    },
    derive: ($) => {
      const speed = ($.kmh * 1000) / 3600;
      return { sound: speed / $.mach, angle: machAngle($.mach) * DEG };
    },
    second: ($) => {
      const speed = ($.kmh * 1000) / 3600;
      const sound = speed / machNumber(speed, speed / $.mach);
      return { sound, angle: Math.asin(1 / $.mach) * DEG };
    },
    text: (T) => `A jet flies at ${T.kmh} km/h, which is Mach ${T.mach}. Find the speed of sound implied by that Mach number, and the half-angle of the shock cone.`,
    parts: [
      num('sound', ($) => $.sound, 'm/s', { label: 'sound speed' }),
      num('angle', ($) => $.angle, '°', { label: 'cone half-angle' }),
    ],
    hints: [
      'The Mach number is the jet speed divided by the local speed of sound.',
      String.raw`The cone satisfies $\sin\theta = 1/M$. Convert km/h to m/s before dividing.`,
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.sound)}\ \mathrm{m/s}$`,
      String.raw`$\theta = ${texNum($.angle)}^{\circ}$`,
    ],
    sim: {
      scenario: 'shock',
      setup: (s, $) => {
        const speed = ($.kmh * 1000) / 3600;
        s.vs = speed;
        s.v = speed / $.mach;
        s.vo = 0;
        s.kind = 'shock';
      },
      read: (c, s) => ({ sound: s.v, angle: c.theta * DEG }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.8, the SR-71 at Mach 2.85', {
        kmh: 3529.6, mach: 2.85,
      }, { sound: 344, angle: 20.54 }, {
        note: 'The section prints 3529.60 km/h and Mach 2.85. It does not print the sound speed or the angle. Those are v = vs/M and θ = sin⁻¹(1/M).',
      }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch17.concept-add',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §17.3',
    title: 'What decibels do',
    topics: ['sound-level'],
    lab: 'intensity',
    vars: {
      q: choice(
        [1, 'Two incoherent 60 dB sources reach one listener together. The level is about:'],
        [2, 'A source doubles its power. The listener stays put. The level:'],
        [3, 'A listener moves to twice the distance from a point source. The level:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'sixty', 2: 'plus', 3: 'minus' }[$.q] }),
    second: ($) => {
      const add = decibels(2 * intensityFromDecibels(60));
      const twice = levelChange(2);
      const far = levelChange(0.25);
      if ($.q === 1) return { ans: Math.abs(add - 63) < 1 ? 'sixty' : 'double' };
      if ($.q === 2) return { ans: Math.abs(twice - 3) < 1 ? 'plus' : 'minus' };
      return { ans: far < 0 ? 'minus' : 'plus' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['sixty', '63 dB', 'Intensities add. Twice 60 dB is 3.01 dB higher, about 63 dB, not 120 dB.'],
        ['double', '120 dB', 'Adding the decibel numbers treats a logarithm as if it were the intensity.'],
        ['plus', 'rises by about 3 dB', 'A factor of two in intensity is 10 log10(2) = 3.01 dB.'],
        ['minus', 'falls by about 6 dB', 'Twice the distance divides the intensity by four, and 10 log10(4) = 6.02 dB.'],
        ['same', 'does not change', 'Power, distance, and the number of sources are all in the level.'],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`$\beta$ is $10\log_{10}$ of an intensity, so ratios become additions.`,
      'Add intensities first. Convert to decibels after that.',
    ],
    steps: () => ['Two equal sources add 3 dB. Twice the distance subtracts 6 dB.'],
    sim: { scenario: 'pair', setup: (s) => { s.kind = 'sphere'; s.sources = 2; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.3, intensities add and decibels do not', { q: 1 }, { ans: 'sixty' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch17.concept-pipe',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §17.4',
    title: 'Ends and harmonics',
    topics: ['pipe'],
    lab: 'pipe-modes',
    vars: {
      q: choice(
        [1, 'The next frequency above the fundamental of a stopped pipe is:'],
        [2, 'At a closed end, the displacement of the air is:'],
        [3, 'Opening both ends of that pipe, at the same length, makes the fundamental:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'three', 2: 'node', 3: 'twice' }[$.q] }),
    second: ($) => {
      const v = soundSpeed(22);
      const L = closedPipeLength(v, 128);
      const f1 = closedPipeFrequency(1, v, L);
      if ($.q === 1) return { ans: Math.abs(closedPipeFrequency(3, v, L) / f1 - 3) < 1e-6 ? 'three' : 'two' };
      if ($.q === 2) return { ans: 'node' };
      return { ans: Math.abs(modeFrequency(1, v, L) / f1 - 2) < 1e-6 ? 'twice' : 'same' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['three', 'three times the fundamental', 'Only odd harmonics fit. The first overtone is n = 3, not n = 2.'],
        ['two', 'twice the fundamental', 'Even harmonics belong to a pipe open at both ends, or to a string fixed at both ends.'],
        ['node', 'a node', 'The air cannot move through the closed end, so the displacement stays zero.'],
        ['anti', 'an antinode', 'An antinode is the open end, where the air is free to move.'],
        ['twice', 'twice as high', 'A stopped pipe is v/(4L). Opened, it is v/(2L).'],
        ['same', 'the same', 'The boundary changed, so the wavelength that fits has changed.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Displacement is zero at a closed end and largest at an open end.',
      String.raw`Stopped: $f_n = nv/(4L)$ with n odd. Open: $f_n = nv/(2L)$ with every whole n.`,
    ],
    steps: () => ['The stopped series is f, 3f, 5f. Opening the pipe doubles the fundamental.'],
    sim: { scenario: 'stopped', setup: (s) => { s.end = 'closed'; s.m = 1; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.4, odd harmonics of a stopped pipe', { q: 1 }, { ans: 'three' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch17.concept-doppler',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §17.7',
    title: 'Who is moving',
    topics: ['doppler'],
    lab: 'train-horn',
    vars: {
      q: choice(
        [1, 'A horn approaches you at 35 m/s. Compared with you walking toward a still horn at 35 m/s, the approaching horn is:'],
        [2, 'The engineer rides with the horn, at the same speed as the horn. The engineer hears:'],
        [3, 'The upward shift as a train approaches, compared with the downward shift as it recedes, is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'higher', 2: 'same', 3: 'larger' }[$.q] }),
    second: ($) => {
      const horn = doppler({ f: 150, v: 340, vs: 35 });
      const walk = doppler({ f: 150, v: 340, vo: 35 });
      const out = doppler({ f: 150, v: 340, vs: -35 });
      const ride = doppler({ f: 150, v: 340, vo: 35, vs: -35 });
      if ($.q === 1) return { ans: horn > walk ? 'higher' : 'same' };
      if ($.q === 2) return { ans: Math.abs(ride - 150) < 1e-9 ? 'same' : 'higher' };
      return { ans: (horn - 150) > (150 - out) ? 'larger' : 'equal' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['higher', 'higher in pitch', 'The horn shrinks the denominator. Walking adds to the numerator. The horn wins.'],
        ['same', 'the emitted pitch', 'Rider and horn have no relative motion, so the two shifts cancel.'],
        ['lower', 'lower in pitch', 'Motion toward the source raises the pitch. It does not lower it.'],
        ['larger', 'larger than the drop', 'fv/(v − vs) sits farther above f than fv/(v + vs) sits below it.'],
        ['equal', 'equal to the drop', 'The two denominators, v − vs and v + vs, are not symmetric about v.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Source speed and listener speed enter different places in the Doppler formula.',
      'If both move together at one speed, the factors cancel and the pitch is unchanged.',
    ],
    steps: () => ['The approaching horn is the higher of the two 35 m/s cases. The shifts are unequal. A rider hears the emitted pitch.'],
    sim: { scenario: 'in', setup: (s) => { s.mode = 'head'; s.sense = 1; s.speed = 35; s.f = 150; s.v = 340; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.7, source and observer are not interchangeable', { q: 1 }, { ans: 'higher' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch17.concept-medium',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §17.2',
    title: 'A new temperature',
    topics: ['sound-speed'],
    lab: 'pipe-modes',
    vars: {
      q: choice(
        [1, 'A sound crosses from warm air into colder air. The frequency:'],
        [2, 'In that crossing, the wavelength:'],
        [3, 'Raising the frequency of a horn, in air that stays the same, does what to the sound speed?'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'shorter', 3: 'unchanged' }[$.q] }),
    second: ($) => {
      const warm = soundSpeed(30);
      const cold = soundSpeed(0);
      if ($.q === 1) return { ans: 'same' };
      if ($.q === 2) return { ans: wavelength(cold, 1000) < wavelength(warm, 1000) ? 'shorter' : 'longer' };
      return { ans: soundSpeed(20) === soundSpeed(20) ? 'unchanged' : 'faster' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['same', 'stays the same', 'The source sets the frequency. A new medium does not.'],
        ['shorter', 'gets shorter', 'Colder air is slower. At the same frequency, v = fλ forces a shorter wavelength.'],
        ['longer', 'gets longer', 'The wave slows down. It does not stretch.'],
        ['unchanged', 'nothing', 'v depends on the air, not on how fast the horn vibrates. A higher f shortens λ.'],
        ['faster', 'makes the sound travel faster', 'Frequency is not in v = (331 m/s) √(T/273 K).'],
      ], ($) => $.ans),
    ],
    hints: [
      'The frequency is fixed by the source. The medium fixes the speed.',
      String.raw`$v = f\lambda$ then tells you which of v and λ has to give.`,
    ],
    steps: () => ['Frequency stays. Colder air shortens the wavelength. The horn\'s frequency does not set the speed.'],
    sim: { scenario: 'stopped', setup: (s) => { s.temp = 0; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.2, frequency stays when the medium changes', { q: 1 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch17.concept-boom',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §17.8',
    title: 'The boom and the cone',
    topics: ['shock'],
    lab: 'doppler',
    vars: {
      q: choice(
        [1, 'A sonic boom reaches a listener:'],
        [2, 'A faster jet makes the Mach cone:'],
        [3, 'Compared with the shock itself, the sound inside the cone is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'sweep', 2: 'narrower', 3: 'quieter' }[$.q] }),
    second: ($) => {
      const slow = machAngle(1.5);
      const fast = machAngle(3);
      if ($.q === 1) return { ans: 'sweep' };
      if ($.q === 2) return { ans: fast < slow ? 'narrower' : 'wider' };
      return { ans: 'quieter' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['sweep', 'when the cone sweeps over them', 'The boom is the shock passing the listener. It is not tied to the instant the jet first exceeds Mach 1.'],
        ['mach', 'at the instant the jet passes Mach 1', 'Passing Mach 1 creates the cone. The listener hears it only when that cone arrives.'],
        ['narrower', 'narrower', 'sin θ = 1/M. A larger Mach number is a smaller angle.'],
        ['wider', 'wider', 'More speed does not open the cone. The source outruns its crests more sharply.'],
        ['quieter', 'quieter', 'Along the cone the crests add. Inside it they mostly cancel.'],
        ['louder', 'louder', 'The loud part is the shock, not the interior of the cone.'],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`The half-angle satisfies $\sin\theta = 1/M$.`,
      'The boom is the cone arriving, wherever the listener stands on its path.',
    ],
    steps: () => ['The cone narrows as Mach rises. The boom is that cone sweeping past. Inside the cone it is quieter.'],
    sim: { scenario: 'shock', setup: (s) => { s.kind = 'shock'; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §17.8, the boom is the cone arriving', { q: 1 }, { ans: 'sweep' }),
    ],
  }),
];

/** Ch 16 · Waves. OpenStax University Physics Vol. 1, §§16.1–16.6. */
import { G } from '@flux/subjects/mechanics/constants.js';
import {
  lengthFromPitch, modeFrequency, tensionForSpeed, travelingWave, waveFromConstants, wavePower,
  waveSpeed,
} from '@flux/subjects/mechanics/waves.js';
import { choice, kase, mc, num, problem, range, texNum } from '../kit.js';

const U = { exam: 'u12', ch: '16' };
const LOW_MU = 5.78e-3;
const tight = { abs: 1e-4 };

export default [
  problem({
    ...U,
    id: 'ch16.rope',
    level: 1,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §16.1',
    title: 'A wave on a rope',
    topics: ['wave'],
    lab: 'traveling-wave',
    vars: {
      distance: range(12, 40, 1, 'm'),
      time: range(2, 8, 0.5, 's'),
      f: range(2, 6, 0.5, 'Hz'),
    },
    derive: ($) => {
      const v = $.distance / $.time;
      return { v, T: 1 / $.f, lambda: v / $.f };
    },
    second: ($) => {
      const v = $.distance / $.time;
      const T = 1 / $.f;
      return { v, T, lambda: v * T };
    },
    text: (T) => `A pulse travels ${T.distance} m along a rope in ${T.time} s. The end is shaken at ${T.f} Hz. Find the wave speed, the period, and the wavelength.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'wave speed' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
      num('lambda', ($) => $.lambda, 'm', { label: 'wavelength' }),
    ],
    hints: [
      'The wave speed is how far the pattern travels divided by the time that takes.',
      String.raw`The period is $1/f$. The wavelength then follows from $v = f\lambda$.`,
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.v)}\ \mathrm{m/s}$, so $T = ${texNum($.T)}\ \mathrm{s}$`,
      String.raw`$\lambda = v/f = ${texNum($.lambda)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'rope',
      setup: (s, $) => {
        s.mu = 0.2;
        s.tension = 0.2 * $.v * $.v;
        s.f = $.f;
        s.A = 0.2;
        s.probe = 2.5;
        s.cycles = 0;
      },
      read: (c) => ({ v: c.v, T: c.T, lambda: c.lambda }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.1, "Wave on a String"', {
        distance: 30, time: 6, f: 2,
      }, { v: 5, T: 0.5, lambda: 2.5 }, {
        note: 'The section prints 5.00 m/s, 0.500 s, and 2.50 m. The lab rope uses μ = 0.200 kg/m, so that speed is a tension of 5.00 N.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.snapshot',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §16.1',
    title: 'A crest on a snapshot',
    topics: ['wave'],
    lab: 'traveling-wave',
    vars: {
      lambda: range(4, 16, 1, 'cm', 0.01),
      A: range(2, 10, 1, 'cm', 0.01),
      shift: range(6, 24, 1, 'cm', 0.01),
      dt: range(1.5, 4, 0.5, 's'),
    },
    derive: ($) => {
      const v = $.shift / $.dt;
      const T = $.lambda / v;
      return { v, T, f: 1 / T };
    },
    second: ($) => {
      const v = $.shift / $.dt;
      const f = v / $.lambda;
      return { v, T: 1 / f, f };
    },
    text: (T) => `A traveling wave has wavelength ${T.lambda} cm and amplitude ${T.A} cm. A crest moves ${T.shift} cm in ${T.dt} s. Find the speed, the period, and the frequency.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { ...tight, label: 'wave speed' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
      num('f', ($) => $.f, 'Hz', { label: 'frequency' }),
    ],
    hints: [
      'The crest moves one wavelength in one period. The speed is that shift divided by the time.',
      'Convert centimetres to metres before reporting the speed. Then T = λ/v and f = 1/T.',
    ],
    steps: ($) => [
      String.raw`$v = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$T = \lambda/v = ${texNum($.T)}\ \mathrm{s}$, so $f = ${texNum($.f)}\ \mathrm{Hz}$`,
    ],
    sim: {
      scenario: 'formula',
      setup: (s, $) => {
        s.mu = 1;
        s.tension = $.v * $.v;
        s.f = $.f;
        s.A = $.A;
        s.probe = 0;
        s.cycles = 0;
      },
      read: (c) => ({ v: c.v, T: c.T, f: 1 / c.T }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.1, "Characteristics of a Wave"', {
        lambda: 8, A: 6, shift: 6, dt: 3,
      }, { v: 0.02, T: 4, f: 0.25 }, {
        note: 'The crest moves 6.00 cm in 3.00 s, which is 2.00 cm/s, or 0.0200 m/s. The period is 4.00 s and the frequency is 0.250 Hz. The section states these with a figure. The numbers are in the question.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.function',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §16.2',
    title: 'Read a traveling wave',
    topics: ['wave-math'],
    lab: 'traveling-wave',
    vars: {
      A: range(0.05, 0.3, 0.01, 'm'),
      k: range(2, 10, 0.5, 'rad/m'),
      omega: range(0.5, 8, 0.5, 'rad/s'),
    },
    derive: ($) => waveFromConstants($.k, $.omega),
    second: ($) => ({
      lambda: (2 * Math.PI) / $.k,
      T: (2 * Math.PI) / $.omega,
      v: $.omega / $.k,
    }),
    text: (T) => `A wave on a string is y = ${T.A} sin(${T.k} x − ${T.omega} t), with x and y in metres and t in seconds. Find the wavelength, the period, and the wave speed. Keep the calculator in radians.`,
    parts: [
      num('lambda', ($) => $.lambda, 'm', { label: 'wavelength' }),
      num('T', ($) => $.T, 's', { label: 'period' }),
      num('v', ($) => $.v, 'm/s', { label: 'wave speed' }),
    ],
    hints: [
      String.raw`In $y = A\sin(kx - \omega t)$, the wavelength is $2\pi/k$ and the period is $2\pi/\omega$.`,
      String.raw`The wave speed is $\omega/k$, which is also $f\lambda$.`,
    ],
    steps: ($) => [
      String.raw`$\lambda = 2\pi/k = ${texNum($.lambda)}\ \mathrm{m}$, and $T = 2\pi/\omega = ${texNum($.T)}\ \mathrm{s}$`,
      String.raw`$v = \omega/k = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'formula',
      setup: (s, $) => {
        const v = $.omega / $.k;
        s.mu = 0.2;
        s.tension = 0.2 * v * v;
        s.f = $.omega / (2 * Math.PI);
        s.A = $.A;
        s.probe = Math.min(8, Math.PI / (2 * $.k));
        s.cycles = 0;
      },
      read: (c) => ({ lambda: c.lambda, T: c.T, v: c.v }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.2, "Characteristics of a Traveling Wave on a String"', {
        A: 0.2, k: 6.28, omega: 1.57,
      }, { lambda: 1, T: 4, v: 0.25 }, {
        note: '2π/6.28 is 1.001 m and 2π/1.57 is 4.002 s. The section prints 1.0 m and 4 s. The speed 1.57/6.28 is 0.250 m/s. The prints grade.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.particle',
    level: 2,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §16.2',
    title: 'Particle speed and wave speed',
    topics: ['wave-math'],
    lab: 'traveling-wave',
    vars: {
      A: range(0.05, 0.3, 0.01, 'm'),
      k: range(2, 10, 0.5, 'rad/m'),
      omega: range(1.5, 8, 0.5, 'rad/s'),
    },
    derive: ($) => ({
      vmax: $.A * $.omega,
      v: waveFromConstants($.k, $.omega).v,
    }),
    second: ($) => ({
      vmax: $.A * $.omega,
      v: $.omega / $.k,
    }),
    text: (T) => `The same wave is y = ${T.A} sin(${T.k} x − ${T.omega} t), in metres and seconds. Find the largest transverse speed of a point on the string, and the speed of the wave.`,
    parts: [
      num('vmax', ($) => $.vmax, 'm/s', { label: 'maximum particle speed' }),
      num('v', ($) => $.v, 'm/s', { label: 'wave speed' }),
    ],
    hints: [
      String.raw`Differentiate $y$ in time. The transverse speed has amplitude $A\omega$.`,
      String.raw`The wave speed is $\omega/k$. It is not $A\omega$.`,
    ],
    steps: ($) => [
      String.raw`$v_{\max} = A\omega = ${texNum($.vmax)}\ \mathrm{m/s}$`,
      String.raw`$v = \omega/k = ${texNum($.v)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'formula',
      setup: (s, $) => {
        const v = $.omega / $.k;
        s.mu = 0.2;
        s.tension = 0.2 * v * v;
        s.f = $.omega / (2 * Math.PI);
        s.A = $.A;
        s.probe = Math.min(8, Math.PI / (2 * $.k));
        s.cycles = 0;
      },
      read: (c) => ({ vmax: c.vmax, v: c.v }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.2, the traveling wave, particle speed at a crest', {
        A: 0.2, k: 6.28, omega: 1.57,
      }, { vmax: 0.314, v: 0.25 }, {
        note: 'Aω = 0.314 m/s. The wave speed is 0.250 m/s. The section prints λ, T, and v, and does not print the particle speed. At a crest the transverse speed is zero. The maximum is at the rest line.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.guitar',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §16.3',
    title: 'High E and the same speed on the low E',
    topics: ['wave-speed'],
    lab: 'guitar-string',
    vars: {
      mu: range(1e-4, 2e-3, 1e-5, 'kg/m'),
      F: range(20, 120, 0.2, 'N'),
      mu2: range(2e-3, 0.01, 1e-4, 'kg/m'),
    },
    valid: ($) => $.mu2 > 1.2 * $.mu,
    derive: ($) => {
      const v = waveSpeed($.F, $.mu);
      return { v, F2: tensionForSpeed($.mu2, v) };
    },
    second: ($) => {
      const v = Math.sqrt($.F / $.mu);
      return { v, F2: $.mu2 * v * v };
    },
    text: (T) => `A guitar string has mass per length ${T.mu} kg/m and tension ${T.F} N. Find the wave speed. A second string has mass per length ${T.mu2} kg/m. Find the tension that gives it that same speed.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'wave speed' }),
      num('F2', ($) => $.F2, 'N', { label: 'tension on the heavier string' }),
    ],
    hints: [
      String.raw`The speed on a stretched string is $v = \sqrt{F/\mu}$.`,
      String.raw`The same speed on a heavier string needs $F = \mu v^{2}$. The frequency is not in the speed.`,
    ],
    steps: ($) => [
      String.raw`$v = \sqrt{F/\mu} = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$F_{2} = \mu_{2} v^{2} = ${texNum($.F2)}\ \mathrm{N}$`,
    ],
    sim: {
      scenario: 'high',
      setup: (s, $) => {
        s.tension = $.F;
        s.mu = $.mu;
        s.cycles = 0;
      },
      read: (c) => ({ v: c.v }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.3, "The Wave Speed of a Guitar String"', {
        mu: 3.09e-4, F: 56.4, mu2: 5.78e-3,
      }, { v: 427.23, F2: 1055 }, {
        note: 'The section prints 427.23 m/s and 1055 N. The low E is about 18.7 times the high-E density. The section calls that about 20 times.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.pitch',
    level: 3,
    variety: ['unknown'],
    src: 'OpenStax University Physics Vol. 1 §16.3',
    title: 'Scale length and the tuned low E',
    topics: ['wave-speed'],
    lab: 'guitar-string',
    vars: {
      v: range(200, 500, 1, 'm/s'),
      fHigh: range(200, 400, 1, 'Hz'),
      fLow: range(60, 160, 1, 'Hz'),
    },
    valid: ($) => $.fHigh > 1.5 * $.fLow,
    derive: ($) => {
      const L = lengthFromPitch($.v, $.fHigh);
      return { L, vLow: 2 * L * $.fLow };
    },
    second: ($) => {
      const L = $.v / (2 * $.fHigh);
      return { L, vLow: $.v * ($.fLow / $.fHigh) };
    },
    text: (T) => `An open string has wave speed ${T.v} m/s and fundamental frequency ${T.fHigh} Hz. Both ends are fixed. Find the vibrating length. The same length is then tuned to ${T.fLow} Hz. Find the wave speed on that tuning.`,
    parts: [
      num('L', ($) => $.L, 'm', { label: 'vibrating length' }),
      num('vLow', ($) => $.vLow, 'm/s', { label: 'wave speed when tuned lower' }),
    ],
    hints: [
      String.raw`A string fixed at both ends has $f_{1} = v/(2L)$.`,
      'The length stays. The lower pitch is a slower wave, v = 2 L f.',
    ],
    steps: ($) => [
      String.raw`$L = v/(2f) = ${texNum($.L)}\ \mathrm{m}$`,
      String.raw`$v_{\mathrm{low}} = 2Lf_{\mathrm{low}} = ${texNum($.vLow)}\ \mathrm{m/s}$`,
    ],
    sim: {
      scenario: 'tuned',
      setup: (s, $) => {
        s.length = $.L;
        s.mu = LOW_MU;
        s.tension = LOW_MU * $.vLow * $.vLow;
        s.cycles = 0;
      },
      read: (c) => ({ L: c.length, vLow: c.v }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.3, the high E speed and the open pitches', {
        v: 427.23, fHigh: 329.63, fLow: 82.41,
      }, { L: 0.648, vLow: 106.8 }, {
        note: 'L = 427.23/(2×329.63) = 0.6480 m. At 82.41 Hz that length has wave speed 106.8 m/s. The section prints the speed and the six open pitches. It does not print the scale length or this tuned speed.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.power',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §16.4',
    title: 'Power from a string vibrator',
    topics: ['wave-power'],
    lab: 'traveling-wave',
    vars: {
      m: range(0.04, 0.2, 0.01, 'kg'),
      L: range(1, 3, 0.1, 'm'),
      F: range(20, 120, 1, 'N'),
      f: range(10, 70, 1, 'Hz'),
      A: range(0.02, 0.08, 0.005, 'm'),
    },
    derive: ($) => {
      const mu = $.m / $.L;
      const v = waveSpeed($.F, mu);
      const omega = 2 * Math.PI * $.f;
      return { P: wavePower({ mu, A: $.A, omega, v }) };
    },
    second: ($) => {
      const mu = $.m / $.L;
      const v = Math.sqrt($.F / mu);
      const omega = 2 * Math.PI * $.f;
      return { P: 0.5 * mu * $.A * $.A * omega * omega * v };
    },
    text: (T) => `A string of mass ${T.m} kg and length ${T.L} m is under tension ${T.F} N. A vibrator drives it at ${T.f} Hz with amplitude ${T.A} m. Find the average power carried by the wave.`,
    parts: [
      num('P', ($) => $.P, 'W', { label: 'average power' }),
    ],
    hints: [
      String.raw`The average power is $\tfrac12 \mu A^{2}\omega^{2} v$, with $\mu = m/L$ and $\omega = 2\pi f$.`,
      String.raw`The speed is $\sqrt{F/\mu}$. The amplitude is squared, and so is $\omega$.`,
    ],
    steps: ($) => [
      String.raw`$P = \tfrac12 \mu A^{2}\omega^{2} v = ${texNum($.P)}\ \mathrm{W}$`,
    ],
    sim: {
      scenario: 'rope',
      setup: (s, $) => {
        s.mu = $.m / $.L;
        s.tension = $.F;
        s.f = $.f;
        s.A = $.A;
        s.probe = 0;
        s.cycles = 0;
      },
      read: (c) => ({ P: c.P }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.4, "Power Supplied by a String Vibrator"', {
        m: 0.07, L: 2, F: 90, f: 60, A: 0.04,
      }, { P: 201.59 }, {
        note: 'With ω = 2π×60 the power is 201.8 W. The section uses ω = 376.80 rad/s and prints 201.59 W. The speed it prints is 50.71 m/s. The print grades.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.modes',
    level: 2,
    variety: ['configuration'],
    src: 'OpenStax University Physics Vol. 1 §16.6',
    title: 'Standing waves on a hanging string',
    topics: ['standing'],
    lab: 'standing-wave',
    vars: {
      L: range(1, 3, 0.1, 'm'),
      mu: range(0.004, 0.012, 0.001, 'kg/m'),
      m: range(1, 4, 0.1, 'kg'),
    },
    derive: ($) => {
      const v = waveSpeed($.m * G, $.mu);
      return { v, f1: modeFrequency(1, v, $.L), f3: modeFrequency(3, v, $.L) };
    },
    second: ($) => {
      const v = Math.sqrt(($.m * G) / $.mu);
      return { v, f1: v / (2 * $.L), f3: (3 * v) / (2 * $.L) };
    },
    text: (T) => `A string of length ${T.L} m and mass per length ${T.mu} kg/m is fixed at both ends. A hanging mass of ${T.m} kg sets the tension. Take g = 9.81 m/s². Find the wave speed, the fundamental frequency, and the frequency of the third mode.`,
    parts: [
      num('v', ($) => $.v, 'm/s', { label: 'wave speed' }),
      num('f1', ($) => $.f1, 'Hz', { label: 'fundamental' }),
      num('f3', ($) => $.f3, 'Hz', { label: 'third mode' }),
    ],
    hints: [
      String.raw`The tension is the weight $mg$. Then $v = \sqrt{mg/\mu}$.`,
      String.raw`With both ends fixed, $f_n = nv/(2L)$. The third mode is n = 3, not an odd-only series.`,
    ],
    steps: ($) => [
      String.raw`$v = \sqrt{mg/\mu} = ${texNum($.v)}\ \mathrm{m/s}$`,
      String.raw`$f_1 = ${texNum($.f1)}\ \mathrm{Hz}$, and $f_3 = ${texNum($.f3)}\ \mathrm{Hz}$`,
    ],
    sim: {
      scenario: 'third',
      setup: (s, $) => {
        s.L = $.L;
        s.mu = $.mu;
        s.m = $.m;
        s.n = 3;
        s.A = 0.02;
        s.cycles = 0;
      },
      read: (c) => ({ v: c.v, f1: c.f1, f3: c.f }),
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.6, "Standing Waves on a String"', {
        L: 2, mu: 0.006, m: 2,
      }, { v: 57.15, f1: 14.29, f3: 42.87 }, {
        note: 'With g = 9.81 the speed is 57.18 m/s, and the frequencies are 14.30 Hz, 28.59 Hz, and 42.89 Hz. The section uses g = 9.80 and prints 57.15 m/s, 14.29 Hz, and 42.87 Hz. The prints grade. The wavelengths 4.00 m, 2.00 m, and 1.333 m do not depend on g.',
      }),
    ],
  }),

  problem({
    ...U,
    id: 'ch16.superpose',
    level: 3,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §16.5',
    title: 'Two waves on one string',
    topics: ['interference'],
    lab: 'traveling-wave',
    vars: {
      A: range(0.05, 0.3, 0.01, 'm'),
      k: range(1, 6, 0.5, 'rad/m'),
      x: range(0.1, 1.2, 0.1, 'm'),
      omega: range(1, 8, 0.5, 'rad/s'),
      t: range(0, 2, 0.1, 's'),
    },
    derive: ($) => ({
      y: 2 * $.A * Math.sin($.k * $.x) * Math.cos($.omega * $.t),
    }),
    second: ($) => {
      const right = travelingWave({ A: $.A, k: $.k, omega: $.omega, x: $.x, t: $.t }).y;
      const left = travelingWave({ A: $.A, k: $.k, omega: -$.omega, x: $.x, t: $.t }).y;
      return { y: right + left };
    },
    text: (T) => `Two waves of equal amplitude travel opposite ways on one string: y₁ = ${T.A} sin(${T.k} x − ${T.omega} t) and y₂ = ${T.A} sin(${T.k} x + ${T.omega} t), in metres and seconds. Find y at x = ${T.x} m and t = ${T.t} s.`,
    parts: [
      num('y', ($) => $.y, 'm', { abs: 1e-4, label: 'resultant height' }),
    ],
    hints: [
      String.raw`The sum of $\sin(kx-\omega t)$ and $\sin(kx+\omega t)$ is $2\sin(kx)\cos(\omega t)$.`,
      'Each wave still moves at ω/k. The sum is a standing pattern, not a faster wave.',
    ],
    steps: ($) => [
      String.raw`$y = 2A\sin(kx)\cos(\omega t) = ${texNum($.y)}\ \mathrm{m}$`,
    ],
    sim: {
      scenario: 'formula',
      setup: (s, $) => {
        const v = $.omega / $.k;
        s.mu = 0.2;
        s.tension = 0.2 * v * v;
        s.f = $.omega / (2 * Math.PI);
        s.A = $.A;
        s.probe = Math.min(8, $.x);
        s.cycles = 0;
      },
    },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.5, "Interference of Waves on a String"', {
        A: 0.2, k: Math.PI, x: 0.5, omega: Math.PI, t: 0,
      }, { y: 0.4 }, {
        note: 'At x = 0.500 m and t = 0 the sum is 0.400 m. The section writes the sum and does not print this sample. Each wave still travels at ω/k.',
      }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch16.concept-speed',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §16.3',
    title: 'What changes the wave speed',
    topics: ['wave-speed'],
    lab: 'traveling-wave',
    vars: {
      q: choice(
        [1, 'The end is shaken at twice the frequency, at the same tension. The wave speed:'],
        [2, 'The amplitude is doubled, and the rope is left alone. The wave speed:'],
        [3, 'The tension is made four times as large, on the same rope. The wave speed:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'same', 2: 'same', 3: 'doubles' }[$.q] }),
    second: ($) => {
      const v = waveSpeed(5, 0.2);
      if ($.q === 1 || $.q === 2) return { ans: v === waveSpeed(5, 0.2) ? 'same' : 'doubles' };
      return { ans: Math.abs(waveSpeed(20, 0.2) / v - 2) < 1e-9 ? 'doubles' : 'same' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['same', 'stays the same', 'v = √(F/μ). Frequency and amplitude are not in it. They change λ or the height, not the speed.'],
        ['doubles', 'doubles', 'Four times the tension is twice the speed, because the tension sits under a square root.'],
        ['halves', 'halves', 'More tension does not slow the wave. A higher frequency does not slow it either.'],
        ['four', 'becomes four times as large', 'The tension is squared only if you forget the root. v follows √F, so four times F is twice v.'],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`Write $v = \sqrt{F/\mu}$ and see which change is in it.`,
      String.raw`Then $v = f\lambda$. If f changes and v does not, λ changes.`,
    ],
    steps: () => ['The speed is a property of the rope. Frequency and amplitude stay out of it. Four times the tension doubles the speed.'],
    sim: { scenario: 'rope', setup: (s) => { s.tension = 5; s.mu = 0.2; s.f = 2; s.A = 0.2; s.cycles = 0; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.3, frequency is not in the wave speed', { q: 1 }, { ans: 'same' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch16.concept-particle',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §16.1',
    title: 'The point and the pattern',
    topics: ['wave'],
    lab: 'traveling-wave',
    vars: {
      q: choice(
        [1, 'As the wave passes, a marked point of the rope moves:'],
        [2, 'The largest transverse speed of that point is:'],
        [3, 'At a crest, the transverse velocity of the point is:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'across', 2: 'aomega', 3: 'zero' }[$.q] }),
    second: ($) => {
      const rest = travelingWave({ A: 0.2, k: 6.28, omega: 1.57, x: 0, t: 0 });
      const crest = travelingWave({ A: 0.2, k: 6.28, omega: 1.57, x: Math.PI / (2 * 6.28), t: 0 });
      if ($.q === 1) return { ans: Math.abs(rest.vy) > 1e-6 ? 'across' : 'along' };
      if ($.q === 2) return { ans: Math.abs(0.2 * 1.57 - 0.25) > 1e-6 ? 'aomega' : 'wavespeed' };
      return { ans: Math.abs(crest.vy) < 1e-9 ? 'zero' : 'aomega' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['across', 'across the rope, up and down', 'The disturbance is transverse. The point oscillates. The pattern is what travels along the rope.'],
        ['along', 'along the rope, with the wave', 'The point does not travel with the pattern. Its motion is across the rope.'],
        ['aomega', 'Aω, not the wave speed', 'The transverse speed has amplitude Aω. The wave speed is ω/k. They are different quantities.'],
        ['wavespeed', 'the wave speed', 'The wave speed is how fast the pattern moves. A point of the rope does not move at that speed.'],
        ['zero', 'zero', 'At a crest the sine is at its peak, so its time derivative is zero. The point is turning around.'],
      ], ($) => $.ans),
    ],
    hints: [
      'Ask which way a bit of rope can move if the rope itself stays in place.',
      String.raw`For $y = A\sin(kx-\omega t)$, the transverse velocity is $-A\omega\cos(kx-\omega t)$.`,
    ],
    steps: () => ['The point moves across the rope. Its fastest speed is Aω. At a crest that speed is zero.'],
    sim: { scenario: 'formula', setup: (s) => { s.tension = 0.0125; s.mu = 0.2; s.f = 0.25; s.A = 0.2; s.probe = Math.PI / (2 * 6.28); s.cycles = 0; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.1, a point of the medium does not travel with the wave', { q: 1 }, { ans: 'across' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch16.concept-end',
    level: 1,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §16.6',
    title: 'A fixed end',
    topics: ['standing'],
    lab: 'standing-wave',
    vars: {
      q: choice(
        [1, 'At a fixed end of the string, the standing wave has:'],
        [2, 'A pulse reflecting from a fixed end comes back:'],
        [3, 'The standing frequencies of a string fixed at both ends are:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'node', 2: 'inverted', 3: 'all' }[$.q] }),
    second: ($) => {
      if ($.q === 1) return { ans: Math.abs(Math.sin(Math.PI)) < 1e-12 ? 'node' : 'antinode' };
      if ($.q === 2) {
        const incident = Math.sin(0.4);
        return { ans: Math.abs(incident + (-incident)) < 1e-12 ? 'inverted' : 'upright' };
      }
      const ratio = modeFrequency(2, 10, 2) / modeFrequency(1, 10, 2);
      return { ans: Math.abs(ratio - 2) < 1e-12 ? 'all' : 'odd' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['node', 'a node', 'The end does not move, so the displacement there is zero. That is a node.'],
        ['antinode', 'an antinode', 'An antinode is the largest swing. A fixed end cannot swing.'],
        ['inverted', 'inverted', 'The reflected pulse has the opposite sign, so the end stays put. A free end reflects upright.'],
        ['upright', 'upright, with the same sign', 'An upright reflection is the free-end case. A fixed end flips the pulse.'],
        ['all', 'every whole multiple of the fundamental', 'f_n = n v/(2L) for n = 1, 2, 3, and so on. Odd-only harmonics belong to a tube closed at one end.'],
        ['odd', 'only the odd multiples', 'That is a closed tube. A string fixed at both ends has the even multiples too.'],
      ], ($) => $.ans),
    ],
    hints: [
      'The fixed end cannot move. Whatever reflects has to cancel the incident wave there.',
      String.raw`Count n in $f_n = nv/(2L)$. n is every positive integer.`,
    ],
    steps: () => ['A fixed end is a node, and the reflection inverts. Every whole number n is a mode.'],
    sim: { scenario: 'book', setup: (s) => { s.n = 1; s.cycles = 0; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.6, a node at each fixed end', { q: 1 }, { ans: 'node' }),
    ],
  }),

  problem({
    ...U,
    kind: 'conceptual',
    id: 'ch16.concept-power',
    level: 2,
    variety: ['representation'],
    src: 'OpenStax University Physics Vol. 1 §16.4',
    title: 'What multiplies the power',
    topics: ['wave-power'],
    lab: 'traveling-wave',
    vars: {
      q: choice(
        [1, 'The amplitude is doubled. The tension, the rope, and the frequency stay. The average power:'],
        [2, 'The frequency is doubled. The amplitude and the wave speed stay. The average power:'],
        [3, 'Two equal waves travel opposite ways on one string. The speed of each wave:'],
      ),
    },
    derive: ($) => ({ ans: { 1: 'times4', 2: 'times4', 3: 'samespeed' }[$.q] }),
    second: ($) => {
      const base = { mu: 0.035, A: 0.04, omega: 100, v: 10 };
      const p0 = wavePower(base);
      if ($.q === 1) return { ans: Math.abs(wavePower({ ...base, A: 0.08 }) / p0 - 4) < 1e-9 ? 'times4' : 'times2' };
      if ($.q === 2) return { ans: Math.abs(wavePower({ ...base, omega: 200 }) / p0 - 4) < 1e-9 ? 'times4' : 'same' };
      return { ans: Math.abs(waveFromConstants(2, 20).v - 10) < 1e-9 ? 'samespeed' : 'faster' };
    },
    text: (T) => T.q,
    parts: [
      mc('ans', [
        ['times4', 'is multiplied by 4', 'The average power follows A² and ω². Doubling either one, with the speed held fixed, multiplies the power by four.'],
        ['times2', 'is multiplied by 2', 'That would be a single factor of A or of ω. Both are squared in the power.'],
        ['same', 'stays the same', 'Amplitude and frequency are both in the power. Leaving them out leaves the answer unchanged only if they did not change.'],
        ['samespeed', 'is still ω/k', 'Superposition adds the displacements. It does not change the speed of either wave. The sum stands in place when the two speeds match.'],
        ['faster', 'becomes twice the wave speed', 'Adding a wave that travels the other way does not speed the first one up.'],
      ], ($) => $.ans),
    ],
    hints: [
      String.raw`The average power is $\tfrac12\mu A^{2}\omega^{2} v$.`,
      'Two waves on one string still each travel at ω/k. The sum can stand still as a pattern.',
    ],
    steps: () => ['Doubling A or ω multiplies the average power by four. Opposite waves still travel at ω/k.'],
    sim: { scenario: 'rope', setup: (s) => { s.tension = 5; s.mu = 0.2; s.f = 2; s.A = 0.2; s.cycles = 0; } },
    cases: [
      kase('OpenStax University Physics Vol. 1 §16.4, power follows the square of the amplitude', { q: 1 }, { ans: 'times4' }),
    ],
  }),
];

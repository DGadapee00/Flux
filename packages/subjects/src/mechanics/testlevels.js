/**
 * Random vibration test levels: a spectrum given by breakpoints, the test factors that turn a flight
 * limit level into a qualification, protoflight or acceptance test, and what each test does to a
 * bracket (randomvib.js). Our own model of NASA GSFC-STD-7000B (GEVS) Tables 2.2-2, 2.4-3 and 2.4-4.
 *
 * Between breakpoints a test spectrum is a straight line on log-log axes, W = W₁ (f/f₁)ⁿ with
 * n = ln(W₂/W₁)/ln(f₂/f₁): +6 dB/oct is n = 2, −3 dB/oct is n = −1. The overall level is
 *   g_rms² = Σ ∫ W df = Σ W₁ f₁ [(f₂/f₁)^{n+1} − 1]/(n + 1)   (W₁ f₁ ln(f₂/f₁) when n = −1).
 * A test 3 dB above the limit level doubles W everywhere, so g_rms grows by √2.
 *
 * A bracket with natural frequency f_n and amplification Q sees, by Miles' equation, the spectrum's
 * level at f_n: g_rms = √((π/2) f_n Q W(f_n)). With the S–N exponent b, each minute of shaking does
 * damage in proportion to g_rms^b, so a test 3 dB up does 2^{b/2} times the damage a minute.
 *
 * The second method integrates the spectrum numerically, by Simpson's rule in ln f over each
 * segment, and the response by integrating |T(f)|² W(f) over the whole band.
 */
import { BRACKET, trans2, vibChecked } from './randomvib.js';

/** GEVS spectra at flight limit (acceptance) level, [Hz, g²/Hz]. */
export const SPECTRA = Object.freeze({
  // Table 2.4-3, components of 22.7 kg or less: acceptance 10.0 g rms, qualification 14.1.
  generalized: [[20, 0.013], [50, 0.08], [800, 0.08], [2000, 0.013]],
  // Table 2.4-4, the minimum workmanship level: 6.8 g rms.
  workmanship: [[20, 0.01], [80, 0.04], [500, 0.04], [2000, 0.01]],
});

/**
 * GEVS Table 2.2-2, random vibration: the factor on the limit spectrum (+3 dB doubles it, as the
 * Table 2.4-3 levels do) and the minutes per axis.
 */
export const PROGRAMS = Object.freeze({
  prototype: { name: 'Prototype qualification', factor: 2, dB: 3, minutes: 2 },
  protoflight: { name: 'Protoflight', factor: 2, dB: 3, minutes: 1 },
  acceptance: { name: 'Acceptance', factor: 1, dB: 0, minutes: 1 },
});

const slope = ([f1, w1], [f2, w2]) => Math.log(w2 / w1) / Math.log(f2 / f1);

/** The spectrum's level at f (g²/Hz), scaled by a factor; 0 outside its band. */
export function level(points, f, scale = 1) {
  if (f < points[0][0] || f > points[points.length - 1][0]) return 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [f1, w1] = points[i];
    const f2 = points[i + 1][0];
    if (f <= f2) return scale * w1 * (f / f1) ** slope(points[i], points[i + 1]);
  }
  return 0;
}

/** Closed form: the overall g_rms of a breakpoint spectrum. */
export function grmsClosed(points, scale = 1) {
  let s = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [f1, w1] = points[i];
    const f2 = points[i + 1][0];
    const n = slope(points[i], points[i + 1]);
    s += Math.abs(n + 1) < 1e-12 ? w1 * f1 * Math.log(f2 / f1) : (w1 * f1 * ((f2 / f1) ** (n + 1) - 1)) / (n + 1);
  }
  return Math.sqrt(scale * s);
}

/** Second method: Simpson's rule in ln f over each segment. */
export function grmsNumeric(points, scale = 1, m = 200) {
  let s = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = Math.log(points[i][0]);
    const b = Math.log(points[i + 1][0]);
    const h = (b - a) / m;
    let part = 0;
    for (let k = 0; k <= m; k++) {
      const f = Math.exp(a + k * h);
      const w = k === 0 || k === m ? 1 : k % 2 ? 4 : 2;
      part += w * level(points, f, scale) * f;
    }
    s += (part * h) / 3;
  }
  return Math.sqrt(s);
}

/** The response's mean square integrated over the whole band: ∫ |T|² W df, Simpson in ln f. */
export function responseNumeric(points, scale, fn, Q, m = 4000) {
  const a = Math.log(points[0][0]);
  const b = Math.log(points[points.length - 1][0]);
  const h = (b - a) / m;
  let s = 0;
  for (let k = 0; k <= m; k++) {
    const f = Math.exp(a + k * h);
    const w = k === 0 || k === m ? 1 : k % 2 ? 4 : 2;
    s += w * trans2(f / fn, Q) * level(points, f, scale) * f;
  }
  return Math.sqrt((s * h) / 3);
}

/**
 * One test program on one bracket. `flightMin` is the minutes the flight unit spends at the limit
 * level in launch. Returns the test's level, the bracket's response and fatigue life, and the share
 * of its life the test and the flight use.
 */
export function testProgram({ spectrum, program, fn, Q, flightMin }) {
  const pts = SPECTRA[spectrum];
  const p = PROGRAMS[program];
  const scale = p.factor;
  const W = level(pts, fn, scale);
  const test = vibChecked({ fn, Q, W });
  const limit = vibChecked({ fn, Q, W: level(pts, fn) });
  const testUse = p.minutes / test.lifeMin;
  const flightUse = flightMin / limit.lifeMin;
  // The prototype is a separate unit; the flight unit gets an acceptance test. A protoflight or an
  // acceptance test is run on the unit that flies.
  const flightTestUse = program === 'prototype' ? 1 / limit.lifeMin : testUse;
  return {
    scale,
    W,
    grms: grmsClosed(pts, scale),
    grmsNum: grmsNumeric(pts, scale),
    response: test.grms,
    responseFull: responseNumeric(pts, scale, fn, Q),
    lifeMin: test.lifeMin,
    testUse,
    flightUse,
    flightLeft: 1 - flightTestUse - flightUse,
    perMinute: scale ** (BRACKET.b / 2),
    survives: testUse < 1,
    vibGap: test.gap,
  };
}

/** Both methods on the overall level, with the bracket model's own check. */
export function testChecked(state) {
  const r = testProgram(state);
  const gap = Math.max(Math.abs(r.grmsNum - r.grms) / r.grms, r.vibGap);
  return { ...r, gap };
}

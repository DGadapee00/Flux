/**
 * Unit 17 bank: identification and tracking. Original problems, with staged hints and named traps
 * (../coaching/u17.js). Numeric templates are checked by a second route (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { cwPosition } from '@flux/subjects/mechanics/separation.js';
import { MU_EARTH, R_EARTH } from '@flux/subjects/mechanics/kepler.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));
const meanMotion = (hkm) => Math.sqrt((MU_EARTH * 1e9) / ((R_EARTH + hkm) * 1e3) ** 3);

/** Along-track separation (km) after whole orbits; `how` names the traps. */
export function drift($, how = 'right') {
  const dv = Number($.dv);
  const n = meanMotion(Number($.h));
  const t = Number($.k) * ((2 * Math.PI) / n);
  if (how === 'once') return (dv * t) / 1e3;
  if (how === 'twice') return (2 * dv * t) / 1e3;
  return (3 * dv * t) / 1e3;
}

/** The furthest along the track a radial push reaches (km); `how` names the traps. */
export function bound($, how = 'right') {
  const dv = Number($.dv);
  const n = meanMotion(Number($.h));
  if (how === 'two') return (2 * dv) / n / 1e3;
  if (how === 'one') return dv / n / 1e3;
  return (4 * dv) / n / 1e3;
}

/** Ways to match N names to N tracks; `how` names the traps. */
export function matchings($, how = 'right') {
  const N = Number($.N);
  if (how === 'square') return N * N;
  if (how === 'power') return 2 ** N;
  let f = 1;
  for (let k = 2; k <= N; k++) f *= k;
  return f;
}

const AID = {
  dead: { text: 'A team fears its craft may fail at deployment and wants it findable anyway, from the first orbit.', answer: 'beacon' },
  passive: { text: 'A craft needs a way to be identified that uses no power at all, by a ground laser station.', answer: 'ccr' },
  radar: { text: 'A craft should answer a tracking radar with its own identifying code, without a battery.', answer: 'vanatta' },
};

const CAT = {
  tle: { text: 'Why are two-line elements not enough for collision screening?', answer: 'cov' },
  often: { text: 'How often should a craft with a perigee below 500 km send its predicted ephemeris for screening?', answer: 'thrice' },
  until: { text: 'Until when must a craft stay trackable?', answer: 'reentry' },
};

export default [
  problem({
    id: 'u17.1.drift',
    title: 'How far apart after a few orbits',
    exam: 'u17',
    ch: '17',
    lab: 'separation',
    src: 'Flux, written for the Deployment separation lab',
    topics: ['confusion'],
    principles: ['confusion'],
    vars: {
      dv: choice(['0.5', '0.5 m/s'], ['1', '1 m/s'], ['1.5', '1.5 m/s']),
      h: choice(['400', '400 km'], ['550', '550 km']),
      k: choice(['1', 'one orbit'], ['3', 'three orbits'], ['10', 'ten orbits']),
    },
    variety: ['push', 'altitude', 'time'],
    text: (T) => `A deployer at ${T.h} pushes a craft ${T.dv} forward along the track. How far apart are they along the track after ${T.k}, in km? μ = 398,600 km³/s², Earth's radius 6378 km.`,
    parts: [num('y', ($) => drift($), 'km', { label: '|y|' })],
    level: 2,
    hints: ['After whole orbits the once-an-orbit swing is back to zero.', 'What is left is the steady drift, 3ẏ₀ times the time.'],
    steps: ($) => [String.raw`$T = 2\pi/n = ${fmt((2 * Math.PI) / meanMotion(Number($.h)) / 60)}\ \text{min}$`, String.raw`$|y| = 3 \times ${$.dv} \times ${$.k}\,T = ${fmt(drift($))}\ \text{km}$`],
    second: ($) => {
      const n = meanMotion(Number($.h));
      const t = Number($.k) * ((2 * Math.PI) / n);
      return { y: Math.abs(cwPosition({ hkm: Number($.h), dv: Number($.dv), dir: 'along' }, t)[1]) / 1e3 };
    },
    cases: [kase('1 m/s at 400 km, one orbit', { dv: '1', h: '400', k: '1' }, { y: 16.6 })],
  }),

  problem({
    id: 'u17.2.bound',
    title: 'A radial push',
    exam: 'u17',
    ch: '17',
    lab: 'separation',
    src: 'Flux, written for the Deployment separation lab',
    topics: ['confusion'],
    principles: ['confusion'],
    vars: { dv: choice(['0.5', '0.5 m/s'], ['1', '1 m/s'], ['2', '2 m/s']), h: choice(['400', '400 km'], ['550', '550 km'], ['700', '700 km']) },
    variety: ['push', 'altitude'],
    text: (T) => `A deployer at ${T.h} pushes a craft ${T.dv} radially outward. How far along the track does the craft ever get from the deployer, in km? μ = 398,600 km³/s², Earth's radius 6378 km.`,
    parts: [num('b', ($) => bound($), 'km', { label: '|y| max' })],
    level: 2,
    hints: ['With only a radial push, y = (2ẋ₀/n)(cos nt − 1).', 'Its largest size is when cos nt = −1.'],
    steps: ($) => [String.raw`$|y|_\text{max} = \frac{4\dot x_0}{n} = \frac{4 \times ${$.dv}}{${fmt(meanMotion(Number($.h)), 4)}} = ${fmt(bound($))}\ \text{km}$`],
    second: ($) => {
      // Scan one orbit of the solution for the largest along-track distance.
      const n = meanMotion(Number($.h));
      let best = 0;
      for (let i = 0; i <= 20000; i++) {
        const t = ((2 * Math.PI) / n) * (i / 20000);
        best = Math.max(best, Math.abs(cwPosition({ hkm: Number($.h), dv: Number($.dv), dir: 'radial' }, t)[1]));
      }
      return { b: best / 1e3 };
    },
    cases: [kase('1 m/s at 550 km', { dv: '1', h: '550' }, { b: 3.68 })],
  }),

  problem({
    id: 'u17.3.match',
    title: 'Which track is whose?',
    exam: 'u17',
    ch: '17',
    src: 'Flux, after NASA’s small spacecraft report, 12.1',
    topics: ['confusion'],
    principles: ['confusion'],
    vars: { N: choice(['5', 'five'], ['6', 'six'], ['7', 'seven'], ['8', 'eight']) },
    variety: ['batch size'],
    text: (T) => `A launch releases ${T.N} craft that the radar cannot yet tell apart. In how many ways can their names be matched to the tracks?`,
    parts: [num('m', ($) => matchings($), '', { label: 'ways' })],
    level: 1,
    hints: ['The first name can go to any of the N tracks, the next to any of the rest.', 'N × (N − 1) × … × 1 = N!.'],
    steps: ($) => [String.raw`$${$.N}! = ${matchings($)}$`],
    second: ($) => {
      // Count the matchings by building them, track by track.
      const N = Number($.N);
      const count = (used, k) => (k === N ? 1 : Array.from({ length: N }, (_, j) => j).filter((j) => !(used & (1 << j))).reduce((s, j) => s + count(used | (1 << j), k + 1), 0));
      return { m: count(0, 0) };
    },
    cases: [kase('five craft', { N: '5' }, { m: 120 })],
  }),

  problem({
    id: 'u17.4.aid',
    title: 'Which tracking aid?',
    exam: 'u17',
    ch: '17',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 12.3 to 12.5',
    topics: ['aids'],
    principles: ['aids'],
    vars: { q: choice(['dead', 'dead'], ['passive', 'passive'], ['radar', 'radar']) },
    variety: ['which need'],
    text: (T, $) => `${AID[$.q].text} Which tracking aid fits?`,
    parts: [
      pick('a', 'aid', [
        ['beacon', 'A GNSS beacon with its own battery and radio', 'It reports position and identity even if the craft itself fails.'],
        ['ccr', 'Corner cube reflectors', 'Passive; a ground laser sees their return, and their number can identify the craft.'],
        ['vanatta', 'A Van Atta array', 'Returns the radar’s own signal with a code, with no power of its own.'],
        ['paint', 'High-albedo paint', 'Makes the craft easier to see, but does not say which craft it is.'],
      ], ($) => AID[$.q].answer),
    ],
    level: 1,
    hints: ['Does the aid need power?', 'Who interrogates it: a radar, a laser, or nobody?'],
    steps: ($) => [{ beacon: 'A GNSS beacon.', ccr: 'Corner cube reflectors.', vanatta: 'A Van Atta array.' }[AID[$.q].answer]],
    second: ($) => ({ a: { dead: 'beacon', passive: 'ccr', radar: 'vanatta' }[$.q] }),
    cases: [kase('a failed craft', { q: 'dead' }, { a: 'beacon' })],
  }),

  problem({
    id: 'u17.5.catalog',
    title: 'Ephemerides and screening',
    exam: 'u17',
    ch: '17',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 12.1 and 12.2',
    topics: ['catalog'],
    principles: ['catalog'],
    vars: { q: choice(['tle', 'tle'], ['often', 'often'], ['until', 'until']) },
    variety: ['which question'],
    text: (T, $) => CAT[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['cov', 'They are not accurate enough and carry no covariance', 'A probability of collision needs the prediction’s uncertainty.'],
        ['thrice', 'Three times a day', 'Low orbits change fastest under drag; above 500 km daily is the minimum.'],
        ['reentry', 'Until it re-enters, not only while it operates', 'A dead craft is still a hazard to its neighbours.'],
        ['weekly', 'Once a week', 'Far too seldom for a low orbit.'],
      ], ($) => CAT[$.q].answer),
    ],
    level: 1,
    hints: ['What does a probability of collision need?', 'How fast does a low orbit change?'],
    steps: ($) => [{ cov: 'No covariance.', thrice: 'Three times a day.', reentry: 'Until re-entry.' }[CAT[$.q].answer]],
    second: ($) => ({ a: { tle: 'cov', often: 'thrice', until: 'reentry' }[$.q] }),
    cases: [kase('two-line elements', { q: 'tle' }, { a: 'cov' })],
  }),
];

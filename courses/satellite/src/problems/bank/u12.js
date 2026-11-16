/**
 * Unit 12 bank: ground systems and operations. Original problems, with staged hints and named traps
 * (../coaching/u12.js). The circle of view is checked against the Station coverage lab (`sim`); the
 * rest against a second rule (`second`).
 */
import { choice, kase, num, problem } from '../kit.js';
import { capAngle, shareClosed } from '@flux/subjects/mechanics/coverage.js';
import { EARTH } from '@flux/subjects/mechanics/passes.js';
import { STATIONS } from '../../labs/coverage.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));
const DEG = Math.PI / 180;

/** The circle of view's half-angle in degrees; `how` names the traps. */
export function capDeg($, how = 'right') {
  const h = Number($.h);
  const e = Number($.e) * DEG;
  const x = EARTH.R / (EARTH.R + h);
  if (how === 'noMinus') return Math.acos(x * Math.cos(e)) / DEG;
  if (how === 'noCos') return (Math.acos(x) - e) / DEG;
  return capAngle(h, Number($.e)) / DEG;
}

/** The highest latitude that ever sees the orbit; `how` names the traps. */
export function reachDeg($, how = 'right') {
  const i = Number($.i);
  const lam = capAngle(500, 10) / DEG;
  if (how === 'incl') return i;
  if (how === 'minus') return i - lam;
  return Math.min(90, i + lam);
}

const SERVICE = {
  relay: { text: 'hear the craft in the first hours after deployment, before any ground station has found it', answer: 'relay' },
  rent: { text: 'download data on a pay-per-pass basis without building or staffing antennas', answer: 'gsaas' },
  deep: { text: 'talk to a craft 5 million km from Earth', answer: 'dsn' },
  polar: { text: 'see a polar-orbiting craft on nearly every orbit', answer: 'polar' },
};

const OPS = {
  risky: { text: 'A new command plan turns the craft and powers a payload, and the simulator’s result is uncertain. What happens before upload?', answer: 'model' },
  who: { text: 'The science team wants a new observation tomorrow. Who sends the commands to the craft?', answer: 'moc' },
  compat: { text: 'Before launch, what is the most important test of the communication system?', answer: 'e2e' },
};

export default [
  problem({
    id: 'u12.1.cap',
    title: 'A station’s circle of view',
    exam: 'u12',
    ch: '12',
    lab: 'coverage',
    src: 'Flux, written for the Station coverage lab',
    topics: ['coverage'],
    principles: ['coverage'],
    vars: { h: choice(['400', '400 km'], ['500', '500 km'], ['800', '800 km']), e: choice(['5', '5°'], ['10', '10°'], ['20', '20°']) },
    variety: ['altitude and mask'],
    text: (T) => `A ground station uses a craft at ${T.h} only above ${T.e} of elevation. Within what angle of the station, measured at Earth's centre, must the craft's ground track pass, in degrees? Earth's radius ${EARTH.R} km.`,
    parts: [num('l', ($) => capDeg($), '°', { label: 'λ' })],
    level: 2,
    hints: ['Draw the triangle of Earth’s centre, the station and the craft at the edge of view.', 'λ = arccos((R/(R + h)) cos ε) − ε.'],
    steps: ($) => [String.raw`$\lambda = \arccos(${fmt(EARTH.R / (EARTH.R + Number($.h)), 4)}\cos ${$.e}^\circ) - ${$.e}^\circ = ${fmt(capDeg($))}^\circ$`],
    sim: { scenario: 'polar', setup(s, $) { Object.assign(s, { hkm: Number($.h), eps: Number($.e) }); }, read: (c) => ({ l: (c.lam * 180) / Math.PI }) },
    cases: [kase('500 km above 10°', { h: '500', e: '10' }, { l: 14.06 })],
  }),

  problem({
    id: 'u12.2.reach',
    title: 'How far north it is seen',
    exam: 'u12',
    ch: '12',
    lab: 'coverage',
    src: 'Flux, written for the Station coverage lab',
    topics: ['coverage'],
    principles: ['coverage'],
    vars: { i: choice(['28.5', '28.5°'], ['45', '45°'], ['51.6', '51.6°'], ['65', '65°']) },
    variety: ['inclination'],
    text: (T) => `A craft at 500 km flies an orbit inclined ${T.i}. Ground stations use it above 10°, which gives a circle of view of 14.1° around each station. What is the highest latitude at which a station ever sees it, in degrees?`,
    parts: [num('r', ($) => reachDeg($), '°', { label: 'latitude' })],
    level: 1,
    hints: ['The ground track reaches latitude i and no further.', 'A station sees the craft when the track passes within λ of it.'],
    steps: ($) => [String.raw`$i + \lambda = ${$.i} + 14.1 = ${fmt(reachDeg($))}^\circ$`],
    second: ($) => {
      // Bisect on latitude for where the long-run share in view first reaches zero.
      const orbit = { hkm: 500, eps: 10, incl: Number($.i) };
      let lo = 0;
      let hi = 90;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        if (shareClosed(orbit, mid, 4000) > 1e-9) lo = mid;
        else hi = mid;
      }
      return { r: (lo + hi) / 2 };
    },
    cases: [kase('51.6°', { i: '51.6' }, { r: 65.66 })],
  }),

  problem({
    id: 'u12.3.best',
    title: 'Which station sees it most?',
    exam: 'u12',
    ch: '12',
    kind: 'conceptual',
    lab: 'coverage',
    src: 'Flux, written for the Station coverage lab',
    topics: ['coverage'],
    principles: ['coverage'],
    vars: { incl: choice(['97.4', 'a sun-synchronous orbit, inclined 97.4°'], ['20', 'an orbit inclined 20°']) },
    variety: ['inclination'],
    text: (T) => `A craft at 500 km flies ${T.incl}. Which of these stations sees it for the most minutes a day: Utqiagvik at 71°N, Mojave at 35°N, or Mwulire at 2°S?`,
    parts: [
      pick('s', 'station', [
        ['utq', 'Utqiagvik, 71°N', 'A polar orbit crosses high latitudes on every orbit, where its track crowds together.'],
        ['moj', 'Mojave, 35°N', 'Mid-latitude stations see both kinds of orbit, but neither most.'],
        ['mwu', 'Mwulire, 2°S', 'A low-inclination orbit stays near the equator, so an equatorial station sees it most.'],
      ], ($) => ($.incl === '97.4' ? 'utq' : 'mwu')),
    ],
    level: 2,
    hints: ['Where does the ground track spend its time?', 'It crowds toward latitude ±i, and never goes beyond it.'],
    steps: ($) => [$.incl === '97.4' ? 'Polar orbit: the Arctic station.' : 'Low orbit: the equatorial station; Utqiagvik never sees it.'],
    second: ($) => {
      const o = { hkm: 500, eps: 10, incl: Number($.incl) };
      const best = ['utq', 'moj', 'mwu'].map((k) => [k, shareClosed(o, STATIONS[k].lat, 4000)]).sort((a, b) => b[1] - a[1])[0][0];
      return { s: best };
    },
    cases: [kase('sun-synchronous', { incl: '97.4' }, { s: 'utq' })],
  }),

  problem({
    id: 'u12.4.service',
    title: 'Which service?',
    exam: 'u12',
    ch: '12',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 11.4',
    topics: ['networks'],
    principles: ['networks'],
    vars: { q: choice(['relay', 'relay'], ['rent', 'rent'], ['deep', 'deep'], ['polar', 'polar']) },
    variety: ['which need'],
    text: (T, $) => `A mission needs to ${SERVICE[$.q].text}. Which fits best?`,
    parts: [
      pick('a', 'service', [
        ['relay', 'a relay satellite network', 'A relay sees a low craft for most of its orbit, with no ground station in view.'],
        ['gsaas', 'ground station as a service', 'Commercial networks rent passes and deliver the data, with no antennas to build.'],
        ['dsn', 'the Deep Space Network', 'NASA’s Near Space Network serves craft within 2 million km; the DSN serves those beyond.'],
        ['polar', 'a station near a pole', 'A polar orbit crosses high latitudes every orbit.'],
      ], ($) => SERVICE[$.q].answer),
    ],
    level: 1,
    hints: ['Is the need about when, where, how far, or how it is paid for?', 'Relays cover gaps; polar stations cover polar orbits; distance picks the network.'],
    steps: ($) => [`The need is met by ${SERVICE[$.q].answer === 'relay' ? 'a relay' : SERVICE[$.q].answer === 'gsaas' ? 'ground station as a service' : SERVICE[$.q].answer === 'dsn' ? 'the Deep Space Network' : 'a polar station'}.`],
    second: ($) => ({ a: { relay: 'relay', rent: 'gsaas', deep: 'dsn', polar: 'polar' }[$.q] }),
    cases: [kase('5 million km', { q: 'deep' }, { a: 'dsn' })],
  }),

  problem({
    id: 'u12.5.ops',
    title: 'Operations practice',
    exam: 'u12',
    ch: '12',
    kind: 'conceptual',
    src: 'Flux, after NASA’s small spacecraft report, 11.6 and 11.7',
    topics: ['operations'],
    principles: ['operations'],
    vars: { q: choice(['risky', 'risky'], ['who', 'who'], ['compat', 'compat']) },
    variety: ['which question'],
    text: (T, $) => OPS[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['model', 'It runs on the engineering model before it is approved', 'Operations simulate every plan, and run uncertain ones on hardware before upload.'],
        ['moc', 'The mission operations centre, on the science team’s request', 'One centre owns the command path; others ask it.'],
        ['e2e', 'End-to-end compatibility testing with the real ground station', 'It proves the station and the craft can talk, through the whole chain.'],
        ['upload', 'It is uploaded at once and watched closely', 'An untested plan risks the craft; check it first.'],
      ], ($) => OPS[$.q].answer),
    ],
    level: 1,
    hints: ['Who owns the command path?', 'What is checked before anything goes up, or before launch?'],
    steps: ($) => [`${{ model: 'Test it on the engineering model.', moc: 'The operations centre sends it.', e2e: 'End-to-end compatibility testing.' }[OPS[$.q].answer]}`],
    second: ($) => ({ a: { risky: 'model', who: 'moc', compat: 'e2e' }[$.q] }),
    cases: [kase('who commands', { q: 'who' }, { a: 'moc' })],
  }),
];

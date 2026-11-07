/**
 * Unit 1 bank: orbits. Original problems, written for the Kepler lab, with staged hints and named
 * traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { MU_EARTH, R_EARTH, kepler, orbitFromAltitudes } from '@flux/subjects/mechanics/kepler.js';
import { ORBITS } from '../../labs/kepler.js';
import { choice, kase, num, problem } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const orbitOf = (id) => orbitFromAltitudes(ORBITS[id].hp, ORBITS[id].ha);
export const quarterNu = (id) => {
  const o = orbitOf(id);
  return (kepler({ a: o.a, e: o.e, t: o.T / 4 }).nu * 180) / Math.PI;
};
const deg = (rad) => (rad * 180) / Math.PI;

export default [
  problem({
    id: 'u1.1.period',
    title: 'How long is an orbit?',
    exam: 'u1',
    ch: '1',
    lab: 'kepler',
    src: 'Flux, written for the Kepler lab',
    topics: ['ellipse'],
    principles: ['ellipse'],
    vars: { orbit: choice(['gto', 'a transfer orbit, perigee 250 km and apogee 35,786 km'], ['molniya', 'a Molniya orbit, perigee 600 km and apogee 39,700 km'], ['iss', 'the ISS, perigee 415 km and apogee 422 km']) },
    text: (T) => `A satellite flies ${T.orbit} above a 6378 km Earth (μ = 398,600 km³/s²). What is its period, in hours?`,
    parts: [num('T', ($) => orbitOf($.orbit).T / 3600, 'h', { label: 'T' })],
    level: 1,
    hints: ['The semi-major axis is the mean of the perigee and apogee radii, measured from Earth’s centre.', 'T = 2π√(a³/μ), in seconds; divide by 3600.'],
    steps: ($) => {
      const o = orbitOf($.orbit);
      return [String.raw`$a = \tfrac12(${Number(o.rp.toFixed(0))} + ${Number(o.ra.toFixed(0))}) = ${Number(o.a.toFixed(0))}$ km`, String.raw`$T = 2\pi\sqrt{a^3/\mu} = ${Number(o.T.toPrecision(4))}$ s $= ${Number((o.T / 3600).toPrecision(4))}$ h`];
    },
    sim: {
      scenario: 'gto',
      setup(s, $) {
        Object.assign(s, { orbit: $.orbit, frac: 0 });
      },
      read: (c) => ({ T: c.T / 3600 }),
    },
    cases: [kase('the transfer orbit', { orbit: 'gto' }, { T: 10.53 })],
  }),

  problem({
    id: 'u1.2.speed',
    title: 'Fast and slow',
    exam: 'u1',
    ch: '1',
    lab: 'kepler',
    src: 'Flux, written for the Kepler lab',
    topics: ['ellipse'],
    principles: ['ellipse'],
    vars: { where: choice(['perigee', 'perigee, 250 km up'], ['apogee', 'apogee, 35,786 km up']) },
    text: (T) => `On a transfer orbit with perigee 250 km and apogee 35,786 km above a 6378 km Earth (μ = 398,600 km³/s²), how fast is the craft at ${T.where}, in km/s?`,
    parts: [num('v', ($) => { const o = orbitOf('gto'); const r = $.where === 'perigee' ? o.rp : o.ra; return Math.sqrt(MU_EARTH * (2 / r - 1 / o.a)); }, 'km/s', { label: 'v' })],
    level: 2,
    hints: ['Find a = (r_p + r_a)/2 with radii from Earth’s centre.', 'Vis-viva: v² = μ(2/r − 1/a).'],
    steps: ($) => {
      const o = orbitOf('gto');
      const r = $.where === 'perigee' ? o.rp : o.ra;
      return [String.raw`$a = ${Number(o.a.toFixed(0))}$ km, $r = ${Number(r.toFixed(0))}$ km`, String.raw`$v = \sqrt{\mu(2/r - 1/a)} = ${Number(Math.sqrt(MU_EARTH * (2 / r - 1 / o.a)).toPrecision(3))}$ km/s`];
    },
    sim: {
      scenario: 'gto',
      setup(s, $) {
        Object.assign(s, { orbit: 'gto', frac: $.where === 'perigee' ? 0 : 0.5 });
      },
      read: (c) => ({ v: c.v }),
    },
    cases: [kase('at perigee', { where: 'perigee' }, { v: 10.2 })],
  }),

  problem({
    id: 'u1.3.anomaly',
    title: 'Where is it after a quarter period?',
    exam: 'u1',
    ch: '1',
    lab: 'kepler',
    src: 'Flux, written for the Kepler lab',
    topics: ['kepler'],
    principles: ['kepler'],
    vars: { orbit: choice(['gto', 'the transfer orbit (e = 0.728)'], ['molniya', 'the Molniya orbit (e = 0.737)']) },
    text: (T) => String.raw`On ${T.orbit}, how far round from perigee is the craft a quarter of a period after perigee? Solve $M = E - e\sin E$ with $M = 90°$, then find the true anomaly ν in degrees.`,
    parts: [num('nu', ($) => quarterNu($.orbit), '°', { label: 'ν', tol: 0.005 })],
    level: 3,
    hints: ['Newton’s method: E ← E − (E − e sin E − M)/(1 − e cos E), in radians, starting from E = M.', 'Then tan(ν/2) = √((1 + e)/(1 − e)) tan(E/2).'],
    steps: ($) => {
      const o = orbitOf($.orbit);
      const k = kepler({ a: o.a, e: o.e, t: o.T / 4 });
      return [`E = ${Number(deg(k.E).toPrecision(4))}° after ${k.iterations} Newton steps.`, `ν = ${Number(deg(k.nu).toPrecision(4))}°.`];
    },
    sim: {
      scenario: 'gto',
      setup(s, $) {
        Object.assign(s, { orbit: $.orbit, frac: 0.25 });
      },
      read: (c) => ({ nu: deg(c.nu) }),
    },
    cases: [kase('the transfer orbit', { orbit: 'gto' }, { nu: 156.4 })],
  }),

  problem({
    id: 'u1.4.quarter',
    title: 'A quarter of the time, a quarter of the way?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'kepler',
    src: 'Flux, written for the Kepler lab',
    topics: ['kepler'],
    principles: ['kepler'],
    vars: { orbit: choice(['gto', 'a geostationary transfer orbit'], ['molniya', 'a Molniya orbit']) },
    text: (T) => `A craft on ${T.orbit} passes perigee. A quarter of a period later, how far round is it?`,
    parts: [
      pick('way', 'how far round', [
        ['less', 'less than 90°', 'It is fastest at perigee, so it gets further, not less far, in the first quarter.'],
        ['exact', 'exactly 90°', 'Only on a circle: equal times give equal angles when the speed is steady.'],
        ['more', 'more than 90°', 'Equal areas in equal times: near perigee the radius is short, so the angle swept is large.'],
      ], () => 'more'),
    ],
    level: 1,
    hints: ['Is the craft faster near perigee or near apogee?', 'Equal areas in equal times.'],
    steps: () => ['Fastest near perigee, the craft sweeps well past 90° in the first quarter of the period.'],
    sim: {
      scenario: 'gto',
      setup(s, $) {
        Object.assign(s, { orbit: $.orbit, frac: 0.25 });
      },
      read: (c) => ({ way: c.nu > Math.PI / 2 + 1e-6 ? 'more' : c.nu < Math.PI / 2 - 1e-6 ? 'less' : 'exact' }),
    },
    cases: [kase('a transfer orbit', { orbit: 'gto' }, { way: 'more' })],
  }),
];

export { R_EARTH };

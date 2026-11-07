/**
 * Unit 1 bank: orbits. Original problems, written for the Kepler lab, with staged hints and named
 * traps (../coaching/u1.js), each checked against the lab (`sim`).
 */
import { MU_EARTH, R_EARTH, kepler, orbitFromAltitudes } from '@flux/subjects/mechanics/kepler.js';
import { ORBITS } from '../../labs/kepler.js';
import { transfer } from '@flux/subjects/mechanics/transfer.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
export const orbitOf = (id) => orbitFromAltitudes(ORBITS[id].hp, ORBITS[id].ha);
export const quarterNu = (id) => {
  const o = orbitOf(id);
  return (kepler({ a: o.a, e: o.e, t: o.T / 4 }).nu * 180) / Math.PI;
};
const deg = (rad) => (rad * 180) / Math.PI;
/** The transfer problems, with the given μ = 398,600 and R = 6378 km. `alt` and `full` name traps. */
const MU_G = 398600;
const R_G = 6378;
export const DEST = { meo: 20000, geo: 35786 };
export const START = { low: 400, high: 1000 };
export const hohmannBurn = ($, radii = true, naive = false) => {
  const r1 = (radii ? R_G : 0) + 300;
  const r2 = (radii ? R_G : 0) + $.h2;
  const v1 = Math.sqrt(MU_G / r1);
  const v2 = Math.sqrt(MU_G / r2);
  if (naive) return 1000 * Math.abs(v1 - v2);
  return 1000 * ($.burn === 'first' ? v1 * (Math.sqrt((2 * r2) / (r1 + r2)) - 1) : v2 * (1 - Math.sqrt((2 * r1) / (r1 + r2))));
};
export const transferHours = ($, half = true, radii = true) => {
  const a = ((radii ? 2 * R_G : 0) + $.h1 + DEST[$.dest]) / 2;
  return ((half ? 1 : 2) * Math.PI * Math.sqrt(a ** 3 / MU_G)) / 3600;
};
export const newApogee = ($, what = 'apogee') => {
  const r = R_G + START[$.start];
  const v = Math.sqrt(MU_G / r) + $.dv;
  const a = 1 / (2 / r - (v * v) / MU_G);
  return what === 'a' ? a - R_G : what === 'radius' ? 2 * a - r : 2 * a - r - R_G;
};

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

  problem({
    id: 'u1.5.hohmann',
    title: 'Hohmann burns',
    exam: 'u1',
    ch: '1',
    lab: 'transfer',
    src: 'Flux, written for the Transfer lab',
    topics: ['transfer'],
    principles: ['transfer'],
    vars: { burn: choice(['first', 'the first burn, at 300 km'], ['second', 'the second burn, at the target']), h2: range(1000, 21000, 5000, 'km') },
    text: (T) => `A satellite on a circular orbit at 300 km moves by Hohmann transfer to a circular orbit at ${T.h2} km. How big is ${T.burn}, in m/s? Take μ = 398,600 km³/s² and Earth's radius 6378 km.`,
    parts: [num('dv', ($) => hohmannBurn($), 'm/s', { label: 'Δv' })],
    level: 2,
    hints: ['Work in radii from Earth’s centre: r = 6378 km + altitude. The transfer ellipse has a = (r₁ + r₂)/2.', 'Each burn is the vis-viva speed on the ellipse minus the circular speed √(μ/r) there.'],
    steps: ($) => {
      const r1 = 6378 + 300;
      const r2 = 6378 + $.h2;
      return [String.raw`$r_1 = ${r1}$ km, $r_2 = ${r2}$ km, $a = ${(r1 + r2) / 2}$ km`, String.raw`$\Delta v = ${Number(hohmannBurn($).toPrecision(4))}$ m/s`];
    },
    sim: {
      scenario: 'raise',
      setup(s, $) {
        Object.assign(s, { h1: 300, h2: $.h2, frac: 1 });
      },
      read: (c, s, $) => ({ dv: 1000 * ($.burn === 'first' ? c.dv1 : c.dv2) }),
    },
    cases: [kase('first burn to 6000 km', { burn: 'first', h2: 6000 }, { dv: 1080 })],
  }),

  problem({
    id: 'u1.6.transfer-time',
    title: 'How long does the transfer take?',
    exam: 'u1',
    ch: '1',
    lab: 'transfer',
    src: 'Flux, written for the Transfer lab',
    topics: ['transfer'],
    principles: ['transfer'],
    vars: { dest: choice(['meo', 'a circular orbit at 20,000 km'], ['geo', 'geostationary altitude, 35,786 km']), h1: range(200, 1000, 200, 'km') },
    text: (T) => `A Hohmann transfer starts from a circular orbit at ${T.h1} km and ends at ${T.dest}. How long is the coast between the two burns, in hours? μ = 398,600 km³/s², Earth's radius 6378 km.`,
    parts: [num('t', ($) => transferHours($), 'h', { label: 't' })],
    level: 2,
    hints: ['The coast is half of the transfer ellipse.', 't = π√(a³/μ), with a = (r₁ + r₂)/2 from Earth’s centre.'],
    steps: ($) => [String.raw`$a = (${6378 + $.h1} + ${6378 + DEST[$.dest]})/2$ km, $t = \pi\sqrt{a^3/\mu} = ${Number(transferHours($).toPrecision(3))}$ h`],
    sim: {
      scenario: 'geo',
      setup(s, $) {
        Object.assign(s, { h1: $.h1, h2: DEST[$.dest], frac: 1 });
      },
      read: (c) => ({ t: c.tTransfer / 3600 }),
    },
    cases: [kase('200 km to GEO', { dest: 'geo', h1: 200 }, { t: 5.259 })],
  }),

  problem({
    id: 'u1.7.new-apogee',
    title: 'A small burn raises the far side',
    exam: 'u1',
    ch: '1',
    lab: 'transfer',
    src: 'Flux, written for the Transfer lab',
    topics: ['transfer'],
    principles: ['transfer'],
    vars: { start: choice(['low', '400 km'], ['high', '1000 km']), dv: range(20, 100, 20, 'm/s', 1e-3) },
    text: (T) => `A satellite on a circular orbit at ${T.start} fires forward by ${T.dv} m/s. What is the altitude of its new apogee, in km? μ = 398,600 km³/s², Earth's radius 6378 km.`,
    parts: [num('ha', ($) => newApogee($), 'km', { label: 'h_a' })],
    level: 3,
    hints: ['The burn point becomes perigee. Vis-viva there gives the new a: 1/a = 2/r − v²/μ.', 'The apogee radius is 2a − r; subtract Earth’s radius for the altitude.'],
    steps: ($) => {
      const r = 6378 + START[$.start];
      const v = Math.sqrt(398600 / r) + $.dv;
      const a = 1 / (2 / r - (v * v) / 398600);
      return [String.raw`$v = ${Number(v.toPrecision(5))}$ km/s, $a = ${Number(a.toPrecision(6))}$ km, apogee altitude $= 2a - r - 6378 = ${Number(newApogee($).toPrecision(4))}$ km`];
    },
    sim: {
      scenario: 'chase',
      setup(s, $) {
        const h1 = START[$.start];
        const MU = 398600.4418;
        const r1 = 6378.137 + h1;
        const v1 = Math.sqrt(MU / r1);
        const h2 = 2 * h1 + 2000;
        const r2 = 6378.137 + h2;
        const dv1 = v1 * (Math.sqrt((2 * r2) / (r1 + r2)) - 1);
        Object.assign(s, { h1, h2, frac: $.dv / dv1 });
      },
      read: (c) => ({ ha: c.ra - 6378.137 }),
    },
    cases: [kase('400 km, 40 m/s', { start: 'low', dv: 40 }, { ha: 543.3 })],
  }),

  problem({
    id: 'u1.8.catch-up',
    title: 'Which way to burn?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: 'transfer',
    src: 'Flux, written for the Transfer lab',
    topics: ['transfer'],
    principles: ['transfer'],
    vars: { other: choice(['ahead', 'a craft 50 km ahead of you on the same circular orbit'], ['behind', 'a craft 50 km behind you on the same circular orbit']) },
    text: (T) => `You want to meet ${T.other}. Which small burn closes the gap within a few orbits?`,
    parts: [
      pick('d', 'the burn', [
        ['forward', 'a forward burn, along your motion', 'A forward burn raises the orbit and lengthens its period: you fall back, so the craft behind closes in.'],
        ['backward', 'a backward burn, against your motion', 'A backward burn lowers the orbit and shortens its period: you gain on the craft ahead.'],
      ], ($) => ($.other === 'ahead' ? 'backward' : 'forward')),
    ],
    level: 1,
    hints: ['Burning changes the orbit’s size, and the size sets the period.', 'Which way does a forward burn change the period?'],
    steps: ($) => [$.other === 'ahead' ? 'Burn backward: a lower, faster orbit gains on the craft ahead.' : 'Burn forward: a higher, slower orbit lets the craft behind catch up.'],
    sim: {
      scenario: 'chase',
      read: (c, s, $) => {
        // A forward burn lengthens the period (the lab shows it); a backward one shortens it.
        const fwd = transfer({ h1: s.h1, h2: s.h2, frac: 0.3 }).behind;
        return { d: $.other === 'ahead' ? (fwd ? 'backward' : 'forward') : fwd ? 'forward' : 'backward' };
      },
    },
    cases: [kase('a craft ahead', { other: 'ahead' }, { d: 'backward' })],
  }),
];

export { R_EARTH };

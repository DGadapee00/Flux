/**
 * Unit 7 bank: the whole craft at once. Original problems, with staged hints and named traps
 * (../coaching/u7.js). Numeric templates are checked by stepping the day or the orbit (`second`); the
 * trade study is checked against the Mission design lab's model.
 */
import { choice, kase, num, problem } from '../kit.js';
import { missionChecked } from '@flux/subjects/design/mission.js';
import { missionDesign } from '../../labs/mission.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });
const fmt = (x, n = 3) => Number(x.toPrecision(n));
const ETA = 0.9;
const T_ORBIT = 94.6; // min, 500 km
const T_ECL = 35.9; // min, the longest eclipse at 500 km

/** The average load in watts; `how` names the traps. */
export function avgLoad($, how = 'right') {
  const bus = Number($.bus);
  const d = Number($.d) / 100;
  const pay = Number($.pay);
  const s = Number($.m) / 1440;
  const tx = Number($.tx);
  if (how === 'txAlways') return bus + d * pay + tx;
  if (how === 'payAlways') return bus + pay + s * tx;
  return bus + d * pay + s * tx;
}

/** The power budget's use: load energy over array energy, one orbit; `how` names the traps. */
export function powerUse($, how = 'right') {
  const P = Number($.P);
  const A = Number($.A);
  const Ts = T_ORBIT - T_ECL;
  if (how === 'average') return P / A;
  if (how === 'noLoss') return (P * T_ORBIT) / (A * Ts);
  return (P * (Ts + T_ECL / (ETA * ETA))) / (A * Ts);
}

/** The data budget's use: a day's recording over a day's sending; `how` names the traps. */
export function dataUse($, how = 'right') {
  const g = Number($.g);
  const d = Number($.d) / 100;
  const R = Number($.R) * 1000; // kbit/s
  const m = Number($.m);
  const made = 86400 * (how === 'noDuty' ? g + 2 : d * g + 2);
  const sent = R * m * (how === 'noSixty' ? 1 : 60);
  return made / sent;
}

const BASE = { pay: 'mag', duty: 100, h: 500, incl: 97.4, radio: 's1', s1: 'utq', s2: 'none', Ppeak: 20, Ebatt: 30, finish: 'black', sensor: 'horizon' };
const CHANGES = {
  uhf: { text: 'swap its 1 Mbit/s S-band radio for a 9.6 kbit/s UHF radio, lighter and less hungry', state: { radio: 'uhf' } },
  high: { text: 'raise its orbit from 500 km to 550 km, so its station sees it longer', state: { h: 550 } },
  sun: { text: 'replace the magnetometer with a camera that must point within 0.2°, imaging 5% of each orbit, held by a fine Sun sensor, with the 4 Mbit/s radio', state: { pay: 'cam', duty: 5, sensor: 'sun', radio: 's4' } },
  moj: { text: 'move its one station from Utqiagvik, 71°N, to Mojave, 35°N', state: { s1: 'moj' } },
};

/** The budget that fails worst after a change, from the lab's model. */
export function failsAfter(change) {
  const c = missionChecked(missionDesign({ ...BASE, ...CHANGES[change].state }));
  const failing = c.budgets.filter((b) => !b.ok);
  return failing.reduce((a, b) => ((b.use ?? Infinity) > (a.use ?? Infinity) ? b : a)).id;
}

const LOOP = {
  fail: { text: 'On the second pass through the design, the data budget fails. What happens next?', answer: 'again' },
  three: { text: 'Which three products must agree before a pass through the design loop is done?', answer: 'three' },
  deep: { text: 'How deep must the design go before it is handed on?', answer: 'deep' },
};

const REVIEW = {
  basis: { text: 'Two designs show the same 13% power margin. One rests on estimated loads, the other on measured ones. What should the review table add?', answer: 'basis' },
  track: { text: 'Why are a craft’s margins listed at every review, not only the last?', answer: 'track' },
  after: { text: 'After the preliminary design review, what should changes to the design be?', answer: 'refine' },
};

export default [
  problem({
    id: 'u7.1.load',
    title: 'The load every budget shares',
    exam: 'u7',
    ch: '7',
    lab: 'mission',
    src: 'Flux, written for the Mission design lab',
    topics: ['budgets'],
    principles: ['budgets'],
    vars: {
      bus: choice(['6', '6 W'], ['8', '8 W']),
      d: choice(['5', '5%'], ['20', '20%'], ['50', '50%']),
      pay: choice(['8', '8 W'], ['12', '12 W']),
      m: choice(['17', '17'], ['56', '56'], ['119', '119']),
      tx: choice(['10', '10 W'], ['16', '16 W']),
    },
    variety: ['duty', 'contact time', 'loads'],
    text: (T) => `A craft's bus draws ${T.bus} all the time. Its payload draws ${T.pay} and runs ${T.d} of each orbit. Its transmitter draws ${T.tx} whenever a station sees the craft, ${T.m} minutes a day. What is the average load, in watts?`,
    parts: [num('P', ($) => avgLoad($), 'W', { label: 'P̄' })],
    level: 1,
    hints: ['Each load counts for the share of time it runs.', 'P̄ = P_bus + d P_payload + s P_radio, with s the minutes in view over 1440.'],
    steps: ($) => [String.raw`$\bar P = ${$.bus} + ${Number($.d) / 100}\times${$.pay} + \tfrac{${$.m}}{1440}\times${$.tx} = ${fmt(avgLoad($))}\ \text{W}$`],
    second: ($) => {
      // Seventy-two whole orbits, a thousand steps each: the payload runs the first share d of each
      // orbit, and the radio the share of the span a station sees the craft.
      const d = Number($.d) / 100;
      const per = 1000;
      const span = 72 * per;
      const contact = (Number($.m) / 1440) * span;
      let E = 0;
      for (let k = 0; k < span; k++) {
        const on = k % per < d * per;
        E += Number($.bus) + (on ? Number($.pay) : 0) + (k < contact ? Number($.tx) : 0);
      }
      return { P: E / span };
    },
    cases: [kase('8 W bus, 20% of 8 W, 56 minutes of 10 W', { bus: '8', d: '20', pay: '8', m: '56', tx: '10' }, { P: 9.989 })],
  }),

  problem({
    id: 'u7.2.power',
    title: 'Does the array carry the orbit?',
    exam: 'u7',
    ch: '7',
    lab: 'mission',
    src: 'Flux, written for the Mission design lab',
    topics: ['budgets'],
    principles: ['budgets'],
    vars: { P: choice(['8', '8 W'], ['10', '10 W'], ['12', '12 W']), A: choice(['16', '16 W'], ['20', '20 W'], ['24', '24 W']) },
    variety: ['load and array'],
    text: (T) => `At 500 km a craft's orbit lasts ${T_ORBIT} minutes, ${T_ECL} of them in eclipse. Its average load is ${T.P}. A sun-tracking array gives ${T.A} in sunlight. The battery charges and discharges at 90% each way. What share of the array's energy each orbit does the load use?`,
    parts: [num('u', ($) => powerUse($), '', { label: 'use' })],
    level: 2,
    hints: ['The array works only in sunlight, T_s = T − T_e.', 'Energy used in eclipse passes through the battery twice: divide it by η_c η_d.', 'use = P̄ (T_s + T_e/(η_c η_d)) / (P_array T_s).'],
    steps: ($) => [String.raw`$T_s = ${fmt(T_ORBIT - T_ECL)}\ \text{min}$`, String.raw`$\text{use} = \frac{${$.P}\,(${fmt(T_ORBIT - T_ECL)} + ${T_ECL}/0.81)}{${$.A}\times${fmt(T_ORBIT - T_ECL)}} = ${fmt(powerUse($))}$`],
    second: ($) => {
      // One orbit in one-second steps: the array feeds the load directly in sunlight and the battery
      // with what is left; in eclipse the battery gives what it took in, through both efficiencies.
      const n = Math.round(T_ORBIT * 60);
      const dark = Math.round(T_ECL * 60);
      let direct = 0;
      let stored = 0;
      let array = 0;
      for (let k = 0; k < n; k++) {
        if (k < n - dark) {
          array += Number($.A);
          direct += Number($.P);
        } else stored += Number($.P) / (ETA * ETA);
      }
      return { u: (direct + stored) / array };
    },
    cases: [kase('10 W on a 20 W array', { P: '10', A: '20' }, { u: 0.8709 })],
  }),

  problem({
    id: 'u7.3.data',
    title: 'Does the data come down?',
    exam: 'u7',
    ch: '7',
    lab: 'mission',
    src: 'Flux, written for the Mission design lab',
    topics: ['budgets'],
    principles: ['budgets'],
    vars: {
      g: choice(['100', '100 kbit/s'], ['500', '500 kbit/s'], ['2000', '2 Mbit/s']),
      d: choice(['5', '5%'], ['10', '10%'], ['25', '25%']),
      R: choice(['1', '1 Mbit/s'], ['4', '4 Mbit/s']),
      m: choice(['17', '17 minutes'], ['56', '56 minutes'], ['119', '119 minutes']),
    },
    variety: ['payload', 'radio', 'stations'],
    text: (T) => `A payload records ${T.g} while it runs, ${T.d} of the day, and housekeeping adds 2 kbit/s all the time. The radio sends ${T.R} while a station sees the craft, ${T.m} a day. What share of the day's sending does the recording use?`,
    parts: [num('u', ($) => dataUse($), '', { label: 'use' })],
    level: 2,
    hints: ['Recorded a day: 86 400 s × (d g + housekeeping).', 'Sent a day: the radio rate × the contact time in seconds.'],
    steps: ($) => [String.raw`$\frac{86\,400\,(${Number($.d) / 100}\times${$.g} + 2)}{${Number($.R) * 1000}\times${$.m}\times 60} = ${fmt(dataUse($))}$`],
    second: ($) => {
      // Step the store through a day second by second, the radio sending in the first m minutes'
      // worth of contacts and the payload in its share; count what it records and could send.
      const d = Number($.d) / 100;
      let made = 0;
      let can = 0;
      for (let k = 0; k < 86400; k++) {
        made += (k < d * 86400 ? Number($.g) : 0) + 2;
        if (k >= 86400 - Number($.m) * 60) can += Number($.R) * 1000;
      }
      return { u: made / can };
    },
    cases: [kase('2 Mbit/s for 5%, 4 Mbit/s for 56 minutes', { g: '2000', d: '5', R: '4', m: '56' }, { u: 0.6556 })],
  }),

  problem({
    id: 'u7.4.trade',
    title: 'Which budget breaks?',
    exam: 'u7',
    ch: '7',
    kind: 'conceptual',
    lab: 'mission',
    src: 'Flux, written for the Mission design lab',
    topics: ['trades'],
    principles: ['trades'],
    vars: { change: choice(['uhf', 'UHF'], ['high', '550 km'], ['sun', 'camera'], ['moj', 'Mojave']) },
    variety: ['which change'],
    text: (T, $) => `The 6U magnetometer craft at 500 km closes every budget, with orbital life the limit at 0.88 and data at 0.57. Now ${CHANGES[$.change].text}. Which budget fails?`,
    parts: [
      pick('b', 'budget', [
        ['data', 'Data', 'What the craft records a day against what its contacts can send at the radio’s rate.'],
        ['life', 'Orbital life', 'Higher air is thinner: drag weakens fast with height, and the life passes the five-year rule.'],
        ['pointing', 'Pointing', 'Bias plus three sigma against the payload’s cone: a sensor accurate to 0.3° cannot hold 0.2°.'],
        ['power', 'Power', 'The load’s energy each orbit against the array’s.'],
        ['mass', 'Mass', 'The predicted mass against the 12 kg allowed.'],
      ], ($) => failsAfter($.change)),
    ],
    level: 2,
    hints: ['Which numbers does the change touch: the rate, the contact time, the orbit, or the payload’s needs?', 'A change made for one budget often breaks another.'],
    steps: ($) => [{ uhf: 'A hundredth of the rate: 32 Mbit a day against 1.9 Gbit recorded.', high: 'The life grows to 10.4 years.', sun: 'Bias plus three sigma is 0.35°, against 0.2°.', moj: 'Contact falls from 56 to 17 minutes a day.' }[$.change]],
    second: ($) => ({ b: { uhf: 'data', high: 'life', sun: 'pointing', moj: 'data' }[$.change] }),
    cases: [kase('550 km', { change: 'high' }, { b: 'life' })],
  }),

  problem({
    id: 'u7.5.loop',
    title: 'The design loop',
    exam: 'u7',
    ch: '7',
    kind: 'conceptual',
    src: 'Flux, after the NASA Systems Engineering Handbook, 4.0 and 4.4',
    topics: ['loop'],
    principles: ['loop'],
    vars: { q: choice(['fail', 'fail'], ['three', 'three'], ['deep', 'deep']) },
    variety: ['which question'],
    text: (T, $) => LOOP[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['again', 'The design or the mission’s expectations change, and every budget is run again', 'A no to any question sends the loop round again, with all the budgets.'],
        ['three', 'The architecture, the concept of operations and the derived requirements', 'These three are made consistent with each other on every pass.'],
        ['deep', 'Deep enough that analysis can show it meets its requirements', 'The design must be credible to an independent review and support verification by analysis.'],
        ['patch', 'Only the data budget is changed until it closes', 'A fix for one budget changes the numbers the others use.'],
      ], ($) => LOOP[$.q].answer),
    ],
    level: 1,
    hints: ['The loop repeats until every check passes.', 'What must agree, and how deep must the design go?'],
    steps: ($) => [{ again: 'Change the design and run every budget again.', three: 'Architecture, concept of operations, derived requirements.', deep: 'Deep enough to verify by analysis.' }[LOOP[$.q].answer]],
    second: ($) => ({ a: { fail: 'again', three: 'three', deep: 'deep' }[$.q] }),
    cases: [kase('a failing budget', { q: 'fail' }, { a: 'again' })],
  }),

  problem({
    id: 'u7.6.review',
    title: 'Margins at review',
    exam: 'u7',
    ch: '7',
    kind: 'conceptual',
    src: 'Flux, after the NASA Systems Engineering Handbook, 3.0 and 6.7',
    topics: ['review'],
    principles: ['review'],
    vars: { q: choice(['basis', 'basis'], ['track', 'track'], ['after', 'after']) },
    variety: ['which question'],
    text: (T, $) => REVIEW[$.q].text,
    parts: [
      pick('a', 'answer', [
        ['basis', 'What each margin rests on: estimates, catalog figures or measurements', 'The same margin is stronger on measured numbers than on estimates.'],
        ['track', 'So a margin that shrinks shows up early, while it can still be fixed', 'Technical measures are tracked through every review, not only checked at the end.'],
        ['refine', 'Refinements of the design, not fundamental changes', 'The PDR settles the design-to numbers; later changes cost more.'],
        ['drop', 'Remove the smaller margin from the table', 'A small margin is a warning to keep, not a number to hide.'],
      ], ($) => REVIEW[$.q].answer),
    ],
    level: 1,
    hints: ['A margin is only as good as the numbers behind it.', 'Reviews follow the design from phase to phase.'],
    steps: ($) => [{ basis: 'State the basis of each number.', track: 'Track margins from review to review.', refine: 'After PDR, changes refine.' }[REVIEW[$.q].answer]],
    second: ($) => ({ a: { basis: 'basis', track: 'track', after: 'refine' }[$.q] }),
    cases: [kase('the basis', { q: 'basis' }, { a: 'basis' })],
  }),
];

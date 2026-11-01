/**
 * EXAMPLE BANK. Replace with the course's own templates; keep the shape.
 *
 * Each template varies by structure (a `choice` among configurations or givens, not only number
 * ranges), carries 2–3 staged hints, at least two named traps on every numeric part (here, in
 * ../coaching/u1.js), a worked case that reproduces a printed answer (cite the OCW problem set or
 * open text it comes from, D15), and a second method: its lab (`sim`) or `second`.
 */
import { tankTime } from '../../labs/tank.js';
import { choice, kase, num, problem, range } from '../kit.js';

const pick = (id, label, options, correct) => ({ id, kind: 'choice', label, options: options.map(([value, text, why]) => ({ value, label: text, why })), correct, multi: false });

export default [
  problem({
    id: 'u1.1.fill-time',
    title: 'Time to fill',
    exam: 'u1',
    ch: '1',
    lab: 'tank',
    src: 'Example only',
    topics: ['net-rate'],
    principles: ['net-rate'],
    vars: {
      qin: range(0.4, 1.0, 0.1, 'L/s', 1e-3),
      qout: range(0.1, 0.3, 0.05, 'L/s', 1e-3),
      V0: range(20, 100, 10, 'L', 1e-3),
      given: choice(['rates', 'the inflow and the drain'], ['net', 'the net rate']),
    },
    valid: ($) => $.qin > $.qout,
    text: (T, $, sig) => ($.given === 'net'
      ? String.raw`A 300 L tank holds ${T.V0} L. Water flows in faster than it drains, at a net $${sig(($.qin - $.qout) * 1000)}\ \mathrm{L/s}$. How long until it is full?`
      : String.raw`A 300 L tank holds ${T.V0} L. Water flows in at $${sig($.qin * 1000)}$ L/s and drains at $${sig($.qout * 1000)}$ L/s. How long until it is full?`),
    parts: [num('T', ($) => tankTime($.V0, 0.3, $.qin, $.qout).T, 's', { label: 'time to fill' })],
    level: 1,
    hints: ['What matters is how fast the volume grows: inflow minus outflow.', 'Divide the volume still to fill by the net rate.'],
    steps: ($, sig) => [String.raw`Net rate $= ${sig(($.qin - $.qout) * 1000)}$ L/s. Time $= (300 - ${sig($.V0 * 1000)})/${sig(($.qin - $.qout) * 1000)} = ${sig(tankTime($.V0, 0.3, $.qin, $.qout).T)}$ s.`],
    sim: {
      scenario: 'fill',
      setup(s, $) {
        s.V0 = $.V0;
        s.Vcap = 0.3;
        s.qin = $.qin;
        s.qout = $.qout;
      },
      read: (c) => ({ T: c.T }),
    },
    cases: [kase('Example case: 0.5 L/s in, 0.1 L/s out, from empty', { qin: 0.5, qout: 0.1, V0: 0, given: 'rates' }, { T: 750 })],
  }),

  problem({
    id: 'u1.2.volume-at',
    title: 'Volume after a time',
    exam: 'u1',
    ch: '2',
    lab: 'tank',
    src: 'Example only',
    topics: ['accumulation'],
    principles: ['accumulation'],
    vars: {
      mode: choice(['fill', 'filling'], ['drain', 'draining']),
      big: range(0.4, 0.8, 0.1, 'L/s', 1e-3),
      small: range(0.1, 0.3, 0.05, 'L/s', 1e-3),
      V0: range(100, 150, 10, 'L', 1e-3),
      t: range(60, 240, 30, 's'),
    },
    derive: ($) => ($.mode === 'fill' ? { qin: $.big, qout: $.small } : { qin: $.small, qout: $.big }),
    valid: ($) => {
      const V = $.V0 + ($.qin - $.qout) * $.t;
      return V > 0 && V < 0.3;
    },
    text: (T, $, sig) => String.raw`A 300 L tank holds ${T.V0} L. Water flows in at $${sig($.qin * 1000)}$ L/s and drains at $${sig($.qout * 1000)}$ L/s. How much water is in it after ${T.t}?`,
    parts: [num('V', ($) => $.V0 + ($.qin - $.qout) * $.t, 'm^3', { label: 'volume' })],
    level: 2,
    hints: ['The volume changes at a constant rate. Which rate?', 'Start from what is already in the tank, then add the net rate times the time.'],
    steps: ($, sig) => [String.raw`$V = ${sig($.V0 * 1000)} + (${sig($.qin * 1000)} - ${sig($.qout * 1000)})(${sig($.t)}) = ${sig(($.V0 + ($.qin - $.qout) * $.t) * 1000)}$ L.`],
    second: ($) => {
      let V = $.V0;
      const n = 1000;
      for (let i = 0; i < n; i++) V += (($.qin - $.qout) * $.t) / n;
      return { V };
    },
    cases: [kase('Example case: 120 L, 0.5 in, 0.2 out, 100 s', { mode: 'fill', big: 0.5, small: 0.2, V0: 120, t: 100 }, { V: 0.15 })],
  }),

  problem({
    id: 'u1.1.which-way',
    title: 'Rising, falling or steady?',
    exam: 'u1',
    ch: '1',
    kind: 'conceptual',
    lab: null,
    src: 'Example only',
    topics: ['net-rate'],
    principles: ['net-rate'],
    vars: { case: choice(['more', 'more water flows in than drains'], ['less', 'less water flows in than drains'], ['equal', 'water flows in exactly as fast as it drains']) },
    text: (T) => `A tank is half full, and ${T.case}. What does the water level do?`,
    parts: [
      pick('level', 'the level', [
        ['rise', 'it rises', 'It rises only when the inflow beats the drain.'],
        ['fall', 'it falls', 'It falls only when the drain beats the inflow.'],
        ['steady', 'it stays put', 'It holds only when the two rates are equal, whatever they are.'],
      ], ($) => ({ more: 'rise', less: 'fall', equal: 'steady' }[$.case])),
    ],
    level: 1,
    hints: ['Only the difference of the two rates matters.', 'Compare the inflow with the drain.'],
    steps: () => ['The level follows the sign of the net rate, inflow minus outflow.'],
    second: ($) => {
      const net = { more: 1, less: -1, equal: 0 }[$.case];
      return { level: net > 0 ? 'rise' : net < 0 ? 'fall' : 'steady' };
    },
    cases: [kase('Example case', { case: 'equal' }, { level: 'steady' })],
  }),
];

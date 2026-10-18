import { M_PER_FT, N_PER_LBF, convert } from '@flux/subjects/convert.js';
import { hibbeler, hibbelerExp, kase, mc, num, problem, range, choice } from '../kit.js';

const V = [1, -1];
const A = [1, -2];
const S = [1, 0];
const TIME = [0, 1];
const addDim = (a, b) => [a[0] + b[0], a[1] + b[1]];
const sameDim = (terms) => terms.every((d) => d[0] === terms[0][0] && d[1] === terms[0][1]);

/** The answer a student should mark. Kept apart from the dimension walk below. */
const EQ_OK = { vat: true, s: true, bad: false, mix: false };

/** Term-by-term [length, time] check. This is the second method, not the answer table. */
function homogeneous(id) {
  if (id === 'vat') return sameDim([V, V, addDim(A, TIME)]);
  if (id === 's') return sameDim([S, S, addDim(V, TIME), addDim(A, addDim(TIME, TIME))]);
  if (id === 'bad') return sameDim([V, V, A]);
  if (id === 'mix') return sameDim([S, V, addDim(A, addDim(TIME, TIME))]);
  return false;
}

/** Each rounding a student might report, with what it gets wrong. */
function roundChoices(raw) {
  const right = hibbeler(raw);
  const lead1 = Math.floor(Math.abs(raw) / 10 ** Math.floor(Math.log10(Math.abs(raw)) + 1e-12) + 1e-9) === 1;
  const why = {
    2: 'Two figures throws away the third, which the rule keeps.',
    3: lead1 ? 'The first digit is 1, so the rule keeps a fourth figure.' : 'Three figures is right here.',
    4: lead1 ? 'Four figures is right here: the first digit is 1.' : 'Four figures is kept only when the first digit is 1.',
  };
  const out = [];
  for (const n of [2, 3, 4]) {
    const value = Number(raw.toPrecision(n));
    if (out.some((o) => o.value === value)) continue;
    out.push({ value, label: String(value), why: value === right ? 'This follows the rule.' : why[n] });
  }
  if (!out.some((o) => o.value === right)) out.push({ value: right, label: String(right), why: 'This follows the rule.' });
  return out;
}

/** Why each verdict is wrong for each equation: shown when a student picks it. */
const HOMO_WHY = {
  vat: 'Each term is a velocity: $v$, $v_0$, and $at$ (m/s² times s).',
  s: 'Each term is a length: $s$, $s_0$, $v_0t$ and $\\tfrac12 at^2$.',
  bad: '$v$ and $v_0$ are m/s, but $a$ alone is m/s². The time factor is missing.',
  mix: '$s$ is a length, but $v_0$ alone is a speed. It needs a factor of $t$.',
};

const units = [
  problem({
    id: 'u1.1.convert',
    title: 'Force and moment in SI',
    exam: 'u1',
    ch: '1',
    lab: null,
    src: 'Hibbeler Statics §1.3–1.4',
    topics: ['units'],
    vars: {
      F: range(10, 80, 5, 'lbf', N_PER_LBF),
      L: range(1, 10, 0.5, 'ft', M_PER_FT),
    },
    text: (T) => String.raw`A force of $${T.F}\ \mathrm{lbf}$ has a moment arm of $${T.L}\ \mathrm{ft}$. Convert the force to newtons, and the moment to newton-metres.`,
    parts: [
      num('F', ($) => $.F, 'N', { label: 'force' }),
      num('M', ($) => $.F * $.L, 'N·m', { label: 'moment' }),
    ],
    level: 1,
    hints: [
      String.raw`One pound-force is defined as $1\ \mathrm{lbm}\times 9.80665\ \mathrm{m/s^2}$.`,
      'One foot is 0.3048 m. Multiply the converted force by the converted arm.',
    ],
    steps: ($, sig) => [
      String.raw`$1\ \mathrm{lbf} = ${sig(N_PER_LBF)}\ \mathrm{N}$, and $1\ \mathrm{ft} = 0.3048\ \mathrm{m}$.`,
      String.raw`$F = ${sig($.F)}\ \mathrm{N}$.`,
      String.raw`$M = ${sig($.F)}\times ${sig($.L)} = ${sig($.F * $.L)}\ \mathrm{N\cdot m}$.`,
    ],
    second: ($) => {
      const Flbf = $.F / N_PER_LBF;
      const Lft = $.L / M_PER_FT;
      return {
        F: convert(Flbf, 'lbf', 'N'),
        M: convert(Flbf * Lft, 'ft·lbf', 'J'),
      };
    },
    cases: [kase('Hibbeler Statics §1.4', { F: 50, L: 4 }, { F: 222.411080763025, M: 271.1635896662801 })],
  }),

  problem({
    id: 'u1.1.figures',
    title: 'Three significant figures',
    exam: 'u1',
    ch: '1',
    lab: null,
    src: 'Hibbeler Statics §1.5',
    topics: ['sig-figs'],
    vars: {
      a: range(2, 9, 1),
      b: range(2, 9, 1),
      op: choice(['product', 'a product'], ['quotient', 'a quotient']),
    },
    derive: ($) => ({ raw: $.op === 'product' ? ($.a * $.b * Math.PI) / 7 : (100 * $.a) / ($.b * Math.PI) }),
    valid: ($) => roundChoices($.raw).length >= 3,
    text: (T, $) => String.raw`${T.op === 'a product' ? 'A product' : 'A quotient'} comes out to $${$.raw.toPrecision(8)}$ before rounding. Which value follows the three-significant-figure rule, with four figures when the first digit is 1?`,
    parts: [
      {
        id: 'round',
        kind: 'choice',
        label: 'rounded value',
        options: ($) => roundChoices($.raw),
        correct: ($) => hibbeler($.raw),
      },
    ],
    level: 1,
    hints: ['Count figures from the first non-zero digit. A leading 1 keeps one extra figure.',
      "Round the finished product. Rounding a factor and then multiplying changes the third figure.",
    ],
    steps: ($, sig) => [
      String.raw`The unrounded value is $${sig($.raw, 6)}$.`,
      `The reported value is ${hibbeler($.raw)}.`,
    ],
    second: ($) => ({ round: hibbelerExp($.raw) }),
    cases: [kase('Hibbeler Statics §1.5', { a: 3, b: 5, op: 'product' }, { round: 6.73 })],
  }),

  problem({
    id: 'u1.1.homogeneous',
    title: 'Dimensional homogeneity',
    exam: 'u1',
    ch: '1',
    lab: null,
    src: 'Hibbeler Statics §1.4',
    topics: ['homogeneity'],
    vars: {
      eq: choice(
        ['vat', String.raw`$v = v_0 + at$`],
        ['s', String.raw`$s = s_0 + v_0 t + \frac{1}{2}at^2$`],
        ['bad', String.raw`$v = v_0 + a$`],
        ['mix', String.raw`$s = v_0 + \frac{1}{2}at^2$`],
      ),
    },
    text: (T) => `Is this equation dimensionally homogeneous? ${T.eq}`,
    parts: [
      {
        ...mc('homo', [[1, 'True'], [0, 'False']], ($) => (EQ_OK[$.eq] ? 1 : 0), { label: 'homogeneous?' }),
        // The same reason serves both options: it is shown only for the wrong one.
        options: [
          { value: 1, label: 'True', why: ($) => HOMO_WHY[$.eq] },
          { value: 0, label: 'False', why: ($) => HOMO_WHY[$.eq] },
        ],
      },
    ],
    level: 2,
    hints: ['Every term that is added must measure the same kind of quantity.',
      "Give each term a power of length and a power of time. The product of acceleration and time is a velocity. A bare acceleration is not.",
    ],
    steps: ($, sig) => {
      void sig;
      const ok = homogeneous($.eq);
      return [ok ? 'Each term has the same dimensions, so the equation is homogeneous.' : 'The terms do not all have the same dimensions, so the equation is not homogeneous.'];
    },
    second: ($) => ({ homo: homogeneous($.eq) ? 1 : 0 }),
    cases: [kase('Hibbeler Statics §1.4', { eq: 'bad' }, { homo: 0 })],
  }),
];

export default units;

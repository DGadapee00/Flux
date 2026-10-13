/** Chapter 2 · Probability. */
import { problem, kase, range, choice, num, prob, mc, tn, fx } from '../kit.js';
import { choose, perm, factorial } from '../../stats/dist.js';

const C2 = { ch: '2' };

/** A two-way table of counts as HTML, for the problem's figure slot. */
function twoWay(rows, cols, counts) {
  const tot = (r) => counts[r].reduce((a, b) => a + b, 0);
  const colTot = (c) => counts.reduce((a, row) => a + row[c], 0);
  const all = counts.flat().reduce((a, b) => a + b, 0);
  return `<table class="results" style="max-width:420px"><thead><tr><th></th>${cols.map((c) => `<th>${c}</th>`).join('')}<th>Total</th></tr></thead><tbody>${rows
    .map((r, i) => `<tr><th>${r}</th>${counts[i].map((x) => `<td>${x}</td>`).join('')}<td>${tot(i)}</td></tr>`)
    .join('')}<tr><th>Total</th>${cols.map((_, c) => `<td>${colTot(c)}</td>`).join('')}<td>${all}</td></tr></tbody></table>`;
}

export default [
  // ----------------------------------------------------------------- counting
  problem({
    ...C2, id: 'c2.multiplication-rule', title: 'The multiplication rule', kind: 'numeric', topics: ['counting'], src: 'Notes Ex 2.7',
    vars: {
      ctx: choice(['home', 'home'], ['meal', 'meal'], ['plate', 'plate']),
      a: range(2, 6, 1),
      b: range(2, 5, 1),
      c: range(2, 4, 1),
    },
    derive: ($) => ({ ways: $.ctx === 'home' ? $.a * $.b : $.a * $.b * $.c }),
    text: (T, $) =>
      ({
        home: `A developer offers home buyers a choice of ${$.a} exterior styles and ${$.b} floor plans. In how many different ways can a buyer order a home?`,
        meal: `A lunch special is one of ${$.a} sandwiches, one of ${$.b} sides and one of ${$.c} drinks. How many different lunches are possible?`,
        plate: `A code is made of one of ${$.a} letters, then one of ${$.b} colors, then one of ${$.c} digits. How many different codes are possible?`,
      })[$.ctx],
    parts: [num('ways', ($) => $.ways, { tol: 0, abs: 0, label: 'Number of ways', traps: [[($) => ($.ctx === 'home' ? $.a + $.b : $.a + $.b + $.c), 'That adds the choices. When one choice is made AND then another, multiply.']] })],
    hints: [String.raw`Multiplication rule: if one operation can be done in $n_1$ ways and, for each of those, a second in $n_2$ ways, together they can be done in $n_1 n_2$ ways.`],
    steps: ($) => [$.ctx === 'home' ? String.raw`$${$.a} \times ${$.b} = ${$.ways}$` : String.raw`$${$.a} \times ${$.b} \times ${$.c} = ${$.ways}$`, 'A tree diagram shows the same count: one branch for each first choice, and from each of those one branch for each second choice.'],
    cases: [kase('Notes Ex 2.7', { ctx: 'home', a: 4, b: 3, c: 2 }, { ways: 12 })],
  }),

  problem({
    ...C2, id: 'c2.permutations', title: 'Permutations: order matters', kind: 'numeric', topics: ['counting', 'permutations'], src: 'Walpole §2.3',
    vars: { ctx: choice(['race', 'race'], ['officers', 'officers'], ['awards', 'awards'], ['books', 'books']), n: range(4, 15, 1), r: range(2, 5, 1) },
    derive: ($) => ({ r2: $.ctx === 'books' ? $.n : $.r, ans: $.ctx === 'books' ? factorial($.n) : perm($.n, $.r) }),
    valid: ($) => ($.ctx === 'books' ? $.n <= 9 : $.r < $.n),
    text: (T, $) =>
      ({
        race: `${$.n} runners are in a race. In how many ways can the first ${$.r} places (1st, 2nd, …) be filled, with no ties?`,
        officers: `A club of ${$.n} members elects ${$.r} different officers (president, vice president, …). No one holds two offices. How many different slates are possible?`,
        awards: `${$.r} different awards (research, teaching, service, …) go to students in a class of ${$.n}. No student can receive more than one. How many possible selections are there?`,
        books: `In how many ways can ${$.n} different books be arranged on a shelf?`,
      })[$.ctx],
    parts: [num('ways', ($) => $.ans, { tol: 0, abs: 0, label: 'Number of arrangements', traps: [[($) => choose($.n, $.r), 'That is a combination. Here the order matters (1st and 2nd are different), so use a permutation.']] })],
    hints: [String.raw`Order matters, so this is a permutation: $ {}_{n}P_{r} = \dfrac{n!}{(n-r)!}$.`, 'All n objects in a row: n! ways.'],
    steps: ($) =>
      $.ctx === 'books'
        ? [String.raw`$${$.n}! = ${$.ans}$`, `On the TI-84: MATH → PROB → 4:!`]
        : [String.raw`$$ {}_{${$.n}}P_{${$.r}} = \dfrac{${$.n}!}{(${$.n} - ${$.r})!} = ${Array.from({ length: $.r }, (_, i) => $.n - i).join(String.raw` \times `)} = ${$.ans}$$`, `On the TI-84: ${$.n}, MATH → PROB → 2:nPr, ${$.r}`],
    cases: [kase('Walpole §2.3', { ctx: 'race', n: 8, r: 3 }, { ways: 336 }), kase('Notes Ex 2.8', { ctx: 'awards', n: 25, r: 3 }, { ways: 13800 })],
  }),

  problem({
    ...C2, id: 'c2.combinations', title: 'Combinations: choosing a group', kind: 'numeric', level: 2, topics: ['counting', 'combinations', 'probability'], src: 'Walpole §2.3 (notes: 10C3 · 5C2)',
    vars: { n1: range(5, 12, 1), r1: range(1, 4, 1), n2: range(3, 10, 1), r2: range(1, 4, 1) },
    derive: ($) => {
      const ways = choose($.n1, $.r1) * choose($.n2, $.r2);
      const total = choose($.n1 + $.n2, $.r1 + $.r2);
      return { ways, total, p: ways / total };
    },
    valid: ($) => $.r1 < $.n1 && $.r2 < $.n2,
    text: (T, $) => `A collection has ${$.n1} arcade games and ${$.n2} sports games. ${$.r1 + $.r2} games are picked at random. In how many ways can the pick be ${$.r1} arcade and ${$.r2} sports games, and what is the probability of that?`,
    parts: [
      num('ways', ($) => $.ways, { tol: 0, abs: 0, label: `Number of ways to get the stated mix`, traps: [[($) => choose($.n1, $.r1) + choose($.n2, $.r2), 'That adds the two counts. Choosing the arcade games AND the sports games multiplies.'], [($) => perm($.n1, $.r1) * perm($.n2, $.r2), 'That counts orders. A pick of games is a group, so use combinations.']] }),
      prob('p', ($) => $.p, { label: 'Probability' }),
    ],
    hints: [String.raw`Order does not matter in a group: $\dbinom{n}{r} = \dfrac{n!}{r!\,(n-r)!}$.`, 'Choose the arcade games, then the sports games, and multiply.', 'Probability = (ways to get the mix) ÷ (ways to pick any group of that size).'],
    steps: ($) => [
      String.raw`$$\binom{${$.n1}}{${$.r1}}\binom{${$.n2}}{${$.r2}} = ${choose($.n1, $.r1)} \times ${choose($.n2, $.r2)} = ${$.ways}$$`,
      String.raw`Any ${$.r1 + $.r2} of the ${$.n1 + $.n2} games: $\dbinom{${$.n1 + $.n2}}{${$.r1 + $.r2}} = ${$.total}$`,
      String.raw`$$P = \dfrac{${$.ways}}{${$.total}} = ${fx($.p, 4)}$$`,
      'On the TI-84: n, MATH → PROB → 3:nCr, r.',
    ],
    cases: [kase('Walpole §2.3; the notes’ 10C3 × 5C2', { n1: 10, r1: 3, n2: 5, r2: 2 }, { ways: 1200, p: 0.3996 })],
  }),

  // ----------------------------------------------------------------- probability rules
  problem({
    ...C2, id: 'c2.at-least-one', title: 'At least one', kind: 'numeric', topics: ['complement', 'independence'], src: 'Notes Ex 2.6',
    vars: { what: choice(['coin', 'coin'], ['die', 'die']), n: range(2, 8, 1) },
    derive: ($) => {
      const q = $.what === 'coin' ? 0.5 : 5 / 6;
      return { q, p: 1 - q ** $.n };
    },
    text: (T, $) => ($.what === 'coin' ? `A fair coin is tossed ${$.n} times. What is the probability that at least one head occurs?` : `A fair die is rolled ${$.n} times. What is the probability of at least one six?`),
    parts: [prob('p', ($) => $.p, { traps: [[($) => ($.what === 'coin' ? 0.5 : 1 / 6) * $.n, String.raw`Adding the chances overcounts: the events overlap. Use the complement, $1 - P(\text{none})$.`]] })],
    hints: ['“At least one” is the complement of “none”.', String.raw`$P(\text{none}) = q^n$ when the tries are independent.`],
    steps: ($) => [
      $.what === 'coin' ? String.raw`$P(\text{no heads}) = (1/2)^{${$.n}} = ${fx($.q ** $.n, 4)}$` : String.raw`$P(\text{no sixes}) = (5/6)^{${$.n}} = ${fx($.q ** $.n, 4)}$`,
      String.raw`$$P(\text{at least one}) = 1 - ${fx($.q ** $.n, 4)} = ${fx($.p, 4)}$$`,
      $.what === 'coin' && $.n === 2 ? 'Listing the sample space agrees: S = {HH, HT, TH, TT}, and 3 of the 4 equally likely outcomes have a head.' : 'For small n you can check by listing the sample space.',
    ],
    twin: { part: 'p', draw: (r, $) => { for (let i = 0; i < $.n; i++) if (r.next() < 1 - $.q) return true; return false; } },
    cases: [kase('Notes Ex 2.6', { what: 'coin', n: 2 }, { p: 0.75 })],
  }),

  problem({
    ...C2, id: 'c2.additive-rule', title: 'The additive rule', kind: 'numeric', topics: ['additive-rule', 'complement'], src: 'Notes Ex 2.11',
    vars: { pa: range(0.2, 0.9, 0.05), pb: range(0.2, 0.9, 0.05), pab: range(0.05, 0.6, 0.05) },
    derive: ($) => ({ union: $.pa + $.pb - $.pab, neither: 1 - ($.pa + $.pb - $.pab), one: $.pa + $.pb - 2 * $.pab }),
    valid: ($) => $.pab <= Math.min($.pa, $.pb) - 0.05 && $.pa + $.pb - $.pab <= 0.98,
    text: (T, $) => `After interviews at two companies, John judges his probability of an offer from company A to be ${fx($.pa, 2)}, from company B ${fx($.pb, 2)}, and from both ${fx($.pab, 2)}. Find the probability that he gets at least one offer, neither offer, and exactly one offer.`,
    parts: [
      prob('union', ($) => $.union, { label: String.raw`At least one: $P(A \cup B)$`, traps: [[($) => $.pa + $.pb, String.raw`$P(A) + P(B)$ counts "both" twice. Subtract $P(A \cap B)$ once.`]] }),
      prob('neither', ($) => $.neither, { label: String.raw`Neither: $P(A' \cap B')$` }),
      prob('one', ($) => $.one, { label: 'Exactly one', traps: [[($) => $.union, 'That includes getting both offers.']] }),
    ],
    hints: [String.raw`$P(A \cup B) = P(A) + P(B) - P(A \cap B)$`, 'Neither is the complement of at least one.', String.raw`Exactly one = at least one minus both: $P(A \cup B) - P(A \cap B)$.`],
    steps: ($) => [
      String.raw`$$P(A \cup B) = ${fx($.pa, 2)} + ${fx($.pb, 2)} - ${fx($.pab, 2)} = ${fx($.union, 2)}$$`,
      String.raw`$P(\text{neither}) = 1 - ${fx($.union, 2)} = ${fx($.neither, 2)}$`,
      String.raw`$P(\text{exactly one}) = ${fx($.union, 2)} - ${fx($.pab, 2)} = ${fx($.one, 2)}$`,
    ],
    cases: [kase('Notes Ex 2.11', { pa: 0.8, pb: 0.6, pab: 0.5 }, { union: 0.9, neither: 0.1, one: 0.4 })],
  }),

  problem({
    ...C2, id: 'c2.conditional-independence', title: 'Conditional probability and independence', kind: 'numeric', level: 2, topics: ['conditional', 'independence'], src: 'Notes Ex 2.15',
    vars: { pr: range(0.1, 0.8, 0.01), ps: range(0.1, 0.8, 0.01), mode: choice(['dep', 'dependent'], ['indep', 'independent']), pboth: range(0.02, 0.5, 0.01) },
    derive: ($) => {
      const both = $.mode === 'indep' ? Math.round($.pr * $.ps * 10000) / 10000 : $.pboth;
      return { both, given: both / $.ps, indep: Math.abs(both / $.ps - $.pr) < 0.005 ? 1 : 0 };
    },
    valid: ($) => $.both <= Math.min($.pr, $.ps) && $.pr + $.ps - $.both <= 1 && ($.mode === 'indep' || Math.abs($.both / $.ps - $.pr) >= 0.03) && $.both > 0,
    text: (T, $) => `A survey of college students found that ${tn($.pr * 100)}% are in a relationship, ${tn($.ps * 100)}% are involved in sports, and ${tn($.both * 100, 4)}% are both. What is the probability that a student is in a relationship given that they are involved in sports? Is being in a relationship independent of being involved in sports?`,
    parts: [
      prob('given', ($) => $.given, { label: String.raw`$P(R \mid S)$`, traps: [[($) => $.both / $.pr, String.raw`That is $P(S \mid R)$: it divides by $P(R)$. Given $S$, divide by $P(S)$.`], [($) => $.both, String.raw`That is $P(R \cap S)$. A conditional probability divides it by the probability of the condition.`]] }),
      mc('indep', [[1, 'Independent'], [0, 'Not independent']], ($) => $.indep, { label: 'Are R and S independent?' }),
    ],
    hints: [String.raw`$P(R \mid S) = \dfrac{P(R \cap S)}{P(S)}$`, String.raw`R and S are independent exactly when $P(R \mid S) = P(R)$.`],
    steps: ($) => [
      String.raw`$$P(R \mid S) = \dfrac{P(R \cap S)}{P(S)} = \dfrac{${tn($.both, 4)}}{${tn($.ps)}} = ${fx($.given, 4)}$$`,
      $.indep ? String.raw`$P(R \mid S) = ${fx($.given, 2)} = P(R)$: knowing S does not change the chance of R, so they are independent.` : String.raw`$P(R \mid S) = ${fx($.given, 2)} \ne P(R) = ${tn($.pr)}$: knowing S changes the chance of R, so they are not independent.`,
    ],
    cases: [kase('Notes Ex 2.15', { pr: 0.33, ps: 0.25, mode: 'dep', pboth: 0.11 }, { given: 0.44, indep: 0 })],
  }),

  problem({
    ...C2, id: 'c2.product-rule-independent', title: 'The product rule for independent events', kind: 'numeric', level: 2, topics: ['product-rule', 'independence', 'complement'], src: 'Notes Ex 2.16',
    vars: { p1: range(0.1, 0.9, 0.05), p2: range(0.1, 0.9, 0.05), p3: range(0.1, 0.9, 0.05) },
    derive: ($) => {
      const q = [1 - $.p1, 1 - $.p2, 1 - $.p3];
      const none = q[0] * q[1] * q[2];
      const one = $.p1 * q[1] * q[2] + q[0] * $.p2 * q[2] + q[0] * q[1] * $.p3;
      return { q, none, any: 1 - none, one };
    },
    text: (T, $) => `Three couples are invited to a party. Each comes independently, with probabilities ${tn($.p1)}, ${tn($.p2)} and ${tn($.p3)}. Find the probability that no couple comes, that at least one comes, and that exactly one comes.`,
    parts: [
      prob('none', ($) => $.none, { label: 'No couple comes' }),
      prob('any', ($) => $.any, { label: 'At least one comes', traps: [[($) => $.p1 + $.p2 + $.p3, 'Adding overcounts, since these events overlap. Use 1 − P(none).']] }),
      prob('one', ($) => $.one, { label: 'Exactly one comes', traps: [[($) => $.p1 * $.p2 * $.p3, 'That is all three coming.']] }),
    ],
    hints: [String.raw`For independent events, $P(A \cap B) = P(A)P(B)$.`, 'At least one is the complement of none.', 'Exactly one: three mutually exclusive cases (only 1, only 2, only 3). Add them.'],
    steps: ($) => [
      String.raw`$$P(\text{none}) = (1 - ${tn($.p1)})(1 - ${tn($.p2)})(1 - ${tn($.p3)}) = ${fx($.none, 4)}$$`,
      String.raw`$P(\text{at least one}) = 1 - ${fx($.none, 4)} = ${fx($.any, 4)}$`,
      String.raw`$$P(\text{exactly one}) = (${tn($.p1)})(${tn($.q[1])})(${tn($.q[2])}) + (${tn($.q[0])})(${tn($.p2)})(${tn($.q[2])}) + (${tn($.q[0])})(${tn($.q[1])})(${tn($.p3)}) = ${fx($.one, 4)}$$`,
    ],
    twin: { part: 'one', draw: (r, $) => (r.next() < $.p1) + (r.next() < $.p2) + (r.next() < $.p3) === 1 },
    cases: [kase('Notes Ex 2.16', { p1: 0.5, p2: 2 / 3, p3: 0.75 }, { none: 0.0417, any: 0.9583, one: 0.25 })],
  }),

  problem({
    ...C2, id: 'c2.two-way-table', title: 'Probabilities from a two-way table', kind: 'numeric', level: 2, topics: ['conditional', 'additive-rule'], src: 'Walpole §2.6',
    vars: { a: range(100, 500, 10), b: range(20, 300, 10), c: range(50, 400, 10), d: range(20, 300, 10) },
    derive: ($) => {
      const N = $.a + $.b + $.c + $.d;
      const E = $.a + $.c;
      return { N, E, pM: ($.a + $.b) / N, pME: $.a / N, pMgE: $.a / E, pMorE: ($.a + $.b + $.c) / N };
    },
    text: () => 'Adults in a small town with a college degree, classified by sex and employment. One of them is chosen at random. Let M = the person is male and E = the person is employed.',
    figure: ($) => twoWay(['Male', 'Female'], ['Employed', 'Unemployed'], [[$.a, $.b], [$.c, $.d]]),
    parts: [
      prob('pM', ($) => $.pM, { label: '$P(M)$' }),
      prob('pME', ($) => $.pME, { label: String.raw`$P(M \cap E)$` }),
      prob('pMgE', ($) => $.pMgE, { label: String.raw`$P(M \mid E)$`, traps: [[($) => $.a / ($.a + $.b), String.raw`That is $P(E \mid M)$: it divides by the males. Given E, the employed are the whole group.`]] }),
      prob('pMorE', ($) => $.pMorE, { label: String.raw`$P(M \cup E)$` }),
    ],
    hints: ['A probability is a count divided by the size of the group you are choosing from.', 'Given E, you are choosing only among the employed: divide by the Employed total.', String.raw`$P(M \cup E)$: everyone who is male or employed or both (everyone except unemployed females).`],
    steps: ($) => [
      String.raw`$P(M) = \dfrac{${$.a + $.b}}{${$.N}} = ${fx($.pM, 4)}$`,
      String.raw`$P(M \cap E) = \dfrac{${$.a}}{${$.N}} = ${fx($.pME, 4)}$`,
      String.raw`$$P(M \mid E) = \dfrac{P(M \cap E)}{P(E)} = \dfrac{${$.a}}{${$.E}} = ${fx($.pMgE, 4)}$$`,
      String.raw`$P(M \cup E) = \dfrac{${$.a} + ${$.b} + ${$.c}}{${$.N}} = ${fx($.pMorE, 4)}$`,
    ],
    cases: [kase('Walpole §2.6', { a: 460, b: 40, c: 140, d: 260 }, { pM: 0.5556, pME: 0.5111, pMgE: 0.7667, pMorE: 0.7111 })],
  }),

  problem({
    ...C2, id: 'c2.without-replacement', title: 'Drawing without replacement', kind: 'numeric', topics: ['product-rule', 'conditional'], src: 'Notes §2.7–2.8',
    vars: { r: range(2, 10, 1), b: range(2, 10, 1) },
    derive: ($) => {
      const N = $.r + $.b;
      return { N, both: ($.r / N) * (($.r - 1) / (N - 1)), mixed: (2 * $.r * $.b) / (N * (N - 1)) };
    },
    text: (T, $) => `A box holds ${$.r} red and ${$.b} blue chips. Two are drawn at random without replacement. Find the probability that both are red, and that one of each color is drawn.`,
    parts: [
      prob('both', ($) => $.both, { label: 'Both red', traps: [[($) => ($.r / $.N) ** 2, 'That treats the draws as independent (with replacement). After one red is gone, the second draw is from one fewer chip, one fewer of them red.']] }),
      prob('mixed', ($) => $.mixed, { label: 'One of each color', traps: [[($) => $.mixed / 2, 'That counts only red-then-blue. Blue-then-red is a second way.']] }),
    ],
    hints: [String.raw`General product rule: $P(A \cap B) = P(A)\,P(B \mid A)$.`, 'After the first draw, the box has one fewer chip.', 'One of each: red then blue, or blue then red.'],
    steps: ($) => [
      String.raw`$$P(\text{both red}) = \dfrac{${$.r}}{${$.N}} \cdot \dfrac{${$.r - 1}}{${$.N - 1}} = ${fx($.both, 4)}$$`,
      String.raw`$$P(\text{one of each}) = \dfrac{${$.r}}{${$.N}} \cdot \dfrac{${$.b}}{${$.N - 1}} + \dfrac{${$.b}}{${$.N}} \cdot \dfrac{${$.r}}{${$.N - 1}} = ${fx($.mixed, 4)}$$`,
      String.raw`Check with counting: $\dbinom{${$.r}}{2} / \dbinom{${$.N}}{2} = ${choose($.r, 2)}/${choose($.N, 2)} = ${fx($.both, 4)}$.`,
    ],
    twin: {
      part: 'mixed',
      draw: (rg, $) => {
        const first = rg.next() < $.r / $.N;
        const redLeft = $.r - (first ? 1 : 0);
        const second = rg.next() < redLeft / ($.N - 1);
        return first !== second;
      },
    },
    cases: [],
  }),
];
